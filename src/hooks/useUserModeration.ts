import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface UserSuspension {
  id: number;
  reason: string;
  message: string;
  suspended_until: string | null;
  is_permanent: boolean;
  created_at: string | null;
}

interface UserWarning {
  id: number;
  reason: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  created_at: string | null;
  acknowledged_at: string | null;
}

export function useUserModeration(userId: string) {
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionInfo, setSuspensionInfo] = useState<UserSuspension | null>(null);
  const [warnings, setWarnings] = useState<UserWarning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const checkUserStatus = async () => {
      setLoading(true);
      
      try {
        // Verificar suspensiones activas
        const { data: suspensions, error: suspensionError } = await supabase
          .from('user_suspensions')
          .select('*')
          .eq('user_id', userId)
          .is('lifted_at', null)
          .or('is_permanent.eq.true,suspended_until.gt.now()')
          .order('created_at', { ascending: false })
          .limit(1);

        if (suspensionError) {
          console.error('Error checking suspension:', suspensionError);
        } else if (suspensions && suspensions.length > 0) {
          setIsSuspended(true);
          setSuspensionInfo(suspensions[0]);
        } else {
          setIsSuspended(false);
          setSuspensionInfo(null);
        }

        // Obtener advertencias no reconocidas
        const { data: userWarnings, error: warningsError } = await supabase
          .from('user_warnings')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (warningsError) {
          console.error('Error getting warnings:', warningsError);
        } else {
          setWarnings(userWarnings || []);
        }

      } catch (error) {
        console.error('Error checking user moderation status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserStatus();
  }, [userId]);

  const acknowledgeWarning = async (warningId: number) => {
    try {
      const { error } = await supabase
        .from('user_warnings')
        .update({ acknowledged_at: new Date().toISOString() })
        .eq('id', warningId);

      if (error) {
        console.error('Error acknowledging warning:', error);
        return false;
      }

      // Actualizar el estado local
      setWarnings(prev => 
        prev.map(warning => 
          warning.id === warningId 
            ? { ...warning, acknowledged_at: new Date().toISOString() }
            : warning
        )
      );

      return true;
    } catch (error) {
      console.error('Error acknowledging warning:', error);
      return false;
    }
  };

  const getUnacknowledgedWarnings = () => {
    return warnings.filter(warning => !warning.acknowledged_at);
  };

  const getSuspensionTimeRemaining = () => {
    if (!suspensionInfo || suspensionInfo.is_permanent) return null;
    if (!suspensionInfo.suspended_until) return null;

    const now = new Date();
    const suspendedUntil = new Date(suspensionInfo.suspended_until);
    const timeRemaining = suspendedUntil.getTime() - now.getTime();

    if (timeRemaining <= 0) return null;

    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days} día${days > 1 ? 's' : ''} ${hours} hora${hours > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hora${hours > 1 ? 's' : ''} ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else {
      return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
    }
  };

  return {
    isSuspended,
    suspensionInfo,
    warnings,
    loading,
    acknowledgeWarning,
    getUnacknowledgedWarnings,
    getSuspensionTimeRemaining
  };
}
