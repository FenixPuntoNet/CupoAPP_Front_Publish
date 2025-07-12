import React, { useState, useEffect } from 'react';
import { Modal, Button, Text, Group, Alert, ScrollArea, ActionIcon, LoadingOverlay } from '@mantine/core';
import { IconUserX, IconTrash, IconAlertCircle } from '@tabler/icons-react';
import { getBlockedUsers, unblockUser } from '@/lib/contentModeration';
import { supabase } from '@/lib/supabaseClient';
import styles from './BlockedUsersModal.module.css';

interface BlockedUsersModalProps {
  opened: boolean;
  onClose: () => void;
  currentUserId: string;
}

interface BlockedUser {
  id: string;
  name: string;
  photo: string;
  blockedAt: string;
}

export const BlockedUsersModal: React.FC<BlockedUsersModalProps> = ({
  opened,
  onClose,
  currentUserId
}) => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (opened) {
      fetchBlockedUsers();
    }
  }, [opened, currentUserId]);

  const fetchBlockedUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Obtener IDs de usuarios bloqueados
      const blockedIds = await getBlockedUsers(currentUserId);
      
      if (blockedIds.length === 0) {
        setBlockedUsers([]);
        return;
      }

      // Obtener información de los usuarios bloqueados
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, photo_user')
        .in('user_id', blockedIds);

      if (profilesError) {
        throw new Error(profilesError.message);
      }

      // Obtener fechas de bloqueo
      const { data: blocks, error: blocksError } = await supabase
        .from('user_blocks')
        .select('blocked_id, created_at')
        .eq('blocker_id', currentUserId)
        .in('blocked_id', blockedIds);

      if (blocksError) {
        throw new Error(blocksError.message);
      }

      // Combinar información
      const blockedUsersData: BlockedUser[] = profiles?.map(profile => {
        const blockInfo = blocks?.find(block => block.blocked_id === profile.user_id);
        return {
          id: profile.user_id,
          name: `${profile.first_name} ${profile.last_name}`.trim() || 'Sin nombre',
          photo: profile.photo_user || 'https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/SinFotoPerfil.png',
          blockedAt: blockInfo?.created_at || ''
        };
      }) || [];

      setBlockedUsers(blockedUsersData);
    } catch (err) {
      console.error('Error fetching blocked users:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios bloqueados');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    setUnblockingUserId(userId);
    setError(null);

    try {
      const result = await unblockUser(currentUserId, userId);
      
      if (result.success) {
        setBlockedUsers(prev => prev.filter(user => user.id !== userId));
      } else {
        setError(result.error || 'Error al desbloquear usuario');
      }
    } catch (err) {
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
