import { apiRequest } from '@/config/api';
import { globalCache, useCache } from '@/lib/cache';
import { useCallback } from 'react';

// 🚀 Cache optimizado para servicios de viajes
const CACHE_KEYS = {
  MY_TRIPS: 'my_trips',
  TRIP_DETAILS: 'trip_details',
  AVAILABLE_TRIPS: 'available_trips',
  SEARCH_RESULTS: 'search_results'
} as const;

const CACHE_TTL = {
  SHORT: 60000,    // 1 minuto
  MEDIUM: 300000,  // 5 minutos
  LONG: 900000     // 15 minutos
} as const;

// 🚀 Servicio optimizado de viajes
export class OptimizedViajesService {
  private static instance: OptimizedViajesService;
  
  static getInstance(): OptimizedViajesService {
    if (!OptimizedViajesService.instance) {
      OptimizedViajesService.instance = new OptimizedViajesService();
    }
    return OptimizedViajesService.instance;
  }

  // 🚀 Obtener mis viajes con cache inteligente
  async getMyTrips(forceRefresh = false) {
    const cacheKey = CACHE_KEYS.MY_TRIPS;
    
    if (!forceRefresh) {
      const cached = globalCache.get(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }
    }

    try {
      const response = await apiRequest('/viajes/my-trips');
      globalCache.set(cacheKey, response, CACHE_TTL.MEDIUM);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo viajes'
      };
    }
  }

  // 🚀 Obtener detalles de viaje con cache
  async getTripDetails(tripId: number, forceRefresh = false) {
    const cacheKey = `${CACHE_KEYS.TRIP_DETAILS}_${tripId}`;
    
    if (!forceRefresh) {
      const cached = globalCache.get(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }
    }

    try {
      const response = await apiRequest(`/viajes/trip/${tripId}`);
      globalCache.set(cacheKey, response, CACHE_TTL.MEDIUM);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo detalles'
      };
    }
  }

  // 🚀 Buscar viajes con cache y debounce
  async searchTrips(searchParams: any, useCache = true) {
    const cacheKey = `${CACHE_KEYS.SEARCH_RESULTS}_${JSON.stringify(searchParams)}`;
    
    if (useCache) {
      const cached = globalCache.get(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }
    }

    try {
      const response = await apiRequest('/viajes/search', {
        method: 'POST',
        body: JSON.stringify(searchParams)
      });
      
      // Cache más corto para búsquedas (datos más dinámicos)
      globalCache.set(cacheKey, response, CACHE_TTL.SHORT);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error en búsqueda'
      };
    }
  }

  // 🚀 Publicar viaje y limpiar cache relacionado
  async publishTrip(tripData: any) {
    try {
      const response = await apiRequest('/viajes/publish', {
        method: 'POST',
        body: JSON.stringify(tripData)
      });
      
      // Invalidar cache de mis viajes
      globalCache.clear(CACHE_KEYS.MY_TRIPS);
      globalCache.clear(CACHE_KEYS.AVAILABLE_TRIPS);
      
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error publicando viaje'
      };
    }
  }

  // 🚀 Cancelar viaje y limpiar cache
  async cancelTrip(tripId: number) {
    try {
      const response = await apiRequest(`/viajes/trip/${tripId}`, {
        method: 'DELETE'
      });
      
      // Invalidar caches relacionados
      globalCache.clear(CACHE_KEYS.MY_TRIPS);
      globalCache.clear(`${CACHE_KEYS.TRIP_DETAILS}_${tripId}`);
      
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error cancelando viaje'
      };
    }
  }

  // 🚀 Finalizar viaje y limpiar cache
  async finishTrip(tripId: number) {
    try {
      const response = await apiRequest(`/viajes/trip/${tripId}/finish`, {
        method: 'POST'
      });
      
      // Invalidar caches relacionados
      globalCache.clear(CACHE_KEYS.MY_TRIPS);
      globalCache.clear(`${CACHE_KEYS.TRIP_DETAILS}_${tripId}`);
      
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error finalizando viaje'
      };
    }
  }

  // 🚀 Limpiar todo el cache de viajes
  clearCache() {
    Object.values(CACHE_KEYS).forEach(key => {
      globalCache.clear(key);
    });
  }
}

// 🚀 Hooks optimizados para usar el servicio
export function useMyTrips() {
  const service = OptimizedViajesService.getInstance();
  
  return useCache(
    CACHE_KEYS.MY_TRIPS,
    () => service.getMyTrips().then(result => result.data),
    CACHE_TTL.MEDIUM
  );
}

export function useTripDetails(tripId: number) {
  const service = OptimizedViajesService.getInstance();
  
  return useCache(
    `${CACHE_KEYS.TRIP_DETAILS}_${tripId}`,
    () => service.getTripDetails(tripId).then(result => result.data),
    CACHE_TTL.MEDIUM
  );
}

export function useOptimizedTripSearch() {
  const service = OptimizedViajesService.getInstance();
  
  const searchTrips = useCallback(async (params: any) => {
    return service.searchTrips(params);
  }, [service]);

  const searchWithCache = useCallback(async (params: any) => {
    return service.searchTrips(params, true);
  }, [service]);

  const searchFresh = useCallback(async (params: any) => {
    return service.searchTrips(params, false);
  }, [service]);

  return {
    searchTrips,
    searchWithCache,
    searchFresh
  };
}

// 🚀 Hook para operaciones de viajes con invalidación inteligente
export function useTripOperations() {
  const service = OptimizedViajesService.getInstance();

  const publishTrip = useCallback(async (tripData: any) => {
    const result = await service.publishTrip(tripData);
    return result;
  }, [service]);

  const cancelTrip = useCallback(async (tripId: number) => {
    const result = await service.cancelTrip(tripId);
    return result;
  }, [service]);

  const finishTrip = useCallback(async (tripId: number) => {
    const result = await service.finishTrip(tripId);
    return result;
  }, [service]);

  const clearCache = useCallback(() => {
    service.clearCache();
  }, [service]);

  return {
    publishTrip,
    cancelTrip,
    finishTrip,
    clearCache
  };
}

// Mantener compatibilidad con el servicio existente
export * from './viajes';
export const optimizedViajesService = OptimizedViajesService.getInstance();
