import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Box,
  TextInput,
  Button,
  Container,
  Text,
  Group,
  UnstyledButton,
  LoadingOverlay,
} from "@mantine/core";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "@mantine/form";
import { RecoverAccountModal } from "@/components/RecoverAccountModal";
import AppleSignInButton from "@/components/AppleSignInButton";
import { useBackendAuth } from "@/context/BackendAuthContext";
import { useErrorHandling } from "@/hooks/useErrorHandling";
import { apiRequest } from "@/config/api";
import { signInWithApple, processAppleCallback, isAppleCallback, cleanAppleCallbackUrl } from "@/services/appleAuth";
import styles from "./index.module.css";

import { isMobileApp, startMobileOAuth } from '@/utils/deepLinkHandler';

// ✅ NUEVO: Import debug tools for testing
import '@/utils/appleOAuthTestTools';

interface LoginFormValues {
  email: string;
  password: string;
}

const LoginView: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = useState(false);
  const [recoverModalOpened, setRecoverModalOpened] = useState(false);
  
  // ✅ MEJORA: Detección temprana del OAuth callback (Google y Apple)
  const [isOAuthCallback, setIsOAuthCallback] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
    const authCode = urlParams.get('code');
    const appleState = localStorage.getItem('apple_oauth_state');
    return !!(accessToken || authCode || appleState);
  });
  
  const navigate = useNavigate();
  const { signIn, refreshUser } = useBackendAuth();
  const { handleValidationError, handleBackendError, showSuccess } = useErrorHandling();

  // ✅ MEJORADO: Setup listeners anti-loop para OAuth móvil de Apple SOLO si estamos en proceso OAuth
  useEffect(() => {
    const isMobile = window?.navigator?.userAgent?.includes('Capacitor') || 
                     window?.location?.protocol === 'capacitor:' ||
                     !!(window as any)?.Capacitor;
    
    // ✅ CRÍTICO: Solo ejecutar si realmente estamos en proceso OAuth activo
    const isActiveOAuthProcess = localStorage.getItem('apple_oauth_pending') || 
                                 localStorage.getItem('apple_oauth_state') || 
                                 localStorage.getItem('oauth_state') ||
                                 isOAuthCallback;
    
    if (isMobile && isActiveOAuthProcess) {
      console.log('📱 Setting up anti-loop mobile listeners for Apple OAuth return (ACTIVE PROCESS)');
      
      let oauthCheckInterval: NodeJS.Timeout | null = null;
      let loadingTimeout: NodeJS.Timeout | null = null;
      
      // Función para limpiar todos los timers y estados
      const cleanupOAuthState = () => {
        if (oauthCheckInterval) clearInterval(oauthCheckInterval);
        if (loadingTimeout) clearTimeout(loadingTimeout);
        localStorage.removeItem('apple_oauth_pending');
        localStorage.removeItem('apple_oauth_checking');
        setLoading(false);
      };
      
      // ✅ NUEVO: Listeners de fallback para Apple OAuth
      const handleAppleOAuthSuccess = async (event: Event) => {
        const customEvent = event as CustomEvent;
        console.log('🎯 [FALLBACK] Apple OAuth success event received:', customEvent.detail);
        
        try {
          setLoading(true);
          const userResponse = customEvent.detail?.userResponse;
          
          if (userResponse?.id) {
            // Refrescar usuario
            await refreshUser(true);
            
            showSuccess('¡Bienvenido!', 'Has iniciado sesión con Apple');
            
            // Limpiar estado
            cleanupOAuthState();
            
            // ✅ VERIFICAR: Solo navegar si estamos en página de login
            const currentPath = window.location.pathname;
            if (currentPath === '/Login/' || currentPath === '/Login') {
              setTimeout(() => {
                console.log('🚀 Navigating to /home from Login after Apple OAuth fallback success');
                navigate({ to: '/home' });
              }, 1000);
            } else {
              console.log('🚫 Skipping navigation - user already navigated away from Login');
            }
          }
        } catch (error) {
          console.error('❌ Error processing Apple OAuth success fallback:', error);
          cleanupOAuthState();
        }
      };
      
      const handleAppleOAuthError = (event: Event) => {
        const customEvent = event as CustomEvent;
        console.log('🎯 [FALLBACK] Apple OAuth error event received:', customEvent.detail);
        
        cleanupOAuthState();
        handleBackendError(customEvent.detail?.error || 'Error en Apple Sign-In', {
          id: 'apple-oauth-fallback-error',
          autoClose: 8000
        });
      };
      
      // Agregar listeners de fallback
      window.addEventListener('appleOAuthSuccess', handleAppleOAuthSuccess);
      window.addEventListener('appleOAuthError', handleAppleOAuthError);
      
      // Timeout para evitar loading infinito (2 minutos máximo)
      loadingTimeout = setTimeout(() => {
        console.log('⏰ OAuth timeout reached - stopping loading state');
        cleanupOAuthState();
        handleBackendError('El proceso de autenticación tardó demasiado. Intenta nuevamente.', {
          id: 'apple-oauth-timeout',
          autoClose: 8000
        });
      }, 120000); // 2 minutos

      // Función mejorada para manejar el regreso de la app
      const handleAppReturn = async () => {
        console.log('🔄 App returned, checking for Apple OAuth completion...');
        
        // ✅ CRÍTICO: Verificar que el usuario no esté ya navegando en la app
        const currentPath = window.location.pathname;
        console.log('🛣️ Current path:', currentPath);
        
        // Si el usuario ya está en home u otra página protegida, no hacer nada
        if (currentPath !== '/Login/' && currentPath !== '/Login' && 
            currentPath !== '/Registro/' && currentPath !== '/Registro') {
          console.log('🚫 User already navigating in app, skipping OAuth redirect');
          cleanupOAuthState();
          return;
        }
        
        // ✅ MEJORADO: Forzar limpieza de estados previos primero
        localStorage.removeItem('apple_oauth_checking');
        
        // Evitar multiple checks simultáneos
        const isAlreadyChecking = localStorage.getItem('apple_oauth_checking');
        if (isAlreadyChecking) {
          console.log('⚠️ Already checking OAuth state, skipping duplicate check');
          return;
        }
        
        localStorage.setItem('apple_oauth_checking', 'true');
        console.log('📱 Starting comprehensive OAuth return check...');
        
        try {
          // ✅ NUEVA ESTRATEGIA 0: Verificación inmediata del estado actual
          console.log('🔍 ESTRATEGIA 0: Verificación inmediata del estado de autenticación...');
          const immediateToken = localStorage.getItem('auth_token');
          console.log('🔑 Immediate token check:', immediateToken ? 'EXISTS' : 'MISSING');
          
          if (immediateToken && immediateToken !== 'null' && immediateToken !== 'undefined') {
            console.log('🍎 Token found immediately, verifying with backend...');
            setLoading(true);
            
            try {
              const immediateUserResponse = await apiRequest('/auth/me', { method: 'GET' });
              console.log('📱 Immediate user response:', immediateUserResponse ? 'SUCCESS' : 'FAILED');
              
              if (immediateUserResponse && immediateUserResponse.id) {
                console.log('✅ IMMEDIATE: Apple OAuth already completed successfully!');
                
                // Refrescar contexto
                await refreshUser(true);
                
                showSuccess('¡Bienvenido!', 'Has iniciado sesión con Apple');
                cleanupOAuthState();
                
                // Navegar inmediatamente
                const currentPath = window.location.pathname;
                if (currentPath === '/Login/' || currentPath === '/Login') {
                  setTimeout(() => {
                    console.log('🚀 IMMEDIATE: Navigating to /home after immediate token verification');
                    navigate({ to: '/home' });
                  }, 500);
                } else {
                  console.log('🚫 IMMEDIATE: User already navigated away from Login');
                }
                
                return; // Salir temprano si ya está autenticado
              }
            } catch (immediateError) {
              console.log('⚠️ Immediate token verification failed:', immediateError);
              // Continuar con otras estrategias
            }
          }
          
          // ESTRATEGIA 1: Verificar token pendiente de Apple OAuth
          const pendingAppleAuth = localStorage.getItem('apple_oauth_pending');
          
          if (pendingAppleAuth) {
            console.log('🍎 Detected pending Apple OAuth in localStorage, processing...');
            setLoading(true);
            
              try {
                const tokenData = JSON.parse(pendingAppleAuth);
                
                console.log('🍎 [APPLE-DEBUG] Processing Apple OAuth from localStorage...');
                console.log('🍎 [APPLE-DEBUG] Token data:', tokenData);
                console.log('🍎 [APPLE-DEBUG] Token to save:', tokenData.token);
                console.log('🍎 [APPLE-DEBUG] Token length:', tokenData.token ? tokenData.token.length : 0);
                
                // ✅ CRITICAL FIX: setAuthToken ahora hace el intercambio automáticamente
                console.log('🔄 [APPLE-AUTO-EXCHANGE] Saving token (auto-exchange will happen)...');
                
                try {
                  // setAuthToken ahora detecta tokens de Supabase y los intercambia automáticamente
                  const { setAuthToken } = await import('@/config/api');
                  await setAuthToken(tokenData.token);
                  console.log('✅ [APPLE-AUTO-EXCHANGE] Token saved and exchanged (if needed)');
                  
                } catch (exchangeError) {
                  console.error('❌ [APPLE-AUTO-EXCHANGE] Error during token save/exchange:', exchangeError);
                  throw new Error('No se pudo validar Apple Sign-In con el servidor');
                }
                
                // ✅ VERIFICACIÓN INMEDIATA: Comprobar que se guardó
                const verifyToken = localStorage.getItem('auth_token');
                console.log('🍎 [APPLE-DEBUG] Token verification after exchange:', verifyToken ? 'SUCCESS' : 'FAILED');
                
                // Refrescar usuario
                await refreshUser();              showSuccess('¡Bienvenido!', 'Has iniciado sesión con Apple');
              
              // Limpiar estado
              cleanupOAuthState();
              
            // ✅ VERIFICAR: Solo navegar si estamos en página de login
            const currentPath = window.location.pathname;
            if (currentPath === '/Login/' || currentPath === '/Login') {
              setTimeout(() => {
                console.log('🚀 Navigating to /home from Login after Apple OAuth success');
                navigate({ to: '/home' });
              }, 1000);
            } else {
              console.log('🚫 Skipping navigation - user already navigated away from Login');
            }
              return;
              
            } catch (error) {
              console.error('❌ Error processing Apple OAuth return from localStorage:', error);
              localStorage.removeItem('apple_oauth_pending');
            }
          }
          
          // ESTRATEGIA 2: Verificar si ya hay un auth_token válido (deep link funcionó)
          const authToken = localStorage.getItem('auth_token');
          if (authToken && authToken !== 'null' && authToken !== 'undefined') {
            console.log('🔑 Found valid auth_token, verifying authentication...');
            setLoading(true);
            
            try {
              // ✅ NUEVO: Verificar si el token es de Supabase y necesita intercambio
              console.log('🔍 [TOKEN-CHECK] Checking if token needs exchange...');
              try {
                // Decodificar el token para verificar el issuer
                const tokenPayload = JSON.parse(atob(authToken.split('.')[1]));
                console.log('🔍 [TOKEN-CHECK] Token issuer:', tokenPayload.iss);
                
                if (tokenPayload.iss && tokenPayload.iss.includes('supabase.co')) {
                  console.log('🔄 [DEEP-LINK-EXCHANGE] Detected Supabase token, exchanging...');
                  
                  try {
                    const exchangeResponse = await apiRequest('/auth/exchange-token', {
                      method: 'POST',
                      body: JSON.stringify({
                        supabase_token: authToken,
                        provider: 'google', // Asumir Google por defecto
                        exchange_type: 'deep_link_callback'
                      })
                    });
                    
                    if (exchangeResponse.success && exchangeResponse.backend_token) {
                      localStorage.setItem('auth_token', exchangeResponse.backend_token);
                      console.log('✅ [DEEP-LINK-EXCHANGE] Token exchanged successfully');
                    } else {
                      throw new Error('Exchange failed');
                    }
                    
                  } catch (exchangeError) {
                    console.log('⚠️ [DEEP-LINK-EXCHANGE] Failed, trying fallback...');
                    
                    const backendAuthResponse = await apiRequest('/auth/oauth/callback', {
                      method: 'POST',
                      body: JSON.stringify({
                        access_token: authToken,
                        provider: 'google'
                      })
                    });
                    
                    if (backendAuthResponse.success && backendAuthResponse.access_token) {
                      localStorage.setItem('auth_token', backendAuthResponse.access_token);
                      console.log('✅ [DEEP-LINK-FALLBACK] Backend auth successful');
                    }
                  }
                } else {
                  console.log('✅ [TOKEN-CHECK] Token is already from backend, no exchange needed');
                }
              } catch (tokenDecodeError) {
                console.log('⚠️ [TOKEN-CHECK] Could not decode token, proceeding normally');
              }
              
              // Verificar con el backend si el token es válido
              const userResponse = await apiRequest('/auth/me', { method: 'GET' });
              
              if (userResponse && userResponse.id) {
                console.log('✅ Apple OAuth completed successfully via deep link');
                
                // Forzar actualización del contexto de autenticación
                await refreshUser(true);
                
                // Esperar a que el contexto se actualice y verificar el token
                let contextSyncAttempts = 0;
                const maxSyncAttempts = 15;
                
                const waitForContextSync = async () => {
                  while (contextSyncAttempts < maxSyncAttempts) {
                    contextSyncAttempts++;
                    console.log(`🔄 Verifying auth state sync... attempt ${contextSyncAttempts}/${maxSyncAttempts}`);
                    
                    // Verificar directamente con el backend si el token es válido
                    try {
                      const authCheck = await apiRequest('/auth/me', { method: 'GET' });
                      if (authCheck && authCheck.id) {
                        console.log('✅ Backend confirms authentication is valid');
                        break;
                      }
                    } catch (error) {
                      console.log(`⚠️ Auth check attempt ${contextSyncAttempts} failed:`, error);
                    }
                    
                    // Esperar 300ms antes del siguiente intento
                    await new Promise(resolve => setTimeout(resolve, 300));
                  }
                  
                  if (contextSyncAttempts >= maxSyncAttempts) {
                    console.log('⚠️ Context sync timeout, but proceeding with navigation');
                  }
                };
                
                await waitForContextSync();
                
                showSuccess('¡Bienvenido!', 'Has iniciado sesión con Apple');
                cleanupOAuthState();
                
                // ✅ VERIFICAR: Solo navegar si estamos en página de login
                const currentPath = window.location.pathname;
                if (currentPath === '/Login/' || currentPath === '/Login') {
                  setTimeout(() => {
                    console.log('🚀 Navigating to /home from Login after Apple OAuth deep link success');
                    navigate({ to: '/home' });
                  }, 800);
                } else {
                  console.log('🚫 Skipping navigation - user already navigated away from Login');
                }
                
                return;
              }
            } catch (error) {
              console.log('⚠️ Auth token found but invalid:', error);
              // Token inválido, limpiar y continuar
              localStorage.removeItem('auth_token');
            }
          }
          
          // ESTRATEGIA 3: Polling del backend como fallback
          // Esta estrategia verifica si el usuario fue autenticado en el backend
          // aún si los deep links no funcionaron correctamente
          const startPollingCheck = () => {
            console.log('🔄 Starting backend polling as fallback strategy...');
            let pollAttempts = 0;
            const maxPollAttempts = 12; // 2 minutos con intervals de 10s
            
            oauthCheckInterval = setInterval(async () => {
              pollAttempts++;
              console.log(`� Polling attempt ${pollAttempts}/${maxPollAttempts} - checking backend auth status`);
              
              try {
                // Verificar si hay algún token de auth válido
                const storedToken = localStorage.getItem('auth_token');
                if (storedToken && storedToken !== 'null') {
                  const userResponse = await apiRequest('/auth/me', { method: 'GET' });
                  
                  if (userResponse && userResponse.id) {
                    console.log('✅ Backend polling detected successful authentication!');
                    
                    // Forzar actualización del contexto de autenticación
                    await refreshUser(true);
                    
                    // Esperar a que el contexto se actualice completamente
                    let contextSyncAttempts = 0;
                    const maxSyncAttempts = 10;
                    
                    const waitForContextSync = async () => {
                      while (contextSyncAttempts < maxSyncAttempts) {
                        contextSyncAttempts++;
                        console.log(`🔄 Verifying polling auth state sync... attempt ${contextSyncAttempts}/${maxSyncAttempts}`);
                        
                        // Verificar directamente con el backend
                        try {
                          const authCheck = await apiRequest('/auth/me', { method: 'GET' });
                          if (authCheck && authCheck.id) {
                            console.log('✅ Backend confirms authentication from polling is valid');
                            break;
                          }
                        } catch (error) {
                          console.log(`⚠️ Polling auth check attempt ${contextSyncAttempts} failed:`, error);
                        }
                        
                        // Esperar 200ms antes del siguiente intento
                        await new Promise(resolve => setTimeout(resolve, 200));
                      }
                    };
                    
                    await waitForContextSync();
                    
                    showSuccess('¡Bienvenido!', 'Has iniciado sesión con Apple');
                    cleanupOAuthState();
                    
                    // ✅ VERIFICAR: Solo navegar si estamos en página de login
                    const currentPath = window.location.pathname;
                    if (currentPath === '/Login/' || currentPath === '/Login') {
                      setTimeout(() => {
                        console.log('🚀 Navigating to /home from Login after polling OAuth success');
                        navigate({ to: '/home' });
                      }, 800);
                    } else {
                      console.log('🚫 Skipping navigation - user already navigated away from Login');
                    }
                    
                    return;
                  }
                }
                
                // Si llegamos al máximo de intentos, detener polling
                if (pollAttempts >= maxPollAttempts) {
                  console.log('🚫 Max polling attempts reached, stopping OAuth check');
                  cleanupOAuthState();
                  
                  // Solo mostrar error si realmente no hay autenticación
                  const finalToken = localStorage.getItem('auth_token');
                  if (!finalToken || finalToken === 'null') {
                    handleBackendError('No se pudo completar el proceso de autenticación. Intenta nuevamente.', {
                      id: 'apple-oauth-polling-failed',
                      autoClose: 8000
                    });
                  }
                }
              } catch (error) {
                console.log(`⚠️ Polling attempt ${pollAttempts} failed:`, error);
                
                if (pollAttempts >= maxPollAttempts) {
                  console.log('🚫 Max polling attempts reached with errors, stopping');
                  cleanupOAuthState();
                }
              }
            }, 10000); // Check every 10 seconds
          };
          
          // Solo iniciar polling si no encontramos auth inmediatamente
          setTimeout(() => {
            const currentAuthToken = localStorage.getItem('auth_token');
            const stillPending = localStorage.getItem('apple_oauth_pending');
            
            if ((!currentAuthToken || currentAuthToken === 'null') && !stillPending) {
              startPollingCheck();
            }
          }, 3000); // Wait 3s before starting polling
          
        } finally {
          localStorage.removeItem('apple_oauth_checking');
        }
      };
      
      // ✅ MEJORADO: Configurar múltiples listeners para detectar regreso de Apple OAuth
      if ((window as any).Capacitor) {
        const capacitor = (window as any).Capacitor;
        if (capacitor.Plugins && capacitor.Plugins.App) {
          
          // Listener principal para cambios de estado de la app
          const stateListener = capacitor.Plugins.App.addListener('appStateChange', (state: any) => {
            console.log('📱 App state changed:', state);
            if (state.isActive) {
              console.log('📱 App became active - checking for Apple OAuth completion...');
              // ✅ OPTIMIZADO: Verificación inmediata y luego con delay
              console.log('📱 Executing immediate handleAppReturn check');
              handleAppReturn(); // Inmediato
              
              // También con delay por si acaso
              setTimeout(() => {
                console.log('📱 Executing delayed handleAppReturn after app became active');
                handleAppReturn();
              }, 1000); // Reducido a 1 segundo
              
              // Y un tercer intento después
              setTimeout(() => {
                console.log('📱 Executing final handleAppReturn check');
                handleAppReturn();
              }, 2500); // Reducido a 2.5 segundos
            }
          });

          // ✅ NUEVO: Listener adicional para URLs (deep links directos)
          let urlListener: any = null;
          if (capacitor.Plugins.App.addListener) {
            try {
              urlListener = capacitor.Plugins.App.addListener('appUrlOpen', (data: any) => {
                console.log('📱 Deep link received:', data);
                console.log('📱 URL data:', JSON.stringify(data, null, 2));
                
                // Verificar si es un callback de Apple OAuth
                if (data.url && (data.url.includes('apple') || data.url.includes('oauth'))) {
                  console.log('🍎 Apple OAuth deep link detected, processing...');
                  // ✅ OPTIMIZADO: Verificación inmediata y con delay
                  console.log('📱 Executing immediate handleAppReturn after deep link');
                  handleAppReturn(); // Inmediato
                  
                  setTimeout(() => {
                    console.log('📱 Executing delayed handleAppReturn after deep link');
                    handleAppReturn();
                  }, 800);
                }
              });
            } catch (error) {
              console.log('⚠️ Could not set up URL listener:', error);
            }
          }

          // ✅ NUEVO: Verificación adicional cuando se monta el componente (por si ya regresamos)
          console.log('📱 Initial Apple OAuth state check...');
          setTimeout(() => {
            console.log('📱 Executing initial handleAppReturn check');
            handleAppReturn();
          }, 1000);
          
          return () => {
            cleanupOAuthState();
            
            // ✅ LIMPIAR LISTENERS DE FALLBACK
            window.removeEventListener('appleOAuthSuccess', handleAppleOAuthSuccess);
            window.removeEventListener('appleOAuthError', handleAppleOAuthError);
            
            // ✅ LIMPIAR LISTENERS DE CAPACITOR
            if (stateListener) {
              stateListener.remove();
            }
            if (urlListener) {
              urlListener.remove();
            }
          };
        }
      }
    } else {
      console.log('🚫 Skipping OAuth mobile listeners - no active OAuth process or not mobile');
    }
  }, [refreshUser, handleBackendError, navigate, isOAuthCallback]);

  // Detectar regreso del OAuth (Google y Apple) SOLO en páginas de auth
  useEffect(() => {
    const checkOAuthReturn = async () => {
      // ✅ CRÍTICO: Solo procesar OAuth si estamos en página de auth
      const currentPath = window.location.pathname;
      if (currentPath !== '/Login/' && currentPath !== '/Login' && 
          currentPath !== '/Registro/' && currentPath !== '/Registro') {
        console.log('🚫 Not on auth page, skipping OAuth callback processing');
        return;
      }
      
      // Si detectamos OAuth callback, activar loading inmediatamente
      if (isOAuthCallback) {
        setLoading(true);
        console.log('🔄 OAuth callback detectado, iniciando procesamiento...');
      }

      // ✅ NUEVO: Verificar callback de Apple primero
      if (isAppleCallback()) {
        console.log('🍎 Detectado Apple OAuth callback, procesando...');
        
        try {
          const appleResult = await processAppleCallback();
          
          if (appleResult.success) {
            await handleSuccessfulAppleAuth();
          } else {
            handleBackendError(appleResult.error || 'Error en Apple Sign-In', {
              id: 'apple-oauth-error',
              autoClose: 6000
            });
          }
        } catch (error: any) {
          console.error('❌ Error procesando Apple callback:', error);
          handleBackendError(error?.message || 'Error procesando Apple Sign-In', {
            id: 'apple-callback-error',
            autoClose: 6000
          });
        } finally {
          cleanAppleCallbackUrl();
          setLoading(false);
          setIsOAuthCallback(false);
        }
        return;
      }
      
      // Verificar si estamos en una URL de callback con tokens o códigos
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      // Buscar diferentes tipos de tokens/códigos que pueden venir del OAuth
      const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
      const authCode = urlParams.get('code');
      const error = urlParams.get('error');
      const oauthState = localStorage.getItem('oauth_state');
      
      // Si hay error en el OAuth, mostrar mensaje
      if (error) {
        console.error('❌ OAuth error:', error);
        handleBackendError(`Error en OAuth: ${error}`, {
          id: 'oauth-error',
          autoClose: 6000
        });
        setIsOAuthCallback(false);
        setLoading(false);
        return;
      }
      
      // Si hay un código de autorización, intentar procesarlo también directamente
      if (authCode) {
        console.log('🔗 Detectado authorization code, procesando...');
        setLoading(true);
        
        try {
          // Limpiar la URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Para códigos de autorización, aún necesitamos el backend
          // pero vamos a usar un endpoint más directo
          const codeResponse = await apiRequest('/auth/callback', {
            method: 'POST',
            body: JSON.stringify({ 
              code: authCode,
              redirect_uri: `${window.location.origin}/Login`
            })
          });
          
          if (codeResponse && codeResponse.token) {
            // Guardar el token válido
            const { setAuthToken } = await import('@/config/api');
            setAuthToken(codeResponse.token);
            
            // Verificar el usuario
            const userResponse = await apiRequest('/auth/me', { method: 'GET' });
            
            if (userResponse && userResponse.id) {
              console.log('✅ Google OAuth via code successful, user authenticated');
              
              // Limpiar estado OAuth
              localStorage.removeItem('oauth_state');
              
              await handleSuccessfulGoogleAuth();
            } else {
              throw new Error('No se pudo verificar el usuario después del OAuth');
            }
          } else {
            throw new Error('No se recibió token válido del backend');
          }
        } catch (error) {
          console.error('Error procesando authorization code:', error);
          handleBackendError('Error completando el login con Google. Intenta nuevamente.', {
            id: 'oauth-code-error',
            autoClose: 6000
          });
        } finally {
          setIsOAuthCallback(false);
          setLoading(false);
        }
        return;
      }
      
      if (accessToken) {
        console.log('🔗 Detectado access_token en URL, procesando OAuth callback...');
        setLoading(true);
        
        try {
          // Limpiar la URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // ✅ MÉTODO DIRECTO: Guardar el token directamente (como funcionaba antes)
          const { setAuthToken } = await import('@/config/api');
          
          console.log('🔑 [OAUTH-DEBUG] Saving access token from OAuth callback...');
          console.log('🔑 [OAUTH-DEBUG] Token to save:', accessToken);
          console.log('🔑 [OAUTH-DEBUG] Token length:', accessToken.length);
          
          // ✅ CRITICAL FIX: setAuthToken ahora hace el intercambio automáticamente
          console.log('🔄 [TOKEN-AUTO-EXCHANGE] Saving token (auto-exchange will happen)...');
          
          try {
            // setAuthToken ahora detecta tokens de Supabase y los intercambia automáticamente
            await setAuthToken(accessToken);
            console.log('✅ [TOKEN-AUTO-EXCHANGE] Token saved and exchanged (if needed)');
            
          } catch (exchangeError) {
            console.error('❌ [TOKEN-AUTO-EXCHANGE] Error during token save/exchange:', exchangeError);
            throw new Error('No se pudo validar la autenticación con el servidor');
          }
          
          console.log('🔑 Token processing completed');
          
          // ✅ VERIFICACIÓN INMEDIATA: Comprobar que se guardó
          const verifyToken = localStorage.getItem('auth_token');
          console.log('🔑 [OAUTH-DEBUG] Token verification after exchange:', verifyToken ? 'SUCCESS' : 'FAILED');
          
          // ✅ CRÍTICO: Refresh auth context inmediatamente después de guardar token
          try {
            await refreshUser(true);
            console.log('✅ Auth context refreshed after token save');
          } catch (refreshError) {
            console.error('⚠️ Error refreshing auth context after token save:', refreshError);
          }
          
          // Verificar el usuario con el token guardado
          const userResponse = await apiRequest('/auth/me', { method: 'GET' });
          
          if (userResponse && userResponse.id) {
            console.log('✅ Google OAuth successful, user authenticated');
            
            // Limpiar estado OAuth
            localStorage.removeItem('oauth_state');
            
            await handleSuccessfulGoogleAuth();
          } else {
            throw new Error('No se pudo verificar el usuario después del OAuth');
          }
        } catch (error) {
          console.error('Error procesando callback OAuth:', error);
          handleBackendError('Error completando el login con Google. Intenta nuevamente.', {
            id: 'oauth-callback-error',
            autoClose: 6000
          });
        } finally {
          setIsOAuthCallback(false);
          setLoading(false);
        }
        return;
      }
      
      if (oauthState) {
        try {
          const state = JSON.parse(oauthState);
          
          // Verificar que el estado no sea muy antiguo (máximo 10 minutos)
          const isStateValid = Date.now() - state.timestamp < 600000;
          
          if (isStateValid && state.page === 'login') {
            console.log('🔄 Detectado regreso del OAuth de Google, verificando autenticación...');
            setLoading(true);
            
            // Limpiar el estado de OAuth
            localStorage.removeItem('oauth_state');
            
            // ✅ VERIFICACIÓN SIMPLE: Solo verificar si ya hay token
            const existingToken = localStorage.getItem('auth_token');
            console.log('🔍 Token encontrado en localStorage:', existingToken ? 'sí' : 'no');
            
            if (existingToken) {
              // Si ya hay token, verificar directamente
              const userResponse = await apiRequest('/auth/me', { method: 'GET' });
              
              if (userResponse && userResponse.id) {
                console.log('✅ Google OAuth login successful');
                await handleSuccessfulGoogleAuth();
                return;
              }
            }
            
            console.log('ℹ️ No hay autenticación válida, continuando con login normal');
          } else {
            // Estado expirado, limpiar
            localStorage.removeItem('oauth_state');
          }
        } catch (error) {
          console.error('Error procesando regreso de OAuth:', error);
          localStorage.removeItem('oauth_state');
        } finally {
          setIsOAuthCallback(false);
          setLoading(false);
        }
      }
    };

    checkOAuthReturn();
  }, []);

  // ✅ NUEVO: Verificación inmediata del token de Apple al cargar el componente
  useEffect(() => {
    const immediateAppleTokenCheck = async () => {
      console.log('🍎 [IMMEDIATE] Checking for existing Apple OAuth token...');
      
      // Solo verificar si no estamos ya en un proceso OAuth
      if (loading || isOAuthCallback) {
        console.log('🍎 [IMMEDIATE] OAuth process already active, skipping check');
        return;
      }
      
      // Verificar si hay un token válido inmediatamente
      const authToken = localStorage.getItem('auth_token');
      
      if (authToken && authToken !== 'null' && authToken !== 'undefined') {
        console.log('🍎 [IMMEDIATE] Found auth token, verifying validity...');
        
        try {
          setLoading(true);
          const userResponse = await apiRequest('/auth/me', { method: 'GET' });
          
          if (userResponse && userResponse.id) {
            console.log('✅ [IMMEDIATE] Valid token found - user is authenticated!');
            
            // Refrescar contexto
            await refreshUser(true);
            
            showSuccess('¡Bienvenido!', 'Sesión iniciada correctamente');
            
            // Navegar a home
            setTimeout(() => {
              console.log('🚀 [IMMEDIATE] Navigating to /home');
              navigate({ to: '/home' });
            }, 500);
            
            return;
          }
        } catch (error) {
          console.log('⚠️ [IMMEDIATE] Token exists but invalid:', error);
          // Token inválido, limpiar
          localStorage.removeItem('auth_token');
        } finally {
          setLoading(false);
        }
      }
    };
    
    // Ejecutar verificación inmediata
    immediateAppleTokenCheck();
  }, []); // Solo ejecutar una vez al montar

  // Función para hacer bootstrap via backend
  const ensureBootstrap = async () => {
    try {
      console.log('🔧 [FRONTEND-BOOTSTRAP] Starting user bootstrap via backend...');
      console.log('🔧 [FRONTEND-BOOTSTRAP] This will ensure wallet, profile, and terms are created');
      
      // ✅ VERIFICACIÓN: Comprobar que tenemos token válido antes del bootstrap
      const currentToken = localStorage.getItem('auth_token');
      console.log('🔑 [FRONTEND-BOOTSTRAP] Current auth token:', currentToken ? 'EXISTS' : 'MISSING');
      console.log('🔑 [FRONTEND-BOOTSTRAP] Token length:', currentToken?.length || 0);
      
      const res = await apiRequest('/auth/bootstrap', {
        method: 'POST',
        body: JSON.stringify({
          debug: true,
          timestamp: Date.now(),
          client: 'frontend-login'
        })
      });
      
      console.log('🔧 [FRONTEND-BOOTSTRAP] Raw bootstrap response:', JSON.stringify(res, null, 2));
      
      if (!res.success) {
        console.error('❌ [FRONTEND-BOOTSTRAP] Backend bootstrap failed:', res.error);
        console.error('❌ [FRONTEND-BOOTSTRAP] Full error response:', res);
        throw new Error(res.error || 'Bootstrap falló');
      }
      
      console.log('✅ [FRONTEND-BOOTSTRAP] Backend bootstrap completed successfully');
      console.log('🔧 [FRONTEND-BOOTSTRAP] Bootstrap result:', {
        wallet_created: res.wallet_created || res.walletCreated,
        profile_created: res.profile_created || res.profileCreated,
        terms_saved: res.terms_saved || res.termsSaved
      });
      
      // ✅ CRÍTICO: Force refresh del usuario para obtener datos actualizados
      console.log('🔄 [FRONTEND-BOOTSTRAP] Forcing user refresh after bootstrap...');
      await refreshUser(true);
      console.log('✅ [FRONTEND-BOOTSTRAP] User refresh completed');
      
      return res;
    } catch (error: any) {
      console.error('❌ [FRONTEND-BOOTSTRAP] Bootstrap error:', error);
      console.error('❌ [FRONTEND-BOOTSTRAP] Error details:', {
        message: error?.message,
        status: error?.status,
        response: error?.response
      });
      throw error;
    }
  };

  // Función principal de Google OAuth para Login
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      console.log('🚀 Starting Google OAuth login via backend...');
      
      if (isMobileApp()) {
        // ===== VERSIÓN MÓVIL MEJORADA (Capacitor) =====
        console.log('📱 Using improved mobile Capacitor implementation for login');
        
        await startMobileOAuth({
          onSuccess: async (userData: any) => {
            console.log('✅ Mobile OAuth login successful:', userData);
            await handleSuccessfulGoogleAuth();
          },
          onError: (error: any) => {
            console.error('❌ Mobile OAuth login error:', error);
            handleBackendError(error || 'Error en OAuth móvil', {
              id: 'mobile-oauth-error',
              autoClose: 6000
            });
            setLoading(false);
          },
          onLoading: (loading: boolean) => {
            // El loading ya está manejado por el estado local
            if (!loading) {
              setLoading(false);
            }
          }
        });
        
      } else {
        // ===== VERSIÓN WEB (Redirect en misma página) =====
        console.log('🌐 Using web redirect implementation for login');
        
        // Guardar el estado actual para poder retomar después del OAuth
        localStorage.setItem('oauth_state', JSON.stringify({
          page: 'login',
          timestamp: Date.now()
        }));
        
        // Redirigir directamente en la misma página con el redirect_uri correcto para web
        const webRedirectUri = `${window.location.origin}/Login`;
        const googleAuthUrl = `https://cupo-backend.fly.dev/auth/login/google?redirect=${encodeURIComponent(webRedirectUri)}`;
        console.log('🔗 Redirecting to:', googleAuthUrl);
        window.location.href = googleAuthUrl;
      }

    } catch (e: any) {
      console.error('Error iniciando Google OAuth:', e);
      handleBackendError(e?.message || 'No se pudo iniciar sesión con Google', {
        id: 'google-oauth-init-error',
        autoClose: 6000
      });
      setLoading(false);
    }
  };

  // Función auxiliar para manejar el éxito del login con Google
  const handleSuccessfulGoogleAuth = async () => {
    try {
      // ✅ OPTIMIZADO: Refresh del contexto de autenticación PRIMERO
      try {
        await refreshUser(true);
        console.log('✅ Auth context refreshed after Google OAuth');
      } catch (refreshError) {
        console.error('⚠️ Error refreshing auth context:', refreshError);
      }

      // ✅ MEJORADO: El endpoint /me ahora tiene auto-bootstrap integrado
      const userResponse = await apiRequest('/auth/me', { method: 'GET' });
      
      if (userResponse && userResponse.id) {
        console.log('✅ Usuario autenticado con Google:', userResponse);
        console.log('🔧 Backend auto-bootstrap status:', userResponse.auto_bootstrapped ? 'executed' : 'not needed');
        
        // ✅ CRÍTICO: SIEMPRE ejecutar bootstrap para usuarios OAuth para asegurar wallet/profile
        console.log('🔧 Executing bootstrap for OAuth user to ensure wallet/profile creation...');
        try {
          await ensureBootstrap();
          console.log('✅ Bootstrap completed successfully');
          
          // Refresh después del bootstrap
          await refreshUser(true);
          console.log('✅ Auth context refreshed after bootstrap');
        } catch (bootstrapError) {
          console.error('❌ Bootstrap failed:', bootstrapError);
          handleBackendError('Error configurando cuenta. Por favor, intenta de nuevo.', {
            id: 'bootstrap-error',
            autoClose: 5000
          });
          return;
        }
        
        // Verificar si es un usuario nuevo (necesita onboarding)
        const isNewUser = userResponse.bootstrap_needed || !userResponse.profile || userResponse.auto_bootstrapped;
        
        if (isNewUser) {
          console.log('🆕 Usuario nuevo detectado, dirigiendo a onboarding...');

          // Marcar como usuario nuevo para onboarding
          localStorage.setItem('is_new_user', 'true');
          
          // Mostrar mensaje de bienvenida para nuevo usuario
          showSuccess(
            '¡Bienvenido a Cupo!',
            'Tu cuenta ha sido creada. Completa tu perfil para empezar.',
            { 
              id: 'google-register-success',
              autoClose: 3000 
            }
          );

          // ✅ NAVEGAR INMEDIATAMENTE a onboarding
          navigate({ 
            to: "/CompletarRegistro", 
            search: { from: 'onboarding' } 
          });
          
          return; // Salir temprano para evitar el flujo de usuario existente
        } else {
          console.log('👤 Usuario existente, login normal');

          // Mostrar mensaje de éxito para usuario existente
          showSuccess(
            'Inicio de sesión exitoso',
            'Has iniciado sesión con Google correctamente.',
            { 
              id: 'google-login-success',
              autoClose: 2000 
            }
          );

          // Para usuarios existentes, el AuthGuard se encargará de la navegación automática
        }
      } else {
        throw new Error('No se pudo obtener información del usuario después del OAuth');
      }
      
    } catch (error: any) {
      console.error('❌ Error en handleSuccessfulGoogleAuth:', error);
      handleBackendError(error?.message || 'Error procesando login con Google', {
        id: 'google-auth-process-error',
        autoClose: 6000
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ NUEVO: Función auxiliar para manejar el éxito del login con Apple
  const handleSuccessfulAppleAuth = async () => {
    try {
      // ✅ Refresh del contexto de autenticación PRIMERO
      try {
        await refreshUser(true);
        console.log('✅ Auth context refreshed after Apple OAuth');
      } catch (refreshError) {
        console.error('⚠️ Error refreshing auth context:', refreshError);
      }

      // Obtener información del usuario autenticado
      const userResponse = await apiRequest('/auth/me', { method: 'GET' });
      
      if (userResponse && userResponse.id) {
        console.log('✅ Usuario autenticado con Apple:', userResponse);
        console.log('🔧 Backend auto-bootstrap status:', userResponse.auto_bootstrapped ? 'executed' : 'not needed');
        
        // ✅ CRÍTICO: SIEMPRE ejecutar bootstrap para usuarios OAuth para asegurar wallet/profile
        console.log('🔧 Executing bootstrap for Apple OAuth user to ensure wallet/profile creation...');
        try {
          await ensureBootstrap();
          console.log('✅ Bootstrap completed successfully for Apple user');
          
          // Refresh después del bootstrap
          await refreshUser(true);
          console.log('✅ Auth context refreshed after Apple bootstrap');
        } catch (bootstrapError) {
          console.error('❌ Apple Bootstrap failed:', bootstrapError);
          handleBackendError('Error configurando cuenta. Por favor, intenta de nuevo.', {
            id: 'apple-bootstrap-error',
            autoClose: 5000
          });
          return;
        }
        
        // Verificar si es un usuario nuevo (necesita onboarding)
        const isNewUser = userResponse.bootstrap_needed || !userResponse.profile || userResponse.auto_bootstrapped;
        
        if (isNewUser) {
          console.log('🆕 Usuario nuevo con Apple detectado, dirigiendo a onboarding...');

          // Marcar como usuario nuevo para onboarding
          localStorage.setItem('is_new_user', 'true');
          
          // Mostrar mensaje de bienvenida para nuevo usuario
          showSuccess(
            '¡Bienvenido a Cupo!',
            'Tu cuenta con Apple ha sido creada. Completa tu perfil para empezar.',
            { 
              id: 'apple-register-success',
              autoClose: 3000 
            }
          );

          // Navegar a onboarding
          navigate({ 
            to: "/CompletarRegistro", 
            search: { from: 'onboarding' } 
          });
          
          return;
        } else {
          console.log('👤 Usuario existente con Apple, login normal');

          // Mostrar mensaje de éxito para usuario existente
          showSuccess(
            'Inicio de sesión exitoso',
            'Has iniciado sesión con Apple correctamente.',
            { 
              id: 'apple-login-success',
              autoClose: 2000 
            }
          );
        }
      } else {
        throw new Error('No se pudo obtener información del usuario después de Apple OAuth');
      }
      
    } catch (error: any) {
      console.error('❌ Error en handleSuccessfulAppleAuth:', error);
      handleBackendError(error?.message || 'Error procesando login con Apple', {
        id: 'apple-auth-process-error',
        autoClose: 6000
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ NUEVO: Función principal de Apple OAuth para Login
  const handleAppleLogin = async () => {
    try {
      setLoading(true);
      console.log('🍎 Starting Apple OAuth login via backend...');
      
      // ✅ MEJORADO: Detección más precisa de plataforma para iPad
      const isMobile = window?.navigator?.userAgent?.includes('Capacitor') || 
                       window?.location?.protocol === 'capacitor:' ||
                       !!(window as any)?.Capacitor;
      
      const isIPad = /iPad/.test(navigator.userAgent);
      const platform = isMobile ? (isIPad ? 'iPad' : 'Mobile') : 'Web';
      
      console.log('📱 Platform detected for Apple OAuth:', platform);
      
      if (isMobile) {
        // ✅ MEJORADO: Manejo específico para móvil/iPad con timeout
        console.log('📱 Using mobile Apple OAuth flow with DeepLinkHandler');
        
        // Agregar timeout de seguridad a nivel de componente
        const LOGIN_TIMEOUT = 180000; // 3 minutos para iPad
        let hasTimedOut = false;
        
        const timeoutId = setTimeout(() => {
          hasTimedOut = true;
          setLoading(false);
          handleBackendError('Apple Sign-In tomó demasiado tiempo en iPad. Por favor intenta nuevamente.', {
            id: 'apple-oauth-timeout',
            autoClose: 8000
          });
          console.error('⏰ Apple OAuth timeout on iPad');
        }, LOGIN_TIMEOUT);
        
        try {
          const result = await signInWithApple(false); // false = login
          
          if (!hasTimedOut) {
            clearTimeout(timeoutId);
            
            if (!result.success && result.error) {
              handleBackendError(`Error en Apple Sign-In (${platform}): ${result.error}`, {
                id: 'apple-oauth-init-error',
                autoClose: 8000
              });
              setLoading(false);
            } else {
              // ✅ OPTIMIZADO: Iniciar verificación agresiva inmediatamente después del login
              console.log('🍎 Apple OAuth initiated, starting aggressive token polling...');
              
              let pollAttempts = 0;
              const maxAttempts = 40; // 2 minutos con intervalos de 3 segundos
              
              const aggressiveTokenPoll = setInterval(async () => {
                pollAttempts++;
                console.log(`🔍 [AGGRESSIVE] Checking for Apple token... attempt ${pollAttempts}/${maxAttempts}`);
                
                try {
                  const authToken = localStorage.getItem('auth_token');
                  
                  if (authToken && authToken !== 'null' && authToken !== 'undefined') {
                    console.log('✅ [AGGRESSIVE] Found auth token, verifying...');
                    
                    const userResponse = await apiRequest('/auth/me', { method: 'GET' });
                    
                    if (userResponse && userResponse.id) {
                      clearInterval(aggressiveTokenPoll);
                      clearTimeout(timeoutId);
                      
                      console.log('🎉 [AGGRESSIVE] Apple OAuth SUCCESS detected!');
                      
                      await refreshUser(true);
                      showSuccess('¡Bienvenido!', 'Has iniciado sesión con Apple');
                      setLoading(false);
                      
                      setTimeout(() => {
                        navigate({ to: '/home' });
                      }, 500);
                      
                      return;
                    }
                  }
                  
                  if (pollAttempts >= maxAttempts) {
                    clearInterval(aggressiveTokenPoll);
                    console.log('⚠️ [AGGRESSIVE] Token polling timeout reached');
                  }
                  
                } catch (error) {
                  console.log(`⚠️ [AGGRESSIVE] Poll attempt ${pollAttempts} failed:`, error);
                  
                  if (pollAttempts >= maxAttempts) {
                    clearInterval(aggressiveTokenPoll);
                  }
                }
              }, 3000); // Verificar cada 3 segundos
              
            }
            // Para móvil, el éxito se maneja a través del DeepLinkHandler Y el polling agresivo
          }
        } catch (mobileError: any) {
          if (!hasTimedOut) {
            clearTimeout(timeoutId);
            throw mobileError;
          }
        }
        
      } else {
        // ✅ MEJORADO: Flujo web con mejor error handling
        console.log('💻 Using web Apple OAuth flow');
        const result = await signInWithApple(false); // false = login
        
        if (!result.success && result.error) {
          handleBackendError(`Error en Apple Sign-In (Web): ${result.error}`, {
            id: 'apple-oauth-init-error',
            autoClose: 8000
          });
          setLoading(false);
        }
        // Si success=true, el usuario fue redirigido a Apple
      }
      
    } catch (error: any) {
      console.error('❌ Error iniciando Apple OAuth:', error);
      
      // ✅ MEJORADO: Error messages específicos para diferentes problemas
      let errorMessage = 'No se pudo iniciar sesión con Apple';
      
      if (error?.message?.includes('Capacitor')) {
        errorMessage = 'Error de plataforma móvil. Por favor actualiza la app e intenta nuevamente.';
      } else if (error?.message?.includes('timeout')) {
        errorMessage = 'Apple Sign-In tomó demasiado tiempo. Verifica tu conexión e intenta nuevamente.';
      } else if (error?.message?.includes('network')) {
        errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
      } else if (error?.message) {
        errorMessage = `Error en Apple Sign-In: ${error.message}`;
      }
      
      handleBackendError(errorMessage, {
        id: 'apple-oauth-general-error',
        autoClose: 10000
      });
      setLoading(false);
    }
  };

  const form = useForm<LoginFormValues>({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => {
        const validationError = handleValidationError('email', value);
        return validationError ? validationError.message : null;
      },
      password: (value) => {
        const validationError = handleValidationError('password', value);
        return validationError ? validationError.message : null;
      },
    }
  });

  const handleLogin = async (values: LoginFormValues) => {
    try {
      setLoading(true);
      
      console.log('🔍 Login button clicked');

      const result = await signIn(values.email, values.password);
      console.log('🔄 Login result:', result);

      if (!result.success) {
        console.log('❌ Login failed:', result.error);
        handleBackendError(result.error || 'Error al iniciar sesión', {
          id: 'login-error',
          autoClose: 6000
        });
        return;
      }

      // ✅ CRÍTICO: SIEMPRE ejecutar bootstrap para asegurar wallet/profile
      if (result.token) {
        console.log('🔑 Login successful with auth token');
        
        // Ejecutar bootstrap para asegurar wallet/profile/terms
        try {
          console.log('🔧 Executing bootstrap for traditional login to ensure wallet/profile...');
          await ensureBootstrap();
          console.log('✅ Bootstrap completed successfully after traditional login');
        } catch (bootstrapError) {
          console.error('❌ Bootstrap failed during traditional login:', bootstrapError);
          handleBackendError('Error configurando cuenta. Por favor, intenta de nuevo.', {
            id: 'login-bootstrap-error',
            autoClose: 5000
          });
          return;
        }
        
        // Refresh del contexto después del bootstrap
        try {
          await refreshUser(true);
          console.log('✅ Auth context refreshed after login and bootstrap');
        } catch (refreshError) {
          console.error('⚠️ Error refreshing auth context:', refreshError);
          // No es crítico - el usuario ya está autenticado
        }
        
        showSuccess(
          'Inicio de sesión exitoso',
          'Bienvenido de vuelta. Serás redirigido automáticamente.',
          { 
            id: 'login-success',
            autoClose: 2000 
          }
        );
      } else {
        console.log('⚠️ Login successful but no auth token received');
        showSuccess(
          'Inicio de sesión exitoso',
          'Has iniciado sesión correctamente.',
          { 
            id: 'login-success',
            autoClose: 2000 
          }
        );
      }
      
      // No navegar manualmente - dejar que el AuthGuard detecte el cambio de estado

    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Usar el hook para manejar el error
      handleBackendError(error, {
        id: 'login-error',
        autoClose: 6000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className={styles.container}>
      <LoadingOverlay 
        visible={loading && !isOAuthCallback} 
        overlayProps={{ 
          radius: "sm", 
          blur: 2,
          backgroundOpacity: 0.85 
        }}
        loaderProps={{ 
          color: "blue", 
          type: "bars" 
        }}
        style={{
          zIndex: 1000
        }}
      />
      
      {/* ✅ MEJORA: Loading específico para OAuth */}
      {isOAuthCallback && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          color: 'white'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <h3 style={{ margin: '0 0 10px', fontSize: '18px' }}>
              Completando inicio de sesión con Google...
            </h3>
            <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>
              Por favor espera mientras procesamos tu autenticación
            </p>
          </div>
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `
          }} />
        </div>
      )}
      
      <Group justify="flex-start" mb="xl">
        <UnstyledButton component={Link} to="/" className={styles.backButton}>
          <ArrowLeft size={24} />
        </UnstyledButton>
      </Group>

      <Box className={styles.logoSection}>
        <Box className={styles.logo}>
          <img src="https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/Logo.png" alt="Cupo Logo" /> 
        </Box>
        <Text className={styles.title}>
          Hola de nuevo, <span className={styles.userName}>Usuario</span>
        </Text>
        <Text className={styles.subtitle}>
          Hoy es un gran día para viajar con nosotros.
        </Text>
      </Box>

      {/* Botones de OAuth */}
      <Box className={styles.socialLogin}>
        <Button
          variant="outline"
          fullWidth
          size="lg"
          onClick={handleGoogleLogin}
          disabled={loading}
          className={styles.googleButton}
          leftSection={
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          }
        >
          Continuar con Google
        </Button>
        
        {/* ✅ NUEVO: Botón de Apple Sign-In */}
        <AppleSignInButton
          onClick={handleAppleLogin}
          loading={loading}
          disabled={loading}
          text="Continuar con Apple"
          variant="login"
        />
        
        <Text className={styles.dividerText}>
          o inicia sesión con tu correo
        </Text>
      </Box>

      <form onSubmit={form.onSubmit(handleLogin)} className={styles.form}>
        <Box className={styles.inputWrapper}>
          <Text className={styles.inputLabel}>Correo electrónico</Text>
          <TextInput
            placeholder="ejemplo@correo.com"
            className={styles.input}
            size="lg"
            required
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="email"
            inputMode="email"
            {...form.getInputProps("email")}
          />
        </Box>

        <Box className={styles.inputWrapper}>
          <Text className={styles.inputLabel}>Contraseña</Text>
          <TextInput
            type={showPassword ? "text" : "password"}
            placeholder="Ingresa tu contraseña"
            className={styles.input}
            size="lg"
            required
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="current-password"
            {...form.getInputProps("password")}
            rightSection={
              <UnstyledButton
                onClick={() => setShowPassword(!showPassword)}
                className={styles.eyeButton}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </UnstyledButton>
            }
          />
        </Box>

        <Button
          loading={loading}
          fullWidth
          size="lg"
          className={styles.loginButton}
          type="submit"
        >
          Ingresar
        </Button>

        <UnstyledButton
          className={styles.forgotPassword}
          onClick={() => navigate({ to: "/RecuperarPasword/ForgotPassword" })}
        >
          Olvidé mi contraseña
        </UnstyledButton>

        <UnstyledButton
          className={styles.recoverAccount}
          onClick={() => setRecoverModalOpened(true)}
        >
          Recuperar cuenta desactivada
        </UnstyledButton>
      </form>

      <RecoverAccountModal
        opened={recoverModalOpened}
        onClose={() => setRecoverModalOpened(false)}
      />

      <Text className={styles.version}>Version 6.0.0 (1)</Text>
    </Container>
  );
};

export const Route = createFileRoute("/Login/")({
  component: LoginView,
});