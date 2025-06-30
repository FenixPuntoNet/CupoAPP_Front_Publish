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
import { supabase } from '@/lib/supabaseClient';
import styles from './RecuperarPassword.module.css';

const RecoverPasswordView = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', '?'));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    if (!access_token || !refresh_token) {
      setError('El enlace no es válido o ha expirado.');
      return;
    }

    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      if (error) {
        setError('Error al establecer sesión. Intenta de nuevo.');
      } else {
        setTokenChecked(true);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError('No se pudo actualizar la contraseña.');
    } else {
      setSuccess(true);
      setTimeout(() => {
        navigate({ to: '/Login' });
      }, 2000);
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
