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
    console.log('🪙 Fetching balance from backend...');
    const data = await apiRequest('/change/balance', {
      method: 'GET'
    });

    console.log('✅ Balance response:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Error in getBalance:', error);
    return { 
      success: false, 
      error: error.message || 'Error de conexión al obtener balance' 
    };
  }
}

// Obtener items disponibles para canje
export async function getRedeemItems(): Promise<{ success: boolean; data?: RedeemItemsResponse; error?: string }> {
  try {
    console.log('🛍️ Fetching redeem items from backend...');
    const data = await apiRequest('/change/items', {
      method: 'GET'
    });

    console.log('✅ Redeem items response:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Error in getRedeemItems:', error);
    return { 
      success: false, 
      error: error.message || 'Error de conexión al obtener items' 
    };
  }
}

// Solicitar canje de productos
export async function redeemItems(request: RedeemRequest): Promise<{ success: boolean; data?: RedeemResponse; error?: string }> {
  try {
    console.log('🛒 Requesting redeem from backend...', request);
    const data = await apiRequest('/change/redeem', {
      method: 'POST',
      body: JSON.stringify(request)
    });

    console.log('✅ Redeem response:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Error in redeemItems:', error);
    return { 
      success: false, 
      error: error.message || 'Error de conexión al solicitar canje' 
    };
  }
}

// Obtener historial de solicitudes de canje del usuario
export async function getRedeemHistory(): Promise<{ success: boolean; data?: RedeemHistoryResponse; error?: string }> {
  try {
    console.log('📋 Fetching redeem history from backend...');
    const data = await apiRequest('/change/history', {
      method: 'GET'
    });

    console.log('✅ Redeem history response:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Error in getRedeemHistory:', error);
    return { 
      success: false, 
      error: error.message || 'Error de conexión al obtener historial' 
    };
  }
}

// Obtener logros disponibles
export async function getGoals(): Promise<{ success: boolean; data?: GoalsResponse; error?: string }> {
  try {
    console.log('🎯 Fetching goals from backend...');
    const data = await apiRequest('/change/goals', {
      method: 'GET'
    });

    console.log('✅ Goals response:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Error in getGoals:', error);
    return { 
      success: false, 
      error: error.message || 'Error de conexión al obtener objetivos' 
    };
  }
}

// Reclamar objetivo completado
export async function claimGoal(goalId: number): Promise<{ success: boolean; data?: ClaimGoalResponse; error?: string }> {
  try {
    console.log('🎯 Claiming goal from backend...', goalId);
    const data = await apiRequest(`/change/claim-goal/${goalId}`, {
      method: 'POST'
    });

    console.log('✅ Claim goal response:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Error in claimGoal:', error);
    return { 
      success: false, 
      error: error.message || 'Error de conexión al reclamar objetivo' 
    };
  }
}
