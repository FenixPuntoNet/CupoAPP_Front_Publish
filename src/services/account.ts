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

// Obtener tarjeta del usuario actual
export const getUserCard = async (): Promise<UserCardResponse> => {
  try {
    const response = await apiRequest('/account/card', {
      method: 'GET'
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener la tarjeta'
    };
  }
};

// Obtener estadísticas de la cuenta
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

// Reclamar recompensa de meta
export const claimGoalReward = async (goalType: string, goalValue: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await apiRequest('/account/claim-goal', {
      method: 'POST',
      body: JSON.stringify({
        goal_type: goalType,
        goal_value: goalValue
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
