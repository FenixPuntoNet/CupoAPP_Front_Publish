import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE = 'https://auth-worker.kngsdata.workers.dev';

interface AppUser {
  id: string;
  email: string;
  username: string;
  balance: number;
  wallet_id: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (
    email: string,
    password: string,
    username: string,
    verification_terms?: string,
    suscriptions?: string
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        // 🕒 Espera corta para asegurar que la cookie se registre
        await new Promise(resolve => setTimeout(resolve, 100));
        await fetchUser();
        return true;
      }

      return false;
    } catch (err) {
      return false;
    }
  };

    const signup = async (
      email: string,
      password: string,
      username: string,
      verification_terms?: string,
      suscriptions?: string
    ): Promise<boolean> => {
     try {
       const body = {
         email,
         password,
         username,
         verification_terms,
         suscriptions,
       };
   
       console.log("Body enviado a /auth/signup:", body); // log para verificar
   
       const res = await fetch(`${API_BASE}/auth/signup`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         credentials: 'include',
         body: JSON.stringify(body),
       });
   
       if (!res.ok) {
         const errorText = await res.text();
         console.error("Error en signup:", errorText);
         return false;
       }
   
       return true;
     } catch (err) {
       console.error("Error en signup (exception):", err);
       return false;
     }
   };
   

  const logout = async () => {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        loading,
        login,
        signup,
        logout,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe estar dentro de AuthProvider');
  }
  return context;
}
