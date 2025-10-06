import React, { useState, useEffect } from 'react';
import {
  Modal,
  Text,
  Stack,
  Button,
  Badge,
  Loader,
  Center,
} from '@mantine/core';
import { IconQrcode } from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';
import { getCurrentUser } from '@/services/auth';
import { getCuposReservados } from '@/services/cupos';
import ValidateCupoModal from './ValidateCupoModal';
import styles from './CuposReservadosModal.module.css';

interface BookingWithPassengers {
  booking_id: number;
  trip_id: number;
  booking_status: 'payed' | 'pending' | 'completed' | 'confirmed' | 'cancelled' | string | null;
  total_price?: number;
  booking_date?: string;
  booking_qr?: string;
  seats_booked?: number;
  passengers: {
    passenger_id: number;
    full_name: string;
    identification_number: string;
    status?: 'pending' | 'validated' | string;
  }[];
}

interface Summary {
  total_bookings: number;
  total_passengers: number;
  validated_passengers: number;
  pending_passengers: number;
  validation_percentage: number;
  total_seats_booked: number;
  total_revenue: number;
  pending_bookings: number;
  completed_bookings: number;
}

interface CuposReservadosModalProps {
  tripId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CuposReservadosModal: React.FC<CuposReservadosModalProps> = ({
  tripId,
  isOpen,
  onClose
}) => {
  const [bookings, setBookings] = useState<BookingWithPassengers[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [validateModalOpen, setValidateModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);

  // Obtener información del usuario
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user && user.user) {
          setUserId(user.user.id);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, []);

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (!isOpen || !tripId || !userId) return;

    const fetchData = async () => {
      if (!tripId) return;
      
      setLoading(true);
      
      try {
        const result = await getCuposReservados(tripId);
        
        if (result.success && result.data) {
          // Resumen
          if (result.data.summary) {
            setSummary(result.data.summary);
          }
          
          // Reservas
          const bookingsData = result.data.bookings || [];
          const mappedBookings = bookingsData.map((booking: any) => ({
            booking_id: booking.id,
            trip_id: tripId,
            booking_status: booking.booking_status,
            total_price: booking.total_price,
            booking_date: booking.booking_date,
            booking_qr: booking.booking_qr,
            seats_booked: booking.seats_booked,
            passengers: (booking.passengers || []).map((passenger: any) => {
              const mappedPassenger = {
                passenger_id: passenger.id,
                full_name: passenger.full_name,
                identification_number: passenger.identification_number,
                status: passenger.status || 'pending'
              };
              
              // 🔍 DEBUG: Ver EXACTAMENTE qué datos llegan
              console.log('🔍 PASSENGER RAW DATA:', {
                name: passenger.full_name,
                rawStatus: passenger.status,
                mappedStatus: mappedPassenger.status,
                allFields: passenger
              });
              
              return mappedPassenger;
            })
          }));
          
          setBookings(mappedBookings);
          
          showNotification({
            title: 'Cupos cargados',
            message: `${mappedBookings.length} reservas encontradas`,
            color: 'green',
          });
        } else {
          setBookings([]);
          showNotification({
            title: 'Sin reservas',
            message: 'Este viaje no tiene reservas aún',
            color: 'blue',
          });
        }
      } catch (error) {
        console.error('Error loading cupos:', error);
        showNotification({
          title: 'Error',
          message: 'No se pudieron cargar los cupos',
          color: 'red',
        });
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, tripId, userId]);

  const handleValidateCupo = (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setValidateModalOpen(true);
  };

  // Función para refrescar datos después de validación
  const handleCupoValidated = async () => {
    if (!tripId || !userId) return;
    
    try {
      const result = await getCuposReservados(tripId);
      
      if (result.success && result.data) {
        // Actualizar resumen
        if (result.data.summary) {
          setSummary(result.data.summary);
        }
        
        // Actualizar reservas
        const bookingsData = result.data.bookings || [];
        const mappedBookings = bookingsData.map((booking: any) => ({
          booking_id: booking.id,
          trip_id: tripId,
          booking_status: booking.booking_status,
          total_price: booking.total_price,
          booking_date: booking.booking_date,
          booking_qr: booking.booking_qr,
          seats_booked: booking.seats_booked,
          passengers: (booking.passengers || []).map((passenger: any) => {
            const mappedPassenger = {
              passenger_id: passenger.id,
              full_name: passenger.full_name,
              identification_number: passenger.identification_number,
              status: passenger.status || 'pending'
            };
            return mappedPassenger;
          })
        }));
        
        setBookings(mappedBookings);
      }
    } catch (error) {
      console.error('Error refreshing cupos:', error);
    }
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      size="md"
      title="🎫 Cupos Reservados"
      centered
      overlayProps={{
        blur: 8,
        opacity: 0.6,
      }}
      transitionProps={{
        transition: 'slide-up',
        duration: 300,
      }}
    >
      <div className={styles.compactContent}>
        {/* Summary compacto */}
        {summary && (
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>Total</div>
              <div className={styles.summaryValue}>{summary.total_passengers}</div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>Validados</div>
              <div className={styles.summaryValue}>{summary.validated_passengers}</div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Loader size="lg" color="teal" />
              <Text size="sm" opacity={0.7}>Cargando cupos...</Text>
            </Stack>
          </Center>
        ) : bookings.length > 0 ? (
          /* Lista de reservas */
          <div className={styles.bookingsList}>
            {bookings.map((booking) => (
              <div key={booking.booking_id} className={styles.bookingItem}>
                <div className={styles.bookingHeader}>
                  <div className={styles.bookingTitle}>
                    🎫 Reserva #{String(booking.booking_id).slice(-6)}
                  </div>
                  <Badge size="sm" color="blue" variant="light">
                    {booking.passengers.length} pax
                  </Badge>
                </div>
                
                <div className={styles.passengersList}>
                  {booking.passengers.map((passenger) => {
                    // 🔍 DEBUG COMPLETO para encontrar el problema
                    console.log('=== PASSENGER DEBUG ===');
                    console.log('Passenger:', passenger.full_name);
                    console.log('Raw status:', passenger.status);
                    console.log('Status type:', typeof passenger.status);
                    console.log('Status length:', passenger.status?.length);
                    console.log('Status lowercase:', passenger.status?.toLowerCase());
                    console.log('Status trimmed:', passenger.status?.trim());
                    
                    // ✅ LÓGICA MUY ROBUSTA: Verificar TODAS las variantes posibles
                    const statusLower = (passenger.status || '').toString().toLowerCase().trim();
                    const isValidated = statusLower === 'validated' || 
                                       statusLower === 'confirmed' ||
                                       statusLower === 'complete' ||
                                       statusLower === 'validado' ||
                                       statusLower === 'confirmado' ||
                                       statusLower === 'completado' ||
                                       statusLower === 'true' ||
                                       statusLower === '1';
                    
                    console.log('Final isValidated result:', isValidated);
                    console.log('======================');
                    
                    return (
                      <div key={passenger.passenger_id} className={styles.passengerRow}>
                        <div className={styles.passengerInfo}>
                          <div className={styles.passengerName}>
                            {passenger.full_name}
                          </div>
                          <div className={styles.passengerDetails}>
                            ID: {passenger.identification_number}
                            {/* 🔍 Mostrar status en UI para debug */}
                            <span style={{ fontSize: '10px', color: '#666', marginLeft: '8px' }}>
                              (Status: {passenger.status})
                            </span>
                          </div>
                        </div>
                        
                        {/* ✅ SOLO mostrar botón si NO está validado */}
                        {!isValidated ? (
                          <Button
                            size="xs"
                            className={styles.validateButton}
                            leftSection={<IconQrcode size={14} />}
                            onClick={() => handleValidateCupo(booking.booking_id)}
                          >
                            Validar
                          </Button>
                        ) : (
                          <div className={styles.validatedBadge}>
                            ✓ Validado
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Estado vacío */
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <Text size="lg" fw={600} mb="xs">Sin cupos reservados</Text>
            <Text size="sm" opacity={0.7}>Este viaje no tiene reservas aún</Text>
          </div>
        )}
      </div>
      
      {/* Modal de validación */}
      <ValidateCupoModal
        bookingId={selectedBookingId}
        isOpen={validateModalOpen}
        onClose={() => {
          setValidateModalOpen(false);
          setSelectedBookingId(null);
        }}
        onValidated={handleCupoValidated}
      />
    </Modal>
  );
};

export default CuposReservadosModal;