/**
 * 📱 Hook para Notificaciones Push Móviles
 * 
 * Maneja las notificaciones push nativas para iOS y Android
 * usando Firebase Cloud Messaging a través de Capacitor
 */

import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { 
  PushNotifications, 
  Token, 
  ActionPerformed,
  PushNotificationSchema 
} from '@capacitor/push-notifications';
import { useBackendAuth } from '@/context/BackendAuthContext';
import { notificationDisplay } from '@/services/notificationDisplay';

interface UseMobilePushReturn {
  isSupported: boolean;
  isRegistered: boolean;
  isLoading: boolean;
  token: string | null;
  register: () => Promise<boolean>;
  unregister: () => Promise<boolean>;
}

export const useMobilePushNotifications = (): UseMobilePushReturn => {
  const { isAuthenticated } = useBackendAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // 🔍 Verificar si estamos en dispositivo móvil nativo
  useEffect(() => {
    const supported = Capacitor.isNativePlatform();
    setIsSupported(supported);
    console.log(`📱 [MOBILE-PUSH] Platform: ${Capacitor.getPlatform()}, Push supported: ${supported}`);
  }, []);

  // 🔄 Auto-registro cuando el usuario se autentica (solo si es móvil)
  useEffect(() => {
    if (isSupported && isAuthenticated && !isRegistered && !isLoading) {
      console.log('📱 [MOBILE-PUSH] Auto-registering for push notifications');
      register();
    }
  }, [isSupported, isAuthenticated, isRegistered, isLoading]);

  // 🔔 Configurar listeners de notificaciones push
  useEffect(() => {
    if (!isSupported) return;

    console.log('📱 [MOBILE-PUSH] Setting up notification listeners');

    // 📨 Listener: Notificación recibida mientras app está abierta
    const notificationReceivedListener = PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('📨 [MOBILE-PUSH] Push notification received (app open):', notification);
        
        // 🎨 REUTILIZAR - Usar tu sistema visual existente
        notificationDisplay.show({
          type: notification.data?.type || 'info',
          title: notification.title || 'Nueva notificación',
          message: notification.body || '',
          priority: notification.data?.priority || 'medium',
          onClick: () => {
            console.log('🎯 [MOBILE-PUSH] In-app notification clicked - navigating to center');
          }
        });
      }
    );

    // 🎯 Listener: Usuario tocó la notificación (app cerrada o en background)
    const actionPerformedListener = PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        console.log('🎯 [MOBILE-PUSH] Push notification tapped (app was closed/background):', action);
        
        const data = action.notification.data;
        
        // 🔗 REUTILIZAR - Tu lógica de navegación inteligente
        let targetUrl = '/Notifications'; // Por defecto al centro
        
        if (data?.chat_id || data?.chatId) {
          targetUrl = '/Actividades';
          console.log('🎯 [MOBILE-PUSH] Navigating to chat activities');
        } else if (data?.booking_id || data?.bookingId) {
          targetUrl = '/CuposReservados';
          console.log('🎯 [MOBILE-PUSH] Navigating to bookings');
        } else if (data?.trip_id || data?.tripId) {
          targetUrl = '/Actividades';
          console.log('🎯 [MOBILE-PUSH] Navigating to trip activities');
        }
        
        // Navegar después de un pequeño delay para que la app termine de cargar
        setTimeout(() => {
          console.log(`🎯 [MOBILE-PUSH] Navigating to: ${targetUrl}`);
          window.location.href = targetUrl;
        }, 800);
      }
    );

    // 🧹 Cleanup listeners
    return () => {
      console.log('🧹 [MOBILE-PUSH] Removing push notification listeners');
      notificationReceivedListener.then(listener => listener.remove());
      actionPerformedListener.then(listener => listener.remove());
    };
  }, [isSupported]);

  // 📝 Función para registrar push notifications
  const register = async (): Promise<boolean> => {
    if (!isSupported) {
      console.log('📱 [MOBILE-PUSH] Cannot register - not a native platform');
      return false;
    }
    
    if (!isAuthenticated) {
      console.log('📱 [MOBILE-PUSH] Cannot register - user not authenticated');
      return false;
    }

    if (isRegistered) {
      console.log('📱 [MOBILE-PUSH] Already registered');
      return true;
    }

    console.log('📱 [MOBILE-PUSH] Registering for push notifications...');
    setIsLoading(true);

    try {
      // 1. 🔐 Solicitar permisos de notificación
      console.log('📱 [MOBILE-PUSH] Requesting notification permissions...');
      const permissionResult = await PushNotifications.requestPermissions();
      
      if (permissionResult.receive !== 'granted') {
        console.log('📱 [MOBILE-PUSH] Notification permissions denied by user');
        
        notificationDisplay.showWarning(
          '🔔 Permisos de Notificación',
          'Las notificaciones push fueron rechazadas. Puedes habilitarlas en configuración.'
        );
        
        setIsLoading(false);
        return false;
      }

      console.log('✅ [MOBILE-PUSH] Notification permissions granted');

      // 2. 📝 Registrar con el sistema de push notifications
      console.log('📱 [MOBILE-PUSH] Registering with push notification system...');
      await PushNotifications.register();

      // 3. 🎯 Configurar listener para el token de registro
      const tokenListener = PushNotifications.addListener('registration', async (token: Token) => {
        console.log('📝 [MOBILE-PUSH] Push token received:', token.value.substring(0, 50) + '...');
        
        try {
          setToken(token.value);

          // 🔗 BACKEND INTEGRATION - Enviar token al servidor
          const platform = Capacitor.getPlatform(); // 'ios' o 'android'
          const deviceInfo = {
            platform,
            model: 'mobile-device',
            version: '1.0.0'
          };

          console.log('📡 [MOBILE-PUSH] Sending token to backend...');
          
          const response = await fetch('https://cupo.site/push/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
              token: token.value,
              platform,
              device_info: deviceInfo
            })
          });

          if (response.ok) {
            setIsRegistered(true);
            console.log('✅ [MOBILE-PUSH] Token successfully registered with backend');
            
            // 🎉 Mostrar confirmación usando tu sistema visual
            notificationDisplay.showSuccess(
              '🔔 ¡Notificaciones Push Activadas!',
              `Recibirás notificaciones de CupoApp incluso cuando la app esté cerrada`
            );
          } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Backend registration failed: ${response.status}`);
          }
          
        } catch (backendError) {
          console.error('❌ [MOBILE-PUSH] Backend registration error:', backendError);
          
          // Aún así marcar como registrado localmente para evitar bucles
          setIsRegistered(true);
          
          notificationDisplay.showWarning(
            '⚠️ Notificaciones Parcialmente Activas',
            'Las notificaciones locales funcionan, pero hay un problema con el servidor.'
          );
        } finally {
          setIsLoading(false);
        }

        // Remover listener después del primer uso
        tokenListener.then(listener => listener.remove());
      });

      // 4. 🚨 Configurar listener para errores de registro
      const errorListener = PushNotifications.addListener('registrationError', (error) => {
        console.error('❌ [MOBILE-PUSH] Registration error:', error);
        setIsLoading(false);
        
        notificationDisplay.showError(
          '❌ Error en Notificaciones Push',
          'No se pudieron activar las notificaciones push. Verifica tu conexión.'
        );
        
        errorListener.then(listener => listener.remove());
      });

      return true;

    } catch (error) {
      console.error('❌ [MOBILE-PUSH] Registration process failed:', error);
      setIsLoading(false);
      
      notificationDisplay.showError(
        '❌ Error de Registro',
        'No se pudieron configurar las notificaciones push'
      );
      
      return false;
    }
  };

  // 🚫 Función para desregistrar push notifications
  const unregister = async (): Promise<boolean> => {
    if (!isSupported || !isAuthenticated) return false;

    console.log('📱 [MOBILE-PUSH] Starting unregistration process...');
    setIsLoading(true);

    try {
      // 1. Remover todos los listeners
      await PushNotifications.removeAllListeners();
      
      // 2. 🔗 BACKEND INTEGRATION - Notificar al servidor
      try {
        await fetch('https://cupo.site/push/unregister', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            token: token
          })
        });
        console.log('✅ [MOBILE-PUSH] Successfully notified backend of unregistration');
      } catch (backendError) {
        console.error('⚠️ [MOBILE-PUSH] Backend unregistration error (non-critical):', backendError);
      }

      // 3. Limpiar estado local
      setIsRegistered(false);
      setToken(null);
      
      console.log('✅ [MOBILE-PUSH] Successfully unregistered push notifications');
      
      notificationDisplay.showInfo(
        '🔕 Notificaciones Push Desactivadas',
        'Ya no recibirás notificaciones push de CupoApp'
      );

      return true;

    } catch (error) {
      console.error('❌ [MOBILE-PUSH] Unregistration failed:', error);
      
      notificationDisplay.showError(
        '❌ Error al Desactivar',
        'No se pudieron desactivar completamente las notificaciones'
      );
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isRegistered,
    isLoading,
    token,
    register,
    unregister
  };
};