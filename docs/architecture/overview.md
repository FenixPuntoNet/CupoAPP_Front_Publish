# Arquitectura del Frontend - CupoApp

## Visión General

CupoApp es una aplicación móvil/web desarrollada con React que permite compartir viajes entre usuarios. La aplicación funciona como una plataforma de ridesharing donde los conductores pueden publicar viajes y los pasajeros pueden reservar cupos.

## Stack Tecnológico

### Core Technologies
- **React 18.2.0** - Framework principal
- **TypeScript 5.7.3** - Tipado estático
- **Vite 5.4.14** - Bundler y dev server
- **Capacitor 6.2.0** - Desarrollo móvil nativo

### UI Framework & Styling
- **Mantine 7.16.1** - Librería de componentes UI principal
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **CSS Modules** - Estilos encapsulados por componente
- **Framer Motion 11.18.2** - Animaciones

### Routing & State Management
- **TanStack Router 1.97.14** - File-based routing con type safety
- **React Context** - Manejo de estado global (autenticación)
- **Local Storage** - Persistencia de datos locales

### Backend Integration
- **Telefunc 0.1.83** - RPC framework para comunicación backend
- **Custom API Client** - Cliente HTTP personalizado con autenticación
- **Backend URL**: https://cupo-backend.fly.dev

### Maps & Location
- **Google Maps API** - Mapas y geocodificación
- **React Google Maps API 2.20.5** - Integración React para mapas

### Development Tools
- **BiomeJS 1.9.4** - Linter y formatter
- **ESLint** - Linting adicional
- **PostCSS** - Procesamiento CSS

## Arquitectura de Carpetas

```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes base de UI
│   ├── Actividades/    # Componentes para gestión de viajes
│   ├── Cupos/          # Componentes para cupos/reservas
│   └── ...
├── routes/             # Páginas de la aplicación (file-based routing)
│   ├── __root.tsx      # Layout raíz
│   ├── Login/          # Autenticación
│   ├── Registro/       # Registro de usuarios
│   ├── Perfil/         # Perfil de usuario
│   └── ...
├── services/           # Lógica de negocio y API calls
│   ├── auth.ts         # Servicios de autenticación
│   ├── reservas.ts     # Gestión de reservas
│   ├── cupos.ts        # Gestión de cupos
│   └── ...
├── context/            # Contextos React para estado global
├── hooks/              # Custom hooks
├── types/              # Definiciones TypeScript
├── utils/              # Utilidades generales
├── styles/             # Estilos globales
└── config/             # Configuración de la app
```

## Flujo de Datos

### 1. Autenticación
- El usuario se autentica usando email/password
- El token JWT se almacena en localStorage
- El contexto `BackendAuthContext` mantiene el estado de autenticación
- Todas las requests API incluyen el token en headers

### 2. Navegación
- TanStack Router maneja la navegación file-based
- AuthGuard protege rutas que requieren autenticación
- Redirecciones automáticas según estado del usuario

### 3. Comunicación Backend
- API Client centralizado en `config/api.ts`
- Servicios específicos por dominio (auth, reservas, cupos)
- Manejo de errores centralizado
- Logging detallado para debugging

### 4. Estado de UI
- Mantine Provider para tema y componentes
- Estado local con useState/useReducer
- Contextos para estado compartido
- Persistencia en localStorage cuando es necesario

## Principios de Diseño

### 1. Mobile First
- Diseño responsive con breakpoints móviles
- Componentes optimizados para touch
- Navegación bottom-tab estilo móvil

### 2. Type Safety
- TypeScript en todo el codebase
- Interfaces bien definidas para API responses
- Props tipadas en componentes

### 3. Modularidad
- Componentes pequeños y reutilizables
- Separación clara de responsabilidades
- Servicios independientes por dominio

### 4. Performance
- Code splitting por rutas
- Lazy loading de componentes pesados
- Optimización de re-renders con React.memo

### 5. Developer Experience
- Hot reload con Vite
- Debugging tools integrados
- Logging estructurado
- Error boundaries para manejo de errores

## Características Principales

### Para Pasajeros
- Búsqueda de viajes por origen/destino/fecha
- Reserva de cupos con selección de SafePoints
- Chat en tiempo real con conductores
- Sistema de tickets QR
- Historial de viajes

### Para Conductores
- Publicación de viajes con rutas personalizadas
- Gestión de reservas y pasajeros
- Validación QR de tickets
- Dashboard de actividades
- Sistema de SafePoints para pickup/dropoff

### Funcionalidades Compartidas
- Perfil de usuario completo
- Sistema de notificaciones
- Soporte técnico integrado
- Wallet y sistema de puntos
- Geolocalización y mapas

## Integración Nativa

### Capacitor Plugins
- **Camera**: Captura de documentos y fotos de perfil
- **Filesystem**: Almacenamiento local de archivos
- **Barcode Scanner**: Lectura de códigos QR
- **File Opener**: Apertura de documentos

### Platform Specific
- **Android**: Configuración en `android/`
- **iOS**: Configuración en `ios/`
- **Web**: Fallbacks para funcionalidades nativas

## Ambiente de Desarrollo

### Scripts Disponibles
```bash
npm run dev          # Desarrollo web
npm run dev:android  # Desarrollo Android con live reload
npm run build        # Build de producción
npm run lint         # Linting
npm run preview      # Preview del build
```

### Configuración de Entorno
- Variables de entorno en `.env`
- Configuración de API en `src/config/api.ts`
- Tema y estilos en `src/routes/__root.tsx`

## Consideraciones de Seguridad

### Autenticación
- JWT tokens con expiración
- Refresh automático de tokens
- Logout automático en caso de tokens inválidos

### API Security
- CORS configurado correctamente
- Headers de seguridad en requests
- Validación de datos en frontend y backend

### Data Privacy
- Datos sensibles no almacenados en localStorage
- Logs sin información personal
- Encriptación de datos en tránsito
