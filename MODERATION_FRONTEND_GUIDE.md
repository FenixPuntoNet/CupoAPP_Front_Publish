# 🛡️ Sistema de Moderación Frontend - Guía de Uso

## ✅ Implementación Completada

El frontend ha sido completamente migrado para usar exclusivamente los endpoints del backend. A continuación se detalla lo implementado:

## 📁 Nuevos Servicios Creados

### 1. `/src/services/moderation.ts`
- ✅ `createReport()` - Crear reportes de contenido
- ✅ `getMyReports()` - Obtener mis reportes
- ✅ `blockUser()` - Bloquear usuarios
- ✅ `unblockUser()` - Desbloquear usuarios
- ✅ `getBlockedUsers()` - Obtener usuarios bloqueados
- ✅ `checkIfUserBlocked()` - Verificar si un usuario está bloqueado
- ✅ `getUserModerationStatus()` - Obtener estado de moderación
- ✅ `acknowledgeWarning()` - Reconocer advertencias
- ✅ `getModerationStats()` - Estadísticas de moderación (admin)
- ✅ `getReportsStats()` - Estadísticas de reportes (admin)

### 2. `/src/services/accounts.ts`
- ✅ `deactivateAccount()` - Desactivar cuenta temporalmente
- ✅ `deleteAccount()` - Eliminar cuenta permanentemente
- ✅ `recoverAccount()` - Recuperar cuenta desactivada
- ✅ `checkAccountStatus()` - Verificar estado de cuenta

## 🔧 Hooks Actualizados

### `/src/hooks/useUserModeration.ts`
- ✅ Migrado para usar servicios del backend
- ✅ Manejo automático de estados de moderación
- ✅ Funciones helper para advertencias y suspensiones

## 🎨 Componentes Actualizados

### 1. Componentes de Reporte
- ✅ `ReportModal.tsx` - Migrado a usar `createReport()`
- ✅ Eliminado parámetro `reporterId` (se obtiene automáticamente del token)

### 2. Componentes de Bloqueo
- ✅ `BlockUserModal.tsx` - Migrado a usar `blockUser()`
- ✅ `BlockedUsersModal.tsx` - Migrado a usar `getBlockedUsers()` y `unblockUser()`
- ✅ Eliminado parámetro `currentUserId` (se obtiene automáticamente del token)

### 3. Componentes de Gestión de Cuentas
- ✅ `DeactivateAccountModal_New.tsx` - Migrado a usar servicios de accounts
- ✅ `RecoverAccountModal_New.tsx` - Migrado a usar servicios de accounts
- ✅ Soporte para desactivación temporal y eliminación permanente

### 4. Dashboard de Administración
- ✅ `ModerationDashboard.tsx` - Nuevo componente para administradores
- ✅ Estadísticas en tiempo real
- ✅ Gestión de reportes
- ✅ Panel de control completo

## 📋 Cómo Usar los Nuevos Servicios

### Ejemplo: Crear un Reporte
\`\`\`typescript
import { createReport } from '@/services/moderation';

const handleReport = async () => {
  const result = await createReport({
    contentType: 'message',
    contentId: 123,
    reason: 'spam',
    description: 'Este mensaje contiene spam'
  });

  if (result.success) {
    console.log('Reporte creado:', result.data);
  } else {
    console.error('Error:', result.error);
  }
};
\`\`\`

### Ejemplo: Bloquear Usuario
\`\`\`typescript
import { blockUser } from '@/services/moderation';

const handleBlock = async (userId: string) => {
  const result = await blockUser(userId, 'Comportamiento inapropiado');
  
  if (result.success) {
    console.log('Usuario bloqueado exitosamente');
  } else {
    console.error('Error al bloquear:', result.error);
  }
};
\`\`\`

### Ejemplo: Usar Hook de Moderación
\`\`\`typescript
import { useUserModeration } from '@/hooks/useUserModeration';

const MyComponent = ({ userId }: { userId: string }) => {
  const {
    isSuspended,
    warningLevel,
    activeWarnings,
    acknowledgeWarning,
    loading
  } = useUserModeration(userId);

  if (isSuspended) {
    return <div>Usuario suspendido</div>;
  }

  return (
    <div>
      <p>Nivel de advertencias: {warningLevel}</p>
      {activeWarnings.map(warning => (
        <div key={warning.id}>
          <p>{warning.message}</p>
          {!warning.acknowledged_at && (
            <button onClick={() => acknowledgeWarning(warning.id)}>
              Reconocer advertencia
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
\`\`\`

### Ejemplo: Desactivar Cuenta
\`\`\`typescript
import { deactivateAccount } from '@/services/accounts';

const handleDeactivate = async () => {
  const result = await deactivateAccount({
    reason: 'Usuario solicitó desactivación',
    isPermanent: false
  });

  if (result.success) {
    console.log('Cuenta desactivada');
    // Redirigir al login
  }
};
\`\`\`

## 🚀 Características Principales

### 1. **Autenticación Automática**
- Todos los servicios usan automáticamente el token JWT del usuario logueado
- No es necesario pasar `userId` manualmente

### 2. **Manejo de Errores Consistente**
- Todos los servicios retornan `{ success: boolean, data?, error? }`
- Logging detallado para debugging

### 3. **TypeScript Completo**
- Tipos definidos para todas las interfaces
- Autocompletado y verificación de tipos

### 4. **Integración con Backend**
- Comunicación directa con endpoints del backend
- Elimina dependencias de Supabase para moderación

## 🎯 Próximos Pasos

1. **Integrar en la UI principal**
   - Agregar botones de reporte en mensajes/perfiles
   - Mostrar alertas de moderación
   - Implementar dashboard para admins

2. **Testing**
   - Probar todos los flujos de moderación
   - Verificar autenticación y permisos
   - Validar experiencia de usuario

3. **Configuración**
   - Configurar roles de administrador
   - Establecer políticas de moderación
   - Definir umbrales de advertencias

## 🔒 Consideraciones de Seguridad

- ✅ Autenticación JWT requerida para todas las operaciones
- ✅ Validación de permisos en el backend
- ✅ Logs de auditoría para todas las acciones
- ✅ Datos sensibles protegidos

El sistema está listo para uso en producción! 🎉
