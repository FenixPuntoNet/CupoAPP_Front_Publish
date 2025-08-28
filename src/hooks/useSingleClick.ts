import { useRef, useCallback } from 'react';

/**
 * Hook para prevenir múltiples clicks en botones críticos
 * Bloquea el botón durante un tiempo específico después del primer click
 */
export function useSingleClick(
  callback: (...args: any[]) => Promise<any> | any,
  lockDuration: number = 3000 // 3 segundos por defecto
) {
  const isProcessingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const execute = useCallback(async (...args: any[]) => {
    // Si ya está procesando, no hacer nada
    if (isProcessingRef.current) {
      console.warn('🔒 Acción bloqueada: Operación en progreso');
      return;
    }

    // Bloquear inmediatamente
    isProcessingRef.current = true;

    try {
      // Ejecutar la función callback
      const result = await callback(...args);
      
      // Programar desbloqueo después del tiempo especificado
      timeoutRef.current = setTimeout(() => {
        isProcessingRef.current = false;
        console.log('🔓 Botón desbloqueado');
      }, lockDuration);

      return result;
    } catch (error) {
      // En caso de error, desbloquear inmediatamente
      isProcessingRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      throw error;
    }
  }, [callback, lockDuration]);

  const isProcessing = isProcessingRef.current;

  // Función para desbloquear manualmente si es necesario
  const unlock = useCallback(() => {
    isProcessingRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    execute,
    isProcessing,
    unlock
  };
}

/**
 * Hook especializado para botones de publicar viaje
 */
export function usePublishTripClick(callback: (...args: any[]) => Promise<any>) {
  return useSingleClick(callback, 5000); // 5 segundos para publicar viaje
}

/**
 * Hook especializado para botones de reservar
 */
export function useReserveClick(callback: (...args: any[]) => Promise<any>) {
  return useSingleClick(callback, 3000); // 3 segundos para reservar
}
