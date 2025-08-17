# Guía de Desarrollo - CupoApp Frontend

## 🚀 Configuración del Entorno de Desarrollo

### Prerrequisitos
- **Node.js** 18+ (LTS recomendado)
- **npm** 8+ o **yarn** 1.22+
- **Git** para control de versiones
- **VS Code** (recomendado) con extensiones:
  - TypeScript and JavaScript Language Features
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - Auto Rename Tag

### Instalación Inicial

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd CupoApp_Production

# 2. Instalar dependencias
npm install

# 3. Copiar variables de entorno
cp .env.example .env

# 4. Configurar variables de entorno
# Editar .env con tus configuraciones específicas
```

### Variables de Entorno (.env)

```bash
# API Configuration
VITE_API_URL=https://cupo-backend.fly.dev
VITE_TELEFUNC_URL=https://cupo-backend.fly.dev/_telefunc

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=tu_google_maps_api_key

# Environment
VITE_APP_ENV=development

# Feature Flags
VITE_ENABLE_DEBUG=true
VITE_ENABLE_MOCK_DATA=false
```

## 🏃‍♂️ Scripts de Desarrollo

### Scripts Principales

```bash
# Desarrollo web (puerto 5173)
npm run dev

# Desarrollo móvil con live reload
npm run dev:android

# Build de producción
npm run build

# Preview del build
npm run preview

# Linting y formato
npm run lint
```

### Scripts de Desarrollo Móvil

```bash
# Sincronizar cambios con Capacitor
npx cap sync

# Ejecutar en Android con live reload
npm run dev:android

# Ejecutar en iOS (requiere macOS)
npx cap run ios

# Abrir en Android Studio
npx cap open android

# Abrir en Xcode
npx cap open ios
```

## 📁 Convenciones de Estructura

### Organización de Archivos

```
src/
├── components/
│   ├── ui/                 # Componentes reutilizables base
│   ├── business/           # Componentes específicos de negocio
│   └── layouts/            # Layouts y estructuras
├── routes/                 # Páginas (file-based routing)
├── services/              # Lógica de negocio y API calls
├── hooks/                 # Custom hooks
├── utils/                 # Utilidades puras
├── types/                 # Definiciones TypeScript
├── context/               # React Contexts
└── styles/                # Estilos globales
```

### Naming Conventions

#### Archivos y Carpetas
```bash
# Componentes - PascalCase
UserProfile.tsx
TripCard.tsx

# Hooks - camelCase con prefijo 'use'
useAuthState.ts
useApiRequest.ts

# Servicios - camelCase
authService.ts
tripService.ts

# Utilidades - camelCase
dateUtils.ts
validationHelpers.ts

# Estilos - Component.module.css
UserProfile.module.css
TripCard.module.css

# Tipos - camelCase con sufijo 'Types'
userTypes.ts
tripTypes.ts
```

#### Variables y Funciones
```typescript
// Variables - camelCase
const userName = 'John Doe';
const isUserLoggedIn = true;

// Funciones - camelCase con verbo inicial
const getUserProfile = () => {};
const validateEmail = () => {};

// Constants - UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;

// Interfaces - PascalCase con prefijo 'I' (opcional)
interface UserProfile {
  id: string;
  name: string;
}

// Types - PascalCase
type UserRole = 'admin' | 'user' | 'guest';
```

## 🧩 Patrones de Desarrollo

### Estructura de Componentes

```typescript
// UserProfile.tsx
import React, { useState, useEffect } from 'react';
import { Container, Text, Button } from '@mantine/core';
import { useBackendAuth } from '@/context/BackendAuthContext';
import { getUserProfile } from '@/services/userService';
import styles from './UserProfile.module.css';

interface UserProfileProps {
  userId: string;
  onProfileUpdate?: (profile: UserProfile) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  userId,
  onProfileUpdate
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useBackendAuth();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const userProfile = await getUserProfile(userId);
        setProfile(userProfile);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const handleUpdateProfile = async () => {
    // Update logic
    if (onProfileUpdate && profile) {
      onProfileUpdate(profile);
    }
  };

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text c="red">{error}</Text>;
  if (!profile) return <Text>Profile not found</Text>;

  return (
    <Container className={styles.container}>
      <Text className={styles.name}>{profile.name}</Text>
      <Button onClick={handleUpdateProfile}>
        Update Profile
      </Button>
    </Container>
  );
};

export default UserProfile;
```

### Custom Hooks Pattern

```typescript
// useUserProfile.ts
import { useState, useEffect } from 'react';
import { getUserProfile, type UserProfile } from '@/services/userService';

export const useUserProfile = (userId: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const userProfile = await getUserProfile(userId);
        setProfile(userProfile);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const refreshProfile = async () => {
    // Refresh logic
  };

  return {
    profile,
    loading,
    error,
    refreshProfile
  };
};
```

### Service Pattern

```typescript
// userService.ts
import { apiRequest } from '@/config/api';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface UpdateUserProfileRequest {
  name?: string;
  avatar?: string;
}

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  try {
    const response = await apiRequest(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (
  userId: string, 
  updates: UpdateUserProfileRequest
): Promise<UserProfile> => {
  try {
    const response = await apiRequest(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};
```

## 🎨 Estilos y UI

### CSS Modules Usage

```css
/* UserProfile.module.css */
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(145deg, #1e1e1e, #2a2a2a);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.name {
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px solid var(--mantine-color-brand-6);
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
  
  .name {
    font-size: 1.25rem;
  }
}
```

### Mantine Integration

```typescript
import { Button, Text, Container } from '@mantine/core';
import { notifications } from '@mantine/notifications';

// Using Mantine components with custom styling
<Container size="md" className={styles.container}>
  <Text size="xl" fw={600} c="brand">
    Welcome to CupoApp
  </Text>
  
  <Button 
    variant="gradient" 
    gradient={{ from: 'brand.6', to: 'brand.8' }}
    onClick={() => notifications.show({
      title: 'Success',
      message: 'Action completed successfully'
    })}
  >
    Click me
  </Button>
</Container>
```

## 🔧 Estado y Datos

### React Context Usage

```typescript
// UserContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserContextType {
  user: User | null;
  loading: boolean;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize user state
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    // Load user logic
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const logout = () => {
    setUser(null);
    // Additional logout logic
  };

  const value = {
    user,
    loading,
    updateUser,
    logout
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
```

### Local State Management

```typescript
// Para estado complejo, usar useReducer
const [state, dispatch] = useReducer(tripReducer, initialState);

// Para estado simple, usar useState
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Para estado derivado, usar useMemo
const filteredTrips = useMemo(() => {
  return trips.filter(trip => trip.status === 'active');
}, [trips]);
```

## 🧪 Testing

### Unit Testing Example

```typescript
// UserProfile.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProfile } from './UserProfile';
import { getUserProfile } from '@/services/userService';

// Mock the service
jest.mock('@/services/userService');
const mockGetUserProfile = getUserProfile as jest.MockedFunction<typeof getUserProfile>;

describe('UserProfile', () => {
  beforeEach(() => {
    mockGetUserProfile.mockClear();
  });

  test('renders user profile correctly', async () => {
    const mockProfile = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com'
    };

    mockGetUserProfile.mockResolvedValue(mockProfile);

    render(<UserProfile userId="1" />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  test('handles error state', async () => {
    mockGetUserProfile.mockRejectedValue(new Error('User not found'));

    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText(/error loading profile/i)).toBeInTheDocument();
    });
  });
});
```

### Service Testing

```typescript
// userService.test.ts
import { getUserProfile } from './userService';
import { apiRequest } from '@/config/api';

jest.mock('@/config/api');
const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('userService', () => {
  test('getUserProfile returns user data', async () => {
    const mockUser = { id: '1', name: 'John Doe' };
    mockApiRequest.mockResolvedValue({ data: mockUser });

    const result = await getUserProfile('1');

    expect(result).toEqual(mockUser);
    expect(mockApiRequest).toHaveBeenCalledWith('/users/1');
  });
});
```

## 🚀 Performance Best Practices

### Component Optimization

```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* expensive rendering */}</div>;
});

// Use useCallback for event handlers
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);

// Use useMemo for expensive calculations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}, [items]);
```

### Lazy Loading

```typescript
// Lazy load components
const LazyComponent = React.lazy(() => import('./LazyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}

// Lazy load routes
export const Route = createLazyFileRoute('/profile')({
  component: ProfileComponent
});
```

## 🐛 Debugging

### Debug Utilities

```typescript
// Use debug logging
const DEBUG = import.meta.env.VITE_ENABLE_DEBUG === 'true';

export const debugLog = (category: string, message: string, data?: any) => {
  if (DEBUG) {
    console.log(`🔧 [${category}] ${message}`, data || '');
  }
};

// Usage
debugLog('UserService', 'Loading user profile', { userId });
```

### React DevTools

```typescript
// Add display names for easier debugging
UserProfile.displayName = 'UserProfile';

// Use meaningful component names
const MemoizedTripCard = React.memo(TripCard);
MemoizedTripCard.displayName = 'MemoizedTripCard';
```

## 📝 Documentación de Código

### JSDoc Comments

```typescript
/**
 * Retrieves user profile information from the API
 * @param userId - The unique identifier for the user
 * @returns Promise that resolves to user profile data
 * @throws {Error} When user is not found or API request fails
 * @example
 * ```typescript
 * const profile = await getUserProfile('user123');
 * console.log(profile.name);
 * ```
 */
export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  // Implementation
};
```

### Type Documentation

```typescript
/**
 * Represents a user's profile information
 */
export interface UserProfile {
  /** Unique identifier for the user */
  id: string;
  /** User's email address */
  email: string;
  /** User's display name */
  name: string;
  /** Optional avatar image URL */
  avatar?: string;
  /** User registration date */
  createdAt: Date;
  /** Last time user was active */
  lastSeen?: Date;
}
```

## 🔄 CI/CD y Deployment

### Build Scripts

```json
{
  "scripts": {
    "build": "tsc -b && vite build",
    "build:staging": "cross-env NODE_ENV=staging vite build",
    "build:production": "cross-env NODE_ENV=production vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  }
}
```

### Environment Configuration

```typescript
// config/environment.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true'
};
```

## 📚 Recursos Adicionales

### VS Code Settings

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

### Snippets Útiles

```json
// .vscode/snippets.json
{
  "React Functional Component": {
    "prefix": "rfc",
    "body": [
      "import React from 'react';",
      "",
      "interface ${1:ComponentName}Props {",
      "  $2",
      "}",
      "",
      "export const ${1:ComponentName}: React.FC<${1:ComponentName}Props> = ({",
      "  $3",
      "}) => {",
      "  return (",
      "    <div>",
      "      $4",
      "    </div>",
      "  );",
      "};",
      "",
      "export default ${1:ComponentName};"
    ]
  }
}
```
