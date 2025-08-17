import { useState, useEffect } from 'react';

interface UserModerationStatus {
  isSuspended: boolean;
  warningLevel: number;
  suspensionInfo?: {
    id: number;
    reason: string;
    message: string;
    suspended_until?: string;
    is_permanent: boolean;
    created_at: string;
  };
  activeWarnings: Array<{
    id: number;
    reason: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
    created_at: string;
    acknowledged_at?: string;
  }>;
  loading: boolean;
  error: string | null;
}

export function useUserModerationStatus(userId: string | null): UserModerationStatus {
  const [status, setStatus] = useState<UserModerationStatus>({
    isSuspended: false,
    warningLevel: 0,
    activeWarnings: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!userId) {
      setStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    checkUserModerationStatus();
  }, [userId]);

  const getAuthToken = () => {
    return localStorage.getItem('sb-mqwvbnktcokcccidfgcu-auth-token');
  };

  const checkUserModerationStatus = async () => {
    if (!userId) return;

    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));

      const token = getAuthToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      // Obtener estado de moderación desde el backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/user-moderation/status?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.moderationStatus) {
        setStatus(data.moderationStatus);
      } else {
        setStatus(prev => ({
          ...prev,
          loading: false,
          error: data.error || 'Error al obtener estado de moderación'
        }));
      }

    } catch (error: any) {
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error al verificar estado de moderación'
      }));
    }
  };

  return status;
}

// Hook para verificar si dos usuarios se tienen bloqueados mutuamente
export function useBlockStatus(currentUserId: string | null, targetUserId: string | null) {
  const [blockStatus, setBlockStatus] = useState({
    isBlocked: false,
    isBlockedBy: false,
    loading: true,
    error: null as string | null
  });

  useEffect(() => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
      setBlockStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    checkBlockStatus();
  }, [currentUserId, targetUserId]);

  const getAuthToken = () => {
    return localStorage.getItem('sb-mqwvbnktcokcccidfgcu-auth-token');
  };

  const checkBlockStatus = async () => {
    if (!currentUserId || !targetUserId) return;

    try {
      setBlockStatus(prev => ({ ...prev, loading: true, error: null }));

      const token = getAuthToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      // Verificar estado de bloqueo usando el backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/user-moderation/block-status/${targetUserId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.blockStatus) {
        setBlockStatus(data.blockStatus);
      } else {
        setBlockStatus(prev => ({
          ...prev,
          loading: false,
          error: data.error || 'Error al verificar estado de bloqueo'
        }));
      }

    } catch (error: any) {
      setBlockStatus(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error al verificar estado de bloqueo'
      }));
    }
  };

  return blockStatus;
}

// Hook para obtener estadísticas de moderación del usuario actual
export function useUserModerationStats(userId: string | null) {
  const [stats, setStats] = useState({
    reportsSubmitted: 0,
    reportsResolved: 0,
    blockedUsersCount: 0,
    loading: true,
    error: null as string | null
  });

  useEffect(() => {
    if (!userId) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    fetchStats();
  }, [userId]);

  const getAuthToken = () => {
    return localStorage.getItem('sb-mqwvbnktcokcccidfgcu-auth-token');
  };

  const fetchStats = async () => {
    if (!userId) return;

    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      const token = getAuthToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      // Obtener estadísticas desde el backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/user-moderation/my-stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.stats) {
        setStats({
          reportsSubmitted: data.stats.reports.total,
          reportsResolved: data.stats.reports.resolved,
          blockedUsersCount: data.stats.blocks.total,
          loading: false,
          error: null
        });
      } else {
        setStats(prev => ({
          ...prev,
          loading: false,
          error: data.error || 'Error al obtener estadísticas'
        }));
      }

    } catch (error: any) {
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error al obtener estadísticas'
      }));
    }
  };

  return stats;
}
