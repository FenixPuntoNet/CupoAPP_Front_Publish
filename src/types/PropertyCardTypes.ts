export const SERVICE_TYPES = [
  { value: 'private', label: 'Privado' },
  { value: 'public', label: 'Público' },
] as const;

export const IDENTIFICATION_TYPES = [
  { value: 'cc', label: 'Cédula de Ciudadanía' },
  { value: 'nit', label: 'NIT' },
  { value: 'ce', label: 'Cédula de Extranjería' },
  { value: 'passport', label: 'Pasaporte' },
] as const;

export type ServiceType = typeof SERVICE_TYPES[number]['value'];
export type IdentificationType = typeof IDENTIFICATION_TYPES[number]['value'];

export interface PropertyCardData {
  propertyCardNumber: string;
  identificationNumber: string | null;
  serviceType: ServiceType;
  passengerCapacity: string;
  cylinderCapacity: string;
  propertyCardExpeditionDate: string;
  frontFile?: File;
  backFile?: File;
  frontPreview?: string;
  backPreview?: string;
}