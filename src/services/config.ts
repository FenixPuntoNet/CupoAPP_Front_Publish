import { apiRequest } from '@/config/api';

interface Assumptions {
  urban_price_per_km: number;
  interurban_price_per_km: number;
  price_limit_percentage: number;
  alert_threshold_percentage: number;
  fee_percentage?: number;
}

interface PriceCalculationResult {
  distance_km: number;
  is_urban: boolean;
  price_per_km: number;
  total_trip_price: number;
  suggested_price_per_seat: number;
  price_range: {
    min: number;
    max: number;
  };
}

// Obtener configuración de precios (assumptions)
export const getAssumptions = async (): Promise<Assumptions | null> => {
  try {
    const response = await apiRequest('/config/assumptions');
    return response.assumptions;
  } catch (error) {
    console.error('Error getting assumptions:', error);
    return null;
  }
};

// Calcular precio sugerido para una ruta
export const calculateSuggestedPrice = async (distance: string): Promise<PriceCalculationResult | null> => {
  try {
    const response = await apiRequest('/config/calculate-price', {
      method: 'POST',
      body: JSON.stringify({ distance })
    });
    return response;
  } catch (error) {
    console.error('Error calculating suggested price:', error);
    return null;
  }
};

// Calcular el precio base de un viaje basado en la distancia y tipo de ruta
export const calculateTripPrice = async (distanceKm: number, isUrban: boolean = true): Promise<number> => {
  const assumptions = await getAssumptions();
  
  if (!assumptions) {
    throw new Error('No se pudo obtener la configuración de precios');
  }

  const pricePerKm = isUrban ? assumptions.urban_price_per_km : assumptions.interurban_price_per_km;
  return distanceKm * pricePerKm;
};

// Calcular el fee que se cobra por un cupo
export const calculateFee = async (tripPrice: number): Promise<number> => {
  const assumptions = await getAssumptions();
  
  if (!assumptions) {
    throw new Error('No se pudo obtener la configuración de fees');
  }

  // Si no hay fee_percentage, usar un valor por defecto del 10%
  const feePercentage = assumptions.fee_percentage || 10;
  return (tripPrice * feePercentage) / 100;
};

// Calcular el precio total incluyendo el fee
export const calculateTotalPrice = async (distanceKm: number, isUrban: boolean = true): Promise<{
  basePrice: number;
  fee: number;
  totalPrice: number;
}> => {
  const basePrice = await calculateTripPrice(distanceKm, isUrban);
  const fee = await calculateFee(basePrice);
  const totalPrice = basePrice + fee;

  return {
    basePrice,
    fee,
    totalPrice
  };
};

// Obtener los precios actuales de forma rápida para mostrar en UI
export const getCurrentPricing = async (): Promise<{
  urbanPricePerKm: number;
  interurbanPricePerKm: number;
  feePercentage: number;
  priceLimitPercentage: number;
  alertThresholdPercentage: number;
} | null> => {
  const assumptions = await getAssumptions();
  
  if (!assumptions) {
    return null;
  }

  return {
    urbanPricePerKm: assumptions.urban_price_per_km,
    interurbanPricePerKm: assumptions.interurban_price_per_km,
    feePercentage: assumptions.fee_percentage || 10,
    priceLimitPercentage: assumptions.price_limit_percentage,
    alertThresholdPercentage: assumptions.alert_threshold_percentage
  };
};
