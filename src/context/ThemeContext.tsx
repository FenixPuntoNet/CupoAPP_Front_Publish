import React, { createContext, useContext, useEffect, useState } from 'react';
import { MantineColorScheme } from '@mantine/core';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  mantineColorScheme: MantineColorScheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Verificar preferencia guardada o usar oscuro como default
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('cupo-theme');
    return (saved as Theme) || 'dark';
  });

  // Aplicar el tema al DOM
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      // Forzar actualización de variables CSS custom
      root.setAttribute('data-mantine-color-scheme', 'dark');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      // Forzar actualización de variables CSS custom
      root.setAttribute('data-mantine-color-scheme', 'light');
    }
    
    // Guardar preferencia
    localStorage.setItem('cupo-theme', theme);
    
    // Dispatch un evento personalizado para que los componentes puedan reaccionar
    const themeChangeEvent = new CustomEvent('cupo-theme-change', { 
      detail: { theme } 
    });
    window.dispatchEvent(themeChangeEvent);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      
      // Pequeño retraso para permitir que React actualice el estado
      setTimeout(() => {
        // Forzar un refresh suave de los estilos
        const root = document.documentElement;
        
        // Temporalmente ocultar el contenido para evitar el parpadeo
        root.style.opacity = '0.98';
        root.style.transition = 'opacity 0.15s ease';
        
        // Después de un pequeño retraso, restaurar la visibilidad
        setTimeout(() => {
          root.style.opacity = '1';
          
          // Limpiar las propiedades de estilo después de la transición
          setTimeout(() => {
            root.style.removeProperty('opacity');
            root.style.removeProperty('transition');
          }, 150);
        }, 50);
      }, 10);
      
      return newTheme;
    });
  };

  const mantineColorScheme: MantineColorScheme = theme;

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      mantineColorScheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
