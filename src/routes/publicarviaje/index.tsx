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
  Switch,
  Image
} from '@mantine/core';
import { 
  MapPin, 
  ArrowLeft, 
  Clock, 
  Navigation, 
  Car,
  DollarSign,
  Settings,
  Trees
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


const MARKER_ICONS = {
  origin: {
    path: window.google?.maps.SymbolPath.CIRCLE ?? '',
    fillColor: "#4CAF50",
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: '#FFFFFF',
    scale: 7,
    labelOrigin: window.google ? new window.google.maps.Point(0, -3) : undefined,
    label: {
      text: 'A',
      color: '#FFFFFF',
      fontSize: '14px',
      fontWeight: 'bold'
    }
  },
  destination: {
    path: window.google?.maps.SymbolPath.CIRCLE ?? '',
    fillColor: "#FF0000",
    fillOpacity: 1,
    strokeWeight: 1,
    strokeColor: '#FFFFFF',
    scale: 7,
    labelOrigin: window.google ? new window.google.maps.Point(0, -3) : undefined,
    label: {
      text: 'B',
      color: '#FFFFFF',
      fontSize: '14px',
      fontWeight: 'bold'
    }
  }
};

interface RoutePreferences {
  avoidTolls: boolean;
  avoidHighways: boolean;
  optimizeFuel: boolean;
}

interface SearchParams {
  selectedAddress?: string;
  selectedDestination?: string;
}
interface ReservarViewProps {
  isLoaded: boolean;
}

export const Route = createFileRoute('/publicarviaje/')({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    selectedAddress: search.selectedAddress as string | undefined,
    selectedDestination: search.selectedDestination as string | undefined,
  }),
  component: ReservarView,
});

function ReservarView({ isLoaded }: ReservarViewProps){

  if (!isLoaded) {
    const navigate = useNavigate();
  const { selectedAddress = '', selectedDestination = '' } = useSearch({ from: '/publicarviaje/' });
  
  // Estados base
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [routes, setRoutes] = useState<TripRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originMarker, setOriginMarker] = useState<google.maps.Marker | null>(null);
  const [destinationMarker, setDestinationMarker] = useState<google.maps.Marker | null>(null);
  
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

    setIsLoading(true);
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
        throw new Error(errorMessages.GEOCODING_ERROR);
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
// Coordenadas del origen y destino
const originLat = originLocation.coords.lat;
const originLng = originLocation.coords.lng;
const destinationLat = destinationLocation.coords.lat;
const destinationLng = destinationLocation.coords.lng;

      // Actualizar marcadores
      if (mapRef.current) {
        originMarker?.setMap(null);
        destinationMarker?.setMap(null);
      
        const newOriginMarker = new google.maps.Marker({
          position: { lat: originLat, lng: originLng },
          map: mapRef.current,
          icon: MARKER_ICONS.origin,
        });
      
        const newDestinationMarker = new google.maps.Marker({
          position: { lat: destinationLat, lng: destinationLng },
          map: mapRef.current,
          icon: MARKER_ICONS.destination,
        });
      
        setOriginMarker(newOriginMarker);
        setDestinationMarker(newDestinationMarker);
      }

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
    }
  }, [selectedAddress, selectedDestination, routePreferences, originMarker, destinationMarker]);

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
        strokeColor: '#4285F4',
        strokeWeight: 3.5,
        strokeOpacity: 0.9,
      },
    });
  
    directionsRendererRef.current = renderer;

    if (directions.routes[selectedRouteIndex]?.bounds) {
      mapInstance.fitBounds(directions.routes[selectedRouteIndex].bounds);
      setTimeout(() => {
        const zoom = mapInstance.getZoom();
        if (zoom) {
          mapInstance.setZoom(zoom - 0.5);
        }
      }, 100);
    }
  }, [directions, selectedRouteIndex, mapInstance]);

  // Limpieza
  useEffect(() => {
    return () => {
      originMarker?.setMap(null);
      destinationMarker?.setMap(null);
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [originMarker, destinationMarker]);

  // Manejador de selección de ruta
  const handleRouteSelect = useCallback((index: number) => {
    if (!directions?.routes[index]) return;
    setSelectedRouteIndex(index);
    
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setRouteIndex(index);
      directionsRendererRef.current.setOptions({
        polylineOptions: {
          strokeColor: '#4285F4',
          strokeWeight: 5,
          strokeOpacity: 0.8
        }
      });
    }
    
    if (routes[index]) {
      tripStore.setRoutes(routes, routes[index]);
    }
  }, [directions, routes]);

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
      <div className={styles.header}>
        <Link to="/home" className={styles.backButton}>
          <ArrowLeft size={24} />
        </Link>
        <Title order={4} className={styles.headerTitle}>Reservar viaje</Title>
      </div>

      <Container size="sm" className={styles.content}>
         <div className={styles.heroSection}>
          <Image src='https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/fondo2carro.png' alt="Carpooling" className={styles.heroImage} />
          <Title order={2} className={styles.heroTitle}>
              ¿Listo para compartir tu viaje?
              </Title>
              <Text size="md" color="dimmed" className={styles.heroText}>
               Encuentra la ruta perfecta y ahorra en tus traslados
                </Text>
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
          <Button 
            onClick={calculateRoute}
            className={styles.nextButton}
            loading={isLoading}
          >
            Ver ruta en el mapa
          </Button>
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
                <Popover width={300} position="bottom" shadow="md">
                  <Popover.Target>
                    <ActionIcon variant="light">
                      <Settings size={20} />
                    </ActionIcon>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <Stack gap="xs">
                      <Text fw={500}>Preferencias de ruta</Text>
                      <div className={styles.preference}>
                        <Switch
                          label="Evitar peajes"
                          checked={routePreferences.avoidTolls}
                          onChange={(e) => setRoutePreferences(prev => ({
                            ...prev,
                            avoidTolls: e.currentTarget.checked
                          }))}
                        />
                        <DollarSign size={16} className={styles.preferenceIcon} />
                      </div>
                      <div className={styles.preference}>
                        <Switch
                          label="Evitar autopistas"
                          checked={routePreferences.avoidHighways}
                          onChange={(e) => setRoutePreferences(prev => ({
                            ...prev,
                            avoidHighways: e.currentTarget.checked
                          }))}
                        />
                        <Car size={16} className={styles.preferenceIcon} />
                      </div>
                      <div className={styles.preference}>
                        <Switch
                          label="Optimizar consumo"
                          checked={routePreferences.optimizeFuel}
                          onChange={(e) => setRoutePreferences(prev => ({
                            ...prev,
                            optimizeFuel: e.currentTarget.checked
                          }))}
                        />
                        <Trees size={16} className={styles.preferenceIcon} />
                      </div>
                    </Stack>
                  </Popover.Dropdown>
                </Popover>
              </div>
            </div>
        
            <div className={styles.mapSection}>
              {isLoading && (
                <div className={styles.mapLoading}>
                  <Loader color="#4285F4" size="lg" />
                </div>
              )}
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                options={{
                  ...mapOptions,
                  gestureHandling: 'greedy',
                  disableDoubleClickZoom: true,
                  zoomControl: true,
                  fullscreenControl: true,
                  streetViewControl: false,
                  mapTypeControl: true,
                  styles: [
                    { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "true" }] },
                    { featureType: "poi", stylers: [{ visibility: "true" }] },
                    { featureType: "transit", stylers: [{ visibility: "true" }] },
                    { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFBE00" }] },
                    { featureType: "landscape", stylers: [{ color: "#f5f5f5" }] },
                    { featureType: "water", stylers: [{ color: "#c9e7ff" }] },
                  ]
                }}
                onLoad={(map) => {
                  setMapInstance(map);
                  mapRef.current = map;
                }}
              >
                {originMarker && destinationMarker && (
                  <>
                    <Marker
                      position={originMarker.getPosition() as google.maps.LatLng}
                      icon={MARKER_ICONS.origin}
                    />
                    <Marker
                      position={destinationMarker.getPosition() as google.maps.LatLng}
                      icon={MARKER_ICONS.destination}
                    />
                  </>
                )}
              </GoogleMap>
            </div>
        
            <div className={styles.routesSection}>
              <div className={styles.routesList}>
                <Text className={styles.routesTitle}>Rutas disponibles</Text>
                {routes.map((route) => (
                  <div
                    key={route.index}
                    className={`${styles.routeOption} ${
                      route.index === selectedRouteIndex ? styles.routeOptionSelected : ''
                    }`}
                    onClick={() => handleRouteSelect(route.index)}
                  >
                    <Stack gap="xs">
                      <div className={styles.routeInfo}>
                        <div className={styles.routeTime}>
                          <Clock size={16} />
                          <Text fw={500}>{route.duration}</Text>
                        </div>
                        <div className={styles.routeDistance}>
                          <Navigation size={16} />
                          <Text>{route.distance}</Text>
                        </div>
                      </div>
                      <Text size="sm" color="dimmed">
                        Vía {route.summary}
                      </Text>
                      {route.warnings?.map((warning: string, i: number) => (
                        <Badge key={i} color="yellow" size="sm">
                          {warning}
                        </Badge>
                      ))}
                    </Stack>
                  </div>
                ))}
              </div>
        
              {routes.length > 0 && (
                <div className={styles.routeActionsRow}>
                  <Button
                    className={styles.cancelButton}
                    onClick={() => setShowRouteMap(false)}
                    size="lg"
                    color="red"
                    variant="outline"
                    style={{ flex: 1 }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className={styles.selectRouteButton}
                    onClick={handleRouteConfirm}
                    size="lg"
                    leftSection={<MapPin size={18} />}
                    loading={isLoading}
                    style={{ flex: 1 }}
                  >
                    Confirmar ruta
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Modal>
</Container>
</Container>
);
  }
  
}
export default ReservarView;