export interface ContentModerationResult {
  isClean: boolean;
  recommendation: 'allow' | 'review' | 'block';
  isAllowed?: boolean;
  reason?: string;
  filteredContent?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cupo.site';

// Función para obtener el token de autenticación del localStorage
const getAuthToken = (): string | null => {
  try {
    const token = localStorage.getItem('sb-mqwvbnktcokcccidfgcu-auth-token');
    return token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Moderar contenido usando el backend
export async function moderateContent(content: string): Promise<ContentModerationResult> {
  try {
    const token = getAuthToken();
    if (!token) {
      // Si no hay token, permitir el contenido pero con advertencia
      console.warn('⚠️ No auth token found for content moderation, allowing content');
      return {
        isClean: true,
        recommendation: 'allow',
        isAllowed: true
      };
    }

    const response = await fetch(`${API_BASE_URL}/content-moderation/moderate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      console.error('❌ Content moderation API error:', response.status);
      // En caso de error del servidor, permitir el contenido
      return {
        isClean: true,
        recommendation: 'allow',
        isAllowed: true
      };
    }

    const result = await response.json();
    console.log('🛡️ Content moderation result:', result);

    // El backend retorna la estructura correcta
    return {
      isClean: result.moderation?.isClean || false,
      recommendation: result.moderation?.recommendation || 'allow',
      isAllowed: result.moderation?.recommendation === 'allow',
      reason: result.moderation?.recommendation !== 'allow' ? 'Contenido inapropiado detectado' : undefined,
      filteredContent: result.moderation?.filteredContent || content
    };

  } catch (error) {
    console.error('❌ Error moderating content:', error);
    // En caso de error, permitir el contenido para no bloquear la funcionalidad
    return {
      isClean: true,
      recommendation: 'allow',
      isAllowed: true
    };
  }
}

// Reportar contenido usando el backend
export async function reportContent(
  contentType: 'message' | 'profile' | 'trip',
  contentId: number,
  reason: string,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'No hay sesión activa' };
    }

    const response = await fetch(`${API_BASE_URL}/content-moderation/report`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contentType,
        contentId,
        reason,
        description
      })
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return { success: result.success, error: result.error };

  } catch (error) {
    console.error('❌ Error reporting content:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado al reportar contenido' 
    };
  }
}

// Bloquear usuario usando el backend
export async function blockUser(
  blockedId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'No hay sesión activa' };
    }

    const response = await fetch(`${API_BASE_URL}/content-moderation/block-user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        blockedUserId: blockedId,
        reason
      })
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return { success: result.success, error: result.error };

  } catch (error) {
    console.error('❌ Error blocking user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado al bloquear usuario' 
    };
  }
}

// Verificar si usuario está bloqueado
export async function isUserBlocked(
  checkAgainstId: string
): Promise<boolean> {
  try {
    const token = getAuthToken();
    if (!token) {
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/content-moderation/is-blocked/${checkAgainstId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.isBlocked || false;

  } catch (error) {
    console.error('❌ Error checking if user is blocked:', error);
    return false;
  }
}

// Obtener usuarios bloqueados
export async function getBlockedUsers(): Promise<string[]> {
  try {
    const token = getAuthToken();
    if (!token) {
      return [];
    }

    const response = await fetch(`${API_BASE_URL}/content-moderation/blocked-users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return [];
    }

    const result = await response.json();
    return result.blockedUsers || [];

  } catch (error) {
    console.error('❌ Error getting blocked users:', error);
    return [];
  }
}

// Desbloquear usuario
export async function unblockUser(
  blockedId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'No hay sesión activa' };
    }

    const response = await fetch(`${API_BASE_URL}/content-moderation/unblock/${blockedId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return { success: result.success, error: result.error };

  } catch (error) {
    console.error('❌ Error unblocking user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado al desbloquear usuario' 
    };
  }
}

// Las siguientes funciones de admin requieren permisos especiales
export async function getPendingReports(): Promise<any[]> {
  try {
    const token = getAuthToken();
    if (!token) {
      return [];
    }

    const response = await fetch(`${API_BASE_URL}/reports/admin/list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return [];
    }

    const result = await response.json();
    return result.reports || [];

  } catch (error) {
    console.error('❌ Error getting pending reports:', error);
    return [];
  }
}

export async function resolveReport(
  reportId: number,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'No hay sesión activa' };
    }

    const response = await fetch(`${API_BASE_URL}/reports/admin/${reportId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'resolved',
        notes
      })
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return { success: result.success, error: result.error };

  } catch (error) {
    console.error('❌ Error resolving report:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado al resolver reporte' 
    };
  }
}
