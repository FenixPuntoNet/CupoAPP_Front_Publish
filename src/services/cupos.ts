import { apiRequest } from '@/config/api';

interface Passenger {
  id: number;
  full_name: string;
  identification_number: string;
  status?: string;
}

interface Booking {
  id: number;
  booking_status: string;
  seats_booked: number;
  total_price: number;
  booking_qr: string;
  booking_date: string;
  user_id: string;
  passengers: Passenger[];
}

interface Trip {
  id: number;
  date_time: string;
  status: string;
  seats?: number;
  seats_reserved?: number;
  price_per_seat?: number;
  user_id?: string; // ID del conductor
  origin: {
    address: string;
    main_text: string;
  };
  destination: {
    address: string;
    main_text: string;
  };
  vehicle: {
    brand: string;
    model: string;
    plate: string;
    color: string;
    year?: number;
  };
  driver: {
    first_name: string;
    last_name: string;
    photo_user: string | null;
    phone_number: string;
  };
}

interface CupoStats {
  total_cupos_sold: number;
  cupos_completed: number;
  cupos_pending: number;
  cupos_cancelled: number;
  total_earnings: number;
  total_seats_sold: number;
  average_price_per_cupo: number;
}

interface CupoWithDetails {
  id: number;
  booking_date: string;
  booking_status: string;
  total_price: number;
  trip_id: number;
  seats_booked: number;
  booking_qr: string;
  trip: Trip | null;
  passengers: Passenger[];
}

// Obtener cupos reservados para un viaje específico (para conductores)
export const getCuposReservados = async (tripId: number): Promise<{ success: boolean; data?: { tripId: number; trip: any; bookings: Booking[]; summary: any }; error?: string }> => {
  try {
    console.log(`🎫 [getCuposReservados] Fetching cupos for trip ${tripId}`);
    
    const response = await apiRequest(`/cupos/reservados?tripId=${tripId}`);
    
    console.log(`✅ [getCuposReservados] Backend response:`, response);
    
    // Validar que la respuesta tenga la estructura esperada
    if (!response || typeof response !== 'object') {
      throw new Error('Respuesta inválida del servidor');
    }

    // El backend actualizado retorna: { tripId, trip, bookings, summary }
    const data = {
      tripId: response.tripId || tripId,
      trip: response.trip || null,
      bookings: response.bookings || [],
      summary: response.summary || {
        total_bookings: 0,
        total_passengers: 0,
        total_seats_booked: 0,
        total_revenue: 0,
        pending_bookings: 0,
        completed_bookings: 0
      }
    };

    console.log(`✅ [getCuposReservados] Processed ${data.bookings.length} bookings with ${data.summary.total_passengers} passengers`);
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error(`❌ [getCuposReservados] Error for trip ${tripId}:`, error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Manejar diferentes tipos de errores
    if (errorMessage.includes('permisos') || errorMessage.includes('403')) {
      return {
        success: false,
        error: 'No tienes permisos para ver los cupos de este viaje'
      };
    }
    
    if (errorMessage.includes('401') || errorMessage.includes('Token')) {
      return {
        success: false,
        error: 'Sesión expirada - por favor vuelve a iniciar sesión'
      };
    }
    
    if (errorMessage.includes('404')) {
      return {
        success: false,
        error: 'Viaje no encontrado'
      };
    }

    return {
      success: false,
      error: errorMessage || 'Error al obtener cupos reservados'
    };
  }
};

// Validar un cupo específico (QR scan)
export const validateCupo = async (bookingId: number, qrCode: string): Promise<{ success: boolean; data?: { message: string; status: string }; error?: string }> => {
  try {
    const response = await apiRequest(`/cupos/validar/${bookingId}`, {
      method: 'POST',
      body: JSON.stringify({ bookingId, qrCode })
    });
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error validating cupo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al validar cupo'
    };
  }
};

// Obtener estadísticas de cupos para un conductor
export const getCuposStats = async (): Promise<{ success: boolean; data?: CupoStats; error?: string }> => {
  try {
    const response = await apiRequest('/cupos/stats');
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error getting cupos stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener estadísticas de cupos'
    };
  }
};

// Obtener mis cupos comprados (como pasajero)
export const getMisCupos = async (): Promise<{ success: boolean; data?: { cupos: CupoWithDetails[] }; error?: string }> => {
  try {
    console.log(`🎫 [getMisCupos] Fetching user's purchased cupos`);
    
    // Intentar el endpoint principal con timeout
    const response = await Promise.race([
      apiRequest('/cupos/mis-cupos'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout después de 10 segundos')), 10000)
      )
    ]);
    
    console.log(`✅ [getMisCupos] Backend response:`, response);
    
    // Validar que la respuesta tenga la estructura esperada
    if (!response || typeof response !== 'object') {
      console.warn(`⚠️ [getMisCupos] Invalid response structure:`, response);
      throw new Error('Respuesta inválida del servidor');
    }

    // El backend debería retornar { cupos: [...] }
    const cupos = Array.isArray(response.cupos) ? response.cupos : [];
    
    console.log(`✅ [getMisCupos] Processed ${cupos.length} cupos`);
    
    return {
      success: true,
      data: { cupos }
    };
  } catch (error) {
    console.error(`❌ [getMisCupos] Error fetching user cupos:`, error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Si es timeout, usar fallback inmediatamente
    if (errorMessage.includes('Timeout')) {
      console.warn(`⏰ [getMisCupos] Request timed out, using safe fallback`);
      return {
        success: true,
        data: { cupos: [] }
      };
    }
    
    // Manejar diferentes tipos de errores
    if (errorMessage.includes('401') || errorMessage.includes('Token')) {
      console.warn(`� [getMisCupos] Authentication error`);
      return {
        success: false,
        error: 'Sesión expirada - por favor vuelve a iniciar sesión'
      };
    }
    
    if (errorMessage.includes('403') || errorMessage.includes('permisos')) {
      console.warn(`� [getMisCupos] Permission error`);
      return {
        success: false,
        error: 'No tienes permisos para ver tus cupos'
      };
    }

    // Para otros errores, usar fallback seguro inmediatamente
    console.warn(`🔧 [getMisCupos] Main endpoint failed, using safe fallback`);
    
    // Intentar mostrar mensaje informativo pero no bloquear la UI
    return {
      success: true,
      data: { cupos: [] },
      error: 'No se pudieron cargar los cupos desde el servidor - mostrando vista sin datos'
    };
  }
};

// Debug endpoint para testing y diagnostico
export const debugCuposReservados = async (tripId: number): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    console.log(`🔧 [debugCuposReservados] Testing debug endpoint for trip ${tripId}`);
    
    const response = await apiRequest(`/cupos/debug/${tripId}`);
    
    console.log(`✅ [debugCuposReservados] Debug response:`, response);
    
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error(`❌ [debugCuposReservados] Debug failed for trip ${tripId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error en debug endpoint'
    };
  }
};

// Debug específico para mis-cupos endpoint
export const debugMisCupos = async (): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    console.log(`🔧 [debugMisCupos] Testing mis-cupos endpoint directly`);
    
    // Intentar llamada directa con más información de debugging
    const response = await apiRequest('/cupos/mis-cupos', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ [debugMisCupos] Direct response:`, response);
    
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error(`❌ [debugMisCupos] Direct call failed:`, error);
    
    // Intentar endpoint de stats como alternativa
    try {
      console.log(`🔧 [debugMisCupos] Trying stats as fallback`);
      const statsResponse = await apiRequest('/cupos/stats');
      
      console.log(`✅ [debugMisCupos] Stats response:`, statsResponse);
      
      return {
        success: true,
        data: { 
          fallback: 'stats',
          stats: statsResponse,
          cupos: [] // Array vacío como fallback seguro
        }
      };
    } catch (statsError) {
      console.error(`❌ [debugMisCupos] Stats fallback also failed:`, statsError);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error en debug mis-cupos'
      };
    }
  }
};
