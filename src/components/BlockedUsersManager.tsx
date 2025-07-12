import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Title, 
  Card, 
  Text, 
  Group, 
  Button, 
  Alert,
  Stack,
  Avatar,
  Loader,
  Badge
} from '@mantine/core';
import { IconUserX, IconCheck, IconAlertTriangle } from '@tabler/icons-react';
import { unblockUser } from '@/lib/contentModeration';
import { supabase } from '@/lib/supabaseClient';
import styles from './BlockedUsersManager.module.css';

interface BlockedUser {
  blocked_user_id: string;
  reason: string;
  created_at: string;
  user_info?: {
    first_name: string;
    last_name: string;
    photo_user?: string;
  };
}

interface BlockedUsersManagerProps {
  currentUserId: string;
  onUserUnblocked?: (userId: string) => void;
}

export const BlockedUsersManager: React.FC<BlockedUsersManagerProps> = ({
  currentUserId,
  onUserUnblocked
}) => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingUsers, setUnblockingUsers] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBlockedUsers();
  }, [currentUserId]);

  const fetchBlockedUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener usuarios bloqueados directamente de la tabla
      const { data: blockedData, error: blockedError } = await supabase
        .from('user_blocks')
        .select('blocked_id, reason, created_at')
        .eq('blocker_id', currentUserId);

      if (blockedError) {
        throw new Error(blockedError.message);
      }

      if (!blockedData || blockedData.length === 0) {
        setBlockedUsers([]);
        return;
      }

      // Obtener información de perfil de los usuarios bloqueados
      const userIds = blockedData.map((user: any) => user.blocked_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, photo_user')
        .in('user_id', userIds);

      if (profilesError) {
        throw new Error(profilesError.message);
      }

      // Combinar datos
      const blockedUsersWithInfo = blockedData.map((blockedUser: any) => {
        const profile = profiles?.find(p => p.user_id === blockedUser.blocked_id);
        return {
          ...blockedUser,
          blocked_user_id: blockedUser.blocked_id,
          user_info: profile
        };
      });

      setBlockedUsers(blockedUsersWithInfo);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios bloqueados');
      console.error('Error fetching blocked users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      setUnblockingUsers(prev => new Set(prev).add(userId));

      const result = await unblockUser(currentUserId, userId);

      if (result.success) {
        setBlockedUsers(prev => prev.filter(user => user.blocked_user_id !== userId));
        onUserUnblocked?.(userId);
      } else {
        setError(result.error || 'Error al desbloquear usuario');
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado al desbloquear usuario');
    } finally {
      setUnblockingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container className={styles.container}>
        <div className="flex justify-center items-center h-32">
          <Loader size="lg" />
        </div>
      </Container>
    );
  }

  return (
    <Container className={styles.container}>
      <div className="mb-6">
        <Title order={2} className={styles.title}>
          <IconUserX className="mr-2" size={24} />
          Usuarios Bloqueados
        </Title>
        <Text className={styles.subtitle}>
          Gestiona la lista de usuarios que has bloqueado
        </Text>
      </div>

      {error && (
        <Alert 
          icon={<IconAlertTriangle size={16} />} 
          title="Error"
          color="red"
          className="mb-4"
          onClose={() => setError(null)}
          withCloseButton
        >
          {error}
        </Alert>
      )}

      {blockedUsers.length === 0 ? (
        <Card className={styles.emptyCard}>
          <div className="text-center py-12">
            <IconCheck size={48} className="mx-auto text-green-500 mb-4" />
            <Text size="lg" fw={600} className="text-gray-700 mb-2">
              No has bloqueado a ningún usuario
            </Text>
            <Text size="sm" className="text-gray-500">
              Los usuarios que bloquees aparecerán aquí y podrás desbloquearlos cuando quieras
            </Text>
          </div>
        </Card>
      ) : (
        <Stack gap="md">
          {blockedUsers.map((blockedUser) => (
            <Card key={blockedUser.blocked_user_id} className={styles.userCard}>
              <Group justify="space-between" align="center">
                <Group gap="md">
                  <Avatar
                    src={blockedUser.user_info?.photo_user}
                    size="md"
                    radius="xl"
                  >
                    {blockedUser.user_info?.first_name?.[0] || '?'}
                  </Avatar>
                  
                  <div>
                    <Text size="md" fw={600} className="text-gray-800">
                      {blockedUser.user_info?.first_name} {blockedUser.user_info?.last_name}
                    </Text>
                    <Text size="sm" className="text-gray-600 mb-1">
                      Bloqueado el {formatDate(blockedUser.created_at)}
                    </Text>
                    {blockedUser.reason && (
                      <Badge variant="light" color="gray" size="xs">
                        {blockedUser.reason}
                      </Badge>
                    )}
                  </div>
                </Group>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnblockUser(blockedUser.blocked_user_id)}
                  loading={unblockingUsers.has(blockedUser.blocked_user_id)}
                  className={styles.unblockButton}
                >
                  Desbloquear
                </Button>
              </Group>
            </Card>
          ))}
        </Stack>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <Text size="xs" className="text-blue-600">
          <strong>Nota:</strong> Al desbloquear a un usuario, podrá volver a contactarte, ver tus viajes y aparecer en las búsquedas. Podrás bloquearlo nuevamente si es necesario.
        </Text>
      </div>
    </Container>
  );
};
