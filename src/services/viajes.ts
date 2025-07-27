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
    await apiRequest(`/viajes/trip/${tripId}`, {
      method: 'DELETE'
    });
    return {
      success: true
    };
  } catch (error) {
    console.error('Error canceling trip:', error);
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
