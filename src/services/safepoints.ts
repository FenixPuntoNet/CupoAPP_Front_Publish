import { apiRequest } from '../config/api';

// ==================== INTERFACES ====================

export interface SafePoint {
  id: number;
  name: string;
  description: string;
  category: SafePointCategory;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  is_verified: boolean;
  is_active: boolean;
  rating_average?: number;
  rating_count?: number;
  distance_km?: number;
  place_id?: string;
  usage_count?: number;
  features?: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

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

export interface SafePointInteraction {
  id: number;
  safepoint_id: number;
  trip_id: number | null;
  user_id: string;
  selection_type: 'pickup_selection' | 'dropoff_selection';
  route_order: number;
  notes?: string;
  created_at: string;
}

export interface SafePointProposalRequest {
  name: string;
  description: string;
  category: SafePointCategory;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  reason: string;
}

// ==================== NUEVA ESTRUCTURA DE BACKEND CON TRIP_ID NULL ====================

/**
 * Interactuar con un SafePoint (seleccionar/deseleccionar para origen o destino)
 * NUEVA IMPLEMENTACIÓN: Soporta trip_id NULL para guardar en borrador
 */
export async function interactWithSafePoint(data: {
  safepoint_id: number;
  selection_type: 'pickup_selection' | 'dropoff_selection';
  trip_id?: number | null; // Permite NULL para borradores
  route_order?: number;
  notes?: string;
}): Promise<{
  success: boolean;
  message?: string;
  interaction?: any;
  error?: string;
}> {
  try {
    console.log('🔄 NUEVA IMPLEMENTACIÓN: Interacting with SafePoint (trip_id NULL support):', {
      ...data,
      backend_mode: 'draft_first_then_migrate'
    });
    
    // El backend espera estos campos específicos
    const requestBody = {
      safepoint_id: data.safepoint_id,
      trip_id: data.trip_id || null, // NULL para borradores
      interaction_type: data.selection_type, // El backend espera 'interaction_type'
      interaction_data: {
        // El backend requiere interaction_data como objeto
        route_order: data.route_order || 1,
        notes: data.notes || '',
        selection_type: data.selection_type,
        is_draft_interaction: data.trip_id === null || data.trip_id === undefined
      }
    };

    console.log('📡 Sending corrected request body:', requestBody);
    
    const response = await apiRequest('/safepoints/interact', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    if (!response.success) {
      throw new Error(response.error || 'Error en la interacción con SafePoint');
    }

    console.log('✅ SafePoint interaction saved to backend (DRAFT MODE):', {
      interaction_id: response.interaction?.id,
      safepoint_id: data.safepoint_id,
      selection_type: data.selection_type,
      trip_id_status: data.trip_id ? 'ASSIGNED' : 'NULL (will auto-update on publish)',
      backend_status: 'ready_for_migration'
    });

    return {
      success: true,
      message: response.message || 'SafePoint guardado en borrador - se actualizará automáticamente al publicar el viaje',
      interaction: response.interaction
    };
  } catch (error) {
    console.error('❌ Error interacting with SafePoint:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el backend'
    };
  }
}

/**
 * Obtener interacciones de SafePoints pendientes (trip_id = NULL)
 * NUEVA FUNCIÓN para soportar el flujo de borradores
 */
export async function getPendingSafePointInteractions(): Promise<{
  success: boolean;
  pending_interactions?: SafePointInteraction[];
  count?: number;
  error?: string;
}> {
  try {
    console.log('📋 Getting pending SafePoint interactions (trip_id = NULL)...');
    
    const response = await apiRequest('/safepoints/pending-interactions', {
      method: 'GET'
    });

    if (!response.success) {
      throw new Error(response.error || 'Error obteniendo interacciones pendientes');
    }

    console.log('✅ Pending SafePoint interactions loaded:', {
      count: response.pending_interactions?.length || 0,
      backend_status: 'ready_for_trip_id_update'
    });

    return {
      success: true,
      pending_interactions: response.pending_interactions || [],
      count: response.count || 0
    };
  } catch (error) {
    console.error('❌ Error getting pending SafePoint interactions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      pending_interactions: []
    };
  }
}

/**
 * Actualizar trip_id en interacciones pendientes
 * NUEVA FUNCIÓN para completar la migración cuando se publique el viaje
 */
export async function updatePendingInteractionsTripId(
  interactionIds: number[], 
  tripId: number
): Promise<{
  success: boolean;
  updated_count?: number;
  message?: string;
  error?: string;
}> {
  try {
    console.log('🔄 MIGRATION: Updating pending SafePoint interactions trip_id:', { 
      interactionIds, 
      tripId,
      migration_type: 'NULL_to_REAL_TRIP_ID'
    });
    
    const response = await apiRequest('/safepoints/update-trip-id', {
      method: 'POST',
      body: JSON.stringify({
        interaction_ids: interactionIds,
        trip_id: tripId
      })
    });

    if (!response.success) {
      throw new Error(response.error || 'Error actualizando trip_id en interacciones');
    }

    console.log('✅ MIGRATION COMPLETED: SafePoint interactions updated:', {
      updated_count: response.updated_count,
      trip_id: tripId,
      backend_status: 'migration_successful'
    });

    return {
      success: true,
      updated_count: response.updated_count,
      message: response.message || `${response.updated_count} interacciones actualizadas exitosamente`
    };
  } catch (error) {
    console.error('❌ MIGRATION ERROR: Error updating SafePoint interactions trip_id:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// ==================== SERVICIOS BÁSICOS DE SAFEPOINTS ====================

/**
 * Buscar SafePoints cercanos a una ubicación
 */
export async function searchNearbySafePoints(params: {
  latitude: number;
  longitude: number;
  radius_km?: number;
  category?: SafePointCategory;
  limit?: number;
  verified_only?: boolean;
}): Promise<{
  success: boolean;
  safepoints: SafePoint[];
  count: number;
  search_location: { latitude: number; longitude: number };
  radius_km: number;
  error?: string;
}> {
  try {
    console.log('🔍 Searching SafePoints with POST /safepoints/search:', params);

    // El backend espera POST /safepoints/search con body, no GET con query params
    const response = await apiRequest('/safepoints/search', {
      method: 'POST',
      body: JSON.stringify({
        latitude: params.latitude,
        longitude: params.longitude,
        radius_km: params.radius_km || 5,
        limit: params.limit || 20,
        category: params.category,
        search_text: undefined // No tenemos texto de búsqueda por ahora
      })
    });

    if (!response.success) {
      throw new Error(response.error || 'Error buscando SafePoints');
    }

    // Mapear la respuesta del backend al formato esperado por el frontend
    return {
      success: true,
      safepoints: response.safepoints || [],
      count: response.count || 0,
      search_location: { 
        latitude: params.latitude, 
        longitude: params.longitude 
      },
      radius_km: params.radius_km || 5
    };

  } catch (error) {
    console.error('❌ Error searching nearby SafePoints:', error);
    return {
      success: false,
      safepoints: [],
      count: 0,
      search_location: { 
        latitude: params.latitude, 
        longitude: params.longitude 
      },
      radius_km: params.radius_km || 5,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Obtener SafePoints por categoría
 */
export async function getSafePointsByCategory(
  category: SafePointCategory,
  city?: string,
  limit?: number,
  verified_only?: boolean
): Promise<{
  success: boolean;
  safepoints: SafePoint[];
  count: number;
  category: SafePointCategory;
  city_filter?: string;
  error?: string;
}> {
  try {
    console.log('🔍 Getting SafePoints by category with GET /safepoints/category:', { category, city, limit });

    const queryParams = new URLSearchParams({
      category,
      limit: (limit || 50).toString(),
    });

    if (city) queryParams.append('city', city);
    if (verified_only) queryParams.append('verified_only', 'true');

    // El backend usa /safepoints/category, no /safepoints/by-category
    const response = await apiRequest(`/safepoints/category?${queryParams.toString()}`, {
      method: 'GET',
    });

    if (!response.success) {
      throw new Error(response.error || 'Error obteniendo SafePoints por categoría');
    }

    // Mapear la respuesta al formato esperado
    return {
      success: true,
      safepoints: response.safepoints || [],
      count: response.count || 0,
      category,
      city_filter: city
    };

  } catch (error) {
    console.error('❌ Error getting SafePoints by category:', error);
    return {
      success: false,
      safepoints: [],
      count: 0,
      category,
      city_filter: city,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Obtener detalles de un SafePoint específico
 */
export async function getSafePointDetails(safePointId: number): Promise<{
  success: boolean;
  safepoint?: SafePoint;
  interactions_count?: number;
  recent_interactions?: any[];
  error?: string;
}> {
  try {
    const response = await apiRequest(`/safepoints/${safePointId}`, {
      method: 'GET',
    });

    if (!response.success) {
      throw new Error(response.error || 'Error obteniendo detalles del SafePoint');
    }

    return response;
  } catch (error) {
    console.error('❌ Error getting SafePoint details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Proponer un nuevo SafePoint
 */
export async function proposeSafePoint(data: SafePointProposalRequest): Promise<{
  success: boolean;
  message: string;
  proposal_id?: number;
  safepoint?: SafePoint;
  error?: string;
}> {
  try {
    const response = await apiRequest('/safepoints/propose', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.success) {
      throw new Error(response.error || 'Error enviando propuesta');
    }

    return response;
  } catch (error) {
    console.error('❌ Error proposing SafePoint:', error);
    return {
      success: false,
      message: 'Error enviando propuesta',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Obtener SafePoints de un viaje específico (para conductores)
 */
export async function getTripSafePoints(tripId: number): Promise<{
  success: boolean;
  trip_id: number;
  pickup_safepoints: SafePoint[];
  dropoff_safepoints: SafePoint[];
  total_interactions: number;
  error?: string;
}> {
  try {
    const response = await apiRequest(`/safepoints/trip/${tripId}`, {
      method: 'GET',
    });

    if (!response.success) {
      throw new Error(response.error || 'Error obteniendo SafePoints del viaje');
    }

    return response;
  } catch (error) {
    console.error('❌ Error getting trip SafePoints:', error);
    return {
      success: false,
      trip_id: tripId,
      pickup_safepoints: [],
      dropoff_safepoints: [],
      total_interactions: 0,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Evaluar la calidad de un SafePoint
 */
export async function rateSafePoint(safePointId: number, rating: number, comment?: string): Promise<{
  success: boolean;
  message: string;
  new_average?: number;
  total_ratings?: number;
  error?: string;
}> {
  try {
    const response = await apiRequest('/safepoints/rate', {
      method: 'POST',
      body: JSON.stringify({
        safepoint_id: safePointId,
        rating: Math.max(1, Math.min(5, rating)), // Validar rating entre 1-5
        comment: comment || ''
      }),
    });

    if (!response.success) {
      throw new Error(response.error || 'Error enviando calificación');
    }

    return response;
  } catch (error) {
    console.error('❌ Error rating SafePoint:', error);
    return {
      success: false,
      message: 'Error enviando calificación',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Obtener icono para categoría de SafePoint
 */
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

/**
 * Obtener color para categoría de SafePoint
 */
export function getSafePointColor(category: SafePointCategory): string {
  const colorMap: Record<SafePointCategory, string> = {
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

// ==================== UTILIDADES ====================

/**
 * Formatear categoría para mostrar al usuario
 */
export function formatSafePointCategory(category: SafePointCategory): string {
  const categoryMap: Record<SafePointCategory, string> = {
    metro_station: 'Estación de Metro',
    mall: 'Centro Comercial',
    university: 'Universidad',
    hospital: 'Hospital',
    bank: 'Banco',
    park: 'Parque',
    government: 'Entidad Gubernamental',
    church: 'Iglesia',
    hotel: 'Hotel',
    restaurant: 'Restaurante',
    gas_station: 'Estación de Gasolina',
    supermarket: 'Supermercado',
    user_proposed: 'Propuesto por Usuario'
  };
  
  return categoryMap[category] || category;
}

/**
 * Calcular distancia entre dos puntos (Haversine formula)
 */
export function calculateDistance(
  lat1: number, lng1: number, 
  lat2: number, lng2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ==================== FUNCIONES ESPECÍFICAS PARA RESERVAS ====================

/**
 * Obtener SafePoints seleccionados para un viaje específico
 */
export async function getTripSafePointSelections(tripId: number): Promise<{
  success: boolean;
  trip_id: number;
  selections: SafePointInteraction[];
  pickup_points: SafePoint[];
  dropoff_points: SafePoint[];
  error?: string;
}> {
  try {
    console.log('📍 Getting SafePoint selections for trip:', tripId);
    
    const response = await apiRequest(`/safepoints/trip/${tripId}/selections`, {
      method: 'GET',
    });

    if (!response.success) {
      throw new Error(response.error || 'Error obteniendo selecciones de SafePoints');
    }

    console.log('✅ Trip SafePoint selections loaded:', {
      trip_id: tripId,
      pickup_count: response.pickup_points?.length || 0,
      dropoff_count: response.dropoff_points?.length || 0
    });

    return {
      success: true,
      trip_id: tripId,
      selections: response.selections || [],
      pickup_points: response.pickup_points || [],
      dropoff_points: response.dropoff_points || []
    };
  } catch (error) {
    console.error('❌ Error getting trip SafePoint selections:', error);
    return {
      success: false,
      trip_id: tripId,
      selections: [],
      pickup_points: [],
      dropoff_points: [],
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Obtener preferencias del conductor para un viaje (qué SafePoints prefiere)
 */
export async function getDriverSafePointPreferences(tripId: number): Promise<{
  success: boolean;
  trip_id: number;
  driver_preferences: SafePointInteraction[];
  pickup_preferences: SafePoint[];
  dropoff_preferences: SafePoint[];
  allows_proposals: boolean;
  negotiation_mode: 'strict' | 'flexible' | 'custom_allowed';
  error?: string;
}> {
  try {
    console.log('👨‍🚗 Getting driver SafePoint preferences for trip:', tripId);
    
    const response = await apiRequest(`/safepoints/trip/${tripId}/driver-preferences`, {
      method: 'GET',
    });

    if (!response.success) {
      throw new Error(response.error || 'Error obteniendo preferencias del conductor');
    }

    console.log('✅ Driver SafePoint preferences loaded:', {
      trip_id: tripId,
      allows_proposals: response.allows_proposals,
      negotiation_mode: response.negotiation_mode
    });

    return {
      success: true,
      trip_id: tripId,
      driver_preferences: response.driver_preferences || [],
      pickup_preferences: response.pickup_preferences || [],
      dropoff_preferences: response.dropoff_preferences || [],
      allows_proposals: response.allows_proposals || false,
      negotiation_mode: response.negotiation_mode || 'flexible'
    };
  } catch (error) {
    console.error('❌ Error getting driver SafePoint preferences:', error);
    return {
      success: false,
      trip_id: tripId,
      driver_preferences: [],
      pickup_preferences: [],
      dropoff_preferences: [],
      allows_proposals: false,
      negotiation_mode: 'strict',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Sugerir SafePoints para una ruta específica (cerca del origen y destino)
 */
export async function suggestSafePointsForRoute(params: {
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  radius_km?: number;
}): Promise<{
  success: boolean;
  suggested_pickup_points: SafePoint[];
  suggested_dropoff_points: SafePoint[];
  route_coverage: number;
  error?: string;
}> {
  try {
    console.log('🗺️ Suggesting SafePoints for route:', params);
    
    const response = await apiRequest('/safepoints/suggest-for-route', {
      method: 'POST',
      body: JSON.stringify({
        origin_lat: params.origin_lat,
        origin_lng: params.origin_lng,
        destination_lat: params.destination_lat,
        destination_lng: params.destination_lng,
        radius_km: params.radius_km || 3
      })
    });

    if (!response.success) {
      throw new Error(response.error || 'Error sugiriendo SafePoints para la ruta');
    }

    console.log('✅ SafePoints suggested for route:', {
      pickup_count: response.suggested_pickup_points?.length || 0,
      dropoff_count: response.suggested_dropoff_points?.length || 0,
      coverage: response.route_coverage
    });

    return {
      success: true,
      suggested_pickup_points: response.suggested_pickup_points || [],
      suggested_dropoff_points: response.suggested_dropoff_points || [],
      route_coverage: response.route_coverage || 0
    };
  } catch (error) {
    console.error('❌ Error suggesting SafePoints for route:', error);
    return {
      success: false,
      suggested_pickup_points: [],
      suggested_dropoff_points: [],
      route_coverage: 0,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Negociar SafePoint (responder a una propuesta de pasajero)
 */
export async function negotiateSafePoint(params: {
  interaction_id: number;
  response: 'approved' | 'rejected' | 'counter_proposal';
  response_data?: any;
  driver_notes?: string;
}): Promise<{
  success: boolean;
  message: string;
  negotiation_status: string;
  final_agreement?: SafePointInteraction;
  error?: string;
}> {
  try {
    console.log('🤝 Negotiating SafePoint:', params);
    
    const response = await apiRequest('/safepoints/negotiate', {
      method: 'POST',
      body: JSON.stringify(params)
    });

    if (!response.success) {
      throw new Error(response.error || 'Error en la negociación');
    }

    console.log('✅ SafePoint negotiation completed:', {
      interaction_id: params.interaction_id,
      response: params.response,
      status: response.negotiation_status
    });

    return {
      success: true,
      message: response.message,
      negotiation_status: response.negotiation_status,
      final_agreement: response.final_agreement
    };
  } catch (error) {
    console.error('❌ Error negotiating SafePoint:', error);
    return {
      success: false,
      message: 'Error en la negociación',
      negotiation_status: 'error',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Crear propuesta de SafePoint alternativo para un viaje
 */
export async function proposeAlternativeSafePoint(params: {
  trip_id: number;
  safepoint_id: number;
  selection_type: 'pickup_selection' | 'dropoff_selection';
  passenger_reason: string;
  alternative_to?: number; // ID del SafePoint que está proponiendo reemplazar
}): Promise<{
  success: boolean;
  message: string;
  proposal_id: number;
  requires_driver_approval: boolean;
  error?: string;
}> {
  try {
    console.log('💡 Proposing alternative SafePoint:', params);
    
    const response = await apiRequest('/safepoints/interact', {
      method: 'POST',
      body: JSON.stringify({
        safepoint_id: params.safepoint_id,
        trip_id: params.trip_id,
        interaction_type: 'passenger_counter_proposal',
        interaction_data: {
          selection_type: params.selection_type,
          passenger_reason: params.passenger_reason,
          alternative_to: params.alternative_to,
          is_counter_proposal: true,
          needs_driver_approval: true
        }
      })
    });

    if (!response.success) {
      throw new Error(response.error || 'Error enviando propuesta alternativa');
    }

    console.log('✅ Alternative SafePoint proposed:', {
      trip_id: params.trip_id,
      safepoint_id: params.safepoint_id,
      proposal_id: response.interaction?.id
    });

    return {
      success: true,
      message: response.message || 'Propuesta enviada al conductor',
      proposal_id: response.interaction?.id || 0,
      requires_driver_approval: true
    };
  } catch (error) {
    console.error('❌ Error proposing alternative SafePoint:', error);
    return {
      success: false,
      message: 'Error enviando propuesta alternativa',
      proposal_id: 0,
      requires_driver_approval: true,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Finalizar acuerdo de SafePoints entre conductor y pasajero
 */
export async function finalizeSafePointAgreement(params: {
  trip_id: number;
  booking_id?: number;
  pickup_safepoint_id: number;
  dropoff_safepoint_id: number;
  agreed_pickup_time?: string;
  agreed_dropoff_time?: string;
}): Promise<{
  success: boolean;
  message: string;
  agreement_id: number;
  pickup_point: SafePoint;
  dropoff_point: SafePoint;
  error?: string;
}> {
  try {
    console.log('🤝 Finalizing SafePoint agreement:', params);
    
    const response = await apiRequest('/safepoints/finalize-agreement', {
      method: 'POST',
      body: JSON.stringify(params)
    });

    if (!response.success) {
      throw new Error(response.error || 'Error finalizando acuerdo');
    }

    console.log('✅ SafePoint agreement finalized:', {
      trip_id: params.trip_id,
      agreement_id: response.agreement_id
    });

    return {
      success: true,
      message: response.message,
      agreement_id: response.agreement_id,
      pickup_point: response.pickup_point,
      dropoff_point: response.dropoff_point
    };
  } catch (error) {
    console.error('❌ Error finalizing SafePoint agreement:', error);
    return {
      success: false,
      message: 'Error finalizando acuerdo',
      agreement_id: 0,
      pickup_point: {} as SafePoint,
      dropoff_point: {} as SafePoint,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Exports already handled in interface declarations above
