import { supabase } from './supabaseClient';
import type { Database } from '../types/Database';

type AssumptionsRow = Database['public']['Tables']['assumptions']['Row'];

export class AssumptionsService {
  /**
   * Obtiene la configuración actual (siempre el primer y único registro)
   */
  static async getAssumptions(): Promise<AssumptionsRow | null> {
    const { data, error } = await supabase
      .from('assumptions')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching assumptions:', error);
      return null;
    }

    return data;
  }

  /**
   * Calcula el precio base de un viaje basado en la distancia y tipo de ruta
   */
  static async calculateTripPrice(distanceKm: number, isUrban: boolean = true): Promise<number> {
    const assumptions = await this.getAssumptions();
    
    if (!assumptions) {
      throw new Error('No se pudo obtener la configuración de precios');
    }

    const pricePerKm = isUrban ? assumptions.urban_price_per_km : assumptions.interurban_price_per_km;
    return distanceKm * pricePerKm;
  }

  /**
   * Calcula el fee que se cobra por un cupo
   */
  static async calculateFee(tripPrice: number): Promise<number> {
    const assumptions = await this.getAssumptions();
    
    if (!assumptions) {
      throw new Error('No se pudo obtener la configuración de fees');
    }

    return (tripPrice * assumptions.fee_percentage) / 100;
  }

  /**
   * Calcula el precio total incluyendo el fee
   */
  static async calculateTotalPrice(distanceKm: number, isUrban: boolean = true): Promise<{
    basePrice: number;
    fee: number;
    totalPrice: number;
  }> {
    const basePrice = await this.calculateTripPrice(distanceKm, isUrban);
    const fee = await this.calculateFee(basePrice);
    const totalPrice = basePrice + fee;

    return {
      basePrice,
      fee,
      totalPrice
    };
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
    const assumptions = await this.getAssumptions();
    
    if (!assumptions) {
      return null;
    }

    return {
      urbanPricePerKm: assumptions.urban_price_per_km,
      interurbanPricePerKm: assumptions.interurban_price_per_km,
      feePercentage: assumptions.fee_percentage,
      priceLimitPercentage: assumptions.price_limit_percentage,
      alertThresholdPercentage: assumptions.alert_threshold_percentage
    };
  }
}

export default AssumptionsService;
