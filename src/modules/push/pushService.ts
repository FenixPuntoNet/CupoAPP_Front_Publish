import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token } from '@capacitor/push-notifications';
import { supabase } from '../../supabaseClient';

class PushService {
  private isInitialized = false;

  async initialize(): Promise<string | null> {
    if (this.isInitialized || Capacitor.getPlatform() === 'web') {
      return null;
    }

    try {
      await this.requestPermissions();
      const token = await this.registerForNotifications();
      this.isInitialized = true;
      return token;
    } catch (error) {
      console.error('[PushService] Initialization failed:', error);
      return null;
    }
  }

  private async requestPermissions(): Promise<void> {
    const result = await PushNotifications.requestPermissions();
    if (result.receive !== 'granted') {
      throw new Error('Push notification permissions were not granted.');
    }
  }

  private registerForNotifications(): Promise<string> {
    console.log('[PushService] Setting up listeners for push registration...');
    return new Promise(async (resolve, reject) => {
      try {
        PushNotifications.addListener('registration', (token: Token) => {
          console.log('[PushService] Received registration event. Full token object:', JSON.stringify(token));
          if (token && token.value) {
            console.log('[PushService] Push registration success, token:', token.value);
            resolve(token.value);
          } else {
            console.error('[PushService] Registration event fired with invalid token:', token);
            reject(new Error('Registration event fired with invalid token'));
          }
        });

        PushNotifications.addListener('registrationError', (error: any) => {
          console.error('[PushService] Push registration error event:', error);
          reject(error);
        });

        console.log('[PushService] Calling PushNotifications.register()...');
        await PushNotifications.register();
        console.log('[PushService] PushNotifications.register() call finished.');
      } catch (e) {
        console.error('[PushService] Error inside registerForNotifications promise constructor:', e);
        reject(e);
      }
    });
  }

  public async saveToken(token: string): Promise<void> {
    const platform = Capacitor.getPlatform();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.warn('[PushService] User not logged in, cannot save token.');
        return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('save-token', {
        body: { 
            token, 
            userId: user.id, 
            platform 
        },
      });

      if (error) throw error;

      console.log('[PushService] Token saved successfully:', data);
    } catch (error) {
      console.error('[PushService] Error saving token:', error);
    }
  }

  async deleteToken(token: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn('[PushService] User not logged in, cannot delete token.');
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('delete-token', {
        body: { token, userId: user.id },
      });

      if (error) throw error;

      console.log('[PushService] Token deleted successfully.');
    } catch (error) {
      console.error('[PushService] Error deleting token:', error);
    }
  }
}

export const pushService = new PushService();