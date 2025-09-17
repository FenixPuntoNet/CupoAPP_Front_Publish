import React, { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Box,
  TextInput,
  Button,
  Container,
  Text,
  Group,
  UnstyledButton,
  LoadingOverlay,
  Checkbox,
} from "@mantine/core";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useForm } from "@mantine/form";
import styles from "./index.module.css";
import { TermsModal } from "@/components/TermsModal";
import AppleSignInButton from "@/components/AppleSignInButton";
import { registerUser, type SignupRequest } from "@/services/auth";
import { saveTermsAndConditions } from "@/services/terms";
import { useBackendAuth } from "@/context/BackendAuthContext";
import { apiRequest } from "@/config/api";
import { signInWithApple, processAppleCallback, isAppleCallback, cleanAppleCallbackUrl } from "@/services/appleAuth";

import { isMobileApp, startMobileOAuth } from '@/utils/deepLinkHandler';

interface RegisterFormValues {
  nombre: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const RegisterView: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [subscribeEmails, setSubscribeEmails] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [cookiesAccepted, setCookiesAccepted] = useState(() => {
    return localStorage.getItem("cookiesAccepted") === "true";
  });

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
  const { refreshUser } = useBackendAuth();

  // Detectar regreso del OAuth (Google y Apple)
  useEffect(() => {
    const checkOAuthReturn = async () => {
      // Si detectamos OAuth callback, activar loading inmediatamente
      if (isOAuthCallback) {
        setLoading(true);
        console.log('🔄 OAuth callback detectado, iniciando procesamiento...');
      }

      // ✅ NUEVO: Verificar callback de Apple primero
      if (isAppleCallback()) {
        console.log('🍎 Detectado Apple OAuth callback en registro, procesando...');
        
        try {
          const appleResult = await processAppleCallback();
          
          if (appleResult.success) {
            await handleSuccessfulAppleAuth();
          } else {
            setError(appleResult.error || 'Error en Apple Sign-In');
          }
        } catch (error: any) {
          console.error('❌ Error procesando Apple callback:', error);
          setError(error?.message || 'Error procesando Apple Sign-In');
        } finally {
          cleanAppleCallbackUrl();
          setLoading(false);
          setIsOAuthCallback(false);
        }
        return;
      }
      
      // Verificar si estamos en una URL de callback con tokens
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
        setError(`Error en OAuth: ${error}`);
        setIsOAuthCallback(false);
        setLoading(false);
        return;
      }
      
      if (accessToken) {
        console.log('🔗 Detectado access_token en URL, procesando OAuth callback...');
        console.log('🔑 Token detectado:', accessToken.substring(0, 20) + '...');
        setLoading(true);
        
        try {
          // Limpiar la URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // ✅ MÉTODO DIRECTO: Guardar el token directamente (como funcionaba antes)
          const { setAuthToken } = await import('@/config/api');
          setAuthToken(accessToken);
          
          console.log('🔑 Token guardado directamente en localStorage');
          
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
          setError('Error completando el registro con Google. Intenta nuevamente.');
        } finally {
          setIsOAuthCallback(false);
          setLoading(false);
        }
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
              redirect_uri: `${window.location.origin}/Registro`
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
          setError('Error completando el registro con Google. Intenta nuevamente.');
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
          
          if (isStateValid && state.page === 'registro') {
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
                console.log('✅ Google OAuth registration successful');
                await handleSuccessfulGoogleAuth();
                return;
              }
            }
            
            console.log('ℹ️ No hay autenticación válida, continuando con registro normal');
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

  // ✅ MEJORADO: Setup listeners anti-loop para OAuth móvil de Apple
  useEffect(() => {
    const isMobile = window?.navigator?.userAgent?.includes('Capacitor') || 
                     window?.location?.protocol === 'capacitor:' ||
                     !!(window as any)?.Capacitor;
    
    if (isMobile) {
      console.log('📱 Setting up anti-loop mobile listeners for Apple OAuth return (Registro)');
      
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
      
      // ✅ NUEVO: Listeners de fallback para Apple OAuth en Registro
      const handleAppleOAuthSuccess = async (event: Event) => {
        const customEvent = event as CustomEvent;
        console.log('🎯 [FALLBACK] Apple OAuth registration success event received:', customEvent.detail);
        
        try {
          setLoading(true);
          const userResponse = customEvent.detail?.userResponse;
          
          if (userResponse?.id) {
            // Refrescar usuario
            await refreshUser(true);
            
            // Procesamiento específico de registro exitoso
            await handleSuccessfulAppleAuth();
          }
        } catch (error) {
          console.error('❌ Error processing Apple OAuth registration success fallback:', error);
          cleanupOAuthState();
        }
      };
      
      const handleAppleOAuthError = (event: Event) => {
        const customEvent = event as CustomEvent;
        console.log('🎯 [FALLBACK] Apple OAuth registration error event received:', customEvent.detail);
        
        cleanupOAuthState();
        setError(customEvent.detail?.error || 'Error en Apple Sign-In para registro');
      };
      
      // Agregar listeners de fallback
      window.addEventListener('appleOAuthSuccess', handleAppleOAuthSuccess);
      window.addEventListener('appleOAuthError', handleAppleOAuthError);
      
      // Timeout para evitar loading infinito (2 minutos máximo)
      loadingTimeout = setTimeout(() => {
        console.log('⏰ OAuth timeout reached - stopping loading state');
        cleanupOAuthState();
        setError('El proceso de registro tardó demasiado. Intenta nuevamente.');
      }, 120000);

      // Función mejorada para manejar el regreso de la app
      const handleAppReturn = async () => {
        console.log('🔄 App returned, checking for Apple OAuth completion in registration...');
        
        // Evitar multiple checks simultáneos
        const isAlreadyChecking = localStorage.getItem('apple_oauth_checking');
        if (isAlreadyChecking) {
          console.log('⚠️ Already checking OAuth state, skipping duplicate check');
          return;
        }
        
        localStorage.setItem('apple_oauth_checking', 'true');
        
        try {
          // ESTRATEGIA 1: Verificar token pendiente de Apple OAuth
          const pendingAppleAuth = localStorage.getItem('apple_oauth_pending');
          
          if (pendingAppleAuth) {
            console.log('🍎 Detected pending Apple OAuth in registration, processing...');
            setLoading(true);
            
            try {
              const tokenData = JSON.parse(pendingAppleAuth);
              
              // Configurar token
              const { setAuthToken } = await import('@/config/api');
              setAuthToken(tokenData.token);
              
              // Refrescar usuario
              await refreshUser();
              
              cleanupOAuthState();
              
              // Si es un usuario nuevo, ir al completar registro con onboarding
              if (tokenData.isNewUser) {
                console.log('🆕 New user detected, navigating to complete registration');
                localStorage.setItem('is_new_user', 'true');
                navigate({ 
                  to: "/CompletarRegistro", 
                  search: { from: 'onboarding' } 
                });
              } else {
                console.log('👤 Existing user detected, navigating to home');
                navigate({ to: '/home' });
              }
              
              return;
              
            } catch (error) {
              console.error('❌ Error processing Apple OAuth return in registration:', error);
              localStorage.removeItem('apple_oauth_pending');
            }
          }
          
          // ESTRATEGIA 2: Verificar si ya hay un auth_token válido
          const authToken = localStorage.getItem('auth_token');
          if (authToken && authToken !== 'null' && authToken !== 'undefined') {
            console.log('🔑 Found valid auth_token, verifying authentication...');
            setLoading(true);
            
            try {
              // Verificar con el backend si el token es válido
              const userResponse = await apiRequest('/auth/me', { method: 'GET' });
              
              if (userResponse && userResponse.id) {
                console.log('✅ Apple OAuth completed successfully via deep link in registration');
                
                await refreshUser();
                cleanupOAuthState();
                
                // Para registro, siempre asumir usuario nuevo y ir a completar registro
                localStorage.setItem('is_new_user', 'true');
                navigate({ 
                  to: "/CompletarRegistro", 
                  search: { from: 'apple_oauth' } 
                });
                
                return;
              }
            } catch (error) {
              console.log('⚠️ Auth token found but invalid in registration:', error);
              localStorage.removeItem('auth_token');
            }
          }
          
          // ESTRATEGIA 3: Polling del backend como fallback
          const startPollingCheck = () => {
            console.log('🔄 Starting backend polling for registration...');
            let pollAttempts = 0;
            const maxPollAttempts = 12;
            
            oauthCheckInterval = setInterval(async () => {
              pollAttempts++;
              console.log(`� Registration polling attempt ${pollAttempts}/${maxPollAttempts}`);
              
              try {
                const storedToken = localStorage.getItem('auth_token');
                if (storedToken && storedToken !== 'null') {
                  const userResponse = await apiRequest('/auth/me', { method: 'GET' });
                  
                  if (userResponse && userResponse.id) {
                    console.log('✅ Registration polling detected successful authentication!');
                    
                    await refreshUser();
                    cleanupOAuthState();
                    
                    // Para registro con polling, asumir usuario nuevo
                    localStorage.setItem('is_new_user', 'true');
                    navigate({ 
                      to: "/CompletarRegistro", 
                      search: { from: 'apple_oauth_polling' } 
                    });
                    
                    return;
                  }
                }
                
                if (pollAttempts >= maxPollAttempts) {
                  console.log('🚫 Max polling attempts reached in registration');
                  cleanupOAuthState();
                  
                  const finalToken = localStorage.getItem('auth_token');
                  if (!finalToken || finalToken === 'null') {
                    setError('No se pudo completar el registro con Apple. Intenta nuevamente.');
                  }
                }
              } catch (error) {
                console.log(`⚠️ Registration polling attempt ${pollAttempts} failed:`, error);
                
                if (pollAttempts >= maxPollAttempts) {
                  console.log('🚫 Max polling attempts reached with errors in registration');
                  cleanupOAuthState();
                }
              }
            }, 10000);
          };
          
          // Solo iniciar polling si no encontramos auth inmediatamente
          setTimeout(() => {
            const currentAuthToken = localStorage.getItem('auth_token');
            const stillPending = localStorage.getItem('apple_oauth_pending');
            
            if ((!currentAuthToken || currentAuthToken === 'null') && !stillPending) {
              startPollingCheck();
            }
          }, 3000);
          
        } finally {
          localStorage.removeItem('apple_oauth_checking');
        }
      };
      
      // Configurar listener para app state changes
      if ((window as any).Capacitor) {
        const capacitor = (window as any).Capacitor;
        if (capacitor.Plugins && capacitor.Plugins.App) {
          const listener = capacitor.Plugins.App.addListener('appStateChange', (state: any) => {
            console.log('📱 App state changed in registration:', state);
            if (state.isActive) {
              setTimeout(handleAppReturn, 1500);
            }
          });
          
          return () => {
            cleanupOAuthState();
            
            // ✅ LIMPIAR LISTENERS DE FALLBACK
            window.removeEventListener('appleOAuthSuccess', handleAppleOAuthSuccess);
            window.removeEventListener('appleOAuthError', handleAppleOAuthError);
            
            listener.remove();
          };
        }
      }
    }
  }, [refreshUser, navigate]);

  // Función para hacer bootstrap via backend (sin Supabase)
  const ensureBootstrap = async () => {
    try {
      console.log('🔧 Ensuring user bootstrap via backend...');
      const res = await apiRequest('/auth/bootstrap', {
        method: 'POST',
        body: JSON.stringify({}) // Enviar objeto vacío en lugar de undefined
      });
      
      if (!res.success) {
        throw new Error(res.error || 'Bootstrap falló');
      }
      
      console.log('✅ Bootstrap completed successfully');
      
      // Limpiar cualquier cache para forzar fresh data en próximas requests
      console.log('🔄 Clearing cache after bootstrap...');
      
      // Force refresh del usuario para obtener datos actualizados
      console.log('🔄 Forcing user refresh after bootstrap...');
      await refreshUser(true);
      
      return res;
    } catch (error) {
      console.error('❌ Bootstrap error:', error);
      throw error;
    }
  };

  const handleGoogleRegister = async () => {
    try {
      setError(null);
      setLoading(true);
      console.log('🚀 Starting Google OAuth registration via backend...');
      
      if (isMobileApp()) {
        // ===== VERSIÓN MÓVIL MEJORADA (Capacitor) =====
        console.log('📱 Using improved mobile Capacitor implementation for registration');
        
        await startMobileOAuth({
          onSuccess: async (userData: any) => {
            console.log('✅ Mobile OAuth registration successful:', userData);
            await handleSuccessfulGoogleAuth();
          },
          onError: (error: any) => {
            console.error('❌ Mobile OAuth registration error:', error);
            setError(error || 'Error en OAuth móvil');
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
        console.log('🌐 Using web redirect implementation');
        
        // Guardar el estado actual para poder retomar después del OAuth
        localStorage.setItem('oauth_state', JSON.stringify({
          page: 'registro',
          terms_accepted: acceptTerms,
          email_subscribed: subscribeEmails,
          timestamp: Date.now()
        }));
        
        // Redirigir directamente en la misma página con el redirect_uri correcto para web
        const webRedirectUri = `${window.location.origin}/Registro`;
        const googleAuthUrl = `https://cupo-backend.fly.dev/auth/login/google?redirect=${encodeURIComponent(webRedirectUri)}`;
        console.log('🔗 Redirecting to:', googleAuthUrl);
        window.location.href = googleAuthUrl;
      }

    } catch (e: any) {
      console.error('Error iniciando Google OAuth:', e);
      setError(e?.message || 'No se pudo iniciar sesión con Google');
      setLoading(false);
    }
  };

  // Función auxiliar para manejar el éxito del login con Google
  const handleSuccessfulGoogleAuth = async () => {
    try {
      // ✅ OPTIMIZADO: El endpoint /me ahora maneja auto-bootstrap
      console.log('🔧 Checking user status with auto-bootstrap support...');
      
      // Refresh del contexto de autenticación primero
      try {
        await refreshUser(true);
        console.log('✅ Auth context refreshed after Google OAuth');
      } catch (refreshError) {
        console.error('⚠️ Error refreshing auth context:', refreshError);
      }

      // El endpoint /me ahora maneja bootstrap automáticamente
      const userResponse = await apiRequest('/auth/me', { method: 'GET' });
      
      if (userResponse && userResponse.id) {
        console.log('✅ User authenticated with Google (backend handled bootstrap)');
        console.log('🔧 Auto-bootstrap executed:', userResponse.auto_bootstrapped || 'not needed');

        // Solo ejecutar bootstrap manual si el backend lo indica
        if (userResponse.bootstrap_needed) {
          console.log('🔧 Backend indicates manual bootstrap needed...');
          try {
            await ensureBootstrap();
            console.log('✅ Manual bootstrap completed (includes terms & conditions)');
            
            // Refresh después del bootstrap manual
            await refreshUser(true);
            console.log('✅ Auth context refreshed after manual bootstrap');
          } catch (bootstrapError) {
            console.warn('⚠️ Manual bootstrap failed (non-critical):', bootstrapError);
          }
        } else {
          console.log('✅ Backend already handled all bootstrap requirements');
        }
      }

      // Marcar como usuario nuevo para onboarding
      localStorage.setItem('is_new_user', 'true');
      
      // Limpiar estado OAuth
      localStorage.removeItem('oauth_state');
      
      // Navegar al onboarding
      navigate({ 
        to: "/CompletarRegistro", 
        search: { from: 'onboarding' } 
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ NUEVO: Función auxiliar para manejar el éxito del registro con Apple
  const handleSuccessfulAppleAuth = async () => {
    try {
      console.log('🍎 Processing successful Apple registration...');
      
      // Refresh del contexto de autenticación primero
      try {
        await refreshUser(true);
        console.log('✅ Auth context refreshed after Apple OAuth');
      } catch (refreshError) {
        console.error('⚠️ Error refreshing auth context:', refreshError);
      }

      // Obtener información del usuario autenticado
      const userResponse = await apiRequest('/auth/me', { method: 'GET' });
      
      if (userResponse && userResponse.id) {
        console.log('✅ User authenticated with Apple (backend handled bootstrap)');
        console.log('🔧 Auto-bootstrap executed:', userResponse.auto_bootstrapped || 'not needed');

        // Bootstrap manual si es necesario
        if (userResponse.bootstrap_needed) {
          console.log('🔧 Backend indicates manual bootstrap needed...');
          try {
            await ensureBootstrap();
            console.log('✅ Manual bootstrap completed');
            await refreshUser(true);
          } catch (bootstrapError) {
            console.warn('⚠️ Manual bootstrap failed (non-critical):', bootstrapError);
          }
        }
      }

      // Marcar como usuario nuevo para onboarding
      localStorage.setItem('is_new_user', 'true');
      
      // Limpiar estado OAuth
      localStorage.removeItem('apple_oauth_state');
      
      // Navegar al onboarding
      navigate({ 
        to: "/CompletarRegistro", 
        search: { from: 'onboarding' } 
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ NUEVO: Función principal de Apple OAuth para Registro
  const handleAppleRegister = async () => {
    try {
      setError(null);
      setLoading(true);
      console.log('🍎 Starting Apple OAuth registration via backend...');
      
      // ✅ MEJORADO: Detección más precisa de plataforma para iPad
      const isMobile = window?.navigator?.userAgent?.includes('Capacitor') || 
                       window?.location?.protocol === 'capacitor:' ||
                       !!(window as any)?.Capacitor;
      
      const isIPad = /iPad/.test(navigator.userAgent);
      const platform = isMobile ? (isIPad ? 'iPad' : 'Mobile') : 'Web';
      
      console.log('📱 Platform detected for Apple OAuth registration:', platform);
      
      if (isMobile) {
        // ✅ MEJORADO: Manejo específico para móvil/iPad con timeout
        console.log('📱 Using mobile Apple OAuth flow with DeepLinkHandler');
        
        // Agregar timeout de seguridad a nivel de componente
        const REGISTRATION_TIMEOUT = 180000; // 3 minutos para iPad
        let hasTimedOut = false;
        
        const timeoutId = setTimeout(() => {
          hasTimedOut = true;
          setLoading(false);
          setError('Apple Sign-In tomó demasiado tiempo en iPad. Por favor intenta nuevamente.');
          console.error('⏰ Apple OAuth registration timeout on iPad');
        }, REGISTRATION_TIMEOUT);
        
        try {
          const result = await signInWithApple(true); // true = registro
          
          if (!hasTimedOut) {
            clearTimeout(timeoutId);
            
            if (!result.success && result.error) {
              setError(`Error en Apple Sign-In (${platform}): ${result.error}`);
              setLoading(false);
            }
            // Para móvil, el éxito se maneja a través del DeepLinkHandler
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
        const result = await signInWithApple(true); // true = registro
        
        if (!result.success && result.error) {
          setError(`Error en Apple Sign-In (Web): ${result.error}`);
          setLoading(false);
        }
        // Si success=true, el usuario fue redirigido a Apple
      }
      
    } catch (error: any) {
      console.error('❌ Error iniciando Apple OAuth registration:', error);
      
      // ✅ MEJORADO: Error messages específicos para diferentes problemas
      let errorMessage = 'No se pudo iniciar registro con Apple';
      
      if (error?.message?.includes('Capacitor')) {
        errorMessage = 'Error de plataforma móvil. Por favor actualiza la app e intenta nuevamente.';
      } else if (error?.message?.includes('timeout')) {
        errorMessage = 'Apple Sign-In tomó demasiado tiempo. Verifica tu conexión e intenta nuevamente.';
      } else if (error?.message?.includes('network')) {
        errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
      } else if (error?.message) {
        errorMessage = `Error en Apple Sign-In: ${error.message}`;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const form = useForm<RegisterFormValues>({
    initialValues: {
      nombre: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validate: {
      nombre: (value) => (value.length < 3 ? "El nombre debe tener al menos 3 caracteres" : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Correo electrónico inválido"),
      password: (value) => {
        if (value.length < 6) return "La contraseña debe tener al menos 6 caracteres";
        if (!/[A-Z]/.test(value)) return "La contraseña debe incluir al menos una letra mayúscula";
        if (!/[0-9]/.test(value)) return "La contraseña debe incluir al menos un número";
        return null;
      },
      confirmPassword: (value, values) =>
        value !== values.password ? "Las contraseñas no coinciden" : null,
    },
  });

  const handleRegister = async (values: RegisterFormValues) => {
    try {
      setError(null);
      setLoading(true);
  
      // Preparar datos para el backend
      const userData: SignupRequest = {
        email: values.email,
        password: values.password,
        full_name: values.nombre,
        terms_accepted: acceptTerms,
        email_subscribed: subscribeEmails,
        verification_terms: acceptTerms ? 'aceptado' : 'rechazado',
        suscriptions: subscribeEmails ? 'aceptado' : 'rechazado'
      };

      // ✅ AUTO-LOGIN: Registrar usuario (que ahora incluye auto-login)
      console.log('🚀 Starting registration with auto-login...');
      const result = await registerUser(userData);
  
      if (!result.success) {
        setError(result.error || 'Error al registrar usuario');
        return;
      }

      // ✅ REGISTRO + LOGIN EXITOSO
      console.log('✅ Registration and auto-login successful:', result);
      
      // Verificar si el resultado incluye datos de usuario (auto-login exitoso)
      const hasUserData = result.user && result.token;
      
      if (hasUserData) {
        console.log('🎯 User data received from auto-login, refreshing context...');
        
        // Actualizar el contexto de autenticación con los nuevos datos
        try {
          await refreshUser(true); // Forzar refresh después del auto-login
          console.log('✅ Auth context refreshed after registration');
        } catch (refreshError) {
          console.error('⚠️ Error refreshing auth context:', refreshError);
          // Continuar aunque falle el refresh - el usuario ya está logueado
        }

        // ✅ OPTIMIZADO: El backend /signup ya maneja bootstrap automático
        // Solo ejecutar bootstrap manual si es absolutamente necesario
        try {
          console.log('🔧 Checking if manual bootstrap is needed after registration...');
          const userCheck = await apiRequest('/auth/me', { method: 'GET' });
          
          // Solo hacer bootstrap manual si el backend indica que es necesario
          if (userCheck?.bootstrap_needed) {
            console.log('🔧 Backend indicates manual bootstrap needed after registration...');
            await ensureBootstrap();
            console.log('✅ Manual bootstrap completed after registration');
            
            // Refresh del contexto después del bootstrap manual
            await refreshUser(true);
            console.log('✅ Auth context refreshed after manual bootstrap');
          } else {
            console.log('✅ Backend already handled bootstrap during registration');
          }
        } catch (bootstrapError) {
          console.warn('⚠️ Bootstrap check/execution failed (non-critical):', bootstrapError);
          // No bloquear el registro si falla el bootstrap - el usuario ya está registrado
        }
      }
  
      // Guardar términos y condiciones por separado
      console.log('📝 Saving terms and conditions...');
      try {
        await saveTermsAndConditions({
          verification_terms: acceptTerms ? 'aceptado' : 'rechazado',
          suscriptions: subscribeEmails ? 'aceptado' : 'rechazado'
        });
        console.log('✅ Terms and conditions saved successfully');
      } catch (termsError) {
        console.error('⚠️ Error saving terms and conditions:', termsError);
        // No bloquear el registro si falla el guardado de términos
      }

      // Marcar que es un usuario nuevo para activar onboarding
      localStorage.setItem('is_new_user', 'true');
      console.log('🎯 User marked as new for onboarding');
  
      // ✅ FLUJO MEJORADO: Redirigir según el resultado del auto-login
      if (hasUserData) {
        // Usuario logueado automáticamente - ir directo a completar perfil con onboarding
        console.log('🎯 Auto-login successful, redirecting to complete profile with onboarding');
        navigate({ 
          to: "/CompletarRegistro", 
          search: { from: 'onboarding' } 
        });
      } else {
        // Auto-login falló - ir al login tradicional
        console.log('⚠️ Auto-login failed, redirecting to login');
        navigate({ 
          to: "/Login", 
          search: { newUser: 'true', message: 'registro-exitoso' } 
        });
      }
  
    } catch (error) {
      console.error("❌ Error durante el registro:", error);
      setError("Error inesperado durante el registro. Intenta nuevamente.");
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
              Completando registro con Google...
            </h3>
            <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>
              Por favor espera mientras creamos tu cuenta
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
          <img
            src="https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/Logo.png"
            alt="Cupo Logo"
          />
        </Box>
        <Text className={styles.title}>Crear una cuenta</Text>
        <Text className={styles.subtitle}>Únete a nosotros y empieza a viajar.</Text>
      </Box>

      <Box className={styles.socialLogin} mb="md">
        <Button
          variant="outline"
          fullWidth
          size="lg"
          onClick={handleGoogleRegister}
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
        
        {/* ✅ NUEVO: Botón de Apple Sign-In para registro */}
        <AppleSignInButton
          onClick={handleAppleRegister}
          loading={loading}
          disabled={loading}
          text="Registrarse con Apple"
          variant="register"
        />
        
        <Text className={styles.dividerText}>
          o regístrate con tu correo
        </Text>
      </Box>

      <form
        onSubmit={form.onSubmit((values) => {
          if (!acceptTerms) {
            setError("Debes aceptar los Términos y Condiciones para continuar.");
            return;
          }
          handleRegister(values);
        })}
        className={styles.form}
      >
        <Box className={styles.inputWrapper}>
          <Text className={styles.inputLabel}>Nombre completo</Text>
          <TextInput
            placeholder="Tu nombre completo"
            className={styles.input}
            size="lg"
            required
            autoCapitalize="words"
            autoCorrect="off"
            autoComplete="name"
            {...form.getInputProps("nombre")}
          />
        </Box>

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
            autoComplete="new-password"
            {...form.getInputProps("password")}
            rightSection={
              <UnstyledButton onClick={() => setShowPassword(!showPassword)} className={styles.eyeButton}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </UnstyledButton>
            }
          />
        </Box>

        <Box className={styles.inputWrapper}>
          <Text className={styles.inputLabel}>Confirmar Contraseña</Text>
          <TextInput
            type={showPassword ? "text" : "password"}
            placeholder="Confirma tu contraseña"
            className={styles.input}
            size="lg"
            required
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="new-password"
            {...form.getInputProps("confirmPassword")}
            rightSection={
              <UnstyledButton onClick={() => setShowPassword(!showPassword)} className={styles.eyeButton}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </UnstyledButton>
            }
          />
        </Box>
        <Checkbox
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e?.currentTarget?.checked ?? !acceptTerms)}
          label="Acepto los Términos y Condiciones"
          required
          mt="md"
        />
        <Checkbox
          checked={subscribeEmails}
          onChange={(e) => setSubscribeEmails(e?.currentTarget?.checked ?? !subscribeEmails)}
          label="Deseo recibir correos con información y promociones"
          mt="sm"
        />
        <div className={styles.termsSection}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTermsModal(true);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTermsModal(true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className={styles.termsLink}
            tabIndex={0}
            role="button"
            aria-label="Abrir términos y condiciones"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowTermsModal(true);
              }
            }}
          >
            📄 Términos y Condiciones
          </button>
          
          {/* Alternativa adicional para dispositivos problemáticos */}
          <Text
            size="sm"
            className={styles.termsLinkAlt}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTermsModal(true);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTermsModal(true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            role="button"
            tabIndex={0}
            aria-label="Abrir términos y condiciones (alternativo)"
          >
          </Text>
        </div>

        {error && (
          <Text color="red" size="sm" className={styles.errorMessage} mt="sm">
            {error}
          </Text>
        )}

        <Button
          loading={loading}
          fullWidth
          size="lg"
          className={styles.loginButton}
          type="submit"
          mt="xl"
          disabled={loading}
        >
          Registrarse
        </Button>

      </form>

      {/* Modal profesional y reutilizable */}
      <TermsModal opened={showTermsModal} onClose={() => setShowTermsModal(false)} />

      {!cookiesAccepted && (
        <Box className={styles.cookiesBanner}>
          <Text size="sm" className={styles.cookiesText}>
            Usamos cookies para mejorar tu experiencia. Al continuar, aceptas su uso.
          </Text>
          <Button
            size="xs"
            color="green"
            onClick={() => {
              localStorage.setItem("cookiesAccepted", "true");
              setCookiesAccepted(true);
            }}
          >
            Aceptar
          </Button>
        </Box>
      )}
    </Container>
  );
};

export const Route = createFileRoute("/Registro/")({
  component: RegisterView,
});
