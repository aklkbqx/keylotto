// frontend/components/AnimatedView.tsx
import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    withDelay,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';
import {
    useFadeIn,
    useSlideIn,
    useScale,
    usePulse,
    useBounce,
} from '@/libs/hooks/useAnimations';

type AnimationType = 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'pulse' | 'bounce';

interface AnimatedViewProps {
    children?: React.ReactNode;
    animation?: AnimationType;
    delay?: number;
    duration?: number;
    style?: ViewStyle | ViewStyle[];
    // Additional custom animation props
    startOpacity?: number;
    endOpacity?: number;
    startScale?: number;
    endScale?: number;
    startTranslateX?: number;
    endTranslateX?: number;
    startTranslateY?: number;
    endTranslateY?: number;
    startHeight?: number | string;
    endHeight?: number | string;
}

const AnimatedView: React.FC<AnimatedViewProps> = ({
    children,
    animation,
    delay = 0,
    duration = 300,
    style,
    startOpacity,
    endOpacity,
    startScale,
    endScale,
    startTranslateX,
    endTranslateX,
    startTranslateY,
    endTranslateY,
    startHeight,
    endHeight,
}) => {
    // Custom animation values
    const opacity = useSharedValue(startOpacity !== undefined ? startOpacity : 1);
    const scale = useSharedValue(startScale !== undefined ? startScale : 1);
    const translateX = useSharedValue(startTranslateX !== undefined ? startTranslateX : 0);
    const translateY = useSharedValue(startTranslateY !== undefined ? startTranslateY : 0);
    const height = useSharedValue(
        typeof startHeight === 'number' ? startHeight : 
        startHeight === 'auto' ? 100 : 0
    );

    // Pre-defined animations
    const fadeIn = useFadeIn({ delay });
    const slideUp = useSlideIn('up', { delay });
    const slideDown = useSlideIn('down', { delay });
    const slideLeft = useSlideIn('left', { delay });
    const slideRight = useSlideIn('right', { delay });
    const scaleAnim = useScale({ delay });
    const pulse = usePulse();
    const bounce = useBounce({ delay });

    useEffect(() => {
        // Apply custom animations
        if (startOpacity !== undefined && endOpacity !== undefined) {
            opacity.value = withDelay(delay, withTiming(endOpacity, { duration }));
        }
        if (startScale !== undefined && endScale !== undefined) {
            scale.value = withDelay(delay, withSpring(endScale));
        }
        if (startTranslateX !== undefined && endTranslateX !== undefined) {
            translateX.value = withDelay(delay, withTiming(endTranslateX, { duration }));
        }
        if (startTranslateY !== undefined && endTranslateY !== undefined) {
            translateY.value = withDelay(delay, withTiming(endTranslateY, { duration }));
        }
        if (startHeight !== undefined && endHeight !== undefined) {
            const endValue = typeof endHeight === 'number' ? endHeight : 
                            endHeight === 'auto' ? 100 : 0;
            height.value = withDelay(delay, withTiming(endValue, { duration }));
        }
    }, []);

    const customAnimatedStyle = useAnimatedStyle(() => {
        const transforms: any[] = [];
        
        if (startScale !== undefined || endScale !== undefined) {
            transforms.push({ scale: scale.value });
        }
        if (startTranslateX !== undefined || endTranslateX !== undefined) {
            transforms.push({ translateX: translateX.value });
        }
        if (startTranslateY !== undefined || endTranslateY !== undefined) {
            transforms.push({ translateY: translateY.value });
        }

        const style: any = {};
        
        if (startOpacity !== undefined || endOpacity !== undefined) {
            style.opacity = opacity.value;
        }
        if (transforms.length > 0) {
            style.transform = transforms;
        }
        if (startHeight !== undefined || endHeight !== undefined) {
            style.height = height.value;
            style.overflow = 'hidden';
        }

        return style;
    });

    const getAnimatedStyle = () => {
        if (animation) {
            switch (animation) {
                case 'fadeIn':
                    return fadeIn.animatedStyle;
                case 'slideUp':
                    return slideUp.animatedStyle;
                case 'slideDown':
                    return slideDown.animatedStyle;
                case 'slideLeft':
                    return slideLeft.animatedStyle;
                case 'slideRight':
                    return slideRight.animatedStyle;
                case 'scale':
                    return scaleAnim.animatedStyle;
                case 'pulse':
                    return pulse.animatedStyle;
                case 'bounce':
                    return bounce.animatedStyle;
                default:
                    return fadeIn.animatedStyle;
            }
        }
        return customAnimatedStyle;
    };

    return (
        <Animated.View style={[getAnimatedStyle(), style]}>
            {children}
        </Animated.View>
    );
};

// Component พิเศษสำหรับการใช้งานแบบง่ายๆ
export const FadeInView: React.FC<{ children: React.ReactNode; delay?: number; style?: ViewStyle | ViewStyle[] }> = 
    ({ children, delay = 0, style }) => {
    const { animatedStyle } = useFadeIn({ delay });
    return (
        <Animated.View style={[animatedStyle, style]}>
            {children}
        </Animated.View>
    );
};

export const SlideUpView: React.FC<{ children: React.ReactNode; delay?: number; style?: ViewStyle | ViewStyle[] }> = 
    ({ children, delay = 0, style }) => {
    const { animatedStyle } = useSlideIn('up', { delay });
    return (
        <Animated.View style={[animatedStyle, style]}>
            {children}
        </Animated.View>
    );
};

export const SlideDownView: React.FC<{ children: React.ReactNode; delay?: number; style?: ViewStyle | ViewStyle[] }> = 
    ({ children, delay = 0, style }) => {
    const { animatedStyle } = useSlideIn('down', { delay });
    return (
        <Animated.View style={[animatedStyle, style]}>
            {children}
        </Animated.View>
    );
};

export const SlideLeftView: React.FC<{ children: React.ReactNode; delay?: number; style?: ViewStyle | ViewStyle[] }> = 
    ({ children, delay = 0, style }) => {
    const { animatedStyle } = useSlideIn('left', { delay });
    return (
        <Animated.View style={[animatedStyle, style]}>
            {children}
        </Animated.View>
    );
};

export const SlideRightView: React.FC<{ children: React.ReactNode; delay?: number; style?: ViewStyle | ViewStyle[] }> = 
    ({ children, delay = 0, style }) => {
    const { animatedStyle } = useSlideIn('right', { delay });
    return (
        <Animated.View style={[animatedStyle, style]}>
            {children}
        </Animated.View>
    );
};

export const ScaleView: React.FC<{ children: React.ReactNode; delay?: number; style?: ViewStyle | ViewStyle[] }> = 
    ({ children, delay = 0, style }) => {
    const { animatedStyle } = useScale({ delay });
    return (
        <Animated.View style={[animatedStyle, style]}>
            {children}
        </Animated.View>
    );
};

export const PulseView: React.FC<{ children: React.ReactNode; style?: ViewStyle | ViewStyle[] }> = 
    ({ children, style }) => {
    const { animatedStyle } = usePulse();
    return (
        <Animated.View style={[animatedStyle, style]}>
            {children}
        </Animated.View>
    );
};

export const BounceView: React.FC<{ children: React.ReactNode; delay?: number; style?: ViewStyle | ViewStyle[] }> = 
    ({ children, delay = 0, style }) => {
    const { animatedStyle } = useBounce({ delay });
    return (
        <Animated.View style={[animatedStyle, style]}>
            {children}
        </Animated.View>
    );
};

export default AnimatedView;