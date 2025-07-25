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
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const BackendAuthContext = createContext<BackendAuthContextType | undefined>(undefined);

export const BackendAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  const refreshUser = async (): Promise<void> => {
    try {
      console.log('🔄 Refreshing user data...');
      console.log('🍪 Current cookies before /auth/me request:', document.cookie);
      
      const response = await apiRequest('/auth/me');
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
        console.log('🔍 Profile fields check:', {
          hasProfile: !!response.profile,
          hasFirstName: !!(response.profile?.first_name),
          hasIdNumber: !!(response.profile?.identification_number),
          hasPhoneNumber: !!(response.profile?.phone_number),
          firstNameValue: response.profile?.first_name,
          idNumberValue: response.profile?.identification_number,
          phoneNumberValue: response.profile?.phone_number
        });
        
        const hasCompleteProfile = !!(response.profile && 
          response.profile.first_name && 
          response.profile.identification_number && 
          response.profile.phone_number);
        
        setHasProfile(hasCompleteProfile);
        
        console.log('✅ Auth refreshed - User:', user, 'HasProfile:', hasCompleteProfile, 'Profile:', response.profile);
      } else {
        console.log('❌ No user data in response, clearing state');
        // Si no hay usuario, limpiar el estado
        setUser(null);
        setHasProfile(false);
      }
    } catch (error) {
      // Error 401 es normal cuando no hay sesión, pero debemos hacer log
      // para diagnosticar problemas específicos después del login
      if (error instanceof Error && error.message.includes('401')) {
        console.log('❌ No authenticated session found (401)');
        console.log('🍪 Cookies during 401 error:', document.cookie);
        console.log('⚠️ This could be a cookie timing issue or cross-origin cookie problem');
      } else {
        console.error('❌ Auth refresh failed:', error);
      }
      setUser(null);
      setHasProfile(false);
    } finally {
      setLoading(false);
    }
  };

  // Inicializar usuario al cargar
  useEffect(() => {
    refreshUser();
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
          console.log('� User set directly from login response:', response.user);
          
          // Inmediatamente intentar obtener datos completos del usuario
          console.log('🔄 Getting complete user data...');
          try {
            await refreshUser();
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
    } catch (error) {
      console.error('Sign out error:', error);
      // Limpiar usuario local aunque falle la request
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const value: BackendAuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    hasProfile,
    signIn,
    signOut,
    refreshUser,
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
