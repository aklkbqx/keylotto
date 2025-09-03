import React from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const AuthLayout = () => {
    return (
        <GestureHandlerRootView>
            <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
                <Stack.Screen name="login" />
                <Stack.Screen name="register" />
            </Stack>
        </GestureHandlerRootView>
    )
}

export default AuthLayout