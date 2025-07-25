// Tipos principales para el sistema de vehículos
// Compatible con el backend API

// ==================== INTERFACES PRINCIPALES ====================

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
  created_at?: string;
  updated_at?: string;
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

// ==================== TIPOS PARA FORMULARIOS ====================

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

// ==================== CONSTANTES ====================

export const COLORS = [
  { value: 'Blanco', label: 'Blanco' },
  { value: 'Negro', label: 'Negro' },
  { value: 'Gris', label: 'Gris' },
  { value: 'Rojo', label: 'Rojo' },
  { value: 'Azul', label: 'Azul' },
  { value: 'Verde', label: 'Verde' },
  { value: 'Amarillo', label: 'Amarillo' },
  { value: 'Plata', label: 'Plata' },
] as const;

export const BODY_TYPES = [
  { value: 'Automovil', label: 'Automóvil' },
  { value: 'Camioneta', label: 'Camioneta' },
  { value: 'SUV', label: 'SUV' },
  { value: 'Van', label: 'Van' },
  { value: 'Pickup', label: 'Pick-up' },
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

export const SERVICE_TYPES = [
  { value: 'private', label: 'Privado' },
  { value: 'public', label: 'Público' },
] as const;

export const INSURANCE_COMPANIES = [
  { value: 'seguros_estado', label: 'Seguros del Estado' },
  { value: 'sura', label: 'Seguros Sura' },
  { value: 'bolivar', label: 'Seguros Bolívar' },
  { value: 'mapfre', label: 'Mapfre Seguros' },
  { value: 'liberty', label: 'Liberty Seguros' },
  { value: 'allianz', label: 'Allianz Seguros' },
  { value: 'axa_colpatria', label: 'AXA Colpatria' },
  { value: 'previsora', label: 'Previsora Seguros' },
] as const;

// ==================== TIPOS DE VALIDACIÓN ====================

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ==================== UTILIDADES DE VALIDACIÓN ====================

export const validatePlate = (plate: string): boolean => {
  const plateRegex = /^[A-Z]{3}\d{3}$/;
  return plateRegex.test(plate.toUpperCase());
};

export const validateVIN = (vin: string): boolean => {
  return vin.length === 17 && /^[A-HJ-NPR-Z0-9]+$/i.test(vin);
};

export const validateYear = (year: string): boolean => {
  const currentYear = new Date().getFullYear();
  const vehicleYear = parseInt(year);
  return vehicleYear >= 1990 && vehicleYear <= currentYear + 1;
};
