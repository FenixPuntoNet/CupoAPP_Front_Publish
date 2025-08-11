import { useState, useEffect } from 'react';
import {
  Group,
  Text,
  Badge,
  Box,
  Modal,
  Stack,
  ActionIcon
} from '@mantine/core';
import {
  MapPin,
  Navigation,
  Clock,
  Eye
} from 'lucide-react';
import {
  SafePoint,
  getTripSafePointsWithBookingId,
  getSafePointCategoryIcon
} from '@/services/booking-safepoints';

interface CompactSafePointsProps {
  tripId: string;
}

interface TripSafePoints {
  pickup_points: SafePoint[];
  dropoff_points: SafePoint[];
}

export function CompactSafePoints({ tripId }: CompactSafePointsProps) {
  const [safePoints, setSafePoints] = useState<TripSafePoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);

  useEffect(() => {
    loadTripSafePoints();
  }, [tripId]);

  const loadTripSafePoints = async () => {
    try {
      setLoading(true);
      console.log(`🔍 [BACKEND CORREGIDO] Cargando SafePoints para trip: ${tripId}`);
      
      const response = await getTripSafePointsWithBookingId(parseInt(tripId));
      
      if (response.success) {
        const tripSafePoints = {
          pickup_points: response.pickup_points || [],
          dropoff_points: response.dropoff_points || []
        };
        
        setSafePoints(tripSafePoints);
        
        console.log(`✅ [BACKEND CORREGIDO] SafePoints cargados:`, {
          pickup_count: tripSafePoints.pickup_points.length,
          dropoff_count: tripSafePoints.dropoff_points.length,
          total: tripSafePoints.pickup_points.length + tripSafePoints.dropoff_points.length
        });
      } else {
        console.warn(`⚠️ [BACKEND CORREGIDO] No se pudieron cargar SafePoints:`, response.error);
        setSafePoints({ pickup_points: [], dropoff_points: [] });
      }
    } catch (err) {
      console.error('❌ [BACKEND CORREGIDO] Error loading SafePoints:', err);
      setSafePoints({ pickup_points: [], dropoff_points: [] });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Group gap="xs" style={{ opacity: 0.6 }}>
        <MapPin size={12} />
        <Text size="xs" c="dimmed">Cargando puntos...</Text>
      </Group>
    );
  }

  if (!safePoints || (safePoints.pickup_points.length === 0 && safePoints.dropoff_points.length === 0)) {
    return (
      <Group gap="xs" style={{ opacity: 0.6 }}>
        <MapPin size={12} />
        <Text size="xs" c="dimmed">Sin puntos disponibles</Text>
      </Group>
    );
  }

  return (
    <>
      {/* Vista compacta principal - estilo bonito como antes */}
      <Group gap="xs" onClick={() => setModalOpened(true)} style={{ cursor: 'pointer' }}>
        <MapPin size={12} />
        
        {/* Mostrar nombres de SafePoints de forma compacta y bonita */}
        {safePoints.pickup_points.length > 0 && (
          <Group gap={2}>
            <Badge size="xs" variant="light" color="blue" style={{ fontSize: '9px' }}>
              📍 {safePoints.pickup_points.length}
            </Badge>
            <Text size="xs" style={{ 
              maxWidth: '120px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: 'var(--mantine-color-blue-6)'
            }}>
              {safePoints.pickup_points.slice(0, 2).map(p => p.name).join(', ')}
              {safePoints.pickup_points.length > 2 && '...'}
            </Text>
          </Group>
        )}
        
        {safePoints.pickup_points.length > 0 && safePoints.dropoff_points.length > 0 && (
          <Text size="xs" c="dimmed">•</Text>
        )}
        
        {safePoints.dropoff_points.length > 0 && (
          <Group gap={2}>
            <Badge size="xs" variant="light" color="green" style={{ fontSize: '9px' }}>
              🎯 {safePoints.dropoff_points.length}
            </Badge>
            <Text size="xs" style={{ 
              maxWidth: '120px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: 'var(--mantine-color-green-6)'
            }}>
              {safePoints.dropoff_points.slice(0, 2).map(p => p.name).join(', ')}
              {safePoints.dropoff_points.length > 2 && '...'}
            </Text>
          </Group>
        )}
        
        <ActionIcon variant="subtle" size="xs">
          <Eye size={10} />
        </ActionIcon>
      </Group>

      {/* Modal compacto y elegante con X */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={
          <Group gap="xs">
            <MapPin size={16} style={{ color: '#22c55e' }} />
            <Text fw={600} size="sm">Puntos de Encuentro</Text>
          </Group>
        }
        size="sm"
        radius="md"
        centered
        overlayProps={{
          opacity: 0.5,
          blur: 2,
        }}
        styles={{
          header: {
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            borderRadius: '12px 12px 0 0',
            padding: '0.75rem 1rem',
          },
          body: {
            padding: '0.75rem 1rem 1rem',
          },
          close: {
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            '&:hover': {
              backgroundColor: '#dc2626',
            }
          }
        }}
      >
        <Stack gap="sm">
          {safePoints.pickup_points.length > 0 && (
            <Box>
              <Group gap="xs" mb="xs" style={{ 
                padding: '0.375rem', 
                backgroundColor: 'rgba(59, 130, 246, 0.08)', 
                borderRadius: '6px',
                border: '1px solid rgba(59, 130, 246, 0.15)'
              }}>
                <Navigation size={14} style={{ color: '#3b82f6' }} />
                <Text fw={600} size="xs" style={{ color: '#3b82f6' }}>
                  Recogida ({safePoints.pickup_points.length})
                </Text>
              </Group>
              <Stack gap="xs">
                {safePoints.pickup_points.map((point, index) => (
                  <Group key={`pickup-${point.id}`} gap="xs" p="xs" style={{ 
                    border: '1px solid rgba(59, 130, 246, 0.15)', 
                    borderRadius: '6px',
                    backgroundColor: 'rgba(59, 130, 246, 0.03)',
                  }}>
                    <div style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </div>
                    <Text style={{ fontSize: '14px' }}>{getSafePointCategoryIcon(point.category)}</Text>
                    <Box style={{ flex: 1 }}>
                      <Text size="xs" fw={500} style={{ color: '#1e40af' }}>
                        {point.name}
                      </Text>
                      <Text size="xs" c="dimmed" style={{ fontSize: '10px', marginTop: '1px' }}>
                        {point.address}
                      </Text>
                    </Box>
                  </Group>
                ))}
              </Stack>
            </Box>
          )}

          {safePoints.dropoff_points.length > 0 && (
            <Box>
              <Group gap="xs" mb="xs" style={{ 
                padding: '0.375rem', 
                backgroundColor: 'rgba(34, 197, 94, 0.08)', 
                borderRadius: '6px',
                border: '1px solid rgba(34, 197, 94, 0.15)'
              }}>
                <MapPin size={14} style={{ color: '#22c55e' }} />
                <Text fw={600} size="xs" style={{ color: '#16a34a' }}>
                  Destino ({safePoints.dropoff_points.length})
                </Text>
              </Group>
              <Stack gap="xs">
                {safePoints.dropoff_points.map((point, index) => (
                  <Group key={`dropoff-${point.id}`} gap="xs" p="xs" style={{ 
                    border: '1px solid rgba(34, 197, 94, 0.15)', 
                    borderRadius: '6px',
                    backgroundColor: 'rgba(34, 197, 94, 0.03)',
                  }}>
                    <div style={{
                      backgroundColor: '#22c55e',
                      color: 'white',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </div>
                    <Text style={{ fontSize: '14px' }}>{getSafePointCategoryIcon(point.category)}</Text>
                    <Box style={{ flex: 1 }}>
                      <Text size="xs" fw={500} style={{ color: '#166534' }}>
                        {point.name}
                      </Text>
                      <Text size="xs" c="dimmed" style={{ fontSize: '10px', marginTop: '1px' }}>
                        {point.address}
                      </Text>
                    </Box>
                  </Group>
                ))}
              </Stack>
            </Box>
          )}

          {safePoints.pickup_points.length === 0 && safePoints.dropoff_points.length === 0 && (
            <Group gap="sm" style={{ 
              justifyContent: 'center', 
              padding: '1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px dashed #cbd5e1'
            }}>
              <Clock size={24} style={{ opacity: 0.5, color: '#64748b' }} />
              <Box ta="center">
                <Text fw={500} c="dimmed" size="xs">
                  Sin puntos configurados
                </Text>
                <Text size="xs" c="dimmed" style={{ fontSize: '10px', marginTop: '2px' }}>
                  Este viaje aún no tiene SafePoints
                </Text>
              </Box>
            </Group>
          )}
        </Stack>
      </Modal>
    </>
  );
}
