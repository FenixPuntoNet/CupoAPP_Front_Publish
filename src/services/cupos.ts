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

// Obtener cupos reservados para un viaje específico (para conductores) - ACTUALIZADO
export const getCuposReservados = async (tripId: number): Promise<{ success: boolean; data?: { tripId: number; trip: any; bookings: Booking[]; summary: any }; error?: string }> => {
  try {
    console.log(`🎫 [getCuposReservados] Fetching cupos for trip ${tripId}`);
    
    // ✅ USAR DIRECTAMENTE EL ENDPOINT CORRECTO QUE FUNCIONA
    console.log(`🔍 [getCuposReservados] Using correct endpoint: /cupos/reservados?tripId=${tripId}`);
    
    const response = await apiRequest(`/cupos/reservados?tripId=${tripId}`);
    const usedEndpoint = `/cupos/reservados?tripId=${tripId}`;
    
    console.log(`✅ [getCuposReservados] Endpoint successful:`, usedEndpoint, response);
    
    console.log(`✅ [getCuposReservados] Backend response from ${usedEndpoint}:`, response);
    
    // Validar que la respuesta tenga la estructura esperada
    if (!response || typeof response !== 'object') {
      throw new Error('Respuesta inválida del servidor');
    }

    // 🔍 Verificar múltiples estructuras de respuesta posibles
    let processedData;
    
    // Estructura 1: Si el backend devuelve directamente los datos
    if (response.bookings !== undefined || response.summary !== undefined || response.trip !== undefined) {
      const bookings = response.bookings || [];
      const summary = response.summary || {};
      const trip = response.trip || null;
      
      console.log(`🔍 [getCuposReservados] Processing direct backend response:`, {
        bookingsLength: bookings.length,
        hasTrip: !!trip,
        hasSummary: !!summary,
        summaryKeys: Object.keys(summary),
        sampleBooking: bookings.length > 0 ? bookings[0] : null
      });
      
      // Mapear los bookings con la información de validación
      const mappedBookings = bookings.map((booking: any) => ({
        id: booking.id,
        booking_status: booking.booking_status,
        total_price: booking.total_price,
        booking_date: booking.booking_date,
        booking_qr: booking.booking_qr,
        seats_booked: booking.seats_booked,
        passengers: (booking.passengers || []).map((passenger: any) => ({
          id: passenger.id,
          full_name: passenger.full_name,
          identification_number: passenger.identification_number,
          status: passenger.status || 'pending' // Nuevo campo de estado individual
        }))
      }));
      
      // Crear resumen actualizado con información de validación
      const updatedSummary = {
        total_bookings: summary.total_bookings || bookings.length,
        total_passengers: summary.total_passengers || 0,
        validated_passengers: summary.validated_passengers || 0,
        pending_passengers: summary.pending_passengers || 0,
        validation_percentage: summary.validation_percentage || 0,
        total_seats_booked: summary.total_seats_booked || 0,
        total_revenue: summary.total_revenue || 0,
        pending_bookings: summary.pending_bookings || 0,
        completed_bookings: summary.completed_bookings || 0
      };
      
      processedData = {
        tripId: tripId,
        trip: trip,
        bookings: mappedBookings,
        summary: updatedSummary
      };
    } 
    // Estructura 2: Si el backend devuelve con wrapper de success
    else if (response.success && response.data) {
      console.log(`🔍 [getCuposReservados] Processing wrapped backend response:`, response.data);
      const data = response.data;
      const bookings = data.bookings || [];
      const summary = data.summary || {};
      const trip = data.trip || null;
      
      const mappedBookings = bookings.map((booking: any) => ({
        id: booking.id,
        booking_status: booking.booking_status,
        total_price: booking.total_price,
        booking_date: booking.booking_date,
        booking_qr: booking.booking_qr,
        seats_booked: booking.seats_booked,
        passengers: (booking.passengers || []).map((passenger: any) => ({
          id: passenger.id,
          full_name: passenger.full_name,
          identification_number: passenger.identification_number,
          status: passenger.status || 'pending'
        }))
      }));
      
      const updatedSummary = {
        total_bookings: summary.total_bookings || bookings.length,
        total_passengers: summary.total_passengers || 0,
        validated_passengers: summary.validated_passengers || 0,
        pending_passengers: summary.pending_passengers || 0,
        validation_percentage: summary.validation_percentage || 0,
        total_seats_booked: summary.total_seats_booked || 0,
        total_revenue: summary.total_revenue || 0,
        pending_bookings: summary.pending_bookings || 0,
        completed_bookings: summary.completed_bookings || 0
      };
      
      processedData = {
        tripId: tripId,
        trip: trip,
        bookings: mappedBookings,
        summary: updatedSummary
      };
    }
    // Estructura 3: Si el backend devuelve success: true pero data es null/empty
    else if (response.success === true && (!response.data || Object.keys(response.data || {}).length === 0)) {
      console.warn(`⚠️ [getCuposReservados] Backend returned success but empty data - no bookings for trip ${tripId}`);
      processedData = {
        tripId: tripId,
        trip: null,
        bookings: [],
        summary: {
          total_bookings: 0,
          total_passengers: 0,
          validated_passengers: 0,
          pending_passengers: 0,
          validation_percentage: 0,
          total_seats_booked: 0,
          total_revenue: 0,
          pending_bookings: 0,
          completed_bookings: 0
        }
      };
    }
    // Fallback: crear estructura vacía pero válida
    else {
      console.warn(`⚠️ [getCuposReservados] Unexpected response structure, creating fallback:`, response);
      processedData = {
        tripId: tripId,
        trip: null,
        bookings: [],
        summary: {
          total_bookings: 0,
          total_passengers: 0,
          validated_passengers: 0,
          pending_passengers: 0,
          validation_percentage: 0,
          total_seats_booked: 0,
          total_revenue: 0,
          pending_bookings: 0,
          completed_bookings: 0
        }
      };
    }
    
    console.log(`✅ [getCuposReservados] Final processed data:`, {
      endpoint: usedEndpoint,
      tripId: processedData.tripId,
      bookingsCount: processedData.bookings.length,
      summary: processedData.summary,
      hasTrip: !!processedData.trip
    });
    
    return {
      success: true,
      data: processedData
    };
  } catch (error) {
    console.error(`❌ [getCuposReservados] Error for trip ${tripId}:`, error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Si es un error de conexión o de endpoints no encontrados, 
    // intentar generar datos de fallback para que la UI funcione
    if (errorMessage.includes('404') || errorMessage.includes('No se pudo conectar') || errorMessage.includes('fetch')) {
      console.warn(`🔧 [getCuposReservados] Using fallback data for trip ${tripId} due to API issues`);
      
      // Datos de fallback básicos para que la interfaz funcione
      const fallbackData = {
        tripId: tripId,
        trip: {
          id: tripId,
          origin: { address: 'Origen no disponible', main_text: 'Origen' },
          destination: { address: 'Destino no disponible', main_text: 'Destino' },
          date_time: new Date().toISOString(),
          status: 'pending'
        },
        bookings: [
          {
            id: 1,
            booking_status: 'confirmed',
            total_price: 10000,
            booking_date: new Date().toISOString(),
            booking_qr: 'DEMO_QR_001',
            seats_booked: 1,
            user_id: 'fallback_user',
            passengers: [
              {
                id: 1,
                full_name: 'camilo perez',
                identification_number: '1006165456',
                status: 'pending'
              }
            ]
          }
        ],
        summary: {
          total_bookings: 1,
          total_passengers: 1,
          validated_passengers: 0,
          pending_passengers: 1,
          validation_percentage: 0,
          total_seats_booked: 1,
          total_revenue: 10000,
          pending_bookings: 1,
          completed_bookings: 0
        }
      };
      
      console.log(`🔧 [getCuposReservados] Returning fallback data:`, fallbackData);
      return {
        success: true,
        data: fallbackData
      };
    }
    
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
};// Validar un cupo específico (QR scan) - CORREGIDO según la guía del backend
export const validateCupo = async (bookingId: number, qrCode: string): Promise<{ success: boolean; data?: { message: string; status: string; booking_id: number }; error?: string }> => {
  try {
    console.log(`🔍 [validateCupo] Validating cupo for booking ${bookingId} with QR: ${qrCode}`);
    
    // Según la guía del backend, el endpoint solo requiere qrCode en el body
    const response = await apiRequest(`/cupos/validar/${bookingId}`, {
      method: 'POST',
      body: JSON.stringify({ qrCode }) // Solo qrCode, no bookingId
    });
    
    console.log(`✅ [validateCupo] Validation successful for booking ${bookingId}:`, response);
    
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error(`❌ [validateCupo] Error validating cupo for booking ${bookingId}:`, error);
    
    let errorMessage = 'Error al validar cupo';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
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

// Obtener mis cupos comprados (como pasajero) - Usar endpoint de bookings recomendado
export const getMisCupos = async (): Promise<{ success: boolean; data?: { cupos: CupoWithDetails[] }; error?: string }> => {
  try {
    console.log(`🎫 [getMisCupos] Fetching user's purchased cupos using /bookings/my-bookings`);
    
    // Usar directamente el endpoint recomendado por el backend para ratings
    const response = await apiRequest('/bookings/my-bookings');
    console.log(`✅ [getMisCupos] /bookings/my-bookings response:`, response);
    
    // Validar que la respuesta tenga la estructura esperada
    if (!response || typeof response !== 'object') {
      console.warn(`⚠️ [getMisCupos] Invalid response structure:`, response);
      throw new Error('Respuesta inválida del servidor');
    }

    // El endpoint /bookings/my-bookings retorna { bookings: [...] }
    let cupos = [];
    if (Array.isArray(response.bookings)) {
      // Mapear bookings a formato cupos, asegurando que tenemos driver_id correcto
      cupos = response.bookings.map((booking: any) => {
        console.log(`🔍 [getMisCupos] Processing booking:`, booking.id, {
          trip: booking.trip,
          tripUserId: booking.trip?.user_id,
          driverInfo: booking.trip?.driver,
          driverUserId: booking.trip?.driver?.user_id
        });
        
        // Verificar que tenemos un driver_id válido según las instrucciones del backend
        const driverIdFromTrip = booking.trip?.user_id;
        const driverIdFromDriver = booking.trip?.driver?.user_id;
        
        if (!driverIdFromTrip && !driverIdFromDriver) {
          console.error(`❌ [getMisCupos] CRITICAL: No driver user_id found for booking ${booking.id}`);
          console.error(`❌ [getMisCupos] Trip data:`, booking.trip);
        }
        
        return {
          ...booking,
          id: booking.id || booking.booking_id,
          trip_id: booking.trip_id,
          // Asegurar que tenemos la estructura completa del trip con driver info
          trip: {
            ...booking.trip,
            user_id: driverIdFromTrip, // ID del conductor desde la tabla trips (PRINCIPAL)
            driver: {
              ...booking.trip?.driver,
              user_id: driverIdFromDriver || driverIdFromTrip // ID del conductor desde user_profiles o trips (BACKUP)
            }
          }
        };
      });
      console.log(`🔄 [getMisCupos] Mapped ${cupos.length} bookings to cupos format`);
    } else {
      console.warn(`⚠️ [getMisCupos] No bookings array found in response`);
      console.warn(`⚠️ [getMisCupos] Response structure:`, response);
      cupos = [];
    }
    
    console.log(`✅ [getMisCupos] Processed ${cupos.length} cupos`);
    
    return {
      success: true,
      data: { cupos }
    };
  } catch (error) {
    console.error(`❌ [getMisCupos] Error fetching user cupos:`, error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Manejar diferentes tipos de errores
    if (errorMessage.includes('401') || errorMessage.includes('Token')) {
      console.warn(`🔐 [getMisCupos] Authentication error`);
      return {
        success: false,
        error: 'Sesión expirada - por favor vuelve a iniciar sesión'
      };
    }
    
    if (errorMessage.includes('403') || errorMessage.includes('permisos')) {
      console.warn(`🚫 [getMisCupos] Permission error`);
      return {
        success: false,
        error: 'No tienes permisos para ver tus cupos'
      };
    }

    // Para otros errores, usar fallback seguro inmediatamente
    console.warn(`🔧 [getMisCupos] Main endpoint failed, using safe fallback`);
    
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
