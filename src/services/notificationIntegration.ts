/**
 * 🔗 CUPOAPP - SERVICIO INTEGRADOR DE NOTIFICACIONES
 * 
 * Este servicio conecta el sistema de notificaciones internas existente
 * con el nuevo sistema de push notifications para que cada notificación
 * interna automáticamente dispare una push notification.
 */

import { useBackendAuth } from '@/context/BackendAuthContext';

interface NotificationPayload {
  title: string;
  body: string;
  type?: 'chat' | 'booking' | 'trip' | 'system' | 'general';
  data?: Record<string, string>;
  userId?: string;
  userIds?: string[];
}

interface PushIntegrationService {
  sendPushNotification: (payload: NotificationPayload) => Promise<void>;
}

class NotificationIntegrationService implements PushIntegrationService {
  
  /**
   * 📤 Enviar push notification a través del backend
   */
  async sendPushNotification(payload: NotificationPayload): Promise<void> {
    try {
      console.log(`📤 [PUSH-INTEGRATION] Sending push: "${payload.title}" (${payload.type})`);

      // 🔍 Obtener token de autenticación
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        console.warn('⚠️ [PUSH-INTEGRATION] No auth token found - cannot send push');
        return;
      }

      // 📤 Enviar a backend Fastify
      const response = await fetch('https://cupo.site/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          user_ids: payload.userIds || (payload.userId ? [payload.userId] : []),
          type: payload.type || 'general'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ [PUSH-INTEGRATION] Push sent successfully (${result.successCount}/${result.successCount + result.failureCount})`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [PUSH-INTEGRATION] Backend push failed:', {
          status: response.status,
          error: errorData.message || 'Unknown error'
        });
      }

    } catch (error) {
      console.error('❌ [PUSH-INTEGRATION] Push notification error:', error);
    }
  }


}

// 🚀 Instancia singleton del servicio
export const notificationIntegrationService = new NotificationIntegrationService();

/**
 * 🔗 Hook para integrar automáticamente push notifications
 * con el sistema de notificaciones existente
 */
export const useNotificationIntegration = () => {
  const { isAuthenticated, user } = useBackendAuth();

  /**
   * 📨 Función para enviar notificación completa (interna + push)
   */
  const sendNotification = async (
    title: string,
    message: string,
    type: 'chat' | 'booking' | 'trip' | 'system' | 'general' = 'general',
    targetUserIds?: string[],
    additionalData?: Record<string, string>
  ): Promise<void> => {
    if (!isAuthenticated) {
      console.warn('⚠️ [NOTIFICATION-INTEGRATION] User not authenticated - skipping notification');
      return;
    }

    try {
      console.log(`🔔 [NOTIFICATION-INTEGRATION] Sending: "${title}" (${type})`);

      // 📤 Enviar push notification automáticamente
      await notificationIntegrationService.sendPushNotification({
        title,
        body: message,
        type,
        userIds: targetUserIds || (user?.id ? [user.id] : []),
        data: {
          type,
          timestamp: Date.now().toString(),
          ...additionalData
        }
      });

      console.log('✅ [NOTIFICATION-INTEGRATION] Complete notification sent successfully');

    } catch (error) {
      console.error('❌ [NOTIFICATION-INTEGRATION] Failed to send complete notification:', error);
    }
  };

  return {
    sendNotification,
    isAuthenticated
  };
};

/**
 * 📋 Helper para convertir notificación interna a push
 * Esta función se puede llamar desde el sistema de notificaciones existente
 */
export const triggerPushFromInternalNotification = async (
  internalNotification: {
    id: number;
    message: string;
    type: string;
    user_id: string;
    additional_data?: string;
  }
): Promise<void> => {
  try {
    console.log('🔄 [PUSH-INTEGRATION] Converting internal notification to push:', {
      id: internalNotification.id,
      type: internalNotification.type,
      userId: internalNotification.user_id
    });

    // 🎨 Formatear título basado en tipo
    let title = '🔔 CupoApp';
    switch (internalNotification.type) {
      case 'chat':
        title = '💬 Nuevo Mensaje';
        break;
      case 'booking':
        title = '🎫 Actualización de Reserva';
        break;
      case 'trip':
        title = '🚗 Actualización de Viaje';
        break;
      case 'system':
        title = '📱 Sistema';
        break;
    }

    // 📊 Parsear datos adicionales
    let additionalData: Record<string, string> = {};
    try {
      if (internalNotification.additional_data) {
        const parsed = JSON.parse(internalNotification.additional_data);
        additionalData = {
          notificationId: internalNotification.id.toString(),
          originalType: internalNotification.type,
          ...parsed
        };
      }
    } catch (e) {
      console.warn('⚠️ [PUSH-INTEGRATION] Could not parse additional_data');
    }

    // 📤 Enviar push notification
    await notificationIntegrationService.sendPushNotification({
      title,
      body: internalNotification.message,
      type: internalNotification.type as any,
      userIds: [internalNotification.user_id],
      data: additionalData
    });

    console.log('✅ [PUSH-INTEGRATION] Internal notification converted to push successfully');

  } catch (error) {
    console.error('❌ [PUSH-INTEGRATION] Failed to convert internal notification to push:', error);
  }
};

export default notificationIntegrationService;