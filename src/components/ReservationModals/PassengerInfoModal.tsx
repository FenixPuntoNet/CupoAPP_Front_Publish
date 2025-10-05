import React, { useState, useEffect } from 'react';
import {
  Modal,
  Text,
  Button,
  Group,
  Box,
  Title,
  Card,
  TextInput,
  Stack,
  Progress,
  Badge
} from '@mantine/core';
import { IconUser, IconId, IconArrowRight, IconArrowLeft, IconUsers } from '@tabler/icons-react';
import styles from './PassengerInfoModal.module.css';

interface Passenger {
  fullName: string;
  identificationNumber: string;
}

interface PassengerInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: (passengers: Passenger[]) => void;
  onBack: () => void;
  passengerCount: number;
}

export const PassengerInfoModal: React.FC<PassengerInfoModalProps> = ({
  isOpen,
  onClose,
  onNext,
  onBack,
  passengerCount
}) => {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [currentPassenger, setCurrentPassenger] = useState(0);

  // Inicializar pasajeros cuando cambie la cantidad
  useEffect(() => {
    setPassengers(Array(passengerCount).fill({ fullName: '', identificationNumber: '' }));
    setCurrentPassenger(0);
  }, [passengerCount]);

  const handlePassengerChange = (field: keyof Passenger, value: string) => {
    setPassengers(prev => {
      const updated = [...prev];
      updated[currentPassenger] = {
        ...updated[currentPassenger],
        [field]: value
      };
      return updated;
    });
  };

  const handleNext = () => {
    if (currentPassenger < passengerCount - 1) {
      setCurrentPassenger(prev => prev + 1);
    } else {
      // Validar que todos los pasajeros tengan información completa
      const isValid = passengers.every(p => 
        p.fullName.trim().length >= 3 && 
        p.identificationNumber.trim().length >= 6
      );
      
      if (isValid) {
        onNext(passengers);
      } else {
        alert('Por favor, completa la información de todos los pasajeros');
      }
    }
  };

  const handlePrevious = () => {
    if (currentPassenger > 0) {
      setCurrentPassenger(prev => prev - 1);
    } else {
      onBack();
    }
  };

  const currentPassengerData = passengers[currentPassenger] || { fullName: '', identificationNumber: '' };
  const progressValue = ((currentPassenger + 1) / passengerCount) * 100;
  const isCurrentValid = currentPassengerData.fullName.trim().length >= 3 && 
                        currentPassengerData.identificationNumber.trim().length >= 6;

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={null}
      size="md"
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
        {/* Header */}
        <Box className={styles.header}>
          <Group justify="space-between" align="center" mb="sm">
            <Group gap="sm">
              <IconUsers size={24} style={{ color: 'var(--reservation-accent)' }} />
              <Title order={3} className={styles.title}>
                Información de pasajeros
              </Title>
            </Group>
            <Badge size="sm" variant="light" color="blue">
              {currentPassenger + 1} de {passengerCount}
            </Badge>
          </Group>
          
          <Progress 
            value={progressValue} 
            size="sm" 
            color="green"
            className={styles.progress}
            mb="md"
          />
          
          <Text size="sm" c="dimmed" ta="center" className={styles.subtitle}>
            Proporciona los datos del pasajero {currentPassenger + 1}
          </Text>
        </Box>

        {/* Current Passenger Form */}
        <Card className={styles.passengerCard} withBorder>
          <Group gap="sm" mb="lg">
            <IconUser size={20} style={{ color: 'var(--reservation-accent)' }} />
            <Text fw={600} className={styles.passengerTitle}>
              Pasajero {currentPassenger + 1}
            </Text>
          </Group>

          <Stack gap="md">
            <TextInput
              label="Nombre completo"
              placeholder="Ejm: Juan Carlos Pérez"
              value={currentPassengerData.fullName}
              onChange={(e) => handlePassengerChange('fullName', e.target.value)}
              leftSection={<IconUser size={16} />}
              className={styles.input}
              required
              error={currentPassengerData.fullName.trim().length > 0 && currentPassengerData.fullName.trim().length < 3 ? 'Mínimo 3 caracteres' : ''}
            />

            <TextInput
              label="Número de identificación"
              placeholder="Ejm: 1234567890"
              value={currentPassengerData.identificationNumber}
              onChange={(e) => handlePassengerChange('identificationNumber', e.target.value)}
              leftSection={<IconId size={16} />}
              className={styles.input}
              required
              error={currentPassengerData.identificationNumber.trim().length > 0 && currentPassengerData.identificationNumber.trim().length < 6 ? 'Mínimo 6 caracteres' : ''}
            />
          </Stack>

          {isCurrentValid && (
            <Box className={styles.validationSuccess}>
              <Text size="sm" c="green" fw={500}>
                ✓ Información válida
              </Text>
            </Box>
          )}
        </Card>

        {/* Passengers Summary */}
        {passengerCount > 1 && (
          <Card className={styles.summaryCard} withBorder>
            <Text size="sm" fw={500} mb="xs" className={styles.summaryTitle}>
              Resumen de pasajeros:
            </Text>
            <Stack gap="xs">
              {passengers.map((passenger, index) => (
                <Group key={index} gap="xs">
                  <Badge 
                    size="xs" 
                    variant={index === currentPassenger ? 'filled' : 'outline'}
                    color={passenger.fullName && passenger.identificationNumber ? 'green' : 'gray'}
                  >
                    {index + 1}
                  </Badge>
                  <Text size="xs" className={styles.summaryText}>
                    {passenger.fullName || `Pasajero ${index + 1}`}
                  </Text>
                </Group>
              ))}
            </Stack>
          </Card>
        )}

        {/* Actions */}
        <Group gap="sm" mt="xl">
          <Button
            variant="outline"
            onClick={handlePrevious}
            leftSection={<IconArrowLeft size={16} />}
            className={styles.backButton}
          >
            {currentPassenger === 0 ? 'Atrás' : 'Anterior'}
          </Button>
          
          <Button
            onClick={handleNext}
            flex={1}
            className={styles.nextButton}
            rightSection={<IconArrowRight size={16} />}
            disabled={!isCurrentValid}
          >
            {currentPassenger === passengerCount - 1 ? 'Continuar' : 'Siguiente'}
          </Button>
        </Group>
      </Box>
    </Modal>
  );
};