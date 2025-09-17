import React, { useState, useEffect } from 'react';
import {
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
import { useBackendAuth } from '@/context/BackendAuthContext';
import UserSafePointsDisplay from '@/components/Cupos/UserSafePointsDisplay';

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
  driver_name: string;
  passengers: PassengerLite[];
};

const CuposContent: React.FC = () => {
  const { user } = useBackendAuth();
  const [bookings, setBookings] = useState<BookingConductor[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [ratingModal, setRatingModal] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  const userId = user?.id || '';

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      
      const timeoutId = setTimeout(() => {
        console.warn(`⏰ [CuposContent] Fetch timeout reached, using empty state`);
        setLoading(false);
        setBookings([]);
        showNotification({
          title: 'Tiempo de carga agotado',
          message: 'No se pudieron cargar los cupos en este momento. Intenta refrescar la página.',
          color: 'yellow',
        });
      }, 15000);
      
      try {
        console.log(`🎫 [CuposContent] Fetching user cupos for userId: ${userId}`);
        
        const result = await getMisCupos();
        clearTimeout(timeoutId);
        
        console.log(`📋 [CuposContent] getMisCupos result:`, result);
        
        if (result.success && result.data) {
          console.log(`✅ [CuposContent] Successfully fetched cupos`);
          
          const cuposArray = Array.isArray(result.data.cupos) ? result.data.cupos : [];
          
          if (cuposArray.length === 0) {
            console.log(`📭 [CuposContent] No cupos found for user`);
            setBookings([]);
            return;
          }
          
          const mappedBookings = cuposArray.map((cupo) => {
            const tripData = cupo.trip || {};
            const driverData = (tripData as any).driver || {};
            const passengersData = Array.isArray(cupo.passengers) ? cupo.passengers : [];
            
            let extractedDriverId = 'unknown';
            
            if ((tripData as any).user_id && (tripData as any).user_id !== 'unknown') {
              extractedDriverId = (tripData as any).user_id;
            } else if ((driverData as any).user_id && (driverData as any).user_id !== 'unknown') {
              extractedDriverId = (driverData as any).user_id;
            }
            
            let extractedTripId = cupo.trip_id;
            
            if (!extractedTripId && tripData && (tripData as any).id) {
              extractedTripId = (tripData as any).id;
            }
            
            return {
              booking_id: cupo.id || 0,
              booking_date: cupo.booking_date || new Date().toISOString(),
              booking_status: cupo.booking_status || 'unknown',
              total_price: cupo.total_price || 0,
              trip_id: extractedTripId,
              user_id: userId,
              seats_booked: cupo.seats_booked || 1,
              booking_qr: cupo.booking_qr || '',
              driver_id: extractedDriverId,
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
          
          console.log(`✅ [CuposContent] Mapped ${mappedBookings.length} bookings`);
          setBookings(mappedBookings);
          
        } else {
          console.warn(`⚠️ [CuposContent] Error or no success:`, result.error);
          setBookings([]);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error(`❌ [CuposContent] Unexpected error:`, error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchBookings();
    } else {
      console.warn(`⚠️ [CuposContent] No userId provided`);
      setLoading(false);
      setBookings([]);
    }
  }, [userId]);

  const openRatingModal = (tripId: number, driverId: string) => {
    setSelectedTripId(tripId);
    setSelectedDriverId(driverId);
    setRatingModal(true);
  };

  if (loading) {
    return (
      <>
        <LoadingOverlay visible />
        <Text style={{ color: '#ddd', textAlign: 'center', margin: '2rem 0' }}>
          Cargando tus cupos...
        </Text>
      </>
    );
  }

  return (
    <>
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
        <Text style={{ color: '#ddd', textAlign: 'center', margin: '2rem 0' }}>
          Aún no has comprado ningún cupo.
        </Text>
      ) : (
        <Stack gap="xl">
          {bookings.map((booking) => (
            <Card
              key={booking.booking_id}
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

                <UserSafePointsDisplay bookingId={booking.booking_id} />

                <Group gap="apart">
                  <Button
                    size="xs"
                    onClick={() => {
                      console.log('🔍 [CuposContent] Navigating to ViewBookingDetails with booking_id:', booking.booking_id);
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
                      console.log('🎫 [CuposContent] Navigating to ViewTicket for booking:', booking.booking_id);
                      
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
                      console.log('🚗 [CuposContent] Navigating to Chat - booking data:', booking);
                      
                      if (!booking.trip_id || booking.trip_id === null || booking.trip_id === undefined || booking.trip_id === 0) {
                        console.error('❌ [CuposContent] trip_id is invalid:', booking.trip_id);
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
                        console.log('⭐ [CuposContent] Rating button clicked for booking:', booking.booking_id);
                        
                        if (booking.trip_id && booking.trip_id !== 0 && booking.driver_id && booking.driver_id !== 'unknown') {
                          console.log('✅ [CuposContent] Opening rating modal');
                          openRatingModal(booking.trip_id, booking.driver_id);
                        } else {
                          console.warn('⚠️ [CuposContent] Cannot rate - missing data:', {
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
    </>
  );
};

export default CuposContent;
