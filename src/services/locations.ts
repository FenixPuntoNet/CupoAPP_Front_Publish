import { apiRequest } from '@/config/api';

export interface LocationData {
  id?: number;
  address: string;
  placeId: string;
  mainText?: string;
  secondaryText?: string;
  lat?: string;
  lng?: string;
  postalCode?: string;
}

export interface LocationSearchParams {
  query: string;
  limit?: number;
}

// Crear o actualizar ubicación
export const createLocation = async (locationData: Omit<LocationData, 'id'>): Promise<LocationData | null> => {
  try {
    const response = await apiRequest('/locations/create', {
      method: 'POST',
      body: JSON.stringify(locationData)
    });
    return response.location || null;
  } catch (error) {
    console.error('Error creating location:', error);
    return null;
  }
};

// Buscar ubicaciones en la base de datos
export const searchLocations = async (params: LocationSearchParams): Promise<LocationData[]> => {
  try {
    const response = await apiRequest('/locations/search', {
      method: 'POST',
      body: JSON.stringify(params)
    });
    return response.locations || [];
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
};

// Obtener ubicaciones populares
export const getPopularLocations = async (): Promise<LocationData[]> => {
  try {
    const response = await apiRequest('/locations/popular');
    return response.locations || [];
  } catch (error) {
    console.error('Error getting popular locations:', error);
    return [];
  }
};

// Obtener ubicaciones recientes del usuario
export const getUserRecentLocations = async (): Promise<LocationData[]> => {
  try {
    const response = await apiRequest('/locations/user/recent');
    return response.locations || [];
  } catch (error) {
    console.error('Error getting user recent locations:', error);
    return [];
  }
};

// Obtener ubicación por ID
export const getLocationById = async (locationId: string): Promise<LocationData | null> => {
  try {
    const response = await apiRequest(`/locations/${locationId}`);
    return response.location || null;
  } catch (error) {
    console.error('Error getting location by ID:', error);
    return null;
  }
};
