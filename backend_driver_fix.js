// Corrección para el endpoint /booking/:bookingId en reservas.ts
// Líneas 549-670 aproximadamente

// En la línea 549, cambiar la consulta del conductor para incluir más fallbacks:

// ANTES:
// const { data: driver, error: driverError } = await supabaseAdmin
//   .from('user_profiles')
//   .select('user_id, first_name, last_name, photo_user, phone_number, average_rating')
//   .eq('user_id', trip.user_id)
//   .single();

// DESPUÉS:
console.log('🔍 [reservas] Looking for driver with user_id:', trip.user_id);

// Primero intentar obtener de user_profiles
const { data: driver, error: driverError } = await supabaseAdmin
  .from('user_profiles')
  .select('user_id, first_name, last_name, photo_user, phone_number, average_rating')
  .eq('user_id', trip.user_id)
  .maybeSingle(); // Cambiar de .single() a .maybeSingle() para evitar errores si no existe

console.log('🔍 [reservas] Driver query result:', {
  driver: driver,
  driverError: driverError,
  trip_user_id: trip.user_id
});

// Si no se encuentra en user_profiles, intentar obtener de auth.users como fallback
let driverInfo = driver;
if (!driver && !driverError) {
  console.log('🔧 [reservas] Driver not found in user_profiles, trying auth.users...');
  
  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(trip.user_id);
    
    if (authData?.user && !authError) {
      console.log('✅ [reservas] Found user in auth.users:', authData.user.email);
      
      // Crear un objeto driver con información básica de auth
      driverInfo = {
        user_id: trip.user_id,
        first_name: authData.user.user_metadata?.first_name || 'Conductor',
        last_name: authData.user.user_metadata?.last_name || '',
        photo_user: null,
        phone_number: authData.user.phone || null,
        average_rating: 0
      };
    } else {
      console.error('❌ [reservas] User not found in auth.users either:', authError);
    }
  } catch (authFallbackError) {
    console.error('❌ [reservas] Auth fallback failed:', authFallbackError);
  }
}

if (driverError && driverError.code !== 'PGRST116') { // PGRST116 es "no rows returned"
  console.error('❌ [reservas] Driver query error:', {
    error: driverError,
    message: driverError.message,
    details: driverError.details,
    hint: driverError.hint,
    code: driverError.code,
    trip_user_id: trip.user_id
  });
}

// Luego en la construcción de la respuesta (línea 608 aproximadamente), cambiar:

// ANTES:
// driver: driver ? {
//   user_id: driver.user_id,
//   first_name: driver.first_name,
//   last_name: driver.last_name,
//   names: `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || 'Conductor no disponible',
//   ...

// DESPUÉS:
driver: driverInfo ? {
  user_id: driverInfo.user_id,
  first_name: driverInfo.first_name,
  last_name: driverInfo.last_name,
  names: (() => {
    const fullName = `${driverInfo.first_name || ''} ${driverInfo.last_name || ''}`.trim();
    console.log('📦 [reservas] Building driver name:', {
      first_name: driverInfo.first_name,
      last_name: driverInfo.last_name,
      fullName: fullName,
      isEmpty: !fullName
    });
    return fullName || 'Conductor no disponible';
  })(),
  photo_user: driverInfo.photo_user,
  photo: driverInfo.photo_user,
  phone_number: driverInfo.phone_number,
  phone: driverInfo.phone_number,
  average_rating: driverInfo.average_rating || 0
} : {
  user_id: trip.user_id,
  first_name: 'Conductor',
  last_name: 'No disponible',
  names: 'Conductor no disponible',
  photo_user: null,
  photo: null,
  phone_number: null,
  phone: null,
  average_rating: 0
},
