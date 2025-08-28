import React from 'react';
import './PublishTripCosts.module.css';

interface PublishTripCostsProps {
  costs: {
    tripValue: number;
    percentageFee: number;
    fixedRate: number;
    totalGuarantee: number;
    breakdown: string;
  };
  assumptions: {
    fee_percentage?: number;
    fixed_rate?: number | null;
  };
  seats: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(value);
};

export const PublishTripCosts: React.FC<PublishTripCostsProps> = ({ costs, assumptions, seats }) => {
  const fixedRatePerSeat = (assumptions.fixed_rate || 0);
  
  return (
    <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-lg p-6" style={{ 
      backgroundColor: '#141414',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      color: '#ffffff'
    }}>
      <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: '#00ff9d' }}>
        💰 Costos de Publicación
      </h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Valor total del viaje:</span>
          <span className="font-semibold" style={{ color: '#ffffff' }}>
            {formatCurrency(costs.tripValue)}
          </span>
        </div>
        
        <div className="rounded-md p-3" style={{ 
          backgroundColor: 'rgba(255, 190, 11, 0.1)', 
          borderLeft: '4px solid #ffbe0b'
        }}>
          <h4 className="font-medium mb-2" style={{ color: '#ffbe0b' }}>Garantía a congelar:</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Comisión porcentual ({assumptions.fee_percentage || 10}%):
              </span>
              <span className="font-semibold" style={{ color: '#ffffff' }}>
                {formatCurrency(costs.percentageFee)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Tarifa fija ({seats} cupo{seats > 1 ? 's' : ''} × {formatCurrency(fixedRatePerSeat)}):
              </span>
              <span className="font-semibold" style={{ color: '#ffffff' }}>
                {formatCurrency(costs.fixedRate)}
              </span>
            </div>
            
            <div className="pt-2" style={{ borderTop: '1px solid rgba(255, 190, 11, 0.3)' }}>
              <div className="flex justify-between items-center">
                <span className="font-medium" style={{ color: '#ffbe0b' }}>Total a congelar:</span>
                <span className="font-bold text-lg" style={{ color: '#00ff9d' }}>
                  {formatCurrency(costs.totalGuarantee)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="rounded-md p-3" style={{ 
          backgroundColor: 'rgba(0, 255, 157, 0.1)', 
          border: '1px solid rgba(0, 255, 157, 0.3)'
        }}>
          <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            <span className="font-medium" style={{ color: '#00ff9d' }}>💡 Información importante:</span>
            <br />
            Este monto se congelará temporalmente en tu wallet. Se descongelará gradualmente cuando valides los cupos de tus pasajeros.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublishTripCosts;
