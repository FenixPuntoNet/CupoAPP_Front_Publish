import React, { useState } from 'react';
import {
  Modal,
  Text,
  Button,
  Stack,
  Alert,
  Card,
  Group,
  LoadingOverlay,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import {
  RotateCcw,
  CheckCircle,
  UserCheck,
  Shield,
  Eye,
  EyeOff,
  Mail,
  Lock,
} from 'lucide-react';
import { useForm } from '@mantine/form';
import { recoverAccount } from '@/services/accounts';
import { useErrorHandling } from '@/hooks/useErrorHandling';
import styles from './RecoverAccountModal.module.css';

interface RecoverAccountModalProps {
  opened: boolean;
  onClose: () => void;
}

interface RecoverFormValues {
  email: string;
  password: string;
}

interface RecoveryError {
  error: string;
  current_status?: string;
  recoverable_statuses?: string[];
  contact_support?: boolean;
}

type Step = 'form' | 'success' | 'error';

export const RecoverAccountModal: React.FC<RecoverAccountModalProps> = ({
  opened,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryError, setRecoveryError] = useState<RecoveryError | null>(null);
  const { handleBackendError, showSuccess, handleValidationError } = useErrorHandling();

  const form = useForm<RecoverFormValues>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => {
        const validationError = handleValidationError('email', value);
        return validationError ? validationError.message : null;
      },
      password: (value) => {
        const validationError = handleValidationError('password', value);
        return validationError ? validationError.message : null;
      },
    }
  });

  const resetModal = () => {
    setStep('form');
    setLoading(false);
    setShowPassword(false);
    setRecoveryError(null);
    form.reset();
  };

  const handleModalClose = () => {
    resetModal();
    onClose();
  };

  const handleRecover = async (values: RecoverFormValues) => {
    try {
      setLoading(true);
      setRecoveryError(null);
      
      console.log('🔄 Attempting to recover account for:', values.email);
      
      const result = await recoverAccount({
        email: values.email,
        password: values.password
      });

      if (!result.success) {
        console.error('❌ Failed to recover account:', result.error);
        
        // Verificar si es un error específico de recuperación de cuenta
        if (result.error && typeof result.error === 'object' && 'current_status' in result.error) {
          const errorData = result.error as any;
          setRecoveryError({
            error: errorData.error || 'No se pudo recuperar la cuenta',
            current_status: errorData.current_status,
            recoverable_statuses: errorData.recoverable_statuses,
            contact_support: true
          });
          setStep('error');
          return;
        }
        
        // Si no es un error específico, usar el manejo normal
        handleBackendError(result.error || 'Error al recuperar la cuenta', {
          id: 'recover-account-error',
          autoClose: 6000
        });
        return;
      }

      console.log('✅ Account recovered successfully');
      
      setStep('success');
      
      showSuccess(
        'Cuenta recuperada',
        result.message || 'Tu cuenta ha sido recuperada exitosamente',
        { autoClose: 5000 }
      );

    } catch (error: any) {
      console.error('❌ Unexpected error recovering account:', error);
      
      // Si el error contiene información de status, mostrarlo específicamente
      if (error.message && error.message.includes('Esta cuenta no puede ser recuperada')) {
        setRecoveryError({
          error: error.message,
          contact_support: true
        });
        setStep('error');
      } else {
        handleBackendError(error, {
          id: 'recover-account-error',
          autoClose: 6000
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderFormStep = () => (
    <Stack gap="lg">
      <Group gap="sm">
        <Shield size={24} color="var(--mantine-color-blue-6)" />
        <Text size="lg" fw={600}>
          Recuperar cuenta
        </Text>
      </Group>

      <Alert icon={<UserCheck size={16} />} color="blue">
        <Text fw={500}>Recuperar cuenta desactivada</Text>
        <Text size="sm" c="dimmed" mt={4}>
          Si tu cuenta fue desactivada, puedes reactivarla ingresando 
          tus credenciales para verificar tu identidad.
        </Text>
      </Alert>

      <Stack gap="md">
        <div>
          <Text size="sm" fw={500} mb={8}>
            <Mail size={16} style={{ display: 'inline', marginRight: 8 }} />
            Correo electrónico
          </Text>
          <TextInput
            placeholder="ejemplo@correo.com"
            size="md"
            required
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="email"
            inputMode="email"
            {...form.getInputProps('email')}
          />
        </div>

        <div>
          <Text size="sm" fw={500} mb={8}>
            <Lock size={16} style={{ display: 'inline', marginRight: 8 }} />
            Contraseña
          </Text>
          <TextInput
            type={showPassword ? 'text' : 'password'}
            placeholder="Ingresa tu contraseña"
            size="md"
            required
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="current-password"
            {...form.getInputProps('password')}
            rightSection={
              <UnstyledButton
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--mantine-color-dimmed)',
                  borderRadius: 8
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </UnstyledButton>
            }
          />
        </div>
      </Stack>

      <Card withBorder p="md">
        <Stack gap="sm">
          <Text fw={500}>¿Qué sucederá al recuperar tu cuenta?</Text>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">• Se verificarán tus credenciales</Text>
            <Text size="sm" c="dimmed">• Tu cuenta será reactivada inmediatamente</Text>
            <Text size="sm" c="dimmed">• Recuperarás acceso completo a la aplicación</Text>
            <Text size="sm" c="dimmed">• Tus datos y configuraciones se mantendrán</Text>
          </Stack>
        </Stack>
      </Card>

      <Alert icon={<CheckCircle size={16} />} color="green" variant="light">
        <Text size="sm">
          Al hacer clic en "Recuperar cuenta", verificaremos tu identidad 
          y reactivaremos tu cuenta automáticamente.
        </Text>
      </Alert>
    </Stack>
  );

  const renderSuccessStep = () => (
    <Stack gap="lg" align="center">
      <div className={styles.successIcon}>
        <CheckCircle size={48} color="var(--mantine-color-green-6)" />
      </div>

      <Text ta="center" fw={600} size="lg">
        ¡Cuenta recuperada exitosamente!
      </Text>

      <Text ta="center" c="dimmed">
        Tu cuenta ha sido reactivada. Ya puedes usar todas las funciones 
        de la aplicación normalmente.
      </Text>

      <Alert color="green" variant="light">
        <Text size="sm" ta="center">
          Bienvenido de vuelta. Tu cuenta está completamente funcional.
        </Text>
      </Alert>
    </Stack>
  );

  const renderErrorStep = () => (
    <Stack gap="lg" align="center">
      <div className={styles.errorIcon}>
        <Shield size={48} color="var(--mantine-color-red-6)" />
      </div>

      <Text ta="center" fw={600} size="lg" c="red">
        No se puede recuperar la cuenta
      </Text>

      {recoveryError && (
        <>
          <Alert color="red" variant="light" icon={<Shield size={16} />}>
            <Text fw={500} mb="xs">Estado actual de la cuenta</Text>
            <Text size="sm">
              {recoveryError.error}
            </Text>
            {recoveryError.current_status && (
              <Text size="xs" c="dimmed" mt="xs">
                Estado: {recoveryError.current_status}
              </Text>
            )}
          </Alert>

          {recoveryError.contact_support && (
            <Card withBorder p="md" style={{ width: '100%' }}>
              <Stack gap="sm">
                <Text fw={500} ta="center">¿Necesitas ayuda?</Text>
                <Text size="sm" c="dimmed" ta="center">
                  Para cuentas con eliminación permanente, necesitas contactar 
                  a nuestro equipo de soporte.
                </Text>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">• Envía un email a: soporte@cupo.dev</Text>
                  <Text size="sm" c="dimmed">• Incluye tu email registrado</Text>
                  <Text size="sm" c="dimmed">• Explica el motivo de la recuperación</Text>
                </Stack>
              </Stack>
            </Card>
          )}

          {recoveryError.recoverable_statuses && (
            <Alert color="blue" variant="light">
              <Text size="sm">
                <strong>Estados recuperables automáticamente:</strong><br />
                {recoveryError.recoverable_statuses.join(', ')}
              </Text>
            </Alert>
          )}
        </>
      )}
    </Stack>
  );

  const renderFooterButtons = () => {
    switch (step) {
      case 'form':
        return (
          <Group justify="apart">
            <Button variant="light" onClick={handleModalClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="recover-form"
              disabled={loading}
              leftSection={<RotateCcw size={16} />}
            >
              {loading ? 'Recuperando...' : 'Recuperar cuenta'}
            </Button>
          </Group>
        );

      case 'success':
        return (
          <Group justify="center">
            <Button onClick={handleModalClose}>
              Continuar
            </Button>
          </Group>
        );

      case 'error':
        return (
          <Group justify="center">
            <Button variant="light" onClick={() => setStep('form')}>
              Intentar de nuevo
            </Button>
            <Button onClick={handleModalClose}>
              Cerrar
            </Button>
          </Group>
        );

      default:
        return null;
    }
  };

  const getModalTitle = () => {
    switch (step) {
      case 'form':
        return 'Recuperar cuenta desactivada';
      case 'success':
        return 'Cuenta recuperada';
      case 'error':
        return 'Error en recuperación';
      default:
        return 'Recuperar cuenta';
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={step === 'success' ? handleModalClose : handleModalClose}
      title={getModalTitle()}
      size="md"
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
      withCloseButton={!loading}
    >
      <LoadingOverlay visible={loading} />
      
      <div className={styles.modalContent}>
        {step === 'form' && (
          <form id="recover-form" onSubmit={form.onSubmit(handleRecover)}>
            {renderFormStep()}
          </form>
        )}
        {step === 'success' && renderSuccessStep()}
        {step === 'error' && renderErrorStep()}
      </div>

      <Group mt="xl">
        {renderFooterButtons()}
      </Group>
    </Modal>
  );
};
