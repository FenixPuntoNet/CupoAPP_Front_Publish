/**
 * Deep Link Handler para manejar URLs de OAuth en móvil
 */

import { apiRequest, setAuthToken } from '@/config/api';
import { logOAuthEvent } from './oauthDebugger';

export interface DeepLinkHandlerOptions {
  onSuccess?: (userData: any) => void;
  onError?: (error: string) => void;
  onLoading?: (loading: boolean) => void;
}

export class DeepLinkHandler {
  private listeners: any[] = [];
  private App: any = null;
  private Browser: any = null;
  private options: DeepLinkHandlerOptions;

  constructor(options: DeepLinkHandlerOptions = {}) {
    this.options = options;
    logOAuthEvent('handler_init', { options });
  }

  async init() {
    // Cargar plugins de Capacitor dinámicamente
    try {
      logOAuthEvent('plugins_loading', {});
      const [appModule, browserModule] = await Promise.all([
        import('@capacitor/app'),
        import('@capacitor/browser')
      ]);
      this.App = appModule.App;
      this.Browser = browserModule.Browser;
      logOAuthEvent('plugins_loaded', { success: true });
      console.log('✅ Deep link handler initialized');
    } catch (error) {
      logOAuthEvent('plugins_error', { error: error?.toString() });
      console.warn('⚠️ Failed to load Capacitor plugins:', error);
      throw error;
    }
  }

  async startOAuthFlow(authUrl: string) {
    if (!this.App || !this.Browser) {
      logOAuthEvent('error', { error: 'Capacitor plugins not loaded' });
      throw new Error('Capacitor plugins not loaded');
    }

    logOAuthEvent('start_flow', { authUrl });
    console.log('🚀 Starting OAuth flow with URL:', authUrl);
    this.options.onLoading?.(true);

    // Limpiar listeners anteriores
    await this.cleanup();

    try {
      // Abrir navegador del sistema con configuración específica para OAuth
      logOAuthEvent('browser_opening', { url: authUrl });
      await this.Browser.open({ 
        url: authUrl,
        windowName: '_system',
        presentationStyle: 'fullscreen' // Forzar fullscreen para mejor UX
      });

      logOAuthEvent('browser_opened', { success: true });
      console.log('🌐 Browser opened successfully');

      // Configurar listener para deep link con mejor manejo de errores
      const listener = await this.App.addListener('appUrlOpen', async (event: any) => {
        logOAuthEvent('deep_link_received', { event }, event?.url);
        console.log('📱 App URL open event received:', event);
        await this.handleDeepLink(event.url);
      });

      this.listeners.push(listener);

      // También escuchar cuando la app vuelve a primer plano
      const resumeListener = await this.App.addListener('appStateChange', async (state: any) => {
        if (state.isActive) {
          logOAuthEvent('app_resumed', { state });
          console.log('📱 App resumed - checking for OAuth completion');
          // Dar un pequeño delay para que el deep link se procese
          setTimeout(async () => {
            // Verificar si hay un token en localStorage (fallback)
            const token = localStorage.getItem('oauth_temp_token');
            if (token) {
              logOAuthEvent('token_found_fallback', { hasToken: true });
              console.log('🔑 Found OAuth token in localStorage');
              localStorage.removeItem('oauth_temp_token');
              // Procesar como si fuera un deep link exitoso
              const userData = { token };
              this.options.onSuccess?.(userData);
              await this.cleanup();
            }
          }, 1000);
        }
      });

      this.listeners.push(resumeListener);

      // Timeout de 5 minutos con mejor manejo
      setTimeout(async () => {
        logOAuthEvent('timeout', { timeoutSeconds: 300 });
        console.log('⏰ OAuth timeout reached');
        await this.cleanup();
        this.options.onError?.('OAuth timeout - por favor intenta nuevamente');
        this.options.onLoading?.(false);
      }, 300000);

    } catch (error) {
      logOAuthEvent('error', { error: error?.toString(), step: 'browser_open' });
      console.error('❌ Error opening browser:', error);
      await this.cleanup();
      this.options.onError?.('Error abriendo navegador para OAuth');
      this.options.onLoading?.(false);
    }
  }

  async handleDeepLink(url: string) {
    try {
      logOAuthEvent('deep_link_processing', { url });
      console.log('🔗 Deep link recibido:', url);

      if (!url?.startsWith('cupo://oauth-callback')) {
        logOAuthEvent('deep_link_ignored', { url, reason: 'not_oauth_callback' });
        console.log('❌ URL no es de OAuth callback:', url);
        return;
      }

      // Cerrar navegador y limpiar listeners
      await this.cleanup();

      // Extraer parámetros del deep link de forma más robusta
      const urlObj = new URL(url);
      const searchParams = Object.fromEntries(urlObj.searchParams.entries());
      logOAuthEvent('url_params_extracted', { searchParams });
      console.log('🔍 URL params:', searchParams);
      
      // Buscar token en diferentes formatos
      let accessToken = urlObj.searchParams.get('access_token') || 
                       urlObj.searchParams.get('token');
      
      // También revisar hash parameters (por si vienen en formato fragment)
      let hashAccessToken = null;
      let hashParams = {};
      if (urlObj.hash) {
        const hashParamsObj = new URLSearchParams(urlObj.hash.substring(1));
        hashParams = Object.fromEntries(hashParamsObj.entries());
        hashAccessToken = hashParamsObj.get('access_token') || hashParamsObj.get('token');
        logOAuthEvent('hash_params_extracted', { hashParams });
        console.log('🔍 Hash params:', hashParams);
      }

      const finalToken = accessToken || hashAccessToken;
      
      // Verificar si hay errores en el deep link
      const error = urlObj.searchParams.get('error');
      const errorMessage = urlObj.searchParams.get('message');
      
      if (error) {
        logOAuthEvent('error', { error, errorMessage, url });
        throw new Error(errorMessage || error);
      }

      if (!finalToken) {
        logOAuthEvent('error', { 
          error: 'no_token', 
          searchParams, 
          hashParams, 
          url,
          pathname: urlObj.pathname 
        });
        console.error('❌ No se encontró token en deep link');
        console.log('🔍 Available parameters:', {
          searchParams: Object.fromEntries(urlObj.searchParams.entries()),
          hash: urlObj.hash,
          pathname: urlObj.pathname
        });
        throw new Error('No se encontró token de acceso en el deep link');
      }

      logOAuthEvent('token_extracted', { hasToken: true, tokenLength: finalToken.length });
      console.log('🔑 Token encontrado en deep link');

      // Configurar token en el cliente
      setAuthToken(finalToken);

      // Verificar usuario con el token
      logOAuthEvent('user_verification_start', {});
      const userResponse = await apiRequest('/auth/me', { method: 'GET' });

      if (!userResponse || !userResponse.id) {
        logOAuthEvent('error', { error: 'user_verification_failed', userResponse });
        throw new Error('No se pudo verificar el usuario con el token');
      }

      logOAuthEvent('user_verified', { userId: userResponse.id, userEmail: userResponse.email });
      console.log('✅ Usuario verificado exitosamente:', userResponse.id);
      this.options.onSuccess?.(userResponse);

    } catch (error) {
      logOAuthEvent('error', { error: error?.toString(), step: 'deep_link_processing' });
      console.error('❌ Error procesando deep link:', error);
      this.options.onError?.(error instanceof Error ? error.message : 'Error procesando OAuth');
    } finally {
      this.options.onLoading?.(false);
    }
  }

  async cleanup() {
    try {
      logOAuthEvent('cleanup_start', { listenersCount: this.listeners.length });
      console.log('🧹 Cleaning up OAuth flow...');
      
      // Cerrar navegador si está abierto
      if (this.Browser) {
        try {
          await this.Browser.close();
          logOAuthEvent('browser_closed', { success: true });
          console.log('🌐 Browser closed successfully');
        } catch (browserError) {
          logOAuthEvent('browser_close_error', { error: browserError?.toString() });
          console.warn('⚠️ Error closing browser (may already be closed):', browserError);
        }
      }

      // Remover todos los listeners
      if (this.App && this.listeners.length > 0) {
        console.log(`🔇 Removing ${this.listeners.length} listeners...`);
        for (const listener of this.listeners) {
          try {
            await listener.remove();
          } catch (listenerError) {
            logOAuthEvent('listener_remove_error', { error: listenerError?.toString() });
            console.warn('⚠️ Error removing listener:', listenerError);
          }
        }
        this.listeners = [];
        logOAuthEvent('cleanup_complete', { success: true });
        console.log('✅ All listeners removed');
      }
    } catch (error) {
      logOAuthEvent('cleanup_error', { error: error?.toString() });
      console.warn('⚠️ Error during cleanup:', error);
    }
  }
}

/**
 * Detecta si estamos en un entorno móvil
 */
export const isMobileApp = (): boolean => {
  return window.location.protocol === 'capacitor:' || 
         (window as any).Capacitor?.isNativePlatform?.() || 
         false;
};

/**
 * Obtiene la URL de OAuth para móvil con los parámetros correctos
 */
export const getMobileOAuthUrl = (type: 'login' | 'register' = 'login'): string => {
  const baseUrl = 'https://cupo-backend.fly.dev/auth/login/google';
  const redirect = encodeURIComponent('cupo://oauth-callback');
  
  // Agregar timestamp para evitar cache
  const timestamp = Date.now();
  
  return `${baseUrl}?redirect=${redirect}&platform=mobile&flow=${type}&t=${timestamp}`;
};

/**
 * Wrapper simplificado para iniciar OAuth en móvil
 */
export const startMobileOAuth = async (
  type: 'login' | 'register' = 'login',
  options: DeepLinkHandlerOptions = {}
): Promise<void> => {
  const handler = new DeepLinkHandler(options);
  await handler.init();
  
  const authUrl = getMobileOAuthUrl(type);
  await handler.startOAuthFlow(authUrl);
};
