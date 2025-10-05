import React, { useState } from 'react';
import {
  Modal,
  Card,
  Text,
  Group,
  Button,
  Stack,
  LoadingOverlay,
  Title,
  Box,
  Avatar,
  Paper
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import styles from './SafePointSelector.module.css';

interface SafePoint {
  id: number;
  name: string;
  address: string;
  category: string;
  distance_km?: number;
  rating_average?: number;
}

interface SafePointSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSafePointsSelected: (pickupId: number, dropoffId: number) => void;
}

interface SelectedSafePoints {
  pickup?: SafePoint;
  dropoff?: SafePoint;
}

export const SafePointSelector: React.FC<SafePointSelectorProps> = ({
  isOpen,
  onClose,
  onSafePointsSelected
}) => {
  // Estados principales
  const [isLoading] = useState(false);
  const [selectedSafePoints, setSelectedSafePoints] = useState<SelectedSafePoints>({});
  
  // Estados de datos - simplificado
  const [safePoints] = useState<{
    pickup: SafePoint[];
    dropoff: SafePoint[];
  }>({ 
    pickup: [
      { id: 1, name: "Centro Comercial", address: "Calle 10 #5-30", category: "comercial" },
      { id: 2, name: "Estación Metro", address: "Av. Principal", category: "transporte" }
    ], 
    dropoff: [
      { id: 3, name: "Terminal Norte", address: "Zona Norte", category: "transporte" },
      { id: 4, name: "Plaza Central", address: "Centro Ciudad", category: "comercial" }
    ] 
  });
  
  // Estados de UI
  const [selectionType, setSelectionType] = useState<'pickup' | 'dropoff'>('pickup');

  const handleSafePointSelect = (safepoint: SafePoint, type: 'pickup' | 'dropoff') => {
    setSelectedSafePoints(prev => ({
      ...prev,
      [type]: safepoint
    }));
    
    // Navegación fluida: Recogida → Descenso → Listo
    if (type === 'pickup') {
      setSelectionType('dropoff');
      notifications.show({
        title: '📍 Recogida seleccionada',
        message: `Ahora selecciona el punto de descenso`,
        color: 'green',
        autoClose: 2000,
      });
    } else {
      notifications.show({
        title: '🏁 Descenso seleccionado',
        message: `¡Listo! Puedes confirmar tu reserva`,
        color: 'blue',
        autoClose: 2000,
      });
    }
  };

  const handleConfirmSelection = () => {
    if (!selectedSafePoints.pickup || !selectedSafePoints.dropoff) {
      notifications.show({
        title: 'Selección incompleta',
        message: 'Por favor, selecciona tanto el punto de recogida como el de descenso.',
        color: 'orange',
        autoClose: 4000,
      });
      return;
    }

    onSafePointsSelected(selectedSafePoints.pickup.id, selectedSafePoints.dropoff.id);
    onClose();
  };

  const getCurrentPoints = () => {
    return selectionType === 'pickup' ? safePoints.pickup : safePoints.dropoff;
  };

  const renderSafePointCard = (safepoint: SafePoint) => {
    return (
      <Paper
        key={safepoint.id}
        p="sm"
        className={styles.safePointCard}
        onClick={() => handleSafePointSelect(safepoint, selectionType)}
        style={{ 
          background: 'var(--reservation-card-bg)',
          border: '1px solid var(--reservation-border)',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <Group gap="xs" wrap="nowrap">
          <Avatar
            size="sm"
            radius="xl"
            style={{ 
              background: 'var(--reservation-accent)',
              color: 'white',
              flexShrink: 0
            }}
          >
            📍
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={500} c="var(--reservation-text)" truncate>
              {safepoint.name}
            </Text>
            <Text size="xs" c="var(--reservation-text-secondary)" truncate>
              {safepoint.address}
            </Text>
          </div>
        </Group>
      </Paper>
    );
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={null}
      size="md"
      centered
      closeOnClickOutside={false}
      overlayProps={{
        opacity: 0.7,
        blur: 4,
      }}
      styles={{
        content: {
          background: 'var(--reservation-bg)',
          border: '1px solid var(--reservation-border)',
          borderRadius: '8px',
        },
        header: {
          display: 'none'
        },
        body: {
          padding: '0',
        }
      }}
    >
      <Box className={styles.container}>
        <LoadingOverlay visible={isLoading} />
        
        {/* Header Simple y Compacto */}
        <Group justify="center" gap="sm" mb="lg">
          <Text size="lg" style={{ color: 'var(--reservation-accent)' }}>
            {selectionType === 'pickup' ? '📍' : '🏁'}
          </Text>
          <Title order={3} className={styles.title}>
            {selectionType === 'pickup' ? 'Selecciona Recogida' : 'Selecciona Descenso'}
          </Title>
        </Group>

        {/* Indicador de progreso mejorado */}
        <Group justify="center" gap="sm" mb="lg">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 20px',
            background: 'var(--reservation-card-bg)',
            borderRadius: '25px',
            border: '2px solid var(--reservation-border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: selectedSafePoints.pickup ? 'var(--reservation-accent)' : 
                           selectionType === 'pickup' ? 'var(--reservation-accent)' : 'var(--reservation-border)',
                border: selectionType === 'pickup' && !selectedSafePoints.pickup ? '2px solid var(--reservation-accent)' : 'none'
              }} />
              <Text size="sm" fw={500} c={selectedSafePoints.pickup ? 'var(--reservation-accent)' : 'var(--reservation-text)'}>
                1° Recogida
              </Text>
            </div>
            
            <Text size="sm" c="var(--reservation-text-secondary)">→</Text>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: selectedSafePoints.dropoff ? 'var(--reservation-accent)' : 
                           selectionType === 'dropoff' ? 'var(--reservation-accent)' : 'var(--reservation-border)',
                border: selectionType === 'dropoff' && !selectedSafePoints.dropoff ? '2px solid var(--reservation-accent)' : 'none'
              }} />
              <Text size="sm" fw={500} c={selectedSafePoints.dropoff ? 'var(--reservation-accent)' : 'var(--reservation-text)'}>
                2° Descenso
              </Text>
            </div>
          </div>
        </Group>

        {/* Información del paso actual */}
        <Card 
          className={styles.tripCard} 
          withBorder 
          mb="md"
          style={{
            background: 'var(--reservation-card-bg)',
            border: '2px solid var(--reservation-accent)',
            padding: '16px',
            borderRadius: '12px'
          }}
        >
          <Group justify="center" gap="sm">
            <Text size="lg">
              {selectionType === 'pickup' ? '📍' : '🏁'}
            </Text>
            <div style={{ textAlign: 'center' }}>
              <Text size="sm" fw={600} c="var(--reservation-accent)">
                {selectionType === 'pickup' ? 'PASO 1' : 'PASO 2'}
              </Text>
              <Text size="sm" c="var(--reservation-text)">
                {selectionType === 'pickup' 
                  ? 'Selecciona donde te recogeremos' 
                  : 'Selecciona donde te dejaremos'}
              </Text>
            </div>
          </Group>
        </Card>

        {/* Lista de SafePoints compacta */}
        <div className={styles.content}>
          <Stack gap="xs">
            {getCurrentPoints().map((safepoint: SafePoint) => renderSafePointCard(safepoint))}
          </Stack>
        </div>

        {/* Resumen compacto */}
        {(selectedSafePoints.pickup || selectedSafePoints.dropoff) && (
          <Card 
            className={styles.summaryCard} 
            withBorder 
            mb="md"
            style={{
              background: 'var(--reservation-card-bg)',
              border: '1px solid var(--reservation-border)',
              padding: '12px',
              borderRadius: '6px'
            }}
          >
            <Text size="xs" fw={500} mb="xs" c="var(--reservation-text)">Seleccionados:</Text>
            <Stack gap={4}>
              {selectedSafePoints.pickup && (
                <Group gap="xs">
                  <Text size="xs" c="var(--reservation-accent)">📍</Text>
                  <Text size="xs" c="var(--reservation-text)" truncate>{selectedSafePoints.pickup.name}</Text>
                </Group>
              )}
              {selectedSafePoints.dropoff && (
                <Group gap="xs">
                  <Text size="xs" c="var(--reservation-accent)">🏁</Text>
                  <Text size="xs" c="var(--reservation-text)" truncate>{selectedSafePoints.dropoff.name}</Text>
                </Group>
              )}
            </Stack>
          </Card>
        )}

        {/* Botones de acción */}
        <Group gap="sm">
          <Button
            variant="outline"
            onClick={onClose}
            className={styles.cancelButton}
            flex={1}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmSelection}
            disabled={!selectedSafePoints.pickup || !selectedSafePoints.dropoff}
            className={styles.confirmButton}
            flex={2}
            style={{
              background: (selectedSafePoints.pickup && selectedSafePoints.dropoff) 
                ? 'var(--reservation-accent)' 
                : 'var(--reservation-text-secondary)'
            }}
          >
            {!selectedSafePoints.pickup ? 'Selecciona Recogida' :
             !selectedSafePoints.dropoff ? 'Selecciona Descenso' : 
             'Confirmar Puntos'}
          </Button>
        </Group>
      </Box>
    </Modal>
  );
};