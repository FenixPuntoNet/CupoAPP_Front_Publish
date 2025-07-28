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
import { supabase } from '@/lib/supabaseClient'
import { useNavigate } from '@tanstack/react-router'
import { useAssumptions } from '../../hooks/useAssumptions'
import { getTripPassengerCount } from '@/services/actividades'

interface TripCardProps {
  trip: Trip
  userId: string
}

const TripCard: React.FC<TripCardProps> = ({ trip, userId }) => {
  const [passengerCount, setPassengerCount] = useState(0)
  const [tripStatus, setTripStatus] = useState(trip.status)
  const [loading, setLoading] = useState(false)
  const [modalAction, setModalAction] = useState<'start' | 'cancel' | 'finish' | null>(null)
  const [resultModal, setResultModal] = useState<null | { title: string, cobro?: number, devolucion?: number, color: string, message: string }>(null);
  const navigate = useNavigate()

  const { assumptions } = useAssumptions();

  // Usar el fee dinámico de assumptions
  const feePercentage = (assumptions?.fee_percentage ?? 15) / 100;

  useEffect(() => {
    const fetchPassengerCount = async () => {
      // Usar seats_reserved como fallback inmediato
      const fallbackCount = trip.seats_reserved || 0;
      setPassengerCount(fallbackCount);
      
      // Intentar obtener datos más precisos del backend (sin bloquear la UI)
      try {
        const result = await getTripPassengerCount(trip.id);
        if (result.success && result.data && result.data.total_passengers !== undefined) {
          // Solo actualizar si obtuvimos datos válidos
          setPassengerCount(result.data.total_passengers);
          console.log(`✅ Updated passenger count for trip ${trip.id}: ${result.data.total_passengers}`);
        }
      } catch (error) {
        // Error silencioso - mantener el fallback
        console.warn(`⚠️ Backend passenger count failed for trip ${trip.id}, keeping fallback: ${fallbackCount}`);
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
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id, balance, frozen_balance')
        .eq('user_id', userId)
        .single();

      if (!wallet || typeof wallet.id !== 'number') {
        throw new Error('No se encontró la wallet o el ID es inválido.')
      }

      const seatsAvailable = Number(trip.seats || 0) // Cupos disponibles
      const seatsReserved = Number(trip.seats_reserved || 0) // Cupos vendidos/reservados
      const totalSeatsPublished = seatsAvailable + seatsReserved // Total publicado originalmente
      const seatPrice = trip.pricePerSeat || trip.price_per_seat || 0
      const commissionPerSeat = seatPrice * feePercentage;

      if (modalAction === 'start') {
        // Al iniciar el viaje, se cobra fee SOLO sobre los cupos vendidos
        const feeOnSoldSeats = seatsReserved * commissionPerSeat
        // Se devuelve el fee de los cupos no vendidos (que estaba congelado)
        const feeRefundUnsoldSeats = seatsAvailable * commissionPerSeat
        
        // El monto total congelado originalmente era por todos los cupos publicados
        const totalFrozenAmount = totalSeatsPublished * commissionPerSeat

        await supabase
          .from('wallets')
          .update({
            balance: (wallet.balance || 0) + feeRefundUnsoldSeats,
            frozen_balance: (wallet.frozen_balance || 0) - totalFrozenAmount
          })
          .eq('id', wallet.id)

        const transacciones = [
          {
            wallet_id: wallet.id,
            transaction_type: 'cobro',
            amount: feeOnSoldSeats,
            detail: `Cobro de fee por ${seatsReserved} cupos vendidos`,
            status: 'completed'
          },
          {
            wallet_id: wallet.id,
            transaction_type: 'devolución',
            amount: feeRefundUnsoldSeats,
            detail: `Devolución de fee por ${seatsAvailable} cupos no vendidos`,
            status: 'completed'
          }
        ]

        for (const trans of transacciones) {
          const { error } = await supabase.from('wallet_transactions').insert([trans])
          if (error) throw error
        }

        await supabase.from('trips').update({ status: 'progress' }).eq('id', trip.id)
        setTripStatus('progress')
        setResultModal({
          title: 'Viaje Iniciado',
          cobro: feeOnSoldSeats,
          devolucion: feeRefundUnsoldSeats,
          color: 'green',
          message: `Se cobró fee por ${seatsReserved} cupos vendidos y se devolvió ${feeRefundUnsoldSeats.toLocaleString()} COP por cupos no vendidos.`
        });
      }

      if (modalAction === 'cancel') {
        if (seatsReserved > 0) {
          showNotification({
            title: 'Cancelación no permitida',
            message: 'Este viaje tiene al menos un cupo pagado. Si necesitas ayuda, contacta a soporte.',
            color: 'red'
          })
          return
        }

        const totalCongelado = totalSeatsPublished * commissionPerSeat

        await supabase
          .from('wallets')
          .update({
            balance: (wallet.balance || 0) + totalCongelado,
            frozen_balance: (wallet.frozen_balance || 0) - totalCongelado
          })
          .eq('id', wallet.id)

        const { error } = await supabase.from('wallet_transactions').insert([{
          wallet_id: wallet.id,
          transaction_type: 'devolución',
          amount: totalCongelado,
          detail: 'Devolución total por cancelación de viaje',
          status: 'completed'
        }])
        if (error) throw error

        await supabase.from('trips').update({ status: 'canceled' }).eq('id', trip.id)
        setTripStatus('canceled')
        setResultModal({
          title: 'Viaje Cancelado',
          devolucion: totalCongelado,
          color: 'orange',
          message: 'Saldo devuelto correctamente.'
        });
      }

      if (modalAction === 'finish') {
        await supabase.from('trips').update({ status: 'finished' }).eq('id', trip.id)
        setTripStatus('finished')
        setResultModal({
          title: 'Viaje Finalizado',
          color: 'green',
          message: 'El viaje se marcó como finalizado.'
        });
      }
    } catch (err) {
      showNotification({
        title: 'Error',
        message: (err as Error).message || 'Ocurrió un problema inesperado.',
        color: 'red',
      })
    } finally {
      setLoading(false)
      setModalAction(null)
    }
  }

  const isProgress = tripStatus === 'progress'
  const isFinished = tripStatus === 'finished'
  const isCanceled = tripStatus === 'canceled'
  const totalSeats = Number(trip.seats || 0) + parseFloat(trip.seats_reserved as unknown as string || '0')

  return (
    <div key={trip.id} className={styles.tripCard}>
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

      <Text size="sm" color="dimmed" className={styles.tripSummary}>
        {trip.description || 'Sin descripción'}
      </Text>

      <Group gap="sm" className={styles.tripActions}>
        {!isCanceled && (
          <Button
            size="sm"
            variant="outline"
            color="blue"
            onClick={handleCuposClick}
            leftSection={<Bell size={16} />}
            rightSection={passengerCount > 0 && <Badge color="blue" size="sm">{passengerCount}</Badge>}
          >
            Cupos Comprados
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
