# 🔧 GUÍA DE DEBUGGING - ERROR 400 AL INICIAR VIAJE

## 🚨 PROBLEMA ACTUAL
El endpoint `POST /viajes/trip/9/start` está devolviendo error 400 con mensaje "Error interno del servidor".

## 🔍 DEBUGGING IMPLEMENTADO

### 1. **Logging Mejorado en API** (`/src/config/api.ts`)
- Se agregó información detallada del token de autenticación
- Se muestra el método HTTP y body de la request
- Información completa de headers

### 2. **Función de Diagnóstico** (`/src/services/viajes.ts`)
- Nueva función `diagnoseTripStatus()` para verificar el estado del viaje
- Logging detallado en `startTrip()` con información completa del error
- Verificación de token de autenticación

### 3. **Pre-diagnóstico en TripCard** (`/src/components/Actividades/TripCard.tsx`)
- Ejecuta diagnóstico antes de intentar iniciar el viaje
- Muestra información del estado actual del viaje
- Información de ownership del viaje

## 📊 INFORMACIÓN A VERIFICAR

### **En las herramientas de desarrollador del navegador:**

1. **Consola del navegador - buscar estos logs:**
   ```
   🚀 [startTrip] ===== STARTING TRIP DEBUG =====
   🔑 [startTrip] Auth token available: true/false
   🔍 [TripCard] Diagnosis result: [objeto con detalles del viaje]
   📊 [TripCard] Current trip status: active/in_progress/completed
   ```

2. **Red (Network) - verificar la request:**
   - URL: `https://cupo-backend.fly.dev/viajes/trip/9/start`
   - Método: POST
   - Headers: Authorization debe contener "Bearer [token]"
   - Content-Type: application/json

## 🔧 POSIBLES CAUSAS DEL ERROR 400

### **En el Backend:**
1. **Token de autenticación:**
   - Token expirado o inválido
   - Usuario no autorizado para este viaje

2. **Estado del viaje:**
   - El viaje no existe (ID 9)
   - El viaje no está en estado "active"
   - El viaje no pertenece al usuario autenticado

3. **Validaciones del backend:**
   - El endpoint está recibiendo datos inesperados
   - Falta algún campo requerido en la request

## 🚀 PASOS PARA RESOLVER

### **Paso 1: Verificar logs del frontend**
1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña Console
3. Intenta iniciar el viaje
4. Revisa todos los logs que empiecen con `🚀`, `🔍`, `📊`

### **Paso 2: Verificar la request en Network**
1. Ve a la pestaña Network
2. Filtra por "start" o "viajes"
3. Intenta iniciar el viaje
4. Revisa la request que falla:
   - Headers (especialmente Authorization)
   - Request payload
   - Response details

### **Paso 3: Datos a compartir**
Si el problema persiste, comparte:
- Los logs completos de la consola
- El contenido de la request en Network tab
- La respuesta completa del servidor (con detalles del error)

## ✅ VERIFICACIONES RÁPIDAS

**En la consola del navegador, ejecuta:**
```javascript
// Verificar token
localStorage.getItem('auth_token')

// Verificar que tenemos un usuario logueado
fetch('https://cupo-backend.fly.dev/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  }
}).then(r => r.json()).then(console.log)
```

**¡Con esta información podremos identificar exactamente qué está causando el error 400!** 🎯
