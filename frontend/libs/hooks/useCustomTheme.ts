// libs/hooks/useCustomTheme.ts
import { useTheme } from '../providers/ThemeProvider';
import { type CustomThemeKey } from '../config/themeConfig';

/**
 * Hook to manage custom themes
 * 
 * @returns Object with current custom theme and setter function
 * 
 * Example usage:
 * ```tsx
 * const { customTheme, setCustomTheme, isCustomTheme } = useCustomTheme();
 * 
 * // Switch to astrology theme
 * setCustomTheme('astrology');
 * 
 * // Reset to default theme
 * setCustomTheme(null);
 * 
 * // Check if custom theme is active
 * if (isCustomTheme('astrology')) {
 *   // Do something specific for astrology theme
 * }
 * ```
 */
export const useCustomTheme = () => {
  const { customTheme, setCustomTheme } = useTheme();
  
  const isCustomTheme = (themeKey: CustomThemeKey): boolean => {
    return customTheme === themeKey;
  };
  
  const hasCustomTheme = (): boolean => {
    return customTheme !== null;
  };
  
  const resetTheme = (): void => {
    setCustomTheme(null);
  };
  
  return {
    customTheme,
    setCustomTheme,
    isCustomTheme,
    hasCustomTheme,
    resetTheme,
  };
};

export default useCustomTheme;
