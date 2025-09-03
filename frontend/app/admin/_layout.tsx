import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const RootAdmin = () => {
    return (
        <Stack>
            <Stack.Screen name='dashboard' />
        </Stack>
    )
}

export default RootAdmin