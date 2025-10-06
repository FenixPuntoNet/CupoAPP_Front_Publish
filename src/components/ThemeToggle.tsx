import React, { useState } from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import styles from './ThemeToggle.module.css';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isChanging, setIsChanging] = useState(false);

  const handleToggle = () => {
    setIsChanging(true);
    toggleTheme();
    
    // Reset del estado después de la animación
    setTimeout(() => {
      setIsChanging(false);
    }, 300);
  };

  return (
    <Tooltip 
      label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      position="bottom"
    >
      <ActionIcon
        onClick={handleToggle}
        variant="subtle"
        size="lg"
        className={`${styles.themeToggle} ${isChanging ? styles.changing : ''}`}
        aria-label="Toggle theme"
        disabled={isChanging}
      >
        {theme === 'dark' ? (
          <Sun className={styles.icon} />
        ) : (
          <Moon className={styles.icon} />
        )}
      </ActionIcon>
    </Tooltip>
  );
};
