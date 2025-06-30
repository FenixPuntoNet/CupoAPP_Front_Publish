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
import { supabase } from '@/lib/supabaseClient';
import { TripRating } from '@/components/Actividades/TripRating';


interface CuposProps {
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
  trip_id: number;
  user_id: string;
  seats_booked: number;
  booking_qr: string;
  driver_id: string;
  passengers: PassengerLite[];
};


const Cupos: React.FC<CuposProps> = ({ userId }) => {
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
        // 1. Obtener las reservas
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            id,
            booking_date,
            booking_status,
            total_price,
            trip_id,
            user_id,
            seats_booked,
            booking_qr,
            booking_passengers(id, full_name, identification_number),
            trips(user_id)
          `)              
          .eq('user_id', userId);
    
        if (bookingsError) throw bookingsError;
    
        const mappedBookings = bookingsData.map((booking) => ({
          booking_id: booking.id,
          booking_date: booking.booking_date,
          booking_status: booking.booking_status,
          total_price: booking.total_price,
          trip_id: booking.trip_id ?? 0,
          user_id: booking.user_id || '',
          seats_booked: booking.seats_booked || 0,
          booking_qr: booking.booking_qr || '',
          driver_id: booking.trips?.user_id || '',
          passengers: (booking.booking_passengers || []).map((passenger) => ({
            passenger_id: passenger.id,
            full_name: passenger.full_name,
            identification_number: passenger.identification_number,
          })),
        }));
    
        setBookings(mappedBookings as BookingConductor[]);
    
      } catch (error) {
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
                        search: { trip_id: booking.trip_id ? booking.trip_id.toString() : '' }, // Pasamos trip_id al Chat
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
                  <Button
                    size="xs"
                    onClick={() => {
                      if (booking.trip_id && booking.driver_id) {
                        openRatingModal(booking.trip_id, booking.driver_id);
                      }
                    }}
                    variant="filled"
                    color="yellow"
                  >
                    Calificar viaje
                  </Button>
                        
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

