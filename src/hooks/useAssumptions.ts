import { useState, useEffect } from 'react';
import {
  getAssumptions,
  calculateTripPriceViaBackend,
  calculateFee,
  getCurrentPricing
} from '../services/config';

interface Assumptions {
  urban_price_per_km: number;
  interurban_price_per_km: number;
  price_limit_percentage: number;
  alert_threshold_percentage: number;
  fee_percentage?: number;
}

interface UseAssumptionsReturn {
  assumptions: Assumptions | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  calculateTripPrice: (distanceKm: number) => Promise<number>;
  calculateFee: (tripPrice: number) => Promise<number>;
  calculateTotalPrice: (distanceKm: number) => Promise<{
    basePrice: number;
    fee: number;
    totalPrice: number;
  }>;
}

export const useAssumptions = (): UseAssumptionsReturn => {
  const [assumptions, setAssumptions] = useState<Assumptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssumptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAssumptions();
      setAssumptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar configuración');
      console.error('Error fetching assumptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTripPriceWrapper = async (distanceKm: number): Promise<number> => {
    try {
      console.log('🔥 [HOOK] DELEGANDO cálculo al backend para:', distanceKm, 'km');
      
      // SOLO delegar al backend - NO hacer cálculos aquí
      const result = await calculateTripPriceViaBackend(distanceKm);
      if (result) {
        console.log('✅ [HOOK] Precio recibido del backend:', result.total_trip_price);
        return result.total_trip_price;
      }
      throw new Error('No se pudo calcular el precio via backend');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al calcular precio');
      throw err;
    }
  };

  const calculateFeeWrapper = async (tripPrice: number): Promise<number> => {
    try {
      return await calculateFee(tripPrice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al calcular fee');
      throw err;
    }
  };

  const calculateTotalPriceWrapper = async (distanceKm: number) => {
    try {
      console.log('🔥 [HOOK] DELEGANDO cálculo total al backend para:', distanceKm, 'km');
      
      // SOLO delegar al backend - NO hacer cálculos aquí  
      const result = await calculateTripPriceViaBackend(distanceKm);
      if (result) {
        const basePrice = result.total_trip_price;
        const fee = await calculateFee(basePrice);
        
        console.log('✅ [HOOK] Precio total calculado:', {
          basePrice,
          fee,
          totalPrice: basePrice + fee
        });
        
        return {
          basePrice,
          fee,
          totalPrice: basePrice + fee
        };
      }
      throw new Error('No se pudo calcular el precio total via backend');
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
    calculateTripPrice: calculateTripPriceWrapper,
    calculateFee: calculateFeeWrapper,
    calculateTotalPrice: calculateTotalPriceWrapper
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
        const data = await getCurrentPricing();
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
