import { Platform } from 'react-native';

export interface ImagePickerResult {
    canceled: boolean;
    assets?: {
        uri: string;
        width: number;
        height: number;
        type?: string;
        fileName?: string;
        fileSize?: number;
    }[];
}

export interface ImagePickerOptions {
    mediaTypes?: 'Images' | 'Videos' | 'All';
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
    allowsMultipleSelection?: boolean;
}

export default class ImagePickerWrapper {
    static async launchImageLibraryAsync(options?: ImagePickerOptions): Promise<ImagePickerResult> {
        if (Platform.OS === 'web') {
            // Web implementation using input file
            return new Promise((resolve) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.multiple = options?.allowsMultipleSelection || false;
                
                input.onchange = (event: any) => {
                    const files = event.target.files;
                    if (files && files.length > 0) {
                        const assets = Array.from(files).map((file: any) => ({
                            uri: URL.createObjectURL(file),
                            width: 0,
                            height: 0,
                            type: file.type,
                            fileName: file.name,
                            fileSize: file.size
                        }));
                        
                        resolve({
                            canceled: false,
                            assets
                        });
                    } else {
                        resolve({ canceled: true });
                    }
                };
                
                input.click();
            });
        } else {
            // Mobile implementation
            try {
                const ImagePicker = require('expo-image-picker');
                return await ImagePicker.launchImageLibraryAsync(options);
            } catch (error) {
                console.error('expo-image-picker not available:', error);
                return { canceled: true };
            }
        }
    }
    
    static async getMediaLibraryPermissionsAsync() {
        if (Platform.OS === 'web') {
            return { status: 'granted' };
        }
        
        try {
            const ImagePicker = require('expo-image-picker');
            return await ImagePicker.getMediaLibraryPermissionsAsync();
        } catch (error) {
            return { status: 'denied' };
        }
    }
    
    static async requestMediaLibraryPermissionsAsync() {
        if (Platform.OS === 'web') {
            return { status: 'granted' };
        }
        
        try {
            const ImagePicker = require('expo-image-picker');
            return await ImagePicker.requestMediaLibraryPermissionsAsync();
        } catch (error) {
            return { status: 'denied' };
        }
    }
}