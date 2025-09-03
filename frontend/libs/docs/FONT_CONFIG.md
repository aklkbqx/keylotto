# Font Configuration System

ระบบการจัดการ fonts ในแอปพลิเคชันได้รับการปรับปรุงให้มีการแยก configuration ออกจาก FontProvider เพื่อให้ง่ายต่อการจัดการและขยาย

## โครงสร้างไฟล์

```
libs/
├── config/
│   └── fontConfig.ts          # การกำหนดค่า fonts ทั้งหมด
├── providers/
│   └── FontProvider.tsx       # Provider สำหรับโหลด fonts
├── hooks/
│   ├── useInitializeFont.ts   # Hook สำหรับเริ่มต้น fonts
│   └── useSpecialFont.ts      # Hook สำหรับ special fonts
└── stores/
    └── fontStore.ts           # Store สำหรับจัดการ font state
```

## การใช้งาน

### 1. การเพิ่ม Font ใหม่

แก้ไขไฟล์ `libs/config/fontConfig.ts`:

```typescript
// 1. Install font
// expo install @expo-google-fonts/new-font

// 2. Import font variants
import {
    NewFont_400Regular,
    NewFont_700Bold
} from '@expo-google-fonts/new-font';

// 3. เพิ่มเข้า fontAssets
export const fontAssets = {
    // ... existing fonts
    'NewFont-Regular': NewFont_400Regular,
    'NewFont-Bold': NewFont_700Bold,
} as const;

// 4. เพิ่มเข้า specialFonts (ถ้าจำเป็น)
export const specialFonts = {
    astrology: 'Aboreto-Regular',
    heading: 'NewFont-Bold',  // ตัวอย่าง
} as const;
```

### 2. การใช้ Primary Font (Kanit)

```typescript
import Text from '@/libs/components/Text';

// ใช้ผ่าน Text component (แนะนำ)
<Text size="lg" weight="bold">
  ข้อความภาษาไทย
</Text>
```

### 3. การใช้ Special Fonts

```typescript
import useSpecialFont from '@/libs/hooks/useSpecialFont';

function MyComponent() {
  const { fontFamily } = useSpecialFont('astrology');
  
  return (
    <Text style={{ fontFamily }}>
      ASTROLOGY
    </Text>
  );
}
```

### 4. การใช้ Font โดยตรง

```typescript
import useFontStore from '@/libs/stores/fontStore';

function MyComponent() {
  const { getFontFamily, fontsLoaded } = useFontStore();
  
  const fontFamily = fontsLoaded ? 'Aboreto-Regular' : 'system-ui';
  
  return (
    <Text style={{ fontFamily }}>
      Custom Text
    </Text>
  );
}
```

## Font Assets ที่มี

### Primary Font (Kanit)
- `Kanit-ExtraLight`, `Kanit-ExtraLightItalic`
- `Kanit-Light`, `Kanit-LightItalic`
- `Kanit-Regular`, `Kanit-Italic`
- `Kanit-Medium`, `Kanit-MediumItalic`
- `Kanit-SemiBold`, `Kanit-SemiBoldItalic`
- `Kanit-Bold`, `Kanit-BoldItalic`
- `Kanit-ExtraBold`, `Kanit-ExtraBoldItalic`
- `Kanit-Black`, `Kanit-BlackItalic`

### Special Fonts
- `Aboreto-Regular` (สำหรับข้อความ "ASTROLOGY")

## ตัวอย่างการใช้งาน

### ใช้ในหน้า Login
```typescript
import useSpecialFont from '@/libs/hooks/useSpecialFont';

export default function LoginScreen() {
  const { fontFamily: astrologyFont } = useSpecialFont('astrology');
  
  return (
    <Text style={[styles.title, { fontFamily: astrologyFont }]}>
      ASTROLOGY
    </Text>
  );
}
```

### เพิ่ม Font ใหม่แบบง่าย
```typescript
// เพิ่มใน fontConfig.ts
export const specialFonts = {
  astrology: 'Aboreto-Regular',
  logo: 'SomeFont-Bold',        // ตัวอย่างใหม่
  subtitle: 'AnotherFont-Light' // ตัวอย่างใหม่
} as const;

// ใช้งาน
const { fontFamily } = useSpecialFont('logo');
```

## ข้อดีของระบบใหม่

1. **แยก Configuration**: font config อยู่ในไฟล์เดียว ง่ายต่อการจัดการ
2. **Type Safety**: มี TypeScript types ครบครัน
3. **Reusable**: สามารถใช้ useSpecialFont ได้หลายที่
4. **Maintainable**: ไม่ต้องแก้ไข FontProvider เมื่อเพิ่ม font ใหม่
5. **Fallback Support**: มี fallback font เมื่อ fonts ยังไม่โหลด

## Migration จากระบบเก่า

หากคุณมีโค้ดเก่าที่ใช้ font โดยตรง:

```typescript
// เก่า
const { fontsLoaded } = useFontStore();
const fontFamily = fontsLoaded ? 'Aboreto-Regular' : 'system-ui';

// ใหม่
const { fontFamily } = useSpecialFont('astrology');
```
