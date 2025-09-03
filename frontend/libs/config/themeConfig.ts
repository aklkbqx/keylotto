// libs/config/themeConfig.ts
import tw from '@/libs/constants/twrnc';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemePalette {
    primary: string;
    primaryLight: string;
    primaryHover: string;
    primaryActive: string;
    secondary: string;
    secondaryHover: string;
    accent: string;
    accentHover: string;
    background: string;
    backgroundTint: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;
    border: string;
    borderLight: string;
    borderStrong: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
    disabled: string;
    disabledText: string;
}

/**
 * Light theme palette configuration
 */
export const lightPalette: ThemePalette = {
    // Primary (Hope + Wealth)
    primary: String(tw.color('yellow-400')),
    primaryLight: String(tw.color('yellow-200')),
    primaryHover: String(tw.color('yellow-500')),
    primaryActive: String(tw.color('yellow-600')),
    // Secondary (Luck + Fresh)
    secondary: String(tw.color('green-400')),
    secondaryHover: String(tw.color('green-500')),
    // Accent (Playful)
    accent: String(tw.color('purple-500')),
    accentHover: String(tw.color('purple-600')),
    // Neutral baseline
    background: String(tw.color('gray-100')),
    backgroundTint: String(tw.color('gray-50')),
    surface: String(tw.color('white')),
    surfaceAlt: String(tw.color('gray-50')),
    text: String(tw.color('gray-900')),
    textSecondary: String(tw.color('gray-600')),
    textMuted: String(tw.color('gray-500')),
    textInverse: String(tw.color('white')),
    border: String(tw.color('gray-200')),
    borderLight: String(tw.color('gray-100')),
    borderStrong: String(tw.color('gray-300')),
    // Semantic
    success: String(tw.color('green-600')),
    warning: String(tw.color('yellow-600')),
    danger: String(tw.color('red-600')),
    info: String(tw.color('blue-600')),
    disabled: String(tw.color('gray-200')),
    disabledText: String(tw.color('gray-400')),
};

/**
 * Dark theme palette configuration
 */
export const darkPalette: ThemePalette = {
    // Primary retains vibrancy on dark surfaces
    primary: String(tw.color('yellow-400')),
    primaryLight: String(tw.color('yellow-200')),
    primaryHover: String(tw.color('yellow-500')),
    primaryActive: String(tw.color('yellow-600')),
    // Secondary for statuses and highlights
    secondary: String(tw.color('green-400')),
    secondaryHover: String(tw.color('green-500')),
    // Accent for titles/icons
    accent: String(tw.color('purple-500')),
    accentHover: String(tw.color('purple-600')),
    background: String(tw.color('gray-950')),
    backgroundTint: String(tw.color('gray-900')),
    surface: String(tw.color('gray-900')),
    surfaceAlt: String(tw.color('gray-800')),
    text: String(tw.color('gray-100')),
    textSecondary: String(tw.color('gray-300')),
    textMuted: String(tw.color('gray-500')),
    textInverse: String(tw.color('gray-900')),
    border: String(tw.color('gray-800')),
    borderLight: String(tw.color('gray-700')),
    borderStrong: String(tw.color('gray-600')),
    success: String(tw.color('green-500')),
    warning: String(tw.color('yellow-500')),
    danger: String(tw.color('red-500')),
    info: String(tw.color('blue-500')),
    disabled: String(tw.color('gray-800')),
    disabledText: String(tw.color('gray-500')),
};

/**
 * Custom theme variants for specific use cases
 */
export const customThemes = {
    // เพิ่ม theme อื่นๆ ได้ที่นี่
} as const;

export type CustomThemeKey = keyof typeof customThemes;

/**
 * Theme configuration for specific components
 */
export const componentThemes = {
} as const;

/**
 * Default theme configuration
 */
export const defaultThemeConfig = {
    defaultMode: 'dark' as ThemeMode,
    supportSystemTheme: true,
    palettes: {
        light: lightPalette,
        dark: darkPalette,
    },
    customThemes,
    componentThemes,
} as const;
