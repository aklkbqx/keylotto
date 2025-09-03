// libs/stores/fontStore.ts
import { create } from 'zustand';

export interface FontConfig {
  fontFamily: string;
  weights: {
    extralight?: string;
    light?: string;
    regular: string;
    medium?: string;
    semibold?: string;
    bold?: string;
    extrabold?: string;
    black?: string;
  };
  italics?: {
    extralight?: string;
    light?: string;
    regular?: string;
    medium?: string;
    semibold?: string;
    bold?: string;
    extrabold?: string;
    black?: string;
  };
}

interface FontState {
  // Current font configuration
  fontConfig: FontConfig | null;
  fontsLoaded: boolean;

  // Actions
  setFontConfig: (config: FontConfig) => void;
  setFontsLoaded: (loaded: boolean) => void;
  getFontFamily: (weight: string, italic?: boolean) => string;
}

// Default system font
const defaultFontConfig: FontConfig = {
  fontFamily: 'System',
  weights: {
    regular: 'system-ui',
  }
};

const useFontStore = create<FontState>((set, get) => ({
  fontConfig: null,
  fontsLoaded: false,

  setFontConfig: (config) => set({ fontConfig: config }),

  setFontsLoaded: (loaded) => set({ fontsLoaded: loaded }),

  getFontFamily: (weight = 'regular', italic = false) => {
    const { fontConfig, fontsLoaded } = get();

    if (!fontsLoaded || !fontConfig) {
      return defaultFontConfig.weights.regular;
    }

    if (italic && fontConfig.italics) {
      return fontConfig.italics[weight as keyof typeof fontConfig.italics] ||
        fontConfig.weights[weight as keyof typeof fontConfig.weights] ||
        fontConfig.weights.regular;
    }

    return fontConfig.weights[weight as keyof typeof fontConfig.weights] ||
      fontConfig.weights.regular;
  }
}));

export default useFontStore