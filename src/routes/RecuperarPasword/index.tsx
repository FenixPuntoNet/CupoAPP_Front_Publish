import { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  PasswordInput,
  Button,
  Stack,
  Paper,
  Text,
  LoadingOverlay
} from '@mantine/core';
import { resetPassword } from '@/services/auth';
import styles from './RecuperarPassword.module.css';

const RecoverPasswordView = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', '?'));
    const access_token = params.get('access_token');
    const emailParam = params.get('email');
    
    if (!access_token || !emailParam) {
      setError('El enlace no es válido o ha expirado.');
      return;
    }

    setEmail(emailParam);
    setToken(access_token);
    setTokenChecked(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    
    const result = await resetPassword(email, token, password);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate({ to: '/Login' });
      }, 2000);
    } else {
      setError(result.error || 'No se pudo actualizar la contraseña.');
    }

    setLoading(false);
  };

  if (error) {
    return (
      <div className={styles.container}>
        <Paper className={styles.paper}>
          <Text className={styles.error}>{error}</Text>
          <Button fullWidth mt="md" onClick={() => navigate({ to: '/Login' })}>
            Volver al login
          </Button>
        </Paper>
      </div>
    );
  }

  if (!tokenChecked) {
    return (
      <div className={styles.container}>
        <LoadingOverlay visible />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Paper className={styles.paper} withBorder>
        <form onSubmit={handleSubmit}>
          <Stack>
            <Text className={styles.title}>Nueva contraseña</Text>
            <PasswordInput
              label="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
            />
            <PasswordInput
              label="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.currentTarget.value)}
              required
            />
            <Button type="submit" fullWidth loading={loading}>
              Establecer contraseña
            </Button>
            {success && <Text className={styles.success}>Contraseña actualizada correctamente.</Text>}
          </Stack>
        </form>
      </Paper>
    </div>
  );
};

export const Route = createFileRoute('/RecuperarPasword/')({
  component: RecoverPasswordView,
});
