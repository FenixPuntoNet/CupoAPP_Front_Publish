import React, { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Text,
  Group,
  Card,
  Button,
  Badge,
  Alert,
  Loader,
  Select
} from '@mantine/core';
import {
  IconMapPin,
  IconCar,
  IconFlag,
  IconCheck,
  IconInfoCircle
} from '@tabler/icons-react';
import { getTripSafePoints, getSafePointIcon, type SafePoint } from '@/services/booking-safepoints';

interface TripSafePointSelectorProps {
  tripId: number;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (selectedPickupId?: number, selectedDropoffId?: number) => void;
}

const TripSafePointSelector: React.FC<TripSafePointSelectorProps> = ({
  tripId,
  isOpen,
  onClose,
  onComplete
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [safePoints, setSafePoints] = useState<{
    pickup_points: SafePoint[];
    dropoff_points: SafePoint[];
  }>({ pickup_points: [], dropoff_points: [] });
  
  const [selectedPickupId, setSelectedPickupId] = useState<string | null>(null);
  const [selectedDropoffId, setSelectedDropoffId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tripId) {
      loadTripSafePoints();
    }
  }, [isOpen, tripId]);

  const loadTripSafePoints = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 Cargando SafePoints para trip: ${tripId}`);
      const result = await getTripSafePoints(tripId);

      if (result.success) {
        setSafePoints({
          pickup_points: result.pickup_points || [],
          dropoff_points: result.dropoff_points || []
        });
        console.log(`✅ SafePoints cargados:`, result);
      } else {
        console.warn('⚠️ No se pudieron cargar los SafePoints');
        setError(result.error || 'No se pudieron cargar los puntos de encuentro');
      }
    } catch (err) {
      console.error('❌ Error cargando SafePoints:', err);
      setError('Error cargando información de puntos de encuentro');
    } finally {
      setLoading(false);
    }
  };

  const getSelectData = (points: SafePoint[]) => {
    return points.map(point => ({
      value: point.id.toString(),
      label: point.name,
      description: point.address
    }));
  };

  const getSelectedPoint = (pointId: string | null, points: SafePoint[]) => {
    if (!pointId) return null;
    return points.find(p => p.id.toString() === pointId);
  };

  const handleContinue = () => {
    const pickupId = selectedPickupId ? parseInt(selectedPickupId) : undefined;
    const dropoffId = selectedDropoffId ? parseInt(selectedDropoffId) : undefined;
    
    console.log(`🎯 Selecciones finales:`, { pickupId, dropoffId });
    onComplete(pickupId, dropoffId);
  };



  const hasSelections = selectedPickupId || selectedDropoffId;
  const hasSafePoints = safePoints.pickup_points.length > 0 || safePoints.dropoff_points.length > 0;

  if (loading) {
    return (
      <Modal
        opened={isOpen}
        onClose={onClose}
        title={
          <Group gap="xs">
            <IconMapPin size={20} color="#059669" />
            <Text fw={600} c="#059669">Selecciona tus Puntos de Encuentro</Text>
          </Group>
        }
        size="lg"
        centered
        overlayProps={{
          color: '#000',
          opacity: 0.7,
          blur: 4,
        }}
      >
        <Group justify="center" gap="md" py="xl">
          <Loader size="md" color="blue" />
          <Text size="md" c="dimmed">Cargando puntos de encuentro...</Text>
        </Group>
      </Modal>
    );
  }

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconMapPin size={20} color="#059669" />
          <Text fw={600} c="#059669">Selecciona tus Puntos de Encuentro</Text>
        </Group>
      }
      size="lg"
      centered
      overlayProps={{
        color: '#000',
        opacity: 0.7,
        blur: 4,
      }}
      closeButtonProps={{
        size: 'lg',
        color: 'gray'
      }}
    >
      <Stack gap="lg">
        {error && (
          <Alert color="red" variant="light" icon={<IconInfoCircle size={16} />}>
            <Text size="sm">{error}</Text>
          </Alert>
        )}

        {/* Mensaje explicativo */}
        <Card p="md" radius="md" style={{ backgroundColor: '#f8fafc' }}>
          <Text size="md" ta="center" fw={600} mb="sm" c="blue">
            📍 Coordina tu punto de encuentro
          </Text>
          <Text size="sm" ta="center" c="dimmed">
            Selecciona dónde prefieres que te recojan y te dejen. Esto ayudará al conductor a coordinar mejor el viaje.
          </Text>
        </Card>

        {/* Verificar si hay SafePoints disponibles */}
        {!hasSafePoints ? (
          <Alert color="orange" variant="light" icon={<IconInfoCircle size={16} />}>
            <Text size="sm" fw={500} mb="xs">No hay puntos específicos configurados</Text>
            <Text size="sm">
              El conductor aún no ha configurado puntos de encuentro específicos. 
              Podrás coordinar directamente con él después de crear la reserva.
            </Text>
          </Alert>
        ) : (
          <Stack gap="xl">
            {/* Punto de Recogida */}
            {safePoints.pickup_points.length > 0 && (
              <div>
                <Group gap="xs" mb="md">
                  <IconCar size={18} color="green" />
                  <Text size="lg" fw={600} c="green">Punto de Recogida</Text>
                  <Badge size="sm" color="green" variant="light">
                    {safePoints.pickup_points.length} disponibles
                  </Badge>
                </Group>

                <Stack gap="md">
                  <Select
                    placeholder="Selecciona donde te recogeremos (opcional)"
                    data={getSelectData(safePoints.pickup_points)}
                    value={selectedPickupId}
                    onChange={setSelectedPickupId}
                    searchable
                    clearable
                  />

                  {selectedPickupId && (
                    <Card p="sm" radius="md" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                      {(() => {
                        const selectedPoint = getSelectedPoint(selectedPickupId, safePoints.pickup_points);
                        return selectedPoint ? (
                          <Group gap="md">
                            <div style={{ fontSize: '1.2rem' }}>
                              {getSafePointIcon(selectedPoint.category)}
                            </div>
                            <div style={{ flex: 1 }}>
                              <Group gap="xs" mb="xs">
                                <Text size="sm" fw={500}>{selectedPoint.name}</Text>
                              </Group>
                              <Text size="xs" c="dimmed">{selectedPoint.address}</Text>
                              {selectedPoint.city && (
                                <Text size="xs" c="dimmed">{selectedPoint.city}</Text>
                              )}
                            </div>
                            <IconCheck size={16} color="green" />
                          </Group>
                        ) : null;
                      })()}
                    </Card>
                  )}
                </Stack>
              </div>
            )}

            {/* Punto de Descenso */}
            {safePoints.dropoff_points.length > 0 && (
              <div>
                <Group gap="xs" mb="md">
                  <IconFlag size={18} color="blue" />
                  <Text size="lg" fw={600} c="blue">Punto de Descenso</Text>
                  <Badge size="sm" color="blue" variant="light">
                    {safePoints.dropoff_points.length} disponibles
                  </Badge>
                </Group>

                <Stack gap="md">
                  <Select
                    placeholder="Selecciona donde te dejaremos (opcional)"
                    data={getSelectData(safePoints.dropoff_points)}
                    value={selectedDropoffId}
                    onChange={setSelectedDropoffId}
                    searchable
                    clearable
                  />

                  {selectedDropoffId && (
                    <Card p="sm" radius="md" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                      {(() => {
                        const selectedPoint = getSelectedPoint(selectedDropoffId, safePoints.dropoff_points);
                        return selectedPoint ? (
                          <Group gap="md">
                            <div style={{ fontSize: '1.2rem' }}>
                              {getSafePointIcon(selectedPoint.category)}
                            </div>
                            <div style={{ flex: 1 }}>
                              <Group gap="xs" mb="xs">
                                <Text size="sm" fw={500}>{selectedPoint.name}</Text>
                              </Group>
                              <Text size="xs" c="dimmed">{selectedPoint.address}</Text>
                              {selectedPoint.city && (
                                <Text size="xs" c="dimmed">{selectedPoint.city}</Text>
                              )}
                            </div>
                            <IconCheck size={16} color="blue" />
                          </Group>
                        ) : null;
                      })()}
                    </Card>
                  )}
                </Stack>
              </div>
            )}
          </Stack>
        )}

        {/* Botones de acción */}
        <Group justify="space-between" mt="lg">
          
          <Button
            size="md"
            onClick={handleContinue}
            leftSection={<IconCheck size={16} />}
            color={hasSelections ? 'green' : 'blue'}
          >
            {hasSelections ? 'Crear Reserva' : 'Crear Reserva'}
          </Button>
        </Group>

        {hasSelections && (
          <Alert color="green" variant="light" icon={<IconCheck size={16} />}>
            <Text size="sm" fw={500}>¡Perfecto!</Text>
            <Text size="sm">
              Has seleccionado {selectedPickupId ? 'punto de recogida' : ''} 
              {selectedPickupId && selectedDropoffId ? ' y ' : ''}
              {selectedDropoffId ? 'punto de descenso' : ''}. 
              Tu reserva se creará con estas preferencias.
            </Text>
          </Alert>
        )}

        <Text size="xs" ta="center" c="dimmed">
          Los puntos de encuentro son opcionales. Podrás coordinar los detalles finales directamente con el conductor.
        </Text>
      </Stack>
    </Modal>
  );
};

export default TripSafePointSelector;
