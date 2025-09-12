import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://tddaveymppuhweujhzwz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZGF2ZXltcHB1aHdldWpoenp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk5ODA0NzYsImV4cCI6MjA0NTU1NjQ3Nn0.ZD-y7cOzHFgxJuUEhYNnr5c6iiwMUe_xk6HZoNlmLko';

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configuración específica para Apple OAuth
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Configuración adicional para OAuth providers
    storage: window?.localStorage,
  }
});

// Helper para detectar si estamos en un entorno móvil
export const isMobileApp = () => {
  return window?.navigator?.userAgent?.includes('Capacitor') || 
         window?.location?.protocol === 'capacitor:' ||
         !!(window as any)?.Capacitor;
};

// Configurar listener para cambios de autenticación
export const setupAuthListener = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

export default supabase;
