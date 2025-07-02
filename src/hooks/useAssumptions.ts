import { useState, useEffect } from 'react';
import { AssumptionsService } from '../lib/assumptionsService';
import type { Database } from '../types/Database';

type AssumptionsRow = Database['public']['Tables']['assumptions']['Row'];

interface UseAssumptionsReturn {
  assumptions: AssumptionsRow | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  calculateTripPrice: (distanceKm: number, isUrban?: boolean) => Promise<number>;
  calculateFee: (tripPrice: number) => Promise<number>;
  calculateTotalPrice: (distanceKm: number, isUrban?: boolean) => Promise<{
    basePrice: number;
    fee: number;
    totalPrice: number;
  }>;
}

export const useAssumptions = (): UseAssumptionsReturn => {
  const [assumptions, setAssumptions] = useState<AssumptionsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssumptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AssumptionsService.getAssumptions();
      setAssumptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar configuración');
      console.error('Error fetching assumptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTripPrice = async (distanceKm: number, isUrban: boolean = true): Promise<number> => {
    try {
      return await AssumptionsService.calculateTripPrice(distanceKm, isUrban);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al calcular precio');
      throw err;
    }
  };

  const calculateFee = async (tripPrice: number): Promise<number> => {
    try {
      return await AssumptionsService.calculateFee(tripPrice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al calcular fee');
      throw err;
    }
  };

  const calculateTotalPrice = async (distanceKm: number, isUrban: boolean = true) => {
    try {
      return await AssumptionsService.calculateTotalPrice(distanceKm, isUrban);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al calcular precio total');
      throw err;
    }
  };

  useEffect(() => {
    fetchAssumptions();
  }, []);

  return {
    assumptions,
    loading,
    error,
    refetch: fetchAssumptions,
    calculateTripPrice,
    calculateFee,
    calculateTotalPrice
  };
};

// Hook específico para obtener solo los precios actuales (más liviano)
export const usePricing = () => {
  const [pricing, setPricing] = useState<{
    urbanPricePerKm: number;
    interurbanPricePerKm: number;
    feePercentage: number;
    priceLimitPercentage: number;
    alertThresholdPercentage: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await AssumptionsService.getCurrentPricing();
        setPricing(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar precios');
        console.error('Error fetching pricing:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
  }, []);

  return { pricing, loading, error };
};
