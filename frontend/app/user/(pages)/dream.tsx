import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, TextInput as RNTextInput, ActivityIndicator, Dimensions, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';
import tw from '@/libs/constants/twrnc';
import Container from '@/libs/components/Container';
import { apiPostData, apiGetData, handleApiError } from '@/libs/utils/API_URILS';
import { useToast } from '@/libs/providers/ToastProvider';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

interface DreamResult {
  numbers: string[];
  meaning: string;
  confidence: number;
  relatedDreams: string[];
}

interface PopularDream {
  id: string;
  keyword: string;
  numbers: string[];
  count: number;
}

interface RecentInterpretation {
  id: string;
  dream: string;
  numbers: string[];
  date: string;
}

const { width, height } = Dimensions.get('window');

export default function DreamScreen() {
  const { showToast } = useToast();
  const [dreamText, setDreamText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DreamResult | null>(null);
  const [popularDreams, setPopularDreams] = useState<PopularDream[]>([]);
  const [recentInterpretations, setRecentInterpretations] = useState<RecentInterpretation[]>([]);
  const [selectedTab, setSelectedTab] = useState<'interpret' | 'popular' | 'history'>('interpret');
  
  // Animation values
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const numberAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const tabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchPopularDreams();
    fetchRecentInterpretations();
    
    // Start sparkle animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Animated styles
  const sparkleStyle = useAnimatedStyle(() => {
    const rotate = interpolate(sparkleAnim.value, [0, 1], [0, 360], Extrapolate.CLAMP);
    const scale = interpolate(sparkleAnim.value, [0, 0.5, 1], [1, 1.2, 1], Extrapolate.CLAMP);
    return {
      transform: [{ rotate: `${rotate}deg` }, { scale }],
    };
  });

  const numberStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(numberAnim.value) }],
    };
  });

  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: withSpring(cardAnim.value) }],
    };
  });

  const fetchPopularDreams = async () => {
    try {
      const response = await apiGetData('/api/lottery/dream/popular');
      if (response.success) {
        setPopularDreams(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch popular dreams:', error);
    }
  };

  const fetchRecentInterpretations = async () => {
    try {
      const response = await apiGetData('/api/lottery/dream/history');
      if (response.success) {
        setRecentInterpretations(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const interpretDream = async () => {
    if (!dreamText.trim()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('error', 'กรุณาใส่รายละเอียดความฝัน', 'บอกเล่าความฝันของคุณให้ละเอียด');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    
    // Animate card appearance
    cardAnim.value = withTiming(1, { duration: 300 });
    
    try {
      const response = await apiPostData('/api/lottery/dream', {
        dream: dreamText,
      });

      if (response.success) {
        setResult(response.data);
        
        // Animate numbers appearance
        numberAnim.value = withSequence(
          withTiming(1.2, { duration: 200 }),
          withSpring(1, { damping: 8, stiffness: 100 })
        );
        
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('success', 'ทำนายฝันสำเร็จ', 'ได้เลขเด็ดจากความฝันของคุณแล้ว!');
        
        // Refresh history
        fetchRecentInterpretations();
      }
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      handleApiError(error, (message) => {
        showToast('error', 'เกิดข้อผิดพลาด', message);
      });
    } finally {
      setLoading(false);
    }
  };

  const quickDreamButtons = [
    { text: 'ฝันว่างู', icon: '🐍', color: '#4CAF50' },
    { text: 'ฝันว่าน้ำท่วม', icon: '🌊', color: '#2196F3' },
    { text: 'ฝันว่าไฟไหม้', icon: '🔥', color: '#FF5722' },
    { text: 'ฝันเห็นพระ', icon: '🙏', color: '#FFD700' },
    { text: 'ฝันว่าตาย', icon: '💀', color: '#9E9E9E' },
    { text: 'ฝันว่าแต่งงาน', icon: '💑', color: '#E91E63' },
    { text: 'ฝันว่าท้อง', icon: '🤰', color: '#9C27B0' },
    { text: 'ฝันเห็นเงิน', icon: '💰', color: '#FFC107' },
  ];

  const handleQuickDream = async (text: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDreamText(text);
    interpretDream();
  };

  const copyNumbers = async (numbers: string[]) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const numbersText = numbers.join(', ');
    showToast('success', 'คัดลอกเลขแล้ว', numbersText);
  };

  const shareResult = async () => {
    if (!result) return;
    
    try {
      const shareMessage = `🔮 ทำนายฝันกับ KeyLotto\n\n` +
        `💭 ความฝัน: ${dreamText}\n` +
        `🎯 เลขเด็ด: ${result.numbers.join(', ')}\n` +
        `📝 ความหมาย: ${result.meaning}\n` +
        `\n#KeyLotto #ทำนายฝัน #หวยมีคีย์`;
      
      await Share.share({
        message: shareMessage,
        title: 'ผลการทำนายฝัน KeyLotto',
      });
    } catch (error) {
      showToast('error', 'ไม่สามารถแชร์ได้', 'กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <Container>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb', '#667eea']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={tw`absolute inset-0`}
      />

      {/* Animated Background Elements */}
      <Animated.View style={[tw`absolute top-20 right-8`, sparkleStyle]}>
        <Text style={tw`text-4xl`}>✨</Text>
      </Animated.View>
      <Animated.View style={[tw`absolute top-40 left-8`, sparkleStyle]}>
        <Text style={tw`text-3xl`}>⭐</Text>
      </Animated.View>
      <Animated.View style={[tw`absolute bottom-40 right-12`, sparkleStyle]}>
        <Text style={tw`text-2xl`}>🌟</Text>
      </Animated.View>

      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={tw`px-4 pt-12 pb-6`}>
          <Animated.View entering={FadeInDown.delay(100)}>
            <View style={tw`items-center`}>
              <Animated.View style={sparkleStyle}>
                <Text style={tw`text-6xl mb-2`}>🔮</Text>
              </Animated.View>
              <Text style={tw`text-3xl font-bold text-white text-center font-aboreto`}>
                ทำนายฝัน
              </Text>
              <Text style={tw`text-white/80 text-center mt-2 text-lg`}>
                แปลความฝันเป็นเลขเด็ด ตีตัวเลขจากความฝันของคุณ
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Tab Selector */}
        <BlurView intensity={20} style={tw`mx-4 rounded-xl overflow-hidden mb-4`}>
          <View style={tw`flex-row bg-white/10 p-1`}>
            {[
              { key: 'interpret', label: 'ทำนายฝัน', icon: 'moon' },
              { key: 'popular', label: 'ฝันยอดนิยม', icon: 'trending-up' },
              { key: 'history', label: 'ประวัติ', icon: 'time' },
            ].map((tab) => (
              <Pressable
                key={tab.key}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedTab(tab.key as any);
                }}
                style={tw`flex-1 flex-row items-center justify-center py-4 rounded-lg ${
                  selectedTab === tab.key ? 'bg-white/20' : ''
                }`}
              >
                <Ionicons 
                  name={tab.icon as any} 
                  size={20} 
                  color={selectedTab === tab.key ? '#FFD700' : 'white'} 
                />
                <Text style={tw`ml-2 font-semibold ${
                  selectedTab === tab.key ? 'text-yellow-300' : 'text-white'
                }`}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </BlurView>

        {/* Content based on selected tab */}
        {selectedTab === 'interpret' && (
          <Animated.View entering={FadeInUp.delay(200)}>
            {/* Dream Input Card */}
            <BlurView intensity={20} style={tw`mx-4 rounded-2xl overflow-hidden shadow-lg mb-4`}>
              <View style={tw`bg-white/90 p-6`}>
                <View style={tw`flex-row items-center mb-4`}>
                  <Text style={tw`text-2xl mr-2`}>🌙</Text>
                  <Text style={tw`text-xl font-bold text-gray-800`}>บอกเล่าความฝันของคุณ</Text>
                </View>
                
                <RNTextInput
                  value={dreamText}
                  onChangeText={setDreamText}
                  placeholder="เช่น ฝันว่าเจองูใหญ่สีทอง กำลังว่ายน้ำ..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  style={tw`bg-gray-50 rounded-xl p-4 text-gray-800 min-h-24 text-base`}
                />

                {/* Quick Dream Buttons */}
                <Text style={tw`text-sm text-gray-600 mt-4 mb-3 font-semibold`}>หรือเลือกฝันยอดนิยม:</Text>
                <View style={tw`flex-row flex-wrap`}>
                  {quickDreamButtons.map((item, index) => (
                    <Pressable
                      key={index}
                      onPress={() => handleQuickDream(item.text)}
                      style={tw`rounded-full px-4 py-3 mr-2 mb-2 flex-row items-center shadow-sm`}
                      style={{ backgroundColor: item.color + '20' }}
                    >
                      <Text style={tw`mr-2 text-lg`}>{item.icon}</Text>
                      <Text style={tw`text-gray-700 text-sm font-medium`}>{item.text}</Text>
                    </Pressable>
                  ))}
                </View>

                {/* Interpret Button */}
                <Pressable
                  onPress={interpretDream}
                  disabled={loading || !dreamText.trim()}
                  style={tw`rounded-xl py-4 mt-6 ${!dreamText.trim() ? 'opacity-50' : ''}`}
                >
                  <LinearGradient
                    colors={dreamText.trim() ? ['#667eea', '#764ba2'] : ['#9CA3AF', '#6B7280']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={tw`rounded-xl py-4 px-6`}
                  >
                    {loading ? (
                      <View style={tw`flex-row items-center justify-center`}>
                        <LottieView
                          source={require('@/assets/animations/loading.json')}
                          autoPlay
                          loop
                          style={tw`w-6 h-6 mr-2`}
                        />
                        <Text style={tw`text-white font-bold text-lg`}>กำลังทำนาย...</Text>
                      </View>
                    ) : (
                      <View style={tw`flex-row items-center justify-center`}>
                        <Ionicons name="sparkles" size={24} color="white" />
                        <Text style={tw`text-white font-bold text-lg ml-2`}>ทำนายฝัน</Text>
                      </View>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </BlurView>

            {/* Result Card */}
            {result && (
              <Animated.View entering={FadeInUp.delay(300)} style={cardStyle}>
                <BlurView intensity={20} style={tw`mx-4 rounded-2xl overflow-hidden shadow-lg mb-4`}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2', '#f093fb']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={tw`p-6`}
                  >
                    <View style={tw`items-center mb-6`}>
                      <Animated.View style={sparkleStyle}>
                        <Text style={tw`text-4xl mb-2`}>✨</Text>
                      </Animated.View>
                      <Text style={tw`text-2xl font-bold text-white font-aboreto`}>ผลการทำนายฝัน</Text>
                    </View>

                    {/* Lucky Numbers */}
                    <View style={tw`bg-white/90 rounded-2xl p-6 mb-6`}>
                      <Text style={tw`text-center text-gray-700 mb-4 font-semibold text-lg`}>เลขเด็ดจากความฝัน</Text>
                      <Animated.View style={[tw`flex-row justify-center flex-wrap`, numberStyle]}>
                        {result.numbers.map((num, index) => (
                          <Animated.View 
                            key={index} 
                            entering={FadeInUp.delay(index * 100)}
                            style={tw`bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full w-16 h-16 items-center justify-center m-2 shadow-lg`}
                          >
                            <Text style={tw`text-xl font-bold text-white`}>{num}</Text>
                          </Animated.View>
                        ))}
                      </Animated.View>
                      
                      <View style={tw`flex-row justify-center gap-4 mt-4`}>
                        <Pressable
                          onPress={() => copyNumbers(result.numbers)}
                          style={tw`bg-purple-100 rounded-full px-4 py-2 flex-row items-center`}
                        >
                          <Ionicons name="copy-outline" size={16} color="#9333EA" />
                          <Text style={tw`text-purple-700 ml-1 font-medium`}>คัดลอกเลข</Text>
                        </Pressable>
                        
                        <Pressable
                          onPress={shareResult}
                          style={tw`bg-green-100 rounded-full px-4 py-2 flex-row items-center`}
                        >
                          <Ionicons name="share-outline" size={16} color="#4CAF50" />
                          <Text style={tw`text-green-700 ml-1 font-medium`}>แชร์ผลลัพธ์</Text>
                        </Pressable>
                      </View>
                    </View>

                    {/* Dream Meaning */}
                    <View style={tw`bg-white/80 rounded-2xl p-4 mb-4`}>
                      <Text style={tw`font-bold text-gray-800 mb-3 text-lg`}>💭 ความหมายของฝัน:</Text>
                      <Text style={tw`text-gray-700 leading-relaxed text-base`}>{result.meaning}</Text>
                    </View>

                    {/* Confidence Level */}
                    <View style={tw`bg-white/80 rounded-2xl p-4 mb-4`}>
                      <View style={tw`flex-row items-center justify-between mb-2`}>
                        <Text style={tw`text-gray-700 font-semibold`}>🎯 ความแม่นยำ:</Text>
                        <Text style={tw`text-purple-600 font-bold text-lg`}>{result.confidence}%</Text>
                      </View>
                      <View style={tw`h-3 bg-gray-200 rounded-full overflow-hidden`}>
                        <Animated.View 
                          style={[
                            tw`h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full`,
                            { width: `${result.confidence}%` }
                          ]} 
                        />
                      </View>
                    </View>

                    {/* Related Dreams */}
                    {result.relatedDreams.length > 0 && (
                      <View style={tw`bg-white/80 rounded-2xl p-4`}>
                        <Text style={tw`font-bold text-gray-800 mb-3 text-lg`}>🔗 ความฝันที่เกี่ยวข้อง:</Text>
                        <View style={tw`flex-row flex-wrap`}>
                          {result.relatedDreams.map((dream, index) => (
                            <Animated.View 
                              key={index}
                              entering={FadeInUp.delay(index * 50)}
                              style={tw`bg-purple-100 rounded-full px-3 py-2 mr-2 mb-2`}
                            >
                              <Text style={tw`text-purple-700 text-sm font-medium`}>{dream}</Text>
                            </Animated.View>
                          ))}
                        </View>
                      </View>
                    )}
                  </LinearGradient>
                </BlurView>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {selectedTab === 'popular' && (
          <Animated.View entering={FadeInUp.delay(200)}>
            {popularDreams.map((dream, index) => (
              <Pressable
                key={dream.id}
                onPress={() => {
                  setDreamText(dream.keyword);
                  setSelectedTab('interpret');
                }}
                style={tw`bg-white mx-4 mb-3 rounded-xl p-4 shadow-sm`}
              >
                <View style={tw`flex-row justify-between items-start`}>
                  <View style={tw`flex-1`}>
                    <Text style={tw`font-bold text-gray-800 mb-2`}>{dream.keyword}</Text>
                    <View style={tw`flex-row flex-wrap`}>
                      {dream.numbers.map((num, idx) => (
                        <View key={idx} style={tw`bg-purple-100 rounded-full px-3 py-1 mr-2 mb-1`}>
                          <Text style={tw`text-purple-700 font-bold`}>{num}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={tw`items-center`}>
                    <Ionicons name="people" size={16} color="#9333EA" />
                    <Text style={tw`text-purple-600 text-sm mt-1`}>{dream.count}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </Animated.View>
        )}

        {selectedTab === 'history' && (
          <Animated.View entering={FadeInUp.delay(200)}>
            {recentInterpretations.length === 0 ? (
              <View style={tw`bg-white mx-4 rounded-xl p-8 items-center`}>
                <Ionicons name="moon-outline" size={48} color="#D1D5DB" />
                <Text style={tw`text-gray-400 mt-4`}>ยังไม่มีประวัติการทำนายฝัน</Text>
              </View>
            ) : (
              recentInterpretations.map((item) => (
                <View key={item.id} style={tw`bg-white mx-4 mb-3 rounded-xl p-4 shadow-sm`}>
                  <Text style={tw`text-gray-500 text-xs mb-2`}>{item.date}</Text>
                  <Text style={tw`text-gray-800 mb-2`}>{item.dream}</Text>
                  <View style={tw`flex-row flex-wrap`}>
                    {item.numbers.map((num, idx) => (
                      <View key={idx} style={tw`bg-yellow-100 rounded-full px-3 py-1 mr-2`}>
                        <Text style={tw`text-yellow-700 font-bold`}>{num}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </Animated.View>
        )}
      </ScrollView>
    </Container>
  );
}