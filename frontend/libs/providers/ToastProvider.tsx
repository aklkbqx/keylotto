// frontend/contexts/ToastContext.tsx
import Toast from '@/libs/components/Toast';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { View } from 'react-native';

export interface ToastOptions {
    duration?: number;
    position?: 'top' | 'bottom';
    variant?: 'agent' | 'admin' | 'unit' | 'regional';
}

export interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    options?: ToastOptions;
}

interface ToastContextType {
    showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string, options?: ToastOptions) => void;
    showSuccess: (title: string, message?: string, options?: ToastOptions) => void;
    showError: (title: string, message?: string, options?: ToastOptions) => void;
    showWarning: (title: string, message?: string, options?: ToastOptions) => void;
    showInfo: (title: string, message?: string, options?: ToastOptions) => void;
    hideToast: (id: string) => void;
    hideAllToasts: () => void;
    setDefaultVariant: (variant: 'agent' | 'admin' | 'unit' | 'regional') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

interface ToastProviderProps {
    children: React.ReactNode;
    defaultVariant?: 'agent' | 'admin' | 'unit' | 'regional';
    defaultPosition?: 'top' | 'bottom';
    defaultDuration?: number;
}

const DEFAULT_TOAST_OPTIONS: ToastOptions = {
    duration: 3000,
    position: 'top'
};

const ToastProvider: React.FC<ToastProviderProps> = ({ 
    children, 
    defaultVariant = 'agent',
    defaultPosition = 'top',
    defaultDuration = 3000
}) => {
    const [toastQueue, setToastQueue] = useState<ToastMessage[]>([]);
    const [currentToast, setCurrentToast] = useState<ToastMessage | null>(null);
    const [visible, setVisible] = useState(false);
    const [currentVariant, setCurrentVariant] = useState(defaultVariant);

    const generateId = (): string => {
        return Math.random().toString(36).substring(2, 9);
    };

    const showToast = useCallback((
        type: 'success' | 'error' | 'info' | 'warning',
        title: string,
        message: string,
        options?: ToastOptions
    ) => {
        const newToast: ToastMessage = {
            id: generateId(),
            type,
            title,
            message,
            options: { 
                duration: defaultDuration,
                position: defaultPosition,
                variant: currentVariant,
                ...options 
            }
        };

        setToastQueue(prev => [...prev, newToast]);
    }, [currentVariant, defaultDuration, defaultPosition]);

    // Helper methods for common toast types
    const showSuccess = useCallback((title: string, message: string = '', options?: ToastOptions) => {
        showToast('success', title, message, options);
    }, [showToast]);

    const showError = useCallback((title: string, message: string = '', options?: ToastOptions) => {
        showToast('error', title, message, options);
    }, [showToast]);

    const showWarning = useCallback((title: string, message: string = '', options?: ToastOptions) => {
        showToast('warning', title, message, options);
    }, [showToast]);

    const showInfo = useCallback((title: string, message: string = '', options?: ToastOptions) => {
        showToast('info', title, message, options);
    }, [showToast]);

    const hideToast = useCallback((id: string) => {
        if (currentToast?.id === id) {
            setVisible(false);
        } else {
            setToastQueue(prev => prev.filter(toast => toast.id !== id));
        }
    }, [currentToast]);

    const hideAllToasts = useCallback(() => {
        setVisible(false);
        setToastQueue([]);
    }, []);

    const setDefaultVariant = useCallback((variant: 'agent' | 'admin' | 'unit' | 'regional') => {
        setCurrentVariant(variant);
    }, []);

    useEffect(() => {
        if (!visible && toastQueue.length > 0) {
            const nextToast = toastQueue[0];
            setCurrentToast(nextToast);
            setToastQueue(prev => prev.slice(1));
            setVisible(true);
        }
    }, [visible, toastQueue]);

    const handleClose = useCallback(() => {
        setVisible(false);
        // Reset current toast after animation completes
        setTimeout(() => {
            setCurrentToast(null);
        }, 300);
    }, []);

    return (
        <ToastContext.Provider value={{ 
            showToast, 
            showSuccess,
            showError,
            showWarning,
            showInfo,
            hideToast, 
            hideAllToasts,
            setDefaultVariant
        }}>
            <View style={{ flex: 1 }}>
                {children}
                {currentToast && (
                    <Toast
                        visible={visible}
                        type={currentToast.type}
                        title={currentToast.title}
                        message={currentToast.message}
                        variant={currentToast.options?.variant || currentVariant}
                        position={currentToast.options?.position || defaultPosition}
                        duration={currentToast.options?.duration || defaultDuration}
                        onClose={handleClose}
                    />
                )}
            </View>
        </ToastContext.Provider>
    );
};

export default ToastProvider;