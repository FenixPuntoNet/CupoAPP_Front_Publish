/**
 * Push Notifications Module - Index
 * Central export point for all push notification utilities
 */

// export { pushService } from './pushService';
// export { usePushNotifications } from './usePushNotifications';
// export * from './types';

/**
 * Quick start guide:
 *
 * 1. Initialize in your app root or layout:
 *    import { usePushNotifications } from '@/modules/push';
 *
 *    function App() {
 *      const { isReady } = usePushNotifications({
 *        onNotificationReceived: (notif) => console.log('Received:', notif),
 *        onNotificationTapped: (notif) => console.log('Tapped:', notif),
 *      });
 *
 *      return isReady ? <YourApp /> : <Loading />;
 *    }
 *
 * 2. Use in any component:
 *    const { deleteAllNotifications } = usePushNotifications();
 *
 * 3. Get notification history:
 *    const history = usePushNotifications().getNotificationHistory();
 */
