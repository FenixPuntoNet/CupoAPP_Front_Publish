import React from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import styles from './ThemeToggle.module.css';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Tooltip 
      label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      position="bottom"
    >
      <ActionIcon
        onClick={toggleTheme}
        variant="subtle"
        size="lg"
        className={styles.themeToggle}
        aria-label="Toggle theme"
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
