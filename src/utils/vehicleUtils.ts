// Utilidades para el sistema de vehículos
// Funciones helper y validaciones

/**
 * Convierte un archivo a base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remover el prefijo "data:image/...;base64,"
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Valida el tamaño de un archivo
 */
export const validateFileSize = (file: File, maxSizeMB: number = 5): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Valida el tipo de archivo
 */
export const validateFileType = (file: File, allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/heic']): boolean => {
  return allowedTypes.includes(file.type);
};

/**
 * Formatea una fecha para el input date
 */
export const formatDateForInput = (dateString: string): string => {
  if (!dateString) return '';
  return dateString.split('T')[0];
};

/**
 * Valida formato de placa colombiana
 */
export const validatePlate = (plate: string): boolean => {
  const plateRegex = /^[A-Z]{3}\d{3}$/;
  return plateRegex.test(plate.toUpperCase());
};

/**
 * Valida formato de VIN
 */
export const validateVIN = (vin: string): boolean => {
  return vin.length === 17 && /^[A-HJ-NPR-Z0-9]+$/i.test(vin);
};

/**
 * Valida año del vehículo
 */
export const validateYear = (year: string): boolean => {
  const currentYear = new Date().getFullYear();
  const vehicleYear = parseInt(year);
  return vehicleYear >= 1990 && vehicleYear <= currentYear + 1;
};

/**
 * Valida número de cédula colombiana
 */
export const validateCedula = (cedula: string): boolean => {
  return /^\d{6,10}$/.test(cedula);
};

/**
 * Valida email
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Capitaliza la primera letra de cada palabra
 */
export const capitalizeWords = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Limpia y formatea número de placa
 */
export const formatPlate = (plate: string): string => {
  return plate.replace(/\s+/g, '').toUpperCase();
};

/**
 * Genera años disponibles para vehículos
 */
export const generateYearOptions = (startYear: number = 1990): Array<{ value: string; label: string }> => {
  const currentYear = new Date().getFullYear();
  const years = [];
  
  for (let year = currentYear + 1; year >= startYear; year--) {
    years.push({
      value: year.toString(),
      label: year.toString()
    });
  }
  
  return years;
};

/**
 * Comprueba si una fecha está vencida
 */
export const isDateExpired = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

/**
 * Calcula días hasta el vencimiento
 */
export const daysUntilExpiry = (dateString: string): number => {
  const expiryDate = new Date(dateString);
  const today = new Date();
  const diffTime = expiryDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Formatea el tamaño de archivo
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Genera un ID único
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>): void => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Manejo de errores consistente
 */
export const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Ha ocurrido un error inesperado';
};
