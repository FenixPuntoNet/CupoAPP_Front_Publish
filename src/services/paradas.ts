import { apiRequest } from '../config/api';

// Interfaces para las paradas
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
  trip_id: number;
  location_id: number;
  order: number;
  estimated_time?: string | null;
  user_id: string;
  locations: StopoverLocation;
}

interface CreateStopoverData {
  trip_id: number;
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
