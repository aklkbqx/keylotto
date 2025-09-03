// utils/fileUtils.ts
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

export interface FileInfo {
    uri: string;
    type: string;
    name: string;
    size: number;
}

export interface ResizeOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
    mode?: 'contain' | 'cover';
}

export default class FILES_UTILS {
    /**
     * Resize รูปภาพเพื่อลดขนาด
     */
    static async resizeImage(
        uri: string,
        options: ResizeOptions = {}
    ): Promise<FileInfo> {
        const {
            maxWidth = 1024,
            maxHeight = 1024,
            quality = 0.8,
            format = 'jpeg',
            mode = 'contain'
        } = options;

        try {
            // Get original image dimensions first
            const originalInfo = await ImageManipulator.manipulateAsync(
                uri,
                [], // No transformations, just get info
                { format: ImageManipulator.SaveFormat.JPEG }
            );

            // Calculate proper dimensions while maintaining aspect ratio
            const aspectRatio = originalInfo.width / originalInfo.height;
            let newWidth: number;
            let newHeight: number;

            // Calculate scale factors for both dimensions
            const scaleWidth = maxWidth / originalInfo.width;
            const scaleHeight = maxHeight / originalInfo.height;
            
            let scale: number;
            
            if (mode === 'cover') {
                // Use the larger scale factor to ensure the image covers the entire area
                scale = Math.max(scaleWidth, scaleHeight);
                
                // Apply the scale to both dimensions
                newWidth = Math.round(originalInfo.width * scale);
                newHeight = Math.round(originalInfo.height * scale);
                
                // For cover mode, we may need to crop the image
                // So we'll resize first, then crop to exact dimensions
                if (newWidth > maxWidth || newHeight > maxHeight) {
                    // We'll handle cropping in the ImageManipulator call
                    newWidth = Math.min(newWidth, maxWidth);
                    newHeight = Math.min(newHeight, maxHeight);
                }
            } else {
                // 'contain' mode: Use the smaller scale factor to ensure both dimensions fit within limits
                scale = Math.min(scaleWidth, scaleHeight);
                
                // Apply the scale to both dimensions
                newWidth = Math.round(originalInfo.width * scale);
                newHeight = Math.round(originalInfo.height * scale);
                
                // Ensure we don't exceed the maximums (just in case of rounding errors)
                newWidth = Math.min(newWidth, maxWidth);
                newHeight = Math.min(newHeight, maxHeight);
            }

            // Debug logging
            console.log('🖼️ Image Resize Info:', {
                original: { width: originalInfo.width, height: originalInfo.height },
                maxDimensions: { maxWidth, maxHeight },
                mode,
                scale: scale.toFixed(3),
                new: { newWidth, newHeight }
            });

            let manipulations: any[] = [
                {
                    resize: {
                        width: newWidth,
                        height: newHeight,
                    },
                }
            ];

            // For cover mode, add cropping if needed to get exact dimensions
            if (mode === 'cover' && (newWidth !== maxWidth || newHeight !== maxHeight)) {
                manipulations.push({
                    crop: {
                        originX: Math.round((newWidth - maxWidth) / 2),
                        originY: Math.round((newHeight - maxHeight) / 2),
                        width: maxWidth,
                        height: maxHeight,
                    }
                });
            }

            const result = await ImageManipulator.manipulateAsync(
                uri,
                manipulations,
                {
                    compress: quality,
                    format: ImageManipulator.SaveFormat[format.toUpperCase() as keyof typeof ImageManipulator.SaveFormat],
                }
            );

            // คำนวณขนาดไฟล์ใหม่
            const newFileSize = await this.calculateFileSize(result.uri);

            // สร้าง file info จากผลลัพธ์
            const fileInfo: FileInfo = {
                uri: result.uri,
                type: `image/${format}`,
                name: `resized_${Date.now()}.${format}`,
                size: newFileSize
            };

            return fileInfo;

        } catch (error) {
            throw new Error('Failed to resize image');
        }
    }

    /**
     * ตรวจสอบและ resize รูปภาพถ้าจำเป็น
     */
    static async processImage(
        file: FileInfo,
        options: ResizeOptions = {}
    ): Promise<FileInfo> {
        // ตรวจสอบว่าเป็นรูปภาพหรือไม่
        if (!this.isImageFile(file)) {
            return file;
        }

        // ตรวจสอบขนาดไฟล์ (ถ้ามี)
        const maxSizeMB = 5; // 5MB
        if (file.size > maxSizeMB * 1024 * 1024) {
            const resizedFile = await this.resizeImage(file.uri, options);

            // Cleanup web file URI ถ้าจำเป็น
            if (Platform.OS === 'web' && file.uri.startsWith('blob:')) {
                this.cleanupWebFileUri(file.uri);
            }

            return resizedFile;
        }

        // ตรวจสอบขนาดรูปภาพ (ถ้าเป็นไปได้)
        try {
            const imageInfo = await ImageManipulator.manipulateAsync(
                file.uri,
                [], // ไม่มีการ manipulate
                { format: ImageManipulator.SaveFormat.JPEG }
            );

            const { maxWidth = 1024, maxHeight = 1024 } = options;

            if (imageInfo.width > maxWidth || imageInfo.height > maxHeight) {
                const resizedFile = await this.resizeImage(file.uri, options);

                // Cleanup web file URI ถ้าจำเป็น
                if (Platform.OS === 'web' && file.uri.startsWith('blob:')) {
                    this.cleanupWebFileUri(file.uri);
                }

                return resizedFile;
            }
        } catch (error) {
            // console.warn('⚠️ Could not check image dimensions:', error);
        }

        return file;
    }

    /**
     * สร้าง file object จาก asset ของ ImagePicker
     */
    static async createFileFromImageAsset(asset: any): Promise<FileInfo> {
        // กำหนด file name
        let fileName = asset.fileName || `image_${Date.now()}.jpg`;

        // แก้ไข extension ถ้าจำเป็น
        if (!fileName.includes('.')) {
            // ถ้าไม่มี extension ให้ใส่ .jpg
            fileName += '.jpg';
        }

        // กำหนด MIME type ที่ถูกต้อง
        let mimeType = asset.type || asset.mimeType;
        if (!mimeType || mimeType === 'image') {
            // ถ้าไม่มี type หรือเป็น 'image' ให้กำหนดเป็น jpeg
            mimeType = 'image/jpeg';
        } else if (!mimeType.startsWith('image/')) {
            // ถ้าไม่ใช่ MIME type ให้แปลงจาก extension
            const ext = fileName.split('.').pop()?.toLowerCase();
            switch (ext) {
                case 'jpeg':
                case 'jpg':
                    mimeType = 'image/jpeg';
                    break;
                case 'png':
                    mimeType = 'image/png';
                    break;
                case 'webp':
                    mimeType = 'image/webp';
                    break;
                case 'gif':
                    mimeType = 'image/gif';
                    break;
                default:
                    mimeType = 'image/jpeg';
            }
        }

        // คำนวณขนาดไฟล์
        let fileSize = asset.fileSize || asset.size || 0;
        if (fileSize === 0) {
            try {
                fileSize = await this.calculateFileSize(asset.uri);
            } catch (error) {
                // console.warn('⚠️ Could not calculate file size, using estimated size');
                // ใช้ขนาดประมาณการ (ประมาณ 1MB สำหรับรูปภาพคุณภาพปานกลาง)
                fileSize = 1024 * 1024;
            }
        }

        // สร้าง FileInfo object
        const fileInfo: FileInfo = {
            uri: asset.uri,
            type: mimeType,
            name: fileName,
            size: fileSize
        };

        return fileInfo;
    }

    /**
 * ประมวลผลรูปภาพสำหรับ web platform โดยเฉพาะ
 */
    static async processImageForWeb(file: FileInfo): Promise<FileInfo> {
        if (Platform.OS !== 'web') {
            return file;
        }

        try {
            // ถ้าเป็น data URI ให้แปลงเป็น Blob
            if (file.uri.startsWith('data:')) {
                const response = await fetch(file.uri);
                const blob = await response.blob();

                // สร้าง object URL ใหม่
                const newUri = URL.createObjectURL(blob);

                return {
                    ...file,
                    uri: newUri,
                    size: blob.size || file.size
                };
            }

            return file;
        } catch (error) {
            // console.error('❌ Error processing image for web:', error);
            return file;
        }
    }

    /**
     * สร้าง FormData entry ที่เหมาะสมสำหรับแต่ละ platform
     */
    static async createFormDataEntry(file: FileInfo, fieldName: string): Promise<{ key: string; value: any }> {
        if (Platform.OS === 'web') {
            try {
                // สำหรับ web platform
                let blob: Blob;

                if (file.uri.startsWith('blob:')) {
                    // ถ้าเป็น blob URL
                    const response = await fetch(file.uri);
                    blob = await response.blob();
                } else if (file.uri.startsWith('data:')) {
                    // ถ้าเป็น data URL
                    const response = await fetch(file.uri);
                    blob = await response.blob();
                } else {
                    throw new Error('Unsupported URI format for web platform');
                }

                // สร้าง File object จาก Blob
                const webFile = new File([blob], file.name, { type: file.type });

                return {
                    key: fieldName,
                    value: webFile
                };
            } catch (error) {
                // console.error('❌ Error creating web FormData entry:', error);
                throw new Error('Failed to process file for web upload');
            }
        } else {
            // สำหรับ mobile platform
            return {
                key: fieldName,
                value: {
                    uri: file.uri,
                    type: file.type,
                    name: file.name,
                } as any
            };
        }
    }

    /**
     * สร้าง file object จาก asset ของ DocumentPicker
     */
    static async createFileFromDocumentAsset(asset: any): Promise<FileInfo> {
        const fileInfo: FileInfo = {
            name: asset.name || `document_${Date.now()}.pdf`,
            size: asset.size || 0,
            type: asset.mimeType || 'application/octet-stream',
            uri: asset.uri
        };

        // คำนวณขนาดไฟล์ถ้าไม่มี
        let fileSize = asset.size || 0;
        if (fileSize === 0) {
            fileSize = await this.calculateFileSize(asset.uri);
        }

        // สร้าง file info จากผลลัพธ์
        const finalFileInfo: FileInfo = {
            uri: asset.uri,
            type: asset.mimeType || 'application/octet-stream',
            name: asset.name || `document_${Date.now()}.pdf`,
            size: fileSize
        };

        return finalFileInfo;
    }

    /**
     * ตรวจสอบประเภทไฟล์ที่อนุญาต
     */
    static isAllowedFileType(file: FileInfo): boolean {
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        // ตรวจสอบจาก MIME type
        const isAllowedByMimeType = allowedTypes.includes(file.type);

        // ตรวจสอบจาก file extension
        const extension = this.getFileExtension(file.name);
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'txt'];
        const isAllowedByExtension = allowedExtensions.includes(extension);

        const isAllowed = isAllowedByMimeType || isAllowedByExtension;
        return isAllowed;
    }

    /**
     * ตรวจสอบขนาดไฟล์
     */
    static isFileSizeValid(file: FileInfo, maxSizeMB: number = 50): boolean {
        return file.size <= maxSizeMB * 1024 * 1024;
    }

    /**
     * คำนวณขนาดไฟล์จาก URI
     */
    static async calculateFileSize(uri: string): Promise<number> {
        try {
            if (Platform.OS === 'web') {
                // สำหรับ web platform
                const response = await fetch(uri);
                const blob = await response.blob();
                return blob.size;
            } else {
                // สำหรับ mobile platform
                const { getInfoAsync } = await import('expo-file-system');
                const fileInfo = await getInfoAsync(uri);
                if (fileInfo.exists && 'size' in fileInfo) {
                    return fileInfo.size;
                }
                return 0;
            }
        } catch (error) {
            // console.warn('⚠️ Could not calculate file size:', error);
            return 0;
        }
    }

    /**
     * แปลงขนาดไฟล์เป็นหน่วยที่อ่านง่าย
     */
    static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * สร้าง file object จาก web File object
     */
    static async createFileFromWebFile(webFile: File): Promise<FileInfo> {
        const fileInfo: FileInfo = {
            name: webFile.name,
            size: webFile.size,
            type: webFile.type || 'application/octet-stream',
            uri: ''
        };

        // สร้าง URI สำหรับ web file
        const uri = URL.createObjectURL(webFile);
        fileInfo.uri = uri;

        return fileInfo;
    }

    /**
     * ลบ web file URI เพื่อป้องกัน memory leak
     */
    static cleanupWebFileUri(uri: string) {
        if (Platform.OS === 'web' && uri.startsWith('blob:')) {
            try {
                URL.revokeObjectURL(uri);
            } catch (error) {
                // console.warn('⚠️ Failed to cleanup web file URI:', error);
            }
        }
    }

    /**
     * ตรวจสอบว่าเป็น web platform หรือไม่
     */
    static isWebPlatform(): boolean {
        return Platform.OS === 'web';
    }

    /**
     * ตรวจสอบว่าเป็น mobile platform หรือไม่
     */
    static isMobilePlatform(): boolean {
        return Platform.OS === 'ios' || Platform.OS === 'android';
    }

    /**
     * สร้าง FormData สำหรับการอัพโหลดไฟล์
     */
    static async createFormData(file: FileInfo, fieldName: string = 'file'): Promise<FormData> {
        const formData = new FormData();

        try {
            if (this.isWebPlatform() && file.uri && file.uri.startsWith('blob:')) {
                // สำหรับ web platform ที่มี blob URI
                const response = await fetch(file.uri);
                const blob = await response.blob();
                formData.append(fieldName, blob, file.name);
            } else {
                // สำหรับ mobile platform หรือ web platform ที่มี file URI อื่นๆ
                formData.append(fieldName, {
                    uri: file.uri,
                    type: file.type,
                    name: file.name,
                } as any);
            }

            return formData;
        } catch (error) {
            // console.error('❌ Failed to create FormData:', error);
            throw new Error('Failed to process file for upload');
        }
    }

    /**
     * ตรวจสอบ file extension
     */
    static getFileExtension(filename: string): string {
        return filename.split('.').pop()?.toLowerCase() || '';
    }

    /**
     * ตรวจสอบว่าเป็นรูปภาพหรือไม่
     */
    static isImageFile(file: FileInfo): boolean {
        return file.type.startsWith('image/') ||
            ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(this.getFileExtension(file.name));
    }

    /**
     * ตรวจสอบว่าเป็นเอกสารหรือไม่
     */
    static isDocumentFile(file: FileInfo): boolean {
        return file.type.startsWith('application/') ||
            ['pdf', 'doc', 'docx', 'txt'].includes(this.getFileExtension(file.name));
    }

    /**
     * สร้าง file input element สำหรับ web platform
     */
    static createWebFileInput(
        accept: string = 'image/*,.pdf,.doc,.docx,.txt',
        multiple: boolean = false
    ): HTMLInputElement {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.multiple = multiple;
        input.style.display = 'none';

        return input;
    }

    /**
     * ตรวจสอบว่าไฟล์มีขนาดที่เหมาะสมหรือไม่
     */
    static isFileSizeReasonable(file: FileInfo, maxSizeMB: number = 50): boolean {
        const sizeInMB = file.size / (1024 * 1024);
        return sizeInMB <= maxSizeMB;
    }

    /**
     * แสดงข้อความขนาดไฟล์ในรูปแบบที่อ่านง่าย
     */
    static getFileSizeDisplay(file: FileInfo): string {
        return this.formatFileSize(file.size);
    }

    /**
     * ตรวจสอบไฟล์อย่างครบถ้วน
     */
    static validateFile(file: FileInfo, maxSizeMB: number = 50): { isValid: boolean; error?: string } {
        // ตรวจสอบประเภทไฟล์
        if (!this.isAllowedFileType(file)) {
            return {
                isValid: false,
                error: `ประเภทไฟล์ไม่รองรับ: ${file.type}`
            };
        }

        // ตรวจสอบขนาดไฟล์
        if (!this.isFileSizeReasonable(file, maxSizeMB)) {
            return {
                isValid: false,
                error: `ขนาดไฟล์ใหญ่เกินไป: ${this.formatFileSize(file.size)} (สูงสุด ${maxSizeMB}MB)`
            };
        }

        // ตรวจสอบชื่อไฟล์
        if (!file.name || file.name.trim() === '') {
            return {
                isValid: false,
                error: 'ชื่อไฟล์ไม่ถูกต้อง'
            };
        }

        return { isValid: true };
    }

    /**
     * แปลงไฟล์เป็น Blob สำหรับ web platform
     */
    static async fileToBlob(file: FileInfo): Promise<Blob> {
        if (this.isWebPlatform() && file.uri && file.uri.startsWith('blob:')) {
            const response = await fetch(file.uri);
            return await response.blob();
        } else {
            throw new Error('File is not a web blob or platform is not web');
        }
    }

    /**
     * สร้าง file upload progress handler
     */
    static createUploadProgressHandler(
        onProgress?: (progress: number) => void,
        onComplete?: () => void
    ) {
        return (progressEvent: any) => {
            if (progressEvent.lengthComputable && onProgress) {
                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(progress);
            }

            if (progressEvent.loaded === progressEvent.total && onComplete) {
                onComplete();
            }
        };
    }

    /**
     * ตรวจสอบว่าไฟล์เป็นรูปภาพที่สามารถแสดงได้หรือไม่
     */
    static isDisplayableImage(file: FileInfo): boolean {
        const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        return imageTypes.includes(file.type) ||
            imageExtensions.includes(this.getFileExtension(file.name));
    }

    /**
     * สร้าง file preview URL
     */
    static createFilePreviewUrl(file: FileInfo): string {
        if (this.isWebPlatform() && file.uri && file.uri.startsWith('blob:')) {
            return file.uri;
        } else {
            // สำหรับ mobile platform หรือ file URI อื่นๆ
            return file.uri;
        }
    }

    /**
     * ตรวจสอบว่าไฟล์สามารถ preview ได้หรือไม่
     */
    static canPreviewFile(file: FileInfo): boolean {
        return this.isDisplayableImage(file) ||
            this.getFileExtension(file.name) === 'pdf';
    }

    /**
     * สร้าง file icon name ตามประเภทไฟล์
     */
    static getFileIconName(file: FileInfo): string {
        if (this.isImageFile(file)) {
            return 'image';
        }

        const extension = this.getFileExtension(file.name);
        switch (extension) {
            case 'pdf': return 'document-text';
            case 'doc':
            case 'docx': return 'document';
            case 'txt': return 'document-text-outline';
            default: return 'attach';
        }
    }

    /**
     * ตรวจสอบและประมวลผลไฟล์ก่อนอัพโหลด
     */
    static async prepareFileForUpload(file: FileInfo, options?: ResizeOptions): Promise<FileInfo> {
        try {
            // ตรวจสอบประเภทไฟล์
            const extension = file.name.split('.').pop()?.toLowerCase() || '';
            const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'txt'];
            const isAllowed = allowedExtensions.includes(extension);

            if (!isAllowed) {
                throw new Error(`File type not allowed: ${extension}`);
            }

            // ถ้าเป็นรูปภาพและมี options ให้ resize
            if (this.isImageFile(file) && options) {
                return await this.resizeImage(file.uri, options);
            }

            return file;
        } catch (error) {
            // console.error('File preparation error:', error);
            throw error;
        }
    }
}