import { useCallback } from 'react';
import { mapBackendError, mapValidationError, ErrorInfo } from '@/utils/errorMapping';
import { showErrorNotification, showSuccessNotification, showInfoNotification } from '@/components/ErrorNotification';

export interface UseErrorHandlingOptions {
  defaultPosition?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
  defaultAutoClose?: number | false;
}

/**
 * Hook para manejar errores de forma consistente en toda la aplicación
 */
export function useErrorHandling(options: UseErrorHandlingOptions = {}) {
  const { defaultPosition = 'top-center', defaultAutoClose = 5000 } = options;

  /**
   * Maneja errores del backend mostrando notificaciones amigables
   */
  const handleBackendError = useCallback((error: string | Error | unknown, customOptions: any = {}) => {
    const errorMessage = error instanceof Error ? error.message : String(error || 'Error desconocido');
    const errorInfo = mapBackendError(errorMessage);
    
    showErrorNotification(errorInfo, {
      position: defaultPosition,
      autoClose: defaultAutoClose,
      ...customOptions
    });

    // Log para debugging
    console.error('Backend error handled:', {
      originalError: error,
      mappedError: errorInfo,
      timestamp: new Date().toISOString()
    });

    return errorInfo;
  }, [defaultPosition, defaultAutoClose]);

  /**
   * Maneja errores de validación del frontend
   */
  const handleValidationError = useCallback((field: string, value: string, customOptions: any = {}) => {
    const validationError = mapValidationError(field, value);
    
    if (validationError) {
      showErrorNotification(validationError, {
        position: defaultPosition,
        autoClose: defaultAutoClose,
        ...customOptions
      });
    }

    return validationError;
  }, [defaultPosition, defaultAutoClose]);

  /**
   * Maneja múltiples errores de validación
   */
  const handleValidationErrors = useCallback((validationErrors: Array<{ field: string; value: string; message?: string }>, customOptions: any = {}) => {
    const errors = validationErrors
      .map(({ field, value, message }) => {
        if (message) {
          return {
            title: `Error en ${field}`,
            message,
            color: 'orange' as const,
            icon: '⚠️'
          };
        }
        return mapValidationError(field, value);
      })
      .filter(Boolean) as ErrorInfo[];

    if (errors.length > 0) {
      // Mostrar solo el primer error para no abrumar al usuario
      showErrorNotification(errors[0], {
        position: defaultPosition,
        autoClose: defaultAutoClose,
        ...customOptions
      });

      // Log todos los errores para debugging
      console.warn('Multiple validation errors:', errors);
    }

    return errors;
  }, [defaultPosition, defaultAutoClose]);

  /**
   * Muestra mensaje de éxito
   */
  const showSuccess = useCallback((title: string, message: string, customOptions: any = {}) => {
    showSuccessNotification(title, message, {
      position: defaultPosition,
      autoClose: 3000,
      ...customOptions
    });
  }, [defaultPosition]);

  /**
   * Muestra mensaje informativo
   */
  const showInfo = useCallback((title: string, message: string, customOptions: any = {}) => {
    showInfoNotification(title, message, {
      position: defaultPosition,
      autoClose: 4000,
      ...customOptions
    });
  }, [defaultPosition]);

  /**
   * Maneja errores de operaciones asíncronas con loading state
   */
  const handleAsyncOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    options: {
      successTitle?: string;
      successMessage?: string;
      showSuccessNotification?: boolean;
      errorPrefix?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: any) => void;
    } = {}
  ) => {
    const {
      successTitle,
      successMessage,
      showSuccessNotification: showSuccess = false,
      errorPrefix = '',
      onSuccess,
      onError
    } = options;

    try {
      const result = await operation();
      
      if (showSuccess && successTitle && successMessage) {
        showSuccessNotification(successTitle, successMessage, {
          position: defaultPosition,
          autoClose: 3000
        });
      }

      onSuccess?.(result);
      return { success: true, data: result, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const fullErrorMessage = errorPrefix ? `${errorPrefix}: ${errorMessage}` : errorMessage;
      
      handleBackendError(fullErrorMessage);
      onError?.(error);
      
      return { success: false, data: null, error: errorMessage };
    }
  }, [defaultPosition, handleBackendError]);

  return {
    handleBackendError,
    handleValidationError,
    handleValidationErrors,
    handleAsyncOperation,
    showSuccess,
    showInfo,
    // Aliases for convenience
    error: handleBackendError,
    success: showSuccess,
    info: showInfo
  };
}
