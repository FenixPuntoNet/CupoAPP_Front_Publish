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
  user_profiles?: {
    first_name: string;
    last_name: string;
    phone_number?: string;
  };
}

interface Trip {
  id: number;
  date_time: string;
  status: string;
  user_id: string;
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
  };
  driver: {
    first_name: string;
    last_name: string;
    photo_user: string;
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
  user_id: string;
  seats_booked: number;
  booking_qr: string;
  passengers: Passenger[];
  trip: Trip | null;
}

// Obtener cupos reservados para un viaje específico (para conductores)
export const getCuposReservados = async (tripId: number): Promise<{ success: boolean; data?: { tripId: number; bookings: Booking[] }; error?: string }> => {
  try {
    console.log('🎫 [getCuposReservados] Requesting cupos for tripId:', tripId);
    const response = await apiRequest(`/cupos/reservados?tripId=${tripId}`);
    console.log('✅ [getCuposReservados] Response received:', response);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('❌ [getCuposReservados] Error getting cupos reservados:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener cupos reservados'
    };
  }
};

// Validar un cupo específico (escaneo QR)
export const validateCupo = async (bookingId: number, qrCode: string): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    console.log('🔍 [validateCupo] Validating booking:', bookingId, 'with QR:', qrCode);
    const response = await apiRequest(`/cupos/validar/${bookingId}`, {
      method: 'POST',
      body: JSON.stringify({ qrCode })
    });
    console.log('✅ [validateCupo] Validation successful:', response);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('❌ [validateCupo] Error validating cupo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al validar cupo'
    };
  }
};

// Obtener estadísticas de cupos para un conductor
export const getCuposStats = async (): Promise<{ success: boolean; data?: CupoStats; error?: string }> => {
  try {
    console.log('📊 [getCuposStats] Requesting cupos stats');
    const response = await apiRequest('/cupos/stats');
    console.log('✅ [getCuposStats] Stats received:', response);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('❌ [getCuposStats] Error getting cupos stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener estadísticas'
    };
  }
};

// Obtener mis cupos comprados (como pasajero)
export const getMisCupos = async (): Promise<{ success: boolean; data?: { cupos: CupoWithDetails[] }; error?: string }> => {
  try {
    console.log('🎫 [CuposService] Calling /bookings/my-bookings...');
    const response = await apiRequest('/bookings/my-bookings');
    
    console.log('🎫 [CuposService] Raw backend response:', JSON.stringify(response, null, 2));
    
    // Transformar la respuesta del backend para que coincida con la interfaz esperada
    const transformedResponse = {
      cupos: response.bookings?.map((booking: any) => {
        console.log('🎫 [CuposService] Processing booking:', JSON.stringify(booking, null, 2));
        console.log('🎫 [CuposService] Trip in booking:', booking.trip);
        console.log('🎫 [CuposService] Trip user_id:', booking.trip?.user_id);
        
        return {
          id: booking.id,
          booking_date: booking.booking_date,
          booking_status: booking.booking_status,
          total_price: booking.total_price,
          trip_id: booking.trip_id,
          user_id: booking.user_id || '',
          seats_booked: booking.seats_booked,
          booking_qr: booking.booking_qr,
          passengers: booking.passengers || [],
          trip: booking.trip
        };
      }) || []
    };
    
    console.log('🎫 [CuposService] Transformed response:', JSON.stringify(transformedResponse, null, 2));
    
    return {
      success: true,
      data: transformedResponse
    };
  } catch (error) {
    console.error('❌ [CuposService] Error in getMisCupos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener cupos'
    };
  }
};

// Obtener detalles de un ticket específico
export const getTicketDetails = async (bookingId: number): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    console.log('🎫 [getTicketDetails] Requesting ticket details for bookingId:', bookingId);
    const response = await apiRequest(`/cupos/ticket/${bookingId}`);
    console.log('✅ [getTicketDetails] Response received:', response);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('❌ [getTicketDetails] Error getting ticket details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener detalles del ticket'
    };
  }
};
