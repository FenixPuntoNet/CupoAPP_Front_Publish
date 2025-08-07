import { useState, useEffect, useCallback } from 'react';
import { 
  getUserModerationStatus, 
  acknowledgeWarning as acknowledgeWarningService,
  UserModerationStatus 
} from '@/services/moderation';

export function useUserModeration(userId: string) {
  const [moderationData, setModerationData] = useState<UserModerationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModerationStatus = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching moderation status for user:', userId);
      const result = await getUserModerationStatus(userId);
      
      if (result.success && result.data) {
        console.log('✅ Moderation status fetched:', result.data);
        setModerationData(result.data);
      } else {
        console.error('❌ Failed to fetch moderation status:', result.error);
        setError(result.error || 'Error al obtener estado de moderación');
      }
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const acknowledgeWarning = useCallback(async (warningId: number): Promise<boolean> => {
    try {
      console.log('✅ Acknowledging warning:', warningId);
      const result = await acknowledgeWarningService(warningId);
      
      if (result.success) {
        console.log('✅ Warning acknowledged successfully');
        // Refrescar datos después de reconocer advertencia
        await fetchModerationStatus();
        return true;
      } else {
        console.error('❌ Failed to acknowledge warning:', result.error);
        setError(result.error || 'Error al reconocer advertencia');
        return false;
      }
    } catch (err) {
      console.error('❌ Unexpected error acknowledging warning:', err);
      setError(err instanceof Error ? err.message : 'Error inesperado');
      return false;
    }
  }, [fetchModerationStatus]);

  const getUnacknowledgedWarnings = useCallback(() => {
    if (!moderationData?.activeWarnings) return [];
    return moderationData.activeWarnings.filter(warning => !warning.acknowledged_at);
  }, [moderationData]);

  const getSuspensionTimeRemaining = useCallback(() => {
    if (!moderationData?.isSuspended || !moderationData.suspensionInfo?.endsAt) {
      return null;
    }

    if (moderationData.suspensionInfo.isPermanent) return null;

    const endDate = new Date(moderationData.suspensionInfo.endsAt);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days} día${days > 1 ? 's' : ''} ${hours} hora${hours > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hora${hours > 1 ? 's' : ''} ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else {
      return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
    }
  }, [moderationData]);

  useEffect(() => {
    fetchModerationStatus();
  }, [fetchModerationStatus]);

  return {
    isSuspended: moderationData?.isSuspended || false,
    warningLevel: moderationData?.warningLevel || 0,
    suspensionInfo: moderationData?.suspensionInfo,
    activeWarnings: moderationData?.activeWarnings || [],
    loading,
    error,
    acknowledgeWarning,
    refetch: fetchModerationStatus,
    getUnacknowledgedWarnings,
    getSuspensionTimeRemaining
  };
}
