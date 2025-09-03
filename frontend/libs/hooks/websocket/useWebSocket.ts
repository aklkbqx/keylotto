import { API_CONSTANTS, getToken } from '@/libs/utils/API_URILS';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';

export interface UnifiedWebSocketMessage {
    type: 'system' | 'status' | 'chat' | 'notification' | 'booking' | 'payment';
    action: string;
    data?: any;
    requestId?: string;
    timestamp: string;
}

export interface UnifiedWebSocketResponse {
    type: string;
    action: string;
    data?: any;
    requestId?: string;
    timestamp: string;
    success: boolean;
    error?: string;
}

export interface UnifiedWebSocketReturn {
    // Connection state
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
    
    // Core methods
    connect: () => void;
    disconnect: () => void;
    sendMessage: (message: UnifiedWebSocketMessage) => void;
    
    // Handler subscriptions
    subscribeToHandler: (handlerType: string, callback: (response: UnifiedWebSocketResponse) => void) => () => void;
    
    // Connection info
    connectionId: string | null;
    userId: number | null;
    serverTime: string | null;
}

// Global connection state to prevent multiple connections
let globalWS: WebSocket | null = null;
let globalConnectionId: string | null = null;
let globalUserId: number | null = null;
let globalServerTime: string | null = null;
let globalIsConnected = false;
let globalIsConnecting = false;
let globalError: string | null = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5; // เพิ่มเป็น 5 ครั้ง
const BASE_RECONNECT_DELAY = 1000; // 1 วินาที
const MAX_RECONNECT_DELAY = 30000; // 30 วินาที

// Global subscriptions map
const globalSubscriptions = new Map<string, Set<(response: UnifiedWebSocketResponse) => void>>();

// Global message queue
let globalMessageQueue: UnifiedWebSocketMessage[] = [];

// Prevent multiple connection attempts
let connectionPromise: Promise<void> | null = null;
let reconnectTimeoutRef: ReturnType<typeof setTimeout> | null = null;

export const useUnifiedWebSocket = (isAuthenticated: boolean = false): UnifiedWebSocketReturn => {
    const [isConnected, setIsConnected] = useState(globalIsConnected);
    const [isConnecting, setIsConnecting] = useState(globalIsConnecting);
    const [error, setError] = useState<string | null>(globalError);
    const [connectionId, setConnectionId] = useState<string | null>(globalConnectionId);
    const [userId, setUserId] = useState<number | null>(globalUserId);
    const [serverTime, setServerTime] = useState<string | null>(globalServerTime);

    const shouldReconnectRef = useRef(true);
    const isInitializedRef = useRef(false);

    // Update global state and all hook instances
    const updateGlobalState = useCallback((newState: Partial<{
        isConnected: boolean;
        isConnecting: boolean;
        error: string | null;
        connectionId: string | null;
        userId: number | null;
        serverTime: string | null;
    }>) => {
        if (newState.isConnected !== undefined) {
            globalIsConnected = newState.isConnected;
            setIsConnected(newState.isConnected);
        }
        if (newState.isConnecting !== undefined) {
            globalIsConnecting = newState.isConnecting;
            setIsConnecting(newState.isConnecting);
        }
        if (newState.error !== undefined) {
            globalError = newState.error;
            setError(newState.error);
        }
        if (newState.connectionId !== undefined) {
            globalConnectionId = newState.connectionId;
            setConnectionId(newState.connectionId);
        }
        if (newState.userId !== undefined) {
            globalUserId = newState.userId;
            setUserId(newState.userId);
        }
        if (newState.serverTime !== undefined) {
            globalServerTime = newState.serverTime;
            setServerTime(newState.serverTime);
        }
    }, []);

    // Generate unique request ID
    const generateRequestId = useCallback(() => {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    // Subscribe to a specific message type
    const subscribeToHandler = useCallback((handlerType: string, handler: (response: UnifiedWebSocketResponse) => void) => {
        if (!globalSubscriptions.has(handlerType)) {
            globalSubscriptions.set(handlerType, new Set());
        }
        globalSubscriptions.get(handlerType)!.add(handler);
        
        // Return cleanup function
        return () => {
            const handlers = globalSubscriptions.get(handlerType);
            if (handlers) {
                handlers.delete(handler);
                if (handlers.size === 0) {
                    globalSubscriptions.delete(handlerType);
                }
            }
        };
    }, []);

    // Handle incoming messages
    const handleMessage = useCallback((event: MessageEvent) => {
        try {
            const response: UnifiedWebSocketResponse = JSON.parse(event.data);
            
            // Handle system messages
            if (response.type === 'system') {
                switch (response.action) {
                    case 'connection_established':
                        const data = response.data;
                        updateGlobalState({
                            connectionId: data?.connectionId || null,
                            userId: data?.userId || null,
                            serverTime: data?.serverTime || null
                        });
                        connectionAttempts = 0; // Reset connection attempts on successful connection
                        break;
                    case 'heartbeat':
                        // Respond to heartbeat to keep connection alive
                        if (globalWS?.readyState === WebSocket.OPEN) {
                            globalWS.send(JSON.stringify({
                                type: 'system',
                                action: 'heartbeat_ack',
                                timestamp: new Date().toISOString()
                            }));
                        }
                        break;
                    case 'error':
                        console.error('WebSocket system error:', response.data);
                        updateGlobalState({ error: response.data?.message || 'System error' });
                        break;
                }
            }

            // Distribute messages to subscribed handlers
            const handlers = globalSubscriptions.get(response.type);
            
            if (handlers) {
                handlers.forEach(callback => {
                    try {
                        callback(response);
                    } catch (error) {
                        console.error(`Handler callback error for ${response.type}:`, error);
                    }
                });
            }

        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }, [updateGlobalState]);

    // Send message to WebSocket
    const sendMessage = useCallback((message: UnifiedWebSocketMessage) => {
        if (!message.requestId) {
            message.requestId = generateRequestId();
        }
        
        if (!message.timestamp) {
            message.timestamp = new Date().toISOString();
        }

        if (globalWS?.readyState === WebSocket.OPEN) {
            globalWS.send(JSON.stringify(message));
        } else {
            // Queue message for when connection is established
            globalMessageQueue.push(message);
        }
    }, [generateRequestId]);

    // Process queued messages
    const processMessageQueue = useCallback(() => {
        if (globalWS?.readyState === WebSocket.OPEN && globalMessageQueue.length > 0) {
            const queue = [...globalMessageQueue];
            globalMessageQueue = [];
            
            queue.forEach(message => {
                globalWS!.send(JSON.stringify(message));
            });
        }
    }, []);

    // Connect to WebSocket
    const connect = useCallback(async () => {
        // Prevent multiple connection attempts
        if (connectionPromise) {
            return connectionPromise;
        }

        if (globalWS?.readyState === WebSocket.OPEN || globalWS?.readyState === WebSocket.CONNECTING) {
            return;
        }

        if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
            updateGlobalState({ 
                error: 'Max connection attempts reached',
                isConnecting: false 
            });
            return;
        }

        connectionPromise = (async () => {
            try {
                const token = await getToken();
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const wsUrl = `${API_CONSTANTS.wsUrl}/api/realtime?token=${encodeURIComponent(token)}`;
                globalWS = new WebSocket(wsUrl);

                globalWS.onopen = () => {
                    updateGlobalState({ 
                        isConnected: true, 
                        isConnecting: false, 
                        error: null
                    });
                    connectionAttempts = 0;
                    processMessageQueue();
                };

                globalWS.onmessage = handleMessage;

                globalWS.onclose = (event) => {
                    updateGlobalState({ 
                        isConnected: false, 
                        isConnecting: false,
                        connectionId: null,
                        userId: null,
                        serverTime: null
                    });
                    
                    if (event.code !== 1000 && shouldReconnectRef.current) {
                        connectionAttempts++;
                        const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, connectionAttempts - 1), MAX_RECONNECT_DELAY);
                        
                        console.log(`🔌 WebSocket disconnected, attempting retry ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS} in ${delay}ms`);
                        
                        reconnectTimeoutRef = setTimeout(() => {
                            if (shouldReconnectRef.current && connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
                                connect();
                            }
                        }, delay);
                    }
                };

                globalWS.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    updateGlobalState({ 
                        error: 'Connection failed',
                        isConnecting: false 
                    });
                };

                updateGlobalState({ isConnecting: true });
                connectionAttempts++;

            } catch (error) {
                console.error('Failed to create WebSocket connection:', error);
                updateGlobalState({ 
                    error: 'Connection failed',
                    isConnecting: false 
                });
            }
        })();

        return connectionPromise;
    }, [handleMessage, processMessageQueue]);

    // Disconnect from WebSocket
    const disconnect = useCallback(() => {
        shouldReconnectRef.current = false;
        connectionAttempts = 0;

        if (reconnectTimeoutRef) {
            clearTimeout(reconnectTimeoutRef);
            reconnectTimeoutRef = null;
        }

        if (globalWS) {
            globalWS.close(1000, 'Component unmounting');
            globalWS = null;
        }

        updateGlobalState({
            isConnected: false,
            isConnecting: false,
            connectionId: null,
            userId: null,
            serverTime: null,
            error: null
        });
        
        // Clear message queue
        globalMessageQueue = [];
        
        // Don't clear subscriptions - they should persist across connections
    }, [updateGlobalState]);

    // Auto-connect when authenticated
    useEffect(() => {
        if (isAuthenticated && !isInitializedRef.current) {
            isInitializedRef.current = true;
            shouldReconnectRef.current = true;
            connect();
        } else if (!isAuthenticated && isInitializedRef.current) {
            // Disconnect when not authenticated
            isInitializedRef.current = false;
            shouldReconnectRef.current = false;
            disconnect();
        }

        return () => {
            if (!isAuthenticated) {
                shouldReconnectRef.current = false;
            }
        };
    }, [isAuthenticated, connect, disconnect]);

    // Handle app state changes (mobile only)
    useEffect(() => {
        if (Platform.OS === 'web') return;

        const handleAppStateChange = (nextAppState: string) => {
            if (nextAppState === 'active' && isAuthenticated && !globalIsConnected && shouldReconnectRef.current) {
                connect();
            }
        };

        const { AppState } = require('react-native');
        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription?.remove();
        };
    }, [isAuthenticated, connect]);

    // Handle web platform visibility changes (online/offline)
    useEffect(() => {
        if (Platform.OS !== 'web') return;

        let isPageVisible = true;
        let isWindowFocused = true;

        const handleVisibilityChange = () => {
            const wasVisible = isPageVisible;
            isPageVisible = !document.hidden;
            
            // Only update status when page becomes hidden (user leaves the tab)
            if (isAuthenticated && globalIsConnected && wasVisible && !isPageVisible) {
                sendMessage({
                    type: 'status',
                    action: 'set_offline',
                    data: { reason: 'page_hidden' },
                    timestamp: new Date().toISOString()
                });
            }
        };

        const handleWindowFocus = () => {
            const wasFocused = isWindowFocused;
            isWindowFocused = true;
            
            // Only update status when window becomes focused (user returns to the window)
            if (isAuthenticated && globalIsConnected && !wasFocused) {
                sendMessage({
                    type: 'status',
                    action: 'set_online',
                    data: { reason: 'window_focused' },
                    timestamp: new Date().toISOString()
                });
            }
        };

        const handleWindowBlur = () => {
            const wasFocused = isWindowFocused;
            isWindowFocused = false;
            
            // Only update status when window loses focus (user leaves the window)
            if (isAuthenticated && globalIsConnected && wasFocused) {
                sendMessage({
                    type: 'status',
                    action: 'set_offline',
                    data: { reason: 'window_blurred' },
                    timestamp: new Date().toISOString()
                });
            }
        };

        const handleOnline = () => {
            if (isAuthenticated && !globalIsConnected && shouldReconnectRef.current) {
                connect();
            }
        };

        const handleOffline = () => {
            if (isAuthenticated && globalIsConnected) {
                sendMessage({
                    type: 'status',
                    action: 'set_offline',
                    data: { reason: 'network_offline' },
                    timestamp: new Date().toISOString()
                });
            }
        };

        // Add event listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleWindowFocus);
        window.addEventListener('blur', handleWindowBlur);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial state
        isPageVisible = !document.hidden;
        isWindowFocused = document.hasFocus();

        return () => {
            // Remove event listeners
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleWindowFocus);
            window.removeEventListener('blur', handleWindowBlur);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [isAuthenticated, globalIsConnected, connect, sendMessage]);

    return {
        isConnected,
        isConnecting,
        error,
        connect,
        disconnect,
        sendMessage,
        subscribeToHandler,
        connectionId,
        userId,
        serverTime
    };
}; 