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
    console.log('📝 Adding SafePoint to draft:', data);
    
    // El backend espera estos campos específicos según el error
    const requestBody = {
      safepoint_id: data.safepoint_id,
      trip_id: null, // NULL para borrador
      interaction_type: data.selection_type, // El backend espera 'interaction_type', no 'selection_type'
      interaction_data: {
        // El backend requiere interaction_data como objeto
        route_order: data.route_order,
        notes: data.notes || '',
        is_draft_interaction: true,
        selection_type: data.selection_type // Incluir también en interaction_data por compatibilidad
      }
    };

    console.log('📡 Sending request body:', requestBody);
    
    const response = await apiRequest('/safepoints/interact', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    if (!response.success) {
      throw new Error(response.error || 'Error agregando SafePoint al borrador');
    }

    console.log('✅ SafePoint added to draft successfully');
    return {
      success: true,
      selection: response.interaction
    };

  } catch (error) {
    console.error('❌ Error adding SafePoint to draft:', error);
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
