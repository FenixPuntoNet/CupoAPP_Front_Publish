import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: number;
  user_id: string;
  first_name: string;
  last_name: string;
  phone_number?: string | null;
  status: string;
  Verification?: string | null;
  photo_user?: string | null;
}

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  hasProfile: boolean;
  checkProfile: () => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const checkProfile = async () => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setUserProfile({
          id: data.id,
          user_id: data.user_id,
          first_name: data.first_name,
          last_name: data.last_name,
          phone_number: data.phone_number,
          status: data.status,
          Verification: data.Verification,
          photo_user: data.photo_user,
        });
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing authentication...');
        
        // Obtener sesión existente
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (mounted) {
            setSession(null);
            setUser(null);
          }
        } else {
          console.log('✅ Session found:', session?.user?.id || 'No session');
          if (mounted) {
            setSession(session);
            setUser(session?.user ?? null);
          }
        }
      } catch (error) {
        console.error('❌ Error in initializeAuth:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.id || 'No session');
        
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Guardar datos de sesión en localStorage
          localStorage.setItem('userId', session.user.id);
          localStorage.setItem('userEmail', session.user.email || '');
          console.log('💾 Session data saved to localStorage');
        } else {
          // Limpiar localStorage si no hay sesión
          localStorage.removeItem('userId');
          localStorage.removeItem('userEmail');
          console.log('🗑️ Session data cleared from localStorage');
        }
        
        // Solo cambiar loading después de la inicialización
        if (initialized) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initialized]);

  // Efecto para cargar perfil cuando cambia el usuario
  useEffect(() => {
    if (user && !loading) {
      console.log('👤 Loading user profile...');
      checkProfile();
    } else if (!user) {
      setUserProfile(null);
    }
  }, [user, loading]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔐 Attempting sign in...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ Sign in successful:', data.user.id);
        return { success: true };
      }

      return { success: false, error: 'No user data received' };
    } catch (error) {
      console.error('❌ Sign in exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      console.log('🚪 Signing out...');
      
      await supabase.auth.signOut();
      
      // Limpiar estado local
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      // Limpiar localStorage
      localStorage.clear();
      
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    userProfile,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
    hasProfile: !!userProfile,
    checkProfile,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth(): SupabaseAuthContextType {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}
