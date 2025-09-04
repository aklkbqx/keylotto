import { ConfigContext, ExpoConfig } from 'expo/config';

export const appName = process.env.EXPO_PUBLIC_APP_NAME || 'KeyLotto';
export const appSlug = process.env.EXPO_PUBLIC_APP_SLUG || 'keylotto';
export const appScheme = process.env.EXPO_PUBLIC_APP_SCHEME || 'keylotto';
export const appBundleIdentifier = process.env.EXPO_PUBLIC_APP_BUNDLE_IDENTIFIER || 'com.keylotto';
export const projectId = process.env.EXPO_PUBLIC_PROJECT_ID || '7aef1d64-d4fe-4132-bd38-7e6ce190910f';
export const appVersion = process.env.EXPO_PUBLIC_APPVERSION || "1.0.0";

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: appName,
    slug: appSlug,
    version: appVersion,
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: appScheme,
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
        bundleIdentifier: appBundleIdentifier,
        supportsTablet: true,
        infoPlist: {
            NSCameraUsageDescription: "แอป KeyLotto ต้องการเข้าถึงกล้องเพื่อสแกน QR Code และถ่ายรูปใบลอตเตอรี่",
            NSPhotoLibraryUsageDescription: "แอป KeyLotto ต้องการเข้าถึงรูปภาพเพื่อเลือกรูปใบลอตเตอรี่และบันทึกผลการตรวจหวย",
            NSPhotoLibraryAddUsageDescription: "แอป KeyLotto ต้องการบันทึกรูปผลการตรวจหวยลงในอัลบั้มของคุณ",
            ITSAppUsesNonExemptEncryption: false
        },
    },
    android: {
        package: appBundleIdentifier,
        adaptiveIcon: {
            foregroundImage: './assets/images/adaptive-icon.png',
            backgroundColor: '#ffffff',
        },
        edgeToEdgeEnabled: true,
        permissions: [
            'CAMERA',
            'READ_EXTERNAL_STORAGE',
            'WRITE_EXTERNAL_STORAGE',
            'READ_MEDIA_IMAGES',
            'POST_NOTIFICATIONS',
            'INTERNET',
            'ACCESS_NETWORK_STATE',
            'VIBRATE',
        ],
    },
    web: {
        bundler: 'metro',
        output: 'static',
        favicon: './assets/images/favicon.png'
    },
    plugins: [
        'expo-router',
        'expo-font',
        "expo-secure-store",
        [
            'expo-camera',
            {
                cameraPermission: 'แอป KeyLotto ต้องการเข้าถึงกล้องเพื่อสแกน QR Code และถ่ายรูปใบลอตเตอรี่',
            }
        ],
        [
            'expo-barcode-scanner',
            {
                cameraPermission: 'แอป KeyLotto ต้องการเข้าถึงกล้องเพื่อสแกน QR Code บนใบลอตเตอรี่',
            }
        ],
        [
            'expo-image-picker',
            {
                photosPermission: 'แอป KeyLotto ต้องการเข้าถึงรูปภาพเพื่อเลือกรูปใบลอตเตอรี่',
                cameraPermission: 'แอป KeyLotto ต้องการเข้าถึงกล้องเพื่อถ่ายรูปใบลอตเตอรี่',
            }
        ],
        [
            'expo-media-library',
            {
                photosPermission: 'แอป KeyLotto ต้องการบันทึกรูปผลการตรวจหวยลงในอัลบั้มของคุณ',
                savePhotosPermission: 'แอป KeyLotto ต้องการบันทึกรูปผลการตรวจหวย',
                isAccessMediaLocationEnabled: true,
            }
        ],
        [
            'expo-splash-screen',
            {
                image: './assets/images/splash-icon.png',
                imageWidth: 200,
                resizeMode: 'contain',
                backgroundColor: '#000000',
            },
        ],
        'expo-asset',
        [
            'expo-notifications',
            {
                color: '#fff',
                defaultChannel: 'default',
                enableBackgroundRemoteNotifications: true,
            }
        ],
        [
            'expo-build-properties',
            {
                "android": {
                    "compileSdkVersion": 35,
                    "targetSdkVersion": 35,
                    "buildToolsVersion": "35.0.0"
                },
                "ios": {
                    "deploymentTarget": "15.1"
                }
            }
        ],
    ],
    experiments: {
        typedRoutes: true,
    },
    extra: {
        router: {},
        eas: {
            projectId: projectId,
        }
    },
    owner: 'akalak'
})