import { apiRequest } from '@/config/api';

export interface UserCard {
  id: string;
  user_id: string;
  card_number: string;
  level: string;
  unicoins: number;
  experience_points: number;
  streak_days: number;
  created_at: string;
  updated_at: string;
}

export interface AccountStats {
  referrals: number;
  passenger_trips: number;
  driver_trips: number;
  co2_saved: number;
}

export interface UserCardResponse {
  success: boolean;
  data?: UserCard;
  error?: string;
}

export interface AccountStatsResponse {
  success: boolean;
  data?: AccountStats;
  error?: string;
}

export interface GoalDefinition {
  id: number;
  type: 'referral' | 'streak_total' | 'streak_passenger' | 'streak_driver';
  name: string;
  goal: number;
  reward_unicoins: number;
  is_active: boolean;
}

export interface GoalClaim {
  goal_id: number;
  claimed_at: string;
}

export interface GoalDefinitionsResponse {
  success: boolean;
  data?: GoalDefinition[];
  error?: string;
}

export interface GoalClaimsResponse {
  success: boolean;
  data?: GoalClaim[];
  error?: string;
}

// Obtener información de la tarjeta del usuario usando el nuevo endpoint
export const getUserCard = async (): Promise<UserCardResponse> => {
  try {
    const response = await apiRequest('/account/user-card', {
      method: 'GET'
    });

    return {
      success: true,
      data: {
        id: response.data.id,
        user_id: response.data.user_id,
        card_number: response.data.card_code, // Mapear card_code a card_number
        level: 'BRONZE', // Default level
        unicoins: response.data.unicoins,
        experience_points: 0,
        streak_days: 0,
        created_at: response.data.created_at,
        updated_at: response.data.created_at
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener la tarjeta'
    };
  }
};

// Obtener estadísticas de la cuenta usando el nuevo endpoint
export const getAccountStats = async (): Promise<AccountStatsResponse> => {
  try {
    const response = await apiRequest('/account/stats', {
      method: 'GET'
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener estadísticas'
    };
  }
};

// Reclamar recompensa de meta usando el nuevo endpoint
export const claimGoalReward = async (_goalType: string, goalId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    // Usar el endpoint correcto para claims de goals
    const response = await apiRequest('/account/claim-goal', {
      method: 'POST',
      body: JSON.stringify({
        goal_id: goalId
      })
    });

    if (!response.success) {
      throw new Error(response.error || 'Error al reclamar recompensa');
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al reclamar recompensa'
    };
  }
};

// Obtener definiciones de metas disponibles
export const getGoalDefinitions = async (): Promise<GoalDefinitionsResponse> => {
  try {
    const response = await apiRequest('/account/goal-definitions', {
      method: 'GET'
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener definiciones de metas'
    };
  }
};

// Obtener reclamos de metas del usuario
export const getGoalClaims = async (): Promise<GoalClaimsResponse> => {
  try {
    const response = await apiRequest('/account/goal-claims', {
      method: 'GET'
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener reclamos de metas'
    };
  }
};
