import { notifications } from '@mantine/notifications';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

export interface ToastOptions {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  autoClose?: number | boolean;
  persistent?: boolean;
}

/**
 * Servicio de notificaciones mejorado para la aplicación
 */
export class NotificationService {
  static show(options: ToastOptions) {
    const {
      title,
      message,
      type = 'info',
      autoClose = 4000,
      persistent = false
    } = options;

    const config = {
      title,
      message,
      autoClose: persistent ? false : autoClose,
      withCloseButton: true,
      styles: {
        root: {
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
        },
        title: {
          color: 'white',
          fontWeight: 600,
        },
        description: {
          color: 'rgba(255, 255, 255, 0.8)',
        },
      },
    };

    switch (type) {
      case 'success':
        notifications.show({
          ...config,
          color: 'green',
          icon: <Check size={18} />,
        });
        break;
      case 'error':
        notifications.show({
          ...config,
          color: 'red',
          icon: <X size={18} />,
        });
        break;
      case 'warning':
        notifications.show({
          ...config,
          color: 'orange',
          icon: <AlertTriangle size={18} />,
        });
        break;
      case 'info':
      default:
        notifications.show({
          ...config,
          color: 'blue',
          icon: <Info size={18} />,
        });
        break;
    }
  }

  static success(message: string, title?: string) {
    this.show({ message, title, type: 'success' });
  }

  static error(message: string, title?: string, persistent = false) {
    this.show({ message, title, type: 'error', persistent });
  }

  static warning(message: string, title?: string) {
    this.show({ message, title, type: 'warning' });
  }

  static info(message: string, title?: string) {
    this.show({ message, title, type: 'info' });
  }

  static sessionExpired() {
    this.show({
      title: 'Sesión expirada',
      message: 'Tu sesión ha expirado por inactividad. Serás redirigido al login.',
      type: 'warning',
      autoClose: 6000,
    });
  }

  static sessionRestored() {
    this.show({
      title: 'Sesión restaurada',
      message: 'Tu sesión se ha restaurado correctamente.',
      type: 'success',
      autoClose: 3000,
    });
  }

  static connectionLost() {
    this.show({
      title: 'Sin conexión',
      message: 'Se ha perdido la conexión a internet. Verifica tu conectividad.',
      type: 'error',
      persistent: true,
    });
  }

  static connectionRestored() {
    this.show({
      title: 'Conexión restaurada',
      message: 'La conexión a internet se ha restablecido.',
      type: 'success',
      autoClose: 3000,
    });
  }

  static clear() {
    notifications.clean();
  }
}

export default NotificationService;
