// providers/OnlineStatusProvider.tsx
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { useUnifiedWebSocket } from '../hooks/websocket/useWebSocket';
import { useAuth } from './AuthProvider';

// Import NetInfo conditionally for mobile platforms only
let NetInfo: any = null;
if (Platform.OS !== 'web') {
  try {
    NetInfo = require('@react-native-community/netinfo').default;
  } catch (error) {
    console.warn('NetInfo not available:', error);
  }
}

interface OnlineStatusContextType {
  isOnline: boolean;
  isConnected: boolean;
  networkStatus: 'online' | 'offline' | 'unknown';
  appState: AppStateStatus;
  updateOnlineStatus: (status: boolean, reason?: string) => void;
  forceStatusUpdate: () => void;
  getStatusInfo: () => StatusInfo;
}

interface StatusInfo {
  isOnline: boolean;
  networkStatus: string;
  appState: AppStateStatus;
  platform: string;
  lastUpdate: string;
  wsConnected: boolean;
}

const OnlineStatusContext = createContext<OnlineStatusContextType | undefined>(undefined);

export const useOnlineStatus = () => {
  const context = useContext(OnlineStatusContext);
  if (!context) {
    throw new Error('useOnlineStatus must be used within an OnlineStatusProvider');
  }
  return context;
};

const OnlineStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'unknown'>('unknown');
  const [appState, setAppState] = useState<AppStateStatus>('unknown');
  const { isAuthenticated } = useAuth();
  const { sendMessage, isConnected } = useUnifiedWebSocket(isAuthenticated);
  
  // Refs for state management
  const lastStatusRef = useRef<boolean>(true);
  const isUpdatingRef = useRef<boolean>(false);
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateRef = useRef<AppStateStatus>('unknown');
  const backgroundTimeRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const lastUpdateRef = useRef<string>('');
  const networkUnsubscribeRef = useRef<(() => void) | null>(null);

  // Platform-specific configuration
  const DEBOUNCE_TIME = Platform.OS === 'web' ? 300 : 600;
  const BACKGROUND_THRESHOLD = Platform.OS === 'ios' ? 3000 : 5000;

  // Initialize platform-specific state
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web: Use document visibility and navigator.onLine
      setNetworkStatus(navigator.onLine ? 'online' : 'offline');
      setAppState(!document.hidden ? 'active' : 'background');
      appStateRef.current = !document.hidden ? 'active' : 'background';
    } else {
      // Mobile: Use AppState
      const currentState = AppState.currentState;
      setAppState(currentState);
      appStateRef.current = currentState;
      
      // Initialize network status for mobile
      if (NetInfo) {
        NetInfo.fetch().then((state: any) => {
          setNetworkStatus(state.isConnected ? 'online' : 'offline');
        }).catch(() => {
          setNetworkStatus('unknown');
        });
      }
    }
  }, []);

  const updateOnlineStatus = useCallback((status: boolean, reason?: string) => {
    if (!mountedRef.current) return;

    // Prevent redundant updates with enhanced checking
    if (lastStatusRef.current === status || isUpdatingRef.current) {
      // console.log('🚫 Status update skipped:', { 
      //   current: lastStatusRef.current, 
      //   new: status, 
      //   updating: isUpdatingRef.current,
      //   reason 
      // });
      return;
    }

    // Clear any pending timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce the update with platform-specific timing
    updateTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) return;

      isUpdatingRef.current = true;
      lastStatusRef.current = status;
      setIsOnline(status);
      lastUpdateRef.current = new Date().toISOString();

      // console.log('📱 Updating status:', { 
      //   status, 
      //   reason, 
      //   platform: Platform.OS,
      //   appState: appStateRef.current,
      //   networkStatus: networkStatus 
      // });

      // Send status update via WebSocket
      if (isConnected && isAuthenticated) {
        const action = status ? 'set_online' : 'set_offline';
        const finalReason = reason || (Platform.OS === 'web' ? 'web_change' : 'mobile_change');
        
        sendMessage({
          type: 'status',
          action,
          data: { 
            status: status ? 'online' : 'offline', 
            reason: finalReason,
            platform: Platform.OS,
            appState: appStateRef.current,
            networkConnected: networkStatus === 'online',
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });
      }

      // Reset the updating flag
      setTimeout(() => {
        if (mountedRef.current) {
          isUpdatingRef.current = false;
        }
      }, 200);
    }, DEBOUNCE_TIME);
  }, [isConnected, isAuthenticated, sendMessage, networkStatus, DEBOUNCE_TIME]);

  // Force status update with immediate execution
  const forceStatusUpdate = useCallback(() => {
    if (!mountedRef.current || !isConnected || !isAuthenticated) return;

    // Clear any pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    const currentAppState = Platform.OS === 'web' ? 
      (!document.hidden ? 'active' : 'background') : 
      AppState.currentState;
    
    const currentNetworkStatus = Platform.OS === 'web' ? 
      (navigator.onLine ? 'online' : 'offline') : 
      networkStatus;

    const shouldBeOnline = currentAppState === 'active' && currentNetworkStatus === 'online';

    // console.log('🔄 Force status update:', { 
    //   appState: currentAppState, 
    //   networkStatus: currentNetworkStatus, 
    //   shouldBeOnline,
    //   platform: Platform.OS
    // });

    // Update immediately without debounce
    isUpdatingRef.current = true;
    lastStatusRef.current = shouldBeOnline;
    setIsOnline(shouldBeOnline);
    lastUpdateRef.current = new Date().toISOString();

    sendMessage({
      type: 'status',
      action: shouldBeOnline ? 'set_online' : 'set_offline',
      data: { 
        status: shouldBeOnline ? 'online' : 'offline', 
        reason: 'force_update',
        platform: Platform.OS,
        appState: currentAppState,
        networkConnected: currentNetworkStatus === 'online',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

    setTimeout(() => {
      if (mountedRef.current) {
        isUpdatingRef.current = false;
      }
    }, 100);
  }, [isConnected, isAuthenticated, sendMessage, networkStatus]);

  // Get status information for debugging
  const getStatusInfo = useCallback((): StatusInfo => ({
    isOnline,
    networkStatus,
    appState,
    platform: Platform.OS,
    lastUpdate: lastUpdateRef.current,
    wsConnected: isConnected
  }), [isOnline, networkStatus, appState, isConnected]);

  // Handle Mobile App State Changes
  useEffect(() => {
    if (!isAuthenticated || Platform.OS === 'web') return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // console.log('📱 App state changed:', { 
      //   from: appStateRef.current, 
      //   to: nextAppState,
      //   platform: Platform.OS 
      // });

      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;
      setAppState(nextAppState);

      // Handle state transitions with platform-specific logic
      if (nextAppState === 'active') {
        // App came to foreground
        if (previousState === 'background' || previousState === 'inactive') {
          const backgroundTime = backgroundTimeRef.current;
          const timeInBackground = backgroundTime ? Date.now() - backgroundTime : 0;
          
          // console.log('📱 App became active:', { 
          //   timeInBackground, 
          //   threshold: BACKGROUND_THRESHOLD,
          //   platform: Platform.OS 
          // });

          // Update status based on time in background
          if (timeInBackground > BACKGROUND_THRESHOLD) {
            setTimeout(() => {
              updateOnlineStatus(true, 'app_foreground_long');
            }, 800); // Longer delay for stability
          } else {
            setTimeout(() => {
              updateOnlineStatus(true, 'app_foreground_quick');
            }, 300);
          }
        }
        backgroundTimeRef.current = null;
      } 
      else if (nextAppState === 'background') {
        // App went to background
        backgroundTimeRef.current = Date.now();
        updateOnlineStatus(false, 'app_background');
      } 
      else if (nextAppState === 'inactive') {
        // Handle inactive state (iOS specific)
        if (Platform.OS === 'ios') {
          // On iOS, wait before setting offline for inactive state
          setTimeout(() => {
            if (AppState.currentState === 'inactive' && mountedRef.current) {
              updateOnlineStatus(false, 'app_inactive_ios');
            }
          }, 1500);
        } else {
          // On Android, inactive might be brief
          setTimeout(() => {
            if (AppState.currentState === 'inactive' && mountedRef.current) {
              updateOnlineStatus(false, 'app_inactive_android');
            }
          }, 500);
        }
      }
    };

    // Subscribe to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Set initial status
    const currentState = AppState.currentState;
    if (currentState === 'active') {
      setTimeout(() => {
        updateOnlineStatus(true, 'app_init_active');
      }, 500);
    }

    return () => subscription?.remove();
  }, [isAuthenticated, updateOnlineStatus, BACKGROUND_THRESHOLD]);

  // Handle Network Status Changes
  useEffect(() => {
    if (!isAuthenticated) return;

    if (Platform.OS === 'web') {
      // Web Network Handling
      const handleOnline = () => {
        // console.log('🌐 Web network online');
        setNetworkStatus('online');
        if (!document.hidden) {
          updateOnlineStatus(true, 'network_online_web');
        }
      };

      const handleOffline = () => {
        // console.log('🌐 Web network offline');
        setNetworkStatus('offline');
        updateOnlineStatus(false, 'network_offline_web');
      };

      const handleVisibilityChange = () => {
        const isVisible = !document.hidden;
        const newAppState = isVisible ? 'active' : 'background';
        
        // console.log('🌐 Web visibility changed:', { 
        //   isVisible, 
        //   appState: newAppState,
        //   networkOnline: navigator.onLine 
        // });
        
        appStateRef.current = newAppState;
        setAppState(newAppState);
        
        if (navigator.onLine) {
          updateOnlineStatus(isVisible, 'visibility_change_web');
        }
      };

      const handleFocus = () => {
        // console.log('🌐 Web window focus');
        if (navigator.onLine && !document.hidden) {
          updateOnlineStatus(true, 'window_focus_web');
        }
      };

      const handleBlur = () => {
        // console.log('🌐 Web window blur');
        updateOnlineStatus(false, 'window_blur_web');
      };

      // Set initial web status
      const initialOnline = !document.hidden && navigator.onLine;
      updateOnlineStatus(initialOnline, 'web_init');

      // Add web event listeners
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
      window.addEventListener('blur', handleBlur);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('blur', handleBlur);
      };
    } else {
      // Mobile Network Handling
      if (NetInfo) {
        const unsubscribe = NetInfo.addEventListener((state: any) => {
          const newNetworkStatus = state.isConnected ? 'online' : 'offline';
          
          // console.log('📶 Mobile network status changed:', { 
          //   isConnected: state.isConnected, 
          //   type: state.type,
          //   status: newNetworkStatus,
          //   platform: Platform.OS
          // });

          setNetworkStatus(newNetworkStatus);

          // Update online status based on network and app state
          const currentAppState = AppState.currentState;
          const shouldBeOnline = state.isConnected && currentAppState === 'active';
          
          updateOnlineStatus(shouldBeOnline, `network_change_${Platform.OS}`);
        });

        networkUnsubscribeRef.current = unsubscribe;
        
        return () => {
          if (networkUnsubscribeRef.current) {
            networkUnsubscribeRef.current();
            networkUnsubscribeRef.current = null;
          }
        };
      }
    }
  }, [isAuthenticated, updateOnlineStatus]);

  // Auto-update when WebSocket connects/reconnects
  useEffect(() => {
    if (isConnected && isAuthenticated && mountedRef.current) {
      // console.log('🔗 WebSocket connected, scheduling status update');
      
      // Give extra time for connection stability
      setTimeout(() => {
        if (mountedRef.current && isConnected) {
          const currentAppState = Platform.OS === 'web' ? 
            (!document.hidden ? 'active' : 'background') : 
            AppState.currentState;
          
          const currentNetworkStatus = Platform.OS === 'web' ? 
            (navigator.onLine ? 'online' : 'offline') : 
            networkStatus;
          
          const shouldBeOnline = currentAppState === 'active' && currentNetworkStatus === 'online';
          
          // console.log('🔗 WebSocket auto-update status:', { 
          //   appState: currentAppState, 
          //   networkStatus: currentNetworkStatus, 
          //   shouldBeOnline,
          //   platform: Platform.OS
          // });

          // Only update if status is different
          if (shouldBeOnline !== isOnline) {
            updateOnlineStatus(shouldBeOnline, 'websocket_connected');
          }
        }
      }, 2000); // Longer delay for stability
    }
  }, [isConnected, isAuthenticated, updateOnlineStatus, networkStatus, isOnline]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (networkUnsubscribeRef.current) {
        networkUnsubscribeRef.current();
      }
    };
  }, []);

  // Periodic status sync (for reliability)
  useEffect(() => {
    if (!isAuthenticated || !isConnected) return;

    const interval = setInterval(() => {
      if (mountedRef.current && isConnected) {
        // Only sync if we haven't updated recently
        const lastUpdate = lastUpdateRef.current;
        const timeSinceUpdate = lastUpdate ? 
          Date.now() - new Date(lastUpdate).getTime() : 
          Infinity;

        if (timeSinceUpdate > 30000) { // 30 seconds
          // console.log('⏰ Periodic status sync');
          forceStatusUpdate();
        }
      }
    }, 45000); // Every 45 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, isConnected, forceStatusUpdate]);

  const contextValue: OnlineStatusContextType = {
    isOnline,
    isConnected,
    networkStatus,
    appState,
    updateOnlineStatus,
    forceStatusUpdate,
    getStatusInfo
  };

  return (
    <OnlineStatusContext.Provider value={contextValue}>
      {children}
    </OnlineStatusContext.Provider>
  );
};

export default OnlineStatusProvider