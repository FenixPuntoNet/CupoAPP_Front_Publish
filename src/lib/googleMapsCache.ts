// 🚀 Sistema de Cache Inteligente para Google Maps
// Reduce costos optimizando requests a Google Maps APIs

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  usage: number;
}

interface GeoGridKey {
  lat_grid: number;
  lng_grid: number;
}

class GoogleMapsCache {
  private static instance: GoogleMapsCache;
  private cache = new Map<string, CacheEntry<any>>();
  private geoGrid = new Map<string, any>();
  private placeIdCache = new Map<string, any>();
  
  // 🚀 TTL por tipo de dato (en ms)
  private readonly TTL = {
    PLACE_DETAILS: 72 * 60 * 60 * 1000,    // 72 horas - datos muy estables
    AUTOCOMPLETE: 24 * 60 * 60 * 1000,     // 24 horas - relativamente estables  
    GEOCODING: 48 * 60 * 60 * 1000,        // 48 horas - muy estables
    DISTANCE_MATRIX: 24 * 60 * 60 * 1000,  // 24 horas - puede cambiar por tráfico
    DIRECTIONS: 12 * 60 * 60 * 1000,       // 12 horas - cambia más frecuentemente
    NEARBY_SEARCH: 6 * 60 * 60 * 1000      // 6 horas - dinámico
  } as const;

  static getInstance(): GoogleMapsCache {
    if (!GoogleMapsCache.instance) {
      GoogleMapsCache.instance = new GoogleMapsCache();
    }
    return GoogleMapsCache.instance;
  }

  // 🚀 Cache por place_id (más eficiente)
  setByPlaceId<T>(placeId: string, data: T, type: keyof typeof this.TTL): void {
    const key = `place_${placeId}_${type}`;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.TTL[type],
      usage: 1
    });
    
    // Cache adicional por place_id para lookup rápido
    this.placeIdCache.set(placeId, { ...data, cached_at: Date.now() });
  }

  getByPlaceId<T>(placeId: string, type: keyof typeof this.TTL): T | null {
    const key = `place_${placeId}_${type}`;
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Incrementar uso para estadísticas
    entry.usage++;
    return entry.data;
  }

  // 🚀 Cache por coordenadas con grid (reduce requests duplicados)
  setByGeoGrid<T>(lat: number, lng: number, data: T, type: keyof typeof this.TTL): void {
    const gridKey = this.getGeoGridKey(lat, lng);
    const key = `geo_${gridKey.lat_grid}_${gridKey.lng_grid}_${type}`;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.TTL[type],
      usage: 1
    });
  }

  getByGeoGrid<T>(lat: number, lng: number, type: keyof typeof this.TTL): T | null {
    const gridKey = this.getGeoGridKey(lat, lng);
    const key = `geo_${gridKey.lat_grid}_${gridKey.lng_grid}_${type}`;
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    entry.usage++;
    return entry.data;
  }

  // 🚀 Grid de ~100m para coordenadas (agrupa requests cercanos)
  private getGeoGridKey(lat: number, lng: number): GeoGridKey {
    // Dividir en grid de aproximadamente 100m
    const gridSize = 0.001; // ~111m en latitud
    return {
      lat_grid: Math.floor(lat / gridSize),
      lng_grid: Math.floor(lng / gridSize)
    };
  }

  // 🚀 Cache por query de texto con normalización
  setByQuery<T>(query: string, data: T, type: keyof typeof this.TTL): void {
    const normalizedQuery = this.normalizeQuery(query);
    const key = `query_${normalizedQuery}_${type}`;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.TTL[type],
      usage: 1
    });
  }

  getByQuery<T>(query: string, type: keyof typeof this.TTL): T | null {
    const normalizedQuery = this.normalizeQuery(query);
    const key = `query_${normalizedQuery}_${type}`;
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    entry.usage++;
    return entry.data;
  }

  // 🚀 Normalizar queries para mejor hit rate
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\sáéíóúñü]/g, ''); // Remover caracteres especiales pero mantener acentos
  }

  // 🚀 Cache para batch de Distance Matrix
  setBatchDistanceMatrix(origins: string[], destinations: string[], data: any): void {
    const batchKey = `batch_${this.hashArray(origins)}_${this.hashArray(destinations)}`;
    this.cache.set(batchKey, {
      data,
      timestamp: Date.now(),
      ttl: this.TTL.DISTANCE_MATRIX,
      usage: 1
    });
  }

  getBatchDistanceMatrix(origins: string[], destinations: string[]): any | null {
    const batchKey = `batch_${this.hashArray(origins)}_${this.hashArray(destinations)}`;
    const entry = this.cache.get(batchKey);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(batchKey);
      return null;
    }
    
    entry.usage++;
    return entry.data;
  }

  private hashArray(arr: string[]): string {
    return arr.sort().join('|');
  }

  // 🚀 Estadísticas de cache
  getStats() {
    let totalEntries = 0;
    let totalUsage = 0;
    let byType: Record<string, number> = {};
    
    for (const [key, entry] of this.cache.entries()) {
      totalEntries++;
      totalUsage += entry.usage;
      
      const type = key.split('_').pop() || 'unknown';
      byType[type] = (byType[type] || 0) + 1;
    }
    
    return {
      totalEntries,
      totalUsage,
      byType,
      hitRate: totalUsage > totalEntries ? ((totalUsage - totalEntries) / totalUsage * 100).toFixed(2) + '%' : '0%'
    };
  }

  // 🚀 Limpiar cache expirado
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    console.log(`🧹 [GoogleMapsCache] Cleaned ${cleaned} expired entries`);
  }

  // 🚀 Limpiar por patrón
  clearPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.geoGrid.clear();
    this.placeIdCache.clear();
  }
}

export const googleMapsCache = GoogleMapsCache.getInstance();

// 🚀 Limpiar cache automáticamente cada 30 minutos
setInterval(() => {
  googleMapsCache.cleanup();
}, 30 * 60 * 1000);
