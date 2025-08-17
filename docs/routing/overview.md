# Sistema de Routing - TanStack Router

## Visión General

CupoApp utiliza TanStack Router para un sistema de routing file-based con type safety completo. Cada archivo en la carpeta `src/routes/` representa una ruta de la aplicación.

## Estructura de Rutas

### Rutas Principales

#### `/` - Landing Page
- **Archivo**: `src/routes/index.lazy.tsx`
- **Descripción**: Página de inicio para usuarios no autenticados
- **Acceso**: Público
- **Redirección**: Si está autenticado → `/home`

#### `/Login` - Autenticación
- **Archivo**: `src/routes/Login/index.tsx`
- **Descripción**: Formulario de inicio de sesión
- **Características**:
  - Validación de email/password
  - Manejo de errores de autenticación
  - Modal de recuperación de cuenta
  - Redirección automática post-login

#### `/Registro` - Registro de Usuario
- **Archivo**: `src/routes/Registro/index.tsx`
- **Descripción**: Formulario de registro de nuevos usuarios
- **Características**:
  - Validación de campos en tiempo real
  - Verificación de disponibilidad de email
  - Términos y condiciones
  - Auto-login post-registro

#### `/home` - Dashboard Principal
- **Archivo**: `src/routes/home/index.tsx`
- **Descripción**: Dashboard principal para usuarios autenticados
- **Características**:
  - Navegación rápida a funciones principales
  - Resumen de actividad del usuario
  - Acceso a viajes recientes

### Rutas de Reservas (Pasajeros)

#### `/reservar` - Búsqueda de Viajes
- **Archivo**: `src/routes/reservar/index.tsx`
- **Descripción**: Motor de búsqueda de viajes disponibles
- **Características**:
  - Búsqueda por origen, destino y fecha
  - Filtros avanzados
  - Resultados en tiempo real
  - Selector de número de pasajeros

#### `/Cupos` - Mis Reservas
- **Archivo**: `src/routes/Cupos/index.tsx`
- **Descripción**: Lista de cupos reservados por el usuario
- **Características**:
  - Historial de reservas
  - Estado de cada reserva
  - Acceso a tickets QR
  - Información del conductor

#### `/Reservas` - Gestión de Reservas
- **Archivo**: `src/routes/Reservas/index.tsx`
- **Descripción**: Gestión detallada de reservas activas
- **Subrutas**:
  - `/Reservas/TripReservationModal` - Modal de reserva
  - `/Reservas/Ticket/$bookingId` - Ticket específico

### Rutas de Conductor

#### `/publicarviaje` - Publicar Viaje
- **Archivo**: `src/routes/publicarviaje/index.tsx`
- **Descripción**: Formulario para publicar nuevos viajes
- **Características**:
  - Selector de origen/destino con mapas
  - Configuración de precio y asientos
  - Selección de SafePoints
  - Preview del viaje antes de publicar

#### `/CuposReservados` - Gestión de Reservas
- **Archivo**: `src/routes/CuposReservados/index.tsx`
- **Descripción**: Ver y gestionar reservas de mis viajes
- **Subrutas**:
  - `/CuposReservados/$tripId` - Reservas de viaje específico
  - `/CuposReservados/ValidarCupo/$bookingId` - Validar QR

#### `/Actividades` - Dashboard de Conductor
- **Archivo**: `src/routes/Actividades/index.tsx`
- **Descripción**: Dashboard para conductores
- **Características**:
  - Lista de viajes publicados
  - Estadísticas de reservas
  - Chat con pasajeros
  - Filtros por estado y fecha

### Rutas de Perfil

#### `/Perfil` - Perfil de Usuario
- **Archivo**: `src/routes/Perfil/index.tsx`
- **Descripción**: Gestión del perfil personal
- **Características**:
  - Información personal
  - Foto de perfil
  - Verificación de cuenta
  - Configuraciones de privacidad

#### `/CompletarRegistro` - Onboarding
- **Archivo**: `src/routes/CompletarRegistro/index.tsx`
- **Descripción**: Completar información de perfil
- **Características**:
  - Información personal obligatoria
  - Verificación de identidad
  - Configuración inicial

#### `/RegistrarVehiculo` - Registro Vehicular
- **Archivo**: `src/routes/RegistrarVehiculo/index.tsx`
- **Descripción**: Registro de vehículos y documentos
- **Subrutas**:
  - `/RegistrarVehiculo/Documentos` - Upload de documentos

### Rutas de Utilidades

#### `/Chat` - Sistema de Chat
- **Archivo**: `src/routes/Chat/index.tsx`
- **Descripción**: Chat entre usuarios
- **Subrutas**:
  - `/Chat/$chatId` - Chat específico

#### `/ayuda` - Soporte Técnico
- **Archivo**: `src/routes/ayuda/index.tsx`
- **Descripción**: Sistema de tickets de soporte
- **Características**:
  - Chat con soporte
  - Historial de tickets
  - FAQ integrado

#### `/Wallet` - Sistema de Puntos
- **Archivo**: `src/routes/Wallet/index.tsx`
- **Descripción**: Gestión de UniCoins y canjes
- **Características**:
  - Balance actual
  - Historial de transacciones
  - Items para canje

### Rutas de Configuración

#### `/account` - Configuraciones de Cuenta
- **Subrutas**:
  - `/account/deactivate` - Desactivar cuenta
  - `/account/delete` - Eliminar cuenta

#### `/change` - Cambio de Contraseña
- **Archivo**: `src/routes/change/index.tsx`

## Configuración del Router

### Root Layout (`__root.tsx`)
```typescript
export const Route = createRootRoute({
  component: RootComponent
});
```

**Características del Root:**
- `BackendAuthProvider` - Contexto de autenticación
- `MantineProvider` - Tema y componentes UI
- `GoogleMapsProvider` - Integración con Google Maps
- `AuthGuard` - Protección de rutas
- Navigation bar condicional
- Manejo de safe areas para móviles

### Protección de Rutas

#### AuthGuard
Componente que protege rutas basado en estado de autenticación:

```typescript
const publicRoutes = [
  '/', '/Login', '/Registro', '/RecuperarPasword'
];

const authOnlyRoutes = [
  '/home', '/reservar', '/publicarviaje', '/Perfil'
];
```

**Lógica de protección:**
1. **Rutas públicas**: Accesibles sin autenticación
2. **Rutas protegidas**: Requieren autenticación válida
3. **Redirecciones automáticas**:
   - No autenticado → `/Login`
   - Autenticado sin perfil → `/CompletarRegistro`
   - Nuevo usuario → Onboarding

### Navegación

#### Bottom Navigation
Disponible en rutas principales:
- **Buscar** (`/reservar`) - Búsqueda de viajes
- **Publicar** (`/publicarviaje`) - Crear viaje
- **Logo** (`/home`) - Dashboard principal
- **Actividades** (`/Actividades`) - Gestión de viajes
- **Menú** (`/perfil`) - Perfil de usuario

#### Rutas sin navegación
```typescript
const noNavBarRoutes = [
  "/", "/Login", "/Registro", "/RecuperarPasword",
  "/Origen", "/Destino", "/publicarviaje",
  "/RegistrarVehiculo", "/DetallesViaje",
  "/CompletarRegistro"
];
```

### Lazy Loading

#### Implementación
```typescript
// index.lazy.tsx
import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/')({
  component: HomeComponent
});
```

**Beneficios:**
- Reducción del bundle inicial
- Mejor performance de carga
- Code splitting automático

### Route Parameters

#### Parámetros Dinámicos
- `$tripId` - ID de viaje en rutas como `/CuposReservados/$tripId`
- `$bookingId` - ID de reserva en `/Reservas/Ticket/$bookingId`
- `$chatId` - ID de chat en `/Chat/$chatId`

#### Search Parameters
```typescript
// Ejemplo de uso
navigate({
  to: '/CompletarRegistro',
  search: { from: 'onboarding' }
});
```

### Type Safety

#### Router Types
```typescript
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
```

**Beneficios:**
- Autocompletado de rutas
- Validación de parámetros en compilación
- IntelliSense completo para navegación

### Redirecciones Automáticas

#### Por Estado de Usuario
1. **Usuario nuevo**: `/` → `/CompletarRegistro?from=onboarding`
2. **Sin perfil completo**: Cualquier ruta → `/CompletarRegistro`
3. **En onboarding**: Completar registro → `/home`
4. **Sesión expirada**: Cualquier ruta → `/Login`

#### Por Tipo de Usuario
- **Passenger**: Acceso completo a rutas de reserva
- **Driver**: Acceso adicional a rutas de gestión de viajes
- **Nuevo usuario**: Guía de onboarding

### Performance

#### Optimizaciones
- **Lazy loading** para todas las rutas no críticas
- **Preloading** de rutas probables
- **Code splitting** automático por ruta
- **Tree shaking** de código no utilizado

#### Caching
- Router mantiene estado de rutas visitadas
- Cache de componentes lazy loaded
- Invalidación automática en cambios de autenticación

### Debugging

#### Development Tools
- TanStack Router Devtools habilitadas en desarrollo
- Logging de navegación en consola
- Visualización del árbol de rutas

#### Route Logging
```typescript
console.log('🔍 Navigation to:', currentPath);
console.log('🔍 User state:', { isAuthenticated, hasProfile });
```
