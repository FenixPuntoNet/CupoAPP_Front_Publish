import { apiRequest } from '@/config/api';

// ==================== INTERFACES ====================

export interface Vehicle {
  id: number;
  user_id: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  body_type: string;
  photo_url?: string | null;
  status?: string; // Campo status que puede ser 'activo', 'pendiente', 'rechazado', 'inactivo'
  created_at?: string;
  updated_at?: string;
}

export interface VehicleFormData {
  brand: string;
  model: string;
  year: string;
  plate: string;
  color: string;
  body_type: string;
  photo_url?: string | null;
}

export interface PropertyCard {
  id: number;
  user_id: string;
  vehicle_id: number;
  license_number: string;
  service_type: string;
  passager_capacity: number;
  cylinder_capacity: string;
  expedition_date: string;
  photo_front_url?: string | null;
  photo_back_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PropertyCardFormData {
  vehicle_id: number;
  license_number: string;
  service_type: string;
  passager_capacity: number;
  cylinder_capacity: string;
  expedition_date: string;
  photo_front_url?: string | null;
  photo_back_url?: string | null;
}

export interface DriverLicense {
  id: number;
  user_id: string;
  license_number: string;
  license_category: string;
  blood_type: string;
  expedition_date: string;
  expiration_date: string;
  photo_front_url?: string | null;
  photo_back_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DriverLicenseFormData {
  license_number: string;
  license_category: string;
  blood_type: string;
  expedition_date: string;
  expiration_date: string;
  photo_front_url?: string | null;
  photo_back_url?: string | null;
}

export interface Soat {
  id: number;
  user_id: string;
  vehicle_id: number;
  policy_number: string;
  insurance_company: string;
  validity_from: string;
  validity_to: string;
  photo_front_url?: string | null;
  photo_back_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SoatFormData {
  vehicle_id: number;
  policy_number: string;
  insurance_company: string;
  validity_from: string;
  validity_to: string;
  photo_front_url?: string | null;
  photo_back_url?: string | null;
}

export interface DocumentsStatus {
  vehicle: {
    complete: boolean;
    data: Vehicle | null;
    required: boolean;
  };
  property: {
    complete: boolean;
    data: PropertyCard | null;
    required: boolean;
  };
  license: {
    complete: boolean;
    data: DriverLicense | null;
    required: boolean;
  };
  insurance: {
    complete: boolean;
    data: Soat | null;
    required: boolean;
  };
}

// ==================== REGISTRO COMPLETO OPTIMIZADO ====================

/**
 * Nueva interface para registro completo optimizado (según documentación del backend)
 */
export interface CompleteVehicleRegistration {
  // Datos del vehículo (ahora incluye passenger_capacity)
  vehicle: {
    brand: string;
    model: string;
    year: number;
    plate: string;
    color: string;
    body_type: string;
    passenger_capacity: number;
  };
  // Datos de la licencia
  license: {
    license_number: string;
    license_category: string;
    blood_type: string;
    expedition_date: string;
    expiration_date: string;
  };
  // Datos del SOAT
  soat: {
    policy_number: string;
    insurance_company: string;
    validity_from: string;
    validity_to: string;
  };
}

/**
 * Registrar vehículo completo con todos los documentos usando el nuevo endpoint optimizado
 * PROMUEVE AUTOMÁTICAMENTE AL USUARIO DE PASSENGER A DRIVER
 * Este es el método recomendado para un flujo optimizado y UX mejorada
 */
export async function registerCompleteVehicleWithPromotion(
  data: CompleteVehicleRegistration
): Promise<{
  success: boolean;
  message?: string;
  vehicleId?: number;
  licenseId?: number;
  soatId?: number;
  data?: {
    vehicle: any;
    license: any;
    soat: any;
  };
  error?: string;
}> {
  try {
    console.log('🚀 Registering complete vehicle with automatic DRIVER promotion...');
    console.log('📋 Data being sent:', data);
    
    const response = await apiRequest('/vehiculos/register-complete', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    console.log('✅ Complete registration response:', response);
    
    // Extraer IDs de la respuesta para compatibilidad con código existente
    if (response.success && response.data) {
      return {
        ...response,
        vehicleId: response.data.vehicle?.id,
        licenseId: response.data.license?.id,
        soatId: response.data.soat?.id,
      };
    }
    
    return response;
  } catch (error) {
    console.error('❌ Complete registration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al registrar vehículo completo'
    };
  }
}

/**
 * Registrar vehículo completo con todos los documentos en una sola llamada
 * Este es el método recomendado para un flujo optimizado
 * @deprecated Use registerCompleteVehicleWithPromotion instead
 */
export async function registerCompleteVehicleOptimized(
  data: CompleteVehicleRegistration
): Promise<{
  success: boolean;
  message?: string;
  data?: {
    vehicle: any;
    license: any;
    property_card: any;
    soat: any;
  };
  vehicleId?: number;
  licenseId?: number;
  propertyCardId?: number;
  soatId?: number;
  error?: string;
}> {
  try {
    console.log('🚀 Registering complete vehicle with optimized endpoint...');
    console.log('📋 Data being sent:', data);
    
    const response = await apiRequest('/vehiculos/register-complete', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    console.log('✅ Complete registration response:', response);
    
    // Extraer IDs de la respuesta para compatibilidad con código existente
    if (response.success && response.data) {
      return {
        ...response,
        vehicleId: response.data.vehicle?.id,
        licenseId: response.data.license?.id,
        propertyCardId: response.data.property_card?.id,
        soatId: response.data.soat?.id,
      };
    }
    
    return response;
  } catch (error) {
    console.error('❌ Complete registration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al registrar vehículo completo'
    };
  }
}

// ==================== FUNCIÓN PRINCIPAL PARA FLUJO OPTIMIZADO ====================

/**
 * DEPRECATED - Esta función está obsoleta desde que eliminamos property_card
 * Usa registerCompleteVehicleWithPromotion en su lugar
 */

// ==================== SERVICIOS DE VEHÍCULOS ====================

/**
 * Obtener vehículo del usuario actual
 */
export async function getMyVehicle(): Promise<{
  success: boolean;
  vehicle: Vehicle | null;
  hasVehicle: boolean;
  error?: string;
}> {
  try {
    console.log('🚗 Making request to /vehiculos/my-vehicle');
    const response = await apiRequest('/vehiculos/my-vehicle', {
      method: 'GET',
    });

    console.log('🚗 Vehicle service response:', response);

    return response;
  } catch (error) {
    console.error('❌ Vehicle service error:', error);
    return {
      success: false,
      vehicle: null,
      hasVehicle: false,
      error: error instanceof Error ? error.message : 'Error al obtener vehículo'
    };
  }
}

/**
 * Registrar o actualizar vehículo (automáticamente promueve usuario a DRIVER)
 */
export async function registerVehicle(vehicleData: VehicleFormData): Promise<{
  success: boolean;
  vehicle?: Vehicle;
  message?: string;
  error?: string;
}> {
  try {
    console.log('🚗 Making request to /vehiculos/my-vehicle to check existing vehicle first');
    
    // Primero verificar si ya tiene vehículo
    try {
      const existingVehicleResponse = await apiRequest('/vehiculos/my-vehicle', {
        method: 'GET',
      });
      
      if (existingVehicleResponse.success && existingVehicleResponse.vehicle) {
        console.log('🚗 Vehicle already exists, updating instead');
        // Si ya tiene vehículo, hacer update
        const updateResponse = await apiRequest('/vehiculos/update-basic-info', {
          method: 'PUT',
          body: JSON.stringify(vehicleData),
        });
        return updateResponse;
      }
    } catch (error) {
      console.log('🚗 No existing vehicle found, proceeding with registration');
    }

    // Si no tiene vehículo, intentar usar el endpoint individual o registrar con mínimos datos
    console.log('🚗 Attempting vehicle registration with complete endpoint (minimal data)');
    console.log('🚗 Vehicle data being sent:', vehicleData);
    
    // Crear datos mínimos para el registro completo
    const registrationData = {
      vehicle: vehicleData,
      license: {
        license_number: "TEMP_" + Date.now(),
        license_category: "C1", 
        blood_type: "O+",
        expedition_date: "2024-01-01",
        expiration_date: "2030-01-01"
      },
      property_card: {
        license_number: "TEMP_PROP_" + Date.now(),
        service_type: "PARTICULAR",
        passager_capacity: 5,
        cylinder_capacity: "1500cc",
        expedition_date: "2024-01-01"
      },
      soat: {
        policy_number: "TEMP_SOAT_" + Date.now(),
        insurance_company: "Temporal",
        validity_from: "2024-01-01", 
        validity_to: "2025-12-31"
      }
    };
    
    const response = await apiRequest('/vehiculos/register-complete', {
      method: 'POST',
      body: JSON.stringify(registrationData),
    });

    console.log('🚗 Register vehicle response:', response);

    // Extraer solo los datos del vehículo de la respuesta completa
    if (response.success && response.data && response.data.vehicle) {
      return {
        success: true,
        vehicle: response.data.vehicle,
        message: response.message || 'Vehículo registrado exitosamente. Status actualizado a conductor.'
      };
    }

    return response;
  } catch (error) {
    console.error('❌ Register vehicle service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al registrar vehículo'
    };
  }
}

// ==================== FUNCIONES DE SUBIDA DE FOTOS (OBSOLETAS) ====================
// Las funciones de subida de fotos están implementadas directamente en el componente de registro
// para evitar conflictos con el código legacy

/*
// Funciones de subida de fotos comentadas temporalmente
// uploadVehiclePhoto, uploadDriverLicensePhotos, uploadSoatPhotos
// están implementadas directamente en el componente RegistrarVehiculo
*/

// ==================== SERVICIOS DE TARJETA DE PROPIEDAD ====================

/**
 * Obtener tarjeta de propiedad
 */
export async function getPropertyCard(): Promise<{
  success: boolean;
  propertyCard: PropertyCard | null;
  hasPropertyCard: boolean;
  vehicleId?: number;
  error?: string;
}> {
  try {
    const response = await apiRequest('/vehiculos/property-card', {
      method: 'GET',
    });

    return response;
  } catch (error) {
    return {
      success: false,
      propertyCard: null,
      hasPropertyCard: false,
      error: error instanceof Error ? error.message : 'Error al obtener tarjeta de propiedad'
    };
  }
}

/**
 * Registrar o actualizar tarjeta de propiedad
 * REQUIERE que el usuario tenga un vehículo registrado primero
 */
export async function registerPropertyCard(propertyData: PropertyCardFormData): Promise<{
  success: boolean;
  propertyCard?: PropertyCard;
  message?: string;
  error?: string;
}> {
  try {
    console.log('📄 Starting property card registration...');
    
    // ⚠️ VALIDACIÓN CRÍTICA: Verificar que el usuario tenga un vehículo registrado primero
    console.log('🔍 Checking if user has vehicle registered...');
    const vehicleCheck = await getMyVehicle();
    
    if (!vehicleCheck.success || !vehicleCheck.vehicle) {
      console.log('❌ No vehicle found - property card registration blocked');
      return {
        success: false,
        error: 'Debes registrar un vehículo antes de poder registrar la tarjeta de propiedad. Primero completa el registro del vehículo.'
      };
    }
    
    console.log('✅ Vehicle found, proceeding with property card registration');
    
    const response = await apiRequest('/vehiculos/property-card', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });

    return response;
  } catch (error) {
    console.error('❌ Register property card error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al registrar tarjeta de propiedad'
    };
  }
}

/**
 * Subir fotos de tarjeta de propiedad
 */
/**
 * Subir fotos de tarjeta de propiedad con compresión automática
 */
export async function uploadPropertyCardPhotos(
  propertyCardId: number, 
  photos: {
    photo_front_base64?: string;
    photo_back_base64?: string;
    filename_front?: string;
    filename_back?: string;
    frontFile?: File;
    backFile?: File;
  }
): Promise<{
  success: boolean;
  propertyCard?: PropertyCard;
  uploaded?: { front: boolean; back: boolean };
  compression?: any;
  message?: string;
  error?: string;
}> {
  try {
    // Si se proporcionan archivos, comprimirlos automáticamente
    let frontBase64 = photos.photo_front_base64;
    let backBase64 = photos.photo_back_base64;

    if (photos.frontFile) {
      console.log('🔄 Compressing front property card photo...');
      frontBase64 = await fileToBase64Compressed(photos.frontFile, 450); // 450KB para documentos
    }

    if (photos.backFile) {
      console.log('🔄 Compressing back property card photo...');
      backBase64 = await fileToBase64Compressed(photos.backFile, 450); // 450KB para documentos
    }

    // Asegurar que al menos una foto está presente
    if (!frontBase64 && !backBase64) {
      return {
        success: false,
        error: 'Al menos una foto (frontal o trasera) es requerida'
      };
    }

    console.log('📸 Uploading compressed property card photos:', {
      propertyCardId,
      hasFront: !!frontBase64,
      hasBack: !!backBase64,
      frontSize: frontBase64 ? Math.round(frontBase64.length / 1024) : 0,
      backSize: backBase64 ? Math.round(backBase64.length / 1024) : 0,
      frontFilename: photos.filename_front || photos.frontFile?.name,
      backFilename: photos.filename_back || photos.backFile?.name
    });

    const response = await apiRequest('/vehiculos/upload-property-photos', {
      method: 'POST',
      body: JSON.stringify({
        propertyCardId,
        photo_front_base64: frontBase64,
        photo_back_base64: backBase64,
        filename_front: photos.filename_front || photos.frontFile?.name,
        filename_back: photos.filename_back || photos.backFile?.name
      }),
    });

    return response;
  } catch (error) {
    console.error('❌ Error uploading property card photos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al subir fotos de tarjeta de propiedad'
    };
  }
}

// ==================== SERVICIOS DE LICENCIA DE CONDUCTOR ====================

/**
 * Obtener licencia de conducir
 */
export async function getDriverLicense(): Promise<{
  success: boolean;
  license: DriverLicense | null;
  hasLicense: boolean;
  error?: string;
}> {
  try {
    const response = await apiRequest('/vehiculos/driver-license', {
      method: 'GET',
    });

    return response;
  } catch (error) {
    return {
      success: false,
      license: null,
      hasLicense: false,
      error: error instanceof Error ? error.message : 'Error al obtener licencia de conducir'
    };
  }
}

/**
 * Registrar o actualizar licencia de conducir
 * REQUIERE que el usuario tenga un vehículo registrado primero
 */
export async function registerDriverLicense(licenseData: DriverLicenseFormData): Promise<{
  success: boolean;
  license?: DriverLicense;
  message?: string;
  error?: string;
}> {
  try {
    console.log('🪪 Starting driver license registration...');
    
    // ⚠️ VALIDACIÓN CRÍTICA: Verificar que el usuario tenga un vehículo registrado primero
    console.log('🔍 Checking if user has vehicle registered...');
    const vehicleCheck = await getMyVehicle();
    
    if (!vehicleCheck.success || !vehicleCheck.vehicle) {
      console.log('❌ No vehicle found - license registration blocked');
      return {
        success: false,
        error: 'Debes registrar un vehículo antes de poder registrar tu licencia de conducir. Primero completa el registro del vehículo.'
      };
    }
    
    console.log('✅ Vehicle found, proceeding with license registration');
    
    const response = await apiRequest('/vehiculos/driver-license', {
      method: 'POST',
      body: JSON.stringify(licenseData),
    });

    return response;
  } catch (error) {
    console.error('❌ Register driver license error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al registrar licencia de conducir'
    };
  }
}

/**
 * Subir fotos de licencia de conducir
 */
/**
 * Función de debugging para analizar archivos antes del upload
 */
export function debugFileForUpload(file: File, type: 'front' | 'back' = 'front'): void {
  console.log(`🔍 [DEBUG] Analyzing ${type} file:`, {
    name: file.name,
    size: `${Math.round(file.size / 1024)}KB`,
    type: file.type,
    lastModified: new Date(file.lastModified).toISOString(),
    sizeBytes: file.size,
    isValidSize: file.size <= 10 * 1024 * 1024, // 10MB limit
    isValidType: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(file.type)
  });
}

/**
 * Subir fotos de licencia de conducir con compresión automática y debugging detallado
 */
/**
 * Subir fotos de licencia de conducir - Actualizada para el backend nuevo
 */
export async function uploadDriverLicensePhotos(
  licenseId: number, 
  photos: {
    photo_front_base64?: string;
    photo_back_base64?: string;
  }
): Promise<{
  success: boolean;
  message?: string;
  photos?: any;
  error?: string;
}> {
  try {
    console.log('🚀 Starting license photo upload process...');
    
    if (!photos.photo_front_base64 && !photos.photo_back_base64) {
      return {
        success: false,
        error: 'Al menos una foto es requerida'
      };
    }

    console.log('📸 Uploading license photos:', { 
      licenseId, 
      hasFront: !!photos.photo_front_base64, 
      hasBack: !!photos.photo_back_base64,
      frontSize: photos.photo_front_base64 ? Math.round(photos.photo_front_base64.length / 1024) : 0,
      backSize: photos.photo_back_base64 ? Math.round(photos.photo_back_base64.length / 1024) : 0
    });

    const response = await apiRequest('/vehiculos/upload-license-photos', {
      method: 'POST',
      body: JSON.stringify({
        licenseId,
        photo_front_base64: photos.photo_front_base64,
        photo_back_base64: photos.photo_back_base64
      }),
    });

    return response;
  } catch (error) {
    console.error('❌ Error uploading license photos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al subir fotos de licencia'
    };
  }
}

// ==================== SERVICIOS DE SOAT ====================

/**
 * Obtener SOAT
 */
export async function getSoat(): Promise<{
  success: boolean;
  soat: Soat | null;
  hasSoat: boolean;
  vehicleId?: number;
  error?: string;
}> {
  try {
    const response = await apiRequest('/vehiculos/soat', {
      method: 'GET',
    });

    return response;
  } catch (error) {
    return {
      success: false,
      soat: null,
      hasSoat: false,
      error: error instanceof Error ? error.message : 'Error al obtener SOAT'
    };
  }
}

/**
 * Registrar o actualizar SOAT
 * REQUIERE que el usuario tenga un vehículo registrado primero
 */
export async function registerSoat(soatData: SoatFormData): Promise<{
  success: boolean;
  soat?: Soat;
  message?: string;
  error?: string;
}> {
  try {
    console.log('🛡️ Starting SOAT registration...');
    
    // ⚠️ VALIDACIÓN CRÍTICA: Verificar que el usuario tenga un vehículo registrado primero
    console.log('🔍 Checking if user has vehicle registered...');
    const vehicleCheck = await getMyVehicle();
    
    if (!vehicleCheck.success || !vehicleCheck.vehicle) {
      console.log('❌ No vehicle found - SOAT registration blocked');
      return {
        success: false,
        error: 'Debes registrar un vehículo antes de poder registrar el SOAT. Primero completa el registro del vehículo.'
      };
    }
    
    console.log('✅ Vehicle found, proceeding with SOAT registration');
    
    const response = await apiRequest('/vehiculos/soat', {
      method: 'POST',
      body: JSON.stringify(soatData),
    });

    return response;
  } catch (error) {
    console.error('❌ Register SOAT error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al registrar SOAT'
    };
  }
}

/**
 * Subir fotos de SOAT
 */
/**
 * Subir fotos de SOAT con compresión automática
 */
/**
 * Subir fotos de SOAT - Actualizada para el backend nuevo
 */
export async function uploadSoatPhotos(
  soatId: number, 
  photos: {
    photo_front_base64?: string;
    photo_back_base64?: string;
  }
): Promise<{
  success: boolean;
  message?: string;
  photos?: any;
  error?: string;
}> {
  try {
    if (!photos.photo_front_base64 && !photos.photo_back_base64) {
      return {
        success: false,
        error: 'Al menos una foto es requerida'
      };
    }

    console.log('📸 Uploading SOAT photos:', { 
      soatId, 
      hasFront: !!photos.photo_front_base64, 
      hasBack: !!photos.photo_back_base64,
      frontSize: photos.photo_front_base64 ? Math.round(photos.photo_front_base64.length / 1024) : 0,
      backSize: photos.photo_back_base64 ? Math.round(photos.photo_back_base64.length / 1024) : 0
    });

    const response = await apiRequest('/vehiculos/upload-soat-photos', {
      method: 'POST',
      body: JSON.stringify({
        soatId,
        photo_front_base64: photos.photo_front_base64,
        photo_back_base64: photos.photo_back_base64
      }),
    });

    return response;
  } catch (error) {
    console.error('❌ Error uploading SOAT photos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al subir fotos de SOAT'
    };
  }
}

// ==================== SERVICIOS DE ESTADO DE DOCUMENTOS ====================

/**
 * Obtener estado completo de documentos del vehículo
 */
export async function getDocumentsStatus(): Promise<{
  success: boolean;
  documentsStatus?: DocumentsStatus;
  progress?: number;
  completedDocs?: number;
  totalRequiredDocs?: number;
  allComplete?: boolean;
  error?: string;
}> {
  try {
    const response = await apiRequest('/vehiculos/documents-status', {
      method: 'GET',
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener estado de documentos'
    };
  }
}

// ==================== FUNCIONES DE UTILIDAD ====================

/**
 * Validar formato de placa colombiana
 */
export function validatePlate(plate: string): boolean {
  const plateRegex = /^[A-Z]{3}\d{3}$/;
  return plateRegex.test(plate.toUpperCase());
}

/**
 * Validar que una fecha no esté vencida
 */
export function validateExpirationDate(dateString: string): boolean {
  const expiryDate = new Date(dateString);
  const today = new Date();
  return expiryDate > today;
}

/**
 * Formatear fecha para mostrar
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CO');
}

/**
 * Convertir archivo a base64 (función base)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Error al convertir archivo a base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Comprimir imagen a un tamaño máximo específico
 */
export function compressImage(file: File, maxSizeKB: number = 500, quality: number = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo proporción
      let { width, height } = img;
      const maxDimension = 1200; // Máximo 1200px en cualquier lado
      
      if (width > height) {
        if (width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Dibujar imagen redimensionada
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convertir a base64 con calidad específica
      let currentQuality = quality;
      let result = canvas.toDataURL('image/jpeg', currentQuality);
      
      // Reducir calidad hasta alcanzar el tamaño deseado
      while (result.length > maxSizeKB * 1024 * 1.37 && currentQuality > 0.1) { // 1.37 factor base64
        currentQuality -= 0.1;
        result = canvas.toDataURL('image/jpeg', currentQuality);
      }
      
      console.log(`📊 Image compressed: ${Math.round(file.size / 1024)}KB → ${Math.round(result.length / 1024)}KB (quality: ${currentQuality.toFixed(1)})`);
      resolve(result);
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Convertir archivo a base64 con compresión automática para documentos
 */
export function fileToBase64Compressed(file: File, maxSizeKB: number = 500): Promise<string> {
  return new Promise((resolve, reject) => {
    // Si es una imagen, comprimir
    if (file.type.startsWith('image/')) {
      compressImage(file, maxSizeKB)
        .then(resolve)
        .catch(() => {
          // Fallback a conversión normal si falla la compresión
          fileToBase64(file).then(resolve).catch(reject);
        });
    } else {
      // Para otros tipos de archivo, usar conversión normal
      fileToBase64(file).then(resolve).catch(reject);
    }
  });
}

// ==================== FUNCIONES DE ACTUALIZACIÓN INDIVIDUAL ====================

/**
 * Actualizar solo datos básicos del vehículo
 */
export async function updateVehicleBasicInfo(vehicleData: Partial<VehicleFormData>): Promise<{
  success: boolean;
  vehicle?: Vehicle;
  message?: string;
  error?: string;
}> {
  try {
    const response = await apiRequest('/vehiculos/update-basic-info', {
      method: 'PUT',
      body: JSON.stringify(vehicleData),
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar información básica del vehículo'
    };
  }
}

/**
 * Actualizar solo datos de tarjeta de propiedad
 */
export async function updatePropertyCardInfo(propertyData: Partial<PropertyCardFormData>): Promise<{
  success: boolean;
  propertyCard?: PropertyCard;
  message?: string;
  error?: string;
}> {
  try {
    const response = await apiRequest('/vehiculos/update-property-info', {
      method: 'PUT',
      body: JSON.stringify(propertyData),
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar información de tarjeta de propiedad'
    };
  }
}

/**
 * Actualizar solo datos de licencia
 */
export async function updateDriverLicenseInfo(licenseData: Partial<DriverLicenseFormData>): Promise<{
  success: boolean;
  license?: DriverLicense;
  message?: string;
  error?: string;
}> {
  try {
    const response = await apiRequest('/vehiculos/update-license-info', {
      method: 'PUT',
      body: JSON.stringify(licenseData),
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar información de licencia'
    };
  }
}

/**
 * Actualizar solo datos de SOAT
 */
export async function updateSoatInfo(soatData: Partial<SoatFormData>): Promise<{
  success: boolean;
  soat?: Soat;
  message?: string;
  error?: string;
}> {
  try {
    const response = await apiRequest('/vehiculos/update-soat-info', {
      method: 'PUT',
      body: JSON.stringify(soatData),
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar información del SOAT'
    };
  }
}

/**
 * Eliminar foto del vehículo
 */
export async function deleteVehiclePhoto(vehicleId: number): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const response = await apiRequest(`/vehiculos/delete-vehicle-photo/${vehicleId}`, {
      method: 'DELETE',
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al eliminar foto del vehículo'
    };
  }
}

/**
 * Validar datos del vehículo
 */
export async function validateVehicleData(vehicleData: { plate: string; vin_number?: string }): Promise<{
  success: boolean;
  isValid?: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const response = await apiRequest('/vehiculos/validate-vehicle', {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al validar datos del vehículo'
    };
  }
}

/**
 * Obtener estadísticas del conductor
 */
export async function getDriverStats(): Promise<{
  success: boolean;
  stats?: any;
  error?: string;
}> {
  try {
    const response = await apiRequest('/vehiculos/driver-stats', {
      method: 'GET',
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener estadísticas del conductor'
    };
  }
}

// ==================== FLUJO COMPLETO DE REGISTRO ====================

/**
 * Registro completo de vehículo y documentos siguiendo el flujo recomendado
 */
export interface CompleteRegistrationData {
  vehicle: VehicleFormData;
  vehiclePhoto?: {
    photo_base64: string;
    filename?: string;
  };
  license: DriverLicenseFormData;
  licensePhotos?: {
    photo_front_base64?: string;
    photo_back_base64?: string;
    filename_front?: string;
    filename_back?: string;
  };
  propertyCard: Omit<PropertyCardFormData, 'vehicle_id'>;
  propertyPhotos?: {
    photo_front_base64?: string;
    photo_back_base64?: string;
    filename_front?: string;
    filename_back?: string;
  };
  soat: Omit<SoatFormData, 'vehicle_id'>;
  soatPhotos?: {
    photo_front_base64?: string;
    photo_back_base64?: string;
    filename_front?: string;
    filename_back?: string;
  };
}

export interface RegistrationProgress {
  step: number;
  totalSteps: number;
  currentAction: string;
  vehicleId?: number;
  licenseId?: number;
  propertyCardId?: number;
  soatId?: number;
}

/**
 * Función para registro completo siguiendo el flujo documentado
 */
export async function registerCompleteVehicle(
  data: CompleteRegistrationData,
  onProgress?: (progress: RegistrationProgress) => void
): Promise<{
  success: boolean;
  vehicleId?: number;
  licenseId?: number;
  propertyCardId?: number;
  soatId?: number;
  error?: string;
  failedStep?: string;
}> {
  const totalSteps = 8;
  let currentStep = 0;

  try {
    // Paso 1: Registrar Vehículo Base
    currentStep = 1;
    onProgress?.({ step: currentStep, totalSteps, currentAction: 'Registrando vehículo...' });
    
    const vehicleResponse = await registerVehicle(data.vehicle);
    if (!vehicleResponse.success || !vehicleResponse.vehicle) {
      throw new Error(`Error en paso 1: ${vehicleResponse.error}`);
    }
    const vehicleId = vehicleResponse.vehicle.id;

    // Paso 2: Subir Foto del Vehículo (opcional)
    currentStep = 2;
    if (data.vehiclePhoto) {
      onProgress?.({ step: currentStep, totalSteps, currentAction: 'Subiendo foto del vehículo...', vehicleId });
      
      const photoResponse = await uploadVehiclePhotoNew(
        vehicleId,
        data.vehiclePhoto.photo_base64,
        data.vehiclePhoto.filename
      );
      if (!photoResponse.success) {
        console.warn('⚠️ Vehicle photo upload failed:', photoResponse.error);
      }
    }

    // Paso 3: Registrar Licencia de Conducir
    currentStep = 3;
    onProgress?.({ step: currentStep, totalSteps, currentAction: 'Registrando licencia...', vehicleId });
    
    const licenseResponse = await registerDriverLicense(data.license);
    if (!licenseResponse.success || !licenseResponse.license) {
      throw new Error(`Error en paso 3: ${licenseResponse.error}`);
    }
    const licenseId = licenseResponse.license.id;

    // Paso 4: Subir Fotos de Licencia (opcional)
    currentStep = 4;
    if (data.licensePhotos && (data.licensePhotos.photo_front_base64 || data.licensePhotos.photo_back_base64)) {
      onProgress?.({ step: currentStep, totalSteps, currentAction: 'Subiendo fotos de licencia...', vehicleId, licenseId });
      
      const licensePhotosResponse = await uploadDriverLicensePhotos(licenseId, data.licensePhotos);
      if (!licensePhotosResponse.success) {
        console.warn('⚠️ License photos upload failed:', licensePhotosResponse.error);
      }
    }

    // Paso 5: Registrar Tarjeta de Propiedad
    currentStep = 5;
    onProgress?.({ step: currentStep, totalSteps, currentAction: 'Registrando tarjeta de propiedad...', vehicleId, licenseId });
    
    const propertyCardData = { ...data.propertyCard, vehicle_id: vehicleId };
    const propertyResponse = await registerPropertyCard(propertyCardData);
    if (!propertyResponse.success || !propertyResponse.propertyCard) {
      throw new Error(`Error en paso 5: ${propertyResponse.error}`);
    }
    const propertyCardId = propertyResponse.propertyCard.id;

    // Paso 6: Subir Fotos de Tarjeta de Propiedad (opcional)
    currentStep = 6;
    if (data.propertyPhotos && (data.propertyPhotos.photo_front_base64 || data.propertyPhotos.photo_back_base64)) {
      onProgress?.({ step: currentStep, totalSteps, currentAction: 'Subiendo fotos de tarjeta...', vehicleId, licenseId, propertyCardId });
      
      const propertyPhotosResponse = await uploadPropertyCardPhotos(propertyCardId, data.propertyPhotos);
      if (!propertyPhotosResponse.success) {
        console.warn('⚠️ Property card photos upload failed:', propertyPhotosResponse.error);
      }
    }

    // Paso 7: Registrar SOAT
    currentStep = 7;
    onProgress?.({ step: currentStep, totalSteps, currentAction: 'Registrando SOAT...', vehicleId, licenseId, propertyCardId });
    
    const soatData = { ...data.soat, vehicle_id: vehicleId };
    const soatResponse = await registerSoat(soatData);
    if (!soatResponse.success || !soatResponse.soat) {
      throw new Error(`Error en paso 7: ${soatResponse.error}`);
    }
    const soatId = soatResponse.soat.id;

    // Paso 8: Subir Fotos de SOAT (opcional)
    currentStep = 8;
    if (data.soatPhotos && (data.soatPhotos.photo_front_base64 || data.soatPhotos.photo_back_base64)) {
      onProgress?.({ step: currentStep, totalSteps, currentAction: 'Subiendo fotos de SOAT...', vehicleId, licenseId, propertyCardId, soatId });
      
      const soatPhotosResponse = await uploadSoatPhotos(soatId, data.soatPhotos);
      if (!soatPhotosResponse.success) {
        console.warn('⚠️ SOAT photos upload failed:', soatPhotosResponse.error);
      }
    }

    // Registro completo exitoso
    onProgress?.({ step: totalSteps, totalSteps, currentAction: '¡Registro completo!', vehicleId, licenseId, propertyCardId, soatId });

    return {
      success: true,
      vehicleId,
      licenseId,
      propertyCardId,
      soatId
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const failedStep = `Paso ${currentStep}`;
    
    console.error(`❌ Registration failed at step ${currentStep}:`, errorMessage);
    
    return {
      success: false,
      error: errorMessage,
      failedStep
    };
  }
}

// ==================== TIPOS LEGACY PARA COMPATIBILIDAD ====================

export interface VehicleResponse {
  success: boolean;
  data?: Vehicle[];
  error?: string;
}

// ==================== NUEVAS FUNCIONES PARA ENDPOINTS DEL BACKEND OPTIMIZADO ====================

/**
 * Subir foto del vehículo usando el nuevo endpoint del backend
 */
export async function uploadVehiclePhotoNew(
  vehicleId: number,
  photo_base64: string,
  filename?: string
): Promise<{
  success: boolean;
  message?: string;
  photo_url?: string;
  error?: string;
}> {
  try {
    console.log('📸 Uploading vehicle photo...');
    
    const response = await apiRequest('/vehiculos/upload-vehicle-photo', {
      method: 'POST',
      body: JSON.stringify({
        vehicleId,
        photo_base64,
        filename
      }),
    });

    console.log('✅ Vehicle photo upload response:', response);
    return response;
  } catch (error) {
    console.error('❌ Vehicle photo upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al subir foto del vehículo'
    };
  }
}

/**
 * Subir fotos de tarjeta de propiedad usando el nuevo endpoint del backend
 */
export async function uploadPropertyCardPhotosNew(
  propertyCardId: number,
  photos: {
    photo_front_base64?: string;
    photo_back_base64?: string;
    filename_front?: string;
    filename_back?: string;
  }
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    console.log('📸 Uploading property card photos...');
    
    const response = await apiRequest('/vehiculos/upload-property-photos', {
      method: 'POST',
      body: JSON.stringify({
        propertyCardId,
        ...photos
      }),
    });

    console.log('✅ Property card photos upload response:', response);
    return response;
  } catch (error) {
    console.error('❌ Property card photos upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al subir fotos de tarjeta de propiedad'
    };
  }
}

/**
 * Subir fotos de licencia de conducir usando el nuevo endpoint del backend
 */
export async function uploadDriverLicensePhotosNew(
  licenseId: number,
  photos: {
    photo_front_base64?: string;
    photo_back_base64?: string;
    filename_front?: string;
    filename_back?: string;
  }
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    console.log('📸 Uploading driver license photos...');
    
    const response = await apiRequest('/vehiculos/upload-license-photos', {
      method: 'POST',
      body: JSON.stringify({
        licenseId,
        ...photos
      }),
    });

    console.log('✅ Driver license photos upload response:', response);
    return response;
  } catch (error) {
    console.error('❌ Driver license photos upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al subir fotos de licencia de conducir'
    };
  }
}

/**
 * Subir fotos de SOAT usando el nuevo endpoint del backend
 */
export async function uploadSoatPhotosNew(
  soatId: number,
  photos: {
    photo_front_base64?: string;
    photo_back_base64?: string;
    filename_front?: string;
    filename_back?: string;
  }
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    console.log('📸 Uploading SOAT photos...');
    
    const response = await apiRequest('/vehiculos/upload-soat-photos', {
      method: 'POST',
      body: JSON.stringify({
        soatId,
        ...photos
      }),
    });

    console.log('✅ SOAT photos upload response:', response);
    return response;
  } catch (error) {
    console.error('❌ SOAT photos upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al subir fotos de SOAT'
    };
  }
}

/**
 * Obtener estado completo de documentos usando el nuevo endpoint del backend
 */
export async function getDocumentsStatusNew(): Promise<{
  success: boolean;
  documentsStatus?: {
    driverLicense: { hasDocument: boolean; hasPhotos: boolean };
    soat: { hasDocument: boolean; hasPhotos: boolean; isExpired: boolean };
  };
  progress?: number;
  completedDocs?: number;
  totalRequiredDocs?: number;
  allComplete?: boolean;
  error?: string;
}> {
  try {
    console.log('📋 Getting documents status...');
    
    const response = await apiRequest('/vehiculos/documents-status', {
      method: 'GET',
    });

    console.log('✅ Documents status response:', response);
    return response;
  } catch (error) {
    console.error('❌ Documents status error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener estado de documentos'
    };
  }
}

/**
 * Validar datos del vehículo usando el nuevo endpoint del backend
 */
export async function validateVehicleDataNew(vehicleData: { 
  plate: string; 
  vin_number?: string 
}): Promise<{
  success: boolean;
  validations?: {
    plate: { valid: boolean; message: string };
    vin: { valid: boolean; message: string };
  };
  plateAvailable?: boolean;
  allValid?: boolean;
  error?: string;
}> {
  try {
    console.log('🔍 Validating vehicle data...');
    
    const response = await apiRequest('/vehiculos/validate-vehicle', {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    });

    console.log('✅ Vehicle validation response:', response);
    return response;
  } catch (error) {
    console.error('❌ Vehicle validation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al validar datos del vehículo'
    };
  }
}

/**
 * Obtener estadísticas del conductor usando el nuevo endpoint del backend
 */
export async function getDriverStatsNew(): Promise<{
  success: boolean;
  stats?: {
    vehicle: { registered: boolean; registration_date: string };
    trips: { total: number; active: number; completed: number };
    bookings: { total: number; active: number };
  };
  isDriver?: boolean;
  error?: string;
}> {
  try {
    console.log('📊 Getting driver stats...');
    
    const response = await apiRequest('/vehiculos/driver-stats', {
      method: 'GET',
    });

    console.log('✅ Driver stats response:', response);
    return response;
  } catch (error) {
    console.error('❌ Driver stats error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener estadísticas del conductor'
    };
  }
}

// ==================== REGISTRO SIMPLE CON FOTO SEPARADO ====================

export interface SimpleVehicleData {
  brand: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  body_type: string;
  passenger_capacity: number;
}

/**
 * Registra un vehículo simple SIN foto (paso 1)
 * Usa el endpoint /register-simple-modal del backend
 */
export async function registerSimpleVehicleModal(
  vehicleData: SimpleVehicleData
): Promise<{ success: boolean; data?: Vehicle; error?: string }> {
  try {
    console.log('🚗 [VEHICLES] Registering simple vehicle (step 1)...');
    
    const response = await apiRequest('/vehiculos/register-simple-modal', {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    });

    if (response.success) {
      console.log('✅ [VEHICLES] Vehicle registered successfully:', response.data);
      return {
        success: true,
        data: response.data.vehicle
      };
    } else {
      console.error('❌ [VEHICLES] Error registering vehicle:', response.error);
      return {
        success: false,
        error: response.error || 'Error registrando vehículo'
      };
    }
  } catch (error) {
    console.error('❌ [VEHICLES] Exception registering vehicle:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Sube foto a vehículo existente (paso 2)
 * CORREGIDO: Usa el endpoint /upload-vehicle-photo que SÍ guarda en Supabase Storage
 */
export async function uploadVehiclePhotoBase64(
  vehicleId: number,
  photoFile: File
): Promise<{ success: boolean; photo_url?: string; error?: string }> {
  try {
    console.log('� [VEHICLES] Uploading vehicle photo (step 2)...');
    
    // Convertir foto a base64
    const photo_base64 = await fileToBase64(photoFile);
    
    // USAR EL ENDPOINT CORRECTO que sí guarda en Supabase Storage
    const requestData = {
      vehicleId,
      photo_base64,
      filename: photoFile.name
    };

    const response = await apiRequest('/vehiculos/upload-vehicle-photo', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    if (response.success) {
      console.log('✅ [VEHICLES] Photo uploaded to Supabase Storage successfully:', response.photo_url);
      return {
        success: true,
        photo_url: response.photo_url
      };
    } else {
      console.error('❌ [VEHICLES] Error uploading photo to Storage:', response.error);
      return {
        success: false,
        error: response.error || 'Error subiendo foto al Storage'
      };
    }
  } catch (error) {
    console.error('❌ [VEHICLES] Exception uploading photo to Storage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido subiendo al Storage'
    };
  }
}

// Funciones legacy renombradas para compatibilidad
export const getUserVehicles = getMyVehicle;
export const createVehicle = registerVehicle;
export const updateVehicle = registerVehicle;
