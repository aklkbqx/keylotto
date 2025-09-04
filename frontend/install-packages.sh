#!/bin/bash

echo "📦 Installing required packages for KeyLotto..."

# Core Expo packages ที่จำเป็น (บางตัวอาจมีแล้ว)
echo "Installing Expo packages..."
npx expo install \
  expo-camera \
  expo-barcode-scanner \
  expo-sharing \
  expo-media-library \
  expo-file-system \
  expo-haptics \
  @react-native-async-storage/async-storage

# Lottie for animations (ถ้าต้องการใช้)
echo "Installing Lottie..."
npm install lottie-react-native

# สำหรับ QR Code generation (ไม่ใช่ scan)
echo "Installing QR Code generator..."
npm install react-native-qrcode-svg react-native-svg

# สำหรับ View Shot (capture view as image)
echo "Installing View Shot..."
npm install react-native-view-shot

echo "✅ Installation complete!"
echo "📝 Note: Some packages may already be installed"