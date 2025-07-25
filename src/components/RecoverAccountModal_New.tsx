import React, { useState } from 'react';
import {
  Modal,
  Text,
  Button,
  Stack,
  TextInput,
  Alert,
  Card,
  Group,
  LoadingOverlay,
  PasswordInput,
} from '@mantine/core';
import {
  RotateCcw,
  CheckCircle,
  UserCheck,
} from 'lucide-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { recoverAccount } from '@/services/auth';
import styles from './RecoverAccountModal.module.css';

interface RecoverAccountModalProps {
  opened: boolean;
  onClose: () => void;
}

interface RecoverFormValues {
  email: string;
  password: string;
}

type Step = 'input' | 'success';

export const RecoverAccountModal: React.FC<RecoverAccountModalProps> = ({
  opened,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('input');
  const [error, setError] = useState('');

  const form = useForm<RecoverFormValues>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Correo electrónico inválido'),
      password: (value) => (value.length >= 6 ? null : 'La contraseña debe tener al menos 6 caracteres'),
    },
  });

  const resetModal = () => {
    setStep('input');
    setError('');
    form.reset();
    setLoading(false);
  };

  const handleModalClose = () => {
    resetModal();
    onClose();
  };

  const recoverAccountHandler = async (values: RecoverFormValues) => {
    try {
      setLoading(true);
      setError('');

      console.log('🔄 Iniciando recuperación de cuenta para:', values.email);

      const result = await recoverAccount(values.email, values.password);

      if (!result.success) {
        setError(result.error || 'Error al recuperar la cuenta');
        return;
      }

      // Éxito en la recuperación
      setStep('success');
      
      notifications.show({
        title: '¡Cuenta recuperada exitosamente!',
        message: result.message || 'Tu cuenta ha sido reactivada. Ya puedes iniciar sesión.',
        color: 'green',
        icon: <CheckCircle size={16} />,
        autoClose: 5000,
      });

      console.log('✅ Cuenta recuperada exitosamente para:', values.email);

    } catch (error) {
      console.error('❌ Error en recuperación de cuenta:', error);
      setError('Error inesperado al recuperar la cuenta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderInputStep = () => (
    <Stack gap="md">
      <div className={styles.header}>
        <RotateCcw size={36} className={styles.icon} />
        <Text size="lg" fw={700} ta="center" className={styles.title}>
          Recuperar cuenta
        </Text>
        <Text size="sm" c="dimmed" ta="center" className={styles.subtitle}>
          Ingresa tus credenciales para reactivar tu cuenta desactivada
        </Text>
      </div>

      {error && (
        <Alert color="red" title="Error" variant="light">
          {error}
        </Alert>
      )}

      <form onSubmit={form.onSubmit(recoverAccountHandler)}>
        <Stack gap="md">
          <TextInput
            label="Correo electrónico"
            placeholder="ejemplo@correo.com"
            size="md"
            required
            disabled={loading}
            autoFocus
            {...form.getInputProps('email')}
          />

          <PasswordInput
            label="Contraseña"
            placeholder="Ingresa tu contraseña"
            size="md"
            required
            disabled={loading}
            {...form.getInputProps('password')}
          />

          <Stack gap="xs" mt="md">
            <Button
              type="submit"
              loading={loading}
              size="md"
              fullWidth
              leftSection={<RotateCcw size={16} />}
            >
              {loading ? 'Recuperando cuenta...' : 'Recuperar cuenta'}
            </Button>
            <Button
              variant="subtle"
              size="md"
              fullWidth
              onClick={handleModalClose}
              disabled={loading}
            >
              Cancelar
            </Button>
          </Stack>
        </Stack>
      </form>

      <Card mt="lg" p="md" radius="md" className={styles.infoCard}>
        <Group gap="sm" align="flex-start">
          <UserCheck size={16} className={styles.infoIcon} />
          <div>
            <Text size="sm" fw={500} className={styles.infoTitle}>
              ¿Qué es la recuperación de cuenta?
            </Text>
            <Text size="xs" c="dimmed" className={styles.infoText}>
              Si tu cuenta fue desactivada temporalmente o está marcada para eliminación, 
              puedes reactivarla utilizando tus credenciales originales.
            </Text>
          </div>
        </Group>
      </Card>
    </Stack>
  );

  const renderSuccessStep = () => (
    <Stack gap="lg" align="center">
      <CheckCircle size={64} className={styles.successIcon} />
      <div className={styles.successContent}>
        <Text size="lg" fw={700} ta="center" className={styles.successTitle}>
          ¡Cuenta recuperada exitosamente!
        </Text>
        <Text size="sm" c="dimmed" ta="center" className={styles.successText}>
          Tu cuenta ha sido reactivada. Ya puedes iniciar sesión normalmente.
        </Text>
      </div>
      <Button
        size="md"
        fullWidth
        onClick={handleModalClose}
        leftSection={<CheckCircle size={16} />}
      >
        Continuar
      </Button>
    </Stack>
  );

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
      title={step === 'input' ? 'Recuperar Cuenta' : 'Éxito'}
      size="md"
      centered
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
      withCloseButton={!loading}
      className={styles.modal}
    >
      <LoadingOverlay visible={loading} />
      
      <div className={styles.content}>
        {step === 'input' && renderInputStep()}
        {step === 'success' && renderSuccessStep()}
      </div>
    </Modal>
  );
};
