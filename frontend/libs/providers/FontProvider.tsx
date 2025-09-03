// libs/providers/FontProvider.tsx
import React from 'react';
import { useFonts } from 'expo-font';
import useInitializeFont from '../hooks/useInitializeFont';
import { fontConfig, fontAssets } from '../config/fontConfig';

/**
 * FontProvider component that loads and initializes fonts for the application
 * 
 * Font configuration is managed in ../config/fontConfig.ts
 * To add new fonts, update the fontConfig.ts file instead of modifying this provider
 */

interface FontProviderProps {
    children: React.ReactNode;
}

const FontProvider: React.FC<FontProviderProps> = ({ children }) => {
    // Load fonts from configuration
    const [fontsLoaded, fontError] = useFonts(fontAssets);

    // Initialize font configuration
    useInitializeFont(fontConfig, fontsLoaded, fontError);

    return <>{children}</>;
};

export default FontProvider