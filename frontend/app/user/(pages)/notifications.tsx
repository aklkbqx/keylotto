import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';
import * as Notifications from 'expo-notifications';
import tw from '@/libs/constants/twrnc';
import Container from '@/libs/components/Container';
import { apiGetData, apiPutData, handleApiError } from '@/libs/utils/API_URILS';
import { useToast } from '@/libs/providers/ToastProvider';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface NotificationSettings {
  lotteryDraw: boolean;
  dreamReminder: boolean;
  newsUpdate: boolean;
  promotional: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'lottery' | 'dream' | 'news' | 'promotional' | 'system';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export default function NotificationsScreen() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>({
    lotteryDraw: true,
    dreamReminder: true,
    newsUpdate: false,
    promotional: false,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  
  // Animation values
  const switchAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkNotificationPermission();
    fetchSettings();
    fetchNotifications();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const checkNotificationPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
    
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(newStatus);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await apiGetData('/api/user/notification-settings');
      if (response.success) {
        setSettings(response.data);
      }
    } catch (error) {
      // Use default settings
      console.log('Using default notification settings');
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiGetData('/api/user/notifications');
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error) {
      // Mock data for demo
      const mockNotifications: NotificationItem[] = [
        {
          id: '1',
          title: 'หวยออกแล้ว!',
          message: 'งวดวันที่ 1 มกราคม 2568 ออกแล้ว ตรวจหวยของคุณได้เลย',
          type: 'lottery',
          isRead: false,
          createdAt: new Date().toISOString(),
          actionUrl: '/user/lottery-check',
        },
        {
          id: '2',
          title: 'เลขเด็ดใหม่',
          message: 'มีเลขเด็ดใหม่จากอาจารย์ดัง อย่าพลาด!',
          type: 'news',
          isRead: true,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          actionUrl: '/user/news',
        },
        {
          id: '3',
          title: 'ทำนายฝันฟรี',
          message: 'ทำนายฝันฟรีวันนี้! มาดูเลขเด็ดจากความฝันกัน',
          type: 'dream',
          isRead: false,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          actionUrl: '/user/dream',
        },
      ];
      setNotifications(mockNotifications);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Animate switch
    Animated.sequence([
      Animated.timing(switchAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(switchAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await apiPutData('/api/user/notification-settings', { settings: newSettings });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showToast('success', 'บันทึกแล้ว', 'อัพเดทการตั้งค่าเรียบร้อย');
    } catch (error) {
      // Revert on error
      setSettings(settings);
      handleApiError(error, (message) => {
        showToast('error', 'เกิดข้อผิดพลาด', message);
      });
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiPutData(`/api/user/notifications/${notificationId}/read`, {});
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      handleApiError(error, (message) => {
        showToast('error', 'เกิดข้อผิดพลาด', message);
      });
    }
  };

  const clearAllNotifications = async () => {
    Alert.alert(
      'ลบการแจ้งเตือนทั้งหมด',
      'คุณต้องการลบการแจ้งเตือนทั้งหมดใช่หรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบทั้งหมด',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiPutData('/api/user/notifications/clear', {});
              setNotifications([]);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast('success', 'ลบแล้ว', 'ลบการแจ้งเตือนทั้งหมดแล้ว');
            } catch (error) {
              handleApiError(error, (message) => {
                showToast('error', 'เกิดข้อผิดพลาด', message);
              });
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'lottery': return { name: 'ticket', color: '#FFD700' };
      case 'dream': return { name: 'moon', color: '#667eea' };
      case 'news': return { name: 'newspaper', color: '#FF5722' };
      case 'promotional': return { name: 'gift', color: '#4CAF50' };
      default: return { name: 'notifications', color: '#9E9E9E' };
    }
  };

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: cardAnim.value }],
    };
  });

  const switchStyle = useAnimatedStyle(() => {
    const scale = interpolate(switchAnim.value, [0, 1], [1, 1.1], Extrapolate.CLAMP);
    return {
      transform: [{ scale }],
    };
  });

  return (
    <Container>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460', '#1a1a2e']}
        style={tw`absolute inset-0`}
      />

      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={tw`px-4 pt-12 pb-6`}>
          <Animated.View entering={FadeInDown.delay(100)}>
            <View style={tw`items-center`}>
              <Text style={tw`text-6xl mb-2`}>🔔</Text>
              <Text style={tw`text-3xl font-bold text-white text-center font-aboreto`}>
                การแจ้งเตือน
              </Text>
              <Text style={tw`text-white/70 text-center mt-2 text-lg`}>
                จัดการการแจ้งเตือนและตั้งค่าต่างๆ
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Permission Status */}
        {permissionStatus !== 'granted' && (
          <Animated.View entering={FadeInUp.delay(200)} style={tw`mx-4 mb-6`}>
            <BlurView intensity={20} style={tw`rounded-xl overflow-hidden`}>
              <LinearGradient
                colors={['#FF5722', '#FF7043']}
                style={tw`p-4`}
              >
                <View style={tw`flex-row items-center`}>
                  <Ionicons name="warning" size={24} color="white" />
                  <View style={tw`flex-1 ml-3`}>
                    <Text style={tw`text-white font-bold text-lg`}>ต้องการสิทธิ์การแจ้งเตือน</Text>
                    <Text style={tw`text-white/80 text-sm`}>
                      เปิดใช้งานการแจ้งเตือนเพื่อรับข้อมูลล่าสุด
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </BlurView>
          </Animated.View>
        )}

        {/* Settings Section */}
        <Animated.View entering={FadeInUp.delay(300)} style={[tw`mx-4 mb-6`, animatedCardStyle]}>
          <BlurView intensity={20} style={tw`rounded-2xl overflow-hidden`}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={tw`p-6`}
            >
              <Text style={tw`text-white font-bold text-xl mb-4`}>⚙️ การตั้งค่า</Text>
              
              {/* Notification Types */}
              <View style={tw`space-y-4`}>
                {[
                  { key: 'lotteryDraw', label: 'หวยออก', icon: 'ticket', desc: 'แจ้งเตือนเมื่อหวยออก' },
                  { key: 'dreamReminder', label: 'ทำนายฝัน', icon: 'moon', desc: 'เตือนให้ทำนายฝัน' },
                  { key: 'newsUpdate', label: 'ข่าวเลขเด็ด', icon: 'newspaper', desc: 'ข่าวเลขเด็ดใหม่' },
                  { key: 'promotional', label: 'โปรโมชั่น', icon: 'gift', desc: 'ข้อเสนอพิเศษ' },
                ].map((setting, index) => (
                  <Animated.View
                    key={setting.key}
                    entering={FadeInUp.delay(400 + index * 100)}
                  >
                    <View style={tw`flex-row items-center justify-between py-3`}>
                      <View style={tw`flex-row items-center flex-1`}>
                        <View style={tw`w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-4`}>
                          <Ionicons name={setting.icon as any} size={20} color="white" />
                        </View>
                        <View style={tw`flex-1`}>
                          <Text style={tw`text-white font-semibold text-lg`}>{setting.label}</Text>
                          <Text style={tw`text-white/70 text-sm`}>{setting.desc}</Text>
                        </View>
                      </View>
                      <Animated.View style={switchStyle}>
                        <Switch
                          value={settings[setting.key as keyof NotificationSettings] as boolean}
                          onValueChange={(value) => updateSetting(setting.key as keyof NotificationSettings, value)}
                          trackColor={{ false: '#3D2520', true: '#4CAF50' }}
                          thumbColor={settings[setting.key as keyof NotificationSettings] ? '#FFFFFF' : '#8B7355'}
                        />
                      </Animated.View>
                    </View>
                    {index < 3 && <View style={tw`h-px bg-white/20`} />}
                  </Animated.View>
                ))}
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Sound & Vibration Settings */}
        <Animated.View entering={FadeInUp.delay(500)} style={tw`mx-4 mb-6`}>
          <BlurView intensity={20} style={tw`rounded-2xl overflow-hidden`}>
            <LinearGradient
              colors={['#4CAF50', '#66BB6A']}
              style={tw`p-6`}
            >
              <Text style={tw`text-white font-bold text-xl mb-4`}>🔊 เสียงและการสั่น</Text>
              
              <View style={tw`space-y-4`}>
                {[
                  { key: 'soundEnabled', label: 'เสียงแจ้งเตือน', icon: 'volume-high' },
                  { key: 'vibrationEnabled', label: 'การสั่น', icon: 'phone-portrait' },
                ].map((setting, index) => (
                  <Animated.View
                    key={setting.key}
                    entering={FadeInUp.delay(600 + index * 100)}
                  >
                    <View style={tw`flex-row items-center justify-between py-3`}>
                      <View style={tw`flex-row items-center flex-1`}>
                        <View style={tw`w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-4`}>
                          <Ionicons name={setting.icon as any} size={20} color="white" />
                        </View>
                        <Text style={tw`text-white font-semibold text-lg`}>{setting.label}</Text>
                      </View>
                      <Animated.View style={switchStyle}>
                        <Switch
                          value={settings[setting.key as keyof NotificationSettings] as boolean}
                          onValueChange={(value) => updateSetting(setting.key as keyof NotificationSettings, value)}
                          trackColor={{ false: '#3D2520', true: '#FFD700' }}
                          thumbColor={settings[setting.key as keyof NotificationSettings] ? '#FFFFFF' : '#8B7355'}
                        />
                      </Animated.View>
                    </View>
                    {index < 1 && <View style={tw`h-px bg-white/20`} />}
                  </Animated.View>
                ))}
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Notifications List */}
        <Animated.View entering={FadeInUp.delay(700)} style={tw`mx-4 mb-6`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text style={tw`text-white font-bold text-xl`}>📱 การแจ้งเตือนล่าสุด</Text>
            {notifications.length > 0 && (
              <Pressable
                onPress={clearAllNotifications}
                style={tw`bg-red-500/20 rounded-full px-4 py-2`}
              >
                <Text style={tw`text-red-300 text-sm font-medium`}>ลบทั้งหมด</Text>
              </Pressable>
            )}
          </View>

          {loading ? (
            <View style={tw`items-center py-8`}>
              <LottieView
                source={require('@/assets/animations/loading.json')}
                autoPlay
                loop
                style={tw`w-12 h-12`}
              />
              <Text style={tw`text-white/60 mt-2`}>กำลังโหลด...</Text>
            </View>
          ) : notifications.length === 0 ? (
            <BlurView intensity={20} style={tw`rounded-2xl overflow-hidden`}>
              <View style={tw`bg-white/10 p-8 items-center`}>
                <Text style={tw`text-6xl mb-4`}>📭</Text>
                <Text style={tw`text-white/80 text-lg`}>ยังไม่มีการแจ้งเตือน</Text>
                <Text style={tw`text-white/60 text-sm mt-2`}>
                  การแจ้งเตือนใหม่จะแสดงที่นี่
                </Text>
              </View>
            </BlurView>
          ) : (
            notifications.map((notification, index) => {
              const icon = getNotificationIcon(notification.type);
              return (
                <Animated.View
                  key={notification.id}
                  entering={FadeInUp.delay(800 + index * 100)}
                  style={tw`mb-3`}
                >
                  <BlurView intensity={20} style={tw`rounded-2xl overflow-hidden`}>
                    <Pressable
                      onPress={() => markAsRead(notification.id)}
                      style={tw`p-4 ${!notification.isRead ? 'bg-white/10' : 'bg-white/5'}`}
                    >
                      <View style={tw`flex-row items-start`}>
                        <View style={tw`w-12 h-12 rounded-full items-center justify-center mr-4`}
                          style={{ backgroundColor: icon.color + '20' }}
                        >
                          <Ionicons name={icon.name as any} size={24} color={icon.color} />
                        </View>
                        <View style={tw`flex-1`}>
                          <View style={tw`flex-row items-center justify-between mb-1`}>
                            <Text style={tw`text-white font-bold text-lg`}>{notification.title}</Text>
                            {!notification.isRead && (
                              <View style={tw`w-3 h-3 bg-blue-500 rounded-full`} />
                            )}
                          </View>
                          <Text style={tw`text-white/80 text-base leading-relaxed mb-2`}>
                            {notification.message}
                          </Text>
                          <Text style={tw`text-white/60 text-sm`}>
                            {new Date(notification.createdAt).toLocaleString('th-TH')}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  </BlurView>
                </Animated.View>
              );
            })
          )}
        </Animated.View>
      </ScrollView>
    </Container>
  );
}