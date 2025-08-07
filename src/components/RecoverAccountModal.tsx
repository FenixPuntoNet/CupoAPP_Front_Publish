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
} from '@mantine/core';
import {
  RotateCcw,
  CheckCircle,
  UserCheck,
  Shield,
} from 'lucide-react';
import { notifications } from '@mantine/notifications';
import { recoverAccount } from '@/services/accounts';
import styles from './RecoverAccountModal.module.css';

interface RecoverAccountModalProps {
  opened: boolean;
  onClose: () => void;
}

type Step = 'confirm' | 'success';

export const RecoverAccountModal: React.FC<RecoverAccountModalProps> = ({
  opened,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('confirm');
  const [error, setError] = useState('');

  const resetModal = () => {
    setStep('confirm');
    setError('');
    setLoading(false);
  };

  const handleModalClose = () => {
    resetModal();
    onClose();
  };

  const handleRecover = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('🔄 Attempting to recover account...');
      
      const result = await recoverAccount();

      if (!result.success) {
        console.error('❌ Failed to recover account:', result.error);
        setError(result.error || 'Error al recuperar la cuenta');
        notifications.show({
          title: 'Error',
          message: result.error || 'Error al recuperar la cuenta',
          color: 'red',
        });
        return;
      }

      console.log('✅ Account recovered successfully');
      
      setStep('success');
      
      notifications.show({
        title: 'Cuenta recuperada',
        message: result.message || 'Tu cuenta ha sido recuperada exitosamente',
        color: 'green',
        autoClose: 5000,
      });

    } catch (error) {
      console.error('❌ Unexpected error recovering account:', error);
      setError('Error inesperado al recuperar la cuenta');
      notifications.show({
        title: 'Error',
        message: 'Error inesperado al recuperar la cuenta',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderConfirmStep = () => (
    <Stack gap="lg">
      <Group gap="sm">
        <Shield size={24} color="var(--mantine-color-blue-6)" />
        <Text size="lg" fw={600}>
          Recuperar cuenta
        </Text>
      </Group>

      <Alert icon={<UserCheck size={16} />} color="blue">
        <Text fw={500}>Se detectó una cuenta desactivada</Text>
        <Text size="sm" c="dimmed" mt={4}>
          Estás autenticado y tu cuenta está actualmente desactivada. 
          Puedes recuperarla automáticamente.
        </Text>
      </Alert>

      <Card withBorder p="md">
        <Stack gap="sm">
          <Text fw={500}>¿Qué sucederá al recuperar tu cuenta?</Text>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">• Tu cuenta será reactivada inmediatamente</Text>
            <Text size="sm" c="dimmed">• Recuperarás acceso completo a la aplicación</Text>
            <Text size="sm" c="dimmed">• Tus datos y configuraciones se mantendrán</Text>
            <Text size="sm" c="dimmed">• Podrás usar todas las funciones normalmente</Text>
          </Stack>
        </Stack>
      </Card>

      {error && (
        <Alert color="red">
          <Text size="sm">{error}</Text>
        </Alert>
      )}

      <Alert icon={<CheckCircle size={16} />} color="green" variant="light">
        <Text size="sm">
          Al hacer clic en "Recuperar cuenta", tu cuenta será reactivada automáticamente
          usando tu sesión actual.
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

  const renderFooterButtons = () => {
    switch (step) {
      case 'confirm':
        return (
          <Group justify="apart">
            <Button variant="light" onClick={handleModalClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleRecover}
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

      default:
        return null;
    }
  };

  const getModalTitle = () => {
    switch (step) {
      case 'confirm':
        return 'Recuperar cuenta desactivada';
      case 'success':
        return 'Cuenta recuperada';
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
        {step === 'confirm' && renderConfirmStep()}
        {step === 'success' && renderSuccessStep()}
      </div>

      <Group mt="xl">
        {renderFooterButtons()}
      </Group>
    </Modal>
  );
};
