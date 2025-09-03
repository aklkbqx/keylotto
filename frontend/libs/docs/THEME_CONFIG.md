# Theme Configuration System

ระบบการจัดการ themes ในแอปพลิเคชันได้รับการปรับปรุงให้มีการแยก configuration ออกจาก ThemeProvider เพื่อให้ง่ายต่อการจัดการและขยาย

## โครงสร้างไฟล์

```
libs/
├── config/
│   └── themeConfig.ts         # การกำหนดค่า themes ทั้งหมด
├── providers/
│   └── ThemeProvider.tsx      # Provider สำหรับจัดการ theme state
├── hooks/
│   ├── useThemeColors.ts      # Hook สำหรับเข้าถึงสีต่างๆ
│   └── useCustomTheme.ts      # Hook สำหรับจัดการ custom themes
└── stores/ (ถ้าจำเป็น)
```

## การใช้งาน

### 1. การใช้ Theme Colors แบบง่าย

```typescript
import { useThemeColors } from '@/libs/hooks/useThemeColors';

function MyComponent() {
  const colors = useThemeColors();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Hello World</Text>
      <Text style={{ color: colors.textSecondary }}>Subtitle</Text>
    </View>
  );
}
```

### 2. การใช้ Theme Provider

```typescript
// app/_layout.tsx
import ThemeProvider from '@/libs/providers/ThemeProvider';

export default function RootLayout() {
  return (
    <ThemeProvider 
      defaultMode="dark" 
      defaultCustomTheme="astrology"
    >
      <App />
    </ThemeProvider>
  );
}
```

### 3. การใช้ Custom Themes

```typescript
import useCustomTheme from '@/libs/hooks/useCustomTheme';

function ThemeSelector() {
  const { customTheme, setCustomTheme, isCustomTheme } = useCustomTheme();
  
  return (
    <View>
      <Button 
        title="Astrology Theme"
        onPress={() => setCustomTheme('astrology')}
        style={isCustomTheme('astrology') ? styles.active : styles.inactive}
      />
      <Button 
        title="Default Theme"
        onPress={() => setCustomTheme(null)}
      />
    </View>
  );
}
```

### 4. การใช้ Component Themes

```typescript
import { useComponentTheme } from '@/libs/hooks/useThemeColors';

function MyButton({ variant = 'primary' }) {
  const buttonTheme = useComponentTheme('button');
  const themeColors = buttonTheme[variant];
  
  return (
    <TouchableOpacity 
      style={{
        backgroundColor: themeColors.background,
        borderColor: themeColors.border,
      }}
    >
      <Text style={{ color: themeColors.text }}>
        Button
      </Text>
    </TouchableOpacity>
  );
}
```

### 5. การใช้ Theme-aware Styles

```typescript
import { useThemeStyle, useIsDark } from '@/libs/hooks/useThemeColors';

function MyComponent() {
  const isDark = useIsDark();
  
  const containerStyle = useThemeStyle(
    { backgroundColor: '#fff', shadowColor: '#000' },
    { backgroundColor: '#000', shadowColor: '#fff' }
  );
  
  return (
    <View style={containerStyle}>
      <Text>Current theme: {isDark ? 'Dark' : 'Light'}</Text>
    </View>
  );
}
```

## การเพิ่ม Theme ใหม่

### 1. เพิ่ม Custom Theme

แก้ไขไฟล์ `libs/config/themeConfig.ts`:

```typescript
export const customThemes = {
  astrology: {
    light: { /* ... */ },
    dark: { /* ... */ }
  },
  business: {  // ตัวอย่างใหม่
    light: {
      ...lightPalette,
      primary: String(tw.color('blue-600')),
      accent: String(tw.color('gray-500')),
    },
    dark: {
      ...darkPalette,
      primary: String(tw.color('blue-500')),
      accent: String(tw.color('gray-400')),
    }
  }
} as const;
```

### 2. เพิ่ม Component Theme

```typescript
export const componentThemes = {
  button: { /* existing */ },
  card: {  // ตัวอย่างใหม่
    default: {
      background: lightPalette.surface,
      border: lightPalette.border,
      shadow: lightPalette.textMuted,
    },
    elevated: {
      background: lightPalette.surface,
      border: 'transparent',
      shadow: lightPalette.text,
    }
  }
} as const;
```

## Available Colors

### Primary Palette
- `primary`, `primaryLight`
- `secondary`, `accent`
- `background`, `surface`

### Text Colors
- `text` - Primary text
- `textSecondary` - Secondary text
- `textMuted` - Muted/disabled text

### Border Colors
- `border` - Default border
- `borderLight` - Light border

### Status Colors
- `success`, `warning`, `danger`, `info`

## Available Themes

### Default Themes
- **Light Theme**: สีสว่าง เหมาะสำหรับใช้งานกลางวัน
- **Dark Theme**: สีเข้ม เหมาะสำหรับใช้งานกลางคืน

### Custom Themes
- **Astrology Theme**: สำหรับแอป astrology มีสี purple/indigo

## Migration จากระบบเก่า

```typescript
// เก่า
import { useTheme } from '@/libs/providers/ThemeProvider';
const { palette } = useTheme();
const textColor = palette.text;

// ใหม่ (แนะนำ)
import { useThemeColors } from '@/libs/hooks/useThemeColors';
const { text } = useThemeColors();

// หรือยังใช้แบบเก่าได้
import { useTheme } from '@/libs/providers/ThemeProvider';
const { palette } = useTheme();
const textColor = palette.text;
```

## Best Practices

1. **ใช้ useThemeColors**: สำหรับการเข้าถึงสีแบบง่าย
2. **ใช้ useComponentTheme**: สำหรับ component ที่มี theme เฉพาะ
3. **ใช้ useThemeStyle**: สำหรับ style ที่แตกต่างกันระหว่าง light/dark
4. **ใช้ Custom Themes**: สำหรับ branding หรือ context เฉพาะ
5. **แยก theme config**: อย่าใส่สีตรงใน component โดยตรง

## ข้อดีของระบบใหม่

1. **แยก Configuration**: theme config อยู่ในไฟล์เดียว
2. **Type Safety**: มี TypeScript types ครบครัน
3. **Flexible**: รองรับ custom themes หลายแบบ
4. **Component Themes**: theme เฉพาะสำหรับ component
5. **Easy Migration**: ยังใช้ API เก่าได้
6. **Better Organization**: hooks แยกตามการใช้งาน
