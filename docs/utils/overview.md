# Utilidades

## Visión General

Las utilidades en CupoApp son funciones helper y servicios auxiliares que proporcionan funcionalidades comunes reutilizables en toda la aplicación.

## Utilidades Principales

### 1. `lib/utils.ts` - Utilidades Generales

Funciones helper comunes para toda la aplicación.

#### Funciones de Formato
```typescript
// Formatear números como moneda
export const formatCurrency = (amount: number, currency = 'COP'): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Formatear fechas en español
export const formatDate = (date: Date | string, format = 'long'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'short') {
    return dateObj.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  return dateObj.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Formatear tiempo relativo
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Ahora';
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Hace ${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `Hace ${diffInDays}d`;
  
  return formatDate(dateObj, 'short');
};
```

#### Funciones de Validación
```typescript
// Validar email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validar teléfono colombiano
export const isValidColombianPhone = (phone: string): boolean => {
  const phoneRegex = /^(?:\+57\s?)?(?:3[0-9]{9}|[1-8][0-9]{6})$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Validar cédula colombiana
export const isValidColombianId = (id: string): boolean => {
  const cleanId = id.replace(/\D/g, '');
  if (cleanId.length < 6 || cleanId.length > 10) return false;
  
  // Algoritmo de validación de cédula
  let sum = 0;
  for (let i = 0; i < cleanId.length - 1; i++) {
    let digit = parseInt(cleanId[i]);
    if ((cleanId.length - i) % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(cleanId[cleanId.length - 1]);
};

// Validar fortaleza de contraseña
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 8) score++;
  else feedback.push('Mínimo 8 caracteres');
  
  if (/[a-z]/.test(password)) score++;
  else feedback.push('Al menos una minúscula');
  
  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Al menos una mayúscula');
  
  if (/\d/.test(password)) score++;
  else feedback.push('Al menos un número');
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  else feedback.push('Al menos un carácter especial');
  
  return {
    isValid: score >= 4,
    score,
    feedback
  };
};
```

#### Funciones de Manipulación de Datos
```typescript
// Eliminar acentos de strings
export const removeAccents = (str: string): string => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

// Capitalizar primera letra
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Truncar texto
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// Generar ID único
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};
```

### 2. `lib/contentModeration.ts` - Moderación de Contenido

Sistema de moderación automática de contenido.

#### Funciones de Moderación
```typescript
// Palabras prohibidas y filtros
const PROHIBITED_WORDS = [
  // Lista de palabras prohibidas
  'spam', 'scam', 'fraude', /* ... */
];

// Detectar contenido inapropiado
export const detectInappropriateContent = (text: string): {
  isInappropriate: boolean;
  reasons: string[];
  confidence: number;
} => {
  const reasons: string[] = [];
  let score = 0;
  
  const normalizedText = removeAccents(text.toLowerCase());
  
  // Verificar palabras prohibidas
  PROHIBITED_WORDS.forEach(word => {
    if (normalizedText.includes(word)) {
      reasons.push(`Contiene palabra prohibida: ${word}`);
      score += 10;
    }
  });
  
  // Verificar patrones sospechosos
  if (/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/.test(text)) {
    reasons.push('Posible número de tarjeta de crédito');
    score += 15;
  }
  
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) {
    reasons.push('Posible número de seguro social');
    score += 15;
  }
  
  // Verificar spam patterns
  if (text.includes('gana dinero') || text.includes('oferta especial')) {
    reasons.push('Posible spam');
    score += 5;
  }
  
  return {
    isInappropriate: score >= 10,
    reasons,
    confidence: Math.min(score / 20, 1)
  };
};

// Limpiar texto automáticamente
export const cleanText = (text: string): string => {
  let cleanedText = text;
  
  // Eliminar URLs
  cleanedText = cleanedText.replace(/https?:\/\/[^\s]+/g, '[URL removida]');
  
  // Eliminar emails
  cleanedText = cleanedText.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[Email removido]');
  
  // Eliminar números de teléfono
  cleanedText = cleanedText.replace(/\+?[\d\s-()]{10,}/g, '[Teléfono removido]');
  
  return cleanedText.trim();
};
```

### 3. `lib/assumptionsService.ts` - Servicio de Configuraciones

Gestión de configuraciones y assumptions del sistema.

#### Funciones de Configuración
```typescript
// Cache de assumptions
let cachedAssumptions: Assumptions | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Obtener assumptions con cache
export const getCachedAssumptions = async (): Promise<Assumptions | null> => {
  const now = Date.now();
  
  if (cachedAssumptions && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('📦 Using cached assumptions');
    return cachedAssumptions;
  }
  
  try {
    const assumptions = await getAssumptions();
    if (assumptions) {
      cachedAssumptions = assumptions;
      cacheTimestamp = now;
      console.log('🔄 Assumptions cached');
    }
    return assumptions;
  } catch (error) {
    console.error('Error loading assumptions:', error);
    return cachedAssumptions; // Devolver cache aunque esté expirado
  }
};

// Invalidar cache
export const invalidateAssumptionsCache = (): void => {
  cachedAssumptions = null;
  cacheTimestamp = 0;
  console.log('🗑️ Assumptions cache invalidated');
};

// Calcular precio local (fallback)
export const calculateLocalPrice = (distanceKm: number): number => {
  const BASE_PRICE = 5000;
  const PRICE_PER_KM_URBAN = 1200;
  const PRICE_PER_KM_HIGHWAY = 800;
  const URBAN_THRESHOLD = 20;
  
  const isUrban = distanceKm <= URBAN_THRESHOLD;
  const pricePerKm = isUrban ? PRICE_PER_KM_URBAN : PRICE_PER_KM_HIGHWAY;
  
  return BASE_PRICE + (distanceKm * pricePerKm);
};
```

### 4. `utils/debugTrip.ts` - Debugging de Viajes

Utilidades para debugging y desarrollo.

#### Funciones de Debug
```typescript
// Debug global para trips
declare global {
  interface Window {
    debugTrip: {
      logTripData: (tripId: number) => void;
      clearTripCache: () => void;
      simulateError: (type: string) => void;
      exportTripData: (tripId: number) => void;
    };
  }
}

// Logging de datos de viaje
const logTripData = (tripId: number): void => {
  console.group(`🚗 Trip Debug: ${tripId}`);
  
  // Logs de localStorage
  console.log('📦 LocalStorage data:');
  Object.keys(localStorage).forEach(key => {
    if (key.includes('trip') || key.includes(tripId.toString())) {
      console.log(`  ${key}:`, localStorage.getItem(key));
    }
  });
  
  // Logs de API calls recientes
  console.log('🌐 Recent API calls:');
  // Implementar logging de API calls
  
  console.groupEnd();
};

// Simular errores para testing
const simulateError = (type: string): void => {
  switch (type) {
    case 'network':
      // Simular error de red
      throw new Error('Network error simulated');
    case 'auth':
      // Simular error de autenticación
      localStorage.removeItem('auth_token');
      break;
    case 'server':
      // Simular error del servidor
      throw new Error('Server error simulated');
    default:
      console.log('Available error types: network, auth, server');
  }
};

// Exportar datos de viaje
const exportTripData = (tripId: number): void => {
  const data = {
    tripId,
    localStorage: Object.fromEntries(
      Object.entries(localStorage).filter(([key]) => 
        key.includes('trip') || key.includes(tripId.toString())
      )
    ),
    timestamp: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { 
    type: 'application/json' 
  });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `trip-debug-${tripId}-${Date.now()}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
};

// Registrar funciones globales en desarrollo
if (import.meta.env.DEV) {
  window.debugTrip = {
    logTripData,
    clearTripCache: () => {
      Object.keys(localStorage).forEach(key => {
        if (key.includes('trip')) {
          localStorage.removeItem(key);
        }
      });
      console.log('🗑️ Trip cache cleared');
    },
    simulateError,
    exportTripData
  };
  
  console.log('🔧 Debug utilities available at window.debugTrip');
}
```

### 5. Utilidades de Geolocalización

#### Funciones de Ubicación
```typescript
// Obtener ubicación actual
export const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
      }
    );
  });
};

// Calcular distancia entre dos puntos
export const calculateDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Verificar si está en Colombia
export const isInColombia = (lat: number, lng: number): boolean => {
  // Bounds aproximados de Colombia
  const colombiaBounds = {
    north: 13.5,
    south: -4.2,
    east: -66.8,
    west: -81.7
  };
  
  return lat >= colombiaBounds.south && 
         lat <= colombiaBounds.north && 
         lng >= colombiaBounds.west && 
         lng <= colombiaBounds.east;
};
```

### 6. Utilidades de Performance

#### Funciones de Optimización
```typescript
// Lazy loading de imágenes
export const setupLazyLoading = (): void => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        }
      });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
};

// Preload de recursos críticos
export const preloadCriticalResources = (): void => {
  const criticalImages = [
    '/logo.png',
    '/hero-bg.jpg'
  ];
  
  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
};

// Performance monitoring
export const measurePerformance = (name: string, fn: () => void): void => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`⏱️ ${name}: ${end - start}ms`);
};
```

### 7. Utilidades de Almacenamiento

#### LocalStorage Tipado
```typescript
interface StorageData {
  user_preferences: UserPreferences;
  trip_draft: TripDraft;
  search_history: SearchHistory[];
  cached_routes: CachedRoute[];
}

class TypedStorage {
  static get<K extends keyof StorageData>(
    key: K
  ): StorageData[K] | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }
  
  static set<K extends keyof StorageData>(
    key: K, 
    value: StorageData[K]
  ): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }
  
  static remove<K extends keyof StorageData>(key: K): void {
    localStorage.removeItem(key);
  }
  
  static clear(): void {
    localStorage.clear();
  }
}

export { TypedStorage };
```

### 8. Utilidades de Errores

#### Manejo de Errores
```typescript
// Clasificar tipos de error
export const classifyError = (error: any): {
  type: 'network' | 'auth' | 'validation' | 'server' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
} => {
  if (error.name === 'NetworkError' || error.message.includes('network')) {
    return {
      type: 'network',
      severity: 'medium',
      message: 'Error de conexión. Verifica tu internet.'
    };
  }
  
  if (error.status === 401 || error.message.includes('unauthorized')) {
    return {
      type: 'auth',
      severity: 'high',
      message: 'Sesión expirada. Por favor inicia sesión nuevamente.'
    };
  }
  
  if (error.status >= 400 && error.status < 500) {
    return {
      type: 'validation',
      severity: 'low',
      message: 'Datos inválidos. Verifica la información ingresada.'
    };
  }
  
  if (error.status >= 500) {
    return {
      type: 'server',
      severity: 'critical',
      message: 'Error del servidor. Intenta nuevamente en unos momentos.'
    };
  }
  
  return {
    type: 'unknown',
    severity: 'medium',
    message: 'Ocurrió un error inesperado.'
  };
};

// Log de errores estructurado
export const logError = (error: any, context?: string): void => {
  const errorInfo = classifyError(error);
  
  console.error(`🚨 [${errorInfo.type.toUpperCase()}] ${context || 'Unknown'}:`, {
    message: error.message,
    stack: error.stack,
    severity: errorInfo.severity,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  });
  
  // En producción, enviar a servicio de monitoreo
  if (import.meta.env.PROD && errorInfo.severity === 'critical') {
    // sendToErrorMonitoring(error, context);
  }
};
```

## Testing de Utilidades

### Setup de Testing
```typescript
import { formatCurrency, isValidEmail, calculateDistance } from './utils';

describe('Utils', () => {
  describe('formatCurrency', () => {
    test('formats Colombian pesos correctly', () => {
      expect(formatCurrency(15000)).toBe('$15.000');
      expect(formatCurrency(1000000)).toBe('$1.000.000');
    });
  });
  
  describe('isValidEmail', () => {
    test('validates emails correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
    });
  });
  
  describe('calculateDistance', () => {
    test('calculates distance between cities', () => {
      const bogotaLat = 4.7110;
      const bogotaLng = -74.0721;
      const medellinLat = 6.2442;
      const medellinLng = -75.5812;
      
      const distance = calculateDistance(
        bogotaLat, bogotaLng, 
        medellinLat, medellinLng
      );
      
      expect(distance).toBeGreaterThan(200);
      expect(distance).toBeLessThan(300);
    });
  });
});
```

## Best Practices

### 1. Funciones Puras
Preferir funciones puras que no tengan efectos secundarios:
```typescript
// ✅ Función pura
const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// ❌ Función con efectos secundarios
const updateItems = (items: Item[]): void => {
  items.forEach(item => {
    item.processed = true; // Mutación
  });
};
```

### 2. Manejo de Errores
Siempre manejar errores apropiadamente:
```typescript
export const safeOperation = async (operation: () => Promise<any>) => {
  try {
    return await operation();
  } catch (error) {
    logError(error, 'safeOperation');
    return null;
  }
};
```

### 3. Documentación
Documentar funciones complejas:
```typescript
/**
 * Calcula el precio sugerido para un viaje basado en la distancia
 * @param distanceKm - Distancia en kilómetros
 * @param isUrban - Si el viaje es urbano o no
 * @returns Precio sugerido en pesos colombianos
 */
export const calculateSuggestedPrice = (
  distanceKm: number, 
  isUrban: boolean = true
): number => {
  // Implementación...
};
```

### 4. Validación de Entrada
Validar inputs de las funciones:
```typescript
export const processUserData = (data: any): ProcessedData | null => {
  if (!data || typeof data !== 'object') {
    console.warn('Invalid data provided to processUserData');
    return null;
  }
  
  // Procesamiento...
};
```
