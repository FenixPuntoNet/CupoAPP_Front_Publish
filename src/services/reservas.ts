import { apiRequest, clearApiCache } from '@/config/api';

// Interfaces para reservas
export interface BookingPassenger {
  fullName: string;
  identificationNumber: string;
  phone?: string;
  email?: string;
}

export interface TripForBooking {
  id: number;
  date_time: string;
  price_per_seat: number;
  seats: number;
  seats_reserved: number;
  status: string;
  origin: {
    id: number;
    address: string;
    main_text: string;
    latitude: string;
    longitude: string;
  };
  destination: {
    id: number;
    address: string;
    main_text: string;
    latitude: string;
    longitude: string;
  };
  route?: {
    start_address: string;
    end_address: string;
    duration: string;
    distance: string;
  };
  vehicle: {
    brand: string;
    model: string;
    year: number;
    plate: string;
    color: string;
    photo_url: string;
  };
  driver: {
    first_name: string;
    last_name: string;
    photo_user: string;
    phone_number: string;
    average_rating: number;
  };
  available_seats: number;
}

export interface BookingResult {
  message: string;
  booking: {
    id: number;
    booking_qr: string;
    status: string;
    total_price: number;
    seats_reserved: number;
    passengers: number;
  };
}

export interface MyBooking {
  id: number;
  booking_date: string;
  booking_status: string;
  total_price: number;
  trip_id: number;
  seats_booked: number;
  booking_qr: string;
  trip: TripForBooking | null;
  passengers: BookingPassenger[];
}

export interface BookingDetails {
  id: string | number;
  trip_id?: string;
  seats_reserved?: number;
  seats_booked?: number;
  status?: string;
  booking_status?: string;
  total_price: number;
  created_at?: string;
  booking_date?: string;
  booking_qr?: string;
  trip?: {
    id: string;
    date_time: string;
    status: string;
    price_per_seat: number;
    available_seats: number;
    origin?: {
      address: string;
      main_text?: string;
    };
    destination?: {
      address: string;
      main_text?: string;
    };
    route?: {
      id: string;
      name: string;
      origin: string;
      destination: string;
      distance: number;
    };
    driver?: {
      first_name: string;
      last_name?: string;
      photo_user?: string;
      phone_number?: string;
      average_rating?: number;
    };
    vehicle?: {
      brand: string;
      model: string;
      year: number;
      plate: string;
      color: string;
    };
  };
  driver?: {
    user_id: string;
    names: string;
    photo: string;
    phone: string;
    average_rating: number;
  };
  vehicle?: {
    brand: string;
    model: string;
    year: number;
    plate: string;
    color: string;
  };
  passengers?: Array<{
    user_id: string;
    names: string;
    phone: string;
    seats: number;
  }>;
}

// Buscar viajes disponibles
export const searchTrips = async (
  origin?: string,
  destination?: string,
  date?: string,
  passengers?: number
): Promise<{ success: boolean; data?: { trips: TripForBooking[]; total: number }; error?: string }> => {
  try {
    const params = new URLSearchParams();
    if (origin) params.append('origin', origin);
    if (destination) params.append('destination', destination);
    if (date) params.append('date', date);
    if (passengers) params.append('passengers', passengers.toString());

    const response = await apiRequest(`/reservas/search?${params.toString()}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error searching trips:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error buscando viajes'
    };
  }
};

// Obtener detalles de un viaje específico
export const getTripDetails = async (tripId: number): Promise<{ success: boolean; data?: TripForBooking; error?: string }> => {
  try {
    const response = await apiRequest(`/reservas-pasajero/trip/${tripId}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error getting trip details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error obteniendo detalles del viaje'
    };
  }
};

// Reservar un viaje
export const bookTrip = async (
  tripId: number,
  passengers: BookingPassenger[],
  seatsNeeded: number
): Promise<{ success: boolean; data?: BookingResult; error?: string }> => {
  try {
    // ✅ CRITICAL DEBUG: Verificar autenticación antes de crear reserva
    const currentToken = localStorage.getItem('auth_token');
    console.log('🎫 [RESERVA-AUTH-DEBUG] About to create reservation...');
    console.log('🎫 [RESERVA-AUTH-DEBUG] Auth token exists:', currentToken ? 'YES' : 'NO');
    console.log('🎫 [RESERVA-AUTH-DEBUG] Token length:', currentToken ? currentToken.length : 0);
    console.log('🎫 [RESERVA-AUTH-DEBUG] Token preview:', currentToken ? currentToken.substring(0, 50) + '...' : 'NULL');
    
    // ✅ CRÍTICO: Verificar que el usuario está realmente autenticado Y no desactivado
    try {
      const { apiRequest } = await import('@/config/api');
      const userCheck = await apiRequest('/auth/me', { method: 'GET' });
      console.log('🎫 [RESERVA-AUTH-DEBUG] User auth verification:', userCheck ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');
      console.log('🎫 [RESERVA-AUTH-DEBUG] User ID:', userCheck?.id);
      
      // ✅ NUEVO: Verificar estado de la cuenta
      if (userCheck?.user_metadata?.account_deactivated === true) {
        console.error('🚫 [RESERVA-AUTH-DEBUG] Account is DEACTIVATED');
        
        // ✅ INTENTAR REACTIVACIÓN AUTOMÁTICA
        try {
          console.log('🔄 [AUTO-REACTIVATE] Attempting automatic account reactivation...');
          const reactivateResponse = await apiRequest('/auth/reactivate-account', {
            method: 'POST',
            body: JSON.stringify({
              reason: 'auto_reactivation_for_booking',
              restore_access: true
            })
          });
          
          if (reactivateResponse.success) {
            console.log('✅ [AUTO-REACTIVATE] Account reactivated successfully');
            // Continuar con la reserva
          } else {
            throw new Error('No se pudo reactivar automáticamente la cuenta.');
          }
          
        } catch (reactivateError) {
          console.error('❌ [AUTO-REACTIVATE] Failed:', reactivateError);
          throw new Error('Tu cuenta está desactivada. Por favor, contacta soporte para reactivarla o intenta reactivarla desde el perfil.');
        }
      }
      
      if (userCheck?.user_metadata?.account_deleted === true) {
        console.error('🚫 [RESERVA-AUTH-DEBUG] Account is DELETED');
        
        // ✅ INTENTAR RESTAURACIÓN AUTOMÁTICA
        try {
          console.log('🔄 [AUTO-RESTORE] Attempting automatic account restoration...');
          const restoreResponse = await apiRequest('/auth/restore-account', {
            method: 'POST',
            body: JSON.stringify({
              reason: 'auto_restoration_for_booking',
              restore_access: true
            })
          });
          
          if (restoreResponse.success) {
            console.log('✅ [AUTO-RESTORE] Account restored successfully');
            // Continuar con la reserva
          } else {
            throw new Error('No se pudo restaurar automáticamente la cuenta.');
          }
          
        } catch (restoreError) {
          console.error('❌ [AUTO-RESTORE] Failed:', restoreError);
          throw new Error('Tu cuenta está marcada como eliminada. Por favor, contacta soporte para restaurarla.');
        }
      }
      
      console.log('✅ [RESERVA-AUTH-DEBUG] Account status is ACTIVE');
      
    } catch (authError) {
      console.error('🎫 [RESERVA-AUTH-DEBUG] Auth verification failed:', authError);
      
      // Si el error es específico de cuenta desactivada/eliminada, lanzarlo
      if (authError instanceof Error && 
          (authError.message.includes('desactivada') || authError.message.includes('eliminada'))) {
        throw authError;
      }
    }
    
    const requestData = {
      trip_id: tripId,
      passengers: passengers.map(p => ({
        fullName: p.fullName,
        identificationNumber: p.identificationNumber
      })),
      seats_booked: seatsNeeded
    };
    
    console.log('🎫 Booking trip with data:', requestData);
    
    const response = await apiRequest('/reservas/create', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
    
    console.log('✅ Booking response:', response);
    
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('❌ Error booking trip:', error);
    
    // Mejorar el logging del error
    let errorMessage = 'Error reservando viaje';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('📋 Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Obtener mis reservas como pasajero
export const getMyBookings = async (): Promise<{ success: boolean; data?: { bookings: MyBooking[] }; error?: string }> => {
  try {
    // ✅ ENDPOINT CORREGIDO SEGÚN LA GUÍA DEL BACKEND
    const response = await apiRequest('/reservas/user-bookings');
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error getting my bookings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error obteniendo mis reservas'
    };
  }
};

// Obtener detalles de una reserva específica
export const getBookingDetails = async (bookingId: number): Promise<{ success: boolean; data?: BookingDetails; error?: string }> => {
  try {
    console.log(`🔍 [getBookingDetails] Fetching details for booking: ${bookingId}`);
    
    // ✅ Usar el nuevo endpoint correcto: /reservas/booking/:bookingId
    const response = await apiRequest(`/reservas/booking/${bookingId}`);
    
    console.log(`✅ [getBookingDetails] Raw response:`, response);
    
    // ✅ Según la guía, el backend devuelve { success: true, data: {...} }
    if (response.success && response.data) {
      console.log(`✅ [getBookingDetails] Success with data:`, response.data);
      return {
        success: true,
        data: response.data
      };
    } else {
      console.log(`❌ [getBookingDetails] Response without success or data:`, response);
      return {
        success: false,
        error: 'No se encontraron datos de la reserva'
      };
    }
  } catch (error) {
    console.error('❌ [getBookingDetails] Error getting booking details:', error);
    
    // Si falla, intentar con el endpoint de todas las reservas como fallback
    try {
      console.log(`🔄 [getBookingDetails] Trying fallback with my-bookings for booking: ${bookingId}`);
      
      const allBookingsResponse = await apiRequest('/bookings/my-bookings');
      
      if (allBookingsResponse && allBookingsResponse.bookings) {
        const booking = allBookingsResponse.bookings.find((b: any) => b.id === bookingId);
        
        if (booking) {
          console.log(`✅ [getBookingDetails] Found booking in my-bookings:`, booking);
          return {
            success: true,
            data: booking
          };
        } else {
          return {
            success: false,
            error: 'Reserva no encontrada'
          };
        }
      }
      
      return {
        success: false,
        error: 'No se pudieron obtener las reservas'
      };
    } catch (fallbackError) {
      console.error('❌ [getBookingDetails] Fallback also failed:', fallbackError);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo detalles de la reserva'
      };
    }
  }
};

// Cancelar una reserva
export const cancelBooking = async (bookingId: number, cancellationReason?: string): Promise<{ success: boolean; error?: string; message?: string }> => {
  try {
    console.log(`🚫 [cancelBooking] Attempting to cancel booking ${bookingId} with reason:`, cancellationReason);
    
    const response = await apiRequest(`/reservas/cancel/${bookingId}`, {
      method: 'POST',
      body: JSON.stringify({
        cancellation_reason: cancellationReason || 'Usuario canceló la reserva'
      })
    });
    
    console.log(`✅ [cancelBooking] Booking ${bookingId} cancelled successfully:`, response);
    
    // 🧹 Limpiar cache después de cancelación exitosa para refrescar los datos
    clearApiCache();
    console.log(`🔄 [cancelBooking] Cache cleared after successful cancellation`);
    
    return {
      success: true,
      message: response.message || 'Reserva cancelada exitosamente'
    };
  } catch (error) {
    console.error(`❌ [cancelBooking] Error canceling booking ${bookingId}:`, error);
    
    // Extraer el mensaje de error adecuado
    let errorMessage = 'Error cancelando reserva';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Mensajes específicos para diferentes errores comunes
      if (errorMessage.includes('No puedes cancelar la reserva con menos de 2 horas')) {
        errorMessage = 'No puedes cancelar la reserva con menos de 2 horas de anticipación. Para cancelaciones urgentes, contacta al conductor directamente.';
      } else if (errorMessage.includes('Error al cancelar la reserva')) {
        errorMessage = 'Ocurrió un error interno al procesar la cancelación. Por favor intenta nuevamente o contacta al soporte.';
      } else if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
        errorMessage = 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.';
      } else if (errorMessage.includes('forbidden') || errorMessage.includes('403')) {
        errorMessage = 'No tienes permisos para cancelar esta reserva.';
      } else if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        errorMessage = 'La reserva no fue encontrada o ya fue cancelada.';
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Validar código QR
export const validateQR = async (bookingQr: string, bookingId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    await apiRequest(`/cupos/validar/${bookingId}`, {
      method: 'POST',
      body: JSON.stringify({
        booking_qr: bookingQr
      })
    });
    return {
      success: true
    };
  } catch (error) {
    console.error('Error validating QR:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error validando QR'
    };
  }
};

// Obtener estadísticas de reservas del usuario
export const getBookingStats = async (): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const response = await apiRequest('/cupos/stats');
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error getting booking stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error obteniendo estadísticas'
    };
  }
};

// =====================================================
// FUNCIONES DE SAFEPOINTS PARA RESERVAS - BACKEND CORREGIDO
// =====================================================

export interface SafePoint {
  id: number;
  name: string;
  category: string;
  category_display_name?: string;
  icon_name?: string;
  color_hex?: string;
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  features?: any;
  rating_average?: number;
  usage_count?: number;
}

export interface SafePointOption extends SafePoint {
  is_preferred: boolean;
  preference_level: 'preferred' | 'available';
  is_currently_selected: boolean;
  interaction_id: number;
  interaction_type: string;
  created_at: string;
}

// Obtener SafePoints disponibles para un booking (endpoint principal corregido)
export const getBookingAvailableSafePoints = async (bookingId: number): Promise<{
  success: boolean;
  booking_id: number;
  trip_id: number;
  available_safepoints: {
    pickup_options: SafePointOption[];
    dropoff_options: SafePointOption[];
    pickup_count: number;
    dropoff_count: number;
    has_preferred_pickup: boolean;
    has_preferred_dropoff: boolean;
  };
  current_selections: any[];
  error?: string;
}> => {
  console.log(`🔍 [BACKEND CORREGIDO] Obteniendo SafePoints disponibles para booking: ${bookingId}`);
  
  try {
    // Usar el endpoint principal corregido del backend
    const response = await apiRequest(`/api/booking/${bookingId}/available-safepoints`);
    
    console.log(`✅ [BACKEND CORREGIDO] SafePoints obtenidos exitosamente:`, {
      booking_id: response.booking_id,
      trip_id: response.trip_id,
      pickup_count: response.available_safepoints?.pickup_count || 0,
      dropoff_count: response.available_safepoints?.dropoff_count || 0,
      total_options: (response.available_safepoints?.pickup_count || 0) + (response.available_safepoints?.dropoff_count || 0)
    });

    return {
      success: true,
      booking_id: response.booking_id,
      trip_id: response.trip_id,
      available_safepoints: response.available_safepoints || {
        pickup_options: [],
        dropoff_options: [],
        pickup_count: 0,
        dropoff_count: 0,
        has_preferred_pickup: false,
        has_preferred_dropoff: false
      },
      current_selections: response.current_selections || []
    };
  } catch (error) {
    console.error(`❌ [BACKEND CORREGIDO] Error obteniendo SafePoints para booking ${bookingId}:`, error);
    return {
      success: false,
      booking_id: bookingId,
      trip_id: 0,
      available_safepoints: {
        pickup_options: [],
        dropoff_options: [],
        pickup_count: 0,
        dropoff_count: 0,
        has_preferred_pickup: false,
        has_preferred_dropoff: false
      },
      current_selections: [],
      error: error instanceof Error ? error.message : 'Error obteniendo SafePoints disponibles'
    };
  }
};

// Obtener SafePoints cercanos a un booking específico (fallback)
export const getNearbySafePointsForBooking = async (bookingId: number, params?: {
  radius_km?: number;
  category?: string;
  limit?: number;
}): Promise<{
  success: boolean;
  booking_id: number;
  trip_id: number;
  nearby_safepoints: SafePoint[];
  route_info: {
    origin: { address: string; latitude: number; longitude: number };
    destination: { address: string; latitude: number; longitude: number };
  };
  search_params: {
    radius_km: number;
    category: string;
    limit: number;
  };
  count: number;
  error?: string;
}> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.radius_km) queryParams.append('radius_km', params.radius_km.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiRequest(`/reservas/booking/${bookingId}/nearby-safepoints?${queryParams.toString()}`);
    return {
      success: true,
      ...response
    };
  } catch (error) {
    console.error('Error getting nearby safepoints for booking:', error);
    return {
      success: false,
      booking_id: bookingId,
      trip_id: 0,
      nearby_safepoints: [],
      route_info: {
        origin: { address: '', latitude: 0, longitude: 0 },
        destination: { address: '', latitude: 0, longitude: 0 }
      },
      search_params: {
        radius_km: params?.radius_km || 15,
        category: params?.category || 'all',
        limit: params?.limit || 6
      },
      count: 0,
      error: error instanceof Error ? error.message : 'Error obteniendo SafePoints cercanos'
    };
  }
};

// Proponer SafePoint para un viaje específico (por parte del pasajero)
export const proposeSafePointForBooking = async (bookingId: number, params: {
  safepoint_id: number;
  interaction_type: 'pickup_selection' | 'dropoff_selection';
  preference_level: 'preferred' | 'alternative' | 'flexible';
  notes?: string;
  estimated_time?: string;
}): Promise<{
  success: boolean;
  message: string;
  proposal: {
    interaction_id: number;
    safepoint: SafePoint;
    interaction_type: string;
    preference_level: string;
    status: string;
    proposed_at: string;
  };
  error?: string;
}> => {
  try {
    const response = await apiRequest(`/reservas/booking/${bookingId}/propose-safepoint`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
    return {
      success: true,
      ...response
    };
  } catch (error) {
    console.error('Error proposing safepoint for booking:', error);
    return {
      success: false,
      message: 'Error proponiendo SafePoint',
      proposal: {
        interaction_id: 0,
        safepoint: {
          id: 0,
          name: '',
          category: '',
          latitude: 0,
          longitude: 0,
          address: ''
        },
        interaction_type: params.interaction_type,
        preference_level: params.preference_level,
        status: 'error',
        proposed_at: new Date().toISOString()
      },
      error: error instanceof Error ? error.message : 'Error proponiendo SafePoint'
    };
  }
};

// Obtener propuestas de SafePoints del pasajero para una reserva
export const getMySafePointProposals = async (bookingId: number): Promise<{
  success: boolean;
  booking_id: number;
  trip_id: number;
  proposals: Array<{
    interaction_id: number;
    safepoint: SafePoint;
    interaction_type: string;
    preference_level: string;
    status: string;
    notes?: string;
    estimated_time?: string;
    proposed_at: string;
  }>;
  count: number;
  error?: string;
}> => {
  try {
    const response = await apiRequest(`/reservas/booking/${bookingId}/my-safepoint-proposals`);
    return {
      success: true,
      ...response
    };
  } catch (error) {
    console.error('Error getting my safepoint proposals:', error);
    return {
      success: false,
      booking_id: bookingId,
      trip_id: 0,
      proposals: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Error obteniendo propuestas'
    };
  }
};

// Cancelar propuesta de SafePoint
export const cancelSafePointProposal = async (bookingId: number, proposalId: number): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> => {
  try {
    const response = await apiRequest(`/reservas/booking/${bookingId}/proposal/${proposalId}`, {
      method: 'DELETE'
    });
    return {
      success: true,
      message: response.message || 'Propuesta cancelada correctamente'
    };
  } catch (error) {
    console.error('Error canceling safepoint proposal:', error);
    return {
      success: false,
      message: 'Error cancelando propuesta',
      error: error instanceof Error ? error.message : 'Error cancelando propuesta'
    };
  }
};

// Función de debugging sin autenticación (para desarrollo)
export const debugTripSafePoints = async (tripId: number): Promise<{
  success: boolean;
  debug_info?: any;
  error?: string;
}> => {
  console.log(`🔧 [DEBUG] Verificando SafePoints para trip: ${tripId}`);
  
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://cupo.site'}/reservas/debug/trip/${tripId}/safepoints/noauth`);
    const data = await response.json();
    
    const interactionCount = data.debug_info?.safepoint_interactions?.all_interactions?.count || 0;
    
    console.log(`🔧 [DEBUG] Resultado:`, {
      trip_id: tripId,
      interactions_found: interactionCount,
      data_exists: interactionCount > 0,
      backend_status: response.ok ? 'OK' : 'ERROR'
    });
    
    return {
      success: response.ok,
      debug_info: data.debug_info,
      error: !response.ok ? 'Error en debug endpoint' : undefined
    };
  } catch (error) {
    console.error(`❌ [DEBUG] Error en debug endpoint:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error en debug'
    };
  }
};

// =====================================================
// NUEVAS FUNCIONES PARA SELECCIÓN DE SAFEPOINTS - BACKEND ENDPOINTS
// =====================================================

export interface SafePointSelection {
  booking_id: number;
  safepoint_id: number;
  selection_type: 'pickup' | 'dropoff';
  passenger_notes?: string;
  estimated_arrival_time?: string;
}

export interface SafePointSelectionResult {
  success: boolean;
  message: string;
  selection?: any;
  error?: string;
}

// Seleccionar SafePoint para un booking
export const selectSafePointForBooking = async (
  bookingId: number,
  selectionData: SafePointSelection
): Promise<SafePointSelectionResult> => {
  console.log(`🎯 [SELECTION] Seleccionando SafePoint para booking ${bookingId}:`, selectionData);
  
  try {
    const response = await apiRequest(`/api/booking/${bookingId}/select-safepoint`, {
      method: 'POST',
      body: JSON.stringify(selectionData)
    });
    
    console.log(`✅ [SELECTION] SafePoint seleccionado exitosamente:`, response);
    
    return {
      success: true,
      message: response.message || 'SafePoint seleccionado exitosamente',
      selection: response.selection
    };
  } catch (error) {
    console.error(`❌ [SELECTION] Error seleccionando SafePoint:`, error);
    return {
      success: false,
      message: 'Error seleccionando SafePoint',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

// Obtener selecciones actuales del usuario para un booking
export const getMyBookingSelections = async (bookingId: number): Promise<{
  success: boolean;
  booking_id: number;
  selections: {
    pickup: any | null;
    dropoff: any | null;
    has_pickup: boolean;
    has_dropoff: boolean;
    all_selected: boolean;
  };
  error?: string;
}> => {
  console.log(`🔍 [SELECTIONS] Obteniendo selecciones para booking: ${bookingId}`);
  
  try {
    const response = await apiRequest(`/api/booking/${bookingId}/my-selections`);
    
    console.log(`✅ [SELECTIONS] Selecciones obtenidas:`, {
      booking_id: response.booking_id,
      has_pickup: response.selections?.has_pickup || false,
      has_dropoff: response.selections?.has_dropoff || false,
      all_selected: response.selections?.all_selected || false
    });
    
    return {
      success: true,
      booking_id: response.booking_id,
      selections: response.selections || {
        pickup: null,
        dropoff: null,
        has_pickup: false,
        has_dropoff: false,
        all_selected: false
      }
    };
  } catch (error) {
    console.error(`❌ [SELECTIONS] Error obteniendo selecciones:`, error);
    return {
      success: false,
      booking_id: bookingId,
      selections: {
        pickup: null,
        dropoff: null,
        has_pickup: false,
        has_dropoff: false,
        all_selected: false
      },
      error: error instanceof Error ? error.message : 'Error obteniendo selecciones'
    };
  }
};

// Actualizar selección existente
export const updateSafePointSelection = async (
  bookingId: number,
  selectionId: number,
  updateData: {
    safepoint_id?: number;
    passenger_notes?: string;
    estimated_arrival_time?: string;
    status?: 'selected' | 'confirmed' | 'cancelled';
  }
): Promise<SafePointSelectionResult> => {
  console.log(`📝 [UPDATE] Actualizando selección ${selectionId} para booking ${bookingId}:`, updateData);
  
  try {
    const response = await apiRequest(`/api/booking/${bookingId}/selection/${selectionId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    
    console.log(`✅ [UPDATE] Selección actualizada exitosamente:`, response);
    
    return {
      success: true,
      message: response.message || 'Selección actualizada exitosamente',
      selection: response.selection
    };
  } catch (error) {
    console.error(`❌ [UPDATE] Error actualizando selección:`, error);
    return {
      success: false,
      message: 'Error actualizando selección',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

// Eliminar selección
export const deleteSafePointSelection = async (
  bookingId: number,
  selectionId: number
): Promise<SafePointSelectionResult> => {
  console.log(`🗑️ [DELETE] Eliminando selección ${selectionId} para booking ${bookingId}`);
  
  try {
    const response = await apiRequest(`/api/booking/${bookingId}/selection/${selectionId}`, {
      method: 'DELETE'
    });
    
    console.log(`✅ [DELETE] Selección eliminada exitosamente:`, response);
    
    return {
      success: true,
      message: response.message || 'Selección eliminada exitosamente'
    };
  } catch (error) {
    console.error(`❌ [DELETE] Error eliminando selección:`, error);
    return {
      success: false,
      message: 'Error eliminando selección',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};
