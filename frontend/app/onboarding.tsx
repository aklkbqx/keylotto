import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Dimensions, Image } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/libs/utils/tailwind';
import Container from '@/libs/components/Container';
import Button from '@/libs/components/Button';
import Animated, { 
  FadeInRight, 
  FadeOutLeft,
  useAnimatedStyle,
  withSpring,
  interpolate,
  useSharedValue,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

interface OnboardingItem {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  colors: string[];
}

const onboardingData: OnboardingItem[] = [
  {
    id: 1,
    title: 'ตรวจหวยแบบเซียน',
    subtitle: 'ไม่พลาดทุกรางวัล',
    description: 'ตรวจหวยได้ทุกงวด พร้อมระบบเฉียดรางวัลที่บอกว่าคุณเฉียดแค่ไหน',
    icon: '🎰',
    colors: ['#FFD700', '#FFA500', '#FF6347'],
  },
  {
    id: 2,
    title: 'สแกน QR & OCR',
    subtitle: 'ตรวจง่ายแค่ถ่ายรูป',
    description: 'สแกน QR Code หรือถ่ายรูปใบลอตเตอรี่ ระบบอ่านเลขให้อัตโนมัติ',
    icon: '📸',
    colors: ['#667eea', '#764ba2', '#f093fb'],
  },
  {
    id: 3,
    title: 'ข้อความสุดกวน',
    subtitle: 'หัวเราะได้แม้ไม่ถูก',
    description: 'ได้ข้อความฮาๆ กวนๆ ให้กำลังใจ ทำให้การตรวจหวยไม่น่าเบื่อ',
    icon: '😂',
    colors: ['#FA8BFF', '#2BD2FF', '#2BFF88'],
  },
  {
    id: 4,
    title: 'ทำนายฝัน & ข่าวเลขดัง',
    subtitle: 'ครบจบในแอปเดียว',
    description: 'ทำนายฝันเป็นเลขเด็ด ติดตามข่าวเลขดังจากทุกสำนัก',
    icon: '🔮',
    colors: ['#f093fb', '#f5576c', '#ffc837'],
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const progress = useSharedValue(0);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
      progress.value = withSpring((currentIndex + 1) / onboardingData.length);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    // Save onboarding completed flag
    router.replace('/user/lottery-check');
  };

  const currentItem = onboardingData[currentIndex];

  const progressBarStyle = useAnimatedStyle(() => {
    return {
      width: `${interpolate(
        progress.value,
        [0, 1],
        [0, 100]
      )}%`,
    };
  });

  return (
    <Container>
      <LinearGradient
        colors={currentItem.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={tw`absolute inset-0`}
      />

      {/* Skip Button */}
      <View style={tw`absolute top-12 right-6 z-10`}>
        <Pressable onPress={handleSkip}>
          <Text style={tw`text-white/80 text-lg`}>ข้าม</Text>
        </Pressable>
      </View>

      <View style={tw`flex-1 px-6`}>
        {/* Progress Bar */}
        <View style={tw`mt-20 mb-8`}>
          <View style={tw`h-1 bg-white/20 rounded-full overflow-hidden`}>
            <Animated.View 
              style={[
                tw`h-full bg-white rounded-full`,
                progressBarStyle
              ]} 
            />
          </View>
          <View style={tw`flex-row justify-between mt-4`}>
            {onboardingData.map((item, index) => (
              <View
                key={item.id}
                style={tw`w-2 h-2 rounded-full ${
                  index <= currentIndex ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </View>
        </View>

        {/* Content */}
        <Animated.View 
          entering={FadeInRight}
          exiting={FadeOutLeft}
          style={tw`flex-1 items-center justify-center`}
        >
          {/* Icon */}
          <View style={tw`w-40 h-40 bg-white/20 rounded-full items-center justify-center mb-8`}>
            <Text style={tw`text-8xl`}>{currentItem.icon}</Text>
          </View>

          {/* Title */}
          <Text style={tw`text-3xl font-bold text-white text-center mb-2 font-aboreto`}>
            {currentItem.title}
          </Text>

          {/* Subtitle */}
          <Text style={tw`text-xl text-white/90 text-center mb-6`}>
            {currentItem.subtitle}
          </Text>

          {/* Description */}
          <View style={tw`bg-white/10 rounded-2xl p-6 mx-4`}>
            <Text style={tw`text-white text-center text-lg leading-relaxed`}>
              {currentItem.description}
            </Text>
          </View>

          {/* Features List (for last slide) */}
          {currentIndex === onboardingData.length - 1 && (
            <View style={tw`mt-6 bg-white/10 rounded-2xl p-4`}>
              <View style={tw`flex-row items-center mb-2`}>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={tw`text-white ml-2`}>ตรวจหวยฟรี ไม่มีโฆษณา</Text>
              </View>
              <View style={tw`flex-row items-center mb-2`}>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={tw`text-white ml-2`}>อัพเดทผลหวยทันที</Text>
              </View>
              <View style={tw`flex-row items-center`}>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={tw`text-white ml-2`}>ข้อมูลปลอดภัย 100%</Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Navigation Buttons */}
        <View style={tw`pb-12`}>
          <Pressable
            onPress={handleNext}
            style={tw`bg-white rounded-full py-4 px-8 shadow-lg`}
          >
            <Text style={tw`text-center text-lg font-bold ${
              currentIndex === onboardingData.length - 1 
                ? 'text-green-600' 
                : 'text-primary-600'
            }`}>
              {currentIndex === onboardingData.length - 1 
                ? 'เริ่มใช้งาน' 
                : 'ถัดไป'}
            </Text>
          </Pressable>

          {/* Page Indicator Text */}
          <Text style={tw`text-white/60 text-center mt-4`}>
            {currentIndex + 1} จาก {onboardingData.length}
          </Text>
        </View>
      </View>
    </Container>
  );
}