import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  PasswordInput,
  Button,
  Stack,
  Text,
  LoadingOverlay,
  Alert,
  Card,
  Group,
  UnstyledButton,
  Progress
} from '@mantine/core';
import {
  Lock,
  CheckCircle,
  ArrowLeft,
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { resetPassword } from '@/services/auth';
import styles from './RecuperarPassword.module.css';

type Step = 'loading' | 'form' | 'success' | 'error';

interface PasswordValidation {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}

const RecoverPasswordView = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('loading');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  useEffect(() => {
    console.log('🔄 Parsing URL parameters for password reset...');
    
    // Verificar si vienen parámetros de error (enlace expirado)
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    const errorCode = urlParams.get('error_code');
    const errorDescription = urlParams.get('error_description');
    
    // Verificar si es una redirección exitosa desde el backend
    const token = urlParams.get('token');
    const emailFromUrl = urlParams.get('email');
    const verified = urlParams.get('verified');
    
    console.log('📊 URL Parameters:', {
      error: errorParam,
      error_code: errorCode,
      error_description: errorDescription,
      token: token ? '✅ Found' : '❌ Missing',
      email: emailFromUrl || 'Not provided',
      verified: verified
    });
    
    setTimeout(() => {
      // Si hay error de Supabase (enlace expirado/inválido)
      if (errorParam === 'access_denied' || errorCode === 'otp_expired') {
        console.error('❌ Supabase link error:', { errorParam, errorCode, errorDescription });
        setError('El enlace de recuperación ha expirado o es inválido. Solicita un nuevo enlace.');
        setStep('error');
        return;
      }
      
      // Si hay otros errores
      if (errorParam) {
        console.error('❌ Other URL error:', errorParam);
        setError(`Error: ${errorDescription || errorParam}`);
        setStep('error');
        return;
      }

      // Si es una redirección exitosa desde el backend con token verificado
      if (verified === 'true' && token && emailFromUrl) {
        console.log('✅ Valid verified token from backend');
        setEmail(emailFromUrl);
        setToken(token);
        setStep('form');
        return;
      }

      // Si no hay parámetros válidos
      console.error('❌ No valid parameters found');
      setError('El enlace de recuperación no es válido. Solicita un nuevo enlace desde el formulario de recuperación.');
      setStep('error');
    }, 1000);
  }, []);

  useEffect(() => {
    const validation = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    setPasswordValidation(validation);
  }, [password]);

  const getPasswordStrength = () => {
    const validCount = Object.values(passwordValidation).filter(Boolean).length;
    if (validCount < 2) return { strength: 'weak', color: 'red', text: 'Débil' };
    if (validCount < 4) return { strength: 'medium', color: 'yellow', text: 'Media' };
    return { strength: 'strong', color: 'green', text: 'Fuerte' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    const validCount = Object.values(passwordValidation).filter(Boolean).length;
    if (validCount < 3) {
      setError('La contraseña no cumple con los requisitos mínimos');
      return;
    }

    setLoading(true);
    
    try {
      const result = await resetPassword(email, token, password);

      if (result.success) {
        setStep('success');
        setTimeout(() => {
          window.location.href = '/Login';
        }, 3000);
      } else {
        setError(result.error || 'No se pudo actualizar la contraseña');
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

  const renderLoadingStep = () => (
    <Stack gap="xl" align="center">
      <div className={styles.iconWrapper}>
        <Shield size={32} className={styles.loadingIcon} />
      </div>
      <Text className={styles.title}>Verificando enlace...</Text>
      <Text className={styles.subtitle}>
        Por favor espera mientras validamos tu enlace de recuperación
      </Text>
    </Stack>
  );

  const renderFormStep = () => {
    const strengthInfo = getPasswordStrength();
    
    return (
      <Stack gap="xl">
        {/* Header */}
        <div className={styles.iconWrapper}>
          <Lock size={32} className={styles.icon} />
        </div>

        <div className={styles.titleSection}>
          <Text className={styles.title}>Nueva contraseña</Text>
          <Text className={styles.subtitle}>
            Crea una contraseña segura para tu cuenta
          </Text>
          <Text className={styles.emailDisplay}>{email}</Text>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
            {/* Campo de nueva contraseña */}
            <div>
              <Text size="sm" fw={500} mb={8} className={styles.inputLabel}>
                <Lock size={16} style={{ display: 'inline', marginRight: 8 }} />
                Nueva contraseña
              </Text>
              <PasswordInput
                placeholder="Ingresa tu nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                size="lg"
                required
                className={styles.passwordInput}
                visibilityToggleIcon={({ reveal }) =>
                  reveal ? <EyeOff size={18} /> : <Eye size={18} />
                }
              />
              
              {/* Indicador de fortaleza */}
              {password && (
                <div className={styles.strengthWrapper}>
                  <Progress 
                    value={(Object.values(passwordValidation).filter(Boolean).length / 5) * 100}
                    color={strengthInfo.color}
                    size="sm"
                    className={styles.strengthBar}
                  />
                  <Text size="xs" className={styles.strengthText}>
                    Fortaleza: {strengthInfo.text}
                  </Text>
                </div>
              )}
            </div>

            {/* Campo de confirmar contraseña */}
            <div>
              <Text size="sm" fw={500} mb={8} className={styles.inputLabel}>
                <Shield size={16} style={{ display: 'inline', marginRight: 8 }} />
                Confirmar contraseña
              </Text>
              <PasswordInput
                placeholder="Confirma tu nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                size="lg"
                required
                className={styles.passwordInput}
                visibilityToggleIcon={({ reveal }) =>
                  reveal ? <EyeOff size={18} /> : <Eye size={18} />
                }
                error={confirmPassword && password !== confirmPassword ? 'Las contraseñas no coinciden' : undefined}
              />
            </div>

            {/* Mensaje de error */}
            {error && (
              <Alert icon={<AlertTriangle size={16} />} color="red" className={styles.errorAlert}>
                {error}
              </Alert>
            )}

            {/* Botón de submit */}
            <Button
              type="submit"
              size="lg"
              fullWidth
              className={styles.primaryButton}
              loading={loading}
              disabled={!password || !confirmPassword || password !== confirmPassword}
              leftSection={loading ? undefined : <CheckCircle size={18} />}
            >
              {loading ? 'Actualizando contraseña...' : 'Establecer nueva contraseña'}
            </Button>
          </Stack>
        </form>

        {/* Requisitos de contraseña */}
        <Card className={styles.requirementsCard} withBorder>
          <Stack gap="sm">
            <Group gap="sm">
              <Shield size={16} className={styles.infoIcon} />
              <Text fw={500} size="sm">Requisitos de seguridad</Text>
            </Group>
            <Stack gap="xs">
              <div className={`${styles.requirement} ${passwordValidation.length ? styles.valid : ''}`}>
                <CheckCircle size={14} />
                <Text size="sm">Al menos 8 caracteres</Text>
              </div>
              <div className={`${styles.requirement} ${passwordValidation.uppercase ? styles.valid : ''}`}>
                <CheckCircle size={14} />
                <Text size="sm">Una letra mayúscula</Text>
              </div>
              <div className={`${styles.requirement} ${passwordValidation.lowercase ? styles.valid : ''}`}>
                <CheckCircle size={14} />
                <Text size="sm">Una letra minúscula</Text>
              </div>
              <div className={`${styles.requirement} ${passwordValidation.number ? styles.valid : ''}`}>
                <CheckCircle size={14} />
                <Text size="sm">Un número</Text>
              </div>
              <div className={`${styles.requirement} ${passwordValidation.special ? styles.valid : ''}`}>
                <CheckCircle size={14} />
                <Text size="sm">Un carácter especial</Text>
              </div>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    );
  };

  const renderSuccessStep = () => (
    <Stack gap="xl" align="center">
      <div className={styles.successIconWrapper}>
        <CheckCircle size={48} className={styles.successIcon} />
      </div>

      <div className={styles.titleSection}>
        <Text className={styles.successTitle}>¡Contraseña actualizada!</Text>
        <Text className={styles.subtitle}>
          Tu contraseña ha sido cambiada exitosamente
        </Text>
      </div>

      <Alert
        icon={<Sparkles size={16} />}
        className={styles.successAlert}
        variant="light"
      >
        <Text size="sm" ta="center">
          Serás redirigido al inicio de sesión en unos segundos...
        </Text>
      </Alert>

      <Button
        size="lg"
        fullWidth
        onClick={handleBackToLogin}
        className={styles.primaryButton}
        leftSection={<ArrowLeft size={18} />}
      >
        Ir al inicio de sesión
      </Button>
    </Stack>
  );

  const renderErrorStep = () => (
    <Stack gap="xl" align="center">
      <div className={styles.errorIconWrapper}>
        <AlertTriangle size={48} className={styles.errorIcon} />
      </div>

      <div className={styles.titleSection}>
        <Text className={styles.errorTitle}>Enlace inválido</Text>
        <Text className={styles.subtitle}>
          {error || 'El enlace no es válido o ha expirado'}
        </Text>
      </div>

      {/* Debug info en desarrollo */}
      {import.meta.env.DEV && (
        <Alert
          icon={<AlertTriangle size={16} />}
          color="orange"
          variant="light"
          style={{ width: '100%' }}
        >
          <Stack gap="xs">
            <Text fw={500} size="sm">Debug Info (Development)</Text>
            <Text size="xs" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              URL: {window.location.href}
            </Text>
            <Text size="xs" style={{ fontFamily: 'monospace' }}>
              Hash: {window.location.hash || 'No hash'}
            </Text>
            <Text size="xs" style={{ fontFamily: 'monospace' }}>
              Search: {window.location.search || 'No search params'}
            </Text>
            <Text size="xs" style={{ fontFamily: 'monospace' }}>
              API URL: {import.meta.env.VITE_API_URL || 'https://cupo-backend.fly.dev'}
            </Text>
          </Stack>
        </Alert>
      )}

      <Alert
        icon={<AlertTriangle size={16} />}
        className={styles.errorAlert}
        variant="light"
      >
        <Stack gap="xs">
          <Text fw={500} size="sm">¿Qué puedes hacer?</Text>
          <Text size="sm">
            • Solicita un nuevo enlace de recuperación
            <br />
            • Verifica que el enlace esté completo
            <br />
            • Asegúrate de hacer clic en el enlace desde tu email
            <br />
            • Contacta soporte si el problema persiste
          </Text>
        </Stack>
      </Alert>

      <Stack gap="md" style={{ width: '100%' }}>
        <Button
          size="lg"
          fullWidth
          onClick={() => window.location.href = '/RecuperarPasword/ForgotPassword'}
          className={styles.primaryButton}
          leftSection={<RotateCcw size={18} />}
        >
          Solicitar nuevo enlace
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
          value={step === 'loading' ? 25 : step === 'form' ? 75 : 100} 
          className={styles.progress}
          size="sm" 
        />
      </div>

      <div className={styles.content}>
        <div className={styles.card}>
          {step === 'loading' && renderLoadingStep()}
          {step === 'form' && renderFormStep()}
          {step === 'success' && renderSuccessStep()}
          {step === 'error' && renderErrorStep()}
        </div>
      </div>

      {/* Background decorations */}
      <div className={styles.backgroundDecoration} />
      <div className={styles.backgroundDecoration2} />
    </div>
  );
};

export const Route = createFileRoute('/RecuperarPasword/')({
  component: RecoverPasswordView,
});
