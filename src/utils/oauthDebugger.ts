/**
 * Utilidad de debugging específica para OAuth móvil
 * Ayuda a diagnosticar problemas con deep links y OAuth flow
 */

interface OAuthDebugInfo {
  timestamp: string;
  event: string;
  data: any;
  url?: string;
  platform: 'ios' | 'android' | 'web';
}

class OAuthDebugger {
  private logs: OAuthDebugInfo[] = [];
  private platform: 'ios' | 'android' | 'web';

  constructor() {
    this.platform = this.detectPlatform();
    this.log('init', { platform: this.platform });
  }

  private detectPlatform(): 'ios' | 'android' | 'web' {
    const userAgent = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(userAgent)) return 'ios';
    if (/Android/.test(userAgent)) return 'android';
    return 'web';
  }

  log(event: string, data: any, url?: string) {
    const logEntry: OAuthDebugInfo = {
      timestamp: new Date().toISOString(),
      event,
      data,
      url,
      platform: this.platform
    };
    
    this.logs.push(logEntry);
    
    // Mantener solo los últimos 50 logs
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(-50);
    }
    
    // Log en consola con formato colorizado
    const color = this.getColorForEvent(event);
    console.log(`%c[OAuth ${event.toUpperCase()}]`, `color: ${color}; font-weight: bold`, data, url || '');
    
    // Guardar en localStorage para debugging persistente
    localStorage.setItem('oauth_debug_logs', JSON.stringify(this.logs));
  }

  private getColorForEvent(event: string): string {
    const colors: Record<string, string> = {
      'init': '#007AFF',
      'start_flow': '#34C759',
      'browser_open': '#FF9500',
      'deep_link_received': '#5AC8FA',
      'token_extracted': '#30D158',
      'user_verified': '#32D74B',
      'error': '#FF3B30',
      'cleanup': '#8E8E93'
    };
    return colors[event] || '#007AFF';
  }

  getLogsForPlatform(platform?: 'ios' | 'android' | 'web') {
    const targetPlatform = platform || this.platform;
    return this.logs.filter(log => log.platform === targetPlatform);
  }

  exportLogs() {
    return {
      platform: this.platform,
      timestamp: new Date().toISOString(),
      logs: this.logs
    };
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem('oauth_debug_logs');
    console.log('%c[OAuth DEBUG] Logs cleared', 'color: #8E8E93');
  }

  // Método para generar un reporte de debugging
  generateReport() {
    const report = {
      platform: this.platform,
      userAgent: navigator.userAgent,
      currentUrl: window.location.href,
      timestamp: new Date().toISOString(),
      capacitorInfo: {
        isNative: (window as any).Capacitor?.isNativePlatform?.() || false,
        platform: (window as any).Capacitor?.getPlatform?.() || 'unknown'
      },
      logs: this.logs,
      summary: {
        totalEvents: this.logs.length,
        errors: this.logs.filter(log => log.event === 'error').length,
        successfulFlows: this.logs.filter(log => log.event === 'user_verified').length
      }
    };

    console.log('%c[OAuth REPORT]', 'color: #007AFF; font-weight: bold', report);
    return report;
  }
}

// Instancia global para debugging
export const oauthDebugger = new OAuthDebugger();

// Funciones de utilidad para debugging
export const logOAuthEvent = (event: string, data: any, url?: string) => {
  oauthDebugger.log(event, data, url);
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

// Auto-log de eventos importantes del navegador
if (typeof window !== 'undefined') {
  // Log cuando la app se carga
  window.addEventListener('load', () => {
    oauthDebugger.log('page_load', { url: window.location.href });
  });

  // Log cuando cambia la URL (para SPAs)
  let currentUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      oauthDebugger.log('url_change', { newUrl: currentUrl });
    }
  });

  observer.observe(document, { subtree: true, childList: true });

  // Exponer funciones de debugging globalmente para uso en consola
  (window as any).oauthDebug = {
    log: logOAuthEvent,
    logs: getOAuthLogs,
    report: exportOAuthReport,
    clear: clearOAuthLogs
  };
}
