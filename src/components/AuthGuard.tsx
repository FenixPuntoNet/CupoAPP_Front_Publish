import { useEffect } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { Center, Loader, Text } from '@mantine/core';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';

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
  const { loading, isAuthenticated, hasProfile } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {
    // No hacer nada mientras está cargando
    if (loading) return;

    console.log('AuthGuard - Current path:', currentPath);
    console.log('AuthGuard - Is authenticated:', isAuthenticated);
    console.log('AuthGuard - Has profile:', hasProfile);

    // Si es una ruta pública, manejar la navegación
    if (publicRoutes.includes(currentPath)) {
      // Si está autenticado y tiene perfil, y está en index o login, redirigir a home
      if (isAuthenticated && hasProfile && (currentPath === '/Login' || currentPath === '/')) {
        console.log('User is authenticated with profile, redirecting to home');
        navigate({ to: '/home' });
        return;
      }
      
      // Si está autenticado pero no tiene perfil, y está en index o login, redirigir a completar registro
      if (isAuthenticated && !hasProfile && (currentPath === '/Login' || currentPath === '/')) {
        console.log('User is authenticated but no profile, redirecting to complete registration');
        navigate({ to: '/CompletarRegistro' });
        return;
      }
      
      // Para todas las demás rutas públicas (incluyendo /Registro), permitir acceso
      return;
    }

    // Si no está autenticado y no está en ruta pública, redirigir a index
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to index');
      navigate({ to: '/' });
      return;
    }

    // Si está autenticado pero no tiene perfil completo
    if (isAuthenticated && !hasProfile && !authOnlyRoutes.includes(currentPath)) {
      console.log('User authenticated but no profile, redirecting to complete registration');
      navigate({ to: '/CompletarRegistro' });
      return;
    }

    // Si está en completar registro pero ya tiene perfil, redirigir a home
    if (isAuthenticated && hasProfile && currentPath === '/CompletarRegistro') {
      console.log('User has profile, redirecting to home');
      navigate({ to: '/home' });
      return;
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
