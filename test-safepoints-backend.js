// Test de conectividad de SafePoints con el backend
const API_BASE_URL = 'https://cupo-backend.fly.dev';

async function testSafePointsBackend() {
    console.log('🧪 Testing SafePoints Backend Connection...');
    console.log('🌐 Base URL:', API_BASE_URL);
    
    // Test 1: Buscar SafePoints cercanos
    try {
        console.log('\n1️⃣ Testing searchNearbySafePoints...');
        const searchResponse = await fetch(`${API_BASE_URL}/safepoints/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                latitude: 4.6097,  // Bogotá
                longitude: -74.0817,
                radius_km: 15,
                limit: 10
            })
        });
        
        const searchData = await searchResponse.json();
        console.log('✅ Search Response Status:', searchResponse.status);
        console.log('📊 Search Response Data:', searchData);
        
        if (searchData.success && searchData.safepoints) {
            console.log(`🎯 Found ${searchData.safepoints.length} SafePoints`);
        } else {
            console.log('❌ No SafePoints found or error occurred');
        }
        
    } catch (error) {
        console.error('❌ Error testing searchNearbySafePoints:', error);
    }
    
    // Test 2: Obtener SafePoints específicos de un viaje (ejemplo con trip_id = 1)
    try {
        console.log('\n2️⃣ Testing getTripSafePointSelections...');
        const tripId = 1; // Cambia esto por un trip_id real
        const tripResponse = await fetch(`${API_BASE_URL}/safepoints/trip/${tripId}/selections`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const tripData = await tripResponse.json();
        console.log('✅ Trip SafePoints Response Status:', tripResponse.status);
        console.log('📊 Trip SafePoints Response Data:', tripData);
        
        if (tripData.success) {
            console.log(`🎯 Trip ${tripId} SafePoints:`, {
                pickup_count: tripData.pickup_points?.length || 0,
                dropoff_count: tripData.dropoff_points?.length || 0
            });
        } else {
            console.log('❌ No trip-specific SafePoints found or error occurred');
        }
        
    } catch (error) {
        console.error('❌ Error testing getTripSafePointSelections:', error);
    }
    
    // Test 3: Verificar endpoint de status general
    try {
        console.log('\n3️⃣ Testing general API connectivity...');
        const statusResponse = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET'
        });
        
        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('✅ API Health Check:', statusData);
        } else {
            console.log('⚠️ API Health Check failed, status:', statusResponse.status);
        }
        
    } catch (error) {
        console.log('⚠️ No health endpoint or error:', error.message);
    }
    
    console.log('\n🏁 SafePoints Backend Test Complete!');
}

// Ejecutar el test
testSafePointsBackend();
