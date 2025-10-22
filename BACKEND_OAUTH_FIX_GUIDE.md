# 🔧 GUÍA DE CORRECCIÓN BACKEND - OAuth Token Exchange

## ❌ PROBLEMA IDENTIFICADO

El endpoint `/auth/exchange-supabase-token` está generando tokens JWT personalizados que **NO SON COMPATIBLES** con el sistema de validación existente.

**Estado actual:**
- Login normal: Usa tokens de Supabase ✅ → Funciona perfectamente
- Login OAuth: Genera JWT custom ❌ → Falla con 401 "Token inválido"

**Root cause:**
El endpoint `/auth/me` usa `supabaseAdmin.auth.getUser(token)` que **SOLO funciona con tokens de Supabase**, no con JWTs custom.

## 🎯 SOLUCIÓN REQUERIDA

**CAMBIAR** el endpoint `/auth/exchange-supabase-token` para que **NO genere JWT custom** y **devuelva el token original de Supabase**.

## 📍 ARCHIVO A MODIFICAR

**Archivo:** `/src/routes/auth.ts`
**Endpoint:** `POST /auth/exchange-supabase-token`

## 🔧 CAMBIOS ESPECÍFICOS REQUERIDOS

### ANTES (Problemático):
```typescript
// ❌ ESTO ESTÁ CAUSANDO EL PROBLEMA
const backendToken = jwt.sign({
  sub: userId,
  user_id: userId,
  email: userEmail,
  username: username,
  provider: provider,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 días
  iss: 'cupo.site',
  aud: 'cupo-app',
  type: 'backend',
  source: 'oauth_exchange',
  permissions: ['read', 'write', 'delete']
}, process.env.JWT_SECRET || 'cupo-backend-secret-2024');

return reply.send({
  success: true,
  backend_token: backendToken, // ❌ Token custom que falla
  access_token: backendToken,  // ❌ Token custom que falla
  // ...
});
```

### DESPUÉS (Solución):
```typescript
// ✅ DEVOLVER EL TOKEN ORIGINAL DE SUPABASE
return reply.send({
  success: true,
  backend_token: supabase_token,  // ✅ Token original de Supabase
  access_token: supabase_token,   // ✅ Token original de Supabase
  user: {
    id: userId,
    email: userEmail,
    username: profile?.username || extractUsernameFromEmail(userEmail),
    first_name: profile?.first_name || userMetadata?.name?.split(' ')[0] || '',
    last_name: profile?.last_name || userMetadata?.name?.split(' ').slice(1).join(' ') || '',
    profile_picture: profile?.profile_picture || userMetadata?.picture || userMetadata?.avatar_url,
    status: profile?.status || 'active'
  },
  message: "Token exchanged successfully",
  bootstrap_completed: true,
  token_source: "oauth_exchange"
});
```

## 📝 CÓDIGO COMPLETO SUGERIDO

Reemplaza la función del endpoint `/auth/exchange-supabase-token` con esto:

```typescript
fastify.post('/exchange-supabase-token', async (request, reply) => {
  try {
    const { supabase_token, provider, user_id, force_bootstrap } = request.body as {
      supabase_token: string;
      provider?: string;
      user_id?: string;
      force_bootstrap?: boolean;
    };

    if (!supabase_token) {
      return reply.status(400).send({ 
        error: 'supabase_token es requerido' 
      });
    }

    console.log('🔄 [TOKEN-EXCHANGE] Processing Supabase token exchange...');

    // 1. Validar el token de Supabase
    const { data: getUserData, error: getUserError } = await supabaseAdmin.auth.getUser(supabase_token);
    
    if (getUserError || !getUserData?.user) {
      console.error('❌ [TOKEN-EXCHANGE] Invalid Supabase token:', getUserError);
      return reply.status(401).send({ 
        error: 'Token de Supabase inválido',
        details: getUserError?.message 
      });
    }

    const userId = getUserData.user.id;
    const userEmail = getUserData.user.email;
    const userMetadata = getUserData.user.user_metadata;
    const detectedProvider = provider || userMetadata?.provider || 'google';

    console.log('✅ [TOKEN-EXCHANGE] Supabase token validated successfully');
    console.log('🔍 [TOKEN-EXCHANGE] User info:', {
      userId,
      userEmail,
      provider: detectedProvider
    });

    // 2. Bootstrap del usuario (crear perfil, wallet, términos si no existen)
    try {
      console.log('🔧 [TOKEN-EXCHANGE] Starting user bootstrap...');
      const bootstrapResult = await bootstrapUser(userId, {
        ...userMetadata,
        provider: detectedProvider,
        oauth_exchange: true
      });
      console.log('✅ [TOKEN-EXCHANGE] User bootstrap completed:', bootstrapResult);
    } catch (bootstrapError) {
      console.error('❌ [TOKEN-EXCHANGE] Bootstrap failed:', bootstrapError);
      // No fallar el intercambio por problemas de bootstrap
      console.log('⚠️ [TOKEN-EXCHANGE] Continuing despite bootstrap issues...');
    }

    // 3. Obtener datos completos del perfil del usuario
    let profile;
    try {
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('user_id, status, first_name, last_name, username, profile_picture')
        .eq('user_id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows
        console.warn('⚠️ [TOKEN-EXCHANGE] Error fetching profile:', profileError);
      }
      
      profile = profileData;
    } catch (profileFetchError) {
      console.warn('⚠️ [TOKEN-EXCHANGE] Could not fetch user profile:', profileFetchError);
    }

    // 4. Función auxiliar para extraer username del email
    const extractUsernameFromEmail = (email: string): string => {
      return email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    };

    // 5. ✅ CRÍTICO: NO generar JWT custom, devolver token original de Supabase
    const responseData = {
      success: true,
      backend_token: supabase_token,  // ✅ Token original que funciona
      access_token: supabase_token,   // ✅ Token original que funciona
      user: {
        id: userId,
        email: userEmail,
        username: profile?.username || extractUsernameFromEmail(userEmail),
        first_name: profile?.first_name || userMetadata?.name?.split(' ')[0] || userMetadata?.full_name?.split(' ')[0] || '',
        last_name: profile?.last_name || userMetadata?.name?.split(' ').slice(1).join(' ') || userMetadata?.full_name?.split(' ').slice(1).join(' ') || '',
        profile_picture: profile?.profile_picture || userMetadata?.picture || userMetadata?.avatar_url,
        status: profile?.status || 'active'
      },
      message: "Token exchanged successfully",
      bootstrap_completed: true,
      token_source: "oauth_exchange"
    };

    console.log('✅ [TOKEN-EXCHANGE] Successful exchange - returning Supabase token');
    return reply.send(responseData);

  } catch (error) {
    console.error('❌ [TOKEN-EXCHANGE] Critical error:', error);
    return reply.status(500).send({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
```

## 🧪 TESTING

Después del cambio, probar con:

```bash
curl -X POST https://cupo.site/auth/exchange-supabase-token \
  -H "Content-Type: application/json" \
  -d '{
    "supabase_token": "REAL_SUPABASE_TOKEN_HERE",
    "provider": "google",
    "force_bootstrap": true
  }' \
  -v
```

**Resultado esperado:**
- Status: 200 OK
- Response: `backend_token` y `access_token` deben ser idénticos al `supabase_token` enviado
- El token devuelto debe funcionar con `/auth/me`

## ⚠️ NOTAS IMPORTANTES

1. **NO eliminar el proceso de bootstrap** - es necesario para crear wallet/profile
2. **NO cambiar la validación en `/auth/me`** - debe seguir usando `supabaseAdmin.auth.getUser()`
3. **El cambio es mínimo** - solo cambiar qué token se devuelve, no la lógica completa
4. **Mantener toda la respuesta igual** - solo cambiar `backend_token` y `access_token`

## 🎯 OBJETIVO FINAL

Después de este cambio:
- Login normal: Token Supabase → `/auth/me` → ✅ Funciona
- Login OAuth: Token Supabase → intercambio → Token Supabase → `/auth/me` → ✅ Funciona

**¡El sistema será consistente y ambos flujos usarán el mismo tipo de token!**