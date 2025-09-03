// providers/AlertProvider.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import AlertModal, { AlertButton } from '@/libs/components/AlertModal';
import { Ionicons } from '@expo/vector-icons';

export interface AlertOptions {
    title: string;
    message?: string;
    buttons?: AlertButton[];
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
    variant?: 'agent' | 'admin' | 'unit' | 'regional';
    showIcon?: boolean;
    autoClose?: boolean;
    autoCloseDelay?: number;
}

interface AlertContextType {
    showAlert: (options: AlertOptions) => void;
    hideAlert: () => void;
    // Helper methods for common alert types
    showSuccess: (title: string, message?: string, autoClose?: boolean) => void;
    showError: (title: string, message?: string) => void;
    showWarning: (title: string, message?: string) => void;
    showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within AlertProvider');
    }
    return context;
};

interface AlertProviderProps {
    children: React.ReactNode;
    defaultVariant?: 'agent' | 'admin' | 'unit' | 'regional';
}

const AlertProvider: React.FC<AlertProviderProps> = ({ children, defaultVariant = 'agent' }) => {
    const [alertConfig, setAlertConfig] = useState<AlertOptions | null>(null);
    const [visible, setVisible] = useState(false);

    const showAlert = useCallback((options: AlertOptions) => {
        // Default button if none provided
        const defaultButtons: AlertButton[] = [
            { text: 'ตกลง', style: 'default' }
        ];

        // Wrap button onPress to ensure modal closes
        const wrappedButtons = (options.buttons || defaultButtons).map(button => ({
            ...button,
            onPress: () => {
                if (button.onPress) {
                    button.onPress();
                }
                // Always close modal after button press
                hideAlert();
            }
        }));

        setAlertConfig({
            ...options,
            buttons: wrappedButtons,
            variant: options.variant || defaultVariant
        });
        setVisible(true);
    }, [defaultVariant]);

    const hideAlert = useCallback(() => {
        setVisible(false);
        setTimeout(() => {
            setAlertConfig(null);
        }, 300); // Wait for modal animation to finish
    }, []);

    // Helper method for success alerts
    const showSuccess = useCallback((title: string, message?: string, autoClose: boolean = true) => {
        showAlert({
            title,
            message,
            type: 'success',
            autoClose,
            autoCloseDelay: 2000,
            buttons: autoClose ? [] : [{ text: 'ตกลง', style: 'default' }]
        });
    }, [showAlert]);

    // Helper method for error alerts
    const showError = useCallback((title: string, message?: string) => {
        showAlert({
            title,
            message,
            type: 'error',
            buttons: [{ text: 'ตกลง', style: 'destructive' }]
        });
    }, [showAlert]);

    // Helper method for warning alerts
    const showWarning = useCallback((title: string, message?: string) => {
        showAlert({
            title,
            message,
            type: 'warning',
            buttons: [{ text: 'ตกลง', style: 'default' }]
        });
    }, [showAlert]);

    // Helper method for confirmation dialogs
    const showConfirm = useCallback((
        title: string, 
        message: string, 
        onConfirm: () => void, 
        onCancel?: () => void
    ) => {
        showAlert({
            title,
            message,
            type: 'confirm',
            buttons: [
                { 
                    text: 'ยกเลิก', 
                    style: 'cancel',
                    onPress: onCancel
                },
                { 
                    text: 'ยืนยัน', 
                    style: 'confirm',
                    onPress: onConfirm
                }
            ]
        });
    }, [showAlert]);

    return (
        <AlertContext.Provider value={{ 
            showAlert, 
            hideAlert,
            showSuccess,
            showError,
            showWarning,
            showConfirm
        }}>
            {children}
            {alertConfig && (
                <AlertModal
                    visible={visible}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    buttons={alertConfig.buttons || []}
                    onDismiss={hideAlert}
                    icon={alertConfig.icon}
                    iconColor={alertConfig.iconColor}
                    type={alertConfig.type}
                    variant={alertConfig.variant}
                    showIcon={alertConfig.showIcon}
                    autoClose={alertConfig.autoClose}
                    autoCloseDelay={alertConfig.autoCloseDelay}
                />
            )}
        </AlertContext.Provider>
    );
};

export default AlertProvider;