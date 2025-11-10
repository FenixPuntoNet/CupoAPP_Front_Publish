# 🔔 Sistema de Notificaciones CupoApp

Sistema completo de notificaciones conectado al backend real de cupo.site

## 🚀 Estado de la Implementación

### ✅ COMPLETADO - Frontend
- [x] Hook `useNotifications` con API real
- [x] Servicio de datos conectado al backend
- [x] Interfaz de usuario profesional
- [x] Soporte para modos claro/oscuro
- [x] Funciones de marcar como leído
- [x] Centro de notificaciones completo
- [x] Integración con menú de navegación

### ✅ COMPLETADO - Backend (según archivos)
- [x] Endpoints de API `/notifications`
- [x] Autenticación con JWT
- [x] Base de datos Supabase
- [x] Sistema de estadísticas
- [x] Cleanup automático

### 📋 Endpoints Disponibles

#### 📥 Obtener Notificaciones
```
GET /notifications?limit=20&page=1
Authorization: Bearer <token>
```

#### 📊 Estadísticas
```
GET /notifications/stats
Authorization: Bearer <token>
```

#### ✅ Marcar como Leídas
```
PUT /notifications/read
Content-Type: application/json
Authorization: Bearer <token>

{
  "notification_ids": [1, 2, 3]
}
```

#### ✅ Marcar Todas como Leídas
```
PUT /notifications/read-all
Authorization: Bearer <token>
```

#### 📝 Crear Notificación
```
POST /notifications
Content-Type: application/json
Authorization: Bearer <token>

{
  "type": "message|booking|confirmation|trip|warning",
  "title": "Título de la notificación",
  "message": "Mensaje de la notificación",
  "data": {
    "chatId": "opcional",
    "bookingId": "opcional",
    "tripId": "opcional"
  }
}
```

#### 🗑️ Eliminar Notificación
```
DELETE /notifications/:id
Authorization: Bearer <token>
```

## 🎮 Cómo Usar

### En un Componente React

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function MiComponente() {
  const {
    notifications,
    unreadCount, 
    loading,
    markAsRead,
    refresh,
    showSuccess
  } = useNotifications();

  const handleClick = async () => {
    // Marcar notificación como leída
    await markAsRead(notificationId);
    
    // Mostrar notificación de éxito
    showSuccess('¡Listo!', 'Operación completada');
    
    // Refrescar lista
    refresh();
  };

  return (
    <div>
      <p>Tienes {unreadCount} notificaciones sin leer</p>
      {/* Tu UI aquí */}
    </div>
  );
}
```

### Navegación al Centro de Notificaciones

El centro está disponible en la ruta `/Notifications/` y se puede acceder desde:
- Menú de perfil → "Notificaciones"

## 🔧 Configuración

### Cambiar entre Simulación y API Real

En `/src/config/notifications.ts`:

```typescript
export const NOTIFICATION_CONFIG = {
  USE_REAL_API: true, // false para modo simulación
  POLLING_INTERVAL: 30000,
  // ... más configuraciones
};
```

### Variables de Entorno

```env
VITE_API_URL=https://cupo.site
```

## 🧪 Testing

### Modo Desarrollo

En desarrollo, los botones de prueba están disponibles para:
- Crear notificaciones de prueba
- Probar diferentes tipos
- Verificar la funcionalidad de marcado

### Panel de Pruebas

Accesible desde el centro de notificaciones, permite:
- Crear mensajes de prueba
- Crear reservas de prueba  
- Crear confirmaciones de prueba
- Limpiar notificaciones visuales

## 📊 Estructura de Datos

### DatabaseNotification
```typescript
interface DatabaseNotification {
  id: number;
  user_id: string;
  type: string; // 'message' | 'booking' | 'confirmation' | 'trip' | 'warning'
  title: string;
  message: string;
  send_date: string; // ISO string
  status: 'pendiente' | 'enviado' | 'leido' | 'error';
  is_read: boolean;
  data: Record<string, any>; // JSON con datos específicos
}
```

## 🎯 Funcionalidades Implementadas

### 📱 Centro de Notificaciones
- Lista paginada de notificaciones
- Filtros por tipo y estado
- Modal de detalles
- Acciones de marcado
- Diseño responsive

### 🔔 Notificaciones Visuales
- Toast notifications con Mantine
- Iconos por tipo de notificación
- Auto-dismiss configurable
- Integración con navegación

### 📊 Estadísticas en Tiempo Real
- Contador de no leídas
- Estadísticas por tipo
- Polling automático para updates

### 🎨 UI/UX
- Colores de marca CupoApp (verde)
- Soporte dark/light mode
- Animaciones suaves
- Estados de loading

## 📝 Próximos Pasos Opcionales

### 🔄 Mejoras del Backend (si necesario)

1. **Endpoint para Marcar como No Leído**
```
PUT /notifications/unread
{
  "notification_ids": [1, 2, 3]
}
```

2. **WebSockets para Tiempo Real**
- Reemplazar polling con WebSockets
- Notificaciones instantáneas

3. **Push Notifications**
- Integración con FCM
- Notificaciones fuera de la app

### 🚀 Características Avanzadas

1. **Filtros Avanzados**
- Por fecha
- Por prioridad
- Búsqueda por texto

2. **Configuración de Usuario**
- Preferencias de notificación
- Horarios de no molestar
- Tipos habilitados/deshabilitados

## 🐛 Troubleshooting

### Problemas Comunes

1. **No aparecen notificaciones**
   - Verificar token de autenticación
   - Revisar consola para errores de API
   - Comprobar endpoint del backend

2. **Notificaciones no se marcan como leídas**
   - Verificar permisos del usuario
   - Revisar logs del backend
   - Comprobar formato de IDs

3. **Error 401 Unauthorized**
   - Token expirado o inválido
   - Usuario no autenticado
   - Revisar configuración de auth

### Debug Mode

Activar logs detallados en desarrollo:
```typescript
// En notifications.config.ts
ENABLE_DEBUG_LOGS: true
```

## 📞 Soporte

Para problemas o mejoras, revisar:
1. Logs de la consola del navegador
2. Logs del backend en cupo.site
3. Estado de la autenticación
4. Conectividad de red

---

¡El sistema está completamente funcional y listo para usar! 🎉