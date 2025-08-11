import { useState, useEffect, useCallback } from 'react';
import { type TripLocation } from '../types/PublicarViaje/TripDataManagement';
import { addSafePointToDraft as addSafePointToDraftService } from '../services/trip-drafts';

// ==================== INTERFACES ====================

interface SafePointSelection {
  id: number;
  safepoint_id: number;
  selection_type: 'pickup_selection' | 'dropoff_selection';
  route_order: number;
  created_at: string;
}

interface DraftStopover {
  id: number;
  location_id: number;
  order: number;
  estimated_time?: string;
  created_at: string;
  location?: {
    id: number;
    main_text: string;
    address: string;
    latitude: string;
    longitude: string;
  };
}

interface TripDraft {
  id: number;
  user_id: string;
  origin_data: any;
  destination_data: any;
  draft_safepoint_selections?: SafePointSelection[];
  draft_stopovers?: DraftStopover[];
  created_at: string;
  updated_at: string;
}

// ==================== HOOK PRINCIPAL ====================

export function useTripDraft() {
  const [draft, setDraft] = useState<TripDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados derivados para fácil acceso
  const [safePointSelections, setSafePointSelections] = useState<SafePointSelection[]>([]);
  const [stopovers, setStopovers] = useState<DraftStopover[]>([]);

  // Verificar si hay un borrador activo
  const hasDraft = Boolean(draft);

  // Cargar borrador activo del usuario
  const loadActiveDraft = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📋 [HOOK] Loading draft from BACKEND ONLY (NO localStorage)...');

      // ✅ SOLO BACKEND - NO localStorage
      // Los datos se cargan desde la base de datos cuando se necesiten
      // Por ahora inicializamos vacío para evitar localStorage
      setDraft(null);
      setSafePointSelections([]);
      setStopovers([]);
      
      console.log('✅ [HOOK] Draft initialized (backend-only mode)');

    } catch (err) {
      console.error('❌ Error loading draft:', err);
      setError(err instanceof Error ? err.message : 'Error cargando borrador');
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear o actualizar borrador
  const createOrUpdateTripDraft = useCallback(async (
    origin: TripLocation,
    destination: TripLocation
  ) => {
    try {
      setLoading(true);
      setError(null);

      console.log('📝 [HOOK] Creating/updating draft (BACKEND ONLY):', { origin, destination });

      const draftData: TripDraft = {
        id: Date.now(), // ID temporal para desarrollo
        user_id: 'current_user', // En producción vendría del contexto de autenticación
        origin_data: origin,
        destination_data: destination,
        draft_safepoint_selections: safePointSelections,
        draft_stopovers: stopovers,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // ✅ SOLO BACKEND - NO localStorage
      setDraft(draftData);

      console.log('✅ [HOOK] Draft created/updated in memory only (no localStorage):', draftData);
      return { success: true, draft: draftData };

    } catch (err) {
      console.error('❌ Error creating/updating draft:', err);
      setError(err instanceof Error ? err.message : 'Error guardando borrador');
      return { success: false, error: err instanceof Error ? err.message : 'Error guardando borrador' };
    } finally {
      setLoading(false);
    }
  }, [safePointSelections, stopovers]);

  // Limpiar borrador
  const clearTripDraft = useCallback(async () => {
    try {
      console.log('🧹 [HOOK] Clearing draft (memory only, no localStorage)');
      
      setDraft(null);
      setSafePointSelections([]);
      setStopovers([]);
      setError(null);
      
      console.log('✅ [HOOK] Draft cleared from memory');
      return { success: true };

    } catch (err) {
      console.error('❌ Error clearing draft:', err);
      setError(err instanceof Error ? err.message : 'Error limpiando borrador');
      return { success: false, error: err instanceof Error ? err.message : 'Error limpiando borrador' };
    }
  }, []);

  // Agregar SafePoint selection al borrador
  const addSafePointToDraft = useCallback(async (data: {
    safepoint_id: number;
    selection_type: 'pickup_selection' | 'dropoff_selection';
    route_order: number;
  }) => {
    try {
      // ✅ SOLO BACKEND: Llamar al servicio del backend
      console.log('📝 [HOOK] Adding SafePoint ONLY to backend (NO localStorage):', data);
      
      const backendResult = await addSafePointToDraftService({
        safepoint_id: data.safepoint_id,
        selection_type: data.selection_type,
        route_order: data.route_order
      });

      if (!backendResult.success) {
        throw new Error(backendResult.error || 'Error guardando en backend');
      }

      console.log('✅ [HOOK] SafePoint saved to BACKEND ONLY - NO localStorage used');

      // Solo actualizar el estado local para la UI (NO localStorage)
      const newSelection: SafePointSelection = {
        id: Date.now(),
        safepoint_id: data.safepoint_id,
        selection_type: data.selection_type,
        route_order: data.route_order,
        created_at: new Date().toISOString()
      };

      const updatedSelections = [...safePointSelections, newSelection];
      setSafePointSelections(updatedSelections);

      // ✅ SOLO actualizar draft en memoria (NO localStorage)
      if (draft) {
        const updatedDraft = {
          ...draft,
          draft_safepoint_selections: updatedSelections,
          updated_at: new Date().toISOString()
        };
        setDraft(updatedDraft);
      }

      console.log('✅ [HOOK] SafePoint added ONLY to backend + memory (NO localStorage):', newSelection);
      return { 
        success: true, 
        selection: newSelection,
        backend_interaction: backendResult.selection 
      };

    } catch (err) {
      console.error('❌ [HOOK] Error adding SafePoint to draft:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Error agregando SafePoint' };
    }
  }, [draft, safePointSelections]);

  // Agregar stopover al borrador
  const addStopoverToDraft = useCallback(async (data: {
    location_id: number;
    order: number;
    estimated_time?: string;
    location?: any;
  }) => {
    try {
      console.log('📝 [HOOK] Adding stopover ONLY to memory (NO localStorage):', data);
      
      const newStopover: DraftStopover = {
        id: Date.now(),
        location_id: data.location_id,
        order: data.order,
        estimated_time: data.estimated_time,
        created_at: new Date().toISOString(),
        location: data.location
      };

      const updatedStopovers = [...stopovers, newStopover];
      setStopovers(updatedStopovers);

      // ✅ SOLO actualizar draft en memoria (NO localStorage)
      if (draft) {
        const updatedDraft = {
          ...draft,
          draft_stopovers: updatedStopovers,
          updated_at: new Date().toISOString()
        };
        setDraft(updatedDraft);
      }

      console.log('✅ [HOOK] Stopover added to memory only (NO localStorage):', newStopover);
      return { success: true, stopover: newStopover };

    } catch (err) {
      console.error('❌ Error adding stopover to draft:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Error agregando parada' };
    }
  }, [draft, stopovers]);

  // Cargar draft al montar el hook
  useEffect(() => {
    loadActiveDraft();
  }, [loadActiveDraft]);

  return {
    // Estado del borrador
    draft,
    loading,
    error,
    hasDraft,

    // Datos derivados
    safePointSelections,
    stopovers,

    // Funciones principales
    loadActiveDraft,
    createOrUpdateTripDraft,
    clearTripDraft,
    addSafePointToDraft,
    addStopoverToDraft
  };
}

export default useTripDraft;
