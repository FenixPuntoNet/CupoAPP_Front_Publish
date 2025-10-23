import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  LoadingOverlay,
  Card,
  Group,
  Stack,
  Button,
  Modal,
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import dayjs from 'dayjs';
import styles from './index.module.css';
import { createFileRoute } from '@tanstack/react-router';
import { getMisCupos } from '@/services/cupos';
import { cancelBooking } from '@/services/reservas';
import { TripRating } from '@/components/Actividades/UI/TripRating';
import { useBackendAuth } from '@/context/BackendAuthContext';
import UserSafePointsDisplay from '@/components/Cupos/UserSafePointsDisplay';
import { TicketModal, BookingDetailsModal, ChatModal } from '@/components/Cupos/Modals';


interface CuposProps {}

type PassengerLite = {
  passenger_id: number;
  full_name: string;
  identification_number: string;
};

type BookingConductor = {
  booking_id: number;
  booking_date: string | null;
  booking_status: string | null;
  total_price: number;
  trip_id: number;
  user_id: string;
  seats_booked: number;
  booking_qr: string;
  driver_id: string;
  driver_name: string; // Para mostrar el nombre del conductor en la UI
  passengers: PassengerLite[];
};


const Cupos: React.FC<CuposProps> = () => {
  const { user } = useBackendAuth();
  const [bookings, setBookings] = useState<BookingConductor[]>([]);
  const [loading, setLoading] = useState(true);

  const [ratingModal, setRatingModal] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  // Estados para los nuevos modales
  const [ticketModalOpened, setTicketModalOpened] = useState(false);
  const [bookingDetailsModalOpened, setBookingDetailsModalOpened] = useState(false);
  const [chatModalOpened, setChatModalOpened] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [selectedChatTripId, setSelectedChatTripId] = useState<number | null>(null);

  // Estados para el modal de cancelación
  const [cancelModalOpened, setCancelModalOpened] = useState(false);
  const [selectedCancelBookingId, setSelectedCancelBookingId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Obtener userId del contexto de autenticación
  const userId = user?.id || '';

  // Función para cargar las reservas (extraída para reutilizar)
  const fetchBookings = async () => {
    setLoading(true);
    
    // Timeout de seguridad para evitar carga infinita
    const timeoutId = setTimeout(() => {
      console.warn(`⏰ [Cupos] Fetch timeout reached, using empty state`);
      setLoading(false);
      setBookings([]);
      showNotification({
        title: 'Tiempo de carga agotado',
        message: 'No se pudieron cargar los cupos en este momento. Intenta refrescar la página.',
        color: 'yellow',
      });
    }, 15000); // 15 segundos máximo
    
    try {
        console.log(`🎫 [Cupos] Fetching user cupos for userId: ${userId}`);
        
        const result = await getMisCupos();
        
        // Limpiar timeout si la respuesta llegó a tiempo
        clearTimeout(timeoutId);
        
        console.log(`📋 [Cupos] getMisCupos result:`, result);
        
        if (result.success && result.data) {
          console.log(`✅ [Cupos] Successfully fetched cupos`);
          
          // Validar que cupos sea un array
          const cuposArray = Array.isArray(result.data.cupos) ? result.data.cupos : [];
          
          if (cuposArray.length === 0) {
            console.log(`📭 [Cupos] No cupos found for user`);
            setBookings([]);
            
            showNotification({
              title: 'Sin cupos comprados',
              message: 'Aún no has comprado ningún cupo para viajes.',
              color: 'blue',
            });
            
            return;
          }
          
          const mappedBookings = cuposArray.map((cupo) => {
            // Verificar estructura de datos con valores por defecto
            const tripData = cupo.trip || {};
            const driverData = (tripData as any).driver || {};
            const passengersData = Array.isArray(cupo.passengers) ? cupo.passengers : [];
            
            // Log específico para trip_id debugging
            console.log('🔍 [Cupos] Processing cupo:', cupo.id, {
              rawTripId: cupo.trip_id,
              tripIdType: typeof cupo.trip_id,
              tripIdIsNull: cupo.trip_id === null,
              tripIdIsUndefined: cupo.trip_id === undefined,
              tripData: tripData,
              hasTripData: !!tripData && Object.keys(tripData).length > 0
            });
            
            // Log completo de la estructura de datos para debugging
            console.log('🔍 [Cupos] Full cupo data structure for trip:', cupo.trip_id, {
              fullCupo: cupo,
              tripData,
              driverData,
              possibleDriverFields: Object.keys(driverData),
              tripDataKeys: Object.keys(tripData),
              // Log específico de campos relevantes
              tripData_user_id: (tripData as any)?.user_id,
              driverData_user_id: (driverData as any)?.user_id,
              driverData_id: (driverData as any)?.id,
              // Estructura JSON completa para debugging
              fullTripDataJSON: JSON.stringify(tripData, null, 2),
              fullDriverDataJSON: JSON.stringify(driverData, null, 2)
            });
            
            // Múltiples intentos para extraer el driver_id correcto
            // Siguiendo las instrucciones del backend: usar trip.user_id como primera opción
            let extractedDriverId = 'unknown';
            
            // Opción 1: user_id desde tripData (ID del conductor desde la tabla trips) - PRIORIDAD PRINCIPAL
            if ((tripData as any).user_id && (tripData as any).user_id !== 'unknown') {
              extractedDriverId = (tripData as any).user_id;
              console.log('✅ [Cupos] Found driver_id from tripData.user_id (CORRECTO):', extractedDriverId);
            }
            // Opción 2: user_id desde driverData (ID del conductor desde user_profiles)
            else if ((driverData as any).user_id && (driverData as any).user_id !== 'unknown') {
              extractedDriverId = (driverData as any).user_id;
              console.log('✅ [Cupos] Found driver_id from driverData.user_id (BACKUP):', extractedDriverId);
            }
            else {
              console.error('❌ [Cupos] CRITICAL: Could not find valid driver_id for trip:', cupo.trip_id);
              console.error('❌ [Cupos] tripData.user_id:', (tripData as any)?.user_id);
              console.error('❌ [Cupos] driverData.user_id:', (driverData as any)?.user_id);
              console.error('❌ [Cupos] Full trip structure:', tripData);
              console.error('❌ [Cupos] Full driver structure:', driverData);
              
              // Si no encontramos un driver_id válido, este cupo no se podrá calificar
              extractedDriverId = 'unknown';
            }
            
            // Log para debugging
            console.log('🔍 [Cupos] Final extraction result for trip:', cupo.trip_id, {
              extractedDriverId,
              isValidDriverId: extractedDriverId !== 'unknown',
              driverName: driverData.first_name ? `${driverData.first_name} ${driverData.last_name || ''}`.trim() : 'Conductor no disponible'
            });
            
            // Extraer trip_id de manera inteligente
            let extractedTripId = cupo.trip_id; // Intentar primero el campo directo
            
            // Si trip_id es undefined/null pero tenemos datos de trip, usar trip.id
            if (!extractedTripId && tripData && (tripData as any).id) {
              extractedTripId = (tripData as any).id;
              console.log('🔧 [Cupos] Using trip.id as fallback for trip_id:', extractedTripId);
            }
            
            console.log('🔍 [Cupos] Final trip_id resolution:', {
              originalTripId: cupo.trip_id,
              extractedTripId: extractedTripId,
              tripDataId: (tripData as any)?.id,
              willUse: extractedTripId
            });
            
            return {
              booking_id: cupo.id || 0,
              booking_date: cupo.booking_date || new Date().toISOString(),
              booking_status: cupo.booking_status || 'unknown',
              total_price: cupo.total_price || 0,
              trip_id: extractedTripId, // Usar el trip_id extraído de manera inteligente
              user_id: userId,
              seats_booked: cupo.seats_booked || 1,
              booking_qr: cupo.booking_qr || '',
              // Usar el driver_id extraído
              driver_id: extractedDriverId,
              // Para mostrar el nombre del conductor en la UI, agregamos un campo separado
              driver_name: driverData.first_name 
                ? `${driverData.first_name} ${driverData.last_name || ''}`.trim()
                : 'Conductor no disponible',
              passengers: passengersData.map((passenger) => ({
                passenger_id: passenger.id || 0,
                full_name: passenger.full_name || 'Sin nombre',
                identification_number: passenger.identification_number || 'Sin ID',
              })),
            };
          });
          
          console.log(`✅ [Cupos] Mapped ${mappedBookings.length} bookings`);
          setBookings(mappedBookings);
          
          showNotification({
            title: 'Cupos cargados',
            message: `Se encontraron ${mappedBookings.length} cupos comprados.`,
            color: 'green',
          });
          
        } else {
          console.warn(`⚠️ [Cupos] Error or no success:`, result.error);
          
          // Si hay error pero no es crítico, mostrar array vacío
          setBookings([]);
          
          // Mostrar mensaje apropiado
          if (result.error?.includes('Sesión expirada')) {
            showNotification({
              title: 'Sesión expirada',
              message: 'Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.',
              color: 'red',
            });
          } else if (result.error?.includes('permisos')) {
            showNotification({
              title: 'Sin permisos',
              message: 'No tienes permisos para ver los cupos.',
              color: 'red',
            });
          } else {
            showNotification({
              title: 'Sin cupos disponibles',
              message: 'No se encontraron cupos comprados en este momento.',
              color: 'blue',
            });
          }
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error(`❌ [Cupos] Unexpected error:`, error);
        
        setBookings([]);
        showNotification({
          title: 'Error inesperado',
          message: 'Ocurrió un error al cargar los cupos. Intenta nuevamente.',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      if (userId) {
        fetchBookings();
      } else {
        console.warn(`⚠️ [Cupos] No userId provided`);
        setLoading(false);
        setBookings([]);
      }
    }, [userId]);

  if (loading) {
    return (
      <Container className={styles.container}>
        <LoadingOverlay visible />
        <Title className={styles.title}>Mis Cupos</Title>
        <Text className={styles.noTripsText}>Cargando tus cupos...</Text>
      </Container>
    );
  }
  

  const openRatingModal = (tripId: number, driverId: string) => {
    setSelectedTripId(tripId);
    setSelectedDriverId(driverId);
    setRatingModal(true);
  };

  // Función para abrir el modal de cancelación
  const handleCancelBooking = (bookingId: number) => {
    setSelectedCancelBookingId(bookingId);
    setCancelModalOpened(true);
  };

  // Función para confirmar la cancelación
  const confirmCancelBooking = async () => {
    if (!selectedCancelBookingId) return;

    setIsCancelling(true);
    try {
      console.log('🚫 [Cupos] Cancelando reserva:', selectedCancelBookingId);
      
      const response = await cancelBooking(selectedCancelBookingId);

      if (response.success) {
        showNotification({
          title: '¡Reserva cancelada!',
          message: response.message || 'Tu reserva ha sido cancelada exitosamente.',
          color: 'green',
        });

        // 🔄 Refrescar los datos para mostrar el estado actualizado
        console.log(`🔄 [Cupos] Refreshing bookings after successful cancellation`);
        
        await fetchBookings();
        
      } else {
        throw new Error(response.error || 'Error al cancelar la reserva');
      }
    } catch (error) {
      console.error('❌ [Cupos] Error cancelando reserva:', error);
      showNotification({
        title: 'Error',
        message: error instanceof Error ? error.message : 'No se pudo cancelar la reserva. Intenta nuevamente.',
        color: 'red',
      });
    } finally {
      setIsCancelling(false);
      setCancelModalOpened(false);
      setSelectedCancelBookingId(null);
    }
  };


  return (
    <Container className={styles.container}>
      <Title className={styles.title}>Mis Cupos Comprados</Title>
      {selectedTripId && selectedDriverId && (
        <TripRating
          key={`${selectedTripId}-${selectedDriverId}`} 
          opened={ratingModal}
          onClose={() => setRatingModal(false)}
          tripId={selectedTripId}
          driverId={selectedDriverId}
          userId={userId}
        />
      )}

      {/* Modales para Ticket y Detalles */}
      <TicketModal
        opened={ticketModalOpened}
        onClose={() => setTicketModalOpened(false)}
        bookingId={selectedBookingId}
      />
      
      <BookingDetailsModal
        opened={bookingDetailsModalOpened}
        onClose={() => setBookingDetailsModalOpened(false)}
        bookingId={selectedBookingId}
      />

      {/* Modal de Chat */}
      <ChatModal
        opened={chatModalOpened}
        onClose={() => setChatModalOpened(false)}
        tripId={selectedChatTripId || 0}
        bookingId={selectedBookingId}
      />

      {/* Modal de Cancelación */}
      <Modal
        opened={cancelModalOpened}
        onClose={() => setCancelModalOpened(false)}
        title="Cancelar Reserva"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text>
            ¿Estás seguro de que deseas cancelar esta reserva?
          </Text>
          <Text size="sm" c="dimmed">
            Esta acción no se puede deshacer. Se te reembolsará el dinero según las políticas de cancelación.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button
              variant="light"
              onClick={() => setCancelModalOpened(false)}
              disabled={isCancelling}
            >
              No, mantener reserva
            </Button>
            <Button
              color="red"
              onClick={confirmCancelBooking}
              loading={isCancelling}
            >
              Sí, cancelar reserva
            </Button>
          </Group>
        </Stack>
      </Modal>

      {bookings.length === 0 ? (
        <Text className={styles.noTripsText}>Aún no has comprado ningún cupo.</Text>
      ) : (
        <Stack gap="xl">
          {bookings.map((booking) => (
            <Card
              key={booking.booking_id}
              className={styles.cupoCard}
              style={{
                borderRadius: '12px',
                marginBottom: '15px',
                background: 'linear-gradient(145deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
                border: '1px solid rgba(0, 255, 157, 0.1)',
                boxShadow: '0 4px 10px rgba(0, 255, 157, 0.05)',
              }}
            >
              <Stack gap="xs">
                <Group gap="apart">
                  <Text fw={600} style={{ color: '#ddd' }}>Fecha de reserva:</Text>
                  <Text style={{ color: '#fff' }}>{dayjs(booking.booking_date).format('DD/MM/YYYY HH:mm')}</Text>
                </Group>
                <Group gap="apart">
                  <Text fw={600} style={{ color: '#ddd' }}>Estado del viaje:</Text>
                  <Text 
                    style={{ 
                      color: booking.booking_status === 'completed' ? '#34D399' : 
                             booking.booking_status === 'confirmed' ? '#3B82F6' :
                             booking.booking_status === 'pending' ? '#F59E0B' : '#fff'
                    }}
                  >
                    {booking.booking_status === 'completed' ? 'Completado ✓' : 
                     booking.booking_status === 'confirmed' ? 'Confirmado' :
                     booking.booking_status === 'pending' ? 'Pendiente' : booking.booking_status}
                  </Text>
                </Group>
                <Group gap="apart">
                  <Text fw={600} style={{ color: '#ddd' }}>Precio Total:</Text>
                  <Text style={{ color: '#fff' }}>${booking.total_price.toLocaleString()}</Text>
                </Group>

                {/* Componente de SafePoints del usuario */}
                <UserSafePointsDisplay bookingId={booking.booking_id} />

                <Group gap="apart">
                  <Button
                    size="xs"
                    onClick={() => {
                      console.log('🔍 [Cupos] Opening BookingDetailsModal with booking_id:', booking.booking_id);
                      setSelectedBookingId(booking.booking_id.toString());
                      setBookingDetailsModalOpened(true);
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#34D399',
                      borderRadius: '6px',
                      border: '1px solid #34D399',
                      padding: '5px 10px',
                    }}
                  >
                    Ver Detalles
                  </Button>
                  <Button
                    size="xs"
                    onClick={() => {
                      console.log('🎫 [Cupos] Opening TicketModal for booking:', booking.booking_id);
                      setSelectedBookingId(booking.booking_id.toString());
                      setTicketModalOpened(true);
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#34D399',
                      borderRadius: '6px',
                      border: '1px solid #34D399',
                      padding: '5px 10px',
                    }}
                  >
                    Ver Ticket
                  </Button>
                  <Button
                    size="xs"
                    onClick={() => {
                      console.log('� [Cupos] Opening Chat Modal - Full booking data:', booking);
                      console.log('� [Cupos] trip_id:', booking.trip_id);
                      console.log('� [Cupos] trip_id type:', typeof booking.trip_id);
                      console.log('� [Cupos] trip_id is null?', booking.trip_id === null);
                      console.log('� [Cupos] trip_id is undefined?', booking.trip_id === undefined);
                      
                      if (!booking.trip_id || booking.trip_id === null || booking.trip_id === undefined || booking.trip_id === 0) {
                        console.error('❌ [Cupos] trip_id is invalid:', booking.trip_id);
                        console.error('❌ [Cupos] Full booking data for debugging:', booking);
                        showNotification({
                          title: 'Error',
                          message: `No se encontró información del viaje para acceder al chat. Booking ID: ${booking.booking_id}`,
                          color: 'red',
                        });
                        return;
                      }
                      
                      // Abrir el modal de chat
                      console.log('🚀 [CUPOS] CHAT BUTTON CLICKED - SETTING STATES');
                      console.log('🚀 [CUPOS] Trip ID:', booking.trip_id);
                      console.log('🚀 [CUPOS] Booking ID:', booking.booking_id);
                      setSelectedChatTripId(booking.trip_id);
                      setSelectedBookingId(booking.booking_id.toString());
                      setChatModalOpened(true);
                      console.log('🚀 [CUPOS] MODAL SHOULD BE OPENING NOW!');
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#34D399',
                      borderRadius: '6px',
                      border: '1px solid #34D399',
                      padding: '5px 10px',
                    }}
                  >
                    Chat del Viaje
                  </Button>
                  
                  {/* Botón de cancelar - solo para reservas que se pueden cancelar */}
                  {(booking.booking_status === 'pending' || booking.booking_status === 'confirmed') && (
                    <Button
                      size="xs"
                      onClick={() => {
                        console.log('🚫 [Cupos] Cancel button clicked for booking:', booking.booking_id);
                        handleCancelBooking(booking.booking_id);
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#EF4444',
                        borderRadius: '6px',
                        border: '1px solid #EF4444',
                        padding: '5px 10px',
                      }}
                    >
                      Cancelar Reserva
                    </Button>
                  )}
                  
                  {booking.booking_status === 'completed' && (
                    <Button
                      size="xs"
                      onClick={() => {
                        console.log('⭐ [Cupos] Rating button clicked for booking:', booking.booking_id);
                        console.log('⭐ [Cupos] trip_id:', booking.trip_id, 'driver_id:', booking.driver_id);
                        
                        if (booking.trip_id && booking.trip_id !== 0 && booking.driver_id && booking.driver_id !== 'unknown') {
                          console.log('✅ [Cupos] Opening rating modal');
                          openRatingModal(booking.trip_id, booking.driver_id);
                        } else {
                          console.warn('⚠️ [Cupos] Cannot rate - missing data:', {
                            trip_id: booking.trip_id,
                            driver_id: booking.driver_id
                          });
                          showNotification({
                            title: 'No disponible',
                            message: 'No se puede calificar este viaje porque faltan datos del conductor o viaje.',
                            color: 'yellow',
                          });
                        }
                      }}
                      variant="filled"
                      color={booking.driver_id === 'unknown' ? 'gray' : 'yellow'}
                      disabled={booking.driver_id === 'unknown'}
                    >
                      {booking.driver_id === 'unknown' ? 'No disponible' : 'Calificar viaje'}
                    </Button>
                  )}
                        
                </Group>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
};

export const Route = createFileRoute('/Cupos/')({
  component: Cupos,
});

export default Cupos;

