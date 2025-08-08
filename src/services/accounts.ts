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
    console.log('🔍 Making request to: /account-management/can-deactivate');
    
    const response = await apiRequest('/account-management/can-deactivate', {
      method: 'GET'
    });

    console.log('✅ Eligibility check response received:', response);
    
    // El backend siempre permite las acciones, solo da información
    return { 
      success: true, 
      data: response 
    };
  } catch (error) {
    console.error('❌ Failed to check eligibility - detailed error:', error);
    
    if (error instanceof Error) {
      console.error('❌ Error constructor:', error.constructor.name);
      
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        return {
          success: false,
          error: 'El servicio de gestión de cuentas no está disponible. Contacta soporte.'
        };
      }
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return {
          success: false,
          error: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
        };
      }
      
      if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        return {
          success: false,
          error: 'Error temporal del servidor. Intenta de nuevo en unos minutos.'
        };
      }
    }
    
    return {
      success: false,
      error: 'Error de conexión. Verifica tu internet e intenta nuevamente.'
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
      message: response.message || 'Cuenta desactivada exitosamente'
    };
  } catch (error) {
    console.error('❌ Failed to deactivate account:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        return {
          success: false,
          error: 'Tu sesión ha expirado. Inicia sesión e intenta nuevamente.'
        };
      }
      
      if (error.message.includes('404')) {
        return {
          success: false,
          error: 'Servicio no disponible. Contacta soporte.'
        };
      }
      
      if (error.message.includes('500')) {
        return {
          success: false,
          error: 'Error temporal del servidor. Intenta de nuevo en unos minutos.'
        };
      }
    }
    
    return {
      success: false,
      error: 'Error de conexión. Verifica tu internet e intenta nuevamente.'
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
      message: response.message || 'Cuenta eliminada exitosamente'
    };
  } catch (error) {
    console.error('❌ Failed to delete account:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        return {
          success: false,
          error: 'Tu sesión ha expirado. Inicia sesión e intenta nuevamente.'
        };
      }
      
      if (error.message.includes('404')) {
        return {
          success: false,
          error: 'Servicio no disponible. Contacta soporte.'
        };
      }
      
      if (error.message.includes('500')) {
        return {
          success: false,
          error: 'Error temporal del servidor. Intenta de nuevo en unos minutos.'
        };
      }
    }
    
    return {
      success: false,
      error: 'Error de conexión. Verifica tu internet e intenta nuevamente.'
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
