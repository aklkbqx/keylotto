// utils/api.ts
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse, isAxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { storage } from './storage';

// Types
interface ErrorResponse {
    success: boolean;
    message: string;
    error?: string;
}

interface ToastFunction {
    (type: "success" | "error" | "info", title: string, message: string): void;
}

interface APIConfig {
    baseURL: string;
    timeout: number;
    maxRetries: number;
    retryDelay: number;
}

interface ApiResponseWithMeta<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: any;
}

class API_UTILS {
    private static instance: API_UTILS;
    private axiosInstance: AxiosInstance;
    private config: APIConfig;

    // Constants
    public static readonly userTokenLogin = "auth_token";
    public static readonly apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
    public static readonly wsUrl = process.env.EXPO_PUBLIC_WS_URL || "ws://localhost:3000";

    private constructor(config?: Partial<APIConfig>) {
        this.config = {
            baseURL: API_UTILS.apiUrl,
            timeout: 15000,
            maxRetries: 3,
            retryDelay: 1000,
            ...config,
        };

        this.axiosInstance = this.createAxiosInstance();
        this.setupRetryLogic();
        this.setupInterceptors();
    }

    public static getInstance(config?: Partial<APIConfig>): API_UTILS {
        if (!API_UTILS.instance) {
            API_UTILS.instance = new API_UTILS(config);
        }
        return API_UTILS.instance;
    }

    private createAxiosInstance(): AxiosInstance {
        return axios.create({
            baseURL: this.config.baseURL,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    private setupRetryLogic(): void {
        axiosRetry(this.axiosInstance, {
            retries: this.config.maxRetries,
            retryDelay: (retryCount, error) => {
                // Exponential backoff with jitter
                const delay = Math.min(this.config.retryDelay * Math.pow(2, retryCount - 1), 30000);
                const jitter = Math.random() * 0.1 * delay;
                return delay + jitter;
            },
            retryCondition: (error: AxiosError) => {
                // Retry on network errors, timeout, or 5xx server errors
                const isNetworkError = !error.response;
                const isTimeout = error.code === 'ECONNABORTED';
                const isServerError = error.response?.status && error.response.status >= 500;
                const isRateLimited = error.response?.status === 429;

                return isNetworkError || isTimeout || isServerError || isRateLimited;
            },
            onRetry: (retryCount, error, requestConfig) => {
                console.log(`🔄 Retrying request (${retryCount}/${this.config.maxRetries}):`, requestConfig.url);
            },
        });
    }

    private setupInterceptors(): void {
        // Request interceptor
        this.axiosInstance.interceptors.request.use(
            async (config) => {
                // Check network connectivity (skip for web platform)
                if (Platform.OS !== 'web') {
                    const netInfo = await NetInfo.fetch();
                    if (!netInfo.isConnected) {
                        return Promise.reject(new Error('ไม่มีการเชื่อมต่ออินเทอร์เน็ต'));
                    }
                }

                // Add auth token
                try {
                    const token = await this.getToken();
                    if (token) {
                        config.headers = config.headers || {};
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                } catch (error) {
                    console.warn('⚠️ Failed to get auth token:', error);
                }

                // Handle FormData - let browser set the boundary
                if (config.data instanceof FormData) {
                    delete config.headers['Content-Type'];
                }

                // Add request timestamp for debugging
                (config as any).metadata = { startTime: Date.now() };

                return config;
            },
            (error) => {
                console.error('🔴 Request interceptor error:', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.axiosInstance.interceptors.response.use(
            (response: AxiosResponse) => {
                // Log response time for debugging
                // const startTime = (response.config as any).metadata?.startTime;
                // const duration = startTime ? Date.now() - startTime : 0;
                // console.log(`✅ API Response (${duration}ms):`, response.config.url);

                return response;
            },
            async (error: AxiosError) => {
                const status = error.response?.status;
                const url = error.config?.url;

                console.error(`🔴 API Error ${status}:`, url, error.message);

                // Handle specific status codes
                switch (status) {
                    case 401:
                        await this.handleUnauthorized();
                        break;
                    case 403:
                        console.warn('🚫 Forbidden access attempt:', url);
                        break;
                    case 429:
                        const retryAfter = error.response?.headers['retry-after'];
                        if (retryAfter) {
                            console.warn(`⏰ Rate limited. Retry after: ${retryAfter}s`);
                        }
                        break;
                }

                return Promise.reject(error);
            }
        );
    }

    private async handleUnauthorized(): Promise<void> {
        try {
            await this.removeToken();
        } catch (error) {
            console.error('Error handling unauthorized:', error);
        }
    }

    // =================================
    // TOKEN MANAGEMENT (API Related)
    // =================================

    /**
     * บันทึก token สำหรับ API authentication
     */
    public async saveTokenAndLogin(token: string): Promise<void> {
        try {
            await storage.setItem(API_UTILS.userTokenLogin, token);
        } catch (error) {
            console.error('Error saving token:', error);
            throw new Error('ไม่สามารถบันทึก token ได้');
        }
    }

    /**
     * ดึง token สำหรับ API authentication
     */
    public async getToken(): Promise<string | null> {
        try {
            return await storage.getItem(API_UTILS.userTokenLogin);
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    }

    /**
     * ลบ token (logout)
     */
    public async removeToken(): Promise<void> {
        try {
            await storage.removeItem(API_UTILS.userTokenLogin);
        } catch (error) {
            console.error('Error removing token:', error);
        }
    }

    /**
     * ตรวจสอบว่า user login อยู่หรือไม่
     */
    public async isAuthenticated(): Promise<boolean> {
        const token = await this.getToken();
        return Boolean(token);
    }

    // =================================
    // HTTP METHODS
    // =================================

    /**
     * GET request with full response data
     */
    public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponseWithMeta<T>> {
        const response = await this.axiosInstance.get<T>(url, config);
        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        };
    }

    /**
     * POST request with full response data
     */
    public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponseWithMeta<T>> {
        const response = await this.axiosInstance.post<T>(url, data, config);
        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        };
    }

    /**
     * PUT request with full response data
     */
    public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponseWithMeta<T>> {
        const response = await this.axiosInstance.put<T>(url, data, config);
        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        };
    }

    /**
     * PATCH request with full response data
     */
    public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponseWithMeta<T>> {
        const response = await this.axiosInstance.patch<T>(url, data, config);
        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        };
    }

    /**
     * DELETE request with full response data
     */
    public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponseWithMeta<T>> {
        const response = await this.axiosInstance.delete<T>(url, config);
        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        };
    }

    /**
     * Upload file with progress
     */
    public async uploadFile<T = any>(
        url: string,
        file: File | Blob,
        onProgress?: (progress: number) => void
    ): Promise<ApiResponseWithMeta<T>> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await this.axiosInstance.post<T>(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress?.(progress);
                }
            },
        });

        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        };
    }

    // =================================
    // ERROR HANDLING
    // =================================

    /**
     * จัดการข้อผิดพลาดจาก API และส่งข้อความที่เหมาะสม
     */
    public static handleApiError(
        error: unknown,
        handleErrorMessage?: (message: string, errorPage?: boolean, showToast?: ToastFunction) => void,
        showToast?: ToastFunction
    ): string {
        let errorMessage = 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง';

        if (isAxiosError(error)) {
            const axiosError = error as AxiosError<ErrorResponse>;

            if (axiosError.response) {
                errorMessage = axiosError.response.data?.message || 'เกิดข้อผิดพลาดในการดำเนินการ';

                console.error('API Error Details:', {
                    status: axiosError.response.status,
                    data: axiosError.response.data,
                    url: axiosError.config?.url,
                });
            } else if (axiosError.request) {
                errorMessage = 'การเชื่อมต่อไม่เสถียร กรุณาตรวจสอบอินเทอร์เน็ต';
                console.error('Network error:', axiosError.request);
            } else {
                errorMessage = 'เกิดข้อผิดพลาดในการส่งคำขอ กรุณาลองใหม่อีกครั้ง';
                console.error('Request setup error:', axiosError.message);
            }
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        handleErrorMessage?.(errorMessage, false, showToast);
        showToast?.("error", "เกิดข้อผิดพลาด", errorMessage);

        return errorMessage;
    }

    /**
     * จัดการข้อความแสดงข้อผิดพลาด (รักษาไว้เพื่อ backward compatibility)
     */
    public static handleErrorMessage(
        error: unknown,
        errorPage?: boolean,
        showToast?: ToastFunction
    ): void {
        const errorMessage = typeof error === 'string' ? error : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
        showToast?.("error", "เกิดข้อผิดพลาด", errorMessage);

        if (errorPage) {
            // Handle navigation to error page if needed
        }
    }

    // =================================
    // API CONFIGURATION
    // =================================

    /**
     * Get raw axios instance สำหรับ advanced usage
     */
    public getAxiosInstance(): AxiosInstance {
        return this.axiosInstance;
    }

    /**
     * Update API configuration
     */
    public updateConfig(newConfig: Partial<APIConfig>): void {
        this.config = { ...this.config, ...newConfig };

        if (newConfig.baseURL) {
            this.axiosInstance.defaults.baseURL = newConfig.baseURL;
        }
        if (newConfig.timeout) {
            this.axiosInstance.defaults.timeout = newConfig.timeout;
        }
    }
}

export default API_UTILS;

// =================================
// EXPORTED FUNCTIONS FOR EASY ACCESS
// =================================

// Get API instance
export const getApiInstance = (config?: Partial<APIConfig>) => API_UTILS.getInstance(config);

// Token management functions
export const saveTokenAndLogin = async (token: string): Promise<void> => {
    const api = API_UTILS.getInstance();
    return api.saveTokenAndLogin(token);
};

export const getToken = async (): Promise<string | null> => {
    const api = API_UTILS.getInstance();
    return api.getToken();
};

export const removeToken = async (): Promise<void> => {
    const api = API_UTILS.getInstance();
    return api.removeToken();
};

export const isAuthenticated = async (): Promise<boolean> => {
    const api = API_UTILS.getInstance();
    return api.isAuthenticated();
};

// HTTP methods
export const apiGet = async <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponseWithMeta<T>> => {
    const api = API_UTILS.getInstance();
    return api.get<T>(url, config);
};

export const apiPost = async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponseWithMeta<T>> => {
    const api = API_UTILS.getInstance();
    return api.post<T>(url, data, config);
};

export const apiPut = async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponseWithMeta<T>> => {
    const api = API_UTILS.getInstance();
    return api.put<T>(url, data, config);
};

export const apiPatch = async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponseWithMeta<T>> => {
    const api = API_UTILS.getInstance();
    return api.patch<T>(url, data, config);
};

export const apiDelete = async <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponseWithMeta<T>> => {
    const api = API_UTILS.getInstance();
    return api.delete<T>(url, config);
};

export const uploadFile = async <T = any>(
    url: string,
    file: File | Blob,
    onProgress?: (progress: number) => void
): Promise<ApiResponseWithMeta<T>> => {
    const api = API_UTILS.getInstance();
    return api.uploadFile<T>(url, file, onProgress);
};

// Convenience functions that return data directly (for backward compatibility)
export const apiGetData = async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiGet<T>(url, config);
    return response.data;
};

export const apiPostData = async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiPost<T>(url, data, config);
    return response.data;
};

export const apiPutData = async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiPut<T>(url, data, config);
    return response.data;
};

export const apiPatchData = async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiPatch<T>(url, data, config);
    return response.data;
};

export const apiDeleteData = async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiDelete<T>(url, config);
    return response.data;
};

// Error handling functions
export const handleApiError = (
    error: unknown,
    handleErrorMessage?: (message: string, errorPage?: boolean, showToast?: ToastFunction) => void,
    showToast?: ToastFunction
): string => {
    return API_UTILS.handleApiError(error, handleErrorMessage, showToast);
};

export const handleErrorMessage = (
    error: unknown,
    errorPage?: boolean,
    showToast?: ToastFunction
): void => {
    API_UTILS.handleErrorMessage(error, errorPage, showToast);
};

// Configuration functions
export const updateApiConfig = (newConfig: Partial<APIConfig>): void => {
    const api = API_UTILS.getInstance();
    api.updateConfig(newConfig);
};

export const getAxiosInstance = (): AxiosInstance => {
    const api = API_UTILS.getInstance();
    return api.getAxiosInstance();
};

// Constants
export const API_CONSTANTS = {
    userTokenLogin: API_UTILS.userTokenLogin,
    apiUrl: API_UTILS.apiUrl,
    wsUrl: API_UTILS.wsUrl,
} as const;

// Types
export type { ErrorResponse, ToastFunction, APIConfig, ApiResponseWithMeta };