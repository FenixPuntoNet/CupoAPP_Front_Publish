import { useState, useCallback } from 'react';
import { 
  getPlaceSuggestions, 
  getPlaceDetails, 
  calculateRoute, 
  textSearch, 
  reverseGeocode,
  type PlaceSuggestion,
  type PlaceDetails,
  type RouteInfo
} from '@/services/googleMaps';

export const useMaps = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchPlaces = useCallback(async (input: string): Promise<PlaceSuggestion[]> => {
    if (!input.trim() || input.length < 3) {
      return [];
    }

    setLoading(true);
    setError(null);
    
    try {
      const suggestions = await getPlaceSuggestions(input);
      return suggestions;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error en la búsqueda';
      setError(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getDetails = useCallback(async (placeId: string): Promise<PlaceDetails | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const details = await getPlaceDetails(placeId);
      return details;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error obteniendo detalles';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateRouteInfo = useCallback(async (
    origin: { lat: number; lng: number } | string,
    destination: { lat: number; lng: number } | string,
    mode: 'driving' | 'walking' | 'transit' = 'driving'
  ): Promise<RouteInfo | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const route = await calculateRoute(origin, destination, mode);
      return route;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error calculando ruta';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchByText = useCallback(async (query: string, type?: string): Promise<PlaceDetails[]> => {
    if (!query.trim()) {
      return [];
    }

    setLoading(true);
    setError(null);
    
    try {
      const places = await textSearch(query, type);
      return places;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error en búsqueda de texto';
      setError(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getAddressFromCoords = useCallback(async (lat: number, lng: number): Promise<string | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const address = await reverseGeocode(lat, lng);
      return address;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error en geocodificación inversa';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    searchPlaces,
    getDetails,
    calculateRouteInfo,
    searchByText,
    getAddressFromCoords,
    loading,
    error,
    clearError: () => setError(null)
  };
};
