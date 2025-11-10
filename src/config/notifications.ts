/**
 * ⚙️ Configuración del Sistema de Notificaciones
 * 
 * Este archivo permite cambiar fácilmente entre modo desarrollo y producción
 */

export const NOTIFICATION_CONFIG = {
  // 🔧 Configuración de producción
  USE_REAL_API: true,
  
  // 📡 Configuración de tiempo real
  POLLING_INTERVAL: 5000, // ✨ 5 segundos para tiempo real agresivo
  
  // 🎨 Configuración visual
  MAX_VISUAL_NOTIFICATIONS: 3,
  DEFAULT_AUTO_CLOSE: 5000, // 5 segundos
  SHOW_UNREAD_ON_LOAD: true, // ✅ Mostrar notificaciones no leídas al cargar
  SHOW_NEW_NOTIFICATIONS: true,
  
  // 📊 Configuración de paginación
  DEFAULT_PAGE_SIZE: 20,
  MAX_NOTIFICATIONS: 50,
  
  // 🚀 Optimizaciones de rendimiento
  MAX_POLLING_REQUESTS: 15,
  
  // 🔔 Configuración de tipos de notificación
  NOTIFICATION_PRIORITIES: {
    message: 'high',
    booking: 'high', 
    confirmation: 'medium',
    trip: 'medium',
    warning: 'high',
    error: 'high',
    success: 'low',
    info: 'low'
  } as const
};

export default NOTIFICATION_CONFIG;