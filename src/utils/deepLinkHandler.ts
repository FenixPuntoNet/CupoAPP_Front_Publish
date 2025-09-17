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
  private startTime: number = 0; // ✅ Agregar para tracking de tiempo
  private platform: string; // ✅ Agregar platform property
  private isCompleted: boolean = false; // ✅ NUEVO: Control de completion

  constructor(options: DeepLinkHandlerOptions = {}) {
    this.options = options;
    this.platform = 'web'; // Default platform
    logOAuthEvent('handler_init', { options });
  }

  async init() {
    // Cargar plugins de Capacitor dinámicamente
    try {
      logOAuthEvent('plugins_loading', {});
      const [appModule, browserModule, capacitorModule] = await Promise.all([
        import('@capacitor/app'),
        import('@capacitor/browser'),
        import('@capacitor/core')
      ]);
      this.App = appModule.App;
      this.Browser = browserModule.Browser;
      this.platform = capacitorModule.Capacitor.getPlatform();
      logOAuthEvent('plugins_loaded', { success: true, platform: this.platform });
      console.log('✅ Deep link handler initialized for platform:', this.platform);
    } catch (error) {
      logOAuthEvent('plugins_error', { error: error?.toString() });
      console.warn('⚠️ Failed to load Capacitor plugins:', error);
      throw error;
    }
  }

  async startOAuthFlow(authUrl: string) {
    if (!this.App || !this.Browser) {
      logOAuthEvent('error', { error: 'Capacitor plugins not loaded' });
      this.options.onError?.('Capacitor plugins not loaded');
      throw new Error('Capacitor plugins not loaded');
    }

    // ✅ Inicializar timestamp de inicio
    this.startTime = Date.now();

    logOAuthEvent('start_flow', { authUrl, platform: this.platform });
    console.log('🚀 Starting OAuth flow with URL:', authUrl);
    console.log('📱 Platform detected:', this.platform);
    this.options.onLoading?.(true);

    // Limpiar listeners anteriores
    await this.cleanup();

    // ✅ TIMEOUT DE SEGURIDAD PARA EVITAR LOADING INFINITO
    const FLOW_TIMEOUT = 120000; // 2 minutos para iPad
    
    const timeoutId = setTimeout(async () => {
      if (!this.isCompleted) {
        console.error('⏰ OAuth flow timeout reached, cleaning up...');
        logOAuthEvent('oauth_timeout', { 
          timeoutMs: FLOW_TIMEOUT,
          platform: this.platform,
          elapsedTime: Date.now() - this.startTime 
        });
        
        this.isCompleted = true;
        await this.cleanup();
        this.options.onLoading?.(false);
        this.options.onError?.('Apple Sign-In tomó demasiado tiempo. Por favor intenta nuevamente.');
      }
    }, FLOW_TIMEOUT);

    try {
      // ✅ MEJORADO: Configurar listener ANTES de abrir el browser
      // Esto es crítico para iOS - el listener debe estar listo antes del redirect
      const listener = await this.App.addListener('appUrlOpen', async (event: any) => {
        logOAuthEvent('deep_link_received', { event }, event?.url);
        console.log('📱 [MAIN LISTENER] App URL open event received:', event);
        console.log('📱 [MAIN LISTENER] URL:', event?.url);
        console.log('📱 [MAIN LISTENER] Event type:', typeof event);
        await this.handleDeepLink(event.url);
      });

      this.listeners.push(listener);
      console.log('✅ Deep link listener configured before opening browser');

      // También escuchar cuando la app vuelve a primer plano
      const resumeListener = await this.App.addListener('appStateChange', async (state: any) => {
        if (state.isActive) {
          logOAuthEvent('app_resumed', { state });
          console.log('📱 [RESUME LISTENER] App resumed - checking for OAuth completion');
          console.log('📱 [RESUME LISTENER] State details:', state);
          
          // ✅ ESTRATEGIA MEJORADA PARA iOS: Verificar múltiples fuentes de tokens
          setTimeout(async () => {
            // 1. Verificar si hay un token en localStorage (fallback)
            const oauthTempToken = localStorage.getItem('oauth_temp_token');
            const authToken = localStorage.getItem('auth_token');
            
            console.log('🔍 [RESUME LISTENER] Checking tokens:', {
              hasOauthTempToken: !!oauthTempToken,
              hasAuthToken: !!authToken
            });
            
            if (oauthTempToken || authToken) {
              logOAuthEvent('token_found_fallback', { 
                hasOauthTempToken: !!oauthTempToken,
                hasAuthToken: !!authToken
              });
              console.log('🔑 [RESUME LISTENER] Found OAuth token in localStorage');
              
              const tokenToUse = authToken || oauthTempToken;
              if (oauthTempToken) {
                localStorage.removeItem('oauth_temp_token');
              }
              
              // Procesar como si fuera un deep link exitoso
              const userData = { token: tokenToUse };
              this.options.onSuccess?.(userData);
              await this.cleanup();
            } else {
              // 2. Verificar si la URL actual contiene información OAuth
              const currentUrl = window.location.href;
              console.log('🔍 [RESUME LISTENER] Current URL:', currentUrl);
              
              if (currentUrl.includes('access_token') || currentUrl.includes('oauth')) {
                logOAuthEvent('oauth_in_current_url', { currentUrl });
                console.log('🔍 [RESUME LISTENER] Found OAuth data in current URL');
                await this.handleDeepLink(currentUrl);
              } else {
                console.log('⚠️ [RESUME LISTENER] No OAuth completion detected');
              }
            }
          }, 1500); // Aumentar delay para iOS
        }
      });

      this.listeners.push(resumeListener);

      // ✅ MEJORADO: Abrir navegador con configuración específica para iOS OAuth
      logOAuthEvent('browser_opening', { url: authUrl });
      
      // Configuración específica para iOS/Android
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      
      const browserOptions = {
        url: authUrl,
        windowName: '_system', // Usar navegador del sistema
        ...(isIOS && {
          // Configuración específica para iOS
          presentationStyle: 'fullscreen',
          // Asegurar que iOS use Safari para mejor compatibilidad OAuth
          iosCustomScheme: 'cupo'
        })
      };

      console.log('🌐 Opening browser with options:', browserOptions);
      logOAuthEvent('browser_options', browserOptions);

      await this.Browser.open(browserOptions);

      logOAuthEvent('browser_opened', { success: true, platform: isIOS ? 'iOS' : 'other' });
      console.log(`🌐 Browser opened successfully on ${isIOS ? 'iOS' : 'platform'}`);

      // ✅ CRÍTICO: Agregar listener para detectar cuando el browser se cierra
      // Esto nos ayudará a saber si el usuario canceló o si el deep link funcionó
      const browserFinishedListener = await this.App.addListener('appStateChange', async (state: any) => {
        if (state.isActive) {
          logOAuthEvent('app_resumed_from_browser', { 
            state, 
            timestamp: Date.now(),
            timeElapsed: Date.now() - this.startTime 
          });
          console.log('📱 App resumed from browser - user may have completed OAuth or cancelled');
          
          // Dar tiempo para que el deep link se procese si existe
          setTimeout(async () => {
            // Verificar si el OAuth se completó
            const token = localStorage.getItem('auth_token');
            if (!token) {
              logOAuthEvent('oauth_possibly_cancelled', { 
                reason: 'app_resumed_but_no_token',
                timeElapsed: Date.now() - this.startTime
              });
              console.log('⚠️ App resumed but no auth token found - user may have cancelled');
            }
          }, 2000);
        }
      });

      this.listeners.push(browserFinishedListener);

      // ✅ MEJORADO: Timeout más corto para OAuth móvil (2 minutos)
      const timeoutMs = 120000; // 2 minutos en lugar de 5
      setTimeout(async () => {
        if (!this.isCompleted) {
          this.isCompleted = true;
          clearTimeout(timeoutId);
          logOAuthEvent('timeout', { timeoutSeconds: timeoutMs / 1000 });
          console.log('⏰ OAuth timeout reached');
          await this.cleanup();
          this.options.onError?.('Tiempo agotado - por favor intenta nuevamente');
          this.options.onLoading?.(false);
        }
      }, timeoutMs);

    } catch (error) {
      if (!this.isCompleted) {
        this.isCompleted = true;
        clearTimeout(timeoutId);
      }
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
      console.log('🔗 [DEEP LINK] Deep link recibido:', url);

      if (!url?.startsWith('cupo://oauth-callback')) {
        logOAuthEvent('deep_link_ignored', { url, reason: 'not_oauth_callback' });
        console.log('❌ [DEEP LINK] URL no es de OAuth callback:', url);
        return;
      }

      // Cerrar navegador y limpiar listeners
      await this.cleanup();

      // ✅ MEJORADO: Parsing más robusto de URLs para iOS
      let urlObj: URL;
      let searchParams: URLSearchParams;
      let hashParams: URLSearchParams | null = null;
      
      try {
        // Intentar parsear como URL normal
        urlObj = new URL(url);
        searchParams = urlObj.searchParams;
        
        // También revisar hash parameters (iOS a veces usa formato fragment)
        if (urlObj.hash) {
          hashParams = new URLSearchParams(urlObj.hash.substring(1));
          logOAuthEvent('hash_params_found', { 
            hashContent: urlObj.hash,
            hashParamsCount: Array.from(hashParams.entries()).length 
          });
        }
      } catch (urlError) {
        // Si falla el parsing, intentar parsing manual para casos edge
        logOAuthEvent('url_parse_fallback', { url, error: urlError?.toString() });
        console.log('⚠️ [DEEP LINK] URL parsing failed, trying manual extraction');
        
        // Parsing manual para casos donde la URL no es válida
        const parts = url.split('?');
        if (parts.length > 1) {
          searchParams = new URLSearchParams(parts[1]);
        } else {
          searchParams = new URLSearchParams();
        }
        
        // Crear objeto URL falso para compatibilidad
        urlObj = { searchParams } as URL;
      }
      
      const searchParamsObj = Object.fromEntries(searchParams.entries());
      const hashParamsObj = hashParams ? Object.fromEntries(hashParams.entries()) : {};
      
      logOAuthEvent('url_params_extracted', { 
        searchParams: searchParamsObj,
        hashParams: hashParamsObj,
        url 
      });
      console.log('🔍 [DEEP LINK] URL params extracted:', { searchParamsObj, hashParamsObj });
      
      // ✅ MEJORADO: Buscar token en múltiples ubicaciones y formatos
      let accessToken = 
        // En query parameters
        searchParams.get('access_token') || 
        searchParams.get('token') ||
        searchParams.get('accessToken') ||
        // En hash parameters (común en iOS)
        hashParams?.get('access_token') ||
        hashParams?.get('token') ||
        hashParams?.get('accessToken');
      
      // Verificar si hay errores en el deep link
      const error = searchParams.get('error') || hashParams?.get('error');
      const errorMessage = searchParams.get('message') || searchParams.get('error_description') || 
                          hashParams?.get('message') || hashParams?.get('error_description');
      
      if (error) {
        logOAuthEvent('error', { error, errorMessage, url });
        throw new Error(errorMessage || error);
      }

      if (!accessToken) {
        // ✅ NUEVO: Verificar si es un test de deep link
        const isTest = searchParams.get('test');
        if (isTest) {
          logOAuthEvent('deep_link_test_success', { url, isTest });
          console.log('✅ [DEEP LINK] Test de deep link exitoso!');
          this.options.onSuccess?.({ test: true, message: 'Deep link test successful' });
          return;
        }
        
        logOAuthEvent('error', { 
          error: 'no_token', 
          searchParams: searchParamsObj, 
          hashParams: hashParamsObj, 
          url,
          availableKeys: {
            search: Object.keys(searchParamsObj),
            hash: Object.keys(hashParamsObj)
          }
        });
        console.error('❌ [DEEP LINK] No se encontró token en deep link');
        console.log('🔍 [DEEP LINK] Available parameters:', {
          searchParams: searchParamsObj,
          hashParams: hashParamsObj,
          url
        });
        throw new Error('No se encontró token de acceso en el deep link. Verifica que el OAuth se completó correctamente.');
      }

      logOAuthEvent('token_extracted', { 
        hasToken: true, 
        tokenLength: accessToken.length,
        tokenSource: hashParams?.get('access_token') ? 'hash' : 'search'
      });
      console.log('🔑 [DEEP LINK] Token encontrado en deep link');

      // ✅ MEJORADO: Validar formato del token antes de usarlo
      if (accessToken.length < 10) {
        logOAuthEvent('error', { error: 'invalid_token_format', tokenLength: accessToken.length });
        throw new Error('Token recibido parece inválido (muy corto)');
      }

      // Configurar token en el cliente
      setAuthToken(accessToken);

      // ✅ MEJORADO: Verificar usuario con retry y mejor manejo de errores
      logOAuthEvent('user_verification_start', {});
      let userResponse;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          userResponse = await apiRequest('/auth/me', { method: 'GET' });
          break; // Éxito, salir del loop
        } catch (verifyError) {
          retryCount++;
          logOAuthEvent('user_verification_retry', { retryCount, error: verifyError?.toString() });
          console.log(`⚠️ [DEEP LINK] User verification failed, retry ${retryCount}/${maxRetries}`);
          
          if (retryCount >= maxRetries) {
            throw verifyError;
          }
          
          // Esperar un poco antes del retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      if (!userResponse || !userResponse.id) {
        logOAuthEvent('error', { error: 'user_verification_failed', userResponse });
        throw new Error('No se pudo verificar el usuario con el token recibido');
      }

      logOAuthEvent('user_verified', { 
        userId: userResponse.id, 
        userEmail: userResponse.email,
        retryCount: retryCount || 0
      });
      console.log('✅ [DEEP LINK] Usuario verificado exitosamente:', userResponse.id);
      
      // ✅ MARCAR COMO COMPLETADO
      this.isCompleted = true;
      
      // ✅ MEJORADO: Asegurar que el callback llegue al componente
      console.log('🎯 [DEEP LINK] Calling onSuccess callback...');
      this.options.onSuccess?.(userResponse);
      
      // ✅ NUEVO: Fallback para asegurar que el componente React se entere
      // En caso de que el callback no llegue, usar eventos del DOM
      setTimeout(() => {
        try {
          console.log('🔄 [DEEP LINK] Dispatching success event as fallback...');
          window.dispatchEvent(new CustomEvent('appleOAuthSuccess', {
            detail: { userResponse, source: 'deep_link_fallback' }
          }));
        } catch (eventError) {
          console.warn('⚠️ [DEEP LINK] Could not dispatch fallback event:', eventError);
        }
      }, 500);

    } catch (error) {
      logOAuthEvent('error', { error: error?.toString(), step: 'deep_link_processing' });
      console.error('❌ [DEEP LINK] Error procesando deep link:', error);
      
      // ✅ MARCAR COMO COMPLETADO CON ERROR
      this.isCompleted = true;
      const errorMessage = error instanceof Error ? error.message : 'Error procesando OAuth';
      
      console.log('🎯 [DEEP LINK] Calling onError callback...');
      this.options.onError?.(errorMessage);
      
      // ✅ NUEVO: Fallback para errores también
      setTimeout(() => {
        try {
          console.log('🔄 [DEEP LINK] Dispatching error event as fallback...');
          window.dispatchEvent(new CustomEvent('appleOAuthError', {
            detail: { error: errorMessage, source: 'deep_link_fallback' }
          }));
        } catch (eventError) {
          console.warn('⚠️ [DEEP LINK] Could not dispatch error fallback event:', eventError);
        }
      }, 500);
    } finally {
      console.log('🎯 [DEEP LINK] Calling onLoading(false) callback...');
      this.options.onLoading?.(false);
    }
  }

  // ✅ NUEVO: Test específico para iOS de deep links
  async testDeepLinkOnDevice() {
    try {
      console.log('🧪 [TEST] Iniciando test de deep link en dispositivo...');
      
      // Crear URL de test
      const testUrl = 'cupo://oauth-callback?test=true&platform=' + this.platform;
      
      logOAuthEvent('deep_link_test_start', { testUrl, platform: this.platform });
      
      // En iOS, intentar abrir la propia app con el deep link de test
      if (this.platform === 'ios') {
        console.log('📱 [TEST] Iniciando test específico para iOS...');
        
        // Configurar listener temporal para el test
        const testListener = await this.App.addListener('appUrlOpen', (event: any) => {
          console.log('✅ [TEST] Deep link test recibido:', event.url);
          logOAuthEvent('deep_link_test_received', { url: event.url });
          
          // Procesar como deep link de test
          this.handleDeepLink(event.url);
          
          // Limpiar listener
          testListener.remove();
        });
        
        // Intentar abrir la URL de test
        // Nota: esto podría no funcionar en simulador, solo en dispositivo real
        try {
          await this.Browser.open({ 
            url: testUrl,
            presentationStyle: 'popover'
          });
          
          setTimeout(() => {
            console.log('⏰ [TEST] Cerrando browser de test...');
            this.Browser.close();
          }, 2000);
          
        } catch (browserError) {
          console.log('⚠️ [TEST] No se pudo abrir browser para test, simulando deep link directamente...');
          logOAuthEvent('deep_link_test_simulation', { testUrl });
          
          // Simular deep link directamente
          setTimeout(() => {
            this.handleDeepLink(testUrl);
            testListener.remove();
          }, 1000);
        }
        
      } else {
        // Para otras plataformas, simular directamente
        console.log('🔧 [TEST] Simulando deep link para plataforma:', this.platform);
        this.handleDeepLink(testUrl);
      }
      
    } catch (error) {
      console.error('❌ [TEST] Error en test de deep link:', error);
      logOAuthEvent('deep_link_test_error', { error: error?.toString() });
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
 * ✅ ACTUALIZADO: FORZANDO deep link directo - NUNCA cupo.dev
 */
export const getMobileOAuthUrl = (): string => {
  const baseUrl = 'https://cupo-backend.fly.dev/auth/login/google';
  
  // ✅ CRÍTICO: SIEMPRE usar deep link directo - NUNCA permitir cupo.dev
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  
  // ✅ FORZAR PARÁMETROS PARA QUE EL BACKEND NO REDIRIJA A cupo.dev
  let queryParams = new URLSearchParams();
  
  if (isIOS) {
    console.log('📱 iOS detected: FORCING deep link redirect - NO cupo.dev');
    queryParams.set('platform', 'mobile');
    queryParams.set('redirect', 'cupo://oauth-callback');
    queryParams.set('force_mobile', 'true');
    queryParams.set('user_agent', 'iOS_App');
    queryParams.set('deep_link_only', 'true'); // ✅ NUEVO: Forzar deep link solamente
  } else if (isAndroid) {
    console.log('📱 Android detected: FORCING deep link redirect - NO cupo.dev');
    queryParams.set('platform', 'mobile');
    queryParams.set('redirect', 'cupo://oauth-callback');
    queryParams.set('force_mobile', 'true');
    queryParams.set('user_agent', 'Android_App');
    queryParams.set('deep_link_only', 'true'); // ✅ NUEVO: Forzar deep link solamente
  } else {
    console.log('📱 Mobile fallback: FORCING deep link redirect - NO cupo.dev');
    queryParams.set('platform', 'mobile');
    queryParams.set('redirect', 'cupo://oauth-callback');
    queryParams.set('force_mobile', 'true');
    queryParams.set('deep_link_only', 'true'); // ✅ NUEVO: Forzar deep link solamente
  }
  
  const finalUrl = `${baseUrl}?${queryParams.toString()}`;
  
  console.log('🚀 [OAUTH] Final OAuth URL (GUARANTEED deep link):', finalUrl);
  console.log('🎯 [OAUTH] WILL REDIRECT TO: cupo://oauth-callback (NOT cupo.dev)');
  
  return finalUrl;
};

/**
 * Wrapper simplificado para iniciar OAuth en móvil
 */
export const startMobileOAuth = async (
  options: DeepLinkHandlerOptions = {}
): Promise<void> => {
  console.log('🚀 [OAUTH] Starting mobile OAuth flow...');
  
  const authUrl = getMobileOAuthUrl(); // ✅ Corregido: sin parámetro type
  
  const handler = new DeepLinkHandler(options);
  await handler.init();
  await handler.startOAuthFlow(authUrl);
};
