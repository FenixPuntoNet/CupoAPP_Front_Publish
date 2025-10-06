import React, { useState, useEffect } from 'react';
import {
  Text,
  LoadingOverlay,
  Stack,
} from '@mantine/core';
import { getMisCupos } from '@/services/cupos';
import { TripRating } from '../UI/TripRating';
import { useBackendAuth } from '@/context/BackendAuthContext';
import { TicketModal, BookingDetailsModal, ChatModal } from '@/components/Cupos/Modals';
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

  const userId = user?.id || '';

  useEffect(() => {
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
            />
          ))}
        </Stack>
      )}
    </>
  );
};

export default CuposContent;
