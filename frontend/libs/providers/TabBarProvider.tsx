// frontend/providers/TabBarProvider.tsx
import React, { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface TabBarContextType {
    isVisible: boolean;
    showTabBar: () => void;
    hideTabBar: () => void;
    tabBarStyle: Animated.WithAnimatedValue<ViewStyle>;
}

const TabBarContext = createContext<TabBarContextType | undefined>(undefined);

export const useTabBar = () => {
    const context = useContext(TabBarContext);
    if (context === undefined) {
        throw new Error('useTabBar must be used within a TabBarProvider');
    }
    return context;
};

interface TabBarProviderProps {
    children: ReactNode;
    defaultStyle: ViewStyle;
}

export const TabBarProvider: React.FC<TabBarProviderProps> = ({ children, defaultStyle }) => {
    const [isVisible, setIsVisible] = useState(true);
    const slideAnim = useRef(new Animated.Value(0)).current;

    const showTabBar = useCallback(() => {
        setIsVisible(true);
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11
        }).start();
    }, [slideAnim]);

    const hideTabBar = useCallback(() => {
        setIsVisible(false);
        Animated.spring(slideAnim, {
            toValue: 100,
            useNativeDriver: true,
            tension: 65,
            friction: 11
        }).start();
    }, [slideAnim]);

    const tabBarStyle = useCallback(() => {
        return {
            ...defaultStyle,
            transform: [{ translateY: slideAnim }],
        };
    }, [defaultStyle, slideAnim]);

    const value = {
        isVisible,
        showTabBar,
        hideTabBar,
        tabBarStyle: tabBarStyle()
    };

    return <TabBarContext.Provider value={value}>{children}</TabBarContext.Provider>;
};