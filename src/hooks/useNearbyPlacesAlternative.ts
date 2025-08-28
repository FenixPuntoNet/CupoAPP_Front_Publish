import { useState, useCallback } from 'react';
import { searchNearbySafePointsAlternative, searchPlacesByCategory } from '@/services/nearbyAlternative';

export interface UseNearbyPlacesOptions {
  latitude: number;
  longitude: number;
  radius_km?: number;
  limit?: number;
}

export interface NearbyPlace {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  types: string[];
  rating?: number;
  distance_km?: number;
  place_id: string;
  category: string;
}

export function useNearbyPlacesAlternative() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar lugares cercanos usando autocomplete + place details (sin nearby search)
  const searchNearbyPlaces = useCallback(async (options: UseNearbyPlacesOptions & { category?: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Searching nearby places without Nearby API:', options);
      
      const result = await searchNearbySafePointsAlternative({
        latitude: options.latitude,
        longitude: options.longitude,
        radius_km: options.radius_km || 5,
        limit: options.limit || 20,
        category: options.category
      });

      if (result.success) {
        // Convertir formato SafePoint a NearbyPlace
        const places: NearbyPlace[] = result.safepoints.map(sp => ({
          id: sp.place_id || sp.id.toString(),
          name: sp.name,
          address: sp.address,
          latitude: sp.latitude,
          longitude: sp.longitude,
          types: [],
          rating: sp.rating_average,
          distance_km: sp.distance_km,
          place_id: sp.place_id || sp.id.toString(),
          category: sp.category
        }));

        console.log(`✅ Found ${places.length} nearby places using alternative method`);
        return places;
      } else {
        throw new Error(result.error || 'Error searching places');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error in nearby places search:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Buscar lugares por categoría específica
  const searchByCategory = useCallback(async (
    category: string, 
    centerLat: number, 
    centerLng: number, 
    radiusKm: number = 10
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔍 Searching places by category: ${category}`);
      
      const places = await searchPlacesByCategory(category, centerLat, centerLng, radiusKm);
      
      console.log(`✅ Found ${places.length} places for category: ${category}`);
      return places;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error in category search:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Buscar lugares a lo largo de una ruta
  const searchAlongRoute = useCallback(async (
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    options?: {
      radius_km?: number;
      limit?: number;
      category?: string;
    }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Searching places along route');
      
      // Generar puntos a lo largo de la ruta
      const routePoints = [
        { lat: originLat, lng: originLng, type: 'origin' },
        { lat: (originLat + destLat) / 2, lng: (originLng + destLng) / 2, type: 'midway' },
        { lat: destLat, lng: destLng, type: 'destination' }
      ];

      // Buscar lugares cerca de cada punto
      const searchPromises = routePoints.map(point =>
        searchNearbyPlaces({
          latitude: point.lat,
          longitude: point.lng,
          radius_km: options?.radius_km || 3,
          limit: options?.limit || 8,
          category: options?.category
        })
      );

      const results = await Promise.all(searchPromises);
      
      // Combinar y eliminar duplicados
      const allPlaces: NearbyPlace[] = [];
      const seenPlaceIds = new Set<string>();

      results.forEach(places => {
        places.forEach(place => {
          if (!seenPlaceIds.has(place.place_id)) {
            seenPlaceIds.add(place.place_id);
            allPlaces.push(place);
          }
        });
      });

      // Ordenar por distancia desde origen
      const sortedPlaces = allPlaces.sort((a, b) => {
        const distA = calculateDistance(originLat, originLng, a.latitude, a.longitude);
        const distB = calculateDistance(originLat, originLng, b.latitude, b.longitude);
        return distA - distB;
      });

      console.log(`✅ Found ${sortedPlaces.length} places along route`);
      return sortedPlaces.slice(0, options?.limit || 25);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error in route search:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [searchNearbyPlaces]);

  return {
    searchNearbyPlaces,
    searchByCategory,
    searchAlongRoute,
    isLoading,
    error,
    clearError: () => setError(null)
  };
}

// Función auxiliar para calcular distancia
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
