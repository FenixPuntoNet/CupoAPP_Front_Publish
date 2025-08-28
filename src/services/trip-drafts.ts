import { apiRequest } from '../config/api';

// ==================== INTERFACES ====================

interface SafePointDraftData {
  safepoint_id: number;
  selection_type: 'pickup_selection' | 'dropoff_selection';
  route_order: number;
  notes?: string;
}

interface StopoverDraftData {
  location_id: number;
  order: number;
  estimated_time?: string;
}

// ==================== FUNCIONES PRINCIPALES ====================

/**
 * Agregar SafePoint al borrador (con trip_id = NULL)
 */
export async function addSafePointToDraft(data: SafePointDraftData): Promise<{
  success: boolean;
  selection?: any;
  error?: string;
}> {
  try {
    console.log('📝 [TRIP-DRAFTS] Adding SafePoint to draft:', data);
    
    // ✅ ESTRUCTURA CORRECTA para safepoint_interactions table
    const requestBody = {
      safepoint_id: data.safepoint_id, // Incluir TODOS los IDs (0, 1, 2, etc.)
      trip_id: null, // NULL para borrador - se actualizará cuando se publique el viaje
      interaction_type: data.selection_type, // pickup_selection | dropoff_selection
      interaction_data: {
        // Datos específicos de la interacción en JSONB
        route_order: data.route_order,
        notes: data.notes || '',
        selection_type: data.selection_type,
        is_draft_interaction: true,
        is_sin_safepoint: data.safepoint_id === 0, // Marcar si es "sin safepoint"
        timestamp: new Date().toISOString(),
        user_context: 'conductor_draft',
        draft_metadata: {
          frontend_version: '2025_updated',
          selection_flow: 'conductor_safepoint_draft'
        }
      },
      // Campos adicionales requeridos por la tabla
      negotiation_round: 1,
      parent_interaction_id: null,
      response_deadline: null
    };

    console.log('📡 [TRIP-DRAFTS] Sending to /safepoints/interact:', requestBody);
    
    const response = await apiRequest('/safepoints/interact', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    if (!response.success) {
      console.error('❌ [TRIP-DRAFTS] Backend error:', response.error);
      throw new Error(response.error || 'Error agregando SafePoint al borrador');
    }

    console.log('✅ [TRIP-DRAFTS] SafePoint saved to safepoint_interactions table:', {
      interaction_id: response.interaction?.id,
      safepoint_id: data.safepoint_id,
      interaction_type: data.selection_type,
      trip_id: null,
      is_sin_safepoint: data.safepoint_id === 0
    });

    return {
      success: true,
      selection: response.interaction
    };

  } catch (error) {
    console.error('❌ [TRIP-DRAFTS] Error calling backend:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Agregar parada al borrador (con trip_id = NULL)
 */
export async function addStopoverToDraft(data: StopoverDraftData): Promise<{
  success: boolean;
  stopover?: any;
  error?: string;
}> {
  try {
    console.log('📝 Adding stopover to draft:', data);
    
    const response = await apiRequest('/paradas/create', {
      method: 'POST',
      body: JSON.stringify({
        location_id: data.location_id,
        trip_id: null, // NULL para borrador
        order: data.order,
        estimated_time: data.estimated_time
      })
    });

    if (!response.success) {
      throw new Error(response.error || 'Error agregando parada al borrador');
    }

    console.log('✅ Stopover added to draft successfully');
    return {
      success: true,
      stopover: response.stopover
    };

  } catch (error) {
    console.error('❌ Error adding stopover to draft:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Obtener resumen del borrador actual
 */
export async function getDraftSummary(): Promise<{
  success: boolean;
  summary?: {
    safepoint_selections: number;
    stopovers: number;
    total_items: number;
  };
  error?: string;
}> {
  try {
    console.log('📊 Getting draft summary...');
    
    // En el hook useTripDraft manejamos esto con localStorage
    // Aquí podríamos hacer llamadas al backend si fuera necesario
    const draftData = localStorage.getItem('tripDraft');
    
    if (draftData) {
      const draft = JSON.parse(draftData);
      const safePointCount = draft.draft_safepoint_selections?.length || 0;
      const stopoverCount = draft.draft_stopovers?.length || 0;
      
      return {
        success: true,
        summary: {
          safepoint_selections: safePointCount,
          stopovers: stopoverCount,
          total_items: safePointCount + stopoverCount
        }
      };
    }

    return {
      success: true,
      summary: {
        safepoint_selections: 0,
        stopovers: 0,
        total_items: 0
      }
    };

  } catch (error) {
    console.error('❌ Error getting draft summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

export default {
  addSafePointToDraft,
  addStopoverToDraft,
  getDraftSummary
};
