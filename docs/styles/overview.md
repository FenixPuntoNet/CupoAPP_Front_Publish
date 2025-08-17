# Sistema de Estilos

## Visión General

CupoApp utiliza un sistema híbrido de estilos que combina Mantine UI, Tailwind CSS y CSS Modules para crear una experiencia visual consistente y mantenible.

## Stack de Estilos

### 1. Mantine UI (Componentes Base)
- **Versión**: 7.16.1
- **Propósito**: Componentes de UI predefinidos
- **Tema personalizado**: Color brand verde (#00ff9d)
- **Dark mode** por defecto

### 2. Tailwind CSS (Utilidades)
- **Versión**: 3.4.17
- **Propósito**: Utilidades CSS y layout
- **Configuración**: `tailwind.config.js`
- **Plugin**: tailwindcss-animate para animaciones

### 3. CSS Modules (Componentes Específicos)
- **Propósito**: Estilos encapsulados por componente
- **Naming**: `Component.module.css`
- **Scoping**: Automático por Vite

## Configuración del Tema

### Mantine Theme (`__root.tsx`)
```typescript
const theme = createTheme({
  fontFamily: "Inter, sans-serif",
  colors: {
    brand: [
      "#e6fff2",  // 0 - Muy claro
      "#b3ffe0",  // 1 - Claro
      "#80ffce",  // 2 - Claro medio
      "#4dffbc",  // 3 - Medio claro
      "#1affaa",  // 4 - Medio
      "#00e699",  // 5 - Medio oscuro
      "#00cc88",  // 6 - Oscuro (primary light)
      "#00b377",  // 7 - Más oscuro
      "#009966",  // 8 - Muy oscuro (primary dark)
      "#008055",  // 9 - Máximo oscuro
    ],
  },
  primaryColor: "brand",
  primaryShade: { light: 6, dark: 8 },
});
```

### Tailwind Configuration
```javascript
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        brand: {
          50: '#e6fff2',
          500: '#00ff9d',
          900: '#008055'
        }
      }
    }
  }
}
```

## Estructura de Archivos CSS

### Global Styles (`src/index.css`)
```css
/* Imports principales */
@import './styles/modals.css';
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Variables CSS personalizadas */
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --brand-primary: 158 100% 50%;
}

/* Estilos globales para iOS */
input, textarea, select, button {
  font-size: 16px !important; /* Previene zoom en iOS */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
}
```

### Modal Styles (`src/styles/modals.css`)
Estilos globales para todos los modales de la aplicación:

```css
/* Contenedor del modal */
.mantine-Modal-content {
  background: linear-gradient(145deg, #1a1a1a, #2d2d2d) !important;
  border: 1px solid rgba(0, 255, 157, 0.2) !important;
  border-radius: 16px !important;
  color: #ffffff !important;
}

/* Títulos de modales */
.mantine-Modal-title {
  color: #ffffff !important;
  font-weight: 600 !important;
  font-size: 1.5rem !important;
}

/* Inputs en modales */
.mantine-Modal-content .mantine-TextInput-input {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: #ffffff !important;
}

.mantine-Modal-content .mantine-TextInput-input:focus {
  border-color: #00ff9d !important;
  box-shadow: 0 0 0 2px rgba(0, 255, 157, 0.2) !important;
}
```

## CSS Modules por Componente

### Naming Convention
- **Archivo**: `ComponentName.module.css`
- **Classes**: camelCase (`primaryButton`, `headerContainer`)
- **Estados**: prefijo con estado (`isActive`, `isLoading`)

### Ejemplo: TripCard.module.css
```css
.tripCard {
  background: linear-gradient(145deg, #1e1e1e, #2a2a2a);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.tripCard:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  border-color: rgba(0, 255, 157, 0.3);
}

.tripHeader {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.tripTitle {
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.tripRoute {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tripActions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.actionButton {
  flex: 1;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.actionButton:hover {
  background: rgba(0, 255, 157, 0.1);
  border-color: rgba(0, 255, 157, 0.5);
  color: #00ff9d;
}

.primaryAction {
  background: linear-gradient(135deg, #00ff9d, #00cc7a);
  color: #000000;
  border: none;
}

.primaryAction:hover {
  background: linear-gradient(135deg, #00cc7a, #00ff9d);
  transform: translateY(-2px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .tripCard {
    padding: 1rem;
  }
  
  .tripActions {
    flex-direction: column;
  }
  
  .actionButton {
    width: 100%;
  }
}
```

## Patrones de Diseño Visual

### 1. Color Palette
```css
/* Brand Colors */
--brand-primary: #00ff9d;
--brand-secondary: #00cc7a;
--brand-dark: #008055;

/* Neutral Colors */
--gray-900: #1a1a1a;
--gray-800: #2d2d2d;
--gray-700: #404040;
--gray-600: #666666;
--gray-500: #888888;
--gray-400: #aaaaaa;
--gray-300: #cccccc;
--gray-200: #e5e5e5;
--gray-100: #f5f5f5;

/* Semantic Colors */
--success: #00ff9d;
--warning: #ffa500;
--error: #ff4757;
--info: #38bdf8;

/* Background Colors */
--bg-primary: #1a1a1a;
--bg-secondary: #2d2d2d;
--bg-tertiary: #404040;
--bg-overlay: rgba(0, 0, 0, 0.8);
```

### 2. Typography
```css
/* Font Families */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### 3. Spacing
```css
/* Spacing Scale */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */

/* Container Widths */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
```

### 4. Shadows
```css
/* Shadow Scale */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-base: 0 1px 3px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.25);

/* Brand Shadows */
--shadow-brand: 0 4px 20px rgba(0, 255, 157, 0.2);
--shadow-brand-lg: 0 8px 30px rgba(0, 255, 157, 0.3);
```

### 5. Border Radius
```css
/* Border Radius Scale */
--radius-sm: 0.25rem;  /* 4px */
--radius-base: 0.5rem; /* 8px */
--radius-md: 0.75rem;  /* 12px */
--radius-lg: 1rem;     /* 16px */
--radius-xl: 1.5rem;   /* 24px */
--radius-full: 9999px; /* Full circle */
```

## Responsive Design

### Breakpoints
```css
/* Mobile First Approach */
@media (min-width: 640px) {  /* sm */
  /* Tablet styles */
}

@media (min-width: 768px) {  /* md */
  /* Desktop small styles */
}

@media (min-width: 1024px) { /* lg */
  /* Desktop styles */
}

@media (min-width: 1280px) { /* xl */
  /* Large desktop styles */
}
```

### Container Queries (Próximamente)
```css
@container (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
```

## Animaciones

### Transitions
```css
/* Transition Presets */
--transition-fast: 0.15s ease-out;
--transition-base: 0.3s ease-out;
--transition-slow: 0.5s ease-out;

/* Common Transitions */
.interactive {
  transition: 
    transform var(--transition-base),
    box-shadow var(--transition-base),
    background-color var(--transition-base);
}

.interactive:hover {
  transform: translateY(-2px);
}
```

### Keyframe Animations
```css
/* Loading Spinner */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
}

/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fadeIn {
  animation: fadeIn 0.3s ease-out;
}

/* Slide In */
@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.slideInRight {
  animation: slideInRight 0.3s ease-out;
}
```

### Framer Motion Integration
```typescript
// Animaciones con Framer Motion
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  hover: {
    y: -4,
    transition: { duration: 0.2, ease: "easeOut" }
  }
};

<motion.div
  variants={cardVariants}
  initial="hidden"
  animate="visible"
  whileHover="hover"
  className={styles.tripCard}
>
  {/* Contenido */}
</motion.div>
```

## Mobile Optimizations

### iOS Specific
```css
/* Prevenir zoom en inputs */
input, textarea, select {
  font-size: 16px !important;
  -webkit-appearance: none;
  appearance: none;
}

/* Safe Areas */
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Touch Optimizations */
.touch-target {
  min-height: 44px; /* iOS minimum touch target */
  min-width: 44px;
}
```

### Android Specific
```css
/* Material Design ripple effect */
.ripple {
  position: relative;
  overflow: hidden;
}

.ripple::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.ripple:active::before {
  width: 300px;
  height: 300px;
}
```

## Performance

### CSS Optimization
```css
/* Use transform for animations (GPU accelerated) */
.smooth-transform {
  will-change: transform;
  transform: translateZ(0); /* Force hardware acceleration */
}

/* Avoid expensive properties */
.optimized {
  /* Good: transform, opacity */
  transform: translateX(100px);
  opacity: 0.5;
  
  /* Avoid: width, height, top, left */
  /* width: 100px; - Causes layout recalculation */
}
```

### Critical CSS
- Estilos críticos inline en `index.html`
- Lazy load de estilos no críticos
- Tree shaking automático con Vite

## Accessibility

### Color Contrast
- Todos los textos cumplen WCAG AA (4.5:1 ratio)
- Indicadores visuales no dependen solo del color
- Modo de alto contraste disponible

### Focus States
```css
.focusable {
  outline: none;
  transition: box-shadow 0.2s ease;
}

.focusable:focus-visible {
  box-shadow: 0 0 0 2px var(--brand-primary);
  outline: 2px solid transparent;
}
```

### Screen Readers
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```
