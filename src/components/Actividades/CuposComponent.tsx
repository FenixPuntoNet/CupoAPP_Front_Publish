import React, { useState, useEffect } from 'react';
import {
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
import { useNavigate } from '@tanstack/react-router';
import { getMisCupos } from '@/services/cupos';
import { TripRating } from './TripRating';
import styles from '../../routes/Cupos/index.module.css';

interface CuposComponentProps {
  userId: string;
}

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
  trip_id: number | null; // Permitir null
  user_id: string;
  seats_booked: number;
  booking_qr: string;
  driver_id: string;
  driver_name: string;
  passengers: PassengerLite[];
};

const CuposComponent: React.FC<CuposComponentProps> = ({ userId }) => {
  const [bookings, setBookings] = useState<BookingConductor[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [ratingModal, setRatingModal] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        console.log('🎫 [CuposComponent] Fetching bookings...');
        const result = await getMisCupos();
        
        console.log('🎫 [CuposComponent] getMisCupos result:', result);
        
        if (result.success && result.data) {
          console.log('🎫 [CuposComponent] Raw cupos data:', result.data.cupos);
          
          const mappedBookings = result.data.cupos.map((cupo) => {
            console.log('🎫 [CuposComponent] Processing cupo:', cupo);
            console.log('🎫 [CuposComponent] Trip data in cupo:', cupo.trip);
            console.log('🎫 [CuposComponent] Driver data in cupo:', cupo.trip?.driver);
            console.log('🎫 [CuposComponent] cupo.trip_id:', cupo.trip_id);
            console.log('🎫 [CuposComponent] cupo.trip?.id:', cupo.trip?.id);
            console.log('🎫 [CuposComponent] cupo.trip?.user_id:', cupo.trip?.user_id);
            console.log('🎫 [CuposComponent] Cupo keys:', Object.keys(cupo));
            console.log('🎫 [CuposComponent] Trip keys:', cupo.trip ? Object.keys(cupo.trip) : 'Trip is null');
            console.log('🔍 [CuposComponent] FULL CUPO OBJECT:', JSON.stringify(cupo, null, 2));
            
            const mappedBooking = {
              booking_id: cupo.id,
              booking_date: cupo.booking_date,
              booking_status: cupo.booking_status,
              total_price: cupo.total_price,
              trip_id: cupo.trip_id || cupo.trip?.id || null, // Fallback al ID del trip si trip_id no existe
              user_id: userId,
              seats_booked: cupo.seats_booked,
              booking_qr: cupo.booking_qr,
              // Obtener driver_id correctamente del trip
              driver_id: cupo.trip?.user_id || 'unknown',
              driver_name: cupo.trip?.driver?.first_name ? `${cupo.trip.driver.first_name} ${cupo.trip.driver.last_name}` : 'Driver not available',
              passengers: cupo.passengers.map((passenger) => ({
                passenger_id: passenger.id,
                full_name: passenger.full_name,
                identification_number: passenger.identification_number,
              })),
            };
            
            console.log('🎫 [CuposComponent] Mapped booking:', mappedBooking);
            return mappedBooking;
          });
          
          console.log('🎫 [CuposComponent] Mapped bookings:', mappedBookings);
          setBookings(mappedBookings);
        } else {
          console.error('❌ [CuposComponent] Error fetching cupos:', result.error);
        }
      } catch (error) {
        console.error('❌ [CuposComponent] Exception:', error);
        showNotification({
          title: 'Error al obtener los datos',
          message: 'Hubo un problema al cargar tus reservas o calificaciones.',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookings();
  }, [userId]);

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingOverlay visible />
        <Title className={styles.title}>Mis Cupos</Title>
        <Text className={styles.noTripsText}>Cargando tus cupos...</Text>
      </div>
    );
  }

  const openRatingModal = (tripId: number, driverId: string) => {
    setSelectedTripId(tripId);
    setSelectedDriverId(driverId);
    setRatingModal(true);
  };

  return (
    <div className={styles.container}>
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
                  <Text style={{ color: '#fff' }}>{booking.booking_status}</Text>
                </Group>
                <Group gap="apart">
                  <Text fw={600} style={{ color: '#ddd' }}>Precio Total:</Text>
                  <Text style={{ color: '#fff' }}>${booking.total_price.toLocaleString()}</Text>
                </Group>
                <Group gap="apart">
                  <Button
                    size="xs"
                    onClick={() =>
                      navigate({
                        to: '/Cupos/ViewBookingDetails',
                        search: { booking_id: booking.booking_id.toString() },
                      })
                    }
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
                      const passenger = booking.passengers?.[0];
                      if (!passenger) {
                        showNotification({
                          title: 'Error',
                          message: 'No se encontró pasajero asociado a esta reserva.',
                          color: 'red',
                        });
                        return;
                      }
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
                    onClick={() =>
                      navigate({
                        to: '/Chat',
                        search: { trip_id: booking.trip_id ? booking.trip_id.toString() : '' },
                      })
                    }
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
                  {/* Botón de calificar - solo para viajes completados y con driver_id válido */}
                  {booking.booking_status === 'completed' && booking.driver_id && booking.driver_id !== 'unknown' && (
                    <Button
                      size="xs"
                      onClick={() => {
                        console.log('⭐ [CuposComponent] Rating button clicked:', {
                          trip_id: booking.trip_id,
                          driver_id: booking.driver_id,
                          driver_name: booking.driver_name,
                          booking_id: booking.booking_id,
                          booking_status: booking.booking_status
                        });
                        
                        // Validación más estricta de los IDs
                        const tripId = booking.trip_id;
                        const driverId = booking.driver_id;
                        
                        if (!tripId || tripId === null || tripId === 0) {
                          console.error('❌ [CuposComponent] Missing or invalid trip_id for rating:', tripId);
                          showNotification({
                            title: 'Error',
                            message: 'No se puede calificar este viaje. ID del viaje no disponible.',
                            color: 'red',
                          });
                          return;
                        }
                        
                        if (!driverId || driverId === null || driverId === '') {
                          console.error('❌ [CuposComponent] Missing or invalid driver_id for rating:', driverId);
                          showNotification({
                            title: 'Error',
                            message: 'No se puede calificar este viaje. Información del conductor no disponible.',
                            color: 'red',
                          });
                          return;
                        }
                        
                        if (driverId === 'unknown') {
                          console.error('❌ [CuposComponent] Driver ID is unknown:', {
                            cupo_keys: Object.keys(booking),
                            trip_data: booking,
                          });
                          showNotification({
                            title: 'Error',
                            message: 'No se puede identificar al conductor de este viaje. Por favor contacta soporte.',
                            color: 'red',
                          });
                          return;
                        }
                        
                        openRatingModal(tripId, driverId);
                      }}
                      variant="filled"
                      color="yellow"
                    >
                      Calificar viaje
                    </Button>
                  )}
                  
                  {/* Mensaje informativo para viajes no completados */}
                  {booking.booking_status !== 'completed' && (
                    <Text size="sm" style={{ color: '#888', fontStyle: 'italic' }}>
                      Podrás calificar este viaje una vez que esté completado
                    </Text>
                  )}
                  
                  {/* Mensaje informativo para viajes completados sin información del conductor */}
                  {booking.booking_status === 'completed' && (!booking.driver_id || booking.driver_id === 'unknown') && (
                    <Text size="sm" style={{ color: '#ff8c00', fontStyle: 'italic' }}>
                      Información del conductor no disponible para calificar
                    </Text>
                  )}
                </Group>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}
    </div>
  );
};

export default CuposComponent;
