// libs/hooks/useThemeColors.ts
import { useTheme } from '../providers/ThemeProvider';
import { componentThemes } from '../config/themeConfig';

/**
 * Hook to get specific theme colors
 * 
 * @returns Object with commonly used colors
 * 
 * Example usage:
 * ```tsx
 * const colors = useThemeColors();
 * 
 * <View style={{ backgroundColor: colors.background }}>
 *   <Text style={{ color: colors.text }}>Hello</Text>
 * </View>
 * ```
 */
export const useThemeColors = () => {
  const { palette } = useTheme();
  
  return {
    // Background colors
    background: palette.background,
    surface: palette.surface,
    
    // Text colors
    text: palette.text,
    textSecondary: palette.textSecondary,
    textMuted: palette.textMuted,
    
    // Brand colors
    primary: palette.primary,
    primaryLight: palette.primaryLight,
    secondary: palette.secondary,
    accent: palette.accent,
    
    // Border colors
    border: palette.border,
    borderLight: palette.borderLight,
    
    // Status colors
    success: palette.success,
    warning: palette.warning,
    danger: palette.danger,
    info: palette.info,
    
    // Full palette access
    palette,
  };
};

/**
 * Hook to get component-specific theme colors
 * 
 * @param component - Component name from componentThemes
 * @returns Component-specific theme colors
 * 
 * Example usage:
 * ```tsx
 * const buttonTheme = useComponentTheme('button');
 * 
 * <TouchableOpacity style={{ backgroundColor: buttonTheme.primary.background }}>
 *   <Text style={{ color: buttonTheme.primary.text }}>Button</Text>
 * </TouchableOpacity>
 * ```
 */
export const useComponentTheme = <T extends keyof typeof componentThemes>(
  component: T
): typeof componentThemes[T] => {
  return componentThemes[component];
};

/**
 * Hook to check if current theme is dark
 * 
 * @returns boolean indicating if current theme is dark
 */
export const useIsDark = (): boolean => {
  const { colorScheme } = useTheme();
  return colorScheme === 'dark';
};

/**
 * Hook to get theme-aware styles
 * 
 * @param lightStyle - Style object for light theme
 * @param darkStyle - Style object for dark theme
 * @returns Style object based on current theme
 * 
 * Example usage:
 * ```tsx
 * const containerStyle = useThemeStyle(
 *   { backgroundColor: '#fff' },
 *   { backgroundColor: '#000' }
 * );
 * ```
 */
export const useThemeStyle = <T>(lightStyle: T, darkStyle: T): T => {
  const isDark = useIsDark();
  return isDark ? darkStyle : lightStyle;
};
