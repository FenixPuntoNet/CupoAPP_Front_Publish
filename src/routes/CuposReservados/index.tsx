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
import { useBackendAuth } from '@/context/BackendAuthContext'
import styles from './index.module.css'

// Asegúrate de tener este archivo creado: src/routes/CuposReservados/ValidarCupo.$bookingId.tsx
import { Route as ValidarCupoRoute } from './ValidarCupo.$bookingId'
import { createFileRoute } from '@tanstack/react-router'

interface BookingWithPassengers {
  booking_id: number
  trip_id: number
  booking_status: 'completed' | 'pending' | 'confirmed' | 'cancelled' | string | null
  seats_booked: number
  total_price: number
  booking_qr: string
  booking_date: string
  user_profiles?: {
    first_name: string
    last_name: string
    phone_number?: string
  }
  passengers: {
    passenger_id: number
    full_name: string
    identification_number: string
    status?: string
  }[]
}

// Interfaces para uso futuro cuando el backend incluya trip details y summary
/*
interface TripSummary {
  total_bookings: number
  total_passengers: number
  total_seats_booked: number
  total_revenue: number
  pending_bookings: number
  completed_bookings: number
}

interface TripDetails {
  id: number
  date_time: string
  status: string
  seats: number
  seats_reserved: number
  price_per_seat: number
  origin?: {
    address: string
    main_text: string
  }
  destination?: {
    address: string
    main_text: string
  }
  vehicle?: {
    brand: string
    model: string
    plate: string
    color: string
  }
}
*/

interface CuposReservadosSearch {
  tripId: string
}

const CuposReservadosComponent: React.FC = () => {
  const [bookings, setBookings] = useState<BookingWithPassengers[]>([])
  const [loading, setLoading] = useState(true)
  // const [tripDetails, setTripDetails] = useState<TripDetails | null>(null)
  // const [summary, setSummary] = useState<TripSummary | null>(null)
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useBackendAuth()
  const { tripId } = Route.useSearch()

  // Mostrar estado de carga mientras se autentica
  if (authLoading) {
    return (
      <Container className={styles.container}>
        <Center style={{ minHeight: '50vh' }}>
          <Stack align="center" gap="md">
            <Loader color="teal" size="lg" />
            <Text color="dimmed">Verificando autenticación...</Text>
          </Stack>
        </Center>
      </Container>
    )
  }

  // Verificar autenticación
  if (!isAuthenticated || !user) {
    return (
      <Container className={styles.container}>
        <Center style={{ minHeight: '50vh' }}>
          <Stack align="center" gap="md">
            <IconX size={48} color="#ff6b6b" />
            <Text size="lg" color="red" ta="center">
              Acceso no autorizado
            </Text>
            <Text size="sm" color="dimmed" ta="center">
              Necesitas iniciar sesión para acceder a esta sección.
            </Text>
            <Button 
              variant="light" 
              color="blue" 
              onClick={() => navigate({ to: '/' })}
            >
              Volver al Inicio
            </Button>
          </Stack>
        </Center>
      </Container>
    )
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id || !tripId) {
        console.error('❌ [CuposReservados] Usuario no autenticado o tripId no proporcionado');
        console.log('🔍 [CuposReservados] user:', user);
        console.log('🔍 [CuposReservados] tripId:', tripId);
        console.log('🔍 [CuposReservados] localStorage token:', localStorage.getItem('auth_token'));
        setLoading(false);
        return;
      }

      setLoading(true)
      try {
        console.log('🎫 [CuposReservados] Fetching cupos for tripId:', tripId, 'userId:', user.id);
        console.log('🔍 [CuposReservados] Auth token exists:', !!localStorage.getItem('auth_token'));
        
        const result = await getCuposReservados(parseInt(tripId));
        
        console.log('🎫 [CuposReservados] Result received:', result);
        
        if (result.success && result.data) {
          console.log('✅ [CuposReservados] Data structure:', result.data);
          console.log('🔍 [CuposReservados] Bookings received:', result.data.bookings?.length || 0);
          
          // La estructura real del backend contiene directamente bookings
          const mappedBookings = result.data.bookings.map(booking => ({
            booking_id: booking.id,
            trip_id: parseInt(tripId),
            booking_status: booking.booking_status,
            seats_booked: booking.seats_booked,
            total_price: booking.total_price,
            booking_qr: booking.booking_qr,
            booking_date: booking.booking_date,
            user_profiles: booking.user_profiles,
            passengers: booking.passengers.map(passenger => ({
              passenger_id: passenger.id,
              full_name: passenger.full_name,
              identification_number: passenger.identification_number,
              status: passenger.status,
            }))
          }));
          
          console.log('✅ [CuposReservados] Mapped bookings:', mappedBookings);
          setBookings(mappedBookings);
        } else {
          console.error('❌ [CuposReservados] Error fetching cupos reservados:', result.error);
          
          // Mostrar mensaje específico basado en el error
          let errorMessage = result.error || 'No fue posible cargar la información.';
          let errorTitle = 'Error al cargar cupos';
          
          if (result.error === 'Viaje no encontrado') {
            errorTitle = 'Viaje no encontrado';
            errorMessage = `El viaje con ID ${tripId} no existe o no tienes permisos para verlo. Verifica que seas el conductor de este viaje.`;
          } else if (result.error?.includes('404')) {
            errorTitle = 'Viaje no encontrado';
            errorMessage = `El viaje con ID ${tripId} no existe en el sistema. Verifica el ID del viaje.`;
          } else if (result.error?.includes('Token inválido') || result.error?.includes('Unauthorized')) {
            errorTitle = 'Sesión expirada';
            errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
            // Redirigir al home después de 3 segundos
            setTimeout(() => {
              navigate({ to: '/' });
            }, 3000);
          }
          
          showNotification({
            title: errorTitle,
            message: errorMessage,
            color: 'red',
            autoClose: 7000, // 7 segundos para leer el mensaje completo
          })
        }
      } catch (error) {
        console.error('❌ [CuposReservados] Exception:', error);
        showNotification({
          title: 'Error de conexión',
          message: 'No fue posible conectar con el servidor. Verifica tu conexión a internet.',
          color: 'red',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [tripId, user?.id])

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

      <h3 style={{ color: '#00ff9d', marginBottom: '20px', fontSize: '24px', fontWeight: '600', textAlign: 'center' }}>
        Reservas Confirmadas
      </h3>

      <div className={styles.passengersContainer}>
        {loading ? (
          <Center>
            <Stack align="center" gap="md">
              <Loader color="teal" size="lg" />
              <Text color="dimmed">Cargando cupos reservados...</Text>
            </Stack>
          </Center>
        ) : bookings.length > 0 ? (
          bookings.map((booking) => (
            <div key={booking.booking_id} className={styles.passengerCard}>
              <Stack gap="xs">
                {/* Información del usuario que reservó */}
                {booking.user_profiles && (
                  <div className={styles.bookingHeader}>
                    <Group gap="apart">
                      <Text size="sm" color="dimmed">Reservado por:</Text>
                      <Badge color="cyan" variant="light" size="sm">
                        {booking.user_profiles.first_name} {booking.user_profiles.last_name}
                      </Badge>
                    </Group>
                    {booking.user_profiles.phone_number && (
                      <Text size="xs" color="dimmed">
                        Tel: {booking.user_profiles.phone_number}
                      </Text>
                    )}
                  </div>
                )}

                {/* Información de la reserva */}
                <div className={styles.bookingInfo}>
                  <div className={styles.bookingMeta}>
                    <div>
                      <Text size="xs" color="dimmed">Fecha de reserva:</Text>
                      <Text size="sm" fw={500}>
                        {new Date(booking.booking_date).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </div>
                    <div>
                      <Text size="xs" color="dimmed">Precio Total:</Text>
                      <Text size="sm" fw={600} color="green">
                        ${booking.total_price.toLocaleString()}
                      </Text>
                    </div>
                  </div>

                  <div className={styles.bookingMeta}>
                    <div>
                      <Text size="xs" color="dimmed">Asientos:</Text>
                      <Text size="sm" fw={500}>{booking.seats_booked}</Text>
                    </div>
                    <div>
                      <Text size="xs" color="dimmed">QR Code:</Text>
                      <div className={styles.qrCode}>
                        {booking.booking_qr}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lista de pasajeros */}
                <div className={styles.passengersList}>
                  <Text size="xs" color="dimmed" mb="xs">Pasajeros:</Text>
                  {booking.passengers.map((passenger) => (
                    <div key={passenger.passenger_id} className={styles.passengerItem}>
                      <Group gap="apart">
                        <Text className={styles.passengerName}>{passenger.full_name}</Text>
                        {passenger.status && (
                          <Badge 
                            color={passenger.status === 'validated' ? 'green' : 'gray'} 
                            size="xs"
                          >
                            {passenger.status}
                          </Badge>
                        )}
                      </Group>
                      <Text className={styles.passengerId}>
                        ID: {passenger.identification_number}
                      </Text>
                    </div>
                  ))}
                </div>

                <Badge
                  color={
                    booking.booking_status === 'completed' ? 'green' : 
                    booking.booking_status === 'confirmed' ? 'blue' : 
                    booking.booking_status === 'pending' ? 'yellow' : 'red'
                  }
                  variant="filled"
                  mt="xs"
                  className={styles.statusBadge}
                >
                  Estado: {
                    booking.booking_status === 'completed' ? 'Completado' :
                    booking.booking_status === 'confirmed' ? 'Confirmado' :
                    booking.booking_status === 'pending' ? 'Pendiente' : 
                    booking.booking_status
                  }
                </Badge>

                {booking.booking_status !== 'completed' && (
                  <Button
                    variant="light"
                    className={styles.validateButton}
                    onClick={() => handleValidateCupo(booking.booking_id)}
                    mt="sm"
                    fullWidth
                  >
                    Validar Cupo con QR
                  </Button>
                )}
              </Stack>
            </div>
          ))
        ) : (
          <Center>
            <Stack align="center" gap="md" p="xl">
              <IconX size={48} color="#ff6b6b" />
              <Text size="lg" className={styles.noTripsText} ta="center">
                No hay cupos registrados para este viaje.
              </Text>
              <Text size="sm" color="dimmed" ta="center">
                Verifica que tengas permisos para ver este viaje o que existan reservas.
              </Text>
              <Button 
                variant="light" 
                color="blue" 
                onClick={() => navigate({ to: '/Actividades' })}
              >
                Volver a Actividades
              </Button>
            </Stack>
          </Center>
        )}
      </div>
    </Container>
  )
}

export const Route = createFileRoute('/CuposReservados/')({
  component: CuposReservadosComponent,
  validateSearch: (search: Record<string, unknown>): CuposReservadosSearch => ({
    tripId: (search.tripId as string) || ''
  })
})

export default CuposReservadosComponent
