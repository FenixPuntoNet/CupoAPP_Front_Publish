# Servicios - API y Lógica de Negocio

## Visión General

Los servicios en CupoApp manejan toda la comunicación con el backend y la lógica de negocio. Están organizados por dominio funcional y proporcionan una interfaz limpia para que los componentes interactúen con el backend.

## Estructura de Servicios

### Configuración Base

#### `config/api.ts`
Cliente HTTP centralizado para todas las comunicaciones backend.

**Características:**
- Gestión automática de tokens JWT
- Logging detallado para debugging
- Manejo de errores HTTP
- Configuración de headers automática
- Detección automática de endpoints públicos vs privados

**Funciones principales:**
- `apiRequest(endpoint, options)` - Cliente HTTP principal
- `getAuthToken()` - Obtener token de localStorage
- `setAuthToken(token)` - Guardar token
- `removeAuthToken()` - Limpiar token

### Servicios por Dominio

#### 1. `services/auth.ts` - Autenticación
Maneja todo el flujo de autenticación de usuarios.

**Interfaces:**
```typescript
interface LoginRequest {
  email: string;
  password: string;
}

interface SignupRequest {
  email: string;
  password: string;
  full_name: string;
  terms_accepted: boolean;
  email_subscribed: boolean;
}

interface AuthResponse {
  success: boolean;
  user?: BackendUser;
  token?: string;
  error?: string;
  message?: string;
}
```

**Funciones principales:**
- `loginUser(credentials)` - Login con email/password
- `registerUser(userData)` - Registro con auto-login
- `logoutUser()` - Cerrar sesión
- `getCurrentUser()` - Obtener usuario actual
- `forgotPassword(email)` - Recuperación de contraseña
- `changePassword(current, new)` - Cambio de contraseña
- `recoverAccount(email, password)` - Recuperar cuenta desactivada

**Características especiales:**
- Auto-login después del registro
- Validación de fortaleza de contraseña
- Manejo de cuentas suspendidas/desactivadas

#### 2. `services/reservas.ts` - Sistema de Reservas
Gestiona búsqueda de viajes y creación de reservas.

**Interfaces principales:**
```typescript
interface TripForBooking {
  id: number;
  date_time: string;
  price_per_seat: number;
  seats: number;
  origin: LocationData;
  destination: LocationData;
  driver: DriverInfo;
  vehicle: VehicleInfo;
}

interface BookingPassenger {
  fullName: string;
  identificationNumber: string;
  phone?: string;
  email?: string;
}
```

**Funciones principales:**
- `searchTrips(origin?, destination?, date?, passengers?)` - Búsqueda inteligente
- `getTripDetails(tripId)` - Detalles de viaje específico
- `bookTrip(tripId, passengers, seats)` - Crear reserva
- `getMyBookings()` - Mis reservas como pasajero
- `cancelBooking(bookingId)` - Cancelar reserva
- `validateQR(qrCode)` - Validar ticket QR

**Búsqueda Inteligente:**
El sistema implementa búsqueda por prioridad:
1. **Exacta**: Origen + destino + fecha coinciden
2. **Cercana**: Origen O destino coinciden
3. **Por fecha**: Solo fecha coincide
4. **General**: Todos los viajes disponibles

#### 3. `services/cupos.ts` - Gestión de Cupos
Para conductores que gestionan sus viajes y reservas.

**Funciones principales:**
- `getCuposReservados(tripId)` - Ver reservas de un viaje
- `getMisCupos()` - Mis cupos como pasajero
- `validatePassengerQR(qrCode)` - Validar QR de pasajero
- `getBookingStats()` - Estadísticas de reservas

**Datos devueltos:**
- Lista de bookings con pasajeros
- Información del conductor y vehículo
- Estado de validación de cada pasajero
- Resumen estadístico (total, validados, pendientes)

#### 4. `services/viajes.ts` - Publicación de Viajes
Maneja la creación y gestión de viajes por conductores.

**Funciones principales:**
- `createTrip(tripData)` - Publicar nuevo viaje
- `getMyTrips()` - Mis viajes como conductor
- `updateTrip(tripId, updates)` - Actualizar viaje
- `cancelTrip(tripId)` - Cancelar viaje
- `getTripDetails(tripId)` - Detalles completos del viaje

#### 5. `services/vehicles.ts` - Registro de Vehículos
Gestión completa del registro vehicular y documentos.

**Características:**
- Registro paso a paso de vehículos
- Upload de documentos (SOAT, licencia, tarjeta de propiedad)
- Validación de documentos por backend
- Promoción automática de PASSENGER a DRIVER

**Funciones principales:**
- `registerCompleteVehicleWithPromotion(data)` - Registro optimizado
- `uploadDocument(type, file)` - Subir documentos
- `getVehicleStatus()` - Estado del registro
- `updateVehicleInfo(updates)` - Actualizar información

#### 6. `services/safepoints.ts` - Puntos Seguros
Sistema de puntos de recogida y entrega.

**Funciones principales:**
- `getTripSafePoints(tripId)` - SafePoints de un viaje
- `getBookingSafePoints(bookingId)` - SafePoints de una reserva
- `selectSafePoints(bookingId, pickup, dropoff)` - Seleccionar puntos
- `getNearbyBookingSafePoints(bookingId, params)` - Puntos cercanos

#### 7. `services/chat.ts` - Sistema de Chat
Chat en tiempo real entre usuarios.

**Funciones principales:**
- `getChatList()` - Lista de chats del usuario
- `getChatMessages(chatId)` - Mensajes de un chat
- `sendMessage(chatId, message)` - Enviar mensaje
- `createTripChat(tripId)` - Crear chat para viaje

#### 8. `services/tickets.ts` - Sistema de Tickets
Generación y validación de tickets QR.

**Funciones principales:**
- `getTicketDetails(bookingId)` - Detalles del ticket
- `generateQR(bookingId)` - Generar código QR
- `validateTicket(qrCode)` - Validar ticket

#### 9. `services/config.ts` - Configuración
Gestión de precios y configuraciones del sistema.

**Funciones principales:**
- `getAssumptions()` - Obtener configuración de precios
- `calculateTripPriceViaBackend(distance)` - Calcular precio sugerido
- `getSuggestedPrice(distance)` - Precio sugerido por distancia

#### 10. `services/change.ts` - Sistema de Puntos
Wallet y sistema de canje de puntos.

**Funciones principales:**
- `getBalance()` - Balance de UniCoins
- `getRedeemItems()` - Items para canje
- `redeemRequest(items)` - Solicitar canje
- `getRedeemHistory()` - Historial de canjes

#### 11. `services/ayuda.ts` - Soporte Técnico
Sistema de tickets de soporte.

**Funciones principales:**
- `getOrCreateAssistant()` - Crear/obtener asistente
- `getMessages(assistantId)` - Mensajes del soporte
- `sendMessage(assistantId, message)` - Enviar mensaje al soporte

## Patrones de Implementación

### 1. Manejo de Errores
```typescript
try {
  const response = await apiRequest('/endpoint');
  return { success: true, data: response };
} catch (error) {
  console.error('Error description:', error);
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Default message'
  };
}
```

### 2. Logging Estructurado
```typescript
console.log('🔍 [ServiceName] Action description:', data);
console.log('✅ [ServiceName] Success:', result);
console.error('❌ [ServiceName] Error:', error);
```

### 3. Interfaces Consistentes
Todos los servicios devuelven el patrón:
```typescript
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### 4. Validación de Datos
- Validación de parámetros antes de enviar al backend
- Transformación de datos entre formatos frontend/backend
- Fallbacks para datos faltantes

## Integración Backend

### Endpoints Base
- **Desarrollo**: https://cupo-backend.fly.dev
- **Producción**: Configurado vía variables de entorno

### Autenticación
- Bearer tokens en header `Authorization`
- Refresh automático de tokens expirados
- Logout automático en errores 401

### Rate Limiting
- Timeouts configurados (10 segundos)
- Retry logic para errores temporales
- Circuit breaker para servicios no disponibles

### Debugging
- Logs detallados para todas las requests
- Endpoints de debug para desarrollo
- Modo debug activable por configuración

## Consideraciones de Performance

### 1. Caching
- Cache de respuestas en memoria cuando apropiado
- Invalidación de cache en actualizaciones
- TTL configurables por tipo de dato

### 2. Optimización de Requests
- Batch requests cuando es posible
- Paginación para listas grandes
- Lazy loading de datos no críticos

### 3. Error Recovery
- Retry automático para errores de red
- Fallbacks para servicios no disponibles
- Degradación gradual de funcionalidades

### 4. Offline Support
- Detección de conectividad
- Queue de acciones offline
- Sync automático cuando se recupera conexión
