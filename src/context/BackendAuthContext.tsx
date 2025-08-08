import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, logoutUser, type AuthResponse } from '@/services/auth';
import { apiRequest } from '@/config/api';

interface BackendUser {
  id: string;
  email: string;
  username: string;
}

interface BackendAuthContextType {
  user: BackendUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasProfile: boolean;
  isNewUser: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  refreshUser: (forceRefresh?: boolean) => Promise<void>;
  markUserAsExperienced: () => void;
}

const BackendAuthContext = createContext<BackendAuthContextType | undefined>(undefined);

export const BackendAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const refreshUser = async (forceRefresh = false): Promise<void> => {
    // Evitar múltiples llamadas simultáneas (pero permitir force refresh)
    if (isInitialized && !forceRefresh) {
      console.log('⏭️ Already initialized, skipping refresh (use forceRefresh=true to override)');
      return;
    }

    try {
      console.log('🔄 Refreshing user data...' + (forceRefresh ? ' (forced)' : ''));
      
      // Timeout para evitar que se quede colgado
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Request took too long')), 10000)
      );
      
      const apiPromise = apiRequest('/auth/me');
      
      const response = await Promise.race([apiPromise, timeoutPromise]);
      console.log('🔄 API response received:', response);
      
      if (response && response.id) {
        // El backend devuelve el usuario directamente con el perfil incluido
        const user: BackendUser = {
          id: response.id,
          email: response.email,
          username: response.username,
        };
        setUser(user);
        console.log('✅ User set in context:', user);
        
        // El backend ya incluye el perfil en la respuesta
        console.log('🔍 Profile data for validation:', response.profile);
        
        const hasCompleteProfile = !!(response.profile && 
          response.profile.first_name && 
          response.profile.identification_number && 
          response.profile.phone_number);
        
        setHasProfile(hasCompleteProfile);
        
        // Detectar nuevo usuario: tiene cuenta pero no perfil completo Y viene de registro
        const isFromRegistration = localStorage.getItem('is_new_user') === 'true';
        const isFirstTime = response.user && !hasCompleteProfile && isFromRegistration;
        setIsNewUser(!!isFirstTime);
        
        console.log('🔍 New user detection:', {
          hasUser: !!response.user,
          hasCompleteProfile,
          isFromRegistration,
          isFirstTime: !!isFirstTime
        });
        
        console.log('✅ Auth refreshed - User:', user, 'HasProfile:', hasCompleteProfile, 'IsNewUser:', !!isFirstTime);
      } else {
        console.log('❌ No user data in response, clearing state');
        // Si no hay usuario, limpiar el estado
        setUser(null);
        setHasProfile(false);
        setIsNewUser(false);
      }
    } catch (error) {
      // Error 401 es normal cuando no hay sesión
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('Timeout'))) {
        console.log('❌ No authenticated session found or timeout - Session expired or invalid');
        // Limpiar estado local cuando la sesión es inválida
        setUser(null);
        setHasProfile(false);
        setIsNewUser(false);
        
        // Remover token inválido solo si no es timeout
        if (!error.message.includes('Timeout')) {
          const { removeAuthToken } = await import('@/config/api');
          removeAuthToken();
        }
        
        // Si el usuario estaba logueado, significa que la sesión expiró
        // El AuthGuard se encargará de redirigir al login
      } else {
        console.error('❌ Auth refresh failed:', error);
        setUser(null);
        setHasProfile(false);
        setIsNewUser(false);
      }
    } finally {
      setLoading(false);
      if (forceRefresh || !isInitialized) {
        setIsInitialized(true);
      }
    }
  };

  // Inicializar usuario al cargar - SOLO UNA VEZ
  useEffect(() => {
    if (!isInitialized) {
      console.log('🚀 Initializing auth context...');
      refreshUser();
    }
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      setLoading(true);
      console.log('🔐 Starting login process...');
      const response = await loginUser({ email, password });
      
      if (response.success) {
        console.log('✅ Login API successful');
        
        // Si el login es exitoso y tenemos datos de usuario, actualizar el estado directamente
        if (response.user) {
          setUser(response.user);
          console.log('👤 User set directly from login response:', response.user);
          
          // Marcar como nuevo usuario si viene de registro
          const isFromRegistration = localStorage.getItem('is_new_user') === 'true';
          if (isFromRegistration) {
            setIsNewUser(true);
            console.log('🎯 New user detected from registration');
          }
          
          // Inmediatamente intentar obtener datos completos del usuario
          console.log('🔄 Getting complete user data...');
          try {
            // Forzar refresh para obtener datos completos
            await refreshUser(true);
            console.log('✅ User data refreshed after login');
          } catch (refreshError) {
            // Si falla el refresh, al menos ya tenemos el usuario básico
            console.error('⚠️ Could not get complete user data:', refreshError);
            console.log('👤 Using basic user data from login response');
          }
        }
      } else {
        console.log('❌ Login API failed:', response.error);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Sign in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al iniciar sesión'
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await logoutUser();
      setUser(null);
      setHasProfile(false);
      setIsNewUser(false);
      setIsInitialized(false); // Resetear inicialización
    } catch (error) {
      console.error('Sign out error:', error);
      // Limpiar usuario local aunque falle la request
      setUser(null);
      setHasProfile(false);
      setIsNewUser(false);
      setIsInitialized(false);
    } finally {
      setLoading(false);
    }
  };

  // Marcar usuario como experimentado (ya completó onboarding)
  const markUserAsExperienced = () => {
    localStorage.setItem('user_experienced', 'true');
    localStorage.removeItem('is_new_user'); // Limpiar flag de nuevo usuario
    setIsNewUser(false);
    console.log('👍 User marked as experienced');
  };

  const value: BackendAuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    hasProfile,
    isNewUser,
    signIn,
    signOut,
    refreshUser,
    markUserAsExperienced,
  };

  return (
    <BackendAuthContext.Provider value={value}>
      {children}
    </BackendAuthContext.Provider>
  );
}

export function useBackendAuth(): BackendAuthContextType {
  const context = useContext(BackendAuthContext);
  if (!context) {
    throw new Error('useBackendAuth must be used within a BackendAuthProvider');
  }
  return context;
}
