import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { createFileRoute } from '@tanstack/react-router';
import { ArrowLeft, Search, Check, ChevronRight } from 'lucide-react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useMaps } from '@/components/GoogleMapsProvider';
import { useOptimizedMaps } from '@/hooks/useOptimizedMaps';
import { geocodeAddress } from '@/services/geocoding';
import { searchNearbySafePointsAdvanced, type SafePoint } from '@/services/safepoints';
import { useNoSafePointOption } from '@/hooks/useNoSafePoint';
import { useMapNavigation } from '@/hooks/useMapNavigation';
import { saveSafePointInteraction } from '@/services/safepoint-interactions';
import styles from './index.module.css';

interface SearchParams {
  selectedAddress?: string;
}

function PuntoRecogidaView() {
  const navigate = useNavigate();
  const { selectedAddress = '' } = useSearch({ from: '/publicarviaje/punto-recogida/' }) as SearchParams;
  const { isLoaded, loadError } = useMaps();
  const { searchPlaces } = useOptimizedMaps();

  // Estados principales
  const [safePoints, setSafePoints] = useState<SafePoint[]>([]);
  const [filteredSafePoints, setFilteredSafePoints] = useState<SafePoint[]>([]);
  const [selectedSafePoints, setSelectedSafePoints] = useState<SafePoint[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SafePoint[]>([]);
  const [placesResults, setPlacesResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hook de navegación del mapa - usa la dirección del origen para centrar el mapa
  const { mapCenter, setMapCenter } = useMapNavigation({
    address: selectedAddress,
    isLoaded
  });

  console.log('🗺️ [PUNTO_RECOGIDA] MapCenter actual:', mapCenter);
  console.log('📍 [PUNTO_RECOGIDA] Dirección origen:', selectedAddress);

  // Estados del mapa
  const [customLocation, setCustomLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [originMarker, setOriginMarker] = useState<{ lat: number, lng: number, address?: string } | null>(null);
  const [originInfoOpen, setOriginInfoOpen] = useState(false);
  const [lastLoadCenter, setLastLoadCenter] = useState({ lat: 3.4516, lng: -76.5320 });
  const [showCustomMarker, setShowCustomMarker] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [reloadTimeout, setReloadTimeout] = useState<NodeJS.Timeout | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const lastOriginAddressRef = useRef<string>('');

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
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
      console.log(`🚫 NO recargando SafePoints - distancia: ${distance.toFixed(2)}km (umbral: 5km)`);
      return;
    }

    // Implementar debounce de 1.5 segundos para evitar recargas excesivas
    const timeoutId = setTimeout(async () => {
      console.log(`🔄 Recargando SafePoints - distancia: ${distance.toFixed(2)}km`);

      try {
        setIsLoading(true);
        setError(null);

        console.log('🔍 Cargando SafePoints para punto de recogida en:', mapCenter);

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
          console.log('✅ SafePoints cargados exitosamente:', {
            count: result.safepoints.length,
            total_found: result.total_found,
            has_more: result.has_more
          });

          // Filtrar solo categorías relevantes para punto de recogida
          const relevantSafePoints = result.safepoints.filter(sp =>
            ['metro_station', 'mall', 'university', 'bank', 'park', 'hospital', 'government', 'gas_station'].includes(sp.category)
          );

          setSafePoints(relevantSafePoints);
          setLastLoadCenter(mapCenter); // Guardar posición donde se cargaron los datos
          setIsInitialLoad(false); // Ya no es carga inicial

          if (relevantSafePoints.length === 0) {
            setError('No se encontraron puntos de recogida cercanos en esta área');
          }
        } else {
          console.warn('⚠️ No se encontraron SafePoints:', result.error);
          setError(result.error || 'No se encontraron puntos de recogida cercanos');
          setSafePoints([]);
        }
      } catch (err) {
        console.error('❌ Error loading SafePoints:', err);
        setError('Error cargando puntos de recogida. Verifica tu conexión.');
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

  // Búsqueda combinada: SafePoints + Google Places con debounce
  useEffect(() => {
    // Limpiar timeout anterior
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (!searchTerm.trim()) {
      setFilteredSafePoints(safePoints);
      setSearchResults([]);
      setPlacesResults([]);
      setShowSearchDropdown(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setError(null);

    // Debounce de 500ms para búsqueda
    searchTimeout.current = setTimeout(async () => {
      try {
        // 1. Búsqueda en SafePoints locales (más inteligente)
        const searchLower = searchTerm.toLowerCase().trim();
        const searchWords = searchLower.split(' ').filter(word => word.length > 0);

        const scoredSafePoints = safePoints.map(safePoint => {
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
            if (word.length < 2) return;

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

          // Bonus por categorías populares
          if (['metro_station', 'mall', 'university'].includes(safePoint.category)) {
            score += 10;
          }

          return { ...safePoint, score };
        }).filter(sp => sp.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5); // Máximo 5 SafePoints

        // 2. Búsqueda en Google Places (lugares generales)
        let placesResults: any[] = [];
        if (searchPlaces) {
          try {
            const suggestions = await searchPlaces(searchTerm);
            placesResults = suggestions.slice(0, 3); // Máximo 3 lugares de Google
          } catch (error) {
            console.warn('Error en búsqueda de Google Places:', error);
          }
        }

        // 3. Combinar resultados
        setSearchResults(scoredSafePoints);
        setPlacesResults(placesResults);
        setFilteredSafePoints(scoredSafePoints);
        setShowSearchDropdown(true); // SIEMPRE MOSTRAR SI HAY BÚSQUEDA

        console.log(`🔍 Búsqueda "${searchTerm}":`, {
          safePointsFound: scoredSafePoints.length,
          placesFound: placesResults.length,
          showDropdown: true,
          totalSafePoints: safePoints.length
        });

      } catch (err) {
        console.error('Error en búsqueda:', err);
        setError('Error al buscar ubicaciones');
        setSearchResults([]);
        setPlacesResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    // Cleanup function
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm, safePoints, searchPlaces]);

  // Manejar click en el mapa para ubicaciones personalizadas
  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    // Solo permitir click personalizado si el modo está activado
    if (!showCustomMarker || !event.latLng) {
      return;
    }

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    console.log('🎯 Usuario seleccionó ubicación personalizada:', { lat, lng });

    // Establecer ubicación personalizada y limpiar selección de SafePoints
    setCustomLocation({ lat, lng });
    setSelectedSafePoints([]);
    setShowCustomMarker(false); // Desactivar modo después de seleccionar

    // Centrar el mapa en la nueva ubicación
    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng });
    }
    // Clear detected origin marker when user manually picks a custom location
    setOriginMarker(null);
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
          console.log(`🗺️ Mapa se movió SIGNIFICATIVAMENTE (${(distance / 1000).toFixed(1)}km), actualizando centro`);
          setMapCenter(newCenter);
        } else {
          console.log(`🔒 Movimiento menor (${(distance / 1000).toFixed(1)}km) - NO actualizando centro`);
        }
      }
    }
  }, [mapCenter]);

  // Manejar selección desde el mapa - permitir selección múltiple
  const handleSafePointSelect = (safePoint: SafePoint) => {
    console.log('✅ SafePoint seleccionado:', safePoint.name);

    // Verificar si ya está seleccionado
    const isAlreadySelected = selectedSafePoints.find(sp => sp.id === safePoint.id);

    if (isAlreadySelected) {
      // Quitar de la selección
      setSelectedSafePoints(prev => prev.filter(sp => sp.id !== safePoint.id));
      console.log('❌ SafePoint deseleccionado:', safePoint.name);
    } else {
      // Agregar a la selección
      setSelectedSafePoints(prev => [...prev, safePoint]);
      console.log('✅ SafePoint agregado a selección. Total:', selectedSafePoints.length + 1);
    }

    setCustomLocation(null); // Limpiar ubicación personalizada
    // Clear detected origin marker when user selects a SafePoint
    setOriginMarker(null);

    // Centrar el mapa en el SafePoint seleccionado
    if (mapRef.current) {
      const center = { lat: safePoint.latitude, lng: safePoint.longitude };
      mapRef.current.panTo(center);
      mapRef.current.setZoom(16);
    }
    // Also ensure origin marker is cleared when user explicitly selects a safepoint
    setOriginMarker(null);
  };

  // When an origin address is provided (from Origen view), geocode it locally and show a marker
  useEffect(() => {
    let mounted = true;

    const showOriginMarkerFromAddress = async () => {
      // If there is no selectedAddress, clear any existing origin marker
      if (!selectedAddress) {
        lastOriginAddressRef.current = '';
        setOriginMarker(null);
        setOriginInfoOpen(false);
        return;
      }

      // Avoid repeating work for the same address
      if (lastOriginAddressRef.current === selectedAddress) return;

      // Ensure Google Maps is loaded for geocoding; geocodeAddress already handles fallback
      if (!isLoaded) return;

      try {
        // Attempt to geocode the address here to get precise coordinates
        const result = await geocodeAddress(selectedAddress);
        console.log('🧭 [PICKUP] geocodeAddress result:', result, 'isLoaded:', isLoaded, 'mapRef:', !!mapRef.current);

        if (!mounted) return;

        if (result) {
          const newMarker = { lat: result.lat, lng: result.lng, address: result.address };
          // Update canonical map center so GoogleMap `center` prop follows
          setMapCenter({ lat: newMarker.lat, lng: newMarker.lng });
          setOriginMarker(newMarker);
          setOriginInfoOpen(true);
          lastOriginAddressRef.current = selectedAddress;

          // Also attempt to pan/zoom if map instance available
          if (mapRef.current) {
            try {
              mapRef.current.panTo({ lat: newMarker.lat, lng: newMarker.lng });
              mapRef.current.setZoom(17);
            } catch (e) {
              console.warn('⚠️ [PICKUP] panTo/setZoom failed:', e);
            }
          }
        } else {
          // If geocoding failed, fallback to the current mapCenter
          const fallback = { lat: mapCenter.lat, lng: mapCenter.lng, address: selectedAddress };
          setMapCenter({ lat: fallback.lat, lng: fallback.lng });
          setOriginMarker(fallback);
          setOriginInfoOpen(true);
          lastOriginAddressRef.current = selectedAddress;
          if (mapRef.current) {
            try {
              mapRef.current.panTo({ lat: fallback.lat, lng: fallback.lng });
              mapRef.current.setZoom(17);
            } catch (e) {
              console.warn('⚠️ [PICKUP] panTo/setZoom failed for fallback:', e);
            }
          }
        }
      } catch (err) {
        console.error('Error geocoding origin address in pickup view:', err);
      }
    };

    showOriginMarkerFromAddress();

    return () => { mounted = false; };
  }, [selectedAddress, isLoaded, mapCenter]);

  // Manejar selección de "Sin SafePoint" con navegación directa
  const handleNoSafePointSelect = async () => {
    setSelectedSafePoints([]);
    setCustomLocation(null);

    // Guardar interacción de "Sin SafePoint"
    console.log('💾 [PICKUP] Guardando interacción "Sin SafePoint"');
    const interactionResult = await saveSafePointInteraction({
      safepoint_id: 0, // 0 para "Sin SafePoint"
      interaction_type: 'pickup_selection',
      trip_id: null,
      interaction_data: {
        no_safepoint_selection: true,
        selected_address: selectedAddress,
        selection_timestamp: new Date().toISOString(),
        map_center: mapCenter,
        selection_method: 'no_safepoint_option'
      }
    });

    if (interactionResult.success) {
      console.log('✅ [PICKUP] Interacción "Sin SafePoint" guardada exitosamente');
    } else {
      console.error('❌ [PICKUP] Error guardando interacción "Sin SafePoint":', interactionResult.error);
    }

    // Navegar automáticamente
    navigate({
      to: '/publicarviaje/Destino',
      search: {
        originAddress: selectedAddress,
        pickupSafePointId: '0' // 0 indica "Sin SafePoint"
      }
    });
  };

  // Navegación directa para SafePoints seleccionados
  const handleNavigateWithSelection = async () => {
    if (selectedSafePoints.length > 0) {
      const primarySafePoint = selectedSafePoints[0];

      // Guardar TODOS los SafePoints seleccionados, no solo el primero
      console.log(`💾 [PICKUP] Guardando ${selectedSafePoints.length} SafePoint(s) seleccionado(s)`);

      const interactionPromises = selectedSafePoints.map((safePoint, index) => {
        console.log(`💾 [PICKUP] Guardando SafePoint ${index + 1}/${selectedSafePoints.length}:`, safePoint.name);

        return saveSafePointInteraction({
          safepoint_id: safePoint.id,
          interaction_type: 'pickup_selection',
          trip_id: null, // Se actualizará cuando se cree el trip
          interaction_data: {
            safepoint_name: safePoint.name,
            safepoint_address: safePoint.address,
            selected_address: selectedAddress,
            selection_timestamp: new Date().toISOString(),
            map_center: mapCenter,
            selection_method: 'map_selection',
            selection_order: index + 1, // Agregar orden de selección
            total_selected: selectedSafePoints.length, // Agregar total seleccionado
            is_primary: index === 0 // Marcar el primero como principal
          }
        });
      });

      // Esperar a que se guarden todos los SafePoints
      try {
        const results = await Promise.all(interactionPromises);
        const successCount = results.filter(r => r.success).length;
        const errorCount = results.length - successCount;

        console.log(`✅ [PICKUP] ${successCount} SafePoint(s) guardado(s) exitosamente`);
        if (errorCount > 0) {
          console.error(`❌ [PICKUP] ${errorCount} error(es) guardando SafePoints`);
        }

        // Mostrar detalles de cada resultado
        results.forEach((result, index) => {
          const safePoint = selectedSafePoints[index];
          if (result.success) {
            console.log(`✅ [PICKUP] SafePoint "${safePoint.name}" guardado con ID:`, result.interaction?.id);
          } else {
            console.error(`❌ [PICKUP] Error guardando "${safePoint.name}":`, result.error);
          }
        });

      } catch (error) {
        console.error('❌ [PICKUP] Error guardando múltiples SafePoints:', error);
      }

      navigate({
        to: '/publicarviaje/Destino',
        search: {
          originAddress: selectedAddress,
          pickupSafePointId: primarySafePoint.id.toString()
        }
      });
    } else if (customLocation) {
      // Guardar interacción de ubicación personalizada
      console.log('💾 [PICKUP] Guardando interacción de ubicación personalizada');
      const interactionResult = await saveSafePointInteraction({
        safepoint_id: 0, // 0 para ubicación personalizada
        interaction_type: 'pickup_selection',
        trip_id: null,
        interaction_data: {
          custom_location: customLocation,
          selected_address: selectedAddress,
          selection_timestamp: new Date().toISOString(),
          map_center: mapCenter,
          selection_method: 'custom_location'
        }
      });

      if (interactionResult.success) {
        console.log('✅ [PICKUP] Interacción de ubicación personalizada guardada');
      } else {
        console.error('❌ [PICKUP] Error guardando interacción personalizada:', interactionResult.error);
      }

      navigate({
        to: '/publicarviaje/Destino',
        search: {
          originAddress: selectedAddress,
          pickupSafePointId: '0' // 0 indica ubicación personalizada
        }
      });
    }
  };

  // Manejar selección de lugares de Google Places
  const handlePlaceSelect = (place: any) => {
    console.log('🌍 Lugar de Google seleccionado:', place.mainText);

    // Crear ubicación personalizada a partir del lugar de Google
    // Nota: Aquí podrías hacer geocoding para obtener lat/lng exactas
    setCustomLocation({ lat: mapCenter.lat, lng: mapCenter.lng }); // Usar centro del mapa temporalmente
    setSelectedSafePoints([]);

    // Limpiar búsqueda y cerrar dropdown
    setSearchTerm('');
    setShowSearchDropdown(false);
    setPlacesResults([]);

    // Navegar automáticamente
    navigate({
      to: '/publicarviaje/Destino',
      search: {
        originAddress: selectedAddress,
        pickupSafePointId: '0' // 0 indica ubicación personalizada
      }
    });
  };

  // Manejar selección desde el dropdown de búsqueda
  const handleSearchSelect = (safePoint: SafePoint) => {
    console.log('📍 SafePoint seleccionado desde búsqueda:', safePoint.name);

    // Agregar a la selección si no está ya seleccionado
    const isAlreadySelected = selectedSafePoints.find(sp => sp.id === safePoint.id);
    if (!isAlreadySelected) {
      setSelectedSafePoints(prev => [...prev, safePoint]);
    }

    // Limpiar búsqueda y cerrar dropdown
    setSearchTerm('');
    setShowSearchDropdown(false);
    setCustomLocation(null);

    // Centrar el mapa en el SafePoint seleccionado
    if (mapRef.current) {
      const center = { lat: safePoint.latitude, lng: safePoint.longitude };
      mapRef.current.panTo(center);
      mapRef.current.setZoom(16);
    }
  };

  // Manejar foco y pérdida de foco en el input de búsqueda
  const handleSearchFocus = () => {
    // Mostrar dropdown si hay término de búsqueda
    if (searchTerm.trim()) {
      setShowSearchDropdown(true);
    }
  };

  const handleSearchBlur = () => {
    // Retrasar el cierre para permitir clicks en el dropdown
    setTimeout(() => {
      setShowSearchDropdown(false);
    }, 300); // Aumentar tiempo para mejor UX
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
      {/* Header - Solo botón de volver */}
      <header className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => navigate({ to: '/publicarviaje/Origen' })}
        >
          <ArrowLeft size={20} />
        </button>
      </header>

      {/* Sección del título separada */}
      <div className={styles.titleSection}>
        <h1 className={styles.mainTitle}>
          ¿Dónde vas a recoger a los pasajeros?
        </h1>
        <p className={styles.subtitle}>
          Selecciona un SafePoint o marca una ubicación en el mapa
        </p>
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
          {/* Spinner de carga */}
          {isSearching && (
            <div className={styles.searchLoader}>
              <div className={styles.spinner} />
            </div>
          )}
        </div>

        {/* Dropdown de resultados de búsqueda COMBINADO */}
        {showSearchDropdown && (
          <div className={styles.searchDropdown}>
            {/* SafePoints encontrados */}
            {searchResults.length > 0 && (
              <>
                {searchResults.map((safePoint) => (
                  <div
                    key={`safepoint-${safePoint.id}`}
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
                        {safePoint.name} <span style={{ color: '#10b981', fontSize: '12px' }}>SafePoint</span>
                      </div>
                      <div className={styles.searchResultAddress}>
                        {safePoint.address}
                        {safePoint.city && `, ${safePoint.city}`}
                      </div>
                    </div>
                    <div className={styles.searchResultDistance}>
                      {Math.round(calculateDistance(
                        { lat: safePoint.latitude, lng: safePoint.longitude },
                        mapCenter
                      ) * 1000)}m
                    </div>
                  </div>
                ))}

                {/* Separador si hay ambos tipos */}
                {placesResults.length > 0 && (
                  <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    margin: '8px 0',
                    padding: '8px 16px',
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.6)',
                    textAlign: 'center'
                  }}>
                    Otros lugares
                  </div>
                )}
              </>
            )}

            {/* Lugares de Google Places */}
            {placesResults.map((place, index) => (
              <div
                key={`place-${index}`}
                className={styles.searchResultItem}
                onClick={() => handlePlaceSelect(place)}
              >
                <div className={styles.searchResultIcon}>
                  🌍
                </div>
                <div className={styles.searchResultContent}>
                  <div className={styles.searchResultName}>
                    {place.mainText} <span style={{ color: '#4A90E2', fontSize: '12px' }}>Google</span>
                  </div>
                  <div className={styles.searchResultAddress}>
                    {place.secondaryText}
                  </div>
                </div>
              </div>
            ))}

            {/* Mensaje cuando no hay resultados */}
            {searchResults.length === 0 && placesResults.length === 0 && searchTerm.trim() && !isSearching && (
              <div className={styles.searchResultItem} style={{ cursor: 'default', opacity: 0.7 }}>
                <div className={styles.searchResultIcon}>
                  🔍
                </div>
                <div className={styles.searchResultContent}>
                  <div className={styles.searchResultName}>
                    No se encontraron resultados
                  </div>
                  <div className={styles.searchResultAddress}>
                    Intenta con otro término de búsqueda
                  </div>
                </div>
              </div>
            )}
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
          <span className={styles.loadingText}>Cargando puntos de recogida...</span>
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
              if (!showCustomMarker) {
                // Activar modo marcador personalizado
                setSelectedSafePoints([]);
                setCustomLocation(null);
              } else {
                // Desactivar modo marcador personalizado
                setCustomLocation(null);
              }
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
              {/* Marker for detected origin (from Origen view) */}
              {originMarker && (
                <Marker
                  position={{ lat: originMarker.lat, lng: originMarker.lng }}
                  icon={{
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 46s-14-11.5-14-24A14 14 0 1 1 32 22c0 12.5-14 24-14 24z" fill="#10b981" stroke="#ffffff" stroke-width="2"/>
                        <circle cx="18" cy="18" r="6" fill="white" />
                      </svg>
                    `),
                    scaledSize: new google.maps.Size(36, 48),
                    anchor: new google.maps.Point(18, 46),
                  }}
                  title={originMarker.address || 'Ubicación detectada'}
                  onClick={() => setOriginInfoOpen(true)}
                />
              )}
              {originMarker && originInfoOpen && (
                <InfoWindow
                  position={{ lat: originMarker.lat, lng: originMarker.lng }}
                  onCloseClick={() => setOriginInfoOpen(false)}
                >
                  <div style={{ maxWidth: 220 }}>
                    <strong>Ubicación detectada</strong>
                    <div style={{ fontSize: 12, marginTop: 4 }}>{originMarker.address}</div>
                  </div>
                </InfoWindow>
              )}
              {/* Marcadores de SafePoints con el icono azul de copo de nieve */}
              {filteredSafePoints.map((safePoint) => (
                <Marker
                  key={safePoint.id}
                  position={{ lat: safePoint.latitude, lng: safePoint.longitude }}
                  icon={{
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="14" fill="${selectedSafePoints.find(sp => sp.id === safePoint.id) ? '#00ff9d' : '#4A90E2'}" stroke="white" stroke-width="2"/>
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

              {/* Marcador de ubicación personalizada - ARRASTRABLE */}
              {customLocation && (
                <Marker
                  position={customLocation}
                  draggable={true}
                  onDragEnd={(event) => {
                    if (event.latLng) {
                      const newLat = event.latLng.lat();
                      const newLng = event.latLng.lng();
                      console.log('🎯 Usuario arrastró marcador personalizado a:', { lat: newLat, lng: newLng });
                      setCustomLocation({ lat: newLat, lng: newLng });
                    }
                  }}
                  icon={{
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="18" cy="18" r="16" fill="#ff6b6b" stroke="white" stroke-width="3"/>
                        <g transform="translate(13, 13)" fill="white">
                          <path d="M5 0L5 10M0 5L10 5" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                        </g>
                        <text x="18" y="32" text-anchor="middle" fill="#333" font-size="8" font-family="Arial">📍</text>
                      </svg>
                    `),
                    scaledSize: new google.maps.Size(36, 36),
                    anchor: new google.maps.Point(18, 18),
                  }}
                  title="Ubicación personalizada - Arrastra para ajustar"
                />
              )}
            </GoogleMap>
          )}
        </div>
      )}

      {/* Selected SafePoints Info - CLICKEABLE PARA NAVEGAR */}
      {selectedSafePoints.length > 0 && (
        <div className={styles.selectedInfo}>
          <div className={styles.selectedCard} onClick={handleNavigateWithSelection}>
            <div className={styles.selectedIcon}>
              <Check size={20} />
            </div>
            <div className={styles.selectedDetails}>
              <h3 className={styles.selectedName}>
                {selectedSafePoints.length} punto{selectedSafePoints.length !== 1 ? 's' : ''} seleccionado{selectedSafePoints.length !== 1 ? 's' : ''}
              </h3>
              <p className={styles.selectedAddress}>
                {selectedSafePoints.length === 1
                  ? selectedSafePoints[0].address
                  : selectedSafePoints.map(sp => sp.name).join(', ')
                }
              </p>
            </div>
            <div className={styles.navigationArrow}>
              <ChevronRight size={20} />
            </div>
          </div>
        </div>
      )}

      {/* Ubicación personalizada seleccionada - CLICKEABLE PARA NAVEGAR */}
      {customLocation && selectedSafePoints.length === 0 && (
        <div className={styles.selectedInfo}>
          <div className={styles.selectedCard} onClick={handleNavigateWithSelection}>
            <div className={styles.selectedIcon}>
              <Check size={20} />
            </div>
            <div className={styles.selectedDetails}>
              <h3 className={styles.selectedName}>Ubicación personalizada</h3>
              <p className={styles.selectedAddress}>
                Lat: {customLocation.lat.toFixed(6)}, Lng: {customLocation.lng.toFixed(6)}
              </p>
            </div>
            <div className={styles.navigationArrow}>
              <ChevronRight size={20} />
            </div>
          </div>
        </div>
      )}

      {/* No SafePoint Option - CON NAVEGACIÓN DIRECTA */}
      <div className={styles.noSafePointSection}>
        <button
          className={`${styles.noSafePointButton} ${selectedSafePoints.length === 0 && !customLocation ? styles.selected : ''}`}
          onClick={handleNoSafePointSelect}
        >
          <span className={styles.noSafePointIcon}>🚫</span>
          <div className={styles.noSafePointText}>
            <h3>{noSafePointOption.name}</h3>
            <p>Usar ubicación exacta del origen</p>
          </div>
          <div className={styles.navigationArrow}>
            <ChevronRight size={20} />
          </div>
        </button>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/publicarviaje/punto-recogida/')({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    selectedAddress: search.selectedAddress as string | undefined,
  }),
  component: PuntoRecogidaView,
});

export default PuntoRecogidaView;