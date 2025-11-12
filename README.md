# CupoApp Frontend - Documentación Completa

![CupoApp Logo](https://tddaveymppuhweujhzwz.supabase.co/storage/v1/object/public/resourcers/Home/Logo.png)

## 📋 Resumen Ejecutivo

CupoApp es una aplicación móvil/web de ridesharing desarrollada con React y TypeScript que permite a los usuarios compartir viajes de manera segura y eficiente. La aplicación cuenta con dos tipos principales de usuarios: **Pasajeros** que buscan y reservan cupos en viajes, y **Conductores** que publican y gestionan sus viajes.

## 🏗️ Arquitectura Técnica

### Stack Tecnológico Principal

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 18.2.0 | Framework frontend principal |
| **TypeScript** | 5.7.3 | Tipado estático y type safety |
| **Vite** | 5.4.14 | Build tool y dev server |
| **Capacitor** | 6.2.0 | Desarrollo móvil nativo |
| **Mantine** | 7.16.1 | Librería de componentes UI |
| **TanStack Router** | 1.97.14 | Routing con type safety |
| **Tailwind CSS** | 3.4.17 | Utility-first CSS |

### Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React/TS)                     │
├─────────────────────────────────────────────────────────────┤
│  UI Layer (Mantine + Tailwind + CSS Modules)               │
├─────────────────────────────────────────────────────────────┤
│  Routing Layer (TanStack Router + File-based)              │
├─────────────────────────────────────────────────────────────┤
│  Components Layer (Modular + Reusable)                     │
├─────────────────────────────────────────────────────────────┤
│  Business Logic (Services + Custom Hooks)                  │
├─────────────────────────────────────────────────────────────┤
│  State Management (Context + Local State)                  │
├─────────────────────────────────────────────────────────────┤
│  API Layer (Custom Client + Telefunc)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API (cupo-backend.fly.dev)            │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Funcionalidades Principales

### Para Pasajeros 🚶‍♂️
- **Búsqueda Inteligente**: Buscar viajes por origen, destino y fecha con múltiples criterios
- **Reserva de Cupos**: Sistema completo de reservas con selección de SafePoints
- **Tickets QR**: Generación y validación de tickets digitales
- **Chat Integrado**: Comunicación en tiempo real con conductores
- **Historial**: Gestión completa de viajes pasados y futuros

### Para Conductores 🚗
- **Publicación de Viajes**: Crear viajes con rutas, precios y disponibilidad
- **Gestión de Reservas**: Ver y administrar todas las reservas de sus viajes
- **Validación QR**: Escanear y validar tickets de pasajeros
- **Dashboard Completo**: Estadísticas y gestión centralizada
- **SafePoints**: Sistema de puntos de recogida y entrega personalizables

### Funcionalidades Compartidas 🔄
- **Perfil Completo**: Gestión de información personal y verificación
- **Sistema de Puntos**: Wallet con UniCoins y sistema de canjes
- **Soporte Técnico**: Chat de soporte integrado
- **Geolocalización**: Integración completa con Google Maps
- **Notificaciones**: Sistema de alertas y notificaciones push

## 📁 Estructura del Proyecto

```
src/
├── components/              # Componentes reutilizables
│   ├── ui/                 # Componentes base de UI
│   ├── Actividades/        # Gestión de viajes (conductores)
│   ├── Cupos/             # Gestión de reservas (pasajeros)
│   ├── SafePoints/        # Sistema de puntos seguros
│   └── ...
├── routes/                 # Páginas (file-based routing)
│   ├── __root.tsx         # Layout principal
│   ├── Login/             # Autenticación
│   ├── reservar/          # Búsqueda de viajes
│   ├── publicarviaje/     # Crear viajes
│   ├── Perfil/            # Gestión de perfil
│   └── ...
├── services/              # Lógica de negocio y API
│   ├── auth.ts           # Servicios de autenticación
│   ├── reservas.ts       # Sistema de reservas
│   ├── cupos.ts          # Gestión de cupos
│   ├── viajes.ts         # Publicación de viajes
│   └── ...
├── context/               # Estado global (React Context)
├── hooks/                 # Custom hooks reutilizables
├── types/                 # Definiciones TypeScript
├── utils/                 # Utilidades y helpers
├── styles/                # Estilos globales
└── config/                # Configuración de la app
```

## 🔐 Sistema de Autenticación

### Flujo de Autenticación
1. **Login/Registro** → JWT Token generado por backend
2. **Token Storage** → Almacenado en localStorage
3. **Auto-refresh** → Renovación automática de tokens
4. **AuthGuard** → Protección de rutas sensibles
5. **Session Management** → Manejo de sesiones expiradas

### Estados de Usuario
- **No autenticado** → Acceso solo a páginas públicas
- **Autenticado sin perfil** → Redirigido a completar registro
- **Usuario nuevo** → Proceso de onboarding guiado
- **Usuario completo** → Acceso total a la aplicación

## 🎨 Sistema de Diseño

### Paleta de Colores
- **Primary Brand**: `#00ff9d` (Verde CupoApp)
- **Secondary**: `#00cc7a` (Verde oscuro)
- **Background**: `#1a1a1a` (Oscuro principal)
- **Surface**: `#2d2d2d` (Tarjetas y modales)
- **Error**: `#ff4757` (Errores)
- **Success**: `#00ff9d` (Éxito)

### Tipografía
- **Font Family**: Inter, system fonts
- **Sizes**: Scale de 12px a 36px
- **Weights**: 300 (light) a 800 (extrabold)

### Responsive Design
- **Mobile First**: Diseño optimizado para móviles
- **Breakpoints**: 640px, 768px, 1024px, 1280px
- **Touch Targets**: Mínimo 44px para iOS

## 🛠️ Servicios y API

### Cliente API Centralizado
```typescript
// config/api.ts
export const apiRequest = async (endpoint: string, options: RequestInit = {})
```

**Características:**
- Gestión automática de tokens JWT
- Logging detallado para debugging
- Manejo de errores HTTP centralizado
- Detección automática de endpoints públicos/privados

### Servicios por Dominio

| Servicio | Propósito | Funciones Principales |
|----------|-----------|---------------------|
| `auth.ts` | Autenticación | login, register, logout, getCurrentUser |
| `reservas.ts` | Reservas | searchTrips, bookTrip, getMyBookings |
| `cupos.ts` | Gestión cupos | getCuposReservados, validateQR |
| `viajes.ts` | Publicación | createTrip, getMyTrips, cancelTrip |
| `safepoints.ts` | Puntos seguros | getTripSafePoints, selectSafePoints |
| `chat.ts` | Comunicación | getChatList, sendMessage |

## 🧩 Componentes Principales

### Componentes de Autenticación
- `AuthGuard` - Protección de rutas
- `BackendAuthContext` - Estado global de autenticación

### Componentes de UI
- `InteractiveMap` - Mapas de Google integrados
- `TripCard` - Tarjetas de viajes
- `QRGenerator` - Generación de códigos QR
- `SafePointSelector` - Selección de puntos seguros

### Componentes de Negocio
- `TripReservationModal` - Modal de reserva completo
- `ActivityDashboard` - Dashboard para conductores
- `ChatList` - Lista de conversaciones

## 🎣 Custom Hooks

### Hooks Principales
- `useErrorHandling` - Manejo centralizado de errores
- `useMaps` - Integración con Google Maps
- `useModerationStatus` - Estado de moderación de usuarios
- `useTripDraft` - Gestión de borradores de viajes
- `useAssumptions` - Configuración de precios

### Patrón de Hooks
```typescript
const useCustomHook = () => {
  const [state, setState] = useState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Lógica del hook
  
  return { state, loading, error, actions };
};
```

## 🗺️ Sistema de Routing

### File-based Routing con TanStack Router
- **Type Safety** completo en rutas
- **Lazy Loading** automático
- **Route Parameters** tipados
- **Search Parameters** validados

### Rutas Principales
- `/` - Landing page
- `/Login` - Autenticación
- `/home` - Dashboard principal
- `/reservar` - Búsqueda de viajes
- `/publicarviaje` - Crear viajes
- `/Actividades` - Dashboard conductor
- `/Perfil` - Gestión de perfil

### Protección de Rutas
```typescript
// AuthGuard con lógica de redirección
- No autenticado → /Login
- Sin perfil → /CompletarRegistro
- Usuario nuevo → Onboarding
```

## 🎨 Sistema de Estilos

### Enfoque Híbrido
1. **Mantine UI** - Componentes base con tema personalizado
2. **Tailwind CSS** - Utilidades para layout y spacing
3. **CSS Modules** - Estilos específicos por componente

### Estructura de Estilos
```css
/* Global styles */
@import './styles/modals.css';
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Component styles */
.component {
  /* CSS Modules styles */
}
```

## 🔧 Utilidades

### Funciones Helper Principales
- **Formato**: `formatCurrency`, `formatDate`, `formatRelativeTime`
- **Validación**: `isValidEmail`, `validatePasswordStrength`
- **Geolocalización**: `getCurrentLocation`, `calculateDistance`
- **Performance**: `debounce`, `throttle`, `measurePerformance`
- **Moderación**: `detectInappropriateContent`, `cleanText`

### Storage Tipado
```typescript
class TypedStorage {
  static get<K extends keyof StorageData>(key: K): StorageData[K] | null
  static set<K extends keyof StorageData>(key: K, value: StorageData[K]): void
}
```

## 📱 Desarrollo Móvil (Capacitor)

### Plugins Integrados
- **Camera** - Captura de documentos y fotos
- **Filesystem** - Almacenamiento local
- **Barcode Scanner** - Lectura de QR codes
- **File Opener** - Apertura de documentos

### Scripts de Desarrollo
```bash
npm run dev                 # Desarrollo web
npm run dev:android        # Android con live reload
npm run build              # Build producción
```

## 🧪 Testing y Quality

### Estrategia de Testing
- **Unit Tests** - Funciones y utilidades
- **Component Tests** - Testing Library React
- **Integration Tests** - Flujos completos
- **E2E Tests** - Cypress (recomendado)

### Code Quality
- **TypeScript** - Type safety completo
- **BiomeJS** - Linting y formatting
- **ESLint** - Rules adicionales
- **Husky** - Git hooks (recomendado)

## 🚀 Performance

### Optimizaciones Implementadas
- **Code Splitting** por rutas
- **Lazy Loading** de componentes
- **Tree Shaking** automático
- **Image Optimization** con lazy loading
- **Memoization** con React.memo, useMemo, useCallback

### Métricas Objetivo
- **FCP** < 1.5s (First Contentful Paint)
- **LCP** < 2.5s (Largest Contentful Paint)
- **FID** < 100ms (First Input Delay)
- **CLS** < 0.1 (Cumulative Layout Shift)

## 🛡️ Seguridad

### Medidas de Seguridad
- **JWT Tokens** con expiración automática
- **CORS** configurado correctamente
- **Input Validation** en frontend y backend
- **XSS Prevention** con sanitización
- **CSRF Protection** con tokens

### Privacy & Data Protection
- Datos sensibles no en localStorage
- Encriptación en tránsito (HTTPS)
- Logs sin información personal
- Cumplimiento GDPR parcial

## 📊 Monitoreo y Debugging

### Debugging Tools
- **React DevTools** - Componentes y estado
- **TanStack Router Devtools** - Navegación
- **Console Logging** estructurado por servicio
- **Error Boundaries** para captura de errores

### Logging Estructurado
```typescript
console.log('🔍 [ServiceName] Action:', data);
console.log('✅ [ServiceName] Success:', result);
console.error('❌ [ServiceName] Error:', error);
```

## 🔮 Próximas Mejoras

### Funcionalidades Planeadas
- [ ] **Push Notifications** nativas
- [ ] **Offline Mode** con sync automático
- [ ] **Real-time Updates** con WebSockets
- [ ] **Advanced Analytics** con dashboard
- [ ] **Multi-language Support** (i18n)

### Mejoras Técnicas
- [ ] **Service Workers** para caching
- [ ] **PWA** compliance completo
- [ ] **Automated Testing** pipeline
- [ ] **Performance Monitoring** automático
- [ ] **Error Tracking** con Sentry

## 📚 Documentación Adicional

### Documentos Específicos
- [📋 Arquitectura Detallada](./docs/architecture/overview.md)
- [🔧 Servicios y API](./docs/services/overview.md)
- [🧩 Sistema de Componentes](./docs/components/overview.md)
- [🗺️ Routing y Navegación](./docs/routing/overview.md)
- [🎨 Sistema de Estilos](./docs/styles/overview.md)
- [🎣 Custom Hooks](./docs/hooks/overview.md)
- [🔧 Utilidades](./docs/utils/overview.md)

### Quick Start para Desarrolladores

```bash
# 1. Clonar repositorio
git clone [repo-url]
cd CupoApp_Production

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# 4. Ejecutar en desarrollo
npm run dev

# 5. Para desarrollo móvil
npm run dev:android  # Requiere Android Studio
```

### Configuración Inicial
1. **Google Maps API** - Configurar en `.env`
2. **Backend URL** - Apuntar a instancia correcta
3. **Capacitor** - Configurar para plataformas nativas
4. **Mantine Theme** - Personalizar en `__root.tsx`

## 👥 Contribución

### Estándares de Código
- **TypeScript** obligatorio para nuevos archivos
- **Functional Components** con hooks
- **CSS Modules** para estilos específicos
- **Convención de nombres** camelCase

### Git Workflow
```bash
# 1. Feature branch
git checkout -b feature/nueva-funcionalidad

# 2. Commits descriptivos
git commit -m "feat: agregar sistema de notificaciones"

# 3. Pull request con review
# 4. Merge a main después de aprobación
```

## 📞 Soporte

### Contacto Técnico
- **Issues**: GitHub Issues para bugs y features
- **Documentación**: Este README y docs/ folder
- **API Documentation**: Backend repository

### Recursos Externos
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Mantine Documentation](https://mantine.dev/)
- [TanStack Router](https://tanstack.com/router)

---

**Desarrollado con ❤️ para CupoApp**

*Última actualización: Agosto 2025*
