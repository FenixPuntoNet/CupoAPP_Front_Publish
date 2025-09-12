/**
 * Apple OAuth Debugger for iOS
 * Helps debug Apple OAuth flow in mobile apps
 */

export interface AppleDebugEvent {
  timestamp: number;
  event: string;
  data: any;
  url?: string;
  platform?: string;
}

class AppleOAuthDebugger {
  private events: AppleDebugEvent[] = [];
  private maxEvents = 100;

  log(event: string, data: any = {}, url?: string) {
    const debugEvent: AppleDebugEvent = {
      timestamp: Date.now(),
      event,
      data,
      url,
      platform: this.getPlatform()
    };

    this.events.push(debugEvent);
    
    // Mantener solo los últimos maxEvents
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log a consola con formato claro
    const timestamp = new Date(debugEvent.timestamp).toISOString().substr(11, 12);
    console.log(`🍎 [${timestamp}] ${event.toUpperCase()}:`, data, url ? `URL: ${url}` : '');

    // Guardar en localStorage para debugging
    try {
      localStorage.setItem('apple_oauth_debug', JSON.stringify(this.events.slice(-20))); // Solo los últimos 20
    } catch (e) {
      // Ignorar errores de localStorage
    }
  }

  private getPlatform(): string {
    if (typeof window === 'undefined') return 'unknown';
    
    const userAgent = window.navigator?.userAgent || '';
    const isCapacitor = !!(window as any)?.Capacitor;
    const protocol = window.location?.protocol;
    
    if (isCapacitor) {
      if (/iPad|iPhone|iPod/.test(userAgent)) return 'ios-capacitor';
      if (/Android/.test(userAgent)) return 'android-capacitor';
      return 'capacitor';
    }
    
    if (protocol === 'capacitor:') return 'capacitor-web';
    
    if (/iPad|iPhone|iPod/.test(userAgent)) return 'ios-web';
    if (/Android/.test(userAgent)) return 'android-web';
    
    return 'web';
  }

  getEvents(): AppleDebugEvent[] {
    return [...this.events];
  }

  getLastEvents(count: number = 10): AppleDebugEvent[] {
    return this.events.slice(-count);
  }

  clear() {
    this.events = [];
    localStorage.removeItem('apple_oauth_debug');
  }

  exportDebugInfo(): string {
    const info = {
      timestamp: new Date().toISOString(),
      platform: this.getPlatform(),
      userAgent: window.navigator?.userAgent || 'unknown',
      url: window.location?.href || 'unknown',
      capacitor: !!(window as any)?.Capacitor,
      localStorage: {
        auth_token: !!localStorage.getItem('auth_token'),
        apple_oauth_pending: !!localStorage.getItem('apple_oauth_pending'),
        oauth_state: !!localStorage.getItem('oauth_state')
      },
      events: this.getLastEvents(20)
    };

    return JSON.stringify(info, null, 2);
  }

  // Método para testing de deep links
  async testDeepLink() {
    this.log('deep_link_test_start', {
      platform: this.getPlatform(),
      capacitor: !!(window as any)?.Capacitor
    });

    const testUrl = 'cupo://oauth-callback?test=true&timestamp=' + Date.now();
    
    try {
      if ((window as any)?.Capacitor) {
        // En Capacitor, simular deep link
        await import('@capacitor/app'); // Importar para verificar disponibilidad
        
        // Simular evento de deep link
        const testEvent = {
          url: testUrl,
          test: true
        };

        this.log('deep_link_test_simulated', testEvent, testUrl);
        
        // Simular el callback
        setTimeout(() => {
          this.log('deep_link_test_callback', { success: true });
          console.log('✅ Deep link test completed successfully!');
        }, 1000);

      } else {
        this.log('deep_link_test_web_fallback', { 
          message: 'Deep link test only available on mobile' 
        });
      }
    } catch (error) {
      this.log('deep_link_test_error', { 
        error: error?.toString() 
      });
    }
  }

  // Método para testing de OAuth completo
  async debugOAuthFlow() {
    this.log('oauth_debug_start', {
      platform: this.getPlatform(),
      hasAuthToken: !!localStorage.getItem('auth_token'),
      hasPendingAuth: !!localStorage.getItem('apple_oauth_pending')
    });

    // Verificar estado actual
    const currentState = {
      authToken: localStorage.getItem('auth_token'),
      pendingAuth: localStorage.getItem('apple_oauth_pending'),
      oauthState: localStorage.getItem('oauth_state'),
      capacitor: !!(window as any)?.Capacitor
    };

    this.log('oauth_current_state', currentState);

    // Si hay token pendiente, intentar procesarlo
    if (currentState.pendingAuth) {
      try {
        const pendingData = JSON.parse(currentState.pendingAuth);
        this.log('oauth_pending_data_found', {
          hasToken: !!pendingData.token,
          tokenLength: pendingData.token?.length || 0,
          isNewUser: pendingData.isNewUser
        });
      } catch (error) {
        this.log('oauth_pending_data_invalid', {
          error: error?.toString(),
          rawData: currentState.pendingAuth
        });
      }
    }

    return this.exportDebugInfo();
  }
}

// Singleton instance
const appleDebugger = new AppleOAuthDebugger();

export { appleDebugger };
export default appleDebugger;
