// libs/components/Select.tsx
import React, { useState } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Modal, 
  FlatList,
  ScrollView,
} from 'react-native';
import tw from '@/libs/constants/twrnc';
import { useTheme } from '@/libs/providers/ThemeProvider';
import Text from './Text';

export interface SelectOption {
  label: string;
  value: string | number;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  containerStyle?: any;
}

const Select: React.FC<SelectProps> = ({
  label,
  placeholder = '-- เลือก --',
  options,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  required = false,
  containerStyle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { palette } = useTheme();
  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (option: SelectOption) => {
    onChange?.(option.value);
    setIsOpen(false);
  };

  const borderColor = error ? String(tw.color('red-500')) : palette.border;

  return (
    <View style={[containerStyle]}>
      {label && (
        <View style={tw`flex-row mb-2`}>
          <Text size="sm" weight="medium" color={String(tw.color('gray-700'))}>
            {label}
          </Text>
          {required && (
            <Text size="sm" color={String(tw.color('red-500'))}>
              {' *'}
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity
        onPress={() => !disabled && setIsOpen(true)}
        style={[
          tw`border rounded-lg px-4 py-3 flex-row items-center justify-between`,
          { backgroundColor: palette.surface },
          { borderColor },
          disabled && { backgroundColor: String(tw.color('gray-100')) },
        ]}
      >
        <Text color={selectedOption ? palette.text : String(tw.color('gray-400'))}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        
        <View style={tw`ml-2`}>
          <Text color={palette.textSecondary}>
            ▼
          </Text>
        </View>
      </TouchableOpacity>

      {(error || helperText) && (
        <View style={tw`mt-1`}>
          {error && (
            <Text size="xs" color={String(tw.color('red-500'))}>
              {error}
            </Text>
          )}
          {helperText && !error && (
            <Text size="xs" color={String(tw.color('gray-500'))}>
              {helperText}
            </Text>
          )}
        </View>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity 
          style={tw`flex-1 bg-black bg-opacity-50 justify-end`}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={[tw`rounded-t-3xl max-h-96`, { backgroundColor: palette.surface }]}>
            <View style={[tw`p-4`, { borderBottomWidth: 1, borderBottomColor: palette.border }]}>
              <View style={[tw`w-12 h-1 rounded-full mx-auto mb-3`, { backgroundColor: String(tw.color('gray-300')) }]} />
              <Text size="lg" weight="semibold" align="center">
                {label || 'เลือกรายการ'}
              </Text>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  style={[
                    tw`p-4 flex-row items-center justify-between`,
                    item.value === value && { backgroundColor: String(tw.color('red-50')) },
                  ]}
                >
                  <Text 
                    color={item.value === value ? String(tw.color('red-600')) : palette.text}
                    weight={item.value === value ? 'medium' : 'regular'}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <View style={[tw`w-5 h-5 rounded-full items-center justify-center`, { backgroundColor: String(tw.color('red-600')) }]}>
                      <Text size="xs" color={String(tw.color('white'))}>
                        ✓
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: String(tw.color('gray-100')) }} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default Select;