# Sistema de Componentes

## Visión General

Los componentes en CupoApp están organizados en una arquitectura modular que promueve la reutilización y el mantenimiento. Utilizamos una combinación de Mantine UI, componentes personalizados y CSS Modules para crear una experiencia de usuario consistente.

## Estructura de Componentes

### Componentes Base (`src/components/`)

#### Autenticación y Seguridad

##### `AuthGuard.tsx`
Componente de alto orden que protege rutas basado en el estado de autenticación.

**Props:**
```typescript
interface AuthGuardProps {
  children: React.ReactNode;
}
```

**Funcionalidades:**
- Verifica estado de autenticación
- Redirecciona según el estado del usuario
- Maneja onboarding de nuevos usuarios
- Detecta sesiones expiradas

**Lógica de redirección:**
- No autenticado → `/Login`
- Autenticado sin perfil → `/CompletarRegistro`
- Nuevo usuario → Onboarding con `from=onboarding`

##### `BackendAuthContext.tsx`
Contexto React que mantiene el estado de autenticación global.

**Estado:**
```typescript
interface BackendAuthContextType {
  user: BackendUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasProfile: boolean;
  isNewUser: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  refreshUser: (forceRefresh?: boolean) => Promise<void>;
  markUserAsExperienced: () => void;
}
```

#### Modales y Diálogos

##### `TermsModal.tsx`
Modal para mostrar términos y condiciones con navegación por secciones.

**Características:**
- Navegación por páginas
- Progreso visual
- Botones de aceptar/rechazar
- Scrolling suave entre secciones

##### `ErrorNotification.tsx`
Sistema de notificaciones para errores y mensajes del sistema.

**Props:**
```typescript
interface ErrorNotificationProps {
  type: 'error' | 'success' | 'warning' | 'info';
  title: string;
  message: string;
  autoClose?: number;
}
```

##### `ReservationSuccessModal.tsx`
Modal de confirmación para reservas exitosas.

**Características:**
- Resumen de la reserva
- Información del viaje
- Botones de acción (ver ticket, continuar)
- Animaciones de éxito

#### Componentes de Negocio

##### `InteractiveMap.tsx`
Componente de mapa interactivo con Google Maps.

**Props:**
```typescript
interface InteractiveMapProps {
  center?: { lat: number; lng: number };
  markers?: MapMarker[];
  onMapClick?: (lat: number, lng: number) => void;
  height?: string;
  showTraffic?: boolean;
}
```

**Características:**
- Integración completa con Google Maps
- Marcadores personalizables
- Selección de ubicaciones
- Información de tráfico
- Responsive design

##### `PlaceSearch.tsx`
Componente de búsqueda de lugares con autocompletado.

**Características:**
- Autocompletado de Google Places
- Filtros por tipo de lugar
- Selección de ubicación en mapa
- Historial de búsquedas recientes

### Componentes de UI (`src/components/ui/`)

#### Home Components

##### `FeatureCarousel.tsx`
Carrusel de características principales de la app.

**Características:**
- Auto-play con pausa en hover
- Navegación con botones y dots
- Animaciones suaves
- Responsive design

##### `passenger.tsx`
Selector de número de pasajeros para búsquedas.

**Props:**
```typescript
interface PassengerSelectorProps {
  value: number;
  onChange: (passengers: number) => void;
  max?: number;
}
```

### Componentes de Actividades (`src/components/Actividades/`)

#### `index.tsx` - Dashboard de Actividades
Componente principal para la gestión de viajes del conductor.

**Características:**
- Lista de viajes publicados
- Filtros por estado y fecha
- Estadísticas en tiempo real
- Acciones rápidas (editar, cancelar, ver reservas)

#### `ChatList.tsx`
Lista de chats activos para comunicación con pasajeros.

**Características:**
- Lista de chats por viaje
- Indicadores de mensajes no leídos
- Preview del último mensaje
- Navegación directa al chat

#### Componentes de Estilo (`SrylesComponents/`)

##### `TripCard.tsx`
Tarjeta de viaje con información completa.

**Props:**
```typescript
interface TripCardProps {
  trip: TripData;
  onViewReservations: (tripId: number) => void;
  onCancelTrip: (tripId: number) => void;
  onChatWithPassengers: (tripId: number) => void;
}
```

**Características:**
- Información completa del viaje
- Estado visual del viaje
- Acciones contextuales
- Responsive design

##### `TripFilter.tsx`
Componente de filtros para la lista de viajes.

**Filtros disponibles:**
- Estado del viaje (activo, completado, cancelado)
- Rango de fechas
- Origen/destino
- Número de reservas

### Componentes de Cupos (`src/components/Cupos/`)

#### `CupoCard.tsx`
Tarjeta de cupo reservado para pasajeros.

**Características:**
- Información del viaje
- Estado de la reserva
- Información del conductor
- Acceso al ticket QR

#### `QRGenerator.tsx`
Generador de códigos QR para tickets.

**Props:**
```typescript
interface QRGeneratorProps {
  bookingId: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
}
```

### Componentes de SafePoints

#### `SafePointSelector.tsx`
Selector de puntos de recogida y entrega.

**Características:**
- Mapa interactivo con puntos disponibles
- Filtros por tipo (pickup/dropoff)
- Información de distancia
- Confirmación de selección

#### `BookingSafePointSelector.tsx`
Selector específico para reservas existentes.

**Características:**
- Puntos disponibles para la reserva
- Validación de selecciones
- Integración con el sistema de reservas

### Componentes de Moderación

#### `ModerationDashboard.tsx`
Dashboard para moderadores de contenido.

**Características:**
- Lista de reportes pendientes
- Acciones de moderación
- Estadísticas de moderación
- Filtros por tipo de reporte

#### `UserModerationModal.tsx`
Modal para moderar usuarios específicos.

**Acciones disponibles:**
- Suspensión temporal
- Suspensión permanente
- Advertencias
- Desbloqueo

### Componentes de Soporte

#### `BlockedUsersManager.tsx`
Gestión de usuarios bloqueados.

**Características:**
- Lista de usuarios bloqueados
- Razón del bloqueo
- Opciones de desbloqueo
- Historial de acciones

#### `ReportModal.tsx`
Modal para reportar usuarios o contenido.

**Tipos de reporte:**
- Comportamiento inapropiado
- Spam
- Contenido ofensivo
- Otros

## Patrones de Diseño

### 1. Composición de Componentes
```typescript
// Ejemplo de composición
<TripCard trip={trip}>
  <TripCard.Header />
  <TripCard.Content />
  <TripCard.Actions />
</TripCard>
```

### 2. Render Props
```typescript
// Ejemplo de render prop
<DataFetcher
  url="/api/trips"
  render={({ data, loading, error }) => (
    <TripList trips={data} loading={loading} error={error} />
  )}
/>
```

### 3. Higher-Order Components
```typescript
// Ejemplo de HOC
const withAuth = (WrappedComponent) => {
  return (props) => (
    <AuthGuard>
      <WrappedComponent {...props} />
    </AuthGuard>
  );
};
```

### 4. Custom Hooks
```typescript
// Ejemplo de custom hook
const useTripData = (tripId) => {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchTripData(tripId).then(setTrip).finally(() => setLoading(false));
  }, [tripId]);
  
  return { trip, loading };
};
```

## Gestión de Estado

### Props vs Context vs Local State

#### Props (Comunicación Padre-Hijo)
```typescript
// Comunicación simple hacia abajo
<TripCard trip={trip} onSelect={handleSelect} />
```

#### Context (Estado Global)
```typescript
// Para autenticación, tema, configuración
const { user, isAuthenticated } = useBackendAuth();
```

#### Local State (Estado del Componente)
```typescript
// Para estado interno del componente
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState({});
```

### Lifting State Up
Cuando múltiples componentes necesitan compartir estado:

```typescript
// Estado en el componente padre
const ParentComponent = () => {
  const [selectedTrip, setSelectedTrip] = useState(null);
  
  return (
    <>
      <TripList onTripSelect={setSelectedTrip} />
      <TripDetails trip={selectedTrip} />
    </>
  );
};
```

## Optimización de Performance

### React.memo
```typescript
const TripCard = React.memo(({ trip, onSelect }) => {
  // Solo re-renderiza si trip o onSelect cambian
  return <div>{/* contenido */}</div>;
});
```

### useCallback y useMemo
```typescript
const TripList = ({ trips, onTripSelect }) => {
  // Memorizar funciones que se pasan como props
  const handleTripSelect = useCallback((tripId) => {
    onTripSelect(trips.find(t => t.id === tripId));
  }, [trips, onTripSelect]);
  
  // Memorizar cálculos costosos
  const sortedTrips = useMemo(() => {
    return trips.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [trips]);
  
  return (
    <div>
      {sortedTrips.map(trip => (
        <TripCard key={trip.id} trip={trip} onSelect={handleTripSelect} />
      ))}
    </div>
  );
};
```

### Lazy Loading
```typescript
// Cargar componentes solo cuando se necesiten
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

const App = () => (
  <Suspense fallback={<Loading />}>
    <HeavyComponent />
  </Suspense>
);
```

## Error Boundaries

### Implementación
```typescript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error capturado:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    
    return this.props.children;
  }
}
```

### Uso
```typescript
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

## Testing

### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import TripCard from './TripCard';

test('renders trip information', () => {
  const trip = { id: 1, destination: 'Cali', origin: 'Bogotá' };
  render(<TripCard trip={trip} />);
  
  expect(screen.getByText('Cali')).toBeInTheDocument();
  expect(screen.getByText('Bogotá')).toBeInTheDocument();
});

test('calls onSelect when clicked', () => {
  const handleSelect = jest.fn();
  const trip = { id: 1, destination: 'Cali' };
  
  render(<TripCard trip={trip} onSelect={handleSelect} />);
  fireEvent.click(screen.getByRole('button'));
  
  expect(handleSelect).toHaveBeenCalledWith(trip);
});
```

## Accesibilidad

### ARIA Labels
```typescript
<button
  aria-label="Seleccionar viaje a Cali"
  aria-describedby="trip-description"
  onClick={handleSelect}
>
  Seleccionar
</button>
```

### Keyboard Navigation
```typescript
const handleKeyDown = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handleSelect();
  }
};
```

### Screen Readers
```typescript
<div role="region" aria-label="Lista de viajes disponibles">
  {trips.map(trip => (
    <TripCard key={trip.id} trip={trip} />
  ))}
</div>
```
