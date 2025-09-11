import { useEffect } from 'react';
import { useBackendAuth } from '@/context/BackendAuthContext';
import { updateUserActivity } from '@/config/api';

/**
 * Hook simple para mantener la sesión activa
 * Se activa automáticamente cuando el usuario está autenticado
 */
export const useSimpleSessionKeepAlive = () => {
  const { isAuthenticated } = useBackendAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    console.log('🚀 Simple session keep-alive activated');

    // Solo detectar eventos esenciales para no sobrecargar
    const handleActivity = () => {
      updateUserActivity();
    };

    // Eventos mínimos necesarios
    const events = ['click', 'touchstart', 'keydown'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      console.log('🔒 Simple session keep-alive deactivated');
    };
  }, [isAuthenticated]);
};

export default useSimpleSessionKeepAlive;
