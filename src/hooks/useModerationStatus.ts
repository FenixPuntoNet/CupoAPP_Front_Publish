import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

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

  const checkUserModerationStatus = async () => {
    if (!userId) return;

    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));

      // Verificar suspensión directamente desde la tabla
      const { data: suspensionData, error: suspensionError } = await supabase
        .from('user_suspensions')
        .select('*')
        .eq('user_id', userId)
        .is('lifted_at', null)
        .or('is_permanent.eq.true,suspended_until.gt.now()')
        .maybeSingle();

      if (suspensionError) {
        throw new Error(`Error checking suspension: ${suspensionError.message}`);
      }

      // Obtener nivel de advertencias de los últimos 30 días
      const { data: warningData, error: warningError } = await supabase
        .from('user_warnings')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (warningError) {
        throw new Error(`Error checking warnings: ${warningError.message}`);
      }

      // Obtener información detallada de suspensión
      const suspensionInfo = suspensionData ? {
        id: suspensionData.id,
        reason: suspensionData.reason,
        message: suspensionData.message,
        suspended_until: suspensionData.suspended_until || undefined,
        is_permanent: suspensionData.is_permanent,
        created_at: suspensionData.created_at || new Date().toISOString()
      } : undefined;

      // Obtener advertencias activas (últimos 30 días)
      const { data: warnings, error: warningsError } = await supabase
        .from('user_warnings')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (warningsError) {
        console.warn('Error fetching warnings:', warningsError);
      }

      // Mapear advertencias al formato esperado
      const activeWarnings = (warnings || []).map(warning => ({
        id: warning.id,
        reason: warning.reason,
        message: warning.message,
        severity: warning.severity,
        created_at: warning.created_at || new Date().toISOString(),
        acknowledged_at: warning.acknowledged_at || undefined
      }));

      setStatus({
        isSuspended: Boolean(suspensionData),
        warningLevel: warningData?.length || 0,
        suspensionInfo,
        activeWarnings,
        loading: false,
        error: null
      });

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

  const checkBlockStatus = async () => {
    if (!currentUserId || !targetUserId) return;

    try {
      setBlockStatus(prev => ({ ...prev, loading: true, error: null }));

      // Verificar si el usuario actual ha bloqueado al usuario objetivo
      const { data: blockedByUser, error: blockError } = await supabase
        .from('user_blocks')
        .select('id')
        .eq('blocker_id', currentUserId)
        .eq('blocked_id', targetUserId)
        .maybeSingle();

      if (blockError) {
        throw new Error(`Error checking block status: ${blockError.message}`);
      }

      // Verificar si el usuario objetivo ha bloqueado al usuario actual
      const { data: blockedByTarget, error: blockedByError } = await supabase
        .from('user_blocks')
        .select('id')
        .eq('blocker_id', targetUserId)
        .eq('blocked_id', currentUserId)
        .maybeSingle();

      if (blockedByError) {
        throw new Error(`Error checking reverse block status: ${blockedByError.message}`);
      }

      setBlockStatus({
        isBlocked: Boolean(blockedByUser),
        isBlockedBy: Boolean(blockedByTarget),
        loading: false,
        error: null
      });

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

  const fetchStats = async () => {
    if (!userId) return;

    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Obtener reportes enviados
      const { data: submitted, error: submittedError } = await supabase
        .from('content_reports')
        .select('id')
        .eq('reporter_id', userId);

      if (submittedError) {
        throw new Error(`Error fetching submitted reports: ${submittedError.message}`);
      }

      // Obtener reportes resueltos
      const { data: resolved, error: resolvedError } = await supabase
        .from('content_reports')
        .select('id')
        .eq('reporter_id', userId)
        .eq('status', 'resolved');

      if (resolvedError) {
        throw new Error(`Error fetching resolved reports: ${resolvedError.message}`);
      }

      // Obtener cantidad de usuarios bloqueados
      const { data: blocked, error: blockedError } = await supabase
        .from('user_blocks')
        .select('id')
        .eq('blocker_id', userId);

      if (blockedError) {
        throw new Error(`Error fetching blocked users: ${blockedError.message}`);
      }

      setStats({
        reportsSubmitted: submitted?.length || 0,
        reportsResolved: resolved?.length || 0,
        blockedUsersCount: blocked?.length || 0,
        loading: false,
        error: null
      });

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
