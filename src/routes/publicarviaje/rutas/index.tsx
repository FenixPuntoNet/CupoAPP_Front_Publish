import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { Text, Button, Title, Loader, Alert, Radio } from '@mantine/core';
import { ArrowLeft } from 'lucide-react';
import { GoogleMap, DirectionsRenderer } from '@react-google-maps/api';
import { useMaps } from '@/components/GoogleMapsProvider';
import { notifications } from '@mantine/notifications';
import {
  type TripRoute,
  tripStore,
} from '@/types/PublicarViaje/TripDataManagement';
import styles from './index.module.css';

// Interfaces para el search params
interface RutasSearch {
  selectedAddress?: string;
  selectedDestination?: string;
  pickupSafePointId?: string;
  dropoffSafePointId?: string;
  customPickupLat?: string;
  customPickupLng?: string;
  customDropoffLat?: string;
  customDropoffLng?: string;
}

function RutasView() {
  const navigate = useNavigate();
  const { isLoaded, loadError } = useMaps();
  const search = useSearch({ from: '/publicarviaje/rutas/' }) as RutasSearch;
  const { 
    selectedAddress = '', 
    selectedDestination = '',
    // pickupSafePointId,
    // dropoffSafePointId 
  } = search;
  
  // Estados principales
  const [routes, setRoutes] = useState<TripRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados del mapa y direcciones
  const [mapCenter] = useState({ lat: 3.4516, lng: -76.5320 }); // Cali por defecto
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Configuración del mapa con mejor estilo
  const mapOptions: google.maps.MapOptions = {
    styles: [
      {
        featureType: "all",
        elementType: "labels.text.fill",
        stylers: [{ color: "#5e5e5e" }]
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#ffffff" }]
      },
      {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#4A90E2" }]
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#74b9ff" }]
      },
      {
        featureType: "poi",
        elementType: "geometry",
        stylers: [{ color: "#dfe6e9" }]
      }
    ],
    disableDefaultUI: true,
    zoomControl: true,
    gestureHandling: 'greedy',
  };

  // Generar ID único
  const generateUniqueId = (): number => {
    return Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
  };

  // Calcular y mostrar direcciones en el mapa
  const calculateAndDisplayRoute = useCallback(async () => {
    if (!directionsService || !selectedAddress || !selectedDestination) {
      return;
    }

    try {
      const request: google.maps.DirectionsRequest = {
        origin: selectedAddress,
        destination: selectedDestination,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false,
        optimizeWaypoints: true,
        provideRouteAlternatives: true // Obtener rutas alternativas
      };

      directionsService.route(request, (result, status) => {
        if (status === 'OK' && result) {
          // Guardar todas las rutas disponibles
          const fullDirectionsResponse = result;
          
          // Convertir las rutas de Google Maps a nuestro formato
          const convertedRoutes: TripRoute[] = result.routes.map((route, index) => ({
            route_id: generateUniqueId() + index,
            index,
            distance: route.legs[0]?.distance?.text || 'N/A',
            duration: route.legs[0]?.duration?.text || 'N/A',
            summary: route.summary || `Vía ${route.legs[0]?.start_address?.split(',')[0]} - ${route.legs[0]?.end_address?.split(',')[0]}`,
            startAddress: route.legs[0]?.start_address || selectedAddress,
            endAddress: route.legs[0]?.end_address || selectedDestination,
            bounds: route.bounds,
            polyline: route.overview_polyline || '',
            warnings: route.warnings || []
          }));

          setRoutes(convertedRoutes);
          
          // Mostrar la primera ruta por defecto
          if (result.routes.length > 0) {
            const firstRouteResponse: google.maps.DirectionsResult = {
              ...fullDirectionsResponse,
              routes: [result.routes[0]] // Solo la primera ruta
            };
            setDirectionsResponse(firstRouteResponse);
            
            // Ajustar el mapa a la primera ruta
            const bounds = result.routes[0].bounds;
            if (mapRef.current && bounds) {
              mapRef.current.fitBounds(bounds, {
                top: 60,
                right: 60,
                bottom: 60,
                left: 60
              });
            }
          }
          
          // Guardar referencia a todas las rutas para cambio dinámico
          (window as any).allRoutesData = fullDirectionsResponse;

          console.log(`✅ ${convertedRoutes.length} rutas calculadas. Primera ruta mostrada por defecto.`);
        } else {
          console.error('❌ Error en DirectionsService:', status);
          setError('No se pudieron calcular las rutas. Por favor, verifica las direcciones.');
        }
      });
    } catch (err) {
      console.error('❌ Error calculando direcciones:', err);
      setError('Error al calcular las direcciones');
    }
  }, [directionsService, selectedAddress, selectedDestination]);

  // Calcular rutas cuando se carga la página (usando DirectionsService)
  const calculateRoutes = useCallback(async () => {
    if (!selectedAddress || !selectedDestination) {
      setError('Faltan datos de origen y destino');
      return;
    }

    setIsCalculating(true);
    setError(null);

    console.log('🗺️ Calculando rutas entre:', {
      origin: selectedAddress,
      destination: selectedDestination
    });

    // Si tenemos DirectionsService, usamos la nueva función
    if (directionsService) {
      await calculateAndDisplayRoute();
    }
    
    setIsCalculating(false);
  }, [selectedAddress, selectedDestination, directionsService, calculateAndDisplayRoute]);

  // Inicializar DirectionsService cuando Google Maps se carga
  useEffect(() => {
    if (isLoaded && window.google) {
      const service = new window.google.maps.DirectionsService();
      setDirectionsService(service);
    }
  }, [isLoaded]);

  // Calcular rutas al cargar la página
  useEffect(() => {
    if (directionsService && selectedAddress && selectedDestination) {
      calculateRoutes();
    }
  }, [directionsService, calculateRoutes]);

  // Manejar selección de ruta y actualizar el mapa DINÁMICAMENTE
  const handleRouteSelect = (routeIndex: number) => {
    setSelectedRouteIndex(routeIndex);
    
    // Obtener todas las rutas desde el almacenamiento global
    const allRoutesData = (window as any).allRoutesData as google.maps.DirectionsResult;
    
    if (allRoutesData && allRoutesData.routes[routeIndex]) {
      const selectedRoute = allRoutesData.routes[routeIndex];
      
      // Crear nueva respuesta con solo la ruta seleccionada
      const updatedResponse: google.maps.DirectionsResult = {
        ...allRoutesData,
        routes: [selectedRoute] // Solo mostrar la ruta seleccionada
      };
      
      // Actualizar el estado del mapa INMEDIATAMENTE
      setDirectionsResponse(updatedResponse);
      
      // Ajustar el mapa a los bounds de la ruta seleccionada con animación suave
      if (mapRef.current && selectedRoute.bounds) {
        // Usar setTimeout para asegurar que el estado se actualice primero
        setTimeout(() => {
          mapRef.current?.fitBounds(selectedRoute.bounds!, {
            top: 80,
            right: 80,
            bottom: 80,
            left: 80
          });
        }, 100);
      }
      
      console.log(`🗺️ Ruta ${routeIndex + 1} cargada dinámicamente:`, {
        distance: selectedRoute.legs[0]?.distance?.text,
        duration: selectedRoute.legs[0]?.duration?.text,
        summary: selectedRoute.summary,
        warnings: selectedRoute.warnings?.length || 0
      });
      
      // Mostrar notificación de cambio de ruta
      notifications.show({
        title: `Ruta ${routeIndex + 1} seleccionada`,
        message: `${selectedRoute.legs[0]?.distance?.text} • ${selectedRoute.legs[0]?.duration?.text}`,
        color: 'blue',
        autoClose: 2000,
      });
    }
  };

  // Manejar confirmación y navegación final
  const handleConfirm = () => {
    if (routes.length === 0) {
      setError('No hay rutas disponibles para confirmar');
      return;
    }

    const selectedRoute = routes[selectedRouteIndex];
    
    try {
      // Guardar la ruta seleccionada en el store
      tripStore.setRoutes([selectedRoute], selectedRoute);
      
      notifications.show({
        title: '¡Ruta confirmada!',
        message: 'Tu viaje ha sido configurado correctamente',
        color: 'green',
      });

      // Navegar a la página de fecha y hora
      navigate({
        to: '/publicarviaje/fecha-hora',
      });
    } catch (err) {
      console.error('Error confirmando ruta:', err);
      setError('Error confirmando la ruta seleccionada');
    }
  };

  // Renderizar error de carga de Google Maps
  if (loadError) {
    return (
      <div className={styles.container}>
        <Alert color="red" title="Error">
          Error cargando Google Maps. Por favor, recarga la página.
        </Alert>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header con solo botón de regreso */}
      <div className={styles.header}>
        <Link to="/publicarviaje/puntos-descenso" className={styles.backButton}>
          <ArrowLeft size={20} />
        </Link>
      </div>

      {/* Sección del título principal */}
      <div className={styles.titleSection}>
        <Title order={2} className={styles.mainTitle}>
          ¿Cuál es tu ruta?
        </Title>
        <Text className={styles.subtitle}>
          Elige la mejor ruta para tu viaje
        </Text>
      </div>

      {/* Contenido principal */}
      <div className={styles.content}>
        {/* Lista de rutas - Mitad superior */}
        <div className={styles.routesList}>
          {isCalculating ? (
            <div className={styles.loadingContainer}>
              <Loader size="md" />
              <Text>Calculando rutas...</Text>
            </div>
          ) : error ? (
            <Alert color="red" className={styles.errorAlert}>
              {error}
              <Button variant="light" size="xs" mt="sm" onClick={calculateRoutes}>
                Reintentar
              </Button>
            </Alert>
          ) : routes.length === 0 ? (
            <Alert color="yellow" className={styles.noRoutesAlert}>
              No se encontraron rutas disponibles.
            </Alert>
          ) : (
            <Radio.Group
              value={selectedRouteIndex.toString()}
              onChange={(value) => handleRouteSelect(parseInt(value))}
            >
              {routes.map((route, index) => (
                <div
                  key={route.route_id}
                  className={`${styles.routeItem} ${selectedRouteIndex === index ? styles.selected : ''}`}
                  onClick={() => handleRouteSelect(index)}
                >
                  <Radio
                    value={index.toString()}
                    className={styles.routeRadio}
                  />
                  <div className={styles.routeDetails}>
                    <Text className={styles.routeTitle}>
                      {route.summary || `Ruta ${index + 1}`}
                    </Text>
                    <Text size="xs" c="dimmed" className={styles.routeDistance}>
                      {route.distance} • {route.duration}
                    </Text>
                    {route.warnings && route.warnings.length > 0 && (
                      <Text size="xs" c="orange" className={styles.routeWarning}>
                        ⚠️ {route.warnings.length} advertencia{route.warnings.length > 1 ? 's' : ''}
                      </Text>
                    )}
                  </div>
                  
                  {/* Flecha a la derecha - inline */}
                  <button 
                    className={styles.continueArrow}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRouteIndex(index);
                      handleConfirm();
                    }}
                  >
                    <ArrowLeft size={16} className={styles.arrowIcon} />
                  </button>
                </div>
              ))}
            </Radio.Group>
          )}
        </div>

        {/* Mapa - Mitad inferior */}
        <div className={styles.mapContainer}>
          {isLoaded && (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              options={mapOptions}
              center={mapCenter}
              zoom={13}
              onLoad={(map: google.maps.Map) => {
                mapRef.current = map;
              }}
            >
              {/* Renderizar la ruta seleccionada */}
              {directionsResponse && (
                <DirectionsRenderer
                  directions={directionsResponse}
                  options={{
                    suppressMarkers: false,
                    polylineOptions: {
                      strokeColor: '#4285f4',
                      strokeWeight: 5,
                      strokeOpacity: 0.8,
                    },
                  }}
                />
              )}
            </GoogleMap>
          )}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/publicarviaje/rutas/')({
  validateSearch: (search: Record<string, unknown>): RutasSearch => ({
    selectedAddress: search.selectedAddress as string | undefined,
    selectedDestination: search.selectedDestination as string | undefined,
    pickupSafePointId: search.pickupSafePointId as string | undefined,
    dropoffSafePointId: search.dropoffSafePointId as string | undefined,
    customPickupLat: search.customPickupLat as string | undefined,
    customPickupLng: search.customPickupLng as string | undefined,
    customDropoffLat: search.customDropoffLat as string | undefined,
    customDropoffLng: search.customDropoffLng as string | undefined,
  }),
  component: RutasView,
});

export default RutasView;