/**
 * 🎮 Hook Principal de Notificaciones
 * 
 * Este hook combina el servicio de datos con el servicio visual
 * proporcionando una interfaz súper fácil de usar desde cualquier componente.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationData } from '../services/notificationData';
import { notificationDisplay } from '../services/notificationDisplay';
import { NOTIFICATION_CONFIG } from '../config/notifications';
import { 
  DatabaseNotification, 
  NotificationState, 
  UseNotificationsConfig,
  CreateNotificationData
} from '../types/notifications';

// 🎮 Hook principal de notificaciones
export const useNotifications = (config: UseNotificationsConfig = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = NOTIFICATION_CONFIG.POLLING_INTERVAL, // Usar configuración del sistema
    maxNotifications = 100,
    enableRealTime = true
  } = config;

  // 📊 Estado del hook
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    loading: true,
    error: undefined
  });

  // 🔄 Referencias para cleanup
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSubscribedRef = useRef(false);

  // 📥 Cargar notificaciones desde la base de datos
  const loadNotifications = useCallback(async (showLoading = true, showVisualNotifications = false) => {
    try {
      if (showLoading) {
        setState(prev => ({ ...prev, loading: true, error: undefined }));
      }


      
      const [notifications, /*unreadCount*/] = await Promise.all([
        notificationData.getUserNotifications(maxNotifications),
        //notificationData.getUnreadCount()
      ]);

      setState(prev => ({
        ...prev,
        notifications,
        /*unreadCount,*/
        loading: false,
        error: undefined
      }));


      
        // 🔔 Mostrar SOLO notificaciones NO LEÍDAS visualmente
        if (showVisualNotifications && NOTIFICATION_CONFIG.SHOW_UNREAD_ON_LOAD && notifications.length > 0) {
          // ✨ SOLO mostrar las NO LEÍDAS
          const unreadNotifications = notifications.filter(n => !n.is_read);
          const recentUnread = unreadNotifications.slice(0, NOTIFICATION_CONFIG.MAX_VISUAL_NOTIFICATIONS);
          
          console.log(`🔔 [HOOK] Showing ${recentUnread.length} UNREAD notifications visually`);
          
          recentUnread.forEach((notification, index) => {
            // Escalonar las notificaciones para que no aparezcan todas a la vez
            setTimeout(() => {
              // 🎯 Mostrar con callback para marcar como leída al cerrar
              notificationDisplay.showFromDatabase(notification, {
                onClose: async () => {
                  console.log(`🔔 [HOOK] Auto-marking notification ${notification.id} as read (closed)`);
                  await markAsRead(notification.id);
                }
              });
              console.log(`🔔 [HOOK] Displayed UNREAD notification: ${notification.title}`);
            }, index * 500); // 500ms entre cada notificación
          });
        }    } catch (error) {
      console.error('❌ [HOOK] Error loading notifications:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error loading notifications'
      }));
    }
  }, [maxNotifications]);

  // 🔔 Manejar nueva notificación recibida en tiempo real
  const handleNewNotification = useCallback((newNotification: DatabaseNotification) => {
    console.log(`🔔 [HOOK] Received new notification in real-time: ${newNotification.title}`);
    
    // Actualizar estado local
    setState(prev => ({
      ...prev,
      notifications: [newNotification, ...prev.notifications],
      unreadCount: newNotification.is_read ? prev.unreadCount : prev.unreadCount + 1
    }));

    // 🚨 SIEMPRE mostrar notificaciones nuevas si está habilitado
    if (NOTIFICATION_CONFIG.SHOW_NEW_NOTIFICATIONS && !newNotification.is_read) {
      console.log(`🔔 [HOOK] Showing real-time notification: ${newNotification.title}`);
      // 🎯 Handler que SIEMPRE va al centro de notificaciones (ya configurado en notificationDisplay)
      notificationDisplay.showFromDatabase(newNotification, {
        onClose: async () => {
          console.log(`🔔 [HOOK] Real-time notification ${newNotification.id} closed, marking as read`);
          await markAsRead(newNotification.id);
        }
      });
    }
  }, []);

  // ✅ Marcar notificación como leída (moved up for dependency order)
  const markAsRead = useCallback(async (notificationId: number): Promise<boolean> => {
    try {
      
      const success = await notificationData.markAsRead(notificationId);
      
      if (success) {
        // Actualizar estado local
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n => 
            n.id === notificationId 
              ? { ...n, is_read: true, status: 'leido' as const }
              : n
          ),
          unreadCount: Math.max(0, prev.unreadCount - 1)
        }));
        
      }
      
      return success;
    } catch (error) {
      console.error(`❌ [HOOK] Error marking notification ${notificationId} as read:`, error);
      return false;
    }
  }, []);



  // ❌ Marcar notificación como no leída
  const markAsUnread = useCallback(async (notificationId: number): Promise<boolean> => {
    try {
      
      const success = await notificationData.markAsUnread(notificationId);
      
      if (success) {
        // Actualizar estado local
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n => 
            n.id === notificationId 
              ? { ...n, is_read: false, status: 'pendiente' as const }
              : n
          ),
          unreadCount: prev.unreadCount + 1
        }));
        
        console.log(`❌ [HOOK] Successfully marked notification ${notificationId} as unread`);
      }
      
      return success;
    } catch (error) {
      console.error(`❌ [HOOK] Error marking notification ${notificationId} as unread:`, error);
      return false;
    }
  }, []);

  // ✅ Marcar todas como leídas
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      console.log('✅ [HOOK] Marking all notifications as read');
      
      const updatedCount = await notificationData.markAllAsRead();
      
      if (updatedCount > 0) {
        // Actualizar estado local
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n => ({ 
            ...n, 
            is_read: true, 
            status: 'leido' as const 
          })),
          unreadCount: 0
        }));
        
        console.log(`✅ [HOOK] Successfully marked ${updatedCount} notifications as read`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ [HOOK] Error marking all notifications as read:', error);
      return false;
    }
  }, []);

  // ❌ Marcar todas como no leídas
  const markAllAsUnread = useCallback(async (): Promise<boolean> => {
    try {
      console.log('❌ [HOOK] Marking all notifications as unread');
      
      const updatedCount = await notificationData.markAllAsUnread();
      
      if (updatedCount > 0) {
        // Actualizar estado local
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n => ({ 
            ...n, 
            is_read: false, 
            status: 'pendiente' as const 
          })),
          unreadCount: prev.notifications.length // Todas son no leídas ahora
        }));
        
        console.log(`❌ [HOOK] Successfully marked ${updatedCount} notifications as unread`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ [HOOK] Error marking all notifications as unread:', error);
      return false;
    }
  }, []);

  // 🔄 Refrescar manualmente
  const refresh = useCallback(() => {
    loadNotifications(true);
  }, [loadNotifications]);

  // 🧹 Limpiar notificaciones visuales
  const clearVisualNotifications = useCallback(() => {
    notificationDisplay.clear();
  }, []);

  // 📊 Funciones de conveniencia para mostrar notificaciones

  const showSuccess = useCallback((title: string, message: string) => {
    return notificationDisplay.showSuccess(title, message);
  }, []);

  const showError = useCallback((title: string, message: string, persistent = true) => {
    return notificationDisplay.showError(title, message, persistent);
  }, []);

  const showInfo = useCallback((title: string, message: string) => {
    return notificationDisplay.showInfo(title, message);
  }, []);

  const showWarning = useCallback((title: string, message: string) => {
    return notificationDisplay.showWarning(title, message);
  }, []);

  // 📤 Crear notificación personalizada
  const createNotification = useCallback(async (data: CreateNotificationData): Promise<DatabaseNotification | null> => {
    try {
      return await notificationData.createNotification(data);
    } catch (error) {
      console.error('❌ [HOOK] Error creating notification:', error);
      return null;
    }
  }, []);

  // 🚀 Inicialización y configuración de tiempo real
  useEffect(() => {
    
    // Cargar datos iniciales Y mostrar visualmente las notificaciones no leídas
    loadNotifications(true, true); // showLoading=true, showVisualNotifications=true

    // Configurar suscripción en tiempo real
    if (enableRealTime && !isSubscribedRef.current) {
      
      const unsubscribe = notificationData.subscribeToNotifications(handleNewNotification);
      unsubscribeRef.current = unsubscribe;
      isSubscribedRef.current = true;
    }

    // Configurar auto-refresh
    if (autoRefresh && refreshInterval > 0) {
      
      refreshIntervalRef.current = setInterval(() => {
        loadNotifications(false, false); // Refresh silencioso sin mostrar notificaciones
      }, refreshInterval);
    }

    // Cleanup function
    return () => {
      
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        isSubscribedRef.current = false;
      }
      
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [loadNotifications, handleNewNotification, enableRealTime, autoRefresh, refreshInterval]);

  // 🎯 Retornar interfaz completa del hook
  return {
    // 📊 Estado
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    loading: state.loading,
    error: state.error,
    
    // 🔍 Computed values
    hasNotifications: state.notifications.length > 0,
    hasUnread: state.unreadCount > 0,
    hasRead: state.notifications.filter(n => n.is_read).length > 0,
    
    // 🔄 Acciones principales
    refresh,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    markAllAsUnread,
    clearVisualNotifications,
    
    // 🎨 Notificaciones visuales
    showSuccess,
    showError,
    showInfo,
    showWarning,
    
    // 📤 Crear notificaciones
    createNotification,
    
    // 📈 Estadísticas
    stats: {
      total: state.notifications.length,
      unread: state.unreadCount,
      read: state.notifications.filter(n => n.is_read).length,
      byType: state.notifications.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    }
  };
};