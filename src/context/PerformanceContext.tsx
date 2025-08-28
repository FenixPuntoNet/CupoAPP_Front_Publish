import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { globalCache } from '../lib/cache';
import { OptimizedViajesService } from '../services/optimizedViajes';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  cacheHitRate: number;
  activeRequests: number;
  memoryUsage: number;
  networkLatency: number;
}

interface PerformanceContextType {
  metrics: PerformanceMetrics;
  isOptimizationEnabled: boolean;
  enableOptimization: () => void;
  disableOptimization: () => void;
  clearAllCaches: () => void;
  preloadCriticalData: () => void;
  reportPerformanceIssue: (issue: string) => void;
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

export function PerformanceProvider({ children }: { children: ReactNode }) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    cacheHitRate: 0,
    activeRequests: 0,
    memoryUsage: 0,
    networkLatency: 0
  });

  const [isOptimizationEnabled, setIsOptimizationEnabled] = useState(() => {
    return localStorage.getItem('performance_optimization') !== 'false';
  });

  // 🚀 Medir performance automáticamente
  useEffect(() => {
    if (!isOptimizationEnabled) return;

    const startTime = performance.now();
    let cacheHits = 0;
    let cacheMisses = 0;

    // Interceptar fetch para medir latencia
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const fetchStart = performance.now();
      try {
        const response = await originalFetch.apply(this, args);
        const fetchEnd = performance.now();
        const latency = fetchEnd - fetchStart;
        
        setMetrics(prev => ({
          ...prev,
          networkLatency: (prev.networkLatency + latency) / 2 // Promedio móvil
        }));
        
        return response;
      } catch (error) {
        throw error;
      }
    };

    // Medir tiempo de carga inicial
    const loadTime = performance.now() - startTime;
    setMetrics(prev => ({ ...prev, loadTime }));

    // Medir uso de memoria si está disponible
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize / memory.totalJSHeapSize
      }));
    }

    // Actualizar métricas cada 30 segundos
    const metricsInterval = setInterval(() => {
      const hitRate = cacheHits / (cacheHits + cacheMisses) || 0;
      
      setMetrics(prev => ({
        ...prev,
        cacheHitRate: hitRate,
        renderTime: performance.now() - startTime
      }));
    }, 30000);

    return () => {
      clearInterval(metricsInterval);
      window.fetch = originalFetch;
    };
  }, [isOptimizationEnabled]);

  const enableOptimization = () => {
    setIsOptimizationEnabled(true);
    localStorage.setItem('performance_optimization', 'true');
    console.log('🚀 Performance optimization enabled');
  };

  const disableOptimization = () => {
    setIsOptimizationEnabled(false);
    localStorage.setItem('performance_optimization', 'false');
    console.log('⏸️ Performance optimization disabled');
  };

  const clearAllCaches = () => {
    globalCache.clear();
    OptimizedViajesService.getInstance().clearCache();
    
    // Limpiar otros caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    console.log('🧹 All caches cleared');
  };

  const preloadCriticalData = async () => {
    if (!isOptimizationEnabled) return;
    
    try {
      // Precargar datos críticos en paralelo
      const viajesService = OptimizedViajesService.getInstance();
      
      await Promise.allSettled([
        viajesService.getMyTrips(),
        // Agregar más precarga según necesidad
      ]);
      
      console.log('📦 Critical data preloaded');
    } catch (error) {
      console.warn('⚠️ Failed to preload critical data:', error);
    }
  };

  const reportPerformanceIssue = (issue: string) => {
    if (import.meta.env.DEV) {
      console.warn('🐛 Performance issue reported:', issue);
      console.log('📊 Current metrics:', metrics);
    }
    
    // En producción, enviar a servicio de analytics
    // analytics.track('performance_issue', { issue, metrics });
  };

  return (
    <PerformanceContext.Provider value={{
      metrics,
      isOptimizationEnabled,
      enableOptimization,
      disableOptimization,
      clearAllCaches,
      preloadCriticalData,
      reportPerformanceIssue
    }}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}

// 🚀 Hook para medir performance de componentes específicos
export function useComponentPerformance(componentName: string) {
  const { reportPerformanceIssue } = usePerformance();
  
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Reportar si el componente tardó más de 100ms en renderizar
      if (renderTime > 100) {
        reportPerformanceIssue(`${componentName} slow render: ${renderTime.toFixed(2)}ms`);
      }
    };
  }, [componentName, reportPerformanceIssue]);
}

// 🚀 Hook para medir performance de operaciones async
export function useAsyncPerformance() {
  const { reportPerformanceIssue } = usePerformance();
  
  const measureAsync = async function<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxTime = 5000 // 5 segundos por defecto
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > maxTime) {
        reportPerformanceIssue(`${operationName} slow operation: ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      reportPerformanceIssue(`${operationName} failed after ${duration.toFixed(2)}ms`);
      throw error;
    }
  };
  
  return { measureAsync };
}
