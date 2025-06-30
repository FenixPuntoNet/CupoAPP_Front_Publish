export interface Trip {
  id: string;
  origin: {
    address: string;
    secondaryText: string;
  };
  destination: {
    address: string;
    secondaryText: string;
  };
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
  vehicle?: {
    brand: string | null;
    model: string | null;
    plate: string;
    color?: string | null;
    photo_url?: string | null;
    year?: number | null;
  } | null;
  license?: {
    license_number: string | null;
    license_category: string | null;
    expiration_date: string | null;
    user_id: string | null;
  } | null;
  propertyCard?: {
    passager_capacity: number | null;
    vehicle_id: number | null;
  } | null;
  soat?: {
    validity_to: string | null;
    insurance_company: string | null;
    vehicle_id: number | null;
  } | null;
  rating?: number;
}