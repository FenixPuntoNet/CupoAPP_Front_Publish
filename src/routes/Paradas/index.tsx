import  { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link, createFileRoute } from '@tanstack/react-router';
import {
    Container,
    Title,
    Button,
    Text,
    UnstyledButton,
    Checkbox,
    LoadingOverlay,
    Alert,
    Collapse
} from '@mantine/core';
import { ArrowLeft, MapPin, AlertCircle } from 'lucide-react';
import { GoogleMap,  } from '@react-google-maps/api';
import {
    tripStore,
    type TripLocation,
    type TripStopover,
    type StopData
} from '../../types/PublicarViaje/TripDataManagement';
import styles from './index.module.css';

interface StopLocation extends TripLocation {
    distance: string;
    duration: string;
}

interface MarkerIcons {
    origin: google.maps.Symbol;
    destination: google.maps.Symbol;
    stopover: google.maps.Symbol;
}

function ParadasView() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [allStops, setAllStops] = useState<StopLocation[]>([]); // Todas las paradas
    const [displayedStops, setDisplayedStops] = useState<StopLocation[]>([]); // Paradas mostradas inicialmente
    const [selectedStops, setSelectedStops] = useState<Set<string>>(new Set());
    const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
    const [markerIcons, setMarkerIcons] = useState<MarkerIcons | null>(null);
    const [, setRoutePath] = useState<google.maps.LatLng[]>([]);
    const [showAllStops, setShowAllStops] = useState(false); // Estado para mostrar todas las paradas

    const mapRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const directionsRef = useRef<google.maps.DirectionsResult | null>(null);

     // Inicializar los iconos de marcadores
    const initializeMarkerIcons = useCallback(() => {
        if (!window.google) return null;

        return {
            origin: {
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: "#4CAF50",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#FFFFFF',
                scale: 7,
            },
            destination: {
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: "#FF0000",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#FFFFFF',
                scale: 7,
            },
            stopover: {
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: "#2196F3",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#FFFFFF',
                scale: 7,
            }
        };
    }, []);

    // Función para cargar la ruta seleccionada
    const loadSelectedRoute = useCallback(() => {
        const selectedRoute = tripStore.getSelectedRoute();
        if (!selectedRoute) {
            throw new Error('No hay una ruta seleccionada.');
        }
        return selectedRoute;
    }, []);

    // Función para calcular distancia y duración para una parada
    const calculateStopInfo = useCallback(async (
      stopLocation: google.maps.LatLngLiteral,
      origin: TripLocation
    ): Promise<{ distance: string; duration: string }> => {
      if (!window.google) throw new Error('Google Maps no está cargado');

      const service = new google.maps.DistanceMatrixService();
      const result = await service.getDistanceMatrix({
        origins: [origin.coords],
        destinations: [stopLocation],
        travelMode: google.maps.TravelMode.DRIVING,
      });

      return {
        distance: result.rows[0].elements[0].distance.text,
        duration: result.rows[0].elements[0].duration.text,
      };
    }, []);

    // Buscar ciudades y pueblos cercanos
    const findStopsAlongRoute = useCallback(async () => {
        if (!window.google || !mapRef.current) {
            throw new Error('Google Maps no está inicializado');
        }

    
        const origin = tripStore.getOrigin();
        const destination = tripStore.getDestination();

        if (!origin || !destination) {
            throw new Error('Origen o destino no configurado.');
        }

      const directionsService = new google.maps.DirectionsService();
      const result = await directionsService.route({
        origin: origin.coords,
        destination: destination.coords,
        travelMode: google.maps.TravelMode.DRIVING,
      });

        if (!result.routes[0]) {
            throw new Error('No se pudo calcular la ruta.');
        }

      directionsRef.current = result;
      const path = result.routes[0].overview_path;
      setRoutePath(path);

      const stops = new Map<string, StopLocation>();
      const placesService = new google.maps.places.PlacesService(mapRef.current);

        const searchPromises: Promise<void>[] = [];

        for (let i = 0; i < path.length; i += 20) {
          const location = path[i];
          
           const promise = new Promise<void>((resolve) => {
            const request: google.maps.places.PlaceSearchRequest = {
              location,
              radius: 5000,
              type: 'locality',
            };
    
            placesService.nearbySearch(request, async (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                    for (const place of results) {
                    if (
                      place.place_id &&
                      place.name &&
                      place.geometry?.location &&
                      !stops.has(place.place_id)
                    ) {
                        try {
                           const stopInfo = await calculateStopInfo(
                            {
                              lat: place.geometry.location.lat(),
                              lng: place.geometry.location.lng()
                            },
                            origin
                          );
                             stops.set(place.place_id, {
                                location_id: 0, // Dummy value, as we don't have location id here.
                                placeId: place.place_id,
                                address: place.vicinity || '',
                                coords: {
                                  lat: place.geometry.location.lat(),
                                  lng: place.geometry.location.lng(),
                                },
                                mainText: place.name,
                                secondaryText: place.vicinity || '',
                                distance: stopInfo.distance,
                                duration: stopInfo.duration,
                              });
                            
                         } catch (error) {
                           console.error('Error calculando info de parada:', error);
                         }
                    }
                  }
                }
                resolve();
            });
        });
         searchPromises.push(promise);
      }

        await Promise.all(searchPromises);
        
        return Array.from(stops.values()).sort((a, b) => {
          const distA = Number.parseInt(a.distance.replace(/[^0-9]/g, ''));
          const distB = Number.parseInt(b.distance.replace(/[^0-9]/g, ''));
          return distA - distB;
        });
    }, [loadSelectedRoute, calculateStopInfo]);

     // Función para dividir y mostrar las paradas de forma inteligente
    const sliceAndDiceStops = useCallback((stops: StopLocation[]) => {
      if (stops.length <= 6) {
          return stops;
      }
      
      const slicePointStart = Math.min(2, Math.floor(stops.length / 4));
      const slicePointEnd = Math.max(stops.length - 2, Math.floor(stops.length * 3 / 4));

      const firstTwo = stops.slice(0, slicePointStart);
      const middleTwo = stops.slice(Math.floor(stops.length / 2) - 1, Math.floor(stops.length / 2) + 1);
      const lastTwo = stops.slice(slicePointEnd)

      return [...firstTwo, ...middleTwo, ...lastTwo];
    }, []);

    // Actualizar mapa cuando cambian las paradas seleccionadas
    const updateMapDisplay = useCallback(() => {
        if (!mapInstance || !markerIcons) return;

        // Limpiar marcadores anteriores
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        if (directionsRenderer) {
            directionsRenderer.setMap(null);
        }

        const origin = tripStore.getOrigin();
        const destination = tripStore.getDestination();

         if (!origin || !destination || !directionsRef.current) return;
        
        const bounds = new google.maps.LatLngBounds();
          
          // Marcador de origen
          const originMarker = new google.maps.Marker({
            position: origin.coords,
            map: mapInstance,
            icon: markerIcons.origin,
            title: 'Origen'
          });
          markersRef.current.push(originMarker);
          bounds.extend(origin.coords);
      
        // Marcadores de paradas
       allStops
       .filter(stop => selectedStops.has(stop.placeId))
      .forEach(stop => {
        const marker = new google.maps.Marker({
          position: stop.coords,
          map: mapInstance,
          icon: markerIcons.stopover,
          title: stop.mainText
        });
        markersRef.current.push(marker);
        bounds.extend(stop.coords);
      });
        
          // Marcador de destino
          const destinationMarker = new google.maps.Marker({
            position: destination.coords,
            map: mapInstance,
            icon: markerIcons.destination,
            title: 'Destino'
          });
          markersRef.current.push(destinationMarker);
          bounds.extend(destination.coords);
        
        mapInstance.fitBounds(bounds);

        if (!window.google) return;

    const waypoints = Array.from(selectedStops)
        .map(stopId => {
          const stop = allStops.find(s => s.placeId === stopId);
            return stop ? {
              location: new google.maps.LatLng(stop.coords.lat, stop.coords.lng),
              stopover: true
            } : null;
          })
          .filter(Boolean) as google.maps.DirectionsWaypoint[];
        

      // Configurar DirectionsRenderer
      const renderer = new google.maps.DirectionsRenderer({
        map: mapInstance,
        suppressMarkers: true,
        directions: directionsRef.current,
          polylineOptions: {
          strokeColor: '#2196F3',
          strokeWeight: 4,
          strokeOpacity: 0.8
        },
      });
      
       const directionsService = new google.maps.DirectionsService();
      directionsService.route({
        origin: origin.coords,
        destination: destination.coords,
        waypoints,
          optimizeWaypoints: true,
          travelMode: google.maps.TravelMode.DRIVING,
        }, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
              renderer.setDirections(result);
          } else {
            console.error("Error al calcular la ruta con paradas", status);
          }
        });
     
        setDirectionsRenderer(renderer);
    }, [mapInstance, selectedStops, allStops, markerIcons]);

    // Inicializar iconos cuando se carga el mapa
    const handleMapLoad = useCallback((map: google.maps.Map) => {
        setMapInstance(map);
        mapRef.current = map;
        const icons = initializeMarkerIcons();
        if (icons) {
            setMarkerIcons(icons);
        }
    }, [initializeMarkerIcons]);

    // Cargar paradas al montar la vista
    useEffect(() => {
        const loadStops = async () => {
            try {
                setIsLoading(true);
                const stops = await findStopsAlongRoute();
                setAllStops(stops);
                setDisplayedStops(sliceAndDiceStops(stops)); // Inicializar paradas mostradas
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al cargar las paradas.');
            } finally {
                setIsLoading(false);
            }
        };

        if (mapInstance && markerIcons) {
            loadStops();
        }
    }, [findStopsAlongRoute, mapInstance, markerIcons, sliceAndDiceStops]);

     // Actualizar mapa cuando cambian las selecciones
     useEffect(() => {
        if (mapInstance && markerIcons) {
            updateMapDisplay();
        }
    }, [selectedStops, updateMapDisplay, mapInstance, markerIcons]);

    const handleStopToggle = (stopId: string) => {
        const newSelected = new Set(selectedStops);
        if (newSelected.has(stopId)) {
            newSelected.delete(stopId);
        } else {
            newSelected.add(stopId);
        }
        setSelectedStops(newSelected);
    };

     const handleShowAllStops = () => {
        setShowAllStops(!showAllStops);
     };

     const getStopDetails = useCallback(async (placeId: string): Promise<StopData | null> => {
        if (!window.google || !mapRef.current) {
          console.error("Google Maps no está inicializado");
          return null;
        }
    
        const placesService = new google.maps.places.PlacesService(mapRef.current);
        return new Promise((resolve) => {
          placesService.getDetails(
            {
              placeId,
              fields: ["address_components", "formatted_address", "geometry", "name", "place_id", "vicinity"],
            },
            (place, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                const postalCode = place.address_components?.find((component) =>
                component.types.includes("postal_code")
                )?.long_name;
                  resolve({
                    location_id: 0,
                    placeId: place.place_id || "",
                    address: place.formatted_address || place.vicinity || "",
                    postalCode: postalCode || "",
                    coords: {
                      lat: place.geometry?.location?.lat() || 0,
                      lng: place.geometry?.location?.lng() || 0
                    },
                    mainText: place.name || "",
                    secondaryText: place.vicinity || "",
                });
                
              } else {
                console.error("Error al obtener detalles de la parada:", status);
                resolve(null);
              }
            }
          );
        });
      }, []);
    

    const handleConfirm = async () => {
        setIsLoading(true)
      try {
          const selectedStopoversPromises = Array.from(selectedStops).map(async (stopId, index) => {
              const stop = allStops.find((s) => s.placeId === stopId);
                if(!stop) return null;
                 const stopDetails = await getStopDetails(stopId);
                 
            return stopDetails ? {
                location: stopDetails,
                order: index,
              } : null
              
         });

           const selectedStopovers = (await Promise.all(selectedStopoversPromises)).filter(Boolean) as TripStopover[];

            tripStore.updateData({
                stopovers: selectedStopovers,
              currentStep: 'details',
            });

            navigate({ to: '/DetallesViaje' });
      } catch (error) {
        setError(
          error instanceof Error
            ? `Error al confirmar las paradas: ${error.message}`
            : "Error al confirmar las paradas"
        );
      } finally {
          setIsLoading(false);
      }
    };

    return (
        <Container fluid className={styles.container}>
            <LoadingOverlay visible={isLoading} />

            <div className={styles.header}>
                <UnstyledButton component={Link} to="/PublicarViaje" className={styles.backButton}>
                    <ArrowLeft size={24} />
                </UnstyledButton>
                <Title className={styles.headerTitle}>Añade ciudades de paso</Title>
            </div>

            {error && (
                <Alert
                    icon={<AlertCircle size={16} />}
                    title="Error"
                    color="red"
                    variant="filled"
                    className={styles.errorAlert}
                >
                    {error}
                </Alert>
            )}

            <div className={styles.mapContainer}>
                <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '300px' }}
                    options={{
                        gestureHandling: 'greedy',
                        zoomControl: true,
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: true,
                        styles: [
                            {
                                featureType: "road",
                                elementType: "geometry",
                                stylers: [{ color: "#2C2E33" }]
                            },
                            {
                                featureType: "landscape",
                                stylers: [{ color: "#1A1B1E" }]
                            },
                            {
                                featureType: "water",
                                stylers: [{ color: "#2C2E33" }]
                            }
                        ]
                    }}
                    onLoad={handleMapLoad}
                />
            </div>
            
              <div className={styles.stopsContainer}>
                {(showAllStops ? allStops : displayedStops).map((stop) => (
                    <div
                        key={stop.placeId}
                        className={`${styles.stopItem} ${
                            selectedStops.has(stop.placeId) ? styles.stopItemSelected : ''
                        }`}
                    >
                      <div className={styles.stopInfo}>
                        <MapPin size={20} className={styles.stopIcon} />
                        <div>
                          <Text fw={500}>{stop.mainText}</Text>
                          <Text size="sm" color="dimmed">
                              {stop.distance} • +{stop.duration}
                            </Text>
                          </div>
                       </div>
                       <Checkbox
                            checked={selectedStops.has(stop.placeId)}
                            onChange={() => handleStopToggle(stop.placeId)}
                            radius="xl"
                            size="md"
                        />
                    </div>
                ))}
                </div>
                
              <Collapse in={allStops.length > 6}>
                <Button
                    variant="light"
                    size="xs"
                    fullWidth
                    mt="xs"
                    onClick={handleShowAllStops}
                >
                  {showAllStops ? 'Ver menos' : 'Ver más paradas'}
                </Button>
              </Collapse>


            <Button
                fullWidth
                size="lg"
                onClick={handleConfirm}
                 className={styles.confirmButton}
            >
               {selectedStops.size === 0 ? 'Continuar sin paradas' : 'Confirmar Paradas' }
            </Button>
        </Container>
    );
}

export const Route = createFileRoute('/Paradas/')({
    component: ParadasView,
});

export default ParadasView;
