// types/LicenseTypes.ts

export const LICENSE_CATEGORIES = [
    { value: 'B1', label: 'B1 - Automóviles particulares' },
    { value: 'B2', label: 'B2 - Camionetas y vans particulares' },
    { value: 'B3', label: 'B3 - Automóviles y camionetas especiales' }
  ] as const;
  
  export const BLOOD_TYPES = [
    'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'
  ] as const;
  
  export interface LicenseFormData {
    type: 'license';
    firstName: string;
    lastName: string;
    documentNumber: string;
    expeditionDate: string;
    expiryDate: string;
    expeditionCity: string;
    licenseCategory: typeof LICENSE_CATEGORIES[number]['value'];
    bloodType: typeof BLOOD_TYPES[number];
    restrictions?: string;
    frontFile?: File;
    backFile?: File;
    frontPreview?: string;
    backPreview?: string;
  }
  
  export type LicenseStatus = {
    id: string;
    complete: boolean;
    required: boolean;
  }