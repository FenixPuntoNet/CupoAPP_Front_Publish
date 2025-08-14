# Guía de Registro de Vehículos con Promoción Automática a DRIVER

## 🚀 Nuevas Funcionalidades Implementadas

### ✅ Promoción Automática PASSENGER → DRIVER
Cuando un usuario registra un vehículo, automáticamente se promueve de **PASSENGER** a **DRIVER** en el backend.

### ✅ Endpoint Optimizado para Registro Completo
Nuevo endpoint que permite registrar vehículo y todos los documentos en una sola llamada.

---

## 📋 Funciones Principales Actualizadas

### 1. `registerCompleteVehicleWithPromotion()`
**📌 FUNCIÓN RECOMENDADA - Registro completo con promoción automática**

```typescript
import { registerCompleteVehicleWithPromotion } from '@/services/vehicles';

const handleCompleteRegistration = async () => {
  const result = await registerCompleteVehicleWithPromotion({
    vehicle: {
      brand: "Toyota",
      model: "Corolla", 
      year: "2020",
      plate: "ABC123",
      color: "Blanco",
      body_type: "Sedán"
    },
    license: {
      license_number: "12345678",
      license_category: "C1",
      blood_type: "O+",
      expedition_date: "2020-01-15",
      expiration_date: "2025-01-15"
    },
    property_card: {
      license_number: "TR123456789",
      service_type: "PARTICULAR",
      passager_capacity: 5,
      cylinder_capacity: "1600cc",
      expedition_date: "2020-01-15"
    },
    soat: {
      policy_number: "POL123456789",
      insurance_company: "Seguros Bolívar",
      validity_from: "2024-01-01",
      validity_to: "2025-01-01"
    }
  });

  if (result.success) {
    console.log('✅ Usuario promovido automáticamente a DRIVER');
    console.log('Vehicle ID:', result.vehicleId);
    console.log('License ID:', result.licenseId);
    console.log('Property Card ID:', result.propertyCardId);
    console.log('SOAT ID:', result.soatId);
  }
};
```

### 2. `registerVehicle()` - Actualizada
**📌 Ahora también promueve automáticamente a DRIVER**

```typescript
import { registerVehicle } from '@/services/vehicles';

const handleVehicleRegistration = async () => {
  const result = await registerVehicle({
    brand: "Toyota",
    model: "Corolla",
    year: "2020", 
    plate: "ABC123",
    color: "Blanco",
    body_type: "Sedán"
  });

  if (result.success) {
    console.log('✅ Vehículo registrado y usuario promovido a DRIVER');
  }
};
```

---

## 📸 Nuevas Funciones para Subida de Fotos

### 1. `uploadVehiclePhotoNew()`
```typescript
import { uploadVehiclePhotoNew } from '@/services/vehicles';

const uploadPhoto = async (vehicleId: number, photoBase64: string) => {
  const result = await uploadVehiclePhotoNew(vehicleId, photoBase64, 'vehicle_photo.jpg');
  
  if (result.success) {
    console.log('📸 Foto del vehículo subida:', result.photo_url);
  }
};
```

### 2. `uploadPropertyCardPhotosNew()`
```typescript
import { uploadPropertyCardPhotosNew } from '@/services/vehicles';

const uploadPropertyPhotos = async (propertyCardId: number) => {
  const result = await uploadPropertyCardPhotosNew(propertyCardId, {
    photo_front_base64: frontPhotoBase64,
    photo_back_base64: backPhotoBase64,
    filename_front: 'property_front.jpg',
    filename_back: 'property_back.jpg'
  });
};
```

### 3. `uploadDriverLicensePhotosNew()`
```typescript
import { uploadDriverLicensePhotosNew } from '@/services/vehicles';

const uploadLicensePhotos = async (licenseId: number) => {
  const result = await uploadDriverLicensePhotosNew(licenseId, {
    photo_front_base64: frontPhotoBase64,
    photo_back_base64: backPhotoBase64
  });
};
```

### 4. `uploadSoatPhotosNew()`
```typescript
import { uploadSoatPhotosNew } from '@/services/vehicles';

const uploadSoatPhotos = async (soatId: number) => {
  const result = await uploadSoatPhotosNew(soatId, {
    photo_front_base64: frontPhotoBase64,
    photo_back_base64: backPhotoBase64
  });
};
```

---

## 📊 Funciones de Consulta Mejoradas

### 1. `getDocumentsStatusNew()` - Estado completo de documentos
```typescript
import { getDocumentsStatusNew } from '@/services/vehicles';

const checkDocumentsStatus = async () => {
  const result = await getDocumentsStatusNew();
  
  if (result.success) {
    console.log('Progreso:', result.data?.completionPercentage + '%');
    console.log('Documentos faltantes:', result.data?.missingDocuments);
  }
};
```

### 2. `validateVehicleDataNew()` - Validación en tiempo real
```typescript
import { validateVehicleDataNew } from '@/services/vehicles';

const validatePlate = async (plate: string) => {
  const result = await validateVehicleDataNew({ plate });
  
  if (result.success) {
    console.log('Placa disponible:', result.plateAvailable);
    console.log('Validaciones:', result.validations);
  }
};
```

### 3. `getDriverStatsNew()` - Estadísticas del conductor
```typescript
import { getDriverStatsNew } from '@/services/vehicles';

const getStats = async () => {
  const result = await getDriverStatsNew();
  
  if (result.success) {
    console.log('Es conductor:', result.isDriver);
    console.log('Viajes completados:', result.stats?.trips.completed);
  }
};
```

---

## 🔄 Flujo Recomendado de Implementación

### Opción 1: Registro Completo (Recomendado)
```typescript
// 1. Recolectar todos los datos en formulario multi-step
// 2. Llamar registerCompleteVehicleWithPromotion()
// 3. Usuario automáticamente promovido a DRIVER
// 4. Subir fotos usando los IDs retornados
```

### Opción 2: Registro por Pasos
```typescript
// 1. Registrar vehículo con registerVehicle() → Promoción automática a DRIVER
// 2. Validar con validateVehicleDataNew() que todo esté correcto
// 3. Registrar documentos individuales (mantiene validaciones existentes)
// 4. Subir fotos por separado
```

---

## ⚠️ Validaciones Importantes Mantenidas

### ✅ Validación de Vehículo Requerido
Las funciones `registerDriverLicense()`, `registerPropertyCard()`, y `registerSoat()` **mantienen** la validación que requiere tener un vehículo registrado primero.

### ✅ Validaciones en Publicar Viaje
La página de publicar viaje **mantiene** todas las validaciones:
- Usuario debe ser DRIVER
- Usuario debe estar VERIFIED
- Usuario debe tener vehículo activo

### ✅ Modal Restrictivo de SOAT
El modal de SOAT **mantiene** el comportamiento restrictivo para validaciones críticas.

---

## 🎯 Beneficios de la Nueva Implementación

1. **🚀 UX Mejorada**: Registro completo en una sola llamada
2. **🔄 Promoción Automática**: No necesitas manejar manualmente el cambio de rol
3. **📊 Mejor Tracking**: Nuevas funciones de estado y validación
4. **📸 Subida Optimizada**: Endpoints específicos para cada tipo de foto
5. **⚡ Validación en Tiempo Real**: Validar placa mientras el usuario escribe
6. **🔒 Seguridad Mantenida**: Todas las validaciones existentes se mantienen

---

## 🔧 Migración de Código Existente

### Reemplazar funciones antiguas:
```typescript
// ❌ Antiguo
const result = await registerCompleteVehicleOptimized(data);

// ✅ Nuevo (con promoción automática)
const result = await registerCompleteVehicleWithPromotion(data);
```

### Usar nuevas funciones de fotos:
```typescript
// ❌ Antiguo
const result = await uploadVehiclePhoto(vehicleId, photoData);

// ✅ Nuevo (endpoint optimizado del backend)
const result = await uploadVehiclePhotoNew(vehicleId, photo_base64, filename);
```

---

## 📋 Lista de Verificación

- [x] ✅ Promoción automática PASSENGER → DRIVER implementada
- [x] ✅ Endpoint `/api/vehiculos/register-complete` integrado
- [x] ✅ Nuevas funciones de subida de fotos agregadas
- [x] ✅ Funciones de validación y estado mejoradas
- [x] ✅ Compatibilidad hacia atrás mantenida
- [x] ✅ Validaciones de seguridad preservadas
- [x] ✅ Build exitoso verificado

## 🎉 ¡Listo para usar!

El frontend ahora está completamente integrado con el backend optimizado y la promoción automática a DRIVER funciona correctamente.
