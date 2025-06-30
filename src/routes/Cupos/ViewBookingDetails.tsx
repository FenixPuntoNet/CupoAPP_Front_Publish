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
} from '@mantine/core';
import { useState, useEffect } from 'react';
import detailStyles from './ViewBookingDetails.module.css';
import dayjs from 'dayjs';
import { useNavigate, useSearch, createFileRoute } from '@tanstack/react-router';
import { showNotification } from '@mantine/notifications';
import { supabase } from '@/lib/supabaseClient';

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
  }>({
    main_text_origen: '',
    main_text_destination: '',
    date_time: null, // ahora es string | null, así que está bien
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
  });
  

  useEffect(() => {
    const fetchDetails = async () => {
      if (!booking_id) {
        showNotification({
          title: 'Error',
          message: 'ID de reserva no válido',
          color: 'red',
        });
        navigate({ to: '/Cupos' });
        return;
      }

      try {
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .select('trip_id')
          .eq('id', Number(booking_id)) // ✅ se convierte a number
          .single();

        if (bookingError || !booking?.trip_id) throw new Error('Reserva no válida');

        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select(`
            date_time,
            status,
            origin:locations!trips_origin_id_fkey(address),
            destination:locations!trips_destination_id_fkey(address),
            vehicle:vehicles(brand, model, year, plate, color),
            user_id
          `)
          .eq('id', booking.trip_id)
          .single();

        if (tripError || !tripData) throw new Error('Viaje no encontrado');
        if (!tripData.user_id) throw new Error('Falta user_id');

        const { data: driverData } = await supabase
          .from('user_profiles')
          .select('first_name, last_name')
          .eq('user_id', tripData.user_id)
          .single();

        setTripDetails({
          main_text_origen: tripData.origin?.address || 'Origen no disponible',
          main_text_destination: tripData.destination?.address || 'Destino no disponible',
          date_time: tripData.date_time,
          driverName: `${driverData?.first_name ?? ''} ${driverData?.last_name ?? ''}`,
          loading: false,
          tripStatus: tripData.status || '',
          vehicle: {
            brand: tripData.vehicle?.brand || 'No disponible',
            model: tripData.vehicle?.model || 'No disponible',
            year: tripData.vehicle?.year ?? 0,
            plate: tripData.vehicle?.plate || 'No disponible',
            color: tripData.vehicle?.color || 'No disponible',
          },
        });
      } catch (err) {
        showNotification({
          title: 'Error',
          message: 'No se pudieron cargar los detalles.',
          color: 'red',
        });
        navigate({ to: '/Cupos' });
      }
    };

    fetchDetails();
  }, [booking_id, navigate]);

  return (
    <Container size="sm" className={detailStyles.detailsContainer}>
      <Card withBorder shadow="sm" radius="md" className={detailStyles.detailsCard}>
        <LoadingOverlay visible={tripDetails.loading} />
        <Stack gap="lg">
          <Title order={2} style={{ color: '#34D399', textAlign: 'center' }}>
            Detalles de tu Reserva
          </Title>

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

          <Divider label="Vehículo" labelPosition="center" my="sm" />
          <Text fw={600}>Marca: {tripDetails.vehicle.brand}</Text>
          <Text fw={600}>Modelo: {tripDetails.vehicle.model}</Text>
          <Text fw={600}>Año: {tripDetails.vehicle.year}</Text>
          <Text fw={600}>Placa: {tripDetails.vehicle.plate}</Text>
          <Text fw={600}>Color: {tripDetails.vehicle.color}</Text>

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
