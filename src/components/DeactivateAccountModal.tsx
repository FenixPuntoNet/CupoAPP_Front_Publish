import React, { useState } from 'react';
import {
  Modal,
  Text,
  Button,
  Stack,
  Group,
  Divider,
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
import { supabase } from '@/lib/supabaseClient';
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

  const requiredConfirmationText = deactivationType === 'temporary' 
    ? 'DESACTIVAR MI CUENTA' 
    : 'ELIMINAR MI CUENTA';

  const isConfirmationComplete = 
    confirmationText === requiredConfirmationText &&
    Object.values(confirmationsChecked).every(checked => checked);

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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Calcular fecha de eliminación automática (30 días)
      const now = new Date();

      // 1. Actualizar perfil de usuario (SIEMPRE desactivación, nunca eliminación real)
      const newStatus = deactivationType === 'temporary' 
        ? 'temporarily_deactivated' 
        : 'pending_deletion'; // Aparenta eliminación pero es solo desactivación

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          status: newStatus,
          updated_at: now.toISOString(),
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // 2. Cerrar sesión del usuario
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        console.error('Error cerrando sesión:', signOutError);
        // Continuar con el proceso aunque falle el cierre de sesión
      }

      setStep('final');

      notifications.show({
        title: deactivationType === 'temporary' ? 'Cuenta desactivada' : 'Cuenta eliminada',
        message: deactivationType === 'temporary' 
          ? 'Tu cuenta ha sido desactivada temporalmente. Puedes recuperarla cuando quieras.'
          : 'Tu cuenta ha sido eliminada. Tienes 30 días para recuperarla si cambias de opinión.',
        color: 'green',
        icon: <CheckCircle size={16} />,
      });

      // Redirigir al usuario a la página de login después de un pequeño delay
      setTimeout(() => {
        window.location.href = '/login?deactivated=true';
      }, 2000);

    } catch (error: any) {
      console.error('Error desactivando cuenta:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudo procesar la solicitud. Intenta más tarde.',
        color: 'red',
        icon: <X size={16} />,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderChooseStep = () => (
    <Stack gap="md">
      <div className={styles.headerChoose}>
        <UserX size={36} className={styles.chooseIcon} />
        <Text size="lg" fw={700} ta="center" className={styles.title}>
          ¿Qué quieres hacer?
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          Elige una opción
        </Text>
      </div>

      <Stack gap="sm">
        <div 
          className={`${styles.optionCard} ${deactivationType === 'temporary' ? styles.optionSelected : ''}`}
          onClick={() => setDeactivationType('temporary')}
        >
          <Radio
            checked={deactivationType === 'temporary'}
            onChange={() => setDeactivationType('temporary')}
            className={styles.radioButton}
          />
          <div className={styles.optionContent}>
            <Group gap="xs" mb="xs">
              <Clock size={18} className={styles.optionIcon} />
              <Text fw={600} className={styles.optionTitle}>
                Desactivar temporalmente
              </Text>
            </Group>
            <Text size="xs" className={styles.optionDescription}>
              Pausa tu cuenta. Podrás recuperarla cuando quieras.
            </Text>
          </div>
        </div>

        <div 
          className={`${styles.optionCard} ${deactivationType === 'permanent' ? styles.optionSelected : ''}`}
          onClick={() => setDeactivationType('permanent')}
        >
          <Radio
            checked={deactivationType === 'permanent'}
            onChange={() => setDeactivationType('permanent')}
            className={styles.radioButton}
          />
          <div className={styles.optionContent}>
            <Group gap="xs" mb="xs">
              <Trash2 size={18} className={styles.optionIcon} />
              <Text fw={600} className={styles.optionTitle}>
                Eliminar permanentemente
              </Text>
            </Group>
            <Text size="xs" className={styles.optionDescription}>
              30 días para recuperarla. Después se elimina para siempre.
            </Text>
          </div>
        </div>
      </Stack>

      {deactivationType === 'permanent' && (
        <Alert color="orange" icon={<AlertTriangle size={16} />} className={styles.warningAlert}>
          <Text fw={600} size="xs" mb="4">⚠️ Importante:</Text>
          <Text size="xs">
            Perderás saldo, UniCoins y puntos. Algunos datos legales se mantienen anonimizados.
          </Text>
        </Alert>
      )}

      <Group justify="space-between" mt="md">
        <Button
          variant="outline"
          onClick={handleModalClose}
          className={styles.cancelButton}
          size="sm"
        >
          Cancelar
        </Button>
        <Button
          color={deactivationType === 'temporary' ? 'orange' : 'red'}
          onClick={() => setStep('confirmation')}
          className={styles.proceedButton}
          leftSection={deactivationType === 'temporary' ? <Clock size={14} /> : <Trash2 size={14} />}
          size="sm"
        >
          Continuar
        </Button>
      </Group>
    </Stack>
  );

  const renderConfirmationStep = () => (
    <Stack gap="md">
      <div className={styles.headerConfirmation}>
        {deactivationType === 'temporary' ? (
          <Clock size={36} className={styles.temporaryIcon} />
        ) : (
          <Trash2 size={36} className={styles.deleteIcon} />
        )}
        <Text size="lg" fw={700} ta="center" className={styles.title}>
          {deactivationType === 'temporary' 
            ? 'Confirmar desactivación'
            : 'Confirmar eliminación'
          }
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          {deactivationType === 'temporary' 
            ? 'Podrás reactivarla cuando quieras'
            : 'Tienes 30 días para recuperarla'
          }
        </Text>
      </div>

      <Stack gap="xs">
        <Checkbox
          checked={confirmationsChecked.dataLoss}
          onChange={(event) => {
            const checked = event?.currentTarget?.checked ?? !confirmationsChecked.dataLoss;
            setConfirmationsChecked(prev => ({
              ...prev,
              dataLoss: checked
            }));
          }}
          label={deactivationType === 'temporary' 
            ? 'Entiendo que mi cuenta será desactivada temporalmente'
            : 'Entiendo que perderé mi saldo, UniCoins y puntos'
          }
          className={styles.confirmationCheckbox}
        />
        
        <Checkbox
          checked={confirmationsChecked.noRecovery}
          onChange={(event) => {
            const checked = event?.currentTarget?.checked ?? !confirmationsChecked.noRecovery;
            setConfirmationsChecked(prev => ({
              ...prev,
              noRecovery: checked
            }));
          }}
          label={deactivationType === 'temporary' 
            ? 'No podré usar la app hasta reactivarla'
            : 'Después de 30 días no podré recuperarla'
          }
          className={styles.confirmationCheckbox}
        />
        
        <Checkbox
          checked={confirmationsChecked.legalRetention}
          onChange={(event) => {
            const checked = event?.currentTarget?.checked ?? !confirmationsChecked.legalRetention;
            setConfirmationsChecked(prev => ({
              ...prev,
              legalRetention: checked
            }));
          }}
          label="Acepto que algunos datos se mantengan por ley"
          className={styles.confirmationCheckbox}
        />
      </Stack>

      <Divider my="sm" />

      <div>
        <Text fw={600} mb="xs" size="sm">
          Escribe: <code className={styles.confirmationCode}>{requiredConfirmationText}</code>
        </Text>
        <TextInput
          value={confirmationText}
          onChange={(event) => setConfirmationText(event.currentTarget.value)}
          placeholder="Escribe la frase..."
          className={styles.confirmationInput}
          autoCapitalize="none"
          autoCorrect="off"
          size="sm"
          error={confirmationText && confirmationText !== requiredConfirmationText ? 
            'No coincide' : undefined}
        />
      </div>

      <Group justify="space-between" mt="sm">
        <Button
          variant="outline"
          onClick={() => setStep('choose')}
          className={styles.cancelButton}
          size="sm"
        >
          Volver
        </Button>
        <Button
          color={deactivationType === 'temporary' ? 'orange' : 'red'}
          onClick={handleDeactivateAccount}
          disabled={!isConfirmationComplete}
          loading={loading}
          size="sm"
          className={styles.finalButton}
        >
          {deactivationType === 'temporary' ? 'Desactivar' : 'Eliminar'}
        </Button>
      </Group>
    </Stack>
  );

  const renderFinalStep = () => (
    <Stack gap="md" ta="center">
      <div className={styles.headerFinal}>
        {deactivationType === 'temporary' ? (
          <Clock size={48} className={styles.successIcon} />
        ) : (
          <CheckCircle size={48} className={styles.successIcon} />
        )}
        <Text size="lg" fw={700} className={styles.title}>
          {deactivationType === 'temporary' 
            ? '¡Cuenta desactivada!'
            : '¡Cuenta eliminada!'
          }
        </Text>
        <Text size="sm" c="dimmed">
          {deactivationType === 'temporary' 
            ? 'Puedes recuperarla iniciando sesión cuando quieras.'
            : 'Tienes 30 días para recuperarla si cambias de opinión.'
          }
        </Text>
      </div>

      <Alert color="blue" icon={<RotateCcw size={16} />} className={styles.recoveryAlert}>
        <Text fw={600} mb="xs" size="sm">🔄 ¿Cambiaste de opinión?</Text>
        <Text size="xs">
          Usa "Recuperar cuenta" en la pantalla de inicio de sesión.
        </Text>
      </Alert>

      <Alert color="orange" icon={<AlertTriangle size={16} />}>
        <Text fw={600} mb="xs" size="sm">⚠️ Cerrando sesión</Text>
        <Text size="xs">
          Tu sesión se cerrará automáticamente en unos segundos y serás redirigido al login.
        </Text>
      </Alert>

      <Button
        fullWidth
        onClick={() => {
          handleModalClose();
          window.location.href = '/login?deactivated=true';
        }}
        className={styles.closeButton}
        size="sm"
      >
        Ir al login
      </Button>
    </Stack>
  );

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
      title={null}
      centered
      size="sm"
      classNames={{
        content: styles.modalContent,
        body: styles.modalBody,
      }}
      withCloseButton={false}
      padding="md"
      radius="lg"
    >
      <LoadingOverlay visible={loading} />
      
      {step === 'choose' && renderChooseStep()}
      {step === 'confirmation' && renderConfirmationStep()}
      {step === 'final' && renderFinalStep()}
    </Modal>
  );
};
