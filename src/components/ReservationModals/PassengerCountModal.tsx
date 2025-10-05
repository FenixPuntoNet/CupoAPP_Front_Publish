    import React, { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Text,
  TextInput,
  Group,
  ActionIcon,
  Card,
  Title,
  Box,
  Button
} from '@mantine/core';
import { IconMinus, IconPlus, IconArrowRight } from '@tabler/icons-react';
import type { Trip } from '@/types/Trip';
import styles from './PassengerCountModal.module.css';

interface Passenger {
  fullName: string;
  identificationNumber: string;
}

interface PassengerCountModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onNext: (passengerCount: number, passengers: Passenger[]) => void;
}

export const PassengerCountModal: React.FC<PassengerCountModalProps> = ({
  trip,
  isOpen,
  onClose,
  onNext
}) => {
  const [passengerCount, setPassengerCount] = useState(1);
  const [passengers, setPassengers] = useState<Passenger[]>([
    { fullName: '', identificationNumber: '' }
  ]);

  // Actualizar array de pasajeros cuando cambie la cantidad
  useEffect(() => {
    const newPassengers = Array(passengerCount).fill(null).map((_, index) => 
      passengers[index] || { fullName: '', identificationNumber: '' }
    );
    setPassengers(newPassengers);
  }, [passengerCount]);

  const handleIncrement = () => {
    if (passengerCount < trip.seats) {
      setPassengerCount(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (passengerCount > 1) {
      setPassengerCount(prev => prev - 1);
    }
  };

  const handlePassengerChange = (index: number, field: keyof Passenger, value: string) => {
    setPassengers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleNext = () => {
    // Validar que todos los pasajeros tengan información completa
    const isValid = passengers.every(p => 
      p.fullName.trim().length >= 3 && 
      p.identificationNumber.trim().length >= 6
    );
    
    if (isValid) {
      onNext(passengerCount, passengers);
    }
  };

  const totalPrice = trip.pricePerSeat * passengerCount;
  const completedPassengers = passengers.filter(p => 
    p.fullName.trim().length >= 3 && p.identificationNumber.trim().length >= 6
  ).length;
  const allComplete = completedPassengers === passengerCount;

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={null}
      size="lg"
      centered
      closeOnClickOutside={false}
      overlayProps={{
        opacity: 0.6,
        blur: 3,
      }}
      styles={{
        content: {
          background: 'var(--reservation-bg)',
          border: '1px solid var(--reservation-border)',
          borderRadius: '20px',
          backdropFilter: 'blur(20px)',
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
        <Title order={3} className={styles.title} ta="center">
          ¿Cuántos pasajeros?
        </Title>

        {/* Counter Simple */}
        <Group justify="center" gap="xl" my="xl">
          <ActionIcon
            size="lg"
            variant="light"
            onClick={handleDecrement}
            disabled={passengerCount <= 1}
            className={styles.counterButton}
          >
            <IconMinus size={18} />
          </ActionIcon>

          <Text size="2xl" fw={600} className={styles.counterText}>
            {passengerCount}
          </Text>

          <ActionIcon
            size="lg"
            variant="light"
            onClick={handleIncrement}
            disabled={passengerCount >= trip.seats}
            className={styles.counterButton}
          >
            <IconPlus size={18} />
          </ActionIcon>
        </Group>

        {/* Passenger Forms */}
        <Stack gap="md">
          {passengers.map((passenger, index) => (
            <Card key={index} className={styles.passengerCard} withBorder>
              <Text size="sm" fw={500} mb="sm" className={styles.passengerLabel}>
                Pasajero {index + 1}
              </Text>
              <Stack gap="sm">
                <TextInput
                  placeholder="Nombre completo"
                  value={passenger.fullName}
                  onChange={(e) => handlePassengerChange(index, 'fullName', e.target.value)}
                  className={styles.input}
                />
                <TextInput
                  placeholder="Número de cédula"
                  value={passenger.identificationNumber}
                  onChange={(e) => handlePassengerChange(index, 'identificationNumber', e.target.value)}
                  className={styles.input}
                />
              </Stack>
            </Card>
          ))}
        </Stack>

        {/* Price Summary - Minimal */}
        <Card className={styles.priceCard} withBorder>
          <Group justify="space-between" align="center">
            <Text size="sm" fw={500}>
              Total
            </Text>
            <Text size="lg" fw={700} style={{ color: 'var(--reservation-success)' }}>
              ${totalPrice.toLocaleString()}
            </Text>
          </Group>
        </Card>

        {/* Actions */}
        <Group gap="sm" mt="xl">
          <Button
            variant="outline"
            onClick={onClose}
            flex={1}
            className={styles.cancelButton}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleNext}
            flex={2}
            className={styles.nextButton}
            rightSection={<IconArrowRight size={16} />}
            disabled={!allComplete}
          >
            Continuar
          </Button>
        </Group>
      </Box>
    </Modal>
  );
};