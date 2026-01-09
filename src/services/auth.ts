import { apiRequest } from '@/config/api';

export interface LoginRequest {
  email: string;
  password: string;  
}

export interface SignupRequest {
  email: string;
  password: string;
  full_name: string;
  terms_accepted: boolean;
  email_subscribed: boolean;
  verification_terms?: string;
  suscriptions?: string;
  device_token: string
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    username: string;
    status: string
  };
  token?: string;
  access_token?: string; // Added to match backend response
  error?: string;
  message?: string;
}

// Login usando el backend
export const loginUser = async (credentials: LoginRequest, device_token: string): Promise<AuthResponse> => {
  try {    

    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ ...credentials, device_token } )
    });

    if (response.success && response.user) {
      console.log('✅ Login successful, user data:', response.user);
      
      // Si el backend devuelve un token, guardarlo
      if (response.access_token) {
        // Importar las funciones desde api.ts
        const { setAuthToken } = await import('@/config/api');
        setAuthToken(response.access_token);
        console.log('🔑 Auth token saved from login response');
      } else {
        console.warn('⚠️ No access_token in login response');
      }
      
      return {
        success: true,
        user: response.user,
        token: response.access_token,
        access_token: response.access_token // Pass through as received from backend
      };
    }

    return {
      success: false,
      error: response.error || 'Error en el login'
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión'
    };
  }
};

// Registro usando el backend
export const registerUser = async (userData: SignupRequest): Promise<AuthResponse> => {
  try {
    console.log('🚀 Starting registration process...');

    console.log('DATA DEL USUARIO PARA REGISTRO: ', userData);
    
    const response = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    if (response.success) {
      console.log('✅ Registration successful, now attempting auto-login...');
      
      // ✅ AUTO-LOGIN: Después del registro exitoso, automáticamente hacer login
      try {
        console.log('🔄 Performing auto-login with credentials...');
        
        // Hacer login directo con las credenciales
        const loginResponse = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: userData.email,
            password: userData.password
          })
        });

        if (loginResponse.success && loginResponse.access_token && loginResponse.user) {
          console.log('✅ Auto-login successful');
          
          // Guardar el token automáticamente (ya se hace en apiRequest)
          // El token ya se guardó en apiRequest para /auth/login
          
          return {
            success: true,
            user: loginResponse.user,
            token: loginResponse.access_token,
            access_token: loginResponse.access_token,
            message: 'Usuario registrado y logueado exitosamente'
          };
        } else {
          console.warn('⚠️ Auto-login response invalid:', loginResponse);
          // Si falla el auto-login, al menos el registro fue exitoso
          return {
            success: true,
            message: response.message || 'Usuario registrado exitosamente. Por favor, inicia sesión manualmente.'
          };
        }
      } catch (loginError) {
        console.error('❌ Auto-login failed after registration:', loginError);
        // Si falla el auto-login, al menos el registro fue exitoso
        return {
          success: true,
          message: response.message || 'Usuario registrado exitosamente. Por favor, inicia sesión manualmente.'
        };
      }
    }

    return {
      success: false,
      error: response.error || 'Error en el registro'
    };
  } catch (error) {
    console.error('❌ Registration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión'
    };
  }
};

// Logout usando el backend
export const logoutUser = async (): Promise<AuthResponse> => {
  try {
    // Importar función para remover token
    const { removeAuthToken } = await import('@/config/api');
    
    // Llamar al endpoint de logout
    const response = await apiRequest('/auth/logout', {
      method: 'POST'
    });

    // Limpiar el token de autenticación
    removeAuthToken();
    
    // Limpiar también los tokens antiguos por si acaso
    localStorage.removeItem('sb-mqwvbnktcokcccidfgcu-auth-token');
    sessionStorage.removeItem('supabase.auth.token');

    return {
      success: true,
      message: response.message || 'Sesión cerrada exitosamente'
    };
  } catch (error) {
    console.error('Logout error:', error);
    
    // Incluso si falla la request, limpiar todos los tokens
    const { removeAuthToken } = await import('@/config/api');
    removeAuthToken();
    localStorage.removeItem('sb-mqwvbnktcokcccidfgcu-auth-token');
    sessionStorage.removeItem('supabase.auth.token');
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al cerrar sesión'
    };
  }
};

// Obtener información del usuario autenticado
export const getCurrentUser = async (): Promise<AuthResponse> => {
  try {
    const response = await apiRequest('/auth/me');

    console.log('DATOS USUARIO ACTUAL:', response);

    if (response && response.id) {
      // El backend devuelve el usuario directamente
      return {
        success: true,
        user: {          
          id: response.id,
          email: response.email,
          username: response.username,
          status: response.profile.status,
        }
      };
    }

    return {
      success: false,
      error: 'Usuario no autenticado'
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error obteniendo usuario'
    };
  }
};

// Validar fortaleza de contraseña
export const validatePassword = async (password: string): Promise<{ valid: boolean; message?: string }> => {
  try {
    const response = await apiRequest('/auth/validate-password', {
      method: 'POST',
      body: JSON.stringify({ password })
    });

    return {
      valid: response.valid,
      message: response.message
    };
  } catch (error) {
    console.error('Password validation error:', error);
    return {
      valid: false,
      message: 'Error validando contraseña'
    };
  }
};

// Verificar disponibilidad de email
export const checkEmailAvailability = async (email: string): Promise<{ available: boolean; message?: string }> => {
  try {
    const response = await apiRequest('/auth/check-email', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    return {
      available: response.available,
      message: response.message
    };
  } catch (error) {
    console.error('Email check error:', error);
    return {
      available: false,
      message: 'Error verificando email'
    };
  }
};

// Solicitar recuperación de contraseña
export const forgotPassword = async (email: string): Promise<AuthResponse> => {
  try {
    const response = await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    return {
      success: response.success,
      message: response.message || 'Enlace de recuperación enviado'
    };
  } catch (error) {
    console.error('Forgot password error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error enviando enlace de recuperación'
    };
  }
};

// Restablecer contraseña con token
export const resetPassword = async (email: string, token: string, newPassword: string): Promise<AuthResponse> => {
  try {
    const response = await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        token, 
        new_password: newPassword 
      })
    });

    return {
      success: response.success,
      message: response.message || 'Contraseña restablecida exitosamente'
    };
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error restableciendo contraseña'
    };
  }
};

// Cambiar contraseña (usuario autenticado)
export const changePassword = async (currentPassword: string, newPassword: string): Promise<AuthResponse> => {
  try {
    const response = await apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ 
        current_password: currentPassword,
        new_password: newPassword 
      })
    });

    return {
      success: response.success,
      message: response.message || 'Contraseña cambiada exitosamente'
    };
  } catch (error) {
    console.error('Change password error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error cambiando contraseña'
    };
  }
};

// Recuperar cuenta desactivada
export const recoverAccount = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await apiRequest('/auth/recover-account', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    return {
      success: response.success,
      message: response.message || 'Cuenta recuperada exitosamente'
    };
  } catch (error) {
    console.error('Recover account error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error recuperando cuenta'
    };
  }
};

// Desactivar cuenta
export const deactivateAccount = async (reason?: string, deletePermanently = false): Promise<AuthResponse> => {
  try {
    const response = await apiRequest('/auth/deactivate-account', {
      method: 'POST',
      body: JSON.stringify({ 
        reason,
        delete_permanently: deletePermanently 
      })
    });

    // Limpiar tokens locales después de desactivación exitosa
    if (response.success) {
      localStorage.removeItem('sb-mqwvbnktcokcccidfgcu-auth-token');
      sessionStorage.removeItem('supabase.auth.token');
    }

    return {
      success: response.success,
      message: response.message || 'Cuenta desactivada exitosamente'
    };
  } catch (error) {
    console.error('Deactivate account error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desactivando cuenta'
    };
  }
};

// Reenviar confirmación de email
export const resendConfirmation = async (email: string): Promise<AuthResponse> => {
  try {
    const response = await apiRequest('/auth/resend-confirmation', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    return {
      success: response.success,
      message: response.message || 'Email de confirmación reenviado'
    };
  } catch (error) {
    console.error('Resend confirmation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error reenviando confirmación'
    };
  }
};
