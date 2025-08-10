import { apiRequest } from '../config/api';

// ==================== INTERFACES ====================

interface StopoverLocation {
  id: number;
  main_text: string;
  address: string;
  latitude: string;
  longitude: string;
  secondary_text?: string;
  place_id?: string;
}

interface Stopover {
  id: number;
  trip_id: number | null; // Permite NULL para borradores
  location_id: number;
  order: number;
  estimated_time?: string | null;
  user_id: string;
  locations: StopoverLocation;
}

interface CreateStopoverData {
  trip_id: number | null; // Permite NULL para borradores
  location_id: number;
  order: number;
  estimated_time?: string;
}

interface UpdateStopoverData {
  id: number;
  location_id?: number;
  order?: number;
  estimated_time?: string;
}

interface LocationData {
  main_text: string;
  address: string;
  latitude: number;
  longitude: number;
  secondary_text?: string;
  place_id?: string;
}

interface ReorderStopoverData {
  trip_id: number;
  stopovers: Array<{ id: number; order: number }>;
}

// ==================== SERVICIOS DE PARADAS ====================

/**
 * Crear una nueva parada para un viaje
 */
export async function createStopover(data: CreateStopoverData): Promise<{
  success: boolean;
  message: string;
  stopover: Stopover;
}> {
  return apiRequest('/paradas/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Obtener paradas de un viaje específico
 */
export async function getTripStopovers(tripId: number): Promise<{
  success: boolean;
  trip_id: number;
  stopovers: Stopover[];
  total_stopovers: number;
}> {
  return apiRequest(`/paradas/trip/${tripId}`, {
    method: 'GET',
  });
}

/**
 * Actualizar una parada existente
 */
export async function updateStopover(data: UpdateStopoverData): Promise<{
  success: boolean;
  message: string;
  stopover: Stopover;
}> {
  return apiRequest('/paradas/update', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Eliminar una parada
 */
export async function deleteStopover(stopoverId: number): Promise<{
  success: boolean;
  message: string;
  deleted_stopover_id: number;
}> {
  return apiRequest(`/paradas/${stopoverId}`, {
    method: 'DELETE',
  });
}

/**
 * Reordenar paradas de un viaje
 */
export async function reorderStopovers(data: ReorderStopoverData): Promise<{
  success: boolean;
  message: string;
  trip_id: number;
  stopovers: Stopover[];
  updated_count: number;
}> {
  return apiRequest('/paradas/reorder', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Crear una nueva ubicación para paradas
 */
export async function createLocationForStopover(data: LocationData): Promise<{
  success: boolean;
  message: string;
  location: StopoverLocation;
  existed: boolean;
}> {
  return apiRequest('/paradas/create-location', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Buscar ubicaciones disponibles para paradas
 */
export async function searchLocationsForStopovers(params?: {
  q?: string;
  limit?: number;
  city?: string;
}): Promise<{
  success: boolean;
  locations: StopoverLocation[];
  count: number;
  search_term: string | null;
  city_filter: string | null;
}> {
  const queryParams = new URLSearchParams();
  
  if (params?.q) queryParams.append('q', params.q);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.city) queryParams.append('city', params.city);
  
  const url = `/paradas/search-locations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  return apiRequest(url, {
    method: 'GET',
  });
}

// ==================== FUNCIONES PARA TRIP_ID NULL SYSTEM ====================

/**
 * Obtener paradas pendientes (sin trip_id) - Backend implementado
 */
export async function getPendingStopovers(): Promise<{
  success: boolean;
  pending_stopovers: any[];
  count: number;
  error?: string;
}> {
  try {
    console.log('📋 Getting pending stopovers from backend...');
    
    const result = await apiRequest('/paradas/pending-stopovers', {
      method: 'GET',
    });

    console.log('✅ Pending stopovers loaded from backend:', {
      count: result.count,
      status: 'backend_integration_active'
    });

    return result;
  } catch (error) {
    console.error('❌ Error getting pending stopovers from backend:', error);
    
    // Fallback temporal con localStorage en caso de error del backend
    console.log('🔄 Falling back to localStorage...');
    const stored = localStorage.getItem('pendingStopovers');
    const pendingStopovers = stored ? JSON.parse(stored) : [];
    
    return {
      success: true,
      pending_stopovers: pendingStopovers,
      count: pendingStopovers.length,
      error: 'Backend error, using localStorage fallback'
    };
  }
}

/**
 * Guardar parada en estado pendiente (sin trip_id) - Backend implementado
 */
export async function savePendingStopover(stopoverData: {
  location_id: number;
  order: number;
  estimated_time?: string;
  location_data: StopoverLocation;
}): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    console.log('💾 Saving pending stopover to backend:', stopoverData);
    
    // Llamar al endpoint del backend
    const result = await apiRequest('/paradas/create', {
      method: 'POST',
      body: JSON.stringify({
        trip_id: null, // Parada pendiente
        location_id: stopoverData.location_id,
        order: stopoverData.order,
        estimated_time: stopoverData.estimated_time
      }),
    });
    
    console.log('✅ Pending stopover saved to backend');
    
    return {
      success: true,
      message: result.message || 'Parada guardada como borrador en el backend'
    };
  } catch (error) {
    console.error('❌ Error saving pending stopover to backend:', error);
    
    // Fallback a localStorage en caso de error
    console.log('🔄 Falling back to localStorage...');
    const stored = localStorage.getItem('pendingStopovers');
    const existing = stored ? JSON.parse(stored) : [];
    
    const newStopover = {
      id: Date.now(),
      trip_id: null,
      ...stopoverData,
      created_at: new Date().toISOString()
    };
    
    existing.push(newStopover);
    localStorage.setItem('pendingStopovers', JSON.stringify(existing));
    
    return {
      success: true,
      message: 'Parada guardada en localStorage (fallback)',
      error: error instanceof Error ? error.message : 'Error del backend'
    };
  }
}

/**
 * Actualizar trip_id en paradas pendientes - Backend implementado
 */
export async function updatePendingStopoversTripId(
  stopoverIds: number[],
  tripId: number
): Promise<{
  success: boolean;
  updated_count: number;
  message: string;
  error?: string;
}> {
  try {
    console.log('🔄 MIGRATION: Updating pending stopovers trip_id (backend):', { 
      stopoverIds, 
      tripId 
    });
    
    const result = await apiRequest('/paradas/update-stopovers-trip-id', {
      method: 'POST',
      body: JSON.stringify({
        stopover_ids: stopoverIds,
        trip_id: tripId
      }),
    });
    
    console.log('✅ Pending stopovers migrated in backend successfully');
    
    // Limpiar localStorage ya que ahora están en el backend
    localStorage.removeItem('pendingStopovers');
    
    return {
      success: true,
      updated_count: result.updated_count || stopoverIds.length,
      message: result.message || `${stopoverIds.length} paradas migradas exitosamente`
    };
  } catch (error) {
    console.error('❌ Error updating pending stopovers trip_id in backend:', error);
    
    // Fallback: limpiar localStorage aunque falle el backend
    localStorage.removeItem('pendingStopovers');
    
    return {
      success: false,
      updated_count: 0,
      message: 'Error migrando paradas en el backend',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Limpiar paradas pendientes
 */
export async function clearPendingStopovers(): Promise<void> {
  try {
    localStorage.removeItem('pendingStopovers');
    console.log('🧹 Pending stopovers cleared from localStorage');
  } catch (error) {
    console.error('❌ Error clearing pending stopovers:', error);
  }
}

// ==================== UTILIDADES PARA INTEGRACIÓN ====================

/**
 * Convertir StopoverLocation a formato de TripLocation para el frontend
 */
export function convertStopoverLocationToTripLocation(location: StopoverLocation) {
  return {
    location_id: location.id,
    placeId: location.place_id || `location_${location.id}`,
    address: location.address,
    coords: {
      lat: parseFloat(location.latitude),
      lng: parseFloat(location.longitude),
    },
    mainText: location.main_text,
    secondaryText: location.secondary_text || '',
  };
}

/**
 * Convertir datos del frontend a formato para crear ubicación
 */
export function convertTripLocationToLocationData(location: {
  mainText: string;
  address: string;
  coords: { lat: number; lng: number };
  secondaryText?: string;
  placeId?: string;
}): LocationData {
  return {
    main_text: location.mainText,
    address: location.address,
    latitude: location.coords.lat,
    longitude: location.coords.lng,
    secondary_text: location.secondaryText,
    place_id: location.placeId,
  };
}

export type {
  Stopover,
  StopoverLocation,
  CreateStopoverData,
  UpdateStopoverData,
  LocationData,
  ReorderStopoverData,
};
