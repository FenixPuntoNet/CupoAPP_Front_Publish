import { useMemo } from 'react';

export interface SafePointOption {
  id: number;
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  place_id?: string;
  distance_km?: number;
  rating_average?: number;
}

export function useNoSafePointOption(): SafePointOption {
  return useMemo(() => ({
    id: 0,
    name: 'Sin SafePoint',
    description: 'No usar SafePoint para este viaje',
    category: 'sin_safepoint',
    latitude: 0,
    longitude: 0,
    address: '',
    city: 'Colombia',
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    place_id: 'no_safepoint',
    distance_km: 0,
    rating_average: 0
  }), []);
}

export function isNoSafePointSelected(safepointId: number | undefined | null): boolean {
  return safepointId === 0;
}

export function hasValidSafePointSelection(safepointId: number | undefined | null): boolean {
  return safepointId !== undefined && safepointId !== null && safepointId >= 0;
}

// Función para incluir la opción "Sin SafePoint" en cualquier lista
export function includeNoSafePointOption<T extends { id: number }>(items: T[]): (T | SafePointOption)[] {
  const noSafePointOption = {
    id: 0,
    name: 'Sin SafePoint',
    description: 'No usar SafePoint para este viaje',
    category: 'sin_safepoint',
    latitude: 0,
    longitude: 0,
    address: '',
    city: 'Colombia',
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    place_id: 'no_safepoint',
    distance_km: 0,
    rating_average: 0
  } as SafePointOption;

  return [noSafePointOption, ...items];
}
