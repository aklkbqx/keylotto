import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';
import { UserSettingsType } from '../types/drizzle';
import { useAuth } from './AuthProvider';
import { apiGetData, apiPostData, apiPutData, handleApiError, handleErrorMessage } from '../utils/API_URILS';
// import { showAlert } from './AlertProvider';

interface NotificationContextType {
    expoPushToken: string | null;
    notification: Notifications.Notification | null;
    requestPermissions: () => Promise<boolean>;
    hasPermission: boolean | null;
    permissionStatus: Notifications.PermissionStatus | null;
    isRegistering: boolean;
    registerForPushNotifications: () => Promise<void>;
    setNotificationHandler: (handler: Notifications.NotificationHandler) => void;
    showPermissionRequestDialog: () => void;
    openNotificationSettings: () => Promise<void>;
    permissionAsked: boolean;
    isSimulator: boolean;
    settings: UserSettingsType["notification"];
    updateSettings: (newSettings: Partial<UserSettingsType>) => Promise<void>;
    loadSettings: () => Promise<void>;
    isLoadingSettings: boolean;
    unreadCount: number;
    updateBadgeCount: () => Promise<void>;
    clearBadge: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
        return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
            priority: Notifications.AndroidNotificationPriority.DEFAULT
        };
    },
});

export const STORAGE_PERMISSION_ASKED_KEY = '@notification_permission_asked';
export const STORAGE_PERMISSION_DENIED_COUNT_KEY = '@notification_permission_denied_count';
export const STORAGE_NOTIFICATION_SETTINGS_KEY = '@notification_settings';
const MAX_DENY_COUNT_BEFORE_SETTINGS = 2;

const DEFAULT_NOTIFICATION_SETTINGS: UserSettingsType["notification"] = {
    notificationsEnabled: false,
    soundEnabled: true,
    vibrationEnabled: true,
};

interface NotificationProviderProps {
    children: ReactNode;
}

// ฟังก์ชันตรวจสอบว่าเป็น simulator หรือไม่
const checkIsSimulator = (): boolean => {
    if (!Device.isDevice) {
        return true;
    }

    if (Platform.OS === 'ios' && Device.modelName?.toLowerCase().includes('simulator')) {
        return true;
    }

    if (Platform.OS === 'android' && (
        Device.brand?.toLowerCase() === 'google' ||
        Device.manufacturer?.toLowerCase() === 'google'
    )) {
        return true;
    }

    return false;
};

const getProjectId = (): string | null => {
    const projectId =
        process.env.EXPO_PUBLIC_PROJECT_ID ||
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId ||
        Constants?.expoConfig?.extra?.projectId ||
        Constants?.manifest2?.extra?.expoClient?.extra?.projectId;

    return projectId || null;
};

function NotificationProvider({ children }: NotificationProviderProps) {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
    const [isRegistering, setIsRegistering] = useState<boolean>(false);
    const [permissionAsked, setPermissionAsked] = useState<boolean>(false);
    const [deniedCount, setDeniedCount] = useState<number>(0);
    const [settings, setSettings] = useState<UserSettingsType["notification"]>(DEFAULT_NOTIFICATION_SETTINGS);
    const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(false);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const { isAuthenticated, user } = useAuth();

    const isSimulator = checkIsSimulator();

    useEffect(() => {
        const checkPermissionState = async () => {
            try {
                const asked = await AsyncStorage.getItem(STORAGE_PERMISSION_ASKED_KEY);
                setPermissionAsked(asked === 'true');

                const deniedCountStr = await AsyncStorage.getItem(STORAGE_PERMISSION_DENIED_COUNT_KEY);
                setDeniedCount(deniedCountStr ? parseInt(deniedCountStr) : 0);
            } catch (error) {
                console.error('Error checking permission state:', error);
            }
        };

        checkPermissionState();
    }, []);

    useEffect(() => {
        const checkPermissions = async () => {
            try {
                if (isSimulator) {
                    setPermissionStatus('granted' as Notifications.PermissionStatus);
                    setHasPermission(true);
                    console.warn('📱 Simulator: Mock notification permissions granted');
                    return;
                }

                const permResult = await Notifications.getPermissionsAsync();
                setPermissionStatus(permResult.status);
                setHasPermission(permResult.status === 'granted');
            } catch (error) {
                console.error('Error checking permissions:', error);
                if (isSimulator) {
                    setPermissionStatus('granted' as Notifications.PermissionStatus);
                    setHasPermission(true);
                }
            }
        };

        checkPermissions();
    }, [isSimulator]);

    const updateBadgeCount = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            const response = await apiGetData('/api/notifications/unread-count');

            if (response?.success) {
                const count = response.count || 0;
                setUnreadCount(count);

                if (!isSimulator) {
                    try {
                        await Notifications.setBadgeCountAsync(count);
                    } catch (error) {
                        console.warn('Failed to set badge count:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error updating badge count:', error);
        }
    }, [isAuthenticated, isSimulator]);

    const loadSettings = useCallback(async () => {
        setIsLoadingSettings(true);
        try {
            const storedSettings = await AsyncStorage.getItem(STORAGE_NOTIFICATION_SETTINGS_KEY);
            if (storedSettings) {
                const parsed = JSON.parse(storedSettings);
                setSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed });
            }

            if (isAuthenticated && user) {
                try {
                    const response = await apiGetData('/api/notifications/settings');
                    if (response?.success) {
                        const serverSettings = response.settings;
                        setSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, ...serverSettings });
                        await AsyncStorage.setItem(STORAGE_NOTIFICATION_SETTINGS_KEY, JSON.stringify(serverSettings));
                    }
                } catch (error) {
                    handleApiError(error, handleErrorMessage);
                }
            }
        } catch (error) {
            console.error('Error loading notification settings:', error);
        } finally {
            setIsLoadingSettings(false);
        }
    }, [isAuthenticated, user]);

    // Remove this useEffect as it causes circular dependency
    // updateBadgeCount and loadSettings are already called in other useEffects

    const clearBadge = useCallback(async () => {
        try {
            setUnreadCount(0);

            if (!isSimulator) {
                try {
                    await Notifications.setBadgeCountAsync(0);
                } catch (error) {
                    console.warn('Failed to clear badge count:', error);
                }
            }

            if (isAuthenticated) {
                try {
                    await apiPutData('/api/notifications/read-all');
                } catch (error) {
                    console.error('Error marking notifications as read:', error);
                }
            }
        } catch (error) {
            console.error('Error clearing badge:', error);
        }
    }, [isAuthenticated, isSimulator]);

    const openNotificationSettings = async () => {
        try {
            if (Platform.OS === 'ios') {
                await Linking.openURL('app-settings:');
            } else {
                await Linking.openSettings();
            }
        } catch (error) {
            console.error('Error opening notification settings:', error);
        }
    };

    const incrementDeniedCount = async () => {
        try {
            const newCount = deniedCount + 1;
            setDeniedCount(newCount);
            await AsyncStorage.setItem(STORAGE_PERMISSION_DENIED_COUNT_KEY, newCount.toString());
        } catch (error) {
            console.error('Error incrementing denied count:', error);
        }
    };

    const requestPermissions = async (): Promise<boolean> => {
        try {
            await AsyncStorage.setItem(STORAGE_PERMISSION_ASKED_KEY, 'true');
            setPermissionAsked(true);

            if (isSimulator) {
                setHasPermission(true);
                setPermissionStatus('granted' as Notifications.PermissionStatus);
                console.warn('📱 Simulator: Mock notification permissions granted');

                if (isAuthenticated) {
                    await updateBadgeCount();
                }
                return true;
            }

            const currentPermission = await Notifications.getPermissionsAsync();
            setPermissionStatus(currentPermission.status);

            if (currentPermission.status === 'denied' || currentPermission.status === 'undetermined') {
                const { status } = await Notifications.requestPermissionsAsync();
                const isGranted = status === 'granted';
                setPermissionStatus(status);
                setHasPermission(isGranted);

                if (!isGranted) {
                    await incrementDeniedCount();

                    if (deniedCount >= MAX_DENY_COUNT_BEFORE_SETTINGS) {
                        setTimeout(() => {
                            // TODO: Show alert using a different method to avoid circular dependency
                            console.log("User should open notification settings");
                            /*
                            showAlert({
                                title: "เปิดการแจ้งเตือนในการตั้งค่า",
                                message: "คุณสามารถเปิดการแจ้งเตือนได้ในการตั้งค่าของอุปกรณ์",
                                buttons: [
                                    { text: 'ไม่ต้องการ', style: 'cancel' },
                                    { text: 'ไปที่การตั้งค่า', onPress: openNotificationSettings }
                                ]
                            })
                            */
                        }, 500);
                    }
                } else if (isGranted && isAuthenticated) {
                    await registerForPushNotifications();
                    await updateBadgeCount();
                }

                return isGranted;
            } else if (currentPermission.status === 'granted') {
                setHasPermission(true);
                if (isAuthenticated) {
                    await registerForPushNotifications();
                    await updateBadgeCount();
                }
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error requesting notification permission:', error);

            if (isSimulator) {
                setHasPermission(true);
                setPermissionStatus('granted' as Notifications.PermissionStatus);
                return true;
            }

            return false;
        }
    };

    const registerForPushNotifications = useCallback(async () => {
        if (isSimulator) {
            console.warn('📱 Simulator: Skipping push token registration');
            setExpoPushToken('simulator-mock-token');
            return;
        }

        if (!isAuthenticated || !user || isRegistering) return;

        setIsRegistering(true);

        try {
            const { status } = await Notifications.getPermissionsAsync();
            if (status !== 'granted') {
                console.warn('Push notification permission not granted');
                setIsRegistering(false);
                return;
            }

            const projectId = getProjectId();

            if (!projectId) {
                console.warn('Project ID not found. Please set EXPO_PUBLIC_PROJECT_ID in your environment variables or app config.');
                setIsRegistering(false);
                return;
            }

            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId,
            });

            setExpoPushToken(tokenData.data);

            const deviceInfo = {
                brand: Device.brand || 'unknown',
                manufacturer: Device.manufacturer || 'unknown',
                modelName: Device.modelName || 'unknown',
                osName: Device.osName || Platform.OS,
                osVersion: Device.osVersion || 'unknown',
                isDevice: Device.isDevice,
                platform: Platform.OS
            };

            await apiPostData('/api/notifications/register-device', {
                expoPushToken: tokenData.data,
                deviceInfo: JSON.stringify(deviceInfo),
            });

            if (Platform.OS === 'android') {
                // Default notification channel
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'Default Notifications',
                    importance: Notifications.AndroidImportance.HIGH,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                    enableVibrate: true,
                    enableLights: true,
                });

                // Immediate notification channel สำหรับ goal completion
                await Notifications.setNotificationChannelAsync('immediate', {
                    name: 'Immediate Notifications',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250, 250, 250],
                    lightColor: '#10B981',
                    enableVibrate: true,
                    enableLights: true,
                    showBadge: true,
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                });
            }
        } catch (error) {
            console.error('Error registering for push notifications:', error);
        } finally {
            setIsRegistering(false);
        }
    }, [isAuthenticated, isRegistering, user, isSimulator]);

    const updateNotificationHandler = useCallback((currentSettings: UserSettingsType["notification"]) => {
        Notifications.setNotificationHandler({
            handleNotification: async (notification) => {
                if (currentSettings.notificationsEnabled) {
                    updateBadgeCount();
                }

                return {
                    shouldShowAlert: currentSettings.notificationsEnabled,
                    shouldPlaySound: currentSettings.notificationsEnabled && currentSettings.soundEnabled,
                    shouldSetBadge: currentSettings.notificationsEnabled,
                    shouldShowBanner: currentSettings.notificationsEnabled,
                    shouldShowList: currentSettings.notificationsEnabled,
                };
            },
        });
    }, [updateBadgeCount]);

    const updateSettings = useCallback(async (newSettings: Partial<UserSettingsType>) => {
        setIsLoadingSettings(true);
        try {
            const updatedSettings = { ...settings, ...newSettings };
            setSettings(updatedSettings);

            await AsyncStorage.setItem(STORAGE_NOTIFICATION_SETTINGS_KEY, JSON.stringify(updatedSettings));

            if (isAuthenticated && user) {
                try {
                    await apiPutData('/api/settings/notifications', updatedSettings);
                } catch (error) {
                    handleApiError(error, handleErrorMessage);
                }
            }

            updateNotificationHandler(updatedSettings);
        } catch (error) {
            console.error('Error updating notification settings:', error);
            throw error;
        } finally {
            setIsLoadingSettings(false);
        }
    }, [settings, isAuthenticated, user, updateNotificationHandler]);

    const showPermissionRequestDialog = () => {
        const title = isSimulator ? 'จำลองการแจ้งเตือน (Simulator)' : 'เปิดการแจ้งเตือน';
        const message = isSimulator
            ? 'ในโหมด Simulator การแจ้งเตือนจะถูกจำลอง\n\n• จำลองการแจ้งเตือน badge count\n• การตั้งค่าจะถูกบันทึก\n• ไม่มีการส่ง push notification จริง'
            : 'แอปต้องการส่งการแจ้งเตือนเพื่อช่วยคุณติดตามความคืบหน้าในการทำงานและการพัฒนานิสัย\n\n• แจ้งเตือนเมื่อถึงเวลาพัก\n• แจ้งเตือนความคืบหน้าของงาน\n• แจ้งเตือนการทำนิสัยประจำวัน';

        // TODO: Show alert using a different method to avoid circular dependency
        console.log(`Alert: ${title} - ${message}`);
        /*
        showAlert({
            title,
            message,
            buttons: [
                {
                    text: "ไม่ต้องการ",
                    style: "cancel"
                },
                {
                    text: isSimulator ? 'เปิดจำลอง' : 'เปิดการแจ้งเตือน',
                    onPress: requestPermissions,
                },
            ]
        })
        */
    };

    const setNotificationHandler = (handler: Notifications.NotificationHandler) => {
        Notifications.setNotificationHandler(handler);
    };

    useEffect(() => {
        updateNotificationHandler(settings);
    }, [settings, updateNotificationHandler]);

    useEffect(() => {
        const notificationListener = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
            updateBadgeCount();
        });

        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            // console.log('Notification response:', response);
            updateBadgeCount();

            // จัดการเมื่อผู้ใช้แตะ notification
            if (response.notification.request.content.data?.type === 'goal_completed') {
                // console.log('[NotificationResponse] User tapped goal completion notification');
                // อาจนำทางไปยังหน้า Goals
            }
        });

        if (hasPermission && isAuthenticated && expoPushToken === null && !isRegistering) {
            registerForPushNotifications();
        }

        return () => {
            notificationListener.remove();
            responseListener.remove();
        };
    }, [isAuthenticated, hasPermission, expoPushToken, registerForPushNotifications, updateBadgeCount, isRegistering]);

    // Initial load settings when provider mounts
    useEffect(() => {
        loadSettings();
    }, []); // Remove loadSettings from dependency to prevent infinite loop

    // Auto request permissions when user becomes authenticated
    useEffect(() => {
        const autoRequestPermissions = async () => {
            if (isAuthenticated && !isSimulator && !hasPermission && permissionStatus !== 'granted') {
                // เลี่ยงการขอ permission ถ้าเคยปฏิเสธมาแล้ว
                if (permissionStatus === 'denied') {
                    return;
                }

                try {
                    await requestPermissions();
                } catch (error) {
                    console.error('Error requesting permissions:', error);
                }
            }
        };

        // Delay เล็กน้อยเพื่อให้ authentication state settle
        const timeoutId = setTimeout(autoRequestPermissions, 2000);
        return () => clearTimeout(timeoutId);
    }, [isAuthenticated, hasPermission, permissionStatus, isSimulator, requestPermissions]);

    return (
        <NotificationContext.Provider
            value={{
                expoPushToken,
                notification,
                requestPermissions,
                hasPermission,
                permissionStatus,
                isRegistering,
                registerForPushNotifications,
                setNotificationHandler,
                showPermissionRequestDialog,
                openNotificationSettings,
                permissionAsked,
                isSimulator,
                settings,
                updateSettings,
                loadSettings,
                isLoadingSettings,
                unreadCount,
                updateBadgeCount,
                clearBadge,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

// Export ที่ถูกต้อง
export default NotificationProvider;

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};