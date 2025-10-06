import React, { useState, useEffect } from 'react'
import {
  Group,
  Text,
  Badge,
  Button,
  Modal,
  ActionIcon,
  Stack,
} from '@mantine/core'
import {
  IconRoute2,
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
  IconCalendar,
  IconCheck,
  IconX,
  IconChevronRight,
} from '@tabler/icons-react'
import { showNotification } from '@mantine/notifications'
import styles from './TripCard.module.css'
import type { Trip } from '../Actividades'
import PassengerSafePointsModal from '../Modals/PassengerSafePointsModal'
import { CuposReservadosModal } from '../Bookings'
import { ChatModal } from '@/components/Cupos/Modals'

import { getTripPassengerCount, startTrip, finishTrip } from '@/services/viajes'

interface TripCardProps {
  trip: Trip
  userId?: string
}

const TripCard: React.FC<TripCardProps> = ({ trip, userId: _userId }) => {
  const [passengerCount, setPassengerCount] = useState(0)
  const [pendingPassengers, setPendingPassengers] = useState(0)
  const [tripStatus, setTripStatus] = useState(trip.status)
  const [loading, setLoading] = useState(false)
  const [modalAction, setModalAction] = useState<'start' | 'cancel' | 'finish' | null>(null)
  const [resultModal, setResultModal] = useState<null | { title: string, cobro?: number, devolucion?: number, color: string, message: string }>(null);
  const [errorModal, setErrorModal] = useState<null | { title: string, message: string, color: string }>(null);
  const [showSafePointsModal, setShowSafePointsModal] = useState(false)
  const [showCuposModal, setShowCuposModal] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)

  useEffect(() => {
    const fetchPassengerCount = async () => {
      // Usar seats_reserved como fallback inmediato para total
      const fallbackCount = trip.seats_reserved || 0;
      setPassengerCount(fallbackCount);
      setPendingPassengers(fallbackCount); // Asumir que todos están pendientes inicialmente
      
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
    // Abrir modal de Cupos Reservados
    console.log('🚀 [TripCard] Opening CuposReservados modal for tripId:', trip.id);
    setShowCuposModal(true);
  }
  const handleCloseActionModal = () => setModalAction(null)

  const executeAction = async () => {
    if (!modalAction) return;
    setLoading(true);
    
    try {
      if (modalAction === 'start') {
        console.log(`🚀 [TripCard] Starting trip ${trip.id}`);
        
        // SOLUCIÓN: Validación previa antes de enviar al backend
        console.log(`🔍 [TripCard] Pre-start validation for trip ${trip.id}...`);
        
        // Validación 1: Verificar que el trip tiene la información mínima
        if (!trip.id || !trip.date || !trip.time) {
          throw new Error(`El viaje ${trip.id} no tiene información completa. Actualiza la página e intenta nuevamente.`);
        }
        
        // Validación 2: Verificar que no está ya iniciado
        if (tripStatus === 'started') {
          throw new Error(`El viaje ${trip.id} ya está en progreso.`);
        }
        
        if (tripStatus === 'finished') {
          throw new Error(`El viaje ${trip.id} ya fue completado.`);
        }
        
        if (tripStatus === 'canceled') {
          throw new Error(`El viaje ${trip.id} está cancelado y no se puede iniciar.`);
        }
        
        // Validación 3: Verificar fecha/hora (solo advertencia, no bloquear)
        const tripDateTime = new Date(`${trip.date}T${trip.time}`);
        const now = new Date();
        const timeDiff = tripDateTime.getTime() - now.getTime();
        const minutesDiff = Math.floor(timeDiff / (1000 * 60));
        
        if (minutesDiff > 30) {
          console.warn(`⚠️ [TripCard] Trip ${trip.id} is ${minutesDiff} minutes in the future`);
        } else if (minutesDiff < -60) {
          console.warn(`⚠️ [TripCard] Trip ${trip.id} is ${Math.abs(minutesDiff)} minutes in the past`);
        }
        
        console.log(`✅ [TripCard] Pre-start validation passed for trip ${trip.id}`);
        
        // SOLUCIÓN: Proceder con el inicio del viaje
        const result = await startTrip(trip.id);
        
        if (result.success && result.data) {
          console.log(`✅ [TripCard] Trip ${trip.id} started successfully`);
          
          setTripStatus('started');
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
          
          setTripStatus('finished');
          
          // El backend ahora devuelve balance_summary con información detallada
          const balanceSummary = result.data.balance_summary;
          let modalMessage = result.data.message || 'El viaje se ha finalizado correctamente.';
          
          // Agregar información del balance si hay reembolso
          if (balanceSummary && balanceSummary.refund_processed) {
            modalMessage += ` Se han devuelto $${balanceSummary.refund_amount?.toLocaleString()} correspondientes a ${balanceSummary.seats_not_sold} cupos no vendidos.`;
          }
          
          setResultModal({
            title: 'Viaje Finalizado',
            color: 'green',
            message: modalMessage,
            ...(balanceSummary?.refund_amount && balanceSummary.refund_amount > 0 && {
              devolucion: balanceSummary.refund_amount
            })
          });
          
          showNotification({
            title: '¡Viaje finalizado!',
            message: modalMessage,
            color: 'green',
          });
        } else {
          throw new Error(result.error || 'Error al finalizar el viaje');
        }
      }

      if (modalAction === 'cancel') {
        // Para cancelación, verificar primero si tiene cupos vendidos
        if (Number(trip.seats_reserved || 0) > 0) {
          setErrorModal({
            title: 'Cancelación No Permitida',
            message: 'Este viaje tiene al menos un cupo reservado y no se puede cancelar. Si necesitas ayuda o tienes una emergencia, contacta directamente a soporte.',
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
          
          setTripStatus('canceled');
          
          // Mensaje base de cancelación
          let cancelMessage = 'El viaje ha sido cancelado exitosamente.';
          
          // Si hay información de reembolso, agregarla al mensaje
          if (result.data?.refunded_amount) {
            cancelMessage += ` Se han devuelto $${result.data.refunded_amount.toLocaleString()} de la garantía congelada.`;
          }
          
          setResultModal({
            title: 'Viaje Cancelado',
            color: 'orange',
            message: cancelMessage,
            ...(result.data?.refunded_amount && {
              devolucion: result.data.refunded_amount
            })
          });
          
          showNotification({
            title: 'Viaje cancelado',
            message: cancelMessage,
            color: 'orange',
          });
        } else {
          throw new Error(result.error || 'Error al cancelar el viaje');
        }
      }
    } catch (err) {
      console.error(`❌ [TripCard] Error executing action ${modalAction} for trip ${trip.id}:`, err);
      
      // SOLUCIÓN: Mostrar errores como modales visibles
      const error = err as Error;
      let userFriendlyTitle = 'Error Inesperado';
      let userFriendlyMessage = 'Ocurrió un problema inesperado.';
      let modalColor = 'red';
      
      if (error.message) {
        // Si el mensaje ya es user-friendly (viene de nuestro servicio mejorado), usarlo directamente
        if (error.message.includes('Posibles causas:') || 
            error.message.includes('Por favor,') ||
            error.message.includes('Verifica que')) {
          userFriendlyTitle = `Error al ${modalAction === 'start' ? 'Iniciar' : modalAction === 'finish' ? 'Finalizar' : 'Cancelar'} Viaje`;
          userFriendlyMessage = error.message;
          modalColor = 'orange'; // Color menos alarmante para errores explicativos
        } else if (error.message.includes('sesión ha expirado')) {
          userFriendlyTitle = 'Sesión Expirada';
          userFriendlyMessage = error.message + ' Por favor, vuelve a iniciar sesión.';
          modalColor = 'yellow';
        } else if (error.message.includes('no encontrado')) {
          userFriendlyTitle = 'Viaje No Encontrado';
          userFriendlyMessage = error.message + ' Intenta refrescar la página.';
          modalColor = 'orange';
        } else {
          userFriendlyTitle = `Error al ${modalAction === 'start' ? 'Iniciar' : modalAction === 'finish' ? 'Finalizar' : 'Cancelar'} Viaje`;
          userFriendlyMessage = error.message;
        }
      }
      
      setErrorModal({
        title: userFriendlyTitle,
        message: userFriendlyMessage,
        color: modalColor
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
    <div className={styles.compactTripCard}>
      {/* Header compacto con estado y alertas */}
            <div className={styles.compactHeader}>
        <div className={styles.headerLeft}>
          {/* Estado */}
          <Badge 
            size="xs" 
            color={getStatusColor()} 
            leftSection={getStatusIcon()}
            className={styles.statusBadge}
            data-status={tripStatus}
          >
            {tripStatus === 'finished' ? 'Terminado' : 
             tripStatus === 'started' ? 'En curso' : 
             tripStatus === 'canceled' ? 'Cancelado' : 'Activo'}
          </Badge>
          
          {/* Alerta pasajeros pendientes - solo mostrar número */}
          {pendingPassengers > 0 && (
            <Badge size="xs" color="orange" className={styles.pendingBadge}>
              <IconClock size={8} />
              <span style={{ marginLeft: 4 }}>{pendingPassengers}</span>
            </Badge>
          )}
        </div>
        
        <div className={styles.headerRight}>
          {/* Precio */}
          <div className={styles.priceChip}>
            <IconCurrencyDollar size={12} />
            <Text size="xs" fw={700}>
              ${Number(trip.pricePerSeat || 0).toLocaleString()}
            </Text>
          </div>
        </div>
      </div>

      {/* Ruta súper compacta */}
      <div className={styles.routeSection}>
        <Group gap={6} align="center" style={{ flex: 1 }}>
          <div className={styles.routePoint}>
            <div className={styles.originDot} />
            <Text size="xs" fw={500} lineClamp={1} className={styles.routeText}>
              {trip.origin.address}
            </Text>
          </div>
          
          <IconArrowRight size={12} className={styles.routeArrow} />
          
          <div className={styles.routePoint}>
            <div className={styles.destDot} />
            <Text size="xs" fw={500} lineClamp={1} className={styles.routeText}>
              {trip.destination.address}
            </Text>
          </div>
        </Group>
      </div>

      {/* Info grid compacta */}
      <div className={styles.infoCompact}>
        <Group gap={8} justify="space-between">
          <div className={styles.infoItem}>
            <IconCalendar size={10} />
            <Text size="xs" c="dimmed">
              {trip.date}
            </Text>
          </div>
          
          <div className={styles.infoItem}>
            <IconClock size={10} />
            <Text size="xs" c="dimmed">
              {trip.time}
            </Text>
          </div>
          
          <div className={styles.infoItem}>
            <IconRoute2 size={10} />
            <Text size="xs" c="dimmed">
              {trip.distance || '15km'}
            </Text>
          </div>
          
          <div className={styles.infoItem}>
            <IconUsers size={10} />
            <Text size="xs" fw={500} color={passengerCount > 0 ? 'green' : 'gray'}>
              {passengerCount}/{totalSeats}
            </Text>
          </div>
        </Group>
      </div>

      {/* Status pasajeros compacto - ELIMINADO para evitar duplicación */}

      {/* Botón principal compacto */}
      <div className={styles.primaryActionCompact}>
        {!isCanceled && passengerCount > 0 && pendingPassengers > 0 && (
          <div className={styles.actionButtonContainer}>
            <Button
              size="sm"
              color="orange"
              fullWidth
              leftSection={<IconBell size={14} />}
              rightSection={<IconChevronRight size={14} />}
              onClick={handleCuposClick}
              className={styles.mainActionBtn}
            >
              Validar {pendingPassengers} Pasajero{pendingPassengers > 1 ? 's' : ''}
            </Button>
            <Text size="xs" c="dimmed" ta="center" className={styles.actionLabel}>
              Revisar y confirmar reservas
            </Text>
          </div>
        )}
        
        {!isCanceled && passengerCount > 0 && pendingPassengers === 0 && (
          <div className={styles.actionButtonContainer}>
            <Button
              size="sm"
              color="green"
              variant="light"
              fullWidth
              leftSection={<IconEye size={14} />}
              rightSection={<IconChevronRight size={14} />}
              onClick={handleCuposClick}
              className={styles.mainActionBtn}
            >
              Ver Cupos Validados
            </Button>
            <Text size="xs" c="dimmed" ta="center" className={styles.actionLabel}>
              Consultar pasajeros confirmados
            </Text>
          </div>
        )}

        {!isCanceled && passengerCount === 0 && (
          <div className={styles.actionButtonContainer}>
            <Button
              size="sm"
              color="gray"
              variant="light"
              fullWidth
              leftSection={<IconUsers size={14} />}
              onClick={handleCuposClick}
              disabled
              className={styles.mainActionBtn}
            >
              Sin Reservas
            </Button>
            <Text size="xs" c="dimmed" ta="center" className={styles.actionLabel}>
              No hay pasajeros registrados
            </Text>
          </div>
        )}
      </div>

      {/* Acciones secundarias compactas */}
      <div className={styles.secondaryActionsCompact}>
        <div className={styles.actionGrid}>
          {/* Control de viaje */}
          {!isFinished && !isCanceled && (
            <>
              {isProgress ? (
                <div className={styles.actionButtonContainer}>
                  <ActionIcon 
                    size="lg" 
                    color="red" 
                    variant="light"
                    onClick={() => setModalAction('finish')}
                    loading={loading}
                    className={styles.actionIcon}
                  >
                    <IconPlayerStop size={20} />
                  </ActionIcon>
                  <Text size="xs" c="dimmed" ta="center" className={styles.actionLabel}>
                    Finalizar
                  </Text>
                </div>
              ) : (
                <div className={styles.actionButtonContainer}>
                  <ActionIcon 
                    size="lg" 
                    color="green" 
                    variant="light"
                    onClick={() => setModalAction('start')}
                    loading={loading}
                    className={styles.actionIcon}
                  >
                    <IconPlayerPlay size={20} />
                  </ActionIcon>
                  <Text size="xs" c="dimmed" ta="center" className={styles.actionLabel}>
                    Iniciar
                  </Text>
                </div>
              )}
              
              <div className={styles.actionButtonContainer}>
                <ActionIcon 
                  size="lg" 
                  color="red" 
                  variant="subtle"
                  onClick={() => setModalAction('cancel')}
                  loading={loading}
                  className={styles.actionIcon}
                >
                  <IconTrash size={20} />
                </ActionIcon>
                <Text size="xs" c="dimmed" ta="center" className={styles.actionLabel}>
                  Cancelar
                </Text>
              </div>
            </>
          )}
          
          {/* Herramientas */}
          {!isCanceled && (
            <>
              <div className={styles.actionButtonContainer}>
                <ActionIcon 
                  size="lg" 
                  color="blue" 
                  variant="light"
                  onClick={() => setShowSafePointsModal(true)}
                  disabled={passengerCount === 0}
                  className={styles.actionIcon}
                >
                  <IconMapPin size={20} />
                </ActionIcon>
                <Text size="xs" c="dimmed" ta="center" className={styles.actionLabel}>
                  Puntos
                </Text>
              </div>
              
              <div className={styles.actionButtonContainer}>
                <ActionIcon 
                  size="lg" 
                  color="cyan" 
                  variant="light"
                  onClick={() => setShowChatModal(true)}
                  className={styles.actionIcon}
                >
                  <IconMessageCircle size={20} />
                </ActionIcon>
                <Text size="xs" c="dimmed" ta="center" className={styles.actionLabel}>
                  Chat
                </Text>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modales existentes */}
      <Modal opened={modalAction !== null} onClose={handleCloseActionModal} size="sm" centered>
        <Stack gap="md">
          <Text size="lg" fw={700}>Confirmar Acción</Text>
          <Text size="sm" c="dimmed">
            {modalAction && {
              start: '¿Iniciar este viaje? Cambiará a "En progreso".',
              cancel: '¿Cancelar este viaje? Esta acción no se puede revertir.',
              finish: '¿Finalizar este viaje? Se marcará como completado.'
            }[modalAction]}
          </Text>
          <Group justify="space-between">
            <Button variant="default" onClick={handleCloseActionModal} size="xs">
              Cancelar
            </Button>
            <Button color="green" onClick={executeAction} loading={loading} size="xs">
              Confirmar
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={!!resultModal} onClose={() => setResultModal(null)} size="sm" centered>
        <Stack gap="md">
          <Text size="xl" fw={700} c={resultModal?.color}>{resultModal?.title}</Text>
          {typeof resultModal?.cobro === 'number' && (
            <Text size="sm" c="red">
              <strong>Total cobrado:</strong> ${resultModal.cobro.toLocaleString()}
            </Text>
          )}
          {typeof resultModal?.devolucion === 'number' && (
            <Text size="sm" c="green">
              <strong>Total devuelto:</strong> ${resultModal.devolucion.toLocaleString()}
            </Text>
          )}
          <Text size="sm" c="dimmed">{resultModal?.message}</Text>
          <Button color={resultModal?.color} onClick={() => setResultModal(null)} fullWidth size="xs">
            Aceptar
          </Button>
        </Stack>
      </Modal>

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

      <PassengerSafePointsModal
        isOpen={showSafePointsModal}
        onClose={() => setShowSafePointsModal(false)}
        tripId={trip.id}
        tripOrigin={trip.origin.address}
        tripDestination={trip.destination.address}
      />

      <CuposReservadosModal
        isOpen={showCuposModal}
        onClose={() => setShowCuposModal(false)}
        tripId={trip.id}
      />

      <ChatModal
        opened={showChatModal}
        onClose={() => setShowChatModal(false)}
        tripId={trip.id}
      />
    </div>
  )
}

export default TripCard
