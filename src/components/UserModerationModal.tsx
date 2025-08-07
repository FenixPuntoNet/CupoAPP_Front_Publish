import React from 'react';
import { Modal, Alert, Button, Text, Group, Divider, Badge } from '@mantine/core';
import { IconAlertTriangle, IconBan, IconClock, IconCheck } from '@tabler/icons-react';
import { useUserModeration } from '@/hooks/useUserModeration';
import styles from './UserModerationModal.module.css';

interface UserModerationModalProps {
  opened: boolean;
  onClose: () => void;
  userId: string;
}

export const UserModerationModal: React.FC<UserModerationModalProps> = ({
  opened,
  onClose,
  userId
}) => {
  const {
    isSuspended,
    suspensionInfo,
    loading,
    acknowledgeWarning,
    getUnacknowledgedWarnings,
    getSuspensionTimeRemaining
  } = useUserModeration(userId);

  const unacknowledgedWarnings = getUnacknowledgedWarnings();
  const timeRemaining = getSuspensionTimeRemaining();

  const handleAcknowledgeWarning = async (warningId: number) => {
    const success = await acknowledgeWarning(warningId);
    if (success && unacknowledgedWarnings.length === 1) {
      // Si era la última advertencia, cerrar el modal
      onClose();
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'yellow';
      default: return 'gray';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return 'Desconocida';
    }
  };

  if (loading) {
    return null;
  }

  // No mostrar modal si no hay advertencias sin reconocer ni suspensiones
  if (!isSuspended && unacknowledgedWarnings.length === 0) {
    return null;
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          {isSuspended ? (
            <IconBan size={20} className="text-red-500" />
          ) : (
            <IconAlertTriangle size={20} className="text-orange-500" />
          )}
          <Text size="lg" fw={600}>
            {isSuspended ? 'Cuenta suspendida' : 'Advertencias importantes'}
          </Text>
        </Group>
      }
      centered
      size="md"
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={!isSuspended}
      classNames={{
        content: styles.modalContent,
        header: styles.modalHeader,
        body: styles.modalBody
      }}
    >
      {isSuspended && suspensionInfo && (
        <div className="space-y-4">
          <Alert
            color="red"
            icon={<IconBan size={16} />}
            title="Tu cuenta ha sido suspendida"
          >
            <Text size="sm" className="mb-2">
              <strong>Razón:</strong> {suspensionInfo.reason}
            </Text>
            <Text size="sm" className="mb-2">
              {suspensionInfo.message}
            </Text>
            {suspensionInfo.isPermanent ? (
              <Text size="sm" fw={500} className="text-red-600">
                Esta suspensión es permanente.
              </Text>
            ) : timeRemaining ? (
              <Group gap="xs" className="mt-2">
                <IconClock size={16} className="text-orange-500" />
                <Text size="sm">
                  Tiempo restante: <strong>{timeRemaining}</strong>
                </Text>
              </Group>
            ) : (
              <Text size="sm" className="text-green-600">
                Tu suspensión ha expirado. Puedes usar la aplicación normalmente.
              </Text>
            )}
          </Alert>

          <div className="bg-gray-50 p-4 rounded-lg">
            <Text size="sm" className="text-gray-700">
              <strong>¿Qué puedes hacer?</strong>
            </Text>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>• Revisar nuestras normas de comunidad</li>
              <li>• Contactar soporte si crees que hay un error</li>
              <li>• Esperar a que termine la suspensión temporal</li>
            </ul>
          </div>

          <Group justify="center" className="mt-4">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/soporte'}
            >
              Contactar soporte
            </Button>
          </Group>
        </div>
      )}

      {!isSuspended && unacknowledgedWarnings.length > 0 && (
        <div className="space-y-4">
          <Alert
            color="orange"
            icon={<IconAlertTriangle size={16} />}
            title="Tienes advertencias pendientes"
          >
            <Text size="sm">
              Hemos detectado comportamientos que van contra nuestras normas de comunidad. 
              Por favor, lee estas advertencias y confirma que las has entendido.
            </Text>
          </Alert>

          <div className="space-y-3">
            {unacknowledgedWarnings.map((warning) => (
              <div key={warning.id} className="border rounded-lg p-4 bg-white">
                <Group justify="space-between" align="start" className="mb-3">
                  <div className="flex-1">
                    <Group gap="sm" className="mb-2">
                      <Badge color={getSeverityColor(warning.severity)} size="sm">
                        Severidad: {getSeverityLabel(warning.severity)}
                      </Badge>
                      <Text size="xs" className="text-gray-500">
                        {new Date(warning.createdAt || '').toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </Group>
                    <Text size="sm" fw={500} className="mb-2">
                      {warning.reason}
                    </Text>
                    <Text size="sm" className="text-gray-700">
                      {warning.message}
                    </Text>
                  </div>
                </Group>
                <Group justify="flex-end">
                  <Button
                    size="sm"
                    onClick={() => handleAcknowledgeWarning(warning.id)}
                    leftSection={<IconCheck size={16} />}
                  >
                    He leído y entendido
                  </Button>
                </Group>
              </div>
            ))}
          </div>

          <Divider className="my-4" />

          <div className="bg-blue-50 p-4 rounded-lg">
            <Text size="sm" fw={500} className="text-blue-700 mb-2">
              Recordatorio importante
            </Text>
            <Text size="sm" className="text-blue-600">
              Continuar violando nuestras normas puede resultar en suspensiones temporales o permanentes. 
              Te pedimos que respetes a todos los miembros de nuestra comunidad.
            </Text>
          </div>
        </div>
      )}
    </Modal>
  );
};
