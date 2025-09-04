import React, { useEffect, useRef, useState } from 'react';
import { View, Modal, Pressable, Animated, Share, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Text from '@/libs/components/Text';
import Button from '@/libs/components/Button';
import tw from '@/libs/constants/twrnc';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

interface LotteryResultSheetProps {
  isVisible: boolean;
  onClose: () => void;
  resultData: any;
  ticketNumber: string;
}

const LotteryResultSheet: React.FC<LotteryResultSheetProps> = ({
  isVisible,
  onClose,
  resultData,
  ticketNumber,
}) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Slide up animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      // Special animation for winning
      if (resultData?.data?.status === 'win') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    } else {
      // Slide down animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const getStatusConfig = () => {
    const status = resultData?.data?.status;
    const detail = resultData?.data?.detail;
    
    switch (status) {
      case 'win':
        return {
          emoji: '🎉',
          title: 'ถูกรางวัล!',
          titleColor: '#4CAF50',
          gradientColors: ['#4CAF50', '#66BB6A', '#81C784'],
          icon: 'trophy',
          animation: 'confetti',
        };
      case 'near':
        return {
          emoji: '😭',
          title: 'เฉียดฉิว!',
          titleColor: '#FFA726',
          gradientColors: ['#FFA726', '#FFB74D', '#FFCC80'],
          icon: 'heart-broken',
          animation: 'heartbreak',
        };
      case 'miss':
        return {
          emoji: '😅',
          title: 'ไม่ถูกรางวัล',
          titleColor: '#EF5350',
          gradientColors: ['#EF5350', '#E57373', '#EF9A9A'],
          icon: 'sad-outline',
          animation: 'sad',
        };
      default:
        return {
          emoji: '🤔',
          title: 'ผลการตรวจ',
          titleColor: '#9E9E9E',
          gradientColors: ['#9E9E9E', '#BDBDBD', '#E0E0E0'],
          icon: 'help-circle',
          animation: null,
        };
    }
  };

  const handleShare = async () => {
    try {
      const status = resultData?.data?.status;
      const message = resultData?.data?.message || '';
      const detail = resultData?.data?.detail;
      
      let shareText = `🎰 หวยมีคีย์ - ผลการตรวจหวย\n\n`;
      shareText += `เลขที่ตรวจ: ${ticketNumber}\n`;
      
      if (status === 'win') {
        shareText += `✅ ถูกรางวัล: ${detail?.prize}\n`;
        if (detail?.amount) {
          shareText += `💰 จำนวนเงิน: ${detail.amount.toLocaleString()} บาท\n`;
        }
      } else if (status === 'near') {
        shareText += `⚠️ เฉียดรางวัล!\n`;
        if (detail?.description) {
          shareText += `📝 ${detail.description}\n`;
        }
        if (detail?.nearTo) {
          shareText += `🎯 เลขที่ออก: ${detail.nearTo}\n`;
        }
      } else {
        shareText += `❌ ไม่ถูกรางวัล\n`;
      }
      
      shareText += `\n💬 "${message}"\n`;
      shareText += `\n#หวยมีคีย์ #KeyLotto #ลุ้นรวย`;

      await Share.share({
        message: shareText,
        title: 'ผลการตรวจหวย',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const config = getStatusConfig();
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          tw`flex-1 justify-end`,
          { opacity: fadeAnim }
        ]}
      >
        {/* Backdrop */}
        <Pressable 
          style={tw`absolute inset-0 bg-black/70`}
          onPress={onClose}
        />

        {/* Content Sheet */}
        <Animated.View
          style={[
            tw`bg-gray-900 rounded-t-3xl`,
            {
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ],
              maxHeight: height * 0.85,
            }
          ]}
        >
          <LinearGradient
            colors={['#2D1810', '#1A0F0F']}
            style={tw`rounded-t-3xl`}
          >
            {/* Handle Bar */}
            <View style={tw`items-center pt-3 pb-2`}>
              <View style={tw`w-12 h-1 bg-gray-600 rounded-full`} />
            </View>

            {/* Status Header */}
            <View style={tw`items-center px-6 pt-4`}>
              <Animated.View style={resultData?.data?.status === 'win' ? { transform: [{ rotate: spin }] } : {}}>
                <Text style={tw`text-6xl mb-2`}>{config.emoji}</Text>
              </Animated.View>
              
              <LinearGradient
                colors={config.gradientColors}
                style={tw`px-6 py-2 rounded-full mb-2`}
              >
                <Text style={[tw`text-2xl font-bold`, { color: '#FFFFFF' }]}>
                  {config.title}
                </Text>
              </LinearGradient>

              {/* Ticket Number Display */}
              <View style={tw`bg-black/40 rounded-xl px-6 py-3 mt-2 border-2 border-yellow-600/30`}>
                <Text style={[tw`text-3xl`, { color: '#FFD700', fontFamily: 'Aboreto_400Regular', letterSpacing: 4 }]}>
                  {ticketNumber}
                </Text>
              </View>
            </View>

            {/* Result Details */}
            <View style={tw`px-6 mt-6`}>
              {resultData?.data?.detail && (
                <View style={tw`bg-black/30 rounded-xl p-4 mb-4`}>
                  {resultData.data.detail.prize && (
                    <View style={tw`flex-row items-center mb-2`}>
                      <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" />
                      <Text style={[tw`ml-2 text-lg`, { color: '#FFD700' }]}>
                        {resultData.data.detail.prize}
                      </Text>
                    </View>
                  )}
                  
                  {resultData.data.detail.amount && (
                    <View style={tw`flex-row items-center mb-2`}>
                      <MaterialCommunityIcons name="cash" size={20} color="#4CAF50" />
                      <Text style={[tw`ml-2 text-xl font-bold`, { color: '#4CAF50' }]}>
                        {resultData.data.detail.amount.toLocaleString()} บาท
                      </Text>
                    </View>
                  )}

                  {resultData.data.detail.description && (
                    <View style={tw`flex-row items-start`}>
                      <Ionicons name="information-circle" size={20} color="#FFA726" />
                      <Text style={[tw`ml-2 flex-1`, { color: '#F5E6D3' }]}>
                        {resultData.data.detail.description}
                      </Text>
                    </View>
                  )}

                  {resultData.data.detail.nearTo && (
                    <View style={tw`flex-row items-center mt-2`}>
                      <Text style={[tw`text-sm`, { color: '#D4A574' }]}>
                        เลขที่ออก: 
                      </Text>
                      <Text style={[tw`ml-2 text-lg`, { color: '#FFD700', fontFamily: 'Aboreto_400Regular' }]}>
                        {resultData.data.detail.nearTo}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Funny Message */}
              {resultData?.data?.message && (
                <View style={tw`bg-gradient-to-r from-yellow-900/20 to-red-900/20 rounded-xl p-4 mb-6 border border-yellow-600/20`}>
                  <Text style={tw`text-center text-lg mb-2`}>💬</Text>
                  <Text style={[tw`text-center text-base leading-6`, { color: '#F5E6D3' }]}>
                    "{resultData.data.message}"
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={tw`flex-row gap-3 mb-6`}>
                {/* Share Button */}
                <Pressable 
                  onPress={handleShare}
                  style={tw`flex-1`}
                >
                  <LinearGradient
                    colors={['#FFD700', '#D4AF37', '#B8860B']}
                    style={tw`rounded-full py-3 px-4 flex-row items-center justify-center`}
                  >
                    <Ionicons name="share-social" size={20} color="#1A0F0F" />
                    <Text style={[tw`ml-2 font-bold`, { color: '#1A0F0F' }]}>
                      แชร์ผลลัพธ์
                    </Text>
                  </LinearGradient>
                </Pressable>

                {/* Check Again Button */}
                <Pressable 
                  onPress={onClose}
                  style={tw`flex-1`}
                >
                  <View style={tw`bg-black/40 rounded-full py-3 px-4 flex-row items-center justify-center border border-yellow-600/30`}>
                    <MaterialCommunityIcons name="refresh" size={20} color="#FFD700" />
                    <Text style={[tw`ml-2 font-bold`, { color: '#FFD700' }]}>
                      ตรวจใหม่
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default LotteryResultSheet;