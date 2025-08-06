import React, { useState, useEffect } from 'react'
import {
  Group,
  Text,
  Badge,
  Button,
  Modal,
} from '@mantine/core'
import {
  Navigation,
  Clock,
  Users,
  DollarSign,
  Trash,
  Bell,
  Flag,
  MessageSquare,
} from 'lucide-react'
import { showNotification } from '@mantine/notifications'
import styles from './SrylesComponents/TripCard.module.css'
import type { Trip } from './Actividades'

import { useNavigate } from '@tanstack/react-router'

import { getTripPassengerCount, startTrip, finishTrip } from '@/services/viajes'

interface TripCardProps {
  trip: Trip
  userId?: string
}

const TripCard: React.FC<TripCardProps> = ({ trip, userId: _userId }) => {
  const [passengerCount, setPassengerCount] = useState(0)
  const [pendingPassengers, setPendingPassengers] = useState(0)
  const [validatedPassengers, setValidatedPassengers] = useState(0)
  const [tripStatus, setTripStatus] = useState(trip.status)
  const [loading, setLoading] = useState(false)
  const [modalAction, setModalAction] = useState<'start' | 'cancel' | 'finish' | null>(null)
  const [resultModal, setResultModal] = useState<null | { title: string, cobro?: number, devolucion?: number, color: string, message: string }>(null);
  const navigate = useNavigate()

  useEffect(() => {
    const fetchPassengerCount = async () => {
      // Usar seats_reserved como fallback inmediato para total
      const fallbackCount = trip.seats_reserved || 0;
      setPassengerCount(fallbackCount);
      setPendingPassengers(fallbackCount); // Asumir que todos están pendientes inicialmente
      setValidatedPassengers(0);
      
      // Intentar obtener datos más precisos del backend (sin bloquear la UI)
      try {
        const result = await getTripPassengerCount(trip.id);
        if (result.success && result.data) {
          // Actualizar con datos reales del backend
          const totalPassengers = result.data.total_passengers || 0;
          const validatedCount = result.data.validated_passengers || 0;
          const pendingCount = result.data.pending_passengers || 0;
          
          setPassengerCount(totalPassengers);
          setPendingPassengers(pendingCount);
          setValidatedPassengers(validatedCount);
          
          console.log(`✅ [TripCard] Updated passenger stats for trip ${trip.id}:`, {
            total: totalPassengers,
            pending: pendingCount,
            validated: validatedCount,
            hasPendingPassengers: pendingCount > 0
          });
        }
      } catch (error) {
        // Error silencioso - mantener el fallback
        console.warn(`⚠️ [TripCard] Backend passenger count failed for trip ${trip.id}, keeping fallback: ${fallbackCount}`, error);
      }
    }

    fetchPassengerCount()
  }, [trip.id, trip.seats_reserved])

  const handleCuposClick = () => {
    // Navegar a la página de Cupos Reservados con el tripId como parámetro
    console.log('🚀 [TripCard] Navigating to CuposReservados with tripId:', trip.id);
    navigate({
      to: '/CuposReservados',
      search: { tripId: trip.id }
    });
  }
  const handleCloseActionModal = () => setModalAction(null)

  const executeAction = async () => {
    if (!modalAction) return;
    setLoading(true);
    
    try {
      if (modalAction === 'start') {
        console.log(`🚀 [TripCard] Starting trip ${trip.id}`);
        
        const result = await startTrip(trip.id);
        
        if (result.success && result.data) {
          console.log(`✅ [TripCard] Trip ${trip.id} started successfully`);
          
          setTripStatus('in_progress');
          setResultModal({
            title: 'Viaje Iniciado',
            color: 'green',
            message: result.data.message || 'El viaje se ha iniciado exitosamente.'
          });
          
          showNotification({
            title: '¡Viaje iniciado!',
            message: result.data.message || 'El viaje se ha iniciado exitosamente.',
            color: 'green',
          });
        } else {
          throw new Error(result.error || 'Error al iniciar el viaje');
        }
      }

      if (modalAction === 'finish') {
        console.log(`🏁 [TripCard] Finishing trip ${trip.id}`);
        
        const result = await finishTrip(trip.id);
        
        if (result.success && result.data) {
          console.log(`✅ [TripCard] Trip ${trip.id} finished successfully`);
          
          setTripStatus('completed');
          setResultModal({
            title: 'Viaje Finalizado',
            color: 'green',
            message: result.data.message || 'El viaje se ha finalizado correctamente.',
            ...(result.data.unfrozen_amount && {
              devolucion: result.data.unfrozen_amount
            })
          });
          
          showNotification({
            title: '¡Viaje finalizado!',
            message: result.data.message || 'El viaje se ha finalizado correctamente.',
            color: 'green',
          });
        } else {
          throw new Error(result.error || 'Error al finalizar el viaje');
        }
      }

      if (modalAction === 'cancel') {
        // Para cancelación, verificar primero si tiene cupos vendidos
        if (Number(trip.seats_reserved || 0) > 0) {
          showNotification({
            title: 'Cancelación no permitida',
            message: 'Este viaje tiene al menos un cupo pagado. Si necesitas ayuda, contacta a soporte.',
            color: 'red'
          });
          return;
        }

        console.log(`❌ [TripCard] Canceling trip ${trip.id}`);
        
        // Usar el endpoint de cancelación de viajes existente
        const { cancelTrip } = await import('@/services/viajes');
        const result = await cancelTrip(trip.id);
        
        if (result.success) {
          console.log(`✅ [TripCard] Trip ${trip.id} canceled successfully`);
          
          setTripStatus('cancelled');
          setResultModal({
            title: 'Viaje Cancelado',
            color: 'orange',
            message: 'El viaje ha sido cancelado exitosamente.'
          });
          
          showNotification({
            title: 'Viaje cancelado',
            message: 'El viaje ha sido cancelado exitosamente.',
            color: 'orange',
          });
        } else {
          throw new Error(result.error || 'Error al cancelar el viaje');
        }
      }
    } catch (err) {
      console.error(`❌ [TripCard] Error executing action ${modalAction} for trip ${trip.id}:`, err);
      
      showNotification({
        title: 'Error',
        message: (err as Error).message || 'Ocurrió un problema inesperado.',
        color: 'red',
      });
    } finally {
      setLoading(false);
      setModalAction(null);
    }
  }

  const isProgress = tripStatus === 'in_progress'
  const isFinished = tripStatus === 'completed' 
  const isCanceled = tripStatus === 'cancelled'
  const totalSeats = Number(trip.seats || 0) + parseFloat(trip.seats_reserved as unknown as string || '0')

  return (
    <div key={trip.id} className={`${styles.tripCard} ${pendingPassengers > 0 ? styles.tripCardWithPassengers : ''}`}>
      {/* Indicador de pasajeros en espera - Solo mostrar si hay pendientes */}
      {pendingPassengers > 0 && (
        <div className={styles.passengerAlert}>
          <Bell size={16} />
          <Text size="sm" fw={700}>
            {pendingPassengers} pasajero{pendingPassengers > 1 ? 's' : ''} esperando validación
          </Text>
        </div>
      )}
      
      <div className={styles.tripHeader}>
        <Badge
          color={isFinished ? 'green' : isProgress ? 'yellow' : isCanceled ? 'red' : 'gray'}
          className={styles.tripBadge}
        >
          {isFinished ? 'Finalizado' : isProgress ? 'En progreso' : isCanceled ? 'Cancelado' : 'Pendiente'}
        </Badge>
      </div>

      <div>
        <Text className={styles.tripTitle}>Origen</Text>
        <Text className={styles.tripText}>{trip.origin.address}</Text>
        <Text className={styles.tripTitle}>Destino</Text>
        <Text className={styles.tripText}>{trip.destination.address}</Text>
      </div>

      <Badge color="blue" className={styles.tripBadge}>
        {trip.date} {trip.time}
      </Badge>

      <Group gap="sm" className={styles.tripInfoGroup}>
        <Badge leftSection={<Clock size={14} />}>{trip.duration || '30 min'}</Badge>
        <Badge leftSection={<Navigation size={14} />}>{trip.distance || '15 km'}</Badge>
        <Badge leftSection={<Users size={14} />}>{totalSeats} Cupos</Badge>
        <Badge leftSection={<DollarSign size={14} />}>{trip.pricePerSeat || trip.price_per_seat} COP/Cupo</Badge>
      </Group>

      {/* Información destacada de cupos comprados */}
      <div className={styles.cuposStatus}>
        <Group justify="space-between" align="center" className={styles.cuposInfo}>
          <div>
            <Text size="sm" color="dimmed" className={styles.cuposLabel}>
              Cupos Vendidos:
            </Text>
            <Text size="lg" fw={700} className={styles.cuposCount} 
                  color={passengerCount > 0 ? 'green' : 'gray'}>
              {passengerCount} / {trip.seats}
            </Text>
            {validatedPassengers > 0 && (
              <Text size="xs" color="green" className={styles.validatedText}>
                ✅ {validatedPassengers} validado{validatedPassengers > 1 ? 's' : ''}
              </Text>
            )}
          </div>
          
          {pendingPassengers > 0 ? (
            <Badge 
              color="orange" 
              size="lg" 
              variant="filled"
              className={styles.cuposBadge}
            >
              ⏳ {pendingPassengers} pendiente{pendingPassengers !== 1 ? 's' : ''}
            </Badge>
          ) : validatedPassengers > 0 ? (
            <Badge 
              color="green" 
              size="lg" 
              variant="filled"
              className={styles.cuposBadge}
            >
              ✅ {validatedPassengers} validado{validatedPassengers > 1 ? 's' : ''}
            </Badge>
          ) : passengerCount > 0 ? (
            <Badge 
              color="blue" 
              size="lg" 
              variant="filled"
              className={styles.cuposBadge}
            >
              👥 {passengerCount} registrado{passengerCount > 1 ? 's' : ''}
            </Badge>
          ) : (
            <Badge 
              color="gray" 
              size="lg" 
              variant="outline"
              className={styles.cuposBadge}
            >
              Sin reservas aún
            </Badge>
          )}
        </Group>
        
        {pendingPassengers > 0 && (
          <Text size="xs" color="orange" className={styles.actionHint}>
            👆 Haz clic en "Validar Pasajeros" para validar cupos pendientes
          </Text>
        )}
        
        {validatedPassengers > 0 && pendingPassengers === 0 && (
          <Text size="xs" color="green" className={styles.actionHint}>
            ✅ Todos los pasajeros han sido validados exitosamente
          </Text>
        )}
      </div>

      <Text size="sm" color="dimmed" className={styles.tripSummary}>
        {trip.description || 'Sin descripción'}
      </Text>

      <Group gap="sm" className={styles.tripActions}>
        {!isCanceled && passengerCount > 0 && pendingPassengers > 0 && (
          <Button
            size="md"
            variant="filled"
            color="orange"
            onClick={handleCuposClick}
            leftSection={<Bell size={16} />}
            rightSection={(
              <Badge 
                color="yellow" 
                size="sm"
                style={{ 
                  animation: 'pulse 2s infinite',
                  fontWeight: 'bold'
                }}
              >
                {pendingPassengers}
              </Badge>
            )}
            className={styles.cuposButtonActive}
          >
            🎫 Validar {pendingPassengers} Pasajero{pendingPassengers > 1 ? 's' : ''}
          </Button>
        )}
        
        {!isCanceled && passengerCount > 0 && pendingPassengers === 0 && (
          <Button
            size="sm"
            variant="outline"
            color="green"
            onClick={handleCuposClick}
            leftSection={<Bell size={16} />}
          >
            ✅ Ver Cupos Validados
          </Button>
        )}
        
        {!isCanceled && passengerCount === 0 && (
          <Button
            size="sm"
            variant="outline"
            color="blue"
            onClick={handleCuposClick}
            leftSection={<Bell size={16} />}
            disabled
          >
            Ver Cupos
          </Button>
        )}

        {!isFinished && !isCanceled && (
          <>
            {isProgress ? (
              <Button size="sm" variant="filled" color="red" onClick={() => setModalAction('finish')} leftSection={<Flag size={14} />} loading={loading}>Finalizar Viaje</Button>
            ) : (
              <Button size="sm" variant="outline" color="green" onClick={() => setModalAction('start')} loading={loading}>Iniciar Viaje</Button>
            )}
            <Button size="sm" variant="filled" color="red" onClick={() => setModalAction('cancel')} leftSection={<Trash size={14} />} loading={loading}>Cancelar Viaje</Button>
          </>
        )}

        {!isCanceled && (
          <Button
            size="sm"
            variant="outline"
            color="gray"
            onClick={() => navigate({ to: '/Chat', search: { trip_id: trip.id.toString() } })}
            leftSection={<MessageSquare size={14} />}
          >
            Ir al Chat
          </Button>
        )}
      </Group>

      <Modal opened={modalAction !== null} onClose={handleCloseActionModal} size="lg" centered>
        <Text size="lg" fw={700} mb="md">Confirmar Acción</Text>
        <Text mb="xl">{modalAction && {
          start: '¿Estás seguro de que deseas iniciar este viaje? Se cobrará por los cupos publicados y se devolverá lo no vendido.',
          cancel: '¿Deseas cancelar este viaje? Se devolverá el saldo congelado a tu wallet.',
          finish: '¿Finalizar este viaje? Marcará el viaje como completado y no se podrá revertir.'
        }[modalAction]}</Text>
        <Group justify="space-between">
          <Button variant="default" onClick={handleCloseActionModal}>Cancelar</Button>
          <Button color="green" onClick={executeAction} loading={loading}>Confirmar</Button>
        </Group>
      </Modal>

      <Modal opened={!!resultModal} onClose={() => setResultModal(null)} size="lg" centered>
        <div className={styles.resultModalBox}>
          <Text size="xl" fw={700} mb="md" color={resultModal?.color}>{resultModal?.title}</Text>
          {typeof resultModal?.cobro === 'number' && (
            <Text size="md" color="red" mb={4}>
              <b>Total cobrado:</b> {resultModal.cobro.toLocaleString()} COP
            </Text>
          )}
          {typeof resultModal?.devolucion === 'number' && (
            <Text size="md" color="green" mb={4}>
              <b>Total devuelto:</b> {resultModal.devolucion.toLocaleString()} COP
            </Text>
          )}
          <Text size="md" color="dimmed" mt="md">{resultModal?.message}</Text>
          <Button mt="xl" color={resultModal?.color} onClick={() => setResultModal(null)} fullWidth>Aceptar</Button>
        </div>
      </Modal>
    </div>
  )
}

export default TripCard
