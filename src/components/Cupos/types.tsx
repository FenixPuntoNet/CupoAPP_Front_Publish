export interface Passenger {
    passenger_id: number;
    full_name: string;
    identification_number: string;
    booking_qr: string;
}

export interface Booking {
  booking_id: number; // Corresponde a `id` en `bookings`
  trip_id: number | null; // Puede ser `null` según la base de datos
  user_id: string | null; // Puede ser `null` según la base de datos
  seats_booked: number | null; // Puede ser `null` según la base de datos
  booking_date: string | null; // Puede ser `null` según la base de datos
  total_price: number;
  booking_status: string | null; // Puede ser `null` según la base de datos
  booking_qr?: string; // Opcional, ya que puede ser generado
  passengers?: Passenger[]; // Relación con `booking_passengers`
}


export interface Passenger {
    passenger_id: number;
    full_name: string;
    identification_number: string;
    booking_qr: string;
    status_passenger: string;
    payment_id: number;
    payment_date: string;
    payment_method: string;
    amount: string;
    payment_status: string;
    booking_id: number;
    seats_booked: number;
    booking_date: string;
    total_price: string;
    booking_status: string;
    booking_message: string;
    user_id_booking: number;
    first_name_booking: string;
    last_name_booking: string;
    phone_number_booking: string;
    user_type_booking: string;
    trip_id: number;
    origin_id: number;
    destination_id: number;
    route_id: number;
    user_id: number;
    vehicle_id: number;
    date_time: string;
    seats: number;
    price_per_seat: string;
    description: string;
    allow_pets: number;
    allow_smoking: number;
    status: string;
    created_at: string;
    main_text_origen: string;
    secondary_text_origen: string;
    main_text_destination: string;
    secondary_text_destination: string;
    brand: string;
    model: string;
    year: number;
    plate: string;
    color: string;
    body_type: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    user_type: string;
    distance: string;
    duration: string;
    summary: string;
}



export interface BookedPassenger {
    full_name: string;
    identification_number: string;
    booking_qr: string;
    passenger_id: number;
     seats_booked: number;
    payment_status: string;
    trip_id: number;
}