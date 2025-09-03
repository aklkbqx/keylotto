import React, { useState, useRef } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Modal, 
  ViewStyle,
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import tw from '@/libs/constants/twrnc';
import { ROLE_THEMES, STATUS_COLORS } from '@/libs/constants/theme';
import Text from './Text';
import AnimatedView from './AnimatedView';
import { Ionicons } from '@expo/vector-icons';

// ==================== Success Modal Component ====================
interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  buttonText?: string;
  variant?: 'agent' | 'admin' | 'unit' | 'regional';
  autoClose?: boolean;
  autoCloseDelay?: number;
  style?: ViewStyle;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  onClose,
  title = 'สำเร็จ!',
  message,
  icon = 'checkmark-circle',
  buttonText = 'ตกลง',
  variant = 'agent',
  autoClose = false,
  autoCloseDelay = 3000,
  style,
}) => {
  const theme = ROLE_THEMES[variant];

  React.useEffect(() => {
    if (visible && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [visible, autoClose, autoCloseDelay, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} tint="dark" style={tw`flex-1`}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={tw`flex-1 justify-center items-center px-4`}
        >
          <AnimatedView
            startScale={0.8}
            endScale={1}
            startOpacity={0}
            endOpacity={1}
            duration={300}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[
                tw`bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm items-center`,
                style,
              ]}
            >
              <AnimatedView
                startScale={0}
                endScale={1}
                duration={500}
                style={tw`mb-4`}
              >
                <View
                  style={[
                    tw`w-20 h-20 rounded-full items-center justify-center`,
                    { backgroundColor: String(tw.color('green-100')) },
                  ]}
                >
                  <Ionicons 
                    name={icon} 
                    size={40} 
                    color={STATUS_COLORS.success} 
                  />
                </View>
              </AnimatedView>
              
              <Text size="xl" weight="semibold" color={String(tw.color('gray-900'))} style={tw`mb-2 text-center`}>
                {title}
              </Text>
              
              <Text size="base" color={String(tw.color('gray-600'))} style={tw`text-center mb-6`}>
                {message}
              </Text>

              <TouchableOpacity
                onPress={onClose}
                style={[
                  tw`px-8 py-3 rounded-xl`,
                  { backgroundColor: theme.primary },
                ]}
              >
                <Text size="base" weight="medium" color="white">
                  {buttonText}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </AnimatedView>
        </TouchableOpacity>
      </BlurView>
    </Modal>
  );
};

// ==================== Tooltip Component ====================
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'agent' | 'admin' | 'unit' | 'regional';
  maxWidth?: number;
  style?: ViewStyle;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  variant = 'agent',
  maxWidth = 200,
  style,
}) => {
  const [visible, setVisible] = useState(false);
  const [tooltipDimensions, setTooltipDimensions] = useState({ width: 0, height: 0 });
  const [triggerDimensions, setTriggerDimensions] = useState({ width: 0, height: 0 });
  const theme = ROLE_THEMES[variant];

  const getTooltipPosition = (): ViewStyle => {
    const offset = 8;
    switch (position) {
      case 'top':
        return {
          position: 'absolute',
          top: -(tooltipDimensions.height + offset),
          left: (triggerDimensions.width / 2) - (tooltipDimensions.width / 2),
        };
      case 'bottom':
        return {
          position: 'absolute',
          top: triggerDimensions.height + offset,
          left: (triggerDimensions.width / 2) - (tooltipDimensions.width / 2),
        };
      case 'left':
        return {
          position: 'absolute',
          left: -(tooltipDimensions.width + offset),
          top: (triggerDimensions.height / 2) - (tooltipDimensions.height / 2),
        };
      case 'right':
        return {
          position: 'absolute',
          left: triggerDimensions.width + offset,
          top: (triggerDimensions.height / 2) - (tooltipDimensions.height / 2),
        };
    }
    return {} as ViewStyle;
  };

  const getArrowPosition = (): ViewStyle => {
    const half = 5;
    switch (position) {
      case 'top':
        return {
          position: 'absolute',
          bottom: -half,
          left: (tooltipDimensions.width / 2) - half,
          borderTopColor: String(tw.color('gray-900')),
          borderTopWidth: half,
          borderLeftWidth: half,
          borderRightWidth: half,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
        };
      case 'bottom':
        return {
          position: 'absolute',
          top: -half,
          left: (tooltipDimensions.width / 2) - half,
          borderBottomColor: String(tw.color('gray-900')),
          borderBottomWidth: half,
          borderLeftWidth: half,
          borderRightWidth: half,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
        };
      case 'left':
        return {
          position: 'absolute',
          right: -half,
          top: (tooltipDimensions.height / 2) - half,
          borderLeftColor: String(tw.color('gray-900')),
          borderLeftWidth: half,
          borderTopWidth: half,
          borderBottomWidth: half,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
        };
      case 'right':
        return {
          position: 'absolute',
          left: -half,
          top: (tooltipDimensions.height / 2) - half,
          borderRightColor: String(tw.color('gray-900')),
          borderRightWidth: half,
          borderTopWidth: half,
          borderBottomWidth: half,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
        };
    }
    return {} as ViewStyle;
  };

  return (
    <View style={[tw`relative`, style]}>
      <TouchableOpacity
        onPressIn={() => setVisible(true)}
        onPressOut={() => setVisible(false)}
        activeOpacity={1}
        onLayout={(e) => setTriggerDimensions({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
      >
        {children}
      </TouchableOpacity>
      
      {visible && (
        <View
          style={[
            tw`absolute z-50`,
            getTooltipPosition(),
          ]}
          onLayout={(e) => setTooltipDimensions({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })}
        >
          <AnimatedView
            startOpacity={0}
            endOpacity={1}
            startScale={0.95}
            endScale={1}
            duration={150}
          >
            <View
              style={[
                tw`bg-gray-900 px-3 py-2 rounded-lg`,
                { maxWidth },
              ]}
            >
              <Text size="sm" color="white">
                {content}
              </Text>
              <View
                style={[
                  tw`absolute w-0 h-0`,
                  getArrowPosition(),
                ]}
              />
            </View>
          </AnimatedView>
        </View>
      )}
    </View>
  );
};

// ==================== Empty State Component ====================
interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  buttonText?: string;
  onButtonPress?: () => void;
  variant?: 'agent' | 'admin' | 'unit' | 'regional';
  image?: React.ReactNode;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon = 'folder-open-outline',
  buttonText,
  onButtonPress,
  variant = 'agent',
  image,
  style,
}) => {
  const theme = ROLE_THEMES[variant];

  return (
    <View style={[tw`flex-1 justify-center items-center px-8 py-12`, style]}>
      {image ? (
        image
      ) : (
        <View
          style={[
            tw`w-24 h-24 rounded-full items-center justify-center mb-6`,
            { backgroundColor: `${theme.primary}15` },
          ]}
        >
          <Ionicons
            name={icon}
            size={48}
            color={theme.primary}
          />
        </View>
      )}
      
      <Text size="lg" weight="semibold" color={String(tw.color('gray-900'))} style={tw`text-center mb-2`}>
        {title}
      </Text>
      
      {message && (
        <Text size="base" color={String(tw.color('gray-500'))} style={tw`text-center mb-6`}>
          {message}
        </Text>
      )}
      
      {buttonText && onButtonPress && (
        <TouchableOpacity
          onPress={onButtonPress}
          style={[
            tw`px-6 py-3 rounded-xl`,
            { backgroundColor: theme.primary },
          ]}
        >
          <Text size="base" weight="medium" color="white">
            {buttonText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ==================== Loading Spinner Component ====================
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  variant?: 'agent' | 'admin' | 'unit' | 'regional';
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  style?: ViewStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color,
  variant = 'agent',
  text,
  fullScreen = false,
  overlay = false,
  style,
}) => {
  const theme = ROLE_THEMES[variant];
  const spinnerColor = color || theme.primary;
  
  const getSizeValue = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'large':
        return 48;
      default:
        return 36;
    }
  };

  const content = (
    <View style={[tw`items-center justify-center`, style]}>
      <ActivityIndicator
        size={Platform.OS === 'ios' ? (size === 'small' ? 'small' : 'large') : getSizeValue()}
        color={spinnerColor}
      />
      {text && (
        <Text
          size="sm"
          color={String(tw.color('gray-600'))}
          style={tw`mt-3`}
        >
          {text}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View
        style={[
          tw`absolute inset-0 items-center justify-center`,
          overlay && tw`bg-black/30`,
          { zIndex: 9999 },
        ]}
      >
        {overlay ? (
          <View style={tw`bg-white rounded-2xl p-6 shadow-lg`}>
            {content}
          </View>
        ) : (
          content
        )}
      </View>
    );
  }

  return content;
};

// ==================== Progress Indicator Component ====================
interface ProgressIndicatorProps {
  progress: number; // 0-100
  variant?: 'agent' | 'admin' | 'unit' | 'regional';
  showPercentage?: boolean;
  height?: number;
  animated?: boolean;
  style?: ViewStyle;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  variant = 'agent',
  showPercentage = true,
  height = 8,
  animated = true,
  style,
}) => {
  const theme = ROLE_THEMES[variant];
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View style={style}>
      {showPercentage && (
        <View style={tw`flex-row justify-between mb-2`}>
          <Text size="sm" color={String(tw.color('gray-600'))}>
            กำลังดำเนินการ
          </Text>
          <Text size="sm" weight="medium" color={theme.primary}>
            {Math.round(clampedProgress)}%
          </Text>
        </View>
      )}
      
      <View
        style={[
          tw`bg-gray-200 rounded-full overflow-hidden`,
          { height },
        ]}
      >
        <AnimatedView
          style={[
            tw`h-full rounded-full`,
            { 
              width: `${clampedProgress}%`,
              backgroundColor: theme.primary,
            },
          ]}
          duration={animated ? 300 : 0}
        />
      </View>
    </View>
  );
};