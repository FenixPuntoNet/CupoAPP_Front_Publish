// Configuración de la API Backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cupo.site';

import { apiCache } from '../lib/cache';

// Storage para token de autenticación
const AUTH_TOKEN_KEY = 'auth_token';

// Funciones básicas de token
export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  console.log('🔑 Auth token saved to localStorage');
};

export const removeAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  apiCache.clear();
  console.log('🔒 Auth token removed from localStorage');
};

// Función básica para hacer requests a la API
export const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Determinar si es un endpoint público
  const isPublicEndpoint = endpoint === '/auth/login' || 
                          endpoint === '/auth/signup' || 
                          endpoint.includes('/auth/forgot-password') || 
                          endpoint.includes('/auth/reset-password');
  
  // Obtener token de autenticación para endpoints protegidos
  const token = getAuthToken();
  
  // Headers básicos
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && !isPublicEndpoint ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  console.log(`🔄 [API] Request to ${endpoint}`);
  
  // Opciones de fetch
  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include' as RequestCredentials,
  };

  try {
    const response = await fetch(url, fetchOptions);

    console.log(`📡 [API] Response from ${endpoint}: status ${response.status}`);

    // Si es login exitoso, guardar token
    if (response.ok && endpoint === '/auth/login') {
      const data = await response.json();
      if (data.access_token) {
        setAuthToken(data.access_token);
        console.log('🔑 Auth token received and saved from login');
      }
      return data;
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP error! status: ${response.status}` };
      }
      
      // Manejar errores 401 (no autenticado)
      if (response.status === 401 && !isPublicEndpoint) {
        console.log('⚠️ [API] Authentication error (401), removing token');
        removeAuthToken();
        
        // Disparar evento para que el contexto redirija
        const authError = new CustomEvent('auth-error', { 
          detail: { 
            error: 'Session expired', 
            endpoint,
            shouldRedirect: true 
          } 
        });
        window.dispatchEvent(authError);
      }

      // Para errores 500, agregar información de debugging
      if (response.status === 500) {
        console.log(`🔍 [API] Server Error 500 for ${endpoint}`);
        console.log(`📤 Request method:`, options.method || 'GET');
        console.log(`📤 Request body:`, options.body);
        console.log(`🌐 Full URL:`, url);
      }
      
      console.log(`❌ [API] ${endpoint} failed with status: ${response.status}`);
      console.log(`❌ [API] Error data:`, errorData);
      
      const error = new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      
      // Agregar propiedades adicionales al error si existen
      if (errorData && typeof errorData === 'object') {
        if (errorData.current_status) (error as any).current_status = errorData.current_status;
        if (errorData.recoverable_statuses) (error as any).recoverable_statuses = errorData.recoverable_statuses;
        if (errorData.contact_support !== undefined) (error as any).contact_support = errorData.contact_support;
      }
      
      throw error;
    }
    
    // Procesar respuesta exitosa
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error(`❌ [API] Network error for ${endpoint}:`, error);
    
    // Mejor manejo de errores de red
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Error de conexión. Por favor verifica tu internet.');
    }
    
    throw error;
  }
};
