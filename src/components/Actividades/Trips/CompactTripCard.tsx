import React, { useState, useEffect } from 'react'
import {
  Group,
  Text,
  Badge,
  Button,
  Modal,
  ActionIcon,
  Tooltip,
  Stack,
} from '@mantine/core'
import {
  IconRoute,
  IconClock,
  IconUsers,
  IconCurrencyDollar,
  IconTrash,
  IconBell,
  IconMessageCircle,
  IconMapPin,
  IconPlayerPlay,
  IconPlayerStop,
  IconArrowRight,
  IconEye,
  IconAlertCircle,
  IconCalendar,
  IconCheck,
  IconX,
} from '@tabler/icons-react'
import { showNotification } from '@mantine/notifications'
import styles from './CompactTripCard.module.css'
import type { Trip } from '../Actividades'
import PassengerSafePointsModal from '../Modals/PassengerSafePointsModal'
import { useNavigate } from '@tanstack/react-router'
import { getTripPassengerCount, startTrip, finishTrip } from '@/services/viajes'

interface CompactTripCardProps {
  trip: Trip
  userId?: string
}

const CompactTripCard: React.FC<CompactTripCardProps> = ({ trip, userId: _userId }) => {
  const [passengerCount, setPassengerCount] = useState(0)
  const [pendingPassengers, setPendingPassengers] = useState(0)
  const [validatedPassengers, setValidatedPassengers] = useState(0)
  const [tripStatus, setTripStatus] = useState(trip.status)
  const [loading, setLoading] = useState(false)
  const [modalAction, setModalAction] = useState<'start' | 'cancel' | 'finish' | null>(null)
  const [errorModal, setErrorModal] = useState<null | { title: string, message: string, color: string }>(null);
  const [showSafePointsModal, setShowSafePointsModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchPassengerCount = async () => {
      const fallbackCount = trip.seats_reserved || 0;
      setPassengerCount(fallbackCount);
      setPendingPassengers(fallbackCount);
      setValidatedPassengers(0);
      
      try {
        const result = await getTripPassengerCount(trip.id);
        if (result.success && result.data) {
          const totalPassengers = result.data.total_passengers || 0;
          const validatedCount = result.data.validated_passengers || 0;
          const pendingCount = result.data.pending_passengers || 0;
          
          setPassengerCount(totalPassengers);
          setPendingPassengers(pendingCount);
          setValidatedPassengers(validatedCount);
        }
      } catch (error) {
        console.warn(`⚠️ Backend passenger count failed for trip ${trip.id}`);
      }
    }
    fetchPassengerCount()
  }, [trip.id, trip.seats_reserved])

  const executeAction = async () => {
    if (!modalAction) return;
    setLoading(true);
    
    try {
      if (modalAction === 'start') {
        const result = await startTrip(trip.id);
        if (result.success) {
          setTripStatus('started');
          showNotification({
            title: '¡Viaje iniciado!',
            message: 'El viaje ha sido marcado como iniciado.',
            color: 'green',
          });
        }
      } else if (modalAction === 'finish') {
        const result = await finishTrip(trip.id);
        if (result.success) {
          setTripStatus('finished');
          showNotification({
            title: '¡Viaje finalizado!',
            message: 'El viaje ha sido marcado como completado.',
            color: 'green',
          });
        }
      } else if (modalAction === 'cancel') {
        setTripStatus('canceled');
        showNotification({
          title: 'Viaje cancelado',
          message: 'El viaje ha sido cancelado.',
          color: 'red',
        });
      }
    } catch (error) {
      console.error(`❌ [CompactTripCard] Error executing action ${modalAction}:`, error);
      
      const err = error as Error;
      setErrorModal({
        title: `Error al ${modalAction === 'start' ? 'Iniciar' : modalAction === 'finish' ? 'Finalizar' : 'Cancelar'} Viaje`,
        message: err.message || 'No se pudo realizar la acción. Por favor, intenta nuevamente.',
        color: 'red'
      });
    } finally {
      setLoading(false);
      setModalAction(null);
    }
  }

  const getStatusIcon = () => {
    switch (tripStatus) {
      case 'finished': return <IconCheck size={12} />;
      case 'started': return <IconPlayerPlay size={12} />;
      case 'canceled': return <IconX size={12} />;
      default: return <IconClock size={12} />;
    }
  }

  const getStatusColor = () => {
    switch (tripStatus) {
      case 'finished': return 'green';
      case 'started': return 'yellow';
      case 'canceled': return 'red';
      default: return 'gray';
    }
  }

  const isProgress = tripStatus === 'started'
  const isFinished = tripStatus === 'finished'
  const isCanceled = tripStatus === 'canceled'
  const totalSeats = Number(trip.seats || 0)

  return (
    <div className={styles.compactCard}>
      {/* Header súper compacto */}
      <div className={styles.compactHeader}>
        <Badge 
          size="xs" 
          color={getStatusColor()} 
          leftSection={getStatusIcon()}
          className={styles.statusBadge}
        >
          {tripStatus === 'finished' ? 'Terminado' : 
           tripStatus === 'started' ? 'En curso' : 
           tripStatus === 'canceled' ? 'Cancelado' : 'Activo'}
        </Badge>
        
        {pendingPassengers > 0 && (
          <Badge size="xs" color="orange" className={styles.alertBadge}>
            <IconBell size={10} />
            {pendingPassengers}
          </Badge>
        )}
        
        <div className={styles.priceChip}>
          <IconCurrencyDollar size={12} />
          <Text size="xs" fw={700}>
            ${trip.pricePerSeat || trip.price_per_seat}
          </Text>
        </div>
      </div>

      {/* Ruta compacta */}
      <div className={styles.routeCompact}>
        <div className={styles.routePoint}>
          <div className={styles.originDot} />
          <Text size="xs" fw={500} lineClamp={1} className={styles.routeText}>
            {trip.origin.address}
          </Text>
        </div>
        
        <div className={styles.routeArrow}>
          <IconArrowRight size={14} />
        </div>
        
        <div className={styles.routePoint}>
          <div className={styles.destDot} />
          <Text size="xs" fw={500} lineClamp={1} className={styles.routeText}>
            {trip.destination.address}
          </Text>
        </div>
      </div>

      {/* Info compacta */}
      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <IconCalendar size={12} />
          <Text size="xs" c="dimmed">
            {trip.date} {trip.time}
          </Text>
        </div>
        
        <div className={styles.infoItem}>
          <IconClock size={12} />
          <Text size="xs" c="dimmed">
            {trip.duration || '30min'}
          </Text>
        </div>
        
        <div className={styles.infoItem}>
          <IconRoute size={12} />
          <Text size="xs" c="dimmed">
            {trip.distance || '15km'}
          </Text>
        </div>
        
        <div className={styles.infoItem}>
          <IconUsers size={12} />
          <Text size="xs" fw={500} color={passengerCount > 0 ? 'green' : 'gray'}>
            {passengerCount}/{totalSeats}
          </Text>
        </div>
      </div>

      {/* Status de pasajeros */}
      {passengerCount > 0 && (
        <div className={styles.passengerStatus}>
          {pendingPassengers > 0 ? (
            <Badge size="xs" color="orange" variant="light">
              <IconAlertCircle size={10} />
              {pendingPassengers} pendiente{pendingPassengers > 1 ? 's' : ''}
            </Badge>
          ) : (
            <Badge size="xs" color="green" variant="light">
              <IconCheck size={10} />
              {validatedPassengers} validado{validatedPassengers > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      )}

      {/* Acciones compactas */}
      <div className={styles.actionsCompact}>
        {/* Botón principal según estado */}
        {!isCanceled && passengerCount > 0 && pendingPassengers > 0 && (
          <Button
            size="xs"
            color="orange"
            fullWidth
            leftSection={<IconBell size={14} />}
            onClick={() => navigate({ to: '/CuposReservados', search: { tripId: trip.id } })}
            className={styles.primaryAction}
          >
            Validar ({pendingPassengers})
          </Button>
        )}
        
        {!isCanceled && passengerCount > 0 && pendingPassengers === 0 && (
          <Button
            size="xs"
            color="green"
            variant="light"
            fullWidth
            leftSection={<IconEye size={14} />}
            onClick={() => navigate({ to: '/CuposReservados', search: { tripId: trip.id } })}
            className={styles.primaryAction}
          >
            Ver Cupos
          </Button>
        )}

        {/* Acciones secundarias */}
        <div className={styles.secondaryActions}>
          {!isFinished && !isCanceled && (
            <>
              {isProgress ? (
                <Tooltip label="Finalizar Viaje">
                  <ActionIcon 
                    size="sm" 
                    color="red" 
                    variant="light"
                    onClick={() => setModalAction('finish')}
                    loading={loading}
                  >
                    <IconPlayerStop size={14} />
                  </ActionIcon>
                </Tooltip>
              ) : (
                <Tooltip label="Iniciar Viaje">
                  <ActionIcon 
                    size="sm" 
                    color="green" 
                    variant="light"
                    onClick={() => setModalAction('start')}
                    loading={loading}
                  >
                    <IconPlayerPlay size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
              
              <Tooltip label="Cancelar Viaje">
                <ActionIcon 
                  size="sm" 
                  color="red" 
                  variant="subtle"
                  onClick={() => setModalAction('cancel')}
                  loading={loading}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
            </>
          )}
          
          {!isCanceled && (
            <>
              <Tooltip label="Ver Puntos">
                <ActionIcon 
                  size="sm" 
                  color="blue" 
                  variant="light"
                  onClick={() => setShowSafePointsModal(true)}
                  disabled={passengerCount === 0}
                >
                  <IconMapPin size={14} />
                </ActionIcon>
              </Tooltip>
              
              <Tooltip label="Chat">
                <ActionIcon 
                  size="sm" 
                  color="cyan" 
                  variant="light"
                  onClick={() => navigate({ to: '/Chat', search: { trip_id: trip.id.toString() } })}
                >
                  <IconMessageCircle size={14} />
                </ActionIcon>
              </Tooltip>
            </>
          )}
        </div>
      </div>

      {/* Modal de confirmación */}
      <Modal opened={modalAction !== null} onClose={() => setModalAction(null)} size="sm" centered>
        <Stack gap="md">
          <Text size="lg" fw={700}>Confirmar Acción</Text>
          <Text size="sm" c="dimmed">
            {modalAction && {
              start: '¿Iniciar este viaje? Cambiará a "En progreso".',
              cancel: '¿Cancelar este viaje? No se puede revertir.',
              finish: '¿Finalizar este viaje? Se marcará como completado.'
            }[modalAction]}
          </Text>
          <Group justify="space-between">
            <Button variant="default" onClick={() => setModalAction(null)} size="xs">
              Cancelar
            </Button>
            <Button color="green" onClick={executeAction} loading={loading} size="xs">
              Confirmar
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal de SafePoints */}
      <PassengerSafePointsModal
        isOpen={showSafePointsModal}
        onClose={() => setShowSafePointsModal(false)}
        tripId={trip.id}
        tripOrigin={trip.origin.address}
        tripDestination={trip.destination.address}
      />

      {/* Modal de Error - Más visible y centrado */}
      <Modal opened={!!errorModal} onClose={() => setErrorModal(null)} size="md" centered>
        <Stack gap="lg">
          <Group gap="sm" align="center">
            <IconX size={24} color={errorModal?.color === 'red' ? '#fa5252' : errorModal?.color === 'orange' ? '#fd7e14' : '#fab005'} />
            <Text size="lg" fw={700} c={errorModal?.color}>{errorModal?.title}</Text>
          </Group>
          <Text size="sm" style={{ lineHeight: 1.6 }}>{errorModal?.message}</Text>
          <Button 
            color={errorModal?.color} 
            onClick={() => setErrorModal(null)} 
            fullWidth 
            size="md"
            style={{ marginTop: '1rem' }}
          >
            Entendido
          </Button>
        </Stack>
      </Modal>
    </div>
  )
}

export default CompactTripCard