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
import { getCuposReservados } from '@/services/cupos'
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
        const result = await getCuposReservados(tripId);
        
        if (result.success && result.data) {
          const mappedBookings = result.data.bookings.map(booking => ({
            booking_id: booking.id,
            trip_id: tripId,
            booking_status: booking.booking_status,
            passengers: booking.passengers.map(passenger => ({
              passenger_id: passenger.id,
              full_name: passenger.full_name,
              identification_number: passenger.identification_number,
            }))
          }));
          
          setBookings(mappedBookings);
        } else {
          console.error('Error fetching cupos reservados:', result.error);
        }
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
