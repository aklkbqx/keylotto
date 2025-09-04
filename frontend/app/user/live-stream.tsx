import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/libs/utils/tailwind';
import Container from '@/libs/components/Container';
import { apiGetData, handleApiError } from '@/libs/utils/API_URILS';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface LiveStream {
  id: string;
  title: string;
  url: string;
  platform: 'youtube' | 'facebook' | 'glo';
  isLive: boolean;
  scheduledTime?: string;
  viewerCount?: number;
}

interface NextDraw {
  date: string;
  countdown: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
}

export default function LiveStreamScreen() {
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [nextDraw, setNextDraw] = useState<NextDraw | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetchStreams();
    fetchNextDraw();
    
    // Update countdown every second
    const interval = setInterval(() => {
      updateCountdown();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchStreams = async () => {
    try {
      const response = await apiGetData('/api/lottery/live-streams');
      if (response.success) {
        setStreams(response.data);
        // Auto-select first live stream
        const liveStream = response.data.find((s: LiveStream) => s.isLive);
        if (liveStream) {
          setSelectedStream(liveStream);
        }
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNextDraw = async () => {
    try {
      const response = await apiGetData('/api/lottery/next-draw');
      if (response.success) {
        setNextDraw(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch next draw:', error);
    }
  };

  const updateCountdown = () => {
    if (!nextDraw) return;
    
    const now = new Date().getTime();
    const drawTime = new Date(nextDraw.date).getTime();
    const difference = drawTime - now;

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    }
  };

  const pulseAnimation = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withRepeat(
            withSequence(
              withTiming(1.2, { duration: 1000 }),
              withTiming(1, { duration: 1000 })
            ),
            -1,
            true
          ),
        },
      ],
    };
  });

  const platformIcons = {
    youtube: { name: 'logo-youtube', color: '#FF0000' },
    facebook: { name: 'logo-facebook', color: '#1877F2' },
    glo: { name: 'trophy', color: '#FFD700' },
  };

  return (
    <Container>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={tw`absolute inset-0`}
      />

      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={tw`px-4 pt-12 pb-4`}>
          <Animated.View entering={FadeInDown.delay(100)}>
            <Text style={tw`text-3xl font-bold text-white text-center font-aboreto`}>
              ถ่ายทอดสดหวย 📺
            </Text>
            <Text style={tw`text-white/70 text-center mt-2`}>
              รับชมการออกรางวัลสดๆ ทุกงวด
            </Text>
          </Animated.View>
        </View>

        {/* Countdown Timer */}
        {nextDraw && (
          <Animated.View entering={FadeInUp.delay(200)}>
            <View style={tw`bg-white/10 mx-4 rounded-2xl p-4 mb-4`}>
              <Text style={tw`text-white text-center mb-2`}>งวดถัดไป</Text>
              <Text style={tw`text-yellow-300 text-center text-lg font-bold mb-3`}>
                {format(new Date(nextDraw.date), 'dd MMMM yyyy เวลา HH:mm น.', { locale: th })}
              </Text>
              
              <View style={tw`flex-row justify-around`}>
                {[
                  { value: countdown.days, label: 'วัน' },
                  { value: countdown.hours, label: 'ชั่วโมง' },
                  { value: countdown.minutes, label: 'นาที' },
                  { value: countdown.seconds, label: 'วินาที' },
                ].map((item, index) => (
                  <View key={index} style={tw`items-center`}>
                    <View style={tw`bg-white/20 rounded-xl px-3 py-2 min-w-16`}>
                      <Text style={tw`text-white text-2xl font-bold text-center`}>
                        {String(item.value).padStart(2, '0')}
                      </Text>
                    </View>
                    <Text style={tw`text-white/60 text-xs mt-1`}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Live Indicator */}
        {streams.some(s => s.isLive) && (
          <Animated.View entering={FadeInUp.delay(300)}>
            <View style={tw`flex-row items-center justify-center mb-4`}>
              <Animated.View style={[tw`mr-2`, pulseAnimation]}>
                <View style={tw`w-3 h-3 bg-red-500 rounded-full`} />
              </Animated.View>
              <Text style={tw`text-red-500 font-bold`}>LIVE NOW</Text>
            </View>
          </Animated.View>
        )}

        {/* Video Player */}
        {selectedStream && (
          <View style={tw`mx-4 mb-4 rounded-2xl overflow-hidden bg-black`}>
            <WebView
              source={{ uri: selectedStream.url }}
              style={{ width: width - 32, height: (width - 32) * 9 / 16 }}
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
            />
            
            {/* Stream Info */}
            <View style={tw`bg-white/10 p-3`}>
              <View style={tw`flex-row justify-between items-center`}>
                <View style={tw`flex-row items-center`}>
                  <Ionicons 
                    name={platformIcons[selectedStream.platform].name as any}
                    size={20}
                    color={platformIcons[selectedStream.platform].color}
                  />
                  <Text style={tw`text-white ml-2`}>{selectedStream.title}</Text>
                </View>
                {selectedStream.viewerCount && (
                  <View style={tw`flex-row items-center`}>
                    <Ionicons name="people" size={16} color="white" />
                    <Text style={tw`text-white ml-1 text-sm`}>
                      {selectedStream.viewerCount.toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Stream List */}
        <View style={tw`px-4 mb-4`}>
          <Text style={tw`text-white font-bold text-lg mb-3`}>ช่องถ่ายทอด</Text>
          
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            streams.map((stream) => (
              <Pressable
                key={stream.id}
                onPress={() => setSelectedStream(stream)}
                style={tw`bg-white/10 rounded-xl p-4 mb-3 ${
                  selectedStream?.id === stream.id ? 'border border-yellow-400' : ''
                }`}
              >
                <View style={tw`flex-row justify-between items-center`}>
                  <View style={tw`flex-row items-center flex-1`}>
                    <View style={tw`w-10 h-10 rounded-full items-center justify-center mr-3`}
                      style={{ backgroundColor: platformIcons[stream.platform].color + '20' }}
                    >
                      <Ionicons 
                        name={platformIcons[stream.platform].name as any}
                        size={20}
                        color={platformIcons[stream.platform].color}
                      />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-white font-bold`}>{stream.title}</Text>
                      {stream.scheduledTime && !stream.isLive && (
                        <Text style={tw`text-white/60 text-sm`}>
                          เริ่ม {format(new Date(stream.scheduledTime), 'HH:mm น.', { locale: th })}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  {stream.isLive && (
                    <View style={tw`bg-red-500 rounded-full px-3 py-1`}>
                      <Text style={tw`text-white text-xs font-bold`}>LIVE</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            ))
          )}
        </View>

        {/* Quick Links */}
        <View style={tw`px-4 mb-8`}>
          <Text style={tw`text-white font-bold text-lg mb-3`}>ลิงก์ที่เกี่ยวข้อง</Text>
          
          <View style={tw`flex-row flex-wrap`}>
            {[
              { label: 'กองสลากฯ', icon: 'globe', url: 'https://www.glo.or.th' },
              { label: 'ตรวจหวย', icon: 'search', url: '/user/lottery-check' },
              { label: 'ผลย้อนหลัง', icon: 'time', url: '/user/history' },
              { label: 'ข่าวหวย', icon: 'newspaper', url: '/user/news' },
            ].map((link, index) => (
              <Pressable
                key={index}
                style={tw`bg-white/10 rounded-xl px-4 py-3 mr-2 mb-2 flex-row items-center`}
              >
                <Ionicons name={link.icon as any} size={16} color="#FFD700" />
                <Text style={tw`text-white ml-2`}>{link.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Tips */}
        <View style={tw`bg-yellow-500/10 mx-4 rounded-xl p-4 mb-8`}>
          <View style={tw`flex-row items-start`}>
            <Ionicons name="information-circle" size={20} color="#FCD34D" />
            <View style={tw`flex-1 ml-2`}>
              <Text style={tw`text-yellow-300 font-bold mb-1`}>เคล็ดลับ</Text>
              <Text style={tw`text-yellow-100 text-sm leading-relaxed`}>
                • หวยออกทุกวันที่ 1 และ 16 ของเดือน{'\n'}
                • เริ่มออกรางวัลประมาณ 14:30 น.{'\n'}
                • สามารถดูย้อนหลังได้จาก YouTube กองสลากฯ
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}