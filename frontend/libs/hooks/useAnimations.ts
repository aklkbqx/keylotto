// frontend/hooks/useAnimations.ts
import { useEffect } from 'react';
import {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withRepeat,
    withDelay,
    Easing,
} from 'react-native-reanimated';

// Types
export type AnimationConfig = {
    duration?: number;
    delay?: number;
    damping?: number;
    stiffness?: number;
};

export type PulseConfig = {
    scale?: number;
    duration?: number;
    repeat?: boolean;
};

export type SlideDirection = 'up' | 'down' | 'left' | 'right';

// Hook สำหรับ Fade In
export function useFadeIn(config: AnimationConfig = {}) {
    const opacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withDelay(
            config.delay || 0,
            withTiming(1, {
                duration: config.duration || 600,
                easing: Easing.out(Easing.quad),
            })
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    return { animatedStyle, opacity };
}

// Hook สำหรับ Slide In
export function useSlideIn(direction: SlideDirection = 'up', config: AnimationConfig = {}) {
    const translateValue = useSharedValue(
        direction === 'up' || direction === 'down' ? 50 : 100
    );
    const opacity = useSharedValue(0);

    useEffect(() => {
        translateValue.value = withDelay(
            config.delay || 0,
            withSpring(0, {
                damping: config.damping || 15,
                stiffness: config.stiffness || 120,
            })
        );

        opacity.value = withDelay(
            config.delay || 0,
            withTiming(1, {
                duration: config.duration || 600,
                easing: Easing.out(Easing.quad),
            })
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        const transform = [];

        if (direction === 'up' || direction === 'down') {
            transform.push({
                translateY: direction === 'up' ? translateValue.value : -translateValue.value,
            });
        } else {
            transform.push({
                translateX: direction === 'left' ? translateValue.value : -translateValue.value,
            });
        }

        return {
            opacity: opacity.value,
            transform,
        };
    });

    return { animatedStyle, translateValue, opacity };
}

// Hook สำหรับ Scale
export function useScale(config: AnimationConfig = {}) {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        scale.value = withDelay(
            config.delay || 0,
            withSpring(1, {
                damping: config.damping || 12,
                stiffness: config.stiffness || 100,
            })
        );

        opacity.value = withDelay(
            config.delay || 0,
            withTiming(1, {
                duration: config.duration || 400,
                easing: Easing.out(Easing.quad),
            })
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{
                scale: scale.value,
            }],
        };
    });

    return { animatedStyle, scale, opacity };
}

// Hook สำหรับ Pulse
export function usePulse(config: PulseConfig = {}) {
    const scale = useSharedValue(1);

    useEffect(() => {
        scale.value = withRepeat(
            withTiming(config.scale || 1.1, {
                duration: config.duration || 1500,
                easing: Easing.inOut(Easing.sin),
            }),
            config.repeat === false ? 1 : -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    return { animatedStyle, scale };
}

// Hook สำหรับ Bounce
export function useBounce(config: AnimationConfig = {}) {
    const translateY = useSharedValue(-20);
    const opacity = useSharedValue(0);

    useEffect(() => {
        translateY.value = withDelay(
            config.delay || 0,
            withSpring(0, {
                damping: config.damping || 8,
                stiffness: config.stiffness || 150,
            })
        );

        opacity.value = withDelay(
            config.delay || 0,
            withTiming(1, {
                duration: config.duration || 500,
                easing: Easing.out(Easing.back(1.5)),
            })
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ translateY: translateY.value }],
        };
    });

    return { animatedStyle, translateY, opacity };
}