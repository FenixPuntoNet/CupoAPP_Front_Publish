# 🔑 FIX CRÍTICO - Campo de búsqueda incorrecto

## ❌ Problema Real Identificado

El worker estaba buscando por **`id`** en la tabla `user_profiles`, pero según la estructura de la base de datos, debería buscar por **`user_id`**.

### 📊 Estructura Real de la Tabla:
```typescript
user_profiles: {
  Row: {
    id: number,              // ← Clave primaria autoincremental
    user_id: string,         // ← UUID que viene de auth.users ✅
    status: string,          // ← Campo que necesitamos
    first_name: string,
    last_name: string,
    // ... otros campos
  }
}
```

## ✅ Corrección Aplicada

### 🔄 Cambios en el Worker:

1. **Búsqueda corregida**:
   ```javascript
   // ANTES (INCORRECTO):
   /rest/v1/user_profiles?id=eq.${userId}
   
   // AHORA (CORRECTO):
   /rest/v1/user_profiles?user_id=eq.${userId}
   ```

2. **Actualización corregida**:
   ```javascript
   // Usar campo dinámico según la tabla:
   const filterField = tableName === 'user_profiles' ? 'user_id' : 'id';
   /rest/v1/${tableName}?${filterField}=eq.${userId}
   ```

3. **Debug corregido**:
   - También actualizado para usar `user_id` en user_profiles

## 🚀 Deploy y Test

### Pasos:
1. **Despliega** el worker actualizado en Cloudflare
2. **Prueba inmediatamente** la recuperación de karina@gmail.com

### 📊 Logs Esperados Ahora:
```
🔍 [RECOVER] Fetching user status for ID: abc-123-def
📡 [RECOVER] DB response status: 200 from table: user_profiles
📊 [RECOVER] Raw DB response from user_profiles: [{"id":123,"user_id":"abc-123-def","status":"pending_deletion"}]
✅ [RECOVER] User found in user_profiles - ID: abc-123-def Status: pending_deletion
🔍 [RECOVER] Evaluating recovery for status: pending_deletion
✅ [RECOVER] Status is recoverable: pending_deletion
🔄 [RECOVER] Updating user status from pending_deletion to PASSENGER in table: user_profiles
📡 [RECOVER] Update response status: 200 for table: user_profiles
✅ [RECOVER] User status updated successfully in user_profiles
```

## ⚡ Quick Test

```bash
# Después del deploy:
curl -X POST -H "Content-Type: application/json" \
-d '{"email":"karina@gmail.com","password":"Veolia2020"}' \
https://auth-worker.kngsdata.workers.dev/auth/recover-account
```

## 🎯 Resultado Esperado

- ✅ Encuentra al usuario en `user_profiles` usando `user_id`
- ✅ Detecta status `pending_deletion`  
- ✅ Permite la recuperación
- ✅ Actualiza status a `PASSENGER`
- ✅ Usuario puede hacer login normalmente

---

**¡Este debería ser el fix definitivo!** El problema era que estábamos usando el campo de búsqueda equivocado. 🎯
