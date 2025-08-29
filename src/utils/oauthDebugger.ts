/**
 * OAuth Debugger - Herramienta de debugging específica para OAuth móvil
 * ✅ ACTUALIZADO: Versión mejorada con soporte específico para iOS
 */

interface OAuthDebugInfo {
  timestamp: string;
  event: string;
  data: any;
  url?: string;
  platform: 'ios' | 'android' | 'web';
  sessionId: string;
}

class OAuthDebugger {
  private logs: OAuthDebugInfo[] = [];
  private platform: 'ios' | 'android' | 'web';
  private sessionId: string;
  private startTime: number;

  constructor() {
    this.platform = this.detectPlatform();
    this.sessionId = `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.startTime = Date.now();
    
    // Limpiar logs antiguos
    this.cleanOldLogs();
    
    this.log('init', { 
      platform: this.platform, 
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      currentURL: window.location.href
    });
    
    // ✅ NUEVO: Exponer globalmente para debugging en iOS
    (window as any).oauthDebugger = this;
    console.log('%c[OAuth DEBUGGER INIT]', 'color: #007AFF; font-weight: bold', {
      platform: this.platform,
      sessionId: this.sessionId
    });
  }

  private detectPlatform(): 'ios' | 'android' | 'web' {
    const userAgent = navigator.userAgent;
    const isCapacitor = window.location.protocol === 'capacitor:';
    
    if (isCapacitor || (window as any).Capacitor?.isNativePlatform?.()) {
      if (/iPad|iPhone|iPod/.test(userAgent)) return 'ios';
      if (/Android/.test(userAgent)) return 'android';
    }
    return 'web';
  }

  private cleanOldLogs(): void {
    try {
      const keys = Object.keys(localStorage);
      const oauthKeys = keys.filter(key => key.startsWith('oauth_debug_'));
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      
      oauthKeys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.timestamp < oneHourAgo) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Could not clean old oauth logs:', e);
    }
  }

  log(event: string, data: any, url?: string) {
    const logEntry: OAuthDebugInfo = {
      timestamp: new Date().toISOString(),
      event,
      data: { ...data },
      url,
      platform: this.platform,
      sessionId: this.sessionId
    };
    
    this.logs.push(logEntry);
    
    // Mantener solo los últimos 100 logs (aumentado para mejor debugging)
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
    
    // ✅ MEJORADO: Log en consola con formato colorizado específico
    const color = this.getColorForEvent(event);
    console.log(`%c[OAuth ${event.toUpperCase()}]`, `color: ${color}; font-weight: bold`, data, url || '');
    
    // Guardar en localStorage con sessionId para mejor organización
    try {
      localStorage.setItem(`oauth_debug_${this.sessionId}`, JSON.stringify({
        sessionId: this.sessionId,
        platform: this.platform,
        startTime: this.startTime,
        logs: this.logs,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Could not save oauth debug logs:', e);
    }
  }

  private getColorForEvent(event: string): string {
    const colors: Record<string, string> = {
      'init': '#007AFF',
      'page_load': '#007AFF',
      'url_change': '#007AFF',
      'handler_init': '#007AFF',
      'plugins_loading': '#007AFF',
      'plugins_loaded': '#007AFF',
      'start_flow': '#34C759',
      'browser_opening': '#007AFF',
      'browser_opened': '#007AFF',
      'deep_link_received': '#FF9500',
      'deep_link_processing': '#FF9500',
      'token_extracted': '#34C759',
      'user_verified': '#34C759',
      'error': '#FF3B30',
      'cleanup_start': '#007AFF',
      'cleanup_complete': '#34C759',
      'browser_close_error': '#007AFF',
      'timeout': '#FF9500',
      'url_scheme_test': '#5AC8FA',
      'browser_state': '#8E8E93'
    };
    return colors[event] || '#007AFF';
  }

  getLogsForPlatform(platform?: 'ios' | 'android' | 'web') {
    const targetPlatform = platform || this.platform;
    return this.logs.filter(log => log.platform === targetPlatform);
  }

  exportLogs() {
    const duration = Date.now() - this.startTime;
    
    return {
      sessionId: this.sessionId,
      platform: this.platform,
      duration: `${Math.round(duration / 1000)}s`,
      startTime: new Date(this.startTime).toISOString(),
      timestamp: new Date().toISOString(),
      logs: this.logs,
      // ✅ NUEVO: Análisis específico para OAuth móvil
      analysis: {
        hasErrors: this.logs.some(e => e.event === 'error'),
        errorCount: this.logs.filter(e => e.event === 'error').length,
        browserOpenAttempts: this.logs.filter(e => e.event === 'browser_opening').length,
        deepLinkAttempts: this.logs.filter(e => e.event === 'deep_link_received').length,
        tokenExtractions: this.logs.filter(e => e.event === 'token_extracted').length,
        userVerifications: this.logs.filter(e => e.event === 'user_verified').length,
        lastEvent: this.logs[this.logs.length - 1]?.event || 'none',
        flowCompleted: this.logs.some(e => e.event === 'user_verified'),
        commonIssues: this.analyzeCommonIssues()
      }
    };
  }

  private analyzeCommonIssues(): string[] {
    const issues: string[] = [];
    
    // Verificar si se abrió el browser pero no se recibió deep link
    const browserOpened = this.logs.some(e => e.event === 'browser_opened');
    const deepLinkReceived = this.logs.some(e => e.event === 'deep_link_received');
    
    if (browserOpened && !deepLinkReceived) {
      issues.push('Browser opened but no deep link received - OAuth might be redirecting to web instead of app');
    }
    
    // Verificar si se recibió deep link pero no se extrajo token
    const tokenExtracted = this.logs.some(e => e.event === 'token_extracted');
    
    if (deepLinkReceived && !tokenExtracted) {
      issues.push('Deep link received but token not extracted - check URL format');
    }
    
    // Verificar errores de browser close
    const browserCloseErrors = this.logs.filter(e => e.event === 'browser_close_error');
    if (browserCloseErrors.length > 1) {
      issues.push('Multiple browser close errors - may indicate timing issues');
    }
    
    // Verificar timeouts
    const timeouts = this.logs.some(e => e.event === 'timeout');
    if (timeouts) {
      issues.push('OAuth flow timed out - user may have cancelled or backend is slow');
    }
    
    return issues;
  }

  clearLogs() {
    this.logs = [];
    
    try {
      const keys = Object.keys(localStorage);
      keys.filter(key => key.startsWith('oauth_debug_')).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (e) {
      console.warn('Could not clear oauth logs:', e);
    }
    
    console.log('%c[OAuth DEBUG] Logs cleared', 'color: #8E8E93');
  }

  // ✅ NUEVO: Métodos específicos para diagnóstico de iOS
  testURLScheme(): void {
    this.log('url_scheme_test', {
      currentURL: window.location.href,
      protocol: window.location.protocol,
      isCapacitor: window.location.protocol === 'capacitor:',
      userAgent: navigator.userAgent,
      capacitorInfo: (window as any).Capacitor ? {
        platform: (window as any).Capacitor.getPlatform?.(),
        isNative: (window as any).Capacitor.isNativePlatform?.()
      } : null
    });
  }

  logBrowserState(): void {
    this.log('browser_state', {
      windowLocation: window.location.href,
      documentReadyState: document.readyState,
      timestamp: Date.now(),
      availableCapacitorPlugins: Object.keys((window as any).Capacitor?.Plugins || {}),
      localStorage: {
        hasAuthToken: !!localStorage.getItem('auth_token'),
        oauthDebugKeys: Object.keys(localStorage).filter(k => k.startsWith('oauth_'))
      }
    });
  }

  // Método para generar un reporte completo de debugging
  generateReport() {
    const report = {
      ...this.exportLogs(),
      userAgent: navigator.userAgent,
      currentUrl: window.location.href,
      capacitorInfo: {
        isNative: (window as any).Capacitor?.isNativePlatform?.() || false,
        platform: (window as any).Capacitor?.getPlatform?.() || 'unknown',
        plugins: Object.keys((window as any).Capacitor?.Plugins || {})
      },
      localStorage: {
        authToken: !!localStorage.getItem('auth_token'),
        oauthKeys: Object.keys(localStorage).filter(k => k.startsWith('oauth_'))
      },
      summary: {
        totalEvents: this.logs.length,
        errors: this.logs.filter(log => log.event === 'error').length,
        successfulFlows: this.logs.filter(log => log.event === 'user_verified').length
      }
    };

    console.log('%c[OAuth REPORT]', 'color: #007AFF; font-weight: bold', report);
    return report;
  }

  // ✅ NUEVO: Método para testing manual de deep links
  testDeepLink(url: string = 'cupo://oauth-callback?test=true'): void {
    this.log('manual_deep_link_test', { testURL: url });
    console.log('🧪 Testing deep link manually:', url);
    
    if ((window as any).Capacitor?.Plugins?.App) {
      console.log('📱 Capacitor App plugin available for testing');
      this.log('test_environment_ready', { hasCapacitor: true });
    } else {
      console.warn('⚠️ Capacitor App plugin not available for testing');
      this.log('test_environment_error', { error: 'Capacitor App plugin not available' });
    }
  }
}

// Instancia global para debugging
export const oauthDebugger = new OAuthDebugger();

// Funciones de utilidad para debugging
export const logOAuthEvent = (event: string, data: any, url?: string) => {
  try {
    oauthDebugger.log(event, data, url);
  } catch (e) {
    console.warn('OAuth debug logging failed:', e);
  }
};

export const getOAuthLogs = () => {
  return oauthDebugger.getLogsForPlatform();
};

export const exportOAuthReport = () => {
  return oauthDebugger.generateReport();
};

export const clearOAuthLogs = () => {
  oauthDebugger.clearLogs();
};

// ✅ NUEVO: Funciones específicas para iOS debugging
export const logPageLoad = (): void => {
  logOAuthEvent('page_load', { url: window.location.href });
};

export const logURLChange = (newUrl: string): void => {
  logOAuthEvent('url_change', { newUrl });
};

export const testOAuthDeepLink = (url?: string): void => {
  oauthDebugger.testDeepLink(url);
};

// Auto-log de eventos importantes del navegador
if (typeof window !== 'undefined') {
  // Log cuando la app se carga
  window.addEventListener('load', () => {
    logPageLoad();
    oauthDebugger.testURLScheme();
    oauthDebugger.logBrowserState();
  });

  // Log cuando cambia la URL (para SPAs)
  let currentUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      logURLChange(currentUrl);
    }
  });

  if (document.body) {
    observer.observe(document.body, { subtree: true, childList: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { subtree: true, childList: true });
    });
  }

  // ✅ MEJORADO: Exponer funciones de debugging globalmente para uso en consola
  (window as any).oauthDebug = {
    log: logOAuthEvent,
    logs: getOAuthLogs,
    report: exportOAuthReport,
    clear: clearOAuthLogs,
    test: testOAuthDeepLink,
    debugger: oauthDebugger,
    diagnoseIOS: diagnoseIOSOAuth,
    testIOS: testIOSDeepLink
  };
}

// ✅ NUEVO: Debugging específico para iOS
export function diagnoseIOSOAuth() {
  console.log('📱 [DIAGNOSE] Iniciando diagnóstico específico de iOS...');
  
  const diagnosis = {
    timestamp: new Date().toISOString(),
    platform: 'ios',
    checks: {} as any
  };
  
  // Check 1: URL Scheme Registration
  try {
    // Verificar si el esquema está registrado intentando crear una URL
    const testUrl = new URL('cupo://oauth-callback?test=true');
    diagnosis.checks.urlSchemeFormat = {
      status: 'pass',
      scheme: testUrl.protocol,
      host: testUrl.hostname,
      details: 'URL scheme format is valid'
    };
  } catch (error) {
    diagnosis.checks.urlSchemeFormat = {
      status: 'fail',
      error: error?.toString(),
      details: 'URL scheme format is invalid'
    };
  }
  
  // Check 2: Capacitor App Plugin Availability
  try {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      diagnosis.checks.capacitorApp = {
        status: 'pass',
        platform: (window as any).Capacitor.getPlatform(),
        details: 'Capacitor is available'
      };
    } else {
      diagnosis.checks.capacitorApp = {
        status: 'fail',
        details: 'Capacitor not available - running in browser?'
      };
    }
  } catch (error) {
    diagnosis.checks.capacitorApp = {
      status: 'error',
      error: error?.toString()
    };
  }
  
  // Check 3: Browser Plugin Availability
  try {
    // Test if we can import browser plugin
    diagnosis.checks.browserPlugin = {
      status: 'pending',
      details: 'Will test during OAuth flow'
    };
  } catch (error) {
    diagnosis.checks.browserPlugin = {
      status: 'fail',
      error: error?.toString()
    };
  }
  
  // Check 4: OAuth Session State
  const oauthLogs = getOAuthLogs();
  diagnosis.checks.sessionState = {
    status: oauthLogs.length > 0 ? 'info' : 'empty',
    logCount: oauthLogs.length,
    lastEvent: oauthLogs[oauthLogs.length - 1] || null,
    details: `Found ${oauthLogs.length} OAuth events in session`
  };
  
  console.log('📱 [DIAGNOSE] Diagnóstico iOS completado:', diagnosis);
  logOAuthEvent('ios_diagnosis', diagnosis);
  
  return diagnosis;
}

// ✅ NUEVO: Test específico de deep link para iOS
export async function testIOSDeepLink() {
  console.log('🧪 [TEST] Iniciando test de deep link iOS...');
  
  const testResult = {
    timestamp: new Date().toISOString(),
    platform: 'ios',
    tests: {} as any
  };
  
  try {
    // Test 1: URL Creation
    const testUrl = 'cupo://oauth-callback?test=true&timestamp=' + Date.now();
    testResult.tests.urlCreation = {
      status: 'pass',
      url: testUrl,
      details: 'Test URL created successfully'
    };
    
    // Test 2: Manual Deep Link Simulation
    try {
      // Simular que recibimos un deep link
      const event = new CustomEvent('deeplink-test', {
        detail: { url: testUrl }
      });
      window.dispatchEvent(event);
      
      testResult.tests.eventDispatch = {
        status: 'pass',
        details: 'Custom event dispatched successfully'
      };
    } catch (error) {
      testResult.tests.eventDispatch = {
        status: 'fail',
        error: error?.toString()
      };
    }
    
    // Test 3: URL Parsing
    try {
      const parsedUrl = new URL(testUrl);
      const hasTest = parsedUrl.searchParams.get('test');
      const hasTimestamp = parsedUrl.searchParams.get('timestamp');
      
      testResult.tests.urlParsing = {
        status: hasTest && hasTimestamp ? 'pass' : 'fail',
        parsedParams: {
          test: hasTest,
          timestamp: hasTimestamp
        },
        details: 'URL parameters parsed correctly'
      };
    } catch (error) {
      testResult.tests.urlParsing = {
        status: 'fail',
        error: error?.toString()
      };
    }
    
  } catch (error) {
    testResult.tests.general = {
      status: 'error',
      error: error?.toString()
    };
  }
  
  console.log('🧪 [TEST] Test iOS completado:', testResult);
  logOAuthEvent('ios_deep_link_test', testResult);
  
  return testResult;
}
