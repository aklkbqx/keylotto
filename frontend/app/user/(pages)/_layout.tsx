import React from 'react'
import { Stack } from 'expo-router'

const RootPages = () => {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name='dream' />
            <Stack.Screen name='live-stream' />
            <Stack.Screen name='notifications' />
        </Stack>
    )
}

export default RootPages