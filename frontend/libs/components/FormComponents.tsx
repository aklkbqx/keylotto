import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  ViewStyle,
  ActivityIndicator,
  Keyboard,
  TextInput
} from 'react-native';
import tw from '@/libs/constants/twrnc';
import Text from './Text';
import AnimatedView from './AnimatedView';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/libs/providers/ThemeProvider';

// ==================== OTP Input Component ====================
interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  variant?: 'agent' | 'admin' | 'unit' | 'regional';
  error?: boolean;
  autoFocus?: boolean;
  style?: ViewStyle;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 4,
  value,
  onChange,
  variant = 'agent',
  error = false,
  autoFocus = true,
  style,
}) => {
  const { palette } = useTheme();
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const newValue = value.split('');
    newValue[index] = text;
    const updatedValue = newValue.join('');

    onChange(updatedValue.slice(0, length));

    // Auto focus next input
    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={[tw`flex-row justify-center gap-3`, style]}>
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={(ref) => { inputRefs.current[index] = ref || null; }}
          value={value[index] || ''}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
          keyboardType="numeric"
          maxLength={1}
          autoFocus={autoFocus && index === 0}
          style={[
            tw`w-14 h-14 text-center text-2xl font-semibold rounded-xl`,
            {
              borderWidth: 2,
              borderColor: error
                ? String(tw.color('red-500'))
                : value[index]
                  ? palette.primary
                  : String(tw.color('gray-300')),
              backgroundColor: String(tw.color('white')),
              color: error ? String(tw.color('red-600')) : String(tw.color('gray-900')),
            },
          ]}
        />
      ))}
    </View>
  );
};

// ==================== Autocomplete Component ====================
interface AutocompleteOption {
  label: string;
  value: string | number;
  description?: string;
}

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (option: AutocompleteOption) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  variant?: 'agent' | 'admin' | 'unit' | 'regional';
  loading?: boolean;
  error?: string;
  minSearchLength?: number;
  style?: ViewStyle;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  options,
  placeholder = 'ค้นหา...',
  variant = 'agent',
  loading = false,
  error,
  minSearchLength = 1,
  style,
}) => {
  const { palette } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<AutocompleteOption[]>([]);

  useEffect(() => {
    if (value.length >= minSearchLength) {
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(value.toLowerCase()) ||
        option.description?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setShowDropdown(false);
    }
  }, [value, options, minSearchLength]);

  const handleSelect = (option: AutocompleteOption) => {
    onChange(option.label);
    onSelect?.(option);
    setShowDropdown(false);
    Keyboard.dismiss();
  };

  return (
    <View style={[tw`relative`, style]}>
      <View
        style={[
          tw`flex-row items-center rounded-xl px-4`,
          {
            borderWidth: 1,
            borderColor: error
              ? String(tw.color('red-500'))
              : showDropdown
                ? palette.primary
                : String(tw.color('gray-300')),
            backgroundColor: String(tw.color('white')),
          },
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color={String(tw.color('gray-400'))}
        />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={String(tw.color('gray-400'))}
          style={[
            tw`flex-1 py-3 px-3 text-base`,
            { color: String(tw.color('gray-900')) },
          ]}
        />
        {loading && <ActivityIndicator size="small" color={palette.primary} />}
      </View>

      {error && (
        <Text size="sm" color={String(tw.color('red-600'))} style={tw`mt-1`}>
          {error}
        </Text>
      )}

      {showDropdown && (
        <AnimatedView
          startOpacity={0}
          endOpacity={1}
          startTranslateY={-10}
          endTranslateY={0}
          duration={200}
          style={[
            tw`absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg z-50`,
            { maxHeight: 200 },
          ]}
        >
          <ScrollView
            style={tw`rounded-xl`}
            keyboardShouldPersistTaps="handled"
          >
            {filteredOptions.map((option, index) => (
              <TouchableOpacity
                key={`${option.value}-${index}`}
                onPress={() => handleSelect(option)}
                style={[
                  tw`p-4 border-b border-gray-100`,
                  index === filteredOptions.length - 1 && tw`border-b-0`,
                ]}
              >
                <Text size="base" weight="medium" color={String(tw.color('gray-900'))}>
                  {option.label}
                </Text>
                {option.description && (
                  <Text size="sm" color={String(tw.color('gray-500'))} style={tw`mt-0.5`}>
                    {option.description}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </AnimatedView>
      )}
    </View>
  );
};

// ==================== MultiSelect Component ====================
interface MultiSelectOption {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  values: (string | number)[];
  onChange: (values: (string | number)[]) => void;
  placeholder?: string;
  variant?: 'agent' | 'admin' | 'unit' | 'regional';
  maxSelection?: number;
  style?: ViewStyle;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  values,
  onChange,
  placeholder = 'เลือกรายการ...',
  variant = 'agent',
  maxSelection,
  style,
}) => {
  const { palette } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (value: string | number) => {
    if (values.includes(value)) {
      onChange(values.filter(v => v !== value));
    } else if (!maxSelection || values.length < maxSelection) {
      onChange([...values, value]);
    }
  };

  const removeValue = (value: string | number) => {
    onChange(values.filter(v => v !== value));
  };

  const selectedOptions = options.filter(opt => values.includes(opt.value));

  return (
    <View style={style}>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        style={[
          tw`rounded-xl p-3 min-h-[48px]`,
          {
            borderWidth: 1,
            borderColor: String(tw.color('gray-300')),
            backgroundColor: String(tw.color('white')),
          },
        ]}
      >
        {selectedOptions.length > 0 ? (
          <View style={tw`flex-row flex-wrap gap-2`}>
            {selectedOptions.map((option) => (
              <View
                key={option.value}
                style={[
                  tw`flex-row items-center px-3 py-1 rounded-full`,
                  { backgroundColor: `${palette.primary}20` },
                ]}
              >
                {option.icon && (
                  <Ionicons
                    name={option.icon}
                    size={14}
                    color={palette.primary}
                    style={tw`mr-1`}
                  />
                )}
                <Text size="sm" weight="medium" color={palette.primary}>
                  {option.label}
                </Text>
                <TouchableOpacity
                  onPress={() => removeValue(option.value)}
                  style={tw`ml-2`}
                >
                  <Ionicons name="close-circle" size={16} color={palette.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <Text size="base" color={String(tw.color('gray-400'))}>
            {placeholder}
          </Text>
        )}

        <View style={tw`absolute right-3 top-3`}>
          <Ionicons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={20}
            color={String(tw.color('gray-400'))}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
          style={tw`flex-1 bg-black/50 justify-end`}
        >
          <View style={tw`bg-white rounded-t-3xl max-h-[70%]`}>
            <View style={tw`p-4 border-b border-gray-200`}>
              <View style={tw`flex-row items-center justify-between`}>
                <Text size="lg" weight="semibold" color={String(tw.color('gray-900'))}>
                  เลือกรายการ
                </Text>
                <TouchableOpacity onPress={() => setIsOpen(false)}>
                  <Ionicons name="close" size={24} color={String(tw.color('gray-600'))} />
                </TouchableOpacity>
              </View>
              {maxSelection && (
                <Text size="sm" color={String(tw.color('gray-500'))} style={tw`mt-1`}>
                  เลือกได้สูงสุด {maxSelection} รายการ ({values.length}/{maxSelection})
                </Text>
              )}
            </View>

            <ScrollView style={tw`px-4 py-2`}>
              {options.map((option) => {
                const isSelected = values.includes(option.value);
                const isDisabled = !isSelected && maxSelection && values.length >= maxSelection;

                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => !isDisabled && toggleOption(option.value)}
                    disabled={!!isDisabled}
                    style={[
                      tw`flex-row items-center p-4 mb-2 rounded-xl border`,
                      {
                        borderColor: isSelected ? palette.primary : String(tw.color('gray-200')),
                        backgroundColor: isSelected ? `${palette.primary}10` : String(tw.color('white')),
                        opacity: isDisabled ? 0.5 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        tw`w-5 h-5 rounded border-2 mr-3 items-center justify-center`,
                        {
                          borderColor: isSelected ? palette.primary : String(tw.color('gray-300')),
                          backgroundColor: isSelected ? palette.primary : 'transparent',
                        },
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={12} color="white" />
                      )}
                    </View>

                    {option.icon && (
                      <Ionicons
                        name={option.icon}
                        size={20}
                        color={isSelected ? palette.primary : String(tw.color('gray-600'))}
                        style={tw`mr-2`}
                      />
                    )}

                    <Text
                      size="base"
                      weight={isSelected ? 'medium' : 'regular'}
                      color={isSelected ? palette.primary : String(tw.color('gray-900'))}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};