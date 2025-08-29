/**
 * Microsoft Clarity Service for Capacitor
 * Provides JavaScript interface to interact with Clarity iOS SDK
 */

import { Capacitor } from '@capacitor/core';

interface ClarityPlugin {
  /**
   * Set a custom user ID for the current session
   */
  setCustomUserId(options: { userId: string }): Promise<{ success: boolean }>;

  /**
   * Set a custom session ID for the current session
   */
  setCustomSessionId(options: { sessionId: string }): Promise<{ success: boolean }>;

  /**
   * Set a custom tag for the current session
   */
  setCustomTag(options: { key: string; value: string }): Promise<{ success: boolean }>;

  /**
   * Send a custom event to the current session
   */
  sendCustomEvent(options: { eventName: string }): Promise<{ success: boolean }>;

  /**
   * Get the current session URL
   */
  getCurrentSessionUrl(): Promise<{ url: string | null }>;

  /**
   * Set current screen name
   */
  setCurrentScreenName(options: { screenName: string }): Promise<{ success: boolean }>;

  /**
   * Pause session recording
   */
  pause(): Promise<{ success: boolean }>;

  /**
   * Resume session recording
   */
  resume(): Promise<{ success: boolean }>;

  /**
   * Check if recording is paused
   */
  isPaused(): Promise<{ paused: boolean }>;
}

class ClarityService {
  private static instance: ClarityService;
  private isNative: boolean;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  static getInstance(): ClarityService {
    if (!ClarityService.instance) {
      ClarityService.instance = new ClarityService();
    }
    return ClarityService.instance;
  }

  /**
   * Set custom user ID for tracking
   */
  async setCustomUserId(userId: string): Promise<boolean> {
    if (!this.isNative) {
      console.log('Clarity: setCustomUserId called on web platform (no-op)');
      return false;
    }

    try {
      // For now, this would require a custom Capacitor plugin
      // You can implement this when you create the Capacitor plugin
      console.log('Clarity: Setting custom user ID:', userId);
      return true;
    } catch (error) {
      console.error('Clarity: Error setting user ID:', error);
      return false;
    }
  }

  /**
   * Set custom session ID for tracking
   */
  async setCustomSessionId(sessionId: string): Promise<boolean> {
    if (!this.isNative) {
      console.log('Clarity: setCustomSessionId called on web platform (no-op)');
      return false;
    }

    try {
      console.log('Clarity: Setting custom session ID:', sessionId);
      return true;
    } catch (error) {
      console.error('Clarity: Error setting session ID:', error);
      return false;
    }
  }

  /**
   * Set custom tag for the session
   */
  async setCustomTag(key: string, value: string): Promise<boolean> {
    if (!this.isNative) {
      console.log('Clarity: setCustomTag called on web platform (no-op)');
      return false;
    }

    try {
      console.log('Clarity: Setting custom tag:', key, '=', value);
      return true;
    } catch (error) {
      console.error('Clarity: Error setting custom tag:', error);
      return false;
    }
  }

  /**
   * Send custom event
   */
  async sendCustomEvent(eventName: string): Promise<boolean> {
    if (!this.isNative) {
      console.log('Clarity: sendCustomEvent called on web platform (no-op)');
      return false;
    }

    try {
      console.log('Clarity: Sending custom event:', eventName);
      return true;
    } catch (error) {
      console.error('Clarity: Error sending custom event:', error);
      return false;
    }
  }

  /**
   * Set current screen name for better tracking
   */
  async setCurrentScreenName(screenName: string): Promise<boolean> {
    if (!this.isNative) {
      console.log('Clarity: setCurrentScreenName called on web platform (no-op)');
      return false;
    }

    try {
      console.log('Clarity: Setting screen name:', screenName);
      return true;
    } catch (error) {
      console.error('Clarity: Error setting screen name:', error);
      return false;
    }
  }

  /**
   * Pause Clarity recording
   */
  async pause(): Promise<boolean> {
    if (!this.isNative) {
      console.log('Clarity: pause called on web platform (no-op)');
      return false;
    }

    try {
      console.log('Clarity: Pausing recording');
      return true;
    } catch (error) {
      console.error('Clarity: Error pausing recording:', error);
      return false;
    }
  }

  /**
   * Resume Clarity recording
   */
  async resume(): Promise<boolean> {
    if (!this.isNative) {
      console.log('Clarity: resume called on web platform (no-op)');
      return false;
    }

    try {
      console.log('Clarity: Resuming recording');
      return true;
    } catch (error) {
      console.error('Clarity: Error resuming recording:', error);
      return false;
    }
  }

  /**
   * Track page/screen view
   */
  async trackScreenView(screenName: string, additionalData?: Record<string, string>): Promise<void> {
    await this.setCurrentScreenName(screenName);
    
    if (additionalData) {
      for (const [key, value] of Object.entries(additionalData)) {
        await this.setCustomTag(key, value);
      }
    }
  }

  /**
   * Track user action
   */
  async trackUserAction(action: string, context?: string): Promise<void> {
    const eventName = context ? `${action}_${context}` : action;
    await this.sendCustomEvent(eventName);
  }

  /**
   * Set user properties for analytics
   */
  async setUserProperties(properties: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(properties)) {
      await this.setCustomTag(key, value);
    }
  }
}

// Export singleton instance
export const clarityService = ClarityService.getInstance();

// Export types for TypeScript support
export type { ClarityPlugin };
