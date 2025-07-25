import { apiRequest } from '@/config/api';

export interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
  types?: string[];
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: {
    lat: number;
    lng: number;
  };
  addressComponents: any[];
}

export interface RouteInfo {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  startAddress: string;
  endAddress: string;
  polyline?: string;
  bounds?: any;
}

// Servicio para autocompletar lugares
export const getPlaceSuggestions = async (input: string): Promise<PlaceSuggestion[]> => {
  try {
    const response = await apiRequest('/maps/autocomplete', {
      method: 'POST',
      body: JSON.stringify({
        input,
        types: ['establishment', 'geocode'],
        country: 'co'
      })
    });

    return response.suggestions || [];
  } catch (error) {
    console.error('Error getting place suggestions:', error);
    return [];
  }
};

// Servicio para obtener detalles de un lugar
export const getPlaceDetails = async (placeId: string): Promise<PlaceDetails | null> => {
  try {
    const response = await apiRequest('/maps/place-details', {
      method: 'POST',
      body: JSON.stringify({ placeId })
    });

    return response.place || null;
  } catch (error) {
    console.error('Error getting place details:', error);
    return null;
  }
};

// Servicio para geocodificación inversa
export const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const response = await apiRequest('/maps/reverse-geocode', {
      method: 'POST',
      body: JSON.stringify({ lat, lng })
    });

    return response.address || null;
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return null;
  }
};

// Servicio para búsqueda de texto
export const textSearch = async (query: string, type?: string): Promise<PlaceDetails[]> => {
  try {
    const response = await apiRequest('/maps/text-search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        type,
        country: 'co'
      })
    });

    return response.places || [];
  } catch (error) {
    console.error('Error in text search:', error);
    return [];
  }
};

// Servicio para calcular ruta
export const calculateRoute = async (
  origin: { lat: number; lng: number } | string,
  destination: { lat: number; lng: number } | string,
  mode: 'driving' | 'walking' | 'transit' = 'driving'
): Promise<RouteInfo | null> => {
  try {
    const response = await apiRequest('/maps/calculate-route', {
      method: 'POST',
      body: JSON.stringify({
        origin,
        destination,
        mode
      })
    });

    return response.route || null;
  } catch (error) {
    console.error('Error calculating route:', error);
    return null;
  }
};
