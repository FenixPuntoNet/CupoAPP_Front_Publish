// Configuración de la API Backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cupo-backend.fly.dev';

// Storage para token de autenticación
const AUTH_TOKEN_KEY = 'auth_token';

// Obtener token de autenticación
export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

// Guardar token de autenticación
export const setAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  console.log('🔑 Auth token saved to localStorage');
};

// Eliminar token de autenticación
export const removeAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  console.log('🔒 Auth token removed from localStorage');
};

// Variable para tracking de retries por problemas de autenticación
let authRetries = 0;
const MAX_AUTH_RETRIES = 3;

// Función helper para hacer requests a la API
export const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Determinar si es un endpoint que requiere autenticación
  const isPublicEndpoint = endpoint === '/auth/login' || endpoint === '/auth/signup';
  
  // Obtener token de autenticación para todos los endpoints excepto login y registro
  const token = getAuthToken();
  
  // Configurar headers con token de autenticación
  const headers = {
    'Content-Type': 'application/json',
    ...(token && !isPublicEndpoint ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  // Log detallado para TODAS las requests para debugging
  console.log(`🔄 [API] Request to ${endpoint}`);
  console.log(`🔑 [API] Using auth token: ${token ? 'yes' : 'no'}`);
  console.log(`📝 [API] Request headers:`, headers);

  // Crear opciones de fetch (mantenemos credentials: 'include' como fallback)
  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include' as RequestCredentials 
  };

  try {
    const response = await fetch(url, fetchOptions);

    // Log detallado de la respuesta para todas las requests
    console.log(`📡 [API] Response to ${endpoint}: status ${response.status}`);
    console.log(`📡 [API] Response headers:`, Object.fromEntries(response.headers.entries()));

    // Si la respuesta del login es exitosa, verificar si hay token en la respuesta
    if (response.ok && endpoint === '/auth/login') {
      const data = await response.json();
      
      // Si el backend devuelve access_token, guardarlo
      if (data.access_token) {
        setAuthToken(data.access_token);
        console.log('🔑 Auth token received and saved from API response');
      }
      
      return data;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Si es un error 401, limpiar el token (excepto en login/signup)
      if (response.status === 401 && !isPublicEndpoint) {
        console.log('⚠️ [API] Authentication error (401), token might be invalid');
        
        // Limpiar el token inválido inmediatamente
        removeAuthToken();
        
        // Para /auth/me intentamos nuevamente si tenemos retries disponibles
        if (endpoint === '/auth/me' && authRetries < MAX_AUTH_RETRIES) {
          authRetries++;
          console.log(`⚠️ [API] Auth failed (${authRetries}/${MAX_AUTH_RETRIES}), retrying after delay...`);
          
          // Esperar un poco más en cada intento
          await new Promise(resolve => setTimeout(resolve, 1000 * authRetries));
          
          console.log(`🔄 [API] Retrying ${endpoint} request...`);
          console.log(`🔑 [API] Auth token for retry: ${getAuthToken() ? 'present' : 'missing'}`);
          
          // Intentar nuevamente
          return apiRequest(endpoint, options);
        }
      }
      
      authRetries = 0; // Reset retries for other requests
      
      // Log detallado para errores de cualquier request
      console.log(`❌ [API] ${endpoint} failed with status: ${response.status}`);
      console.log(`❌ [API] Error data:`, errorData);
      
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }

    authRetries = 0; // Reset retries on success
    return response.json();
  } catch (error) {
    console.error(`❌ [API] Request to ${endpoint} failed:`, error);
    throw error;
  }
};
