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
import { useNavigate, useSearch } from '@tanstack/react-router'
import { IconX } from '@tabler/icons-react'
import { getCuposReservados } from '@/services/cupos'
import { getCurrentUser } from '@/services/auth'
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

const CuposReservadosComponent: React.FC = () => {
  const [bookings, setBookings] = useState<BookingWithPassengers[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const navigate = useNavigate()
  const search = useSearch({ from: '/CuposReservados/' })

  // Obtener tripId de los parámetros validados de la ruta
  const tripId = search.tripId

  useEffect(() => {
    console.log(`🔍 [CuposReservados] Route search params:`, { search, tripId });
    
    if (!tripId) {
      console.error(`❌ [CuposReservados] No tripId found in search params`);
      showNotification({
        title: 'Error de navegación',
        message: 'No se encontró el ID del viaje en la URL',
        color: 'red',
      });
    } else {
      console.log(`✅ [CuposReservados] TripId from route: ${tripId}`);
    }
  }, [tripId, search]);

  // Obtener información del usuario
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user && user.user) {
          console.log(`✅ [CuposReservados] User loaded: ${user.user.id}`);
          setUserId(user.user.id);
        } else {
          console.error(`❌ [CuposReservados] No user found`);
          showNotification({
            title: 'Error de autenticación',
            message: 'No se pudo obtener la información del usuario',
            color: 'red',
          });
        }
      } catch (error) {
        console.error(`❌ [CuposReservados] Error fetching user:`, error);
        showNotification({
          title: 'Error de autenticación',
          message: 'Error al obtener información del usuario',
          color: 'red',
        });
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // No hacer nada si no tenemos tripId y userId
      if (!tripId || !userId) {
        console.log(`⏳ [CuposReservados] Waiting for tripId (${tripId}) and userId (${userId})`);
        return;
      }

      setLoading(true);
      
      // Timeout de seguridad
      const timeoutId = setTimeout(() => {
        console.warn(`⏰ [CuposReservados] Fetch timeout for trip ${tripId}`);
        setLoading(false);
        showNotification({
          title: 'Tiempo de carga agotado',
          message: 'No se pudieron cargar los cupos en este momento.',
          color: 'yellow',
        });
      }, 15000);
      
      try {
        console.log(`🎫 [CuposReservados] Fetching data for trip ${tripId} by user ${userId}`);
        
        const result = await getCuposReservados(tripId);
        
        // Limpiar timeout
        clearTimeout(timeoutId);
        
        if (result.success && result.data) {
          console.log(`✅ [CuposReservados] Backend response:`, result.data);
          
          // El backend actualizado ya retorna los datos en el formato correcto
          const bookingsData = result.data.bookings || [];
          
          const mappedBookings = bookingsData.map(booking => ({
            booking_id: booking.id,
            trip_id: tripId,
            booking_status: booking.booking_status,
            passengers: (booking.passengers || []).map(passenger => ({
              passenger_id: passenger.id,
              full_name: passenger.full_name,
              identification_number: passenger.identification_number,
            }))
          }));
          
          console.log(`✅ [CuposReservados] Mapped ${mappedBookings.length} bookings`);
          setBookings(mappedBookings);
          
          // Mostrar información adicional si está disponible
          if (result.data.summary) {
            console.log(`📊 [CuposReservados] Summary:`, result.data.summary);
            showNotification({
              title: 'Cupos cargados',
              message: `${result.data.summary.total_bookings} reservas con ${result.data.summary.total_passengers} pasajeros`,
              color: 'green',
            });
          } else {
            showNotification({
              title: 'Cupos cargados',
              message: `Se encontraron ${mappedBookings.length} reservas`,
              color: 'green',
            });
          }
        } else {
          console.error(`❌ [CuposReservados] Error:`, result.error);
          
          // Manejar diferentes tipos de errores con mensajes específicos
          let errorMessage = 'No fue posible cargar la información.';
          
          if (result.error?.includes('permisos')) {
            errorMessage = 'No tienes permisos para ver los cupos de este viaje.';
          } else if (result.error?.includes('Sesión expirada')) {
            errorMessage = 'Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.';
          } else if (result.error?.includes('no encontrado')) {
            errorMessage = 'El viaje solicitado no fue encontrado.';
          }
          
          showNotification({
            title: 'Error al obtener los cupos',
            message: errorMessage,
            color: 'red',
          });
          
          // Establecer array vacío para mostrar el mensaje de "sin cupos"
          setBookings([]);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error(`❌ [CuposReservados] Unexpected error:`, error);
        
        showNotification({
          title: 'Error inesperado',
          message: 'Ocurrió un error inesperado al cargar los cupos.',
          color: 'red',
        });
        
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tripId, userId]);

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
          <div style={{height: '50px'}} />
          Cupos Reservados {tripId ? `- Viaje ${tripId}` : ''}
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
            <Stack align="center" gap="md">
              <Loader />
              <Text size="sm" c="dimmed">
                {!tripId || !userId 
                  ? 'Cargando información del viaje...' 
                  : 'Obteniendo cupos reservados...'}
              </Text>
            </Stack>
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
            <Stack align="center" gap="md">
              <Text size="lg" className={styles.noTripsText}>
                No hay cupos registrados para este viaje.
              </Text>
              {!tripId && (
                <Text size="sm" c="dimmed">
                  No se pudo obtener el ID del viaje desde la URL.
                </Text>
              )}
            </Stack>
          </Center>
        )}
      </div>
    </Container>
  )
}

export const Route = createFileRoute('/CuposReservados/')({
  component: CuposReservadosComponent,
  validateSearch: (search: Record<string, unknown>) => {
    console.log('🔍 [Route] Raw search params:', search);
    return {
      tripId: search.tripId ? Number(search.tripId) : undefined,
    }
  },
})

export default CuposReservadosComponent
