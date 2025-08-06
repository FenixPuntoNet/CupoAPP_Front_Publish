import { apiRequest } from '@/config/api';

/**
 * Servicio de Actividades - Funciones para gestión de viajes activos
 * 
 * NOTA: Las funciones principales se han migrado a @/services/viajes.ts
 * Este archivo mantiene solo funciones auxiliares y de compatibilidad.
 */

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export interface Activity {
  id: number;
  type: string;
  description: string;
  date: string;
  status: string;
  details?: any;
  title?: string;
  amount?: number;
  timestamp?: string;
}

export interface ActivitySummary {
  total_trips: number;
  active_trips: number;
  completed_trips: number;
  cancelled_trips: number;
  total_earnings: number;
  total_passengers: number;
  average_rating: number;
  driver_trips?: number;
  passenger_bookings?: number;
  referrals_made?: number;
  unicoins_balance?: number;
}

// ============================================================================
// FUNCIONES MIGRADAS A @/services/viajes.ts
// ============================================================================

/**
 * Obtener conteo de pasajeros de un viaje
 * @deprecated Usar getTripPassengerCount de @/services/viajes en su lugar
 */
export async function getTripPassengerCount(tripId: number): Promise<{ success: boolean; data?: { total_passengers: number }; error?: string }> {
  console.warn('⚠️ [actividades.ts] DEPRECATED: Use getTripPassengerCount from @/services/viajes instead');
  
  try {
    // Importar y usar la función del servicio de viajes
    const { getTripPassengerCount: getPassengerCountFromViajes } = await import('@/services/viajes');
    return await getPassengerCountFromViajes(tripId);
  } catch (error) {
    console.error(`❌ [actividades.ts] Error redirecting to viajes service:`, error);
    return {
      success: false,
      error: 'Error al obtener información de pasajeros'
    };
  }
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Obtener resumen de actividades del conductor
 */
export async function getActivitySummary(userId?: string): Promise<{ success: boolean; data?: { summary: ActivitySummary }; error?: string }> {
  try {
    const endpoint = userId ? `/actividades/summary?userId=${userId}` : '/actividades/summary';
    const response = await apiRequest(endpoint);
    
    return {
      success: true,
      data: {
        summary: response.summary || {
          total_trips: 0,
          active_trips: 0,
          completed_trips: 0,
          cancelled_trips: 0,
          total_earnings: 0,
          total_passengers: 0,
          average_rating: 0
        }
      }
    };
  } catch (error) {
    console.error('Error getting activity summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener resumen de actividades'
    };
  }
}

/**
 * Obtener estadísticas básicas de actividad de un conductor
 */
export async function getDriverActivityStats(userId?: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const endpoint = userId ? `/actividades/stats?userId=${userId}` : '/actividades/stats';
    const response = await apiRequest(endpoint);
    
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error getting driver activity stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener estadísticas de actividad'
    };
  }
}

/**
 * Obtener historial de actividades recientes
 */
export async function getRecentActivities(limit: number = 10): Promise<{ success: boolean; data?: { activities: Activity[] }; error?: string }> {
  try {
    const response = await apiRequest(`/actividades/recent?limit=${limit}`);
    
    return {
      success: true,
      data: {
        activities: response.activities || []
      }
    };
  } catch (error) {
    console.error('Error getting recent activities:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener actividades recientes'
    };
  }
}

/**
 * Validar estado de un viaje para determinar acciones disponibles
 */
export function validateTripActions(tripStatus: string, seatsReserved: number = 0): {
  canStart: boolean;
  canFinish: boolean;
  canCancel: boolean;
  canEdit: boolean;
} {
  const status = tripStatus?.toLowerCase();
  
  return {
    canStart: status === 'active',
    canFinish: status === 'in_progress',
    canCancel: status === 'active' && seatsReserved === 0,
    canEdit: status === 'active'
  };
}

/**
 * Formatear información de viaje para mostrar en UI
 */
export function formatTripInfo(trip: any): {
  statusLabel: string;
  statusColor: string;
  timeInfo: string;
  passengerInfo: string;
} {
  const status = trip.status?.toLowerCase();
  
  let statusLabel = 'Desconocido';
  let statusColor = 'gray';
  
  switch (status) {
    case 'active':
      statusLabel = 'Activo';
      statusColor = 'blue';
      break;
    case 'in_progress':
      statusLabel = 'En progreso';
      statusColor = 'yellow';
      break;
    case 'completed':
      statusLabel = 'Finalizado';
      statusColor = 'green';
      break;
    case 'cancelled':
      statusLabel = 'Cancelado';
      statusColor = 'red';
      break;
  }
  
  const timeInfo = trip.date_time ? new Date(trip.date_time).toLocaleString('es-ES') : 'Fecha no disponible';
  const totalSeats = Number(trip.seats || 0);
  const reservedSeats = Number(trip.seats_reserved || 0);
  const passengerInfo = `${reservedSeats}/${totalSeats} cupos`;
  
  return {
    statusLabel,
    statusColor,
    timeInfo,
    passengerInfo
  };
}

export default {
  getTripPassengerCount,
  getActivitySummary,
  getDriverActivityStats,
  getRecentActivities,
  validateTripActions,
  formatTripInfo
};
