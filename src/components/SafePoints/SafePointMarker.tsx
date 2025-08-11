import React from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';
import { Card, Text, Badge, Group, Button, Stack } from '@mantine/core';
import { MapPin, Star, Shield, Users } from 'lucide-react';
import type { SafePoint } from '@/services/safepoints';
import { getSafePointIcon, getSafePointColor } from '@/services/booking-safepoints';
import styles from './SafePointMarker.module.css';

interface SafePointMarkerProps {
  safePoint: SafePoint;
  isSelected?: boolean;
  showInfo?: boolean;
  onSelect?: (safePoint: SafePoint) => void;
  onClose?: () => void;
  onPickupSelect?: (safePoint: SafePoint) => void;
  onDropoffSelect?: (safePoint: SafePoint) => void;
  mode?: 'view' | 'select' | 'both';
}

export const SafePointMarker: React.FC<SafePointMarkerProps> = ({
  safePoint,
  isSelected = false,
  showInfo = false,
  onSelect,
  onClose,
  onPickupSelect,
  onDropoffSelect,
  mode = 'view'
}) => {
  const icon: google.maps.Icon = {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" fill="${getSafePointColor(safePoint.category)}" stroke="white" stroke-width="2"/>
        <text x="16" y="20" text-anchor="middle" font-size="12" fill="white">${getSafePointIcon(safePoint.category)}</text>
        ${safePoint.is_verified ? '<circle cx="24" cy="8" r="4" fill="#4CAF50"/><text x="24" y="11" text-anchor="middle" font-size="8" fill="white">✓</text>' : ''}
      </svg>
    `)}`,
    scaledSize: new google.maps.Size(32, 32),
    anchor: new google.maps.Point(16, 16)
  };

  const selectedIcon: google.maps.Icon = {
    ...icon,
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="${getSafePointColor(safePoint.category)}" stroke="#FFD700" stroke-width="4"/>
        <text x="20" y="24" text-anchor="middle" font-size="14" fill="white">${getSafePointIcon(safePoint.category)}</text>
        ${safePoint.is_verified ? '<circle cx="30" cy="10" r="5" fill="#4CAF50"/><text x="30" y="14" text-anchor="middle" font-size="10" fill="white">✓</text>' : ''}
      </svg>
    `)}`,
    scaledSize: new google.maps.Size(40, 40),
    anchor: new google.maps.Point(20, 20)
  };

  const getCategoryDisplayName = (category: string): string => {
    const categoryNames: Record<string, string> = {
      metro_station: 'Estación de Metro',
      mall: 'Centro Comercial',
      university: 'Universidad',
      hospital: 'Hospital',
      bank: 'Banco',
      park: 'Parque',
      government: 'Edificio Gubernamental',
      church: 'Iglesia',
      hotel: 'Hotel',
      restaurant: 'Restaurante',
      gas_station: 'Estación de Gasolina',
      supermarket: 'Supermercado',
      user_proposed: 'Propuesto por Usuario'
    };
    return categoryNames[category] || category;
  };

  return (
    <>
      <Marker
        position={{ lat: safePoint.latitude, lng: safePoint.longitude }}
        icon={isSelected ? selectedIcon : icon}
        onClick={() => onSelect?.(safePoint)}
      />
      
      {showInfo && (
        <InfoWindow
          position={{ lat: safePoint.latitude, lng: safePoint.longitude }}
          onCloseClick={onClose}
        >
          <Card className={styles.infoCard} padding="md" shadow="sm">
            <Stack gap="sm">
              {/* Header */}
              <Group justify="space-between" align="flex-start">
                <div style={{ flex: 1 }}>
                  <Text fw={600} size="sm" className={styles.safePointName}>
                    {getSafePointIcon(safePoint.category)} {safePoint.name}
                  </Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    {safePoint.address}
                  </Text>
                </div>
                
                {safePoint.is_verified && (
                  <Badge 
                    size="xs" 
                    color="green" 
                    variant="filled"
                    leftSection={<Shield size={10} />}
                  >
                    Verificado
                  </Badge>
                )}
              </Group>

              {/* Category */}
              <Badge 
                size="sm" 
                variant="light" 
                color={getSafePointColor(safePoint.category).replace('#', '')}
                leftSection={<MapPin size={12} />}
              >
                {getCategoryDisplayName(safePoint.category)}
              </Badge>

              {/* Stats */}
              <Group gap="lg">
                {safePoint.rating_average && (
                  <Group gap={4}>
                    <Star size={14} fill="currentColor" style={{ color: '#FFD700' }} />
                    <Text size="xs" fw={500}>{safePoint.rating_average.toFixed(1)}</Text>
                  </Group>
                )}
                
                {safePoint.usage_count && (
                  <Group gap={4}>
                    <Users size={14} />
                    <Text size="xs" fw={500}>{safePoint.usage_count} usos</Text>
                  </Group>
                )}

                {safePoint.distance_km && (
                  <Text size="xs" c="dimmed">
                    {safePoint.distance_km.toFixed(1)} km
                  </Text>
                )}
              </Group>

              {/* Description */}
              {safePoint.description && (
                <Text size="xs" c="dimmed" lineClamp={2}>
                  {safePoint.description}
                </Text>
              )}

              {/* Features */}
              {safePoint.features && Object.keys(safePoint.features).length > 0 && (
                <Group gap={4}>
                  {Object.entries(safePoint.features).filter(([, value]) => value).map(([feature]) => (
                    <Badge key={feature} size="xs" variant="outline">
                      {feature.replace('_', ' ')}
                    </Badge>
                  ))}
                </Group>
              )}

              {/* Action Buttons */}
              {mode !== 'view' && (
                <Group gap="xs" mt="xs">
                  {(mode === 'select' || mode === 'both') && onPickupSelect && (
                    <Button 
                      size="xs" 
                      variant="filled"
                      color="blue"
                      onClick={() => onPickupSelect(safePoint)}
                      style={{ flex: 1 }}
                    >
                      Punto de Recogida
                    </Button>
                  )}
                  
                  {(mode === 'select' || mode === 'both') && onDropoffSelect && (
                    <Button 
                      size="xs" 
                      variant="filled"
                      color="green"
                      onClick={() => onDropoffSelect(safePoint)}
                      style={{ flex: 1 }}
                    >
                      Punto de Dejada
                    </Button>
                  )}
                </Group>
              )}
            </Stack>
          </Card>
        </InfoWindow>
      )}
    </>
  );
};

export default SafePointMarker;
