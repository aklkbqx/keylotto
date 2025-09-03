// frontend/providers/AuthProvider.tsx
import api, { apiDeleteData, apiGetData, apiPostData, handleApiError, handleErrorMessage } from '@/libs/utils/API_URILS';
import { router } from 'expo-router';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState, useRef } from 'react';
import { User } from '../types/drizzle';
import { useToast } from './ToastProvider';


interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: User | null;
    login: (email: string, password: string) => Promise<{ success: boolean; message?: string; data?: User }>;
    register: (firstname: string, lastname: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
    logout: (expoPushToken?: string) => Promise<void>;
    deleteAccount: () => Promise<void>;
    checkAuth: (force?: boolean) => Promise<boolean>;
    updateUser: (updatedUser: User) => void;
    forceLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [user, setUser] = useState<User | null>(null);
    const { showToast } = useToast();
    const hasCheckedAuth = useRef(false);

    const forceLogout = useCallback(async (): Promise<void> => {
        try {
            await api.getInstance().removeToken()
            setIsAuthenticated(false);
            setUser(null);
        } catch (error) {
            handleApiError(error, handleErrorMessage);
            console.error('🚪 Force logout error:', error);
        }
    }, [])

    const checkAuth = useCallback(async (force = false): Promise<boolean> => {
        setIsLoading(true);
        try {
            const token = await api.getInstance().getToken()

            if (!token) {
                setIsAuthenticated(false);
                setUser(null);
                setIsLoading(false);
                return false;
            }

            try {
                const response = await apiGetData('/api/profile/me');

                if (response?.success === true && response?.user) {
                    setUser(response.user);
                    setIsAuthenticated(true);
                    setIsLoading(false);
                    return true;
                } else {
                    await forceLogout();
                    setIsLoading(false);
                    return false;
                }
            } catch (error: any) {
                handleApiError(error, handleErrorMessage);
                if (error?.response?.status === 401 || error?.response?.status === 403) {
                    await forceLogout();
                } else {
                    setIsAuthenticated(false);
                    setUser(null);
                }
                setIsLoading(false);
                return false;
            }
        } catch (error) {
            console.error('🔴 Check auth error:', error);
            setIsAuthenticated(false);
            setUser(null);
            setIsLoading(false);
            return false;
        }
    }, [forceLogout]);

    const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message?: string; data?: User }> => {
        try {
            const response = await apiPostData('/api/auth/login', { email, password });

            if (response.success && response.token) {
                await api.getInstance().saveTokenAndLogin(response.token);
                await checkAuth(true);
                return { success: true, data: response.user };
            } else {
                return { success: false, message: response.message || 'เข้าสู่ระบบไม่สำเร็จ' };
            }
        } catch (error) {
            const errorMessage = handleApiError(error, handleErrorMessage);
            return { success: false, message: errorMessage };
        }
    }, [checkAuth]);

    const register = useCallback(async (firstname: string, lastname: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
        try {
            const response = await apiPostData('/api/auth/register', { firstname, lastname, email, password });

            if (response.success && response.token) {
                await api.getInstance().saveTokenAndLogin(response.token);
                await checkAuth(true);
                return { success: true };
            } else {
                return { success: false, message: response.message || 'สมัครสมาชิกไม่สำเร็จ' };
            }
        } catch (error) {
            const errorMessage = handleApiError(error, handleErrorMessage);
            return { success: false, message: errorMessage };
        }
    }, [checkAuth]);

    const logout = useCallback(async (expoPushToken?: string): Promise<void> => {
        try {
            // Try to unregister push token before logout
            try {
                const res = await apiPostData('/api/notifications/unregister-device', { 
                    expoPushToken: expoPushToken || undefined 
                });
                if (res.success) {
                    console.log('📱 Device token deleted before logout');
                }
            } catch (error) {
                console.warn('Failed to unregister device token during logout:', error);
                // Continue with logout even if unregister fails
            }

            await api.getInstance().removeToken();
            setIsAuthenticated(false);
            setUser(null);
            router.replace("/");
        } catch (error) {
            setIsAuthenticated(false);
            setUser(null);
            setIsLoading(false);

            router.replace("/");
            console.error('Logout error:', error);
        }
    }, []);

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
    };

    const deleteAccount = async () => {
        try {
            const response = await apiDeleteData("/api/profile/account");
            if (response.success) {
                showToast("success", "สำเร็จ!", response.message);
                await forceLogout();
            }
        } catch (error) {
            handleApiError(error, handleErrorMessage);
        }
    }

    useEffect(() => {
        if (!hasCheckedAuth.current) {
            hasCheckedAuth.current = true;
            checkAuth();
        }
    }, [checkAuth]);

    const value: AuthContextType = {
        isAuthenticated,
        isLoading,
        user,
        login,
        register,
        logout,
        deleteAccount,
        checkAuth,
        updateUser,
        forceLogout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthProvider