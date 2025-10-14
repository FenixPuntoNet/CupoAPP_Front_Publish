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
  allow_baggage: boolean;
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
  allow_baggage?: boolean;
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
  console.log('🎯 [MAPPING] Frontend preferences received:', preferences);
  
  const backendPreferences: Partial<TripPreferencesRequest> = {
    // ✅ VALORES POR DEFECTO CORREGIDOS - Solo activar lo que el usuario seleccione
    allow_pets: preferences.includes('mascotas'),
    allow_smoking: !preferences.includes('no_fumar'), // Si selecciona "no_fumar", allow_smoking=false
    allow_food: preferences.includes('wifi'), // WiFi se mapea a allow_food temporalmente
    allow_music: preferences.includes('musica'),
    allow_baggage: preferences.includes('equipaje_extra'),
    air_conditioning: preferences.includes('aire_acondicionado')
  };

  console.log('🎯 [MAPPING] Backend preferences mapped:', backendPreferences);
  return backendPreferences;
};

/**
 * Mapea las preferencias del backend al formato del frontend para mostrar en la UI
 */
export const mapPreferencesFromBackend = (backendPrefs: TripPreferences): string[] => {
  const frontendPreferences: string[] = [];

  console.log('🎯 [MAPPING-BACK] Backend preferences received:', backendPrefs);

  // ✅ MAPEO CORREGIDO - Solo agregar las preferencias que están activas
  if (backendPrefs.allow_pets) frontendPreferences.push('mascotas');
  if (!backendPrefs.allow_smoking) frontendPreferences.push('no_fumar'); // Solo si NO permite fumar
  if (backendPrefs.allow_music) frontendPreferences.push('musica');
  if (backendPrefs.air_conditioning) frontendPreferences.push('aire_acondicionado');
  if (backendPrefs.allow_food) frontendPreferences.push('wifi'); // allow_food se mapea a wifi
  if (backendPrefs.allow_baggage) frontendPreferences.push('equipaje_extra');

  console.log('🎯 [MAPPING-BACK] Frontend preferences mapped:', frontendPreferences);

  return frontendPreferences;
};

/**
 * Mapea las preferencias del backend al formato del modal para mostrar en la UI
 */
export const mapPreferencesForDisplay = (backendPrefs: TripPreferences): Array<{
  name: string;
  enabled: boolean;
}> => {
  return [
    {
      name: 'Mascotas',
      enabled: backendPrefs.allow_pets
    },
    {
      name: 'Fumar',
      enabled: backendPrefs.allow_smoking
    },
    {
      name: 'Comida durante el viaje',
      enabled: backendPrefs.allow_food
    },
    {
      name: 'Música',
      enabled: backendPrefs.allow_music
    },
    {
      name: 'Equipaje extra',
      enabled: backendPrefs.allow_baggage
    },
    {
      name: 'Aire acondicionado',
      enabled: backendPrefs.air_conditioning
    }
  ];
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
 * Obtener preferencias de un viaje (para propietarios)
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
 * Obtener preferencias de un viaje (público - para pasajeros)
 */
export const getTripPreferencesPublic = async (
  tripId: number
): Promise<{ success: boolean; data?: TripPreferences; error?: string }> => {
  try {
    console.log('🎯 [TRIP-PREFERENCES] Getting public preferences for trip:', tripId);

    const response = await apiRequest(`/trip-preferences/public/trip/${tripId}`, {
      method: 'GET',
    });

    if (response.success) {
      console.log('✅ [TRIP-PREFERENCES] Public preferences retrieved successfully:', response.data);
      return { 
        success: true, 
        data: response.data 
      };
    } else {
      console.error('❌ [TRIP-PREFERENCES] Error getting public preferences:', response.error);
      return { 
        success: false, 
        error: response.error || 'Error obteniendo preferencias del viaje' 
      };
    }
  } catch (error) {
    console.error('❌ [TRIP-PREFERENCES] Exception getting public preferences:', error);
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