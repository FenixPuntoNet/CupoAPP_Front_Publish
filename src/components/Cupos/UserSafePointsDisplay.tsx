import React, { useState } from 'react';
import {
  Card,
  Group,
  Text,
  Stack,
  Button,
  Badge,
  Alert,
  Loader,
  Modal
} from '@mantine/core';
import {
  IconMapPin,
  IconFlag,
  IconInfoCircle,
  IconClock,
  IconRoute,
  IconEye
} from '@tabler/icons-react';

interface SafePoint {
  id: number;
  name: string;
  address: string;
  category: string;
  latitude: number;
  longitude: number;
  category_display_name?: string;
  icon_name?: string;
  color_hex?: string;
}

interface UserSafePointSelection {
  selection_id: number;
  passenger_notes?: string;
  estimated_arrival_time?: string;
  status: string;
  selected_at: string;
  confirmed_at?: string;
}

interface UserSafePointsDisplayProps {
  bookingId: number;
}

const UserSafePointsDisplay: React.FC<UserSafePointsDisplayProps> = ({
  bookingId
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selections, setSelections] = useState<{
    pickup?: SafePoint & UserSafePointSelection;
    dropoff?: SafePoint & UserSafePointSelection;
    has_pickup: boolean;
    has_dropoff: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUserSelections = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://cupo.site/api/booking/${bookingId}/my-selections`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSelections(data.selections);
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (err) {
      console.error('❌ Error cargando selecciones del usuario:', err);
      setError('Error cargando puntos de encuentro');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setModalOpen(true);
    if (!selections) {
      loadUserSelections();
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

  // Calcular el número de puntos para el badge
  const pointCount = (selections?.has_pickup ? 1 : 0) + (selections?.has_dropoff ? 1 : 0);
  
  return (
    <>
      {/* Botón compacto */}
      <Button
        size="xs"
        variant="light"
        color="blue"
        leftSection={<IconEye size={14} />}
        onClick={handleOpenModal}
        style={{
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          color: '#3b82f6',
          fontSize: '11px',
          height: '28px',
          padding: '0 8px'
        }}
      >
        🗺️ Mis Puntos de Encuentro
        {pointCount > 0 && (
          <Badge size="xs" color="blue" variant="filled" ml={4}>
            {pointCount}
          </Badge>
        )}
      </Button>

      {/* Modal con la información detallada */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          <Group gap="xs">
            <IconRoute size={18} color="#3b82f6" />
            <Text fw={600} size="md">Mis Puntos de Encuentro</Text>
          </Group>
        }
        size="md"
        centered
        overlayProps={{
          color: '#000',
          opacity: 0.6,
          blur: 3,
        }}
      >
        <Stack gap="md">
          {loading && (
            <Group justify="center" gap="sm" py="xl">
              <Loader size="sm" color="blue" />
              <Text size="sm" c="dimmed">Cargando puntos de encuentro...</Text>
            </Group>
          )}

          {error && (
            <Alert color="red" variant="light" icon={<IconInfoCircle size={14} />} p="sm">
              <Text size="sm">{error}</Text>
            </Alert>
          )}

          {!loading && !error && selections && (!selections.has_pickup && !selections.has_dropoff) && (
            <Alert color="orange" variant="light" icon={<IconInfoCircle size={14} />} p="sm">
              <Text size="sm" fw={500}>Sin puntos específicos seleccionados</Text>
              <Text size="xs" c="dimmed">
                No has seleccionado puntos de recogida o descenso específicos. 
                Coordinarás directamente con el conductor.
              </Text>
            </Alert>
          )}

          {!loading && !error && selections && (selections.has_pickup || selections.has_dropoff) && (
            <Stack gap="sm">
              {/* Punto de recogida */}
              {selections.pickup && (
                <Card p="sm" radius="md" style={{ backgroundColor: '#f0fdf4', border: '1px solid #dcfce7' }}>
                  <Group gap="sm" align="center">
                    <div 
                      style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: 8, 
                        backgroundColor: getSafePointColor(selections.pickup.category),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        flexShrink: 0
                      }}
                    >
                      {getSafePointIcon(selections.pickup.category)}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Group gap="xs" align="center" mb={4}>
                        <IconMapPin size={12} color="#059669" />
                        <Text fw={600} size="sm" c="dark" style={{ lineHeight: 1.2 }}>
                          {selections.pickup.name}
                        </Text>
                        <Badge color="green" size="xs" variant="filled">Recogida</Badge>
                      </Group>
                      
                      <Text size="xs" c="dimmed" style={{ lineHeight: 1.2 }} mb="xs">
                        {selections.pickup.address}
                      </Text>
                      
                      {selections.pickup.passenger_notes && (
                        <Text size="xs" c="blue" style={{ fontStyle: 'italic' }} mb="xs">
                          💬 {selections.pickup.passenger_notes}
                        </Text>
                      )}
                      
                      {selections.pickup.estimated_arrival_time && (
                        <Group gap={4} mb="xs">
                          <IconClock size={10} color="#f59e0b" />
                          <Text size="xs" c="orange">
                            Llegada estimada: {new Date(selections.pickup.estimated_arrival_time).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </Group>
                      )}
                    </div>
                    
                    <Button
                      size="xs"
                      variant="light"
                      color="green"
                      onClick={() => openInMaps(
                        selections.pickup!.latitude,
                        selections.pickup!.longitude,
                        selections.pickup!.name
                      )}
                    >
                      📍 Ver en Mapa
                    </Button>
                  </Group>
                </Card>
              )}

              {/* Punto de descenso */}
              {selections.dropoff && (
                <Card p="sm" radius="md" style={{ backgroundColor: '#eff6ff', border: '1px solid #dbeafe' }}>
                  <Group gap="sm" align="center">
                    <div 
                      style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: 8, 
                        backgroundColor: getSafePointColor(selections.dropoff.category),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        flexShrink: 0
                      }}
                    >
                      {getSafePointIcon(selections.dropoff.category)}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Group gap="xs" align="center" mb={4}>
                        <IconFlag size={12} color="#3b82f6" />
                        <Text fw={600} size="sm" c="dark" style={{ lineHeight: 1.2 }}>
                          {selections.dropoff.name}
                        </Text>
                        <Badge color="blue" size="xs" variant="filled">Descenso</Badge>
                      </Group>
                      
                      <Text size="xs" c="dimmed" style={{ lineHeight: 1.2 }} mb="xs">
                        {selections.dropoff.address}
                      </Text>
                      
                      {selections.dropoff.passenger_notes && (
                        <Text size="xs" c="blue" style={{ fontStyle: 'italic' }} mb="xs">
                          💬 {selections.dropoff.passenger_notes}
                        </Text>
                      )}
                    </div>
                    
                    <Button
                      size="xs"
                      variant="light"
                      color="blue"
                      onClick={() => openInMaps(
                        selections.dropoff!.latitude,
                        selections.dropoff!.longitude,
                        selections.dropoff!.name
                      )}
                    >
                      📍 Ver en Mapa
                    </Button>
                  </Group>
                </Card>
              )}

              {/* Info adicional */}
              <Text size="xs" c="dimmed" style={{ textAlign: 'center', lineHeight: 1.2 }}>
                💡 Recuerda llegar a tiempo a tu punto de recogida
              </Text>
            </Stack>
          )}
        </Stack>
      </Modal>
    </>
  );
};

export default UserSafePointsDisplay;
