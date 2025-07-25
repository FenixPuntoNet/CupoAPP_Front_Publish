import React, { useState } from 'react';
import {
  Modal,
  Text,
  Button,
  Stack,
  Group,
  Alert,
  TextInput,
  Checkbox,
  LoadingOverlay,
  Radio,
} from '@mantine/core';
import {
  UserX,
  Clock,
  Trash2,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  X,
} from 'lucide-react';
import { deactivateAccount } from '@/services/auth';
import { useBackendAuth } from '@/context/BackendAuthContext';
import { notifications } from '@mantine/notifications';
import styles from './DeactivateAccountModal.module.css';

interface DeactivateAccountModalProps {
  opened: boolean;
  onClose: () => void;
}

type DeactivationType = 'temporary' | 'permanent';
type Step = 'choose' | 'confirmation' | 'final';

export const DeactivateAccountModal: React.FC<DeactivateAccountModalProps> = ({
  opened,
  onClose,
}) => {
  const [step, setStep] = useState<Step>('choose');
  const [deactivationType, setDeactivationType] = useState<DeactivationType>('temporary');
  const [confirmationText, setConfirmationText] = useState('');
  const [confirmationsChecked, setConfirmationsChecked] = useState({
    dataLoss: false,
    noRecovery: false,
    legalRetention: false,
  });
  const [loading, setLoading] = useState(false);
  const { signOut } = useBackendAuth();

  const requiredConfirmationText = deactivationType === 'temporary' 
    ? 'DESACTIVAR MI CUENTA'
    : 'ELIMINAR MI CUENTA';

  const isConfirmationComplete = 
    confirmationText === requiredConfirmationText &&
    confirmationsChecked.dataLoss &&
    (deactivationType === 'temporary' || (
      confirmationsChecked.noRecovery && confirmationsChecked.legalRetention
    ));

  const resetModal = () => {
    setStep('choose');
    setDeactivationType('temporary');
    setConfirmationText('');
    setConfirmationsChecked({
      dataLoss: false,
      noRecovery: false,
      legalRetention: false,
    });
    setLoading(false);
  };

  const handleModalClose = () => {
    resetModal();
    onClose();
  };

  const handleDeactivateAccount = async () => {
    if (!isConfirmationComplete) return;

    setLoading(true);

    try {
      const result = await deactivateAccount(
        `User requested ${deactivationType} deactivation`,
        deactivationType === 'permanent'
      );

      if (!result.success) {
        notifications.show({
          title: 'Error',
          message: result.error || 'Error al desactivar la cuenta',
          color: 'red',
        });
        return;
      }

      // Cerrar sesión del usuario
      await signOut();

      setStep('final');

      notifications.show({
        title: deactivationType === 'temporary' ? 'Cuenta desactivada' : 'Cuenta eliminada',
        message: result.message || (deactivationType === 'temporary' 
          ? 'Tu cuenta ha sido desactivada temporalmente. Puedes recuperarla cuando quieras.'
          : 'Tu cuenta ha sido eliminada. Tienes 30 días para recuperarla si cambias de opinión.'),
        color: 'blue',
        autoClose: 10000,
      });

    } catch (error) {
      console.error('Error deactivating account:', error);
      notifications.show({
        title: 'Error',
        message: 'Error inesperado al desactivar la cuenta',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderChooseStep = () => (
    <Stack gap="lg">
      <div className={styles.header}>
        <UserX size={36} className={styles.icon} />
        <Text size="lg" fw={700} ta="center" className={styles.title}>
          Desactivar cuenta
        </Text>
        <Text size="sm" c="dimmed" ta="center" className={styles.subtitle}>
          Elige el tipo de desactivación que deseas realizar
        </Text>
      </div>

      <Stack gap="md">
        <Radio.Group
          value={deactivationType}
          onChange={(value) => setDeactivationType(value as DeactivationType)}
        >
          <Stack gap="sm">
            <Radio
              value="temporary"
              label={
                <Group gap="sm">
                  <Clock size={18} />
                  <div>
                    <Text fw={500}>Desactivación temporal</Text>
                    <Text size="xs" c="dimmed">
                      Podrás recuperar tu cuenta cuando quieras
                    </Text>
                  </div>
                </Group>
              }
            />
            <Radio
              value="permanent"
              label={
                <Group gap="sm">
                  <Trash2 size={18} />
                  <div>
                    <Text fw={500}>Eliminación permanente</Text>
                    <Text size="xs" c="dimmed">
                      Tu cuenta será eliminada después de 30 días
                    </Text>
                  </div>
                </Group>
              }
            />
          </Stack>
        </Radio.Group>
      </Stack>

      <Alert 
        icon={<AlertTriangle size={16} />} 
        color="yellow" 
        variant="light"
        title="Importante"
      >
        {deactivationType === 'temporary' 
          ? 'Tu cuenta será desactivada temporalmente. Podrás reactivarla en cualquier momento usando la opción "Recuperar cuenta" en el login.'
          : 'Tu cuenta será marcada para eliminación permanente. Tendrás 30 días para recuperarla antes de que sea eliminada definitivamente.'
        }
      </Alert>

      <Group justify="space-between" mt="md">
        <Button 
          variant="subtle" 
          onClick={handleModalClose}
          leftSection={<X size={16} />}
        >
          Cancelar
        </Button>
        <Button 
          color="red"
          onClick={() => setStep('confirmation')}
          leftSection={deactivationType === 'temporary' ? <Clock size={16} /> : <Trash2 size={16} />}
        >
          Continuar
        </Button>
      </Group>
    </Stack>
  );

  const renderConfirmationStep = () => (
    <Stack gap="lg">
      <div className={styles.header}>
        <AlertTriangle size={36} className={styles.warningIcon} />
        <Text size="lg" fw={700} ta="center" className={styles.title}>
          Confirmar {deactivationType === 'temporary' ? 'desactivación' : 'eliminación'}
        </Text>
        <Text size="sm" c="dimmed" ta="center" className={styles.subtitle}>
          Por favor, lee cuidadosamente y confirma tu decisión
        </Text>
      </div>

      <Alert 
        icon={<AlertTriangle size={16} />} 
        color="red" 
        variant="light"
        title="¡Atención!"
      >
        <Text size="sm">
          {deactivationType === 'temporary' 
            ? 'Vas a desactivar tu cuenta temporalmente. Durante este tiempo no podrás acceder a tus datos ni usar la aplicación.'
            : 'Vas a eliminar permanentemente tu cuenta. Después de 30 días, todos tus datos serán eliminados de forma irreversible.'
          }
        </Text>
      </Alert>

      <Stack gap="sm">
        <Text size="sm" fw={500}>Confirmaciones requeridas:</Text>
        
        <Checkbox
          checked={confirmationsChecked.dataLoss}
          onChange={(event) => 
            setConfirmationsChecked(prev => ({ 
              ...prev, 
              dataLoss: event.currentTarget.checked 
            }))
          }
          label="Entiendo que perderé acceso a mi cuenta y datos temporalmente"
        />

        {deactivationType === 'permanent' && (
          <>
            <Checkbox
              checked={confirmationsChecked.noRecovery}
              onChange={(event) => 
                setConfirmationsChecked(prev => ({ 
                  ...prev, 
                  noRecovery: event.currentTarget.checked 
                }))
              }
              label="Entiendo que después de 30 días no podré recuperar mi cuenta"
            />
            
            <Checkbox
              checked={confirmationsChecked.legalRetention}
              onChange={(event) => 
                setConfirmationsChecked(prev => ({ 
                  ...prev, 
                  legalRetention: event.currentTarget.checked 
                }))
              }
              label="Acepto que algunos datos pueden retenerse por motivos legales"
            />
          </>
        )}
      </Stack>

      <Stack gap="xs">
        <Text size="sm" fw={500}>
          Para confirmar, escribe exactamente: 
          <Text span c="red" fw={700}> {requiredConfirmationText}</Text>
        </Text>
        <TextInput
          placeholder={`Escribe: ${requiredConfirmationText}`}
          value={confirmationText}
          onChange={(event) => setConfirmationText(event.currentTarget.value)}
          error={confirmationText && confirmationText !== requiredConfirmationText ? 
            'El texto no coincide exactamente' : null}
        />
      </Stack>

      <Group justify="space-between" mt="md">
        <Button 
          variant="subtle" 
          onClick={() => setStep('choose')}
          leftSection={<RotateCcw size={16} />}
          disabled={loading}
        >
          Volver
        </Button>
        <Button 
          color="red"
          onClick={handleDeactivateAccount}
          disabled={!isConfirmationComplete}
          loading={loading}
          leftSection={deactivationType === 'temporary' ? <UserX size={16} /> : <Trash2 size={16} />}
        >
          {loading ? 'Procesando...' : (deactivationType === 'temporary' ? 'Desactivar cuenta' : 'Eliminar cuenta')}
        </Button>
      </Group>
    </Stack>
  );

  const renderFinalStep = () => (
    <Stack gap="lg" align="center">
      <CheckCircle size={64} className={styles.successIcon} />
      <div className={styles.successContent}>
        <Text size="lg" fw={700} ta="center" className={styles.successTitle}>
          {deactivationType === 'temporary' ? '¡Cuenta desactivada!' : '¡Cuenta eliminada!'}
        </Text>
        <Text size="sm" c="dimmed" ta="center" className={styles.successText}>
          {deactivationType === 'temporary' 
            ? 'Tu cuenta ha sido desactivada temporalmente. Puedes recuperarla en cualquier momento desde el login.'
            : 'Tu cuenta ha sido marcada para eliminación. Tienes 30 días para recuperarla si cambias de opinión.'
          }
        </Text>
      </div>
      
      <Alert color="blue" variant="light" icon={<RotateCcw size={16} />}>
        <Text size="sm">
          Para recuperar tu cuenta, usa la opción "Recuperar cuenta desactivada" 
          en la pantalla de login con tus credenciales originales.
        </Text>
      </Alert>

      <Button
        size="md"
        fullWidth
        onClick={handleModalClose}
        leftSection={<CheckCircle size={16} />}
      >
        Entendido
      </Button>
    </Stack>
  );

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
      title={
        step === 'choose' ? 'Desactivar Cuenta' :
        step === 'confirmation' ? 'Confirmar Acción' : 
        'Proceso Completado'
      }
      size="md"
      centered
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
      withCloseButton={!loading}
      className={styles.modal}
    >
      <LoadingOverlay visible={loading} />
      
      <div className={styles.content}>
        {step === 'choose' && renderChooseStep()}
        {step === 'confirmation' && renderConfirmationStep()}
        {step === 'final' && renderFinalStep()}
      </div>
    </Modal>
  );
};
