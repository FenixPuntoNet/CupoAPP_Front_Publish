// /**
//  * Push Notifications Module - Type Definitions
//  * Android and iOS compatible notification types and interfaces
//  */

// export interface PushNotificationPayload {
//   title: string;
//   body: string;
//   id?: string;
//   data?: Record<string, any>;
//   badge?: number;
//   sound?: string;
//   smallIcon?: string;
//   largeIcon?: string;
//   color?: string;
//   actionTypeId?: string;
//   channelId?: string;
// }

// export interface PushNotificationAction {
//   id: string;
//   title: string;
//   foreground?: boolean;
//   authenticationRequired?: boolean;
// }

// export interface PushNotificationActionPerformed {
//   notification: PushNotificationPayload;
//   actionId: string;
// }

// export interface PushNotificationResponse {
//   success: boolean;
//   error?: string;
//   deviceToken?: string;
// }

// export interface NotificationEvent {
//   type: 'delivered' | 'tap' | 'action' | 'failed';
//   notification: PushNotificationPayload;
//   actionId?: string;
//   timestamp: number;
// }

// export interface PushNotificationListener {
//   onNotificationReceived: (notification: PushNotificationPayload) => void;
//   onNotificationTapped: (notification: PushNotificationPayload) => void;
//   onActionPerformed: (action: PushNotificationActionPerformed) => void;
// }

// export enum NotificationChannel {
//   DEFAULT = 'push_default',
//   CHAT = 'push_chat',
//   RIDES = 'push_rides',
//   PROMOTIONS = 'push_promotions',
//   SYSTEM = 'push_system',
// }
