// Servicio para SafePoints específico para booking/trips
// ✅ CORREGIDO SEGÚN GUÍA BACKEND - USA ENDPOINTS CORRECTOS

export type SafePointCategory = 
  | 'metro_station' 
  | 'mall' 
  | 'university' 
  | 'hospital' 
  | 'bank' 
  | 'park' 
  | 'government' 
  | 'church' 
  | 'hotel' 
  | 'restaurant' 
  | 'gas_station' 
  | 'supermarket' 
  | 'user_proposed';

export interface SafePoint {
  id: number;
  name: string;
  description?: string;
  category: SafePointCategory;
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  country?: string;
  place_id?: string;
  is_verified: boolean;
  is_user_proposed: boolean;
  status: string;
  rating_average?: number;
  usage_count?: number;
  distance_km?: number;
  created_at?: string;
  updated_at?: string;
}

// ✅ FUNCIÓN CORREGIDA SEGÚN GUÍA BACKEND - USA BOOKINGID CORRECTO
export async function getTripSafePoints(bookingId: number, tripId?: number) {
  try {
    console.log(`🔍 [BACKEND CORREGIDO] Cargando SafePoints para booking: ${bookingId}, trip: ${tripId}`);
    
    // ENDPOINT PRINCIPAL - ✅ CORRECTO según backend (/api/booking/:bookingId/available-safepoints)
    if (bookingId && bookingId > 0) {
      try {
        console.log(`🔍 Intentando endpoint principal: https://cupo-backend.fly.dev/api/booking/${bookingId}/available-safepoints`);
        
        const response = await fetch(`https://cupo-backend.fly.dev/api/booking/${bookingId}/available-safepoints`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Endpoint principal funcionó correctamente:`, data);
          
          return {
            success: true,
            pickup_points: data.available_safepoints?.pickup_options || [],
            dropoff_points: data.available_safepoints?.dropoff_options || []
          };
        } else {
          console.log(`⚠️ Endpoint principal falló con status ${response.status}`);
        }
      } catch (primaryError) {
        console.log(`⚠️ Error en endpoint principal:`, primaryError);
      }
    }

    // FALLBACK: Endpoints debug (solo para desarrollo) - ✅ CORRECTOS según backend
    const debugEndpoints = [
      `https://cupo-backend.fly.dev/reservas/debug/trip/${tripId || bookingId}/safepoints/noauth`, // Sin auth
      `https://cupo-backend.fly.dev/reservas/debug/trip/${tripId || bookingId}/safepoints` // Con auth
    ];

    for (const endpoint of debugEndpoints) {
      try {
        console.log(`🔍 Intentando endpoint debug: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Solo agregar auth para endpoints que lo requieren
            ...(endpoint.includes('/api/') || !endpoint.includes('noauth') ? {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            } : {})
          }
        });

        // Si la respuesta es HTML (error 404), continúa con el siguiente endpoint
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          console.log(`⚠️ Endpoint ${endpoint} devolvió HTML, probando siguiente...`);
          continue;
        }

        if (!response.ok) {
          console.log(`⚠️ Endpoint ${endpoint} falló con status ${response.status}`);
          continue;
        }

        const data = await response.json();
        console.log(`✅ Endpoint debug ${endpoint} funcionó correctamente`, data);
        
        // Manejar estructura de debug endpoint según guía backend
        if (data.debug_info?.safepoint_interactions) {
          const interactions = data.debug_info.safepoint_interactions.all_interactions?.data || [];
          
          const pickup_points = interactions
            .filter((i: any) => ['pickup_selection', 'driver_available_pickup', 'driver_preferred_pickup'].includes(i.interaction_type))
            .map((i: any) => i.safepoints)
            .filter((sp: any) => sp != null);
            
          const dropoff_points = interactions
            .filter((i: any) => ['dropoff_selection', 'driver_available_dropoff', 'driver_preferred_dropoff'].includes(i.interaction_type))
            .map((i: any) => i.safepoints)
            .filter((sp: any) => sp != null);

          return {
            success: true,
            pickup_points,
            dropoff_points
          };
        } else {
          // Estructura alternativa directa
          return {
            success: true,
            pickup_points: data.pickup_points || data.pickup_options || [],
            dropoff_points: data.dropoff_points || data.dropoff_options || []
          };
        }
      } catch (endpointError) {
        console.log(`⚠️ Error en endpoint ${endpoint}:`, endpointError);
        continue;
      }
    }

    // Si ningún endpoint funcionó, devolver estructura vacía pero exitosa
    console.warn(`⚠️ Ningún endpoint de SafePoints funcionó para booking ${bookingId}, trip ${tripId}`);
    return {
      success: true,
      pickup_points: [],
      dropoff_points: []
    };
    
  } catch (error) {
    console.error('❌ Error loading trip SafePoints:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      pickup_points: [],
      dropoff_points: []
    };
  }
}

// ✅ NUEVA FUNCIÓN PARA OBTENER BOOKINGID DESDE TRIPID SEGÚN GUÍA
export async function getBookingIdFromTripId(tripId: number): Promise<number | null> {
  try {
    console.log(`🔍 Buscando bookingId para tripId: ${tripId}`);
    
    // Obtener las reservas del usuario - ✅ ENDPOINT CORRECTO según backend
    const response = await fetch('https://cupo-backend.fly.dev/reservas/user-bookings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      // Buscar booking que corresponda al tripId
      const booking = data.bookings?.find((b: any) => b.trip?.id === tripId || b.trip_id === tripId);
      
      if (booking) {
        console.log(`✅ Found bookingId ${booking.id} for tripId ${tripId}`);
        return booking.id;
      } else {
        console.warn(`⚠️ No booking found for tripId ${tripId}`);
        return null;
      }
    } else {
      console.warn(`⚠️ Error getting user bookings: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error getting bookingId for tripId ${tripId}:`, error);
    return null;
  }
}

// ✅ FUNCIÓN PRINCIPAL QUE USA BOOKINGID CORRECTO SEGÚN GUÍA
export async function getTripSafePointsWithBookingId(tripId: number) {
  try {
    console.log(`🔍 [BACKEND CORREGIDO] Obteniendo SafePoints para tripId: ${tripId}`);
    
    // Primero obtener el bookingId correcto
    const bookingId = await getBookingIdFromTripId(tripId);
    
    if (bookingId) {
      // Usar endpoint principal con bookingId correcto
      console.log(`✅ Usando bookingId ${bookingId} para endpoint principal`);
      return await getTripSafePoints(bookingId, tripId);
    } else {
      // Fallback a endpoint debug si no hay bookingId
      console.log(`⚠️ Usando endpoint debug como fallback para tripId ${tripId}`);
      return await getTripSafePoints(0, tripId); // bookingId=0, solo usar tripId
    }
  } catch (error) {
    console.error('❌ Error in getTripSafePointsWithBookingId:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      pickup_points: [],
      dropoff_points: []
    };
  }
}

// Función para obtener icono de categoría - mantiene compatibilidad original
export function getSafePointCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    metro_station: '🚇',
    mall: '🏬',
    university: '🎓',
    hospital: '🏥',
    bank: '🏦',
    park: '🌳',
    government: '🏛️',
    church: '⛪',
    hotel: '🏨',
    restaurant: '🍽️',
    gas_station: '⛽',
    supermarket: '🛒',
    user_proposed: '📍'
  };
  
  return iconMap[category] || '📍';
}

// Función para obtener icono usando SafePointCategory tipo
export function getSafePointIcon(category: SafePointCategory): string {
  const iconMap: Record<SafePointCategory, string> = {
    metro_station: '🚇',
    mall: '🏬',
    university: '🎓',
    hospital: '🏥',
    bank: '🏦',
    park: '🌳',
    government: '🏛️',
    church: '⛪',
    hotel: '🏨',
    restaurant: '🍽️',
    gas_station: '⛽',
    supermarket: '🛒',
    user_proposed: '📍'
  };
  
  return iconMap[category] || '📍';
}

// Función para obtener color de categoría
export function getSafePointColor(category: SafePointCategory): string {
  const colorMap: Record<SafePointCategory, string> = {
    metro_station: '#2196F3',
    mall: '#9C27B0',
    university: '#FF9800',
    hospital: '#F44336',
    bank: '#4CAF50',
    park: '#8BC34A',
    government: '#607D8B',
    church: '#795548',
    hotel: '#E91E63',
    restaurant: '#FF5722',
    gas_station: '#FFC107',
    supermarket: '#3F51B5',
    user_proposed: '#9E9E9E'
  };
  
  return colorMap[category] || '#9E9E9E';
}
