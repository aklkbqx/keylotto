import React, { useState, useRef, useCallback } from 'react';
import { View, ScrollView, Animated, Pressable, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Container from '@/libs/components/Container';
import Text from '@/libs/components/Text';
import Button from '@/libs/components/Button';
import TextInput from '@/libs/components/TextInput';
import tw from '@/libs/constants/twrnc';
import { useTheme } from '@/libs/providers/ThemeProvider';
import { Image } from 'expo-image';
import LotteryResultSheet from '@/libs/components/LotteryResultSheet';
import { apiPostData, handleApiError } from '@/libs/utils/API_URILS';
import { useToast } from '@/libs/providers/ToastProvider';

const LotteryCheckScreen = () => {
  const { palette } = useTheme();
  const { showToast } = useToast();
  const [ticketNumber, setTicketNumber] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  
  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Start glow animation
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleNumberChange = (text: string) => {
    // Allow only numbers and limit to 6 digits
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
    setTicketNumber(cleaned);
    
    // Animate input when typing
    if (cleaned.length > ticketNumber.length) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleCheck = async () => {
    if (ticketNumber.length !== 6) {
      showToast('error', 'ข้อผิดพลาด', 'กรุณากรอกเลข 6 หลัก');
      return;
    }

    Keyboard.dismiss();
    setIsChecking(true);

    // Animate button press
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    try {
      // Call API using API_UTILS
      const response = await apiPostData('/api/lottery/check', {
        ticketNumber: ticketNumber,
      });

      setResultData(response);
      setShowResult(true);
      
      // Show success feedback based on status
      if (response?.data?.status === 'win') {
        showToast('success', '🎉 ยินดีด้วย!', 'คุณถูกรางวัล!');
      }
    } catch (error) {
      handleApiError(
        error,
        (message) => {
          showToast('error', 'ตรวจหวยไม่สำเร็จ', message);
        }
      );
    } finally {
      setIsChecking(false);
      rotateAnim.setValue(0);
    }
  };

  const handleScan = () => {
    router.push('/user/scan');
  };

  const handleHistory = () => {
    router.push('/user/history');
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Container>
      <LinearGradient
        colors={['#1A0F0F', '#2D1810', '#1A0F0F']}
        style={tw`flex-1`}
      >
        <ScrollView 
          contentContainerStyle={tw`flex-grow pb-20`}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={tw`items-center mt-12 mb-8`}>
            {/* Logo with glow effect */}
            <Animated.View style={[tw`relative`, { opacity: glowOpacity }]}>
              <View style={[tw`absolute inset-0 bg-yellow-400 rounded-full blur-xl`, { transform: [{ scale: 1.5 }] }]} />
            </Animated.View>
            
            <View style={tw`items-center`}>
              <Text style={[tw`text-5xl font-bold mb-2`, { color: '#FFD700', fontFamily: 'Kanit_700Bold' }]}>
                🎰 หวยมีคีย์ 🎰
              </Text>
              <Text style={[tw`text-lg`, { color: '#D4A574', fontFamily: 'Kanit_300Light' }]}>
                ลุ้นรวย ลุ้นโชค ลุ้นหัวใจ
              </Text>
            </View>

            {/* Current Draw Date */}
            <View style={tw`mt-4 px-4 py-2 bg-black/30 rounded-full border border-yellow-600/30`}>
              <Text style={[tw`text-sm`, { color: '#F5E6D3' }]}>
                งวดวันที่ 1 มกราคม 2568
              </Text>
            </View>
          </View>

          {/* Main Input Section */}
          <View style={tw`px-6`}>
            <Animated.View 
              style={[
                tw`bg-black/40 rounded-2xl p-6 border-2 border-yellow-600/30`,
                { transform: [{ scale: scaleAnim }] }
              ]}
            >
              <Text style={[tw`text-center text-xl mb-4`, { color: '#FFD700', fontFamily: 'Kanit_500Medium' }]}>
                ✨ กรอกเลขเด็ด 6 หลัก ✨
              </Text>

              {/* Number Input with fancy style */}
              <View style={tw`relative`}>
                <TextInput
                  value={ticketNumber}
                  onChangeText={handleNumberChange}
                  placeholder="000000"
                  placeholderTextColor="#8B7355"
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[
                    tw`text-center text-5xl py-4 px-6 bg-black/60 rounded-xl border-2`,
                    {
                      color: '#FFD700',
                      fontFamily: 'Aboreto_400Regular',
                      borderColor: ticketNumber.length === 6 ? '#FFD700' : '#D4AF37',
                      letterSpacing: 8,
                    }
                  ]}
                />
                
                {/* Decorative elements */}
                {ticketNumber.length === 6 && (
                  <View style={tw`absolute -top-2 -right-2`}>
                    <Text style={tw`text-2xl`}>✨</Text>
                  </View>
                )}
              </View>

              {/* Check Button */}
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Pressable onPress={handleCheck} disabled={isChecking || ticketNumber.length !== 6}>
                  <LinearGradient
                    colors={ticketNumber.length === 6 ? ['#FFD700', '#D4AF37', '#B8860B'] : ['#8B7355', '#6B5D54', '#5B4D44']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      tw`mt-6 rounded-full py-4 px-8`,
                      ticketNumber.length === 6 && tw`shadow-xl`
                    ]}
                  >
                    <Text style={[tw`text-center text-xl font-bold`, { color: ticketNumber.length === 6 ? '#1A0F0F' : '#F5E6D3' }]}>
                      {isChecking ? '🔮 กำลังเสี่ยงโชค...' : '🎲 ตรวจหวย'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            </Animated.View>
          </View>

          {/* Quick Actions */}
          <View style={tw`px-6 mt-8`}>
            <View style={tw`flex-row justify-between gap-4`}>
              {/* Scan Button */}
              <Pressable 
                onPress={handleScan}
                style={tw`flex-1`}
              >
                <LinearGradient
                  colors={['#2D1810', '#3D2520']}
                  style={tw`rounded-xl p-4 border border-yellow-600/20`}
                >
                  <View style={tw`items-center`}>
                    <Ionicons name="camera" size={32} color="#FFD700" />
                    <Text style={[tw`mt-2 text-sm`, { color: '#D4A574' }]}>
                      สแกน QR
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>

              {/* History Button */}
              <Pressable 
                onPress={handleHistory}
                style={tw`flex-1`}
              >
                <LinearGradient
                  colors={['#2D1810', '#3D2520']}
                  style={tw`rounded-xl p-4 border border-yellow-600/20`}
                >
                  <View style={tw`items-center`}>
                    <MaterialCommunityIcons name="history" size={32} color="#FFD700" />
                    <Text style={[tw`mt-2 text-sm`, { color: '#D4A574' }]}>
                      ประวัติ
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>

              {/* News Button */}
              <Pressable 
                onPress={() => router.push('/user/news')}
                style={tw`flex-1`}
              >
                <LinearGradient
                  colors={['#2D1810', '#3D2520']}
                  style={tw`rounded-xl p-4 border border-yellow-600/20`}
                >
                  <View style={tw`items-center`}>
                    <Ionicons name="newspaper" size={32} color="#FFD700" />
                    <Text style={[tw`mt-2 text-sm`, { color: '#D4A574' }]}>
                      เลขเด็ด
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          {/* Lucky Numbers Suggestion */}
          <View style={tw`px-6 mt-8`}>
            <View style={tw`bg-black/30 rounded-xl p-4 border border-yellow-600/20`}>
              <Text style={[tw`text-center text-sm mb-2`, { color: '#D4A574' }]}>
                💫 เลขมงคลประจำวัน 💫
              </Text>
              <View style={tw`flex-row justify-center gap-2`}>
                {['23', '45', '67', '89', '01', '99'].map((num, idx) => (
                  <View key={idx} style={tw`bg-yellow-900/30 rounded-lg px-3 py-1`}>
                    <Text style={[tw`text-lg`, { color: '#FFD700', fontFamily: 'Aboreto_400Regular' }]}>
                      {num}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Result Sheet */}
        {showResult && resultData && (
          <LotteryResultSheet
            isVisible={showResult}
            onClose={() => {
              setShowResult(false);
              setResultData(null);
              setTicketNumber('');
            }}
            resultData={resultData}
            ticketNumber={ticketNumber}
          />
        )}
      </LinearGradient>
    </Container>
  );
};

export default LotteryCheckScreen;