import { useState } from 'react';
import {
  Card,
  Group,
  Text,
  Badge,
  Stack,
  Box,
  Button
} from '@mantine/core';
import {
  Info
} from 'lucide-react';
import {
  SafePoint,
  searchNearbySafePoints,
  getSafePointIcon,
  getSafePointColor,
  formatSafePointCategory
} from '@/services/safepoints';
import styles from './TripSafePointsInfo.module.css';

interface RouteBasedSafePointsProps {
  origin: string;
  destination: string;
  tripId: string;
}

export function RouteBasedSafePoints({ origin, destination, tripId }: RouteBasedSafePointsProps) {
  const [routeSafePoints, setRouteSafePoints] = useState<SafePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const loadRouteSafePoints = async () => {
    try {
      setLoading(true);
      console.log('🗺️ [RouteBasedSafePoints] Loading general SafePoints for route:', { origin, destination, tripId });
      
      // Por ahora usamos coordenadas de ejemplo para cargar SafePoints generales
      // En el futuro esto se puede mejorar con geocodificación
      const mockResponse = await searchNearbySafePoints({
        latitude: 4.6097,  // Coordenadas de ejemplo (Bogotá)
        longitude: -74.0817,
        radius_km: 15,
        limit: 10,
        verified_only: false
      });

      if (mockResponse.success && mockResponse.safepoints) {
        setRouteSafePoints(mockResponse.safepoints.slice(0, 5)); // Mostrar máximo 5
        console.log('✅ [RouteBasedSafePoints] General SafePoints loaded:', mockResponse.safepoints.length);
      }
    } catch (error) {
      console.error('❌ [RouteBasedSafePoints] Error loading route SafePoints:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSafePoint = (point: SafePoint) => {
    const IconComponent = getSafePointIcon(point.category);
    const badgeColor = getSafePointColor(point.category);
    
    return (
      <Box key={point.id} p="xs" style={{ 
        border: '1px solid var(--mantine-color-gray-3)', 
        borderRadius: '8px',
        background: 'var(--mantine-color-gray-0)'
      }}>
        <Group gap="sm" wrap="nowrap">
          <Box
            style={{
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: `var(--mantine-color-${badgeColor}-1)`,
              color: `var(--mantine-color-${badgeColor}-7)`
            }}
          >
            <IconComponent />
          </Box>
          
          <Box flex={1}>
            <Text size="xs" fw={500} lineClamp={1}>
              {point.name}
            </Text>
            <Text size="10" c="dimmed" lineClamp={1}>
              {point.address}
            </Text>
          </Box>
          
          <Badge size="xs" color={badgeColor} variant="light">
            {formatSafePointCategory(point.category)}
          </Badge>
        </Group>
      </Box>
    );
  };

  return (
    <Card padding="sm" className={styles.safePointsContainer}>
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <Info size={16} color="var(--mantine-color-blue-6)" />
          <Text size="sm" fw={600}>
            SafePoints en la Ruta
          </Text>
          <Badge size="xs" variant="light" color="orange">
            Información General
          </Badge>
        </Group>
      </Group>

      <Text size="xs" c="dimmed" mb="sm">
        El conductor puede seleccionar puntos específicos de esta lista para recogida y dejada
      </Text>

      {!showDetails ? (
        <Button
          size="xs"
          variant="light"
          onClick={() => {
            setShowDetails(true);
            if (routeSafePoints.length === 0) {
              loadRouteSafePoints();
            }
          }}
          loading={loading}
        >
          Ver SafePoints disponibles en la zona
        </Button>
      ) : (
        <Stack gap="xs">
          {routeSafePoints.length > 0 ? (
            <>
              <Text size="xs" fw={500} c="blue">
                Ejemplos de SafePoints en la zona:
              </Text>
              {routeSafePoints.map(renderSafePoint)}
              <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                💡 Estos son SafePoints generales. El conductor puede seleccionar puntos específicos para este viaje.
              </Text>
            </>
          ) : loading ? (
            <Text size="xs" c="dimmed">Cargando SafePoints...</Text>
          ) : (
            <Text size="xs" c="dimmed">No se encontraron SafePoints en la zona</Text>
          )}
        </Stack>
      )}
    </Card>
  );
}
