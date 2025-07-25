import { apiRequest } from '@/config/api';

export interface BalanceResponse {
  balance: number;
}

export interface RedeemItem {
  id: number;
  name: string;
  description: string;
  image_url: string | null;
  value_unicoins: number;
  is_active: boolean;
  created_at: string;
}

export interface RedeemItemsResponse {
  items: RedeemItem[];
}

export interface RedeemRequestItem {
  item_id: number;
  quantity: number;
}

export interface RedeemRequest {
  items: RedeemRequestItem[];
}

export interface RedeemResponse {
  success: boolean;
  message: string;
  total_cost: number;
  new_balance: number;
  items_requested: number;
}

export interface RedeemHistoryItem {
  id: number;
  user_id: string;
  item_id: number;
  status: string;
  requested_at: string;
  delivered_at: string | null;
  redeem_items: RedeemItem;
}

export interface RedeemHistoryResponse {
  requests: RedeemHistoryItem[];
}

export interface Goal {
  id: number;
  title: string;
  description: string;
  reward_unicoins: number;
  is_active: boolean;
  claimed: boolean;
}

export interface GoalsResponse {
  goals: Goal[];
}

export interface ClaimGoalResponse {
  success: boolean;
  message: string;
  new_balance: number;
}

// Obtener balance de UniCoins del usuario
export async function getBalance(): Promise<{ success: boolean; data?: BalanceResponse; error?: string }> {
  try {
    const response = await apiRequest('/change/balance', {
      method: 'GET'
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || 'Error al obtener balance' 
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error in getBalance:', error);
    return { 
      success: false, 
      error: 'Error de conexión al obtener balance' 
    };
  }
}

// Obtener items disponibles para canje
export async function getRedeemItems(): Promise<{ success: boolean; data?: RedeemItemsResponse; error?: string }> {
  try {
    const response = await apiRequest('/change/items', {
      method: 'GET'
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || 'Error al obtener items' 
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error in getRedeemItems:', error);
    return { 
      success: false, 
      error: 'Error de conexión al obtener items' 
    };
  }
}

// Solicitar canje de productos
export async function redeemItems(request: RedeemRequest): Promise<{ success: boolean; data?: RedeemResponse; error?: string }> {
  try {
    const response = await apiRequest('/change/redeem', {
      method: 'POST',
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || 'Error al solicitar canje' 
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error in redeemItems:', error);
    return { 
      success: false, 
      error: 'Error de conexión al solicitar canje' 
    };
  }
}

// Obtener historial de solicitudes de canje del usuario
export async function getRedeemHistory(): Promise<{ success: boolean; data?: RedeemHistoryResponse; error?: string }> {
  try {
    const response = await apiRequest('/change/history', {
      method: 'GET'
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || 'Error al obtener historial' 
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error in getRedeemHistory:', error);
    return { 
      success: false, 
      error: 'Error de conexión al obtener historial' 
    };
  }
}

// Obtener logros disponibles
export async function getGoals(): Promise<{ success: boolean; data?: GoalsResponse; error?: string }> {
  try {
    const response = await apiRequest('/change/goals', {
      method: 'GET'
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || 'Error al obtener objetivos' 
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error in getGoals:', error);
    return { 
      success: false, 
      error: 'Error de conexión al obtener objetivos' 
    };
  }
}

// Reclamar objetivo completado
export async function claimGoal(goalId: number): Promise<{ success: boolean; data?: ClaimGoalResponse; error?: string }> {
  try {
    const response = await apiRequest(`/change/claim-goal/${goalId}`, {
      method: 'POST'
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || 'Error al reclamar objetivo' 
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error in claimGoal:', error);
    return { 
      success: false, 
      error: 'Error de conexión al reclamar objetivo' 
    };
  }
}
