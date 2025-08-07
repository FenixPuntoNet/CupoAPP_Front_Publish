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
  Badge,
} from '@mantine/core';
import {
  Search,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useForm } from '@mantine/form';
import { getAccountStatus, AccountStatusResponse } from '@/services/accounts';
import styles from './RecoverAccountModal.module.css';

interface CheckAccountStatusModalProps {
  opened: boolean;
  onClose: () => void;
}

interface CheckFormValues {
  email: string;
}

export const CheckAccountStatusModal: React.FC<CheckAccountStatusModalProps> = ({
  opened,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [accountData, setAccountData] = useState<AccountStatusResponse | null>(null);
  const [error, setError] = useState('');

  const form = useForm<CheckFormValues>({
    initialValues: {
      email: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Correo electrónico inválido'),
    },
  });

  const resetModal = () => {
    setAccountData(null);
    setError('');
    form.reset();
    setLoading(false);
  };

  const handleModalClose = () => {
    resetModal();
    onClose();
  };

  const checkAccountStatusHandler = async (values: CheckFormValues) => {
    try {
      setLoading(true);
      setError('');
      setAccountData(null);

      console.log('🔍 Checking account status for:', values.email);

      const result = await getAccountStatus();

      if (!result.success) {
        console.error('❌ Failed to check account status:', result.error);
        setError(result.error || 'Error al verificar estado de cuenta');
        return;
      }

      console.log('✅ Account status checked:', result.data);
      setAccountData(result.data);

    } catch (error) {
      console.error('❌ Unexpected error checking account status:', error);
      setError('Error inesperado al verificar estado de cuenta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'yellow';
      case 'deleted': return 'red';
      case 'suspended': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle size={16} />;
      case 'inactive': return <Clock size={16} />;
      case 'deleted': return <Trash2 size={16} />;
      case 'suspended': return <XCircle size={16} />;
      default: return <AlertTriangle size={16} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'inactive': return 'Desactivada';
      case 'deleted': return 'Eliminada';
      case 'suspended': return 'Suspendida';
      default: return 'Desconocido';
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
      title={
        <Group gap="sm">
          <Search size={20} />
          <Text size="lg" fw={600}>
            Verificar Estado de Cuenta
          </Text>
        </Group>
      }
      size="md"
      centered
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
      withCloseButton={!loading}
      className={styles.modal}
    >
      <LoadingOverlay visible={loading} />
      
      <Stack gap="lg">
        <div className={styles.header}>
          <User size={36} className={styles.icon} />
          <Text size="lg" fw={700} ta="center" className={styles.title}>
            Estado de tu cuenta
          </Text>
          <Text size="sm" c="dimmed" ta="center" className={styles.subtitle}>
            Verifica el estado actual de tu cuenta de CupoApp
          </Text>
        </div>

        {!accountData && (
          <form onSubmit={form.onSubmit(checkAccountStatusHandler)}>
            <Stack gap="md">
              <TextInput
                label="Correo electrónico"
                placeholder="tu@email.com"
                required
                {...form.getInputProps('email')}
                leftSection={<User size={16} />}
              />

              {error && (
                <Alert color="red" icon={<XCircle size={16} />}>
                  {error}
                </Alert>
              )}

              <Group justify="space-between" mt="md">
                <Button 
                  variant="subtle" 
                  onClick={handleModalClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  loading={loading}
                  leftSection={<Search size={16} />}
                >
                  Verificar Estado
                </Button>
              </Group>
            </Stack>
          </form>
        )}

        {accountData && (
          <Card withBorder padding="lg" radius="md">
            <Stack gap="md">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text fw={600} size="lg">
                    {accountData.user_name || 'Usuario'}
                  </Text>
                  <Text size="sm" c="dimmed">
                    ID: {accountData.user_id}
                  </Text>
                </div>
                <Badge 
                  color={getStatusColor(accountData.account_status)}
                  leftSection={getStatusIcon(accountData.account_status)}
                  size="lg"
                >
                  {getStatusText(accountData.account_status)}
                </Badge>
              </Group>

              <Stack gap="xs">
                <Text size="sm">
                  <strong>Estado:</strong> {getStatusText(accountData.account_status)}
                </Text>
                <Text size="sm">
                  <strong>Última actualización:</strong> {' '}
                  {new Date(accountData.last_updated).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </Stack>

              {accountData.account_status === 'deactivated' && accountData.can_recover && (
                <Alert color="blue" icon={<CheckCircle size={16} />}>
                  <Text size="sm">
                    <strong>¡Buenas noticias!</strong> Tu cuenta puede ser recuperada. 
                    Usa la opción "Recuperar cuenta" en el login con tus credenciales.
                  </Text>
                </Alert>
              )}

              {accountData.account_status === 'deleted' && (
                <Alert color="red" icon={<Trash2 size={16} />}>
                  <Text size="sm">
                    <strong>Cuenta eliminada:</strong> Esta cuenta fue marcada para eliminación permanente. 
                    {accountData.can_recover 
                      ? ' Aún puedes recuperarla si actúas pronto.'
                      : ' No puede ser recuperada.'
                    }
                  </Text>
                </Alert>
              )}

              {accountData.account_status === 'suspended' && (
                <Alert color="orange" icon={<XCircle size={16} />}>
                  <Text size="sm">
                    <strong>Cuenta suspendida:</strong> Tu cuenta está temporalmente suspendida. 
                    Contacta al soporte para más información.
                  </Text>
                </Alert>
              )}

              {accountData.account_status === 'active' && (
                <Alert color="green" icon={<CheckCircle size={16} />}>
                  <Text size="sm">
                    <strong>Cuenta activa:</strong> Tu cuenta está funcionando normalmente. 
                    Puedes iniciar sesión sin problemas.
                  </Text>
                </Alert>
              )}

              <Group justify="space-between" mt="md">
                <Button 
                  variant="subtle" 
                  onClick={resetModal}
                  leftSection={<Search size={16} />}
                >
                  Verificar otra cuenta
                </Button>
                <Button 
                  onClick={handleModalClose}
                  leftSection={<CheckCircle size={16} />}
                >
                  Entendido
                </Button>
              </Group>
            </Stack>
          </Card>
        )}
      </Stack>
    </Modal>
  );
};
