import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, ActivityIndicator, Linking, Share } from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';
import tw from '@/libs/constants/twrnc';
import Container from '@/libs/components/Container';
import { apiGetData, handleApiError } from '@/libs/utils/API_URILS';
import { useToast } from '@/libs/providers/ToastProvider';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming,
  withSpring,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

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
  const { showToast } = useToast();
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [nextDraw, setNextDraw] = useState<NextDraw | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isLive, setIsLive] = useState(false);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const liveIndicatorAnim = useRef(new Animated.Value(0)).current;
  const countdownAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchStreams();
    fetchNextDraw();
    
    // Start animations
    startAnimations();
    
    // Update countdown every second
    const interval = setInterval(() => {
      updateCountdown();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const startAnimations = () => {
    // Pulse animation for live indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Live indicator animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(liveIndicatorAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(liveIndicatorAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Countdown animation
    Animated.timing(countdownAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  // Animated styles
  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseAnim }],
    };
  });

  const liveIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(liveIndicatorAnim.value, [0, 1], [0.3, 1], Extrapolate.CLAMP);
    return {
      opacity,
    };
  });

  const countdownStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: countdownAnim.value }],
    };
  });

  const fetchStreams = async () => {
    try {
      const response = await apiGetData('/api/lottery/live-streams');
      if (response.success) {
        setStreams(response.data);
        // Auto-select first live stream
        const liveStream = response.data.find((s: LiveStream) => s.isLive);
        if (liveStream) {
          setSelectedStream(liveStream);
          setIsLive(true);
        }
      }
    } catch (error) {
      // Mock data for demo
      const mockStreams: LiveStream[] = [
        {
          id: '1',
          title: 'กองสลากฯ Official',
          url: 'https://www.youtube.com/embed/live',
          platform: 'youtube',
          isLive: true,
          viewerCount: 15420,
        },
        {
          id: '2',
          title: 'หวยออกสด Facebook',
          url: 'https://www.facebook.com/embed/live',
          platform: 'facebook',
          isLive: false,
          scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        },
      ];
      setStreams(mockStreams);
      setSelectedStream(mockStreams[0]);
      setIsLive(true);
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
      // Mock data for demo
      const nextDrawDate = new Date();
      nextDrawDate.setDate(nextDrawDate.getDate() + 1);
      nextDrawDate.setHours(14, 30, 0, 0);
      
      setNextDraw({
        date: nextDrawDate.toISOString(),
        countdown: {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        },
      });
    }
  };

  const shareStream = async () => {
    if (!selectedStream) return;
    
    try {
      const shareMessage = `📺 ดูถ่ายทอดสดหวยกับ KeyLotto\n\n` +
        `🎰 ${selectedStream.title}\n` +
        `${selectedStream.isLive ? '🔴 LIVE NOW' : '⏰ เริ่มเร็วๆ นี้'}\n` +
        `${selectedStream.viewerCount ? `👥 ${selectedStream.viewerCount.toLocaleString()} คนดู` : ''}\n` +
        `\n#KeyLotto #ถ่ายทอดสด #หวยออก`;
      
      await Share.share({
        message: shareMessage,
        title: 'ถ่ายทอดสดหวย KeyLotto',
      });
    } catch (error) {
      showToast('error', 'ไม่สามารถแชร์ได้', 'กรุณาลองใหม่อีกครั้ง');
    }
  };

  const openExternalLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      showToast('error', 'ไม่สามารถเปิดลิงก์ได้', 'กรุณาลองใหม่อีกครั้ง');
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
        {isLive && (
          <Animated.View entering={FadeInUp.delay(300)}>
            <BlurView intensity={20} style={tw`mx-4 rounded-full overflow-hidden`}>
              <View style={tw`bg-red-500/20 px-6 py-3 flex-row items-center justify-center`}>
                <Animated.View style={[tw`mr-3`, pulseStyle]}>
                  <View style={tw`w-4 h-4 bg-red-500 rounded-full`} />
                </Animated.View>
                <Animated.View style={liveIndicatorStyle}>
                  <Text style={tw`text-red-500 font-bold text-lg`}>LIVE NOW</Text>
                </Animated.View>
                <LottieView
                  source={require('@/assets/animations/live.json')}
                  autoPlay
                  loop
                  style={tw`w-6 h-6 ml-2`}
                />
              </View>
            </BlurView>
          </Animated.View>
        )}

        {/* Video Player */}
        {selectedStream && (
          <Animated.View entering={FadeInUp.delay(400)} style={tw`mx-4 mb-4`}>
            <BlurView intensity={20} style={tw`rounded-2xl overflow-hidden`}>
              <View style={tw`bg-black rounded-2xl overflow-hidden`}>
                <WebView
                  source={{ uri: selectedStream.url }}
                  style={{ width: width - 32, height: (width - 32) * 9 / 16 }}
                  allowsFullscreenVideo
                  mediaPlaybackRequiresUserAction={false}
                />
                
                {/* Stream Info */}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={tw`absolute bottom-0 left-0 right-0 p-4`}
                >
                  <View style={tw`flex-row justify-between items-center`}>
                    <View style={tw`flex-row items-center flex-1`}>
                      <View style={tw`w-8 h-8 rounded-full items-center justify-center mr-3`}
                        style={{ backgroundColor: platformIcons[selectedStream.platform].color + '20' }}
                      >
                        <Ionicons 
                          name={platformIcons[selectedStream.platform].name as any}
                          size={20}
                          color={platformIcons[selectedStream.platform].color}
                        />
                      </View>
                      <Text style={tw`text-white font-semibold text-lg flex-1`}>{selectedStream.title}</Text>
                    </View>
                    
                    <View style={tw`flex-row items-center gap-3`}>
                      {selectedStream.viewerCount && (
                        <View style={tw`flex-row items-center bg-white/20 rounded-full px-3 py-1`}>
                          <Ionicons name="people" size={16} color="white" />
                          <Text style={tw`text-white ml-1 text-sm font-medium`}>
                            {selectedStream.viewerCount.toLocaleString()}
                          </Text>
                        </View>
                      )}
                      
                      <Pressable
                        onPress={shareStream}
                        style={tw`bg-white/20 rounded-full p-2`}
                      >
                        <Ionicons name="share-outline" size={20} color="white" />
                      </Pressable>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </BlurView>
          </Animated.View>
        )}

        {/* Stream List */}
        <View style={tw`px-4 mb-6`}>
          <Text style={tw`text-white font-bold text-xl mb-4`}>📺 ช่องถ่ายทอด</Text>
          
          {loading ? (
            <View style={tw`items-center py-8`}>
              <LottieView
                source={require('@/assets/animations/loading.json')}
                autoPlay
                loop
                style={tw`w-12 h-12`}
              />
              <Text style={tw`text-white/60 mt-2`}>กำลังโหลด...</Text>
            </View>
          ) : (
            streams.map((stream, index) => (
              <Animated.View
                key={stream.id}
                entering={FadeInUp.delay(index * 100)}
              >
                <Pressable
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedStream(stream);
                  }}
                  style={tw`bg-white/10 rounded-xl p-4 mb-3 ${
                    selectedStream?.id === stream.id ? 'border-2 border-yellow-400 bg-white/20' : ''
                  }`}
                >
                  <View style={tw`flex-row justify-between items-center`}>
                    <View style={tw`flex-row items-center flex-1`}>
                      <View style={tw`w-12 h-12 rounded-full items-center justify-center mr-4`}
                        style={{ backgroundColor: platformIcons[stream.platform].color + '20' }}
                      >
                        <Ionicons 
                          name={platformIcons[stream.platform].name as any}
                          size={24}
                          color={platformIcons[stream.platform].color}
                        />
                      </View>
                      <View style={tw`flex-1`}>
                        <Text style={tw`text-white font-bold text-lg`}>{stream.title}</Text>
                        {stream.scheduledTime && !stream.isLive && (
                          <Text style={tw`text-white/60 text-sm`}>
                            เริ่ม {format(new Date(stream.scheduledTime), 'HH:mm น.', { locale: th })}
                          </Text>
                        )}
                        {stream.viewerCount && (
                          <Text style={tw`text-white/60 text-sm`}>
                            👥 {stream.viewerCount.toLocaleString()} คนดู
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    {stream.isLive && (
                      <Animated.View style={pulseStyle}>
                        <View style={tw`bg-red-500 rounded-full px-4 py-2 flex-row items-center`}>
                          <View style={tw`w-2 h-2 bg-white rounded-full mr-2`} />
                          <Text style={tw`text-white text-xs font-bold`}>LIVE</Text>
                        </View>
                      </Animated.View>
                    )}
                  </View>
                </Pressable>
              </Animated.View>
            ))
          )}
        </View>

        {/* Quick Links */}
        <View style={tw`px-4 mb-6`}>
          <Text style={tw`text-white font-bold text-xl mb-4`}>🔗 ลิงก์ที่เกี่ยวข้อง</Text>
          
          <View style={tw`flex-row flex-wrap`}>
            {[
              { label: 'กองสลากฯ', icon: 'globe', url: 'https://www.glo.or.th', color: '#4CAF50' },
              { label: 'ตรวจหวย', icon: 'search', url: '/user/lottery-check', color: '#FFD700' },
              { label: 'ผลย้อนหลัง', icon: 'time', url: '/user/history', color: '#2196F3' },
              { label: 'ข่าวหวย', icon: 'newspaper', url: '/user/news', color: '#FF5722' },
            ].map((link, index) => (
              <Animated.View
                key={index}
                entering={FadeInUp.delay(index * 100)}
              >
                <Pressable
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (link.url.startsWith('http')) {
                      openExternalLink(link.url);
                    } else {
                      // Navigate to internal route
                      showToast('info', 'กำลังพัฒนา', 'ฟีเจอร์นี้กำลังพัฒนา');
                    }
                  }}
                  style={tw`bg-white/10 rounded-xl px-4 py-3 mr-2 mb-2 flex-row items-center`}
                >
                  <View style={tw`w-8 h-8 rounded-full items-center justify-center mr-3`}
                    style={{ backgroundColor: link.color + '20' }}
                  >
                    <Ionicons name={link.icon as any} size={18} color={link.color} />
                  </View>
                  <Text style={tw`text-white font-medium`}>{link.label}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Tips */}
        <BlurView intensity={20} style={tw`mx-4 rounded-xl overflow-hidden mb-8`}>
          <LinearGradient
            colors={['#FFD700', '#FFA500', '#FF6347']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tw`p-6`}
          >
            <View style={tw`flex-row items-start`}>
              <View style={tw`w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-4`}>
                <Ionicons name="information-circle" size={24} color="white" />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-white font-bold text-lg mb-3`}>💡 เคล็ดลับ</Text>
                <View style={tw`space-y-2`}>
                  <Text style={tw`text-white/90 text-base leading-relaxed`}>
                    • หวยออกทุกวันที่ 1 และ 16 ของเดือน
                  </Text>
                  <Text style={tw`text-white/90 text-base leading-relaxed`}>
                    • เริ่มออกรางวัลประมาณ 14:30 น.
                  </Text>
                  <Text style={tw`text-white/90 text-base leading-relaxed`}>
                    • สามารถดูย้อนหลังได้จาก YouTube กองสลากฯ
                  </Text>
                  <Text style={tw`text-white/90 text-base leading-relaxed`}>
                    • ตั้งการแจ้งเตือนเพื่อไม่พลาดการออก
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </ScrollView>
    </Container>
  );
}