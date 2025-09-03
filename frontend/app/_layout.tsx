import React, { useEffect } from "react";
import { Stack } from "expo-router";
import FontProvider from "@/libs/providers/FontProvider";
import ToastProvider from "@/libs/providers/ToastProvider";
import AlertProvider from "@/libs/providers/AlertProvider";
import AuthProvider from "@/libs/providers/AuthProvider";
import ThemeProvider from "@/libs/providers/ThemeProvider";
import useCustomTheme from "@/libs/hooks/useCustomTheme";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import NotificationProvider from "@/libs/providers/NotificationProvider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView>
      <ThemeProvider defaultMode="dark" defaultCustomTheme="astrology">
        <FontProvider>
          <ToastProvider>
            <AlertProvider>
              <AuthProvider>
                <NotificationProvider>
                  <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="welcome" />
                    <Stack.Screen name="admin" />
                    <Stack.Screen name="user" />
                    <Stack.Screen name="(auth)" />
                  </Stack>
                </NotificationProvider>
              </AuthProvider>
            </AlertProvider>
          </ToastProvider>
        </FontProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}