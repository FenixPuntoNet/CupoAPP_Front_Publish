import React from 'react';
import {
  Card,
  Group,
  Text,
  Badge,
  Button,
  Avatar,
  Stack,
  Box,
} from '@mantine/core';
import {
  IconCalendar,
  IconUsers,
  IconStar,
  IconQrcode,
  IconMessage,
  IconEye,
} from '@tabler/icons-react';
import { useNavigate } from '@tanstack/react-router';
import { showNotification } from '@mantine/notifications';
import dayjs from 'dayjs';
import styles from './CupoCard.module.css';

type PassengerLite = {
  passenger_id: number;
  full_name: string;
  identification_number: string;
};

type BookingConductor = {
  booking_id: number;
  booking_date: string | null;
  booking_status: string | null;
  total_price: number;
  trip_id: number;
  user_id: string;
  seats_booked: number;
  booking_qr: string;
  driver_id: string;
  driver_name: string;
  passengers: PassengerLite[];
};

interface CupoCardProps {
  booking: BookingConductor;
  onRating?: (tripId: number, driverId: string) => void;
  onViewTicket?: (bookingId: number) => void;
  onViewDetails?: (bookingId: number) => void;
  onChat?: (tripId: number) => void;
}

const CupoCard: React.FC<CupoCardProps> = ({ booking, onRating, onViewTicket, onViewDetails, onChat }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'confirmed':
        return 'blue';
      case 'pending':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'completed':
        return 'Completado ✓';
      case 'confirmed':
        return 'Confirmado';
      case 'pending':
        return 'Pendiente';
      default:
        return status || 'Desconocido';
    }
  };

  return (
    <Card className={styles.cupoCard}>
      {/* Header con precio y estado */}
      <Group justify="space-between" align="flex-start" mb="sm">
        <div>
          <Text size="sm" c="dimmed" mb={2}>
            Reserva #{booking.booking_id}
          </Text>
          <Badge
            color={getStatusColor(booking.booking_status)}
            variant="light"
            size="sm"
          >
            {getStatusText(booking.booking_status)}
          </Badge>
        </div>
        <div className={styles.priceSection}>
          <Text size="lg" fw={700} className={styles.priceText}>
            ${booking.total_price.toLocaleString()}
          </Text>
          <Text size="xs" c="dimmed">
            Total pagado
          </Text>
        </div>
      </Group>

      {/* Fecha de reserva */}
      <Group align="center" gap="xs" mb="sm">
        <IconCalendar size={14} className={styles.icon} />
        <Text size="sm" c="dimmed">
          Reservado el {dayjs(booking.booking_date).format('DD/MM/YYYY HH:mm')}
        </Text>
      </Group>

      {/* Pasajeros y asientos */}
      <Group align="center" gap="xs" mb="sm">
        <IconUsers size={14} className={styles.icon} />
        <Text size="sm">
          <Text component="span" fw={500} c="bright">
            {booking.seats_booked}
          </Text>
          <Text component="span" c="dimmed">
            {' '}
            {booking.seats_booked === 1 ? 'asiento reservado' : 'asientos reservados'}
          </Text>
        </Text>
      </Group>

      {/* Conductor */}
      <Group align="center" gap="sm" mb="sm" className={styles.driverSection}>
        <Avatar size={36} radius="md" className={styles.driverAvatar}>
          <IconUsers size={20} />
        </Avatar>
        <div style={{ flex: 1 }}>
          <Text size="sm" fw={500} lineClamp={1}>
            {booking.driver_name || 'Conductor no disponible'}
          </Text>
          <Text size="xs" c="dimmed">
            Conductor del viaje
          </Text>
        </div>
      </Group>

      {/* Pasajeros registrados */}
      {booking.passengers && booking.passengers.length > 0 && (
        <Box mb="sm" className={styles.passengersSection}>
          <Text size="xs" c="dimmed" mb={4}>
            Pasajeros registrados:
          </Text>
          <Stack gap={2}>
            {booking.passengers.map((passenger, index) => (
              <Text key={passenger.passenger_id} size="xs" c="bright">
                {index + 1}. {passenger.full_name}
              </Text>
            ))}
          </Stack>
        </Box>
      )}

      {/* Botones de acción */}
      <Group gap="xs" justify="space-between" className={styles.actionsGroup}>
        <Button
          size="xs"
          variant="light"
          color="blue"
          leftSection={<IconEye size={14} />}
          onClick={() => {
            if (onViewDetails) {
              console.log('🔍 [CupoCard] Opening modal for booking details:', booking.booking_id);
              onViewDetails(booking.booking_id);
            } else {
              console.log('🔍 [CupoCard] Navigating to ViewBookingDetails:', booking.booking_id);
              navigate({
                to: '/Cupos/ViewBookingDetails',
                search: { booking_id: booking.booking_id.toString() },
              });
            }
          }}
          className={styles.actionButton}
        >
          Ver Detalles
        </Button>

        <Button
          size="xs"
          variant="light"
          color="green"
          leftSection={<IconQrcode size={14} />}
          onClick={() => {
            if (onViewTicket) {
              console.log('🎫 [CupoCard] Opening modal for ticket:', booking.booking_id);
              onViewTicket(booking.booking_id);
            } else {
              console.log('🎫 [CupoCard] Navigating to ViewTicket:', booking.booking_id);
              navigate({
                to: '/Cupos/ViewTicket',
                search: { booking_id: booking.booking_id.toString() },
              });
            }
          }}
          className={styles.actionButton}
        >
          Ticket
        </Button>

        <Button
          size="xs"
          variant="light"
          color="cyan"
          leftSection={<IconMessage size={14} />}
          onClick={() => {
            if (!booking.trip_id || booking.trip_id === 0) {
              showNotification({
                title: 'Error',
                message: 'No se encontró información del viaje para acceder al chat.',
                color: 'red',
              });
              return;
            }
            
            if (onChat) {
              onChat(booking.trip_id);
            } else {
              // Fallback: navigate solo si no hay callback onChat
              navigate({
                to: '/Chat',
                search: { trip_id: booking.trip_id.toString() },
              });
            }
          }}
          className={styles.actionButton}
        >
          Chat
        </Button>

        {booking.booking_status === 'completed' && onRating && (
          <Button
            size="xs"
            variant="light"
            color="yellow"
            leftSection={<IconStar size={14} />}
            onClick={() => {
              if (booking.trip_id && booking.trip_id !== 0 && booking.driver_id && booking.driver_id !== 'unknown') {
                onRating(booking.trip_id, booking.driver_id);
              } else {
                showNotification({
                  title: 'No disponible',
                  message: 'No se puede calificar este viaje porque faltan datos del conductor.',
                  color: 'yellow',
                });
              }
            }}
            disabled={booking.driver_id === 'unknown'}
            className={styles.actionButton}
          >
            Calificar
          </Button>
        )}
      </Group>
    </Card>
  );
};

export default CupoCard;