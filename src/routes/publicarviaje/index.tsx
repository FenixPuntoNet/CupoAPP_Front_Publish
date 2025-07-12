import { useState, useRef, useCallback, useEffect } from 'react';
import { createFileRoute, Link, useSearch, useNavigate } from '@tanstack/react-router';
import {
  Container,
  Title,
  TextInput,
  Button,
  Text,
  Modal,
  Stack,
  Badge,
  Loader,
  ActionIcon,
  Popover,
  Switch
} from '@mantine/core';
import { 
  MapPin, 
  ArrowLeft, 
  Clock, 
  Navigation, 
  Car,
  DollarSign,
  Settings,
  Trees,
  CheckCircle,
  AlertCircle,
  Sparkles,
  X
} from 'lucide-react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { 
  mapOptions, 
  tripStore,
  type TripRoute,
  type TripLocation,
  errorMessages
} from '../../types/PublicarViaje/TripDataManagement';
import styles from './index.module.css';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/lib/supabaseClient'; 


interface RoutePreferences {
  avoidTolls: boolean;
  avoidHighways: boolean;
  optimizeFuel: boolean;
}

interface SearchParams {
  selectedAddress?: string;
  selectedDestination?: string;
}

export const Route = createFileRoute('/publicarviaje/')({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    selectedAddress: search.selectedAddress as string | undefined,
    selectedDestination: search.selectedDestination as string | undefined,
  }),
  component: ReservarView,
});

function ReservarView(){
  const navigate = useNavigate();
  const { selectedAddress = '', selectedDestination = '' } = useSearch({ from: '/publicarviaje/' });
  
  // Estados base
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [routes, setRoutes] = useState<TripRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
useEffect(() => {
  const validateUserAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        navigate({ to: '/Login' });
        return;
      }

      const { data: profileRaw, error } = await supabase
        .from('user_profiles')
        .select(`status, "Verification"`)
        .eq('user_id', session.user.id)
        .single();

      if (error || !profileRaw) {
        console.error('Error cargando perfil:', error);
        return;
      }

      const profile = profileRaw as { status: string; Verification: string };

      const isDriver = profile.status === 'DRIVER';
      const isVerified = profile.Verification === 'VERIFICADO';

      if (!isDriver || !isVerified) {
        notifications.show({
          title: 'Acceso restringido',
          message: 'Debes registrar tu vehículo y estar verificado para publicar un viaje.',
          color: 'yellow'
        });

        navigate({ to: '/RegistrarVehiculo' });
      }

    } catch (error) {
      console.error('Error validando perfil:', error);
    }
  };

  validateUserAccess();
}, []);


  // Estados de preferencias
  const [routePreferences, setRoutePreferences] = useState<RoutePreferences>({
    avoidTolls: false,
    avoidHighways: false,
    optimizeFuel: false
  });

  // Función para recalcular rutas cuando cambien las preferencias
  const recalculateRoutes = useCallback(async () => {
    if (!directions || !selectedAddress || !selectedDestination) return;
    
    console.log('Recalculando rutas con preferencias:', routePreferences);
    
    // Mostrar notificación de recálculo
    notifications.show({
      title: 'Recalculando rutas',
      message: 'Aplicando nuevas preferencias...',
      color: 'blue',
      autoClose: 2000,
    });
    
    try {
      const directionsService = new google.maps.DirectionsService();
      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route({
          origin: selectedAddress,
          destination: selectedDestination,
          travelMode: google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: true,
          optimizeWaypoints: true,
          avoidTolls: routePreferences.avoidTolls,
          avoidHighways: routePreferences.avoidHighways,
        }, (response, status) => {
          if (status === google.maps.DirectionsStatus.OK && response) {
            resolve(response);
          } else {
            reject(new Error('Error al recalcular rutas'));
          }
        });
      });

      const generateUniqueId = (): number => {
        return Math.floor(Math.random() * 1000000);
      };

      const processedRoutes: TripRoute[] = result.routes.map((route, index) => ({
        route_id: generateUniqueId(),
        index,
        distance: route.legs[0].distance?.text || '',
        duration: route.legs[0].duration?.text || '',
        summary: route.summary || '',
        startAddress: route.legs[0].start_address,
        endAddress: route.legs[0].end_address,
        bounds: route.bounds,
        polyline: route.overview_polyline,
        warnings: route.warnings || []
      }));

      setDirections(result);
      setRoutes(processedRoutes);
      setSelectedRouteIndex(0);

      if (processedRoutes.length > 0) {
        tripStore.setRoutes(processedRoutes, processedRoutes[0]);
      }

      // Mostrar notificación de éxito
      notifications.show({
        title: 'Rutas actualizadas',
        message: `Se encontraron ${processedRoutes.length} rutas con las nuevas preferencias`,
        color: 'green',
        autoClose: 3000,
      });

    } catch (error) {
      console.error('Error recalculando rutas:', error);
      notifications.show({
        title: 'Error al recalcular',
        message: 'No se pudieron aplicar las preferencias',
        color: 'red',
        autoClose: 3000,
      });
    }
  }, [selectedAddress, selectedDestination, routePreferences, directions]);

  // Efecto para recalcular cuando cambien las preferencias
  useEffect(() => {
    if (directions && showRouteMap) {
      recalculateRoutes();
    }
  }, [routePreferences.avoidTolls, routePreferences.avoidHighways, routePreferences.optimizeFuel]);

  // Manejador de cambio de preferencias
  const handlePreferenceChange = useCallback((key: keyof RoutePreferences, value: boolean) => {
    setRoutePreferences(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Referencias
  const mapRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  // Función para calcular rutas con manejo de marcadores
  const calculateRoute = useCallback(async () => {
      
    const generateUniqueId = (): number => {
      return Math.floor(Math.random() * 1000000);
    };

    if (!selectedAddress || !selectedDestination) {
      setError('Se requieren ambas direcciones');
      return;
    }

    // Verificar si Google Maps está disponible
    if (!window.google || !window.google.maps) {
      setError('Google Maps no está disponible. Por favor, recarga la página.');
      return;
    }

    setIsLoading(true);
    setIsCalculatingRoute(true);
    setError(null);

    try {
      const geocoder = new google.maps.Geocoder();
      const [originResult, destResult] = await Promise.all([
        geocoder.geocode({ address: selectedAddress }),
        geocoder.geocode({ address: selectedDestination })
      ]);

      const origin = originResult.results[0];
      const destination = destResult.results[0];

      if (!origin?.geometry?.location || !destination?.geometry?.location) {
        throw new Error('No se pudieron encontrar las direcciones');
      }

      const originLocation: TripLocation = {
        location_id: generateUniqueId(), // ID unico generado
        placeId: origin.place_id,
        address: selectedAddress,
        coords: {
          lat: origin.geometry.location.lat(),
          lng: origin.geometry.location.lng()
        },
        mainText: origin.address_components[0].long_name,
        secondaryText: origin.formatted_address
      };

      const destinationLocation: TripLocation = {
        location_id: generateUniqueId(), // ID unico generado
        placeId: destination.place_id,
        address: selectedDestination,
        coords: {
          lat: destination.geometry.location.lat(),
          lng: destination.geometry.location.lng()
        },
        mainText: destination.address_components[0].long_name,
        secondaryText: destination.formatted_address
      };
// Coordenadas del origen y destino (ya no se usan para marcadores manuales)

      // Actualizar almacenamiento de ubicaciones
      tripStore.setOrigin(originLocation);
      tripStore.setDestination(destinationLocation);

      // Calcular rutas con opciones
      const directionsService = new google.maps.DirectionsService();
      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route({
          origin: originLocation.coords,
          destination: destinationLocation.coords,
          travelMode: google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: true,
          optimizeWaypoints: true,
          avoidTolls: routePreferences.avoidTolls,
          avoidHighways: routePreferences.avoidHighways,
        }, (response, status) => {
          if (status === google.maps.DirectionsStatus.OK && response) {
            if (response.routes.length > 0) {
              const bounds = new google.maps.LatLngBounds();
              response.routes[0].legs[0].steps.forEach((step) => {
                bounds.extend(step.start_location);
                bounds.extend(step.end_location);
              });
              if (mapRef.current) {
                mapRef.current.fitBounds(bounds, 50); // Padding en píxeles
              }
              
              resolve(response);
            } else {
              reject(new Error('No se encontraron rutas'));
            }
          } else {
            reject(new Error(errorMessages.ROUTE_CALCULATION_ERROR));
          }
        });
      });
    
        const processedRoutes: TripRoute[] = result.routes.map((route, index) => ({
        route_id: generateUniqueId(),  // Agregar el route_id generado
        index,
        distance: route.legs[0].distance?.text || '',
        duration: route.legs[0].duration?.text || '',
        summary: route.summary || '',
        startAddress: route.legs[0].start_address,
        endAddress: route.legs[0].end_address,
        bounds: route.bounds,
        polyline: route.overview_polyline,
        warnings: route.warnings || []
      }));

      setDirections(result);
      setRoutes(processedRoutes);
      setSelectedRouteIndex(0);

      if (processedRoutes.length > 0) {
        tripStore.setRoutes(processedRoutes, processedRoutes[0]);
      }

      setShowRouteMap(true);

    } catch (err) {
      console.error('Error:', err);
      setError(errorMessages.ROUTE_CALCULATION_ERROR);
    } finally {
      setIsLoading(false);
      setIsCalculatingRoute(false);
    }
  }, [selectedAddress, selectedDestination, routePreferences]);

  // Manejo del DirectionsRenderer
  useEffect(() => {
    if (!mapInstance || !directions) return;

    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
    }

    const renderer = new google.maps.DirectionsRenderer({
      map: mapInstance,
      directions,
      routeIndex: selectedRouteIndex,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#00ff9d',
        strokeWeight: 5,
        strokeOpacity: 0.9,
        zIndex: 100,
      },
      suppressInfoWindows: false,
    });
  
    directionsRendererRef.current = renderer;

    if (directions.routes[selectedRouteIndex]?.bounds) {
      mapInstance.fitBounds(directions.routes[selectedRouteIndex].bounds, {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      });
      setTimeout(() => {
        const zoom = mapInstance.getZoom();
        if (zoom && zoom > 16) {
          mapInstance.setZoom(Math.min(zoom - 0.5, 16));
        }
      }, 200);
    }
  }, [directions, selectedRouteIndex, mapInstance]);

  // Limpieza de recursos al desmontar el componente
  useEffect(() => {
    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, []);

  // Manejador de selección de ruta
  const handleRouteSelect = useCallback((index: number) => {
    if (!directions?.routes[index]) return;
    setSelectedRouteIndex(index);
    
    if (directionsRendererRef.current && mapInstance) {
      directionsRendererRef.current.setRouteIndex(index);
      directionsRendererRef.current.setOptions({
        polylineOptions: {
          strokeColor: '#00ff9d',
          strokeWeight: 5,
          strokeOpacity: 0.9,
          zIndex: 100,
        }
      });

      // Ajustar vista del mapa a la ruta seleccionada
      if (directions.routes[index]?.bounds) {
        mapInstance.fitBounds(directions.routes[index].bounds, {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50,
        });
        setTimeout(() => {
          const zoom = mapInstance.getZoom();
          if (zoom && zoom > 16) {
            mapInstance.setZoom(Math.min(zoom - 0.5, 16));
          }
        }, 200);
      }
    }
    
    if (routes[index]) {
      tripStore.setRoutes(routes, routes[index]);
    }
  }, [directions, routes, mapInstance]);

  // Manejador de confirmación
  const handleRouteConfirm = useCallback(() => {
    if (routes[selectedRouteIndex]) {
      const selectedRoute = routes[selectedRouteIndex];
      tripStore.updateData({
        currentStep: 'paradas',
        selectedRoute: selectedRoute
      });
      navigate({ 
        to: '/Paradas',
        search: {
          routeId: selectedRoute.index.toString()
        }
      });
    }
  }, [navigate, routes, selectedRouteIndex]);

  return (
    <Container fluid className={styles.container}>
      <div style={{height: '30px'}} />
      <div className={styles.header}>
        <Link to="/home" className={styles.backButton}>
          <ArrowLeft size={24} />
        </Link>
        <Title order={4} className={styles.headerTitle}>Publicar viaje</Title>
      </div>

      <Container size="sm" className={styles.content}>
         <div className={styles.heroSection}>
          <div className={styles.heroTextContainer}>
            <Title order={2} className={styles.heroTitle}>
              ¿Listo para compartir tu viaje?
            </Title>
            <Text size="md" color="dimmed" className={styles.heroText}>
              Planifica tu ruta y encuentra compañeros de viaje
            </Text>
          </div>
        </div>
        <div className={styles.stepContent}>
          <Title className={styles.stepTitle}>¿Desde dónde sales?</Title>
          <div className={styles.searchBox}>
            <MapPin className={styles.searchIcon} size={20} />
            <Link to="/Origen" className={styles.searchLink}>
              <TextInput
                placeholder="Escribe la dirección completa"
                className={styles.input}
                value={selectedAddress}
                readOnly
              />
            </Link>
          </div>

          <Title className={styles.stepTitle}>¿A dónde vas?</Title>
          <div className={styles.searchBox}>
            <MapPin className={styles.searchIcon} size={20} />
            <Link
              to="/Destino"
              search={{ originAddress: selectedAddress }}
              className={styles.searchLink}
            >
              <TextInput
                placeholder="Escribe la dirección completa"
                className={styles.input}
                value={selectedDestination}
                readOnly
              />
            </Link>
          </div>
        </div>

        {error && (
          <Text color="red" size="sm" className={styles.errorText}>
            {error}
          </Text>
        )}

        {selectedAddress && selectedDestination && (
          <div className={styles.actionButtonContainer}>
            <Button 
              onClick={calculateRoute}
              className={styles.nextButton}
              loading={isLoading}
              leftSection={<Navigation size={20} />}
              rightSection={<Sparkles size={16} />}
            >
              {isLoading ? 'Calculando ruta...' : 'Ver ruta en el mapa'}
            </Button>
          </div>
        )}

        <Modal
          opened={showRouteMap}
          onClose={() => setShowRouteMap(false)}
          fullScreen
          classNames={{
            root: styles.routeModal,
            body: styles.routeModalBody
          }}
        >
          <div className={styles.routeContent}>
            <div className={styles.mapControls}>
              <div className={styles.mapOptions}>
                <div className={styles.mapOptionsLeft}>
                  <div>
                    <Text className={styles.mapTitle}>Selecciona tu ruta</Text>
                    <Text className={styles.mapSubtitle}>
                      {selectedAddress} → {selectedDestination}
                    </Text>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Popover width={300} position="bottom" shadow="md">
                    <Popover.Target>
                      <div style={{ position: 'relative' }}>
                        <ActionIcon 
                          variant="light"
                          color={Object.values(routePreferences).some(v => v) ? 'green' : 'gray'}
                          size="lg"
                        >
                          <Settings size={20} />
                        </ActionIcon>
                        {Object.values(routePreferences).some(v => v) && (
                          <div className={styles.activePreferenceIndicator}>
                            <Sparkles size={10} />
                          </div>
                        )}
                      </div>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <Stack gap="xs">
                        <Text fw={500}>Preferencias de ruta</Text>
                        <div className={styles.preference}>
                          <Switch
                            label="Evitar peajes"
                            checked={routePreferences.avoidTolls}
                            onChange={(e) => handlePreferenceChange('avoidTolls', e.currentTarget.checked)}
                            color="green"
                            size="md"
                            thumbIcon={routePreferences.avoidTolls ? <CheckCircle size={12} /> : null}
                          />
                          <DollarSign size={16} className={styles.preferenceIcon} />
                        </div>
                        <div className={styles.preference}>
                          <Switch
                            label="Evitar autopistas"
                            checked={routePreferences.avoidHighways}
                            onChange={(e) => handlePreferenceChange('avoidHighways', e.currentTarget.checked)}
                            color="green"
                            size="md"
                            thumbIcon={routePreferences.avoidHighways ? <CheckCircle size={12} /> : null}
                          />
                          <Car size={16} className={styles.preferenceIcon} />
                        </div>
                        <div className={styles.preference}>
                          <Switch
                            label="Optimizar consumo"
                            checked={routePreferences.optimizeFuel}
                            onChange={(e) => handlePreferenceChange('optimizeFuel', e.currentTarget.checked)}
                            color="green"
                            size="md"
                            thumbIcon={routePreferences.optimizeFuel ? <CheckCircle size={12} /> : null}
                          />
                          <Trees size={16} className={styles.preferenceIcon} />
                        </div>
                        <div className={styles.preferenceStatus}>
                          <Text size="xs" color="dimmed">
                            {Object.values(routePreferences).some(v => v) 
                              ? '✓ Preferencias activas' 
                              : 'Sin preferencias activas'}
                          </Text>
                        </div>
                      </Stack>
                    </Popover.Dropdown>
                  </Popover>
                  <ActionIcon
                    className={styles.closeButton}
                    onClick={() => setShowRouteMap(false)}
                    size="lg"
                  >
                    <X size={20} />
                  </ActionIcon>
                </div>
              </div>
            </div>
        
            {/* Layout horizontal - Mapa y rutas lado a lado */}
            <div className={styles.mainLayout}>
              <div className={styles.mapSection}>
                {isCalculatingRoute && (
                  <div className={styles.mapLoading}>
                    <Loader color="#00ff9d" size="lg" />
                    <Text mt="md" fw={500} color="dimmed">
                      Calculando las mejores rutas...
                    </Text>
                  </div>
                )}
                
                <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                options={{
                  ...mapOptions,
                  gestureHandling: 'greedy',
                  disableDoubleClickZoom: false,
                  zoomControl: true,
                  fullscreenControl: true,
                  streetViewControl: false,
                  mapTypeControl: false,
                  styles: [
                    // Tema oscuro personalizado
                    { featureType: "all", elementType: "geometry", stylers: [{ color: "#2c3e50" }] },
                    { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#ecf0f1" }] },
                    { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#34495e" }] },
                    { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#00ff9d" }, { lightness: -10 }] },
                    { featureType: "administrative.land_parcel", elementType: "geometry.stroke", stylers: [{ color: "#00ff9d" }, { lightness: -5 }] },
                    { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#34495e" }] },
                    { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#2c3e50" }] },
                    { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#2c3e50" }] },
                    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#34495e" }] },
                    { featureType: "poi", elementType: "labels.text", stylers: [{ visibility: "off" }] },
                    { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#27ae60" }, { lightness: -10 }] },
                    { featureType: "road", elementType: "geometry", stylers: [{ color: "#95a5a6" }] },
                    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#ecf0f1" }] },
                    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e74c3c" }] },
                    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#c0392b" }] },
                    { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#7f8c8d" }] },
                    { featureType: "road.local", elementType: "geometry", stylers: [{ color: "#bdc3c7" }] },
                    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#9b59b6" }] },
                    { featureType: "transit.line", elementType: "geometry.fill", stylers: [{ color: "#00ff9d" }] },
                    { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#00ff9d" }] },
                    { featureType: "water", elementType: "geometry", stylers: [{ color: "#3498db" }] },
                    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#ecf0f1" }] },
                    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#2980b9" }] }
                  ]
                }}
                onLoad={(map) => {
                  setMapInstance(map);
                  mapRef.current = map;
                  console.log('Mapa cargado correctamente');
                }}
              >
                {/* Marcadores simples tipo pin */}
                {directions && (
                  <>
                    <Marker
                      position={{
                        lat: directions.routes[0].legs[0].start_location.lat(),
                        lng: directions.routes[0].legs[0].start_location.lng(),
                      }}
                      title="Punto de Origen"
                    />
                    <Marker
                      position={{
                        lat: directions.routes[0].legs[0].end_location.lat(),
                        lng: directions.routes[0].legs[0].end_location.lng(),
                      }}
                      title="Punto de Destino"
                    />
                  </>
                )}
              </GoogleMap>
              </div>
        
              <div className={styles.routesSection}>
                {/* Contenedor de scroll independiente */}
                <div className={styles.routesList}>
                  <div className={styles.routesSectionHeader}>
                    <Text className={styles.routesTitle}>Rutas disponibles</Text>
                    <Badge variant="light" color="green" size="sm">
                      {routes.length} opciones
                    </Badge>
                  </div>
                  
                  {/* Mensaje de ayuda */}
                  <div className={styles.helpMessage}>
                    {routes.length > 0 && (
                      <Button
                        className={styles.selectRouteButton}
                        onClick={handleRouteConfirm}
                        size="lg"
                        leftSection={<CheckCircle size={18} />}
                        loading={isLoading}
                        fullWidth
                      >
                        Confirmar Ruta {selectedRouteIndex + 1} • {routes[selectedRouteIndex]?.duration}
                      </Button>
                    )}
                  </div>
                  
                  {/* Lista de rutas con scroll COMPLETAMENTE independiente */}
                  <div className={styles.routesListContent}>
                    {routes.map((route, index) => (
                      <div
                        key={route.index}
                        className={`${styles.routeOption} ${
                          route.index === selectedRouteIndex ? styles.routeOptionSelected : ''
                        }`}
                        onClick={() => handleRouteSelect(route.index)}
                      >
                        <div className={styles.routeHeader}>
                          <div className={styles.routeNumber}>
                            <Text size="xs" fw={600}>{index + 1}</Text>
                          </div>
                          <div className={styles.routeMainInfo}>
                            <div className={styles.routeTime}>
                              <Clock size={16} />
                              <Text size="xs" fw={600}>{route.duration}</Text>
                            </div>
                            <div className={styles.routeDistance}>
                              <Navigation size={16} />
                              <Text size="xs" fw={600}>{route.distance}</Text>
                            </div>
                          </div>
                          {route.index === selectedRouteIndex && (
                            <CheckCircle size={20} className={styles.routeSelectedIcon} />
                          )}
                        </div>
                        <Text size="sm" color="dimmed" className={styles.routeSummary}>
                          Vía {route.summary}
                        </Text>
                        {route.warnings && route.warnings.length > 0 && (
                          <div className={styles.routeWarnings}>
                            {route.warnings.map((warning: string, i: number) => (
                              <Badge key={i} color="yellow" size="sm" leftSection={<AlertCircle size={12} />}>
                                {warning}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </Container>
    </Container>
  );
}

export default ReservarView;