// ✅ SERVICIO CORREGIDO: SafePoints del TRIP (sin booking)
// El booking NO EXISTE hasta que el usuario selecciona SafePoints

export type SafePointCategory = 
  | 'sin_safepoint'
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

// ✅ FUNCIÓN PRINCIPAL CORREGIDA - SafePoints del TRIP (antes de crear booking)
export async function getTripSafePoints(tripId: number) {
  try {
    console.log(`🔍 [ENFOQUE CORRECTO] Cargando SafePoints del TRIP: ${tripId} (sin booking)`);
    
    // ✅ ENDPOINT CORRECTO - SafePoints del trip, NO del booking
    const endpoint = `https://cupo-backend.fly.dev/api/trip/${tripId}/available-safepoints`;
    
    try {
      console.log(`🔍 Llamando endpoint correcto: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ SafePoints del trip cargados correctamente:`, data);
        
        return {
          success: true,
          pickup_points: data.pickup_options || data.pickup_points || [],
          dropoff_points: data.dropoff_options || data.dropoff_points || []
        };
      } else {
        console.log(`⚠️ Endpoint principal falló con status ${response.status}`);
      }
    } catch (primaryError) {
      console.log(`⚠️ Error en endpoint principal:`, primaryError);
    }

    // FALLBACK: Endpoints debug para el trip (no booking)
    const debugEndpoints = [
      `https://cupo-backend.fly.dev/api/debug/trip/${tripId}/safepoints`, // Con auth - CORRECTO según backend
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
        
        // Manejar estructura de debug endpoint
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

    console.warn(`⚠️ Ningún endpoint de SafePoints funcionó para trip ${tripId}`);
    return {
      success: false,
      error: 'No se pudieron cargar los SafePoints del trip',
      pickup_points: [],
      dropoff_points: []
    };
  } catch (error) {
    console.error('❌ Error general in getTripSafePoints:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      pickup_points: [],
      dropoff_points: []
    };
  }
}

// ✅ FUNCIÓN SIMPLIFICADA - Obtener SafePoints sin complejidad de booking
export async function getTripSafePointsWithBookingId(tripId: number) {
  // Simplemente llamar a la función principal sin buscar bookingId
  console.log(`🔍 [ENFOQUE CORRECTO] Obteniendo SafePoints para tripId: ${tripId} (sin booking)`);
  return await getTripSafePoints(tripId);
}

// Función para obtener icono de categoría
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
  return getSafePointCategoryIcon(category);
}

// ✅ FUNCIÓN AGREGADA: Obtener color para categoría de SafePoint
export function getSafePointColor(category: SafePointCategory): string {
  const colorMap: Record<SafePointCategory, string> = {
    sin_safepoint: '#6b7280',
    metro_station: '#3b82f6',
    mall: '#a855f7',
    university: '#f97316',
    hospital: '#ef4444',
    bank: '#22c55e',
    park: '#84cc16',
    government: '#6366f1',
    church: '#8b5cf6',
    hotel: '#06b6d4',
    restaurant: '#f59e0b',
    gas_station: '#10b981',
    supermarket: '#ec4899',
    user_proposed: '#6b7280'
  };
  return colorMap[category] || '#6b7280';
}

// ✅ NUEVA FUNCIÓN: Crear booking CON SafePoints seleccionados
export async function createBookingWithSafePoints(
  tripId: number,
  passengers: number,
  selectedPickupId?: number,
  selectedDropoffId?: number,
  passengerData?: Array<{fullName: string, identificationNumber: string}>
) {
  try {
    console.log(`🎫 [NUEVO FLUJO] Creando booking para trip ${tripId} con SafePoints:`, {
      pickup: selectedPickupId,
      dropoff: selectedDropoffId,
      passengers,
      passengerData
    });

    const requestBody: any = {
      trip_id: tripId,
      seats_booked: passengers,
      passengers: passengerData || [
        {
          fullName: "Usuario Temporal",
          identificationNumber: "123456789"
        }
      ]
    };

    // Solo incluir SafePoints si fueron seleccionados
    if (selectedPickupId) {
      requestBody.pickup_safepoint_id = selectedPickupId;
    }
    if (selectedDropoffId) {
      requestBody.dropoff_safepoint_id = selectedDropoffId;
    }

    // Usar apiRequest para manejar la autenticación correctamente
    const { apiRequest } = await import('@/config/api');
    
    const bookingData = await apiRequest('/reservas/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`✅ Booking creado exitosamente con SafePoints:`, bookingData);
    return {
      success: true,
      booking: bookingData,
      hasPickup: !!selectedPickupId,
      hasDropoff: !!selectedDropoffId
    };

  } catch (error: any) {
    console.error('❌ Error en createBookingWithSafePoints:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido'
    };
  }
}

// ✅ NUEVA FUNCIÓN: Actualizar booking con SafePoints seleccionados (DESPUÉS de crear la reserva)
export async function updateBookingSafePoints(
  bookingId: number,
  selectedPickupId?: number,
  selectedDropoffId?: number
) {
  try {
    console.log(`🔄 Actualizando booking ${bookingId} con SafePoints:`, {
      pickup: selectedPickupId,
      dropoff: selectedDropoffId
    });

    const selections = [];

    // Crear selección de pickup si fue seleccionado
    if (selectedPickupId) {
      selections.push({
        safepoint_id: selectedPickupId,
        selection_type: 'pickup',
        status: 'selected'
      });
    }

    // Crear selección de dropoff si fue seleccionado
    if (selectedDropoffId) {
      selections.push({
        safepoint_id: selectedDropoffId,
        selection_type: 'dropoff',
        status: 'selected'
      });
    }

    if (selections.length === 0) {
      console.log(`ℹ️ No hay SafePoints para actualizar en booking ${bookingId}`);
      return { success: true, message: 'No hay cambios que realizar' };
    }

    // Usar apiRequest para manejar la autenticación correctamente
    const { apiRequest } = await import('@/config/api');
    
    // Crear las selecciones de SafePoints para el booking
    const promises = selections.map(async (selection) => {
      try {
        const result = await apiRequest(`/api/booking/${bookingId}/selection`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(selection)
        });
        
        console.log(`✅ Selección ${selection.selection_type} creada:`, result);
        return { success: true, type: selection.selection_type, result };
      } catch (error: any) {
        console.error(`❌ Error creando selección ${selection.selection_type}:`, error);
        return { success: false, type: selection.selection_type, error: error.message };
      }
    });

    const results = await Promise.all(promises);
    const errors = results.filter(r => !r.success);

    if (errors.length > 0) {
      console.error(`❌ Errores actualizando SafePoints:`, errors);
      return {
        success: false,
        error: `Error actualizando ${errors.map(e => e.type).join(', ')}`,
        results
      };
    }

    console.log(`✅ Todas las selecciones de SafePoints actualizadas correctamente`);
    return {
      success: true,
      message: 'SafePoints actualizados correctamente',
      results
    };

  } catch (error: any) {
    console.error('❌ Error general en updateBookingSafePoints:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido'
    };
  }
}
