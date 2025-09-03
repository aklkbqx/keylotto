import React from 'react';
import { View, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolate,
} from 'react-native-reanimated';
import tw from '@/libs/constants/twrnc';
import { useTheme } from '@/libs/providers/ThemeProvider';

interface SkeletonTheme {
    backgroundColor: string;
    highlightColor: string;
    speed: number;
}

interface SkeletonProps {
    width?: DimensionValue;
    height?: DimensionValue;
    borderRadius?: number;
    style?: ViewStyle;
    theme?: Partial<SkeletonTheme>;
    isLoading?: boolean;
    children?: React.ReactNode;
    shimmer?: boolean;
    duration?: number;
}

const useDefaultSkeletonTheme = (): SkeletonTheme => {
    const { palette } = useTheme();
    return {
        backgroundColor: String(tw.color('gray-200')),
        highlightColor: String(tw.color('gray-100')),
        speed: 1000,
    };
};

const SkeletonBase: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius = 4,
    style,
    theme = {},
    isLoading = true,
    children,
    shimmer = true,
    duration,
}) => {
    const defaults = useDefaultSkeletonTheme();
    const finalTheme = { ...defaults, ...theme };
    const animationDuration = duration || finalTheme.speed;

    const shimmerValue = useSharedValue(0);

    React.useEffect(() => {
        if (isLoading && shimmer) {
            shimmerValue.value = withRepeat(
                withTiming(1, { duration: animationDuration }),
                -1,
                false
            );
        } else {
            shimmerValue.value = 0;
        }
    }, [isLoading, shimmer, animationDuration, shimmerValue]);

    const animatedStyle = useAnimatedStyle(() => {
        if (!shimmer || !isLoading) {
            return {
                backgroundColor: finalTheme.backgroundColor,
            };
        }

        const interpolatedColor = interpolate(
            shimmerValue.value,
            [0, 0.5, 1],
            [0, 1, 0]
        );

        // สร้าง shimmer effect โดยการ mix สี
        const alpha = interpolatedColor * 0.6 + 0.4;

        return {
            backgroundColor: finalTheme.backgroundColor,
            opacity: alpha,
        };
    });

    if (!isLoading && children) {
        return <>{children}</>;
    }

    if (!isLoading) {
        return null;
    }

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                },
                animatedStyle,
                style,
            ]}
        />
    );
};

// Skeleton.Box - สำหรับ box ทั่วไป
interface BoxProps {
    width?: DimensionValue;
    height?: DimensionValue;
    radius?: number;
    style?: ViewStyle;
}

const Box: React.FC<BoxProps> = ({ width = '100%', height = 100, radius = 8, style }) => (
    <SkeletonBase width={width} height={height} borderRadius={radius} style={style} />
);

// Skeleton.Text - สำหรับข้อความ
interface TextProps {
    lines?: number;
    width?: DimensionValue | DimensionValue[];
    height?: number;
    spacing?: number;
    style?: ViewStyle;
}

const Text: React.FC<TextProps> = ({ 
    lines = 1, 
    width = '100%', 
    height = 16,
    spacing = 8,
    style 
}) => {
    const widths = Array.isArray(width) ? width : Array(lines).fill(width);
    
    return (
        <View style={style}>
            {Array.from({ length: lines }).map((_, index) => (
                <SkeletonBase
                    key={index}
                    width={widths[index] || widths[0]}
                    height={height}
                    borderRadius={4}
                    style={index > 0 ? { marginTop: spacing } : undefined}
                />
            ))}
        </View>
    );
};

// Skeleton.Circle - สำหรับรูปวงกลม
interface CircleProps {
    size?: number;
    style?: ViewStyle;
}

const Circle: React.FC<CircleProps> = ({ size = 50, style }) => (
    <SkeletonBase width={size} height={size} borderRadius={size / 2} style={style} />
);

// Skeleton.Card - สำหรับ card
interface CardProps {
    width?: DimensionValue;
    height?: DimensionValue;
    imageHeight?: number;
    showImage?: boolean;
    lines?: number;
    padding?: number;
    radius?: number;
    style?: ViewStyle;
}

const Card: React.FC<CardProps> = ({ 
    width = '100%', 
    height = 'auto',
    imageHeight = 200,
    showImage = true,
    lines = 3,
    padding = 16,
    radius = 12,
    style 
}) => (
    <View style={[tw`bg-white overflow-hidden`, { width, height, borderRadius: radius }, style]}>
        {showImage && (
            <SkeletonBase width="100%" height={imageHeight} borderRadius={0} />
        )}
        <View style={{ padding }}>
            <Text lines={lines} width={['100%', '80%', '60%']} />
        </View>
    </View>
);

// Skeleton.List - สำหรับ list item
interface ListItemProps {
    avatar?: boolean;
    avatarSize?: number;
    lines?: number;
    rightContent?: React.ReactNode;
    style?: ViewStyle;
}

const ListItem: React.FC<ListItemProps> = ({ 
    avatar = true, 
    avatarSize = 50,
    lines = 2,
    rightContent,
    style 
}) => (
    <View style={[tw`flex-row items-center p-4 bg-white`, style]}>
        {avatar && (
            <Circle size={avatarSize} />
        )}
        <View style={[tw`flex-1`, avatar && tw`ml-3`]}>
            <Text lines={lines} width={['100%', '60%']} />
        </View>
        {rightContent}
    </View>
);

// Skeleton.Button - สำหรับปุ่ม
interface ButtonProps {
    width?: DimensionValue;
    height?: number;
    radius?: number;
    style?: ViewStyle;
}

const Button: React.FC<ButtonProps> = ({ 
    width = 120, 
    height = 44,
    radius = 22,
    style 
}) => (
    <SkeletonBase width={width} height={height} borderRadius={radius} style={style} />
);

// Skeleton.Avatar - สำหรับ avatar พร้อมข้อความ
interface AvatarProps {
    size?: number;
    showName?: boolean;
    showSubtext?: boolean;
    style?: ViewStyle;
}

const Avatar: React.FC<AvatarProps> = ({ 
    size = 60, 
    showName = true,
    showSubtext = true,
    style 
}) => (
    <View style={[tw`items-center`, style]}>
        <Circle size={size} />
        {showName && (
            <View style={tw`mt-2 items-center`}>
                <SkeletonBase width={80} height={16} borderRadius={4} />
                {showSubtext && (
                    <SkeletonBase width={100} height={14} borderRadius={4} style={tw`mt-1`} />
                )}
            </View>
        )}
    </View>
);

// Skeleton.Input - สำหรับ input field
interface InputProps {
    width?: DimensionValue;
    height?: number;
    radius?: number;
    label?: boolean;
    style?: ViewStyle;
}

const Input: React.FC<InputProps> = ({ 
    width = '100%', 
    height = 48,
    radius = 8,
    label = false,
    style 
}) => (
    <View style={style}>
        {label && (
            <SkeletonBase width={100} height={14} borderRadius={4} style={tw`mb-2`} />
        )}
        <SkeletonBase width={width} height={height} borderRadius={radius} />
    </View>
);

// Main Skeleton object with all subcomponents
const Skeleton = {
    Box,
    Text,
    Circle,
    Card,
    ListItem,
    Button,
    Avatar,
    Input,
    Custom: SkeletonBase, // สำหรับกรณีที่ต้องการ customize เอง
};

export default Skeleton;