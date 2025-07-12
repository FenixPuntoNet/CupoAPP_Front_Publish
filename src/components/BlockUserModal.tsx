import React, { useState } from 'react';
import { Modal, Button, Text, Alert, Group } from '@mantine/core';
import { IconUserX, IconAlertTriangle, IconCheck } from '@tabler/icons-react';
import { blockUser } from '@/lib/contentModeration';
import styles from './BlockUserModal.module.css';

interface BlockUserModalProps {
  opened: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName: string;
  currentUserId: string;
}

export const BlockUserModal: React.FC<BlockUserModalProps> = ({
  opened,
  onClose,
  targetUserId,
  targetUserName,
  currentUserId
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBlock = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await blockUser(
        currentUserId,
        targetUserId,
        `Usuario bloqueado desde el chat`
      );

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Error al bloquear usuario');
      }
    } catch (err) {
      setError('Error inesperado al bloquear usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setError(null);
      setSuccess(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <IconUserX size={20} className="text-red-500" />
          <Text size="lg" fw={600}>
            Bloquear usuario
          </Text>
        </Group>
      }
      centered
      size="md"
      classNames={{
        content: styles.modalContent,
        header: styles.modalHeader,
        body: styles.modalBody
      }}
    >
      {success ? (
        <div className="text-center py-6">
          <IconCheck size={48} className="text-green-500 mx-auto mb-4" />
          <Text size="lg" fw={600} className="text-green-600 mb-2">
            Usuario bloqueado exitosamente
          </Text>
          <Text size="sm" className="text-gray-600">
            Ya no podrás ver mensajes de este usuario ni ser contactado por él
          </Text>
        </div>
      ) : (
        <div>
          <Alert
            icon={<IconAlertTriangle size={16} />}
            color="yellow"
            className="mb-4"
          >
            <Text size="sm" fw={500} className="mb-2">
              ¿Estás seguro de que quieres bloquear a <strong>{targetUserName}</strong>?
            </Text>
          </Alert>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <Text size="sm" fw={500} className="mb-2">
                Al bloquear a este usuario:
              </Text>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• No podrás ver sus mensajes en chats</li>
                <li>• No podrá enviarte mensajes directos</li>
                <li>• No aparecerá en tus búsquedas de viajes</li>
                <li>• No podrá unirse a viajes que publiques</li>
                <li>• Puedes desbloquearlo en cualquier momento desde tu perfil</li>
              </ul>
            </div>

            {error && (
              <Alert color="red" className="mb-2">
                {error}
              </Alert>
            )}

            <Group justify="flex-end" gap="sm" className="mt-6">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleBlock}
                loading={loading}
                className={styles.blockButton}
              >
                Bloquear usuario
              </Button>
            </Group>
          </div>

          <div className={styles.alternativeNote}>
            <Text size="xs" className={styles.alternativeText}>
              <strong>Alternativa:</strong> Si este usuario está violando nuestras normas, considera también reportar su comportamiento para que nuestro equipo pueda tomar medidas adicionales.
            </Text>
          </div>
        </div>
      )}
    </Modal>
  );
};
