// Configuración de la API Backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cupo-backend.fly.dev';

import { apiCache } from '../lib/cache';

// Storage para token de autenticación
const AUTH_TOKEN_KEY = 'auth_token';

// 🚀 Pool de conexiones para requests paralelos
let activeRequests = new Map<string, Promise<any>>();

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

// 🚀 Función optimizada para hacer requests a la API
export const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // 🚀 Generar key único para esta request
  const requestKey = `${options.method || 'GET'}_${endpoint}_${JSON.stringify(options.body || {})}`;
  
  // 🚀 Verificar cache para GET requests
  if (!options.method || options.method === 'GET') {
    const cached = apiCache.get(endpoint, options.body);
    if (cached) {
      console.log(`💨 [CACHE HIT] ${endpoint}`);
      return cached.data;
    }
  }

  // 🚀 Prevenir requests duplicados
  if (activeRequests.has(requestKey)) {
    console.log(`⏳ [DEDUP] Waiting for ongoing request: ${endpoint}`);
    return activeRequests.get(requestKey);
  }
  
  // Determinar si es un endpoint que requiere autenticación
  const isPublicEndpoint = endpoint === '/auth/login' || endpoint === '/auth/signup';
  
  // Obtener token de autenticación para todos los endpoints excepto login y registro
  const token = getAuthToken();
  
  // 🚀 Headers optimizados
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Connection': 'keep-alive',
    ...(token && !isPublicEndpoint ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  // Log simplificado en producción
  if (import.meta.env.DEV) {
    console.log(`🔄 [API] Request to ${endpoint}`);
    console.log(`🔑 [API] Using auth token: ${token ? 'yes' : 'no'}`);
    console.log(`📝 [API] Request method:`, options.method || 'GET');
  }

  // 🚀 Crear opciones de fetch optimizadas
  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include' as RequestCredentials,
    // 🚀 Timeout para requests lentos
    signal: AbortSignal.timeout(15000) // 15 segundos
  };

  // 🚀 Crear y guardar la promise de la request
  const requestPromise = (async () => {
    try {
      const response = await fetch(url, fetchOptions);

      // Log simplificado para respuestas
      if (import.meta.env.DEV) {
        console.log(`📡 [API] Response to ${endpoint}: status ${response.status}`);
      }

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
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP error! status: ${response.status}` };
      }
      
      // Si es un error 401, limpiar el token (excepto en login/signup)
      if (response.status === 401 && !isPublicEndpoint) {
        console.log('⚠️ [API] Authentication error (401), token invalid - clearing token');
        removeAuthToken();
      }
      
      // Log detallado para errores de cualquier request
      console.log(`❌ [API] ${endpoint} failed with status: ${response.status}`);
      console.log(`❌ [API] Error data:`, errorData);
      
      // Para errores estructurados (como 403 con información adicional), crear un error más rico
      if (errorData && typeof errorData === 'object') {
        const error = new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
        // Agregar propiedades adicionales al error si existen
        if (errorData.current_status) (error as any).current_status = errorData.current_status;
        if (errorData.recoverable_statuses) (error as any).recoverable_statuses = errorData.recoverable_statuses;
        if (errorData.contact_support !== undefined) (error as any).contact_support = errorData.contact_support;
        throw error;
      }
      
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    // 🚀 Procesar respuesta exitosa
    const result = await response.json();
    
    // 🚀 Guardar en cache si es GET request
    if (!options.method || options.method === 'GET') {
      apiCache.set(endpoint, result, options.body);
    }
    
    return result;
    
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`❌ [API] Network error for ${endpoint}:`, error);
      }
      
      // 🚀 Retry logic para errores de red
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Error de conexión. Por favor verifica tu internet.');
      }
      
      throw error;
    } finally {
      // 🚀 Limpiar request activa
      activeRequests.delete(requestKey);
    }
  })();

  // 🚀 Guardar request activa para evitar duplicados
  activeRequests.set(requestKey, requestPromise);
  
  return requestPromise;
};