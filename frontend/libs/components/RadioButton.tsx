import React from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import tw from '@/libs/constants/twrnc';
import { useTheme } from '@/libs/providers/ThemeProvider';
import Text from './Text';
import AnimatedView from './AnimatedView';
import { Ionicons } from '@expo/vector-icons';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface RadioButtonProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  variant?: 'agent' | 'admin' | 'unit' | 'regional';
  type?: 'default' | 'card' | 'inline';
  style?: ViewStyle;
}

const RadioButton: React.FC<RadioButtonProps> = ({
  options,
  value,
  onChange,
  variant = 'agent',
  type = 'default',
  style,
}) => {
  const { palette } = useTheme();

  const renderDefaultRadio = (option: RadioOption) => {
    const isSelected = value === option.value;
    
    return (
      <TouchableOpacity
        key={option.value}
        onPress={() => onChange(option.value)}
        style={tw`flex-row items-center py-3`}
      >
        <View
          style={[
            tw`w-5 h-5 rounded-full border-2 items-center justify-center`,
            {
              borderColor: isSelected ? palette.primary : String(tw.color('gray-300')),
            },
          ]}
        >
          {isSelected && (
            <AnimatedView
              startScale={0}
              endScale={1}
              duration={200}
            >
              <View
                style={[
                  tw`w-3 h-3 rounded-full`,
                  { backgroundColor: palette.primary },
                ]}
              />
            </AnimatedView>
          )}
        </View>
        
        <View style={tw`ml-3 flex-1`}>
          <Text size="base">
            {option.label}
          </Text>
          {option.description && (
            <Text size="sm">
              {option.description}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCardRadio = (option: RadioOption) => {
    const isSelected = value === option.value;
    
    return (
      <TouchableOpacity
        key={option.value}
        onPress={() => onChange(option.value)}
        style={[
          tw`p-4 rounded-xl border-2 mb-3`,
          {
            borderColor: isSelected ? palette.primary : String(tw.color('gray-200')),
            backgroundColor: isSelected ? `${palette.primary}10` : String(tw.color('white')),
          },
        ]}
      >
        <View style={tw`flex-row items-start`}>
          {option.icon && (
            <View
              style={[
                tw`w-10 h-10 rounded-lg items-center justify-center mr-3`,
                {
                  backgroundColor: isSelected ? palette.primary : String(tw.color('gray-100')),
                },
              ]}
            >
              <Ionicons
                name={option.icon}
                size={20}
                color={isSelected ? String(tw.color('white')) : String(tw.color('gray-600'))}
              />
            </View>
          )}
          
          <View style={tw`flex-1`}>
            <Text
              size="base"
              weight={isSelected ? 'semibold' : 'medium'}
              color={isSelected ? palette.primary : String(tw.color('gray-900'))}
            >
              {option.label}
            </Text>
            {option.description && (
              <Text size="sm" color={String(tw.color('gray-600'))} style={tw`mt-1`}>
                {option.description}
              </Text>
            )}
          </View>

          <View
            style={[
              tw`w-5 h-5 rounded-full border-2 items-center justify-center`,
              {
                borderColor: isSelected ? palette.primary : String(tw.color('gray-300')),
              },
            ]}
          >
            {isSelected && (
              <View
                style={[
                  tw`w-3 h-3 rounded-full`,
                  { backgroundColor: palette.primary },
                ]}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderInlineRadio = (option: RadioOption) => {
    const isSelected = value === option.value;
    
    return (
      <TouchableOpacity
        key={option.value}
        onPress={() => onChange(option.value)}
        style={[
          tw`px-4 py-2 rounded-full border mr-2 mb-2`,
          {
            borderColor: isSelected ? palette.primary : String(tw.color('gray-300')),
            backgroundColor: isSelected ? palette.primary : String(tw.color('white')),
          },
        ]}
      >
        <Text
          size="sm"
          weight="medium"
          color={isSelected ? String(tw.color('white')) : String(tw.color('gray-700'))}
        >
          {option.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={style}>
      {type === 'inline' ? (
        <View style={tw`flex-row flex-wrap`}>
          {options.map(renderInlineRadio)}
        </View>
      ) : (
        <>
          {options.map(type === 'card' ? renderCardRadio : renderDefaultRadio)}
        </>
      )}
    </View>
  );
};

export default RadioButton;