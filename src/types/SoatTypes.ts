export interface SoatFormData {
    // Información del documento
    policyNumber: string; // Número de póliza SOAT
    expeditionDate: string;
    expiryDate: string;

  
    // Información de la aseguradora
    insuranceCompany: string;
    identificationNumber: string; // numero de cedula del usuario

    // Archivos del documento
    frontFile?: File;
    backFile?: File;
    frontPreview?: string;
    backPreview?: string;
  }
  
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
  
