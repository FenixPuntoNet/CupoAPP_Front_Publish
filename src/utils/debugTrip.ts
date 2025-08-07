// Utilidad para debuggear problemas con viajes desde la consola del navegador
import { testTripStartEndpoint, diagnoseTripStatus, verifyBackendConnection } from '@/services/viajes';
import { getAuthToken } from '@/config/api';

// Función que puedes llamar desde la consola del navegador
export const debugTrip = async (tripId: number) => {
  console.log(`🐛 [debugTrip] ===== DEBUGGING TRIP ${tripId} =====`);
  
  // Paso 1: Verificar autenticación
  const token = getAuthToken();
  console.log(`🔑 [debugTrip] Auth token:`, token ? 'PRESENT' : 'MISSING');
  if (token) {
    console.log(`🔑 [debugTrip] Token preview:`, token.substring(0, 30) + '...');
  }
  
  // Paso 2: Verificar conectividad del backend
  console.log(`🔗 [debugTrip] Testing backend connectivity...`);
  try {
    const backendTest = await verifyBackendConnection();
    console.log(`🔗 [debugTrip] Backend test result:`, backendTest);
  } catch (error) {
    console.error(`❌ [debugTrip] Backend test failed:`, error);
  }
  
  // Paso 3: Verificar el trip específico
  console.log(`🔍 [debugTrip] Testing trip ${tripId}...`);
  try {
    const tripTest = await diagnoseTripStatus(tripId);
    console.log(`🔍 [debugTrip] Trip test result:`, tripTest);
  } catch (error) {
    console.error(`❌ [debugTrip] Trip test failed:`, error);
  }
  
  // Paso 4: Test completo del endpoint
  console.log(`🧪 [debugTrip] Running comprehensive endpoint test...`);
  try {
    const endpointTest = await testTripStartEndpoint(tripId);
    console.log(`🧪 [debugTrip] Endpoint test result:`, endpointTest);
  } catch (error) {
    console.error(`❌ [debugTrip] Endpoint test failed:`, error);
  }
  
  console.log(`🐛 [debugTrip] ===== DEBUG COMPLETE =====`);
};

// Exponer la función globalmente para poder usarla en la consola del navegador
declare global {
  interface Window {
    debugTrip: typeof debugTrip;
  }
}

// @ts-ignore
window.debugTrip = debugTrip;

export default debugTrip;
