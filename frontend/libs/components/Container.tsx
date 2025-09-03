import React, { ReactNode } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  ScrollViewProps,
  StyleProp,
  RefreshControlProps,
  TouchableOpacity,
  TextStyle,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import tw from "@/libs/constants/twrnc";
import { useTheme } from "@/libs/providers/ThemeProvider";
import Text from "./Text";

export interface ContainerProps extends Omit<ScrollViewProps, "contentContainerStyle" | "refreshControl"> {
  children: ReactNode;

  // Layout (เก่า + ใหม่)
  scroll?: boolean;
  scrollable?: boolean; // alias สำหรับ scroll
  center?: boolean;
  gap?: number;
  maxWidth?: number | string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>; // เพิ่มจากโค้ดเก่า

  // Spacing (ปรับปรุงจากโค้ดเก่า)
  padding?: number;
  paddingHorizontal?: number;
  paddingVertical?: number;
  paddingTop?: number;
  paddingBottom?: number;

  // Safe area
  safeArea?: boolean | "top" | "bottom" | "both" | "none";

  // Keyboard
  keyboardAware?: boolean;
  keyboardVerticalOffset?: number;

  // StatusBar
  statusBarStyle?: "light" | "dark" | "auto";
  statusBarHidden?: boolean;

  // Theme/background
  backgroundColor?: string;
  showGradient?: boolean; // จากโค้ดเก่า

  // Layout Options
  variant?: "default" | "fullscreen" | "modal" | "bottomSheet" | "split";
  
  // Header Support (ขยายจากโค้ดเก่า)
  header?: ReactNode;
  footer?: ReactNode;
  headerStyle?: StyleProp<ViewStyle>;
  footerStyle?: StyleProp<ViewStyle>;
  
  // Header Props จากโค้ดเก่า
  showHeader?: boolean;
  headerTitle?: string;
  headerSubtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  headerTitleStyle?: StyleProp<any>;
  headerSubtitleStyle?: StyleProp<any>;
  headerRightComponent?: ReactNode;
  headerLeftComponent?: ReactNode;
  headerBackgroundColor?: string;
  headerBorderBottom?: boolean;
  
  // Advanced Layout
  flex?: number;
  direction?: "column" | "row";
  justify?: "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly";
  align?: "flex-start" | "flex-end" | "center" | "stretch";
  
  // Edges & Borders
  edges?: ("top" | "bottom" | "left" | "right")[];
  borderRadius?: number;
  
  // Content behavior
  scrollToTop?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  
  // Fixed elements support
  overlay?: ReactNode;
  bottomBar?: ReactNode;
  bottomBarStyle?: StyleProp<ViewStyle>;
}

const Container: React.FC<ContainerProps> = ({
  children,
  scroll = false,
  scrollable, // alias สำหรับ scroll
  center = false,
  gap,
  maxWidth = 960,
  contentContainerStyle,
  style,
  contentStyle, // เพิ่มจากโค้ดเก่า
  padding,
  paddingHorizontal,
  paddingVertical,
  paddingTop,
  paddingBottom,
  safeArea = "both",
  keyboardAware = true,
  keyboardVerticalOffset = 0,
  statusBarStyle = "auto",
  statusBarHidden = false,
  backgroundColor,
  showGradient = false,
  
  // Layout options
  variant = "default",
  header,
  footer,
  headerStyle,
  footerStyle,
  
  // Header props จากโค้ดเก่า
  showHeader = false,
  headerTitle,
  headerSubtitle,
  showBackButton = false,
  onBackPress,
  headerTitleStyle,
  headerSubtitleStyle,
  headerRightComponent,
  headerLeftComponent,
  headerBackgroundColor,
  headerBorderBottom = false,
  
  // Advanced layout
  flex = 1,
  direction = "column",
  justify = "flex-start",
  align = "stretch",
  edges,
  borderRadius,
  scrollToTop,
  refreshControl,
  overlay,
  bottomBar,
  bottomBarStyle,
  
  ...scrollProps
}) => {
  const insets = useSafeAreaInsets();
  const { palette, colorScheme } = useTheme();
  const router = useRouter();

  // ใช้ scrollable หรือ scroll
  const isScrollable = scrollable ?? scroll;

  // Determine safe area insets based on props
  const getInsets = () => {
    if (safeArea === "none" || safeArea === false) return { top: 0, bottom: 0 };
    
    const topInset = (safeArea === true || safeArea === "top" || safeArea === "both") ? insets.top : 0;
    const bottomInset = (safeArea === true || safeArea === "bottom" || safeArea === "both") ? insets.bottom : 0;
    
    return { top: topInset, bottom: bottomInset };
  };

  const { top: topInset, bottom: bottomInset } = getInsets();

  // Handle different padding scenarios (ปรับปรุงจากโค้ดเก่า)
  const getDefaultPadding = () => {
    if (variant === "fullscreen") return 0;
    return Platform.OS === "web" ? 24 : 16;
  };

  const defaultPadding = getDefaultPadding();
  const finalPaddingHorizontal = paddingHorizontal ?? padding ?? defaultPadding;
  const finalPaddingTop = paddingTop ?? paddingVertical ?? padding ?? (showHeader ? 8 : defaultPadding);
  const finalPaddingBottom = paddingBottom ?? paddingVertical ?? padding ?? defaultPadding;

  const containerBg = backgroundColor || palette.background;

  // Auto status bar style based on theme
  const resolvedStatusBarStyle = statusBarStyle === "auto" 
    ? (colorScheme === "dark" ? "light" : "dark")
    : statusBarStyle;

  // Main container styles
  const mainContainerStyle: ViewStyle = {
    flex: flex,
    backgroundColor: containerBg,
  };

  // Content padding จากโค้ดเก่า
  const getContentPadding = (): ViewStyle => {
    if (variant === "fullscreen") {
      return {};
    }

    const basePadding: ViewStyle = {
      paddingHorizontal: finalPaddingHorizontal,
      paddingTop: showHeader ? 0 : finalPaddingTop, // ลบ topInset เพราะ SafeAreaView จัดการให้แล้ว
      paddingBottom: finalPaddingBottom + (bottomBar ? 0 : bottomInset),
    };

    if (typeof gap === "number") {
      (basePadding as any).gap = gap;
    }

    return basePadding;
  };

  // Content container style for ScrollView
  const scrollContentStyle: ViewStyle = {
    flexGrow: 1,
    ...getContentPadding(),
    ...(center && {
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100%",
    }),
  };

  // View content style for non-scrollable
  const viewContentStyle: ViewStyle = {
    flex: 1,
    ...getContentPadding(),
    ...(center && {
      justifyContent: "center",
      alignItems: "center",
    }),
  };

  // Header component จากโค้ดเก่า
  const HeaderComponent = () => {
    if (!showHeader) return null;

    const headerHeight = Platform.OS === "web" ? 70 : 56;

    return (
      <View style={[
        {
          backgroundColor: headerBackgroundColor || containerBg,
          // ลบ paddingTop: topInset เพราะ SafeAreaView จัดการให้แล้ว
          borderBottomWidth: headerBorderBottom ? 1 : 0,
          borderBottomColor: palette.border,
        },
        headerStyle
      ]}>
        <View style={[
          tw`flex-row items-center justify-between`,
          {
            height: headerHeight,
            paddingHorizontal: finalPaddingHorizontal,
          }
        ]}>
          {/* Left Section */}
          <View style={tw`flex-row items-center flex-1`}>
            {headerLeftComponent || (
              showBackButton && (
                <TouchableOpacity
                  onPress={onBackPress || (() => router.canGoBack() ? router.back() : router.replace('/'))}
                  style={[
                    tw`w-10 h-10 rounded-xl items-center justify-center mr-3`,
                    { backgroundColor: palette.surface }
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chevron-back" size={20} color={palette.text} />
                </TouchableOpacity>
              )
            )}

            <View style={tw`flex-1`}>
              {headerTitle && (
                <Text
                  size="lg"
                  weight="bold"
                  color={palette.text}
                  style={headerTitleStyle}
                >
                  {headerTitle}
                </Text>
              )}
              {headerSubtitle && (
                <Text
                  size="sm"
                  color={palette.textSecondary}
                  style={[tw`mt-1`, headerSubtitleStyle]}
                >
                  {headerSubtitle}
                </Text>
              )}
            </View>
          </View>

          {/* Right Section */}
          {headerRightComponent && (
            <View style={tw`ml-3`}>
              {headerRightComponent}
            </View>
          )}
        </View>
      </View>
    );
  };

  // Enhanced scroll props
  const scrollViewProps = {
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: "handled" as const,
    ...scrollProps,
    ...(refreshControl && { refreshControl }),
  };

  // Render main content
  const renderContent = () => {
    if (isScrollable) {
      return (
        <ScrollView
          {...scrollViewProps}
          contentContainerStyle={[scrollContentStyle, contentContainerStyle, contentStyle]}
          style={tw`flex-1`}
        >
          {children}
        </ScrollView>
      );
    }

    return (
      <View style={[viewContentStyle, contentContainerStyle, contentStyle]}>
        {children}
      </View>
    );
  };

  // Main container with new features
  const body = (
    <SafeAreaView style={[mainContainerStyle, style]}>
      <StatusBar style={resolvedStatusBarStyle} hidden={statusBarHidden} />
      
      {/* Header - ใช้ showHeader หรือ header prop */}
      {showHeader ? <HeaderComponent /> : header && (
        <View style={[
          { 
            // ลบ paddingTop: topInset เพราะ SafeAreaView จัดการให้แล้ว
            backgroundColor: containerBg 
          }, 
          headerStyle
        ]}>
          {header}
        </View>
      )}

      {/* Main Content */}
      {renderContent()}

      {/* Footer */}
      {footer && (
        <View style={[
          { 
            paddingBottom: bottomBar ? 0 : bottomInset,
            backgroundColor: containerBg 
          }, 
          footerStyle
        ]}>
          {footer}
        </View>
      )}

      {/* Bottom Bar */}
      {bottomBar && (
        <View style={[
          {
            backgroundColor: containerBg,
            paddingBottom: bottomInset,
            borderTopWidth: 1,
            borderTopColor: palette.border,
          },
          bottomBarStyle
        ]}>
          {bottomBar}
        </View>
      )}

      {/* Overlay */}
      {overlay && (
        <View style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "box-none",
        }}>
          {overlay}
        </View>
      )}
    </SafeAreaView>
  );

  if (!keyboardAware) return body;

  return (
    <KeyboardAvoidingView
      style={tw`flex-1`}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {body}
    </KeyboardAvoidingView>
  );
};

export default Container;
