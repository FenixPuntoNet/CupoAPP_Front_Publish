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
    console.log('🔄 Fetching wallet info...');
    const response = await apiRequest('/wallet/info', {
      method: 'GET'
    });

    console.log('💰 Raw wallet response:', response);
    
    // Mapear la respuesta del backend al formato esperado
    const walletData = {
      id: String(response.id || response.data?.id || '0'),
      user_id: response.user_id || response.data?.user_id || '',
      balance: Number(response.balance || response.data?.balance || 0),
      frozen_balance: Number(response.frozen_balance || response.data?.frozen_balance || 0),
      created_at: response.created_at || response.data?.created_at || new Date().toISOString(),
      updated_at: response.updated_at || response.data?.updated_at || new Date().toISOString()
    };

    console.log('💰 Mapped wallet data:', walletData);

    return {
      success: true,
      data: walletData
    };
  } catch (error) {
    console.error('❌ Error fetching wallet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener la wallet'
    };
  }
};

// Verificar balance disponible para garantía de viaje (el congelamiento lo hace el backend automáticamente al publicar)
export const checkAndFreezeBalance = async (requiredAmount: number): Promise<WalletBalanceCheck> => {
  try {
    console.log(`🔄 Verificando balance disponible de $${requiredAmount.toLocaleString()}...`);
    
    // Solo verificar el balance - el congelamiento lo hace el backend automáticamente al publicar el viaje
    const balanceResponse = await apiRequest('/wallet/balance', {
      method: 'GET'
    });

    if (balanceResponse && (balanceResponse.balance !== undefined || balanceResponse.data?.balance !== undefined)) {
      const balance = balanceResponse.balance || balanceResponse.data?.balance || 0;
      const frozenBalance = balanceResponse.frozen_balance || balanceResponse.data?.frozen_balance || 0;
      const availableBalance = balance - frozenBalance;
      
      console.log(`💰 Balance verificado: disponible=$${availableBalance.toLocaleString()}, requerido=$${requiredAmount.toLocaleString()}`);
      
      if (availableBalance >= requiredAmount) {
        console.log('✅ Balance suficiente - el congelamiento se hará automáticamente al publicar el viaje');
        
        return {
          success: true,
          message: `Tienes saldo suficiente. Se congelarán $${requiredAmount.toLocaleString()} automáticamente al publicar el viaje.`
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
    console.error('❌ Error checking balance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al verificar el balance'
    };
  }
};

// Obtener historial de transacciones
export const getWalletTransactions = async (): Promise<{ success: boolean; data?: WalletTransaction[]; error?: string }> => {
  try {
    console.log('🔄 Fetching wallet transactions...');
    const response = await apiRequest('/wallet/transactions', {
      method: 'GET'
    });

    console.log('💳 Raw transactions response:', response);

    // Mapear las transacciones del backend al formato esperado
    const transactions = response.transactions || response.data?.transactions || response.data || [];
    
    console.log('💳 Transactions array:', transactions);
    
    const mappedTransactions: WalletTransaction[] = transactions.map((tx: any) => ({
      id: String(tx.id),
      wallet_id: String(tx.wallet_id),
      transaction_type: tx.transaction_type || 'other',
      amount: Number(tx.amount || 0),
      detail: tx.detail || tx.description || 'Sin descripción',
      status: tx.status || 'pending',
      created_at: tx.created_at || tx.transaction_date || new Date().toISOString()
    }));

    console.log('💳 Mapped transactions:', mappedTransactions);

    return {
      success: true,
      data: mappedTransactions
    };
  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener transacciones'
    };
  }
};
