import React, { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/libs/utils/tailwind';
import Container from '@/libs/components/Container';
import TextInput from '@/libs/components/TextInput';
import Button from '@/libs/components/Button';
import { useAuthStore } from '@/libs/stores/authStore';
import { apiPostData, handleApiError } from '@/libs/utils/API_URILS';
import Toast from 'react-native-toast-message';
import LottieView from 'lottie-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: 'กรุณากรอกข้อมูลให้ครบ',
        text2: 'ต้องกรอกอีเมลและรหัสผ่าน',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiPostData('/api/auth/login', {
        email,
        password,
      });

      if (response.success) {
        setAuth(response.data.token, response.data.user);
        Toast.show({
          type: 'success',
          text1: 'เข้าสู่ระบบสำเร็จ',
          text2: `ยินดีต้อนรับคุณ ${response.data.user.name}`,
        });
        router.replace('/user/lottery-check');
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    Toast.show({
      type: 'info',
      text1: `กำลังเข้าสู่ระบบด้วย ${provider}`,
      text2: 'ฟีเจอร์นี้กำลังพัฒนา',
    });
  };

  return (
    <Container>
      <LinearGradient
        colors={['#FFD700', '#FFA500', '#FF6B6B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={tw`absolute inset-0`}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1`}
      >
        <View style={tw`flex-1 px-6 justify-center`}>
          {/* Logo & Title */}
          <View style={tw`items-center mb-8`}>
            <View style={tw`w-32 h-32 bg-white/20 rounded-full items-center justify-center mb-4`}>
              <Text style={tw`text-6xl`}>🎰</Text>
            </View>
            <Text style={tw`text-3xl font-bold text-white font-aboreto`}>KeyLotto</Text>
            <Text style={tw`text-white/80 mt-2`}>หวยมีคีย์ ให้โชคทุกงวด</Text>
          </View>

          {/* Login Form */}
          <View style={tw`bg-white/95 rounded-3xl p-6 shadow-xl`}>
            <Text style={tw`text-2xl font-bold text-center mb-6 text-primary-600`}>
              เข้าสู่ระบบ
            </Text>

            {/* Email Input */}
            <View style={tw`mb-4`}>
              <View style={tw`flex-row items-center bg-gray-50 rounded-xl px-4 py-3`}>
                <Ionicons name="mail-outline" size={20} color="#666" />
                <TextInput
                  placeholder="อีเมล"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={tw`flex-1 ml-3`}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={tw`mb-6`}>
              <View style={tw`flex-row items-center bg-gray-50 rounded-xl px-4 py-3`}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" />
                <TextInput
                  placeholder="รหัสผ่าน"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={tw`flex-1 ml-3`}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color="#666" 
                  />
                </Pressable>
              </View>
            </View>

            {/* Forgot Password */}
            <Link href="/forgot-password" asChild>
              <Pressable style={tw`mb-6`}>
                <Text style={tw`text-primary-600 text-center`}>ลืมรหัสผ่าน?</Text>
              </Pressable>
            </Link>

            {/* Login Button */}
            <Button
              onPress={handleLogin}
              disabled={loading}
              style={tw`mb-4`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={tw`text-white font-bold text-lg`}>เข้าสู่ระบบ</Text>
              )}
            </Button>

            {/* Divider */}
            <View style={tw`flex-row items-center my-4`}>
              <View style={tw`flex-1 h-px bg-gray-300`} />
              <Text style={tw`mx-4 text-gray-500`}>หรือ</Text>
              <View style={tw`flex-1 h-px bg-gray-300`} />
            </View>

            {/* Social Login */}
            <View style={tw`flex-row justify-center gap-4 mb-4`}>
              <Pressable 
                onPress={() => handleSocialLogin('Facebook')}
                style={tw`w-12 h-12 bg-blue-600 rounded-full items-center justify-center`}
              >
                <Ionicons name="logo-facebook" size={24} color="white" />
              </Pressable>
              <Pressable 
                onPress={() => handleSocialLogin('Google')}
                style={tw`w-12 h-12 bg-red-500 rounded-full items-center justify-center`}
              >
                <Ionicons name="logo-google" size={24} color="white" />
              </Pressable>
              <Pressable 
                onPress={() => handleSocialLogin('Apple')}
                style={tw`w-12 h-12 bg-black rounded-full items-center justify-center`}
              >
                <Ionicons name="logo-apple" size={24} color="white" />
              </Pressable>
            </View>

            {/* Register Link */}
            <View style={tw`flex-row justify-center`}>
              <Text style={tw`text-gray-600`}>ยังไม่มีบัญชี? </Text>
              <Link href="/register" asChild>
                <Pressable>
                  <Text style={tw`text-primary-600 font-bold`}>สมัครสมาชิก</Text>
                </Pressable>
              </Link>
            </View>
          </View>

          {/* Skip Login */}
          <Pressable 
            onPress={() => router.replace('/user/lottery-check')}
            style={tw`mt-6`}
          >
            <Text style={tw`text-white text-center`}>ข้ามการเข้าสู่ระบบ →</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
}