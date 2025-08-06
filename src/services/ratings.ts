import { apiRequest } from '@/config/api';

export interface Rating {
  id: number;
  trip_id: number;
  driver_id: string;
  user_id: string;
  value: number;
  report: string | null;
  created_at: string;
}

export interface CreateRatingRequest {
  trip_id: number;
  driver_id: string;
  value: number;
  report?: string;
}

export interface RatingResponse {
  rating: Rating | null;
}

export interface SubmitRatingResponse {
  message: string;
  rating: Rating;
}

export interface DriverRatingsResponse {
  ratings: Rating[];
  average: number;
  total: number;
}

export interface RatingStatsResponse {
  given_ratings: number;
  average_given: number;
  received_ratings: number;
  average_received: number;
}

// Obtener calificación existente para un viaje
export async function getTripRating(tripId: number): Promise<{ success: boolean; data?: RatingResponse; error?: string }> {
  try {
    const data = await apiRequest(`/ratings/trip/${tripId}`, {
      method: 'GET'
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error in getTripRating:', error);
    
    // Si es un 404, significa que no hay calificación previa, lo cual es normal
    if (error instanceof Error && error.message.includes('Not Found')) {
      return { 
        success: true, 
        data: { rating: null } 
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al obtener calificación' 
    };
  }
}

// Crear o actualizar calificación
export async function submitRating(request: CreateRatingRequest): Promise<{ success: boolean; data?: SubmitRatingResponse; error?: string }> {
  try {
    const data = await apiRequest('/ratings/submit', {
      method: 'POST',
      body: JSON.stringify(request)
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error in submitRating:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al enviar calificación' 
    };
  }
}

// Obtener calificaciones de un conductor
export async function getDriverRatings(driverId: string): Promise<{ success: boolean; data?: DriverRatingsResponse; error?: string }> {
  try {
    const data = await apiRequest(`/ratings/driver/${driverId}`, {
      method: 'GET'
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error in getDriverRatings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al obtener calificaciones del conductor' 
    };
  }
}

// Obtener estadísticas de calificaciones del usuario
export async function getRatingStats(): Promise<{ success: boolean; data?: RatingStatsResponse; error?: string }> {
  try {
    const data = await apiRequest('/ratings/stats', {
      method: 'GET'
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error in getRatingStats:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al obtener estadísticas de calificaciones' 
    };
  }
}
