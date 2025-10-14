// src/services/tripPreferences.ts

import { apiRequest } from '../config/api';

// =====================================================
// INTERFACES
// =====================================================

export interface TripPreferences {
  id?: number;
  trip_id: number;
  allow_pets: boolean;
  allow_smoking: boolean;
  allow_food: boolean;
  allow_music: boolean;
  allow_calls: boolean;
  air_conditioning: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TripPreferencesRequest {
  trip_id: number;
  allow_pets?: boolean;
  allow_smoking?: boolean;
  allow_food?: boolean;
  allow_music?: boolean;
  allow_calls?: boolean;
  air_conditioning?: boolean;
}

export interface BulkPreferencesRequest {
  trip_ids: number[];
  preferences: Omit<TripPreferencesRequest, 'trip_id'>;
}

// =====================================================
// MAPEO DE PREFERENCIAS FRONTEND -> BACKEND
// =====================================================

/**
 * Mapea las preferencias del frontend al formato del backend
 */
export const mapPreferencesToBackend = (preferences: string[]): Partial<TripPreferencesRequest> => {
  const backendPreferences: Partial<TripPreferencesRequest> = {
    // Valores por defecto
    allow_pets: false,
    allow_smoking: false,
    allow_food: true,
    allow_music: true,
    allow_calls: true,
    air_conditioning: true
  };

  // Mapear preferencias del frontend
  preferences.forEach(pref => {
    switch (pref) {
      case 'mascotas':
        backendPreferences.allow_pets = true;
        break;
      case 'fumar':
        backendPreferences.allow_smoking = true;
        break;
      case 'no_fumar':
        backendPreferences.allow_smoking = false;
        break;
      case 'musica':
        backendPreferences.allow_music = true;
        break;
      case 'aire_acondicionado':
        backendPreferences.air_conditioning = true;
        break;
      case 'wifi':
        // WiFi no está en el backend, se puede manejar en allow_food o crear nuevo campo
        backendPreferences.allow_food = true;
        break;
      case 'equipaje_extra':
        // Equipaje extra no está en el backend, se puede manejar en allow_calls o crear nuevo campo
        backendPreferences.allow_calls = true;
        break;
    }
  });

  return backendPreferences;
};

/**
 * Mapea las preferencias del backend al formato del frontend
 */
export const mapPreferencesFromBackend = (backendPrefs: TripPreferences): string[] => {
  const frontendPreferences: string[] = [];

  if (backendPrefs.allow_pets) frontendPreferences.push('mascotas');
  if (backendPrefs.allow_smoking) frontendPreferences.push('fumar');
  if (!backendPrefs.allow_smoking) frontendPreferences.push('no_fumar');
  if (backendPrefs.allow_music) frontendPreferences.push('musica');
  if (backendPrefs.air_conditioning) frontendPreferences.push('aire_acondicionado');
  
  // Mapeos temporales para campos que no existen en backend
  if (backendPrefs.allow_food) frontendPreferences.push('wifi');
  if (backendPrefs.allow_calls) frontendPreferences.push('equipaje_extra');

  return frontendPreferences;
};

// =====================================================
// SERVICIOS DE API
// =====================================================

/**
 * Crear o actualizar preferencias para un viaje
 */
export const createTripPreferences = async (
  tripId: number, 
  preferences: string[]
): Promise<{ success: boolean; data?: TripPreferences; error?: string }> => {
  try {
    console.log('🎯 [TRIP-PREFERENCES] Creating preferences for trip:', tripId);
    console.log('🎯 [TRIP-PREFERENCES] Frontend preferences:', preferences);

    const backendPreferences = mapPreferencesToBackend(preferences);
    console.log('🎯 [TRIP-PREFERENCES] Mapped to backend format:', backendPreferences);

    const requestData = {
      trip_id: tripId,
      ...backendPreferences
    };

    const response = await apiRequest('/trip-preferences/create', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    if (response.success) {
      console.log('✅ [TRIP-PREFERENCES] Preferences created successfully:', response.data);
      return { 
        success: true, 
        data: response.data 
      };
    } else {
      console.error('❌ [TRIP-PREFERENCES] Error creating preferences:', response.error);
      return { 
        success: false, 
        error: response.error || 'Error creando preferencias' 
      };
    }
  } catch (error) {
    console.error('❌ [TRIP-PREFERENCES] Exception creating preferences:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
};

/**
 * Obtener preferencias de un viaje
 */
export const getTripPreferences = async (
  tripId: number
): Promise<{ success: boolean; data?: TripPreferences; error?: string }> => {
  try {
    console.log('🎯 [TRIP-PREFERENCES] Getting preferences for trip:', tripId);

    const response = await apiRequest(`/trip-preferences/trip/${tripId}`, {
      method: 'GET',
    });

    if (response.success) {
      console.log('✅ [TRIP-PREFERENCES] Preferences retrieved successfully:', response.data);
      return { 
        success: true, 
        data: response.data 
      };
    } else {
      console.error('❌ [TRIP-PREFERENCES] Error getting preferences:', response.error);
      return { 
        success: false, 
        error: response.error || 'Error obteniendo preferencias' 
      };
    }
  } catch (error) {
    console.error('❌ [TRIP-PREFERENCES] Exception getting preferences:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
};

/**
 * Actualizar preferencias de un viaje
 */
export const updateTripPreferences = async (
  tripId: number, 
  preferences: string[]
): Promise<{ success: boolean; data?: TripPreferences; error?: string }> => {
  try {
    console.log('🎯 [TRIP-PREFERENCES] Updating preferences for trip:', tripId);
    console.log('🎯 [TRIP-PREFERENCES] Frontend preferences:', preferences);

    const backendPreferences = mapPreferencesToBackend(preferences);
    console.log('🎯 [TRIP-PREFERENCES] Mapped to backend format:', backendPreferences);

    const response = await apiRequest(`/trip-preferences/trip/${tripId}`, {
      method: 'PUT',
      body: JSON.stringify(backendPreferences),
    });

    if (response.success) {
      console.log('✅ [TRIP-PREFERENCES] Preferences updated successfully:', response.data);
      return { 
        success: true, 
        data: response.data 
      };
    } else {
      console.error('❌ [TRIP-PREFERENCES] Error updating preferences:', response.error);
      return { 
        success: false, 
        error: response.error || 'Error actualizando preferencias' 
      };
    }
  } catch (error) {
    console.error('❌ [TRIP-PREFERENCES] Exception updating preferences:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
};

/**
 * Eliminar preferencias de un viaje
 */
export const deleteTripPreferences = async (
  tripId: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🎯 [TRIP-PREFERENCES] Deleting preferences for trip:', tripId);

    const response = await apiRequest(`/trip-preferences/trip/${tripId}`, {
      method: 'DELETE',
    });

    if (response.success) {
      console.log('✅ [TRIP-PREFERENCES] Preferences deleted successfully');
      return { success: true };
    } else {
      console.error('❌ [TRIP-PREFERENCES] Error deleting preferences:', response.error);
      return { 
        success: false, 
        error: response.error || 'Error eliminando preferencias' 
      };
    }
  } catch (error) {
    console.error('❌ [TRIP-PREFERENCES] Exception deleting preferences:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
};

/**
 * Crear o actualizar preferencias para múltiples viajes
 */
export const createBulkTripPreferences = async (
  tripIds: number[], 
  preferences: string[]
): Promise<{ success: boolean; data?: TripPreferences[]; error?: string; processed_trips?: number }> => {
  try {
    console.log('🎯 [TRIP-PREFERENCES] Creating bulk preferences for trips:', tripIds);
    console.log('🎯 [TRIP-PREFERENCES] Frontend preferences:', preferences);

    const backendPreferences = mapPreferencesToBackend(preferences);
    console.log('🎯 [TRIP-PREFERENCES] Mapped to backend format:', backendPreferences);

    const requestData: BulkPreferencesRequest = {
      trip_ids: tripIds,
      preferences: backendPreferences
    };

    const response = await apiRequest('/trip-preferences/bulk', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    if (response.success) {
      console.log('✅ [TRIP-PREFERENCES] Bulk preferences created successfully:', response.data);
      return { 
        success: true, 
        data: response.data,
        processed_trips: response.processed_trips
      };
    } else {
      console.error('❌ [TRIP-PREFERENCES] Error creating bulk preferences:', response.error);
      return { 
        success: false, 
        error: response.error || 'Error creando preferencias masivas' 
      };
    }
  } catch (error) {
    console.error('❌ [TRIP-PREFERENCES] Exception creating bulk preferences:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
};