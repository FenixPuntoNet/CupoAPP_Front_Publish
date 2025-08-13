import React, { useState, useEffect } from 'react';
import {
  Modal,
  Text,
  Button,
  Stack,
  Group,
  TextInput,
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
    confirmationText === requiredConfirmationText;

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
      
      console.log('🔍 Raw eligibility result:', result);
      
      if (result.success && result.data) {
        console.log('🔍 Eligibility data received:', result.data);
        setEligibilityData(result.data);
        
        console.log('🔍 can_deactivate_temporary:', result.data.can_deactivate_temporary);
        console.log('🔍 can_delete_permanent:', result.data.can_delete_permanent);
        console.log('🔍 current_status:', result.data.current_status);
        console.log('🔍 warnings:', result.data.warnings);
        console.log('🔍 recommendations:', result.data.recommendations);
        
        // Simplificado: si el backend responde exitosamente, siempre permitir continuar
        // Solo mostrar warnings informativos si existen
        console.log('✅ Eligibility check successful, proceeding to choose step');
        setStep('choose');
      } else {
        console.error('❌ Failed to check eligibility:', result.error);
        notifications.show({
          title: 'Error de Conectividad',
          message: result.error || 'Error al verificar elegibilidad para desactivar cuenta. Verifica tu conexión.',
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
    <Stack gap="xs">
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '8px',
        padding: '12px',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: '#2563eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 8px'
        }}>
          <Shield size={20} color="#ffffff" />
        </div>
        <Text size="sm" fw={600} style={{ color: '#ffffff', marginBottom: '4px' }}>
          Verificando elegibilidad
        </Text>
        <Text size="xs" style={{ color: '#a1a1aa' }}>
          Revisando el estado de tu cuenta
        </Text>
      </div>

      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <div className={styles.spinner} style={{ margin: '0 auto 8px' }} />
          <Text size="xs" style={{ color: '#a1a1aa' }}>
            Verificando tu cuenta...
          </Text>
        </div>
      ) : eligibilityData ? (
        <>
          <div style={{ 
            backgroundColor: '#0f2419',
            border: '2px solid #16a34a',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px'
            }}>
              <CheckCircle size={16} color="#ffffff" />
            </div>
            <Text fw={600} size="xs" style={{ color: '#ffffff', marginBottom: '4px' }}>
              Tu cuenta puede ser gestionada
            </Text>
            <Text size="xs" style={{ color: '#86efac' }}>
              Puedes proceder con la gestión de tu cuenta
            </Text>
          </div>

          {eligibilityData.warnings && eligibilityData.warnings.length > 0 && (
            <div style={{ 
              backgroundColor: '#1e3a8a',
              border: '2px solid #3b82f6',
              borderRadius: '8px',
              padding: '12px'
            }}>
              <Text fw={500} size="xs" style={{ color: '#ffffff', marginBottom: '6px' }}>
                📋 Información importante:
              </Text>
              {eligibilityData.warnings.slice(0, 2).map((warning, index) => (
                <Text key={index} size="xs" style={{ 
                  color: '#93c5fd', 
                  paddingLeft: '6px', 
                  marginBottom: '2px',
                  lineHeight: '1.3'
                }}>
                  • {warning}
                </Text>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ 
          backgroundColor: '#7f1d1d',
          border: '2px solid #dc2626',
          borderRadius: '8px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 8px'
          }}>
            <AlertTriangle size={16} color="#ffffff" />
          </div>
          <Text size="xs" style={{ color: '#ffffff', marginBottom: '4px' }}>
            Error al verificar elegibilidad
          </Text>
          <Text size="xs" style={{ color: '#fca5a5' }}>
            Intenta de nuevo en unos momentos
          </Text>
        </div>
      )}
    </Stack>
  );

  const renderChooseStep = () => (
    <Stack gap="xs">
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '8px',
        padding: '12px',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 8px'
        }}>
          <UserX size={20} color="#ffffff" />
        </div>
        <Text size="sm" fw={600} style={{ color: '#ffffff', marginBottom: '4px' }}>
          Gestión de cuenta
        </Text>
        <Text size="xs" style={{ color: '#a1a1aa' }}>
          Selecciona la acción que deseas realizar
        </Text>
      </div>

      <div style={{ 
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '12px'
      }}>
        <Radio.Group
          value={deactivationType}
          onChange={(value) => setDeactivationType(value as DeactivationType)}
        >
          <Stack gap="xs">
            <div 
              style={{ 
                padding: '10px',
                borderRadius: '6px',
                border: deactivationType === 'temporary' 
                  ? '2px solid #3b82f6' 
                  : '1px solid #404040',
                backgroundColor: deactivationType === 'temporary' 
                  ? '#1e40af' 
                  : '#262626',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setDeactivationType('temporary')}
            >
              <Radio
                value="temporary"
                label={
                  <div style={{ marginLeft: '8px' }}>
                    <Group gap="xs" wrap="nowrap">
                      <Clock size={16} color={deactivationType === 'temporary' ? '#93c5fd' : '#71717a'} />
                      <div>
                        <Text fw={600} size="xs" style={{ 
                          color: deactivationType === 'temporary' ? '#ffffff' : '#d4d4d8' 
                        }}>
                          Desactivación temporal
                        </Text>
                        <Text size="xs" style={{ 
                          color: deactivationType === 'temporary' ? '#93c5fd' : '#71717a',
                          marginTop: '2px'
                        }}>
                          Pausa tu cuenta - recuperable cuando quieras
                        </Text>
                      </div>
                    </Group>
                  </div>
                }
              />
            </div>
            
            <div 
              style={{ 
                padding: '10px',
                borderRadius: '6px',
                border: deactivationType === 'permanent' 
                  ? '2px solid #dc2626' 
                  : '1px solid #404040',
                backgroundColor: deactivationType === 'permanent' 
                  ? '#7f1d1d' 
                  : '#262626',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setDeactivationType('permanent')}
            >
              <Radio
                value="permanent"
                label={
                  <div style={{ marginLeft: '8px' }}>
                    <Group gap="xs" wrap="nowrap">
                      <Trash2 size={16} color={deactivationType === 'permanent' ? '#fca5a5' : '#71717a'} />
                      <div>
                        <Text fw={600} size="xs" style={{ 
                          color: deactivationType === 'permanent' ? '#ffffff' : '#d4d4d8' 
                        }}>
                          Eliminación permanente
                        </Text>
                        <Text size="xs" style={{ 
                          color: deactivationType === 'permanent' ? '#fca5a5' : '#71717a',
                          marginTop: '2px'
                        }}>
                          Elimina tu cuenta - 7 días para recuperar
                        </Text>
                      </div>
                    </Group>
                  </div>
                }
              />
            </div>
          </Stack>
        </Radio.Group>
      </div>

      <Select
        label="Razón (opcional)"
        placeholder="Selecciona una razón"
        data={reasonOptions}
        value={reason}
        onChange={(value) => setReason(value || '')}
        clearable
        size="xs"
        styles={{
          label: {
            color: '#ffffff',
            fontWeight: 500,
            fontSize: '0.8rem'
          },
          input: {
            borderRadius: '6px',
            backgroundColor: '#262626',
            border: '1px solid #404040',
            color: '#ffffff',
            padding: '0.5rem'
          },
          dropdown: {
            backgroundColor: '#262626',
            border: '1px solid #404040'
          },
          option: {
            color: '#ffffff',
            backgroundColor: '#262626',
            fontSize: '0.8rem',
            '&:hover': {
              backgroundColor: '#374151'
            }
          }
        }}
      />

      {eligibilityData && (eligibilityData.active_trips > 0 || eligibilityData.active_bookings > 0) && (
        <div style={{ 
          backgroundColor: '#a16207',
          border: '2px solid #ca8a04',
          borderRadius: '8px',
          padding: '12px'
        }}>
          <Text size="xs" fw={500} style={{ color: '#ffffff', marginBottom: '6px' }}>
            📋 Esto afectará tus actividades:
          </Text>
          <div style={{ paddingLeft: '6px' }}>
            {eligibilityData.active_trips > 0 && (
              <Text size="xs" style={{ color: '#fde047', marginBottom: '2px' }}>
                • {eligibilityData.active_trips} viaje(s) activo(s) serán cancelados
              </Text>
            )}
            {eligibilityData.active_bookings > 0 && (
              <Text size="xs" style={{ color: '#fde047' }}>
                • {eligibilityData.active_bookings} reserva(s) activa(s) serán canceladas
              </Text>
            )}
          </div>
        </div>
      )}
    </Stack>
  );

  const renderConfirmationStep = () => (
    <Stack gap="xs">
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '8px',
        padding: '12px',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 8px'
        }}>
          <AlertTriangle size={16} color="#ffffff" />
        </div>
        <Text size="sm" fw={600} style={{ color: '#ffffff', marginBottom: '4px' }}>
          Confirmación final
        </Text>
        <Text size="xs" style={{ color: '#a1a1aa' }}>
          {deactivationType === 'temporary' ? 'Desactivar temporalmente' : 'Eliminar permanentemente'}
        </Text>
      </div>

      <div style={{ 
        backgroundColor: '#7f1d1d',
        border: '2px solid #dc2626',
        borderRadius: '8px',
        padding: '12px'
      }}>
        <Text fw={500} size="xs" style={{ color: '#ffffff', marginBottom: '8px' }}>
          ⚠️ {deactivationType === 'temporary' ? 'Pausará' : 'Eliminará'} tu cuenta
        </Text>
        
        <Stack gap={4}>
          <Text size="xs" style={{ color: '#ffffff', lineHeight: '1.2' }}>
            • {deactivationType === 'temporary'
              ? 'Cuenta pausada hasta reactivar'
              : 'Eliminación permanente'
            }
          </Text>

          {deactivationType === 'permanent' && (
            <>
              <Text size="xs" style={{ color: '#ffffff', lineHeight: '1.2' }}>
                • 7 días para recuperar
              </Text>

              <Text size="xs" style={{ color: '#ffffff', lineHeight: '1.2' }}>
                • Datos legales se mantienen
              </Text>
            </>
          )}
        </Stack>
      </div>

      <div style={{ 
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '12px'
      }}>
        <Text fw={500} size="xs" style={{ color: '#ffffff', marginBottom: '8px', textAlign: 'center' }}>
          Escribe exactamente:
        </Text>
        <div style={{ 
          backgroundColor: '#262626',
          border: '1px solid #404040',
          padding: '8px', 
          borderRadius: '6px',
          textAlign: 'center',
          marginBottom: '8px'
        }}>
          <code style={{ 
            fontSize: '12px', 
            fontWeight: 600, 
            color: '#16a34a',
            fontFamily: 'Monaco, Menlo, monospace'
          }}>
            {requiredConfirmationText}
          </code>
        </div>
        <TextInput
          value={confirmationText}
          onChange={(event) => setConfirmationText(event.currentTarget.value)}
          placeholder={`Escribe: ${requiredConfirmationText}`}
          size="xs"
          styles={{
            input: {
              textAlign: 'center',
              fontFamily: 'Monaco, Menlo, monospace',
              fontWeight: 600,
              backgroundColor: '#262626',
              border: '1px solid #404040',
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '12px',
              padding: '6px'
            }
          }}
          error={
            confirmationText && confirmationText !== requiredConfirmationText
              ? 'No coincide'
              : null
          }
        />
      </div>
    </Stack>
  );

  const renderFinalStep = () => (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <div style={{ 
        backgroundColor: '#16a34a',
        borderRadius: '50%',
        width: '72px',
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
        boxShadow: '0 0 20px rgba(22, 163, 74, 0.3)'
      }}>
        <CheckCircle size={36} color="#ffffff" />
      </div>

      <Text fw={600} size="lg" style={{ color: '#ffffff', marginBottom: '12px' }}>
        {deactivationType === 'temporary' ? '✅ Cuenta desactivada' : '🗑️ Cuenta eliminada'}
      </Text>
      
      <Text size="sm" style={{ color: '#a1a1aa', marginBottom: '20px', lineHeight: '1.5' }}>
        {deactivationType === 'temporary' 
          ? 'Tu cuenta está pausada. Puedes reactivarla iniciando sesión nuevamente.'
          : 'Tu cuenta será eliminada. Tienes 7 días para recuperarla si cambias de opinión.'
        }
      </Text>

      <div style={{ 
        backgroundColor: '#1e40af',
        border: '2px solid #3b82f6',
        borderRadius: '12px',
        padding: '16px'
      }}>
        <Text size="xs" style={{ color: '#93c5fd' }}>
          🔄 Serás desconectado automáticamente en unos segundos
        </Text>
      </div>
    </div>
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
    const buttonStyles = {
      borderRadius: '6px',
      fontWeight: 500,
      padding: '6px 12px',
      fontSize: '12px'
    };

    const cancelButtonStyles = {
      ...buttonStyles,
      backgroundColor: 'transparent',
      border: '1px solid #404040',
      color: '#ffffff'
    };

    const primaryButtonStyles = {
      ...buttonStyles,
      backgroundColor: '#3b82f6',
      border: 'none',
      color: '#ffffff'
    };

    const dangerButtonStyles = {
      ...buttonStyles,
      backgroundColor: '#dc2626',
      border: 'none',
      color: '#ffffff'
    };

    switch (step) {
      case 'eligibility':
        return (
          <Group justify="apart" style={{ marginTop: '8px' }}>
            <Button 
              variant="light" 
              onClick={handleModalClose}
              style={cancelButtonStyles}
              size="xs"
            >
              Cancelar
            </Button>
            <Button 
              onClick={checkEligibility} 
              disabled={loading}
              leftSection={<RotateCcw size={12} />}
              style={primaryButtonStyles}
              size="xs"
            >
              Verificar
            </Button>
          </Group>
        );

      case 'choose':
        return (
          <Group justify="apart" style={{ marginTop: '8px' }}>
            <Button 
              variant="light" 
              onClick={handleModalClose}
              style={cancelButtonStyles}
              size="xs"
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => setStep('confirmation')}
              style={primaryButtonStyles}
              size="xs"
            >
              Continuar →
            </Button>
          </Group>
        );

      case 'confirmation':
        return (
          <Group justify="apart" style={{ marginTop: '8px' }}>
            <Button 
              variant="light" 
              onClick={() => setStep('choose')}
              style={cancelButtonStyles}
              size="xs"
            >
              ← Atrás
            </Button>
            <Button
              onClick={handleDeactivateAccount}
              disabled={!isConfirmationComplete || loading}
              leftSection={deactivationType === 'temporary' ? <UserX size={12} /> : <Trash2 size={12} />}
              style={dangerButtonStyles}
              size="xs"
            >
              {loading
                ? 'Procesando...'
                : deactivationType === 'temporary'
                ? 'Desactivar'
                : 'Eliminar'
              }
            </Button>
          </Group>
        );

      case 'final':
        return (
          <Group justify="center" style={{ marginTop: '8px' }}>
            <Button 
              variant="light" 
              onClick={handleModalClose}
              style={primaryButtonStyles}
              size="xs"
            >
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
      size="xs"
      closeOnClickOutside={step !== 'final'}
      closeOnEscape={step !== 'final'}
      withCloseButton={step !== 'final'}
      padding="xs"
      styles={{
        content: {
          backgroundColor: '#0a0a0a',
          border: '1px solid #333',
          borderRadius: '8px'
        },
        header: {
          backgroundColor: '#0a0a0a',
          borderBottom: '1px solid #333',
          color: '#ffffff',
          padding: '6px 10px'
        },
        title: {
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '0.9rem'
        },
        close: {
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#262626'
          }
        },
        body: {
          backgroundColor: '#0a0a0a',
          color: '#ffffff',
          padding: '6px 10px'
        }
      }}
    >
      <LoadingOverlay visible={loading} />
      
      <div style={{ color: '#ffffff' }}>
        {renderStepContent()}
      </div>

      <Group mt="xs">
        {renderFooterButtons()}
      </Group>
    </Modal>
  );
};
