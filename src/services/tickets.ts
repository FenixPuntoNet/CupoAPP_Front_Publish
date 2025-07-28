import { apiRequest } from '@/config/api';

export interface TicketData {
  booking: {
    id: number;
    booking_qr: string;
    booking_date: string;
    seats_booked: number;
    total_price: number;
    booking_status: string;
  };
  trip: {
    id: number;
    date_time: string;
    status: string;
    allow_pets: boolean;
    allow_smoking: boolean;
    route: {
      origin: string;
      destination: string;
      duration: string;
      distance: string;
    };
  };
  driver: {
    name: string;
    photo: string;
    phone: string;
    rating: number | null;
    license: {
      license_number: string;
      license_category: string;
      expiration_date: string;
    } | null;
  };
  vehicle: {
    brand: string;
    model: string;
    plate: string;
    color: string;
    year: string;
    photo: string;
    capacity: string;
    soat: {
      validity_to: string;
      insurance_company: string;
    } | null;
  };
  passengers: Array<{
    id: number;
    full_name: string;
    identification_number: string;
    status: string;
  }>;
}

export interface QRValidationResult {
  booking: {
    id: number;
    qr_code: string;
    status: string;
    seats_booked: number;
    total_price: number;
    is_expired: boolean;
    trip: {
      date_time: string;
      status: string;
      route: {
        start_address: string;
        end_address: string;
      };
    };
    passengers: Array<{
      full_name: string;
      identification_number: string;
    }>;
  };
  user_role: 'driver' | 'passenger';
}

// Obtener detalles del ticket para mostrar
export const getTicketDetails = async (bookingId: string): Promise<{ success: boolean; data?: { ticket: TicketData }; error?: string }> => {
  try {
    console.log('🎫 [tickets.ts] Fetching ticket details for booking:', bookingId);
    const response = await apiRequest(`/tickets/view?booking_id=${bookingId}`);
    
    console.log('📡 [tickets.ts] Backend response:', response);
    
    if (response.success && response.ticket) {
      return {
        success: true,
        data: { ticket: response.ticket }
      };
    } else {
      return {
        success: false,
        error: response.error || 'No se encontraron datos del ticket'
      };
    }
  } catch (error) {
    console.error('❌ [tickets.ts] Error getting ticket details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error obteniendo detalles del ticket'
    };
  }
};

// Validar código QR de una reserva
export const validateTicketQR = async (qrCode: string): Promise<{ success: boolean; data?: QRValidationResult; error?: string }> => {
  try {
    const response = await apiRequest('/tickets/validate-qr', {
      method: 'POST',
      body: JSON.stringify({ qr_code: qrCode })
    });
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error validating QR:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error validando código QR'
    };
  }
};

// Cancelar una reserva
export const cancelTicket = async (bookingId: number, reason?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    await apiRequest('/tickets/cancel', {
      method: 'POST',
      body: JSON.stringify({
        booking_id: bookingId,
        reason
      })
    });
    return {
      success: true
    };
  } catch (error) {
    console.error('Error canceling ticket:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error cancelando ticket'
    };
  }
};
