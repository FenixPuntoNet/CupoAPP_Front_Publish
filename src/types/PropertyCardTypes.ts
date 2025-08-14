export const SERVICE_TYPES = [
  { value: 'private', label: 'Privado' },
  { value: 'public', label: 'Público' },
] as const;

export type ServiceType = typeof SERVICE_TYPES[number]['value'];

export interface PropertyCardData {
  propertyCardNumber: string;
  serviceType: ServiceType;
  passengerCapacity: string;
  cylinderCapacity: string;
  propertyCardExpeditionDate: string;
  frontFile?: File;
  backFile?: File;
  frontPreview?: string;
  backPreview?: string;
}