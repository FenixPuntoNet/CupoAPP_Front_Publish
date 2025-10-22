import { useState, useEffect } from 'react';

interface UserModerationStatus {
  isSuspended: boolean;
  error: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cupo.site';

export function useUserModerationStatus(userId: string | null): UserModerationStatus {
  const [status, setStatus] = useState<UserModerationStatus>({
    isSuspended: false,
    error: null
  });

  useEffect(() => {
    if (!userId) {
      setStatus(prev => ({ ...prev }));
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
      const token = getAuthToken();
      if (!token) {
        setStatus({
          isSuspended: false,
          error: 'No hay sesión activa'
        });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/user-moderation/status?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const moderationStatus = result.moderationStatus;

      setStatus({
        isSuspended: moderationStatus?.isSuspended || false,
        error: moderationStatus?.error || null
      });

    } catch (error: any) {
      setStatus({
        isSuspended: false,
        error: error.message || 'Error al verificar estado de moderación'
      });
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
      setBlockStatus({
        isBlocked: false,
        isBlockedBy: false,
        loading: false,
        error: null
      });
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
      const token = getAuthToken();
      if (!token) {
        setBlockStatus({
          isBlocked: false,
          isBlockedBy: false,
          loading: false,
          error: 'No hay sesión activa'
        });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/user-moderation/block-status/${targetUserId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      setBlockStatus({
        isBlocked: result.isBlocked || false,
        isBlockedBy: result.isBlockedBy || false,
        loading: false,
        error: null
      });

    } catch (error: any) {
      setBlockStatus({
        isBlocked: false,
        isBlockedBy: false,
        loading: false,
        error: error.message || 'Error al verificar estado de bloqueo'
      });
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
      setStats({
        reportsSubmitted: 0,
        reportsResolved: 0,
        blockedUsersCount: 0,
        loading: false,
        error: null
      });
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
      const token = getAuthToken();
      if (!token) {
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'No hay sesión activa'
        }));
        return;
      }

      const response = await fetch(`${API_BASE_URL}/user-moderation/my-stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      setStats({
        reportsSubmitted: result.reportsSubmitted || 0,
        reportsResolved: result.reportsResolved || 0,
        blockedUsersCount: result.blockedUsersCount || 0,
        loading: false,
        error: null
      });

    } catch (error: any) {
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error al obtener estadísticas de moderación'
      }));
    }
  };

  return stats;
}
