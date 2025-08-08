// Test script para verificar endpoints de account management
const fetch = require('node-fetch');

const API_BASE_URL = 'https://cupo-backend.fly.dev';

// Simulamos un token de prueba (reemplazar con uno real)
const TEST_TOKEN = 'your_jwt_token_here';

async function testAccountEndpoints() {
  console.log('🧪 Testing Account Management Endpoints...\n');

  // Test 1: Verificar elegibilidad
  console.log('1. Testing /account-management/can-deactivate');
  try {
    const response = await fetch(`${API_BASE_URL}/account-management/can-deactivate`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });

    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   Response:', JSON.stringify(data, null, 2));
    } else {
      const errorData = await response.text();
      console.log('   Error:', errorData);
    }
  } catch (error) {
    console.log('   Network Error:', error.message);
  }

  console.log('\n');

  // Test 2: Verificar endpoint de health/status
  console.log('2. Testing backend health');
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET'
    });

    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   Response:', JSON.stringify(data, null, 2));
    } else {
      const errorData = await response.text();
      console.log('   Error:', errorData);
    }
  } catch (error) {
    console.log('   Network Error:', error.message);
  }

  console.log('\n');

  // Test 3: Verificar rutas disponibles
  console.log('3. Testing available routes');
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET'
    });

    console.log(`   Status: ${response.status}`);
    const text = await response.text();
    console.log('   Response preview:', text.substring(0, 200) + '...');
  } catch (error) {
    console.log('   Network Error:', error.message);
  }
}

testAccountEndpoints();
