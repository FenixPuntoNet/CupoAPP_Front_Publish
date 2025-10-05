import React, { useState, useEffect } from 'react';
import {
  Drawer,
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
      <Drawer
        opened={isOpen}
        onClose={onClose}
        title={null}
        position="bottom"
        size="85vh"
        withCloseButton={false}
        transitionProps={{
          transition: 'slide-up',
          duration: 400,
          timingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Group justify="center" gap="md" py="xl" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)', padding: '24px', position: 'relative' }}>
          {/* Botón de cierre personalizado */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 1003,
              backgroundColor: 'rgba(239, 68, 68, 0.9)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 1)';
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.5), 0 0 0 2px rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
          >
            ✕
          </button>
          
          {/* Header con título */}
          <Group gap="xs" style={{ position: 'absolute', top: '16px', left: '24px' }}>
            <IconMapPin size={20} color="white" />
            <Text fw={600} style={{ color: 'white' }}>Cargando puntos de encuentro...</Text>
          </Group>
          
          {/* Contenido centrado */}
          <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Loader size="md" color="white" />
            <Text size="md" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Cargando puntos de encuentro...</Text>
          </div>
        </Group>
      </Drawer>
    );
  }

  return (
    <Drawer
      opened={isOpen}
      onClose={onClose}
      title={null}
      position="bottom"
      size="85vh"
      withCloseButton={false}
      transitionProps={{
        transition: 'slide-up',
        duration: 400,
        timingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Header con título */}
      <div style={{ 
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)', 
        padding: '24px 24px 20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Botón de cierre personalizado */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 1003,
            backgroundColor: 'rgba(239, 68, 68, 0.9)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 1)';
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.5), 0 0 0 2px rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
        >
          ✕
        </button>
        
        <Group gap="xs" align="center" style={{ position: 'relative', zIndex: 1 }}>
          <IconMapPin size={20} color="white" />
          <Text fw={600} style={{ color: 'white' }}>Selecciona tus Puntos de Encuentro</Text>
        </Group>
      </div>

      <Stack gap="lg" p="lg" style={{ maxHeight: 'calc(75vh - 120px)', overflowY: 'auto' }}>
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
    </Drawer>
  );
};

export default TripSafePointSelector;
