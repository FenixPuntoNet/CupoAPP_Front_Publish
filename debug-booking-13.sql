-- SQL query to check booking and trip data
-- Execute this in your Supabase SQL editor

-- Check the booking with ID 13
SELECT 
  b.id as booking_id,
  b.trip_id,
  b.booking_status,
  b.total_price,
  b.seats_booked,
  b.booking_date,
  t.id as trip_exists,
  t.status as trip_status,
  t.date_time as trip_date
FROM bookings b
LEFT JOIN trips t ON b.trip_id = t.id
WHERE b.id = 13;

-- Check if the trip exists
SELECT id, status, date_time, user_id 
FROM trips 
WHERE id = (SELECT trip_id FROM bookings WHERE id = 13);

-- Check related data
SELECT 
  b.id as booking_id,
  b.trip_id,
  t.id as trip_id_check,
  l1.address as origin_address,
  l2.address as destination_address,
  v.brand as vehicle_brand,
  v.model as vehicle_model,
  up.first_name as driver_first_name,
  up.last_name as driver_last_name
FROM bookings b
LEFT JOIN trips t ON b.trip_id = t.id
LEFT JOIN locations l1 ON t.origin_id = l1.id
LEFT JOIN locations l2 ON t.destination_id = l2.id
LEFT JOIN vehicles v ON t.vehicle_id = v.id
LEFT JOIN user_profiles up ON t.user_id = up.user_id
WHERE b.id = 13;
