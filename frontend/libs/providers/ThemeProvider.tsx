import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { 
    type ThemeMode, 
    type ThemePalette, 
    defaultThemeConfig,
    type CustomThemeKey 
} from '../config/themeConfig';

export interface ThemeContextValue {
    mode: ThemeMode;
    colorScheme: 'light' | 'dark';
    palette: ThemePalette;
    setMode: (mode: ThemeMode) => void;
    setCustomTheme: (themeKey: CustomThemeKey | null) => void;
    customTheme: CustomThemeKey | null;
}

// Export types for external use
export type { ThemeMode, ThemePalette, CustomThemeKey };

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
    defaultMode?: ThemeMode;
    defaultCustomTheme?: CustomThemeKey;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
    children, 
    defaultMode = defaultThemeConfig.defaultMode,
    defaultCustomTheme = null
}) => {
    const [mode, setMode] = useState<ThemeMode>(defaultMode);
    const [customTheme, setCustomTheme] = useState<CustomThemeKey | null>(defaultCustomTheme);
    const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

    useEffect(() => {
        if (defaultThemeConfig.supportSystemTheme) {
            const sub = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(colorScheme));
            return () => sub.remove();
        }
    }, []);

    const effectiveScheme: 'light' | 'dark' = useMemo(() => {
        if (mode === 'system' && defaultThemeConfig.supportSystemTheme) {
            return (systemScheme || 'light') === 'dark' ? 'dark' : 'light';
        }
        return mode === 'system' ? 'light' : mode;
    }, [mode, systemScheme]);

    const palette = useMemo(() => {
        // Use custom theme if set
        if (customTheme && defaultThemeConfig.customThemes[customTheme]) {
            return defaultThemeConfig.customThemes[customTheme][effectiveScheme];
        }
        
        // Use default palettes
        return defaultThemeConfig.palettes[effectiveScheme];
    }, [effectiveScheme, customTheme]);

    const value: ThemeContextValue = {
        mode,
        colorScheme: effectiveScheme,
        palette,
        customTheme,
        setMode,
        setCustomTheme,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider

export const useTheme = (): ThemeContextValue => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
    return ctx;
};

