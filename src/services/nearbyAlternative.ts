import { getPlaceSuggestions, getPlaceDetails } from './optimizedGoogleMaps';
import { googleMapsCache } from '@/lib/googleMapsCache';

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

export interface NearbySearchOptions {
  latitude: number;
  longitude: number;
  radius_km?: number;
  limit?: number;
  category?: string;
}

// Mapeo de categorías a tipos de búsqueda de Places
const CATEGORY_SEARCH_TERMS: Record<string, string[]> = {
  sin_safepoint: [], // Categoría especial - no requiere búsqueda
  metro_station: ['estación metro', 'metro', 'transmilenio', 'estación transporte'],
  mall: ['centro comercial', 'mall', 'plaza comercial'],
  university: ['universidad', 'colegio', 'institución educativa'],
  hospital: ['hospital', 'clínica', 'centro médico'],
  bank: ['banco', 'cajero', 'entidad financiera'],
  park: ['parque', 'zona verde'],
  government: ['alcaldía', 'gobierno', 'oficina pública'],
  church: ['iglesia', 'catedral', 'templo'],
  hotel: ['hotel', 'hostal', 'alojamiento'],
  restaurant: ['restaurante', 'comida', 'café'],
  gas_station: ['gasolinera', 'estación servicio'],
  supermarket: ['supermercado', 'tienda', 'minimercado']
};

// Función para calcular distancia entre dos puntos (fórmula haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Función para generar queries de búsqueda basadas en ubicación
function generateLocationQueries(lat: number, lng: number, category?: string): string[] {
  const searchTerms = category ? CATEGORY_SEARCH_TERMS[category] || ['lugar'] : ['lugar'];
  
  // Generar queries con términos específicos y ubicación aproximada
  const queries: string[] = [];
  
  searchTerms.forEach(term => {
    // Query principal con el término
    queries.push(term);
    
    // Query con ciudad (detectar automáticamente o usar genérico)
    if (lat >= 3.0 && lat <= 4.0 && lng >= -77.0 && lng <= -76.0) {
      // Región de Cali/Valle del Cauca
      queries.push(`${term} en Cali`);
      queries.push(`${term} Valle del Cauca`);
    } else if (lat >= 4.5 && lat <= 5.0 && lng >= -75.0 && lng <= -74.0) {
      // Región de Pereira/Risaralda
      queries.push(`${term} en Pereira`);
      queries.push(`${term} Risaralda`);
    } else {
      // Query genérica
      queries.push(`${term} cerca`);
    }
  });
  
  return queries.slice(0, 3); // Limitar para evitar muchas requests
}

// Función principal para buscar lugares cercanos SIN usar Nearby Search
export async function searchNearbyPlacesAlternative(options: NearbySearchOptions): Promise<NearbyPlace[]> {
  const { latitude, longitude, radius_km = 5, limit = 20, category } = options;
  
  // Verificar cache primero usando geo-grid
  const cached = googleMapsCache.getByGeoGrid<NearbyPlace[]>(latitude, longitude, 'NEARBY_SEARCH');
  if (cached) {
    console.log('🎯 Nearby alternative: Using cached results');
    return cached;
  }
  
  try {
    console.log('🔍 Searching nearby places alternative for:', { latitude, longitude, category });
    
    const allPlaces: NearbyPlace[] = [];
    const seenPlaceIds = new Set<string>();
    
    // Generar queries de búsqueda
    const queries = generateLocationQueries(latitude, longitude, category);
    
    // Buscar usando cada query
    for (const query of queries) {
      try {
        const predictions = await getPlaceSuggestions(query, 8); // Limitar a 8 resultados por query
        
        // Procesar hasta 5 predicciones por query para evitar muchos requests
        const limitedPredictions = predictions.slice(0, 5);
        
        for (const prediction of limitedPredictions) {
          if (seenPlaceIds.has(prediction.placeId)) continue;
          seenPlaceIds.add(prediction.placeId);
          
          try {
            const placeDetails = await getPlaceDetails(prediction.placeId);
            
            if (placeDetails?.location) {
              const placeLat = placeDetails.location.lat;
              const placeLng = placeDetails.location.lng;
              
              // Calcular distancia
              const distance = calculateDistance(latitude, longitude, placeLat, placeLng);
              
              // Filtrar por radio
              if (distance <= radius_km) {
                const nearbyPlace: NearbyPlace = {
                  id: prediction.placeId,
                  place_id: prediction.placeId,
                  name: placeDetails.name || prediction.mainText,
                  address: placeDetails.formattedAddress || prediction.fullText,
                  latitude: placeLat,
                  longitude: placeLng,
                  types: prediction.types || [],
                  rating: undefined, // No disponible en esta implementación
                  distance_km: distance,
                  category: category || inferCategoryFromTypes(prediction.types || [])
                };
                
                allPlaces.push(nearbyPlace);
              }
            }
          } catch (error) {
            console.warn('Error getting place details:', error);
            // Continuar con otros lugares
          }
          
          // Limitar requests para evitar costos
          if (allPlaces.length >= limit) break;
        }
        
        if (allPlaces.length >= limit) break;
        
      } catch (error) {
        console.warn('Error with autocomplete query:', query, error);
        // Continuar con otras queries
      }
    }
    
    // Ordenar por distancia y limitar resultados
    const sortedPlaces = allPlaces
      .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0))
      .slice(0, limit);
    
    // Cachear resultado por 30 minutos usando geo-grid
    googleMapsCache.setByGeoGrid(latitude, longitude, sortedPlaces, 'NEARBY_SEARCH');
    
    console.log(`✅ Found ${sortedPlaces.length} nearby places using alternative method`);
    return sortedPlaces;
    
  } catch (error) {
    console.error('❌ Error in nearby places alternative search:', error);
    return [];
  }
}

// Función para inferir categoría desde tipos de Google Places
function inferCategoryFromTypes(types: string[]): string {
  const typeMapping: Record<string, string> = {
    'transit_station': 'metro_station',
    'subway_station': 'metro_station',
    'bus_station': 'metro_station',
    'shopping_mall': 'mall',
    'department_store': 'mall',
    'university': 'university',
    'school': 'university',
    'hospital': 'hospital',
    'doctor': 'hospital',
    'bank': 'bank',
    'atm': 'bank',
    'park': 'park',
    'city_hall': 'government',
    'local_government_office': 'government',
    'church': 'church',
    'place_of_worship': 'church',
    'lodging': 'hotel',
    'restaurant': 'restaurant',
    'food': 'restaurant',
    'gas_station': 'gas_station',
    'supermarket': 'supermarket',
    'grocery_or_supermarket': 'supermarket'
  };
  
  for (const type of types) {
    if (typeMapping[type]) {
      return typeMapping[type];
    }
  }
  
  return 'user_proposed'; // Categoría por defecto (nunca 'sin_safepoint' aquí)
}

// Función para buscar lugares específicos por categoría usando autocomplete
export async function searchPlacesByCategory(
  category: string, 
  centerLat: number, 
  centerLng: number, 
  radiusKm: number = 10
): Promise<NearbyPlace[]> {
  const searchTerms = CATEGORY_SEARCH_TERMS[category];
  if (!searchTerms) {
    return [];
  }
  
  const cacheKey = `category_${category}_${centerLat.toFixed(4)}_${centerLng.toFixed(4)}_${radiusKm}`;
  
  // Usar cache por query
  const cached = googleMapsCache.getByQuery<NearbyPlace[]>(cacheKey, 'NEARBY_SEARCH');
  if (cached) {
    return cached;
  }
  
  const places: NearbyPlace[] = [];
  const seenPlaceIds = new Set<string>();
  
  // Buscar con cada término de la categoría
  for (const term of searchTerms.slice(0, 2)) { // Limitar a 2 términos por categoría
    try {
      const results = await searchNearbyPlacesAlternative({
        latitude: centerLat,
        longitude: centerLng,
        radius_km: radiusKm,
        limit: 10,
        category
      });
      
      results.forEach(place => {
        if (!seenPlaceIds.has(place.place_id)) {
          seenPlaceIds.add(place.place_id);
          places.push(place);
        }
      });
      
    } catch (error) {
      console.warn(`Error searching for category ${category} with term ${term}:`, error);
    }
  }
  
  // Cachear por 45 minutos
  googleMapsCache.setByQuery(cacheKey, places, 'NEARBY_SEARCH');
  
  return places.slice(0, 20); // Limitar resultado final
}

// 🚀 Función wrapper compatible con SafePoints existente
export async function searchNearbySafePointsAlternative(params: {
  latitude: number;
  longitude: number;
  radius_km?: number;
  limit?: number;
  category?: string;
}) {
  try {
    const places = await searchNearbyPlacesAlternative(params);
    
    // Convertir a formato SafePoint compatible
    const safepoints = places.map(place => ({
      id: parseInt(place.place_id.replace(/\D/g, '').slice(0, 8)) || Math.floor(Math.random() * 10000000),
      name: place.name,
      description: `${place.category} - ${place.address}`,
      latitude: place.latitude,
      longitude: place.longitude,
      address: place.address,
      city: place.address.split(',').pop()?.trim() || 'Colombia',
      category: place.category as any,
      is_verified: true, // Consideramos verificados los de Google
      place_id: place.place_id,
      distance_km: place.distance_km,
      rating_average: place.rating
    }));
    
    // Agregar la opción "Sin SafePoint" siempre como primera opción
    const noSafepointOption = {
      id: 0,
      name: 'Sin SafePoint',
      description: 'No usar SafePoint para este viaje',
      latitude: 0,
      longitude: 0,
      address: '',
      city: 'Colombia',
      category: 'sin_safepoint' as any,
      is_verified: true,
      place_id: 'no_safepoint',
      distance_km: 0,
      rating_average: 0
    };
    
    return {
      success: true,
      safepoints: [noSafepointOption, ...safepoints],
      message: `Found ${safepoints.length + 1} nearby safepoints (including no-safepoint option)`
    };
    
  } catch (error) {
    console.error('Error in searchNearbySafePointsAlternative:', error);
    
    // En caso de error, al menos devolver la opción "Sin SafePoint"
    const noSafepointOption = {
      id: 0,
      name: 'Sin SafePoint',
      description: 'No usar SafePoint para este viaje',
      latitude: 0,
      longitude: 0,
      address: '',
      city: 'Colombia',
      category: 'sin_safepoint' as any,
      is_verified: true,
      place_id: 'no_safepoint',
      distance_km: 0,
      rating_average: 0
    };
    
    return {
      success: true,
      safepoints: [noSafepointOption],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
