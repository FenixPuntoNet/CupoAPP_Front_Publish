import { apiRequest } from '@/config/api';

// Interfaces para reservas
export interface BookingPassenger {
  fullName: string;
  identificationNumber: string;
  phone?: string;
  email?: string;
}

export interface TripForBooking {
  id: number;
  date_time: string;
  price_per_seat: number;
  seats: number;
  seats_reserved: number;
  status: string;
  origin: {
    id: number;
    address: string;
    main_text: string;
    latitude: string;
    longitude: string;
  };
  destination: {
    id: number;
    address: string;
    main_text: string;
    latitude: string;
    longitude: string;
  };
  vehicle: {
    brand: string;
    model: string;
    year: number;
    plate: string;
    color: string;
    photo_url: string;
  };
  driver: {
    first_name: string;
    last_name: string;
    photo_user: string;
    phone_number: string;
    average_rating: number;
  };
  available_seats: number;
}

export interface BookingResult {
  message: string;
  booking: {
    id: number;
    booking_qr: string;
    status: string;
    total_price: number;
    seats_reserved: number;
    passengers: number;
  };
}

export interface MyBooking {
  id: number;
  booking_date: string;
  booking_status: string;
  total_price: number;
  trip_id: number;
  seats_booked: number;
  booking_qr: string;
  trip: TripForBooking | null;
  passengers: BookingPassenger[];
}

export interface BookingDetails {
  id: number;
  booking_qr: string;
  booking_status: string;
  booking_date: string;
  total_price: number;
  seats_booked: number;
  trip_id: number;
  trip: TripForBooking | null;
  passengers: BookingPassenger[];
}

// Buscar viajes disponibles
export const searchTrips = async (
  origin?: string,
  destination?: string,
  date?: string,
  passengers?: number
): Promise<{ success: boolean; data?: { trips: TripForBooking[]; total: number }; error?: string }> => {
  try {
    const params = new URLSearchParams();
    if (origin) params.append('origin', origin);
    if (destination) params.append('destination', destination);
    if (date) params.append('date', date);
    if (passengers) params.append('passengers', passengers.toString());

    const response = await apiRequest(`/bookings/search?${params.toString()}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error searching trips:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error buscando viajes'
    };
  }
};

// Obtener detalles de un viaje específico
export const getTripDetails = async (tripId: number): Promise<{ success: boolean; data?: TripForBooking; error?: string }> => {
  try {
    const response = await apiRequest(`/reservas-pasajero/trip/${tripId}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error getting trip details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error obteniendo detalles del viaje'
    };
  }
};

// Reservar un viaje
export const bookTrip = async (
  tripId: number,
  passengers: BookingPassenger[],
  seatsNeeded: number
): Promise<{ success: boolean; data?: BookingResult; error?: string }> => {
  try {
    const requestData = {
      trip_id: tripId,
      passengers: passengers.map(p => ({
        fullName: p.fullName,
        identificationNumber: p.identificationNumber
      })),
      seats_booked: seatsNeeded
    };
    
    console.log('🎫 Booking trip with data:', requestData);
    
    const response = await apiRequest('/bookings/book', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
    
    console.log('✅ Booking response:', response);
    
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('❌ Error booking trip:', error);
    
    // Mejorar el logging del error
    let errorMessage = 'Error reservando viaje';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('📋 Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Obtener mis reservas como pasajero
export const getMyBookings = async (): Promise<{ success: boolean; data?: { bookings: MyBooking[] }; error?: string }> => {
  try {
    const response = await apiRequest('/bookings/my-bookings');
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error getting my bookings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error obteniendo mis reservas'
    };
  }
};

// Obtener detalles de una reserva específica
export const getBookingDetails = async (bookingId: number): Promise<{ success: boolean; data?: BookingDetails; error?: string }> => {
  try {
    const response = await apiRequest(`/bookings/booking/${bookingId}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error getting booking details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error obteniendo detalles de la reserva'
    };
  }
};

// Cancelar una reserva
export const cancelBooking = async (bookingId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    await apiRequest(`/bookings/booking/${bookingId}`, {
      method: 'DELETE'
    });
    return {
      success: true
    };
  } catch (error) {
    console.error('Error canceling booking:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error cancelando reserva'
    };
  }
};

// Validar código QR
export const validateQR = async (bookingQr: string, bookingId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    await apiRequest(`/cupos/validar/${bookingId}`, {
      method: 'POST',
      body: JSON.stringify({
        booking_qr: bookingQr
      })
    });
    return {
      success: true
    };
  } catch (error) {
    console.error('Error validating QR:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error validando QR'
    };
  }
};

// Obtener estadísticas de reservas del usuario
export const getBookingStats = async (): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const response = await apiRequest('/cupos/stats');
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error getting booking stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error obteniendo estadísticas'
    };
  }
};
