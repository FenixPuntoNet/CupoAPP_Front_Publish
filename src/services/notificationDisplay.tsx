/**
 * 🎨 Servicio de Visualización de Notificaciones
 * 
 * Este archivo maneja toda la presentación visual de las notificaciones
 * usando Mantine. Es independiente de donde vengan los datos.
 */

import { notifications } from '@mantine/notifications';
import { 
  IconCheck, 
  IconX, 
  IconInfoCircle, 
  IconBell, 
  IconTicket, 
  IconCar, 
  IconAlertTriangle,
  IconClock
} from '@tabler/icons-react';
import { 
  NotificationType, 
  NotificationDisplayConfig, 
  DatabaseNotification,
  NOTIFICATION_CONFIGS 
} from '../types/notifications';

// 🎯 Navegación global para redirecciones
let globalNavigate: ((to: string) => void) | null = null;

// 🔧 Función para configurar la navegación desde el componente raíz
export const setGlobalNavigate = (navigate: (to: string) => void) => {
  globalNavigate = navigate;
  console.log('🎯 [DISPLAY] Global navigate function configured');
};

// 🎯 Función helper para navegar
const navigateToPage = (path: string) => {
  console.log(`🎯 [DISPLAY] Attempting to navigate to: ${path}`);
  if (globalNavigate) {
    console.log('🎯 [DISPLAY] Using React Router navigation');
    globalNavigate(path);
  } else {
    console.log('🎯 [DISPLAY] Using window.location navigation');
    window.location.href = path;
  }
};

/**
 * 🎨 Servicio de Visualización de Notificaciones
 * 
 * Maneja la presentación visual usando Mantine Notifications.
 * Completamente independiente del origen de los datos.
 */
class NotificationDisplayService {
  private static instance: NotificationDisplayService;

  static getInstance(): NotificationDisplayService {
    if (!NotificationDisplayService.instance) {
      NotificationDisplayService.instance = new NotificationDisplayService();
    }
    return NotificationDisplayService.instance;
  }

  // 🔔 Mostrar notificación visual principal - DISEÑO PROFESIONAL ✨
  show(config: NotificationDisplayConfig): string {
    const {
      type,
      title,
      message,
      autoClose,
      persistent = false,
      onClick,
      priority = 'medium'
    } = config;

    // Obtener configuración predeterminada para el tipo
    const typeConfig = this.getTypeConfig(type);
    
    // 🎨 Crear el clic handler que siempre va al centro de notificaciones
    const handleClick = () => {
      if (onClick) {
        onClick();
      }
      navigateToPage('/Notifications');
    };
    
    // Configurar la notificación con diseño SÚPER profesional
    const notificationConfig = {
      id: `cupo-notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: this.formatTitle(title, type),
      message: this.formatMessage(message),
      autoClose: persistent ? false : (autoClose ?? typeConfig.autoClose),
      withCloseButton: true,
      icon: this.getIcon(type),
      color: typeConfig.color,
      onClick: (e: any) => {
        const target = e?.target as HTMLElement;
        
        // 🚫 No navegar si se hace click en el botón de cerrar
        if (target?.closest('.mantine-ActionIcon') || target?.closest('[data-dismiss]') || target?.closest('.mantine-Notification-closeButton')) {
          console.log('🔔 [DISPLAY] Click on close button - not navigating');
          return;
        }
        
        handleClick();
      },
      style: {
        cursor: 'pointer',
        backgroundColor: 'var(--mantine-color-dark-7)',
        border: `2px solid ${typeConfig.borderColor}`,
        borderRadius: '16px',
        boxShadow: `0 12px 40px ${typeConfig.shadowColor}, 0 4px 12px rgba(0, 0, 0, 0.15)`,
        backdropFilter: 'blur(12px)',
        minHeight: '80px',
        padding: '16px',
        margin: '8px',
        transform: 'translateY(0px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        ...(priority === 'high' && { 
          borderColor: typeConfig.urgentBorderColor,
          boxShadow: `0 16px 48px ${typeConfig.urgentShadowColor}, 0 8px 24px rgba(255, 0, 0, 0.2)`,
          animation: 'pulse-glow 2s ease-in-out infinite'
        })
      },
      classNames: {
        root: `cupo-notification cupo-notification-${type} ${onClick ? 'cupo-notification-clickable' : ''} cupo-priority-${priority}`,
        title: 'cupo-notification-title',
        description: 'cupo-notification-message',
        icon: 'cupo-notification-icon',
        closeButton: 'cupo-notification-close'
      }
    };

    // Mostrar notificación con efecto de entrada
    notifications.show(notificationConfig);
    
    return notificationConfig.id;
  }

  // 🎯 Mostrar notificación desde datos de base de datos
  showFromDatabase(dbNotification: DatabaseNotification, options?: { onClick?: () => void; onClose?: () => void }): string {
    const type = this.mapDatabaseTypeToDisplay(dbNotification.type);
    
    // 🔔 Usar Mantine notifications directamente para tener mejor control del cierre
    const notificationId = `cupo-db-${dbNotification.id}-${Date.now()}`;
    
    notifications.show({
      id: notificationId,
      title: this.formatTitle(dbNotification.title, type),
      message: this.formatMessage(dbNotification.message),
      autoClose: 6000, // ✨ 6 segundos para auto-cerrar
      withCloseButton: true,
      icon: this.getIcon(type),
      color: this.getTypeConfig(type).color,
      onClick: () => {
        console.log(`🔔 [DISPLAY] Notification clicked via Mantine onClick - navigating to /Notifications`);
        if (options?.onClick) {
          options.onClick();
        }
        navigateToPage('/Notifications');
      },
      onClose: () => {
        console.log(`🔔 [DISPLAY] Notification ${dbNotification.id} was closed`);
        if (options?.onClose) {
          options.onClose();
        }
      },
      style: {
        borderRadius: '16px',
        border: `2px solid ${this.getTypeConfig(type).borderColor}`,
        boxShadow: `0 12px 40px ${this.getTypeConfig(type).shadowColor}`,
        backdropFilter: 'blur(12px)',
        minHeight: '80px',
        cursor: 'pointer'
      },
      classNames: {
        root: 'cupo-notification-clickable',
      }
    });
    
    // ✨ Agregar click handler GLOBAL a toda la notificación después de que se renderice
    setTimeout(() => {
      const notificationElement = document.querySelector(`[data-id="${notificationId}"]`);
      if (notificationElement) {
        // 🎯 Hacer toda la notificación clickeable (excepto el botón X)
        notificationElement.addEventListener('click', (e) => {
          const target = e.target as HTMLElement;
          
          // 🚫 No navegar si se hace click en el botón de cerrar
          if (target.closest('.mantine-ActionIcon') || target.closest('[data-dismiss]') || target.closest('.mantine-Notification-closeButton')) {
            console.log('🔔 [DISPLAY] Click on close button - not navigating');
            return;
          }
          
          e.preventDefault();
          e.stopPropagation();
          console.log(`🔔 [DISPLAY] Clicked notification ${dbNotification.id} - navigating to /Notifications`);
          
          if (options?.onClick) {
            options.onClick();
          }
          
          navigateToPage('/Notifications');
        });
        
        // 🎨 Agregar cursor pointer para mostrar que es clickeable
        (notificationElement as HTMLElement).style.cursor = 'pointer';
        
        console.log(`🔔 [DISPLAY] Click handler configured for notification ${dbNotification.id}`);
      }
    }, 150);
    
    return notificationId;
  }

  // 🚀 Funciones de conveniencia para tipos específicos

  // ✅ Notificación de éxito
  showSuccess(title: string, message: string, autoClose?: number): string {
    return this.show({
      type: 'success',
      title,
      message,
      autoClose,
      priority: 'low'
    });
  }

  // ❌ Notificación de error
  showError(title: string, message: string, persistent: boolean = true): string {
    return this.show({
      type: 'error',
      title,
      message,
      persistent,
      priority: 'high'
    });
  }

  // 💬 Notificación de mensaje
  showMessage(senderName: string, message: string, onClick?: () => void): string {
    return this.show({
      type: 'message',
      title: `💬 Mensaje de ${senderName}`,
      message: message.length > 80 ? message.substring(0, 80) + '...' : message,
      persistent: true,
      onClick,
      priority: 'high'
    });
  }

  // 🎫 Notificación de reserva
  showBooking(passengerName: string, seats: number, destination: string, onClick?: () => void): string {
    return this.show({
      type: 'booking',
      title: '🎫 Nueva reserva recibida',
      message: `${passengerName} reservó ${seats} cupo${seats > 1 ? 's' : ''} para ${destination}`,
      persistent: true,
      onClick,
      priority: 'high'
    });
  }

  // ✅ Notificación de confirmación
  showConfirmation(driverName: string, destination: string, onClick?: () => void): string {
    return this.show({
      type: 'confirmation',
      title: '✅ Reserva confirmada',
      message: `${driverName} confirmó tu viaje a ${destination}`,
      persistent: false,
      onClick,
      priority: 'medium'
    });
  }

  // 🚗 Notificación de viaje
  showTripChange(changeType: string, destination: string, details: string, onClick?: () => void): string {
    return this.show({
      type: 'trip',
      title: `⚠️ Cambio en tu viaje a ${destination}`,
      message: `${changeType}: ${details}`,
      persistent: true,
      onClick,
      priority: 'high'
    });
  }

  // ⚠️ Notificación de advertencia
  showWarning(title: string, message: string, onClick?: () => void): string {
    return this.show({
      type: 'warning',
      title,
      message,
      persistent: true,
      onClick,
      priority: 'high'
    });
  }

  // ℹ️ Notificación informativa
  showInfo(title: string, message: string, autoClose?: number): string {
    return this.show({
      type: 'info',
      title,
      message,
      autoClose,
      priority: 'low'
    });
  }

  // 🔔 Notificación de recordatorio
  showReminder(title: string, message: string, onClick?: () => void): string {
    return this.show({
      type: 'reminder',
      title,
      message,
      persistent: true,
      onClick,
      priority: 'medium'
    });
  }

  // 🧹 Limpiar todas las notificaciones
  clear(): void {
    notifications.clean();
    console.log('🧹 [DISPLAY] All notifications cleared');
  }

  // 🧹 Limpiar notificaciones por tipo
  clearByType(type: NotificationType): void {
    // Mantine no tiene método directo para esto, pero podemos usar el selector de clase
    const notificationElements = document.querySelectorAll(`.notification-${type}`);
    notificationElements.forEach(element => {
      const closeButton = element.querySelector('[data-dismiss]');
      if (closeButton) {
        (closeButton as HTMLElement).click();
      }
    });
    
    console.log(`🧹 [DISPLAY] Cleared ${type} notifications`);
  }

  // 🛠️ Métodos privados de utilidad

  // 🎨 Obtener icono para cada tipo
  private getIcon(type: NotificationType) {
    const iconProps = { size: 20, style: { marginTop: 2 } };
    
    switch (type) {
      case 'success': return <IconCheck {...iconProps} />;
      case 'error': return <IconX {...iconProps} />;
      case 'message': return <IconBell {...iconProps} />;
      case 'booking': return <IconTicket {...iconProps} />;
      case 'trip': return <IconCar {...iconProps} />;
      case 'warning': return <IconAlertTriangle {...iconProps} />;
      case 'confirmation': return <IconCheck {...iconProps} />;
      case 'reminder': return <IconClock {...iconProps} />;
      default: return <IconInfoCircle {...iconProps} />;
    }
  }

  // 📋 Obtener configuración para cada tipo
  private getTypeConfig(type: NotificationType) {
    return NOTIFICATION_CONFIGS[type] || NOTIFICATION_CONFIGS.info;
  }

  // 🗺️ Mapear tipo de base de datos a tipo visual
  private mapDatabaseTypeToDisplay(dbType: string): NotificationType {
    const typeMapping: Record<string, NotificationType> = {
      'message': 'message',
      'booking': 'booking', 
      'confirmation': 'confirmation',
      'trip': 'trip',
      'trip_change': 'trip',
      'warning': 'warning',
      'error': 'error',
      'success': 'success',
      'info': 'info',
      'reminder': 'reminder'
    };
    
    return typeMapping[dbType] || 'info';
  }

  // Métodos de utilidad eliminados - ya no se necesitan

  // 🎨 Formatear título con emoji si no lo tiene
  private formatTitle(title: string, type: NotificationType): string {
    const config = this.getTypeConfig(type);
    
    // Si el título ya tiene emoji, no añadir otro
    if (title.match(/[\u{1F300}-\u{1F9FF}]/u)) {
      return title;
    }
    
    // Añadir emoji del tipo
    return `${config.emoji} ${title}`;
  }

  // 📝 Formatear mensaje (truncar si es muy largo)
  private formatMessage(message: string): string {
    const maxLength = 120;
    
    if (message.length <= maxLength) {
      return message;
    }
    
    return message.substring(0, maxLength) + '...';
  }

  // 📊 Obtener estadísticas de notificaciones mostradas
  getStats(): { total: number; byType: Record<NotificationType, number> } {
    // En una implementación real, mantendríamos contadores
    // Por ahora retornamos estructura básica
    return {
      total: 0,
      byType: {
        success: 0,
        error: 0,
        info: 0,
        message: 0,
        booking: 0,
        trip: 0,
        warning: 0,
        confirmation: 0,
        reminder: 0
      }
    };
  }
}

// 🎨 Instancia singleton
export const notificationDisplay = NotificationDisplayService.getInstance();