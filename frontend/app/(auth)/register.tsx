import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/libs/constants/twrnc';
import Container from '@/libs/components/Container';
import TextInput from '@/libs/components/TextInput';
import Button from '@/libs/components/Button';
import { useAuthStore } from '@/libs/stores/authStore';
import { apiPostData, handleApiError } from '@/libs/utils/API_URILS';
import Toast from 'react-native-toast-message';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const updateForm = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password) {
      Toast.show({
        type: 'error',
        text1: 'กรุณากรอกข้อมูลให้ครบ',
        text2: 'ต้องกรอกชื่อ อีเมล และรหัสผ่าน',
      });
      return false;
    }

    if (formData.password.length < 8) {
      Toast.show({
        type: 'error',
        text1: 'รหัสผ่านสั้นเกินไป',
        text2: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'รหัสผ่านไม่ตรงกัน',
        text2: 'กรุณาตรวจสอบรหัสผ่านอีกครั้ง',
      });
      return false;
    }

    if (!formData.acceptTerms) {
      Toast.show({
        type: 'error',
        text1: 'กรุณายอมรับข้อตกลง',
        text2: 'ต้องยอมรับข้อตกลงการใช้งาน',
      });
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await apiPostData('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      });

      if (response.success) {
        setAuth(response.data.token, response.data.user);
        Toast.show({
          type: 'success',
          text1: 'สมัครสมาชิกสำเร็จ',
          text2: `ยินดีต้อนรับคุณ ${response.data.user.name}`,
        });
        router.replace('/onboarding');
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
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
        <ScrollView 
          contentContainerStyle={tw`px-6 py-12`}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={tw`items-center mb-6`}>
            <View style={tw`w-24 h-24 bg-white/20 rounded-full items-center justify-center mb-3`}>
              <Text style={tw`text-5xl`}>🎰</Text>
            </View>
            <Text style={tw`text-2xl font-bold text-white font-aboreto`}>สมัครสมาชิก</Text>
            <Text style={tw`text-white/80 mt-1`}>เริ่มต้นการเป็นเซียนหวย</Text>
          </View>

          {/* Register Form */}
          <View style={tw`bg-white/95 rounded-3xl p-6 shadow-xl`}>
            {/* Name Input */}
            <View style={tw`mb-4`}>
              <Text style={tw`text-gray-700 mb-2 ml-2`}>ชื่อ-นามสกุล *</Text>
              <View style={tw`flex-row items-center bg-gray-50 rounded-xl px-4 py-3`}>
                <Ionicons name="person-outline" size={20} color="#666" />
                <TextInput
                  placeholder="ชื่อของคุณ"
                  value={formData.name}
                  onChangeText={(text) => updateForm('name', text)}
                  style={tw`flex-1 ml-3`}
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={tw`mb-4`}>
              <Text style={tw`text-gray-700 mb-2 ml-2`}>อีเมล *</Text>
              <View style={tw`flex-row items-center bg-gray-50 rounded-xl px-4 py-3`}>
                <Ionicons name="mail-outline" size={20} color="#666" />
                <TextInput
                  placeholder="your@email.com"
                  value={formData.email}
                  onChangeText={(text) => updateForm('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={tw`flex-1 ml-3`}
                />
              </View>
            </View>

            {/* Phone Input */}
            <View style={tw`mb-4`}>
              <Text style={tw`text-gray-700 mb-2 ml-2`}>เบอร์โทรศัพท์</Text>
              <View style={tw`flex-row items-center bg-gray-50 rounded-xl px-4 py-3`}>
                <Ionicons name="call-outline" size={20} color="#666" />
                <TextInput
                  placeholder="0812345678"
                  value={formData.phone}
                  onChangeText={(text) => updateForm('phone', text)}
                  keyboardType="phone-pad"
                  style={tw`flex-1 ml-3`}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={tw`mb-4`}>
              <Text style={tw`text-gray-700 mb-2 ml-2`}>รหัสผ่าน * (อย่างน้อย 8 ตัว)</Text>
              <View style={tw`flex-row items-center bg-gray-50 rounded-xl px-4 py-3`}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" />
                <TextInput
                  placeholder="รหัสผ่าน"
                  value={formData.password}
                  onChangeText={(text) => updateForm('password', text)}
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

            {/* Confirm Password Input */}
            <View style={tw`mb-4`}>
              <Text style={tw`text-gray-700 mb-2 ml-2`}>ยืนยันรหัสผ่าน *</Text>
              <View style={tw`flex-row items-center bg-gray-50 rounded-xl px-4 py-3`}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" />
                <TextInput
                  placeholder="ยืนยันรหัสผ่าน"
                  value={formData.confirmPassword}
                  onChangeText={(text) => updateForm('confirmPassword', text)}
                  secureTextEntry={!showConfirmPassword}
                  style={tw`flex-1 ml-3`}
                />
                <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons 
                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color="#666" 
                  />
                </Pressable>
              </View>
            </View>

            {/* Terms Checkbox */}
            <Pressable 
              onPress={() => updateForm('acceptTerms', !formData.acceptTerms)}
              style={tw`flex-row items-center mb-6`}
            >
              <View style={tw`w-5 h-5 border-2 border-primary-500 rounded mr-3 items-center justify-center`}>
                {formData.acceptTerms && (
                  <Ionicons name="checkmark" size={16} color="#DC2626" />
                )}
              </View>
              <Text style={tw`text-gray-600 flex-1`}>
                ฉันยอมรับ{' '}
                <Text style={tw`text-primary-600 underline`}>ข้อตกลงการใช้งาน</Text>
                {' '}และ{' '}
                <Text style={tw`text-primary-600 underline`}>นโยบายความเป็นส่วนตัว</Text>
              </Text>
            </Pressable>

            {/* Register Button */}
            <Button
              onPress={handleRegister}
              disabled={loading}
              style={tw`mb-4`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={tw`text-white font-bold text-lg`}>สมัครสมาชิก</Text>
              )}
            </Button>

            {/* Login Link */}
            <View style={tw`flex-row justify-center`}>
              <Text style={tw`text-gray-600`}>มีบัญชีแล้ว? </Text>
              <Link href="/login" asChild>
                <Pressable>
                  <Text style={tw`text-primary-600 font-bold`}>เข้าสู่ระบบ</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
}