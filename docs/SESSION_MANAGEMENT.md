# 🔐 Sistema de Gestión de Sesión Mejorado

## Problema Resuelto

El problema original era que los usuarios perdían su sesión automáticamente después de un tiempo de inactividad, pero cuando intentaban usar la aplicación obtenían errores de autenticación sin ser redirigidos al login. Esto causaba una experiencia de usuario confusa donde veían errores de token sin entender qué pasaba.

## Solución Implementada

### 1. **Sistema de Gestión de Sesión Inteligente** (`/src/config/api.ts`)

#### Funcionalidades Principales:
- **Seguimiento de Actividad**: Registra automáticamente la actividad del usuario en cada request
- **Refresh Automático de Tokens**: Intenta renovar el token cada 30 minutos de forma silenciosa
- **Detección de Sesión Expirada**: Verifica si la sesión está activa antes de hacer requests críticos
- **Manejo Inteligente de Errores 401**: Distingue entre errores temporales y sesiones realmente expiradas

#### Configuración:
```typescript
const TOKEN_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutos
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 horas de inactividad
const MIN_REFRESH_INTERVAL = 5 * 60 * 1000; // Mínimo 5 minutos entre refreshes
```

### 2. **Componente SessionKeepAlive** (`/src/components/SessionKeepAlive.tsx`)

#### Funcionalidades:
- **Detección de Actividad**: Escucha eventos del usuario (clicks, scroll, teclas, etc.)
- **Actualización Automática**: Actualiza el timestamp de actividad cuando el usuario interactúa
- **Detección de Visibilidad**: Actualiza la actividad cuando la página vuelve a estar visible
- **Debounce**: Evita actualizaciones excesivas (máximo cada segundo)

#### Eventos Monitoreados:
- `mousedown`, `mousemove`, `keydown`, `scroll`, `touchstart`, `click`, `focus`
- `visibilitychange` (cambios de pestaña/ventana)

### 3. **Contexto de Autenticación Mejorado** (`/src/context/BackendAuthContext.tsx`)

#### Mejoras Implementadas:
- **Listener de Eventos de Auth**: Escucha eventos personalizados de errores de autenticación
- **Gestión Automática de Sesión**: Inicializa y limpia la gestión de sesión según el estado del usuario
- **Verificación Periódica**: Verifica cada 5 minutos si la sesión sigue activa
- **Refresh Silencioso**: Intenta renovar el token de forma automática sin interrumpir al usuario

### 4. **AuthGuard Inteligente** (`/src/components/AuthGuard.tsx`)

#### Mejoras:
- **Detección de Sesión Expirada**: Verifica tanto el token como la actividad antes de redirigir
- **Manejo de Estados Temporales**: No redirige inmediatamente en estados transitorios
- **Validación Adicional**: Verifica tokens en rutas que requieren solo autenticación

### 5. **Sistema de Notificaciones** (`/src/hooks/useSessionNotifications.ts`)

#### Funcionalidades:
- **Notificaciones de Sesión**: Informa al usuario cuando su sesión expira
- **Estado de Conectividad**: Notifica sobre pérdida y recuperación de conexión
- **Experiencia de Usuario**: Mensajes claros y descriptivos

## Flujo de Funcionamiento

### 1. **Usuario Activo**
```
Usuario interactúa → SessionKeepAlive detecta → Actualiza actividad → Sesión se mantiene activa
```

### 2. **Refresh Automático**
```
Cada 30 min → Verifica si necesita refresh → Hace request a /auth/me → Actualiza timestamps
```

### 3. **Sesión Inactiva**
```
24h sin actividad → isSessionActive() = false → Limpia token → Redirige a login
```

### 4. **Error de Token**
```
Request falla 401 → Verifica si es endpoint crítico → Dispara evento auth-error → Notifica usuario → Redirige a login
```

## Beneficios

### ✅ **Para el Usuario**
- **Sesión Persistente**: La sesión se mantiene activa mientras usan la app
- **Solo Logout Manual**: La sesión solo se cierra cuando explícitamente hacen logout
- **Notificaciones Claras**: Saben exactamente qué está pasando
- **Experiencia Fluida**: No interrupciones inesperadas

### ✅ **Para la Seguridad**
- **Tokens Frescos**: Renovación automática de tokens
- **Inactividad Real**: Solo expira después de 24 horas de inactividad real
- **Limpieza Automática**: Recursos se limpian correctamente

### ✅ **Para el Desarrollo**
- **Logs Detallados**: Información clara de lo que está pasando
- **Manejo de Errores**: Gestión inteligente de diferentes tipos de errores
- **Configuración Flexible**: Intervalos y timeouts configurables

## Configuración de Intervalos

```typescript
// Configuración actual (recomendada)
TOKEN_REFRESH_INTERVAL: 30 minutos  // Cada cuánto renovar el token
SESSION_TIMEOUT: 24 horas           // Cuándo considerar sesión inactiva
MIN_REFRESH_INTERVAL: 5 minutos     // Verificación periódica mínima

// Se puede ajustar según necesidades:
// - Apps más sensibles: reducir intervalos
// - Apps menos críticas: aumentar intervalos
```

## Monitoreo y Debug

### Logs a Observar:
- `🔄 Token needs refresh, attempting refresh...`
- `✅ Token refreshed successfully`
- `🚨 Session expired - User was authenticated but now is not`
- `⏰ Session expired due to inactividad`
- `🚀 Session management initialized`

### Eventos Personalizados:
- `auth-error`: Disparado cuando hay errores de autenticación
- `online`/`offline`: Manejados para notificaciones de conectividad

## Compatibilidad

- ✅ Funciona en todas las plataformas (Web, iOS, Android)
- ✅ Compatible con navegadores modernos
- ✅ Maneja cambios de pestaña/ventana
- ✅ Funciona con deep links y navegación SPA

## Mantenimiento

### Tareas Regulares:
- Monitorear logs para patrones de expiración
- Ajustar intervalos según uso real
- Verificar rendimiento en diferentes dispositivos

### Posibles Optimizaciones Futuras:
- Implementar refresh token si el backend lo soporta
- Agregar métricas de uso de sesión
- Implementar sincronización entre pestañas
