// Tipos básicos
export type DocumentType = 'property' | 'insurance' | 'license';

export interface DocumentTypeConfig {
  id: DocumentType;
  title: string;
  icon: 'FileText' | 'Shield';
  required: boolean;
  description: string;
}

// Interfaz para el formulario principal del vehículo
export interface VehicleFormData {
  brand: string;
  model: string;
  year: string;
  color: string;
  licensePlate: string;
  vin: string;
  lastMaintenanceDate: string;
  photo: File | null;
  photoPreview: string | null;
  documents: {
    [key in DocumentType]?: {
      complete: boolean;
      documentNumber: string;
      expeditionDate: string;
      expiryDate: string;
    };
  };
}

// Interfaz para errores de validación
export interface ValidationErrors {
  [key: string]: string;
}

// Interfaz para el estado de los documentos
export interface DocumentStatus {
  id: DocumentType;
  complete: boolean;
  required: boolean;
  lastUpdated?: Date;
}

// Interfaces específicas para cada tipo de documento
export interface BaseDocumentData {
  documentNumber: string;
  expeditionDate: string;
  expiryDate: string;
  expeditionCity: string;
  frontFile?: File;
  backFile?: File;
  frontPreview?: string;
  backPreview?: string;
}

export interface PropertyCardData extends BaseDocumentData {
  brand: string;
  model: string;
  engineNumber: string;
  chassisNumber: string;
  vin: string;
  cylinderCapacity: string;
  serviceType: 'particular' | 'publico' | 'diplomatico' | 'oficial';
  ownerType: 'persona' | 'empresa';
  ownerName: string;
  ownerDocument: string;
}

export interface InsuranceData extends BaseDocumentData {
  insuranceCompany: string;
  policyNumber: string;
  coverageType: string;
  coverageAmount: string;
}

export interface LicenseData extends BaseDocumentData {
  firstName: string;
  lastName: string;
  identificationNumber: string;
  address: string;
  licenseCategory: string;
  restrictions: string;
  bloodType: string;
  organDonor: boolean;
}

// Constantes
export const DOCUMENT_TYPES: DocumentTypeConfig[] = [
  { 
    id: 'property',
    title: 'Tarjeta de Propiedad',
    icon: 'FileText',
    required: true,
    description: 'Documento que certifica la propiedad legal del vehículo'
  },
  { 
    id: 'insurance',
    title: 'SOAT',
    icon: 'Shield',
    required: true,
    description: 'Seguro Obligatorio de Accidentes de Tránsito vigente'
  },
  { 
    id: 'license',
    title: 'Licencia de Conducción',
    icon: 'FileText',
    required: true,
    description: 'Licencia de conducción vigente del conductor principal'
  }
] as const;

export const VEHICLE_COLORS = [
  'Negro', 'Blanco', 'Gris', 'Plata', 'Rojo', 'Azul', 
  'Verde', 'Amarillo', 'Naranja', 'Marrón', 'Beige'
] as const;

export const CURRENT_YEAR = new Date().getFullYear();
export const AVAILABLE_YEARS = Array.from(
  { length: CURRENT_YEAR - 1900 + 1 }, 
  (_, i) => (CURRENT_YEAR - i).toString()
);

export const SERVICE_TYPES = [
  { value: 'particular', label: 'Particular' },
  { value: 'publico', label: 'Público' },
  { value: 'diplomatico', label: 'Diplomático' },
  { value: 'oficial', label: 'Oficial' }
] as const;

export const OWNER_TYPES = [
  { value: 'persona', label: 'Persona Natural' },
  { value: 'empresa', label: 'Persona Jurídica' }
] as const;

export const LICENSE_CATEGORIES = [
  { value: 'A1', label: 'A1 - Motocicletas hasta 125 cc' },
  { value: 'A2', label: 'A2 - Motocicletas más de 125 cc' },
  { value: 'B1', label: 'B1 - Automóviles particulares' },
  { value: 'B2', label: 'B2 - Camiones y buses particulares' },
  { value: 'C1', label: 'C1 - Automóviles servicio público' },
  { value: 'C2', label: 'C2 - Camiones servicio público' }
] as const;

export const BLOOD_TYPES = [
  'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'
] as const;

// Utilidades de validación
export const validateLicensePlate = (plate: string): boolean => {
  const regex = /^[A-Z]{3}\d{3}$/;
  return regex.test(plate.replace(/-/g, '').toUpperCase());
};

export const validateVIN = (vin: string): boolean => {
  const regex = /^[A-HJ-NPR-Z0-9]{17}$/;
  return regex.test(vin.toUpperCase());
};

export const validateFileSize = (file: File): boolean => {
  return file.size <= 5 * 1024 * 1024; // 5MB
};

export const validateFileType = (file: File): boolean => {
  return ['image/jpeg', 'image/png', 'image/heic'].includes(file.type);
};