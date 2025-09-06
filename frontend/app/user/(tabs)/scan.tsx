import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Pressable, Animated, Dimensions, Vibration } from 'react-native';
import { Camera, CameraType, BarcodeScanningResult } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Container from '@/libs/components/Container';
import Text from '@/libs/components/Text';
import Button from '@/libs/components/Button';
import tw from '@/libs/constants/twrnc';
import { apiPostData, uploadFile, handleApiError } from '@/libs/utils/API_URILS';
import { useToast } from '@/libs/providers/ToastProvider';
import LottieView from 'lottie-react-native';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const ScanScreen = () => {
  const { showToast } = useToast();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [flashMode, setFlashMode] = useState(false);
  const [scanMode, setScanMode] = useState<'qr' | 'ocr'>('qr');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanningArea, setScanningArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // Animation refs
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cornerAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Start scanning animations
  useEffect(() => {
    if (hasPermission && !scanned) {
      // Scanning line animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Pulse animation for corners
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

      // Corner animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(cornerAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(cornerAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [hasPermission, scanned]);

  const handleBarCodeScanned = async ({ type, data }: BarcodeScanningResult) => {
    if (scanned || isProcessing) return;
    
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setScanned(true);
    setIsProcessing(true);
    
    // Success animation
    Animated.sequence([
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(successAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    try {
      // แสดงข้อมูลที่สแกนได้
      showToast('success', 'สแกน QR Code สำเร็จ', `เลขที่: ${data}`);
      
      // ตรวจสอบเลขที่สแกนได้
      if (data && data.length === 6 && /^\d+$/.test(data)) {
        // ถ้าเป็นเลข 6 หลัก ให้ตรวจหวยเลย
        const result = await apiPostData('/api/lottery/check', {
          ticketNumber: data,
        });
        
        // Success haptic
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Navigate back with result
        router.back();
        // TODO: ส่งผลลัพธ์กลับไปแสดง
      } else {
        // Error haptic
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        Alert.alert(
          'ข้อมูลไม่ถูกต้อง',
          'QR Code ที่สแกนไม่ใช่เลขลอตเตอรี่ 6 หลัก',
          [
            { text: 'สแกนใหม่', onPress: () => setScanned(false) },
            { text: 'ยกเลิก', onPress: () => router.back() }
          ]
        );
      }
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      handleApiError(error, (message) => {
        showToast('error', 'เกิดข้อผิดพลาด', message);
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const pickImageFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  const processImage = async (uri: string) => {
    setIsProcessing(true);
    try {
      // สร้าง FormData สำหรับ upload
      const formData = new FormData();
      formData.append('image', {
        uri,
        type: 'image/jpeg',
        name: 'lottery.jpg',
      } as any);

      // Upload และ OCR
      const response = await apiPostData('/api/lottery/scan-ocr', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.success && response.data?.selected) {
        showToast('success', 'สแกนสำเร็จ', `พบเลข: ${response.data.selected.number}`);
        // Navigate back with result
        router.back();
      } else {
        showToast('error', 'ไม่พบเลขในรูป', 'กรุณาลองถ่ายรูปใหม่');
      }
    } catch (error) {
      handleApiError(error, (message) => {
        showToast('error', 'เกิดข้อผิดพลาด', message);
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (hasPermission === null) {
    return (
      <Container>
        <View style={tw`flex-1 justify-center items-center bg-black`}>
          <Text style={tw`text-white`}>กำลังขอสิทธิ์เข้าถึงกล้อง...</Text>
        </View>
      </Container>
    );
  }

  if (hasPermission === false) {
    return (
      <Container>
        <View style={tw`flex-1 justify-center items-center bg-black p-6`}>
          <Ionicons name="camera" size={64} color="#FFD700" />
          <Text style={[tw`text-xl mt-4 text-center`, { color: '#FFD700' }]}>
            ไม่สามารถเข้าถึงกล้อง
          </Text>
          <Text style={[tw`text-sm mt-2 text-center`, { color: '#D4A574' }]}>
            กรุณาอนุญาตการเข้าถึงกล้องในการตั้งค่าของคุณ
          </Text>
          <Button
            onPress={() => router.back()}
            style={tw`mt-6`}
          >
            กลับ
          </Button>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <View style={tw`flex-1 bg-black`}>
        <Camera
          style={tw`flex-1`}
          type={CameraType.back}
          flashMode={flashMode ? Camera.Constants.FlashMode.torch : Camera.Constants.FlashMode.off}
          onBarCodeScanned={scanMode === 'qr' && !scanned ? handleBarCodeScanned : undefined}
          barCodeScannerSettings={{
            barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
          }}
        >
          {/* Header Controls */}
          <View style={tw`absolute top-12 left-0 right-0 px-4 z-10`}>
            <View style={tw`flex-row justify-between items-center`}>
              <Pressable
                onPress={() => router.back()}
                style={tw`bg-black/50 rounded-full p-3`}
              >
                <Ionicons name="arrow-back" size={24} color="#FFD700" />
              </Pressable>

              <View style={tw`flex-row gap-2`}>
                <Pressable
                  onPress={() => setFlashMode(!flashMode)}
                  style={tw`bg-black/50 rounded-full p-3`}
                >
                  <Ionicons 
                    name={flashMode ? "flash" : "flash-off"} 
                    size={24} 
                    color="#FFD700" 
                  />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Scan Frame */}
          <View style={tw`flex-1 justify-center items-center`}>
            <View style={tw`relative`}>
              {/* Scanning Area */}
              <View 
                style={tw`w-64 h-64 border-4 border-yellow-400 rounded-lg`}
                onLayout={(event) => {
                  const { x, y, width, height } = event.nativeEvent.layout;
                  setScanningArea({ x, y, width, height });
                }}
              >
                {/* Animated Corners */}
                <Animated.View 
                  style={[
                    tw`absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-yellow-400`,
                    { transform: [{ scale: pulseAnim }] }
                  ]} 
                />
                <Animated.View 
                  style={[
                    tw`absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-yellow-400`,
                    { transform: [{ scale: pulseAnim }] }
                  ]} 
                />
                <Animated.View 
                  style={[
                    tw`absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-yellow-400`,
                    { transform: [{ scale: pulseAnim }] }
                  ]} 
                />
                <Animated.View 
                  style={[
                    tw`absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-yellow-400`,
                    { transform: [{ scale: pulseAnim }] }
                  ]} 
                />

                {/* Scanning Line */}
                <Animated.View
                  style={[
                    tw`absolute left-0 right-0 h-1 bg-yellow-400`,
                    {
                      transform: [{
                        translateY: scanLineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 256], // height of scanning area
                        })
                      }]
                    }
                  ]}
                />

                {/* Success Overlay */}
                <Animated.View
                  style={[
                    tw`absolute inset-0 bg-green-500/20 rounded-lg items-center justify-center`,
                    {
                      opacity: successAnim,
                      transform: [{
                        scale: successAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.2]
                        })
                      }]
                    }
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                </Animated.View>
              </View>

              {/* Corner Glow Effects */}
              <Animated.View
                style={[
                  tw`absolute -top-2 -left-2 w-12 h-12 border-2 border-yellow-300 rounded-lg`,
                  {
                    opacity: cornerAnim,
                    transform: [{ scale: cornerAnim }]
                  }
                ]}
              />
              <Animated.View
                style={[
                  tw`absolute -top-2 -right-2 w-12 h-12 border-2 border-yellow-300 rounded-lg`,
                  {
                    opacity: cornerAnim,
                    transform: [{ scale: cornerAnim }]
                  }
                ]}
              />
              <Animated.View
                style={[
                  tw`absolute -bottom-2 -left-2 w-12 h-12 border-2 border-yellow-300 rounded-lg`,
                  {
                    opacity: cornerAnim,
                    transform: [{ scale: cornerAnim }]
                  }
                ]}
              />
              <Animated.View
                style={[
                  tw`absolute -bottom-2 -right-2 w-12 h-12 border-2 border-yellow-300 rounded-lg`,
                  {
                    opacity: cornerAnim,
                    transform: [{ scale: cornerAnim }]
                  }
                ]}
              />
            </View>
            
            <Text style={[tw`mt-6 text-center px-8 text-lg`, { color: '#FFD700' }]}>
              {scanMode === 'qr' 
                ? 'วาง QR Code ในกรอบเพื่อสแกน' 
                : 'ถ่ายรูปใบลอตเตอรี่ให้ชัดเจน'}
            </Text>

            {/* Processing Indicator */}
            {isProcessing && (
              <View style={tw`mt-4 flex-row items-center`}>
                <LottieView
                  source={require('@/assets/animations/loading.json')}
                  autoPlay
                  loop
                  style={tw`w-8 h-8`}
                />
                <Text style={[tw`ml-2 text-yellow-300`]}>กำลังประมวลผล...</Text>
              </View>
            )}
            
            {scanned && !isProcessing && (
              <Pressable
                onPress={() => setScanned(false)}
                style={tw`mt-4 bg-yellow-400 px-6 py-3 rounded-full`}
              >
                <Text style={tw`text-black font-bold`}>สแกนอีกครั้ง</Text>
              </Pressable>
            )}
          </View>

          {/* Bottom Controls */}
          <BlurView intensity={20} style={tw`absolute bottom-0 left-0 right-0`}>
            <View style={tw`px-6 py-8`}>
              {/* Mode Selector */}
              <View style={tw`flex-row justify-center gap-4 mb-6`}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setScanMode('qr');
                  }}
                  style={tw`${scanMode === 'qr' ? 'bg-yellow-400' : 'bg-white/20'} px-6 py-3 rounded-full flex-row items-center`}
                >
                  <Ionicons 
                    name="qr-code" 
                    size={20} 
                    color={scanMode === 'qr' ? '#000' : '#FFD700'} 
                  />
                  <Text style={[tw`ml-2 font-bold`, { color: scanMode === 'qr' ? '#000' : '#FFD700' }]}>
                    QR Code
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setScanMode('ocr');
                  }}
                  style={tw`${scanMode === 'ocr' ? 'bg-yellow-400' : 'bg-white/20'} px-6 py-3 rounded-full flex-row items-center`}
                >
                  <MaterialCommunityIcons 
                    name="text-recognition" 
                    size={20} 
                    color={scanMode === 'ocr' ? '#000' : '#FFD700'} 
                  />
                  <Text style={[tw`ml-2 font-bold`, { color: scanMode === 'ocr' ? '#000' : '#FFD700' }]}>
                    OCR
                  </Text>
                </Pressable>
              </View>

              {/* Action Buttons */}
              <View style={tw`flex-row gap-4`}>
                {/* Gallery Button */}
                <Pressable
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    pickImageFromGallery();
                  }}
                  disabled={isProcessing}
                  style={tw`flex-1`}
                >
                  <LinearGradient
                    colors={['#FFD700', '#D4AF37', '#B8860B']}
                    style={tw`rounded-full py-4 px-6 flex-row items-center justify-center`}
                  >
                    <Ionicons name="images" size={24} color="#1A0F0F" />
                    <Text style={[tw`ml-2 font-bold text-lg`, { color: '#1A0F0F' }]}>
                      อัลบั้ม
                    </Text>
                  </LinearGradient>
                </Pressable>

                {/* Flash Toggle */}
                <Pressable
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFlashMode(!flashMode);
                  }}
                  style={tw`bg-white/20 rounded-full p-4 items-center justify-center`}
                >
                  <Ionicons 
                    name={flashMode ? "flash" : "flash-off"} 
                    size={24} 
                    color="#FFD700" 
                  />
                </Pressable>

                {/* Close Button */}
                <Pressable
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.back();
                  }}
                  style={tw`bg-red-500/20 rounded-full p-4 items-center justify-center`}
                >
                  <Ionicons name="close" size={24} color="#EF5350" />
                </Pressable>
              </View>

              {/* Tips */}
              <View style={tw`mt-4 bg-white/10 rounded-xl p-3`}>
                <Text style={[tw`text-center text-sm`, { color: '#D4A574' }]}>
                  💡 {scanMode === 'qr' 
                    ? 'วาง QR Code ให้อยู่ในกรอบสีเหลือง' 
                    : 'ถ่ายรูปให้ชัดเจนและมีแสงเพียงพอ'}
                </Text>
              </View>
            </View>
          </BlurView>
        </Camera>
      </View>
    </Container>
  );
};

export default ScanScreen;