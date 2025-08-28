import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  getPlaceSuggestions, 
  getPlaceDetails, 
  calculateRoute, 
  calculateDistanceMatrix,
  reverseGeocode,
  textSearch,
  haversineDistance,
  getMapsStats,
  type PlaceSuggestion,
  type PlaceDetails,
  type RouteInfo
} from '@/services/optimizedGoogleMaps';

// 🚀 Hook optimizado para reemplazar useMaps y reducir costos
export const useOptimizedMaps = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchAbortController = useRef<AbortController>();

  // 🚀 Autocomplete optimizado con debounce automático
  const searchPlaces = useCallback(async (
    input: string, 
    maxResults: number = 5
  ): Promise<PlaceSuggestion[]> => {
    if (!input.trim() || input.length < 3) {
      return [];
    }

    // Cancelar búsqueda anterior
    searchAbortController.current?.abort();
    searchAbortController.current = new AbortController();

    setLoading(true);
    setError(null);
    
    try {
      const suggestions = await getPlaceSuggestions(input, maxResults);
      return suggestions;
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        const errorMsg = err.message;
        setError(errorMsg);
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 🚀 Place Details con cache inteligente
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

  // 🚀 Rutas con cache
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

  // 🚀 Distance Matrix en batch
  const batchDistanceMatrix = useCallback(async (
    origins: Array<{lat: number, lng: number} | string>,
    destinations: Array<{lat: number, lng: number} | string>
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await calculateDistanceMatrix(origins, destinations);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error en distance matrix';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 🚀 Geocoding inverso con cache
  const getAddressFromCoords = useCallback(async (
    lat: number, 
    lng: number
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const address = await reverseGeocode(lat, lng);
      return address;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error en geocodificación';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 🚀 Text Search (reemplaza Nearby Search)
  const searchByText = useCallback(async (
    query: string, 
    type?: string
  ): Promise<PlaceDetails[]> => {
    if (!query.trim()) return [];

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

  // 🚀 Pre-filtro por distancia (evita APIs innecesarios)
  const filterByDistance = useCallback((
    locations: Array<{lat: number, lng: number}>,
    center: {lat: number, lng: number},
    maxDistance: number // en km
  ) => {
    return locations.filter(location => {
      const distance = haversineDistance(
        center.lat, center.lng,
        location.lat, location.lng
      );
      return distance <= maxDistance;
    });
  }, []);

  return {
    loading,
    error,
    searchPlaces,
    getDetails,
    calculateRouteInfo,
    batchDistanceMatrix,
    getAddressFromCoords,
    searchByText,
    filterByDistance,
    setError
  };
};

// 🚀 Hook específico para evitar llamadas directas a Google Maps en frontend
export const useOptimizedDirections = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routes, setRoutes] = useState<google.maps.DirectionsResult[]>([]);

  // ⚠️ SOLO usar cuando sea absolutamente necesario el objeto DirectionsResult
  const calculateDirections = useCallback(async (
    origin: string | google.maps.LatLngLiteral,
    destination: string | google.maps.LatLngLiteral,
    waypoints?: google.maps.DirectionsWaypoint[]
  ) => {
    setLoading(true);
    setError(null);

    try {
      // 🚀 Verificar si Google Maps ya está cargado
      if (!window.google?.maps?.DirectionsService) {
        throw new Error('Google Maps no está disponible');
      }

      const directionsService = new google.maps.DirectionsService();
      
      const request: google.maps.DirectionsRequest = {
        origin,
        destination,
        waypoints: waypoints || [],
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
        region: 'CO'
      };

      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route(request, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            resolve(result);
          } else {
            reject(new Error(`Directions failed: ${status}`));
          }
        });
      });

      setRoutes([result]);
      return result;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error calculando direcciones';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    routes,
    calculateDirections,
    setError
  };
};

// 🚀 Hook para reemplazar DistanceMatrixService directo
export const useOptimizedDistanceMatrix = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ⚠️ SOLO usar cuando sea absolutamente necesario el objeto DistanceMatrixResponse
  const calculateMatrix = useCallback(async (
    origins: (string | google.maps.LatLngLiteral)[],
    destinations: (string | google.maps.LatLngLiteral)[]
  ) => {
    setLoading(true);
    setError(null);

    try {
      // 🚀 Intentar usar el servicio optimizado primero
      const optimizedResult = await calculateDistanceMatrix(origins, destinations);
      if (optimizedResult) {
        return optimizedResult;
      }

      // 🚀 Fallback a Google Maps directo solo si es necesario
      if (!window.google?.maps?.DistanceMatrixService) {
        throw new Error('Google Maps no está disponible');
      }

      const service = new google.maps.DistanceMatrixService();
      
      const result = await new Promise<google.maps.DistanceMatrixResponse>((resolve, reject) => {
        service.getDistanceMatrix({
          origins,
          destinations,
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          region: 'CO'
        }, (result, status) => {
          if (status === google.maps.DistanceMatrixStatus.OK && result) {
            resolve(result);
          } else {
            reject(new Error(`Distance Matrix failed: ${status}`));
          }
        });
      });

      return result;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error en distance matrix';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    calculateMatrix,
    setError
  };
};

// 🚀 Hook para estadísticas y monitoreo
export const useMapsStats = () => {
  const [stats, setStats] = useState(getMapsStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getMapsStats());
    }, 30000); // Actualizar cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  return stats;
};
