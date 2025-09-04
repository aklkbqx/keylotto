import React, { useRef, useState } from 'react';
import { View, Text, Pressable, Share, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import tw from '@/libs/constants/twrnc';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface ShareResultProps {
  result: {
    ticketNumber: string;
    drawDate: string;
    status: 'win' | 'near' | 'miss';
    prize?: {
      name: string;
      amount: number;
    };
    nearMiss?: {
      type: string;
      description: string;
    };
    funnyMessage?: string;
  };
  onClose?: () => void;
}

export default function ShareResult({ result, onClose }: ShareResultProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const [loading, setLoading] = useState(false);

  const getStatusEmoji = () => {
    switch (result.status) {
      case 'win': return '🎉';
      case 'near': return '😭';
      case 'miss': return '😅';
      default: return '🎰';
    }
  };

  const getStatusText = () => {
    switch (result.status) {
      case 'win': return 'ถูกรางวัล!';
      case 'near': return 'เฉียดฉิว!';
      case 'miss': return 'เสียใจด้วย';
      default: return '';
    }
  };

  const getGradientColors = () => {
    switch (result.status) {
      case 'win': return ['#FFD700', '#FFA500', '#FF6347'];
      case 'near': return ['#667eea', '#764ba2', '#f093fb'];
      case 'miss': return ['#6B7280', '#4B5563', '#374151'];
      default: return ['#FFD700', '#FFA500', '#FF6347'];
    }
  };

  const captureAndShare = async (platform?: string) => {
    if (!viewShotRef.current) return;

    setLoading(true);
    try {
      // Capture the view as image
      const uri = await viewShotRef.current.capture();

      if (platform === 'save') {
        // Save to gallery
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(uri);
          Toast.show({
            type: 'success',
            text1: 'บันทึกรูปภาพแล้ว',
            text2: 'ตรวจสอบในแกลเลอรี่ของคุณ',
          });
        } else {
          Toast.show({
            type: 'error',
            text1: 'ไม่สามารถบันทึกรูปได้',
            text2: 'กรุณาอนุญาตการเข้าถึงแกลเลอรี่',
          });
        }
      } else {
        // Share to social media
        const shareMessage = `🎰 KeyLotto - ผลการตรวจหวย\n\n` +
          `📅 งวดวันที่ ${format(new Date(result.drawDate), 'dd MMMM yyyy', { locale: th })}\n` +
          `🎫 หมายเลข: ${result.ticketNumber}\n` +
          `${getStatusEmoji()} ${getStatusText()}\n` +
          `${result.prize ? `💰 ${result.prize.name} ${result.prize.amount.toLocaleString()} บาท\n` : ''}` +
          `${result.nearMiss ? `😢 ${result.nearMiss.description}\n` : ''}` +
          `${result.funnyMessage ? `\n"${result.funnyMessage}"\n` : ''}` +
          `\n#KeyLotto #ตรวจหวย #หวยมีคีย์`;

        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'แชร์ผลการตรวจหวย',
            UTI: 'image/png',
          });
        } else {
          await Share.share({
            message: shareMessage,
            url: uri,
            title: 'ผลการตรวจหวย KeyLotto',
          });
        }
      }
    } catch (error) {
      console.error('Share error:', error);
      Toast.show({
        type: 'error',
        text1: 'เกิดข้อผิดพลาด',
        text2: 'ไม่สามารถแชร์ได้ในขณะนี้',
      });
    } finally {
      setLoading(false);
    }
  };

  const shareText = async () => {
    const shareMessage = `🎰 ตรวจหวยกับ KeyLotto\n\n` +
      `📅 งวด: ${format(new Date(result.drawDate), 'dd MMMM yyyy', { locale: th })}\n` +
      `🎫 เลข: ${result.ticketNumber}\n` +
      `${getStatusEmoji()} ผล: ${getStatusText()}\n` +
      `${result.prize ? `💰 ${result.prize.name} ${result.prize.amount.toLocaleString()} บาท\n` : ''}` +
      `${result.nearMiss ? `${result.nearMiss.description}\n` : ''}` +
      `${result.funnyMessage ? `\n"${result.funnyMessage}"\n` : ''}` +
      `\n#KeyLotto #ตรวจหวย`;

    try {
      await Share.share({
        message: shareMessage,
        title: 'ผลการตรวจหวย KeyLotto',
      });
    } catch (error) {
      console.error('Share text error:', error);
    }
  };

  return (
    <View style={tw`flex-1 bg-black/50`}>
      {/* Share Card */}
      <ViewShot
        ref={viewShotRef}
        options={{ format: 'png', quality: 1 }}
        style={tw`bg-white`}
      >
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={tw`p-6`}
        >
          {/* Header */}
          <View style={tw`items-center mb-6`}>
            <View style={tw`bg-white/20 rounded-full p-4 mb-3`}>
              <Text style={tw`text-6xl`}>{getStatusEmoji()}</Text>
            </View>
            <Text style={tw`text-3xl font-bold text-white font-aboreto`}>
              {getStatusText()}
            </Text>
          </View>

          {/* Ticket Number */}
          <View style={tw`bg-white/90 rounded-2xl p-4 mb-4`}>
            <Text style={tw`text-center text-gray-600 mb-2`}>หมายเลข</Text>
            <Text style={tw`text-center text-4xl font-bold text-gray-800`}>
              {result.ticketNumber}
            </Text>
            <Text style={tw`text-center text-gray-500 mt-2`}>
              งวดวันที่ {format(new Date(result.drawDate), 'dd MMMM yyyy', { locale: th })}
            </Text>
          </View>

          {/* Prize Info */}
          {result.prize && (
            <View style={tw`bg-yellow-400/90 rounded-2xl p-4 mb-4`}>
              <Text style={tw`text-center text-lg font-bold text-gray-800`}>
                {result.prize.name}
              </Text>
              <Text style={tw`text-center text-2xl font-bold text-green-700 mt-1`}>
                ฿{result.prize.amount.toLocaleString()}
              </Text>
            </View>
          )}

          {/* Near Miss Info */}
          {result.nearMiss && (
            <View style={tw`bg-white/80 rounded-2xl p-4 mb-4`}>
              <Text style={tw`text-center text-purple-600 font-bold`}>
                {result.nearMiss.description}
              </Text>
            </View>
          )}

          {/* Funny Message */}
          {result.funnyMessage && (
            <View style={tw`bg-white/70 rounded-2xl p-4 mb-4`}>
              <Text style={tw`text-center text-gray-700 italic text-lg leading-relaxed`}>
                "{result.funnyMessage}"
              </Text>
            </View>
          )}

          {/* App Branding */}
          <View style={tw`items-center mt-4`}>
            <View style={tw`flex-row items-center`}>
              <Text style={tw`text-2xl mr-2`}>🎰</Text>
              <Text style={tw`text-white font-bold text-xl font-aboreto`}>KeyLotto</Text>
            </View>
            <Text style={tw`text-white/80 text-sm mt-1`}>หวยมีคีย์ ให้โชคทุกงวด</Text>
          </View>
        </LinearGradient>
      </ViewShot>

      {/* Share Buttons */}
      <View style={tw`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6`}>
        <Text style={tw`text-xl font-bold text-center mb-4`}>แชร์ผลลัพธ์</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#FFD700" />
        ) : (
          <>
            {/* Social Media Buttons */}
            <View style={tw`flex-row justify-around mb-4`}>
              <Pressable
                onPress={() => captureAndShare('facebook')}
                style={tw`items-center`}
              >
                <View style={tw`w-14 h-14 bg-blue-600 rounded-full items-center justify-center mb-2`}>
                  <Ionicons name="logo-facebook" size={28} color="white" />
                </View>
                <Text style={tw`text-xs text-gray-600`}>Facebook</Text>
              </Pressable>

              <Pressable
                onPress={() => captureAndShare('line')}
                style={tw`items-center`}
              >
                <View style={tw`w-14 h-14 bg-green-500 rounded-full items-center justify-center mb-2`}>
                  <Ionicons name="chatbubble-ellipses" size={28} color="white" />
                </View>
                <Text style={tw`text-xs text-gray-600`}>LINE</Text>
              </Pressable>

              <Pressable
                onPress={() => captureAndShare('instagram')}
                style={tw`items-center`}
              >
                <View style={tw`w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full items-center justify-center mb-2`}>
                  <Ionicons name="logo-instagram" size={28} color="white" />
                </View>
                <Text style={tw`text-xs text-gray-600`}>Instagram</Text>
              </Pressable>

              <Pressable
                onPress={() => captureAndShare('save')}
                style={tw`items-center`}
              >
                <View style={tw`w-14 h-14 bg-gray-600 rounded-full items-center justify-center mb-2`}>
                  <Ionicons name="download" size={28} color="white" />
                </View>
                <Text style={tw`text-xs text-gray-600`}>บันทึก</Text>
              </Pressable>
            </View>

            {/* Text Share Button */}
            <Pressable
              onPress={shareText}
              style={tw`bg-gray-100 rounded-xl py-3 mb-3`}
            >
              <View style={tw`flex-row items-center justify-center`}>
                <Ionicons name="text" size={20} color="#4B5563" />
                <Text style={tw`text-gray-700 ml-2`}>แชร์เป็นข้อความ</Text>
              </View>
            </Pressable>

            {/* Close Button */}
            {onClose && (
              <Pressable
                onPress={onClose}
                style={tw`py-3`}
              >
                <Text style={tw`text-center text-gray-500`}>ปิด</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </View>
  );
}