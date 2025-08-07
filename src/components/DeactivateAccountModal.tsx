import React, { useState, useEffect } from 'react';
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
  Select,
} from '@mantine/core';
import {
  UserX,
  Clock,
  Trash2,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Shield,
} from 'lucide-react';
import { 
  checkDeactivationEligibility, 
  deactivateAccount, 
  deleteAccount,
  EligibilityResponse 
} from '@/services/accounts';
import { useBackendAuth } from '@/context/BackendAuthContext';
import { notifications } from '@mantine/notifications';
import styles from './DeactivateAccountModal.module.css';

interface DeactivateAccountModalProps {
  opened: boolean;
  onClose: () => void;
}

type DeactivationType = 'temporary' | 'permanent';
type Step = 'eligibility' | 'choose' | 'confirmation' | 'final';

export const DeactivateAccountModal: React.FC<DeactivateAccountModalProps> = ({
  opened,
  onClose,
}) => {
  const [step, setStep] = useState<Step>('eligibility');
  const [deactivationType, setDeactivationType] = useState<DeactivationType>('temporary');
  const [confirmationText, setConfirmationText] = useState('');
  const [reason, setReason] = useState('');
  const [confirmationsChecked, setConfirmationsChecked] = useState({
    dataLoss: false,
    noRecovery: false,
    legalRetention: false,
  });
  const [loading, setLoading] = useState(false);
  const [eligibilityData, setEligibilityData] = useState<EligibilityResponse | null>(null);
  const { signOut } = useBackendAuth();

  const reasonOptions = [
    { value: 'taking_a_break', label: 'Tomando un descanso de la app' },
    { value: 'privacy_concerns', label: 'Preocupaciones de privacidad' },
    { value: 'temporary_leave', label: 'Ausencia temporal' },
    { value: 'no_longer_needed', label: 'Ya no necesito el servicio' },
    { value: 'bad_experience', label: 'Mala experiencia con la app' },
    { value: 'switching_apps', label: 'Cambiando a otra app' },
    { value: 'other', label: 'Otra razón' }
  ];

  const requiredConfirmationText = deactivationType === 'temporary' 
    ? 'DESACTIVAR MI CUENTA'
    : 'DELETE_MY_ACCOUNT';

  const isConfirmationComplete = 
    confirmationText === requiredConfirmationText &&
    confirmationsChecked.dataLoss &&
    (deactivationType === 'temporary' || (
      confirmationsChecked.noRecovery && confirmationsChecked.legalRetention
    ));

  // Verificar elegibilidad al abrir el modal
  useEffect(() => {
    if (opened && step === 'eligibility') {
      checkEligibility();
    }
  }, [opened, step]);

  const checkEligibility = async () => {
    setLoading(true);
    try {
      console.log('🔍 Checking account deactivation eligibility...');
      
      const result = await checkDeactivationEligibility();
      
      if (result.success && result.data) {
        setEligibilityData(result.data);
        
        if (result.data.can_deactivate_temporary || result.data.can_delete_permanent) {
          console.log('✅ Account can be deactivated');
          setStep('choose');
        } else {
          console.log('❌ Account cannot be deactivated:', result.data.warnings);
          // Permanece en step 'eligibility' para mostrar razones
        }
      } else {
        console.error('❌ Failed to check eligibility:', result.error);
        notifications.show({
          title: 'Error',
          message: result.error || 'Error al verificar elegibilidad para desactivar cuenta',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('❌ Unexpected error checking eligibility:', error);
      notifications.show({
        title: 'Error',
        message: 'Error inesperado al verificar elegibilidad',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep('eligibility');
    setDeactivationType('temporary');
    setConfirmationText('');
    setReason('');
    setConfirmationsChecked({
      dataLoss: false,
      noRecovery: false,
      legalRetention: false,
    });
    setLoading(false);
    setEligibilityData(null);
  };

  const handleModalClose = () => {
    resetModal();
    onClose();
  };

  const handleDeactivateAccount = async () => {
    if (!isConfirmationComplete) return;

    setLoading(true);

    try {
      console.log(`${deactivationType === 'temporary' ? '⏸️' : '🗑️'} Processing account ${deactivationType}...`);
      
      const result = deactivationType === 'temporary' 
        ? await deactivateAccount({ reason })
        : await deleteAccount({
            confirmation: 'DELETE_MY_ACCOUNT',
            reason
          });

      if (!result.success) {
        console.error('❌ Failed to process account:', result.error);
        notifications.show({
          title: 'Error',
          message: result.error || `Error al ${deactivationType === 'temporary' ? 'desactivar' : 'eliminar'} la cuenta`,
          color: 'red',
        });
        return;
      }

      console.log('✅ Account processed successfully');

      setStep('final');

      // Mostrar mensaje del servidor o mensaje por defecto
      const successMessage = result.message || (deactivationType === 'temporary' 
        ? 'Tu cuenta ha sido desactivada temporalmente. Puedes recuperarla cuando quieras.'
        : 'Tu cuenta ha sido marcada para eliminación. Tienes 7 días para recuperarla si cambias de opinión.');

      notifications.show({
        title: deactivationType === 'temporary' ? 'Cuenta desactivada' : 'Cuenta eliminada',
        message: successMessage,
        color: 'blue',
        autoClose: 10000,
      });

      // Cerrar sesión del usuario después de mostrar el mensaje
      setTimeout(async () => {
        await signOut();
      }, 1000);

    } catch (error) {
      console.error('❌ Unexpected error processing account:', error);
      notifications.show({
        title: 'Error',
        message: 'Error inesperado al procesar la cuenta',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderEligibilityStep = () => (
    <Stack gap="lg">
      <Group gap="sm">
        <Shield size={24} color="var(--mantine-color-blue-6)" />
        <Text size="lg" fw={600}>
          Verificando elegibilidad
        </Text>
      </Group>

      {loading ? (
        <Stack gap="md" align="center">
          <div className={styles.spinner} />
          <Text c="dimmed">
            Verificando si tu cuenta puede ser desactivada...
          </Text>
        </Stack>
      ) : eligibilityData ? (
        <>
          {(eligibilityData.can_deactivate_temporary || eligibilityData.can_delete_permanent) ? (
            <Alert icon={<CheckCircle size={16} />} color="green">
              <Text fw={500}>Tu cuenta puede ser desactivada</Text>
              <Text size="sm" c="dimmed" mt={4}>
                Puedes proceder con la desactivación temporal o eliminación de tu cuenta.
              </Text>
            </Alert>
          ) : (
            <>
              <Alert icon={<AlertTriangle size={16} />} color="red">
                <Text fw={500}>Tu cuenta no puede ser desactivada en este momento</Text>
              </Alert>
              
              <Stack gap="sm">
                <Text fw={500} size="sm">Razones:</Text>
                {eligibilityData.warnings.map((warning, index) => (
                  <Text key={index} size="sm" c="red" style={{ paddingLeft: '16px' }}>
                    • {warning}
                  </Text>
                ))}
              </Stack>

              <Alert color="blue" variant="light">
                <Text size="sm">
                  Para poder desactivar tu cuenta, necesitas resolver estos problemas primero.
                  Puedes contactar a soporte si necesitas ayuda.
                </Text>
              </Alert>
            </>
          )}

          {eligibilityData.recommendations && eligibilityData.recommendations.length > 0 && (
            <Alert color="blue" variant="light">
              <Text fw={500} size="sm">Recomendaciones:</Text>
              {eligibilityData.recommendations.map((rec, index) => (
                <Text key={index} size="sm" style={{ paddingLeft: '16px' }}>
                  • {rec}
                </Text>
              ))}
            </Alert>
          )}
        </>
      ) : (
        <Alert icon={<AlertTriangle size={16} />} color="red">
          Error al verificar elegibilidad. Por favor, inténtalo de nuevo.
        </Alert>
      )}
    </Stack>
  );

  const renderChooseStep = () => (
    <Stack gap="lg">
      <Group gap="sm">
        <UserX size={24} color="var(--mantine-color-red-6)" />
        <Text size="lg" fw={600}>
          Gestión de cuenta
        </Text>
      </Group>

      <Text c="dimmed">
        Elige qué acción quieres realizar con tu cuenta:
      </Text>

      <Radio.Group
        value={deactivationType}
        onChange={(value) => setDeactivationType(value as DeactivationType)}
      >
        <Stack gap="md">
          <Radio
            value="temporary"
            disabled={!eligibilityData?.can_deactivate_temporary}
            label={
              <Stack gap={4}>
                <Group gap="xs">
                  <Clock size={16} color="var(--mantine-color-blue-6)" />
                  <Text fw={500}>Desactivación temporal</Text>
                </Group>
                <Text size="sm" c="dimmed" pl={22}>
                  Tu cuenta se pausará pero podrás recuperarla cuando quieras.
                  Tus datos se conservarán de forma segura.
                </Text>
                {!eligibilityData?.can_deactivate_temporary && (
                  <Text size="xs" c="red" pl={22}>
                    No disponible: {eligibilityData?.current_status === 'inactive' ? 'cuenta ya desactivada' : 'verificar estado'}
                  </Text>
                )}
              </Stack>
            }
          />
          
          <Radio
            value="permanent"
            disabled={!eligibilityData?.can_delete_permanent}
            label={
              <Stack gap={4}>
                <Group gap="xs">
                  <Trash2 size={16} color="var(--mantine-color-red-6)" />
                  <Text fw={500}>Eliminación permanente</Text>
                </Group>
                <Text size="sm" c="dimmed" pl={22}>
                  Tu cuenta será eliminada permanentemente. Tendrás 7 días
                  para recuperarla antes de que sea eliminada definitivamente.
                </Text>
                {!eligibilityData?.can_delete_permanent && (
                  <Text size="xs" c="red" pl={22}>
                    No disponible: verificar estado de cuenta
                  </Text>
                )}
              </Stack>
            }
          />
        </Stack>
      </Radio.Group>

      <Select
        label="Razón (opcional)"
        placeholder="Selecciona una razón"
        data={reasonOptions}
        value={reason}
        onChange={(value) => setReason(value || '')}
        clearable
      />

      <Alert icon={<AlertTriangle size={16} />} color="yellow">
        <Text fw={500}>
          {deactivationType === 'temporary' 
            ? 'Desactivación temporal:'
            : 'Eliminación permanente:'
          }
        </Text>
        <Text size="sm" mt={4}>
          {deactivationType === 'temporary' 
            ? 'Tu cuenta será pausada pero conservada. Podrás reactivarla en cualquier momento iniciando sesión.'
            : 'Tu cuenta será marcada para eliminación. Tendrás 7 días para recuperarla antes de que sea eliminada definitivamente.'
          }
        </Text>
        
        {eligibilityData && (eligibilityData.active_trips > 0 || eligibilityData.active_bookings > 0) && (
          <Text size="sm" mt={8} fw={500} c="orange">
            Esto afectará:
            {eligibilityData.active_trips > 0 && ` ${eligibilityData.active_trips} viaje(s) activo(s)`}
            {eligibilityData.active_trips > 0 && eligibilityData.active_bookings > 0 && ' y'}
            {eligibilityData.active_bookings > 0 && ` ${eligibilityData.active_bookings} reserva(s) activa(s)`}
          </Text>
        )}
      </Alert>
    </Stack>
  );

  const renderConfirmationStep = () => (
    <Stack gap="lg">
      <Group gap="sm">
        <AlertTriangle size={24} color="var(--mantine-color-red-6)" />
        <Text size="lg" fw={600} c="red">
          Confirmación requerida
        </Text>
      </Group>

      <Alert icon={<AlertTriangle size={16} />} color="red">
        <Text fw={500}>
          {deactivationType === 'temporary' 
            ? '¿Estás seguro de que quieres desactivar tu cuenta temporalmente?'
            : '¿Estás seguro de que quieres eliminar tu cuenta permanentemente?'
          }
        </Text>
      </Alert>

      <Stack gap="md">
        <Text fw={500}>
          Por favor confirma que entiendes las siguientes consecuencias:
        </Text>

        <Checkbox
          checked={confirmationsChecked.dataLoss}
          onChange={(event) =>
            setConfirmationsChecked((prev) => ({
              ...prev,
              dataLoss: event.currentTarget.checked,
            }))
          }
          label={
            deactivationType === 'temporary'
              ? 'Entiendo que mi cuenta será pausada y no podré acceder hasta que la reactive.'
              : 'Entiendo que todos mis datos serán eliminados permanentemente después de 7 días.'
          }
        />

        {deactivationType === 'permanent' && (
          <>
            <Checkbox
              checked={confirmationsChecked.noRecovery}
              onChange={(event) =>
                setConfirmationsChecked((prev) => ({
                  ...prev,
                  noRecovery: event.currentTarget.checked,
                }))
              }
              label="Entiendo que después de 7 días no habrá forma de recuperar mi cuenta o datos."
            />

            <Checkbox
              checked={confirmationsChecked.legalRetention}
              onChange={(event) =>
                setConfirmationsChecked((prev) => ({
                  ...prev,
                  legalRetention: event.currentTarget.checked,
                }))
              }
              label="Entiendo que algunos datos pueden ser retenidos por razones legales o de seguridad."
            />
          </>
        )}
      </Stack>

      <Stack gap="xs">
        <Text fw={500}>
          Para confirmar, escribe exactamente: <code>{requiredConfirmationText}</code>
        </Text>
        <TextInput
          value={confirmationText}
          onChange={(event) => setConfirmationText(event.currentTarget.value)}
          placeholder={requiredConfirmationText}
          error={
            confirmationText && confirmationText !== requiredConfirmationText
              ? 'El texto no coincide exactamente'
              : null
          }
        />
      </Stack>
    </Stack>
  );

  const renderFinalStep = () => (
    <Stack gap="lg" align="center">
      <div className={styles.successIcon}>
        <CheckCircle size={48} color="var(--mantine-color-green-6)" />
      </div>

      <Text ta="center" fw={600} size="lg">
        {deactivationType === 'temporary' 
          ? 'Cuenta desactivada temporalmente'
          : 'Cuenta marcada para eliminación'
        }
      </Text>

      <Text ta="center" c="dimmed">
        {deactivationType === 'temporary' 
          ? 'Tu cuenta ha sido desactivada. Puedes reactivarla en cualquier momento iniciando sesión de nuevo.'
          : 'Tu cuenta ha sido marcada para eliminación. Tienes 7 días para recuperarla si cambias de opinión.'
        }
      </Text>

      <Alert color="blue" variant="light">
        <Text size="sm" ta="center">
          Serás desconectado automáticamente en unos segundos.
        </Text>
      </Alert>
    </Stack>
  );

  const renderStepContent = () => {
    switch (step) {
      case 'eligibility':
        return renderEligibilityStep();
      case 'choose':
        return renderChooseStep();
      case 'confirmation':
        return renderConfirmationStep();
      case 'final':
        return renderFinalStep();
      default:
        return renderEligibilityStep();
    }
  };

  const getModalTitle = () => {
    switch (step) {
      case 'eligibility':
        return 'Verificando elegibilidad';
      case 'choose':
        return 'Gestión de cuenta';
      case 'confirmation':
        return 'Confirmar acción';
      case 'final':
        return 'Proceso completado';
      default:
        return 'Gestión de cuenta';
    }
  };

  const renderFooterButtons = () => {
    switch (step) {
      case 'eligibility':
        return (
          <Group justify="apart">
            <Button variant="light" onClick={handleModalClose}>
              Cancelar
            </Button>
            <Button 
              onClick={checkEligibility} 
              disabled={loading}
              leftSection={<RotateCcw size={16} />}
            >
              Verificar de nuevo
            </Button>
          </Group>
        );

      case 'choose':
        if (!eligibilityData?.can_deactivate_temporary && !eligibilityData?.can_delete_permanent) {
          return (
            <Group justify="center">
              <Button variant="light" onClick={handleModalClose}>
                Entendido
              </Button>
            </Group>
          );
        }
        
        return (
          <Group justify="apart">
            <Button variant="light" onClick={handleModalClose}>
              Cancelar
            </Button>
            <Button onClick={() => setStep('confirmation')}>
              Continuar
            </Button>
          </Group>
        );

      case 'confirmation':
        return (
          <Group justify="apart">
            <Button variant="light" onClick={() => setStep('choose')}>
              Atrás
            </Button>
            <Button
              color="red"
              onClick={handleDeactivateAccount}
              disabled={!isConfirmationComplete || loading}
              leftSection={deactivationType === 'temporary' ? <UserX size={16} /> : <Trash2 size={16} />}
            >
              {loading
                ? 'Procesando...'
                : deactivationType === 'temporary'
                ? 'Desactivar cuenta'
                : 'Eliminar cuenta'
              }
            </Button>
          </Group>
        );

      case 'final':
        return (
          <Group justify="center">
            <Button variant="light" onClick={handleModalClose}>
              Cerrar
            </Button>
          </Group>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={step === 'final' ? handleModalClose : handleModalClose}
      title={getModalTitle()}
      size="md"
      closeOnClickOutside={step !== 'final'}
      closeOnEscape={step !== 'final'}
      withCloseButton={step !== 'final'}
    >
      <LoadingOverlay visible={loading} />
      
      <div className={styles.modalContent}>
        {renderStepContent()}
      </div>

      <Group mt="xl">
        {renderFooterButtons()}
      </Group>
    </Modal>
  );
};
