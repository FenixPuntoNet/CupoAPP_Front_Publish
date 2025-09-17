/**
 * Apple Authentication Service
 * Handles Apple Sign-In for both web and mobile platforms
 * Mobile version uses DeepLinkHandler for OAuth flow
 */

import { apiRequest } from '@/config/api';
import { appleDebugger } from '@/utils/appleDebugger';

export interface AppleAuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    username: string;
    full_name?: string;
  };
  token?: string;
  access_token?: string;
  error?: string;
  message?: string;
  isNewUser?: boolean;
}

/**
 * Detectar si estamos en una aplicación móvil
 * ✅ MEJORADO: Detección específica para iPad y iOS
 */
const isMobileApp = (): boolean => {
  // Detectar Capacitor (principal indicador)
  const isCapacitor = !!(window as any)?.Capacitor;
  if (isCapacitor) return true;
  
  // Detectar protocolo capacitor
  if (window?.location?.protocol === 'capacitor:') return true;
  
  // ✅ CRÍTICO: Asegurar detección correcta de iPad en Capacitor
  const userAgent = window?.navigator?.userAgent;
  const isCapacitorApp = userAgent?.includes('Capacitor') || false;
  
  // Log para debugging en producción
  if (isCapacitorApp) {
    console.log('📱 Mobile app detected:', {
      userAgent,
      isCapacitor,
      platform: (window as any)?.Capacitor?.getPlatform?.() || 'unknown'
    });
  }
  
  return isCapacitorApp;
};

/**
 * Obtiene la URL de Apple OAuth para móvil
 */
const getMobileAppleOAuthUrl = (): string => {
  const baseUrl = 'https://cupo-backend.fly.dev/auth/login/apple';
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  
  const queryParams = new URLSearchParams();
  queryParams.set('platform', 'mobile');
  queryParams.set('redirect', 'cupo://oauth-callback');
  queryParams.set('force_mobile', 'true');
  queryParams.set('deep_link_only', 'true');
  
  if (isIOS) {
    queryParams.set('flow', 'ios');
    queryParams.set('user_agent', 'iOS_App');
  } else {
    queryParams.set('flow', 'android');
    queryParams.set('user_agent', 'Android_App');
  }
  
  return `${baseUrl}?${queryParams.toString()}`;
};

/**
 * Inicia el login con Apple a través del backend
 */
export const signInWithApple = async (isRegistration = false): Promise<AppleAuthResponse> => {
  try {
    appleDebugger.log('apple_signin_start', {
      isRegistration,
      userAgent: navigator.userAgent,
      location: window.location.href,
      timestamp: Date.now()
    });

    console.log('🍎 Starting Apple Sign-In via backend...', { isRegistration });

    // Detectar si es móvil o web
    const isMobile = isMobileApp();
    
    appleDebugger.log('platform_detection', {
      isMobile,
      userAgent: navigator.userAgent,
      capacitor: !!(window as any)?.Capacitor,
      protocol: window.location.protocol
    });

    if (isMobile) {
      // ✅ PARA MÓVIL: Usar el sistema DeepLinkHandler existente con mejoras
      appleDebugger.log('mobile_flow_start', { isRegistration, platform: 'iOS' });
      console.log('📱 Apple Sign-In móvil via DeepLinkHandler (iPad/iPhone)');
      
      // ✅ TIMEOUT PARA EVITAR LOADING INFINITO
      const OAUTH_TIMEOUT = 60000; // 60 segundos
      let isCompleted = false;
      
      // ✅ TIMEOUT HANDLER
      const timeoutId = setTimeout(() => {
        if (!isCompleted) {
          isCompleted = true;
          appleDebugger.log('mobile_oauth_timeout', {
            timeoutMs: OAUTH_TIMEOUT,
            timestamp: Date.now()
          });
          console.error('❌ Apple OAuth timeout - cleaning up');
          
          // Limpiar estado y mostrar error
          localStorage.removeItem('apple_oauth_pending');
          localStorage.removeItem('apple_oauth_state');
          
          return {
            success: false,
            error: 'Apple Sign-In tomó demasiado tiempo. Por favor intenta nuevamente.'
          };
        }
      }, OAUTH_TIMEOUT);
      
      // Importar el sistema de deep links existente
      const { DeepLinkHandler } = await import('@/utils/deepLinkHandler');
      
      // Crear handler con callbacks mejorados
      const deepLinkHandler = new DeepLinkHandler({
        onSuccess: (userData) => {
          if (!isCompleted) {
            isCompleted = true;
            clearTimeout(timeoutId);
            
            appleDebugger.log('mobile_oauth_success', {
              hasUserData: !!userData,
              userId: userData?.id,
              hasToken: !!userData?.token,
              platform: 'iOS'
            });
            console.log('✅ Apple OAuth mobile success (iPad/iPhone):', userData);
            
            // Guardar el token de éxito en localStorage para que lo detecte el listener
            if (userData?.token || userData?.access_token) {
              const tokenData = {
                token: userData.token || userData.access_token,
                user: userData,
                isNewUser: userData.isNewUser || false,
                timestamp: Date.now()
              };
              localStorage.setItem('apple_oauth_pending', JSON.stringify(tokenData));
              appleDebugger.log('mobile_oauth_token_saved', {
                hasToken: !!tokenData.token,
                tokenLength: tokenData.token?.length || 0,
                platform: 'iOS'
              });
            }
          }
        },
        onError: (error) => {
          if (!isCompleted) {
            isCompleted = true;
            clearTimeout(timeoutId);
            
            appleDebugger.log('mobile_oauth_error', {
              error: error?.toString(),
              timestamp: Date.now(),
              platform: 'iOS'
            });
            console.error('❌ Apple OAuth mobile error (iPad/iPhone):', error);
            
            // Limpiar estado corrupto
            localStorage.removeItem('apple_oauth_pending');
            localStorage.removeItem('apple_oauth_state');
          }
        },
        onLoading: (loading) => {
          appleDebugger.log('mobile_oauth_loading', { loading, platform: 'iOS' });
          console.log('🔄 Apple OAuth loading state (iPad/iPhone):', loading);
        }
      });
      
      // Guardar estado para el callback móvil
      localStorage.setItem('apple_oauth_state', JSON.stringify({
        page: isRegistration ? 'register' : 'login',
        timestamp: Date.now(),
        platform: 'mobile-ios'
      }));
      
      appleDebugger.log('mobile_oauth_state_saved', {
        page: isRegistration ? 'register' : 'login',
        platform: 'iOS'
      });

      // Obtener URL del backend
      const authUrl = getMobileAppleOAuthUrl();
      
      appleDebugger.log('mobile_oauth_url_generated', { 
        authUrl,
        urlLength: authUrl.length,
        platform: 'iOS'
      });

      try {
        // Inicializar y iniciar el flujo
        await deepLinkHandler.init();
        await deepLinkHandler.startOAuthFlow(authUrl);
        
        // Para móvil, retornamos inmediatamente - el resultado llega por callback
        return { 
          success: true, 
          message: 'Apple OAuth flow initiated for iPad/iPhone - result will come via deep link' 
        };
      } catch (initError: any) {
        isCompleted = true;
        clearTimeout(timeoutId);
        
        appleDebugger.log('mobile_oauth_init_error', {
          error: initError?.toString(),
          message: initError?.message,
          platform: 'iOS'
        });
        
        console.error('❌ Error initializing Apple OAuth for iPad/iPhone:', initError);
        
        return {
          success: false,
          error: `Error iniciando Apple Sign-In: ${initError?.message || 'Error desconocido'}`
        };
      }
      
      
    } else {
      // ✅ PARA WEB: Usar el mismo patrón que Google OAuth
      appleDebugger.log('web_flow_start', { isRegistration });
      console.log('💻 Using web Apple OAuth flow (same pattern as Google)');
      
      // Guardar estado para poder retomar después del OAuth (igual que Google)
      localStorage.setItem('apple_oauth_state', JSON.stringify({
        page: isRegistration ? 'register' : 'login',
        timestamp: Date.now(),
        platform: 'web'
      }));
      
      // Obtener URL del backend para web con redirect correcto
      const baseUrl = 'https://cupo-backend.fly.dev/auth/login/apple';
      const redirectUri = `${window.location.origin}${isRegistration ? '/Registro' : '/Login'}`;
      
      const webAuthUrl = `${baseUrl}?redirect=${encodeURIComponent(redirectUri)}&platform=web`;
      
      appleDebugger.log('web_oauth_redirect', {
        webAuthUrl,
        redirectUri,
        method: 'same_window_redirect'
      });

      console.log('🔗 Apple OAuth URL (same window):', webAuthUrl);
      
      // ✅ CRÍTICO: Usar window.location.href igual que Google para mantener misma pestaña
      window.location.href = webAuthUrl;
      
      return { success: true, message: 'Redirecting to Apple OAuth in same window...' };
    }

  } catch (error: any) {
    appleDebugger.log('apple_signin_error', {
      error: error?.toString(),
      message: error?.message,
      stack: error?.stack
    });
    
    console.error('❌ Error en Apple Sign-In:', error);
    
    return {
      success: false,
      error: error?.message || 'Error iniciando Apple Sign-In'
    };
  }
};

/**
 * Función auxiliar para verificar si estamos en un callback de Apple OAuth
 */
export const isAppleCallback = (): boolean => {
  const urlParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  
  // Verificar parámetros típicos de callback OAuth
  const hasOAuthParams = 
    urlParams.has('access_token') || 
    hashParams.has('access_token') ||
    urlParams.has('code') ||
    !!localStorage.getItem('apple_oauth_state');

  appleDebugger.log('apple_callback_check', {
    hasOAuthParams,
    urlSearch: window.location.search,
    urlHash: window.location.hash,
    hasStoredState: !!localStorage.getItem('apple_oauth_state')
  });

  return hasOAuthParams;
};

/**
 * Procesa el callback de Apple OAuth
 */
export const processAppleCallback = async (): Promise<AppleAuthResponse> => {
  try {
    appleDebugger.log('apple_callback_start', {
      url: window.location.href,
      search: window.location.search,
      hash: window.location.hash
    });

    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    // Buscar token de acceso
    const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
      appleDebugger.log('apple_callback_error', { error });
      throw new Error(`Apple OAuth error: ${error}`);
    }

    if (accessToken) {
      appleDebugger.log('apple_callback_token_found', {
        hasToken: !!accessToken,
        tokenLength: accessToken.length
      });

      // Verificar el token con el backend
      const response = await apiRequest('/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return {
        success: true,
        token: accessToken,
        user: response
      };
    }

    if (code) {
      appleDebugger.log('apple_callback_code_found', { hasCode: !!code });

      // Intercambiar código por token
      const tokenResponse = await apiRequest('/auth/apple-callback', {
        method: 'POST',
        body: JSON.stringify({ code })
      });

      return {
        success: true,
        token: tokenResponse.access_token,
        user: tokenResponse.user,
        isNewUser: tokenResponse.isNewUser
      };
    }

    appleDebugger.log('apple_callback_no_credentials', {
      hasToken: !!accessToken,
      hasCode: !!code
    });

    throw new Error('No access token or code found in callback');

  } catch (error: any) {
    appleDebugger.log('apple_callback_error', {
      error: error?.toString(),
      message: error?.message
    });

    console.error('❌ Error processing Apple callback:', error);
    
    return {
      success: false,
      error: error?.message || 'Error processing Apple callback'
    };
  }
};

/**
 * Limpia los parámetros de callback de la URL
 */
export const cleanAppleCallbackUrl = (): void => {
  appleDebugger.log('apple_callback_url_clean', {
    beforeUrl: window.location.href
  });

  // Limpiar localStorage
  localStorage.removeItem('apple_oauth_state');
  
  // Limpiar URL
  const url = new URL(window.location.href);
  url.searchParams.delete('access_token');
  url.searchParams.delete('code');
  url.searchParams.delete('error');
  url.hash = '';
  
  window.history.replaceState({}, '', url.toString());
  
  appleDebugger.log('apple_callback_url_cleaned', {
    afterUrl: window.location.href
  });
};

/**
 * ✅ NUEVO: Función para limpiar completamente el estado de Apple OAuth
 * Útil para resolver loops de loading y estados corruptos
 */
export const resetAppleOAuthState = (): void => {
  appleDebugger.log('apple_oauth_reset_start', {
    beforeReset: {
      auth_token: !!localStorage.getItem('auth_token'),
      apple_oauth_pending: !!localStorage.getItem('apple_oauth_pending'),
      apple_oauth_state: !!localStorage.getItem('apple_oauth_state'),
      apple_oauth_checking: !!localStorage.getItem('apple_oauth_checking')
    }
  });

  console.log('🧹 Resetting Apple OAuth state completely...');

  // Limpiar todos los estados de localStorage relacionados con Apple OAuth
  localStorage.removeItem('apple_oauth_pending');
  localStorage.removeItem('apple_oauth_state'); 
  localStorage.removeItem('apple_oauth_checking');
  localStorage.removeItem('oauth_state');
  
  // NO limpiar auth_token ya que podría ser válido de otro login
  
  // Limpiar URL si tiene parámetros OAuth
  cleanAppleCallbackUrl();
  
  appleDebugger.log('apple_oauth_reset_complete', {
    message: 'Apple OAuth state completely reset'
  });

  console.log('✅ Apple OAuth state reset complete');
};

/**
 * ✅ NUEVO: Función para verificar y limpiar estados corruptos automáticamente
 */
export const checkAndCleanCorruptedState = (): boolean => {
  const pendingAuth = localStorage.getItem('apple_oauth_pending');
  const isChecking = localStorage.getItem('apple_oauth_checking');
  
  // Si hay un estado de checking muy viejo (más de 5 minutos), limpiarlo
  if (isChecking) {
    try {
      const checkingData = JSON.parse(isChecking);
      const checkingTime = checkingData.timestamp || Date.now();
      const timeSinceChecking = Date.now() - checkingTime;
      
      if (timeSinceChecking > 300000) { // 5 minutos
        console.log('🧹 Cleaning old checking state older than 5 minutes');
        localStorage.removeItem('apple_oauth_checking');
        return true;
      }
    } catch {
      // JSON inválido, limpiar
      localStorage.removeItem('apple_oauth_checking');
      return true;
    }
  }
  
  // Si hay auth pendiente muy viejo (más de 10 minutos), limpiarlo
  if (pendingAuth) {
    try {
      const pendingData = JSON.parse(pendingAuth);
      const pendingTime = pendingData.timestamp || Date.now();
      const timeSincePending = Date.now() - pendingTime;
      
      if (timeSincePending > 600000) { // 10 minutos
        console.log('🧹 Cleaning old pending auth older than 10 minutes');
        localStorage.removeItem('apple_oauth_pending');
        return true;
      }
    } catch {
      // JSON inválido, limpiar
      localStorage.removeItem('apple_oauth_pending');
      return true;
    }
  }
  
  return false;
};
