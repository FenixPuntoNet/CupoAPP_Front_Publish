import { useEffect, useState } from 'react';
import { Card, Stack, Text, List, Button, Group, LoadingOverlay, Container } from '@mantine/core';
import styles from './ViewPassengers.module.css';
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { Booking } from '../../components/Cupos/types';
import { getTicketDetails } from '@/services/tickets';

const ViewPassengers = () => {
    const navigate = useNavigate();
    const { booking_id } = useSearch({ from: Route.id });
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBookingData = async () => {
            if (!booking_id) {
                setError('No se proporcionó ID de reserva');
                setLoading(false);
                return;
            }

            try {
                console.log('🎫 [ViewPassengers] Fetching ticket details for booking:', booking_id);
                const result = await getTicketDetails(booking_id);
                
                if (result.success && result.data && result.data.ticket) {
                    const { ticket } = result.data;
                    console.log('✅ [ViewPassengers] Ticket data received:', ticket);
                    
                    // Convertir los datos del ticket al formato esperado por Booking
                    const bookingData: Booking = {
                        booking_id: ticket.booking.id,
                        trip_id: ticket.trip.id,
                        user_id: null, // No disponible en el ticket
                        seats_booked: ticket.booking.seats_booked,
                        booking_date: ticket.booking.booking_date,
                        total_price: ticket.booking.total_price,
                        booking_status: ticket.booking.booking_status,
                        booking_qr: ticket.booking.booking_qr,
                        passengers: ticket.passengers.map(p => ({
                            passenger_id: p.id,
                            full_name: p.full_name,
                            identification_number: p.identification_number,
                            booking_qr: ticket.booking.booking_qr,
                            status_passenger: p.status,
                            payment_id: 0,
                            payment_date: '',
                            payment_method: '',
                            amount: '',
                            payment_status: '',
                            booking_id: ticket.booking.id,
                            seats_booked: ticket.booking.seats_booked,
                            booking_date: ticket.booking.booking_date,
                            total_price: ticket.booking.total_price.toString(),
                            booking_status: ticket.booking.booking_status,
                            booking_message: '',
                            user_id_booking: 0,
                            first_name_booking: '',
                            last_name_booking: '',
                            phone_number_booking: '',
                            user_type_booking: '',
                            trip_id: ticket.trip.id,
                            origin_id: 0,
                            destination_id: 0,
                            route_id: 0,
                            user_id: 0,
                            vehicle_id: 0,
                            date_time: ticket.trip.date_time,
                            seats: 0,
                            price_per_seat: '',
                            description: '',
                            allow_pets: ticket.trip.allow_pets ? 'true' : 'false',
                            allow_smoking: ticket.trip.allow_smoking ? 'true' : 'false',
                            status: ticket.trip.status,
                            created_at: '',
                            main_text_origen: ticket.trip.route.origin,
                            secondary_text_origen: '',
                            main_text_destination: ticket.trip.route.destination,
                            secondary_text_destination: '',
                            brand: ticket.vehicle.brand,
                            model: ticket.vehicle.model,
                            year: parseInt(ticket.vehicle.year),
                            plate: ticket.vehicle.plate,
                            color: ticket.vehicle.color,
                            body_type: '',
                            first_name: ticket.driver.name.split(' ')[0] || '',
                            last_name: ticket.driver.name.split(' ').slice(1).join(' ') || '',
                            phone_number: ticket.driver.phone,
                            user_type: '',
                            distance: ticket.trip.route.distance,
                            duration: ticket.trip.route.duration,
                            summary: ''
                        }))
                    };
                    
                    setBooking(bookingData);
                } else {
                    console.error('❌ [ViewPassengers] Error fetching ticket details:', result.error);
                    setError(result.error || 'Error al cargar los datos de la reserva');
                }
            } catch (err) {
                console.error('❌ [ViewPassengers] Error:', err);
                setError(err instanceof Error ? err.message : 'Error desconocido');
            } finally {
                setLoading(false);
            }
        };

        fetchBookingData();
    }, [booking_id]);

    // Verificar si no hay pasajeros en la reserva
    if (loading) {
        return (
            <Container>
                <LoadingOverlay visible />
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <Text c="red">{error}</Text>
                <Button onClick={() => navigate({ to: '/Cupos' })}>Volver</Button>
            </Container>
        );
    }

    if (!booking || !booking.passengers || booking.passengers.length === 0) {
        return (
            <Container>
                <Text>No se encontraron pasajeros para esta reserva</Text>
                <Button onClick={() => navigate({ to: '/Cupos' })}>Volver</Button>
            </Container>
        );
    }

    // Manejar la navegación al ticket de un pasajero específico
    const handleViewTicket = () => {
        // Navigate with booking_id as search parameter
        navigate({
            to: `/Cupos/ViewTicket`,
            search: { booking_id: booking?.booking_id?.toString() || '' }
        });
    };

    return (
        <Card className={styles.detailsCard} withBorder shadow="sm" style={{ padding: '20px', borderRadius: '12px', background: 'linear-gradient(145deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', border: '1px solid rgba(0, 255, 157, 0.1)', boxShadow:'0 4px 10px rgba(0, 255, 157, 0.05)' }}>
            <Stack gap="md">
                 <Text fw={700} size="xl" mb="md" ta="center" style={{color:'#fff', lineHeight: '1.3' }}>
                      Pasajeros
                </Text>
                <List type="ordered">
                    {booking.passengers.map((passenger) => (
                        <List.Item key={passenger.passenger_id} style={{ marginBottom: '10px', borderRadius: '8px',  overflow: 'hidden'}}>
                           <div style={{backgroundColor:'#222', padding: '10px', borderLeft: '4px solid #34D399'}}>
                               <Group justify="space-between" align="center" >
                                   <Stack style={{flex: 1}}>
                                      <Text fw={600}  style={{color:'#fff'}}>{passenger.full_name}</Text>
                                       <Text size="sm" style={{color:'#ddd'}}>Identificación: {passenger.identification_number}</Text>
                                        <Text size="xs" c="dimmed">QR: {passenger.booking_qr}</Text>
                                    </Stack>
                                    <Button size="xs" onClick={handleViewTicket} style={{
                                                backgroundColor: 'transparent',
                                                color: '#34D399',
                                                borderRadius: '6px',
                                                border: '1px solid #34D399',
                                                padding: '5px 10px',
                                                 transition: 'background-color 0.3s, color 0.3s',
                                                '&:hover': {
                                                    backgroundColor: '#34D399',
                                                    color: 'black'
                                                },
                                        }}>
                                        Ver Ticket
                                    </Button>
                                </Group>
                          </div>
                         </List.Item>
                    ))}
                </List>
               <Button onClick={() => navigate({ to: '/Cupos' })} mt="md" size="xs" fullWidth variant="outline"  style={{ borderRadius:'8px',  borderColor:'#ccc' , transition: 'background-color 0.3s, color 0.3s',  '&:hover': {
                    backgroundColor: '#f0f0f0',
                     color: '#333'
                  }}}>
                    Volver a Cupos
                </Button>
            </Stack>
        </Card>
    );
};

// Crear la ruta usando createFileRoute
export const Route = createFileRoute('/Cupos/ViewPassengers')({
    component: ViewPassengers,
    validateSearch: (search) => ({
        booking_id: String(search.booking_id ?? ''),
    }),
});

export default ViewPassengers;