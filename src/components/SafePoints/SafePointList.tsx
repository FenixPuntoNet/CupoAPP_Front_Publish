import React, { useState } from 'react';
import { 
  Card, 
  Text, 
  Badge, 
  Group, 
  Button, 
  Stack, 
  ActionIcon,
  Checkbox,
  Collapse,
  Divider,
  TextInput,
  Select
} from '@mantine/core';
import { 
  MapPin, 
  Star, 
  Shield, 
  Users, 
  Navigation,
  Search,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { SafePoint, SafePointCategory } from '@/services/safepoints';
import { getSafePointIcon, getSafePointColor } from '@/services/booking-safepoints';
import styles from './SafePointList.module.css';

interface SafePointListProps {
  safePoints: SafePoint[];
  loading?: boolean;
  onSelect?: (safePoint: SafePoint) => void;
  onPickupSelect?: (safePoint: SafePoint) => void;
  onDropoffSelect?: (safePoint: SafePoint) => void;
  selectedIds?: Set<number>;
  mode?: 'view' | 'select' | 'checkbox';
  showFilters?: boolean;
  onFilterChange?: (filters: SafePointFilters) => void;
}

export interface SafePointFilters {
  searchText: string;
  category?: SafePointCategory;
  verifiedOnly: boolean;
  maxDistance?: number;
}

const categoryOptions = [
  { value: 'metro_station', label: '🚇 Estación de Metro' },
  { value: 'mall', label: '🏬 Centro Comercial' },
  { value: 'university', label: '🎓 Universidad' },
  { value: 'hospital', label: '🏥 Hospital' },
  { value: 'bank', label: '🏦 Banco' },
  { value: 'park', label: '🌳 Parque' },
  { value: 'government', label: '🏛️ Gobierno' },
  { value: 'church', label: '⛪ Iglesia' },
  { value: 'hotel', label: '🏨 Hotel' },
  { value: 'restaurant', label: '🍽️ Restaurante' },
  { value: 'gas_station', label: '⛽ Gasolinera' },
  { value: 'supermarket', label: '🛒 Supermercado' }
];

export const SafePointList: React.FC<SafePointListProps> = ({
  safePoints,
  loading = false,
  onSelect,
  onPickupSelect,
  onDropoffSelect,
  selectedIds = new Set(),
  mode = 'view',
  showFilters = false,
  onFilterChange
}) => {
  const [filters, setFilters] = useState<SafePointFilters>({
    searchText: '',
    verifiedOnly: false
  });
  const [showFiltersCollapse, setShowFiltersCollapse] = useState(false);

  const handleFilterChange = (newFilters: Partial<SafePointFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
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

  const formatDistance = (distance?: number): string => {
    if (!distance) return '';
    if (distance < 1) return `${(distance * 1000).toFixed(0)}m`;
    return `${distance.toFixed(1)}km`;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Text size="sm" c="dimmed">Cargando SafePoints...</Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Filters */}
      {showFilters && (
        <Card className={styles.filtersCard} padding="sm" mb="md">
          <Group justify="space-between" align="center" mb="sm">
            <Text fw={500} size="sm">Filtros</Text>
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => setShowFiltersCollapse(!showFiltersCollapse)}
            >
              {showFiltersCollapse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </ActionIcon>
          </Group>
          
          <Collapse in={showFiltersCollapse}>
            <Stack gap="sm">
              <TextInput
                placeholder="Buscar por nombre o dirección..."
                leftSection={<Search size={16} />}
                value={filters.searchText}
                onChange={(e) => handleFilterChange({ searchText: e.target.value })}
              />
              
              <Group grow>
                <Select
                  placeholder="Categoría"
                  data={[{ value: '', label: 'Todas las categorías' }, ...categoryOptions]}
                  value={filters.category || ''}
                  onChange={(value) => handleFilterChange({ 
                    category: value as SafePointCategory || undefined 
                  })}
                  leftSection={<Filter size={16} />}
                />
              </Group>
              
              <Checkbox
                label="Solo SafePoints verificados"
                checked={filters.verifiedOnly}
                onChange={(e) => handleFilterChange({ verifiedOnly: e.target.checked })}
              />
            </Stack>
          </Collapse>
        </Card>
      )}

      {/* SafePoints List */}
      <Stack gap="sm">
        {safePoints.length === 0 ? (
          <Card className={styles.emptyCard} padding="lg">
            <Stack align="center" gap="sm">
              <MapPin size={32} color="#ccc" />
              <Text size="sm" c="dimmed" ta="center">
                No se encontraron SafePoints
              </Text>
            </Stack>
          </Card>
        ) : (
          safePoints.map((safePoint) => (
            <Card 
              key={safePoint.id} 
              className={`${styles.safePointCard} ${selectedIds.has(safePoint.id) ? styles.selected : ''}`}
              padding="md"
              onClick={() => onSelect?.(safePoint)}
              style={{ cursor: onSelect ? 'pointer' : 'default' }}
            >
              <Stack gap="sm">
                {/* Header */}
                <Group justify="space-between" align="flex-start">
                  <div style={{ flex: 1 }}>
                    <Group gap="sm" align="center">
                      {mode === 'checkbox' && (
                        <Checkbox
                          checked={selectedIds.has(safePoint.id)}
                          onChange={() => onSelect?.(safePoint)}
                        />
                      )}
                      <Text fw={600} size="sm" className={styles.safePointName}>
                        {getSafePointIcon(safePoint.category)} {safePoint.name}
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed" mt={4}>
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

                {/* Category and Stats */}
                <Group justify="space-between" align="center">
                  <Badge 
                    size="sm" 
                    variant="light" 
                    style={{ 
                      backgroundColor: `${getSafePointColor(safePoint.category)}20`,
                      color: getSafePointColor(safePoint.category)
                    }}
                    leftSection={<MapPin size={12} />}
                  >
                    {getCategoryDisplayName(safePoint.category)}
                  </Badge>

                  <Group gap="md">
                    {safePoint.rating_average && (
                      <Group gap={4}>
                        <Star size={14} fill="currentColor" style={{ color: '#FFD700' }} />
                        <Text size="xs" fw={500}>{safePoint.rating_average.toFixed(1)}</Text>
                      </Group>
                    )}
                    
                    {safePoint.usage_count && (
                      <Group gap={4}>
                        <Users size={14} />
                        <Text size="xs" fw={500}>{safePoint.usage_count}</Text>
                      </Group>
                    )}

                    {safePoint.distance_km && (
                      <Group gap={4}>
                        <Navigation size={14} />
                        <Text size="xs" c="dimmed">
                          {formatDistance(safePoint.distance_km)}
                        </Text>
                      </Group>
                    )}
                  </Group>
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
                    {Object.entries(safePoint.features).filter(([, value]) => value).slice(0, 3).map(([feature]) => (
                      <Badge key={feature} size="xs" variant="outline">
                        {feature.replace('_', ' ')}
                      </Badge>
                    ))}
                  </Group>
                )}

                {/* Action Buttons */}
                {mode === 'select' && (onPickupSelect || onDropoffSelect) && (
                  <>
                    <Divider />
                    <Group gap="xs">
                      {onPickupSelect && (
                        <Button 
                          size="xs" 
                          variant="filled"
                          color="blue"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPickupSelect(safePoint);
                          }}
                          style={{ flex: 1 }}
                        >
                          Punto de Recogida
                        </Button>
                      )}
                      
                      {onDropoffSelect && (
                        <Button 
                          size="xs" 
                          variant="filled"
                          color="green"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDropoffSelect(safePoint);
                          }}
                          style={{ flex: 1 }}
                        >
                          Punto de Dejada
                        </Button>
                      )}
                    </Group>
                  </>
                )}
              </Stack>
            </Card>
          ))
        )}
      </Stack>
    </div>
  );
};

export default SafePointList;
