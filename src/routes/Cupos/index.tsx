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
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import dayjs from 'dayjs';
import styles from './index.module.css';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { getMisCupos } from '@/services/cupos';
import { TripRating } from '@/components/Actividades/TripRating';
import { useBackendAuth } from '@/context/BackendAuthContext';


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
  const navigate = useNavigate();
  const [ratingModal, setRatingModal] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  // Obtener userId del contexto de autenticación
  const userId = user?.id || '';


  useEffect(() => {
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
                <Group gap="apart">
                  <Button
                    size="xs"
                    onClick={() => {
                      console.log('🔍 [Cupos] Navigating to ViewBookingDetails with booking_id:', booking.booking_id);
                      navigate({
                        to: '/Cupos/ViewBookingDetails',
                        search: { booking_id: booking.booking_id.toString() },
                      });
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
                      // Simplemente navegar sin verificar pasajeros ya que ViewTicket lo manejará
                      console.log('🎫 [Cupos] Navigating to ViewTicket for booking:', booking.booking_id);
                      console.log('🔍 [Cupos] Booking data:', booking);
                      console.log('🔍 [Cupos] Passengers data:', booking.passengers);
                      
                      navigate({
                        to: '/Cupos/ViewTicket',
                        search: {
                          booking_id: booking.booking_id.toString(),
                        },
                      });
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
                      console.log('🚗 [Cupos] Navigating to Chat - Full booking data:', booking);
                      console.log('🚗 [Cupos] trip_id:', booking.trip_id);
                      console.log('🚗 [Cupos] trip_id type:', typeof booking.trip_id);
                      console.log('🚗 [Cupos] trip_id is null?', booking.trip_id === null);
                      console.log('🚗 [Cupos] trip_id is undefined?', booking.trip_id === undefined);
                      
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
                      
                      navigate({
                        to: '/Chat',
                        search: { trip_id: booking.trip_id.toString() },
                      });
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#34D399',
                      borderRadius: '6px',
                      border: '1px solid #34D399',
                      padding: '5px 10px',
                    }}
                  >
                    Ir al Chat
                  </Button>
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

