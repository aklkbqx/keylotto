// libs/config/fontConfig.ts
import {
    Kanit_200ExtraLight,
    Kanit_200ExtraLight_Italic,
    Kanit_300Light,
    Kanit_300Light_Italic,
    Kanit_400Regular,
    Kanit_400Regular_Italic,
    Kanit_500Medium,
    Kanit_500Medium_Italic,
    Kanit_600SemiBold,
    Kanit_600SemiBold_Italic,
    Kanit_700Bold,
    Kanit_700Bold_Italic,
    Kanit_800ExtraBold,
    Kanit_800ExtraBold_Italic,
    Kanit_900Black,
    Kanit_900Black_Italic
} from '@expo-google-fonts/kanit';

import {
    Aboreto_400Regular
} from '@expo-google-fonts/aboreto';

import type { FontConfig } from '../stores/fontStore';

/**
 * Font configuration for the application
 * 
 * To add a new font:
 * 1. Install the font: expo install @expo-google-fonts/your-font
 * 2. Import the font variants here
 * 3. Add to fontAssets object
 * 4. Update fontConfig if you want to change the primary font
 */

// Font assets to be loaded
export const fontAssets = {
    // Kanit fonts (primary)
    'Kanit-ExtraLight': Kanit_200ExtraLight,
    'Kanit-Light': Kanit_300Light,
    'Kanit-Regular': Kanit_400Regular,
    'Kanit-Medium': Kanit_500Medium,
    'Kanit-SemiBold': Kanit_600SemiBold,
    'Kanit-Bold': Kanit_700Bold,
    'Kanit-ExtraBold': Kanit_800ExtraBold,
    'Kanit-Black': Kanit_900Black,
    'Kanit-ExtraLightItalic': Kanit_200ExtraLight_Italic,
    'Kanit-LightItalic': Kanit_300Light_Italic,
    'Kanit-Italic': Kanit_400Regular_Italic,
    'Kanit-MediumItalic': Kanit_500Medium_Italic,
    'Kanit-SemiBoldItalic': Kanit_600SemiBold_Italic,
    'Kanit-BoldItalic': Kanit_700Bold_Italic,
    'Kanit-ExtraBoldItalic': Kanit_800ExtraBold_Italic,
    'Kanit-BlackItalic': Kanit_900Black_Italic,
    
    // Special fonts
    'Aboreto-Regular': Aboreto_400Regular,
} as const;

// Primary font configuration (used by Text component)
export const fontConfig: FontConfig = {
    fontFamily: 'Kanit',
    weights: {
        extralight: 'Kanit-ExtraLight',
        light: 'Kanit-Light',
        regular: 'Kanit-Regular',
        medium: 'Kanit-Medium',
        semibold: 'Kanit-SemiBold',
        bold: 'Kanit-Bold',
        extrabold: 'Kanit-ExtraBold',
        black: 'Kanit-Black',
    },
    italics: {
        extralight: 'Kanit-ExtraLightItalic',
        light: 'Kanit-LightItalic',
        regular: 'Kanit-Italic',
        medium: 'Kanit-MediumItalic',
        semibold: 'Kanit-SemiBoldItalic',
        bold: 'Kanit-BoldItalic',
        extrabold: 'Kanit-ExtraBoldItalic',
        black: 'Kanit-BlackItalic',
    }
};

// Special font mappings for specific use cases
export const specialFonts = {
    astrology: 'Aboreto-Regular',
    // Add more special fonts here as needed
    // logo: 'SomeOtherFont-Regular',
    // heading: 'AnotherFont-Bold',
} as const;

export type SpecialFontKey = keyof typeof specialFonts;
