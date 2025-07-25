import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  TextInput,
  Button,
  Text,
  Notification,
  Stack,
  Paper,
  LoadingOverlay
} from '@mantine/core';
import { forgotPassword } from '@/services/auth';
import styles from './RecuperarPassword.module.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSent(false);

    const result = await forgotPassword(email);

    if (result.success) {
      setSent(true);
    } else {
      setError(result.error || 'Error enviando enlace de recuperación');
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

            {sent && <Notification color="green" title="Correo enviado">Revisa tu bandeja de entrada o spam.</Notification>}
            {error && <Notification color="red" title="Error">{error}</Notification>}

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
