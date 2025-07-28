import { apiRequest } from '@/config/api';

export interface ActivitySummary {
  driver_trips: number;
  passenger_bookings: number;
  wallet_transactions: number;
  total_earned: number;
  total_spent: number;
  referrals_made: number;
  ratings_received: number;
  active_chats: number;
  unicoins_balance: number;
}

export interface ActivitySummaryResponse {
  summary: ActivitySummary;
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  amount?: number;
}

export interface RecentActivitiesResponse {
  activities: Activity[];
}

export interface DriverTripStats {
  count: number;
  earnings: number;
  completed: number;
  cancelled: number;
}

export interface PassengerBookingStats {
  count: number;
  spending: number;
  confirmed: number;
  cancelled: number;
}

export interface WalletTransactionStats {
  count: number;
  total_earned: number;
  total_spent: number;
}

export interface ActivityStats {
  driver_trips: DriverTripStats;
  passenger_bookings: PassengerBookingStats;
  wallet_transactions: WalletTransactionStats;
  net_balance: number;
}

export interface ActivityStatsResponse {
  period_days: number;
  stats: ActivityStats;
}

// Obtener resumen de actividades del usuario
export async function getActivitySummary(): Promise<{ success: boolean; data?: ActivitySummaryResponse; error?: string }> {
  try {
    const data = await apiRequest('/actividades/summary', {
      method: 'GET'
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error in getActivitySummary:', error);
    return { 
      success: false, 
      error: 'Error de conexión al obtener resumen de actividades' 
    };
  }
}

// Obtener actividad reciente del usuario
export async function getRecentActivities(limit: number = 20): Promise<{ success: boolean; data?: RecentActivitiesResponse; error?: string }> {
  try {
    const data = await apiRequest(`/actividades/recent?limit=${limit}`, {
      method: 'GET'
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error in getRecentActivities:', error);
    return { 
      success: false, 
      error: 'Error de conexión al obtener actividades recientes' 
    };
  }
}

// Obtener estadísticas de actividad por período
export async function getActivityStats(period: number = 30): Promise<{ success: boolean; data?: ActivityStatsResponse; error?: string }> {
  try {
    const data = await apiRequest(`/actividades/stats?period=${period}`, {
      method: 'GET'
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error in getActivityStats:', error);
    return { 
      success: false, 
      error: 'Error de conexión al obtener estadísticas de actividades' 
    };
  }
}

// Función para obtener el resumen de cupos reservados de un viaje
export async function getTripPassengerCount(tripId: number): Promise<{ success: boolean; data?: { total_passengers: number }; error?: string }> {
  try {
    console.log(`🎫 [getTripPassengerCount] Fetching passenger count for trip ${tripId}`);
    
    // Intentar el endpoint actualizado con consultas simples
    const data = await apiRequest(`/cupos/reservados?tripId=${tripId}`, {
      method: 'GET'
    });

    console.log(`✅ [getTripPassengerCount] Backend response for trip ${tripId}:`, data);

    // El endpoint actualizado retorna un summary con total_passengers
    const totalPassengers = data?.summary?.total_passengers || 0;
    
    return { 
      success: true, 
      data: { 
        total_passengers: totalPassengers 
      } 
    };
  } catch (error) {
    // Log detallado para debugging
    console.warn(`⚠️ [getTripPassengerCount] Backend error for trip ${tripId}:`, error);
    
    // Verificar el tipo específico de error
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Error de permisos (403)
    if (errorMessage.includes('permisos') || errorMessage.includes('403')) {
      console.warn(`🔒 [getTripPassengerCount] Permission denied for trip ${tripId}`);
      return { 
        success: false, 
        error: 'Sin permisos para ver los cupos de este viaje' 
      };
    }

    // Error de autenticación (401)
    if (errorMessage.includes('401') || errorMessage.includes('Token')) {
      console.warn(`🔑 [getTripPassengerCount] Authentication error for trip ${tripId}`);
      return { 
        success: false, 
        error: 'Sesión expirada - por favor vuelve a iniciar sesión' 
      };
    }

    // Para otros errores, intentar endpoint de debug si está disponible
    try {
      console.warn(`🔧 [getTripPassengerCount] Trying debug endpoint for trip ${tripId}`);
      const debugData = await apiRequest(`/cupos/debug/${tripId}`, {
        method: 'GET'
      });
      
      // Si el debug funciona, usar los datos básicos
      if (debugData && debugData.basic_bookings) {
        const passengerCount = debugData.basic_bookings.reduce((sum: number, booking: any) => 
          sum + (booking.seats_booked || 0), 0);
        
        console.log(`🔧 [getTripPassengerCount] Debug endpoint successful, passenger count: ${passengerCount}`);
        return { 
          success: true, 
          data: { 
            total_passengers: passengerCount 
          } 
        };
      }
    } catch (debugError) {
      console.warn(`� [getTripPassengerCount] Debug endpoint also failed for trip ${tripId}:`, debugError);
    }

    // Último recurso: usar endpoint de stats como fallback
    try {
      console.warn(`📊 [getTripPassengerCount] Trying stats fallback for trip ${tripId}`);
      await apiRequest(`/cupos/stats`, {
        method: 'GET'
      });
      
      // Si el endpoint de stats funciona, significa que el servicio está activo
      console.warn(`📊 [getTripPassengerCount] Stats endpoint working, using safe fallback`);
      return { 
        success: true, 
        data: { 
          total_passengers: 0 // Fallback seguro - mejor mostrar 0 que fallar
        } 
      };
    } catch (fallbackError) {
      console.error(`❌ [getTripPassengerCount] All endpoints failed for trip ${tripId}:`, fallbackError);
      
      return { 
        success: false, 
        error: 'Error al obtener información de pasajeros - servicio temporalmente no disponible' 
      };
    }
  }
}
