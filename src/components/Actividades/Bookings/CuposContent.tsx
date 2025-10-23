import React, { useState, useEffect } from 'react';
import {
  Text,
  LoadingOverlay,
  Stack,
  Modal,
  Button,
  Group,
} from '@mantine/core';
import { getMisCupos } from '@/services/cupos';
import { cancelBooking } from '@/services/reservas';
import { TripRating } from '../UI/TripRating';
import { useBackendAuth } from '@/context/BackendAuthContext';
import { TicketModal, BookingDetailsModal, ChatModal } from '@/components/Cupos/Modals';
import { notifications } from '@mantine/notifications';
import CupoCard from './CupoCard';

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
  const [ratingModal, setRatingModal] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  // Estados para los modales
  const [ticketModalOpened, setTicketModalOpened] = useState(false);
  const [bookingDetailsModalOpened, setBookingDetailsModalOpened] = useState(false);
  const [chatModalOpened, setChatModalOpened] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [selectedChatTripId, setSelectedChatTripId] = useState<number | null>(null);

  // Estados para cancelación
  const [cancelModalOpened, setCancelModalOpened] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const userId = user?.id || '';

  // Función para cargar las reservas (extraída para reutilizar)
  const fetchBookings = async () => {
    setLoading(true);
    
    const timeoutId = setTimeout(() => {
      console.warn(`⏰ [CuposContent] Fetch timeout reached, using empty state`);
      setLoading(false);
      setBookings([]);
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

  useEffect(() => {
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

  const openTicketModal = (bookingId: number) => {
    setSelectedBookingId(bookingId.toString());
    setTicketModalOpened(true);
  };

  const openBookingDetailsModal = (bookingId: number) => {
    setSelectedBookingId(bookingId.toString());
    setBookingDetailsModalOpened(true);
  };

  const openChatModal = (tripId: number) => {
    setSelectedChatTripId(tripId);
    setChatModalOpened(true);
  };

  const handleCancelBooking = (bookingId: number) => {
    setCancelBookingId(bookingId);
    setCancelModalOpened(true);
  };

  const confirmCancelBooking = async () => {
    if (!cancelBookingId) return;

    setIsCancelling(true);
    try {
      console.log(`🚫 [CuposContent] Attempting to cancel booking: ${cancelBookingId}`);
      
      const response = await cancelBooking(cancelBookingId, 'Usuario canceló desde la app');

      if (response.success) {
        console.log(`✅ [CuposContent] Booking ${cancelBookingId} cancelled successfully`);
        
        notifications.show({
          title: '✅ Reserva cancelada',
          message: response.message || 'Tu reserva ha sido cancelada exitosamente',
          color: 'green',
          autoClose: 5000,
        });

        // 🔄 Refrescar los datos para mostrar el estado actualizado
        console.log(`🔄 [CuposContent] Refreshing bookings after successful cancellation`);
        
        await fetchBookings();
        
      } else {
        console.error(`❌ [CuposContent] Failed to cancel booking ${cancelBookingId}:`, response.error);
        throw new Error(response.error || 'Error al cancelar la reserva');
      }
    } catch (error) {
      console.error(`❌ [CuposContent] Error cancelling booking ${cancelBookingId}:`, error);
      
      // Determinar el título del error basado en el mensaje
      let errorTitle = 'Error al cancelar';
      const errorMessage = error instanceof Error ? error.message : 'Error al cancelar la reserva';
      
      if (errorMessage.includes('menos de 2 horas')) {
        errorTitle = '⏰ Cancelación no permitida';
      } else if (errorMessage.includes('Error interno') || errorMessage.includes('error interno')) {
        errorTitle = '🔧 Error del sistema';
      } else if (errorMessage.includes('sesión') || errorMessage.includes('iniciar sesión')) {
        errorTitle = '🔑 Sesión expirada';
      } else if (errorMessage.includes('permisos')) {
        errorTitle = '🚫 Sin permisos';
      } else if (errorMessage.includes('no fue encontrada')) {
        errorTitle = '❓ Reserva no encontrada';
      }
      
      notifications.show({
        title: errorTitle,
        message: errorMessage,
        color: 'red',
        autoClose: 8000, // Más tiempo para leer mensajes de error
      });
    } finally {
      setIsCancelling(false);
      setCancelModalOpened(false);
      setCancelBookingId(null);
    }
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

      {/* Modales para Ticket y Detalles */}
      <TicketModal
        opened={ticketModalOpened}
        onClose={() => setTicketModalOpened(false)}
        bookingId={selectedBookingId}
      />
      
      <BookingDetailsModal
        opened={bookingDetailsModalOpened}
        onClose={() => setBookingDetailsModalOpened(false)}
        bookingId={selectedBookingId}
      />

      {/* Modal de Chat */}
      <ChatModal
        opened={chatModalOpened}
        onClose={() => setChatModalOpened(false)}
        tripId={selectedChatTripId || 0}
        bookingId={selectedBookingId}
      />

      {/* Modal de Cancelación */}
      <Modal
        opened={cancelModalOpened}
        onClose={() => setCancelModalOpened(false)}
        title="Cancelar Reserva"
        centered
      >
        <Text>
          ¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer.
        </Text>
        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={() => setCancelModalOpened(false)}>
            No, mantener reserva
          </Button>
          <Button 
            color="red" 
            onClick={confirmCancelBooking}
            loading={isCancelling}
          >
            Sí, cancelar reserva
          </Button>
        </Group>
      </Modal>
      
      {bookings.length === 0 ? (
        <Text style={{ color: '#ddd', textAlign: 'center', margin: '2rem 0' }}>
          Aún no has comprado ningún cupo.
        </Text>
      ) : (
        <Stack gap="lg">
          {bookings.map((booking) => (
            <CupoCard
              key={booking.booking_id}
              booking={booking}
              onRating={openRatingModal}
              onViewTicket={openTicketModal}
              onViewDetails={openBookingDetailsModal}
              onChat={openChatModal}
              onCancel={handleCancelBooking}
            />
          ))}
        </Stack>
      )}
    </>
  );
};

export default CuposContent;
