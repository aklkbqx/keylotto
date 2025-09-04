import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Switch } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/libs/constants/twrnc';
import Container from '@/libs/components/Container';
import { apiGetData, apiPostData, handleApiError } from '@/libs/utils/API_URILS';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'lottery' | 'news' | 'promotion' | 'system';
  isRead: boolean;
  createdAt: string;
  data?: any;
}

const typeIcons = {
  lottery: { name: 'trophy', color: '#FFD700' },
  news: { name: 'newspaper', color: '#3B82F6' },
  promotion: { name: 'gift', color: '#EC4899' },
  system: { name: 'information-circle', color: '#6B7280' },
};

const typeLabels = {
  lottery: 'ผลหวย',
  news: 'ข่าวเลขเด็ด',
  promotion: 'โปรโมชั่น',
  system: 'ระบบ',
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [notificationSettings, setNotificationSettings] = useState({
    lottery: true,
    news: true,
    promotion: true,
    system: true,
  });

  useEffect(() => {
    fetchNotifications();
    fetchSettings();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await apiGetData('/api/user/notifications');
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await apiGetData('/api/user/settings/notifications');
      if (response.success) {
        setNotificationSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (id: string) => {
    try {
      await apiPostData(`/api/user/notifications/${id}/read`, {});
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiPostData('/api/user/notifications/read-all', {});
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      Toast.show({
        type: 'success',
        text1: 'อ่านทั้งหมดแล้ว',
      });
    } catch (error) {
      handleApiError(error);
    }
  };

  const updateNotificationSetting = async (type: string, value: boolean) => {
    try {
      const newSettings = { ...notificationSettings, [type]: value };
      setNotificationSettings(newSettings);
      
      await apiPostData('/api/user/settings/notifications', newSettings);
      Toast.show({
        type: 'success',
        text1: 'อัพเดทการแจ้งเตือนแล้ว',
      });
    } catch (error) {
      handleApiError(error);
      // Revert on error
      setNotificationSettings(prev => ({ ...prev, [type]: !value }));
    }
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Navigate based on type
    switch (notification.type) {
      case 'lottery':
        router.push('/user/lottery-check');
        break;
      case 'news':
        router.push('/user/news');
        break;
      default:
        // Show detail modal or navigate to detail page
        break;
    }
  };

  return (
    <Container>
      <View style={tw`flex-1 bg-gray-50`}>
        {/* Header */}
        <View style={tw`bg-white px-4 py-3 shadow-sm`}>
          <View style={tw`flex-row justify-between items-center`}>
            <Text style={tw`text-2xl font-bold text-gray-800`}>การแจ้งเตือน</Text>
            {unreadCount > 0 && (
              <Pressable onPress={markAllAsRead}>
                <Text style={tw`text-primary-600`}>อ่านทั้งหมด ({unreadCount})</Text>
              </Pressable>
            )}
          </View>

          {/* Filter Tabs */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={tw`mt-4`}
          >
            <Pressable
              onPress={() => setFilter('all')}
              style={tw`px-4 py-2 rounded-full mr-2 ${
                filter === 'all' ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <Text style={tw`${filter === 'all' ? 'text-white' : 'text-gray-600'}`}>
                ทั้งหมด
              </Text>
            </Pressable>
            {Object.entries(typeLabels).map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
                style={tw`px-4 py-2 rounded-full mr-2 ${
                  filter === key ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <Text style={tw`${filter === key ? 'text-white' : 'text-gray-600'}`}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Settings Card */}
        <View style={tw`bg-white mx-4 mt-4 p-4 rounded-xl shadow-sm`}>
          <Text style={tw`text-lg font-bold mb-3`}>ตั้งค่าการแจ้งเตือน</Text>
          {Object.entries(typeLabels).map(([key, label]) => (
            <View key={key} style={tw`flex-row justify-between items-center py-2`}>
              <View style={tw`flex-row items-center`}>
                <Ionicons 
                  name={typeIcons[key as keyof typeof typeIcons].name as any} 
                  size={20} 
                  color={typeIcons[key as keyof typeof typeIcons].color} 
                />
                <Text style={tw`ml-3 text-gray-700`}>{label}</Text>
              </View>
              <Switch
                value={notificationSettings[key as keyof typeof notificationSettings]}
                onValueChange={(value) => updateNotificationSetting(key, value)}
                trackColor={{ false: '#D1D5DB', true: '#FFD700' }}
                thumbColor={notificationSettings[key as keyof typeof notificationSettings] ? '#FFA500' : '#9CA3AF'}
              />
            </View>
          ))}
        </View>

        {/* Notifications List */}
        <ScrollView
          style={tw`flex-1 mt-4`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {filteredNotifications.length === 0 ? (
            <View style={tw`items-center justify-center py-20`}>
              <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
              <Text style={tw`text-gray-400 mt-4`}>ไม่มีการแจ้งเตือน</Text>
            </View>
          ) : (
            filteredNotifications.map((notification) => (
              <Pressable
                key={notification.id}
                onPress={() => handleNotificationPress(notification)}
                style={tw`bg-white mx-4 mb-3 p-4 rounded-xl shadow-sm ${
                  !notification.isRead ? 'border-l-4 border-primary-500' : ''
                }`}
              >
                <View style={tw`flex-row`}>
                  <View style={tw`w-10 h-10 rounded-full items-center justify-center mr-3`}
                    style={{ backgroundColor: typeIcons[notification.type].color + '20' }}
                  >
                    <Ionicons 
                      name={typeIcons[notification.type].name as any} 
                      size={20} 
                      color={typeIcons[notification.type].color} 
                    />
                  </View>
                  <View style={tw`flex-1`}>
                    <View style={tw`flex-row justify-between items-start mb-1`}>
                      <Text style={tw`font-bold text-gray-800 flex-1 ${
                        !notification.isRead ? 'text-primary-600' : ''
                      }`}>
                        {notification.title}
                      </Text>
                      {!notification.isRead && (
                        <View style={tw`w-2 h-2 bg-primary-500 rounded-full ml-2`} />
                      )}
                    </View>
                    <Text style={tw`text-gray-600 mb-2`}>{notification.body}</Text>
                    <View style={tw`flex-row justify-between items-center`}>
                      <Text style={tw`text-xs text-gray-400`}>
                        {typeLabels[notification.type]}
                      </Text>
                      <Text style={tw`text-xs text-gray-400`}>
                        {format(new Date(notification.createdAt), 'dd MMM yyyy HH:mm', { locale: th })}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </Container>
  );
}