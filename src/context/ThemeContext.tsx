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
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    
    // Guardar preferencia
    localStorage.setItem('cupo-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
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
