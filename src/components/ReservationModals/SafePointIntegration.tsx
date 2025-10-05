import { useState } from 'react';
import { Button } from '@mantine/core';
import { SafePointSelector } from '../SafePointSelector';
import type { Trip } from '@/types/Trip';

interface SafePointIntegrationProps {
  trip: Trip;
  onSafePointsSelected?: (pickup: any, dropoff: any) => void;
}

export function SafePointIntegration({ trip, onSafePointsSelected }: SafePointIntegrationProps) {
  const [safePointModalOpen, setSafePointModalOpen] = useState(false);

  const handleSafePointSelection = (pickupPoint: any, dropoffPoint: any) => {
    console.log('✅ SafePoints seleccionados:', {
      pickup: pickupPoint,
      dropoff: dropoffPoint
    });
    
    // Notificar al componente padre
    onSafePointsSelected?.(pickupPoint, dropoffPoint);
    
    // Cerrar modal
    setSafePointModalOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setSafePointModalOpen(true)}
        fullWidth
      >
        Seleccionar Puntos de Recogida y Descenso
      </Button>

      <SafePointSelector
        trip={trip}
        isOpen={safePointModalOpen}
        onClose={() => setSafePointModalOpen(false)}
        onSafePointsSelected={handleSafePointSelection}
      />
    </>
  );
}
