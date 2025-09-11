// Configuración de la API Backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cupo-backend.fly.dev';

import { apiCache } from '../lib/cache';

// Storage para token de autenticación
const AUTH_TOKEN_KEY = 'auth_token';
const TOKEN_REFRESH_KEY = 'token_last_refresh';
const SESSION_ACTIVITY_KEY = 'last_activity';

// 🚀 Configuración de sesión
const TOKEN_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutos
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 horas de inactividad
const MIN_REFRESH_INTERVAL = 5 * 60 * 1000; // Mínimo 5 minutos entre refreshes

// 🚀 Pool de conexiones para requests paralelos
let activeRequests = new Map<string, Promise<any>>();

// 🔄 Sistema de manejo de sesión
let sessionCheckInterval: NodeJS.Timeout | null = null;
let isRefreshingToken = false;
let refreshPromise: Promise<boolean> | null = null;

// Actualizar actividad de usuario
export const updateUserActivity = (): void => {
  localStorage.setItem(SESSION_ACTIVITY_KEY, Date.now().toString());
};

// Verificar si la sesión está activa
export const isSessionActive = (): boolean => {
  const lastActivity = localStorage.getItem(SESSION_ACTIVITY_KEY);
  if (!lastActivity) return false;
  
  const timeSinceActivity = Date.now() - parseInt(lastActivity);
  return timeSinceActivity < SESSION_TIMEOUT;
};

// Verificar si necesita refresh del token
export const shouldRefreshToken = (): boolean => {
  const lastRefresh = localStorage.getItem(TOKEN_REFRESH_KEY);
  if (!lastRefresh) return true;
  
  const timeSinceRefresh = Date.now() - parseInt(lastRefresh);
  return timeSinceRefresh > TOKEN_REFRESH_INTERVAL;
};

// Refresh del token de manera inteligente
export const refreshAuthToken = async (): Promise<boolean> => {
  // Evitar múltiples refreshes simultáneos
  if (isRefreshingToken && refreshPromise) {
    return refreshPromise;
  }

  const token = getAuthToken();
  if (!token) {
    console.log('🔒 No token to refresh');
    return false;
  }

  // Verificar conectividad en mobile
  if (typeof window !== 'undefined' && window.Capacitor && !navigator.onLine) {
    console.log('📱 No network connection, skipping token refresh');
    return false;
  }

  // Verificar si realmente necesita refresh
  if (!shouldRefreshToken()) {
    console.log('⏭️ Token refresh not needed yet');
    updateUserActivity();
    return true;
  }

  isRefreshingToken = true;
  console.log('🔄 Refreshing auth token...');

  refreshPromise = (async () => {
    try {
      // Hacer una llamada simple para verificar/refrescar el token
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        // Timeout más corto para refresh
        signal: AbortSignal.timeout(10000) // 10 segundos
      });

      if (response.ok) {
        // Token sigue válido, actualizar timestamps
        localStorage.setItem(TOKEN_REFRESH_KEY, Date.now().toString());
        updateUserActivity();
        console.log('✅ Token refreshed successfully');
        return true;
      } else if (response.status === 401) {
        // Token inválido, limpiar
        console.log('🔒 Token expired during refresh');
        removeAuthToken();
        return false;
      } else {
        console.log('⚠️ Unexpected response during token refresh:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      // No limpiar token en caso de error de red
      return false;
    } finally {
      isRefreshingToken = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Inicializar el sistema de sesión automática
export const initializeSessionManagement = (): void => {
  // En mobile, esperar a que la app esté completamente cargada
  if (typeof window !== 'undefined' && window.Capacitor) {
    // Para Capacitor/mobile, esperar un poco más antes de inicializar
    setTimeout(() => {
      startSessionManagement();
    }, 2000);
  } else {
    // Para web, inicializar inmediatamente
    startSessionManagement();
  }
};

const startSessionManagement = (): void => {
  // Limpiar intervalo existente
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
  }

  // Verificar sesión cada 5 minutos
  sessionCheckInterval = setInterval(async () => {
    const token = getAuthToken();
    if (!token) return;

    // En mobile, verificar conectividad antes de hacer requests
    if (typeof window !== 'undefined' && window.Capacitor && !navigator.onLine) {
      console.log('📱 Mobile app offline, skipping session check');
      return;
    }

    if (!isSessionActive()) {
      console.log('🔒 Session inactive, cleaning up');
      removeAuthToken();
      return;
    }

    // Intentar refresh si es necesario
    try {
      await refreshAuthToken();
    } catch (error) {
      console.log('⚠️ Session check failed:', error);
      // No limpiar token aquí, podría ser un problema temporal de red
    }
  }, MIN_REFRESH_INTERVAL);

  console.log('🚀 Session management initialized');
};

// Limpiar el sistema de sesión
export const cleanupSessionManagement = (): void => {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
    sessionCheckInterval = null;
  }
};

// Obtener token de autenticación
export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

// Guardar token de autenticación
export const setAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(TOKEN_REFRESH_KEY, Date.now().toString());
  updateUserActivity();
  console.log('🔑 Auth token saved to localStorage');
  
  // Inicializar gestión de sesión al establecer token
  initializeSessionManagement();
};

// Eliminar token de autenticación
export const removeAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_REFRESH_KEY);
  localStorage.removeItem(SESSION_ACTIVITY_KEY);
  cleanupSessionManagement();
  console.log('🔒 Auth token removed from localStorage');
};

// Limpiar todo el cache de API
export const clearApiCache = (): void => {
  apiCache.clear();
  activeRequests.clear();
  console.log('🧹 API cache and active requests cleared');
};

// 🚀 Función optimizada para hacer requests a la API
export const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // 🚀 Actualizar actividad del usuario en cada request
  updateUserActivity();
  
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
  const isPublicEndpoint = endpoint === '/auth/login' || endpoint === '/auth/signup' || endpoint.includes('/auth/forgot-password') || endpoint.includes('/auth/reset-password');
  
  // Obtener token de autenticación para todos los endpoints excepto login y registro
  let token = getAuthToken();
  
  // 🔄 Intentar refresh del token si es necesario (excepto para endpoints públicos)
  if (token && !isPublicEndpoint && shouldRefreshToken()) {
    console.log('🔄 Token needs refresh, attempting refresh...');
    const refreshSuccess = await refreshAuthToken();
    if (!refreshSuccess) {
      console.log('❌ Token refresh failed, token may be expired');
      // No eliminamos el token aquí, lo dejamos que falle en el request
      // y se maneje en el bloque de error 401
    }
    // Actualizar token después del refresh
    token = getAuthToken();
  }
  
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
    if (token) {
      console.log(`� [API] Token preview: ${token.substring(0, 30)}...`);
    }
    console.log(`�📝 [API] Request method:`, options.method || 'GET');
    console.log(`📋 [API] Headers:`, headers);
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
        
        // 🔄 Manejo inteligente de errores 401
        if (response.status === 401 && !isPublicEndpoint) {
          console.log('⚠️ [API] Authentication error (401) detected');
          
          // En mobile, ser menos agresivo con limpiar tokens
          const isMobile = typeof window !== 'undefined' && window.Capacitor;
          
          // Solo limpiar token si NO estamos en proceso de refresh
          // y si el error no es por token refresh fallido
          if (!isRefreshingToken && endpoint !== '/auth/me') {
            if (isMobile) {
              // En mobile, solo limpiar si es un error repetido
              console.log('� [API] 401 in mobile, token may be temporarily invalid');
              // Disparar evento pero no limpiar token inmediatamente
              const authError = new CustomEvent('auth-error', { 
                detail: { 
                  error: 'Session may be expired', 
                  endpoint,
                  shouldRedirect: false // No redirigir automáticamente en mobile
                } 
              });
              window.dispatchEvent(authError);
            } else {
              // En web, comportamiento normal
              console.log('🔒 [API] Clearing expired token');
              removeAuthToken();
              
              const authError = new CustomEvent('auth-error', { 
                detail: { 
                  error: 'Session expired', 
                  endpoint,
                  shouldRedirect: true 
                } 
              });
              window.dispatchEvent(authError);
            }
          } else if (endpoint === '/auth/me') {
            console.log('🔍 [API] /auth/me returned 401, token is invalid');
            // Para /auth/me, el contexto ya maneja este caso
          }
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