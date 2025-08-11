import { useState, useEffect } from 'react';
import {
  Group,
  Text,
  Stack,
  Button,
  Modal,
  Alert,
  Card,
  Loader,
  Badge
} from '@mantine/core';
import {
  IconMapPin,
  IconCheck,
  IconInfoCircle,
  IconCar,
  IconFlag
} from '@tabler/icons-react';
import {
  getBookingAvailableSafePoints,
  selectSafePointForBooking,
  getMyBookingSelections,
  type SafePointOption
} from '@/services/reservas';
import styles from './BookingSafePoints.module.css';

interface BookingSafePointsProps {
  bookingId: number;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (hasSelections: boolean) => void;
}

export default function BookingSafePoints({ 
  bookingId, 
  isOpen, 
  onClose, 
  onComplete 
}: BookingSafePointsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableOptions, setAvailableOptions] = useState<{
    pickup_options: SafePointOption[];
    dropoff_options: SafePointOption[];
    pickup_count: number;
    dropoff_count: number;
  } | null>(null);
  const [currentSelections, setCurrentSelections] = useState<{
    pickup: any | null;
    dropoff: any | null;
  }>({ pickup: null, dropoff: null });

  useEffect(() => {
    if (isOpen && bookingId) {
      loadSafePointData();
    }
  }, [isOpen, bookingId]);

  const loadSafePointData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 Cargando SafePoints para booking: ${bookingId}`);

      // Cargar opciones disponibles y selecciones actuales
      const [availableResponse, selectionsResponse] = await Promise.all([
        getBookingAvailableSafePoints(bookingId),
        getMyBookingSelections(bookingId)
      ]);

      if (availableResponse.success) {
        setAvailableOptions(availableResponse.available_safepoints);
        console.log(`✅ SafePoints cargados: ${availableResponse.available_safepoints.pickup_count} pickup, ${availableResponse.available_safepoints.dropoff_count} dropoff`);
      } else {
        console.log('⚠️ No se encontraron SafePoints disponibles');
      }

      if (selectionsResponse.success) {
        setCurrentSelections({
          pickup: selectionsResponse.selections.pickup,
          dropoff: selectionsResponse.selections.dropoff
        });
        console.log(`✅ Selecciones actuales cargadas`);
      }

    } catch (err) {
      console.error('❌ Error cargando SafePoints:', err);
      setError('Error cargando información de puntos de encuentro');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSafePoint = async (
    type: 'pickup' | 'dropoff',
    safepoint: SafePointOption
  ) => {
    setSaving(true);
    setError(null);

    try {
      console.log(`🎯 Seleccionando ${type} SafePoint:`, safepoint.name);

      const result = await selectSafePointForBooking(bookingId, {
        booking_id: bookingId,
        safepoint_id: safepoint.id,
        selection_type: type
      });

      if (result.success) {
        // Actualizar selecciones actuales
        setCurrentSelections(prev => ({
          ...prev,
          [type]: {
            ...safepoint,
            selection_id: result.selection?.id
          }
        }));

        console.log(`✅ ${type} SafePoint seleccionado exitosamente`);
      } else {
        setError(result.error || 'Error seleccionando punto de encuentro');
      }
    } catch (err) {
      console.error(`❌ Error seleccionando ${type}:`, err);
      setError('Error seleccionando punto de encuentro');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = () => {
    const hasSelections = currentSelections.pickup || currentSelections.dropoff;
    console.log(`🎉 Completando selección de SafePoints: ${hasSelections ? 'Con selecciones' : 'Sin selecciones'}`);
    
    onComplete?.(hasSelections);
    onClose();
  };

  const handleSkip = () => {
    console.log('⏭️ Usuario omitió selección de SafePoints');
    onComplete?.(false);
    onClose();
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
      supermarket: '🛒'
    };
    return iconMap[category] || '📍';
  };

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
        className={styles.modal}
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
      className={styles.modal}
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
        <Card className={styles.explanationCard} p="md" radius="md">
          <Text size="md" ta="center" fw={600} mb="sm" c="blue">
            📍 Coordina tu punto de encuentro
          </Text>
          <Text size="sm" ta="center" c="dimmed">
            Selecciona dónde prefieres que te recojan y te dejen para facilitar la coordinación con el conductor
          </Text>
        </Card>

        {/* Verificar si hay SafePoints disponibles */}
        {!availableOptions || (availableOptions.pickup_count === 0 && availableOptions.dropoff_count === 0) ? (
          <Alert color="orange" variant="light" icon={<IconInfoCircle size={16} />}>
            <Text size="sm" fw={500} mb="xs">No hay puntos específicos configurados</Text>
            <Text size="sm">
              El conductor aún no ha configurado puntos de encuentro específicos. 
              Podrás coordinar directamente con él antes del viaje.
            </Text>
          </Alert>
        ) : (
          <Stack gap="xl">
            {/* Punto de Recogida */}
            {availableOptions.pickup_count > 0 && (
              <div>
                <Group gap="xs" mb="md">
                  <IconCar size={18} color="green" />
                  <Text size="lg" fw={600} c="green">Punto de Recogida</Text>
                  <Badge size="sm" color="green" variant="light">
                    {availableOptions.pickup_count} disponibles
                  </Badge>
                </Group>

                {currentSelections.pickup ? (
                  <Card className={styles.selectedCard} p="md" radius="md">
                    <Group gap="xs" mb="xs">
                      <IconCheck size={16} color="green" />
                      <Text size="sm" fw={600} c="green">✅ Seleccionado</Text>
                      {availableOptions.pickup_options.find(p => p.id === currentSelections.pickup.id)?.is_preferred && (
                        <Badge size="xs" color="yellow" variant="light">⭐ Preferido</Badge>
                      )}
                    </Group>
                    <Text size="md" fw={500}>{currentSelections.pickup.name}</Text>
                    <Text size="sm" c="dimmed">{currentSelections.pickup.address}</Text>
                  </Card>
                ) : (
                  <Stack gap="sm">
                    {availableOptions.pickup_options.map((option) => (
                      <Card
                        key={option.id}
                        className={styles.optionCard}
                        p="md"
                        radius="md"
                        onClick={() => handleSelectSafePoint('pickup', option)}
                        style={{
                          cursor: saving ? 'not-allowed' : 'pointer',
                          opacity: saving ? 0.6 : 1
                        }}
                      >
                        <Group gap="md">
                          <div className={styles.safepointIcon}>
                            {getSafePointIcon(option.category)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <Group gap="xs" mb="xs">
                              <Text size="md" fw={500}>{option.name}</Text>
                              {option.is_preferred && (
                                <Badge size="xs" color="yellow" variant="light">⭐ Preferido</Badge>
                              )}
                            </Group>
                            <Text size="sm" c="dimmed">{option.address}</Text>
                            {option.city && (
                              <Text size="xs" c="dimmed">{option.city}</Text>
                            )}
                          </div>
                          <IconCar size={16} color="green" />
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                )}
              </div>
            )}

            {/* Punto de Descenso */}
            {availableOptions.dropoff_count > 0 && (
              <div>
                <Group gap="xs" mb="md">
                  <IconFlag size={18} color="blue" />
                  <Text size="lg" fw={600} c="blue">Punto de Descenso</Text>
                  <Badge size="sm" color="blue" variant="light">
                    {availableOptions.dropoff_count} disponibles
                  </Badge>
                </Group>

                {currentSelections.dropoff ? (
                  <Card className={styles.selectedCard} p="md" radius="md">
                    <Group gap="xs" mb="xs">
                      <IconCheck size={16} color="blue" />
                      <Text size="sm" fw={600} c="blue">✅ Seleccionado</Text>
                      {availableOptions.dropoff_options.find(p => p.id === currentSelections.dropoff.id)?.is_preferred && (
                        <Badge size="xs" color="yellow" variant="light">⭐ Preferido</Badge>
                      )}
                    </Group>
                    <Text size="md" fw={500}>{currentSelections.dropoff.name}</Text>
                    <Text size="sm" c="dimmed">{currentSelections.dropoff.address}</Text>
                  </Card>
                ) : (
                  <Stack gap="sm">
                    {availableOptions.dropoff_options.map((option) => (
                      <Card
                        key={option.id}
                        className={styles.optionCard}
                        p="md"
                        radius="md"
                        onClick={() => handleSelectSafePoint('dropoff', option)}
                        style={{
                          cursor: saving ? 'not-allowed' : 'pointer',
                          opacity: saving ? 0.6 : 1
                        }}
                      >
                        <Group gap="md">
                          <div className={styles.safepointIcon}>
                            {getSafePointIcon(option.category)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <Group gap="xs" mb="xs">
                              <Text size="md" fw={500}>{option.name}</Text>
                              {option.is_preferred && (
                                <Badge size="xs" color="yellow" variant="light">⭐ Preferido</Badge>
                              )}
                            </Group>
                            <Text size="sm" c="dimmed">{option.address}</Text>
                            {option.city && (
                              <Text size="xs" c="dimmed">{option.city}</Text>
                            )}
                          </div>
                          <IconFlag size={16} color="blue" />
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                )}
              </div>
            )}
          </Stack>
        )}

        {/* Botones de acción */}
        <Group justify="space-between" mt="lg">
          <Button
            variant="outline"
            size="md"
            onClick={handleSkip}
            disabled={saving}
            className={styles.skipButton}
          >
            Omitir por ahora
          </Button>
          
          <Button
            size="md"
            onClick={handleComplete}
            loading={saving}
            className={styles.completeButton}
            leftSection={<IconCheck size={16} />}
          >
            {currentSelections.pickup || currentSelections.dropoff ? 'Continuar' : 'Coordinar después'}
          </Button>
        </Group>

        <Text size="xs" ta="center" c="dimmed">
          Podrás coordinar los detalles finales directamente con el conductor
        </Text>
      </Stack>
    </Modal>
  );
}
