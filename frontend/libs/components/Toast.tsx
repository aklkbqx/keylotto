// frontend/components/Toast.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
    Extrapolate,
    interpolate,
    runOnJS,
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from '@/libs/constants/twrnc';
import { useTheme } from '@/libs/providers/ThemeProvider';
import Text from './Text';

interface ToastProps {
    visible: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    onClose: () => void;
    variant?: 'agent' | 'admin' | 'unit' | 'regional';
    position?: 'top' | 'bottom';
    duration?: number;
}

const SPRING_CONFIG = {
    damping: 15,
    mass: 1,
    stiffness: 200,
};

const ANIMATION_DURATION = 300;

const Toast: React.FC<ToastProps> = ({ 
    visible, 
    type, 
    title, 
    message, 
    onClose,
    variant = 'agent',
    position = 'top',
    duration = 3000
}) => {
    const insets = useSafeAreaInsets();
    const { palette } = useTheme();
    const translateY = useSharedValue(position === 'top' ? -100 : 100);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.8);
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const handleClose = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        setTimeout(onClose, ANIMATION_DURATION);
    }, [onClose]);

    // แยก animation logic ออกมาเป็น worklet function
    const runCloseAnimation = useCallback(() => {
        'worklet';
        translateY.value = withTiming(position === 'top' ? -100 : 100, {
            duration: ANIMATION_DURATION
        });

        opacity.value = withTiming(0, {
            duration: ANIMATION_DURATION
        });
        scale.value = withTiming(0.8, {
            duration: ANIMATION_DURATION
        });

        runOnJS(handleClose)();
    }, [handleClose, opacity, scale, translateY, position]);

    const gestureHandler = useAnimatedGestureHandler({
        onStart: (_, context: any) => {
            context.startY = translateY.value;
        },
        onActive: (event, context) => {
            const newTranslateY = context.startY + event.translationY;
            if (position === 'top' ? newTranslateY <= 0 : newTranslateY >= 0) {
                translateY.value = newTranslateY;
                opacity.value = interpolate(
                    Math.abs(newTranslateY),
                    [0, 100],
                    [1, 0],
                    Extrapolate.CLAMP
                );
            }
        },
        onEnd: (event) => {
            const shouldClose = position === 'top' 
                ? (event.velocityY < -500 || translateY.value < -50)
                : (event.velocityY > 500 || translateY.value > 50);
                
            if (shouldClose) {
                runCloseAnimation();
            } else {
                translateY.value = withSpring(0, SPRING_CONFIG);
                opacity.value = withSpring(1);
                scale.value = withSpring(1);
            }
        },
    });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: translateY.value },
                { scale: scale.value }
            ],
            opacity: opacity.value,
        };
    });

    useEffect(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        if (visible) {
            // Show animation
            translateY.value = withSpring(0, SPRING_CONFIG);
            opacity.value = withSpring(1);
            scale.value = withSpring(1);

            // Auto hide after delay
            if (duration > 0) {
                timerRef.current = setTimeout(() => {
                    runCloseAnimation();
                }, duration);
            }
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [visible, title, message, runCloseAnimation, translateY, opacity, scale, duration]);

    const getToastConfig = () => {
        switch (type) {
            case 'success':
                return {
                    backgroundColor: String(tw.color('green-500')),
                    icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
                    iconColor: String(tw.color('white'))
                };
            case 'error':
                return {
                    backgroundColor: palette.danger,
                    icon: 'close-circle' as keyof typeof Ionicons.glyphMap,
                    iconColor: String(tw.color('white'))
                };
            case 'warning':
                return {
                    backgroundColor: String(tw.color('amber-500')),
                    icon: 'warning' as keyof typeof Ionicons.glyphMap,
                    iconColor: String(tw.color('white'))
                };
            case 'info':
            default:
                return {
                    backgroundColor: palette.primary,
                    icon: 'information-circle' as keyof typeof Ionicons.glyphMap,
                    iconColor: String(tw.color('white'))
                };
        }
    };

    if (!visible) return null;

    const { backgroundColor, icon, iconColor } = getToastConfig();

    const containerStyle = position === 'top' 
        ? {
            top: 0,
            marginTop: insets.top + 5,
        }
        : {
            bottom: 0,
            marginBottom: insets.bottom + 5,
        };

    return (
        <View 
            style={[
                tw`absolute left-0 right-0`,
                containerStyle,
                {
                    zIndex: 1000,
                    paddingHorizontal: 24, // equivalent to mx-6
                }
            ]}
            pointerEvents="box-none"
        >
            <PanGestureHandler onGestureEvent={gestureHandler}>
                <Animated.View
                    style={[
                        tw`w-full rounded-2xl shadow-lg`,
                        {
                            backgroundColor,
                            pointerEvents: 'auto', // Toast itself can receive touches
                        },
                        animatedStyle
                    ]}
                >
                    <View style={tw`flex-row items-center p-4`}>
                        <View
                            style={[
                                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                                { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
                            ]}
                        >
                            <Ionicons
                                name={icon}
                                size={24}
                                color={iconColor}
                            />
                        </View>
                        <View style={tw`flex-1`}>
                            <Text
                                size="base"
                                weight="semibold"
                                color="white"
                            >
                                {title}
                            </Text>
                            <Text
                                size="sm"
                                color={String(tw.color('white/90'))}
                                style={tw`mt-0.5`}
                            >
                                {message}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={runCloseAnimation}
                            style={tw`ml-2 p-2 rounded-full bg-white/10`}
                        >
                            <Ionicons
                                name="close"
                                size={20}
                                color={iconColor}
                            />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </PanGestureHandler>
        </View>
    );
};

export default Toast;