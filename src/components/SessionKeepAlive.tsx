import { useEffect } from 'react';
import { updateUserActivity } from '@/config/api';
import { useBackendAuth } from '@/context/BackendAuthContext';

/**
 * Componente que mantiene la sesión activa detectando la actividad del usuario
 */
export const SessionKeepAlive: React.FC = () => {
  // Usar try-catch para manejar casos donde el contexto no esté disponible
  let isAuthenticated = false;
  
  try {
    const auth = useBackendAuth();
    isAuthenticated = auth.isAuthenticated;
  } catch (error) {
    console.log('SessionKeepAlive: BackendAuth context not available yet');
    return null;
  }

  useEffect(() => {
    if (!isAuthenticated) return;

    // En mobile, ser menos agresivo con el tracking
    const isMobile = typeof window !== 'undefined' && window.Capacitor;
    
    // Lista de eventos que indican actividad del usuario
    const activityEvents = isMobile 
      ? ['touchstart', 'click', 'focus'] // Solo eventos esenciales en mobile
      : ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'focus'];

    let activityTimeout: NodeJS.Timeout;

    const handleUserActivity = () => {
      // Debounce para evitar demasiadas actualizaciones
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => {
        updateUserActivity();
      }, isMobile ? 5000 : 1000); // Menos frecuente en mobile
    };

    // Agregar listeners para todos los eventos de actividad
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Agregar listener para cambios de visibilidad de la página
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // La página se volvió visible, actualizar actividad
        updateUserActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      clearTimeout(activityTimeout);
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated]);

  // Este componente no renderiza nada
  return null;
};

export default SessionKeepAlive;
