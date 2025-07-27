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
  engine_number: string;
  chassis_number: string;
  vin_number: string;
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
  engine_number: string;
  chassis_number: string;
  vin_number: string;
  photo_url?: string | null;
}

export interface PropertyCard {
  id: number;
  user_id: string;
  vehicle_id: number;
  license_number: string;
  identification_number: string;
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
  identification_number: string;
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
  identification_number: string;
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
  identification_number: string;
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
  identification_number: string;
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
  identification_number: string;
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
 * Registrar o actualizar vehículo
 */
export async function registerVehicle(vehicleData: VehicleFormData): Promise<{
  success: boolean;
  vehicle?: Vehicle;
  message?: string;
  error?: string;
}> {
  try {
    console.log('🚗 Making request to /vehiculos/register');
    console.log('🚗 Vehicle data being sent:', vehicleData);
    
    const response = await apiRequest('/vehiculos/register', {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    });

    console.log('🚗 Register vehicle response:', response);

    return response;
  } catch (error) {
    console.error('❌ Register vehicle service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al registrar vehículo'
    };
  }
}

/**
 * Subir foto del vehículo con compresión automática
 */
export async function uploadVehiclePhoto(
  vehicleId: number, 
  photoData: string | File, 
  filename?: string
): Promise<{
  success: boolean;
  message?: string;
  photo_url?: string | null;
  vehicle?: Vehicle;
  compression?: any;
  error?: string;
}> {
  try {
    let photo_base64: string;
    let finalFilename = filename;
    
    // Si es un archivo, comprimirlo automáticamente
    if (photoData instanceof File) {
      console.log('🔄 Compressing vehicle photo...');
      
      photo_base64 = await fileToBase64Compressed(photoData, 400); // 400KB para fotos de vehículos
      finalFilename = finalFilename || photoData.name;
      
      console.log('✅ Vehicle photo compressed successfully:', {
        originalSize: Math.round(photoData.size / 1024) + 'KB',
        compressedSize: Math.round(photo_base64.length / 1024) + 'KB',
        filename: finalFilename
      });
    } else {
      photo_base64 = photoData;
    }

    // Validar que la foto esté presente
    if (!photo_base64) {
      return {
        success: false,
        error: 'La foto es requerida'
      };
    }

    console.log('📸 Uploading vehicle photo:', { 
      vehicleId, 
      filename: finalFilename, 
      photoSize: Math.round(photo_base64.length / 1024) + 'KB'
    });

    const response = await apiRequest('/vehiculos/upload-vehicle-photo', {
      method: 'POST',
      body: JSON.stringify({
        vehicleId,
        photo_base64,
        filename: finalFilename
      }),
    });

    return response;
  } catch (error) {
    console.error('❌ Error uploading vehicle photo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al subir foto del vehículo'
    };
  }
}

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
 */
export async function registerPropertyCard(propertyData: PropertyCardFormData): Promise<{
  success: boolean;
  propertyCard?: PropertyCard;
  message?: string;
  error?: string;
}> {
  try {
    const response = await apiRequest('/vehiculos/property-card', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });

    return response;
  } catch (error) {
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
 */
export async function registerDriverLicense(licenseData: DriverLicenseFormData): Promise<{
  success: boolean;
  license?: DriverLicense;
  message?: string;
  error?: string;
}> {
  try {
    const response = await apiRequest('/vehiculos/driver-license', {
      method: 'POST',
      body: JSON.stringify(licenseData),
    });

    return response;
  } catch (error) {
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
export async function uploadDriverLicensePhotos(
  licenseId: number, 
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
  license?: DriverLicense;
  uploaded?: { front: boolean; back: boolean };
  compression?: any;
  message?: string;
  error?: string;
}> {
  try {
    console.log('🚀 [DEBUG] Starting license photo upload process...');
    
    // Debug files si se proporcionan
    if (photos.frontFile) {
      debugFileForUpload(photos.frontFile, 'front');
    }
    if (photos.backFile) {
      debugFileForUpload(photos.backFile, 'back');
    }

    // Si se proporcionan archivos, comprimirlos automáticamente
    let frontBase64 = photos.photo_front_base64;
    let backBase64 = photos.photo_back_base64;

    if (photos.frontFile) {
      console.log('🔄 Compressing front license photo...');
      try {
        frontBase64 = await fileToBase64Compressed(photos.frontFile, 450); // 450KB para documentos
        console.log('✅ Front photo compressed successfully');
      } catch (compressionError) {
        console.error('❌ Front photo compression failed:', compressionError);
        throw new Error(`Error al comprimir la foto frontal: ${compressionError instanceof Error ? compressionError.message : 'Error desconocido'}`);
      }
    }

    if (photos.backFile) {
      console.log('🔄 Compressing back license photo...');
      try {
        backBase64 = await fileToBase64Compressed(photos.backFile, 450); // 450KB para documentos
        console.log('✅ Back photo compressed successfully');
      } catch (compressionError) {
        console.error('❌ Back photo compression failed:', compressionError);
        throw new Error(`Error al comprimir la foto trasera: ${compressionError instanceof Error ? compressionError.message : 'Error desconocido'}`);
      }
    }

    // Asegurar que al menos una foto está presente
    if (!frontBase64 && !backBase64) {
      console.error('❌ No photos provided for upload');
      return {
        success: false,
        error: 'Al menos una foto (frontal o trasera) es requerida'
      };
    }

    // Debug: Validar el formato de las imágenes finales
    const debugInfo = {
      licenseId,
      hasFront: !!frontBase64,
      hasBack: !!backBase64,
      frontSize: frontBase64 ? Math.round(frontBase64.length / 1024) : 0,
      backSize: backBase64 ? Math.round(backBase64.length / 1024) : 0,
      frontFilename: photos.filename_front || photos.frontFile?.name,
      backFilename: photos.filename_back || photos.backFile?.name,
      frontBase64Preview: frontBase64 ? `${frontBase64.substring(0, 50)}...` : 'N/A',
      backBase64Preview: backBase64 ? `${backBase64.substring(0, 50)}...` : 'N/A'
    };

    console.log('📸 [DEBUG] Uploading compressed license photos with data:', debugInfo);

    // Preparar el cuerpo de la petición exactamente como espera el backend
    const requestBody = {
      licenseId: licenseId,
      photo_front_base64: frontBase64,
      photo_back_base64: backBase64,
      filename_front: photos.filename_front || photos.frontFile?.name,
      filename_back: photos.filename_back || photos.backFile?.name
    };

    // Remover campos undefined para evitar problemas
    Object.keys(requestBody).forEach(key => {
      if (requestBody[key as keyof typeof requestBody] === undefined) {
        delete requestBody[key as keyof typeof requestBody];
      }
    });

    console.log('📡 [DEBUG] Final request body structure:', {
      licenseId: requestBody.licenseId,
      hasFrontPhoto: !!requestBody.photo_front_base64,
      hasBackPhoto: !!requestBody.photo_back_base64,
      hasFrontFilename: !!requestBody.filename_front,
      hasBackFilename: !!requestBody.filename_back,
      frontPhotoSize: requestBody.photo_front_base64 ? `${Math.round(requestBody.photo_front_base64.length / 1024)}KB` : 'N/A',
      backPhotoSize: requestBody.photo_back_base64 ? `${Math.round(requestBody.photo_back_base64.length / 1024)}KB` : 'N/A'
    });

    console.log('🌐 [DEBUG] Making API request to /vehiculos/upload-license-photos...');
    
    const response = await apiRequest('/vehiculos/upload-license-photos', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    console.log('✅ [DEBUG] Upload response received:', {
      success: response.success,
      hasCompression: !!response.compression,
      message: response.message,
      hasLicense: !!response.license
    });

    return response;
  } catch (error) {
    console.error('❌ Error uploading license photos:', error);
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al subir fotos de licencia de conducir'
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
 */
export async function registerSoat(soatData: SoatFormData): Promise<{
  success: boolean;
  soat?: Soat;
  message?: string;
  error?: string;
}> {
  try {
    const response = await apiRequest('/vehiculos/soat', {
      method: 'POST',
      body: JSON.stringify(soatData),
    });

    return response;
  } catch (error) {
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
export async function uploadSoatPhotos(
  soatId: number, 
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
  soat?: Soat;
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
      console.log('🔄 Compressing front SOAT photo...');
      frontBase64 = await fileToBase64Compressed(photos.frontFile, 450); // 450KB para documentos
    }

    if (photos.backFile) {
      console.log('🔄 Compressing back SOAT photo...');
      backBase64 = await fileToBase64Compressed(photos.backFile, 450); // 450KB para documentos
    }

    // Asegurar que al menos una foto está presente
    if (!frontBase64 && !backBase64) {
      return {
        success: false,
        error: 'Al menos una foto (frontal o trasera) es requerida'
      };
    }

    console.log('📸 Uploading compressed SOAT photos:', {
      soatId,
      hasFront: !!frontBase64,
      hasBack: !!backBase64,
      frontSize: frontBase64 ? Math.round(frontBase64.length / 1024) : 0,
      backSize: backBase64 ? Math.round(backBase64.length / 1024) : 0,
      frontFilename: photos.filename_front || photos.frontFile?.name,
      backFilename: photos.filename_back || photos.backFile?.name
    });

    const response = await apiRequest('/vehiculos/upload-soat-photos', {
      method: 'POST',
      body: JSON.stringify({
        soatId,
        photo_front_base64: frontBase64,
        photo_back_base64: backBase64,
        filename_front: photos.filename_front || photos.frontFile?.name,
        filename_back: photos.filename_back || photos.backFile?.name
      }),
    });

    return response;
  } catch (error) {
    console.error('❌ Error uploading SOAT photos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al subir fotos del SOAT'
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
      
      const photoResponse = await uploadVehiclePhoto(
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

// Funciones legacy renombradas para compatibilidad
export const getUserVehicles = getMyVehicle;
export const createVehicle = registerVehicle;
export const updateVehicle = registerVehicle;
