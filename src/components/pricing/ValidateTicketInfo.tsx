import React from 'react';
import './ValidateTicketInfo.module.css';

interface ValidateTicketInfoProps {
  commission: {
    bookingPrice: number;
    percentageCommission: number;
    fixedRate: number;
    totalCommission: number;
    refund: number;
    breakdown: string;
  };
  assumptions: {
    fee_percentage?: number;
  };
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(value);
};

export const ValidateTicketInfo: React.FC<ValidateTicketInfoProps> = ({ commission, assumptions }) => {
  return (
    <div className="rounded-lg p-6" style={{ 
      backgroundColor: '#141414',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid',
      color: '#ffffff'
    }}>
      <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: '#00ff9d' }}>
        ✅ Desglose de Validación
      </h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Precio del cupo:</span>
          <span className="font-semibold" style={{ color: '#ffffff' }}>
            {formatCurrency(commission.bookingPrice)}
          </span>
        </div>
        
        <div className="rounded-md p-3" style={{ 
          backgroundColor: 'rgba(255, 77, 77, 0.1)', 
          borderLeft: '4px solid #ff4d4d'
        }}>
          <h4 className="font-medium mb-2" style={{ color: '#ff4d4d' }}>Comisión cobrada:</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Comisión porcentual ({assumptions.fee_percentage || 10}%):
              </span>
              <span className="font-semibold" style={{ color: '#ffffff' }}>
                -{formatCurrency(commission.percentageCommission)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Tarifa fija de servicio por cupo:</span>
              <span className="font-semibold" style={{ color: '#ffffff' }}>
                -{formatCurrency(commission.fixedRate)}
              </span>
            </div>
            
            <div className="pt-2" style={{ borderTop: '1px solid rgba(255, 77, 77, 0.3)' }}>
              <div className="flex justify-between items-center">
                <span className="font-medium" style={{ color: '#ff4d4d' }}>Total comisión:</span>
                <span className="font-bold text-lg" style={{ color: '#ff4d4d' }}>
                  -{formatCurrency(commission.totalCommission)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="rounded-md p-4" style={{ 
          backgroundColor: 'rgba(0, 255, 157, 0.1)', 
          border: '1px solid rgba(0, 255, 157, 0.3)'
        }}>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-lg" style={{ color: '#00ff9d' }}>💰 Recibirás:</span>
            <span className="font-bold text-xl" style={{ color: '#00ff9d' }}>
              {formatCurrency(commission.refund)}
            </span>
          </div>
        </div>
        
        <div className="rounded-md p-3" style={{ 
          backgroundColor: 'rgba(0, 255, 157, 0.1)', 
          border: '1px solid rgba(0, 255, 157, 0.3)'
        }}>
          <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            <span className="font-medium" style={{ color: '#00ff9d' }}>💡 Información:</span>
            <br />
            La comisión se descuenta de tu saldo congelado y el monto restante se libera a tu wallet disponible.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ValidateTicketInfo;
