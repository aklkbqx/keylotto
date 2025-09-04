import React from "react";
import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { View } from 'react-native';
import tw from '@/libs/constants/twrnc';

export default function UserLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A0F0F',
          borderTopColor: '#D4AF37',
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#FFD700',
        tabBarInactiveTintColor: '#8B7355',
        tabBarLabelStyle: {
          fontFamily: 'Kanit_400Regular',
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="lottery-check"
        options={{
          title: 'ตรวจหวย',
          tabBarIcon: ({ color, focused }) => (
            <View style={tw`items-center`}>
              {focused && (
                <View style={tw`absolute -top-1 w-8 h-8 bg-yellow-400/20 rounded-full`} />
              )}
              <MaterialCommunityIcons 
                name="ticket-confirmation" 
                size={focused ? 28 : 24} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'สแกน',
          tabBarIcon: ({ color, focused }) => (
            <View style={tw`items-center`}>
              {focused && (
                <View style={tw`absolute -top-1 w-8 h-8 bg-yellow-400/20 rounded-full`} />
              )}
              <Ionicons 
                name="qr-code-outline" 
                size={focused ? 28 : 24} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'ประวัติ',
          tabBarIcon: ({ color, focused }) => (
            <View style={tw`items-center`}>
              {focused && (
                <View style={tw`absolute -top-1 w-8 h-8 bg-yellow-400/20 rounded-full`} />
              )}
              <MaterialCommunityIcons 
                name="history" 
                size={focused ? 28 : 24} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'เลขเด็ด',
          tabBarIcon: ({ color, focused }) => (
            <View style={tw`items-center`}>
              {focused && (
                <View style={tw`absolute -top-1 w-8 h-8 bg-yellow-400/20 rounded-full`} />
              )}
              <Ionicons 
                name="newspaper-outline" 
                size={focused ? 28 : 24} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'โปรไฟล์',
          tabBarIcon: ({ color, focused }) => (
            <View style={tw`items-center`}>
              {focused && (
                <View style={tw`absolute -top-1 w-8 h-8 bg-yellow-400/20 rounded-full`} />
              )}
              <FontAwesome5 
                name="user-circle" 
                size={focused ? 26 : 22} 
                color={color} 
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}