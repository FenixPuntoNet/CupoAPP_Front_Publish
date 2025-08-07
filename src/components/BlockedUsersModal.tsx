import React, { useState, useEffect } from 'react';
import { Modal, Button, Text, Group, Alert, ScrollArea, ActionIcon, LoadingOverlay } from '@mantine/core';
import { IconUserX, IconTrash, IconAlertCircle } from '@tabler/icons-react';
import { getBlockedUsers, unblockUser, BlockedUser } from '@/services/moderation';
import styles from './BlockedUsersModal.module.css';

interface BlockedUsersModalProps {
  opened: boolean;
  onClose: () => void;
}

export const BlockedUsersModal: React.FC<BlockedUsersModalProps> = ({
  opened,
  onClose
}) => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (opened) {
      fetchBlockedUsers();
    }
  }, [opened]);

  const fetchBlockedUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📊 Fetching blocked users...');
      const result = await getBlockedUsers();
      
      if (result.success && result.data) {
        console.log('✅ Blocked users fetched:', result.data);
        setBlockedUsers(result.data);
      } else {
        console.error('❌ Failed to fetch blocked users:', result.error);
        setError(result.error || 'Error al obtener usuarios bloqueados');
      }
    } catch (err) {
      console.error('❌ Unexpected error fetching blocked users:', err);
      setError('Error inesperado al obtener usuarios bloqueados');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    setUnblockingUserId(userId);
    setError(null);

    try {
      console.log('✅ Unblocking user:', userId);
      const result = await unblockUser(userId);

      if (result.success) {
        console.log('✅ User unblocked successfully');
        // Remover usuario de la lista local
        setBlockedUsers(prev => prev.filter(user => user.id !== userId));
      } else {
        console.error('❌ Failed to unblock user:', result.error);
        setError(result.error || 'Error al desbloquear usuario');
      }
    } catch (err) {
      console.error('❌ Unexpected error unblocking user:', err);
      setError('Error inesperado al desbloquear usuario');
    } finally {
      setUnblockingUserId(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha desconocida';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <IconUserX size={20} className="text-red-500" />
          <Text size="lg" fw={600}>
            Usuarios bloqueados
          </Text>
        </Group>
      }
      size="md"
      centered
      classNames={{
        content: styles.modalContent,
        header: styles.modalHeader,
        body: styles.modalBody
      }}
    >
      <LoadingOverlay visible={loading} />
      
      {error && (
        <Alert color="red" icon={<IconAlertCircle size={16} />} className="mb-4">
          {error}
        </Alert>
      )}

      {blockedUsers.length === 0 && !loading ? (
        <div className="text-center py-8">
          <IconUserX size={48} className="text-gray-400 mx-auto mb-4" />
          <Text size="lg" fw={500} className="text-gray-600 mb-2">
            No tienes usuarios bloqueados
          </Text>
          <Text size="sm" className="text-gray-500">
            Cuando bloquees a un usuario, aparecerá aquí
          </Text>
        </div>
      ) : (
        <div>
          <Text size="sm" className="text-gray-600 mb-4">
            Los usuarios bloqueados no pueden contactarte ni ver tus viajes.
          </Text>
          
          <ScrollArea className="max-h-96">
            <div className="space-y-3">
              {blockedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <img
                    src={user.photo}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <Text size="sm" fw={500} className="text-gray-900">
                      {user.name}
                    </Text>
                    <Text size="xs" className="text-gray-500">
                      Bloqueado el {formatDate(user.blockedAt)}
                    </Text>
                  </div>
                  <ActionIcon
                    color="red"
                    variant="outline"
                    onClick={() => handleUnblockUser(user.id)}
                    loading={unblockingUserId === user.id}
                    disabled={unblockingUserId !== null}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <Group justify="flex-end" className="mt-6">
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </Group>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <Text size="xs" className="text-blue-600">
          <strong>Tip:</strong> Puedes desbloquear usuarios haciendo clic en el icono de la papelera. También puedes bloquear usuarios desde sus perfiles o mensajes en el chat.
        </Text>
      </div>
    </Modal>
  );
};
