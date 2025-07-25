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
  return {
    id: trip.id?.toString() || trip.trip_id?.toString() || '',
    origin: trip.origin?.address || trip.origin || '',
    destination: trip.destination?.address || trip.destination || '',
    dateTime: trip.dateTime || trip.date_time || '',
    seats: trip.available_seats || trip.seats || 0,
    pricePerSeat: trip.pricePerSeat || trip.price_per_seat || 0,
    allowPets: trip.allowPets ?? trip.allow_pets ?? false,
    allowSmoking: trip.allowSmoking ?? trip.allow_smoking ?? false,
    selectedRoute: {
      duration: trip.selectedRoute?.duration || 'Duración estimada no disponible',
      distance: trip.selectedRoute?.distance || 'Distancia estimada no disponible'
    },
    driverName: trip.driverName || '',
    photo: trip.photo || 'https://tddaveymppuhweujhzwz.supabase.co/storage/v1/object/public/resources/Home/SinFotoPerfil.png',
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

    const response = await apiRequest(`/viajes/search?${queryParams.toString()}`);
    
    return {
      trips: (response.trips || []).map(transformTripResponse),
      message: response.message || '',
      status: response.status || 'none'
    };
  } catch (error) {
    console.error('Error searching trips:', error);
    throw error;
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
