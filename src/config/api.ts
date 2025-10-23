// Configuración de la API Backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cupo.site';

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
export const setAuthToken = async (token: string): Promise<void> => {
  // ✅ CRITICAL: Detectar si es token de Supabase y hacer intercambio automáticamente
  try {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    console.log('🔍 [TOKEN-SAVE] Token issuer:', tokenPayload.iss);
    
    if (tokenPayload.iss && tokenPayload.iss.includes('supabase.co')) {
      console.log('🔄 [AUTO-EXCHANGE] Detected Supabase token, attempting exchange...');
      
      // Detectar provider automáticamente desde el token
      let provider = 'oauth';
      if (tokenPayload.app_metadata?.provider) {
        provider = tokenPayload.app_metadata.provider;
      } else if (tokenPayload.user_metadata?.iss?.includes('appleid.apple.com')) {
        provider = 'apple';
      } else if (tokenPayload.aud && tokenPayload.aud.includes('google')) {
        provider = 'google';
      }
      
      console.log('🔍 [AUTO-EXCHANGE] Detected provider:', provider);
      
      try {
        // ✅ OPTIMIZADO: Usar endpoint correcto del backend fijo
        const exchangeResponse = await fetch(`${API_BASE_URL}/auth/exchange-supabase-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            supabase_token: token,
            provider: provider,
            force_bootstrap: true
          }),
        });

        if (exchangeResponse.ok) {
          const exchangeResult = await exchangeResponse.json();
          console.log('✅ [AUTO-EXCHANGE] Token exchange successful');
          console.log('🔍 [AUTO-EXCHANGE] Exchange response:', exchangeResult);
          
          // ✅ OPTIMIZADO: Después del fix del backend, el token devuelto es Supabase original
          const backendToken = exchangeResult.backend_token || exchangeResult.access_token;
          if (backendToken) {
            localStorage.setItem(AUTH_TOKEN_KEY, backendToken);
            console.log('🔑 Backend token saved to localStorage (exchanged - returns original Supabase token)');
            
            // Verificar que se guardó
            const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
            console.log('🔑 [AUTO-EXCHANGE-DEBUG] Backend token saved:', savedToken === backendToken ? 'SUCCESS' : 'FAILED');
            console.log('🔑 [AUTO-EXCHANGE-DEBUG] Backend token length:', savedToken ? savedToken.length : 0);
            console.log('🔑 [AUTO-EXCHANGE-DEBUG] Backend token preview:', savedToken ? savedToken.substring(0, 50) + '...' : 'NULL');
            return;
          } else {
            console.warn('⚠️ [AUTO-EXCHANGE] No backend_token in response:', exchangeResult);
          }
        } else {
          console.warn('⚠️ [AUTO-EXCHANGE] Exchange request failed:', exchangeResponse.status, await exchangeResponse.text().catch(() => 'no response text'));
        }
        
        console.log('⚠️ [AUTO-EXCHANGE] Exchange failed, trying fallback...');
        // Fallback al endpoint OAuth
        const fallbackResponse = await fetch(`${API_BASE_URL}/auth/oauth/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: token,
            provider: provider
          }),
        });

        if (fallbackResponse.ok) {
          const fallbackResult = await fallbackResponse.json();
          console.log('✅ [AUTO-EXCHANGE] Fallback token exchange successful');
          
          // Usar backend_token si está disponible, si no access_token
          const backendToken = fallbackResult.backend_token || fallbackResult.access_token;
          localStorage.setItem(AUTH_TOKEN_KEY, backendToken);
          console.log('🔑 Backend token saved to localStorage (fallback auto-exchanged)');
          
          const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
          console.log('🔑 [AUTO-EXCHANGE-DEBUG] Fallback token saved:', savedToken === backendToken ? 'SUCCESS' : 'FAILED');
          return;
        }
        
      } catch (exchangeError) {
        console.error('❌ [AUTO-EXCHANGE] Token exchange failed:', exchangeError);
      }
    }
  } catch (decodeError) {
    console.log('🔍 [TOKEN-SAVE] Could not decode token for issuer check, saving as-is');
  }
  
  // Si no es Supabase token o el intercambio falló, guardar normalmente
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  console.log('🔑 Auth token saved to localStorage');
  
  // ✅ CRITICAL DEBUG: Verificar que el token se guardó correctamente
  const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
  console.log('🔑 [TOKEN-DEBUG] Token save verification:', savedToken === token ? 'SUCCESS' : 'FAILED');
  console.log('🔑 [TOKEN-DEBUG] Saved token length:', savedToken ? savedToken.length : 0);
  console.log('🔑 [TOKEN-DEBUG] Saved token preview:', savedToken ? savedToken.substring(0, 50) + '...' : 'NULL');
};

// Eliminar token de autenticación
export const removeAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
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
  
  // 🚀 Headers optimizados - solo incluir Content-Type si hay body
  const headers: any = {
    'Accept': 'application/json',
    'Connection': 'keep-alive',
    ...(token && !isPublicEndpoint ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };
  
  // Solo agregar Content-Type si realmente hay un body
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  // Log simplificado en producción
  if (import.meta.env.DEV) {
    console.log(`🔄 [API] Request to ${endpoint}`);
    console.log(`🔑 [API] Using auth token: ${token ? 'yes' : 'no'}`);
    if (token) {
      console.log(`🔍 [API] Token preview: ${token.substring(0, 30)}...`);
    }
    console.log(`📝 [API] Request method:`, options.method || 'GET');
    console.log(`📋 [API] Headers:`, headers);
  }

  // ✅ CRÍTICO: Logging específico para reservas para debug OAuth
  if (endpoint.includes('/reservas/create')) {
    console.log('🎫 [RESERVA-DEBUG] Creating reservation...');
    console.log('🔑 [RESERVA-DEBUG] Auth token exists:', token ? 'YES' : 'NO');
    console.log('🔑 [RESERVA-DEBUG] Token length:', token ? token.length : 0);
    console.log('🔑 [RESERVA-DEBUG] Token value preview:', token ? token.substring(0, 50) + '...' : 'NULL');
    console.log('📋 [RESERVA-DEBUG] Authorization header:', headers['Authorization'] ? 'PRESENT' : 'MISSING');
    console.log('📋 [RESERVA-DEBUG] Full headers:', JSON.stringify(headers, null, 2));
    console.log('📋 [RESERVA-DEBUG] Request body:', options.body);
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
        await setAuthToken(data.access_token);
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
      console.log(`❌ [API] Response headers:`, Object.fromEntries(response.headers.entries()));
      
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