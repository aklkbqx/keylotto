import { Platform } from 'react-native';

export default class FileSystemWrapper {
    static documentDirectory = Platform.OS === 'web' ? '' : null;
    
    static async writeAsStringAsync(fileUri: string, content: string, options?: any): Promise<void> {
        if (Platform.OS === 'web') {
            // Web implementation - download file
            const blob = new Blob([content], { type: options?.mimeType || 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileUri.split('/').pop() || 'download';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            try {
                const FileSystem = require('expo-file-system');
                await FileSystem.writeAsStringAsync(fileUri, content, options);
            } catch (error) {
                console.error('expo-file-system not available:', error);
            }
        }
    }
    
    static async readAsStringAsync(fileUri: string): Promise<string> {
        if (Platform.OS === 'web') {
            // Web can't read local files directly
            throw new Error('Reading files not supported on web');
        } else {
            try {
                const FileSystem = require('expo-file-system');
                return await FileSystem.readAsStringAsync(fileUri);
            } catch (error) {
                console.error('expo-file-system not available:', error);
                throw error;
            }
        }
    }
    
    static async getInfoAsync(fileUri: string): Promise<any> {
        if (Platform.OS === 'web') {
            return { exists: false };
        } else {
            try {
                const FileSystem = require('expo-file-system');
                return await FileSystem.getInfoAsync(fileUri);
            } catch (error) {
                return { exists: false };
            }
        }
    }
}

class SharingWrapper {
    static async isAvailableAsync(): Promise<boolean> {
        if (Platform.OS === 'web') {
            return navigator.share !== undefined;
        } else {
            try {
                const Sharing = require('expo-sharing');
                return await Sharing.isAvailableAsync();
            } catch (error) {
                return false;
            }
        }
    }
    
    static async shareAsync(url: string, options?: any): Promise<void> {
        if (Platform.OS === 'web') {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: options?.dialogTitle || 'Share',
                        text: options?.mimeType || 'Share file',
                        url: url
                    });
                } catch (error) {
                    console.log('Web share failed:', error);
                }
            } else {
                // Fallback - download file
                window.open(url, '_blank');
            }
        } else {
            try {
                const Sharing = require('expo-sharing');
                await Sharing.shareAsync(url, options);
            } catch (error) {
                console.error('expo-sharing not available:', error);
            }
        }
    }
}

class MediaLibraryWrapper {
    static async requestPermissionsAsync() {
        if (Platform.OS === 'web') {
            return { status: 'granted' };
        } else {
            try {
                const MediaLibrary = require('expo-media-library');
                return await MediaLibrary.requestPermissionsAsync();
            } catch (error) {
                return { status: 'denied' };
            }
        }
    }
    
    static async saveToLibraryAsync(fileUri: string): Promise<void> {
        if (Platform.OS === 'web') {
            // Web - trigger download instead
            const a = document.createElement('a');
            a.href = fileUri;
            a.download = fileUri.split('/').pop() || 'download';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            try {
                const MediaLibrary = require('expo-media-library');
                await MediaLibrary.saveToLibraryAsync(fileUri);
            } catch (error) {
                console.error('expo-media-library not available:', error);
            }
        }
    }
}

export { 
    FileSystemWrapper as FileSystem, 
    SharingWrapper as Sharing,
    MediaLibraryWrapper as MediaLibrary
};