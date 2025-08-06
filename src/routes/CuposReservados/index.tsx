import { useState, useEffect } from 'react'
import {
  Container,
  Title,
  Text,
  Card,
  Badge,
  Group,
  Stack,
  Center,
  Alert,
  SimpleGrid,
  Avatar,
  ActionIcon,
  Button,
  Divider,
  ThemeIcon,
  Loader
} from '@mantine/core'
import { showNotification } from '@mantine/notifications'
import { useNavigate, useSearch, createFileRoute } from '@tanstack/react-router'
import { 
  IconX, 
  IconUser, 
  IconIdBadge2, 
  IconCalendar,
  IconMapPin,
  IconCheck,
  IconAlertCircle,
  IconQrcode,
  IconUsers
} from '@tabler/icons-react'
import { getCuposReservados } from '@/services/cupos'
import { getCurrentUser } from '@/services/auth'
import styles from './index.module.css'

interface BookingWithPassengers {
  booking_id: number
  trip_id: number
  booking_status: 'payed' | 'pending' | 'completed' | 'confirmed' | 'cancelled' | string | null
  total_price?: number
  booking_date?: string
  booking_qr?: string
  seats_booked?: number
  passengers: {
    passenger_id: number
    full_name: string
    identification_number: string
    status?: 'pending' | 'validated' | string // Nuevo campo según backend
  }[]
}

interface TripInfo {
  id: number
  origin?: { address: string; main_text?: string }
  destination?: { address: string; main_text?: string }
  date?: string
  time?: string
  price_per_seat?: number
  seats?: number
}

interface Summary {
  total_bookings: number
  total_passengers: number
  validated_passengers: number
  pending_passengers: number
  validation_percentage: number
  total_seats_booked: number
  total_revenue: number
  pending_bookings: number
  completed_bookings: number
}

const CuposReservadosComponent: React.FC = () => {
  const [bookings, setBookings] = useState<BookingWithPassengers[]>([])
  const [tripInfo, setTripInfo] = useState<TripInfo | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
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
        
        console.log(`🔍 [CuposReservados] Starting data fetch for tripId: ${tripId}, userId: ${userId}`);
        
        const result = await getCuposReservados(tripId);
        
        // Limpiar timeout
        clearTimeout(timeoutId);
        
        console.log(`🔍 [CuposReservados] getCuposReservados result:`, result);
        
        if (result.success && result.data) {
          console.log(`✅ [CuposReservados] Backend response:`, result.data);
          
          // Guardar información del viaje y resumen
          if (result.data.trip) {
            setTripInfo(result.data.trip);
            console.log(`✅ [CuposReservados] Trip info set:`, result.data.trip);
          }
          
          if (result.data.summary) {
            setSummary(result.data.summary);
            console.log(`📊 [CuposReservados] Summary set:`, result.data.summary);
          }
          
          // El backend actualizado ya retorna los datos en el formato correcto
          const bookingsData = result.data.bookings || [];
          console.log(`🔍 [CuposReservados] Bookings data from backend:`, bookingsData);
          
          const mappedBookings = bookingsData.map((booking: any) => ({
            booking_id: booking.id,
            trip_id: tripId,
            booking_status: booking.booking_status,
            total_price: booking.total_price,
            booking_date: booking.booking_date,
            booking_qr: booking.booking_qr,
            seats_booked: booking.seats_booked,
            passengers: (booking.passengers || []).map((passenger: any) => ({
              passenger_id: passenger.id,
              full_name: passenger.full_name,
              identification_number: passenger.identification_number,
              status: passenger.status || 'pending' // Nuevo campo de estado individual
            }))
          }));
          
          console.log(`✅ [CuposReservados] Mapped ${mappedBookings.length} bookings:`, mappedBookings);
          
          // 🔍 DEBUG: Log detallado de los bookings para verificar el contenido
          console.log(`🔍 [CuposReservados] DEBUG - Detailed bookings data:`, mappedBookings);
          mappedBookings.forEach((booking, index) => {
            console.log(`🔍 [CuposReservados] Booking ${index + 1}:`, {
              booking_id: booking.booking_id,
              status: booking.booking_status,
              passengers_count: booking.passengers.length,
              passengers: booking.passengers.map((p: any) => ({
                name: p.full_name,
                status: p.status
              }))
            });
          });
          
          setBookings(mappedBookings);
          
          // Mostrar información actualizada con datos de validación
          if (result.data.summary) {
            const { summary } = result.data;
            const hasBookings = mappedBookings.length > 0;
            const hasPassengers = summary.total_passengers > 0;
            
            showNotification({
              title: hasBookings ? 'Cupos cargados exitosamente' : 'Viaje sin reservas',
              message: hasPassengers 
                ? `${summary.total_passengers} pasajeros - ${summary.validated_passengers} validados, ${summary.pending_passengers} pendientes`
                : hasBookings 
                  ? `${mappedBookings.length} reservas encontradas pero sin pasajeros confirmados`
                  : 'Este viaje aún no tiene reservas de pasajeros',
              color: hasBookings ? 'green' : 'blue',
            });
          } else {
            const hasBookings = mappedBookings.length > 0;
            showNotification({
              title: hasBookings ? 'Cupos cargados' : 'Viaje sin reservas',
              message: hasBookings 
                ? `Se encontraron ${mappedBookings.length} reservas`
                : 'Este viaje aún no tiene reservas de pasajeros',
              color: hasBookings ? 'green' : 'blue',
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
      to: '/CuposReservados/ValidarCupo/$bookingId',
      params: { bookingId: `${bookingId}` },
    })
  }

  const handleClose = () => {
    navigate({ to: '/' })
  }

  return (
    <Container className={styles.container} size="lg">
      {/* Header con información del viaje */}
      <Group justify="space-between" mb="lg" className={styles.headerGroup}>
        <div>
          <Title order={2} className={styles.title}>
            Cupos Reservados {tripId ? `- Viaje ${tripId}` : ''}
          </Title>
          {tripInfo && (
            <Group gap="xs" mt="xs">
              <Badge leftSection={<IconMapPin size={14} />} color="blue" variant="light">
                {tripInfo.origin?.main_text || tripInfo.origin?.address || 'Origen'}
              </Badge>
              <Text size="sm" c="dimmed">→</Text>
              <Badge leftSection={<IconMapPin size={14} />} color="green" variant="light">
                {tripInfo.destination?.main_text || tripInfo.destination?.address || 'Destino'}
              </Badge>
            </Group>
          )}
        </div>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          onClick={handleClose}
          className={styles.closeButton}
        >
          <IconX size={20} />
        </ActionIcon>
      </Group>

      {/* Resumen de cupos con información de validación */}
      {summary && (
        <SimpleGrid cols={{ base: 1, sm: 3, md: 3 }} mb="xl">
          <Card className={styles.summaryCard}>
            <Group justify="space-between">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  Total Pasajeros
                </Text>
                <Text size="xl" fw={700} c="blue">
                  {summary.total_passengers}
                </Text>
              </div>
              <ThemeIcon color="blue" variant="light" size="lg">
                <IconUsers size={20} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card className={styles.summaryCard}>
            <Group justify="space-between">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  Validados
                </Text>
                <Text size="xl" fw={700} c="green">
                  {summary.validated_passengers}
                </Text>
              </div>
              <ThemeIcon color="green" variant="light" size="lg">
                <IconCheck size={20} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card className={styles.summaryCard}>
            <Group justify="space-between">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  Pendientes
                </Text>
                <Text size="xl" fw={700} c="orange">
                  {summary.pending_passengers}
                </Text>
              </div>
              <ThemeIcon color="orange" variant="light" size="lg">
                <IconQrcode size={20} />
              </ThemeIcon>
            </Group>
          </Card>
        </SimpleGrid>
      )}

      {/* Lista de cupos */}
      <div className={styles.passengersContainer}>
        {loading ? (
          <Center>
            <Stack align="center" gap="md">
              <Loader size="lg" />
              <Text size="sm" c="dimmed">
                {!tripId || !userId 
                  ? 'Cargando información del viaje...' 
                  : 'Obteniendo cupos reservados...'}
              </Text>
            </Stack>
          </Center>
        ) : bookings.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {bookings.map((booking) => (
              <Card key={booking.booking_id} className={styles.passengerCard} padding="lg">
                {/* Header de la reserva */}
                <Group justify="space-between" mb="md">
                  <Badge
                    color={booking.booking_status === 'payed' ? 'green' : 'yellow'}
                    variant="filled"
                    leftSection={booking.booking_status === 'payed' ? <IconCheck size={12} /> : <IconAlertCircle size={12} />}
                  >
                    {booking.booking_status === 'payed' ? 'PAGADO' : 'PENDIENTE'}
                  </Badge>
                  
                  <Group gap="xs">
                    {booking.total_price && (
                      <Text size="sm" fw={700} c="blue">
                        ${booking.total_price.toLocaleString()}
                      </Text>
                    )}
                    {booking.seats_booked && (
                      <Badge color="blue" variant="light">
                        {booking.seats_booked} cupo{booking.seats_booked > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </Group>
                </Group>

                {/* Información de pasajeros con estado individual */}
                <Stack gap="sm" mb="md">
                  {booking.passengers.map((passenger, index) => (
                    <div key={passenger.passenger_id}>
                      <Group gap="sm">
                        <Avatar 
                          color={passenger.status === 'validated' ? 'green' : 'orange'} 
                          radius="sm"
                        >
                          {passenger.status === 'validated' ? <IconCheck size={18} /> : <IconUser size={18} />}
                        </Avatar>
                        <div style={{ flex: 1 }}>
                          <Group justify="space-between" align="center">
                            <Text fw={600} size="sm">
                              {passenger.full_name}
                            </Text>
                            <Badge 
                              color={passenger.status === 'validated' ? 'green' : 'orange'}
                              variant="filled"
                              size="xs"
                            >
                              {passenger.status === 'validated' ? '✅ Validado' : '⏳ Pendiente'}
                            </Badge>
                          </Group>
                          <Group gap="xs">
                            <IconIdBadge2 size={14} />
                            <Text size="xs" c="dimmed">
                              {passenger.identification_number}
                            </Text>
                          </Group>
                        </div>
                      </Group>
                      {index < booking.passengers.length - 1 && <Divider my="xs" />}
                    </div>
                  ))}
                </Stack>

                {/* Información adicional */}
                {booking.booking_date && (
                  <Group gap="xs" mb="sm">
                    <IconCalendar size={14} />
                    <Text size="xs" c="dimmed">
                      Reservado: {new Date(booking.booking_date).toLocaleDateString()}
                    </Text>
                  </Group>
                )}

                {/* Botón de validación o estado */}
                {(() => {
                  // Verificar si tenemos pasajeros
                  if (!booking.passengers || booking.passengers.length === 0) {
                    return (
                      <Alert color="blue" variant="light" icon={<IconAlertCircle size={16} />}>
                        <Text size="sm">ℹ️ Sin pasajeros registrados</Text>
                        <Text size="xs" c="dimmed" mt="xs">
                          Este cupo no tiene pasajeros asociados
                        </Text>
                      </Alert>
                    );
                  }
                  
                  // 🔥 LÓGICA SIMPLIFICADA Y DIRECTA - FORZAR DETECCIÓN
                  console.log(`🔥 [CuposReservados] ANALYZING Booking ${booking.booking_id}:`, {
                    passengers: booking.passengers.map(p => ({
                      name: p.full_name,
                      rawStatus: p.status,
                      statusType: typeof p.status,
                      isValidated: p.status === 'validated' || p.status === 'VALIDADO'
                    }))
                  });
                  
                  // Contar directamente - cualquier status que NO sea explícitamente "validated" o "VALIDADO" es pendiente
                  const validatedPassengers = booking.passengers.filter(p => 
                    p.status === 'validated' || p.status === 'VALIDADO'
                  );
                  
                  const pendingPassengers = booking.passengers.filter(p => 
                    p.status !== 'validated' && p.status !== 'VALIDADO'
                  );
                  
                  console.log(`🔥 [CuposReservados] COUNTS for Booking ${booking.booking_id}:`, {
                    total: booking.passengers.length,
                    validated: validatedPassengers.length,
                    pending: pendingPassengers.length,
                    validatedNames: validatedPassengers.map(p => p.full_name),
                    pendingNames: pendingPassengers.map(p => p.full_name)
                  });
                  
                  // Si TODOS están validados
                  if (validatedPassengers.length === booking.passengers.length && booking.passengers.length > 0) {
                    console.log(`✅ [CuposReservados] ALL VALIDATED for Booking ${booking.booking_id}`);
                    return (
                      <Alert color="green" variant="light" icon={<IconCheck size={16} />}>
                        <Text size="sm" fw={600}>✅ Todos los pasajeros validados</Text>
                        <Text size="xs" c="dimmed" mt="xs">
                          Este cupo está completamente verificado y listo para el viaje
                        </Text>
                      </Alert>
                    );
                  }
                  
                  // Si hay CUALQUIER pasajero pendiente - MOSTRAR BOTÓN SIEMPRE
                  if (pendingPassengers.length > 0) {
                    console.log(`🚀 [CuposReservados] SHOWING VALIDATE BUTTON for Booking ${booking.booking_id} - ${pendingPassengers.length} pending`);
                    return (
                      <>
                        <Alert color="yellow" variant="light" icon={<IconAlertCircle size={16} />} mb="sm">
                          <Text size="sm">⏳ {pendingPassengers.length} pasajero{pendingPassengers.length > 1 ? 's' : ''} pendiente{pendingPassengers.length > 1 ? 's' : ''} de validación</Text>
                        </Alert>
                        <Button
                          variant="light"
                          color="green"
                          fullWidth
                          className={styles.validateButton}
                          onClick={() => {
                            console.log(`🎯 [CuposReservados] VALIDATE BUTTON CLICKED for booking: ${booking.booking_id}`);
                            handleValidateCupo(booking.booking_id);
                          }}
                          leftSection={<IconQrcode size={16} />}
                        >
                          Validar Cupo
                        </Button>
                      </>
                    );
                  }
                  
                  // Caso por defecto - NUNCA debería llegar aquí
                  console.error(`❌ [CuposReservados] UNEXPECTED STATE for Booking ${booking.booking_id}`);
                  return (
                    <>
                      <Alert color="orange" variant="light" icon={<IconAlertCircle size={16} />} mb="sm">
                        <Text size="sm">⚠️ Estado incierto - Forzando validación disponible</Text>
                      </Alert>
                      <Button
                        variant="light"
                        color="green"
                        fullWidth
                        onClick={() => handleValidateCupo(booking.booking_id)}
                        leftSection={<IconQrcode size={16} />}
                      >
                        Validar Cupo (Forzado)
                      </Button>
                    </>
                  );
                })()}
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          <Center>
            <Stack align="center" gap="md">
              <Alert color="blue" variant="light" icon={<IconAlertCircle size={16} />}>
                <Text size="lg" className={styles.noTripsText}>
                  No hay cupos registrados para este viaje.
                </Text>
                {!tripId && (
                  <Text size="sm" c="dimmed" mt="xs">
                    No se pudo obtener el ID del viaje desde la URL.
                  </Text>
                )}
                {tripId && (
                  <Text size="sm" c="dimmed" mt="xs">
                    El viaje {tripId} aún no tiene reservas de pasajeros.
                  </Text>
                )}
                <Button 
                  variant="light" 
                  color="blue" 
                  mt="md"
                  onClick={() => {
                    // Refrescar los datos
                    setLoading(true);
                    setTimeout(() => {
                      window.location.reload();
                    }, 500);
                  }}
                >
                  Actualizar datos
                </Button>
              </Alert>
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
