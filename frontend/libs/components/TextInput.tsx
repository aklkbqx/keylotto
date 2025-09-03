// libs/components/TextInput.tsx
import useFontStore from '../stores/fontStore';
import React from 'react';
import { TextInput as RNTextInput, TextStyle, TextInputProps as RNTextInputProps, ViewStyle, View, Platform, TouchableOpacity } from 'react-native';
import Text,{ FontWeight, FontSize } from './Text';
import tw from '@/libs/constants/twrnc';
import { useTheme } from '@/libs/providers/ThemeProvider';

// Custom debounce function
interface DebouncedFunction<T extends (...args: any[]) => any> {
    (...args: Parameters<T>): void;
    cancel: () => void;
}

function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
): DebouncedFunction<T> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const debouncedFunc = (...args: Parameters<T>) => {
        // Clear previous timeout
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // Set new timeout
        timeoutId = setTimeout(() => {
            func(...args);
            timeoutId = null;
        }, delay);
    };

    // Add cancel method
    debouncedFunc.cancel = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };

    return debouncedFunc as DebouncedFunction<T>;
}

export interface TextInputProps extends Omit<RNTextInputProps, 'autoComplete' | 'tabIndex'> {
    weight?: FontWeight;
    size?: FontSize | number;
    color?: string;
    placeholderColor?: string;
    align?: 'left' | 'center' | 'right';
    italic?: boolean;

    // Theme Colors
    backgroundColor?: string;
    borderColor?: string;
    borderColorFocused?: string;
    borderColorError?: string;
    shadowColorFocused?: string;
    shadowColorError?: string;
    
    // Theme variant (visual style only)
    variant?: 'default' | 'primary' | 'accent';
    // Deprecated: roleVariant is ignored; keep for compatibility
    roleVariant?: 'agent' | 'admin' | 'unit' | 'regional';
    // Preferred: supply colors directly via theme prop
    theme?: {
        primary?: string;
    };

    // Styling
    containerStyle?: ViewStyle;
    fieldStyle?: TextStyle;

    // Multiline and Auto Height
    multiline?: boolean;
    autoHeight?: boolean;
    maxHeight?: number;

    // Validation and Error Handling
    error?: boolean;
    errorMessage?: string;
    validate?: (value: string) => string | null; // Returns error message or null
    required?: boolean;
    onValidationChange?: (isValid: boolean, errorMessage: string | null) => void; // Callback for validation state

    // Field wrapper
    label?: string;
    labelStyle?: TextStyle;
    labelIcon?: React.ReactNode;
    labelIconPosition?: 'left' | 'right';
    helperText?: string;
    helperTextStyle?: TextStyle;
    errorTextStyle?: TextStyle;

    // Custom validation rules
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    patternErrorMessage?: string;

    // Icon support
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    leftIconPress?: () => void;
    rightIconPress?: () => void;
    iconStyle?: ViewStyle;
    leftIconStyle?: ViewStyle;
    rightIconStyle?: ViewStyle;
    iconColor?: string;
    iconSize?: number;

    // Web-specific props
    onKeyPress?: (e: any) => void;
    onKeyDown?: (e: any) => void;
    onKeyUp?: (e: any) => void;
    autoComplete?: string;
    autoFocus?: boolean;
    spellCheck?: boolean;
    autoCorrect?: boolean;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
    inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
    readOnly?: boolean;
    tabIndex?: number;
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

const getLineHeight = (size: FontSize | number): number => {
    const fontSize = getFontSize(size);
    // Line height = fontSize * 1.4 (เพิ่ม 40% สำหรับความสูงที่เหมาะสม)
    return fontSize * 1.4;
};

// ฟังก์ชันสำหรับสร้าง default container style
const validateField = (
    value: string,
    rules: {
        required?: boolean;
        minLength?: number;
        maxLength?: number;
        pattern?: RegExp;
        patternErrorMessage?: string;
        customValidate?: (value: string) => string | null;
    }
): string | null => {
    const { required, minLength, maxLength, pattern, patternErrorMessage, customValidate } = rules;

    // Required validation
    if (required && (!value || value.trim().length === 0)) {
        return 'ข้อมูลนี้จำเป็นต้องกรอก';
    }

    // Skip other validations if field is empty and not required
    if (!value || value.trim().length === 0) {
        return null;
    }

    // Min length validation
    if (minLength && value.length < minLength) {
        return `ต้องมีอย่างน้อย ${minLength} ตัวอักษร`;
    }

    // Max length validation
    if (maxLength && value.length > maxLength) {
        return `ต้องไม่เกิน ${maxLength} ตัวอักษร`;
    }

    // Pattern validation
    if (pattern && !pattern.test(value)) {
        return patternErrorMessage || 'รูปแบบข้อมูลไม่ถูกต้อง';
    }

    // Custom validation
    if (customValidate) {
        return customValidate(value);
    }

    return null;
};

const TextInput: React.FC<TextInputProps> = ({
    weight = 'regular',
    size = 'base',
    color = String(tw.color('gray-900')),
    placeholderColor = String(tw.color('gray-400')),
    align = 'left',
    italic = false,

    // Theme Colors with default values matching design
    backgroundColor = String(tw.color('white')),
    borderColor = String(tw.color('gray-300')),
    borderColorFocused,
    borderColorError = String(tw.color('red-500')),
    shadowColorFocused,
    shadowColorError = String(tw.color('red-500')),
    
    // Theme variant
    variant = 'default',
    roleVariant,
    theme,

    style,
    containerStyle,
    fieldStyle,
    error = false,
    errorMessage,
    validate,
    required = false,
    onValidationChange,
    label,
    labelStyle,
    labelIcon,
    labelIconPosition = 'left',
    helperText,
    helperTextStyle,
    errorTextStyle,
    minLength,
    maxLength,
    pattern,
    patternErrorMessage,
    onFocus,
    onBlur,
    onChangeText,
    value,
    multiline,
    autoHeight,
    maxHeight = 120, // default max height
    leftIcon,
    rightIcon,
    leftIconPress,
    rightIconPress,
    iconStyle,
    leftIconStyle,
    rightIconStyle,
    iconColor = String(tw.color('gray-600')),
    iconSize = 20,
    onKeyPress,
    onKeyDown,
    onKeyUp,
    autoComplete,
    autoFocus,
    spellCheck,
    autoCorrect,
    autoCapitalize,
    enterKeyHint,
    inputMode,
    readOnly,
    tabIndex,
    ...props
}) => {
    const { getFontFamily, fontsLoaded } = useFontStore();
    const { palette } = useTheme();
    const [isFocused, setIsFocused] = React.useState(false);
    const [internalError, setInternalError] = React.useState<string | null>(null);
    const [touched, setTouched] = React.useState(false);
    const [textHeight, setTextHeight] = React.useState<number>(48); // default height
    const inputRef = React.useRef<RNTextInput>(null);

    // Resolve focus colors from props only (no roles)
    const primaryColor = theme?.primary || palette.primary;
    const finalBorderColorFocused = borderColorFocused || primaryColor;
    const finalShadowColorFocused = shadowColorFocused || primaryColor;

    // Check if running on web
    const isWeb = Platform.OS === 'web';

    // Simplified error handling - show error immediately if provided externally
    const hasError = error || (touched && !!internalError);
    const displayError = errorMessage || (touched && internalError);

    // Function to validate current value
    const performValidation = React.useCallback((currentValue: string) => {
        const validationError = validateField(currentValue, {
            required,
            minLength,
            maxLength,
            pattern,
            patternErrorMessage,
            customValidate: validate,
        });

        setInternalError(validationError);

        // Notify parent about validation state
        if (onValidationChange) {
            onValidationChange(!validationError, validationError);
        }

        return validationError;
    }, [required, minLength, maxLength, pattern, patternErrorMessage, validate, onValidationChange]);

    // Create debounced version of validation function
    const debouncedValidation = React.useMemo(
        () => debounce(performValidation, 500), // 500ms delay
        [performValidation]
    );

    // Cleanup debounced function on unmount
    React.useEffect(() => {
        return () => {
            debouncedValidation.cancel();
        };
    }, [debouncedValidation]);

    // Validate on value change if field has been touched (with debounce)
    React.useEffect(() => {
        if (touched && value !== undefined) {
            debouncedValidation(value);
        }
    }, [value, touched, debouncedValidation]);

    // Web-specific: Focus handling for autoFocus
    React.useEffect(() => {
        if (isWeb && autoFocus && inputRef.current) {
            // Delay focus to ensure component is mounted
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isWeb, autoFocus]);

    const textFieldStyle: TextStyle = {
        fontFamily: fontsLoaded ? getFontFamily(weight, italic) : undefined,
        fontSize: getFontSize(size),
        lineHeight: getLineHeight(size),
        color,
        textAlign: align,
        flex: 1,
        // เพิ่ม properties เพื่อให้ text ดูดีขึ้น
        includeFontPadding: false, // Android only
        textAlignVertical: multiline ? 'top' : 'center', // Android only
        // Auto height for multiline
        ...(multiline && autoHeight && {
            height: Math.min(textHeight, maxHeight),
        }),
        // Web-specific styles
        ...(isWeb && {
            outline: 'none', // Remove default web outline
            border: 'none', // Remove default web border
            background: 'transparent', // Transparent background
            resize: 'none', // Prevent resizing for textarea
            fontFamily: fontsLoaded ? getFontFamily(weight, italic) : 'system-ui, -apple-system, sans-serif',
        })
    };

    // ฟังก์ชันสำหรับสร้าง default container style
    const getDefaultContainerStyle = (isFocused: boolean, hasError?: boolean): ViewStyle => {
        const baseStyle: ViewStyle = {
            backgroundColor: backgroundColor,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: hasError ? borderColorError : isFocused ? finalBorderColorFocused : borderColor,
            paddingHorizontal: 16,
            paddingVertical: multiline ? 12 : 0,
            minHeight: multiline ? 48 : 48,
            flexDirection: 'row',
            alignItems: multiline ? 'flex-start' : 'center',
        };

        if (multiline && autoHeight) {
            baseStyle.height = Math.min(Math.max(textHeight, 48), maxHeight);
        }

        return baseStyle;
    };

    const defaultContainerStyle = getDefaultContainerStyle(isFocused, hasError);

    const handleFocus = (e: any) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        setTouched(true);

        // Cancel any pending debounced validation
        debouncedValidation.cancel();

        // Perform immediate validation on blur if we have a value
        if (value !== undefined) {
            performValidation(value);
        }

        onBlur?.(e);
    };

    const handleChangeText = (text: string) => {
        // Mark as touched when user starts typing
        if (!touched && text.length > 0) {
            setTouched(true);
        }

        // Clear errors when user is typing (optional - can be removed if you want immediate validation)
        if (internalError && !error) {
            setInternalError(null);
        }

        onChangeText?.(text);
    };

    const handleContentSizeChange = (e: any) => {
        if (multiline && autoHeight) {
            const newHeight = e.nativeEvent.contentSize.height;
            setTextHeight(newHeight + 24); // Add padding
        }
    };

    // Web-specific keyboard event handlers
    const handleKeyPress = (e: any) => {
        // Web: Handle Enter key for multiline
        if (isWeb && multiline && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
            // Prevent default Enter behavior for multiline
            e.preventDefault();
        }
        onKeyPress?.(e);
    };

    const handleKeyDown = (e: any) => {
        // Web: Handle Tab key for better navigation
        if (isWeb && e.nativeEvent.key === 'Tab') {
            // Allow default Tab behavior for navigation
        }
        onKeyDown?.(e);
    };

    // Web-specific props object
    const webProps = isWeb ? {
        autoComplete: autoComplete as any,
        spellCheck,
        autoCorrect,
        autoCapitalize,
        enterKeyHint,
        inputMode,
        readOnly,
        tabIndex: tabIndex as any,
        // Web-specific event handlers
        onKeyPress: handleKeyPress,
        onKeyDown: handleKeyDown,
        onKeyUp,
    } : {};

    // Web-specific container styles
    const webContainerStyle = isWeb ? {
        // Using any to bypass React Native Expo's strict ViewStyle typing for web-specific CSS
        ...(isFocused && {
            shadowColor: finalShadowColorFocused,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
        }),
        ...(hasError && {
            shadowColor: shadowColorError,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
        })
    } : {};

    // Icon default style
    const defaultIconStyle: ViewStyle = {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    };

    // Render icon with optional press handler
    const renderIcon = (icon: React.ReactNode, onPress?: () => void, isLeft: boolean = true) => {
        const combinedIconStyle = [
            defaultIconStyle,
            iconStyle,
            isLeft ? leftIconStyle : rightIconStyle,
        ];

        if (onPress) {
            return (
                <TouchableOpacity
                    onPress={onPress}
                    style={combinedIconStyle}
                    activeOpacity={0.7}
                >
                    {icon}
                </TouchableOpacity>
            );
        }

        return (
            <View style={combinedIconStyle}>
                {icon}
            </View>
        );
    };

    return (
        <View>
            {/* Label */}
            {label && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    {labelIcon && labelIconPosition === 'left' && (
                        <View>
                            {labelIcon}
                        </View>
                    )}
                    <Text
                        size="sm"
                        weight="medium"
                        color="#374151"
                        style={labelStyle}
                    >
                        {label}
                        {required && (
                            <Text size="sm" weight="medium" color="#EF4444">
                                {' *'}
                            </Text>
                        )}
                    </Text>
                    {labelIcon && labelIconPosition === 'right' && (
                        <View>
                            {labelIcon}
                        </View>
                    )}
                </View>
            )}

            {/* Text Input Container */}
            <View
                style={[
                    defaultContainerStyle,
                    containerStyle,
                    webContainerStyle,
                ]}
            >
                {/* Left Icon */}
                {leftIcon && renderIcon(leftIcon, leftIconPress, true)}

                {/* Text Input */}
                <RNTextInput
                    ref={inputRef}
                    style={[textFieldStyle, fieldStyle, style]}
                    placeholderTextColor={placeholderColor}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onChangeText={handleChangeText}
                    onContentSizeChange={handleContentSizeChange}
                    value={value}
                    multiline={multiline}
                    {...webProps}
                    {...props}
                    autoCapitalize={autoCapitalize}
                />

                {/* Right Icon */}
                {rightIcon && renderIcon(rightIcon, rightIconPress, false)}
            </View>

            {/* Error Message - Always show if there's an error message */}
            {displayError && (
                <Text
                    size="xs"
                    weight="regular"
                    color="#EF4444"
                    style={[{ marginTop: 4, marginLeft: 4 }, errorTextStyle]}
                >
                    {displayError}
                </Text>
            )}

            {/* Helper Text - Only show when there's no error */}
            {!displayError && helperText && (
                <Text
                    size="xs"
                    weight="regular"
                    color="#6B7280"
                    style={[{ marginTop: 4, marginLeft: 4 }, helperTextStyle]}
                >
                    {helperText}
                </Text>
            )}
        </View>
    );
};

export default TextInput