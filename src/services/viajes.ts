import { apiRequest } from '@/config/api';

// Interfaces para viajes
export interface LocationData {
  address: string;
  latitude: string;
  longitude: string;
  main_text: string;
  place_id: string;
  secondary_text?: string;
}

export interface PublishTripRequest {
  origin: LocationData;
  destination: LocationData;
  date_time: string;
  seats: number;
  price_per_seat: number;
  description: string;
  allow_pets: boolean;
  allow_smoking: boolean;
  vehicle_id: number;
  stopovers?: LocationData[];
  route_summary?: string;
  estimated_duration?: string;
  estimated_distance?: string;
}

export interface TripDetails {
  id: number;
  user_id: string;
  vehicle_id: number;
  origin_id: number;
  destination_id: number;
  date_time: string;
  seats: number;
  seats_reserved: number;
  price_per_seat: number;
  description: string;
  allow_pets: string;
  allow_smoking: string;
  status: string;
  created_at: string;
  origin: LocationData;
  destination: LocationData;
  vehicle: {
    id: number;
    brand: string;
    model: string;
    plate: string;
    color: string;
    photo_url: string;
    year: number;
  };
  bookings?: any[];
}

export interface PublishTripResponse {
  success: boolean;
  message: string;
  trip_id: number;
  frozen_amount: number;
  trip: TripDetails;
}

export interface TripUpdateRequest {
  date_time?: string;
  seats?: number;
  price_per_seat?: number;
  description?: string;
  allow_pets?: boolean;
  allow_smoking?: boolean;
  status?: string;
}

// Publicar un viaje
export const publishTrip = async (tripData: PublishTripRequest): Promise<{ success: boolean; data?: PublishTripResponse; error?: string }> => {
  try {
    // Convertir campos booleanos al formato esperado por el backend (character(1))
    const formattedTripData = {
      ...tripData,
      allow_pets: tripData.allow_pets ? 'Y' : 'N',
      allow_smoking: tripData.allow_smoking ? 'Y' : 'N'
    };

    console.log('🚀 Publishing trip with formatted data:', formattedTripData);

    const response = await apiRequest('/viajes/publish', {
      method: 'POST',
      body: JSON.stringify(formattedTripData)
    });
    
    console.log('✅ Trip published successfully:', response);
    
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('❌ Error publishing trip:', error);
    
    // Mejorar el manejo de errores con más detalles
    let errorMessage = 'Error publicando viaje';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error message:', errorMessage);
      console.error('Error stack:', error.stack);
    } else if (typeof error === 'object' && error !== null) {
      // Si el error tiene un formato específico del API
      const apiError = error as any;
      console.error('API Error object:', apiError);
      
      if (apiError.error) {
        errorMessage = apiError.error;
      } else if (apiError.message) {
        errorMessage = apiError.message;
      } else if (apiError.details) {
        errorMessage = apiError.details;
      }
    }
    
    console.error('Final error message:', errorMessage);
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Obtener mis viajes publicados
export const getMyTrips = async (): Promise<{ success: boolean; data?: { trips: TripDetails[] }; error?: string }> => {
  try {
    const response = await apiRequest('/viajes/my-trips');
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error getting my trips:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error obteniendo mis viajes'
    };
  }
};

// Obtener detalles de un viaje específico
export const getTripById = async (tripId: number): Promise<{ success: boolean; data?: TripDetails; error?: string }> => {
  try {
    const response = await apiRequest(`/viajes/trip/${tripId}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error getting trip by ID:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error obteniendo detalles del viaje'
    };
  }
};

// Actualizar un viaje
export const updateTrip = async (tripId: number, updateData: TripUpdateRequest): Promise<{ success: boolean; error?: string }> => {
  try {
    // Convertir campos booleanos al formato esperado por el backend si están presentes
    const formattedUpdateData = {
      ...updateData,
      ...(updateData.allow_pets !== undefined && { allow_pets: updateData.allow_pets ? 'Y' : 'N' }),
      ...(updateData.allow_smoking !== undefined && { allow_smoking: updateData.allow_smoking ? 'Y' : 'N' })
    };

    await apiRequest(`/viajes/trip/${tripId}`, {
      method: 'PUT',
      body: JSON.stringify(formattedUpdateData)
    });
    return {
      success: true
    };
  } catch (error) {
    console.error('Error updating trip:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error actualizando viaje'
    };
  }
};

// Cancelar un viaje
export const cancelTrip = async (tripId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`🗑️ [cancelTrip] ===== CANCELING TRIP DEBUG =====`);
    console.log(`🗑️ [cancelTrip] Trip ID: ${tripId} (type: ${typeof tripId})`);
    
    // DIAGNÓSTICO PRE-CANCEL: Verificar el estado actual del viaje
    console.log(`🔍 [cancelTrip] PASO 1: Verificando estado del viaje ${tripId}...`);
    try {
      const tripDetails = await diagnoseTripStatus(tripId);
      console.log(`🔍 [cancelTrip] Trip diagnosis result:`, tripDetails);
      
      if (tripDetails.success && tripDetails.data) {
        const trip = tripDetails.data;
        console.log(`📊 [cancelTrip] Trip ${tripId} current status: "${trip.status}"`);
        console.log(`📊 [cancelTrip] Trip ${tripId} date_time: ${trip.date_time}`);
        console.log(`📊 [cancelTrip] Trip ${tripId} bookings:`, trip.bookings?.length || 0);
        console.log(`📊 [cancelTrip] Trip ${tripId} owner: ${trip.user_id}`);
        
        // Verificar condiciones previas
        if (trip.status === 'canceled') {
          console.warn(`⚠️ [cancelTrip] Trip ${tripId} is already canceled`);
        }
        
        // Verificar si tiene reservas confirmadas
        const confirmedBookings = trip.bookings?.filter((b: any) => b.booking_status === 'confirmed') || [];
        if (confirmedBookings.length > 0) {
          console.warn(`⚠️ [cancelTrip] Trip ${tripId} has ${confirmedBookings.length} confirmed bookings`);
        }
      } else {
        console.error(`❌ [cancelTrip] Could not diagnose trip ${tripId}:`, tripDetails.error);
      }
    } catch (diagError) {
      console.error(`❌ [cancelTrip] Diagnosis failed for trip ${tripId}:`, diagError);
    }
    
    console.log(`🗑️ [cancelTrip] PASO 2: Enviando request para cancelar viaje ${tripId}...`);
    
    await apiRequest(`/viajes/trip/${tripId}`, {
      method: 'DELETE'
    });
    
    console.log(`✅ [cancelTrip] Trip ${tripId} canceled successfully`);
    
    return {
      success: true
    };
  } catch (error) {
    console.error(`❌ [cancelTrip] ===== ERROR DETAILS =====`);
    console.error(`❌ [cancelTrip] Trip ID: ${tripId}`);
    console.error(`❌ [cancelTrip] Error:`, error);
    console.error(`❌ [cancelTrip] ===== END ERROR =====`);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error cancelando viaje'
    };
  }
};

// Buscar viajes públicos (para administración o estadísticas)
export const searchPublicTrips = async (
  origin?: string,
  destination?: string,
  date?: string,
  passengers?: number
): Promise<{ success: boolean; data?: { trips: TripDetails[] }; error?: string }> => {
  try {
    const params = new URLSearchParams();
    if (origin) params.append('origin', origin);
    if (destination) params.append('destination', destination);
    if (date) params.append('date', date);
    if (passengers) params.append('passengers', passengers.toString());

    const response = await apiRequest(`/viajes/search?${params.toString()}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error searching public trips:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error buscando viajes públicos'
    };
  }
};

// Función de diagnóstico para verificar el estado de un viaje
export const diagnoseTripStatus = async (tripId: number): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    console.log(`🔍 [diagnoseTripStatus] Checking trip ${tripId} status`);
    
    const response = await apiRequest(`/viajes/trip/${tripId}`);
    
    console.log(`🔍 [diagnoseTripStatus] Trip ${tripId} details:`, response);
    
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error(`❌ [diagnoseTripStatus] Error checking trip ${tripId}:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al verificar estado del viaje'
    };
  }
};

// NUEVA función para verificar la salud del backend
export const verifyBackendConnection = async (): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    console.log(`🔗 [verifyBackendConnection] Testing backend connectivity...`);
    
    // Intentar obtener la lista de mis viajes como test de conectividad
    const response = await apiRequest('/viajes/my-trips');
    
    console.log(`✅ [verifyBackendConnection] Backend is reachable, trips response:`, response);
    
    return {
      success: true,
      data: {
        backend_status: 'connected',
        trips_count: response.trips?.length || 0,
        response_sample: response
      }
    };
  } catch (error) {
    console.error(`❌ [verifyBackendConnection] Backend connection failed:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conectividad con backend'
    };
  }
};

// NUEVA función para testing directo del endpoint problemático
export const testTripStartEndpoint = async (tripId: number): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    console.log(`🧪 [testTripStartEndpoint] Testing endpoint for trip ${tripId}...`);
    
    // Primero verificar conectividad general
    const backendTest = await verifyBackendConnection();
    console.log(`🔗 [testTripStartEndpoint] Backend connectivity test:`, backendTest);
    
    // Luego verificar el trip específico
    const tripTest = await diagnoseTripStatus(tripId);
    console.log(`🔍 [testTripStartEndpoint] Trip diagnosis:`, tripTest);
    
    // Probar endpoint de debug si existe
    try {
      const debugResponse = await apiRequest(`/viajes/trip/${tripId}/debug`);
      console.log(`🐛 [testTripStartEndpoint] Debug endpoint response:`, debugResponse);
    } catch (debugError) {
      console.log(`ℹ️ [testTripStartEndpoint] Debug endpoint not available:`, debugError);
    }
    
    return {
      success: true,
      data: {
        backend_connectivity: backendTest,
        trip_diagnosis: tripTest
      }
    };
  } catch (error) {
    console.error(`❌ [testTripStartEndpoint] Test failed:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error en test del endpoint'
    };
  }
};

// Iniciar un viaje (para conductores) - SOLUCIÓN DEFINITIVA
export const startTrip = async (tripId: number): Promise<{ success: boolean; data?: { trip: any; message: string }; error?: string }> => {
  try {
    console.log(`🚀 [startTrip] ===== STARTING TRIP ${tripId} =====`);
    
    // Verificar que tenemos un tripId válido
    if (!tripId || isNaN(tripId)) {
      throw new Error(`ID de viaje inválido: ${tripId}`);
    }
    
    // SOLUCIÓN: Verificar token de autenticación antes de hacer request
    const { getAuthToken } = await import('@/config/api');
    const token = getAuthToken();
    if (!token) {
      throw new Error('No se encontró token de autenticación. Por favor, inicia sesión nuevamente.');
    }
    
    console.log(`🔑 [startTrip] Using auth token: ${token.substring(0, 20)}...`);
    
    // SOLUCIÓN: Request con manejo robusto de errores
    const response = await apiRequest(`/viajes/trip/${tripId}/start`, {
      method: 'POST',
      body: JSON.stringify({
        // Incluir información adicional que el backend podría necesitar
        trip_id: tripId,
        action: 'start',
        timestamp: new Date().toISOString()
      })
    });
    
    console.log(`✅ [startTrip] Trip ${tripId} started successfully:`, response);
    
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error(`❌ [startTrip] Error starting trip ${tripId}:`, error);
    
    let errorMessage = 'Error al iniciar el viaje';
    
    if (error instanceof Error) {
      const originalMessage = error.message;
      
      // SOLUCIÓN: Mapear errores específicos a mensajes user-friendly
      if (originalMessage.includes('Error al iniciar el viaje')) {
        // Error 500 del backend - probablemente problema de base de datos o lógica
        errorMessage = `El viaje ${tripId} no se puede iniciar en este momento. Posibles causas:
• El viaje ya fue iniciado por otro conductor
• El viaje no está en estado activo
• Hay un problema temporal en el servidor
        
Por favor, verifica el estado del viaje e intenta nuevamente.`;
      } else if (originalMessage.includes('401') || originalMessage.includes('Token')) {
        errorMessage = 'Tu sesión ha expirado. Por favor, cierra e inicia sesión nuevamente.';
      } else if (originalMessage.includes('403') || originalMessage.includes('permisos')) {
        errorMessage = `No tienes permisos para iniciar el viaje ${tripId}. Verifica que seas el conductor asignado.`;
      } else if (originalMessage.includes('404') || originalMessage.includes('no encontrado')) {
        errorMessage = `El viaje ${tripId} no fue encontrado o ya no existe.`;
      } else if (originalMessage.includes('400')) {
        errorMessage = `Datos inválidos para iniciar el viaje ${tripId}. Verifica la información del viaje.`;
      } else {
        errorMessage = `Error inesperado al iniciar viaje ${tripId}: ${originalMessage}`;
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Finalizar un viaje (para conductores) - ACTUALIZADO según la nueva implementación del backend
export const finishTrip = async (tripId: number): Promise<{ success: boolean; data?: { trip: any; unfrozen_amount?: number; message: string }; error?: string }> => {
  try {
    console.log(`🏁 [finishTrip] Finishing trip ${tripId}`);
    
    const response = await apiRequest(`/viajes/trip/${tripId}/finish`, {
      method: 'POST',
      body: JSON.stringify({})  // Enviar objeto vacío para consistencia
    });
    
    console.log(`✅ [finishTrip] Trip ${tripId} finished successfully:`, response);
    
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error(`❌ [finishTrip] Error finishing trip ${tripId}:`, error);
    
    let errorMessage = 'Error al finalizar el viaje';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Manejo específico de errores según el backend simplificado
    if (errorMessage.includes('no encontrado')) {
      errorMessage = 'Viaje no encontrado';
    } else if (errorMessage.includes('permisos')) {
      errorMessage = 'No tienes permisos para finalizar este viaje';
    } else if (errorMessage.includes('status')) {
      errorMessage = 'El viaje no está en progreso o ya ha sido finalizado';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Obtener conteo de pasajeros de un viaje - ACTUALIZADO según backend
export const getTripPassengerCount = async (tripId: number): Promise<{ success: boolean; data?: { total_passengers: number; pending_passengers: number; validated_passengers: number; passenger_count: any }; error?: string }> => {
  try {
    console.log(`🎫 [getTripPassengerCount] Getting passenger count for trip ${tripId}`);
    
    // Usar el endpoint actualizado del backend
    const response = await apiRequest(`/viajes/trip/${tripId}/passenger-count`);
    
    console.log(`✅ [getTripPassengerCount] Backend response:`, response);
    
    // Procesar la respuesta según la nueva estructura del backend
    const passengerCount = response.passenger_count || {};
    
    const data = {
      total_passengers: passengerCount.total_passengers || 0,
      pending_passengers: passengerCount.pending_passengers || 0,
      validated_passengers: passengerCount.validated_passengers || 0,
      passenger_count: passengerCount
    };
    
    console.log(`📊 [getTripPassengerCount] Processed data for trip ${tripId}:`, data);
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error(`❌ [getTripPassengerCount] Error getting passenger count for trip ${tripId}:`, error);
    
    let errorMessage = 'Error al obtener conteo de pasajeros';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};
