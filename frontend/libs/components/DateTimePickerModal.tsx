import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import tw from '@/libs/constants/twrnc';
import Text from './Text';
import Button from './Button';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

export interface DateTimePickerTheme {
    // Modal
    backdropColor?: string;
    modalBackgroundColor?: string;
    borderRadius?: number;
    
    // Header
    headerBackgroundColor?: string;
    headerBorderColor?: string;
    titleColor?: string;
    titleSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
    titleWeight?: 'regular' | 'medium' | 'semibold' | 'bold';
    
    // Buttons
    primaryButtonVariant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient';
    secondaryButtonVariant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient';
    buttonSize?: 'sm' | 'md' | 'lg' | 'xl';
    
    // Picker
    pickerBackgroundColor?: string;
    pickerTextColor?: string;
    
    // Content
    contentPadding?: string;
    buttonSpacing?: string;
}

export interface DateTimePickerModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (date: Date) => void;
    mode?: 'date' | 'time' | 'datetime';
    value?: Date;
    minimumDate?: Date;
    maximumDate?: Date;
    title?: string;
    confirmText?: string;
    cancelText?: string;
    theme?: DateTimePickerTheme;
    locale?: string;
    display?: 'default' | 'spinner' | 'compact' | 'clock';
    is24Hour?: boolean;
    minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;
}

const defaultTheme: Required<DateTimePickerTheme> = {
    backdropColor: 'rgba(0, 0, 0, 0.5)',
    modalBackgroundColor: String(tw.color('white')),
    borderRadius: 16,
    
    headerBackgroundColor: 'transparent',
    headerBorderColor: String(tw.color('gray-200')),
    titleColor: String(tw.color('gray-900')),
    titleSize: 'lg',
    titleWeight: 'bold',
    
    primaryButtonVariant: 'primary',
    secondaryButtonVariant: 'outline',
    buttonSize: 'md',
    
    pickerBackgroundColor: 'transparent',
    pickerTextColor: String(tw.color('gray-900')),
    
    contentPadding: 'p-4',
    buttonSpacing: 'gap-2',
};

export const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({
    visible,
    onClose,
    onConfirm,
    mode = 'date',
    value = new Date(),
    minimumDate,
    maximumDate,
    title,
    confirmText = 'ยืนยัน',
    cancelText = 'ยกเลิก',
    theme = {},
    locale = 'th-TH',
    display = 'default',
    is24Hour = true,
    minuteInterval = 1,
}) => {
    const [selectedDate, setSelectedDate] = useState<Date>(value);
    const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

    const mergedTheme = { ...defaultTheme, ...theme };
    const platformMode = Platform.OS === 'android' && mode === 'datetime' ? 'date' : mode;

    const getDefaultTitle = () => {
        switch (mode) {
            case 'date':
                return 'เลือกวันที่';
            case 'time':
                return 'เลือกเวลา';
            case 'datetime':
                return 'เลือกวันที่และเวลา';
            default:
                return 'เลือกวันที่';
        }
    };

    const formatSelectedDate = () => {
        if (mode === 'time') {
            return selectedDate.toLocaleTimeString(locale, {
                hour: '2-digit',
                minute: '2-digit',
                hour12: !is24Hour
            });
        } else if (mode === 'datetime') {
            return selectedDate.toLocaleString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: !is24Hour
            });
        } else {
            return selectedDate.toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    };

    const handleDateChange = (event: any, date?: Date) => {
        if (Platform.OS === 'android') {
            setShowPicker(false);
        }
        
        if (date) {
            setSelectedDate(date);
            
            if (Platform.OS === 'android') {
                // On Android, confirm immediately
                onConfirm(date);
                onClose();
            }
        } else if (Platform.OS === 'android') {
            // User cancelled on Android
            onClose();
        }
    };

    const handleConfirm = () => {
        onConfirm(selectedDate);
        onClose();
    };

    const handleCancel = () => {
        setSelectedDate(value); // Reset to original value
        onClose();
    };

    const handleShowPicker = () => {
        if (Platform.OS === 'android') {
            setShowPicker(true);
        }
    };

    // Android shows picker immediately and handles confirmation internally
    if (Platform.OS === 'android' && showPicker) {
        return (
            <DateTimePicker
                value={selectedDate}
                mode={platformMode as any}
                display={display}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                is24Hour={is24Hour}
                minuteInterval={minuteInterval as any}
                onChange={handleDateChange}
                locale={locale}
            />
        );
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <BlurView 
                intensity={20} 
                style={[
                    tw`flex-1 justify-center items-center p-4`,
                    { backgroundColor: mergedTheme.backdropColor }
                ]}
            >
                <View 
                    style={[
                        tw`w-full max-w-sm`,
                        {
                            backgroundColor: mergedTheme.modalBackgroundColor,
                            borderRadius: mergedTheme.borderRadius,
                            overflow: 'hidden',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.3,
                            shadowRadius: 20,
                            elevation: 10,
                        }
                    ]}
                >
                    {/* Header */}
                    <View 
                        style={[
                            tw`flex-row items-center justify-between ${mergedTheme.contentPadding} border-b`,
                            {
                                backgroundColor: mergedTheme.headerBackgroundColor,
                                borderBottomColor: mergedTheme.headerBorderColor,
                            }
                        ]}
                    >
                        <Text 
                            size={mergedTheme.titleSize}
                            weight={mergedTheme.titleWeight}
                            color={mergedTheme.titleColor}
                        >
                            {title || getDefaultTitle()}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={tw`p-1`}>
                            <Ionicons 
                                name="close" 
                                size={24} 
                                color={String(tw.color('gray-600'))} 
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={tw`${mergedTheme.contentPadding}`}>
                        {Platform.OS === 'ios' ? (
                            // iOS: Show picker directly
                            <View 
                                style={[
                                    tw`mb-4`,
                                    { backgroundColor: mergedTheme.pickerBackgroundColor }
                                ]}
                            >
                                <DateTimePicker
                                    value={selectedDate}
                                    mode={platformMode as any}
                                    display={display}
                                    minimumDate={minimumDate}
                                    maximumDate={maximumDate}
                                    is24Hour={is24Hour}
                                    minuteInterval={minuteInterval}
                                    onChange={handleDateChange}
                                    locale={locale}
                                    textColor={mergedTheme.pickerTextColor}
                                    style={{ backgroundColor: mergedTheme.pickerBackgroundColor }}
                                />
                            </View>
                        ) : (
                            // Android: Show selected value and button to open picker
                            <View style={tw`mb-4`}>
                                <TouchableOpacity
                                    onPress={handleShowPicker}
                                    style={tw`bg-gray-50 rounded-lg p-4 border border-gray-200`}
                                >
                                    <View style={tw`flex-row items-center justify-between`}>
                                        <Text size="base" color={mergedTheme.pickerTextColor}>
                                            {formatSelectedDate()}
                                        </Text>
                                        <Ionicons 
                                            name="calendar-outline" 
                                            size={20} 
                                            color={String(tw.color('gray-500'))} 
                                        />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Action Buttons */}
                        <View style={tw`flex-row ${mergedTheme.buttonSpacing}`}>
                            <Button
                                label={cancelText}
                                variant={mergedTheme.secondaryButtonVariant}
                                size={mergedTheme.buttonSize}
                                onPress={handleCancel}
                                style={tw`flex-1`}
                            />
                            <Button
                                label={confirmText}
                                variant={mergedTheme.primaryButtonVariant}
                                size={mergedTheme.buttonSize}
                                onPress={handleConfirm}
                                style={tw`flex-1`}
                            />
                        </View>
                    </View>
                </View>
            </BlurView>
        </Modal>
    );
};

export default DateTimePickerModal;