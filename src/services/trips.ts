import { apiRequest } from '@/config/api';

export interface TripSearchParams {
  origin?: string;
  destination?: string;
  date?: string;
  passengers?: number;
}

export interface TripSearchResult {
  id: string;
  origin: string;
  destination: string;
  dateTime: string;
  seats: number;
  pricePerSeat: number;
  allowPets: boolean;
  allowSmoking: boolean;
  selectedRoute: {
    duration: string;
    distance: string;
  };
  driverName: string;
  photo: string;
  vehicle: {
    brand?: string;
    model?: string;
    plate?: string;
    color?: string;
    photo_url?: string;
    year?: string;
  };
  license?: any;
  propertyCard?: any;
  soat?: any;
  rating?: number;
  suggestedPrice?: number;
}

// Buscar viajes usando el endpoint del backend
// Transform backend response to frontend format
const transformTripResponse = (trip: any): TripSearchResult => {
  // Obtener información de ruta desde diferentes fuentes posibles
  const routeInfo = trip.route || trip.selectedRoute || {};
  
  // Mapear duración desde diferentes campos posibles
  const duration = routeInfo.duration || 
                   trip.duration || 
                   trip.estimated_duration || 
                   trip.route_duration ||
                   '41 min';
  
  // Mapear distancia desde diferentes campos posibles  
  const distance = routeInfo.distance || 
                   trip.distance || 
                   trip.estimated_distance || 
                   trip.route_distance ||
                   '15.3 km';
  
  console.log('🗺️ Route mapping for trip', trip.id, ':', {
    routeInfo,
    finalDuration: duration,
    finalDistance: distance,
    rawDuration: trip.duration,
    rawDistance: trip.distance
  });
  
  return {
    id: trip.id?.toString() || trip.trip_id?.toString() || '',
    origin: trip.origin || trip.route?.start_address || '',
    destination: trip.destination || trip.route?.end_address || '',
    dateTime: trip.dateTime || trip.date_time || '',
    seats: trip.available_seats || trip.seats || 0,
    pricePerSeat: trip.pricePerSeat || trip.price_per_seat || 0,
    allowPets: trip.allowPets ?? ((trip.allow_pets === 'Y') || false),
    allowSmoking: trip.allowSmoking ?? ((trip.allow_smoking === 'Y') || false),
    selectedRoute: {
      duration: duration,
      distance: distance
    },
    driverName: trip.driverName || trip.driver_name || '',
    photo: trip.photo && trip.photo.trim() 
      ? trip.photo.replace('/resources/Home/', '/resourcers/Home/')
      : 'https://tddaveymppuhweujhzwz.supabase.co/storage/v1/object/public/resourcers/Home/SinFotoPerfil.png',
    vehicle: trip.vehicle || {},
    license: trip.license,
    propertyCard: trip.propertyCard,
    soat: trip.soat,
    rating: trip.rating || 0,
    suggestedPrice: trip.suggestedPrice
  };
};

export const searchTrips = async (params: TripSearchParams): Promise<{
  trips: TripSearchResult[];
  message: string;
  status: 'exact' | 'close' | 'date' | 'all' | 'none';
}> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.origin) queryParams.append('origin', params.origin);
    if (params.destination) queryParams.append('destination', params.destination);
    if (params.date) queryParams.append('date', params.date);
    if (params.passengers) queryParams.append('passengers', params.passengers.toString());

    console.log('🔍 Searching trips with params:', params);
    console.log('🔗 Query URL:', `/reservas/search?${queryParams.toString()}`);

    const response = await apiRequest(`/reservas/search?${queryParams.toString()}`);
    
    console.log('📡 Backend response:', response);

    // Log para verificar la estructura de routes en la respuesta
    if (response.trips && response.trips.length > 0) {
      console.log('🗺️ Route info from first trip:', {
        route: response.trips[0].route,
        duration: response.trips[0].duration,
        distance: response.trips[0].distance,
        estimated_duration: response.trips[0].estimated_duration,
        estimated_distance: response.trips[0].estimated_distance
      });
    }

    // El backend ahora devuelve directamente la estructura que necesitamos
    const transformedTrips = (response.trips || []).map(transformTripResponse);
    
    console.log('✅ Processed results:', {
      count: transformedTrips.length,
      message: response.message,
      searchStatus: response.searchStatus,
      status: response.status
    });

    return {
      trips: transformedTrips,
      message: response.message || 'Búsqueda completada',
      status: response.searchStatus || response.status || 'none'
    };
  } catch (error) {
    console.error('❌ Error searching trips:', error);
    
    // Manejo más específico de errores
    let errorMessage = 'Error al buscar viajes. Por favor intenta de nuevo.';
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Error del servidor. El sistema está procesando tu solicitud, intenta en unos momentos.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Servicio de búsqueda no disponible temporalmente.';
      } else if (error.message.includes('400')) {
        errorMessage = 'Parámetros de búsqueda inválidos. Verifica los datos ingresados.';
      } else {
        errorMessage = `Error técnico: ${error.message}`;
      }
    }
    
    // En caso de error, devolver respuesta vacía con mensaje de error específico
    return {
      trips: [],
      message: errorMessage,
      status: 'none'
    };
  }
};

// Obtener detalles de un viaje específico
export const getTripDetails = async (tripId: string): Promise<TripSearchResult | null> => {
  try {
    const response = await apiRequest(`/viajes/trip/${tripId}`);
    return response ? transformTripResponse(response) : null;
  } catch (error) {
    console.error('Error getting trip details:', error);
    return null;
  }
};

// Re-exportar funciones de configuración para mantener compatibilidad
export { getAssumptions, calculateSuggestedPrice } from './config';
