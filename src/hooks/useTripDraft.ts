import { useState, useEffect, useCallback } from 'react';
import { type TripLocation } from '../types/PublicarViaje/TripDataManagement';

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

      // Por ahora, simular la carga desde localStorage para desarrollo
      // En producción esto vendría del backend
      const savedDraft = localStorage.getItem('tripDraft');
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        setDraft(parsedDraft);
        setSafePointSelections(parsedDraft.draft_safepoint_selections || []);
        setStopovers(parsedDraft.draft_stopovers || []);
        
        console.log('✅ Draft loaded from localStorage:', parsedDraft);
      } else {
        setDraft(null);
        setSafePointSelections([]);
        setStopovers([]);
      }

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

      // Guardar en localStorage para desarrollo
      localStorage.setItem('tripDraft', JSON.stringify(draftData));
      setDraft(draftData);

      console.log('✅ Draft created/updated:', draftData);
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
      localStorage.removeItem('tripDraft');
      setDraft(null);
      setSafePointSelections([]);
      setStopovers([]);
      setError(null);
      
      console.log('✅ Draft cleared');
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
      const newSelection: SafePointSelection = {
        id: Date.now(),
        safepoint_id: data.safepoint_id,
        selection_type: data.selection_type,
        route_order: data.route_order,
        created_at: new Date().toISOString()
      };

      const updatedSelections = [...safePointSelections, newSelection];
      setSafePointSelections(updatedSelections);

      // Actualizar draft en localStorage
      if (draft) {
        const updatedDraft = {
          ...draft,
          draft_safepoint_selections: updatedSelections,
          updated_at: new Date().toISOString()
        };
        localStorage.setItem('tripDraft', JSON.stringify(updatedDraft));
        setDraft(updatedDraft);
      }

      console.log('✅ SafePoint added to draft:', newSelection);
      return { success: true, selection: newSelection };

    } catch (err) {
      console.error('❌ Error adding SafePoint to draft:', err);
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

      // Actualizar draft en localStorage
      if (draft) {
        const updatedDraft = {
          ...draft,
          draft_stopovers: updatedStopovers,
          updated_at: new Date().toISOString()
        };
        localStorage.setItem('tripDraft', JSON.stringify(updatedDraft));
        setDraft(updatedDraft);
      }

      console.log('✅ Stopover added to draft:', newStopover);
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
