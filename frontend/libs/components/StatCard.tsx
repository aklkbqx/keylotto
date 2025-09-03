// libs/components/StatCard.tsx
import React from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '@/libs/constants/twrnc';
import { useTheme } from '@/libs/providers/ThemeProvider';
import Text from './Text';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  percentage?: number;
  trend?: 'up' | 'down';
  icon?: React.ReactNode;
  iconBgColor?: string;
  gradientColors?: [string, string];
  onPress?: () => void;
  style?: ViewStyle;
  floating?: boolean;
  variant?: 'agent' | 'admin' | 'unit' | 'regional';
  useRoleGradient?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  percentage,
  trend,
  icon,
  iconBgColor,
  gradientColors,
  onPress,
  style,
  floating = false,
  variant = 'agent',
  useRoleGradient = false,
}) => {
  const { palette } = useTheme();
  const finalGradientColors = useRoleGradient ? [palette.primary, palette.primaryLight] as [string, string] : gradientColors;
  const finalIconBgColor = iconBgColor || palette.primary;
  const content = (
    <View style={tw`p-4`}>
      <View style={tw`flex-row items-center justify-between`}>
        <View style={tw`flex-1`}>
          <Text size="sm" color={finalGradientColors ? String(tw.color('white')) : String(tw.color('gray-600'))}>
            {title}
          </Text>
          <Text 
            size="2xl" 
            weight="bold" 
            color={finalGradientColors ? String(tw.color('white')) : String(tw.color('gray-900'))}
          >
            {value}
          </Text>
          {subtitle && (
            <Text 
              size="xs" 
              color={finalGradientColors ? String(tw.color('white/80')) : String(tw.color('gray-500'))}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {icon && (
          <View 
            style={[
              tw`w-12 h-12 rounded-xl items-center justify-center`,
              finalGradientColors ? tw`bg-white/20` : { backgroundColor: finalIconBgColor + '20' }
            ]}
          >
            {icon}
          </View>
        )}
      </View>

      {percentage !== undefined && (
        <View style={tw`flex-row items-center mt-2`}>
          <View 
            style={[
              tw`px-2 py-1 rounded-full flex-row items-center`,
              trend === 'up' ? tw`bg-green-100` : tw`bg-red-100`
            ]}
          >
            <Ionicons 
              name={trend === 'up' ? 'trending-up' : 'trending-down'} 
              size={12} 
              color={trend === 'up' ? String(tw.color('green-600')) : String(tw.color('red-600'))}
              style={tw`mr-1`}
            />
            <Text 
              size="xs" 
              weight="medium"
              color={trend === 'up' ? String(tw.color('green-600')) : String(tw.color('red-600'))}
            >
              {Math.abs(percentage)}%
            </Text>
          </View>
          <Text 
            size="xs" 
            color={finalGradientColors ? String(tw.color('white/70')) : String(tw.color('gray-500'))}
            style={tw`ml-2`}
          >
            จากเดือนที่แล้ว
          </Text>
        </View>
      )}
    </View>
  );

  const cardStyle = [
    tw`rounded-xl overflow-hidden`,
    floating && {
      shadowColor: String(tw.color('black')),
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
    style
  ];

  if (finalGradientColors) {
    return (
      <TouchableOpacity 
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={onPress ? 0.8 : 1}
        style={cardStyle}
      >
        <LinearGradient
          colors={finalGradientColors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[{ backgroundColor: 'white', borderWidth: 1, borderColor: String(tw.color('gray-100')) }, ...cardStyle]}
    >
      {content}
    </TouchableOpacity>
  );
};

export default StatCard;