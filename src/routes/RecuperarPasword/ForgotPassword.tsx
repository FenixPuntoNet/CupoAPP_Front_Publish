import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  TextInput,
  Button,
  Text,
  Stack,
  LoadingOverlay,
  Alert,
  Card,
  Group,
  UnstyledButton,
  Progress
} from '@mantine/core';
import {
  Mail,
  ArrowLeft,
  CheckCircle,
  Shield,
  RotateCcw,
  Eye,
  Sparkles
} from 'lucide-react';
import { forgotPassword } from '@/services/auth';
import { useErrorHandling } from '@/hooks/useErrorHandling';
import styles from './RecuperarPassword.module.css';

type Step = 'email' | 'sent' | 'success';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('email');
  const [error, setError] = useState('');
  const { showSuccess } = useErrorHandling();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Por favor ingresa tu correo electrónico');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }

    setLoading(true);

    try {
      const result = await forgotPassword(email);

      if (result.success) {
        setStep('sent');
        showSuccess(
          'Correo enviado',
          'Revisa tu bandeja de entrada o carpeta de spam',
          { autoClose: 4000 }
        );
      } else {
        setError(result.error || 'Error enviando enlace de recuperación');
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    window.location.href = '/Login';
  };

  const renderEmailStep = () => (
    <Stack gap="xl">
      {/* Header con icono */}
      <div className={styles.iconWrapper}>
        <Shield size={32} className={styles.icon} />
      </div>

      <div className={styles.titleSection}>
        <Text className={styles.title}>Recuperar contraseña</Text>
        <Text className={styles.subtitle}>
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
        </Text>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          <div>
            <Text size="sm" fw={500} mb={8} className={styles.inputLabel}>
              <Mail size={16} style={{ display: 'inline', marginRight: 8 }} />
              Correo electrónico
            </Text>
            <TextInput
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              size="lg"
              required
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="email"
              inputMode="email"
              className={styles.emailInput}
              error={error}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            fullWidth
            className={styles.primaryButton}
            loading={loading}
            leftSection={loading ? <RotateCcw size={18} /> : <Mail size={18} />}
          >
            {loading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
          </Button>
        </Stack>
      </form>

      {/* Información adicional */}
      <Card className={styles.infoCard} withBorder>
        <Stack gap="sm">
          <Group gap="sm">
            <Eye size={16} className={styles.infoIcon} />
            <Text fw={500} size="sm">¿Qué sucederá después?</Text>
          </Group>
          <Stack gap="xs">
            <Text size="sm" className={styles.infoText}>• Recibirás un correo con un enlace seguro</Text>
            <Text size="sm" className={styles.infoText}>• El enlace expira en 1 hora por seguridad</Text>
            <Text size="sm" className={styles.infoText}>• Podrás establecer una nueva contraseña</Text>
          </Stack>
        </Stack>
      </Card>

      {/* Botón de regreso */}
      <UnstyledButton onClick={handleBackToLogin} className={styles.backButton}>
        <Group gap="sm" justify="center">
          <ArrowLeft size={16} />
          <Text size="sm">Volver al inicio de sesión</Text>
        </Group>
      </UnstyledButton>
    </Stack>
  );

  const renderSentStep = () => (
    <Stack gap="xl" align="center">
      {/* Icono de éxito */}
      <div className={styles.successIconWrapper}>
        <CheckCircle size={48} className={styles.successIcon} />
      </div>

      <div className={styles.titleSection}>
        <Text className={styles.successTitle}>¡Correo enviado!</Text>
        <Text className={styles.subtitle}>
          Hemos enviado un enlace de recuperación a:
        </Text>
        <Text className={styles.emailDisplay}>{email}</Text>
      </div>

      {/* Instrucciones */}
      <Alert
        icon={<Sparkles size={16} />}
        className={styles.instructionsAlert}
        variant="light"
      >
        <Stack gap="xs">
          <Text fw={500} size="sm">Revisa tu correo electrónico</Text>
          <Text size="sm">
            • Busca en tu bandeja de entrada y spam
            <br />
            • Haz clic en el enlace para continuar
            <br />
            • El enlace expira en 1 hora
          </Text>
        </Stack>
      </Alert>

      {/* Botones de acción */}
      <Stack gap="md" style={{ width: '100%' }}>
        <Button
          variant="light"
          size="lg"
          fullWidth
          onClick={() => setStep('email')}
          leftSection={<RotateCcw size={18} />}
          className={styles.secondaryButton}
        >
          Enviar a otro correo
        </Button>

        <UnstyledButton onClick={handleBackToLogin} className={styles.backButton}>
          <Group gap="sm" justify="center">
            <ArrowLeft size={16} />
            <Text size="sm">Volver al inicio de sesión</Text>
          </Group>
        </UnstyledButton>
      </Stack>
    </Stack>
  );

  return (
    <div className={styles.container}>
      <LoadingOverlay visible={loading} className={styles.overlay} />
      
      {/* Progress indicator */}
      <div className={styles.progressWrapper}>
        <Progress 
          value={step === 'email' ? 50 : 100} 
          className={styles.progress}
          size="sm" 
        />
      </div>

      <div className={styles.content}>
        <div className={styles.card}>
          {step === 'email' && renderEmailStep()}
          {step === 'sent' && renderSentStep()}
        </div>
      </div>

      {/* Background decorations */}
      <div className={styles.backgroundDecoration} />
      <div className={styles.backgroundDecoration2} />
    </div>
  );
};

export const Route = createFileRoute('/RecuperarPasword/ForgotPassword')({
  component: ForgotPassword,
});
