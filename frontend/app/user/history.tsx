import React, { useState, useEffect } from 'react';
import { View, ScrollView, FlatList, Pressable, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Container from '@/libs/components/Container';
import Text from '@/libs/components/Text';
import tw from '@/libs/constants/twrnc';
import { useAuth } from '@/libs/providers/AuthProvider';
import axios from 'axios';

interface HistoryItem {
  id: number;
  ticketNumber: string;
  drawDate: string;
  status: 'win' | 'near' | 'miss';
  detail: any;
  createdAt: string;
}

const HistoryScreen = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'win' | 'near' | 'miss'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    win: 0,
    near: 0,
    miss: 0,
  });

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/api/lottery/history`,
        {
          params: { filter },
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );
      
      setHistory(response.data.history || []);
      setStats(response.data.stats || { total: 0, win: 0, near: 0, miss: 0 });
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'win':
        return {
          label: 'ถูกรางวัล',
          color: '#4CAF50',
          bgColor: 'bg-green-900/20',
          borderColor: 'border-green-600/30',
          icon: 'trophy',
        };
      case 'near':
        return {
          label: 'เฉียด',
          color: '#FFA726',
          bgColor: 'bg-orange-900/20',
          borderColor: 'border-orange-600/30',
          icon: 'heart-broken',
        };
      case 'miss':
        return {
          label: 'ไม่ถูก',
          color: '#EF5350',
          bgColor: 'bg-red-900/20',
          borderColor: 'border-red-600/30',
          icon: 'sad-outline',
        };
      default:
        return {
          label: 'ไม่ทราบ',
          color: '#9E9E9E',
          bgColor: 'bg-gray-900/20',
          borderColor: 'border-gray-600/30',
          icon: 'help-circle',
        };
    }
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => {
    const config = getStatusConfig(item.status);
    
    return (
      <Pressable style={tw`mb-3`}>
        <LinearGradient
          colors={['#2D1810', '#1A0F0F']}
          style={tw`rounded-xl p-4 border border-yellow-600/20`}
        >
          <View style={tw`flex-row justify-between items-start`}>
            {/* Left Side - Number & Date */}
            <View style={tw`flex-1`}>
              <Text style={[tw`text-2xl mb-1`, { color: '#FFD700', fontFamily: 'Aboreto_400Regular' }]}>
                {item.ticketNumber}
              </Text>
              <Text style={[tw`text-xs`, { color: '#8B7355' }]}>
                งวด {new Date(item.drawDate).toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>

            {/* Right Side - Status */}
            <View style={tw`items-end`}>
              <View style={tw`${config.bgColor} px-3 py-1 rounded-full ${config.borderColor} border`}>
                <Text style={[tw`text-sm font-bold`, { color: config.color }]}>
                  {config.label}
                </Text>
              </View>
              
              {item.detail?.prize && (
                <Text style={[tw`text-xs mt-1`, { color: '#D4A574' }]}>
                  {item.detail.prize}
                </Text>
              )}
              
              {item.detail?.amount && (
                <Text style={[tw`text-sm font-bold mt-1`, { color: '#4CAF50' }]}>
                  ฿{item.detail.amount.toLocaleString()}
                </Text>
              )}
            </View>
          </View>

          {/* Near Miss Details */}
          {item.status === 'near' && item.detail?.description && (
            <View style={tw`mt-3 pt-3 border-t border-yellow-600/10`}>
              <Text style={[tw`text-xs`, { color: '#FFA726' }]}>
                💔 {item.detail.description}
              </Text>
              {item.detail?.nearTo && (
                <Text style={[tw`text-xs mt-1`, { color: '#D4A574' }]}>
                  เลขที่ออก: {item.detail.nearTo}
                </Text>
              )}
            </View>
          )}

          {/* Check Time */}
          <View style={tw`mt-2 pt-2 border-t border-yellow-600/10`}>
            <Text style={[tw`text-xs`, { color: '#6B5D54' }]}>
              ตรวจเมื่อ {new Date(item.createdAt).toLocaleString('th-TH')}
            </Text>
          </View>
        </LinearGradient>
      </Pressable>
    );
  };

  return (
    <Container>
      <LinearGradient
        colors={['#1A0F0F', '#2D1810', '#1A0F0F']}
        style={tw`flex-1`}
      >
        {/* Header */}
        <View style={tw`px-6 pt-12 pb-4`}>
          <Text style={[tw`text-3xl font-bold mb-2`, { color: '#FFD700' }]}>
            📜 ประวัติการตรวจ
          </Text>
          
          {/* Stats Cards */}
          <View style={tw`flex-row gap-2 mt-4`}>
            <View style={tw`flex-1 bg-black/30 rounded-lg p-3 border border-yellow-600/20`}>
              <Text style={[tw`text-xs mb-1`, { color: '#8B7355' }]}>ทั้งหมด</Text>
              <Text style={[tw`text-xl font-bold`, { color: '#FFD700' }]}>{stats.total}</Text>
            </View>
            <View style={tw`flex-1 bg-green-900/20 rounded-lg p-3 border border-green-600/20`}>
              <Text style={[tw`text-xs mb-1`, { color: '#81C784' }]}>ถูก</Text>
              <Text style={[tw`text-xl font-bold`, { color: '#4CAF50' }]}>{stats.win}</Text>
            </View>
            <View style={tw`flex-1 bg-orange-900/20 rounded-lg p-3 border border-orange-600/20`}>
              <Text style={[tw`text-xs mb-1`, { color: '#FFCC80' }]}>เฉียด</Text>
              <Text style={[tw`text-xl font-bold`, { color: '#FFA726' }]}>{stats.near}</Text>
            </View>
            <View style={tw`flex-1 bg-red-900/20 rounded-lg p-3 border border-red-600/20`}>
              <Text style={[tw`text-xs mb-1`, { color: '#EF9A9A' }]}>พลาด</Text>
              <Text style={[tw`text-xl font-bold`, { color: '#EF5350' }]}>{stats.miss}</Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={tw`px-6 mb-4`}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={tw`flex-row`}
          >
            {[
              { key: 'all', label: 'ทั้งหมด', icon: 'list' },
              { key: 'win', label: 'ถูกรางวัล', icon: 'trophy' },
              { key: 'near', label: 'เฉียด', icon: 'heart-broken' },
              { key: 'miss', label: 'ไม่ถูก', icon: 'sad-outline' },
            ].map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setFilter(tab.key as any)}
                style={tw`mr-2`}
              >
                <LinearGradient
                  colors={filter === tab.key ? ['#FFD700', '#D4AF37'] : ['#2D1810', '#3D2520']}
                  style={tw`px-4 py-2 rounded-full border ${filter === tab.key ? 'border-yellow-400' : 'border-yellow-600/20'}`}
                >
                  <Text style={[tw`text-sm`, { color: filter === tab.key ? '#1A0F0F' : '#D4A574' }]}>
                    {tab.label}
                  </Text>
                </LinearGradient>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* History List */}
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id.toString()}
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
              <MaterialCommunityIcons name="history" size={64} color="#8B7355" />
              <Text style={[tw`mt-4 text-lg`, { color: '#8B7355' }]}>
                {filter === 'all' ? 'ยังไม่มีประวัติการตรวจ' : `ไม่มีประวัติ${getStatusConfig(filter).label}`}
              </Text>
              <Text style={[tw`mt-2 text-sm`, { color: '#6B5D54' }]}>
                เริ่มตรวจหวยเพื่อดูประวัติที่นี่
              </Text>
            </View>
          }
        />
      </LinearGradient>
    </Container>
  );
};

export default HistoryScreen;