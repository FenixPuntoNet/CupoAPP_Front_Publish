/**
 * 📊 Servicio de Datos de Notificaciones - Producción
 * 
 * Conectado al backend real de cupo.site
 * Sistema de autenticación JWT integrado
 */

import { 
  DatabaseNotification, 
  CreateNotificationData
} from '../types/notifications';
import { apiRequest } from '../config/api';
import { NOTIFICATION_CONFIG } from '../config/notifications';
import { triggerPushFromInternalNotification } from './notificationIntegration';

// 📡 Subscriptores para tiempo real
type SubscriptionCallback = (notification: DatabaseNotification) => void;
const subscribers: SubscriptionCallback[] = [];

// 🔄 Polling para tiempo real
let pollingInterval: NodeJS.Timeout | null = null;
// let lastKnownCount = 0;
let isPolling = false; // Evitar polling concurrente

/**
 * 📊 Servicio de Datos de Notificaciones - Producción
 * 
 * Conecta con la API real de notificaciones en cupo.site
 */
class NotificationDataService {
  private static instance: NotificationDataService;

  static getInstance(): NotificationDataService {
    if (!NotificationDataService.instance) {
      NotificationDataService.instance = new NotificationDataService();
    }
    return NotificationDataService.instance;
  }

  // 📥 Obtener todas las notificaciones del usuario actual
  async getUserNotifications(limit: number = 50): Promise<DatabaseNotification[]> {
    try {
      // ✨ DESHABILITAR CACHE para datos en tiempo real
      const cacheBuster = Date.now();
      const response = await apiRequest(`/notifications?limit=${limit}&page=1&t=${cacheBuster}`);
      
      if (response && response.notifications) {
        return response.notifications;
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error fetching notifications:', error);
      return [];
    }
  }

  // 📬 Obtener solo las notificaciones no leídas
  async getUnreadNotifications(): Promise<DatabaseNotification[]> {
    try {
      const response = await apiRequest('/notifications?unread=true');
      
      if (response && response.notifications) {
        return response.notifications;
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error fetching unread notifications:', error);
      return [];
    }
  }

  // 📊 Contar notificaciones no leídas
  // async getUnreadCount(): Promise<number> {
  //   try {
  //     // ✨ DESHABILITAR CACHE para conteo en tiempo real
  //     const cacheBuster = Date.now();
  //     const response = await apiRequest(`/notifications/stats?t=${cacheBuster}`);
      
  //     if (response && typeof response.unread_count === 'number') {
  //       return response.unread_count;
  //     }
      
  //     return 0;
      
  //   } catch (error) {
  //     console.error('❌ [NOTIFICATIONS] Error fetching unread count:', error);
  //     return 0;
  //   }
  // }

  // ✅ Marcar notificación como leída
  async markAsRead(notificationId: number): Promise<boolean> {
    try {
      const response = await apiRequest('/notifications/read', {
        method: 'PUT',
        body: JSON.stringify({
          notification_ids: [notificationId]
        })
      });
      
      if (response && response.success) {
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error(`❌ [NOTIFICATIONS] Error marking notification ${notificationId} as read:`, error);
      return false;
    }
  }

  // ❌ Marcar notificación como no leída 
  // Nota: Funcionalidad no disponible en el backend actual
  async markAsUnread(_notificationId: number): Promise<boolean> {
    console.warn('⚠️ [NOTIFICATIONS] markAsUnread not implemented in backend');
    return false;
  }

  // ✅ Marcar todas como leídas
  async markAllAsRead(): Promise<number> {
    try {
      const response = await apiRequest('/notifications/read-all', {
        method: 'PUT'
      });
      
      if (response && typeof response.updated_count === 'number') {
        return response.updated_count;
      }
      
      return 0;
      
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error marking all as read:', error);
      return 0;
    }
  }

  // ❌ Marcar todas como no leídas 
  // Nota: Funcionalidad no disponible en el backend actual
  async markAllAsUnread(): Promise<number> {
    console.warn('⚠️ [NOTIFICATIONS] markAllAsUnread not implemented in backend');
    return 0;
  }

  // 📤 Crear nueva notificación
  async createNotification(data: CreateNotificationData): Promise<DatabaseNotification | null> {
    try {
      const response = await apiRequest('/notifications', {
        method: 'POST',
        body: JSON.stringify({
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data || {}
        })
      });
      
      if (response && response.notification) {
        const newNotification = response.notification;
        
        // Notificar a subscriptores
        this.notifySubscribers(newNotification);
        
        return newNotification;
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error creating notification:', error);
      return null;
    }
  }

  // 🔔 Suscribirse a cambios en tiempo real (usando polling)
  subscribeToNotifications(callback: SubscriptionCallback): () => void {
    subscribers.push(callback);
    
    // Iniciar polling si es el primer suscriptor
    if (subscribers.length === 1) {
      this.startPolling();
    }
    
    // Retornar función de cleanup
    return () => {
      const index = subscribers.indexOf(callback);
      if (index > -1) {
        subscribers.splice(index, 1);
        
        // Detener polling si no hay suscriptores
        if (subscribers.length === 0 && pollingInterval) {
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
      }
    };
  }

  // 🔄 Iniciar polling para producción
  private startPolling(): void {
    if (pollingInterval) return;
    
    console.log(`🔄 [NOTIFICATIONS] Starting polling every ${NOTIFICATION_CONFIG.POLLING_INTERVAL}ms`);
    
    // 🚨 INICIALIZAR lastKnownCount
    // this.getUnreadCount().then(count => {
    //   lastKnownCount = count;
    //   console.log(`🔄 [NOTIFICATIONS] Initial count set to: ${lastKnownCount}`);
    // });
    
    pollingInterval = setInterval(async () => {
      // Evitar polling concurrente
      if (isPolling) {
        console.log('🔄 [NOTIFICATIONS] Polling already in progress, skipping...');
        return;
      }
      isPolling = true;
      
      try {
        console.log('🔄 [NOTIFICATIONS] Starting polling check...');
        
        // const currentCount = await this.getUnreadCount();
        //console.log(`🔄 [NOTIFICATIONS] Polling check: current=${currentCount}, lastKnown=${lastKnownCount}`);
        
        // ✨ DETECTAR CAMBIOS EN TIEMPO REAL
        /*if (currentCount > lastKnownCount) {
          console.log(`🚨 [NOTIFICATIONS] NEW NOTIFICATIONS DETECTED! ${lastKnownCount} -> ${currentCount}`);
          
          // Obtener todas las notificaciones
          const allNotifications = await this.getUserNotifications(50);
          const unreadNotifications = allNotifications.filter(n => !n.is_read);
          
          console.log(`🔔 [NOTIFICATIONS] Found ${unreadNotifications.length} unread notifications total`);
          
          // Mostrar las nuevas (diferencia entre current y lastKnown)
          const newCount = currentCount - lastKnownCount;
          const newNotifications = unreadNotifications.slice(0, newCount);
          
          console.log(`🔔 [NOTIFICATIONS] Broadcasting ${newNotifications.length} NEW notifications`);
          
          // Notificar cada nueva notificación INMEDIATAMENTE
          newNotifications.forEach((notification, index) => {
            setTimeout(() => {
              console.log(`🔔 [NOTIFICATIONS] *** BROADCASTING *** ${notification.title}`);
              this.notifySubscribers(notification);
            }, index * 200); // Más rápido
          });
          
          // Actualizar el contador
          lastKnownCount = currentCount;
        } else if (currentCount < lastKnownCount) {
          // Algunas notificaciones se marcaron como leídas
          console.log(`📖 [NOTIFICATIONS] Notifications read: ${lastKnownCount} -> ${currentCount}`);
          lastKnownCount = currentCount;
        } else {
          console.log(`✅ [NOTIFICATIONS] No new notifications (count: ${currentCount})`);
        }*/
        
      } catch (error) {
        console.error('❌ [NOTIFICATIONS] Polling error:', error);
      } finally {
        isPolling = false;
        console.log('🔄 [NOTIFICATIONS] Polling cycle completed');
      }
    }, NOTIFICATION_CONFIG.POLLING_INTERVAL);
  }

  // 🗑️ Eliminar notificación
  async deleteNotification(notificationId: number): Promise<boolean> {
    try {
      const response = await apiRequest(`/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      
      if (response && response.success) {
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error(`❌ [NOTIFICATIONS] Error deleting notification ${notificationId}:`, error);
      return false;
    }
  }

  // 📡 Notificar a todos los subscriptores
  private notifySubscribers(notification: DatabaseNotification): void {
    subscribers.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('❌ [NOTIFICATIONS] Subscriber callback failed:', error);
      }
    });

    // 🚀 NUEVO: Automáticamente enviar push notification para cada notificación interna
    try {
      console.log(`📱 [NOTIFICATIONS] Triggering push for notification: ${notification.id}`);
      triggerPushFromInternalNotification(notification);
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error triggering push:', error);
      // No hacer throw para no romper el flujo normal
    }
  }
}

// 📊 Instancia singleton
export const notificationData = NotificationDataService.getInstance();