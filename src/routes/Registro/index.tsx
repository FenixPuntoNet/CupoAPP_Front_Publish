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
import { registerUser, type SignupRequest } from "@/services/auth";
import { saveTermsAndConditions } from "@/services/terms";
import { useBackendAuth } from "@/context/BackendAuthContext";
import { apiRequest } from "@/config/api";

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

  // ✅ MEJORA: Detección temprana del OAuth callback
  const [isOAuthCallback, setIsOAuthCallback] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
    const authCode = urlParams.get('code');
    return !!(accessToken || authCode);
  });

  const navigate = useNavigate();
  const { refreshUser } = useBackendAuth();

  // Detectar regreso del OAuth de Google
  useEffect(() => {
    const checkOAuthReturn = async () => {
      // Si detectamos OAuth callback, activar loading inmediatamente
      if (isOAuthCallback) {
        setLoading(true);
        console.log('🔄 OAuth callback detectado, iniciando procesamiento...');
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
      // Bootstrap para asegurar wallet/perfil/términos (backend ya maneja términos)
      try {
        await ensureBootstrap();
        console.log('✅ Bootstrap completed (includes terms & conditions)');
      } catch (bootstrapError) {
        console.warn('⚠️ Bootstrap failed (non-critical):', bootstrapError);
      }

      // Refresh del contexto de autenticación
      try {
        await refreshUser(true);
        console.log('✅ Auth context refreshed after Google OAuth');
      } catch (refreshError) {
        console.error('⚠️ Error refreshing auth context:', refreshError);
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
