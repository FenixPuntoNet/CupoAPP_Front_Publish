import { 
  getPendingSafePointInteractions,
  updatePendingInteractionsTripId
} from './safepoints';
import {
  getPendingStopovers,
  updatePendingStopoversTripId
} from './paradas';

// ==================== BACKEND INTEGRATION SERVICE ====================
// Este servicio maneja la integración completa del sistema de trip_id NULL
// para SafePoints y paradas, permitiendo guardar datos antes de publicar
// el viaje y luego migrarlos automáticamente cuando se asigne un trip_id real.

/**
 * INTEGRACIÓN COMPLETA BACKEND: Migrar todas las interacciones pendientes
 * Esta función se llama cuando se publica un viaje para migrar todo
 * lo que estaba guardado con trip_id = NULL al trip_id real.
 */
export async function migrateAllPendingDataToTrip(tripId: number): Promise<{
  success: boolean;
  migrations: {
    safepoints: {
      success: boolean;
      updated_count: number;
      error?: string;
    };
    stopovers: {
      success: boolean;
      updated_count: number;
      error?: string;
    };
  };
  total_updated: number;
  message: string;
  error?: string;
}> {
  try {
    console.log('🚀 BACKEND INTEGRATION: Starting complete migration to trip_id:', tripId);

    // 1. Obtener y migrar SafePoint interactions pendientes
    const pendingSafePointsResult = await getPendingSafePointInteractions();
    let safePointsMigration = { success: false, updated_count: 0, error: '' };

    if (pendingSafePointsResult.success && pendingSafePointsResult.pending_interactions) {
      const interactionIds = pendingSafePointsResult.pending_interactions.map(interaction => interaction.id);
      
      if (interactionIds.length > 0) {
        const updateResult = await updatePendingInteractionsTripId(interactionIds, tripId);
        safePointsMigration = {
          success: updateResult.success,
          updated_count: updateResult.updated_count || 0,
          error: updateResult.error || ''
        };
      } else {
        safePointsMigration = { success: true, updated_count: 0, error: '' };
      }
    } else {
      safePointsMigration = {
        success: false,
        updated_count: 0,
        error: pendingSafePointsResult.error || 'Error getting pending SafePoint interactions'
      };
    }

    // 2. Obtener y migrar stopovers pendientes
    const pendingStopOversResult = await getPendingStopovers();
    let stopoversMigration = { success: false, updated_count: 0, error: '' };

    if (pendingStopOversResult.success && pendingStopOversResult.pending_stopovers) {
      const stopoverIds = pendingStopOversResult.pending_stopovers.map(stopover => stopover.id);
      
      if (stopoverIds.length > 0) {
        const updateResult = await updatePendingStopoversTripId(stopoverIds, tripId);
        stopoversMigration = {
          success: updateResult.success,
          updated_count: updateResult.updated_count || 0,
          error: updateResult.error || ''
        };
      } else {
        stopoversMigration = { success: true, updated_count: 0, error: '' };
      }
    } else {
      stopoversMigration = {
        success: false,
        updated_count: 0,
        error: pendingStopOversResult.error || 'Error getting pending stopovers'
      };
    }

    // 3. Calcular resultados finales
    const totalUpdated = safePointsMigration.updated_count + stopoversMigration.updated_count;
    const overallSuccess = safePointsMigration.success && stopoversMigration.success;

    const result = {
      success: overallSuccess,
      migrations: {
        safepoints: safePointsMigration,
        stopovers: stopoversMigration
      },
      total_updated: totalUpdated,
      message: overallSuccess
        ? `✅ MIGRACIÓN COMPLETA: ${totalUpdated} elementos migrados exitosamente`
        : `⚠️ MIGRACIÓN PARCIAL: Algunos elementos no se pudieron migrar`,
      error: !overallSuccess 
        ? `SafePoints: ${safePointsMigration.error || 'OK'} | Stopovers: ${stopoversMigration.error || 'OK'}`
        : undefined
    };

    console.log('🎉 BACKEND INTEGRATION COMPLETED:', {
      trip_id: tripId,
      safepoints_migrated: safePointsMigration.updated_count,
      stopovers_migrated: stopoversMigration.updated_count,
      total_migrated: totalUpdated,
      overall_success: overallSuccess
    });

    return result;

  } catch (error) {
    console.error('❌ BACKEND INTEGRATION ERROR: Complete migration failed:', error);
    return {
      success: false,
      migrations: {
        safepoints: { success: false, updated_count: 0, error: 'Migration failed' },
        stopovers: { success: false, updated_count: 0, error: 'Migration failed' }
      },
      total_updated: 0,
      message: 'Error en la migración completa',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Obtener resumen de datos pendientes (trip_id = NULL)
 * Útil para mostrar al usuario cuántos datos tiene guardados antes de publicar
 */
export async function getPendingDataSummary(): Promise<{
  success: boolean;
  summary: {
    pending_safepoint_interactions: number;
    pending_stopovers: number;
    total_pending: number;
    has_pending_data: boolean;
  };
  details: {
    safepoints: any[];
    stopovers: any[];
  };
  error?: string;
}> {
  try {
    console.log('📊 Getting pending data summary...');

    // Obtener SafePoint interactions pendientes
    const safePointsResult = await getPendingSafePointInteractions();
    const pendingSafePoints = safePointsResult.success 
      ? safePointsResult.pending_interactions || []
      : [];

    // Obtener stopovers pendientes
    const stopOversResult = await getPendingStopovers();
    const pendingStopovers = stopOversResult.success 
      ? stopOversResult.pending_stopovers || []
      : [];

    const totalPending = pendingSafePoints.length + pendingStopovers.length;

    const summary = {
      pending_safepoint_interactions: pendingSafePoints.length,
      pending_stopovers: pendingStopovers.length,
      total_pending: totalPending,
      has_pending_data: totalPending > 0
    };

    console.log('✅ Pending data summary:', summary);

    return {
      success: true,
      summary,
      details: {
        safepoints: pendingSafePoints,
        stopovers: pendingStopovers
      }
    };

  } catch (error) {
    console.error('❌ Error getting pending data summary:', error);
    return {
      success: false,
      summary: {
        pending_safepoint_interactions: 0,
        pending_stopovers: 0,
        total_pending: 0,
        has_pending_data: false
      },
      details: {
        safepoints: [],
        stopovers: []
      },
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Limpiar datos pendientes (por si el usuario cancela)
 * CUIDADO: Esta función elimina datos que no se han migrado
 */
export async function clearPendingData(): Promise<{
  success: boolean;
  cleared: {
    safepoint_interactions: number;
    stopovers: number;
  };
  message: string;
  error?: string;
}> {
  try {
    console.log('🧹 Clearing pending data (CAREFUL OPERATION)...');

    // Por ahora solo retornamos un mensaje ya que la implementación
    // de eliminación debe ser cuidadosa
    console.warn('⚠️ Clear pending data not implemented yet for safety reasons');

    return {
      success: true,
      cleared: {
        safepoint_interactions: 0,
        stopovers: 0
      },
      message: 'Función de limpieza no implementada por seguridad'
    };

  } catch (error) {
    console.error('❌ Error clearing pending data:', error);
    return {
      success: false,
      cleared: {
        safepoint_interactions: 0,
        stopovers: 0
      },
      message: 'Error limpiando datos pendientes',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Verificar estado del backend para trip_id NULL system
 * Función de diagnóstico para asegurar que el sistema funciona
 */
export async function verifyBackendIntegration(): Promise<{
  success: boolean;
  backend_status: {
    safepoints_service: boolean;
    paradas_service: boolean;
    migration_ready: boolean;
  };
  message: string;
  error?: string;
}> {
  try {
    console.log('🔍 VERIFYING BACKEND INTEGRATION STATUS...');

    // Verificar servicios SafePoints
    const safePointsTest = await getPendingSafePointInteractions();
    const safePointsOK = safePointsTest.success;

    // Verificar servicios paradas  
    const paradasTest = await getPendingStopovers();
    const paradasOK = paradasTest.success;

    const migrationReady = safePointsOK && paradasOK;

    const backendStatus = {
      safepoints_service: safePointsOK,
      paradas_service: paradasOK,
      migration_ready: migrationReady
    };

    const message = migrationReady
      ? '✅ BACKEND INTEGRATION: All services operational'
      : '⚠️ BACKEND INTEGRATION: Some services have issues';

    console.log('🔍 Backend integration verification:', backendStatus);

    return {
      success: migrationReady,
      backend_status: backendStatus,
      message
    };

  } catch (error) {
    console.error('❌ BACKEND INTEGRATION VERIFICATION FAILED:', error);
    return {
      success: false,
      backend_status: {
        safepoints_service: false,
        paradas_service: false,
        migration_ready: false
      },
      message: 'Error verificando integración backend',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// ==================== HOOKS PARA USAR EN COMPONENTES ====================

/**
 * Hook de utilidad para usar la integración backend en componentes
 * (Para usar con useState/useEffect en React)
 */
export const useBackendIntegration = () => {
  return {
    migrateAllPendingDataToTrip,
    getPendingDataSummary,
    clearPendingData,
    verifyBackendIntegration
  };
};

export default {
  migrateAllPendingDataToTrip,
  getPendingDataSummary,
  clearPendingData,
  verifyBackendIntegration,
  useBackendIntegration
};
