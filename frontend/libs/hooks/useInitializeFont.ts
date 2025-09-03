// libs/hooks/useInitializeFont.ts
import { useEffect } from 'react';
import useFontStore from '../stores/fontStore';
import type { FontConfig } from '../stores/fontStore';
import * as SplashScreen from 'expo-splash-screen';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

/**
 * Hook to initialize font configuration for the app
 * @param fontConfig - Font configuration object
 * @param fontsLoaded - Whether fonts are loaded (from expo-font)
 * @param fontError - Font loading error (if any)
 */
const useInitializeFont = (
  fontConfig: FontConfig,
  fontsLoaded: boolean,
  fontError?: Error | null
) => {
  const { setFontConfig, setFontsLoaded } = useFontStore();

  useEffect(() => {
    if (fontConfig) {
      setFontConfig(fontConfig);
    }
  }, [fontConfig, setFontConfig]);

  useEffect(() => {
    setFontsLoaded(fontsLoaded);
  }, [fontsLoaded, setFontsLoaded]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  return { fontsLoaded, fontError };
};

export default useInitializeFont