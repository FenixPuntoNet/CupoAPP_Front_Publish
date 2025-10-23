import React, { useState, useEffect } from 'react';
import { Modal, Stack, Text, LoadingOverlay, Badge, CloseButton } from '@mantine/core';
import { IconCar, IconUser, IconMapPin, IconClock } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { getBookingDetails } from '@/services/reservas';
import styles from './BookingDetailsModal.module.css';

interface BookingDetailsModalProps {
  opened: boolean;
  onClose: () => void;
  bookingId: string;
}

interface BookingDetailsData {
  main_text_origen: string;
  main_text_destination: string;
  date_time: string | null;
  driverName: string;
  driverRating: number;
  driverPhone: string;
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
}

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ opened, onClose, bookingId }) => {
  const [tripDetails, setTripDetails] = useState<BookingDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!opened || !bookingId) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(`🔍 [BookingDetailsModal] Fetching details for booking: ${bookingId}`);
        
        const result = await getBookingDetails(Number(bookingId));
        
        if (!result.success || !result.data) {
          throw new Error(result.error || 'No se pudieron cargar los detalles');
        }
        
        const bookingData = result.data;
        console.log(`🔍 [BookingDetailsModal] Processing booking data:`, bookingData);

        // Extraer información del conductor - Aplicando la misma lógica que en CupoCard
        const driverData = bookingData.driver;
        const tripData = bookingData.trip || {};
        const tripDriverData = (tripData as any).driver || {};
        
        let driverName: string;
        let driverRating: number;
        let driverPhone: string;
        
        // Priorizar datos del driver a nivel de trip, luego a nivel de booking
        const finalDriverData = tripDriverData.first_name ? tripDriverData : driverData;
        
        if (finalDriverData && (finalDriverData as any).first_name) {
          driverName = `${(finalDriverData as any).first_name} ${(finalDriverData as any).last_name || ''}`.trim();
          driverRating = (finalDriverData as any).average_rating || 0;
          driverPhone = (finalDriverData as any).phone || (finalDriverData as any).phone_number || '';
        } else if (finalDriverData && finalDriverData.names && finalDriverData.names.trim() !== '' && finalDriverData.names !== 'Conductor no disponible') {
          driverName = finalDriverData.names;
          driverRating = finalDriverData.average_rating || 0;
          driverPhone = finalDriverData.phone || (finalDriverData as any).phone_number || '';
        } else {
          // Fallback: buscar en cualquier estructura disponible
          driverName = 'Conductor no disponible';
          driverRating = 0;
          driverPhone = '';
          
          // Intentar extraer de otros campos posibles
          if (driverData) {
            if ((driverData as any).first_name) {
              driverName = `${(driverData as any).first_name} ${(driverData as any).last_name || ''}`.trim();
            } else if (driverData.names && driverData.names !== 'Conductor no disponible') {
              driverName = driverData.names;
            }
            driverRating = driverData.average_rating || 0;
            driverPhone = driverData.phone || (driverData as any).phone_number || '';
          }
        }
        
        console.log(`🚗 [BookingDetailsModal] Driver extraction result:`, {
          finalDriverData,
          extractedName: driverName,
          extractedRating: driverRating,
          extractedPhone: driverPhone
        });

        const details: BookingDetailsData = {
          main_text_origen: bookingData.trip?.origin?.main_text || (bookingData.trip?.route as any)?.start_address || 'Origen no disponible',
          main_text_destination: bookingData.trip?.destination?.main_text || (bookingData.trip?.route as any)?.end_address || 'Destino no disponible',
          date_time: bookingData.trip?.date_time || null,
          driverName: driverName,
          driverRating: driverRating,
          driverPhone: driverPhone,
          tripStatus: bookingData.trip?.status || (bookingData as any).booking_status || (bookingData as any).status || '',
          routeName: 'Ruta personalizada',
          distance: bookingData.trip?.route?.distance || 0,
          totalPrice: bookingData.total_price || 0,
          seatsReserved: (bookingData as any).seats_reserved || (bookingData as any).seats_booked || 0,
          createdAt: (bookingData as any).created_at || (bookingData as any).booking_date || '',
          vehicle: {
            brand: bookingData.vehicle?.brand || 'No disponible',
            model: bookingData.vehicle?.model || 'No disponible',
            year: bookingData.vehicle?.year || 0,
            plate: bookingData.vehicle?.plate || 'No disponible',
            color: bookingData.vehicle?.color || 'No disponible',
          },
          passengers: bookingData.passengers || [],
        };

        setTripDetails(details);
        console.log(`✅ [BookingDetailsModal] Trip details set successfully`);
        
      } catch (err) {
        console.error(`❌ [BookingDetailsModal] Error loading details:`, err);
        setError('No se pudieron cargar los detalles de la reserva.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [opened, bookingId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'started': return 'yellow';
      case 'finished': return 'blue';
      case 'canceled': return 'red';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'started': return 'En Progreso';
      case 'finished': return 'Terminado';
      case 'canceled': return 'Cancelado';
      default: return 'No disponible';
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Detalles de tu Reserva"
      size="xl"
      padding={0}
      classNames={{
        content: styles.modalContent,
        header: styles.modalHeader,
        title: styles.modalTitle
      }}
      closeButtonProps={{
        style: { display: 'none' }
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
          <Text c="red" ta="center">{error}</Text>
        </Stack>
      ) : !tripDetails ? (
        <Stack align="center" gap="md" p="xl">
          <Text ta="center">No se encontraron detalles de la reserva</Text>
        </Stack>
      ) : (
        <div className={styles.detailsContainer}>
          {/* Columna Izquierda */}
          <div className={styles.leftColumn}>
            {/* Información del Viaje */}
            <div className={styles.compactSection}>
              <Text className={styles.sectionTitle}>
                <IconMapPin size={14} style={{ marginRight: 4 }} />
                Viaje
              </Text>
              <div className={styles.detailGrid}>
                <div className={styles.detailRow}>
                  <Text className={styles.detailLabel}>Origen:</Text>
                  <Text className={styles.detailValue}>{tripDetails.main_text_origen}</Text>
                </div>
                <div className={styles.detailRow}>
                  <Text className={styles.detailLabel}>Destino:</Text>
                  <Text className={styles.detailValue}>{tripDetails.main_text_destination}</Text>
                </div>
                <div className={styles.inlineFields}>
                  <div className={styles.halfField}>
                    <Text className={styles.detailLabel}>Fecha:</Text>
                    <Text className={styles.detailValue}>
                      {tripDetails.date_time ? dayjs(tripDetails.date_time).format('DD/MM/YYYY') : 'No disponible'}
                    </Text>
                  </div>
                  <div className={styles.halfField}>
                    <Text className={styles.detailLabel}>Hora:</Text>
                    <Text className={styles.detailValue}>
                      {tripDetails.date_time ? dayjs(tripDetails.date_time).format('HH:mm') : 'No disponible'}
                    </Text>
                  </div>
                </div>
                <div className={styles.inlineFields}>
                  <div className={styles.halfField}>
                    <Text className={styles.detailLabel}>Distancia:</Text>
                    <Text className={styles.detailValue}>{tripDetails.distance} km</Text>
                  </div>
                  <div className={styles.halfField}>
                    <Text className={styles.detailLabel}>Estado:</Text>
                    <Badge 
                      size="sm" 
                      color={getStatusColor(tripDetails.tripStatus)}
                      className={styles.statusBadge}
                    >
                      {getStatusLabel(tripDetails.tripStatus)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Información del Conductor */}
            <div className={styles.compactSection}>
              <Text className={styles.sectionTitle}>
                <IconUser size={14} style={{ marginRight: 4 }} />
                Conductor
              </Text>
              <div className={styles.detailGrid}>
                <div className={styles.detailRow}>
                  <Text className={styles.detailLabel}>Nombre:</Text>
                  <Text className={styles.detailValue}>{tripDetails.driverName}</Text>
                </div>
                <div className={styles.inlineFields}>
                  {tripDetails.driverPhone && (
                    <div className={styles.halfField}>
                      <Text className={styles.detailLabel}>Teléfono:</Text>
                      <Text className={styles.detailValue}>{tripDetails.driverPhone}</Text>
                    </div>
                  )}
                  {tripDetails.driverRating > 0 && (
                    <div className={styles.halfField}>
                      <Text className={styles.detailLabel}>Calificación:</Text>
                      <Text className={styles.detailValue}>⭐ {tripDetails.driverRating.toFixed(1)}</Text>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha */}
          <div className={styles.rightColumn}>
            {/* Información de la Reserva */}
            <div className={styles.compactSection}>
              <Text className={styles.sectionTitle}>
                <IconClock size={14} style={{ marginRight: 4 }} />
                Reserva
              </Text>
              <div className={styles.detailGrid}>
                <div className={styles.inlineFields}>
                  <div className={styles.halfField}>
                    <Text className={styles.detailLabel}>Asientos:</Text>
                    <Text className={styles.detailValue}>{tripDetails.seatsReserved}</Text>
                  </div>
                  <div className={styles.halfField}>
                    <Text className={styles.detailLabel}>Total:</Text>
                    <Text className={`${styles.detailValue} ${styles.priceValue}`}>
                      ${tripDetails.totalPrice.toLocaleString()}
                    </Text>
                  </div>
                </div>
                <div className={styles.detailRow}>
                  <Text className={styles.detailLabel}>Reservado:</Text>
                  <Text className={styles.detailValue}>
                    {tripDetails.createdAt ? dayjs(tripDetails.createdAt).format('DD/MM/YYYY') : 'No disponible'}
                  </Text>
                </div>
              </div>
            </div>

            {/* Información del Vehículo */}
            <div className={styles.compactSection}>
              <Text className={styles.sectionTitle}>
                <IconCar size={14} style={{ marginRight: 4 }} />
                Vehículo
              </Text>
              <div className={styles.vehicleCompactGrid}>
                <div className={styles.inlineFields}>
                  <div className={styles.halfField}>
                    <Text className={styles.detailLabel}>Marca:</Text>
                    <Text className={styles.detailValue}>{tripDetails.vehicle.brand}</Text>
                  </div>
                  <div className={styles.halfField}>
                    <Text className={styles.detailLabel}>Modelo:</Text>
                    <Text className={styles.detailValue}>{tripDetails.vehicle.model}</Text>
                  </div>
                </div>
                <div className={styles.inlineFields}>
                  <div className={styles.halfField}>
                    <Text className={styles.detailLabel}>Año:</Text>
                    <Text className={styles.detailValue}>{tripDetails.vehicle.year}</Text>
                  </div>
                  <div className={styles.halfField}>
                    <Text className={styles.detailLabel}>Color:</Text>
                    <Text className={styles.detailValue}>{tripDetails.vehicle.color}</Text>
                  </div>
                </div>
                <div className={styles.detailRow}>
                  <Text className={styles.detailLabel}>Placa:</Text>
                  <Text className={styles.detailValue}>{tripDetails.vehicle.plate}</Text>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default BookingDetailsModal;