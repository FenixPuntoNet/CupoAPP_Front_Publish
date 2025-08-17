# Guía de Troubleshooting - CupoApp Frontend

## 🚨 Problemas Comunes y Soluciones

### 1. Problemas de Instalación

#### Error: "node_modules not found"
```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### Error: "EACCES: permission denied"
```bash
# Cambiar ownership de npm
sudo chown -R $(whoami) ~/.npm

# O usar nvm para gestionar versiones de Node
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node
nvm use node
```

#### Error de versión de Node
```bash
# Verificar versión
node --version
npm --version

# Actualizar Node.js (recomendado: usar nvm)
nvm install 18
nvm use 18
```

### 2. Problemas de Desarrollo

#### Puerto 5173 en uso
```bash
# Verificar qué proceso usa el puerto
lsof -ti:5173

# Matar el proceso
kill -9 $(lsof -ti:5173)

# O usar otro puerto
npm run dev -- --port 3000
```

#### Hot Reload no funciona
```bash
# Verificar configuración de Vite
# vite.config.ts
export default defineConfig({
  server: {
    watch: {
      usePolling: true
    }
  }
});
```

#### Variables de entorno no se cargan
```bash
# Verificar que el archivo .env existe
ls -la .env

# Verificar prefijo VITE_
# ❌ Incorrecto
API_URL=http://localhost:3000

# ✅ Correcto
VITE_API_URL=http://localhost:3000
```

### 3. Errores de TypeScript

#### "Cannot find module" error
```typescript
// Verificar rutas en tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"]
    }
  }
}
```

#### Errores de tipo en componentes Mantine
```typescript
// Asegurar importación correcta de tipos
import { Button, type ButtonProps } from '@mantine/core';

// Para componentes personalizados
interface CustomButtonProps extends ButtonProps {
  customProp?: string;
}
```

#### "Property does not exist on type" en Context
```typescript
// Verificar que el hook se usa dentro del Provider
const SomeComponent = () => {
  const { user } = useBackendAuth(); // ❌ Puede fallar si no está en Provider
  return <div>{user?.name}</div>;
};

// ✅ Correcto - Componente dentro del Provider
<BackendAuthProvider>
  <SomeComponent />
</BackendAuthProvider>
```

### 4. Problemas de API

#### Error: "Network request failed"
```typescript
// Verificar configuración de API
// config/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Verificar CORS en desarrollo
// En el backend, asegurar que localhost:5173 esté permitido
```

#### Token JWT expirado
```typescript
// Verificar manejo de tokens en apiRequest
export const apiRequest = async (endpoint: string, options: RequestOptions = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
        ...options.headers,
      },
    });

    // Manejar token expirado
    if (response.status === 401) {
      removeToken();
      // Redirigir a login
      window.location.href = '/login';
      throw new Error('Token expired');
    }

    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
```

#### Error de CORS
```bash
# Verificar headers en el backend
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization

# En desarrollo, usar proxy en vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
```

### 5. Problemas de Routing

#### "Page not found" en refresh
```typescript
// Configurar servidor para SPA
// netlify.toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

// vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### Rutas protegidas no funcionan
```typescript
// Verificar AuthGuard
export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useBackendAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    // Usar navigate de TanStack Router
    useNavigate()({ to: '/login' });
    return null;
  }

  return <>{children}</>;
};
```

#### Navegación programática no funciona
```typescript
// TanStack Router
import { useNavigate } from '@tanstack/react-router';

const navigate = useNavigate();

// ✅ Correcto
navigate({ to: '/dashboard' });

// ❌ Incorrecto (React Router sintaxis)
navigate('/dashboard');
```

### 6. Problemas de Capacitor/Mobile

#### Error en sync de Capacitor
```bash
# Limpiar y rebuildar
rm -rf android/app/src/main/assets/public
npx cap clean android
npm run build
npx cap sync android
```

#### Live reload no funciona en móvil
```bash
# Verificar configuración de IP
# capacitor.config.ts
export default {
  server: {
    url: 'http://192.168.1.100:5173', // Tu IP local
    cleartext: true
  }
} as CapacitorConfig;

# Verificar que el dispositivo esté en la misma red
```

#### Plugins no funcionan
```bash
# Verificar instalación de plugins
npm list @capacitor/camera @capacitor/geolocation

# Reinstalar si es necesario
npm uninstall @capacitor/camera
npm install @capacitor/camera
npx cap sync
```

### 7. Problemas de Estilo

#### Tailwind CSS no se aplica
```bash
# Verificar importación en main.tsx
import './index.css';

# Verificar tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // ...
};
```

#### CSS Modules no funcionan
```typescript
// Verificar extensión .module.css
import styles from './Component.module.css'; // ✅ Correcto
import styles from './Component.css'; // ❌ Incorrecto

// Verificar configuración de Vite para CSS Modules
// vite.config.ts
export default defineConfig({
  css: {
    modules: {
      localsConvention: 'camelCase'
    }
  }
});
```

#### Mantine theme no se aplica
```typescript
// Verificar MantineProvider en main.tsx
import { MantineProvider } from '@mantine/core';
import { theme } from './theme';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <MantineProvider theme={theme}>
    <App />
  </MantineProvider>
);
```

### 8. Problemas de Performance

#### Componentes se re-renderizan mucho
```typescript
// Usar React.memo
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* componente */}</div>;
});

// Usar useCallback para funciones
const handleClick = useCallback((id: string) => {
  onClick(id);
}, [onClick]);

// Usar useMemo para cálculos costosos
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.name.localeCompare(b.name));
}, [data]);
```

#### Bundle size muy grande
```bash
# Analizar bundle
npm run build
npx vite-bundle-analyzer dist

# Lazy loading de componentes
const LazyComponent = React.lazy(() => import('./LazyComponent'));

# Eliminar imports no utilizados
npx depcheck
```

### 9. Debugging Tools

#### Chrome DevTools para React
```bash
# Instalar React DevTools
# https://chrome.google.com/webstore/detail/react-developer-tools

# Usar Profiler para performance
# Components tab para inspeccionar estado
```

#### VS Code Debugging
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "request": "launch",
      "type": "chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

#### Network Issues Debug
```typescript
// Interceptar requests para debugging
const originalFetch = window.fetch;
window.fetch = (...args) => {
  console.log('Fetch request:', args);
  return originalFetch(...args)
    .then(response => {
      console.log('Fetch response:', response);
      return response;
    });
};
```

### 10. Error Boundaries

#### Implementar Error Boundary
```typescript
// ErrorBoundary.tsx
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Algo salió mal</h2>
          <details>
            {this.state.error?.message}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 🔧 Herramientas de Debugging

### 1. Console Debugging
```typescript
// Debugging personalizado
const DEBUG = {
  api: (message: string, data?: any) => console.log('🌐 API:', message, data),
  auth: (message: string, data?: any) => console.log('🔐 AUTH:', message, data),
  nav: (message: string, data?: any) => console.log('🧭 NAV:', message, data),
  state: (message: string, data?: any) => console.log('📊 STATE:', message, data),
};

// Uso
DEBUG.api('User login attempt', { email: 'user@example.com' });
```

### 2. React Query DevTools
```typescript
// Instalar React Query DevTools para debugging de cache
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <>
      <QueryClient>
        <YourApp />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClient>
    </>
  );
}
```

### 3. Redux DevTools (si usas Redux)
```typescript
// Configurar Redux DevTools
const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== 'production',
});
```

## 📋 Checklist de Debugging

### Antes de reportar un bug:

- [ ] ¿Se reproduce en modo incógnito?
- [ ] ¿Se reproduce en diferentes navegadores?
- [ ] ¿La consola muestra errores?
- [ ] ¿Las variables de entorno están configuradas?
- [ ] ¿El backend está ejecutándose?
- [ ] ¿Los tokens están válidos?
- [ ] ¿Hay conflictos de dependencias?

### Información a incluir en bug reports:

- [ ] Versión de Node.js y npm
- [ ] Sistema operativo
- [ ] Navegador y versión
- [ ] Pasos para reproducir
- [ ] Logs de consola
- [ ] Screenshots/videos
- [ ] Expected vs actual behavior

## 🚨 Contacto y Soporte

### Escalación de Issues:
1. **Level 1**: Consultar esta guía y documentación
2. **Level 2**: Buscar en issues del repositorio
3. **Level 3**: Crear nuevo issue con template
4. **Level 4**: Contactar al equipo de desarrollo

### Recursos Adicionales:
- [Documentación de Vite](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Mantine Documentation](https://mantine.dev/)
- [TanStack Router](https://tanstack.com/router)
- [Capacitor Documentation](https://capacitorjs.com/docs)
