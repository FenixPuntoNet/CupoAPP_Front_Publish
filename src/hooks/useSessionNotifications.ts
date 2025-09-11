import { useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { useBackendAuth } from '@/context/BackendAuthContext';

/**
 * Hook que maneja las notificaciones relacionadas con la sesión
 */
export const useSessionNotifications = () => {
  const { isAuthenticated } = useBackendAuth();

  useEffect(() => {
    // Listener para errores de autenticación
    const handleAuthError = (event: CustomEvent) => {
      const { endpoint, shouldRedirect } = event.detail;
      
      // Solo mostrar notificación si no es un endpoint interno y debe redirigir
      if (endpoint !== '/auth/me' && shouldRedirect) {
        notifications.show({
          title: '⚠️ Sesión expirada',
          message: 'Tu sesión ha expirado por inactividad. Serás redirigido al login.',
          color: 'orange',
          autoClose: 6000,
        });
      } else if (endpoint !== '/auth/me' && !shouldRedirect) {
        // En mobile, mostrar mensaje menos alarmante
        notifications.show({
          title: '🔄 Verificando sesión',
          message: 'Verificando estado de tu sesión...',
          color: 'blue',
          autoClose: 3000,
        });
      }
    };

    // Listener para cuando se restablece la conexión
    const handleOnline = () => {
      if (isAuthenticated) {
        notifications.show({
          title: '✅ Conexión restaurada',
          message: 'La conexión a internet se ha restablecido.',
          color: 'green',
          autoClose: 3000,
        });
      }
    };

    // Listener para cuando se pierde la conexión
    const handleOffline = () => {
      notifications.show({
        title: '🔴 Sin conexión',
        message: 'Se ha perdido la conexión a internet. Verifica tu conectividad.',
        color: 'red',
        autoClose: false, // No cerrar automáticamente
      });
    };

    // Agregar listeners
    window.addEventListener('auth-error', handleAuthError as EventListener);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('auth-error', handleAuthError as EventListener);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAuthenticated]);
};

export default useSessionNotifications;
