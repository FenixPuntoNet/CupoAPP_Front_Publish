/**
 * Capacitor Configuration for Push Notifications
 * Add this to your capacitor.config.ts
 */

/**
 * Example capacitor.config.ts setup:
 *
 * import { CapacitorConfig } from '@capacitor/cli';
 *
 * const config: CapacitorConfig = {
 *   appId: 'com.example.cupo',
 *   appName: 'Cupo',
 *   webDir: 'dist',
 *   server: {
 *     androidScheme: 'https'
 *   },
 *   plugins: {
 *     PushNotifications: {
 *       presentationOptions: ['badge', 'sound', 'alert'],
 *     }
 *   }
 * };
 *
 * export default config;
 */

/**
 * Android Setup (google-services.json)
 *
 * 1. Add google-services.json to android/app/
 * 2. Ensure build.gradle has Firebase dependencies:
 *
 *    buildscript {
 *      dependencies {
 *        classpath 'com.google.gms:google-services:4.3.15'
 *      }
 *    }
 *
 * 3. In app/build.gradle:
 *    apply plugin: 'com.google.gms.google-services'
 *    dependencies {
 *      implementation 'com.google.firebase:firebase-messaging'
 *    }
 */

/**
 * iOS Setup (APNs Certificate)
 *
 * 1. Create APNs certificates in Apple Developer portal
 * 2. Upload to Firebase Console
 * 3. Build and run on Xcode:
 *    npx cap build ios
 *
 * In Xcode:
 * - Project > Capabilities > Add "Push Notifications"
 * - Product > Scheme > Edit Scheme > Run > Environment Variables
 *   Add: FIREBASE_IOS_KEYSTORE_PASSWORD (if needed)
 */

export const PUSH_NOTIFICATION_CONFIG = {
  // Android specific settings
  android: {
    defaultChannel: 'push_default',
    smallIcon: 'ic_stat_ic_notification',
    largeIcon: 'icon',
    color: '#00ff9d',
  },

  // iOS specific settings
  ios: {
    presentationOptions: ['badge', 'sound', 'alert'],
  },

  // General settings
  channels: [
    {
      id: 'push_default',
      name: 'General',
      importance: 4,
      sound: 'default',
      vibration: true,
    },
    {
      id: 'push_chat',
      name: 'Messages',
      importance: 4,
      sound: 'default',
      vibration: true,
    },
    {
      id: 'push_rides',
      name: 'Rides',
      importance: 4,
      sound: 'default',
      vibration: true,
    },
  ],
};
