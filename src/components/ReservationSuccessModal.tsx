import React from 'react';
import { Modal, Text, Button, Group, Card, Avatar, Badge, Stack, Divider } from '@mantine/core';
import { IconCheck, IconCash, IconCreditCard, IconPhone, IconCar, IconCalendar, IconMapPin, IconUsers } from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { TripSearchResult } from '@/services/trips';
import styles from './ReservationSuccessModal.module.css';

interface ReservationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripSearchResult;
  passengers: number;
  totalPrice: number;
  onConfirm: () => void;
  isConfirming?: boolean;
}

const ReservationSuccessModal: React.FC<ReservationSuccessModalProps> = ({
  isOpen,
  onClose,
  trip,
  passengers,
  totalPrice,
  onConfirm,
  isConfirming = false
}) => {
  const handleConfirm = async () => {
    await onConfirm();
    // El onConfirm debería manejar la navegación al home
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <Group>
          <div className={styles.successIcon}>
            <IconCheck size={24} />
          </div>
          <Text size="xl" fw={700} c="green">
            ¡Reserva Exitosa!
          </Text>
        </Group>
      }
      size="md"
      centered
      overlayProps={{
        color: '#000',
        opacity: 0.7,
        blur: 4,
      }}
      classNames={{
        root: styles.modalRoot,
        content: styles.modalContent,
        header: styles.modalHeader,
        body: styles.modalBody,
      }}
      closeButtonProps={{
        size: 'lg',
        color: 'gray'
      }}
    >
      <Stack gap="lg">
        {/* Mensaje de éxito */}
        <Card className={styles.successCard} p="lg" radius="md">
          <Text size="lg" ta="center" fw={600} c="green" mb="sm">
            🎉 Tu reserva ha sido procesada exitosamente
          </Text>
          <Text size="sm" ta="center" c="dimmed">
            Ya puedes coordinar los detalles del viaje con el conductor
          </Text>
        </Card>

        {/* Detalles del viaje */}
        <Card className={styles.tripCard} p="lg" radius="md">
          <Group mb="md">
            <Avatar 
              src={trip.photo} 
              size={50} 
              radius="md"
              className={styles.driverAvatar}
            />
            <div style={{ flex: 1 }}>
              <Text fw={600} size="md">{trip.driverName}</Text>
              <Group gap="xs">
                <IconCar size={16} />
                <Text size="sm" c="dimmed">
                  {trip.vehicle?.brand} {trip.vehicle?.model} - {trip.vehicle?.plate}
                </Text>
              </Group>
            </div>
            {trip.rating && (
              <Badge color="yellow" variant="light">
                ⭐ {trip.rating.toFixed(1)}
              </Badge>
            )}
          </Group>

          <Stack gap="sm">
            <Group>
              <IconMapPin size={16} color="green" />
              <Text size="sm" fw={500}>Origen:</Text>
              <Text size="sm" c="dimmed" style={{ flex: 1 }}>{trip.origin}</Text>
            </Group>
            
            <Group>
              <IconMapPin size={16} color="red" />
              <Text size="sm" fw={500}>Destino:</Text>
              <Text size="sm" c="dimmed" style={{ flex: 1 }}>{trip.destination}</Text>
            </Group>

            <Group>
              <IconCalendar size={16} color="blue" />
              <Text size="sm" fw={500}>Fecha:</Text>
              <Text size="sm" c="dimmed">
                {dayjs(trip.dateTime).format('DD/MM/YYYY - HH:mm')}
              </Text>
            </Group>

            <Group>
              <IconUsers size={16} color="purple" />
              <Text size="sm" fw={500}>Pasajeros:</Text>
              <Text size="sm" c="dimmed">{passengers}</Text>
            </Group>
          </Stack>

          <Divider my="md" />

          <Group justify="space-between">
            <Text fw={600} size="lg">Total a pagar:</Text>
            <Text fw={700} size="xl" c="green">
              ${totalPrice.toLocaleString('es-CO')} COP
            </Text>
          </Group>
        </Card>

        {/* Instrucciones de pago */}
        <Card className={styles.paymentCard} p="lg" radius="md">
          <Group mb="md">
            <IconCash size={24} color="orange" />
            <Text fw={600} size="lg" c="orange">
              Instrucciones de Pago
            </Text>
          </Group>

          <Stack gap="md">
            <Text size="sm" c="dimmed" ta="center">
              El pago se realiza directamente al conductor al momento del viaje
            </Text>

            <div className={styles.paymentMethods}>
              <Group justify="center" gap="lg">
                <div className={styles.paymentMethod}>
                  <IconCash size={32} />
                  <Text size="xs" ta="center" mt="xs">Efectivo</Text>
                </div>
                <div className={styles.paymentMethod}>
                  <IconCreditCard size={32} />
                  <Text size="xs" ta="center" mt="xs">Transferencia</Text>
                </div>
                <div className={styles.paymentMethod}>
                  <IconPhone size={32} />
                  <Text size="xs" ta="center" mt="xs">Nequi/Daviplata</Text>
                </div>
              </Group>
            </div>

            <Card className={styles.paymentNote} p="md" radius="sm">
              <Text size="sm" fw={500} mb="xs" c="orange">
                💡 Importante:
              </Text>
              <Text size="xs" c="dimmed">
                • Coordina el método de pago con el conductor antes del viaje<br/>
                • Ten el dinero exacto o confirma si acepta transferencias<br/>
                • El conductor definirá sus métodos de pago preferidos
              </Text>
            </Card>
          </Stack>
        </Card>

        {/* Botones de acción */}
        <Group justify="space-between" mt="lg">
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isConfirming}
            className={styles.cancelButton}
          >
            Cancelar
          </Button>
          
          <Button
            size="md"
            onClick={handleConfirm}
            loading={isConfirming}
            className={styles.confirmButton}
          >
            {isConfirming ? 'Confirmando...' : 'Confirmar Reserva'}
          </Button>
        </Group>

        <Text size="xs" ta="center" c="dimmed" mt="sm">
          Al confirmar aceptas los términos y condiciones del servicio
        </Text>
      </Stack>
    </Modal>
  );
};

export default ReservationSuccessModal;
