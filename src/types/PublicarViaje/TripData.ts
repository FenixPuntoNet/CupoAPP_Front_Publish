//types/PublicarViaje/TripData.ts
export interface TripLocation {
    placeId: string;
    address: string;
    latitude: number;
    longitude: number;
     mainText?: string;
    secondaryText?: string;
     postalCode?: string;
}

export interface TripRoute {
  index: number,
    distance: string,
    duration: string,
    summary: string,
    startAddress: string,
    endAddress: string,
     polyline: string
}
export interface TripStopover {
    location: TripLocation;
    order: number;
     estimatedTime: string;
}
export interface TripData {
    origin?: TripLocation;
    destination?: TripLocation;
    selectedRoute?: TripRoute;
   stopovers?:TripStopover[];
    id?: string;
      dateTime?: string;
    seats?: number;
    pricePerSeat?: number;
    description?: string;
    allowPets?: boolean;
    allowSmoking?: boolean;
    status?: string;
    createdAt?: string
}

