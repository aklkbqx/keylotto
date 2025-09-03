# Font System Documentation

## Overview
The font system in this library provides a flexible way to manage fonts across your React Native Expo/Expo application. It consists of three main parts:

1. **Font Store** - Manages font configuration and state
2. **Text Components** - Generic Text and TextInput components
3. **Font Provider** - Loads and initializes fonts

## Quick Start

### 1. Using the Default Font Provider (Kanit)

The library comes with a default FontProvider that uses the Kanit font family:

```tsx
// app/_layout.tsx
import { FontProvider } from "@/libs/providers/FontProvider";

export default function RootLayout() {
  return (
    <FontProvider>
      <YourApp />
    </FontProvider>
  );
}
```

### 2. Using Text Components

```tsx
import Text from '@/libs/components/Text';
import TextInput from '@/libs/components/TextInput';

// Text component
<Text weight="bold" size="xl" color="#333">
  Hello World
</Text>

// TextInput component
<TextInput 
  placeholder="Enter your name"
  weight="medium"
  size="lg"
/>
```

## Customizing Fonts

### Method 1: Copy and Modify (Recommended)

1. Copy `libs/providers/FontProvider.tsx` to your project's providers folder
2. Install your desired font package:
```bash
expo install @expo-google-fonts/inter
```

3. Modify the FontProvider:
```tsx
// providers/FontProvider.tsx
import {
    useFonts,
    Inter_400Regular,
    Inter_700Bold,
    // ... other weights
} from '@expo-google-fonts/inter';

const fontConfig: FontConfig = {
    fontFamily: 'Inter',
    weights: {
        regular: 'Inter_400Regular',
        bold: 'Inter_700Bold',
        // ... other weights
    }
};

// Update the useFonts hook
const [fontsLoaded, fontError] = useFonts({
    'Inter_400Regular': Inter_400Regular,
    'Inter_700Bold': Inter_700Bold,
    // ... other fonts
});
```

### Method 2: Direct Override

Create your own FontProvider in your project:

```tsx
// providers/MyFontProvider.tsx
import React from 'react';
import { useFonts } from 'expo-font';
import { useInitializeFont } from '@/libs/hooks/useInitializeFont';
import type { FontConfig } from '@/libs/stores/fontStore';

const fontConfig: FontConfig = {
    fontFamily: 'MyCustomFont',
    weights: {
        regular: 'MyFont-Regular',
        bold: 'MyFont-Bold',
    }
};

export const MyFontProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [fontsLoaded, fontError] = useFonts({
        'MyFont-Regular': require('../assets/fonts/MyFont-Regular.ttf'),
        'MyFont-Bold': require('../assets/fonts/MyFont-Bold.ttf'),
    });

    useInitializeFont(fontConfig, fontsLoaded, fontError);
    
    return <>{children}</>;
};
```

## Font Weights

The system supports these font weights:
- `extralight`
- `light`
- `regular` (default)
- `medium`
- `semibold`
- `bold`
- `extrabold`
- `black`

## Font Sizes

Available font sizes:
- `xs` - 12px
- `sm` - 14px
- `base` - 16px (default)
- `lg` - 18px
- `xl` - 20px
- `2xl` - 24px
- `3xl` - 30px
- `4xl` - 36px
- `5xl` - 48px
- `6xl` - 60px
- Custom number (e.g., `size={15}`)

## Advanced Usage

### Custom Font Configuration

```tsx
const fontConfig: FontConfig = {
    fontFamily: 'Roboto',
    weights: {
        light: 'Roboto-Light',
        regular: 'Roboto-Regular',
        medium: 'Roboto-Medium',
        bold: 'Roboto-Bold',
    },
    italics: {
        light: 'Roboto-LightItalic',
        regular: 'Roboto-Italic',
        medium: 'Roboto-MediumItalic',
        bold: 'Roboto-BoldItalic',
    }
};
```

### Using with TypeScript

All components are fully typed. You can import types if needed:

```tsx
import type { TextProps, FontWeight, FontSize } from '@/libs/components/Text';
import type { TextInputProps } from '@/libs/components/TextInput';
import type { FontConfig } from '@/libs/stores/fontStore';
```

## Tips

1. **Performance**: Fonts are loaded asynchronously. The splash screen will automatically hide once fonts are loaded.

2. **Fallback**: If fonts aren't loaded yet, the system falls back to the default system font.

3. **Consistency**: Use the predefined weights and sizes for consistent typography across your app.

4. **Custom Fonts**: When using custom fonts, ensure they're properly included in your project's assets.

## Examples

### Complete Example with Custom Font

```tsx
// providers/AppFontProvider.tsx
import React from 'react';
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useInitializeFont } from '@/libs/hooks/useInitializeFont';
import type { FontConfig } from '@/libs/stores/fontStore';

const fontConfig: FontConfig = {
    fontFamily: 'Poppins',
    weights: {
        regular: 'Poppins_400Regular',
        bold: 'Poppins_700Bold',
    }
};

export const AppFontProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [fontsLoaded, fontError] = useFonts({
        Poppins_400Regular,
        Poppins_700Bold,
    });

    useInitializeFont(fontConfig, fontsLoaded, fontError);
    
    return <>{children}</>;
};

// app/_layout.tsx
import { AppFontProvider } from '@/providers/AppFontProvider';

export default function RootLayout() {
    return (
        <AppFontProvider>
            <Stack />
        </AppFontProvider>
    );
}

// screens/HomeScreen.tsx
import Text from '@/libs/components/Text';

export default function HomeScreen() {
    return (
        <View>
            <Text weight="bold" size="2xl">
                Welcome to My App
            </Text>
            <Text size="base" color="#666">
                Built with custom fonts
            </Text>
        </View>
    );
}
```