// ===============================
// SERVICIO DE GEOCODIFICACIÓN
// ===============================

export interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
  place_id?: string;
  city?: string;
  country?: string;
}

/**
 * Geocodificar una dirección usando Google Places API de forma completamente dinámica
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    console.log('🌍 [GEOCODING] Geocodificando dirección DINÁMICA:', address);

    // Verificar si Google Maps está cargado
    if (!window.google || !window.google.maps) {
      console.warn('⚠️ [GEOCODING] Google Maps no está cargado, usando coordenadas por defecto');
      return getDefaultCoordinates(address);
    }

    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve) => {
      geocoder.geocode(
        { 
          address: address,
          region: 'CO', // Priorizar resultados en Colombia
          componentRestrictions: { country: 'CO' } // Restringir a Colombia
        }, 
        (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const result = results[0];
            const location = result.geometry.location;
            
            const geocodeResult: GeocodeResult = {
              lat: location.lat(),
              lng: location.lng(),
              address: result.formatted_address,
              place_id: result.place_id,
              city: extractCity(result),
              country: extractCountry(result)
            };

            console.log('✅ [GEOCODING] Dirección geocodificada DINÁMICAMENTE:', geocodeResult);
            console.log('📊 [GEOCODING] Tipos de resultado:', result.types);
            console.log('🎯 [GEOCODING] Precisión de geocodificación:', result.geometry.location_type);
            
            resolve(geocodeResult);
          } else {
            console.warn('⚠️ [GEOCODING] Geocodificación falló con status:', status);
            console.warn('🚫 [GEOCODING] Para dirección:', address);
            
            // Solo usar fallback en casos extremos donde Google Maps falla completamente
            if (status === 'ZERO_RESULTS') {
              console.log('🔄 [GEOCODING] Intentando geocodificación más flexible...');
              
              // Retry sin restricciones estrictas
              geocoder.geocode({ address: address }, (retryResults, retryStatus) => {
                if (retryStatus === 'OK' && retryResults && retryResults[0]) {
                  const retryResult = retryResults[0];
                  const location = retryResult.geometry.location;
                  
                  const geocodeResult: GeocodeResult = {
                    lat: location.lat(),
                    lng: location.lng(),
                    address: retryResult.formatted_address,
                    place_id: retryResult.place_id,
                    city: extractCity(retryResult),
                    country: extractCountry(retryResult)
                  };

                  console.log('✅ [GEOCODING] Retry exitoso:', geocodeResult);
                  resolve(geocodeResult);
                } else {
                  console.log('💥 [GEOCODING] Retry también falló, usando fallback mínimo');
                  resolve(getDefaultCoordinates(address));
                }
              });
            } else {
              resolve(getDefaultCoordinates(address));
            }
          }
        }
      );
    });
  } catch (error) {
    console.error('❌ [GEOCODING] Error crítico en geocodificación:', error);
    return getDefaultCoordinates(address);
  }
}

/**
 * Obtener coordenadas por defecto MÍNIMAS (solo para casos extremos)
 */
function getDefaultCoordinates(address: string): GeocodeResult {
  console.log('🚨 [GEOCODING] Usando fallback mínimo para:', address);
  
  // Centro geográfico de Colombia como último recurso
  return {
    lat: 4.5709, // Centro de Colombia
    lng: -74.2973,
    address: address || 'Ubicación en Colombia',
    city: 'Colombia',
    country: 'Colombia'
  };
}

/**
 * Extraer ciudad de los componentes de dirección de Google
 */
function extractCity(result: google.maps.GeocoderResult): string {
  const cityTypes = ['locality', 'administrative_area_level_2', 'administrative_area_level_1'];
  
  for (const component of result.address_components) {
    for (const type of cityTypes) {
      if (component.types.includes(type)) {
        return component.long_name;
      }
    }
  }
  
  return 'Ciudad desconocida';
}

/**
 * Extraer país de los componentes de dirección de Google
 */
function extractCountry(result: google.maps.GeocoderResult): string {
  for (const component of result.address_components) {
    if (component.types.includes('country')) {
      return component.long_name;
    }
  }
  
  return 'País desconocido';
}

/**
 * Calcular distancia entre dos puntos geográficos (Haversine)
 */
export function calculateDistance(
  lat1: number, lng1: number, 
  lat2: number, lng2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}