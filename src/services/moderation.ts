import { apiRequest } from '@/config/api';

// ==================== TIPOS ====================
export interface CreateReportRequest {
  contentType: 'message' | 'profile' | 'trip';
  contentId: number;
  reason: string;
  description?: string;
}

export interface BlockUserRequest {
  blockedUserId: string;
  reason?: string;
}

export interface CreateWarningRequest {
  userId: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  relatedContentType?: 'message' | 'profile' | 'trip';
  relatedContentId?: number;
}

export interface SuspendUserRequest {
  userId: string;
  reason: string;
  message: string;
  durationDays?: number;
  isPermanent?: boolean;
}

export interface Report {
  id: number;
  contentType: 'message' | 'profile' | 'trip';
  contentId: number;
  reason: string;
  description?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  reporterId: string;
  createdAt: string;
  updatedAt: string;
  resolutionAction?: string;
  resolutionNotes?: string;
  message?: string; // Mensaje del servidor
}

export interface ReportResponse {
  success: boolean;
  message?: string;
  reportId?: number;
  report?: Report;
}

export interface BlockedUser {
  id: string;
  name: string;
  photo: string;
  blockedAt: string;
  reason?: string;
}

export interface UserModerationStatus {
  isSuspended: boolean;
  warningLevel: number;
  suspensionInfo?: {
    reason: string;
    message: string;
    endsAt?: string;
    isPermanent: boolean;
  };
  activeWarnings: Array<{
    id: number;
    reason: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    acknowledged_at?: string;
    createdAt: string;
  }>;
}

export interface ModerationStats {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  dismissedReports: number;
  totalBlocks: number;
  activeBlocks: number;
  totalWarnings: number;
  activeSuspensions: number;
}

// ==================== SERVICIOS DE REPORTES ====================

export const createReport = async (data: CreateReportRequest): Promise<{ success: boolean; data?: ReportResponse; error?: string }> => {
  try {
    console.log('📝 Creating report:', data);
    
    // Validar datos antes de enviar
    if (!data.contentType || !data.contentId || !data.reason) {
      console.error('❌ Missing required fields:', { contentType: data.contentType, contentId: data.contentId, reason: data.reason });
      return {
        success: false,
        error: 'Faltan campos requeridos para crear el reporte'
      };
    }

    // Validar que contentId sea un número válido
    if (typeof data.contentId !== 'number' || data.contentId <= 0) {
      console.error('❌ Invalid contentId:', data.contentId);
      return {
        success: false,
        error: 'ID de contenido inválido'
      };
    }

    console.log('📤 Sending report request with validated data:', {
      contentType: data.contentType,
      contentId: data.contentId,
      reason: data.reason,
      description: data.description
    });
    
    const response = await apiRequest('/reports/create', {
      method: 'POST',
      body: JSON.stringify({
        contentType: data.contentType,
        contentId: data.contentId,
        reason: data.reason,
        description: data.description || undefined
      })
    });

    console.log('✅ Report created successfully:', response);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('❌ Failed to create report:', error);
    
    // Manejar diferentes tipos de errores
    if (error instanceof Error) {
      // Si es un error de la API, extraer el mensaje más específico
      const errorMessage = error.message;
      console.error('🔍 Detailed error analysis:', errorMessage);
      
      if (errorMessage.includes('500')) {
        return {
          success: false,
          error: 'Error interno del servidor. Verifica que el contenido que intentas reportar existe y es válido.'
        };
      } else if (errorMessage.includes('401')) {
        return {
          success: false,
          error: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
        };
      } else if (errorMessage.includes('400')) {
        return {
          success: false,
          error: 'Los datos del reporte no son válidos. Verifica el contenido e intenta nuevamente.'
        };
      } else if (errorMessage.includes('404')) {
        return {
          success: false,
          error: 'El contenido que intentas reportar no fue encontrado. Es posible que haya sido eliminado.'
        };
      } else if (errorMessage.includes('409')) {
        return {
          success: false,
          error: 'Ya has reportado este contenido anteriormente. No es necesario reportarlo nuevamente.'
        };
      } else if (errorMessage.includes('403')) {
        return {
          success: false,
          error: 'No tienes permisos para realizar esta acción.'
        };
      }
      return {
        success: false,
        error: errorMessage
      };
    }
    
    return {
      success: false,
      error: 'Error inesperado al crear el reporte'
    };
  }
};

export const getMyReports = async (): Promise<{ success: boolean; data?: Report[]; error?: string }> => {
  try {
    console.log('📊 Getting my reports...');
    
    const response = await apiRequest('/reports/my-reports', {
      method: 'GET'
    });

    console.log('✅ Reports fetched successfully:', response);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('❌ Failed to get reports:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener reportes'
    };
  }
};

// ==================== SERVICIOS DE BLOQUEO ====================

export const blockUser = async (blockedUserId: string, reason?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🚫 Blocking user:', { blockedUserId, reason });
    
    await apiRequest('/blocking/block', {
      method: 'POST',
      body: JSON.stringify({ blockedUserId, reason })
    });

    console.log('✅ User blocked successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to block user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al bloquear usuario'
    };
  }
};

export const unblockUser = async (blockedUserId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('✅ Unblocking user:', blockedUserId);
    
    await apiRequest(`/blocking/unblock/${blockedUserId}`, {
      method: 'DELETE'
    });

    console.log('✅ User unblocked successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to unblock user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al desbloquear usuario'
    };
  }
};

export const getBlockedUsers = async (limit = 50, offset = 0): Promise<{ success: boolean; data?: BlockedUser[]; error?: string }> => {
  try {
    console.log('📊 Getting blocked users...');
    
    const response = await apiRequest(`/blocking/my-blocks?limit=${limit}&offset=${offset}`, {
      method: 'GET'
    });

    console.log('✅ Blocked users fetched successfully:', response);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('❌ Failed to get blocked users:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener usuarios bloqueados'
    };
  }
};

export const checkIfUserBlocked = async (userId: string): Promise<{ success: boolean; isBlocked?: boolean; error?: string }> => {
  try {
    console.log('🔍 Checking if user is blocked:', userId);
    
    const response = await apiRequest(`/blocking/check/${userId}`, {
      method: 'GET'
    });

    console.log('✅ User block status checked:', response);
    return {
      success: true,
      isBlocked: response.isBlocked
    };
  } catch (error) {
    console.error('❌ Failed to check user block status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al verificar estado de bloqueo'
    };
  }
};

// ==================== SERVICIOS DE MODERACIÓN ====================

export const getUserModerationStatus = async (userId: string): Promise<{ success: boolean; data?: UserModerationStatus; error?: string }> => {
  try {
    console.log('📊 Getting user moderation status:', userId);
    
    const response = await apiRequest(`/moderation/user/status?userId=${userId}`, {
      method: 'GET'
    });

    console.log('✅ User moderation status fetched:', response);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('❌ Failed to get user moderation status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener estado de moderación'
    };
  }
};

export const acknowledgeWarning = async (warningId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('✅ Acknowledging warning:', warningId);
    
    await apiRequest(`/moderation/warning/${warningId}/acknowledge`, {
      method: 'POST'
    });

    console.log('✅ Warning acknowledged successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to acknowledge warning:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al reconocer advertencia'
    };
  }
};

// ==================== SERVICIOS DE ADMINISTRACIÓN ====================

export const getModerationStats = async (): Promise<{ success: boolean; data?: ModerationStats; error?: string }> => {
  try {
    console.log('📊 Getting moderation stats...');
    
    const response = await apiRequest('/moderation/admin/stats', {
      method: 'GET'
    });

    console.log('✅ Moderation stats fetched:', response);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('❌ Failed to get moderation stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener estadísticas'
    };
  }
};

export const getReportsStats = async (): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    console.log('📊 Getting reports stats...');
    
    const response = await apiRequest('/reports/admin/stats', {
      method: 'GET'
    });

    console.log('✅ Reports stats fetched:', response);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('❌ Failed to get reports stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener estadísticas de reportes'
    };
  }
};
