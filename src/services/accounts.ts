import { apiRequest } from '@/config/api';

// ==================== TIPOS ACTUALIZADOS ====================
export interface DeactivateAccountRequest {
  reason?: string;
}

export interface RecoverAccountRequest {
  // Ya no necesita email/password, usa el token JWT
}

export interface DeleteAccountRequest {
  confirmation: string;
  reason?: string;
}

export interface AccountStatusResponse {
  user_id: string;
  account_status: 'active' | 'deactivated' | 'deleted' | 'suspended';
  last_updated: string;
  user_name: string;
  is_active: boolean;
  can_recover: boolean;
}

export interface EligibilityResponse {
  can_deactivate_temporary: boolean;
  can_delete_permanent: boolean;
  current_status: string;
  user_name: string;
  active_trips: number;
  active_bookings: number;
  warnings: string[];
  recommendations: string[];
}

// ==================== SERVICIOS ACTUALIZADOS ====================

// Verificar elegibilidad para desactivar cuenta
export const checkDeactivationEligibility = async (): Promise<{ success: boolean; data?: EligibilityResponse; error?: string }> => {
  try {
    console.log('🔍 Checking deactivation eligibility...');
    
    const response = await apiRequest('/account-management/can-deactivate', {
      method: 'GET'
    });

    console.log('✅ Eligibility check completed:', response);
    return { 
      success: true, 
      data: response 
    };
  } catch (error) {
    console.error('❌ Failed to check eligibility:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al verificar elegibilidad'
    };
  }
};

// Desactivar cuenta temporalmente
export const deactivateAccount = async (data: DeactivateAccountRequest): Promise<{ success: boolean; error?: string; message?: string }> => {
  try {
    console.log('⏸️ Deactivating account:', data);
    
    const response = await apiRequest('/account-management/deactivate', {
      method: 'POST',
      body: JSON.stringify({
        reason: data.reason,
        isPermanent: false
      })
    });

    console.log('✅ Account deactivated successfully:', response);
    return { 
      success: true, 
      message: response.message 
    };
  } catch (error) {
    console.error('❌ Failed to deactivate account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al desactivar cuenta'
    };
  }
};

// Eliminar cuenta permanentemente
export const deleteAccount = async (data: DeleteAccountRequest): Promise<{ success: boolean; error?: string; message?: string }> => {
  try {
    console.log('🗑️ Deleting account permanently:', { confirmation: data.confirmation, reason: data.reason });
    
    const response = await apiRequest('/account-management/deactivate', {
      method: 'POST',
      body: JSON.stringify({
        reason: data.reason,
        isPermanent: true
      })
    });

    console.log('✅ Account deletion initiated:', response);
    return { 
      success: true, 
      message: response.message 
    };
  } catch (error) {
    console.error('❌ Failed to delete account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al eliminar cuenta'
    };
  }
};

// Recuperar cuenta desactivada
export const recoverAccount = async (): Promise<{ success: boolean; error?: string; message?: string; user?: any }> => {
  try {
    console.log('♻️ Recovering deactivated account...');
    
    const response = await apiRequest('/account-management/recover', {
      method: 'POST',
      body: JSON.stringify({})
    });

    console.log('✅ Account recovered successfully:', response);
    return { 
      success: true, 
      message: response.message,
      user: response.user 
    };
  } catch (error) {
    console.error('❌ Failed to recover account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al recuperar cuenta'
    };
  }
};

// Obtener estado de cuenta (sin cambios)
export const getAccountStatus = async (): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    console.log('🔍 Checking current account status...');
    
    const response = await apiRequest('/account-management/status', {
      method: 'GET'
    });

    console.log('✅ Account status checked:', response);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('❌ Failed to check account status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al verificar estado de cuenta'
    };
  }
};
