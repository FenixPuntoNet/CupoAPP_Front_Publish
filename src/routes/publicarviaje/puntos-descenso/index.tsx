import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { createFileRoute } from '@tanstack/react-router';
import { ArrowLeft, Search, ArrowRight } from 'lucide-react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useMaps } from '@/components/GoogleMapsProvider';
import { searchNearbySafePointsAdvanced, type SafePoint } from '@/services/safepoints';
import { useNoSafePointOption } from '@/hooks/useNoSafePoint';
import styles from './index.module.css';

interface SearchParams {
  selectedAddress?: string;
  selectedDestination?: string;
  pickupSafePointId?: string;
}

function PuntosDescensoView() {
  const navigate = useNavigate();
    const { selectedAddress = '', selectedDestination = '', pickupSafePointId = '' } = useSearch({ from: '/publicarviaje/puntos-descenso/' }) as SearchParams;
  const { isLoaded, loadError } = useMaps();
  
  // Estados principales
  const [safePoints, setSafePoints] = useState<SafePoint[]>([]);
  const [filteredSafePoints, setFilteredSafePoints] = useState<SafePoint[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SafePoint[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados del mapa
  const [mapCenter, setMapCenter] = useState({ lat: 3.4516, lng: -76.5320 }); // Cali por defecto
  const [lastLoadCenter, setLastLoadCenter] = useState({ lat: 3.4516, lng: -76.5320 });
  const [showCustomMarker, setShowCustomMarker] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [reloadTimeout, setReloadTimeout] = useState<NodeJS.Timeout | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Opción "Sin SafePoint"
  const noSafePointOption = useNoSafePointOption();

  // Configuración del mapa (estilo oscuro para coincidir con la imagen)
  const mapOptions: google.maps.MapOptions = {
    styles: [
      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
      {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
      },
      {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
      },
      {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#263c3f" }],
      },
      {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b9a76" }],
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#38414e" }],
      },
      {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#212a37" }],
      },
      {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9ca5b3" }],
      },
      {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#746855" }],
      },
      {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1f2835" }],
      },
      {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#f3d19c" }],
      },
      {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#2f3948" }],
      },
      {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#17263c" }],
      },
      {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#515c6d" }],
      },
      {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#17263c" }],
      },
    ],
    disableDefaultUI: true,
    zoomControl: false,
    gestureHandling: 'greedy',
  };

  // Función para calcular distancia entre dos puntos
  const calculateDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Cargar SafePoints cercanos usando el endpoint real del backend - OPTIMIZADO
  useEffect(() => {
    // Cancelar timeout anterior si existe
    if (reloadTimeout) {
      clearTimeout(reloadTimeout);
    }

    // Solo recargar en carga inicial o si el usuario se movió MÁS de 5km
    const distance = isInitialLoad ? Infinity : calculateDistance(mapCenter, lastLoadCenter);
    const shouldReload = isInitialLoad || (distance > 5); // 5km threshold - mucho más conservador
    
    if (!shouldReload) {
      console.log(`🚫 NO recargando SafePoints descenso - distancia: ${distance.toFixed(2)}km (umbral: 5km)`);
      return;
    }

    // Implementar debounce de 1.5 segundos para evitar recargas excesivas
    const timeoutId = setTimeout(async () => {
      console.log(`🔄 Recargando SafePoints descenso - distancia: ${distance.toFixed(2)}km`);
      
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔍 Cargando SafePoints para punto de descenso en:', mapCenter);

        // Usar el endpoint search-advanced del backend para obtener SafePoints cerca del centro del mapa
        const result = await searchNearbySafePointsAdvanced({
          latitude: mapCenter.lat,
          longitude: mapCenter.lng,
          radius_km: 15, // Radio más amplio para reducir recargas
          limit: 100, // Más SafePoints para cubrir área mayor
          include_sin_safepoint: true,
          sort_by: 'distance',
          exclude_categories: ['sin_safepoint']
        });

        if (result.success && result.safepoints.length > 0) {
          console.log('✅ SafePoints descenso cargados exitosamente:', {
            count: result.safepoints.length,
            total_found: result.total_found,
            has_more: result.has_more
          });

          // Filtrar solo categorías relevantes para punto de descenso
          const relevantSafePoints = result.safepoints.filter((sp: SafePoint) => 
            ['metro_station', 'mall', 'university', 'bank', 'park', 'hospital', 'government', 'gas_station'].includes(sp.category)
          );

          setSafePoints(relevantSafePoints);
          setLastLoadCenter(mapCenter); // Guardar posición donde se cargaron los datos
          setIsInitialLoad(false); // Ya no es carga inicial
          
          if (relevantSafePoints.length === 0) {
            setError('No se encontraron puntos de descenso cercanos en esta área');
          }
        } else {
          console.warn('⚠️ No se encontraron SafePoints descenso:', result.error);
          setError(result.error || 'No se encontraron puntos de descenso cercanos');
          setSafePoints([]);
        }
      } catch (err) {
        console.error('❌ Error loading SafePoints descenso:', err);
        setError('Error cargando puntos de descenso. Verifica tu conexión.');
        setSafePoints([]);
      } finally {
        setIsLoading(false);
      }
    }, 1500); // Debounce de 1.5 segundos

    setReloadTimeout(timeoutId);

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [mapCenter]); // Solo depender de mapCenter para evitar loops

  // Filtrar SafePoints basado en el término de búsqueda - MEJORADO
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSafePoints(safePoints);
      setSearchResults([]);
      setShowSearchDropdown(false);
    } else {
      // Búsqueda más inteligente con scoring mejorado
      const searchLower = searchTerm.toLowerCase().trim();
      const searchWords = searchLower.split(' ').filter(word => word.length > 0);
      
      const scored = safePoints.map(safePoint => {
        let score = 0;
        const name = safePoint.name.toLowerCase();
        const address = safePoint.address.toLowerCase();
        const city = safePoint.city?.toLowerCase() || '';
        const fullText = `${name} ${address} ${city}`;
        
        // Coincidencia exacta del término completo (máxima prioridad)
        if (fullText.includes(searchLower)) {
          score += 150;
        }
        
        // Puntuación por coincidencia exacta en nombre
        if (name.includes(searchLower)) {
          score += name.startsWith(searchLower) ? 120 : 80;
        }
        
        // Puntuación por coincidencia en dirección
        if (address.includes(searchLower)) {
          score += address.startsWith(searchLower) ? 100 : 60;
        }
        
        // Puntuación por coincidencia en ciudad
        if (city.includes(searchLower)) {
          score += city.startsWith(searchLower) ? 80 : 40;
        }
        
        // Coincidencias por palabras individuales
        searchWords.forEach(word => {
          if (word.length < 2) return; // Ignorar palabras muy cortas
          
          if (name.includes(word)) {
            score += name.startsWith(word) ? 50 : 30;
          }
          if (address.includes(word)) {
            score += address.startsWith(word) ? 40 : 25;
          }
          if (city.includes(word)) {
            score += city.startsWith(word) ? 35 : 20;
          }
        });
        
        // Bonus por categorías populares para descenso
        if (['metro_station', 'mall', 'university'].includes(safePoint.category)) {
          score += 10;
        }
        
        return { ...safePoint, score };
      }).filter(sp => sp.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8); // Máximo 8 resultados en dropdown

      setSearchResults(scored);
      setFilteredSafePoints(scored);
      setShowSearchDropdown(scored.length > 0);
      
      console.log(`🔍 Búsqueda inteligente descenso "${searchTerm}": ${scored.length} resultados ordenados por relevancia`);
    }
  }, [searchTerm, safePoints]);

  // Manejar click en el mapa para ubicaciones personalizadas con navegación directa
  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    // Solo permitir click personalizado si el modo está activado
    if (!showCustomMarker || !event.latLng) {
      return;
    }
    
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    console.log('🎯 Usuario seleccionó ubicación personalizada de descenso:', { lat, lng });
    
    // Navegar automáticamente con ubicación personalizada
    navigate({
      to: '/publicarviaje/rutas',
      search: { 
        selectedAddress, 
        selectedDestination,
        pickupSafePointId,
        dropoffSafePointId: '0', // 0 indica ubicación personalizada
        customDropoffLat: lat.toString(),
        customDropoffLng: lng.toString()
      }
    });
  };

  // Manejar cuando el mapa se mueve - MUCHO MAS CONSERVADOR
  const handleMapIdle = useCallback(() => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      const zoom = mapRef.current.getZoom();
      
      if (center && zoom !== undefined) {
        const newCenter = { 
          lat: center.lat(), 
          lng: center.lng() 
        };
        
        // Solo actualizar si se movió MÁS de 3km para evitar recargas constantes
        const distance = Math.sqrt(
          Math.pow((newCenter.lat - mapCenter.lat) * 111320, 2) + 
          Math.pow((newCenter.lng - mapCenter.lng) * 111320, 2)
        );
        
        if (distance > 3000) { // 3000 metros (3km) - umbral mucho mayor
          console.log(`🗺️ Mapa descenso se movió SIGNIFICATIVAMENTE (${(distance/1000).toFixed(1)}km), actualizando centro`);
          setMapCenter(newCenter);
        } else {
          console.log(`🔒 Movimiento menor descenso (${(distance/1000).toFixed(1)}km) - NO actualizando centro`);
        }
      }
    }
  }, [mapCenter]);

  // Manejar selección desde el mapa con navegación directa
  const handleSafePointSelect = (safePoint: SafePoint) => {
    console.log('✅ SafePoint de descenso seleccionado:', safePoint.name);
    
    // Navegar automáticamente con el SafePoint seleccionado
    navigate({
      to: '/publicarviaje/rutas',
      search: { 
        selectedAddress, 
        selectedDestination,
        pickupSafePointId,
        dropoffSafePointId: safePoint.id.toString()
      }
    });
  };

  // Manejar selección de "Sin SafePoint" con navegación directa
  const handleNoSafePointSelect = () => {
    // Navegar automáticamente
    navigate({
      to: '/publicarviaje/rutas',
      search: { 
        selectedAddress, 
        selectedDestination,
        pickupSafePointId,
        dropoffSafePointId: '0' // 0 indica "Sin SafePoint"
      }
    });
  };

  // Manejar selección desde el dropdown de búsqueda con navegación directa
  const handleSearchSelect = (safePoint: SafePoint) => {
    console.log('📍 SafePoint de descenso seleccionado desde búsqueda:', safePoint.name);
    
    // Navegar automáticamente con el SafePoint seleccionado
    navigate({
      to: '/publicarviaje/rutas',
      search: { 
        selectedAddress, 
        selectedDestination,
        pickupSafePointId,
        dropoffSafePointId: safePoint.id.toString()
      }
    });
  };

  // Manejar foco y pérdida de foco en el input de búsqueda
  const handleSearchFocus = () => {
    if (searchResults.length > 0) {
      setShowSearchDropdown(true);
    }
  };

  const handleSearchBlur = () => {
    // Retrasar el cierre para permitir clicks en el dropdown
    setTimeout(() => {
      setShowSearchDropdown(false);
    }, 200);
  };

  // Renderizar error de carga de Google Maps
  if (loadError) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          Error cargando Google Maps. Por favor, recarga la página.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => navigate({ 
            to: '/publicarviaje/Destino', 
            search: { originAddress: selectedAddress, pickupSafePointId } 
          })}
        >
          <ArrowLeft size={20} />
        </button>
      </header>

      {/* Title Section */}
      <div className={styles.titleSection}>
        <h1 className={styles.mainTitle}>¿Dónde te gustaría dejar a los pasajeros?</h1>
        <p className={styles.subtitle}>Selecciona un SafePoint cercano o deja que usen la ubicación exacta</p>
      </div>

      {/* Search Section */}
      <div className={styles.searchSection}>
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, dirección o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            className={styles.searchInput}
          />
        </div>
        
        {/* Dropdown de resultados de búsqueda */}
        {showSearchDropdown && searchResults.length > 0 && (
          <div className={styles.searchDropdown}>
            {searchResults.map((safePoint) => (
              <div
                key={safePoint.id}
                className={styles.searchResultItem}
                onClick={() => handleSearchSelect(safePoint)}
              >
                <div className={styles.searchResultIcon}>
                  {safePoint.category === 'metro_station' && '🚇'}
                  {safePoint.category === 'mall' && '🏬'}
                  {safePoint.category === 'university' && '🎓'}
                  {safePoint.category === 'hospital' && '🏥'}
                  {safePoint.category === 'bank' && '🏦'}
                  {safePoint.category === 'park' && '🌳'}
                  {safePoint.category === 'government' && '🏛️'}
                  {safePoint.category === 'gas_station' && '⛽'}
                  {!['metro_station', 'mall', 'university', 'hospital', 'bank', 'park', 'government', 'gas_station'].includes(safePoint.category) && '📍'}
                </div>
                <div className={styles.searchResultContent}>
                  <div className={styles.searchResultName}>
                    {safePoint.name}
                  </div>
                  <div className={styles.searchResultAddress}>
                    {safePoint.address}
                    {safePoint.city && `, ${safePoint.city}`}
                  </div>
                </div>
                <div className={styles.searchResultDistance}>
                  {/* Calcular distancia desde el centro del mapa */}
                  {Math.round(calculateDistance(
                    { lat: safePoint.latitude, lng: safePoint.longitude },
                    mapCenter
                  ) * 1000)}m
                </div>
              </div>
            ))}
          </div>
        )}
        
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
        
        {/* Contador de resultados */}
        {searchTerm.trim() && !showSearchDropdown && (
          <div className={styles.searchResults}>
            {filteredSafePoints.length > 0 ? (
              <span className={styles.searchResultsText}>
                {filteredSafePoints.length} punto{filteredSafePoints.length !== 1 ? 's' : ''} encontrado{filteredSafePoints.length !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className={styles.searchResultsText} style={{ color: '#ff6b6b' }}>
                No se encontraron puntos para "{searchTerm}"
              </span>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
          <span className={styles.loadingText}>Cargando puntos de descenso...</span>
        </div>
      )}

      {/* Map Container */}
      {!isLoading && (
        <div className={styles.mapContainer}>
          {/* Botón flotante para marcador personalizado */}
          <button 
            className={`${styles.customMarkerButton} ${showCustomMarker ? styles.active : ''}`}
            onClick={() => {
              setShowCustomMarker(!showCustomMarker);
            }}
            title={showCustomMarker ? "Desactivar marcador personalizado" : "Activar marcador personalizado"}
          >
            📍 {showCustomMarker ? "Cancelar ubicación personalizada" : "Marcar ubicación personalizada"}
          </button>
          
          {isLoaded && (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              options={mapOptions}
              center={mapCenter}
              zoom={12}
              onLoad={(map: google.maps.Map) => {
                mapRef.current = map;
              }}
              onClick={handleMapClick}
              onIdle={handleMapIdle}
            >
              {/* Marcadores de SafePoints con el icono azul de copo de nieve */}
              {filteredSafePoints.map((safePoint) => (
                <Marker
                  key={safePoint.id}
                  position={{ lat: safePoint.latitude, lng: safePoint.longitude }}
                  icon={{
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="14" fill="#4A90E2" stroke="white" stroke-width="2"/>
                        <g transform="translate(8, 8)" fill="white">
                          <path d="M8 2L8 14M2 8L14 8M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                          <circle cx="8" cy="8" r="2" fill="white"/>
                        </g>
                      </svg>
                    `),
                    scaledSize: new google.maps.Size(32, 32),
                    anchor: new google.maps.Point(16, 16),
                  }}
                  onClick={() => handleSafePointSelect(safePoint)}
                />
              ))}
            </GoogleMap>
          )}
        </div>
      )}

      {/* No SafePoint Option */}
      <div className={styles.noSafePointSection}>
        <button 
          className={styles.noSafePointButton}
          onClick={handleNoSafePointSelect}
        >
          <span className={styles.noSafePointIcon}>🚫</span>
          <div className={styles.noSafePointText}>
            <h3>{noSafePointOption.name}</h3>
            <p>Usar ubicación exacta del destino</p>
          </div>
          <div className={styles.navigationArrow}>
            <ArrowRight size={20} />
          </div>
        </button>
      </div>

    </div>
  );
}

export const Route = createFileRoute('/publicarviaje/puntos-descenso/')({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    selectedAddress: search.selectedAddress as string | undefined,
    selectedDestination: search.selectedDestination as string | undefined,
    pickupSafePointId: search.pickupSafePointId as string | undefined,
  }),
  component: PuntosDescensoView,
});

export default PuntosDescensoView;