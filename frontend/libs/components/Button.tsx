// libs/components/Button.tsx
import React from 'react';
import { Pressable, PressableProps, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Text from './Text';
import tw from '@/libs/constants/twrnc';
import { useTheme } from '@/libs/providers/ThemeProvider';

interface ButtonProps extends PressableProps {
    label?: string;
    children?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient' | 'accent';
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
    fullWidth?: boolean;
    loading?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    // Deprecated: kept for backward compatibility, ignored
    roleVariant?: 'agent' | 'admin' | 'unit' | 'regional';
    rounded?: boolean;
    // Custom theme palette per-button (preferred)
    theme?: {
        primary?: string;
        primaryLight?: string;
        gradient?: string[];
    };
}

const Button: React.FC<ButtonProps> = ({
    label,
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled = false,
    icon,
    iconPosition = 'left',
    roleVariant = 'agent',
    rounded = false,
    theme,
    style,
    ...props
}) => {
    const isDisabled = disabled || loading;
    const [isHovered, setIsHovered] = React.useState(false);
    const { palette } = useTheme();

    // Per-button palette: merge prop theme over global palette
    const mergedPalette = {
        primary: theme?.primary || palette.primary,
        primaryLight: theme?.primaryLight || palette.primaryLight,
        gradient: theme?.gradient || [palette.primary, palette.primaryLight],
    };

    // Size styles
    const sizeStyles = {
        sm: {
            paddingVertical: 8,
            paddingHorizontal: 16,
            iconSize: 16,
            textSize: 'sm' as const,
        },
        md: {
            paddingVertical: 12,
            paddingHorizontal: 24,
            iconSize: 20,
            textSize: 'base' as const,
        },
        lg: {
            paddingVertical: 16,
            paddingHorizontal: 32,
            iconSize: 24,
            textSize: 'lg' as const,
        },
        xl: {
            paddingVertical: 20,
            paddingHorizontal: 40,
            iconSize: 28,
            textSize: 'xl' as const,
        },
    };

    // Variant styles matching design
    const variantStyles = {
        primary: {
            backgroundColor: isDisabled ? String(tw.color('gray-300')) : mergedPalette.primary,
            borderWidth: 0,
        },
        secondary: {
            backgroundColor: isDisabled ? String(tw.color('gray-300')) : String(tw.color('gray-100')),
            borderWidth: 0,
        },
        accent: {
            backgroundColor: isDisabled ? String(tw.color('gray-300')) : mergedPalette.primaryLight,
            borderWidth: 0,
        },
        outline: {
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: isDisabled ? String(tw.color('gray-300')) : mergedPalette.primary,
        },
        ghost: {
            backgroundColor: 'transparent',
            borderWidth: 0,
        },
        danger: {
            backgroundColor: isDisabled ? String(tw.color('gray-300')) : String(tw.color('red-500')),
            borderWidth: 0,
        },
        gradient: {
            backgroundColor: 'transparent',
            borderWidth: 0,
        },
    } as const;

    // Text color based on variant
    const getTextColor = () => {
        if (isDisabled) return String(tw.color('gray-500'));
        switch (variant) {
            case 'primary':
            case 'danger':
            case 'gradient':
            case 'accent':
                return String(tw.color('white'));
            case 'secondary':
                return String(tw.color('gray-700'));
            case 'outline':
                return mergedPalette.primary;
            case 'ghost':
                return mergedPalette.primary;
            default:
                return String(tw.color('white'));
        }
    };

    const currentSize = size === 'icon' ? sizeStyles.md : sizeStyles[size as keyof typeof sizeStyles];
    const currentVariant = variantStyles[variant];

    // Display text (label takes priority over children)
    const displayText = label || children;

    const buttonContent = (
        <View style={tw`flex-row items-center justify-center gap-2`}>
            {loading ? (
                <ActivityIndicator size="small" color={getTextColor()} />
            ) : (
                <>
                    {icon && iconPosition === 'left' && (
                        <View style={tw``}>
                            {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, {
                                size: currentSize.iconSize,
                                color: getTextColor(),
                            })}
                        </View>
                    )}
                    {displayText && (
                        <Text
                            size={currentSize.textSize}
                            weight="semibold"
                            color={getTextColor()}
                        >
                            {displayText}
                        </Text>
                    )}
                    {icon && iconPosition === 'right' && (
                        <View style={tw``}>
                            {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, {
                                size: currentSize.iconSize,
                                color: getTextColor(),
                            })}
                        </View>
                    )}
                </>
            )}
        </View>
    );

    const baseStyle: any = {
        paddingVertical: currentSize.paddingVertical,
        paddingHorizontal: currentSize.paddingHorizontal,
        borderRadius: rounded ? 999 : 12,
        ...currentVariant,
        ...(fullWidth ? { width: '100%' as const } : {}),
    };

    if (variant === 'gradient' && !isDisabled) {
        return (
            <Pressable
                disabled={isDisabled}
                onHoverIn={() => setIsHovered(true)}
                onHoverOut={() => setIsHovered(false)}
                style={({ pressed }) => ([
                    fullWidth ? { width: '100%' } : undefined,
                    { borderRadius: rounded ? 999 : 12 },
                    isHovered ? { opacity: 0.95 } : undefined,
                    pressed ? { opacity: 0.85 } : undefined,
                    (typeof style === 'object' ? style : undefined),
                ])}
                {...props}
            >
                <LinearGradient
                    colors={mergedPalette.gradient as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                        ...baseStyle,
                        shadowColor: mergedPalette.gradient[0],
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                    }}
                >
                    {buttonContent}
                </LinearGradient>
            </Pressable>
        );
    }

    return (
        <Pressable
            disabled={isDisabled}
            onHoverIn={() => setIsHovered(true)}
            onHoverOut={() => setIsHovered(false)}
            style={({ pressed }) => ([
                baseStyle,
                isHovered ? { opacity: 0.95 } : undefined,
                pressed ? { opacity: 0.85 } : undefined,
                (typeof style === 'object' ? style : undefined),
            ])}
            {...props}
        >
            {buttonContent}
        </Pressable>
    );
};

export default Button;