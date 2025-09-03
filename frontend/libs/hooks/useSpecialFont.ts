// libs/hooks/useSpecialFont.ts
import useFontStore from '../stores/fontStore';
import { specialFonts, type SpecialFontKey } from '../config/fontConfig';

/**
 * Hook to get special font family names
 * 
 * @param fontKey - Key from specialFonts configuration
 * @returns Object with fontFamily and fontsLoaded status
 * 
 * Example usage:
 * ```tsx
 * const { fontFamily, fontsLoaded } = useSpecialFont('astrology');
 * 
 * <Text style={{ fontFamily }}>
 *   ASTROLOGY
 * </Text>
 * ```
 */
const useSpecialFont = (fontKey: SpecialFontKey) => {
  const { fontsLoaded } = useFontStore();
  
  const fontFamily = specialFonts[fontKey];
  
  return {
    fontFamily: fontsLoaded ? fontFamily : 'system-ui',
    fontsLoaded,
    availableFonts: specialFonts
  };
};

export default useSpecialFont;
