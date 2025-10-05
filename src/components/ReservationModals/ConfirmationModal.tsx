import React from 'react';
import {
  Modal,
  Text,
  Button,
  Group,
  Box,
  Title,
  Card,
  Stack
} from '@mantine/core';
import { IconCheck, IconArrowLeft, IconCreditCard } from '@tabler/icons-react';
import type { Trip } from '@/types/Trip';
import styles from './ConfirmationModal.module.css';

interface Passenger {
  fullName: string;
  identificationNumber: string;
}

interface ConfirmationModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onBack: () => void;
  passengers: Passenger[];
  useSafePoints: boolean;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  trip,
  isOpen,
  onClose,
  onConfirm,
  onBack,
  passengers,
  isLoading = false
}) => {
  const totalPrice = trip.pricePerSeat * passengers.length;

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={null}
      size="md"
      centered
      closeOnClickOutside={false}
      overlayProps={{
        opacity: 0.7,
        blur: 4,
      }}
      styles={{
        content: {
          background: 'var(--reservation-bg)',
          border: '1px solid var(--reservation-border)',
          borderRadius: '8px',
        },
        header: {
          display: 'none'
        },
        body: {
          padding: '0',
        }
      }}
    >
      <Box className={styles.container}>
        {/* Header Simple */}
        <Group justify="center" gap="sm" mb="lg">
          <IconCheck size={24} style={{ color: 'var(--reservation-success)' }} />
          <Title order={3} className={styles.title}>
            Confirmar reserva
          </Title>
        </Group>

        {/* Trip Summary */}
        <Card className={styles.tripCard} withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <Text size="sm">Ruta:</Text>
              <Text size="sm" fw={500}>{trip.origin.address} → {trip.destination.address}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm">Fecha:</Text>
              <Text size="sm" fw={500}>
                {new Date(trip.dateTime).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm">Pasajeros:</Text>
              <Text size="sm" fw={500}>{passengers.length}</Text>
            </Group>
          </Stack>
        </Card>

        {/* Price Summary */}
        <Card className={styles.priceCard} withBorder>
          <Group justify="space-between" align="center">
            <Text fw={600}>Total</Text>
            <Text fw={700} size="lg" style={{ color: 'var(--reservation-success)' }}>
              ${totalPrice.toLocaleString()}
            </Text>
          </Group>
        </Card>

        {/* Actions */}
        <Group gap="sm" mt="lg">
          <Button
            variant="outline"
            onClick={onBack}
            leftSection={<IconArrowLeft size={16} />}
            className={styles.backButton}
            disabled={isLoading}
          >
            Atrás
          </Button>
          
          <Button
            onClick={onConfirm}
            flex={1}
            className={styles.confirmButton}
            leftSection={<IconCreditCard size={16} />}
            loading={isLoading}
          >
            Confirmar
          </Button>
        </Group>
      </Box>
    </Modal>
  );
};