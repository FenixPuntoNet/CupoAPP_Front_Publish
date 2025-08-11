import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Text, 
  Button, 
  Group, 
  Stack, 
  Badge, 
  Select, 
  Textarea, 
  Alert,
  Loader,
  Modal,
  Title,
  Divider,
  ActionIcon
} from '@mantine/core';
import { 
  IconMapPin, 
  IconCar, 
  IconFlag, 
  IconCheck, 
  IconEdit,
  IconTrash,
  IconInfoCircle,
  IconStar
} from '@tabler/icons-react';
import { 
  getBookingAvailableSafePoints,
  selectSafePointForBooking,
  getMyBookingSelections,
  updateSafePointSelection,
  deleteSafePointSelection,
  type SafePointOption
} from '@/services/reservas';

interface BookingSafePointSelectorProps {
  bookingId: number;
  onSelectionChange?: (hasSelections: boolean) => void;
}

interface SafePointWithSelection extends SafePointOption {
  selection_id?: number;
  passenger_notes?: string;
  estimated_arrival_time?: string;
  status?: string;
  selected_at?: string;
}

const BookingSafePointSelector: React.FC<BookingSafePointSelectorProps> = ({
  bookingId,
  onSelectionChange
}) => {
  const [loading, setLoading] = useState(true);
  const [availableOptions, setAvailableOptions] = useState<{
    pickup_options: SafePointOption[];
    dropoff_options: SafePointOption[];
    pickup_count: number;
    dropoff_count: number;
  } | null>(null);
  const [currentSelections, setCurrentSelections] = useState<{
    pickup: SafePointWithSelection | null;
    dropoff: SafePointWithSelection | null;
  }>({ pickup: null, dropoff: null });
  const [selectedPickupId, setSelectedPickupId] = useState<string | null>(null);
  const [selectedDropoffId, setSelectedDropoffId] = useState<string | null>(null);
  const [pickupNotes, setPickupNotes] = useState('');
  const [dropoffNotes, setDropoffNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSelection, setEditingSelection] = useState<{
    type: 'pickup' | 'dropoff';
    selection: SafePointWithSelection;
  } | null>(null);

  useEffect(() => {
    loadSafePointData();
  }, [bookingId]);

  const loadSafePointData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Cargar opciones disponibles y selecciones actuales en paralelo
      const [availableResponse, selectionsResponse] = await Promise.all([
        getBookingAvailableSafePoints(bookingId),
        getMyBookingSelections(bookingId)
      ]);

      if (availableResponse.success) {
        setAvailableOptions(availableResponse.available_safepoints);
        console.log('📍 Opciones disponibles cargadas:', availableResponse.available_safepoints);
      } else {
        console.warn('⚠️ No se pudieron cargar las opciones disponibles');
      }

      if (selectionsResponse.success) {
        setCurrentSelections({
          pickup: selectionsResponse.selections.pickup || null,
          dropoff: selectionsResponse.selections.dropoff || null
        });

        // Pre-llenar los formularios si ya hay selecciones
        if (selectionsResponse.selections.pickup) {
          setSelectedPickupId(selectionsResponse.selections.pickup.id?.toString() || null);
          setPickupNotes(selectionsResponse.selections.pickup.passenger_notes || '');
        }
        if (selectionsResponse.selections.dropoff) {
          setSelectedDropoffId(selectionsResponse.selections.dropoff.id?.toString() || null);
          setDropoffNotes(selectionsResponse.selections.dropoff.passenger_notes || '');
        }

        // Notificar al padre si hay selecciones
        const hasSelections = selectionsResponse.selections.has_pickup || selectionsResponse.selections.has_dropoff;
        onSelectionChange?.(hasSelections);

        console.log('🎯 Selecciones actuales cargadas:', selectionsResponse.selections);
      }

    } catch (error) {
      console.error('❌ Error cargando datos de SafePoints:', error);
      setError('Error cargando información de puntos de encuentro');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSafePoint = async (
    selectionType: 'pickup' | 'dropoff',
    safepointId: number,
    notes: string
  ) => {
    setSaving(true);
    setError(null);

    try {
      const result = await selectSafePointForBooking(bookingId, {
        booking_id: bookingId,
        safepoint_id: safepointId,
        selection_type: selectionType,
        passenger_notes: notes || undefined
      });

      if (result.success) {
        // Recargar datos para reflejar los cambios
        await loadSafePointData();
        
        // Notificar éxito
        console.log(`✅ ${selectionType} seleccionado exitosamente`);
      } else {
        setError(result.error || 'Error seleccionando punto de encuentro');
      }
    } catch (error) {
      console.error('❌ Error en selección:', error);
      setError('Error seleccionando punto de encuentro');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSelection = async (
    selectionId: number,
    newSafepointId: number,
    newNotes: string
  ) => {
    setSaving(true);
    setError(null);

    try {
      const result = await updateSafePointSelection(bookingId, selectionId, {
        safepoint_id: newSafepointId,
        passenger_notes: newNotes || undefined
      });

      if (result.success) {
        await loadSafePointData();
        setEditingSelection(null);
        console.log('✅ Selección actualizada exitosamente');
      } else {
        setError(result.error || 'Error actualizando selección');
      }
    } catch (error) {
      console.error('❌ Error actualizando selección:', error);
      setError('Error actualizando selección');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSelection = async (selectionId: number, type: 'pickup' | 'dropoff') => {
    setSaving(true);
    setError(null);

    try {
      const result = await deleteSafePointSelection(bookingId, selectionId);

      if (result.success) {
        await loadSafePointData();
        // Limpiar el formulario correspondiente
        if (type === 'pickup') {
          setSelectedPickupId(null);
          setPickupNotes('');
        } else {
          setSelectedDropoffId(null);
          setDropoffNotes('');
        }
        console.log('✅ Selección eliminada exitosamente');
      } else {
        setError(result.error || 'Error eliminando selección');
      }
    } catch (error) {
      console.error('❌ Error eliminando selección:', error);
      setError('Error eliminando selección');
    } finally {
      setSaving(false);
    }
  };

  const getSelectData = (options: SafePointOption[]) => {
    return options.map(option => ({
      value: option.id.toString(),
      label: option.name,
      group: option.is_preferred ? 'Preferidos por el conductor' : 'Disponibles'
    }));
  };

  const getSafePointDetails = (safepointId: number, options: SafePointOption[]) => {
    return options.find(option => option.id === safepointId);
  };

  if (loading) {
    return (
      <Card padding="md" shadow="sm" withBorder>
        <Group justify="center" gap="sm">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">Cargando puntos de encuentro...</Text>
        </Group>
      </Card>
    );
  }

  if (!availableOptions || (availableOptions.pickup_count === 0 && availableOptions.dropoff_count === 0)) {
    return (
      <Card padding="md" shadow="sm" withBorder>
        <Group gap="xs" mb="sm">
          <IconInfoCircle size={16} color="orange" />
          <Text size="sm" fw={600} c="orange">Puntos de Encuentro</Text>
        </Group>
        <Alert color="orange" variant="light">
          <Text size="sm">
            El conductor aún no ha configurado puntos de encuentro para este viaje.
            Podrás coordinar directamente con él antes del viaje.
          </Text>
        </Alert>
      </Card>
    );
  }

  return (
    <>
      <Card padding="lg" shadow="sm" withBorder>
        <Group gap="xs" mb="lg">
          <IconMapPin size={20} color="#059669" />
          <Text size="lg" fw={700} c="#059669">Selecciona tus Puntos de Encuentro</Text>
        </Group>

        {error && (
          <Alert color="red" variant="light" mb="md">
            <Text size="sm">{error}</Text>
          </Alert>
        )}

        <Stack gap="xl">
          {/* Punto de Recogida */}
          {availableOptions.pickup_count > 0 && (
            <div>
              <Group gap="xs" mb="md">
                <IconCar size={18} color="green" />
                <Text size="md" fw={600} c="green">Punto de Recogida</Text>
                <Badge size="sm" color="green" variant="light">
                  {availableOptions.pickup_count} disponibles
                </Badge>
              </Group>

              {currentSelections.pickup ? (
                <Card padding="md" withBorder style={{ backgroundColor: '#f0fdf4' }}>
                  <Group justify="space-between" align="flex-start">
                    <div style={{ flex: 1 }}>
                      <Group gap="xs" mb="xs">
                        <IconCheck size={16} color="green" />
                        <Text size="sm" fw={600} c="green">Seleccionado</Text>
                        {currentSelections.pickup.is_preferred && (
                          <Badge size="xs" color="yellow" variant="light" leftSection={<IconStar size={12} />}>
                            Preferido
                          </Badge>
                        )}
                      </Group>
                      <Text size="sm" fw={500}>{currentSelections.pickup.name}</Text>
                      <Text size="xs" c="dimmed">{currentSelections.pickup.address}</Text>
                      {currentSelections.pickup.passenger_notes && (
                        <Text size="xs" c="blue" mt="xs">
                          📝 {currentSelections.pickup.passenger_notes}
                        </Text>
                      )}
                    </div>
                    <Group gap="xs">
                      <ActionIcon
                        size="sm"
                        variant="light"
                        color="blue"
                        onClick={() => setEditingSelection({
                          type: 'pickup',
                          selection: currentSelections.pickup!
                        })}
                      >
                        <IconEdit size={14} />
                      </ActionIcon>
                      <ActionIcon
                        size="sm"
                        variant="light"
                        color="red"
                        onClick={() => handleDeleteSelection(
                          currentSelections.pickup!.selection_id!,
                          'pickup'
                        )}
                        loading={saving}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Card>
              ) : (
                <Stack gap="md">
                  <Select
                    label="Elige un punto de recogida"
                    placeholder="Selecciona donde te recogeremos"
                    data={getSelectData(availableOptions.pickup_options)}
                    value={selectedPickupId}
                    onChange={setSelectedPickupId}
                    searchable
                  />

                  {selectedPickupId && (
                    <>
                      {(() => {
                        const selectedOption = getSafePointDetails(
                          parseInt(selectedPickupId),
                          availableOptions.pickup_options
                        );
                        return selectedOption ? (
                          <Card padding="sm" withBorder style={{ backgroundColor: '#fafafa' }}>
                            <Group gap="xs" mb="xs">
                              <Text size="sm" fw={500}>{selectedOption.name}</Text>
                              {selectedOption.is_preferred && (
                                <Badge size="xs" color="yellow" variant="light" leftSection={<IconStar size={12} />}>
                                  Preferido
                                </Badge>
                              )}
                            </Group>
                            <Text size="xs" c="dimmed">{selectedOption.address}</Text>
                          </Card>
                        ) : null;
                      })()}

                      <Textarea
                        label="Notas adicionales (opcional)"
                        placeholder="Ej: Estaré cerca de la entrada principal..."
                        value={pickupNotes}
                        onChange={(e) => setPickupNotes(e.target.value)}
                        minRows={2}
                        maxRows={4}
                      />

                      <Button
                        onClick={() => handleSelectSafePoint(
                          'pickup',
                          parseInt(selectedPickupId),
                          pickupNotes
                        )}
                        loading={saving}
                        leftSection={<IconCheck size={16} />}
                        color="green"
                      >
                        Confirmar Punto de Recogida
                      </Button>
                    </>
                  )}
                </Stack>
              )}
            </div>
          )}

          {/* Punto de Descenso */}
          {availableOptions.dropoff_count > 0 && (
            <div>
              <Group gap="xs" mb="md">
                <IconFlag size={18} color="blue" />
                <Text size="md" fw={600} c="blue">Punto de Descenso</Text>
                <Badge size="sm" color="blue" variant="light">
                  {availableOptions.dropoff_count} disponibles
                </Badge>
              </Group>

              {currentSelections.dropoff ? (
                <Card padding="md" withBorder style={{ backgroundColor: '#eff6ff' }}>
                  <Group justify="space-between" align="flex-start">
                    <div style={{ flex: 1 }}>
                      <Group gap="xs" mb="xs">
                        <IconCheck size={16} color="blue" />
                        <Text size="sm" fw={600} c="blue">Seleccionado</Text>
                        {currentSelections.dropoff.is_preferred && (
                          <Badge size="xs" color="yellow" variant="light" leftSection={<IconStar size={12} />}>
                            Preferido
                          </Badge>
                        )}
                      </Group>
                      <Text size="sm" fw={500}>{currentSelections.dropoff.name}</Text>
                      <Text size="xs" c="dimmed">{currentSelections.dropoff.address}</Text>
                      {currentSelections.dropoff.passenger_notes && (
                        <Text size="xs" c="blue" mt="xs">
                          📝 {currentSelections.dropoff.passenger_notes}
                        </Text>
                      )}
                    </div>
                    <Group gap="xs">
                      <ActionIcon
                        size="sm"
                        variant="light"
                        color="blue"
                        onClick={() => setEditingSelection({
                          type: 'dropoff',
                          selection: currentSelections.dropoff!
                        })}
                      >
                        <IconEdit size={14} />
                      </ActionIcon>
                      <ActionIcon
                        size="sm"
                        variant="light"
                        color="red"
                        onClick={() => handleDeleteSelection(
                          currentSelections.dropoff!.selection_id!,
                          'dropoff'
                        )}
                        loading={saving}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Card>
              ) : (
                <Stack gap="md">
                  <Select
                    label="Elige un punto de descenso"
                    placeholder="Selecciona donde te dejaremos"
                    data={getSelectData(availableOptions.dropoff_options)}
                    value={selectedDropoffId}
                    onChange={setSelectedDropoffId}
                    searchable
                  />

                  {selectedDropoffId && (
                    <>
                      {(() => {
                        const selectedOption = getSafePointDetails(
                          parseInt(selectedDropoffId),
                          availableOptions.dropoff_options
                        );
                        return selectedOption ? (
                          <Card padding="sm" withBorder style={{ backgroundColor: '#fafafa' }}>
                            <Group gap="xs" mb="xs">
                              <Text size="sm" fw={500}>{selectedOption.name}</Text>
                              {selectedOption.is_preferred && (
                                <Badge size="xs" color="yellow" variant="light" leftSection={<IconStar size={12} />}>
                                  Preferido
                                </Badge>
                              )}
                            </Group>
                            <Text size="xs" c="dimmed">{selectedOption.address}</Text>
                          </Card>
                        ) : null;
                      })()}

                      <Textarea
                        label="Notas adicionales (opcional)"
                        placeholder="Ej: Pueden dejarme en cualquier esquina..."
                        value={dropoffNotes}
                        onChange={(e) => setDropoffNotes(e.target.value)}
                        minRows={2}
                        maxRows={4}
                      />

                      <Button
                        onClick={() => handleSelectSafePoint(
                          'dropoff',
                          parseInt(selectedDropoffId),
                          dropoffNotes
                        )}
                        loading={saving}
                        leftSection={<IconCheck size={16} />}
                        color="blue"
                      >
                        Confirmar Punto de Descenso
                      </Button>
                    </>
                  )}
                </Stack>
              )}
            </div>
          )}
        </Stack>

        {/* Resumen de selecciones */}
        {(currentSelections.pickup || currentSelections.dropoff) && (
          <>
            <Divider my="lg" />
            <Alert color="green" variant="light">
              <Group gap="xs">
                <IconCheck size={16} />
                <Text size="sm" fw={500}>
                  {currentSelections.pickup && currentSelections.dropoff
                    ? '¡Perfecto! Has seleccionado ambos puntos de encuentro'
                    : `Has seleccionado tu punto de ${currentSelections.pickup ? 'recogida' : 'descenso'}`
                  }
                </Text>
              </Group>
              <Text size="xs" c="dimmed" mt="xs">
                Podrás coordinar los detalles finales directamente con el conductor
              </Text>
            </Alert>
          </>
        )}
      </Card>

      {/* Modal de edición */}
      <Modal
        opened={!!editingSelection}
        onClose={() => setEditingSelection(null)}
        title={
          <Title order={4}>
            Editar Punto de {editingSelection?.type === 'pickup' ? 'Recogida' : 'Descenso'}
          </Title>
        }
        size="md"
      >
        {editingSelection && (
          <Stack gap="md">
            <Select
              label={`Nuevo punto de ${editingSelection.type === 'pickup' ? 'recogida' : 'descenso'}`}
              data={getSelectData(
                editingSelection.type === 'pickup'
                  ? availableOptions?.pickup_options || []
                  : availableOptions?.dropoff_options || []
              )}
              value={editingSelection.selection.id.toString()}
              onChange={(value) => {
                if (value && editingSelection) {
                  setEditingSelection({
                    ...editingSelection,
                    selection: {
                      ...editingSelection.selection,
                      id: parseInt(value)
                    }
                  });
                }
              }}
              searchable
            />

            <Textarea
              label="Notas adicionales"
              value={editingSelection.selection.passenger_notes || ''}
              onChange={(e) => {
                if (editingSelection) {
                  setEditingSelection({
                    ...editingSelection,
                    selection: {
                      ...editingSelection.selection,
                      passenger_notes: e.target.value
                    }
                  });
                }
              }}
              minRows={2}
              maxRows={4}
            />

            <Group justify="flex-end" gap="sm">
              <Button
                variant="outline"
                onClick={() => setEditingSelection(null)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (editingSelection) {
                    handleUpdateSelection(
                      editingSelection.selection.selection_id!,
                      editingSelection.selection.id,
                      editingSelection.selection.passenger_notes || ''
                    );
                  }
                }}
                loading={saving}
                leftSection={<IconCheck size={16} />}
              >
                Guardar Cambios
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
};

export default BookingSafePointSelector;
