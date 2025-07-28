import { apiRequest } from '@/config/api';

export interface Rating {
  id: number;
  user_id: string;
  trip_id: number;
  driver_id: string;
  value: number;
  report?: string;
  created_at: string;
}

export interface CreateRatingBody {
  trip_id: number;
  driver_id: string;
  value: number;
  report?: string;
}

// Obtener calificación existente
export const getExistingRating = async (tripId: number): Promise<{ success: boolean; data?: Rating; error?: string }> => {
  try {
    console.log('⭐ [Ratings] Fetching existing rating for trip:', tripId);
    const response = await apiRequest(`/ratings/trip/${tripId}`);
    return {
      success: true,
      data: response.rating
    };
  } catch (error) {
    console.error('❌ [Ratings] Error fetching existing rating:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error obteniendo calificación existente'
    };
  }
};

// Crear o actualizar calificación
export const submitRating = async (ratingData: CreateRatingBody): Promise<{ success: boolean; data?: Rating; error?: string }> => {
  try {
    console.log('⭐ [Ratings] Submitting rating:', ratingData);
    const response = await apiRequest('/ratings/submit', {
      method: 'POST',
      body: JSON.stringify(ratingData)
    });
    return {
      success: true,
      data: response.rating
    };
  } catch (error: any) {
    console.error('❌ [Ratings] Error submitting rating:', error);
    
    // El apiRequest ya lanza un Error con el mensaje del backend
    let errorMessage = 'Error enviando calificación';
    
    if (error?.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Obtener calificaciones del conductor
export const getDriverRatings = async (driverId: string): Promise<{ success: boolean; data?: { ratings: Rating[]; average: number; total: number }; error?: string }> => {
  try {
    console.log('⭐ [Ratings] Fetching driver ratings for:', driverId);
    const response = await apiRequest(`/ratings/driver/${driverId}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('❌ [Ratings] Error fetching driver ratings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error obteniendo calificaciones del conductor'
    };
  }
};

// Obtener estadísticas de calificaciones del usuario
export const getUserRatingStats = async (): Promise<{ success: boolean; data?: { given_ratings: number; average_given: number; received_ratings: number; average_received: number }; error?: string }> => {
  try {
    console.log('⭐ [Ratings] Fetching user rating stats');
    const response = await apiRequest('/ratings/stats');
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('❌ [Ratings] Error fetching user rating stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error obteniendo estadísticas de calificaciones'
    };
  }
};
