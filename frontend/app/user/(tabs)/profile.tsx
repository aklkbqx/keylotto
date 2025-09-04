import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Alert, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import Container from '@/libs/components/Container';
import Text from '@/libs/components/Text';
import Button from '@/libs/components/Button';
import tw from '@/libs/constants/twrnc';
import { Image } from 'expo-image';
import { useAuth } from '@/libs/providers/AuthProvider';
import { apiGetData, apiPutData, uploadFile, handleApiError, removeToken } from '@/libs/utils/API_URILS';
import { useToast } from '@/libs/providers/ToastProvider';

interface UserStats {
  totalChecks: number;
  totalWins: number;
  totalNearMiss: number;
  winRate: number;
  luckyNumber?: string;
}

interface UserSettings {
  notifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

const ProfileScreen = () => {
  const { user, logout, updateUser } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    totalChecks: 0,
    totalWins: 0,
    totalNearMiss: 0,
    winRate: 0,
  });
  const [settings, setSettings] = useState<UserSettings>({
    notifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Fetch user stats
      const statsResponse = await apiGetData('/api/user/stats');
      setStats(statsResponse.stats || stats);

      // Fetch user settings
      const settingsResponse = await apiGetData('/api/user/settings');
      setSettings(settingsResponse.settings || settings);
    } catch (error) {
      // Use mock data for now
      setStats({
        totalChecks: 156,
        totalWins: 3,
        totalNearMiss: 28,
        winRate: 1.9,
        luckyNumber: '23',
      });
    }
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadProfileImage(result.assets[0].uri);
    }
  };

  const uploadProfileImage = async (uri: string) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      const response = await uploadFile('/api/user/profile-image', formData as any, (progress) => {
        console.log(`Upload progress: ${progress}%`);
      });

      if (response.data.success) {
        updateUser({ ...user, profileImage: response.data.imageUrl });
        showToast('success', 'สำเร็จ', 'อัพเดทรูปโปรไฟล์แล้ว');
      }
    } catch (error) {
      handleApiError(error, (message) => {
        showToast('error', 'เกิดข้อผิดพลาด', message);
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = async (key: keyof UserSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      await apiPutData('/api/user/settings', { settings: newSettings });
      showToast('success', 'บันทึกแล้ว', 'อัพเดทการตั้งค่าเรียบร้อย');
    } catch (error) {
      // Revert on error
      setSettings(settings);
      handleApiError(error, (message) => {
        showToast('error', 'เกิดข้อผิดพลาด', message);
      });
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'ออกจากระบบ',
      'คุณต้องการออกจากระบบใช่หรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ออกจากระบบ',
          style: 'destructive',
          onPress: async () => {
            await removeToken();
            logout();
            router.replace('/welcome');
          },
        },
      ]
    );
  };

  return (
    <Container>
      <LinearGradient
        colors={['#1A0F0F', '#2D1810', '#1A0F0F']}
        style={tw`flex-1`}
      >
        <ScrollView
          contentContainerStyle={tw`pb-20`}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Profile Section */}
          <LinearGradient
            colors={['#2D1810', '#1A0F0F']}
            style={tw`px-6 pt-12 pb-8`}
          >
            <View style={tw`items-center`}>
              {/* Profile Image */}
              <Pressable onPress={handleImagePick} disabled={isLoading}>
                <View style={tw`relative`}>
                  <Image
                    source={{ uri: user?.profileImage || 'https://via.placeholder.com/150' }}
                    style={tw`w-32 h-32 rounded-full border-4 border-yellow-600/50`}
                  />
                  <View style={tw`absolute bottom-0 right-0 bg-yellow-400 rounded-full p-2`}>
                    <Ionicons name="camera" size={20} color="#1A0F0F" />
                  </View>
                </View>
              </Pressable>

              {/* User Info */}
              <Text style={[tw`text-2xl font-bold mt-4`, { color: '#FFD700' }]}>
                {user?.firstname} {user?.lastname}
              </Text>
              <Text style={[tw`text-sm mt-1`, { color: '#D4A574' }]}>
                {user?.email}
              </Text>

              {/* Member Badge */}
              <View style={tw`mt-3 bg-gradient-to-r from-yellow-900/40 to-red-900/40 px-4 py-2 rounded-full border border-yellow-600/30`}>
                <Text style={[tw`text-xs`, { color: '#FFD700' }]}>
                  🌟 สมาชิกระดับทอง
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Stats Section */}
          <View style={tw`px-6 mt-6`}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: '#FFD700' }]}>
              📊 สถิติการเล่น
            </Text>
            
            <View style={tw`bg-black/30 rounded-xl p-4 border border-yellow-600/20`}>
              <View style={tw`flex-row flex-wrap gap-4`}>
                <View style={tw`flex-1 min-w-[45%]`}>
                  <Text style={[tw`text-xs mb-1`, { color: '#8B7355' }]}>ตรวจทั้งหมด</Text>
                  <Text style={[tw`text-2xl font-bold`, { color: '#FFD700' }]}>{stats.totalChecks}</Text>
                  <Text style={[tw`text-xs`, { color: '#6B5D54' }]}>ครั้ง</Text>
                </View>
                
                <View style={tw`flex-1 min-w-[45%]`}>
                  <Text style={[tw`text-xs mb-1`, { color: '#8B7355' }]}>ถูกรางวัล</Text>
                  <Text style={[tw`text-2xl font-bold`, { color: '#4CAF50' }]}>{stats.totalWins}</Text>
                  <Text style={[tw`text-xs`, { color: '#6B5D54' }]}>ครั้ง</Text>
                </View>
                
                <View style={tw`flex-1 min-w-[45%]`}>
                  <Text style={[tw`text-xs mb-1`, { color: '#8B7355' }]}>เฉียดรางวัล</Text>
                  <Text style={[tw`text-2xl font-bold`, { color: '#FFA726' }]}>{stats.totalNearMiss}</Text>
                  <Text style={[tw`text-xs`, { color: '#6B5D54' }]}>ครั้ง</Text>
                </View>
                
                <View style={tw`flex-1 min-w-[45%]`}>
                  <Text style={[tw`text-xs mb-1`, { color: '#8B7355' }]}>อัตราถูก</Text>
                  <Text style={[tw`text-2xl font-bold`, { color: '#FFD700' }]}>{stats.winRate}%</Text>
                  <Text style={[tw`text-xs`, { color: '#6B5D54' }]}>เปอร์เซ็นต์</Text>
                </View>
              </View>

              {stats.luckyNumber && (
                <View style={tw`mt-4 pt-4 border-t border-yellow-600/10 items-center`}>
                  <Text style={[tw`text-xs mb-2`, { color: '#8B7355' }]}>เลขนำโชคของคุณ</Text>
                  <Text style={[tw`text-3xl font-bold`, { color: '#FFD700', fontFamily: 'Aboreto_400Regular' }]}>
                    {stats.luckyNumber}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Settings Section */}
          <View style={tw`px-6 mt-6`}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: '#FFD700' }]}>
              ⚙️ การตั้งค่า
            </Text>

            <View style={tw`bg-black/30 rounded-xl border border-yellow-600/20`}>
              {/* Notifications */}
              <View style={tw`flex-row items-center justify-between p-4 border-b border-yellow-600/10`}>
                <View style={tw`flex-row items-center flex-1`}>
                  <Ionicons name="notifications" size={20} color="#FFD700" />
                  <Text style={[tw`ml-3`, { color: '#F5E6D3' }]}>
                    การแจ้งเตือน
                  </Text>
                </View>
                <Switch
                  value={settings.notifications}
                  onValueChange={(value) => handleSettingChange('notifications', value)}
                  trackColor={{ false: '#3D2520', true: '#D4AF37' }}
                  thumbColor={settings.notifications ? '#FFD700' : '#8B7355'}
                />
              </View>

              {/* Sound */}
              <View style={tw`flex-row items-center justify-between p-4 border-b border-yellow-600/10`}>
                <View style={tw`flex-row items-center flex-1`}>
                  <Ionicons name="volume-high" size={20} color="#FFD700" />
                  <Text style={[tw`ml-3`, { color: '#F5E6D3' }]}>
                    เสียง
                  </Text>
                </View>
                <Switch
                  value={settings.soundEnabled}
                  onValueChange={(value) => handleSettingChange('soundEnabled', value)}
                  trackColor={{ false: '#3D2520', true: '#D4AF37' }}
                  thumbColor={settings.soundEnabled ? '#FFD700' : '#8B7355'}
                />
              </View>

              {/* Vibration */}
              <View style={tw`flex-row items-center justify-between p-4`}>
                <View style={tw`flex-row items-center flex-1`}>
                  <MaterialCommunityIcons name="vibrate" size={20} color="#FFD700" />
                  <Text style={[tw`ml-3`, { color: '#F5E6D3' }]}>
                    การสั่น
                  </Text>
                </View>
                <Switch
                  value={settings.vibrationEnabled}
                  onValueChange={(value) => handleSettingChange('vibrationEnabled', value)}
                  trackColor={{ false: '#3D2520', true: '#D4AF37' }}
                  thumbColor={settings.vibrationEnabled ? '#FFD700' : '#8B7355'}
                />
              </View>
            </View>
          </View>

          {/* Menu Items */}
          <View style={tw`px-6 mt-6`}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: '#FFD700' }]}>
              📱 เมนูอื่นๆ
            </Text>

            <View style={tw`gap-3`}>
              {/* Share App */}
              <Pressable
                onPress={() => {
                  // Share app logic
                  showToast('info', 'กำลังพัฒนา', 'ฟีเจอร์นี้กำลังพัฒนา');
                }}
              >
                <LinearGradient
                  colors={['#2D1810', '#3D2520']}
                  style={tw`rounded-xl p-4 border border-yellow-600/20 flex-row items-center justify-between`}
                >
                  <View style={tw`flex-row items-center`}>
                    <Ionicons name="share-social" size={20} color="#FFD700" />
                    <Text style={[tw`ml-3`, { color: '#F5E6D3' }]}>
                      แชร์แอปให้เพื่อน
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8B7355" />
                </LinearGradient>
              </Pressable>

              {/* Rate App */}
              <Pressable
                onPress={() => {
                  showToast('info', 'กำลังพัฒนา', 'ฟีเจอร์นี้กำลังพัฒนา');
                }}
              >
                <LinearGradient
                  colors={['#2D1810', '#3D2520']}
                  style={tw`rounded-xl p-4 border border-yellow-600/20 flex-row items-center justify-between`}
                >
                  <View style={tw`flex-row items-center`}>
                    <Ionicons name="star" size={20} color="#FFD700" />
                    <Text style={[tw`ml-3`, { color: '#F5E6D3' }]}>
                      ให้คะแนนแอป
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8B7355" />
                </LinearGradient>
              </Pressable>

              {/* Help */}
              <Pressable
                onPress={() => {
                  showToast('info', 'กำลังพัฒนา', 'ฟีเจอร์นี้กำลังพัฒนา');
                }}
              >
                <LinearGradient
                  colors={['#2D1810', '#3D2520']}
                  style={tw`rounded-xl p-4 border border-yellow-600/20 flex-row items-center justify-between`}
                >
                  <View style={tw`flex-row items-center`}>
                    <Ionicons name="help-circle" size={20} color="#FFD700" />
                    <Text style={[tw`ml-3`, { color: '#F5E6D3' }]}>
                      ช่วยเหลือ
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8B7355" />
                </LinearGradient>
              </Pressable>

              {/* About */}
              <Pressable
                onPress={() => {
                  Alert.alert(
                    'เกี่ยวกับ KeyLotto',
                    'แอปตรวจหวยสายมู เวอร์ชัน 1.0.0\n\nพัฒนาโดย KeyLotto Team\n© 2024 KeyLotto. All rights reserved.',
                    [{ text: 'ตกลง' }]
                  );
                }}
              >
                <LinearGradient
                  colors={['#2D1810', '#3D2520']}
                  style={tw`rounded-xl p-4 border border-yellow-600/20 flex-row items-center justify-between`}
                >
                  <View style={tw`flex-row items-center`}>
                    <Ionicons name="information-circle" size={20} color="#FFD700" />
                    <Text style={[tw`ml-3`, { color: '#F5E6D3' }]}>
                      เกี่ยวกับแอป
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8B7355" />
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          {/* Logout Button */}
          <View style={tw`px-6 mt-8 mb-6`}>
            <Pressable onPress={handleLogout}>
              <LinearGradient
                colors={['#DC143C', '#8B0000']}
                style={tw`rounded-full py-4 px-6 flex-row items-center justify-center`}
              >
                <Ionicons name="log-out" size={20} color="#FFFFFF" />
                <Text style={[tw`ml-2 font-bold`, { color: '#FFFFFF' }]}>
                  ออกจากระบบ
                </Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* App Version */}
          <View style={tw`items-center mb-4`}>
            <Text style={[tw`text-xs`, { color: '#6B5D54' }]}>
              เวอร์ชัน 1.0.0
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </Container>
  );
};

export default ProfileScreen;