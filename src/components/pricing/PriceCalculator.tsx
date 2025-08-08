import React, { useState } from 'react';
import { useAssumptions } from '../../hooks/useAssumptions';

interface PriceCalculatorProps {
  distanceKm?: number;
  onPriceCalculated?: (price: number, fee: number, total: number) => void;
}

const PriceCalculator: React.FC<PriceCalculatorProps> = ({ 
  distanceKm = 0, 
  onPriceCalculated 
}) => {
  const { assumptions, loading, calculateTotalPrice } = useAssumptions();
  const [distance, setDistance] = useState(distanceKm);
  const [isUrban, setIsUrban] = useState(true);
  const [calculatedPrice, setCalculatedPrice] = useState<{
    basePrice: number;
    fee: number;
    totalPrice: number;
  } | null>(null);
  const [calculating, setCalculating] = useState(false);

  const handleCalculate = async () => {
    if (distance <= 0) return;

    setCalculating(true);
    try {
      const result = await calculateTotalPrice(distance);
      setCalculatedPrice(result);
      onPriceCalculated?.(result.basePrice, result.fee, result.totalPrice);
    } catch (error) {
      console.error('Error calculating price:', error);
    } finally {
      setCalculating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!assumptions) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">No se pudo cargar la configuración de precios</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Calculadora de Precios</h3>
      
      {/* Configuración Actual */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Configuración Actual:</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
          <div>
            <span className="text-gray-600">Urbano:</span> {formatCurrency(assumptions.urban_price_per_km)}/km
          </div>
          <div>
            <span className="text-gray-600">Interurbano:</span> {formatCurrency(assumptions.interurban_price_per_km)}/km
          </div>
          <div>
            <span className="text-gray-600">Comisión:</span> {assumptions.fee_percentage}%
          </div>
        </div>
      </div>

      {/* Formulario de Cálculo */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Distancia (km)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={distance}
            onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ingrese la distancia en kilómetros"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Ruta
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="routeType"
                checked={isUrban}
                onChange={() => setIsUrban(true)}
                className="mr-2"
              />
              <span className="text-sm">Urbana</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="routeType"
                checked={!isUrban}
                onChange={() => setIsUrban(false)}
                className="mr-2"
              />
              <span className="text-sm">Interurbana</span>
            </label>
          </div>
        </div>

        <button
          onClick={handleCalculate}
          disabled={calculating || distance <= 0}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {calculating ? 'Calculando...' : 'Calcular Precio'}
        </button>

        {/* Resultados */}
        {calculatedPrice && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-3">Resultado del Cálculo:</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-blue-700">Precio base ({distance} km × {formatCurrency(isUrban ? assumptions.urban_price_per_km : assumptions.interurban_price_per_km)}):</span>
                <span className="font-semibold text-blue-900">
                  {formatCurrency(calculatedPrice.basePrice)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700">Comisión ({assumptions.fee_percentage}%):</span>
                <span className="font-semibold text-blue-900">
                  {formatCurrency(calculatedPrice.fee)}
                </span>
              </div>
              <div className="border-t border-blue-300 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-blue-800 font-medium">Total a pagar:</span>
                  <span className="font-bold text-blue-900 text-lg">
                    {formatCurrency(calculatedPrice.totalPrice)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceCalculator;
