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
    driverRating: number;
    driverPhone: string;
    loading: boolean;
    tripStatus: string;
    routeName: string;
    distance: number;
    totalPrice: number;
    seatsReserved: number;
    createdAt: string;
    vehicle: {
      brand: string;
      model: string;
      year: number;
      plate: string;
      color: string;
    };
    passengers: Array<{
      user_id: string;
      names: string;
      phone: string;
      seats: number;
    }>;
  }>({
    main_text_origen: '',
    main_text_destination: '',
    date_time: null,
    driverName: '',
    driverRating: 0,
    driverPhone: '',
    loading: true,
    tripStatus: '',
    routeName: '',
    distance: 0,
    totalPrice: 0,
    seatsReserved: 0,
    createdAt: '',
    vehicle: {
      brand: '',
      model: '',
      year: 0,
      plate: '',
      color: '',
    },
    passengers: [],
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
        console.log(`🔍 [ViewBookingDetails] Fetching details for booking: ${booking_id}`);
        
        const result = await getBookingDetails(Number(booking_id));
        
        if (!result.success || !result.data) {
          throw new Error(result.error || 'No se pudieron cargar los detalles');
        }
        
        const bookingData = result.data;
        
        console.log(`🔍 [ViewBookingDetails] RAW RESPONSE from backend:`, JSON.stringify(result, null, 2));
        console.log(`🔍 [ViewBookingDetails] Processing booking data:`, bookingData);
        console.log(`🔍 [ViewBookingDetails] Trip data:`, bookingData.trip);
        console.log(`🔍 [ViewBookingDetails] Driver data:`, bookingData.driver);
        console.log(`🔍 [ViewBookingDetails] Vehicle data:`, bookingData.vehicle);
        console.log(`🔍 [ViewBookingDetails] Passengers data:`, bookingData.passengers);
        
        // ✅ Según el backend: el conductor debe estar en bookingData.driver con nombres concatenados
        const driverData = bookingData.driver;
        console.log(`🔍 [ViewBookingDetails] Driver data detailed:`, {
          driverData,
          exists: !!driverData,
          names: driverData?.names,
          first_name: (driverData as any)?.first_name,
          last_name: (driverData as any)?.last_name,
          average_rating: driverData?.average_rating,
          phone: driverData?.phone,
          phone_number: (driverData as any)?.phone_number,
          allKeys: driverData ? Object.keys(driverData) : 'no driver data',
          isStringEmpty: driverData?.names === '',
          isUndefined: driverData?.names === undefined,
          isNull: driverData?.names === null,
          exactValue: `"${driverData?.names}"`
        });
        
        // ✅ SOLUCIÓN TEMPORAL: Si el backend no encuentra el conductor, usar el user_id del trip
        let driverName: string;
        let driverRating: number;
        let driverPhone: string;
        
        if (driverData && driverData.names && driverData.names.trim() !== '' && driverData.names !== 'Conductor no disponible') {
          // ✅ Caso ideal: el backend encontró la información completa
          driverName = driverData.names;
          driverRating = driverData.average_rating || 0;
          driverPhone = driverData.phone || (driverData as any)?.phone_number || '';
        } else if (driverData && (driverData as any).first_name) {
          // ✅ Fallback 1: construir desde first_name y last_name
          driverName = `${(driverData as any).first_name} ${(driverData as any).last_name || ''}`.trim();
          driverRating = driverData.average_rating || 0;
          driverPhone = driverData.phone || (driverData as any)?.phone_number || '';
        } else if ((bookingData.trip as any)?.user_id) {
          // ✅ Fallback 2: mostrar información básica con el user_id
          const userId = (bookingData.trip as any).user_id;
          driverName = `Conductor`;
          driverRating = 0;
          driverPhone = '';
          console.log(`⚠️ [ViewBookingDetails] Using fallback driver info for user_id: ${userId}`);
        } else {
          // ✅ Fallback final
          driverName = 'Conductor';
          driverRating = 0;
          driverPhone = '';
        }
        
        console.log(`🔍 [ViewBookingDetails] Extracted driver info:`, {
          driverName,
          driverRating,
          driverPhone,
          originalNames: driverData?.names,
          backendFailed: driverData?.names === 'Conductor no disponible',
          usedFallback: !driverData?.names || driverData?.names === 'Conductor no disponible',
          tripUserId: (bookingData.trip as any)?.user_id
        });

        setTripDetails({
          // ✅ Según la guía: usar trip.origin.main_text y trip.destination.main_text
          main_text_origen: bookingData.trip?.origin?.main_text || (bookingData.trip?.route as any)?.start_address || 'Origen no disponible',
          main_text_destination: bookingData.trip?.destination?.main_text || (bookingData.trip?.route as any)?.end_address || 'Destino no disponible',
          date_time: bookingData.trip?.date_time || null,
          driverName: driverName,
          driverRating: driverRating,
          driverPhone: driverPhone,
          loading: false,
          // ✅ Usar los campos con alias de compatibilidad
          tripStatus: bookingData.trip?.status || (bookingData as any).booking_status || (bookingData as any).status || '',
          routeName: 'Ruta personalizada',
          distance: bookingData.trip?.route?.distance || 0,
          totalPrice: bookingData.total_price || 0,
          seatsReserved: (bookingData as any).seats_reserved || (bookingData as any).seats_booked || 0,
          createdAt: (bookingData as any).created_at || (bookingData as any).booking_date || '',
          // ✅ Usar vehículo directamente desde bookingData.vehicle
          vehicle: {
            brand: bookingData.vehicle?.brand || 'No disponible',
            model: bookingData.vehicle?.model || 'No disponible',
            year: bookingData.vehicle?.year || 0,
            plate: bookingData.vehicle?.plate || 'No disponible',
            color: bookingData.vehicle?.color || 'No disponible',
          },
          passengers: bookingData.passengers || [],
        });
        
        console.log(`✅ [ViewBookingDetails] Trip details set successfully`);
        
      } catch (err) {
        console.error(`❌ [ViewBookingDetails] Error loading details:`, err);
        
        showNotification({
          title: 'Error',
          message: 'No se pudieron cargar los detalles de la reserva.',
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
          <div style={{height: '30px'}} />
          <Title order={2} style={{ color: '#34D399', textAlign: 'center' }}>
            Detalles de tu Reserva
          </Title>

          <Divider label="Información del Viaje" labelPosition="center" my="sm" />

          <Group gap="md"><Text fw={600}>Origen:</Text><Text>{tripDetails.main_text_origen}</Text></Group>
          <Group gap="md"><Text fw={600}>Destino:</Text><Text>{tripDetails.main_text_destination}</Text></Group>
          <Group gap="md">
            <Text fw={600}>Fecha y Hora:</Text>
            <Text>{tripDetails.date_time ? dayjs(tripDetails.date_time).format('DD/MM/YYYY HH:mm') : 'No disponible'}</Text>
          </Group>
          <Group gap="md">
            <Text fw={600}>Distancia:</Text>
            <Text>{tripDetails.distance} km</Text>
          </Group>
          <Group gap="md">
            <Text fw={600}>Estado:</Text>
            <Badge color={
              tripDetails.tripStatus === 'active' ? 'green' : 
              tripDetails.tripStatus === 'started' ? 'yellow' :
              tripDetails.tripStatus === 'finished' ? 'blue' :
              tripDetails.tripStatus === 'canceled' ? 'red' : 'gray'
            }>
              {tripDetails.tripStatus || 'No disponible'}
            </Badge>
          </Group>

          <Divider label="Tu Reserva" labelPosition="center" my="sm" />
          
          <Group gap="md"><Text fw={600}>Asientos reservados:</Text><Text>{tripDetails.seatsReserved}</Text></Group>
          <Group gap="md"><Text fw={600}>Total pagado:</Text><Text>${tripDetails.totalPrice.toLocaleString()}</Text></Group>
          <Group gap="md">
            <Text fw={600}>Fecha de reserva:</Text>
            <Text>{tripDetails.createdAt ? dayjs(tripDetails.createdAt).format('DD/MM/YYYY HH:mm') : 'No disponible'}</Text>
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
