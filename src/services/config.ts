import { apiRequest } from '@/config/api';

export interface Assumptions {
  urban_price_per_km: number;
  interurban_price_per_km: number;
  price_limit_percentage: number;
  alert_threshold_percentage: number;
  fee_percentage?: number;
  fixed_rate?: number | null;
}

export interface PriceCalculationResult {
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

// Helper function para parsear distancias de diferentes formatos
const parseDistanceToKm = (distance: string | number): number => {
  if (typeof distance === 'number') {
    return distance;
  }
  
  if (typeof distance === 'string') {
    // Eliminar cualquier texto y extraer solo el número
    const match = distance.match(/([\d,]+\.?\d*)/);
    if (match) {
      return parseFloat(match[1].replace(',', ''));
    }
  }
  
  return 0;
};

// Helper function para formatear distancia para el backend
const formatDistanceForBackend = (distance: string | number): string => {
  const km = parseDistanceToKm(distance);
  return `${km} km`;
};

// Obtener configuración de precios (assumptions) - SOLO LEER DEL BACKEND
export const getAssumptions = async (): Promise<Assumptions | null> => {
  try {
    console.log('🔍 [CONFIG] Fetching assumptions from backend...');
    const response = await apiRequest('/config/assumptions');
    
    if (response && response.assumptions) {
      console.log('✅ [CONFIG] Assumptions loaded successfully:', response.assumptions);
      return response.assumptions;
    }
    
    console.warn('⚠️ [CONFIG] No assumptions found in response:', response);
    return null;
  } catch (error) {
    console.error('❌ [CONFIG] Error getting assumptions:', error);
    return null;
  }
};

// Verificar si existen assumptions (SOLO LEER DEL BACKEND)
export const ensureAssumptionsExist = async (): Promise<Assumptions | null> => {
  try {
    console.log('🔍 [CONFIG] Verificando assumptions en backend...');
    
    // SOLO obtener las assumptions existentes - NO crear ni modificar
    const assumptions = await getAssumptions();
    
    if (assumptions) {
      console.log('✅ [CONFIG] Assumptions encontradas en backend:', assumptions);
      return assumptions;
    }
    
    console.warn('⚠️ [CONFIG] No se encontraron assumptions en el backend');
    console.warn('⚠️ [CONFIG] El administrador debe configurar los precios en el backend');
    return null;
    
  } catch (error) {
    console.error('❌ [CONFIG] Error verificando assumptions:', error);
    return null;
  }
};

// Calcular precio usando SOLO el backend (/calculate-price)
export const calculateTripPriceViaBackend = async (distance: string | number): Promise<PriceCalculationResult | null> => {
  try {
    console.log('🔥 [CONFIG] USANDO SOLO BACKEND para calcular precio:', distance);
    
    // Formatear la distancia para el backend
    const distanceString = formatDistanceForBackend(distance);
    console.log('📤 [CONFIG] Enviando al backend /config/calculate-price:', distanceString);
    
    // SOLO llamar al backend /config/calculate-price - NO hacer cálculos locales
    const response = await apiRequest('/config/calculate-price', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ distance: distanceString })
    });
    
    if (response) {
      console.log('🎉 [CONFIG] Respuesta del backend recibida:', {
        distance_km: response.distance_km,
        is_urban: response.is_urban,
        price_per_km: response.price_per_km,
        total_trip_price: response.total_trip_price,
        suggested_price_per_seat: response.suggested_price_per_seat
      });
      
      return response;
    }
    
    console.error('❌ [CONFIG] No response from backend calculate-price');
    return null;
  } catch (error) {
    console.error('❌ [CONFIG] Error calling backend calculate-price:', error);
    return null;
  }
};

// Calcular precio sugerido (REDIRIGE A calculateTripPriceViaBackend)
export const calculateSuggestedPrice = async (distance: string | number): Promise<PriceCalculationResult | null> => {
  console.log('🔄 [CONFIG] Redirecting to calculateTripPriceViaBackend...');
  return calculateTripPriceViaBackend(distance);
};

// Calcular el fee que se cobra por un cupo - USA ASSUMPTIONS DEL BACKEND
export const calculateFee = async (tripPrice: number): Promise<{
  percentageFee: number;
  fixedRate: number;
  totalFee: number;
}> => {
  const assumptions = await getAssumptions();
  
  if (!assumptions) {
    throw new Error('No se pudo obtener la configuración de fees del backend');
  }

  // Usar el fee_percentage que viene del backend
  const feePercentage = assumptions.fee_percentage || 10;
  const fixedRate = assumptions.fixed_rate || 0;
  const percentageFee = Math.ceil((tripPrice * feePercentage) / 100);
  const totalFee = percentageFee + fixedRate;

  return {
    percentageFee,
    fixedRate,
    totalFee
  };
};

// Obtener los precios actuales de forma rápida para mostrar en UI - SOLO DEL BACKEND
export const getCurrentPricing = async (): Promise<{
  urbanPricePerKm: number;
  interurbanPricePerKm: number;
  feePercentage: number;
  fixedRate: number;
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
    fixedRate: assumptions.fixed_rate || 0,
    priceLimitPercentage: assumptions.price_limit_percentage || 20,
    alertThresholdPercentage: assumptions.alert_threshold_percentage || 30
  };
};

// Calcular costos de publicar viaje (garantía que se congela)
export const calculatePublishingCosts = async (seats: number, pricePerSeat: number): Promise<{
  tripValue: number;
  percentageFee: number;
  fixedRate: number;
  totalGuarantee: number;
  breakdown: string;
} | null> => {
  const assumptions = await getAssumptions();
  
  if (!assumptions) {
    return null;
  }

  const tripValue = seats * pricePerSeat;
  const feePercentage = assumptions.fee_percentage || 10;
  const fixedRatePerSeat = assumptions.fixed_rate || 0;
  const totalFixedRate = fixedRatePerSeat * seats; // Tarifa fija POR CUPO
  const percentageFee = Math.ceil(tripValue * (feePercentage / 100));
  const totalGuarantee = percentageFee + totalFixedRate;

  return {
    tripValue,
    percentageFee,
    fixedRate: totalFixedRate,
    totalGuarantee,
    breakdown: `${feePercentage}% ($${percentageFee.toLocaleString()}) + Tarifa fija (${seats} × $${fixedRatePerSeat.toLocaleString()}) = $${totalGuarantee.toLocaleString()}`
  };
};

// Calcular comisión por validar cupo (solo se cobra por 1 cupo validado)
export const calculateCommission = async (pricePerSeat: number): Promise<{
  percentageCommission: number;
  fixedRate: number;
  totalCommission: number;
  refundAmount: number;
  breakdown: string;
} | null> => {
  const assumptions = await getAssumptions();
  
  if (!assumptions) {
    return null;
  }

  const feePercentage = assumptions.fee_percentage || 10;
  const fixedRatePerSeat = assumptions.fixed_rate || 0; // Tarifa fija POR CUPO
  const percentageCommission = Math.ceil(pricePerSeat * (feePercentage / 100));
  const totalCommission = percentageCommission + fixedRatePerSeat;
  const refundAmount = pricePerSeat - totalCommission;

  return {
    percentageCommission,
    fixedRate: fixedRatePerSeat,
    totalCommission,
    refundAmount,
    breakdown: `${feePercentage}% ($${percentageCommission.toLocaleString()}) + Tarifa fija por cupo ($${fixedRatePerSeat.toLocaleString()}) = $${totalCommission.toLocaleString()}`
  };
};
