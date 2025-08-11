import { useState, useEffect } from 'react';
import {
  Card,
  Group,
  Text,
  Badge,
  Stack,
  Tooltip,
  Collapse,
  ActionIcon,
  Box,
  ScrollArea
} from '@mantine/core';
import {
  MapPin,
  ChevronDown,
  ChevronUp,
  Star,
  Shield,
  Navigation,
  Clock
} from 'lucide-react';
import {
  SafePoint,
  getTripSafePointSelections,
  getSafePointIcon,
  getSafePointColor,
  formatSafePointCategory
} from '@/services/safepoints';
import { RouteBasedSafePoints } from './RouteBasedSafePoints';
import styles from './TripSafePointsInfo.module.css';

export interface TripSafePointsInfoProps {
  tripId: string;
  compact?: boolean;
  origin?: string;
  destination?: string;
}

interface TripSafePoints {
  pickup_points: SafePoint[];
  dropoff_points: SafePoint[];
}

export function TripSafePointsInfo({ tripId, compact = false, origin, destination }: TripSafePointsInfoProps) {
  const [safePoints, setSafePoints] = useState<TripSafePoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(!compact);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTripSafePoints();
  }, [tripId]);

  const loadTripSafePoints = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 [TripSafePointsInfo] Loading SafePoints for trip:', tripId);
      
      const response = await getTripSafePointSelections(parseInt(tripId));
      
      console.log('📡 [TripSafePointsInfo] SafePoints response:', response);
      
      if (response.success) {
        const pickupPoints = response.pickup_points || [];
        const dropoffPoints = response.dropoff_points || [];
        
        console.log('✅ [TripSafePointsInfo] SafePoints data:', {
          pickup_count: pickupPoints.length,
          dropoff_count: dropoffPoints.length,
          pickup_points: pickupPoints,
          dropoff_points: dropoffPoints
        });
        
        setSafePoints({
          pickup_points: pickupPoints,
          dropoff_points: dropoffPoints
        });
      } else {
        console.warn('⚠️ [TripSafePointsInfo] SafePoints request failed:', response.error);
        setError('No se pudieron cargar los SafePoints');
      }
    } catch (err) {
      console.error('❌ [TripSafePointsInfo] Error loading trip SafePoints:', err);
      setError('Error al cargar SafePoints');
    } finally {
      setLoading(false);
    }
  };

  const renderSafePoint = (point: SafePoint) => {
    const IconComponent = getSafePointIcon(point.category);
    const badgeColor = getSafePointColor(point.category);
    
    return (
      <Card key={point.id} padding="xs" className={styles.safePointCard}>
        <Group gap="sm" wrap="nowrap">
          <ActionIcon 
            size="sm" 
            color={badgeColor}
            variant="light"
            className={styles.safePointIcon}
          >
            <IconComponent />
          </ActionIcon>
          
          <Box flex={1}>
            <Text size="sm" fw={600} lineClamp={1}>
              {point.name}
            </Text>
            <Text size="xs" c="dimmed" lineClamp={1}>
              {point.address}
            </Text>
          </Box>
          
          <Group gap={4}>
            <Badge 
              size="xs" 
              color={badgeColor} 
              variant="light"
            >
              {formatSafePointCategory(point.category)}
            </Badge>
            
            {(point as any).rating && (point as any).rating > 0 && (
              <Badge 
                size="xs" 
                color="yellow" 
                variant="light"
                leftSection={<Star size={10} />}
              >
                {(point as any).rating.toFixed(1)}
              </Badge>
            )}
            
            {(point as any).verified && (
              <Tooltip label="SafePoint verificado">
                <Badge 
                  size="xs" 
                  color="green" 
                  variant="light"
                >
                  <Shield size={10} />
                </Badge>
              </Tooltip>
            )}
          </Group>
        </Group>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card padding="sm" className={styles.loadingCard}>
        <Group gap="sm">
          <MapPin size={16} />
          <Text size="sm" c="dimmed">Cargando puntos de recogida...</Text>
        </Group>
      </Card>
    );
  }

  if (error || !safePoints) {
    return (
      <Card padding="sm" className={styles.errorCard}>
        <Group gap="sm">
          <MapPin size={16} />
          <Text size="sm" c="dimmed">
            {error || 'SafePoints no disponibles'}
          </Text>
        </Group>
      </Card>
    );
  }

  const hasPickupPoints = safePoints.pickup_points.length > 0;
  const hasDropoffPoints = safePoints.dropoff_points.length > 0;
  
  console.log('🎯 [TripSafePointsInfo] Render state:', {
    tripId,
    loading,
    error,
    safePoints,
    hasPickupPoints,
    hasDropoffPoints,
    total_points: safePoints ? safePoints.pickup_points.length + safePoints.dropoff_points.length : 0
  });
  
  if (!hasPickupPoints && !hasDropoffPoints) {
    // Si tenemos información de origen y destino, mostrar SafePoints generales
    if (origin && destination) {
      return (
        <RouteBasedSafePoints 
          origin={origin}
          destination={destination}
          tripId={tripId}
        />
      );
    }
    
    // Fallback cuando no hay información
    return (
      <Card padding="sm" className={styles.emptyCard}>
        <Group gap="sm">
          <MapPin size={16} />
          <Box flex={1}>
            <Text size="sm" fw={500} mb={4}>
              SafePoints no configurados
            </Text>
            <Text size="xs" c="dimmed">
              Este conductor aún no ha seleccionado puntos específicos de recogida y descenso. 
              Los SafePoints son lugares seguros y convenientes donde puedes abordar o bajar del vehículo.
            </Text>
          </Box>
        </Group>
      </Card>
    );
  }

  return (
    <Card padding="sm" className={styles.safePointsContainer}>
      <Group justify="space-between" mb={compact ? 'xs' : 'sm'}>
        <Group gap="xs">
          <MapPin size={16} color="var(--mantine-color-blue-6)" />
          <Text size="sm" fw={600}>
            Puntos de Recogida y Descenso
          </Text>
          <Badge size="xs" variant="light" color="blue">
            {(safePoints.pickup_points.length + safePoints.dropoff_points.length)} puntos
          </Badge>
        </Group>
        
        {compact && (
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </ActionIcon>
        )}
      </Group>

      <Collapse in={expanded}>
        <Stack gap="xs">
          {hasPickupPoints && (
            <Box>
              <Group gap="xs" mb="xs">
                <Navigation size={14} />
                <Text size="xs" fw={500} c="blue">
                  Puntos de Recogida ({safePoints.pickup_points.length})
                </Text>
              </Group>
              
              <ScrollArea style={{ maxHeight: compact ? '120px' : '200px' }}>
                <Stack gap="xs">
                  {safePoints.pickup_points.map((point) => 
                    renderSafePoint(point)
                  )}
                </Stack>
              </ScrollArea>
            </Box>
          )}

          {hasDropoffPoints && (
            <Box>
              <Group gap="xs" mb="xs">
                <Clock size={14} />
                <Text size="xs" fw={500} c="green">
                  Puntos de Descenso ({safePoints.dropoff_points.length})
                </Text>
              </Group>
              
              <ScrollArea style={{ maxHeight: compact ? '120px' : '200px' }}>
                <Stack gap="xs">
                  {safePoints.dropoff_points.map((point) => 
                    renderSafePoint(point)
                  )}
                </Stack>
              </ScrollArea>
            </Box>
          )}
        </Stack>
      </Collapse>
    </Card>
  );
}
