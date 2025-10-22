import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, logoutUser, type AuthResponse } from '@/services/auth';
import { apiRequest } from '@/config/api';
// ✅ Importar sistemas de cache para limpieza completa
import { globalCache, apiCache } from '@/lib/cache';
import { googleMapsCache } from '@/lib/googleMapsCache';

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
  clearCacheAndRefresh: () => Promise<boolean>;
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
      
      // ✅ CRITICAL DEBUG: Verificar token antes de hacer request
      const currentToken = localStorage.getItem('auth_token');
      console.log('🔑 [AUTH-DEBUG] Current token in localStorage:', currentToken ? 'EXISTS' : 'MISSING');
      console.log('🔑 [AUTH-DEBUG] Token length:', currentToken ? currentToken.length : 0);
      console.log('🔑 [AUTH-DEBUG] Token preview:', currentToken ? currentToken.substring(0, 50) + '...' : 'NULL');
      
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
        
        // ✅ CRITICAL DEBUG: Verificar que el token sigue válido después del refresh
        const tokenAfterRefresh = localStorage.getItem('auth_token');
        console.log('🔑 [AUTH-DEBUG] Token after refresh:', tokenAfterRefresh ? 'STILL EXISTS' : 'WAS REMOVED');
        
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
      
      console.log('🚪 [CONTEXT-LOGOUT] Iniciando proceso de cierre de sesión desde contexto...')
      
      // ✅ LIMPIAR TODOS LOS CACHES ANTES DEL LOGOUT
      console.log('🧹 [CONTEXT-LOGOUT] Limpiando cache global...')
      globalCache.clear()
      
      console.log('🧹 [CONTEXT-LOGOUT] Limpiando cache de API...')
      apiCache.clear()
      
      console.log('🧹 [CONTEXT-LOGOUT] Limpiando cache de Google Maps...')
      googleMapsCache.clear()
      
      console.log('🧹 [CONTEXT-LOGOUT] Limpiando cache de requests activos...')
      const { clearApiCache } = await import('@/config/api');
      clearApiCache();
      
      // ✅ LIMPIAR SOLO DATOS RELACIONADOS AL USUARIO, MANTENER CONFIGURACIONES GLOBALES
      console.log('🧹 [CONTEXT-LOGOUT] Limpiando datos de usuario del localStorage...')
      const keysToKeep = ['theme'] // Mantener solo el tema
      const allKeys = Object.keys(localStorage)
      
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key)
          console.log(`🗑️ [CONTEXT-LOGOUT] Removed from localStorage: ${key}`)
        }
      })
      
      // ✅ LIMPIAR SESSION STORAGE
      console.log('🧹 [CONTEXT-LOGOUT] Limpiando sessionStorage...')
      sessionStorage.clear()
      
      console.log('✅ [CONTEXT-LOGOUT] Cache limpio, ejecutando logout en backend...')
      await logoutUser();
      
      // Limpiar estado del contexto
      setUser(null);
      setHasProfile(false);
      setIsNewUser(false);
      setIsInitialized(false); // Resetear inicialización
      
      console.log('✅ [CONTEXT-LOGOUT] Cierre de sesión completado exitosamente')
    } catch (error) {
      console.error('❌ [CONTEXT-LOGOUT] Sign out error:', error);
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

  // Función para limpiar completamente el cache y refrescar contexto
  const clearCacheAndRefresh = async () => {
    try {
      console.log('🧹 [CLEAR-CACHE] Clearing all cache and forcing context refresh...');
      
      // ✅ LIMPIAR TODOS LOS CACHES
      console.log('🧹 [CLEAR-CACHE] Limpiando cache global...')
      globalCache.clear()
      
      console.log('🧹 [CLEAR-CACHE] Limpiando cache de API...')
      apiCache.clear()
      
      console.log('🧹 [CLEAR-CACHE] Limpiando cache de Google Maps...')
      googleMapsCache.clear()
      
      console.log('🧹 [CLEAR-CACHE] Limpiando cache de requests activos...')
      const { clearApiCache } = await import('@/config/api');
      clearApiCache();
      console.log('✅ [CLEAR-CACHE] API cache cleared');
      
      // Resetear estado local
      setIsInitialized(false);
      setHasProfile(false);
      setIsNewUser(false);
      
      // Force refresh completo con bypass de cache
      await refreshUser(true);
      
      console.log('✅ [CLEAR-CACHE] Cache cleared and context refreshed');
      return true;
    } catch (error) {
      console.error('❌ [CLEAR-CACHE] Error clearing cache:', error);
      return false;
    }
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
    clearCacheAndRefresh,
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
