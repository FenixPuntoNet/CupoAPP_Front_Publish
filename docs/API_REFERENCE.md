# API Reference - CupoApp Frontend

## 📡 Descripción General

Este documento describe todas las interacciones de API utilizadas en el frontend de CupoApp. La aplicación utiliza dos métodos principales de comunicación con el backend:

1. **REST API** - Para operaciones CRUD estándar
2. **Telefunc RPC** - Para llamadas de función remota tipadas

## 🔧 Configuración Base

### API Client Configuration

```typescript
// config/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cupo-backend.fly.dev';

export const apiRequest = async (endpoint: string, options: RequestOptions = {}) => {
  const token = getToken();
  
  const config: RequestInit = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
};
```

### Telefunc Configuration

```typescript
// Telefunc se configura automáticamente con:
const TELEFUNC_URL = import.meta.env.VITE_TELEFUNC_URL || 'https://cupo-backend.fly.dev/_telefunc';
```

## 🔐 Autenticación

### Login
```typescript
// POST /auth/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    telefono: string;
    tipoDocumento: string;
    numeroDocumento: string;
    fechaNacimiento: string;
    activo: boolean;
  };
}

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: credentials
  });
};
```

### Register
```typescript
// POST /auth/register
interface RegisterRequest {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  telefono: string;
  tipoDocumento: 'CC' | 'CE' | 'PP';
  numeroDocumento: string;
  fechaNacimiento: string; // YYYY-MM-DD
}

interface RegisterResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    nombre: string;
  };
}

export const register = async (userData: RegisterRequest): Promise<RegisterResponse> => {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: userData
  });
};
```

### Verify Token
```typescript
// GET /auth/verify
interface VerifyTokenResponse {
  valid: boolean;
  user?: User;
}

export const verifyToken = async (): Promise<VerifyTokenResponse> => {
  return apiRequest('/auth/verify');
};
```

### Password Reset
```typescript
// POST /auth/forgot-password
interface ForgotPasswordRequest {
  email: string;
}

export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: { email }
  });
};

// POST /auth/reset-password
interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export const resetPassword = async (data: ResetPasswordRequest): Promise<{ message: string }> => {
  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body: data
  });
};
```

## 👤 Gestión de Usuarios

### Get User Profile
```typescript
// GET /users/profile
interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono: string;
  tipoDocumento: string;
  numeroDocumento: string;
  fechaNacimiento: string;
  activo: boolean;
  fechaCreacion: string;
  ultimaActividad?: string;
}

export const getUserProfile = async (): Promise<UserProfile> => {
  return apiRequest('/users/profile');
};
```

### Update User Profile
```typescript
// PUT /users/profile
interface UpdateProfileRequest {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  fechaNacimiento?: string;
}

export const updateUserProfile = async (updates: UpdateProfileRequest): Promise<UserProfile> => {
  return apiRequest('/users/profile', {
    method: 'PUT',
    body: updates
  });
};
```

### Change Password
```typescript
// POST /users/change-password
interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const changePassword = async (passwords: ChangePasswordRequest): Promise<{ message: string }> => {
  return apiRequest('/users/change-password', {
    method: 'POST',
    body: passwords
  });
};
```

### Deactivate Account
```typescript
// POST /users/deactivate
export const deactivateAccount = async (): Promise<{ message: string }> => {
  return apiRequest('/users/deactivate', {
    method: 'POST'
  });
};
```

## 🚗 Gestión de Cupos

### Get Available Cupos
```typescript
// GET /cupos?origen=X&destino=Y&fecha=Z
interface CupoFilters {
  origen: string;
  destino: string;
  fecha: string; // YYYY-MM-DD
  limite?: number;
}

interface Cupo {
  id: string;
  origen: string;
  destino: string;
  fechaViaje: string;
  horaViaje: string;
  asientosDisponibles: number;
  asientosTotales: number;
  precio: number;
  conductor: {
    id: string;
    nombre: string;
    apellido: string;
    telefono: string;
  };
  vehiculo: {
    marca: string;
    modelo: string;
    placa: string;
    color: string;
  };
  estado: 'ACTIVO' | 'COMPLETO' | 'CANCELADO';
}

export const getCuposDisponibles = async (filters: CupoFilters): Promise<Cupo[]> => {
  const queryParams = new URLSearchParams(filters as any).toString();
  return apiRequest(`/cupos?${queryParams}`);
};
```

### Get Cupo Details
```typescript
// GET /cupos/:id
export const getCupoDetails = async (cupoId: string): Promise<Cupo> => {
  return apiRequest(`/cupos/${cupoId}`);
};
```

### Create Cupo (Conductor)
```typescript
// POST /cupos
interface CreateCupoRequest {
  origen: string;
  destino: string;
  fechaViaje: string; // YYYY-MM-DD
  horaViaje: string; // HH:MM
  asientosTotales: number;
  precio: number;
  vehiculoId: string;
  descripcion?: string;
}

export const createCupo = async (cupoData: CreateCupoRequest): Promise<Cupo> => {
  return apiRequest('/cupos', {
    method: 'POST',
    body: cupoData
  });
};
```

### Update Cupo
```typescript
// PUT /cupos/:id
interface UpdateCupoRequest {
  fechaViaje?: string;
  horaViaje?: string;
  asientosTotales?: number;
  precio?: number;
  descripcion?: string;
  estado?: 'ACTIVO' | 'CANCELADO';
}

export const updateCupo = async (cupoId: string, updates: UpdateCupoRequest): Promise<Cupo> => {
  return apiRequest(`/cupos/${cupoId}`, {
    method: 'PUT',
    body: updates
  });
};
```

### Cancel Cupo
```typescript
// DELETE /cupos/:id
export const cancelCupo = async (cupoId: string): Promise<{ message: string }> => {
  return apiRequest(`/cupos/${cupoId}`, {
    method: 'DELETE'
  });
};
```

## 📝 Gestión de Reservas

### Create Reservation
```typescript
// POST /reservas
interface CreateReservaRequest {
  cupoId: string;
  asientosSolicitados: number;
  comentarios?: string;
}

interface Reserva {
  id: string;
  cupoId: string;
  usuarioId: string;
  asientosSolicitados: number;
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA';
  fechaReserva: string;
  comentarios?: string;
  cupo: Cupo;
}

export const createReserva = async (reservaData: CreateReservaRequest): Promise<Reserva> => {
  return apiRequest('/reservas', {
    method: 'POST',
    body: reservaData
  });
};
```

### Get User Reservations
```typescript
// GET /reservas/mis-reservas
export const getMisReservas = async (): Promise<Reserva[]> => {
  return apiRequest('/reservas/mis-reservas');
};
```

### Get Cupo Reservations (Conductor)
```typescript
// GET /reservas/cupo/:cupoId
export const getReservasByCupo = async (cupoId: string): Promise<Reserva[]> => {
  return apiRequest(`/reservas/cupo/${cupoId}`);
};
```

### Update Reservation Status
```typescript
// PUT /reservas/:id/estado
interface UpdateReservaStatusRequest {
  estado: 'CONFIRMADA' | 'CANCELADA';
  comentarios?: string;
}

export const updateReservaStatus = async (
  reservaId: string, 
  statusData: UpdateReservaStatusRequest
): Promise<Reserva> => {
  return apiRequest(`/reservas/${reservaId}/estado`, {
    method: 'PUT',
    body: statusData
  });
};
```

### Cancel Reservation
```typescript
// DELETE /reservas/:id
export const cancelReserva = async (reservaId: string): Promise<{ message: string }> => {
  return apiRequest(`/reservas/${reservaId}`, {
    method: 'DELETE'
  });
};
```

## 🚙 Gestión de Vehículos

### Get User Vehicles
```typescript
// GET /vehiculos
interface Vehiculo {
  id: string;
  marca: string;
  modelo: string;
  año: number;
  placa: string;
  color: string;
  tipoVehiculo: 'SEDAN' | 'SUV' | 'HATCHBACK' | 'PICKUP' | 'VAN';
  asientosDisponibles: number;
  activo: boolean;
  usuarioId: string;
}

export const getVehiculos = async (): Promise<Vehiculo[]> => {
  return apiRequest('/vehiculos');
};
```

### Create Vehicle
```typescript
// POST /vehiculos
interface CreateVehiculoRequest {
  marca: string;
  modelo: string;
  año: number;
  placa: string;
  color: string;
  tipoVehiculo: 'SEDAN' | 'SUV' | 'HATCHBACK' | 'PICKUP' | 'VAN';
  asientosDisponibles: number;
}

export const createVehiculo = async (vehiculoData: CreateVehiculoRequest): Promise<Vehiculo> => {
  return apiRequest('/vehiculos', {
    method: 'POST',
    body: vehiculoData
  });
};
```

### Update Vehicle
```typescript
// PUT /vehiculos/:id
interface UpdateVehiculoRequest {
  marca?: string;
  modelo?: string;
  año?: number;
  color?: string;
  asientosDisponibles?: number;
  activo?: boolean;
}

export const updateVehiculo = async (
  vehiculoId: string, 
  updates: UpdateVehiculoRequest
): Promise<Vehiculo> => {
  return apiRequest(`/vehiculos/${vehiculoId}`, {
    method: 'PUT',
    body: updates
  });
};
```

### Delete Vehicle
```typescript
// DELETE /vehiculos/:id
export const deleteVehiculo = async (vehiculoId: string): Promise<{ message: string }> => {
  return apiRequest(`/vehiculos/${vehiculoId}`, {
    method: 'DELETE'
  });
};
```

## 🗺️ Servicios de Geolocalización

### Get Cities
```typescript
// GET /ubicaciones/ciudades
interface Ciudad {
  id: string;
  nombre: string;
  departamento: string;
  activo: boolean;
}

export const getCiudades = async (): Promise<Ciudad[]> => {
  return apiRequest('/ubicaciones/ciudades');
};
```

### Search Addresses
```typescript
// GET /ubicaciones/buscar?q=direccion
interface DireccionSugerencia {
  direccion: string;
  latitud: number;
  longitud: number;
  ciudad: string;
  departamento: string;
}

export const buscarDirecciones = async (query: string): Promise<DireccionSugerencia[]> => {
  return apiRequest(`/ubicaciones/buscar?q=${encodeURIComponent(query)}`);
};
```

### Geocoding
```typescript
// POST /ubicaciones/geocode
interface GeocodeRequest {
  direccion: string;
  ciudad?: string;
}

interface GeocodeResponse {
  latitud: number;
  longitud: number;
  direccionCompleta: string;
}

export const geocodeDireccion = async (data: GeocodeRequest): Promise<GeocodeResponse> => {
  return apiRequest('/ubicaciones/geocode', {
    method: 'POST',
    body: data
  });
};
```

### Reverse Geocoding
```typescript
// POST /ubicaciones/reverse-geocode
interface ReverseGeocodeRequest {
  latitud: number;
  longitud: number;
}

interface ReverseGeocodeResponse {
  direccion: string;
  ciudad: string;
  departamento: string;
  codigoPostal?: string;
}

export const reverseGeocode = async (
  coordinates: ReverseGeocodeRequest
): Promise<ReverseGeocodeResponse> => {
  return apiRequest('/ubicaciones/reverse-geocode', {
    method: 'POST',
    body: coordinates
  });
};
```

## 💬 Sistema de Mensajería

### Get Conversations
```typescript
// GET /mensajes/conversaciones
interface Conversacion {
  id: string;
  participantes: Array<{
    id: string;
    nombre: string;
    apellido: string;
  }>;
  ultimoMensaje: {
    id: string;
    contenido: string;
    fechaEnvio: string;
    remitente: string;
  };
  mensajesNoLeidos: number;
}

export const getConversaciones = async (): Promise<Conversacion[]> => {
  return apiRequest('/mensajes/conversaciones');
};
```

### Get Messages
```typescript
// GET /mensajes/conversacion/:conversacionId
interface Mensaje {
  id: string;
  conversacionId: string;
  remitenteId: string;
  contenido: string;
  fechaEnvio: string;
  leido: boolean;
  tipo: 'TEXTO' | 'IMAGEN' | 'UBICACION';
}

export const getMensajes = async (conversacionId: string): Promise<Mensaje[]> => {
  return apiRequest(`/mensajes/conversacion/${conversacionId}`);
};
```

### Send Message
```typescript
// POST /mensajes
interface SendMessageRequest {
  conversacionId?: string;
  destinatarioId?: string;
  contenido: string;
  tipo?: 'TEXTO' | 'IMAGEN' | 'UBICACION';
}

export const sendMessage = async (messageData: SendMessageRequest): Promise<Mensaje> => {
  return apiRequest('/mensajes', {
    method: 'POST',
    body: messageData
  });
};
```

## 🔔 Notificaciones

### Get Notifications
```typescript
// GET /notificaciones
interface Notificacion {
  id: string;
  usuarioId: string;
  titulo: string;
  contenido: string;
  tipo: 'RESERVA' | 'CUPO' | 'MENSAJE' | 'SISTEMA';
  leida: boolean;
  fechaCreacion: string;
  datos?: Record<string, any>;
}

export const getNotificaciones = async (): Promise<Notificacion[]> => {
  return apiRequest('/notificaciones');
};
```

### Mark Notification as Read
```typescript
// PUT /notificaciones/:id/leida
export const marcarNotificacionLeida = async (notificacionId: string): Promise<{ success: boolean }> => {
  return apiRequest(`/notificaciones/${notificacionId}/leida`, {
    method: 'PUT'
  });
};
```

### Mark All Notifications as Read
```typescript
// PUT /notificaciones/marcar-todas-leidas
export const marcarTodasNotificacionesLeidas = async (): Promise<{ success: boolean }> => {
  return apiRequest('/notificaciones/marcar-todas-leidas', {
    method: 'PUT'
  });
};
```

## 💳 Sistema de Pagos

### Create Payment Intent
```typescript
// POST /pagos/crear-intencion
interface CreatePaymentIntentRequest {
  reservaId: string;
  metodoPago: 'TARJETA' | 'PSE' | 'NEQUI' | 'DAVIPLATA';
}

interface PaymentIntent {
  id: string;
  clientSecret: string;
  monto: number;
  moneda: string;
  estado: 'PENDIENTE' | 'PROCESANDO' | 'EXITOSO' | 'FALLIDO';
}

export const createPaymentIntent = async (
  paymentData: CreatePaymentIntentRequest
): Promise<PaymentIntent> => {
  return apiRequest('/pagos/crear-intencion', {
    method: 'POST',
    body: paymentData
  });
};
```

### Confirm Payment
```typescript
// POST /pagos/confirmar
interface ConfirmPaymentRequest {
  paymentIntentId: string;
  paymentMethodId: string;
}

export const confirmPayment = async (
  confirmData: ConfirmPaymentRequest
): Promise<{ success: boolean; transactionId: string }> => {
  return apiRequest('/pagos/confirmar', {
    method: 'POST',
    body: confirmData
  });
};
```

### Get Payment History
```typescript
// GET /pagos/historial
interface PagoHistorial {
  id: string;
  reservaId: string;
  monto: number;
  metodoPago: string;
  estado: string;
  fechaPago: string;
  transactionId: string;
}

export const getPaymentHistory = async (): Promise<PagoHistorial[]> => {
  return apiRequest('/pagos/historial');
};
```

## 📊 Analytics y Reportes

### Get User Statistics
```typescript
// GET /analytics/usuario
interface UserAnalytics {
  totalViajes: number;
  totalCuposCreados: number;
  totalReservas: number;
  calificacionPromedio: number;
  viajesCompletados: number;
  viajesCancelados: number;
}

export const getUserAnalytics = async (): Promise<UserAnalytics> => {
  return apiRequest('/analytics/usuario');
};
```

### Get Platform Statistics
```typescript
// GET /analytics/plataforma
interface PlatformAnalytics {
  usuariosActivos: number;
  viajesRealizados: number;
  cuposDisponibles: number;
  ciudadesActivas: number;
}

export const getPlatformAnalytics = async (): Promise<PlatformAnalytics> => {
  return apiRequest('/analytics/plataforma');
};
```

## 🔍 Búsquedas y Filtros

### Advanced Search
```typescript
// GET /busqueda/avanzada
interface AdvancedSearchRequest {
  origen?: string;
  destino?: string;
  fechaInicio?: string;
  fechaFin?: string;
  precioMin?: number;
  precioMax?: number;
  tipoVehiculo?: string;
  asientosMinimos?: number;
  horaSalida?: string;
}

export const busquedaAvanzada = async (
  filters: AdvancedSearchRequest
): Promise<Cupo[]> => {
  const queryParams = new URLSearchParams(filters as any).toString();
  return apiRequest(`/busqueda/avanzada?${queryParams}`);
};
```

## 🎯 Telefunc RPC Calls

### RPC Authentication
```typescript
// Telefunc calls are automatically typed
import { obtenerUsuarioActual } from './server/functions/auth.telefunc';

// Usage in components
const userInfo = await obtenerUsuarioActual();
```

### RPC Cupos Management
```typescript
import { 
  buscarCuposDisponibles,
  crearNuevoCupo,
  actualizarCupo 
} from './server/functions/cupos.telefunc';

// Fully typed function calls
const cupos = await buscarCuposDisponibles({
  origen: 'Cali',
  destino: 'Bogotá',
  fecha: '2024-01-15'
});
```

## 🔄 Error Handling

### Standard Error Responses
```typescript
interface ApiError {
  error: string;
  message: string;
  status: number;
  timestamp: string;
  path: string;
}

// Error handling in services
export const handleApiError = (error: any): ApiError => {
  if (error.response) {
    return {
      error: error.response.data.error || 'API Error',
      message: error.response.data.message || 'Unknown error',
      status: error.response.status,
      timestamp: new Date().toISOString(),
      path: error.config?.url || 'unknown'
    };
  }
  
  return {
    error: 'Network Error',
    message: error.message || 'Connection failed',
    status: 0,
    timestamp: new Date().toISOString(),
    path: 'network'
  };
};
```

### Retry Logic
```typescript
export const apiRequestWithRetry = async (
  endpoint: string, 
  options: RequestOptions = {},
  maxRetries: number = 3
): Promise<any> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiRequest(endpoint, options);
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
};
```

## 📱 Real-time Updates

### WebSocket Connection
```typescript
// WebSocket para actualizaciones en tiempo real
class WebSocketService {
  private ws: WebSocket | null = null;
  
  connect() {
    const token = getToken();
    this.ws = new WebSocket(`wss://cupo-backend.fly.dev/ws?token=${token}`);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };
  }
  
  private handleMessage(data: any) {
    switch (data.type) {
      case 'NUEVA_RESERVA':
        // Handle new reservation
        break;
      case 'CUPO_ACTUALIZADO':
        // Handle cupo update
        break;
      case 'MENSAJE_NUEVO':
        // Handle new message
        break;
    }
  }
}
```

## 🔒 Security Headers

### Request Security
```typescript
// Security headers are automatically added
const secureApiRequest = async (endpoint: string, options: RequestOptions = {}) => {
  const securityHeaders = {
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-Token': getCsrfToken(),
    'User-Agent': 'CupoApp-Frontend/1.0',
    ...options.headers
  };

  return apiRequest(endpoint, {
    ...options,
    headers: securityHeaders
  });
};
```

Este documento proporciona una referencia completa de todas las API calls disponibles en CupoApp. Todas las funciones están tipadas con TypeScript y incluyen manejo de errores apropiado.
