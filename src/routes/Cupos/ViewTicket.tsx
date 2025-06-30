import { useEffect, useState } from 'react';
import {
  Container,
  Card,
  Stack,
  Text,
  Title,
  Button,
  Divider,
  LoadingOverlay,
} from '@mantine/core';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, ArrowLeft, AlertCircle, Navigation } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { supabase } from '@/lib/supabaseClient';
import dayjs from 'dayjs';
import styles from './ViewTicket.module.css';
import { useNavigate, useSearch, createFileRoute } from '@tanstack/react-router';

interface PassengerData {
  id: number;
  full_name: string;
  identification_number: string;
}

interface TripLocation {
  origin: { address: string };
  destination: { address: string };
}

// Generador de código corto, único y alfanumérico
function generateShortCode(length = 7) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const ViewTicket = () => {
  const navigate = useNavigate();
  const { booking_id } = useSearch({ from: Route.id });

  const [passengers, setPassengers] = useState<PassengerData[]>([]);
  const [tripLocations, setTripLocations] = useState<TripLocation | null>(null);
  const [bookingQr, setBookingQr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!booking_id) {
        console.error('booking_id inválido');
        navigate({ to: '/Actividades' });
        return;
      }

      try {
        // 1. Obtener booking
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('id, trip_id, booking_qr')
          .eq('id', Number(booking_id))
          .single();

        if (bookingError || !bookingData) {
          throw new Error('No se pudo obtener el booking');
        }

        const tripId = bookingData.trip_id;
        let qr = bookingData.booking_qr;

        // Si no hay código QR, genera uno único y guárdalo
        if (!qr) {
          let unique = false;
          let newCode = '';
          while (!unique) {
            newCode = generateShortCode(7);
            // Verifica que no exista en la base de datos
            const { data: exists } = await supabase
              .from('bookings')
              .select('id')
              .eq('booking_qr', newCode)
              .maybeSingle();
            if (!exists) unique = true;
          }
          await supabase
            .from('bookings')
            .update({ booking_qr: newCode })
            .eq('id', Number(booking_id));
          qr = newCode;
        }
        setBookingQr(qr);

        // 2. Obtener pasajeros asociados a ese booking
        const { data: passengersData, error: passengersError } = await supabase
          .from('booking_passengers')
          .select('id, full_name, identification_number')
          .eq('booking_id', Number(booking_id));

        if (passengersError || !passengersData?.length) {
          throw new Error('No se encontraron pasajeros');
        }

        setPassengers(passengersData);

        // 3. Obtener viaje
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('origin_id, destination_id')
          .eq('id', Number(tripId))
          .single();

        if (tripError || !tripData) {
          throw new Error('No se pudo obtener el viaje');
        }

        // 4. Obtener direcciones
        const { data: originLocation } = await supabase
          .from('locations')
          .select('address')
          .eq('id', Number(tripData.origin_id ?? -1))
          .single();

        const { data: destinationLocation } = await supabase
          .from('locations')
          .select('address')
          .eq('id', Number(tripData.destination_id ?? -1))
          .single();

        setTripLocations({
          origin: originLocation || { address: 'Origen no disponible' },
          destination: destinationLocation || { address: 'Destino no disponible' },
        });
      } catch (error) {
        console.error('Error cargando datos del tiquete:', error);
        navigate({ to: '/Actividades' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, booking_id]);

  // --- NUEVO: Ticket compacto solo para descarga ---
  const renderDownloadTicket = () => {
    if (!passengers.length || !tripLocations) return null;
    return (
      <div
        id={`ticket-download-${booking_id}`}
        className={`${styles.ticketDownloadOnly} ticketDownloadOnly`}
        style={{ display: 'none', maxWidth: 320, padding: 12, boxSizing: 'border-box' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#34D399' }}>Tiquete Digital</div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: '#888' }}>Pasajero</div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{passengers[0]?.full_name}</div>
          <div style={{ fontSize: 12, color: '#888' }}>Identificación: {passengers[0]?.identification_number}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '12px 0' }}>
          <div style={{ fontSize: 14, wordBreak: 'break-word' }}>
            <div style={{ fontSize: 12, color: '#888' }}>Origen</div>
            {tripLocations.origin.address}
          </div>
          <div style={{ fontSize: 14, wordBreak: 'break-word' }}>
            <div style={{ fontSize: 12, color: '#888' }}>Destino</div>
            {tripLocations.destination.address}
          </div>
        </div>
        <div style={{ textAlign: 'center', margin: '16px 0 8px 0' }}>
          <QRCodeCanvas
            value={bookingQr}
            size={140}
            level="H"
            includeMargin={true}
            style={{
              backgroundColor: '#fff',
              padding: '6px',
              borderRadius: '10px',
            }}
          />
        </div>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <div style={{ color: '#34D399', fontWeight: 700, fontSize: 13, letterSpacing: 2 }}>PIN</div>
          <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: 6, color: '#222' }}>{bookingQr}</div>
        </div>
      </div>
    );
  };

  // --- FIN NUEVO ---

  const handleDownload = async () => {
    try {
      // 1. Muestra el bloque de descarga compacto
      const downloadDiv = document.getElementById(`ticket-download-${booking_id}`);
      if (!downloadDiv) return;
      downloadDiv.style.display = 'block';

      // 2. Espera un frame para que se renderice
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 3. Captura la imagen
      const canvas = await html2canvas(downloadDiv, {
        scale: 4,
        useCORS: true,
        backgroundColor: '#fff',
        logging: true,
      });

      // 4. Oculta el bloque de descarga
      downloadDiv.style.display = 'none';

      const base64Image = canvas.toDataURL('image/png').split(',')[1];
      const fileName = `ticket-${booking_id}.png`;

      if (Capacitor.getPlatform() === 'web') {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('Tiquete descargado en navegador.');
      } else {
        await Filesystem.writeFile({
          path: fileName,
          data: base64Image,
          directory: Directory.Documents,
        });

        const fileUri = await Filesystem.getUri({
          directory: Directory.Documents,
          path: fileName,
        });

        await FileOpener.open({
          filePath: fileUri.uri,
          contentType: 'image/png',
        });

        console.log('Tiquete guardado y abierto en app.');
      }
    } catch (error) {
      console.error('Error generando el ticket:', error);
    }
  };

  if (loading) {
    return (
      <Container className={styles.ticketContainer}>
        <LoadingOverlay visible />
        <Title className={styles.ticketTitle}>Cargando tiquete...</Title>
      </Container>
    );
  }

  if (!passengers.length || !tripLocations) {
    return (
      <Container className={styles.ticketContainer}>
        <Card className={styles.ticketCard}>
          <Stack align="center" gap="md">
            <AlertCircle size={48} color="#ff6b6b" />
            <Text ta="center" size="lg" c="white">
              No se encontró información del tiquete
            </Text>
            <Button onClick={() => navigate({ to: '/Actividades' })} variant="light">
              Volver a actividades
            </Button>
          </Stack>
        </Card>
      </Container>
    );
  }

  return (
    <Container className={styles.ticketContainer} size="xs">
      <button className={styles.backButton} onClick={() => navigate({ to: '/Actividades' })}>
        <ArrowLeft size={16} />
        Volver
      </button>

      {/* Ticket visible en pantalla */}
      <div id={`ticket-${booking_id}`} className={styles.ticketDownloadWrapper}>
        <Card
          shadow="xl"
          radius="xl"
          padding="xl"
          className={`${styles.ticketCard} downloadableTicket`}
        >
        <div className={styles.logoWrapper}>
          <img src="https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/Logo.png" alt="Cupo" className={styles.logo} />
          <span className={styles.brandName}>Cupo</span>
        </div>

        <Stack align="center" gap="md" mt={40}>
          <Title order={2} className={styles.ticketTitle}>Tiquete Digital</Title>
          <Text size="xs" c="dimmed">Emitido: {dayjs().format('DD/MM/YYYY HH:mm')}</Text>

          <Divider my="sm" color="gray" />

          <div className={styles.routeInfo}>
            <div className={styles.location}>
              <Text size="sm" color="dimmed">Origen</Text>
              <Text className={styles.direccion}>{tripLocations.origin.address}</Text>
            </div>
            <div className={styles.carIcon}>
              <Navigation size={20} strokeWidth={2} />
            </div>
            <div className={styles.location}>
              <Text size="sm" color="dimmed">Destino</Text>
              <Text className={styles.direccion}>{tripLocations.destination.address}</Text>
            </div>
          </div>

          <Divider my="sm" color="gray" />

          <Stack gap="xs" align="center">
            <Text size="sm" color="dimmed">Pasajeros</Text>
            {passengers.map((p) => (
              <div key={p.id} style={{ textAlign: 'center' }}>
                <Text size="lg" fw={600}>{p.full_name}</Text>
                <Text size="sm" color="dimmed">Identificación: {p.identification_number}</Text>
              </div>
            ))}
          </Stack>

          <Divider my="sm" color="gray" />

          <Text size="sm" c="#34D399" fw={500}>Código QR del viaje</Text>
          <QRCodeCanvas
            value={bookingQr}
            size={200}
            level="H"
            includeMargin={true}
            style={{
              backgroundColor: '#fff',
              padding: '10px',
              borderRadius: '16px',
              boxShadow: '0 0 12px rgba(0,0,0,0.25)',
            }}
          />
          <div className={styles.pinSection}>
            <Text className={styles.pinLabel}>PIN</Text>
            <Text className={styles.pinValue}>{bookingQr}</Text>
          </div>
          <Divider my="sm" color="gray" />

          <Text size="xs" color="dimmed" ta="center">
            Este tiquete es válido únicamente para los pasajeros registrados. <br />
            Preséntalo al conductor al abordar.
          </Text>

          <Button
            onClick={handleDownload}
            leftSection={<Download size={16} />}
            radius="md"
            fullWidth
            mt="lg"
            color="teal"
            variant="gradient"
            gradient={{ from: 'teal', to: 'green', deg: 90 }}
          >
            Descargar Tiquete
          </Button>
        </Stack>
        </Card>
      </div>

      {/* Ticket compacto solo para descarga */}
      {renderDownloadTicket()}
    </Container>
  );
};

export const Route = createFileRoute('/Cupos/ViewTicket')({
  component: ViewTicket,
  validateSearch: (search) => ({
    booking_id: String(search.booking_id ?? ''),
  }),
});