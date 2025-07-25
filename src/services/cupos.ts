import { apiRequest } from '@/config/api';

interface Passenger {
  id: number;
  full_name: string;
  identification_number: string;
  status?: string;
}

interface Booking {
  id: number;
  booking_status: string;
  seats_booked: number;
  total_price: number;
  booking_qr: string;
  booking_date: string;
  user_id: string;
  passengers: Passenger[];
}

interface Trip {
  id: number;
  date_time: string;
  status: string;
  origin: {
    address: string;
    main_text: string;
  };
  destination: {
    address: string;
    main_text: string;
  };
  vehicle: {
    brand: string;
    model: string;
    plate: string;
    color: string;
    year?: number;
  };
  driver: {
    first_name: string;
    last_name: string;
    photo_user: string | null;
    phone_number: string;
  };
}

interface CupoStats {
  total_cupos_sold: number;
  cupos_completed: number;
  cupos_pending: number;
  cupos_cancelled: number;
  total_earnings: number;
  total_seats_sold: number;
  average_price_per_cupo: number;
}

interface CupoWithDetails {
  id: number;
  booking_date: string;
  booking_status: string;
  total_price: number;
  trip_id: number;
  seats_booked: number;
  booking_qr: string;
  trip: Trip | null;
  passengers: Passenger[];
}

interface TicketData {
  booking: {
    id: number;
    booking_qr: string;
    booking_status: string;
    booking_date: string;
    total_price: number;
    seats_booked: number;
    trip_id: number;
    qr_code: string;
  };
  trip: Trip | null;
  passengers: Passenger[];
}

// Obtener cupos reservados para un viaje específico (para conductores)
export const getCuposReservados = async (tripId: number): Promise<{ success: boolean; data?: { tripId: number; bookings: Booking[] }; error?: string }> => {
  try {
    const response = await apiRequest(`/cupos/reservados?tripId=${tripId}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error getting cupos reservados:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener cupos reservados'
    };
  }
};

// Validar un cupo específico (QR scan)
export const validateCupo = async (bookingId: number, qrCode: string): Promise<{ success: boolean; data?: { message: string; status: string }; error?: string }> => {
  try {
    const response = await apiRequest(`/cupos/validar/${bookingId}`, {
      method: 'POST',
      body: JSON.stringify({ bookingId, qrCode })
    });
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error validating cupo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al validar cupo'
    };
  }
};

// Obtener estadísticas de cupos para un conductor
export const getCuposStats = async (): Promise<{ success: boolean; data?: CupoStats; error?: string }> => {
  try {
    const response = await apiRequest('/cupos/stats');
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error getting cupos stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener estadísticas de cupos'
    };
  }
};

// Obtener mis cupos comprados (como pasajero)
export const getMisCupos = async (): Promise<{ success: boolean; data?: { cupos: CupoWithDetails[] }; error?: string }> => {
  try {
    const response = await apiRequest('/cupos/mis-cupos');
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error getting mis cupos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener mis cupos'
    };
  }
};

// Obtener detalles de un cupo específico (ticket)
export const getTicketDetails = async (bookingId: number): Promise<{ success: boolean; data?: TicketData; error?: string }> => {
  try {
    const response = await apiRequest(`/cupos/ticket/${bookingId}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error getting ticket details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener detalles del ticket'
    };
  }
};
