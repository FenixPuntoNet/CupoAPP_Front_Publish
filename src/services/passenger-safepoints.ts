// Servicio para obtener SafePoints de pasajeros por trip
export interface PassengerSafePoint {
  booking_id: number;
  booking_qr: string;
  passenger_name: string;
  passenger_phone?: string;
  seats_booked: number;
  pickup_safepoint?: {
    id: number;
    name: string;
    address: string;
    category: string;
    latitude: number;
    longitude: number;
    category_display_name?: string;
    icon_name?: string;
    color_hex?: string;
  };
  dropoff_safepoint?: {
    id: number;
    name: string;
    address: string;
    category: string;
    latitude: number;
    longitude: number;
    category_display_name?: string;
    icon_name?: string;
    color_hex?: string;
  };
  passenger_notes?: string;
  estimated_arrival_time?: string;
}

/**
 * Obtener los SafePoints seleccionados por los pasajeros de un trip específico
 * @param tripId - ID del trip
 * @returns Array de pasajeros con sus SafePoints seleccionados
 */
export async function getTripPassengerSafePoints(tripId: number): Promise<{
  success: boolean;
  passenger_safepoints?: PassengerSafePoint[];
  error?: string;
}> {
  try {
    console.log(`🔍 Obteniendo SafePoints de pasajeros para trip: ${tripId}`);
    
    const response = await fetch(`https://cupo.site/api/trip/${tripId}/passenger-safepoints`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      console.log(`✅ SafePoints de pasajeros obtenidos:`, data.passenger_safepoints);
      return {
        success: true,
        passenger_safepoints: data.passenger_safepoints || []
      };
    } else {
      console.error(`❌ Error del backend:`, data.error);
      return {
        success: false,
        error: data.error || 'Error desconocido del servidor'
      };
    }
  } catch (error) {
    console.error('❌ Error obteniendo SafePoints de pasajeros:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión'
    };
  }
}
