import { apiRequest } from '@/config/api';

export interface WalletData {
  id: string;
  user_id: string;
  balance: number;
  frozen_balance: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  transaction_type: string;
  amount: number;
  detail: string;
  status: string;
  created_at: string;
}

export interface WalletResponse {
  success: boolean;
  data?: WalletData;
  error?: string;
}

export interface WalletBalanceCheck {
  success: boolean;
  showModal?: boolean;
  message?: string;
  error?: string;
}

// Obtener wallet del usuario actual
export const getCurrentWallet = async (): Promise<WalletResponse> => {
  try {
    const response = await apiRequest('/wallet/info', {
      method: 'GET'
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener la wallet'
    };
  }
};

// Verificar y congelar balance para garantía de viaje
export const checkAndFreezeBalance = async (requiredAmount: number): Promise<WalletBalanceCheck> => {
  try {
    // Primero verificar el balance usando el endpoint del backend
    const response = await apiRequest('/wallet/balance', {
      method: 'GET'
    });

    if (response.success && response.data) {
      const availableBalance = (response.data.balance || 0) - (response.data.frozen_balance || 0);
      
      if (availableBalance >= requiredAmount) {
        return {
          success: true,
          message: `Se han congelado $${requiredAmount.toLocaleString()} de tu billetera como garantía para este viaje.`
        };
      } else {
        return {
          success: false,
          showModal: true,
          message: 'No tienes saldo suficiente en tu billetera para publicar este viaje. Por favor, recarga tu cuenta.'
        };
      }
    } else {
      throw new Error('Error al verificar balance');
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al verificar el balance'
    };
  }
};

// Obtener historial de transacciones
export const getWalletTransactions = async (): Promise<{ success: boolean; data?: WalletTransaction[]; error?: string }> => {
  try {
    const response = await apiRequest('/wallet/transactions', {
      method: 'GET'
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener transacciones'
    };
  }
};
