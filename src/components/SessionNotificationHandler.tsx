import React from 'react';
import { useSessionNotifications } from '@/hooks/useSessionNotifications';

/**
 * Componente que inicializa las notificaciones de sesión
 * Debe estar dentro del BackendAuthProvider
 */
export const SessionNotificationHandler: React.FC = () => {
  useSessionNotifications();
  
  // Este componente no renderiza nada, solo inicializa el hook
  return null;
};

export default SessionNotificationHandler;
