-- ENDPOINT PARA EL BACKEND: /api/trip/:tripId/passenger-safepoints
-- ARCHIVO: booking-safepoints.ts o reservas.ts

/*
ENDPOINT QUE NECESITAS AGREGAR AL BACKEND:

fastify.get<{ Params: { tripId: string } }>('/trip/:tripId/passenger-safepoints', async (request, reply) => {
  const token = extractAuthToken(request);
  
  if (!token) {
    return reply.status(401).send({ error: 'No autenticado' });
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user?.id) {
      return reply.status(401).send({ error: 'Token inválido' });
    }

    const tripId = parseInt(request.params.tripId);

    if (isNaN(tripId)) {
      return reply.status(400).send({ error: 'ID de viaje inválido' });
    }

    console.log(`🔍 [PASSENGER SAFEPOINTS] Obteniendo SafePoints de pasajeros para trip: ${tripId}`);

    // Verificar que el trip existe y que el usuario es el conductor
    const { data: trip, error: tripError } = await supabaseAdmin
      .from('trips')
      .select('id, user_id, status')
      .eq('id', tripId)
      .eq('user_id', user.id) // Solo el conductor puede ver esta información
      .single();

    if (tripError || !trip) {
      console.log(`❌ Trip ${tripId} no encontrado o no autorizado:`, tripError);
      return reply.status(404).send({ error: 'Viaje no encontrado o no autorizado' });
    }

    // Query compleja para obtener pasajeros con sus SafePoints
    const { data: passengerSafePoints, error: safepointsError } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        booking_qr,
        seats_booked,
        user_id,
        booking_passengers(
          full_name,
          identification_number
        ),
        booking_safepoint_selections(
          selection_type,
          passenger_notes,
          estimated_arrival_time,
          safepoints(
            id,
            name,
            address,
            category,
            latitude,
            longitude,
            category_display_name,
            icon_name,
            color_hex
          )
        )
      `)
      .eq('trip_id', tripId)
      .eq('booking_status', 'confirmed');

    if (safepointsError) {
      console.error('❌ Error fetching passenger safepoints:', safepointsError);
      return reply.status(500).send({ error: 'Error al obtener información de pasajeros' });
    }

    // Procesar los datos para el formato esperado por el frontend
    const processedPassengers = (passengerSafePoints || []).map(booking => {
      const passengerNames = booking.booking_passengers?.map(p => p.full_name).join(', ') || 'Sin nombre';
      
      // Separar SafePoints por tipo
      const pickupSelection = booking.booking_safepoint_selections?.find(s => s.selection_type === 'pickup');
      const dropoffSelection = booking.booking_safepoint_selections?.find(s => s.selection_type === 'dropoff');

      return {
        booking_id: booking.id,
        booking_qr: booking.booking_qr,
        passenger_name: passengerNames,
        seats_booked: booking.seats_booked,
        pickup_safepoint: pickupSelection?.safepoints || null,
        dropoff_safepoint: dropoffSelection?.safepoints || null,
        passenger_notes: pickupSelection?.passenger_notes || dropoffSelection?.passenger_notes || null,
        estimated_arrival_time: pickupSelection?.estimated_arrival_time || dropoffSelection?.estimated_arrival_time || null
      };
    });

    console.log(`✅ [PASSENGER SAFEPOINTS] Encontrados ${processedPassengers.length} pasajeros para trip ${tripId}`);

    return reply.send({
      success: true,
      trip_id: tripId,
      passenger_safepoints: processedPassengers,
      total_passengers: processedPassengers.length,
      with_pickup: processedPassengers.filter(p => p.pickup_safepoint).length,
      with_dropoff: processedPassengers.filter(p => p.dropoff_safepoint).length,
      with_notes: processedPassengers.filter(p => p.passenger_notes).length
    });

  } catch (error) {
    console.error('❌ Error fetching passenger safepoints:', error);
    return reply.status(500).send({ error: 'Error interno del servidor' });
  }
});

*/

-- QUERY SQL PARA TESTING (puedes ejecutar esto en Supabase para probar):

-- Ver bookings con SafePoints para un trip específico
SELECT 
  b.id as booking_id,
  b.booking_qr,
  b.seats_booked,
  bp.full_name as passenger_name,
  bss.selection_type,
  bss.passenger_notes,
  bss.estimated_arrival_time,
  sp.id as safepoint_id,
  sp.name as safepoint_name,
  sp.address,
  sp.category,
  sp.latitude,
  sp.longitude
FROM bookings b
LEFT JOIN booking_passengers bp ON b.id = bp.booking_id
LEFT JOIN booking_safepoint_selections bss ON b.id = bss.booking_id
LEFT JOIN safepoints sp ON bss.safepoint_id = sp.id
WHERE b.trip_id = 45 -- Cambiar por el trip_id que quieras probar
  AND b.booking_status = 'confirmed'
ORDER BY b.id, bss.selection_type;

-- Ver estadísticas rápidas de SafePoints por trip
SELECT 
  b.trip_id,
  COUNT(DISTINCT b.id) as total_bookings,
  COUNT(DISTINCT CASE WHEN bss.selection_type = 'pickup' THEN b.id END) as bookings_with_pickup,
  COUNT(DISTINCT CASE WHEN bss.selection_type = 'dropoff' THEN b.id END) as bookings_with_dropoff,
  SUM(b.seats_booked) as total_seats_booked
FROM bookings b
LEFT JOIN booking_safepoint_selections bss ON b.id = bss.booking_id
WHERE b.trip_id = 45 -- Cambiar por el trip_id que quieras probar
  AND b.booking_status = 'confirmed'
GROUP BY b.trip_id;
