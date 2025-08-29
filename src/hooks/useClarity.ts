import { useEffect, useCallback } from 'react';
import { useLocation } from '@tanstack/react-router';
import { clarityService } from '../services/clarity';

interface UseClarityOptions {
  /**
   * Whether to automatically track page views
   */
  autoTrackPageViews?: boolean;
  
  /**
   * User ID for session tracking
   */
  userId?: string;
  
  /**
   * Additional user properties
   */
  userProperties?: Record<string, string>;
}

/**
 * Hook for using Microsoft Clarity analytics in React components
 */
export const useClarity = (options: UseClarityOptions = {}) => {
  const {
    autoTrackPageViews = true,
    userId,
    userProperties
  } = options;

  const location = useLocation();

  // Set user ID when provided
  useEffect(() => {
    if (userId) {
      clarityService.setCustomUserId(userId);
    }
  }, [userId]);

  // Set user properties when provided
  useEffect(() => {
    if (userProperties) {
      clarityService.setUserProperties(userProperties);
    }
  }, [userProperties]);

  // Auto track page views
  useEffect(() => {
    if (autoTrackPageViews) {
      const pathname = location.pathname;
      const screenName = pathname === '/' ? 'Home' : pathname.replace(/^\//, '').replace(/\//g, '_');
      clarityService.trackScreenView(screenName);
    }
  }, [location.pathname, autoTrackPageViews]);

  // Utility functions to use in components
  const trackEvent = useCallback((eventName: string, context?: string) => {
    return clarityService.trackUserAction(eventName, context);
  }, []);

  const trackScreenView = useCallback((screenName: string, additionalData?: Record<string, string>) => {
    return clarityService.trackScreenView(screenName, additionalData);
  }, []);

  const setCustomTag = useCallback((key: string, value: string) => {
    return clarityService.setCustomTag(key, value);
  }, []);

  const sendCustomEvent = useCallback((eventName: string) => {
    return clarityService.sendCustomEvent(eventName);
  }, []);

  const pauseRecording = useCallback(() => {
    return clarityService.pause();
  }, []);

  const resumeRecording = useCallback(() => {
    return clarityService.resume();
  }, []);

  return {
    // Tracking functions
    trackEvent,
    trackScreenView,
    setCustomTag,
    sendCustomEvent,
    
    // Recording controls
    pauseRecording,
    resumeRecording,
    
    // Clarity service instance
    clarityService
  };
};

/**
 * Hook for tracking user interactions with UI elements
 */
export const useClarityTracking = () => {
  const { trackEvent } = useClarity({ autoTrackPageViews: false });

  // Track button clicks
  const trackButtonClick = useCallback((buttonId: string, additionalContext?: string) => {
    trackEvent('button_click', additionalContext ? `${buttonId}_${additionalContext}` : buttonId);
  }, [trackEvent]);

  // Track form submissions
  const trackFormSubmit = useCallback((formId: string, success: boolean = true) => {
    trackEvent('form_submit', `${formId}_${success ? 'success' : 'error'}`);
  }, [trackEvent]);

  // Track navigation events
  const trackNavigation = useCallback((destination: string, source?: string) => {
    trackEvent('navigation', source ? `${source}_to_${destination}` : destination);
  }, [trackEvent]);

  // Track search events
  const trackSearch = useCallback((searchTerm: string, resultsCount?: number) => {
    trackEvent('search', `${searchTerm}_${resultsCount || 0}_results`);
  }, [trackEvent]);

  // Track user preferences
  const trackUserPreference = useCallback((preference: string, value: string) => {
    trackEvent('user_preference', `${preference}_${value}`);
  }, [trackEvent]);

  return {
    trackButtonClick,
    trackFormSubmit,
    trackNavigation,
    trackSearch,
    trackUserPreference
  };
};
