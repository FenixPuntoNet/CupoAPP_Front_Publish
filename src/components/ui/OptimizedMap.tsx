import { memo, useState, useCallback, lazy, Suspense, useEffect } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, Polyline } from '@react-google-maps/api';
import { useMaps } from '@/components/GoogleMapsProvider';
import { SmartLoader } from '@/components/ui/SmartLoader';
import { decodePolyline, type LatLng } from '@/utils/polylineUtils';

// 🚀 Lazy load el mapa completo solo cuando sea necesario
const LazyGoogleMap = lazy(() => Promise.resolve({ default: GoogleMap }));

interface OptimizedRoute {
  polyline: string;
  startAddress: string;
  endAddress: string;
  distance: string;
  duration: string;
}

interface OptimizedMapProps {
  center?: { lat: number; lng: number };
  markers?: Array<{
    position: { lat: number; lng: number };
    title?: string;
    icon?: any;
  }>;
  directions?: google.maps.DirectionsResult;
  // 🚀 Nueva prop para rutas optimizadas
  optimizedRoute?: OptimizedRoute;
  onMapClick?: (event: google.maps.MapMouseEvent) => void;
  onLoad?: (map: google.maps.Map) => void;
  height?: string;
  width?: string;
  zoom?: number;
  showTraffic?: boolean;
  // 🚀 Control de cuándo cargar el mapa
  shouldLoadMap?: boolean;
  placeholder?: React.ReactNode;
}

// 🚀 Opciones del mapa optimizadas para reducir requests
const optimizedMapOptions: google.maps.MapOptions = {
  styles: [
    // Tema oscuro personalizado (sin requests adicionales)
    { featureType: "all", elementType: "geometry", stylers: [{ color: "#2c3e50" }] },
    { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#ecf0f1" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#34495e" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#1e3a8a" }] }
  ],
  // 🚀 Configuraciones que reducen requests automáticos
  gestureHandling: 'greedy',
  disableDoubleClickZoom: false,
  zoomControl: true,
  fullscreenControl: false, // Reduce requests
  streetViewControl: false, // Reduce requests
  mapTypeControl: false, // Reduce requests
  scaleControl: false, // Reduce requests
  rotateControl: false, // Reduce requests
  clickableIcons: false, // ⚠️ IMPORTANTE: evita requests automáticos al hacer click en POIs
  // 🚀 Configuraciones de performance
  tilt: 0,
  keyboardShortcuts: false,
  backgroundColor: '#2c3e50',
  // Deshabilitar cargas automáticas de datos
  restriction: {
    latLngBounds: {
      north: 12.5,
      south: -4.2,
      west: -81.7,
      east: -66.9
    }, // Limitar a Colombia para evitar requests innecesarios
    strictBounds: false
  }
};

// 🚀 Componente optimizado de mapa con lazy loading
export const OptimizedMap = memo<OptimizedMapProps>(({
  center = { lat: 3.4516, lng: -76.5319 }, // Cali por defecto
  markers = [],
  directions,
  optimizedRoute,
  onMapClick,
  onLoad,
  height = '400px',
  width = '100%',
  zoom = 12,
  showTraffic = false,
  shouldLoadMap = true,
  placeholder
}) => {
  const { isLoaded, loadError } = useMaps();
  const [polylinePath, setPolylinePath] = useState<LatLng[]>([]);
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);

  // 🚀 Efecto para decodificar polyline optimizado y centrar el mapa
  useEffect(() => {
    console.log('🔍 OptimizedRoute recibido:', optimizedRoute);
    if (optimizedRoute?.polyline) {
      console.log('🔍 Polyline a decodificar:', optimizedRoute.polyline);
      try {
        // 🚀 Usar nuestra utilidad de decodificación
        const decodedPath = decodePolyline(optimizedRoute.polyline);
        setPolylinePath(decodedPath);
        console.log('✅ Polyline decodificado:', decodedPath.length, 'puntos');
        console.log('🔍 Primeros 3 puntos:', decodedPath.slice(0, 3));
        
        // 🎯 Centrar el mapa automáticamente en la ruta
        if (decodedPath.length > 0) {
          // Calcular el centro de la ruta
          const bounds = {
            north: Math.max(...decodedPath.map(p => p.lat)),
            south: Math.min(...decodedPath.map(p => p.lat)),
            east: Math.max(...decodedPath.map(p => p.lng)),
            west: Math.min(...decodedPath.map(p => p.lng))
          };
          
          const routeCenter = {
            lat: (bounds.north + bounds.south) / 2,
            lng: (bounds.east + bounds.west) / 2
          };
          
          setMapCenter(routeCenter);
          setMapZoom(12); // Zoom apropiado para ver toda la ruta
          console.log('🎯 Mapa centrado en:', routeCenter);
        }
      } catch (error) {
        console.error('❌ Error decodificando polyline:', error);
      }
    } else {
      console.log('⚠️ No hay polyline en optimizedRoute');
    }
  }, [optimizedRoute]);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    // 🚀 Configuraciones adicionales para reducir requests
    if (showTraffic) {
      const trafficLayer = new google.maps.TrafficLayer();
      trafficLayer.setMap(map);
    }
    
    onLoad?.(map);
  }, [onLoad, showTraffic]);

  // 🚀 Mostrar placeholder en lugar de cargar el mapa inmediatamente
  if (!shouldLoadMap) {
    return (
      <div 
        style={{ 
          width, 
          height, 
          background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          cursor: 'pointer'
        }}
        onClick={() => {/* Activar carga del mapa cuando el usuario haga click */}}
      >
        {placeholder || (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗺️</div>
            <div>Toca para cargar el mapa</div>
          </div>
        )}
      </div>
    );
  }

  // Estados de carga y error
  if (!isLoaded) {
    return (
      <div style={{ width, height }}>
        <SmartLoader text="Cargando mapa..." size="lg" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div 
        style={{ 
          width, 
          height, 
          background: '#ff6b6b',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}
      >
        Error cargando el mapa
      </div>
    );
  }

  return (
    <Suspense fallback={<SmartLoader text="Inicializando mapa..." />}>
      <LazyGoogleMap
        mapContainerStyle={{ width, height, borderRadius: '12px' }}
        center={mapCenter}
        zoom={mapZoom}
        onLoad={handleMapLoad}
        onClick={onMapClick}
        options={optimizedMapOptions}
      >
        {/* Marcadores regulares */}
        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={marker.position}
            title={marker.title}
            icon={marker.icon}
          />
        ))}

        {/* 🚀 Ruta optimizada y sus marcadores */}
        {optimizedRoute && polylinePath.length > 1 && (
          <>
            {/* Polyline de la ruta */}
            <Polyline
              path={polylinePath}
              options={{
                strokeColor: '#00ff9d',
                strokeWeight: 4,
                strokeOpacity: 0.8,
                zIndex: 100
              }}
            />
            
            {/* 🟢 Marcador de ORIGEN */}
            <Marker
              position={polylinePath[0]}
              title={`Origen: ${optimizedRoute.startAddress}`}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: '#4CAF50',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 3,
              }}
            />
            
            {/* 🔴 Marcador de DESTINO */}
            <Marker
              position={polylinePath[polylinePath.length - 1]}
              title={`Destino: ${optimizedRoute.endAddress}`}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: '#F44336',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 3,
              }}
            />
          </>
        )}

        {/* Direcciones estándar de Google Maps (fallback) */}
        {directions && !optimizedRoute && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: false,
              polylineOptions: {
                strokeColor: '#00ff9d',
                strokeWeight: 4,
                strokeOpacity: 0.8,
                zIndex: 100
              },
              suppressInfoWindows: true
            }}
          />
        )}
      </LazyGoogleMap>
    </Suspense>
  );
});

OptimizedMap.displayName = 'OptimizedMap';

// 🚀 Componente para mostrar mapas solo cuando es necesario
interface ConditionalMapProps extends OptimizedMapProps {
  triggerLoad?: boolean;
  loadButtonText?: string;
}

export const ConditionalMap = memo<ConditionalMapProps>(({
  triggerLoad = false,
  loadButtonText = "Cargar mapa",
  ...mapProps
}) => {
  const [shouldLoad, setShouldLoad] = useState(triggerLoad);

  if (!shouldLoad) {
    return (
      <div 
        style={{ 
          width: mapProps.width || '100%', 
          height: mapProps.height || '400px',
          background: 'linear-gradient(135deg, rgba(0, 255, 157, 0.1) 0%, rgba(0, 0, 0, 0.1) 100%)',
          border: '2px dashed rgba(0, 255, 157, 0.3)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={() => setShouldLoad(true)}
      >
        <div style={{ fontSize: '3rem' }}>🗺️</div>
        <button 
          style={{
            background: 'linear-gradient(45deg, #00ff9d, #00cc7a)',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            color: 'black',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {loadButtonText}
        </button>
        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
          💡 Ahorra datos cargando solo cuando necesites el mapa
        </div>
      </div>
    );
  }

  return <OptimizedMap {...mapProps} shouldLoadMap={true} />;
});

ConditionalMap.displayName = 'ConditionalMap';
