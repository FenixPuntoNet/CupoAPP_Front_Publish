export async function getTicketDetails(bookingId: string) {
  console.log('🎫 [Telefunc] Getting ticket details for booking_id:', bookingId);
  
  // For now, let's return mock data to test the connection
  return {
    success: true,
    ticket: {
      booking: {
        id: parseInt(bookingId),
        booking_qr: `QR-${bookingId}-${Date.now()}`,
        booking_date: new Date().toISOString(),
        seats_booked: 2,
        total_price: 50000,
        booking_status: 'confirmed'
      },
      trip: {
        id: 1,
        date_time: new Date().toISOString(),
        status: 'active',
        allow_pets: true,
        allow_smoking: false,
        route: {
          origin: 'Bogotá, Colombia',
          destination: 'Medellín, Colombia',
          duration: '8 hours',
          distance: '415 km'
        }
      },
      driver: {
        name: 'Juan Pérez',
        photo: 'https://tddaveymppuhweujhzwz.supabase.co/storage/v1/object/public/resources/Home/SinFotoPerfil.png',
        phone: '+57 300 123 4567',
        rating: 4.8,
        license: {
          license_number: 'C1234567890',
          license_category: 'C1',
          expiration_date: '2025-12-31'
        }
      },
      vehicle: {
        brand: 'Toyota',
        model: 'Corolla',
        plate: 'ABC123',
        color: 'Blanco',
        year: '2020',
        photo: 'https://tddaveymppuhweujhzwz.supabase.co/storage/v1/object/public/resources/Home/SinFotoAuto.png',
        capacity: '4',
        soat: {
          validity_to: '2025-12-31',
          insurance_company: 'Seguros Bolivar'
        }
      },
      passengers: [
        {
          id: 1,
          full_name: 'María García',
          identification_number: '1234567890',
          status: 'confirmed'
        },
        {
          id: 2,
          full_name: 'Carlos López',
          identification_number: '0987654321',
          status: 'confirmed'
        }
      ]
    }
  };
}
