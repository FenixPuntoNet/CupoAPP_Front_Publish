import React from 'react';
import { 
  Alert, 
  Text, 
  Button, 
  Group, 
  Badge,
  Stack,
  Card
} from '@mantine/core';
import { 
  IconAlertTriangle, 
  IconShieldX, 
  IconClock,
  IconBan
} from '@tabler/icons-react';
import { useUserModerationStatus } from '@/hooks/useModerationStatus';
import styles from './ModerationStatusDisplay.module.css';

interface ModerationStatusDisplayProps {
  userId: string;
  onAcknowledgeWarning?: (warningId: number) => void;
}

export const ModerationStatusDisplay: React.FC<ModerationStatusDisplayProps> = ({
  userId,
  onAcknowledgeWarning
}) => {
  const { 
    isSuspended, 
    warningLevel, 
    suspensionInfo, 
    activeWarnings, 
    loading 
  } = useUserModerationStatus(userId);

  if (loading || (!isSuspended && warningLevel === 0 && activeWarnings.length === 0)) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low': return 'blue';
      case 'medium': return 'orange';
      case 'high': return 'red';
      default: return 'gray';
    }
  };

  // Mostrar suspensión si está activa
  if (isSuspended && suspensionInfo) {
    return (
      <Alert
        icon={<IconBan size={20} />}
        title="Cuenta Suspendida"
        color="red"
        className={styles.suspensionAlert}
      >
        <Stack gap="sm">
          <Text size="sm" fw={600}>
            {suspensionInfo.reason}
          </Text>
          <Text size="sm">
            {suspensionInfo.message}
          </Text>
          
          {suspensionInfo.is_permanent ? (
            <Badge color="red" variant="filled" size="sm">
              Suspensión Permanente
            </Badge>
          ) : suspensionInfo.suspended_until ? (
            <Group gap="xs" align="center">
              <IconClock size={14} />
              <Text size="xs">
                Suspendido hasta: {formatDate(suspensionInfo.suspended_until)}
              </Text>
            </Group>
          ) : null}
          
          <Text size="xs" className="text-gray-600">
            Suspendido el: {formatDate(suspensionInfo.created_at)}
          </Text>
        </Stack>
      </Alert>
    );
  }

  // Mostrar advertencias activas
  if (activeWarnings.length > 0) {
    const unacknowledgedWarnings = activeWarnings.filter(w => !w.acknowledged_at);
    
    if (unacknowledgedWarnings.length > 0) {
      return (
        <Stack gap="sm">
          {/* Alert general de advertencias */}
          <Alert
            icon={<IconAlertTriangle size={20} />}
            title={`Tienes ${unacknowledgedWarnings.length} advertencia${unacknowledgedWarnings.length > 1 ? 's' : ''} pendiente${unacknowledgedWarnings.length > 1 ? 's' : ''}`}
            color="orange"
            className={styles.warningAlert}
          >
            <Text size="sm">
              Por favor, revisa las siguientes advertencias sobre tu comportamiento en la plataforma.
            </Text>
          </Alert>

          {/* Cards individuales para cada advertencia */}
          {unacknowledgedWarnings.map((warning) => (
            <Card key={warning.id} className={styles.warningCard}>
              <Group justify="space-between" align="flex-start" className="mb-3">
                <Group gap="sm">
                  <IconShieldX size={18} className="text-orange-500" />
                  <Badge 
                    color={getSeverityColor(warning.severity)} 
                    variant="light"
                    size="sm"
                  >
                    {warning.severity === 'low' ? 'Leve' : 
                     warning.severity === 'medium' ? 'Moderada' : 'Grave'}
                  </Badge>
                </Group>
                <Text size="xs" className="text-gray-500">
                  {formatDate(warning.created_at)}
                </Text>
              </Group>

              <Text size="sm" fw={600} className="mb-2">
                {warning.reason}
              </Text>
              
              <Text size="sm" className="mb-4 text-gray-700">
                {warning.message}
              </Text>

              {onAcknowledgeWarning && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => onAcknowledgeWarning(warning.id)}
                  className={styles.acknowledgeButton}
                >
                  He leído y entendido
                </Button>
              )}
            </Card>
          ))}

          {/* Información adicional */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <Text size="xs" className="text-blue-600">
              <strong>Importante:</strong> Las advertencias se mantienen activas por 30 días. 
              Acumular múltiples advertencias puede resultar en la suspensión temporal o permanente de tu cuenta.
            </Text>
          </div>
        </Stack>
      );
    }
  }

  // Mostrar nivel de advertencias como información
  if (warningLevel > 0) {
    return (
      <Alert
        icon={<IconAlertTriangle size={16} />}
        title="Historial de Advertencias"
        color="yellow"
        className={styles.warningLevelAlert}
      >
        <Text size="sm">
          Has recibido {warningLevel} advertencia{warningLevel > 1 ? 's' : ''} en los últimos 30 días. 
          Te recomendamos revisar nuestras normas de comunidad.
        </Text>
      </Alert>
    );
  }

  return null;
};
