// libs/components/AlertModal.tsx
import React from 'react';
import { Modal, View, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/libs/constants/twrnc';
import { useTheme } from '@/libs/providers/ThemeProvider';
import Text from '@/libs/components/Text';
import { FadeInView, ScaleView } from '@/libs/components/AnimatedView';
import { BlurView } from 'expo-blur';

export interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive' | 'confirm';
}

interface AlertModalProps {
    visible: boolean;
    title: string;
    message?: string;
    buttons: AlertButton[];
    onDismiss?: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
    variant?: 'agent' | 'admin' | 'unit' | 'regional';
    showIcon?: boolean;
    autoClose?: boolean;
    autoCloseDelay?: number;
}

const AlertModal: React.FC<AlertModalProps> = ({
    visible,
    title,
    message,
    buttons,
    onDismiss,
    icon,
    iconColor,
    type = 'info',
    variant = 'agent',
    showIcon = true,
    autoClose = false,
    autoCloseDelay = 3000,
}) => {
    const { palette } = useTheme();
    
    // Auto close effect
    React.useEffect(() => {
        if (visible && autoClose && autoCloseDelay > 0) {
            const timer = setTimeout(() => {
                onDismiss?.();
            }, autoCloseDelay);
            return () => clearTimeout(timer);
        }
    }, [visible, autoClose, autoCloseDelay, onDismiss]);
    
    // Get icon and color based on type
    const getTypeConfig = () => {
        switch (type) {
            case 'success':
                return {
                    defaultIcon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
                    defaultColor: String(tw.color('green-500')),
                    bgColor: String(tw.color('green-100')),
                };
            case 'warning':
                return {
                    defaultIcon: 'warning' as keyof typeof Ionicons.glyphMap,
                    defaultColor: String(tw.color('amber-500')),
                    bgColor: String(tw.color('amber-100')),
                };
            case 'error':
                return {
                    defaultIcon: 'alert-circle' as keyof typeof Ionicons.glyphMap,
                    defaultColor: palette.danger,
                    bgColor: String(tw.color('red-100')),
                };
            case 'confirm':
                return {
                    defaultIcon: 'help-circle' as keyof typeof Ionicons.glyphMap,
                    defaultColor: palette.primary,
                    bgColor: `${palette.primary}20`,
                };
            default:
                return {
                    defaultIcon: 'information-circle' as keyof typeof Ionicons.glyphMap,
                    defaultColor: palette.primary,
                    bgColor: String(tw.color('blue-100')),
                };
        }
    };
    
    const typeConfig = getTypeConfig();
    const displayIcon = icon || typeConfig.defaultIcon;
    const displayIconColor = iconColor || typeConfig.defaultColor;
    const handleButtonPress = (button: AlertButton) => {
        if (button.onPress) {
            button.onPress();
        }
        if (onDismiss) {
            onDismiss();
        }
    };

    // const handleBackdropPress = () => {
    //     // On web, allow dismissing by clicking backdrop
    //     if (Platform.OS === 'web' && onDismiss) {
    //         onDismiss();
    //     }
    // };

    const getButtonStyle = (style: AlertButton['style']) => {
        switch (style) {
            case 'destructive':
                return {
                    backgroundColor: palette.danger,
                    textColor: 'white',
                    borderColor: 'transparent',
                };
            case 'cancel':
                return {
                    backgroundColor: 'transparent',
                    textColor: palette.text,
                    borderColor: palette.border,
                };
            case 'confirm':
                return {
                    backgroundColor: palette.primary,
                    textColor: 'white',
                    borderColor: 'transparent',
                };
            default:
                return {
                    backgroundColor: palette.primary,
                    textColor: 'white',
                    borderColor: 'transparent',
                };
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onDismiss}
        >
            <BlurView intensity={20} tint="dark" style={tw`flex-1`}>
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={onDismiss}
                    style={tw`flex-1 items-center justify-center p-6`}
                >
                    <FadeInView style={tw`w-full max-w-sm`}>
                        <ScaleView style={tw`w-full`}>
                            <TouchableOpacity
                                activeOpacity={1}
                                style={[tw`rounded-3xl p-6 shadow-2xl`, { backgroundColor: palette.surface }]}
                            >
                                {/* Icon */}
                                {showIcon && (
                                    <View style={tw`items-center mb-4`}>
                                        <ScaleView>
                                            <View
                                                style={[
                                                    tw`w-20 h-20 rounded-full items-center justify-center`,
                                                    { backgroundColor: typeConfig.bgColor }
                                                ]}
                                            >
                                                <Ionicons
                                                    name={displayIcon}
                                                    size={40}
                                                    color={displayIconColor}
                                                />
                                            </View>
                                        </ScaleView>
                                    </View>
                                )}

                                {/* Title */}
                                <Text
                                    size="xl"
                                    weight="semibold"
                                    color={palette.text}
                                    style={tw`text-center mb-2`}
                                >
                                    {title}
                                </Text>

                                {/* Message */}
                                {message && (
                                    <Text
                                        size="base"
                                        color={palette.textSecondary}
                                        style={tw`text-center mb-6`}
                                    >
                                        {message}
                                    </Text>
                                )}

                                {/* Buttons */}
                                <View style={tw`${buttons.length > 1 ? 'flex-row gap-3' : ''}`}>
                                    {buttons.map((button, index) => {
                                        const buttonStyle = getButtonStyle(button.style);
                                        return (
                                            <TouchableOpacity
                                                key={index}
                                                onPress={() => handleButtonPress(button)}
                                                style={[
                                                    tw`py-3 px-6 rounded-xl ${buttons.length > 1 ? 'flex-1' : 'w-full'}`,
                                                    {
                                                        backgroundColor: buttonStyle.backgroundColor,
                                                        borderWidth: buttonStyle.borderColor !== 'transparent' ? 1 : 0,
                                                        borderColor: buttonStyle.borderColor,
                                                    }
                                                ]}
                                            >
                                                <Text
                                                    size="base"
                                                    weight="medium"
                                                    color={buttonStyle.textColor}
                                                    style={tw`text-center`}
                                                >
                                                    {button.text}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </TouchableOpacity>
                        </ScaleView>
                    </FadeInView>
                </TouchableOpacity>
            </BlurView>
        </Modal>
    );
};

export default AlertModal; 