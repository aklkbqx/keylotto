import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput as RNTextInput, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/libs/utils/tailwind';
import Container from '@/libs/components/Container';
import { apiPostData, apiGetData, handleApiError } from '@/libs/utils/API_URILS';
import Toast from 'react-native-toast-message';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

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

export default function DreamScreen() {
  const [dreamText, setDreamText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DreamResult | null>(null);
  const [popularDreams, setPopularDreams] = useState<PopularDream[]>([]);
  const [recentInterpretations, setRecentInterpretations] = useState<RecentInterpretation[]>([]);
  const [selectedTab, setSelectedTab] = useState<'interpret' | 'popular' | 'history'>('interpret');

  useEffect(() => {
    fetchPopularDreams();
    fetchRecentInterpretations();
  }, []);

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
      Toast.show({
        type: 'error',
        text1: 'กรุณาใส่รายละเอียดความฝัน',
        text2: 'บอกเล่าความฝันของคุณให้ละเอียด',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiPostData('/api/lottery/dream', {
        dream: dreamText,
      });

      if (response.success) {
        setResult(response.data);
        Toast.show({
          type: 'success',
          text1: 'ทำนายฝันสำเร็จ',
          text2: 'ได้เลขเด็ดจากความฝันของคุณแล้ว!',
        });
        // Refresh history
        fetchRecentInterpretations();
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const quickDreamButtons = [
    { text: 'ฝันว่างู', icon: '🐍' },
    { text: 'ฝันว่าน้ำท่วม', icon: '🌊' },
    { text: 'ฝันว่าไฟไหม้', icon: '🔥' },
    { text: 'ฝันเห็นพระ', icon: '🙏' },
    { text: 'ฝันว่าตาย', icon: '💀' },
    { text: 'ฝันว่าแต่งงาน', icon: '💑' },
    { text: 'ฝันว่าท้อง', icon: '🤰' },
    { text: 'ฝันเห็นเงิน', icon: '💰' },
  ];

  const handleQuickDream = (text: string) => {
    setDreamText(text);
    interpretDream();
  };

  const copyNumbers = (numbers: string[]) => {
    // Copy to clipboard logic
    const numbersText = numbers.join(', ');
    Toast.show({
      type: 'success',
      text1: 'คัดลอกเลขแล้ว',
      text2: numbersText,
    });
  };

  return (
    <Container>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={tw`absolute inset-0`}
      />

      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={tw`px-4 pt-12 pb-6`}>
          <Animated.View entering={FadeInDown.delay(100)}>
            <Text style={tw`text-3xl font-bold text-white text-center font-aboreto`}>
              ทำนายฝัน 🔮
            </Text>
            <Text style={tw`text-white/80 text-center mt-2`}>
              แปลความฝันเป็นเลขเด็ด ตีตัวเลขจากความฝันของคุณ
            </Text>
          </Animated.View>
        </View>

        {/* Tab Selector */}
        <View style={tw`flex-row bg-white/10 mx-4 rounded-xl p-1 mb-4`}>
          {[
            { key: 'interpret', label: 'ทำนายฝัน', icon: 'moon' },
            { key: 'popular', label: 'ฝันยอดนิยม', icon: 'trending-up' },
            { key: 'history', label: 'ประวัติ', icon: 'time' },
          ].map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setSelectedTab(tab.key as any)}
              style={tw`flex-1 flex-row items-center justify-center py-3 rounded-lg ${
                selectedTab === tab.key ? 'bg-white/20' : ''
              }`}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={18} 
                color={selectedTab === tab.key ? '#FFD700' : 'white'} 
              />
              <Text style={tw`ml-2 ${
                selectedTab === tab.key ? 'text-yellow-300 font-bold' : 'text-white'
              }`}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Content based on selected tab */}
        {selectedTab === 'interpret' && (
          <Animated.View entering={FadeInUp.delay(200)}>
            {/* Dream Input Card */}
            <View style={tw`bg-white mx-4 rounded-2xl p-4 shadow-lg mb-4`}>
              <Text style={tw`text-lg font-bold mb-3`}>บอกเล่าความฝันของคุณ</Text>
              <RNTextInput
                value={dreamText}
                onChangeText={setDreamText}
                placeholder="เช่น ฝันว่าเจองูใหญ่สีทอง กำลังว่ายน้ำ..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                style={tw`bg-gray-50 rounded-xl p-3 text-gray-800 min-h-24`}
              />

              {/* Quick Dream Buttons */}
              <Text style={tw`text-sm text-gray-600 mt-4 mb-2`}>หรือเลือกฝันยอดนิยม:</Text>
              <View style={tw`flex-row flex-wrap`}>
                {quickDreamButtons.map((item, index) => (
                  <Pressable
                    key={index}
                    onPress={() => handleQuickDream(item.text)}
                    style={tw`bg-purple-50 rounded-full px-3 py-2 mr-2 mb-2 flex-row items-center`}
                  >
                    <Text style={tw`mr-1`}>{item.icon}</Text>
                    <Text style={tw`text-purple-700 text-sm`}>{item.text}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Interpret Button */}
              <Pressable
                onPress={interpretDream}
                disabled={loading}
                style={tw`bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl py-4 mt-4`}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View style={tw`flex-row items-center justify-center`}>
                    <Ionicons name="sparkles" size={20} color="white" />
                    <Text style={tw`text-white font-bold text-lg ml-2`}>ทำนายฝัน</Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Result Card */}
            {result && (
              <Animated.View entering={FadeInUp.delay(300)}>
                <View style={tw`bg-white mx-4 rounded-2xl p-4 shadow-lg mb-4`}>
                  <View style={tw`items-center mb-4`}>
                    <Text style={tw`text-2xl mb-2`}>✨</Text>
                    <Text style={tw`text-xl font-bold text-purple-600`}>ผลการทำนายฝัน</Text>
                  </View>

                  {/* Lucky Numbers */}
                  <View style={tw`bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 mb-4`}>
                    <Text style={tw`text-center text-gray-600 mb-2`}>เลขเด็ดจากความฝัน</Text>
                    <View style={tw`flex-row justify-center flex-wrap`}>
                      {result.numbers.map((num, index) => (
                        <View key={index} style={tw`bg-white rounded-full w-12 h-12 items-center justify-center m-1 shadow`}>
                          <Text style={tw`text-lg font-bold text-orange-600`}>{num}</Text>
                        </View>
                      ))}
                    </View>
                    <Pressable
                      onPress={() => copyNumbers(result.numbers)}
                      style={tw`mt-3 flex-row items-center justify-center`}
                    >
                      <Ionicons name="copy-outline" size={16} color="#9333EA" />
                      <Text style={tw`text-purple-600 ml-1`}>คัดลอกเลข</Text>
                    </Pressable>
                  </View>

                  {/* Dream Meaning */}
                  <View style={tw`mb-4`}>
                    <Text style={tw`font-bold text-gray-700 mb-2`}>ความหมายของฝัน:</Text>
                    <Text style={tw`text-gray-600 leading-relaxed`}>{result.meaning}</Text>
                  </View>

                  {/* Confidence Level */}
                  <View style={tw`flex-row items-center mb-4`}>
                    <Text style={tw`text-gray-600 mr-2`}>ความแม่นยำ:</Text>
                    <View style={tw`flex-1 h-2 bg-gray-200 rounded-full overflow-hidden`}>
                      <View 
                        style={[
                          tw`h-full bg-gradient-to-r from-purple-500 to-pink-500`,
                          { width: `${result.confidence}%` }
                        ]} 
                      />
                    </View>
                    <Text style={tw`ml-2 text-purple-600 font-bold`}>{result.confidence}%</Text>
                  </View>

                  {/* Related Dreams */}
                  {result.relatedDreams.length > 0 && (
                    <View>
                      <Text style={tw`font-bold text-gray-700 mb-2`}>ความฝันที่เกี่ยวข้อง:</Text>
                      <View style={tw`flex-row flex-wrap`}>
                        {result.relatedDreams.map((dream, index) => (
                          <View key={index} style={tw`bg-purple-50 rounded-full px-3 py-1 mr-2 mb-2`}>
                            <Text style={tw`text-purple-700 text-sm`}>{dream}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
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