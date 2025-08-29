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
import { useBackendAuth } from "@/context/BackendAuthContext";
import { useErrorHandling } from "@/hooks/useErrorHandling";
import { apiRequest } from "@/config/api";
import styles from "./index.module.css";

// Imports dinámicos para Capacitor (solo se cargan en móvil)
let App: any = null;
let Browser: any = null;

// Función para detectar si estamos en un entorno móvil
const isMobileApp = () => {
  return window.location.protocol === 'capacitor:' || 
         (window as any).Capacitor?.isNativePlatform?.() || 
         false;
};

// Función para cargar dinámicamente los plugins de Capacitor
const loadCapacitorPlugins = async () => {
  if (isMobileApp() && !App && !Browser) {
    try {
      const [appModule, browserModule] = await Promise.all([
        import('@capacitor/app'),
        import('@capacitor/browser')
      ]);
      App = appModule.App;
      Browser = browserModule.Browser;
      console.log('✅ Capacitor plugins loaded');
    } catch (error) {
      console.warn('⚠️ Failed to load Capacitor plugins:', error);
    }
  }
};

interface LoginFormValues {
  email: string;
  password: string;
}

const LoginView: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = useState(false);
  const [recoverModalOpened, setRecoverModalOpened] = useState(false);
  
  // ✅ MEJORA: Detección temprana del OAuth callback
  const [isOAuthCallback, setIsOAuthCallback] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
    const authCode = urlParams.get('code');
    return !!(accessToken || authCode);
  });
  
  const navigate = useNavigate();
  const { signIn, refreshUser } = useBackendAuth();
  const { handleValidationError, handleBackendError, showSuccess } = useErrorHandling();

  // Detectar regreso del OAuth de Google
  useEffect(() => {
    const checkOAuthReturn = async () => {
      // Si detectamos OAuth callback, activar loading inmediatamente
      if (isOAuthCallback) {
        setLoading(true);
        console.log('🔄 OAuth callback detectado, iniciando procesamiento...');
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

  // Función para hacer bootstrap via backend
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
      return res;
    } catch (error) {
      console.error('❌ Bootstrap error:', error);
      throw error;
    }
  };

  // Función principal de Google OAuth para Login
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      console.log('🚀 Starting Google OAuth login via backend...');
      
      // Cargar plugins de Capacitor si estamos en móvil
      await loadCapacitorPlugins();
      
      if (isMobileApp() && App && Browser) {
        // ===== VERSIÓN MÓVIL (Capacitor) =====
        console.log('📱 Using mobile Capacitor implementation for login');
        
        const MOBILE_REDIRECT = 'cupo://oauth-callback';
        const googleAuthUrl = `https://cupo-backend.fly.dev/auth/login/google?redirect=${encodeURIComponent(MOBILE_REDIRECT)}&platform=mobile`;
        
        console.log('🔗 Mobile OAuth URL:', googleAuthUrl);
        
        // Abrir navegador del sistema
        await Browser.open({ url: googleAuthUrl });

        // Escuchar deep link
        await App.addListener('appUrlOpen', async (event: any) => {
          try {
            const { url } = event;
            console.log('🔗 Deep link recibido en login:', url);
            
            if (url?.startsWith('cupo://oauth-callback')) {
              // Cerrar navegador y remover listeners
              await Browser.close();
              await App.removeAllListeners();
              
              // Extraer token del deep link
              const urlObj = new URL(url);
              const accessToken = urlObj.searchParams.get('access_token') || 
                                urlObj.hash.includes('access_token') ? 
                                new URLSearchParams(urlObj.hash.substring(1)).get('access_token') : null;
              
              if (accessToken) {
                console.log('🔑 Access token encontrado en deep link (login)');
                
                // Guardar token
                const { setAuthToken } = await import('@/config/api');
                setAuthToken(accessToken);
                
                // Verificar usuario
                const userResponse = await apiRequest('/auth/me', { method: 'GET' });
                
                if (userResponse && userResponse.id) {
                  console.log('✅ Google OAuth login successful (mobile)');
                  await handleSuccessfulGoogleAuth();
                } else {
                  throw new Error('No se pudo verificar el usuario');
                }
              } else {
                throw new Error('No se encontró access_token en el deep link');
              }
            }
          } catch (error: any) {
            console.error('Mobile OAuth login error:', error);
            handleBackendError(error?.message || 'Error con Google OAuth', {
              id: 'google-oauth-error',
              autoClose: 6000
            });
            setLoading(false);
          }
        });

        // Timeout después de 5 minutos
        setTimeout(async () => {
          await App.removeAllListeners();
          handleBackendError('Tiempo de espera agotado para el login con Google', {
            id: 'google-oauth-timeout',
            autoClose: 6000
          });
          setLoading(false);
        }, 300000);
        
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
      // Verificar si es un usuario nuevo o existente
      const userResponse = await apiRequest('/auth/me', { method: 'GET' });
      
      if (userResponse && userResponse.id) {
        console.log('✅ Usuario autenticado con Google:', userResponse);
        
        // Verificar si necesita bootstrap (es decir, si es un usuario nuevo)
        const needsBootstrap = userResponse.bootstrap_needed || !userResponse.profile;
        
        if (needsBootstrap) {
          console.log('🆕 Usuario nuevo detectado, ejecutando bootstrap y dirigiendo a onboarding...');
          
          // Bootstrap para usuario nuevo (incluye términos y condiciones automáticamente)
          try {
            await ensureBootstrap();
            console.log('✅ Bootstrap completed for new user (includes wallet, profile, and terms)');
          } catch (bootstrapError) {
            console.warn('⚠️ Bootstrap failed (non-critical):', bootstrapError);
          }

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

          // Navegar directamente al onboarding
          navigate({ 
            to: "/CompletarRegistro", 
            search: { from: 'onboarding' } 
          });
          
          return; // Salir temprano para evitar el refresh automático
        } else {
          console.log('👤 Usuario existente, login normal');
          
          // Bootstrap de mantenimiento para usuario existente
          try {
            await ensureBootstrap();
            console.log('✅ Maintenance bootstrap completed');
          } catch (bootstrapError) {
            console.warn('⚠️ Maintenance bootstrap failed (non-critical):', bootstrapError);
          }
        }

        // Refresh del contexto de autenticación para usuarios existentes
        try {
          await refreshUser(true);
          console.log('✅ Auth context refreshed after Google OAuth');
        } catch (refreshError) {
          console.error('⚠️ Error refreshing auth context:', refreshError);
        }

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

      // Verificar si se recibió un token de autenticación
      if (result.token) {
        console.log('🔑 Login successful with auth token - AuthGuard will handle navigation');
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

      {/* Botón de Google OAuth */}
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

      <Text className={styles.version}>v 0.0.1 (0)</Text>
    </Container>
  );
};

export const Route = createFileRoute("/Login/")({
  component: LoginView,
});