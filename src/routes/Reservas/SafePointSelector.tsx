import React, { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Text,
  Button,
  Card,
  Group,
  Badge,
  Textarea,
  Alert,
  LoadingOverlay,
  ActionIcon,
  Tooltip,
  Paper
} from '@mantine/core';
import { 
  MapPin, 
  Star, 
  AlertCircle, 
  CheckCircle2, 
  Plus,
  Navigation,
  MessageSquare
} from 'lucide-react';
import { notifications } from '@mantine/notifications';
import {
  SafePoint,
  getDriverSafePointPreferences,
  proposeAlternativeSafePoint,
  getSafePointIcon,
  getSafePointColor,
  formatSafePointCategory
} from '../../services/safepoints';
import type { Trip } from '@/types/Trip';
import styles from './SafePointSelector.module.css';

interface SafePointSelectorProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onSafePointsSelected: (pickupId: number, dropoffId: number) => void;
}

interface SelectedSafePoints {
  pickup?: SafePoint;
  dropoff?: SafePoint;
}

export const SafePointSelector: React.FC<SafePointSelectorProps> = ({
  trip,
  isOpen,
  onClose,
  onSafePointsSelected
}) => {
  // Estados principales
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSafePoints, setSelectedSafePoints] = useState<SelectedSafePoints>({});
  
  // Estados de datos
  const [driverPreferredPoints, setDriverPreferredPoints] = useState<{
    pickup: SafePoint[];
    dropoff: SafePoint[];
  }>({ pickup: [], dropoff: [] });
  const [suggestedPoints, setSuggestedPoints] = useState<{
    pickup: SafePoint[];
    dropoff: SafePoint[];
  }>({ pickup: [], dropoff: [] });
  const [nearbyPoints, setNearbyPoints] = useState<{
    pickup: SafePoint[];
    dropoff: SafePoint[];
  }>({ pickup: [], dropoff: [] });
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState<'driver-preferred' | 'suggested' | 'nearby'>('driver-preferred');
  const [selectionType, setSelectionType] = useState<'pickup' | 'dropoff'>('pickup');
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalReason, setProposalReason] = useState('');
  const [selectedForProposal, setSelectedForProposal] = useState<SafePoint | null>(null);

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadSafePointData();
    }
  }, [isOpen, trip.id]);

  const loadSafePointData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Loading SafePoint data for trip:', trip.id);
      
      // 1. Obtener preferencias del conductor
      const driverPrefs = await getDriverSafePointPreferences(Number(trip.id));
      if (driverPrefs.success) {
        setDriverPreferredPoints({
          pickup: driverPrefs.pickup_preferences,
          dropoff: driverPrefs.dropoff_preferences
        });
        console.log('✅ Driver preferences loaded:', {
          pickup_count: driverPrefs.pickup_preferences.length,
          dropoff_count: driverPrefs.dropoff_preferences.length
        });
      }

      // 2. Sugerir SafePoints para la ruta (sin coordenadas por ahora)
      // El trip puede no tener coordenadas específicas en el frontend
      setSuggestedPoints({
        pickup: [],
        dropoff: []
      });
      
      console.log('⚠️ Route suggestions skipped - no coordinates in Trip type');

      // 3. Por ahora no buscamos cercanos sin coordenadas exactas
      // El backend puede implementar geocodificación en el futuro
      
      setNearbyPoints({
        pickup: [],
        dropoff: []
      });
      
      console.log('⚠️ Nearby points search skipped - no coordinates in Trip type');

    } catch (error) {
      console.error('❌ Error loading SafePoint data:', error);
      setError('Error cargando puntos de encuentro. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSafePointSelect = (safepoint: SafePoint, type: 'pickup' | 'dropoff') => {
    setSelectedSafePoints(prev => ({
      ...prev,
      [type]: safepoint
    }));
    
    notifications.show({
      title: `Punto de ${type === 'pickup' ? 'recogida' : 'dejada'} seleccionado`,
      message: `${safepoint.name} - ${formatSafePointCategory(safepoint.category)}`,
      color: 'green',
      autoClose: 3000,
    });
  };

  const handleProposeAlternative = async () => {
    if (!selectedForProposal || !proposalReason.trim()) {
      notifications.show({
        title: 'Información faltante',
        message: 'Por favor, selecciona un punto y proporciona una razón para la propuesta.',
        color: 'red',
        autoClose: 4000,
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await proposeAlternativeSafePoint({
        trip_id: Number(trip.id),
        safepoint_id: selectedForProposal.id,
        selection_type: selectionType === 'pickup' ? 'pickup_selection' : 'dropoff_selection',
        passenger_reason: proposalReason
      });

      if (result.success) {
        notifications.show({
          title: '✅ Propuesta enviada',
          message: 'Tu propuesta ha sido enviada al conductor. Te notificaremos cuando responda.',
          color: 'green',
          autoClose: 5000,
        });
        
        setShowProposalForm(false);
        setProposalReason('');
        setSelectedForProposal(null);
      } else {
        throw new Error(result.error || 'Error enviando propuesta');
      }
    } catch (error) {
      console.error('❌ Error proposing alternative:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudo enviar la propuesta. Intenta de nuevo.',
        color: 'red',
        autoClose: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSelection = () => {
    if (!selectedSafePoints.pickup || !selectedSafePoints.dropoff) {
      notifications.show({
        title: 'Selección incompleta',
        message: 'Por favor, selecciona tanto el punto de recogida como el de dejada.',
        color: 'orange',
        autoClose: 4000,
      });
      return;
    }

    onSafePointsSelected(selectedSafePoints.pickup.id, selectedSafePoints.dropoff.id);
    onClose();
  };

  const getCurrentPoints = () => {
    switch (activeTab) {
      case 'driver-preferred':
        return selectionType === 'pickup' ? driverPreferredPoints.pickup : driverPreferredPoints.dropoff;
      case 'suggested':
        return selectionType === 'pickup' ? suggestedPoints.pickup : suggestedPoints.dropoff;
      case 'nearby':
        return selectionType === 'pickup' ? nearbyPoints.pickup : nearbyPoints.dropoff;
      default:
        return [];
    }
  };

  const renderSafePointCard = (safepoint: SafePoint) => {
    const isSelected = (selectionType === 'pickup' && selectedSafePoints.pickup?.id === safepoint.id) ||
                     (selectionType === 'dropoff' && selectedSafePoints.dropoff?.id === safepoint.id);
    
    return (
      <Card
        key={safepoint.id}
        className={`${styles.safepointCard} ${isSelected ? styles.selected : ''}`}
        shadow="sm"
        withBorder
        style={{ cursor: 'pointer' }}
        onClick={() => handleSafePointSelect(safepoint, selectionType)}
      >
        <Group justify="space-between" mb="xs">
          <Group gap="sm">
            <div 
              className={styles.categoryIcon}
              style={{ backgroundColor: getSafePointColor(safepoint.category) + '20' }}
            >
              <Text size="lg">{getSafePointIcon(safepoint.category)}</Text>
            </div>
            <div>
              <Text fw={600} size="sm">{safepoint.name}</Text>
              <Text size="xs" c="dimmed">{formatSafePointCategory(safepoint.category)}</Text>
            </div>
          </Group>
          
          {isSelected && (
            <CheckCircle2 size={20} color="#22c55e" />
          )}
        </Group>
        
        <Text size="xs" c="dimmed" mb="xs">{safepoint.address}</Text>
        
        <Group justify="space-between" align="center">
          <Group gap="xs">
            {safepoint.distance_km && (
              <Badge size="xs" variant="light" color="blue">
                {safepoint.distance_km < 1 
                  ? `${Math.round(safepoint.distance_km * 1000)}m`
                  : `${safepoint.distance_km.toFixed(1)}km`
                }
              </Badge>
            )}
            
            {safepoint.rating_average && (
              <Badge size="xs" variant="light" color="yellow">
                <Group gap={2}>
                  <Star size={10} />
                  <Text size="xs">{safepoint.rating_average.toFixed(1)}</Text>
                </Group>
              </Badge>
            )}
          </Group>
          
          {activeTab !== 'driver-preferred' && (
            <Tooltip label="Proponer como alternativa">
              <ActionIcon
                size="sm"
                variant="light"
                color="orange"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedForProposal(safepoint);
                  setShowProposalForm(true);
                }}
              >
                <Plus size={12} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Card>
    );
  };

  return (
    <>
      <Modal
        opened={isOpen}
        onClose={onClose}
        title="Seleccionar Puntos de Encuentro"
        size="lg"
        centered
        closeOnClickOutside={false}
      >
        <LoadingOverlay visible={isLoading} />
        
        <Stack gap="md">
          {error && (
            <Alert
              icon={<AlertCircle size={16} />}
              title="Error"
              color="red"
              variant="filled"
            >
              {error}
            </Alert>
          )}

          {/* Info del viaje */}
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between" mb="xs">
              <Text fw={600} size="sm">Información del Viaje</Text>
              <Badge color="blue">{trip.dateTime}</Badge>
            </Group>
            <Group gap="md">
              <Group gap="xs">
                <MapPin size={14} color="#22c55e" />
                <Text size="xs">{trip.origin.address}</Text>
              </Group>
              <Group gap="xs">
                <Navigation size={14} color="#ef4444" />
                <Text size="xs">{trip.destination.address}</Text>
              </Group>
            </Group>
          </Paper>

          {/* Selector de tipo (pickup/dropoff) */}
          <Group gap="xs">
            <Button
              variant={selectionType === 'pickup' ? 'filled' : 'light'}
              size="sm"
              onClick={() => setSelectionType('pickup')}
              leftSection={<MapPin size={16} />}
            >
              Punto de Recogida
            </Button>
            <Button
              variant={selectionType === 'dropoff' ? 'filled' : 'light'}
              size="sm"
              onClick={() => setSelectionType('dropoff')}
              leftSection={<Navigation size={16} />}
            >
              Punto de Dejada
            </Button>
          </Group>

          {/* Tabs de categorías */}
          <Group gap="xs">
            <Button
              variant={activeTab === 'driver-preferred' ? 'filled' : 'light'}
              size="xs"
              onClick={() => setActiveTab('driver-preferred')}
            >
              Preferidos por Conductor ({
                selectionType === 'pickup' 
                  ? driverPreferredPoints.pickup.length 
                  : driverPreferredPoints.dropoff.length
              })
            </Button>
            <Button
              variant={activeTab === 'suggested' ? 'filled' : 'light'}
              size="xs"
              onClick={() => setActiveTab('suggested')}
            >
              Sugeridos ({
                selectionType === 'pickup' 
                  ? suggestedPoints.pickup.length 
                  : suggestedPoints.dropoff.length
              })
            </Button>
            <Button
              variant={activeTab === 'nearby' ? 'filled' : 'light'}
              size="xs"
              onClick={() => setActiveTab('nearby')}
            >
              Cercanos ({
                selectionType === 'pickup' 
                  ? nearbyPoints.pickup.length 
                  : nearbyPoints.dropoff.length
              })
            </Button>
          </Group>

          {/* Lista de SafePoints */}
          <div className={styles.safepointsList}>
            {getCurrentPoints().length > 0 ? (
              getCurrentPoints().map(renderSafePointCard)
            ) : (
              <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
                <MapPin size={32} color="#9ca3af" style={{ margin: '0 auto' }} />
                <Text size="sm" c="dimmed" mt="sm">
                  No hay SafePoints disponibles en esta categoría para {selectionType === 'pickup' ? 'recogida' : 'dejada'}
                </Text>
                {activeTab === 'nearby' && (
                  <Text size="xs" c="dimmed" mt="xs">
                    Intenta expandir el radio de búsqueda o proponer un nuevo punto
                  </Text>
                )}
              </Paper>
            )}
          </div>

          {/* Resumen de selección */}
          {(selectedSafePoints.pickup || selectedSafePoints.dropoff) && (
            <Paper withBorder p="md" radius="md" style={{ backgroundColor: '#f8fafc' }}>
              <Text fw={600} size="sm" mb="xs">Puntos Seleccionados:</Text>
              <Stack gap="xs">
                {selectedSafePoints.pickup && (
                  <Group gap="sm">
                    <Badge color="green" size="sm">Recogida</Badge>
                    <Text size="sm">{selectedSafePoints.pickup.name}</Text>
                  </Group>
                )}
                {selectedSafePoints.dropoff && (
                  <Group gap="sm">
                    <Badge color="red" size="sm">Dejada</Badge>
                    <Text size="sm">{selectedSafePoints.dropoff.name}</Text>
                  </Group>
                )}
              </Stack>
            </Paper>
          )}

          {/* Botones de acción */}
          <Group justify="space-between">
            <Button
              variant="light"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmSelection}
              disabled={!selectedSafePoints.pickup || !selectedSafePoints.dropoff}
              leftSection={<CheckCircle2 size={16} />}
            >
              Confirmar Selección
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal de propuesta alternativa */}
      <Modal
        opened={showProposalForm}
        onClose={() => setShowProposalForm(false)}
        title="Proponer SafePoint Alternativo"
        size="md"
        centered
      >
        <Stack gap="md">
          {selectedForProposal && (
            <Paper withBorder p="md" radius="md">
              <Group gap="sm" mb="xs">
                <div 
                  className={styles.categoryIcon}
                  style={{ backgroundColor: getSafePointColor(selectedForProposal.category) + '20' }}
                >
                  <Text size="lg">{getSafePointIcon(selectedForProposal.category)}</Text>
                </div>
                <div>
                  <Text fw={600} size="sm">{selectedForProposal.name}</Text>
                  <Text size="xs" c="dimmed">{formatSafePointCategory(selectedForProposal.category)}</Text>
                </div>
              </Group>
              <Text size="xs" c="dimmed">{selectedForProposal.address}</Text>
            </Paper>
          )}

          <Textarea
            label="Razón de la propuesta"
            placeholder="Explica por qué este SafePoint sería mejor para ti (ej: más cerca de tu casa, mejor acceso al transporte público, etc.)"
            value={proposalReason}
            onChange={(event) => setProposalReason(event.currentTarget.value)}
            minRows={3}
            maxRows={5}
            required
          />

          <Alert
            icon={<MessageSquare size={16} />}
            title="Información"
            color="blue"
            variant="light"
          >
            Tu propuesta será enviada al conductor. Él podrá aprobarla o sugerir otra alternativa.
          </Alert>

          <Group justify="space-between">
            <Button
              variant="light"
              onClick={() => setShowProposalForm(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleProposeAlternative}
              disabled={!proposalReason.trim()}
              loading={isLoading}
            >
              Enviar Propuesta
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};
