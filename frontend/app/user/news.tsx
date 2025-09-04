import React, { useState, useEffect } from 'react';
import { View, ScrollView, FlatList, Pressable, RefreshControl, Linking, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import Container from '@/libs/components/Container';
import Text from '@/libs/components/Text';
import TextInput from '@/libs/components/TextInput';
import tw from '@/libs/constants/twrnc';
import { apiGetData } from '@/libs/utils/API_URILS';
import { useToast } from '@/libs/providers/ToastProvider';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  imageUrl?: string;
  link: string;
  publishedAt: string;
  numbers?: string[];
  description?: string;
}

interface DreamResult {
  dream: string;
  numbers: string[];
  description: string;
}

const NewsScreen = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'latest' | 'thairath' | 'dailynews' | 'dream'>('latest');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Dream interpreter
  const [dreamText, setDreamText] = useState('');
  const [dreamResult, setDreamResult] = useState<DreamResult | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);

  useEffect(() => {
    if (activeTab !== 'dream') {
      fetchNews();
    }
  }, [activeTab]);

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const response = await apiGetData('/api/lottery/news', {
        params: { source: activeTab }
      });
      setNews(response.news || []);
    } catch (error) {
      // Mock data for now
      setNews(getMockNews());
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const getMockNews = (): NewsItem[] => {
    const sources = {
      latest: 'ข่าวล่าสุด',
      thairath: 'ไทยรัฐ',
      dailynews: 'เดลินิวส์'
    };

    return [
      {
        id: '1',
        title: 'เลขเด็ดงวดนี้! หวยไทยรัฐ 1/1/68',
        source: sources[activeTab as keyof typeof sources] || 'ข่าวล่าสุด',
        imageUrl: 'https://via.placeholder.com/300x200',
        link: 'https://www.thairath.co.th',
        publishedAt: new Date().toISOString(),
        numbers: ['23', '45', '67', '89'],
        description: 'เลขเด็ดจากสำนักดัง แนวทางหวยงวดนี้'
      },
      {
        id: '2',
        title: 'อาจารย์ดังให้เลขเด็ด 3 ตัวตรง',
        source: sources[activeTab as keyof typeof sources] || 'ข่าวล่าสุด',
        imageUrl: 'https://via.placeholder.com/300x200',
        link: 'https://www.dailynews.co.th',
        publishedAt: new Date().toISOString(),
        numbers: ['123', '456', '789'],
        description: 'เลข 3 ตัวแม่นๆ จากอาจารย์ชื่อดัง'
      },
      {
        id: '3',
        title: 'เลขมงคลจากวัดดัง งวด 1/1/68',
        source: sources[activeTab as keyof typeof sources] || 'ข่าวล่าสุด',
        imageUrl: 'https://via.placeholder.com/300x200',
        link: 'https://www.thairath.co.th',
        publishedAt: new Date().toISOString(),
        numbers: ['99', '88', '77'],
        description: 'เลขมงคลจากพระเกจิอาจารย์'
      },
    ];
  };

  const interpretDream = async () => {
    if (!dreamText.trim()) {
      showToast('error', 'กรุณากรอกความฝัน', 'โปรดบอกรายละเอียดความฝันของคุณ');
      return;
    }

    setIsInterpreting(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock dream interpretation
      const mockInterpretations: Record<string, DreamResult> = {
        'งู': {
          dream: 'ฝันเห็นงู',
          numbers: ['23', '32', '89', '98'],
          description: 'งูในความฝันหมายถึงโชคลาภ อาจได้เงินก้อนใหญ่ เลขมงคล 23, 32, 89, 98'
        },
        'น้ำ': {
          dream: 'ฝันเห็นน้ำ',
          numbers: ['16', '61', '27', '72'],
          description: 'น้ำใสหมายถึงโชคดี น้ำขุ่นระวังเรื่องสุขภาพ เลขมงคล 16, 61, 27, 72'
        },
        'ทอง': {
          dream: 'ฝันเห็นทอง',
          numbers: ['99', '88', '44', '55'],
          description: 'ทองคำในฝันเป็นลางดี จะมีโชคลาภ เลขมงคล 99, 88, 44, 55'
        },
      };

      // Find matching keyword
      let result = null;
      for (const [key, value] of Object.entries(mockInterpretations)) {
        if (dreamText.toLowerCase().includes(key)) {
          result = value;
          break;
        }
      }

      // Default result if no match
      if (!result) {
        result = {
          dream: dreamText,
          numbers: ['13', '31', '68', '86'],
          description: 'ความฝันของคุณบ่งบอกถึงการเปลี่ยนแปลงในชีวิต ลองเสี่ยงโชคด้วยเลข 13, 31, 68, 86'
        };
      }

      setDreamResult(result);
    } catch (error) {
      showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถทำนายฝันได้ในขณะนี้');
    } finally {
      setIsInterpreting(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (activeTab !== 'dream') {
      fetchNews();
    }
  };

  const openNewsLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      showToast('error', 'ไม่สามารถเปิดลิงก์ได้', 'กรุณาลองใหม่อีกครั้ง');
    });
  };

  const renderNewsItem = ({ item }: { item: NewsItem }) => (
    <Pressable
      onPress={() => openNewsLink(item.link)}
      style={tw`mb-4`}
    >
      <LinearGradient
        colors={['#2D1810', '#1A0F0F']}
        style={tw`rounded-xl overflow-hidden border border-yellow-600/20`}
      >
        {/* News Image */}
        {item.imageUrl && (
          <View style={tw`h-48 bg-black/40`}>
            <Image
              source={{ uri: item.imageUrl }}
              style={tw`w-full h-full`}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={tw`absolute bottom-0 left-0 right-0 h-20`}
            />
          </View>
        )}

        {/* News Content */}
        <View style={tw`p-4`}>
          {/* Source Badge */}
          <View style={tw`flex-row items-center mb-2`}>
            <View style={tw`bg-yellow-900/30 px-2 py-1 rounded`}>
              <Text style={[tw`text-xs`, { color: '#FFD700' }]}>
                {item.source}
              </Text>
            </View>
            <Text style={[tw`text-xs ml-2`, { color: '#8B7355' }]}>
              {new Date(item.publishedAt).toLocaleDateString('th-TH')}
            </Text>
          </View>

          {/* Title */}
          <Text style={[tw`text-lg font-bold mb-2`, { color: '#F5E6D3' }]}>
            {item.title}
          </Text>

          {/* Description */}
          {item.description && (
            <Text style={[tw`text-sm mb-3`, { color: '#D4A574' }]}>
              {item.description}
            </Text>
          )}

          {/* Lucky Numbers */}
          {item.numbers && item.numbers.length > 0 && (
            <View>
              <Text style={[tw`text-xs mb-2`, { color: '#8B7355' }]}>
                เลขเด็ดแนะนำ:
              </Text>
              <View style={tw`flex-row flex-wrap gap-2`}>
                {item.numbers.map((num, idx) => (
                  <View
                    key={idx}
                    style={tw`bg-gradient-to-r from-yellow-900/40 to-red-900/40 px-3 py-1 rounded-lg border border-yellow-600/30`}
                  >
                    <Text style={[tw`text-lg font-bold`, { color: '#FFD700', fontFamily: 'Aboreto_400Regular' }]}>
                      {num}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Read More */}
          <View style={tw`flex-row items-center justify-end mt-3`}>
            <Text style={[tw`text-sm`, { color: '#FFD700' }]}>
              อ่านต่อ
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#FFD700" style={tw`ml-1`} />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );

  const renderDreamInterpreter = () => (
    <ScrollView
      contentContainerStyle={tw`px-6 pb-20`}
      showsVerticalScrollIndicator={false}
    >
      {/* Dream Input Section */}
      <View style={tw`bg-black/40 rounded-2xl p-6 border border-yellow-600/30 mb-6`}>
        <View style={tw`flex-row items-center mb-4`}>
          <Text style={tw`text-3xl mr-2`}>🔮</Text>
          <Text style={[tw`text-xl font-bold`, { color: '#FFD700' }]}>
            ทำนายฝัน
          </Text>
        </View>

        <Text style={[tw`text-sm mb-4`, { color: '#D4A574' }]}>
          บอกเล่าความฝันของคุณ แล้วเราจะทำนายเป็นตัวเลขให้
        </Text>

        <TextInput
          value={dreamText}
          onChangeText={setDreamText}
          placeholder="เช่น ฝันเห็นงู, ฝันว่าได้เงิน, ฝันเห็นน้ำ..."
          placeholderTextColor="#8B7355"
          multiline
          numberOfLines={4}
          style={[
            tw`bg-black/60 rounded-xl p-4 text-base border border-yellow-600/20`,
            { color: '#F5E6D3', textAlignVertical: 'top', minHeight: 100 }
          ]}
        />

        <Pressable
          onPress={interpretDream}
          disabled={isInterpreting || !dreamText.trim()}
        >
          <LinearGradient
            colors={dreamText.trim() ? ['#FFD700', '#D4AF37', '#B8860B'] : ['#8B7355', '#6B5D54', '#5B4D44']}
            style={tw`mt-4 rounded-full py-3 px-6`}
          >
            <Text style={[tw`text-center font-bold`, { color: dreamText.trim() ? '#1A0F0F' : '#F5E6D3' }]}>
              {isInterpreting ? '🔮 กำลังทำนาย...' : '✨ ทำนายความฝัน'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Dream Result */}
      {dreamResult && (
        <View style={tw`bg-gradient-to-r from-yellow-900/20 to-purple-900/20 rounded-2xl p-6 border border-yellow-600/30`}>
          <View style={tw`flex-row items-center mb-4`}>
            <FontAwesome5 name="moon" size={24} color="#FFD700" />
            <Text style={[tw`text-lg font-bold ml-2`, { color: '#FFD700' }]}>
              ผลการทำนายฝัน
            </Text>
          </View>

          <Text style={[tw`text-base mb-4`, { color: '#F5E6D3' }]}>
            "{dreamResult.dream}"
          </Text>

          <Text style={[tw`text-sm mb-4`, { color: '#D4A574' }]}>
            {dreamResult.description}
          </Text>

          <View>
            <Text style={[tw`text-sm mb-2`, { color: '#8B7355' }]}>
              เลขมงคลจากความฝัน:
            </Text>
            <View style={tw`flex-row flex-wrap gap-3`}>
              {dreamResult.numbers.map((num, idx) => (
                <View
                  key={idx}
                  style={tw`bg-black/40 px-4 py-2 rounded-xl border-2 border-yellow-600/40`}
                >
                  <Text style={[tw`text-2xl font-bold`, { color: '#FFD700', fontFamily: 'Aboreto_400Regular' }]}>
                    {num}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Pressable
            onPress={() => {
              setDreamText('');
              setDreamResult(null);
            }}
            style={tw`mt-4`}
          >
            <Text style={[tw`text-center text-sm`, { color: '#FFD700' }]}>
              ทำนายใหม่
            </Text>
          </Pressable>
        </View>
      )}

      {/* Popular Dreams */}
      <View style={tw`mt-6`}>
        <Text style={[tw`text-lg font-bold mb-4`, { color: '#FFD700' }]}>
          💭 ความฝันยอดนิยม
        </Text>
        <View style={tw`gap-3`}>
          {[
            { dream: 'ฝันเห็นงู', numbers: ['23', '89'] },
            { dream: 'ฝันว่าได้เงิน', numbers: ['16', '61'] },
            { dream: 'ฝันเห็นคนตาย', numbers: ['04', '40'] },
            { dream: 'ฝันว่าท้อง', numbers: ['12', '21'] },
            { dream: 'ฝันเห็นไฟไหม้', numbers: ['77', '99'] },
          ].map((item, idx) => (
            <Pressable
              key={idx}
              onPress={() => setDreamText(item.dream)}
              style={tw`bg-black/30 rounded-xl p-3 border border-yellow-600/20 flex-row justify-between items-center`}
            >
              <Text style={[tw`text-sm`, { color: '#F5E6D3' }]}>
                {item.dream}
              </Text>
              <View style={tw`flex-row gap-2`}>
                {item.numbers.map((num, i) => (
                  <Text key={i} style={[tw`text-sm font-bold`, { color: '#FFD700' }]}>
                    {num}
                  </Text>
                ))}
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <Container>
      <LinearGradient
        colors={['#1A0F0F', '#2D1810', '#1A0F0F']}
        style={tw`flex-1`}
      >
        {/* Header */}
        <View style={tw`px-6 pt-12 pb-4`}>
          <Text style={[tw`text-3xl font-bold mb-2`, { color: '#FFD700' }]}>
            📰 เลขเด็ด & ทำนายฝัน
          </Text>
          <Text style={[tw`text-sm`, { color: '#D4A574' }]}>
            รวมข่าวเลขเด็ดจากสำนักดัง
          </Text>
        </View>

        {/* Tab Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={tw`px-6 mb-4`}
        >
          {[
            { key: 'latest', label: 'ล่าสุด', icon: 'newspaper' },
            { key: 'thairath', label: 'ไทยรัฐ', icon: 'newspaper' },
            { key: 'dailynews', label: 'เดลินิวส์', icon: 'newspaper' },
            { key: 'dream', label: 'ทำนายฝัน', icon: 'moon' },
          ].map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key as any)}
              style={tw`mr-3`}
            >
              <LinearGradient
                colors={activeTab === tab.key ? ['#FFD700', '#D4AF37'] : ['#2D1810', '#3D2520']}
                style={tw`px-4 py-2 rounded-full border ${activeTab === tab.key ? 'border-yellow-400' : 'border-yellow-600/20'} flex-row items-center`}
              >
                {tab.icon === 'moon' ? (
                  <FontAwesome5 name={tab.icon} size={14} color={activeTab === tab.key ? '#1A0F0F' : '#D4A574'} />
                ) : (
                  <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.key ? '#1A0F0F' : '#D4A574'} />
                )}
                <Text style={[tw`ml-2 text-sm font-bold`, { color: activeTab === tab.key ? '#1A0F0F' : '#D4A574' }]}>
                  {tab.label}
                </Text>
              </LinearGradient>
            </Pressable>
          ))}
        </ScrollView>

        {/* Content */}
        {activeTab === 'dream' ? (
          renderDreamInterpreter()
        ) : (
          <FlatList
            data={news}
            renderItem={renderNewsItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={tw`px-6 pb-20`}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FFD700"
                colors={['#FFD700']}
              />
            }
            ListEmptyComponent={
              <View style={tw`items-center justify-center py-20`}>
                <Ionicons name="newspaper-outline" size={64} color="#8B7355" />
                <Text style={[tw`mt-4 text-lg`, { color: '#8B7355' }]}>
                  ยังไม่มีข่าวในขณะนี้
                </Text>
                <Text style={[tw`mt-2 text-sm`, { color: '#6B5D54' }]}>
                  กรุณาลองใหม่อีกครั้ง
                </Text>
              </View>
            }
          />
        )}
      </LinearGradient>
    </Container>
  );
};

export default NewsScreen;