import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class PushService {
  private isInitialized = false;

  async initialize() {
    console.log('[PushService] Initializing...');
    if (this.isInitialized) {
      console.log('[PushService] Already initialized.');
      return;
    }
    
    if (Capacitor.getPlatform() === 'web') {
      console.warn('[PushService] Push notifications not implemented for web.');
      return;
    }

    console.log('[PushService] Requesting permissions...');
    const permStatus = await PushNotifications.requestPermissions();
    
    if (permStatus.receive !== 'granted') {
      console.error('[PushService] Permission not granted for push notifications.');
      return;
    }
    
    console.log('[PushService] Permissions granted. Registering for push notifications...');
    await PushNotifications.register();
    
    PushNotifications.addListener('registration', async (token) => {
      console.log(`[PushService] Registration success, token: ${token.value.substring(0, 20)}...`);
      await this.saveToken(token.value);
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('[PushService] Registration error:', error);
    });
    
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[PushService] Received:', notification);
    });
    
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('[PushService] Action:', notification);
    });
    
    this.isInitialized = true;
    console.log('[PushService] Initialization complete.');
  }

  private async saveToken(token: string) {
    const platform = Capacitor.getPlatform();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id;

    if (!userId) {
      console.error('[PushService] User not found in local storage.');
      return;
    }

    console.log(`[PushService] Saving token to Supabase Edge Function...`);
    
    try {
      const { error } = await supabase.functions.invoke('save-token', {
        body: { token, userId, platform },
      });

      if (error) {
        throw error;
      }

      console.log('[PushService] Token saved successfully to Supabase.');
    } catch (error) {
      console.error('[PushService] Failed to save token:', error);
    }
  }

  async getDelivered() {
    return PushNotifications.getDeliveredNotifications();
  }

  async clearDelivered() {
    await PushNotifications.removeAllDeliveredNotifications();
  }
}

export const pushService = new PushService();