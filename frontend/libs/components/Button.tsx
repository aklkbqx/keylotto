// libs/components/Button.tsx
import React, { useRef } from 'react';
import { Pressable, PressableProps, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withSequence,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
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
    // Animation and haptic properties
    hapticFeedback?: boolean;
    hapticType?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
    animated?: boolean;
    bounceOnPress?: boolean;
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
    hapticFeedback = true,
    hapticType = 'light',
    animated = true,
    bounceOnPress = true,
    theme,
    style,
    onPress,
    ...props
}) => {
    const isDisabled = disabled || loading;
    const [isHovered, setIsHovered] = React.useState(false);
    const { palette } = useTheme();
    
    // Animation values
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const pressAnim = useRef(new Animated.Value(0)).current;

    // Haptic feedback function
    const triggerHaptic = async () => {
        if (!hapticFeedback || isDisabled) return;
        
        try {
            switch (hapticType) {
                case 'light':
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    break;
                case 'medium':
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    break;
                case 'heavy':
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    break;
                case 'success':
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    break;
                case 'warning':
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    break;
                case 'error':
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    break;
            }
        } catch (error) {
            // Haptic feedback not available
        }
    };

    // Animation functions
    const handlePressIn = () => {
        if (animated && !isDisabled) {
            Animated.parallel([
                withTiming(pressAnim, { toValue: 1, duration: 100 }),
                bounceOnPress ? withSpring(scaleAnim, { toValue: 0.95, damping: 8, stiffness: 100 }) : null,
            ].filter(Boolean));
        }
    };

    const handlePressOut = () => {
        if (animated && !isDisabled) {
            Animated.parallel([
                withTiming(pressAnim, { toValue: 0, duration: 100 }),
                bounceOnPress ? withSpring(scaleAnim, { toValue: 1, damping: 8, stiffness: 100 }) : null,
            ].filter(Boolean));
        }
    };

    const handlePress = async (event: any) => {
        await triggerHaptic();
        onPress?.(event);
    };

    // Animated styles
    const animatedStyle = useAnimatedStyle(() => {
        const scale = interpolate(scaleAnim.value, [0, 1], [1, 1], Extrapolate.CLAMP);
        const pressScale = interpolate(pressAnim.value, [0, 1], [1, 0.95], Extrapolate.CLAMP);
        
        return {
            transform: [{ scale: scale * pressScale }],
        };
    });

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
            <Animated.View style={animated ? animatedStyle : undefined}>
                <Pressable
                    disabled={isDisabled}
                    onHoverIn={() => setIsHovered(true)}
                    onHoverOut={() => setIsHovered(false)}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handlePress}
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
            </Animated.View>
        );
    }

    return (
        <Animated.View style={animated ? animatedStyle : undefined}>
            <Pressable
                disabled={isDisabled}
                onHoverIn={() => setIsHovered(true)}
                onHoverOut={() => setIsHovered(false)}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handlePress}
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
        </Animated.View>
    );
};

export default Button;