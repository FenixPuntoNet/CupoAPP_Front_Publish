  import { useState, useEffect, useRef } from 'react';
  import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
  import { Container, TextInput, Text, Button, Title } from '@mantine/core';
  import { ArrowLeft, MapPin } from 'lucide-react';
  import { GoogleMap, Marker } from '@react-google-maps/api';
  import { mapOptions } from '../../types/PublicarViaje/TripDataManagement';
  import styles from './index.module.css';
  // Importa las utilidades
  interface Suggestion {
    id: string;
    description: string;
    main_text: string;
    secondary_text: string;
  }

  interface Location {
    lat: number;
    lng: number;
  }

  function OrigenView() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Suggestion[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [showMap, setShowMap] = useState(false);
    const [, setError] = useState<string | null>(null);
    const [, setIsSearching] = useState(false);

    const mapRef = useRef<google.maps.Map | null>(null);
    const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
    const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
    const searchTimeout = useRef<NodeJS.Timeout>();

    useEffect(() => {
      if (window.google && !autocompleteServiceRef.current) {
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      }
    }, []);

    useEffect(() => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }

      if (searchTerm && !selectedLocation) {
        setIsSearching(true);
        searchTimeout.current = setTimeout(() => {
          if (autocompleteServiceRef.current) {
            const request: google.maps.places.AutocompletionRequest = {
              input: searchTerm,
              componentRestrictions: { country: 'co' },
            };

            autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
              setIsSearching(false);
              if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                setResults(
                  predictions.map((prediction) => ({
                    id: prediction.place_id,
                    description: prediction.description,
                    main_text: prediction.structured_formatting.main_text,
                    secondary_text: prediction.structured_formatting.secondary_text,
                  }))
                );
              } else {
                setResults([]);
              }
            });
          }
        }, 300);
      }

      return () => {
        if (searchTimeout.current) {
          clearTimeout(searchTimeout.current);
        }
      };
    }, [searchTerm, selectedLocation]);

    const handlePlaceSelect = async (suggestion: Suggestion) => {
      if (!placesServiceRef.current) return;

      try {
        const result = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
          placesServiceRef.current?.getDetails(
            { placeId: suggestion.id, fields: ['geometry', 'formatted_address'] },
            (place, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                resolve(place);
              } else {
                reject(new Error('Error obteniendo detalles del lugar'));
              }
            }
          );
        });

        if (result.geometry?.location) {
          const location = {
            lat: result.geometry.location.lat(),
            lng: result.geometry.location.lng(),
          };

          // Actualizar estados en orden para una transición suave
          setSelectedLocation(location);
          setSelectedAddress(result.formatted_address || suggestion.description);
          setSearchTerm(result.formatted_address || suggestion.description);
          setShowMap(true);
          setResults([]); // Cerrar la lista después de seleccionar

          // Asegurar que el mapa se actualice correctamente
          requestAnimationFrame(() => {
            if (mapRef.current) {
              mapRef.current.panTo(location);
              mapRef.current.setZoom(15);
            }
          });
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Error al obtener la ubicación');
      }
    };

    const handleMapClick = async (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;

      const location = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };

      try {
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({ location });
        if (response.results[0]) {
          setSelectedLocation(location);
          setSelectedAddress(response.results[0].formatted_address);
          setSearchTerm(response.results[0].formatted_address);
          setResults([]); // Cerrar la lista si está abierta
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Error al obtener la dirección');
      }
    };

    const handleContinue = () => {
      if (selectedAddress) {
        navigate({
          to: '/publicarviaje',
          search: { selectedAddress },
        });
      }
    };

    return (
      <Container fluid className={styles.container}>
        <div className={styles.searchSection}>
          <div className={styles.header}>
            <Link to="/publicarviaje" className={styles.backButton}>
              <ArrowLeft size={24} />
            </Link>
            <Title order={4} className={styles.headerTitle}>Origen del viaje</Title>
          </div>

          <div className={styles.searchBox}>
            <MapPin className={styles.searchIcon} size={20} />
            <TextInput
              placeholder="¿Desde dónde sales?"
              value={searchTerm}
              onChange={(e) => {
                const newValue = e.currentTarget.value;
                setSearchTerm(newValue);
                if (newValue === '') {
                  setSelectedLocation(null);
                  setShowMap(false);
                }
              }}
              variant="unstyled"
              className={styles.input}
            />
          </div>

          {results.length > 0 && !selectedLocation && (
            <div className={styles.resultsList}>
              {results.map((result) => (
                <button
                  key={result.id}
                  className={styles.resultItem}
                  onClick={() => handlePlaceSelect(result)}
                >
                  <MapPin size={18} className={styles.resultIcon} />
                  <div className={styles.resultContent}>
                    <Text className={styles.mainText}>{result.main_text}</Text>
                    <Text className={styles.secondaryText}>{result.secondary_text}</Text>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`${styles.mapSection} ${showMap ? styles.mapSectionVisible : ''}`}>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            options={{
              ...mapOptions,
              gestureHandling: 'greedy',
            }}
            center={selectedLocation || { lat: 4.6097, lng: -74.0817 }}
            zoom={13}
            onClick={handleMapClick}
            onLoad={(map) => {
              mapRef.current = map;
              placesServiceRef.current = new google.maps.places.PlacesService(map);
            }}
          >
            {selectedLocation && (
              <Marker
                position={selectedLocation}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 7,
                  fillColor: '#00ff9d',
                  fillOpacity: 1,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 2,
                }}
              />
            )}
          </GoogleMap>
        </div>

        {selectedLocation && (
          <Button className={styles.confirmButton} onClick={handleContinue}>
            Siguiente
          </Button>
        )}
      </Container>
    );
  }

  export const Route = createFileRoute('/Origen/')({
    component: OrigenView,
  });

  export default OrigenView;