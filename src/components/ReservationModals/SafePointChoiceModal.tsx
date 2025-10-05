import React, { useState } from 'react';
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
import { IconMapPin, IconArrowLeft } from '@tabler/icons-react';
import { SafePointSelector } from '@/components/ReservationModals/SafePointSelector';
import styles from './SafePointChoiceModal.module.css';

interface SafePointChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: (useSafePoints: boolean, pickupId?: number, dropoffId?: number) => void;
  onBack: () => void;
}

export const SafePointChoiceModal: React.FC<SafePointChoiceModalProps> = ({
  isOpen,
  onClose,
  onNext,
  onBack
}) => {
  const [showSafePointSelector, setShowSafePointSelector] = useState(false);

  const handleContinueWithoutSafePoints = () => {
    onNext(false);
  };

  const handleUseSafePoints = () => {
    setShowSafePointSelector(true);
  };

  const handleSafePointsSelected = (pickupId: number, dropoffId: number) => {
    setShowSafePointSelector(false);
    onNext(true, pickupId, dropoffId);
  };

  const handleCloseSafePointSelector = () => {
    setShowSafePointSelector(false);
  };

  if (showSafePointSelector) {
    return (
      <SafePointSelector
        isOpen={showSafePointSelector}
        onClose={handleCloseSafePointSelector}
        onSafePointsSelected={handleSafePointsSelected}
      />
    );
  }

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
        <Title order={3} className={styles.title} ta="center" mb="lg">
          ¿Cómo prefieres la recogida?
        </Title>

        {/* Options */}
        <Stack gap="md">
          <Card className={styles.optionCard} withBorder onClick={handleUseSafePoints}>
            <Group gap="md">
              <IconMapPin size={24} style={{ color: 'var(--reservation-accent)' }} />
              <div style={{ flex: 1 }}>
                <Text fw={600} size="sm" mb="xs">
                  Puntos de encuentro específicos
                </Text>
                <Text size="xs" c="dimmed">
                  Selecciona puntos de recogida y descenso seguros
                </Text>
              </div>
            </Group>
          </Card>

          <Card className={styles.optionCard} withBorder onClick={handleContinueWithoutSafePoints}>
            <Group gap="md">
              <Text size="xl" style={{ color: 'var(--reservation-accent)' }}>🚗</Text>
              <div style={{ flex: 1 }}>
                <Text fw={600} size="sm" mb="xs">
                  Ruta directa
                </Text>
                <Text size="xs" c="dimmed">
                  Coordinar directamente con el conductor
                </Text>
              </div>
            </Group>
          </Card>
        </Stack>

        {/* Actions */}
        <Group gap="sm" mt="lg">
          <Button
            variant="outline"
            onClick={onBack}
            leftSection={<IconArrowLeft size={16} />}
            className={styles.backButton}
          >
            Atrás
          </Button>
        </Group>
      </Box>
    </Modal>
  );
};