// libs/components/Text.tsx
import { useTheme } from '@/libs/providers/ThemeProvider';
import useFontStore from '../stores/fontStore';
import React from 'react';
import { Text as RNText, TextStyle, TextProps as RNTextProps } from 'react-native';

export type FontWeight =
    | 'extralight'
    | 'light'
    | 'regular'
    | 'medium'
    | 'semibold'
    | 'bold'
    | 'extrabold'
    | 'black';

export type FontSize =
    | 'xs'    // 12px
    | 'sm'    // 14px
    | 'base'  // 16px
    | 'lg'    // 18px
    | 'xl'    // 20px
    | '2xl'   // 24px
    | '3xl'   // 30px
    | '4xl'   // 36px
    | '5xl'   // 48px
    | '6xl'   // 60px;

export interface TextProps extends RNTextProps {
    weight?: FontWeight;
    size?: FontSize | number;
    color?: string;
    align?: 'left' | 'center' | 'right' | 'justify';
    italic?: boolean;
    children: React.ReactNode;
}

const getFontSize = (size: FontSize | number): number => {
    if (typeof size === 'number') return size;

    const sizeMap: Record<FontSize, number> = {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
        '5xl': 48,
        '6xl': 60,
    };
    return sizeMap[size];
};

const Text: React.FC<TextProps> = ({
    weight = 'regular',
    size = 'base',
    color,
    align = 'left',
    italic = false,
    style,
    children,
    ...props
}) => {
    const { palette } = useTheme();

    const { getFontFamily, fontsLoaded } = useFontStore();

    const textStyle: TextStyle = {
        fontFamily: fontsLoaded ? getFontFamily(weight, italic) : undefined,
        fontSize: getFontSize(size),
        color: color || palette.text,
        textAlign: align,
    };

    // Filter out custom props before passing to RNText
    const {
        weight: _weight,
        size: _size,
        color: _color,
        align: _align,
        italic: _italic,
        ...restProps
    } = props as any;

    return (
        <RNText
            style={[textStyle, style]}
            {...restProps}
        >
            {children}
        </RNText>
    );
};

export default Text