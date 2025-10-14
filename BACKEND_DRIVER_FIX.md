# 🚨 URGENTE: Backend NO está mapeando información del conductor

## 🔥 PROBLEMA IDENTIFICADO

El backend SÍ está obteniendo la información de los conductores con la query, PERO la función `mapTripsToFormat` (línea ~175) NO está mapeando correctamente estos datos a la respuesta.

## 📊 LOG ACTUAL DEL FRONTEND

```json
{
  "id": "123",
  "driverName": "Conductor no disponible",  // ❌ PROBLEMA EN MAPEO
  "photo": "https://...SinFotoPerfil.png",  // ❌ PROBLEMA EN MAPEO
  "driver": null,  // ❌ PROBLEMA EN MAPEO
  "rating": null   // ❌ PROBLEMA EN MAPEO
}
```

## 🔧 SOLUCIÓN ESPECÍFICA

### Archivo: `/src/routes/reservas.ts` - Línea ~175

**PROBLEMA:** La función `mapTripsToFormat` no está usando los datos de `userProfiles` que SÍ se están obteniendo.

**ARREGLO NECESARIO:**

```typescript
// Función para mapear trips a formato completo  
const mapTripsToFormat = (tripsToMap: any[]) => {
  return tripsToMap.map((trip) => {
    // ✅ BUSCAR EL CONDUCTOR EN userProfiles.data
    const driverProfile = userProfiles.data?.find(profile => profile.user_id === trip.user_id);
    
    // ✅ MAPEAR CORRECTAMENTE LA INFORMACIÓN DEL CONDUCTOR
    const driverName = driverProfile 
      ? `${driverProfile.first_name || ''} ${driverProfile.last_name || ''}`.trim()
      : 'Conductor no disponible';
    
    const driverPhoto = driverProfile?.photo_user && driverProfile.photo_user.trim()
      ? driverProfile.photo_user
      : 'https://tddaveymppuhweujhzwz.supabase.co/storage/v1/object/public/resourcers/Home/SinFotoPerfil.png';
    
    const driverRating = driverProfile?.average_rating || 0;
    
    // ✅ CREAR OBJETO DRIVER COMPLETO
    const driverObject = driverProfile ? {
      first_name: driverProfile.first_name,
      last_name: driverProfile.last_name,
      photo_user: driverProfile.photo_user,
      average_rating: driverProfile.average_rating || 0,
      verification: driverProfile.Verification
    } : null;

    return {
      id: trip.id,
      origin: /* mapeo de origin */,
      destination: /* mapeo de destination */,
      // ... otros campos existentes ...
      
      // ✅ CAMPOS DEL CONDUCTOR CORREGIDOS
      driverName: driverName,
      photo: driverPhoto,  
      rating: driverRating,
      driver: driverObject,  // ✅ AGREGAR OBJETO DRIVER COMPLETO
      
      // ... resto de campos ...
    };
  });
};
```

## 📍 UBICACIÓN EXACTA DEL PROBLEMA

- **Archivo:** `/src/routes/reservas.ts`
- **Línea:** ~175 (función `mapTripsToFormat`)
- **Problema:** No está mapeando `userProfiles.data` a los campos del conductor

## ⚡ VERIFICACIÓN INMEDIATA

Después del fix, el log debe mostrar:
```json
{
  "driverName": "kevin Alvarez",  // ✅ NOMBRE REAL
  "photo": "https://...real_photo.jpg",  // ✅ FOTO REAL
  "driver": {  // ✅ OBJETO COMPLETO
    "first_name": "kevin",
    "last_name": "Alvarez",
    "photo_user": "https://...real_photo.jpg",
    "average_rating": 4.5
  },
  "rating": 4.5  // ✅ RATING REAL
}
```

## 🚀 ACCIÓN REQUERIDA

**MODIFICA la función `mapTripsToFormat` en la línea ~175 para mapear correctamente los datos de `userProfiles.data` a los campos del conductor.**

El problema NO está en la query (que SÍ funciona), sino en el mapeo final de la respuesta.