import { useState, useEffect } from 'react'
import {
  Text,
  Center,
  Container,
  Title,
  Group,
  Button,
  Badge,
  Loader,
  Stack,
} from '@mantine/core'
import { showNotification } from '@mantine/notifications'
import { useNavigate } from '@tanstack/react-router'
import { IconX } from '@tabler/icons-react'
import { supabase } from '@/lib/supabaseClient'
import styles from './index.module.css'

// Asegúrate de tener este archivo creado: src/routes/CuposReservados/ValidarCupo.$bookingId.tsx
import { Route as ValidarCupoRoute } from './ValidarCupo.$bookingId'
import { createFileRoute } from '@tanstack/react-router'

interface BookingWithPassengers {
  booking_id: number
  trip_id: number
  booking_status: 'payed' | 'pending' | string | null
  passengers: {
    passenger_id: number
    full_name: string
    identification_number: string
  }[]
}

interface CuposReservadosProps {
  tripId: number
  userId: string
}

const CuposReservadosComponent: React.FC<CuposReservadosProps> = ({
  tripId,
  userId,
}) => {
  const [bookings, setBookings] = useState<BookingWithPassengers[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('booking_passengers')
          .select(
            `id, full_name, identification_number, booking_id, bookings ( trip_id, booking_status )`,
          )
          .eq('user_id', userId)

        if (error) throw error

        const grouped: Record<number, BookingWithPassengers> = {}

        data?.forEach((p) => {
          const bookingId = p.booking_id
          const tripId = p.bookings?.trip_id

          if (bookingId != null && tripId != null) {
            if (!grouped[bookingId]) {
              grouped[bookingId] = {
                booking_id: bookingId,
                trip_id: tripId,
                booking_status: p.bookings!.booking_status,
                passengers: [],
              }
            }
            grouped[bookingId].passengers.push({
              passenger_id: p.id,
              full_name: p.full_name,
              identification_number: p.identification_number,
            })
          }
        })

        const filtered = Object.values(grouped).filter(
          (b) => b.trip_id === tripId,
        )

        setBookings(filtered)
      } catch (error) {
        showNotification({
          title: 'Error al obtener los cupos',
          message: 'No fue posible cargar la información.',
          color: 'red',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [tripId, userId])

  const handleValidateCupo = (bookingId: number) => {
    navigate({
      to: ValidarCupoRoute.to,
      params: { bookingId: `${bookingId}` },
    })
  }

  const handleClose = () => {
    navigate({ to: '/' })
  }

  return (
    <Container className={styles.container}>
      <Group gap="apart" mb="md" className={styles.headerGroup}>
        <Title order={2} className={styles.title}>
          Cupos Reservados - Viaje {tripId}
        </Title>
        <Button
          variant="subtle"
          color="gray"
          onClick={handleClose}
          className={styles.closeButton}
        >
          <IconX size={20} stroke={2} className={styles.closeIcon} />
        </Button>
      </Group>

      <div className={styles.passengersContainer}>
        {loading ? (
          <Center>
            <Loader />
          </Center>
        ) : bookings.length > 0 ? (
          bookings.map((booking) => (
            <div key={booking.booking_id} className={styles.passengerCard}>
              <Stack gap="xs">
                {booking.passengers.map((passenger) => (
                  <div key={passenger.passenger_id}>
                    <Group gap="apart">
                      <Text fw={700}>{passenger.full_name}</Text>
                    </Group>
                    <Text size="sm">
                      ID: {passenger.identification_number}
                    </Text>
                  </div>
                ))}

                <Badge
                  color={
                    booking.booking_status === 'payed' ? 'green' : 'yellow'
                  }
                  variant="filled"
                  mt="xs"
                >
                  Estado: {booking.booking_status === 'payed' ? 'Pagado' : 'Pendiente'}
                </Badge>

                {booking.booking_status !== 'payed' && (
                  <Button
                    variant="light"
                    className={styles.validateButton}
                    onClick={() => handleValidateCupo(booking.booking_id)}
                    mt="sm"
                  >
                    Validar Cupo
                  </Button>
                )}
              </Stack>
            </div>
          ))
        ) : (
          <Center>
            <Text size="lg" className={styles.noTripsText}>
              No hay cupos registrados para este viaje.
            </Text>
          </Center>
        )}
      </div>
    </Container>
  )
}

export const Route = createFileRoute('/CuposReservados/')({
  component: CuposReservadosComponent,
})

export default CuposReservadosComponent
