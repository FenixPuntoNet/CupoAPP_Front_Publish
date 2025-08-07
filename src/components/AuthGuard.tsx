import { useEffect } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { Center, Loader, Text } from '@mantine/core';
import { useBackendAuth } from '@/context/BackendAuthContext';

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
  const { loading, isAuthenticated, hasProfile } = useBackendAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {
    // No hacer nada mientras está cargando
    if (loading) {
      console.log('AuthGuard - Still loading, waiting...');
      return;
    }

    console.log('AuthGuard - Current path:', currentPath);
    console.log('AuthGuard - Is authenticated:', isAuthenticated);
    console.log('AuthGuard - Has profile:', hasProfile);
    console.log('AuthGuard - Loading finished, making routing decisions...');

    // Si es una ruta pública, manejar la navegación
    if (publicRoutes.includes(currentPath)) {
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

    // Si no está autenticado y no está en ruta pública, redirigir a index
    if (!isAuthenticated) {
      console.log('❌ User not authenticated, redirecting to index');
      navigate({ to: '/' });
      return;
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
      
      console.log('🔍 User with profile on CompletarRegistro:', {
        currentPath,
        fromProfile,
        searchParams: Object.fromEntries(searchParams.entries())
      });
      
      // Solo redirigir a home si NO viene desde el perfil
      if (!fromProfile) {
        console.log('✅ User has profile and not updating, redirecting to home');
        navigate({ to: '/home' });
        return;
      } else {
        console.log('📝 User updating profile from /Perfil, allowing access to CompletarRegistro');
        // Permitir el acceso para actualizar perfil
        return;
      }
    }

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
        </div>
      </Center>
    );
  }

  return <>{children}</>;
}
