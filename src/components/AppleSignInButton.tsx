import React from 'react';
import { Button } from '@mantine/core';
import { IconBrandApple } from '@tabler/icons-react';
import styles from './AppleSignInButton.module.css';

interface AppleSignInButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  text?: string;
  variant?: 'login' | 'register';
}

const AppleSignInButton: React.FC<AppleSignInButtonProps> = ({
  onClick,
  loading = false,
  disabled = false,
  text,
  variant = 'login'
}) => {
  const buttonText = text || (variant === 'login' ? 'Continuar con Apple' : 'Registrarse con Apple');

  return (
    <Button
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      className={styles.appleButton}
      size="md"
      fullWidth
      leftSection={!loading && <IconBrandApple size={20} />}
      variant="filled"
      color="dark"
    >
      {buttonText}
    </Button>
  );
};

export default AppleSignInButton;
