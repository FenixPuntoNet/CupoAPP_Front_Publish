import {
  Card,
  Stack,
  Group,
  Text,
  Button,
  LoadingOverlay,
  Badge,
  Divider,
  Title,
  Container,
  Alert,
} from '@mantine/core';
import { useState, useEffect } from 'react';
import detailStyles from './ViewBookingDetails.module.css';
import dayjs from 'dayjs';
import { useNavigate, useSearch, createFileRoute } from '@tanstack/react-router';
import { getBookingDetails } from '@/services/reservas';

export const Route = createFileRoute('/Cupos/ViewBookingDetails')({
  component: ViewBookingDetails,
  validateSearch: (search) => ({
    booking_id: String(search.booking_id ?? ''),
  }),
});

function ViewBookingDetails() {
  const navigate = useNavigate();
  const { booking_id } = useSearch({ from: Route.id });

  const [tripDetails, setTripDetails] = useState<{
    main_text_origen: string;
    main_text_destination: string;
    date_time: string | null;
    driverName: string;
    loading: boolean;
    tripStatus: string;
    vehicle: {
      brand: string;
      model: string;
      year: number;
      plate: string;
      color: string;
    };
    bookingStatus: string;
    totalPrice: number;
    seatsBooked: number;
    tripDataMissing: boolean;
  }>({
    main_text_origen: '',
    main_text_destination: '',
    date_time: null,
    driverName: '',
    loading: true,
    tripStatus: '',
    vehicle: {
      brand: '',
      model: '',
      year: 0,
      plate: '',
      color: '',
    },
    bookingStatus: '',
    totalPrice: 0,
    seatsBooked: 0,
    tripDataMissing: false,
  });
  

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const response = await getBookingDetails(Number(booking_id));
        
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Error al obtener detalles de la reserva');
        }

        const bookingDetails = response.data;
        console.log('📋 [ViewBookingDetails] === BOOKING DETAILS DEBUG ===');
        console.log('📋 [ViewBookingDetails] Full booking response:', JSON.stringify(bookingDetails, null, 2));
        console.log('📋 [ViewBookingDetails] Booking ID:', bookingDetails.id);
        console.log('📋 [ViewBookingDetails] Booking Status:', bookingDetails.booking_status);
        console.log('📋 [ViewBookingDetails] Trip ID from booking:', bookingDetails.trip_id);
        console.log('📋 [ViewBookingDetails] Trip data exists?', !!bookingDetails.trip);
        
        if (bookingDetails.trip) {
          console.log('✅ [ViewBookingDetails] Trip data loaded successfully!');
          console.log('📋 [ViewBookingDetails] Trip details:', {
            id: bookingDetails.trip.id,
            status: bookingDetails.trip.status,
            date_time: bookingDetails.trip.date_time,
            origin: bookingDetails.trip.origin,
            destination: bookingDetails.trip.destination,
            driver: bookingDetails.trip.driver,
            vehicle: bookingDetails.trip.vehicle
          });
        } else {
          console.warn('⚠️ [ViewBookingDetails] Trip data is still null - backend may need more time');
        }
        
        console.log('📋 [ViewBookingDetails] Passengers data:', bookingDetails.passengers);
        console.log('📋 [ViewBookingDetails] === END BOOKING DETAILS DEBUG ===');
        
        setTripDetails({
          main_text_origen: bookingDetails.trip?.origin?.address || bookingDetails.trip?.origin?.main_text || 'Origen no disponible',
          main_text_destination: bookingDetails.trip?.destination?.address || bookingDetails.trip?.destination?.main_text || 'Destino no disponible',
          date_time: bookingDetails.trip?.date_time || null,
          driverName: bookingDetails.trip?.driver 
            ? `${bookingDetails.trip.driver.first_name} ${bookingDetails.trip.driver.last_name}` 
            : 'Conductor no disponible',
          loading: false,
          tripStatus: bookingDetails.trip?.status || 'Estado no disponible',
          vehicle: {
            brand: bookingDetails.trip?.vehicle?.brand || 'No disponible',
            model: bookingDetails.trip?.vehicle?.model || 'No disponible',
            year: bookingDetails.trip?.vehicle?.year || 0,
            plate: bookingDetails.trip?.vehicle?.plate || 'No disponible',
            color: bookingDetails.trip?.vehicle?.color || 'No disponible',
          },
          bookingStatus: bookingDetails.booking_status || 'No disponible',
          totalPrice: bookingDetails.total_price || 0,
          seatsBooked: bookingDetails.seats_booked || 0,
          tripDataMissing: !bookingDetails.trip,
        });
      } catch (error) {
        console.error('Error fetching booking details:', error);
        setTripDetails(prev => ({ ...prev, loading: false, tripDataMissing: true }));
      }
    };

    fetchBookingDetails();
  }, [booking_id]);

  return (
    <Container size="sm" className={detailStyles.detailsContainer}>
      <Card withBorder shadow="sm" radius="md" className={detailStyles.detailsCard}>
        <LoadingOverlay visible={tripDetails.loading} />
        <Stack gap="lg">
          <Title order={2} style={{ color: '#34D399', textAlign: 'center' }}>
            Detalles de tu Reserva
          </Title>

          {tripDetails.tripDataMissing && (
            <Alert color="blue" title="🔄 Cargando detalles del viaje">
              <Text>Los detalles completos del viaje se están cargando...</Text>
              <Text>Mientras tanto, puedes ver la información básica de tu reserva:</Text>
              <Text style={{ marginTop: '10px', fontWeight: 'bold' }}>
                ✅ Tu reserva está confirmada:
              </Text>
              <Text>• Estado: {tripDetails.bookingStatus}</Text>
              <Text>• Precio: ${tripDetails.totalPrice.toLocaleString()}</Text>
              <Text>• Asientos: {tripDetails.seatsBooked}</Text>
              <Button 
                size="sm" 
                mt="md" 
                onClick={() => window.location.reload()}
                style={{ backgroundColor: '#34D399' }}
              >
                🔄 Actualizar información
              </Button>
            </Alert>
          )}

          <Divider label="Información del Viaje" labelPosition="center" my="sm" />

          <Group gap="md"><Text fw={600}>Conductor:</Text><Text>{tripDetails.driverName}</Text></Group>
          <Group gap="md"><Text fw={600}>Origen:</Text><Text>{tripDetails.main_text_origen}</Text></Group>
          <Group gap="md"><Text fw={600}>Destino:</Text><Text>{tripDetails.main_text_destination}</Text></Group>
          <Group gap="md">
            <Text fw={600}>Fecha y Hora:</Text>
            <Text>{tripDetails.date_time ? dayjs(tripDetails.date_time).format('DD/MM/YYYY HH:mm') : 'No disponible'}</Text>
          </Group>
          <Group gap="md">
            <Text fw={600}>Estado:</Text>
            <Badge color={tripDetails.tripStatus === 'active' ? 'green' : 'yellow'}>
              {tripDetails.tripStatus || 'No disponible'}
            </Badge>
          </Group>

          <Divider label="Información de la Reserva" labelPosition="center" my="sm" />
          
          <Group gap="md"><Text fw={600}>ID de Reserva:</Text><Text>{booking_id}</Text></Group>
          <Group gap="md">
            <Text fw={600}>Estado de Reserva:</Text>
            <Badge color={tripDetails.bookingStatus === 'confirmed' ? 'green' : tripDetails.bookingStatus === 'pending' ? 'yellow' : 'red'}>
              {tripDetails.bookingStatus || 'No disponible'}
            </Badge>
          </Group>
          <Group gap="md"><Text fw={600}>Asientos Reservados:</Text><Text>{tripDetails.seatsBooked}</Text></Group>
          <Group gap="md"><Text fw={600}>Precio Total:</Text><Text>${tripDetails.totalPrice.toLocaleString()}</Text></Group>

          <Divider label="Vehículo" labelPosition="center" my="sm" />
          <Group gap="md">
            <Text fw={600}>Marca:</Text>
            <Text>{tripDetails.vehicle.brand || 'No disponible'}</Text>
          </Group>
          <Group gap="md">
            <Text fw={600}>Modelo:</Text>
            <Text>{tripDetails.vehicle.model || 'No disponible'}</Text>
          </Group>
          <Group gap="md">
            <Text fw={600}>Año:</Text>
            <Text>{tripDetails.vehicle.year || 'No disponible'}</Text>
          </Group>
          <Group gap="md">
            <Text fw={600}>Placa:</Text>
            <Text>{tripDetails.vehicle.plate || 'No disponible'}</Text>
          </Group>
          <Group gap="md">
            <Text fw={600}>Color:</Text>
            <Text>{tripDetails.vehicle.color || 'No disponible'}</Text>
          </Group>

          <Button
            mt="md"
            fullWidth
            variant="light"
            onClick={() => navigate({ to: '/Actividades' })}
            style={{ color: '#34D399', border: '1px solid #34D399' }}
          >
            Regresar
          </Button>
        </Stack>
      </Card>
    </Container>
  );
}

export default ViewBookingDetails;
