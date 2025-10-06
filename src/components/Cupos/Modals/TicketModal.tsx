import React, { useState, useEffect } from 'react';
import { Modal, Stack, LoadingOverlay, Text, CloseButton } from '@mantine/core';
import { QRCodeCanvas } from 'qrcode.react';
import { IconDownload } from '@tabler/icons-react';
import { AlertCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import html2canvas from 'html2canvas';
import { getTicketDetails } from '@/services/tickets';
import styles from './TicketModal.module.css';

interface PassengerData {
  id: number;
  full_name: string;
  identification_number: string;
}

interface TripLocation {
  origin: { address: string };
  destination: { address: string };
}

interface TicketModalProps {
  opened: boolean;
  onClose: () => void;
  bookingId: string;
}

const TicketModal: React.FC<TicketModalProps> = ({ opened, onClose, bookingId }) => {
  const [passengers, setPassengers] = useState<PassengerData[]>([]);
  const [tripLocations, setTripLocations] = useState<TripLocation | null>(null);
  const [bookingQr, setBookingQr] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!opened || !bookingId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('🎫 [TicketModal] Fetching ticket details for booking:', bookingId);
        const result = await getTicketDetails(bookingId);
        
        if (result.success && result.data && result.data.ticket) {
          const { ticket } = result.data;
          console.log('✅ [TicketModal] Ticket data received:', JSON.stringify(ticket, null, 2));
          
          // Set QR code from booking
          if (ticket.booking && ticket.booking.booking_qr) {
            setBookingQr(ticket.booking.booking_qr);
          }
          
          // Set passengers
          if (ticket.passengers && Array.isArray(ticket.passengers)) {
            setPassengers(ticket.passengers);
          }
          
          // Set trip locations from route data
          if (ticket.trip && ticket.trip.route) {
            const locations = {
              origin: { address: ticket.trip.route.origin },
              destination: { address: ticket.trip.route.destination },
            };
            setTripLocations(locations);
          }
          
        } else {
          setError(result.error || 'Error desconocido al cargar el ticket');
        }
      } catch (error) {
        console.error('❌ [TicketModal] Exception caught:', error);
        setError(error instanceof Error ? error.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [opened, bookingId]);

  // Render del ticket compacto para descarga
  const renderDownloadTicket = () => {
    if (!passengers.length || !tripLocations) return null;
    return (
      <div
        id={`ticket-download-${bookingId}`}
        className={styles.ticketDownloadOnly}
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
            <strong>Origen:</strong> {tripLocations.origin.address}
          </div>
          <div style={{ fontSize: 14, wordBreak: 'break-word' }}>
            <strong>Destino:</strong> {tripLocations.destination.address}
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

  const handleDownload = async () => {
    try {
      setDownloading(true);
      console.log('🎫 Iniciando descarga del ticket...');
      
      const downloadDiv = document.getElementById(`ticket-download-${bookingId}`);
      if (!downloadDiv) {
        console.error('❌ No se encontró el elemento de descarga');
        setDownloading(false);
        return;
      }
      
      // Mostrar el elemento temporalmente
      downloadDiv.style.display = 'block';
      downloadDiv.style.position = 'absolute';
      downloadDiv.style.top = '-9999px';
      downloadDiv.style.left = '-9999px';
      downloadDiv.style.zIndex = '-1';
      
      // Esperar un poco para que se renderice
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log('📸 Capturando imagen...');
      const canvas = await html2canvas(downloadDiv, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#fff',
        logging: false,
        allowTaint: false,
        removeContainer: true,
      });

      // Ocultar el elemento
      downloadDiv.style.display = 'none';
      
      const fileName = `cupo-ticket-${bookingId}.png`;

      if (Capacitor.getPlatform() === 'web') {
        console.log('💻 Descargando en web...');
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('✅ Descarga completada');
      } else {
        console.log('📱 Guardando en móvil...');
        const base64Image = canvas.toDataURL('image/png').split(',')[1];
        
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
        console.log('✅ Guardado en móvil completado');
      }
    } catch (error) {
      console.error('❌ Error generando el ticket:', error);
      // Asegurar que el elemento se oculte en caso de error
      const downloadDiv = document.getElementById(`ticket-download-${bookingId}`);
      if (downloadDiv) {
        downloadDiv.style.display = 'none';
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        size="lg"
        padding={0}
        withCloseButton={false}
        classNames={{
          content: styles.modalContent,
          header: styles.modalHeader,
          title: styles.modalTitle
        }}
      >
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}>
          <CloseButton 
            onClick={onClose}
            size="lg"
            style={{ 
              color: '#34D399',
              backgroundColor: 'rgba(52, 211, 153, 0.1)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              borderRadius: '50%'
            }}
          />
        </div>

        <LoadingOverlay visible={loading} />
        
        {error ? (
          <Stack align="center" gap="md" p="xl">
            <AlertCircle size={48} color="#ff6b6b" />
            <Text c="red" ta="center">{error}</Text>
          </Stack>
        ) : !passengers.length || !tripLocations ? (
          <Stack align="center" gap="md" p="xl">
            <AlertCircle size={48} color="#ff6b6b" />
            <Text ta="center">No se encontraron datos del tiquete</Text>
          </Stack>
        ) : (
          <div className={styles.ticketContainer}>
            <div className={styles.ticketCard}>
              <div className={styles.ticketHeader}>
                <h2 className={styles.ticketTitle}>🎫 Tiquete Digital</h2>
              </div>
              
              <div className={styles.ticketBody}>
                <div className={styles.qrSection}>
                  <div className={styles.qrWrapper}>
                    <QRCodeCanvas
                      value={bookingQr}
                      size={140}
                      level="H"
                      includeMargin={false}
                      className={styles.qrCode}
                    />
                  </div>
                </div>
                
                <div className={styles.pinSection}>
                  <Text className={styles.pinLabel}>PIN</Text>
                  <Text className={styles.pinCode}>{bookingQr}</Text>
                </div>
              </div>
            </div>

            <CloseButton 
              onClick={onClose}
              size="lg"
              className={styles.closeButton}
            />

            <button
              onClick={handleDownload}
              disabled={downloading}
              className={styles.downloadButton}
              style={{
                cursor: downloading ? 'wait' : 'pointer',
                opacity: downloading ? 0.7 : 1
              }}
            >
              {downloading ? (
                <div style={{ 
                  width: 20, 
                  height: 20, 
                  border: '2px solid white', 
                  borderTop: '2px solid transparent', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite' 
                }} />
              ) : (
                <IconDownload size={20} />
              )}
            </button>
          </div>
        )}
      </Modal>

      {/* Ticket compacto para descarga (oculto) */}
      {renderDownloadTicket()}
    </>
  );
};

export default TicketModal;