# Custom Hooks

## Visión General

Los custom hooks en CupoApp encapsulan lógica reutilizable y efectos secundarios complejos, proporcionando una interfaz limpia para componentes que necesitan funcionalidades específicas.

## Hooks Disponibles

### 1. `useErrorHandling.ts` - Manejo de Errores

Hook centralizado para manejar errores de validación y backend.

#### Funcionalidades
- Validación de formularios
- Manejo de errores de backend
- Notificaciones de éxito
- Parsing de errores estructurados

#### API
```typescript
interface UseErrorHandlingReturn {
  handleValidationError: (field: string, value: any) => ValidationError | null;
  handleBackendError: (error: any, options?: NotificationOptions) => void;
  showSuccess: (title: string, message: string, options?: NotificationOptions) => void;
}

const useErrorHandling = (): UseErrorHandlingReturn
```

#### Implementación
```typescript
const { handleValidationError, handleBackendError, showSuccess } = useErrorHandling();

// Validación en formularios
const form = useForm({
  validate: {
    email: (value) => {
      const error = handleValidationError('email', value);
      return error ? error.message : null;
    }
  }
});

// Manejo de errores de API
try {
  const result = await apiCall();
  showSuccess('Éxito', 'Operación completada');
} catch (error) {
  handleBackendError(error);
}
```

#### Tipos de Validación Soportados
- **Email**: Formato válido de email
- **Password**: Fortaleza de contraseña
- **Phone**: Formato de teléfono
- **Required**: Campos obligatorios
- **MinLength**: Longitud mínima
- **MaxLength**: Longitud máxima

### 2. `useMaps.ts` - Integración Google Maps

Hook para funcionalidades avanzadas de Google Maps.

#### Funcionalidades
- Geocodificación (dirección ↔ coordenadas)
- Autocompletado de lugares
- Cálculo de distancias y rutas
- Lugares cercanos

#### API
```typescript
interface UseMapsReturn {
  geocodeAddress: (address: string) => Promise<LatLng | null>;
  reverseGeocode: (lat: number, lng: number) => Promise<string | null>;
  searchPlaces: (query: string, location?: LatLng) => Promise<Place[]>;
  calculateRoute: (origin: LatLng, destination: LatLng) => Promise<RouteInfo>;
  findNearbyPlaces: (location: LatLng, type: string, radius?: number) => Promise<Place[]>;
}

const useMaps = (): UseMapsReturn
```

#### Ejemplos de Uso
```typescript
const { geocodeAddress, calculateRoute, searchPlaces } = useMaps();

// Geocodificar dirección
const coordinates = await geocodeAddress('Calle 100, Bogotá');

// Buscar lugares
const places = await searchPlaces('restaurantes', { lat: 4.6097, lng: -74.0817 });

// Calcular ruta
const route = await calculateRoute(origin, destination);
```

### 3. `useModerationStatus.ts` - Estado de Moderación

Hook para manejar el estado de moderación de usuarios.

#### Funcionalidades
- Verificar estado de moderación
- Manejar restricciones de cuenta
- Mostrar alertas de moderación
- Gestión de suspensiones

#### API
```typescript
interface ModerationStatus {
  is_suspended: boolean;
  suspension_type: 'temporary' | 'permanent' | null;
  suspension_end_date: string | null;
  suspension_reason: string | null;
  can_appeal: boolean;
  warnings_count: number;
}

interface UseModerationStatusReturn {
  moderationStatus: ModerationStatus | null;
  loading: boolean;
  checkModerationStatus: () => Promise<void>;
  canPerformAction: (action: string) => boolean;
  showModerationAlert: () => void;
}

const useModerationStatus = (): UseModerationStatusReturn
```

#### Ejemplo de Uso
```typescript
const { moderationStatus, canPerformAction, showModerationAlert } = useModerationStatus();

// Verificar si puede realizar acción
if (!canPerformAction('create_trip')) {
  showModerationAlert();
  return;
}

// Proceder con la acción
createTrip(tripData);
```

### 4. `useTripDraft.ts` - Borrador de Viajes

Hook para manejar borradores de viajes en progreso.

#### Funcionalidades
- Guardar progreso automáticamente
- Recuperar borradores
- Validar completitud
- Migrar datos entre versiones

#### API
```typescript
interface TripDraft {
  origin: LocationData;
  destination: LocationData;
  date: string;
  time: string;
  seats: number;
  price: number;
  safePoints: SafePoint[];
  stopovers: Stopover[];
  lastModified: string;
}

interface UseTripDraftReturn {
  draft: TripDraft | null;
  hasDraft: boolean;
  saveDraft: (data: Partial<TripDraft>) => void;
  loadDraft: () => TripDraft | null;
  clearDraft: () => void;
  isDraftComplete: () => boolean;
  migrateLegacyData: () => Promise<boolean>;
}

const useTripDraft = (): UseTripDraftReturn
```

#### Ejemplo de Uso
```typescript
const { draft, saveDraft, hasDraft, clearDraft } = useTripDraft();

// Auto-guardar cambios
useEffect(() => {
  if (formData.origin && formData.destination) {
    saveDraft(formData);
  }
}, [formData]);

// Cargar borrador al iniciar
useEffect(() => {
  if (hasDraft) {
    const confirmRestore = confirm('¿Restaurar borrador anterior?');
    if (confirmRestore) {
      setFormData(draft);
    } else {
      clearDraft();
    }
  }
}, []);
```

### 5. `useUserModeration.ts` - Moderación de Usuarios

Hook para funcionalidades de moderación de usuarios.

#### Funcionalidades
- Reportar usuarios
- Bloquear/desbloquear usuarios
- Ver historial de moderación
- Gestionar usuarios bloqueados

#### API
```typescript
interface UseUserModerationReturn {
  reportUser: (userId: string, reason: string, details?: string) => Promise<boolean>;
  blockUser: (userId: string, reason: string) => Promise<boolean>;
  unblockUser: (userId: string) => Promise<boolean>;
  getBlockedUsers: () => Promise<BlockedUser[]>;
  isUserBlocked: (userId: string) => boolean;
  getModerationHistory: (userId?: string) => Promise<ModerationAction[]>;
}

const useUserModeration = (): UseUserModerationReturn
```

#### Ejemplo de Uso
```typescript
const { reportUser, blockUser, isUserBlocked } = useUserModeration();

// Verificar si usuario está bloqueado
if (isUserBlocked(driverId)) {
  showMessage('Este usuario está bloqueado');
  return;
}

// Reportar usuario
const handleReport = async () => {
  const success = await reportUser(userId, 'inappropriate_behavior', details);
  if (success) {
    showSuccess('Usuario reportado exitosamente');
  }
};
```

### 6. `useAssumptions.ts` - Configuración de Precios

Hook para manejar configuración de precios y assumptions del sistema.

#### Funcionalidades
- Cargar configuración de precios
- Calcular precios sugeridos
- Cache de configuraciones
- Fallbacks para configuraciones no disponibles

#### API
```typescript
interface Assumptions {
  base_price: number;
  price_per_km_urban: number;
  price_per_km_highway: number;
  urban_threshold_km: number;
  minimum_price: number;
  maximum_price: number;
}

interface UseAssumptionsReturn {
  assumptions: Assumptions | null;
  loading: boolean;
  error: string | null;
  calculateSuggestedPrice: (distance: number) => number | null;
  refreshAssumptions: () => Promise<void>;
}

const useAssumptions = (): UseAssumptionsReturn
```

#### Ejemplo de Uso
```typescript
const { assumptions, calculateSuggestedPrice, loading } = useAssumptions();

// Calcular precio sugerido
const suggestedPrice = calculateSuggestedPrice(distanceInKm);
if (suggestedPrice) {
  setSuggestedPrice(suggestedPrice);
}
```

## Patrones de Implementación

### 1. Hook Base Pattern
```typescript
const useCustomHook = (initialState: any) => {
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performAction = useCallback(async (params: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiCall(params);
      setState(result);
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    state,
    loading,
    error,
    performAction
  };
};
```

### 2. Effect Cleanup Pattern
```typescript
const useAsyncEffect = (asyncFn: () => Promise<void>, deps: any[]) => {
  useEffect(() => {
    let isCancelled = false;

    const runAsync = async () => {
      try {
        await asyncFn();
      } catch (error) {
        if (!isCancelled) {
          console.error('Async effect error:', error);
        }
      }
    };

    runAsync();

    return () => {
      isCancelled = true;
    };
  }, deps);
};
```

### 3. Local Storage Sync Pattern
```typescript
const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setStoredValue = useCallback((newValue: T) => {
    try {
      setValue(newValue);
      localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [key]);

  return [value, setStoredValue] as const;
};
```

### 4. Debounced State Pattern
```typescript
const useDebounced = <T>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
```

### 5. Async State Management Pattern
```typescript
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

const useAsyncState = <T>() => {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (asyncFn: () => Promise<T>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await asyncFn();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
      throw error;
    }
  }, []);

  return { ...state, execute };
};
```

## Testing de Hooks

### Setup de Testing
```typescript
import { renderHook, act } from '@testing-library/react';
import { useErrorHandling } from './useErrorHandling';

describe('useErrorHandling', () => {
  test('should validate email correctly', () => {
    const { result } = renderHook(() => useErrorHandling());
    
    const error = result.current.handleValidationError('email', 'invalid-email');
    expect(error).toBeTruthy();
    expect(error?.message).toContain('email válido');
    
    const validError = result.current.handleValidationError('email', 'test@example.com');
    expect(validError).toBeNull();
  });

  test('should handle backend errors', async () => {
    const { result } = renderHook(() => useErrorHandling());
    
    act(() => {
      result.current.handleBackendError(new Error('Backend error'));
    });
    
    // Verificar que se mostró la notificación
    // (requiere mock del sistema de notificaciones)
  });
});
```

### Mocking de Dependencies
```typescript
// Mock de API calls
jest.mock('@/config/api', () => ({
  apiRequest: jest.fn()
}));

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});
```

## Performance Considerations

### 1. Memoization
```typescript
const useExpensiveCalculation = (dependencies: any[]) => {
  return useMemo(() => {
    return expensiveFunction(dependencies);
  }, dependencies);
};
```

### 2. Callback Optimization
```typescript
const useOptimizedCallbacks = () => {
  const [state, setState] = useState();
  
  const memoizedCallback = useCallback((param: any) => {
    setState(param);
  }, []); // Dependencies array vacío si no depende de props/state
  
  return { state, memoizedCallback };
};
```

### 3. Effect Dependencies
```typescript
// ❌ Mal: dependencias innecesarias
useEffect(() => {
  fetchData();
}, [user, fetchData]); // fetchData puede cambiar en cada render

// ✅ Bien: dependencias optimizadas
const fetchData = useCallback(() => {
  // lógica de fetch
}, [user.id]); // Solo depende del ID del usuario

useEffect(() => {
  fetchData();
}, [fetchData]);
```

## Best Practices

### 1. Single Responsibility
Cada hook debe tener una responsabilidad específica y bien definida.

### 2. Consistent API
Mantener APIs consistentes entre hooks similares:
```typescript
// Patrón consistente de retorno
return {
  data,
  loading,
  error,
  execute
};
```

### 3. Error Handling
Siempre manejar errores de manera consistente:
```typescript
try {
  await operation();
} catch (error) {
  console.error('Hook operation failed:', error);
  setError(error instanceof Error ? error.message : 'Unknown error');
}
```

### 4. Cleanup
Limpiar efectos secundarios apropiadamente:
```typescript
useEffect(() => {
  const subscription = subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
}, []);
```
