import React from 'react';
import {
  Modal,
  Text,
  Button,
  Group,
  Box,
  Card,
  Avatar,
  Title
} from '@mantine/core';
import { 
  IconCheck
} from '@tabler/icons-react';
import { useNavigate } from '@tanstack/react-router';
import dayjs from 'dayjs';
import type { TripSearchResult } from '@/services/trips';
import styles from './ReservationSuccessModal.module.css';

interface ReservationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripSearchResult;
  passengers: number;
  totalPrice: number;
  onConfirm: () => void | Promise<void>;
  isConfirming?: boolean;
  bookingResult?: any;
}

const ReservationSuccessModal: React.FC<ReservationSuccessModalProps> = ({
  isOpen,
  onClose,
  trip,
  passengers,
  totalPrice,
  onConfirm,
  isConfirming = false,
  bookingResult
}) => {
  const navigate = useNavigate();

  const handleConfirm = async () => {
    if (typeof onConfirm === 'function') {
      await onConfirm();
    }
  };

  const handleViewTicket = () => {
    if (bookingResult?.booking?.id) {
      onClose();
      navigate({
        to: '/Cupos/ViewTicket',
        search: { booking_id: bookingResult.booking.id.toString() }
      });
    }
  };

  const handleGoToActivities = () => {
    onClose();
    navigate({ to: '/Cupos' });
  };

  const handleGoToHome = () => {
    onClose();
    navigate({ to: '/' });
  };

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
        {/* Header compacto original */}
        <div style={{
          background: 'var(--reservation-card-bg)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '12px',
          textAlign: 'center',
          border: '1px solid var(--reservation-border)'
        }}>
          <Group justify="center" gap="sm">
            <IconCheck size={20} style={{ color: 'var(--reservation-accent)' }} />
            <Title order={4} style={{ 
              color: 'var(--reservation-text)', 
              fontWeight: 600, 
              margin: 0 
            }}>
              {bookingResult ? '¡Reserva Confirmada!' : '¿Confirmar Reserva?'}
            </Title>
          </Group>
        </div>

        {/* Botones superiores - Ver Ticket y Ver Detalles */}
        {bookingResult && (
          <Group gap="xs" mb="md">
            <Button
              onClick={handleViewTicket}
              size="sm"
              flex={1}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 600,
                height: '36px',
                boxShadow: '0 3px 8px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 5px 12px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 3px 8px rgba(102, 126, 234, 0.3)';
              }}
            >
              🎫 Ver Ticket
            </Button>
            
            <Button
              size="sm"
              flex={1}
              style={{
                background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 600,
                height: '36px',
                boxShadow: '0 3px 8px rgba(255, 107, 107, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 5px 12px rgba(255, 107, 107, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 3px 8px rgba(255, 107, 107, 0.3)';
              }}
              onClick={() => {
                if (bookingResult?.booking?.id) {
                  onClose();
                  navigate({
                    to: '/Cupos/ViewBookingDetails',
                    search: { booking_id: bookingResult.booking.id.toString() }
                  });
                } else {
                  // Si no hay booking result, mostrar detalles del trip
                  console.log('Ver detalles del viaje:', trip);
                }
              }}
            >
              🔍 Ver Detalles
            </Button>
          </Group>
        )}

        {/* Trip Info compacto original */}
        <Card 
          className={styles.tripCard} 
          withBorder
          style={{
            background: 'var(--reservation-card-bg)',
            border: '1px solid var(--reservation-border)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '10px'
          }}
        >
          {/* Driver Info */}
          <Group gap="sm" mb="sm">
            <Avatar 
              src={trip.photo} 
              size={36} 
              radius="md"
              style={{
                border: '1px solid var(--reservation-border)'
              }}
            />
            <div style={{ flex: 1 }}>
              <Text fw={600} size="sm" style={{ color: 'var(--reservation-text)' }}>
                {trip.driverName}
              </Text>
              <Text size="xs" style={{ color: 'var(--reservation-text-secondary)' }}>
                🚗 {trip.vehicle?.brand} {trip.vehicle?.model}
              </Text>
            </div>
            {trip.rating && (
              <div style={{
                background: 'var(--reservation-card-bg)',
                border: '1px solid var(--reservation-border)',
                borderRadius: '6px',
                padding: '4px 8px'
              }}>
                <Text size="xs" fw={500} style={{ color: 'var(--reservation-text)' }}>
                  ⭐ {trip.rating.toFixed(1)}
                </Text>
              </div>
            )}
          </Group>

          {/* Ruta simple */}
          <div style={{
            background: 'var(--reservation-card-bg)',
            border: '1px solid var(--reservation-border)',
            borderRadius: '6px',
            padding: '8px',
            marginBottom: '10px'
          }}>
            <Group gap="xs" align="center">
              <Text size="xs" fw={500} style={{ color: 'var(--reservation-text)' }} truncate>
                {trip.origin}
              </Text>
              <Text size="xs" style={{ color: 'var(--reservation-accent)' }}>→</Text>
              <Text size="xs" fw={500} style={{ color: 'var(--reservation-text)' }} truncate>
                {trip.destination}
              </Text>
            </Group>
          </div>

          {/* Info adicional */}
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <Text size="xs" style={{ color: 'var(--reservation-text-secondary)' }}>
                📅 {dayjs(trip.dateTime).format('DD/MM HH:mm')}
              </Text>
              <Text size="xs" style={{ color: 'var(--reservation-text-secondary)' }}>
                👥 {passengers} pax
              </Text>
            </Group>
            
            <div style={{
              background: 'var(--reservation-accent)',
              borderRadius: '6px',
              padding: '4px 8px'
            }}>
              <Text size="xs" fw={600} style={{ color: 'white' }}>
                ${totalPrice.toLocaleString()}
              </Text>
            </div>
          </Group>
        </Card>

        {/* Información de pago compacta */}
        <Card 
          className={styles.paymentCard} 
          withBorder
          style={{
            background: 'var(--reservation-card-bg)',
            border: '1px solid var(--reservation-border)',
            borderRadius: '8px',
            padding: '10px',
            marginBottom: '10px'
          }}
        >
          <Group align="center" gap="sm">
            <Text size="sm">💰</Text>
            <div style={{ flex: 1 }}>
              <Text size="sm" fw={500} style={{ color: 'var(--reservation-text)' }}>
                Pago al conductor
              </Text>
              <Text size="xs" style={{ color: 'var(--reservation-text-secondary)' }}>
                Efectivo • Nequi • Transferencia
              </Text>
            </div>
          </Group>
        </Card>

        {/* Botones inferiores - Actividades e Ir a Inicio */}
        {bookingResult ? (
          <Group gap="xs" mt="sm">
            <Button
              onClick={handleGoToActivities}
              size="sm"
              flex={1}
              style={{
                background: 'linear-gradient(135deg, #00FF9D 0%, #00D4AA 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 600,
                height: '36px',
                boxShadow: '0 3px 8px rgba(0, 255, 157, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 5px 12px rgba(0, 255, 157, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 255, 157, 0.3)';
              }}
            >
              📋 Actividades
            </Button>
            
            <Button
              onClick={handleGoToHome}
              size="sm"
              flex={1}
              style={{
                background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 600,
                height: '36px',
                boxShadow: '0 3px 8px rgba(78, 205, 196, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 5px 12px rgba(78, 205, 196, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 3px 8px rgba(78, 205, 196, 0.3)';
              }}
            >
              🏠 Ir al Inicio
            </Button>
          </Group>
        ) : (
          <Group gap="xs" mt="sm">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isConfirming}
              size="sm"
              style={{
                borderColor: 'var(--reservation-border)',
                color: 'var(--reservation-text-secondary)',
                borderRadius: '8px',
                height: '36px'
              }}
            >
              Cancelar
            </Button>
            
            <Button
              onClick={handleConfirm}
              loading={isConfirming}
              flex={1}
              size="sm"
              style={{
                background: 'linear-gradient(135deg, #00FF9D 0%, #00D4AA 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 600,
                height: '36px',
                boxShadow: '0 3px 8px rgba(0, 255, 157, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isConfirming) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 5px 12px rgba(0, 255, 157, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isConfirming) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 255, 157, 0.3)';
                }
              }}
            >
              {isConfirming ? 'Procesando...' : 'Confirmar Reserva'}
            </Button>
          </Group>
        )}


      </Box>
    </Modal>
  );
};

export default ReservationSuccessModal;
