/**
 * 🔔 Sistema de Notificaciones - Tipos e Interfaces
 * 
 * Este archivo define todas las interfaces que usará el sistema de notificaciones.
 * Replica exactamente la estructura de tu tabla de Supabase.
 */

// 🗄️ Interfaz que replica tu tabla de Supabase exactamente
export interface DatabaseNotification {
  id: number;                                    // serial primary key
  user_id: string;                              // uuid foreign key
  type: string;                                 // varchar(50) not null
  message: string;                              // text not null  
  send_date: string;                           // timestamp default now()
  status: 'pendiente' | 'leido' | 'enviado';   // varchar(10) default 'pendiente'
  title: string;                               // varchar(200)
  is_read: boolean;                            // boolean default false
  data: Record<string, any>;                   // jsonb default '{}'
}

// 🎨 Tipos para el sistema visual
export type NotificationType = 
  | 'success' 
  | 'error' 
  | 'info' 
  | 'message' 
  | 'booking' 
  | 'trip' 
  | 'warning'
  | 'confirmation'
  | 'reminder';

// 🎯 Configuración para mostrar notificaciones visuales
export interface NotificationDisplayConfig {
  type: NotificationType;
  title: string;
  message: string;
  autoClose?: number | false;
  persistent?: boolean;
  onClick?: () => void;
  priority?: 'low' | 'medium' | 'high';
}

// 📋 Datos para crear nuevas notificaciones
export interface CreateNotificationData {
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high';
}

// 🎭 Datos simulados específicos para CupoApp
export interface ChatNotificationData {
  chatId: string;
  senderId: string;
  senderName: string;
  messagePreview: string;
}

export interface BookingNotificationData {
  bookingId: string;
  tripId: string;
  passengerName: string;
  seats: number;
  destination: string;
}

export interface TripNotificationData {
  tripId: string;
  driverName?: string;
  destination: string;
  changeType?: 'time' | 'location' | 'price' | 'cancelled';
  oldValue?: string;
  newValue?: string;
}

// 📊 Estado del sistema de notificaciones
export interface NotificationState {
  notifications: DatabaseNotification[];
  unreadCount: number;
  loading: boolean;
  error?: string;
}

// 🔄 Eventos del sistema
export type NotificationEvent = 
  | { type: 'NOTIFICATION_RECEIVED'; payload: DatabaseNotification }
  | { type: 'NOTIFICATION_READ'; payload: { id: number } }
  | { type: 'NOTIFICATIONS_LOADED'; payload: DatabaseNotification[] }
  | { type: 'UNREAD_COUNT_UPDATED'; payload: { count: number } }
  | { type: 'ERROR'; payload: { message: string } };

// 🎮 Configuración del hook
export interface UseNotificationsConfig {
  autoRefresh?: boolean;
  refreshInterval?: number;
  maxNotifications?: number;
  enableRealTime?: boolean;
}

// 📱 Props para componentes de notificación
export interface NotificationBadgeProps {
  count: number;
  max?: number;
  showZero?: boolean;
  onClick?: () => void;
}

export interface NotificationCenterProps {
  notifications: DatabaseNotification[];
  onNotificationClick: (notification: DatabaseNotification) => void;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  loading?: boolean;
}

// 🚨 Configuración de alertas por tipo - DISEÑO PROFESIONAL ✨
export const NOTIFICATION_CONFIGS = {
  message: {
    color: 'blue',
    emoji: '💬',
    autoClose: 8000,
    priority: 'high' as const,
    persistent: true,
    borderColor: 'rgba(34, 139, 230, 0.4)',
    shadowColor: 'rgba(34, 139, 230, 0.15)',
    urgentBorderColor: 'rgba(34, 139, 230, 0.8)',
    urgentShadowColor: 'rgba(34, 139, 230, 0.3)'
  },
  booking: {
    color: 'orange', 
    emoji: '🎫',
    autoClose: 10000,
    priority: 'high' as const,
    persistent: true,
    borderColor: 'rgba(255, 146, 43, 0.4)',
    shadowColor: 'rgba(255, 146, 43, 0.15)',
    urgentBorderColor: 'rgba(255, 146, 43, 0.8)',
    urgentShadowColor: 'rgba(255, 146, 43, 0.3)'
  },
  trip: {
    color: 'grape',
    emoji: '🚗', 
    autoClose: 8000,
    priority: 'medium' as const,
    persistent: true,
    borderColor: 'rgba(151, 117, 250, 0.4)',
    shadowColor: 'rgba(151, 117, 250, 0.15)',
    urgentBorderColor: 'rgba(151, 117, 250, 0.8)',
    urgentShadowColor: 'rgba(151, 117, 250, 0.3)'
  },
  confirmation: {
    color: 'green',
    emoji: '✅',
    autoClose: 6000,
    priority: 'medium' as const,
    persistent: false,
    borderColor: 'rgba(0, 230, 118, 0.4)',
    shadowColor: 'rgba(0, 230, 118, 0.15)',
    urgentBorderColor: 'rgba(0, 230, 118, 0.8)',
    urgentShadowColor: 'rgba(0, 230, 118, 0.3)'
  },
  warning: {
    color: 'yellow',
    emoji: '⚠️',
    autoClose: 12000,
    priority: 'high' as const,
    persistent: true,
    borderColor: 'rgba(255, 212, 59, 0.4)',
    shadowColor: 'rgba(255, 212, 59, 0.15)',
    urgentBorderColor: 'rgba(255, 212, 59, 0.8)',
    urgentShadowColor: 'rgba(255, 212, 59, 0.3)'
  },
  error: {
    color: 'red',
    emoji: '❌',
    autoClose: 8000,
    priority: 'high' as const,
    persistent: true,
    borderColor: 'rgba(250, 82, 82, 0.4)',
    shadowColor: 'rgba(250, 82, 82, 0.15)',
    urgentBorderColor: 'rgba(250, 82, 82, 0.8)',
    urgentShadowColor: 'rgba(250, 82, 82, 0.3)'
  },
  success: {
    color: 'green',
    emoji: '✅',
    autoClose: 4000,
    priority: 'low' as const,
    persistent: false,
    borderColor: 'rgba(0, 230, 118, 0.4)',
    shadowColor: 'rgba(0, 230, 118, 0.15)',
    urgentBorderColor: 'rgba(0, 230, 118, 0.8)',
    urgentShadowColor: 'rgba(0, 230, 118, 0.3)'
  },
  info: {
    color: 'blue',
    emoji: 'ℹ️',
    autoClose: 5000,
    priority: 'low' as const,
    persistent: false,
    borderColor: 'rgba(34, 139, 230, 0.4)',
    shadowColor: 'rgba(34, 139, 230, 0.15)',
    urgentBorderColor: 'rgba(34, 139, 230, 0.8)',
    urgentShadowColor: 'rgba(34, 139, 230, 0.3)'
  },
  reminder: {
    color: 'purple',
    emoji: '🔔',
    autoClose: 8000,
    priority: 'medium' as const,
    persistent: true,
    borderColor: 'rgba(124, 58, 237, 0.4)',
    shadowColor: 'rgba(124, 58, 237, 0.15)',
    urgentBorderColor: 'rgba(124, 58, 237, 0.8)',
    urgentShadowColor: 'rgba(124, 58, 237, 0.3)'
  }
} as const;