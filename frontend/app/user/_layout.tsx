import React from "react";
import { Stack } from "expo-router";
import FontProvider from "@/libs/providers/FontProvider";
import ToastProvider from "@/libs/providers/ToastProvider";
import AlertProvider from "@/libs/providers/AlertProvider";
import AuthProvider from "@/libs/providers/AuthProvider";
import ThemeProvider from "@/libs/providers/ThemeProvider";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import NotificationProvider from "@/libs/providers/NotificationProvider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView>
      <ThemeProvider defaultMode="light">
        <FontProvider>
          <ToastProvider>
            <AlertProvider>
              <AuthProvider>
                <NotificationProvider>
                  <Stack screenOptions={{ headerShown: false, animation: "simple_push" }}>
                    <Stack.Screen name="home" />
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