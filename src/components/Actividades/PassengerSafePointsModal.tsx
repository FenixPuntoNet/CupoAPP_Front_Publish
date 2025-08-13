import React, { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Text,
  Group,
  Card,
  Badge,
  Avatar,
  Divider,
  Alert,
  Loader,
  Button,
  Tabs
} from '@mantine/core';
import {
  IconMapPin,
  IconUser,
  IconCar,
  IconFlag,
  IconInfoCircle,
  IconClock,
  IconRoute
} from '@tabler/icons-react';
import { getTripPassengerSafePoints, type PassengerSafePoint } from '@/services/passenger-safepoints';

interface PassengerSafePointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: number;
  tripOrigin: string;
  tripDestination: string;
}

const PassengerSafePointsModal: React.FC<PassengerSafePointsModalProps> = ({
  isOpen,
  onClose,
  tripId,
  tripOrigin,
  tripDestination
}) => {
  const [loading, setLoading] = useState(true);
  const [passengerSafePoints, setPassengerSafePoints] = useState<PassengerSafePoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tripId) {
      loadPassengerSafePoints();
    }
  }, [isOpen, tripId]);

  const loadPassengerSafePoints = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 Cargando SafePoints de pasajeros para trip: ${tripId}`);
      
      const result = await getTripPassengerSafePoints(tripId);

      if (result.success) {
        setPassengerSafePoints(result.passenger_safepoints || []);
        console.log(`✅ SafePoints de pasajeros cargados:`, result.passenger_safepoints);
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (err) {
      console.error('❌ Error cargando SafePoints de pasajeros:', err);
      setError('Error cargando información de puntos de recogida');
    } finally {
      setLoading(false);
    }
  };

  const getSafePointIcon = (category: string) => {
    const iconMap: Record<string, string> = {
      metro_station: '🚇',
      mall: '🏬',
      university: '🎓',
      hospital: '🏥',
      bank: '🏦',
      park: '🌳',
      government: '🏛️',
      church: '⛪',
      hotel: '🏨',
      restaurant: '🍽️',
      gas_station: '⛽',
      supermarket: '🛒',
      user_proposed: '📍'
    };
    return iconMap[category] || '📍';
  };

  const getSafePointColor = (category: string) => {
    const colorMap: Record<string, string> = {
      metro_station: '#3b82f6',
      mall: '#a855f7',
      university: '#f97316',
      hospital: '#ef4444',
      bank: '#22c55e',
      park: '#84cc16',
      government: '#6366f1',
      church: '#8b5cf6',
      hotel: '#06b6d4',
      restaurant: '#f59e0b',
      gas_station: '#10b981',
      supermarket: '#ec4899',
      user_proposed: '#6b7280'
    };
    return colorMap[category] || '#6b7280';
  };

  const openInMaps = (lat: number, lng: number, name: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(name)}`;
    window.open(url, '_blank');
  };

  const pickupPassengers = passengerSafePoints.filter(p => p.pickup_safepoint);
  const dropoffPassengers = passengerSafePoints.filter(p => p.dropoff_safepoint);
  const noSafePointPassengers = passengerSafePoints.filter(p => !p.pickup_safepoint && !p.dropoff_safepoint);

  if (loading) {
    return (
      <Modal
        opened={isOpen}
        onClose={onClose}
        title="Puntos de Recogida y Descenso"
        size="lg"
        centered
      >
        <Group justify="center" gap="md" py="xl">
          <Loader size="md" color="blue" />
          <Text size="md" c="dimmed">Cargando información...</Text>
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
          <Text fw={600} size="md">Puntos de Encuentro</Text>
        </Group>
      }
      size="lg"
      centered
      overlayProps={{
        color: '#000',
        opacity: 0.6,
        blur: 3,
      }}
    >
      <Stack gap="md">
        {/* Header compacto con información del viaje */}
        <Card p="sm" radius="md" style={{ backgroundColor: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: '1px solid #e0f2fe' }}>
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <IconRoute size={16} color="#0284c7" />
              <Text size="sm" fw={500} c="dark">
                {tripOrigin} → {tripDestination}
              </Text>
            </Group>
            <Badge color="blue" variant="filled" size="sm">
              {passengerSafePoints.length} pasajero{passengerSafePoints.length !== 1 ? 's' : ''}
            </Badge>
          </Group>
        </Card>

        {error && (
          <Alert color="red" variant="light" icon={<IconInfoCircle size={14} />} p="sm">
            <Text size="sm">{error}</Text>
          </Alert>
        )}

        {passengerSafePoints.length === 0 ? (
          <Alert color="orange" variant="light" icon={<IconInfoCircle size={14} />} p="sm">
            <Text size="sm" fw={500}>Sin puntos específicos configurados</Text>
            <Text size="xs" c="dimmed">Coordina directamente con los pasajeros</Text>
          </Alert>
        ) : (
          <Tabs defaultValue="pickup" variant="outline">
            <Tabs.List grow>
              <Tabs.Tab 
                value="pickup" 
                leftSection={<IconCar size={14} />}
                rightSection={
                  <Badge size="xs" color="green" variant="filled">
                    {pickupPassengers.length}
                  </Badge>
                }
              >
                <Text size="sm">Recogida</Text>
              </Tabs.Tab>
              <Tabs.Tab 
                value="dropoff" 
                leftSection={<IconFlag size={14} />}
                rightSection={
                  <Badge size="xs" color="blue" variant="filled">
                    {dropoffPassengers.length}
                  </Badge>
                }
              >
                <Text size="sm">Descenso</Text>
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="pickup" pt="sm">
              <Stack gap="xs">
                {pickupPassengers.length > 0 ? (
                  pickupPassengers.map((passenger) => (
                    <Card key={`pickup-${passenger.booking_id}`} p="sm" radius="md" withBorder style={{ backgroundColor: '#fefefe' }}>
                      <Group gap="sm" align="center">
                        <div 
                          style={{ 
                            width: 36, 
                            height: 36, 
                            borderRadius: 8, 
                            backgroundColor: getSafePointColor(passenger.pickup_safepoint!.category),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            flexShrink: 0
                          }}
                        >
                          {getSafePointIcon(passenger.pickup_safepoint!.category)}
                        </div>
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Group gap="xs" align="center" mb={4}>
                            <Text fw={600} size="sm" style={{ color: '#1e293b' }}>
                              {passenger.passenger_name}
                            </Text>
                            <Badge color="green" size="xs" variant="dot">
                              {passenger.seats_booked}
                            </Badge>
                          </Group>
                          
                          <Group gap={4} align="center" mb={2}>
                            <IconMapPin size={12} color="#059669" />
                            <Text fw={500} size="xs" c="dark" style={{ lineHeight: 1.2 }}>
                              {passenger.pickup_safepoint!.name}
                            </Text>
                          </Group>
                          
                          <Text size="xs" c="dimmed" style={{ lineHeight: 1.2 }} truncate>
                            {passenger.pickup_safepoint!.address}
                          </Text>
                          
                          {(passenger.passenger_notes || passenger.estimated_arrival_time) && (
                            <Group gap="xs" mt={4}>
                              {passenger.passenger_notes && (
                                <Text size="xs" c="blue" style={{ fontStyle: 'italic' }} truncate>
                                  💬 {passenger.passenger_notes}
                                </Text>
                              )}
                              {passenger.estimated_arrival_time && (
                                <Group gap={2}>
                                  <IconClock size={10} color="#f59e0b" />
                                  <Text size="xs" c="orange">
                                    {new Date(passenger.estimated_arrival_time).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                                  </Text>
                                </Group>
                              )}
                            </Group>
                          )}
                        </div>
                        
                        <Group gap="xs" align="center">
                          <Button
                            size="xs"
                            variant="light"
                            color="blue"
                            style={{ fontSize: '10px', height: 24, padding: '0 8px' }}
                            onClick={() => openInMaps(
                              passenger.pickup_safepoint!.latitude,
                              passenger.pickup_safepoint!.longitude,
                              passenger.pickup_safepoint!.name
                            )}
                          >
                            📍 Mapa
                          </Button>
                          {passenger.passenger_phone && (
                            <Button
                              size="xs"
                              variant="light"
                              color="green"
                              style={{ fontSize: '10px', height: 24, padding: '0 8px' }}
                              onClick={() => window.open(`tel:${passenger.passenger_phone}`, '_blank')}
                            >
                              📞
                            </Button>
                          )}
                        </Group>
                      </Group>
                    </Card>
                  ))
                ) : (
                  <Alert color="gray" variant="light" p="sm">
                    <Text size="xs">Sin puntos de recogida</Text>
                  </Alert>
                )}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="dropoff" pt="sm">
              <Stack gap="xs">
                {dropoffPassengers.length > 0 ? (
                  dropoffPassengers.map((passenger) => (
                    <Card key={`dropoff-${passenger.booking_id}`} p="sm" radius="md" withBorder style={{ backgroundColor: '#fefefe' }}>
                      <Group gap="sm" align="center">
                        <div 
                          style={{ 
                            width: 36, 
                            height: 36, 
                            borderRadius: 8, 
                            backgroundColor: getSafePointColor(passenger.dropoff_safepoint!.category),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            flexShrink: 0
                          }}
                        >
                          {getSafePointIcon(passenger.dropoff_safepoint!.category)}
                        </div>
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Group gap="xs" align="center" mb={4}>
                            <Text fw={600} size="sm" style={{ color: '#1e293b' }}>
                              {passenger.passenger_name}
                            </Text>
                            <Badge color="blue" size="xs" variant="dot">
                              {passenger.seats_booked}
                            </Badge>
                          </Group>
                          
                          <Group gap={4} align="center" mb={2}>
                            <IconFlag size={12} color="#3b82f6" />
                            <Text fw={500} size="xs" c="dark" style={{ lineHeight: 1.2 }}>
                              {passenger.dropoff_safepoint!.name}
                            </Text>
                          </Group>
                          
                          <Text size="xs" c="dimmed" style={{ lineHeight: 1.2 }} truncate>
                            {passenger.dropoff_safepoint!.address}
                          </Text>
                          
                          {passenger.passenger_notes && (
                            <Text size="xs" c="blue" style={{ fontStyle: 'italic' }} mt={4} truncate>
                              💬 {passenger.passenger_notes}
                            </Text>
                          )}
                        </div>
                        
                        <Group gap="xs" align="center">
                          <Button
                            size="xs"
                            variant="light"
                            color="blue"
                            style={{ fontSize: '10px', height: 24, padding: '0 8px' }}
                            onClick={() => openInMaps(
                              passenger.dropoff_safepoint!.latitude,
                              passenger.dropoff_safepoint!.longitude,
                              passenger.dropoff_safepoint!.name
                            )}
                          >
                            📍 Mapa
                          </Button>
                          {passenger.passenger_phone && (
                            <Button
                              size="xs"
                              variant="light"
                              color="green"
                              style={{ fontSize: '10px', height: 24, padding: '0 8px' }}
                              onClick={() => window.open(`tel:${passenger.passenger_phone}`, '_blank')}
                            >
                              📞
                            </Button>
                          )}
                        </Group>
                      </Group>
                    </Card>
                  ))
                ) : (
                  <Alert color="gray" variant="light" p="sm">
                    <Text size="xs">Sin puntos de descenso</Text>
                  </Alert>
                )}
              </Stack>
            </Tabs.Panel>
          </Tabs>
        )}

        {noSafePointPassengers.length > 0 && (
          <>
            <Divider label="Sin puntos específicos" labelPosition="center" size="xs" />
            <Stack gap="xs">
              {noSafePointPassengers.map((passenger) => (
                <Card key={`no-sp-${passenger.booking_id}`} p="xs" radius="md" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Group gap="sm" align="center">
                    <Avatar size={28} radius="sm" color="gray">
                      <IconUser size={14} />
                    </Avatar>
                    <div style={{ flex: 1 }}>
                      <Text fw={500} size="xs">{passenger.passenger_name}</Text>
                      <Text size="xs" c="dimmed">
                        {passenger.seats_booked} asiento{passenger.seats_booked > 1 ? 's' : ''} - Coordinar directamente
                      </Text>
                    </div>
                    {passenger.passenger_phone && (
                      <Button
                        size="xs"
                        variant="light"
                        color="green"
                        style={{ fontSize: '10px', height: 24, padding: '0 8px' }}
                        onClick={() => window.open(`tel:${passenger.passenger_phone}`, '_blank')}
                      >
                        📞
                      </Button>
                    )}
                  </Group>
                </Card>
              ))}
            </Stack>
          </>
        )}
      </Stack>
    </Modal>
  );
};

export default PassengerSafePointsModal;
