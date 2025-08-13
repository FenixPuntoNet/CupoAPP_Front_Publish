import { notifications } from '@mantine/notifications';
import { ErrorInfo } from '@/utils/errorMapping';
import styles from './ErrorNotification.module.css';

export interface ShowErrorNotificationOptions {
  id?: string;
  autoClose?: number | false;
  withCloseButton?: boolean;
  position?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
}

/**
 * Muestra una notificación de error con estilo personalizado
 */
export function showErrorNotification(
  errorInfo: ErrorInfo, 
  options: ShowErrorNotificationOptions = {}
) {
  const {
    id,
    autoClose = 5000,
    withCloseButton = true,
    position = 'top-center'
  } = options;

  notifications.show({
    id,
    title: (
      <div className={styles.notificationTitle}>
        <span className={styles.notificationIcon}>{errorInfo.icon}</span>
        <span>{errorInfo.title}</span>
      </div>
    ),
    message: errorInfo.message,
    color: errorInfo.color,
    autoClose,
    withCloseButton,
    position,
    className: styles.errorNotification,
    classNames: {
      root: styles.notificationRoot,
      title: styles.notificationTitleText,
      description: styles.notificationMessage,
      closeButton: styles.notificationCloseButton
    },
    styles: {
      root: {
        backgroundColor: errorInfo.color === 'red' ? 'rgba(255, 107, 107, 0.1)' :
                        errorInfo.color === 'orange' ? 'rgba(255, 146, 43, 0.1)' :
                        'rgba(255, 212, 59, 0.1)',
        borderLeft: `4px solid ${
          errorInfo.color === 'red' ? '#ff6b6b' :
          errorInfo.color === 'orange' ? '#ff922b' :
          '#ffd43b'
        }`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${
          errorInfo.color === 'red' ? 'rgba(255, 107, 107, 0.3)' :
          errorInfo.color === 'orange' ? 'rgba(255, 146, 43, 0.3)' :
          'rgba(255, 212, 59, 0.3)'
        }`
      }
    }
  });
}

/**
 * Muestra una notificación de éxito
 */
export function showSuccessNotification(
  title: string,
  message: string,
  options: ShowErrorNotificationOptions = {}
) {
  const {
    id,
    autoClose = 3000,
    withCloseButton = true,
    position = 'top-center'
  } = options;

  notifications.show({
    id,
    title: (
      <div className={styles.notificationTitle}>
        <span className={styles.notificationIcon}>✅</span>
        <span>{title}</span>
      </div>
    ),
    message,
    color: 'green',
    autoClose,
    withCloseButton,
    position,
    className: styles.successNotification,
    classNames: {
      root: styles.notificationRoot,
      title: styles.notificationTitleText,
      description: styles.notificationMessage,
      closeButton: styles.notificationCloseButton
    },
    styles: {
      root: {
        backgroundColor: 'rgba(51, 217, 178, 0.1)',
        borderLeft: '4px solid #33d9b2',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(51, 217, 178, 0.3)'
      }
    }
  });
}

/**
 * Muestra una notificación de información
 */
export function showInfoNotification(
  title: string,
  message: string,
  options: ShowErrorNotificationOptions = {}
) {
  const {
    id,
    autoClose = 4000,
    withCloseButton = true,
    position = 'top-center'
  } = options;

  notifications.show({
    id,
    title: (
      <div className={styles.notificationTitle}>
        <span className={styles.notificationIcon}>ℹ️</span>
        <span>{title}</span>
      </div>
    ),
    message,
    color: 'blue',
    autoClose,
    withCloseButton,
    position,
    className: styles.infoNotification,
    classNames: {
      root: styles.notificationRoot,
      title: styles.notificationTitleText,
      description: styles.notificationMessage,
      closeButton: styles.notificationCloseButton
    },
    styles: {
      root: {
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
        borderLeft: '4px solid #4a90e2',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(74, 144, 226, 0.3)'
      }
    }
  });
}
