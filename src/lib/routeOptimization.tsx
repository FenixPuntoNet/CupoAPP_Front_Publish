import { Suspense, lazy } from 'react';
import { SmartLoader } from '../components/ui/SmartLoader';

// 🚀 Función para crear lazy loading optimizado
function createLazyRoute(importFn: () => Promise<any>, fallbackText?: string) {
  const LazyComponent = lazy(importFn);
  
  return function LazyRoute(props: any) {
    return (
      <Suspense 
        fallback={
          <SmartLoader 
            text={fallbackText || 'Cargando...'} 
            size="lg" 
            variant="dots"
          />
        }
      >
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// 🚀 Rutas optimizadas con lazy loading
export const LazyRoutes = {
  // Home y principales (carga inmediata)
  Home: createLazyRoute(() => import('../routes/home'), 'Cargando inicio...'),
  Login: createLazyRoute(() => import('../routes/Login'), 'Iniciando sesión...'),
  
  // Actividades (alta prioridad)
  Actividades: createLazyRoute(() => import('../routes/Actividades'), 'Cargando actividades...'),
  PublicarViaje: createLazyRoute(() => import('../routes/publicarviaje'), 'Preparando publicación...'),
  
  // Reservas y cupos (alta prioridad)
  Reservar: createLazyRoute(() => import('../routes/reservar'), 'Buscando viajes...'),
  Cupos: createLazyRoute(() => import('../routes/Cupos'), 'Cargando cupos...'),
  CuposReservados: createLazyRoute(() => import('../routes/CuposReservados'), 'Cargando reservas...'),
  
  // Gestión de viajes (media prioridad)
  DetallesViaje: createLazyRoute(() => import('../routes/DetallesViaje'), 'Cargando detalles...'),
  Paradas: createLazyRoute(() => import('../routes/Paradas'), 'Cargando paradas...'),
  SafePoints: createLazyRoute(() => import('../routes/SafePoints'), 'Cargando puntos seguros...'),
  
  // Perfil y configuración (baja prioridad)
  Perfil: createLazyRoute(() => import('../routes/Perfil'), 'Cargando perfil...'),
  Wallet: createLazyRoute(() => import('../routes/Wallet'), 'Cargando billetera...'),
  Account: createLazyRoute(() => import('../routes/account'), 'Cargando cuenta...'),
  
  // Utilidades (muy baja prioridad)
  Ayuda: createLazyRoute(() => import('../routes/ayuda'), 'Cargando ayuda...'),
  Chat: createLazyRoute(() => import('../routes/Chat'), 'Conectando chat...'),
  Cupones: createLazyRoute(() => import('../routes/Cupones'), 'Cargando cupones...'),
  
  // Formularios (lazy loading agresivo)
  Registro: createLazyRoute(() => import('../routes/Registro'), 'Preparando registro...'),
  RegistrarVehiculo: createLazyRoute(() => import('../routes/RegistrarVehiculo'), 'Preparando formulario...'),
  CompletarRegistro: createLazyRoute(() => import('../routes/CompletarRegistro'), 'Completando registro...'),
  
  // Selección de ubicaciones (lazy loading agresivo)
  Origen: createLazyRoute(() => import('../routes/Origen'), 'Cargando mapa...'),
  Destino: createLazyRoute(() => import('../routes/Destino'), 'Cargando mapa...'),
  DateSelected: createLazyRoute(() => import('../routes/DateSelected'), 'Configurando fecha...'),
  
  // Recuperación de contraseña (lazy loading)
  RecuperarPassword: createLazyRoute(() => import('../routes/RecuperarPasword'), 'Cargando recuperación...'),
  
  // Cambio de moneda (lazy loading)
  Change: createLazyRoute(() => import('../routes/change'), 'Cargando exchange...'),
  
  // Reservas específicas (lazy loading)
  Reservas: createLazyRoute(() => import('../routes/Reservas'), 'Cargando reservas...')
};

// 🚀 Hook para precargar rutas críticas
export function useRoutePreloader() {
  const preloadCriticalRoutes = () => {
    // Precargar rutas que el usuario probablemente use
    setTimeout(() => {
      import('../routes/Actividades');
      import('../routes/reservar');
      import('../routes/Cupos');
    }, 2000); // Precargar después de 2 segundos
  };

  const preloadRoute = (routeName: keyof typeof LazyRoutes) => {
    // Precargar una ruta específica
    switch (routeName) {
      case 'PublicarViaje':
        import('../routes/publicarviaje');
        break;
      case 'Perfil':
        import('../routes/Perfil');
        break;
      // Agregar más casos según necesidad
    }
  };

  return {
    preloadCriticalRoutes,
    preloadRoute
  };
}

// 🚀 Configuración de prioridades de rutas para el router
export const routePriorities = {
  high: ['Home', 'Login', 'Actividades', 'Reservar', 'Cupos'],
  medium: ['PublicarViaje', 'DetallesViaje', 'CuposReservados', 'Perfil'],
  low: ['Wallet', 'Account', 'Ayuda', 'Chat', 'Cupones'],
  lazy: ['Registro', 'RegistrarVehiculo', 'Origen', 'Destino', 'Change']
};
