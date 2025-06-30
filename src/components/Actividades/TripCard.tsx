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
import CuposReservados from '../../routes/CuposReservados'
import { supabase } from '@/lib/supabaseClient'
import { useNavigate } from '@tanstack/react-router'

interface TripCardProps {
  trip: Trip
  userId: string
}

const TripCard: React.FC<TripCardProps> = ({ trip, userId }) => {
  const [cuposModalOpen, setCuposModalOpen] = useState(false)
  const [passengerCount, setPassengerCount] = useState(0)
  const [tripStatus, setTripStatus] = useState(trip.status)
  const [loading, setLoading] = useState(false)
  const [modalAction, setModalAction] = useState<'start' | 'cancel' | 'finish' | null>(null)
  const navigate = useNavigate()

  const PERCENTAGE_TO_CHARGE = 0.15

  useEffect(() => {
    const fetchPassengerCount = async () => {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('trip_id', trip.id)

      const bookingIds = bookings?.map((b) => b.id) || []

      if (bookingIds.length === 0) return setPassengerCount(0)

      const { count } = await supabase
        .from('booking_passengers')
        .select('*', { count: 'exact', head: true })
        .in('booking_id', bookingIds)

      setPassengerCount(count || 0)
    }

    fetchPassengerCount()
  }, [trip.id])

  const handleCuposClick = () => setCuposModalOpen(true)
  const handleCloseCuposModal = () => setCuposModalOpen(false)
  const handleCloseActionModal = () => setModalAction(null)

  const executeAction = async () => {
    if (!modalAction) return

    setLoading(true)
    try {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id, balance, frozen_balance')
        .eq('user_id', userId)
        .single()

      if (!wallet || typeof wallet.id !== 'number') {
        throw new Error('No se encontró la wallet o el ID es inválido.')
      }

      const seats = Number(trip.seats || 0)
      const seatsReserved = parseFloat(trip.seats_reserved as unknown as string || '0')
      const totalCupos = seats + seatsReserved
      const seatPrice = trip.pricePerSeat || 0
      const commissionPerSeat = seatPrice * PERCENTAGE_TO_CHARGE

      if (modalAction === 'start') {
        const totalCobro = totalCupos * commissionPerSeat
        const cuposNoVendidos = seats
        const devolucion = cuposNoVendidos * commissionPerSeat

        await supabase
          .from('wallets')
          .update({
            balance: (wallet.balance || 0) + devolucion,
            frozen_balance: (wallet.frozen_balance || 0) - totalCobro
          })
          .eq('id', wallet.id)

        const transacciones = [
          {
            wallet_id: wallet.id,
            transaction_type: 'cobro',
            amount: totalCobro,
            detail: `Cobro por ${totalCupos} cupos publicados`,
            status: 'completed'
          },
          {
            wallet_id: wallet.id,
            transaction_type: 'devolución',
            amount: devolucion,
            detail: `Devolución por ${cuposNoVendidos} cupos no vendidos`,
            status: 'completed'
          }
        ]

        for (const trans of transacciones) {
          const { error } = await supabase.from('wallet_transactions').insert([trans])
          if (error) throw error
        }

        await supabase.from('trips').update({ status: 'progress' }).eq('id', trip.id)
        setTripStatus('progress')
        showNotification({
          title: 'Viaje Iniciado',
          message: `Se cobró por ${totalCupos} cupos y se devolvió ${devolucion.toFixed(2)} COP.`,
          color: 'green'
        })
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

        const totalCongelado = (seats + seatsReserved) * commissionPerSeat

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
        showNotification({
          title: 'Viaje Cancelado',
          message: 'Saldo devuelto correctamente.',
          color: 'orange'
        })
      }

      if (modalAction === 'finish') {
        await supabase.from('trips').update({ status: 'finished' }).eq('id', trip.id)
        setTripStatus('finished')
        showNotification({
          title: 'Viaje Finalizado',
          message: 'El viaje se marcó como finalizado.',
          color: 'green',
        })
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
        <Badge leftSection={<Clock size={14} />}>{trip.duration}</Badge>
        <Badge leftSection={<Navigation size={14} />}>{trip.distance}</Badge>
        <Badge leftSection={<Users size={14} />}>{totalSeats} Asientos</Badge>
        <Badge leftSection={<DollarSign size={14} />}>{trip.pricePerSeat} COP/Asiento</Badge>
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

      <Modal opened={cuposModalOpen} onClose={handleCloseCuposModal}>
        <CuposReservados tripId={trip.id} userId={userId} />
      </Modal>

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
    </div>
  )
}

export default TripCard
