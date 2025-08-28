import { memo } from 'react';
import { Loader, Text, Stack, Box } from '@mantine/core';
import styles from './SmartLoader.module.css';

interface SmartLoaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  minimal?: boolean;
  inline?: boolean;
  variant?: 'dots' | 'bars' | 'oval' | 'spin';
  color?: string;
  overlay?: boolean;
}

// 🚀 Componente de loading optimizado con múltiples variantes
export const SmartLoader = memo<SmartLoaderProps>(({
  size = 'md',
  text,
  minimal = false,
  inline = false,
  variant = 'dots',
  color = '#00ff9d',
  overlay = false
}) => {
  if (minimal) {
    return (
      <Box className={inline ? styles.inlineMinimal : styles.minimal}>
        <Loader size={size} color={color} type={variant} />
      </Box>
    );
  }

  const content = (
    <Stack align="center" gap="md" className={styles.container}>
      <Loader size={size} color={color} type={variant} />
      {text && (
        <Text size="sm" c="white" ta="center" className={styles.text}>
          {text}
        </Text>
      )}
    </Stack>
  );

  if (overlay) {
    return (
      <Box className={styles.overlay}>
        {content}
      </Box>
    );
  }

  return content;
});

SmartLoader.displayName = 'SmartLoader';

// 🚀 Variante para skeletons de contenido
export const ContentSkeleton = memo<{ lines?: number; height?: number }>(({
  lines = 3,
  height = 20
}) => {
  return (
    <Stack gap="sm" className={styles.skeleton}>
      {Array.from({ length: lines }).map((_, index) => (
        <Box
          key={index}
          className={styles.skeletonLine}
          style={{
            height: `${height}px`,
            width: index === lines - 1 ? '60%' : '100%'
          }}
        />
      ))}
    </Stack>
  );
});

ContentSkeleton.displayName = 'ContentSkeleton';

// 🚀 Loading para listas
export const ListSkeleton = memo<{ items?: number; itemHeight?: number }>(({
  items = 5,
  itemHeight = 80
}) => {
  return (
    <Stack gap="md" className={styles.listSkeleton}>
      {Array.from({ length: items }).map((_, index) => (
        <Box
          key={index}
          className={styles.listItem}
          style={{ height: `${itemHeight}px` }}
        >
          <Box className={styles.listItemContent}>
            <Box className={styles.listItemAvatar} />
            <Stack gap="xs" style={{ flex: 1 }}>
              <Box className={styles.listItemTitle} />
              <Box className={styles.listItemSubtitle} />
            </Stack>
          </Box>
        </Box>
      ))}
    </Stack>
  );
});

ListSkeleton.displayName = 'ListSkeleton';

// 🚀 Loading para cards
export const CardSkeleton = memo<{ count?: number }>(({ count = 3 }) => {
  return (
    <div className={styles.cardGrid}>
      {Array.from({ length: count }).map((_, index) => (
        <Box key={index} className={styles.cardSkeleton}>
          <Box className={styles.cardImage} />
          <Stack gap="xs" p="md">
            <Box className={styles.cardTitle} />
            <Box className={styles.cardSubtitle} />
            <Box className={styles.cardButton} />
          </Stack>
        </Box>
      ))}
    </div>
  );
});

CardSkeleton.displayName = 'CardSkeleton';
