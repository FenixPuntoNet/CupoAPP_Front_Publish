#!/usr/bin/env node

/**
 * Script de verificación completa de conexión con el backend
 * Verifica que todos los servicios estén usando los endpoints correctos
 */

const fs = require('fs');
const path = require('path');

// Endpoints disponibles según el backend
const BACKEND_ENDPOINTS = {
  // Auth endpoints
  auth: [
    '/auth/signup',
    '/auth/login', 
    '/auth/logout',
    '/auth/me',
    '/auth/recover-account',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/change-password',
    '/auth/validate-password',
    '/auth/check-email',
    '/auth/debug-user'
  ],
  
  // Profile completion endpoints
  profileComplete: [
    '/profile-complete/profile',
    '/profile-complete/upload-photo'
  ],
  
  // Vehicle endpoints
  vehiculos: [
    '/vehiculos/my-vehicle',
    '/vehiculos/register',
    '/vehiculos/upload-vehicle-photo',
    '/vehiculos/property-card',
    '/vehiculos/upload-property-photos',
    '/vehiculos/driver-license',
    '/vehiculos/upload-license-photos',
    '/vehiculos/soat',
    '/vehiculos/upload-soat-photos',
    '/vehiculos/documents-status',
    '/vehiculos/update-basic-info',
    '/vehiculos/update-property-info',
    '/vehiculos/update-license-info',
    '/vehiculos/update-soat-info',
    '/vehiculos/validate-vehicle',
    '/vehiculos/driver-stats'
  ],
  
  // Maps endpoints
  maps: [
    '/maps/autocomplete',
    '/maps/place-details',
    '/maps/reverse-geocode',
    '/maps/text-search',
    '/maps/calculate-route',
    '/maps/popular-places'
  ],
  
  // Other endpoints
  other: [
    '/viajes/publish',
    '/viajes/search',
    '/viajes/my-trips',
    '/bookings/search',
    '/bookings/book',
    '/bookings/my-bookings',
    '/bookings/booking',
    '/cupos/mis-cupos',
    '/cupos/reservados',
    '/cupos/validar',
    '/cupos/ticket',
    '/actividades/summary',
    '/actividades/recent',
    '/actividades/stats',
    '/ayuda/assistant',
    '/ayuda/messages',
    '/ayuda/send-message',
    '/config/assumptions',
    '/config/calculate-price',
    '/cupones/redeemed',
    '/cupones/redeem',
    '/cupones/referral',
    '/cupones/register-referral',
    '/change/balance',
    '/change/items',
    '/change/redeem',
    '/change/history',
    '/change/goals',
    '/change/claim-goal',
    '/chat/list',
    '/chat/messages',
    '/chat/trip',
    '/tickets/view',
    '/tickets/validate-qr',
    '/tickets/cancel',
    '/wallet/transactions',
    '/wallet/info',
    '/wallet/balance',
    '/locations/create',
    '/locations/search',
    '/locations/popular',
    '/locations/user/recent',
    '/paradas/create',
    '/paradas/trip',
    '/paradas/update',
    '/paradas/reorder',
    '/paradas/create-location',
    '/paradas/search-locations'
  ]
};

// Función para verificar archivos de servicios
function checkServiceFiles() {
  console.log('🔍 Checking service files...\n');
  
  const servicesDir = './src/services';
  let issues = [];
  let correctEndpoints = 0;
  let totalEndpoints = 0;
  
  try {
    const serviceFiles = fs.readdirSync(servicesDir).filter(file => file.endsWith('.ts'));
    
    for (const file of serviceFiles) {
      console.log(`📁 Checking ${file}...`);
      const filePath = path.join(servicesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Buscar todas las llamadas a apiRequest
      const apiRequestRegex = /apiRequest\(['"](.*?)['"][,\)]/g;
      let match;
      
      while ((match = apiRequestRegex.exec(content)) !== null) {
        const endpoint = match[1];
        totalEndpoints++;
        
        // Verificar si el endpoint existe en el backend
        const isValidEndpoint = Object.values(BACKEND_ENDPOINTS).flat().includes(endpoint);
        
        if (isValidEndpoint) {
          console.log(`  ✅ ${endpoint}`);
          correctEndpoints++;
        } else {
          console.log(`  ❌ ${endpoint} - NOT FOUND IN BACKEND`);
          issues.push({
            file,
            endpoint,
            issue: 'Endpoint not found in backend'
          });
        }
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error reading services directory:', error.message);
  }
  
  return { issues, correctEndpoints, totalEndpoints };
}

// Función para verificar configuración de API
function checkApiConfig() {
  console.log('🔧 Checking API configuration...\n');
  
  const apiConfigPath = './src/config/api.ts';
  let configIssues = [];
  
  if (fs.existsSync(apiConfigPath)) {
    const content = fs.readFileSync(apiConfigPath, 'utf8');
    
    // Verificar API_BASE_URL
    if (content.includes('API_BASE_URL') && content.includes('cupo-backend.fly.dev')) {
      console.log('✅ API_BASE_URL correctly configured');
    } else {
      console.log('❌ API_BASE_URL not properly configured');
      configIssues.push('API_BASE_URL not properly configured');
    }
    
    // Verificar manejo de tokens
    if (content.includes('getAuthToken') && content.includes('setAuthToken')) {
      console.log('✅ Auth token handling functions found');
    } else {
      console.log('❌ Auth token handling functions missing');
      configIssues.push('Auth token handling functions missing');
    }
    
    // Verificar headers de autorización
    if (content.includes('Authorization') && content.includes('Bearer')) {
      console.log('✅ Authorization headers properly configured');
    } else {
      console.log('❌ Authorization headers not properly configured');
      configIssues.push('Authorization headers not properly configured');
    }
    
  } else {
    console.log('❌ API config file not found');
    configIssues.push('API config file not found');
  }
  
  console.log('');
  return configIssues;
}

// Función para verificar variables de entorno
function checkEnvironmentVariables() {
  console.log('🌍 Checking environment variables...\n');
  
  const envPath = './.env';
  let envIssues = [];
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const requiredVars = [
      'VITE_API_URL',
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_GOOGLE_MAPS_API_KEY'
    ];
    
    for (const envVar of requiredVars) {
      if (envContent.includes(envVar)) {
        console.log(`✅ ${envVar} found`);
      } else {
        console.log(`❌ ${envVar} missing`);
        envIssues.push(`${envVar} missing`);
      }
    }
    
    // Verificar que VITE_API_URL apunte al backend correcto
    if (envContent.includes('VITE_API_URL=https://cupo-backend.fly.dev')) {
      console.log('✅ VITE_API_URL points to correct backend');
    } else {
      console.log('❌ VITE_API_URL does not point to correct backend');
      envIssues.push('VITE_API_URL does not point to correct backend');
    }
    
  } else {
    console.log('❌ .env file not found');
    envIssues.push('.env file not found');
  }
  
  console.log('');
  return envIssues;
}

// Función principal
async function runFullCheck() {
  console.log('🧪 COMPLETE BACKEND CONNECTION VERIFICATION\n');
  console.log('='.repeat(50) + '\n');
  
  // Verificar variables de entorno
  const envIssues = checkEnvironmentVariables();
  
  // Verificar configuración de API
  const configIssues = checkApiConfig();
  
  // Verificar archivos de servicios
  const { issues: serviceIssues, correctEndpoints, totalEndpoints } = checkServiceFiles();
  
  // Resumen
  console.log('📊 SUMMARY REPORT');
  console.log('='.repeat(50));
  
  console.log(`🎯 Endpoint Coverage: ${correctEndpoints}/${totalEndpoints} (${Math.round(correctEndpoints/totalEndpoints*100)}%)`);
  
  if (envIssues.length === 0) {
    console.log('✅ Environment Variables: All OK');
  } else {
    console.log(`❌ Environment Variables: ${envIssues.length} issues`);
    envIssues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  if (configIssues.length === 0) {
    console.log('✅ API Configuration: All OK');
  } else {
    console.log(`❌ API Configuration: ${configIssues.length} issues`);
    configIssues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  if (serviceIssues.length === 0) {
    console.log('✅ Service Endpoints: All OK');
  } else {
    console.log(`❌ Service Endpoints: ${serviceIssues.length} issues`);
    serviceIssues.forEach(issue => console.log(`   - ${issue.file}: ${issue.endpoint} (${issue.issue})`));
  }
  
  console.log('\n' + '='.repeat(50));
  
  const totalIssues = envIssues.length + configIssues.length + serviceIssues.length;
  if (totalIssues === 0) {
    console.log('🎉 ALL CHECKS PASSED! Backend connection is properly configured.');
  } else {
    console.log(`⚠️  Found ${totalIssues} issues that need attention.`);
  }
  
  console.log('\n🔗 Backend URL: https://cupo-backend.fly.dev');
  console.log('📚 Health Check: https://cupo-backend.fly.dev/health');
}

// Ejecutar verificación
runFullCheck().catch(console.error);
