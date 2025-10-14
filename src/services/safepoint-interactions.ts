// =======================================
// SERVICIO DE BACKEND SAFEPOINT INTERACTIONS
// =======================================

import { apiRequest } from '@/config/api';

export interface SafePointInteractionRequest {
  safepoint_id: number;
  interaction_type: 'pickup_selection' | 'dropoff_selection';
  trip_id?: number | null;
  interaction_data: any; // Cambio: hacer requerido ya que siempre enviamos datos
}

export interface SafePointInteractionResponse {
  success: boolean;
  interaction?: {
    id: number;
    safepoint_id: number;
    user_id: string;
    trip_id: number | null;
    interaction_type: string;
    interaction_data: any;
    status: string;
    created_at: string;
  };
  message?: string;
  error?: string;
}

/**
 * Guardar interacción de SafePoint (selección de recogida o descenso)
 */
export async function saveSafePointInteraction(data: SafePointInteractionRequest): Promise<SafePointInteractionResponse> {
  try {
    // Validaciones de entrada
    if (data.safepoint_id === null || data.safepoint_id === undefined) {
      throw new Error('safepoint_id es requerido');
    }
    
    if (!data.interaction_type) {
      throw new Error('interaction_type es requerido');
    }
    
    if (!data.interaction_data || typeof data.interaction_data !== 'object') {
      throw new Error('interaction_data es requerido y debe ser un objeto');
    }

    console.log('📝 [SAFEPOINT_INTERACTION] Guardando interacción:', data);

    // Formato exacto que espera el backend según SafePointInteractionRequest
    const requestBody = {
      safepoint_id: Number(data.safepoint_id), // Asegurar que sea número
      trip_id: data.trip_id || null,
      interaction_type: data.interaction_type,
      interaction_data: {
        ...data.interaction_data,
        timestamp: new Date().toISOString(),
        frontend_version: '2025_production',
        user_context: 'passenger_selection'
      }
    };

    console.log('🚀 [SAFEPOINT_INTERACTION] Request body enviado al backend:', JSON.stringify(requestBody, null, 2));

    const response = await apiRequest('/safepoints/interact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📨 [SAFEPOINT_INTERACTION] Respuesta del backend:', response);

    if (!response) {
      throw new Error('No se recibió respuesta del backend');
    }

    if (!response.success) {
      throw new Error(response.error || response.message || 'Error guardando interacción de SafePoint');
    }

    console.log('✅ [SAFEPOINT_INTERACTION] Interacción guardada exitosamente:', response.interaction);

    return {
      success: true,
      interaction: response.interaction,
      message: response.message || 'Interacción guardada correctamente'
    };

  } catch (error) {
    console.error('❌ [SAFEPOINT_INTERACTION] Error completo:', error);
    console.error('❌ [SAFEPOINT_INTERACTION] Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('❌ [SAFEPOINT_INTERACTION] Datos enviados:', data);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Actualizar trip_id en interacciones pendientes
 */
export async function updateSafePointInteractionsTripId(
  tripId: number,
  interactionIds?: number[]
): Promise<{
  success: boolean;
  updated_count?: number;
  message?: string;
  error?: string;
}> {
  try {
    console.log('🔄 [SAFEPOINT_UPDATE] Actualizando trip_id:', { tripId, interactionIds });

    // Si no hay IDs específicos, actualizar todas las interacciones del usuario sin trip_id
    // Esto es más simple y eficiente que manejar IDs específicos
    const requestBody = {
      trip_id: tripId,
      update_pending: true // Bandera para actualizar interacciones pendientes del usuario actual
    };

    console.log('🚀 [SAFEPOINT_UPDATE] Request body enviado al backend:', requestBody);

    const response = await apiRequest('/safepoints/update-trip-id', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📨 [SAFEPOINT_UPDATE] Respuesta del backend:', response);

    if (!response.success) {
      throw new Error(response.error || 'Error actualizando trip_id en interacciones');
    }

    console.log('✅ [SAFEPOINT_UPDATE] Trip_id actualizado exitosamente:', response);

    return {
      success: true,
      updated_count: response.updated_count || 0,
      message: `${response.updated_count || 0} interacciones actualizadas con trip_id ${tripId}`
    };

  } catch (error) {
    console.error('❌ [SAFEPOINT_UPDATE] Error completo:', error);
    console.error('❌ [SAFEPOINT_UPDATE] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}