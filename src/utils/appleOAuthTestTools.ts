/**
 * Test script para verificar Apple OAuth en móvil
 * Permite debuggear el flujo completo
 */

import { appleDebugger } from './appleDebugger';

// Función global para resetear el estado de Apple OAuth (útil para debugging)
(window as any).resetAppleOAuth = () => {
  console.log('🔄 Resetting Apple OAuth state from debug tools...');
  
  // Importar función de reset
  import('../services/appleAuth').then(({ resetAppleOAuthState }) => {
    resetAppleOAuthState();
    console.log('✅ Apple OAuth state reset complete. You can try login again.');
  });
};

// Función para forzar limpieza de loading state
(window as any).stopAppleLoading = () => {
  console.log('🛑 Stopping Apple OAuth loading state...');
  
  // Limpiar todos los estados relacionados
  localStorage.removeItem('apple_oauth_pending');
  localStorage.removeItem('apple_oauth_state');
  localStorage.removeItem('apple_oauth_checking');
  
  // Disparar evento para que los componentes se actualicen
  window.dispatchEvent(new CustomEvent('appleOAuthReset'));
  
  console.log('✅ Loading state cleared. Page should update.');
};

// Función para verificar si hay loops de loading
(window as any).checkAppleLoopState = () => {
  console.log('🔍 Checking for Apple OAuth loop state...');
  
  const state = {
    auth_token: localStorage.getItem('auth_token'),
    apple_oauth_pending: localStorage.getItem('apple_oauth_pending'),
    apple_oauth_checking: localStorage.getItem('apple_oauth_checking'),
    apple_oauth_state: localStorage.getItem('apple_oauth_state'),
    current_url: window.location.href,
    page_title: document.title,
    loading_indicators: {
      has_loading_text: document.body.innerHTML.includes('Completando'),
      has_spinner: document.querySelector('.mantine-Loader-root') !== null
    }
  };
  
  console.table(state);
  
  // Detectar posibles loops
  const hasLoopIndicators = (
    state.apple_oauth_checking && 
    state.loading_indicators.has_loading_text
  );
  
  if (hasLoopIndicators) {
    console.warn('⚠️ POSSIBLE LOOP DETECTED! Use stopAppleLoading() to fix it.');
  } else {
    console.log('✅ No loop state detected.');
  }
  
  return state;
};

// Función global para debuggear desde consola
(window as any).debugAppleOAuth = () => {
  console.log('🔍 Starting Apple OAuth Debug...');
  
  return appleDebugger.debugOAuthFlow();
};

// Función global para limpiar debug
(window as any).clearAppleDebug = () => {
  console.log('🧹 Clearing Apple OAuth debug data...');
  appleDebugger.clear();
  localStorage.removeItem('apple_oauth_pending');
  localStorage.removeItem('apple_oauth_state');
  console.log('✅ Debug data cleared');
};

// Función para simular token de éxito (para testing)
(window as any).simulateAppleSuccess = (token = 'test_token_123') => {
  console.log('🧪 Simulating Apple OAuth success...');
  
  const tokenData = {
    token,
    user: { id: 'test_user', email: 'test@example.com' },
    isNewUser: false,
    timestamp: Date.now()
  };
  
  localStorage.setItem('apple_oauth_pending', JSON.stringify(tokenData));
  localStorage.setItem('auth_token', token);
  
  console.log('✅ Success simulation complete. Check app state.');
  
  // Simular app state change
  if ((window as any)?.Capacitor?.Plugins?.App) {
    // Trigger app state change listeners
    setTimeout(() => {
      console.log('📱 Triggering app state change simulation...');
    }, 1000);
  }
};

// Función para verificar el estado actual
(window as any).checkAppleOAuthState = () => {
  console.log('📊 Current Apple OAuth State:');
  
  const state = {
    auth_token: localStorage.getItem('auth_token'),
    apple_oauth_pending: localStorage.getItem('apple_oauth_pending'),
    apple_oauth_state: localStorage.getItem('apple_oauth_state'),
    current_url: window.location.href,
    user_agent: navigator.userAgent,
    capacitor: !!(window as any)?.Capacitor,
    platform: (window as any)?.Capacitor?.getPlatform?.()
  };
  
  console.table(state);
  
  // También mostrar debug events
  const debugEvents = appleDebugger.getLastEvents(10);
  console.log('📋 Recent Debug Events:');
  console.table(debugEvents);
  
  return state;
};

// Auto-log al cargar
console.log('🍎 Apple OAuth Debug Tools loaded!');
console.log('Available functions:');
console.log('  - debugAppleOAuth() - Debug current state');
console.log('  - clearAppleDebug() - Clear debug data'); 
console.log('  - simulateAppleSuccess() - Simulate success');
console.log('  - checkAppleOAuthState() - Check current state');
console.log('  - resetAppleOAuth() - Reset all Apple OAuth state');
console.log('  - stopAppleLoading() - Stop loading loop immediately');
console.log('  - checkAppleLoopState() - Check for infinite loading loops');

export { appleDebugger };
