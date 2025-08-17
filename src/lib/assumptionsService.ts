import type { Database } from '../types/Database';

type AssumptionsRow = Database['public']['Tables']['assumptions']['Row'];

export class AssumptionsService {
  /**
   * Obtiene la configuración actual (siempre el primer y único registro)
   */
  static async getAssumptions(): Promise<AssumptionsRow | null> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/assumptions/get-assumptions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Error fetching assumptions:', response.status);
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching assumptions:', error);
      return null;
    }
  }

  /**
   * Calcula el precio base de un viaje basado en la distancia y tipo de ruta
   */
  static async calculateTripPrice(distanceKm: number, isUrban: boolean = true): Promise<number> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/assumptions/calculate-trip-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          distanceKm,
          isUrban
        })
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error al calcular precio del viaje');
      }

      return data.basePrice;
    } catch (error) {
      console.error('Error calculating trip price:', error);
      throw new Error('No se pudo calcular el precio del viaje');
    }
  }

  /**
   * Calcula el fee que se cobra por un cupo
   */
  static async calculateFee(tripPrice: number): Promise<number> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/assumptions/calculate-fee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripPrice
        })
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error al calcular fee');
      }

      return data.fee;
    } catch (error) {
      console.error('Error calculating fee:', error);
      throw new Error('No se pudo calcular el fee');
    }
  }

  /**
   * Calcula el precio total incluyendo el fee
   */
  static async calculateTotalPrice(distanceKm: number, isUrban: boolean = true): Promise<{
    basePrice: number;
    fee: number;
    totalPrice: number;
  }> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/assumptions/calculate-total-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          distanceKm,
          isUrban
        })
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error al calcular precio total');
      }

      return {
        basePrice: data.basePrice,
        fee: data.fee,
        totalPrice: data.totalPrice
      };
    } catch (error) {
      console.error('Error calculating total price:', error);
      throw new Error('No se pudo calcular el precio total');
    }
  }

  /**
   * Obtiene los precios actuales de forma rápida para mostrar en UI
   */
  static async getCurrentPricing(): Promise<{
    urbanPricePerKm: number;
    interurbanPricePerKm: number;
    feePercentage: number;
    priceLimitPercentage: number;
    alertThresholdPercentage: number;
  } | null> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/assumptions/current-pricing`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Error fetching current pricing:', response.status);
        return null;
      }

      const data = await response.json();
      
      if (!data.success || !data.pricing) {
        return null;
      }

      return data.pricing;
    } catch (error) {
      console.error('Error fetching current pricing:', error);
      return null;
    }
  }
}

export default AssumptionsService;
