import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { pushService } from './pushService';

export interface PushNotificationStatus {
  isInitialized: boolean;
  hasPermission: boolean;
  error: string | null;
}

export const usePushNotifications = () => {
  const [status, setStatus] = useState<PushNotificationStatus>({
    isInitialized: false,
    hasPermission: false,
    error: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const initialize = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      console.log('[HOOK] Not a native platform. Skipping push initialization.');
      return;
    }

    setIsLoading(true);
    setStatus(prev => ({ ...prev, error: null }));
    console.log('🚀 [HOOK] Initializing push notifications...');

    try {
      const token = await pushService.initialize();
      console.log('✅ [HOOK] Push notifications initialization process completed.');

      if (token) {
        console.log(`💾 [HOOK] A token was received, attempting to save it... Token: ${token}`);
        await pushService.saveToken(token);
        console.log('✅ [HOOK] Token saved successfully.');
        setStatus({
          isInitialized: true,
          hasPermission: true,
          error: null,
        });
      } else {
        console.log('🤔 [HOOK] No token was received from the initialization process.');
        // This can happen if already initialized or on web.
        // We can consider the initialization "complete" but without a new token.
        setStatus(prev => ({
            ...prev,
            isInitialized: true,
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ [HOOK] Error initializing push notifications:', error);
      setStatus({
        isInitialized: false,
        hasPermission: false,
        error: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Auto-initialize on mount for native platforms
    if (Capacitor.isNativePlatform() && !status.isInitialized) {
        console.log('🚀 [HOOK] Auto-initializing push notifications on mount...');
        initialize();
    }
  }, [initialize, status.isInitialized]);

  return {
    status,
    isLoading,
    initialize,
  };
};

export type UsePushNotificationsReturn = ReturnType<typeof usePushNotifications>;