import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { Center, Loader, Text } from '@mantine/core';
import { useBackendAuth } from '@/context/BackendAuthContext';
import { getAuthToken } from '@/config/api';

interface AuthGuardProps {
  children: React.ReactNode;
}

// Rutas que no requieren autenticación
const publicRoutes = [
  '/',
  '/Login',
  '/Registro',
  '/RecuperarPasword',
  '/RecuperarPasword/ForgotPassword',
  '/RecuperarPasword/ResetPassword',
];

// Rutas que requieren autenticación pero no perfil completo
const authOnlyRoutes = [
  '/CompletarRegistro',
];

export function AuthGuard({ children }: AuthGuardProps) {
  const { loading, isAuthenticated, hasProfile, isNewUser } = useBackendAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const lastAuthState = useRef<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      // No hacer nada mientras está cargando
      if (loading) {
        console.log('AuthGuard - Still loading, waiting...');
        return;
      }

      console.log('AuthGuard - Current path:', currentPath);
      console.log('AuthGuard - Is authenticated:', isAuthenticated);
      console.log('AuthGuard - Has profile:', hasProfile);
      console.log('AuthGuard - Is new user:', isNewUser);
      console.log('AuthGuard - Last auth state:', lastAuthState.current);

      // Detectar cambio de estado de autenticación (sesión expirada)
      if (lastAuthState.current === true && isAuthenticated === false) {
        console.log('🚨 Session expired - User was authenticated but now is not');
        // Redirigir al login en lugar de home cuando expire la sesión
        navigate({ to: '/Login' });
        lastAuthState.current = isAuthenticated;
        return;
      }

      // Actualizar el último estado conocido
      lastAuthState.current = isAuthenticated;

      // Si es una ruta pública, manejar la navegación
      if (publicRoutes.includes(currentPath)) {
        // Si está autenticado y es un nuevo usuario, redirigir a completar registro con onboarding
        if (isAuthenticated && isNewUser && !hasProfile && currentPath !== '/Login') {
          console.log('🎯 New user detected, redirecting to registration with onboarding');
          navigate({ to: '/CompletarRegistro', search: { from: 'onboarding' } });
          return;
        }
        
        // Si está autenticado y tiene perfil, y está en index o login, redirigir a home
        if (isAuthenticated && hasProfile && (currentPath === '/Login' || currentPath === '/')) {
          console.log('✅ User is authenticated with profile, redirecting to home');
          navigate({ to: '/home' });
          return;
        }
        
        // Si está autenticado pero no tiene perfil, y está en index o login, redirigir a completar registro
        if (isAuthenticated && !hasProfile && (currentPath === '/Login' || currentPath === '/')) {
          console.log('⚠️ User is authenticated but no profile, redirecting to complete registration');
          navigate({ to: '/CompletarRegistro', search: { from: '' } });
          return;
        }
        
        // Para todas las demás rutas públicas (incluyendo /Registro), permitir acceso
        console.log('📍 User on public route, no redirection needed');
        return;
      }

      // Si no está autenticado y no está en ruta pública, redirigir a login
      if (!isAuthenticated) {
        console.log('❌ User not authenticated, redirecting to login');
        console.log('🔍 Debug - Current path:', currentPath, 'Is auth route:', authOnlyRoutes.includes(currentPath));
        navigate({ to: '/Login' });
        return;
      }

      // ✅ VERIFICACIÓN ADICIONAL: Si está en ruta que requiere solo auth, verificar token
      if (authOnlyRoutes.includes(currentPath) && isAuthenticated) {
        // Verificar si realmente hay token válido
        const token = getAuthToken();
        
        if (!token) {
          console.log('❌ No auth token found for authenticated user in auth-only route');
          navigate({ to: '/Login' });
          return;
        }
        
        console.log('✅ User authenticated with token for auth-only route');
      }

      // Si está autenticado pero no tiene perfil completo
      if (isAuthenticated && !hasProfile && !authOnlyRoutes.includes(currentPath)) {
        console.log('⚠️ User authenticated but no profile, redirecting to complete registration');
        navigate({ to: '/CompletarRegistro', search: { from: '' } });
        return;
      }

      // Si está en completar registro pero ya tiene perfil
      // EXCEPCIÓN: Permitir acceso si viene desde el perfil para actualizar
      if (isAuthenticated && hasProfile && currentPath === '/CompletarRegistro') {
        // Obtener los parámetros de búsqueda de la URL actual
        const searchParams = new URLSearchParams(window.location.search);
        const fromProfile = searchParams.get('from') === 'profile';
        const fromOnboarding = searchParams.get('from') === 'onboarding';
        
        console.log('🔍 User with profile on CompletarRegistro:', {
          currentPath,
          fromProfile,
          fromOnboarding,
          hasProfile,
          isNewUser,
          searchParams: Object.fromEntries(searchParams.entries())
        });
        
        // ✅ MEJORA: Si ya completó el perfil y no es update, redirigir inmediatamente
        if (!fromProfile && !fromOnboarding && !isNewUser && hasProfile) {
          console.log('✅ User has completed profile, redirecting to home');
          navigate({ to: '/home' });
          return;
        } else if (fromProfile || fromOnboarding) {
          console.log('📝 Allowing access to CompletarRegistro for update or new user setup');
          // Permitir el acceso para actualizar perfil o completar onboarding
          return;
        } else {
          console.log('🔄 User needs to complete profile setup');
          return;
        }
      }
    };

    checkAuth();
  }, [loading, isAuthenticated, hasProfile, currentPath, navigate]);

  // Mostrar loader mientras se verifica la autenticación
  if (loading) {
    return (
      <Center style={{ height: '100vh', backgroundColor: '#0a0a0a' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader color="green" size="lg" />
          <Text style={{ marginTop: '1rem', color: 'white' }}>
            Verificando sesión...
          </Text>
          <Text style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
            Si esto toma mucho tiempo, por favor recarga la página
          </Text>
        </div>
      </Center>
    );
  }

  return <>{children}</>;
}
