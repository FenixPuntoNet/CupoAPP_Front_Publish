import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  TextInput,
  Button,
  Text,
  Stack,
  Paper,
  LoadingOverlay
} from '@mantine/core';
import { forgotPassword } from '@/services/auth';
import { useErrorHandling } from '@/hooks/useErrorHandling';
import styles from './RecuperarPassword.module.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { handleBackendError, showSuccess } = useErrorHandling();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await forgotPassword(email);

    if (result.success) {
      showSuccess(
        'Correo enviado',
        'Revisa tu bandeja de entrada o carpeta de spam para continuar.',
        { autoClose: 8000 }
      );
    } else {
      handleBackendError(result.error || 'Error enviando enlace de recuperación', { autoClose: 6000 });
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <Paper className={styles.paper} withBorder>
        <LoadingOverlay visible={loading} />
        <form onSubmit={handleSubmit}>
          <Stack>
            <Text className={styles.title}>Recuperar contraseña</Text>
            <TextInput
              label="Correo electrónico"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
            />
            <Button type="submit" fullWidth>Enviar código</Button>

            <Button variant="subtle" fullWidth onClick={() => navigate({ to: '/Login' })}>
              Volver al inicio de sesión
            </Button>
          </Stack>
        </form>
      </Paper>
    </div>
  );
};

export const Route = createFileRoute('/RecuperarPasword/ForgotPassword')({
  component: ForgotPassword,
});
