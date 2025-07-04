# 🔧 FIX CRÍTICO - Tabla "public.users" no existe

## ❌ Error Identificado
```
"relation \"public.users\" does not exist", status_code: 404
```

**Problema**: El worker estaba intentando acceder a la tabla `public.users` que no existe en tu base de datos de Supabase. Según las capturas, tu tabla se llama `user_profiles`.

## ✅ Corrección Aplicada

### 🔄 En `cloudflare-worker-production-ready.js`:

1. **Cambiado el orden de búsqueda**:
   - Primero intenta `user_profiles` 
   - Si falla, intenta `users` como fallback

2. **Variable de tabla dinámica**:
   - `tableName` rastrea qué tabla se está usando
   - Se usa la misma tabla para búsqueda Y actualización

3. **Logging mejorado**:
   - Muestra qué tabla se está consultando
   - Informa si ambas tablas fallan

## 🚀 Instrucciones de Deploy

1. **Copia el worker actualizado** (`cloudflare-worker-production-ready.js`)
2. **Pega en Cloudflare Workers**
3. **Guarda y despliega**
4. **Prueba la recuperación** inmediatamente

## 🧪 Test Expected Behavior

Ahora el worker debería:

```bash
# 1. Buscar en user_profiles primero
GET /rest/v1/user_profiles?id=eq.USER_ID

# 2. Si encuentra el usuario con status "pending_deletion"
✅ Permitir la recuperación

# 3. Actualizar status en la misma tabla
PATCH /rest/v1/user_profiles?id=eq.USER_ID
{ "status": "PASSENGER" }
```

## 📊 Logs Esperados

```
🔍 [RECOVER] Fetching user status for ID: abc-123
📡 [RECOVER] DB response status: 200 from table: user_profiles
📊 [RECOVER] Raw DB response from user_profiles: [{"id":"abc-123","status":"pending_deletion"}]
✅ [RECOVER] User found in user_profiles - ID: abc-123 Status: pending_deletion
🔍 [RECOVER] Evaluating recovery for status: pending_deletion
✅ [RECOVER] Status is recoverable: pending_deletion
🔄 [RECOVER] Updating user status from pending_deletion to PASSENGER in table: user_profiles
📡 [RECOVER] Update response status: 200 for table: user_profiles
✅ [RECOVER] User status updated successfully in user_profiles
```

## 🎯 Resultado Esperado

- ✅ No más error "relation does not exist"
- ✅ Encuentra al usuario en `user_profiles`
- ✅ Detecta status `pending_deletion` correctamente
- ✅ Permite la recuperación de cuenta
- ✅ Actualiza status a `PASSENGER` en la tabla correcta

---

## ⚡ Quick Deploy & Test

```bash
# Después del deploy, probar inmediatamente:
curl -X POST -H "Content-Type: application/json" \
-d '{"email":"karina@gmail.com","password":"Veolia2020"}' \
https://auth-worker.kngsdata.workers.dev/auth/recover-account
```

**¡Esta corrección debería resolver el problema de raíz!** 🚀
