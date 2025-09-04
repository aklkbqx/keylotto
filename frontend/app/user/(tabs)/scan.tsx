import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Pressable } from 'react-native';
import { Camera, CameraType, BarcodeScanningResult } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Container from '@/libs/components/Container';
import Text from '@/libs/components/Text';
import Button from '@/libs/components/Button';
import tw from '@/libs/constants/twrnc';
import { apiPostData, uploadFile, handleApiError } from '@/libs/utils/API_URILS';
import { useToast } from '@/libs/providers/ToastProvider';

const ScanScreen = () => {
  const { showToast } = useToast();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [flashMode, setFlashMode] = useState(false);
  const [scanMode, setScanMode] = useState<'qr' | 'ocr'>('qr');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: BarcodeScanningResult) => {
    if (scanned || isProcessing) return;
    
    setScanned(true);
    setIsProcessing(true);
    
    try {
      // แสดงข้อมูลที่สแกนได้
      showToast('info', 'สแกน QR Code สำเร็จ', `เลขที่: ${data}`);
      
      // ตรวจสอบเลขที่สแกนได้
      if (data && data.length === 6 && /^\d+$/.test(data)) {
        // ถ้าเป็นเลข 6 หลัก ให้ตรวจหวยเลย
        const result = await apiPostData('/api/lottery/check', {
          ticketNumber: data,
        });
        
        // Navigate back with result
        router.back();
        // TODO: ส่งผลลัพธ์กลับไปแสดง
      } else {
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
            <View style={tw`w-64 h-64 border-4 border-yellow-400 rounded-lg`}>
              <View style={tw`absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-yellow-400`} />
              <View style={tw`absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-yellow-400`} />
              <View style={tw`absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-yellow-400`} />
              <View style={tw`absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-yellow-400`} />
            </View>
            
            <Text style={[tw`mt-4 text-center px-8`, { color: '#FFD700' }]}>
              {scanMode === 'qr' 
                ? 'วาง QR Code ในกรอบเพื่อสแกน' 
                : 'ถ่ายรูปใบลอตเตอรี่ให้ชัดเจน'}
            </Text>
            
            {scanned && (
              <Pressable
                onPress={() => setScanned(false)}
                style={tw`mt-4 bg-yellow-400 px-4 py-2 rounded-full`}
              >
                <Text style={tw`text-black font-bold`}>สแกนอีกครั้ง</Text>
              </Pressable>
            )}
          </View>

          {/* Bottom Controls */}
          <View style={tw`absolute bottom-8 left-0 right-0 px-6`}>
            {/* Mode Selector */}
            <View style={tw`flex-row justify-center gap-4 mb-4`}>
              <Pressable
                onPress={() => setScanMode('qr')}
                style={tw`${scanMode === 'qr' ? 'bg-yellow-400' : 'bg-black/50'} px-4 py-2 rounded-full`}
              >
                <Text style={[tw`font-bold`, { color: scanMode === 'qr' ? '#000' : '#FFD700' }]}>
                  QR Code
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setScanMode('ocr')}
                style={tw`${scanMode === 'ocr' ? 'bg-yellow-400' : 'bg-black/50'} px-4 py-2 rounded-full`}
              >
                <Text style={[tw`font-bold`, { color: scanMode === 'ocr' ? '#000' : '#FFD700' }]}>
                  ถ่ายรูป OCR
                </Text>
              </Pressable>
            </View>

            {/* Gallery Button */}
            <Pressable
              onPress={pickImageFromGallery}
              disabled={isProcessing}
            >
              <LinearGradient
                colors={['#FFD700', '#D4AF37', '#B8860B']}
                style={tw`rounded-full py-3 px-6 flex-row items-center justify-center`}
              >
                <Ionicons name="images" size={20} color="#1A0F0F" />
                <Text style={[tw`ml-2 font-bold`, { color: '#1A0F0F' }]}>
                  เลือกจากอัลบั้ม
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Camera>
      </View>
    </Container>
  );
};

export default ScanScreen;