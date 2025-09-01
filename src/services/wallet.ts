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
    console.log('🔄 WALLET DEBUG: Fetching wallet info from /wallet/info...');
    const response = await apiRequest('/wallet/info', {
      method: 'GET'
    });

    console.log('💰 WALLET DEBUG: Raw backend response structure:', {
      response_keys: Object.keys(response || {}),
      full_response: response,
      has_data_property: 'data' in (response || {}),
      response_type: typeof response
    });
    
    // Verificar múltiples posibles estructuras de respuesta del backend
    let balance = 0;
    let frozenBalance = 0;
    let walletId = '0';
    let userId = '';
    let createdAt = new Date().toISOString();
    let updatedAt = new Date().toISOString();

    // Caso 1: Respuesta directa (response.balance, response.frozen_balance)
    if (response && typeof response.balance === 'number') {
      console.log('💰 WALLET DEBUG: Using direct response structure');
      balance = Number(response.balance);
      frozenBalance = Number(response.frozen_balance || 0);
      walletId = String(response.id || response.wallet_id || '0');
      userId = String(response.user_id || '');
      createdAt = response.created_at || createdAt;
      updatedAt = response.updated_at || updatedAt;
    }
    // Caso 2: Respuesta anidada (response.data.balance)
    else if (response?.data && typeof response.data.balance === 'number') {
      console.log('💰 WALLET DEBUG: Using nested data structure');
      balance = Number(response.data.balance);
      frozenBalance = Number(response.data.frozen_balance || 0);
      walletId = String(response.data.id || response.data.wallet_id || '0');
      userId = String(response.data.user_id || '');
      createdAt = response.data.created_at || createdAt;
      updatedAt = response.data.updated_at || updatedAt;
    }
    // Caso 3: Respuesta con wrapper success
    else if (response?.success && response.data) {
      console.log('💰 WALLET DEBUG: Using success wrapper structure');
      balance = Number(response.data.balance || 0);
      frozenBalance = Number(response.data.frozen_balance || 0);
      walletId = String(response.data.id || response.data.wallet_id || '0');
      userId = String(response.data.user_id || '');
      createdAt = response.data.created_at || createdAt;
      updatedAt = response.data.updated_at || updatedAt;
    }
    // Caso 4: Fallback - buscar en cualquier nivel
    else {
      console.log('💰 WALLET DEBUG: Using fallback parsing');
      const flatData = response?.data || response || {};
      balance = Number(flatData.balance || flatData.total_balance || flatData.current_balance || 0);
      frozenBalance = Number(flatData.frozen_balance || flatData.frozen || flatData.locked_balance || 0);
      walletId = String(flatData.id || flatData.wallet_id || flatData.user_wallet_id || '0');
      userId = String(flatData.user_id || '');
    }
    
    const walletData = {
      id: walletId,
      user_id: userId,
      balance: balance,
      frozen_balance: frozenBalance,
      created_at: createdAt,
      updated_at: updatedAt
    };

    console.log('💰 WALLET DEBUG: Final processed wallet data:', {
      original_balance: balance,
      original_frozen: frozenBalance,
      available_balance: Math.max(0, balance - frozenBalance),
      wallet_id: walletId,
      user_id: userId,
      processing_successful: true
    });

    return {
      success: true,
      data: walletData
    };
  } catch (error) {
    console.error('❌ WALLET DEBUG: Error fetching wallet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener la wallet'
    };
  }
};

// Verificar balance disponible para garantía de viaje (el congelamiento lo hace el backend automáticamente al publicar)
export const checkAndFreezeBalance = async (requiredAmount: number): Promise<WalletBalanceCheck> => {
  try {
    console.log(`🔄 BALANCE CHECK: Verificando balance disponible de $${requiredAmount.toLocaleString()}...`);
    
    // Usar la misma función getCurrentWallet para consistencia
    const walletResponse = await getCurrentWallet();
    
    if (!walletResponse.success || !walletResponse.data) {
      throw new Error(walletResponse.error || 'Error al obtener información de la wallet');
    }

    const { balance, frozen_balance } = walletResponse.data;
    const availableBalance = Math.max(0, balance - frozen_balance); // Evitar negativos
    
    console.log(`💰 BALANCE CHECK: Información de saldo:`, {
      total_balance: balance,
      frozen_balance: frozen_balance,
      available_balance: availableBalance,
      required_amount: requiredAmount,
      is_sufficient: availableBalance >= requiredAmount,
      deficit: Math.max(0, requiredAmount - availableBalance)
    });
    
    // Advertencia si hay balance congelado alto
    if (frozen_balance > balance) {
      console.warn(`⚠️ BALANCE CHECK: ADVERTENCIA: Balance congelado ($${frozen_balance.toLocaleString()}) es mayor que el balance total ($${balance.toLocaleString()}). Esto puede indicar un problema con transacciones pendientes.`);
    }
    
    if (availableBalance >= requiredAmount) {
      console.log('✅ BALANCE CHECK: Balance suficiente - el congelamiento se hará automáticamente al publicar el viaje');
      
      return {
        success: true,
        message: `Tienes saldo suficiente. Se congelarán $${requiredAmount.toLocaleString()} automáticamente al publicar el viaje.`
      };
    } else {
      console.log(`❌ BALANCE CHECK: Balance insuficiente. Disponible: $${availableBalance.toLocaleString()}, Requerido: $${requiredAmount.toLocaleString()}, Faltante: $${(requiredAmount - availableBalance).toLocaleString()}`);
      
      return {
        success: false,
        showModal: true,
        message: `No tienes saldo suficiente en tu billetera para publicar este viaje. Necesitas $${(requiredAmount - availableBalance).toLocaleString()} adicionales.`
      };
    }
  } catch (error) {
    console.error('❌ BALANCE CHECK: Error checking balance:', error);
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
