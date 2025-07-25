import { useState, useEffect, useRef } from 'react';
import { Link, createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { Container, TextInput, Text, Button, Title } from '@mantine/core';
import { ArrowLeft, MapPin, Navigation, Search, Star, Clock } from 'lucide-react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { getPlaceSuggestions, getPlaceDetails } from '@/services/googleMaps';
import styles from './index.module.css';

// Interfaces
interface Suggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
  types?: string[];
}

interface Location {
  lat: number; 
  lng: number;
}

function DestinoView() {
  const navigate = useNavigate();
  const { originAddress = '' } = useSearch({ from: '/Destino/' });
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Suggestion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [popularDestinations] = useState<string[]>([
    'Aeropuerto El Dorado',
    'Terminal de Transporte',
    'Centro Comercial Andino',
    'Zona Rosa',
    'Universidad Nacional'
  ]);
  const [recentDestinations] = useState<string[]>([
    'Medellín, Antioquia',
    'Cali, Valle del Cauca',
    'Cartagena, Bolívar',
    'Bucaramanga, Santander'
  ]);

  const mapRef = useRef<google.maps.Map | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  // Configuración básica del mapa
  const mapOptions: google.maps.MapOptions = {
    styles: [
      {
        featureType: "all",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b6b6b" }]
      }
    ],
    disableDefaultUI: true,
    zoomControl: true,
  };

  // Obtener ubicación actual del usuario
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          // Ubicación por defecto (Bogotá)
          setCurrentLocation({ lat: 4.6097, lng: -74.0817 });
        }
      );
    } else {
      setCurrentLocation({ lat: 4.6097, lng: -74.0817 });
    }
  }, []);

  // Manejar búsqueda con debounce usando el servicio del backend
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (searchTerm && !selectedLocation) {
      setIsSearching(true);
      setError(null);
      searchTimeout.current = setTimeout(async () => {
        try {
          const suggestions = await getPlaceSuggestions(searchTerm);
          setResults(suggestions);
          setIsSearching(false);
        } catch (error) {
          console.error('Error searching places:', error);
          setError('Error al buscar destinos. Intenta nuevamente.');
          setResults([]);
          setIsSearching(false);
        }
      }, 300);
    } else if (!searchTerm) {
      setResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm, selectedLocation]);

  const handlePlaceSelect = async (suggestion: Suggestion) => {
    try {
      setError(null);
      
      // Usar el backend service para obtener detalles del lugar
      const placeDetails = await getPlaceDetails(suggestion.placeId);
      
      if (placeDetails) {
        const location = {
          lat: placeDetails.location.lat,
          lng: placeDetails.location.lng,
        };

        setSelectedLocation(location);
        setSelectedAddress(placeDetails.formattedAddress || suggestion.fullText);
        setSearchTerm(placeDetails.formattedAddress || suggestion.fullText);
        setShowMap(true);
        setResults([]);

        // Animar el mapa suavemente
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.panTo(location);
            mapRef.current.setZoom(16);
          }
        }, 100);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error al obtener la ubicación del destino. Intenta nuevamente.');
    }
  };

  const handleMapClick = async (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;

    const location = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };

    try {
      setError(null);
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ location });
      
      if (response.results[0]) {
        setSelectedLocation(location);
        setSelectedAddress(response.results[0].formatted_address);
        setSearchTerm(response.results[0].formatted_address);
        setResults([]);
      } else {
        setError('No se pudo obtener la dirección de esta ubicación');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error al obtener la dirección');
    }
  };

  const handleUseCurrentLocation = () => {
    if (currentLocation) {
      setSelectedLocation(currentLocation);
      setShowMap(true);
      
      // Obtener dirección de la ubicación actual
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: currentLocation }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          setSelectedAddress(results[0].formatted_address);
          setSearchTerm(results[0].formatted_address);
        } else {
          setSelectedAddress('Ubicación actual');
          setSearchTerm('Ubicación actual');
        }
      });

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.panTo(currentLocation);
          mapRef.current.setZoom(16);
        }
      }, 100);
    }
  };

  const handleQuickSearch = (destination: string) => {
    setSearchTerm(destination);
    setError(null);
  };

  const handleContinue = () => {
    if (selectedAddress && originAddress) {
      navigate({
        to: '/publicarviaje',
        search: {
          selectedAddress: originAddress,
          selectedDestination: selectedAddress,
        },
      });
    }
  };

  return (
    <Container fluid className={styles.container}>
      <div className={styles.header}>
        <Link to="/publicarviaje" className={styles.backButton}>
          <ArrowLeft size={24} />
        </Link>
        <Title order={4} className={styles.headerTitle}>Destino del viaje</Title>
      </div>

      <div className={styles.searchSection}>
        <div className={styles.originInfo}>
          <MapPin size={16} className={styles.originIcon} />
          <Text className={styles.originText}>Desde: {originAddress}</Text>
        </div>

        <div className={styles.searchBox}>
          <MapPin className={styles.searchIcon} size={20} />
          <TextInput
            placeholder="¿A dónde quieres ir?"
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
          {isSearching && (
            <div className={styles.searchLoader}>
              <div className={styles.spinner}></div>
            </div>
          )}
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <Text size="sm" color="red">{error}</Text>
          </div>
        )}

        {results.length > 0 && !selectedLocation && (
          <div className={styles.resultsList}>
            {results.map((result) => (
              <button
                key={result.placeId}
                className={styles.resultItem}
                onClick={() => handlePlaceSelect(result)}
              >
                <MapPin size={18} className={styles.resultIcon} />
                <div className={styles.resultContent}>
                  <Text className={styles.mainText}>{result.mainText}</Text>
                  <Text className={styles.secondaryText}>{result.secondaryText}</Text>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Mostrar sugerencias cuando no hay búsqueda activa */}
        {!searchTerm && !selectedLocation && (
          <div className={styles.suggestionsContainer}>
            {/* Botón de ubicación actual */}
            <button
              className={styles.currentLocationButton}
              onClick={handleUseCurrentLocation}
            >
              <Navigation size={20} className={styles.currentLocationIcon} />
              <div className={styles.currentLocationContent}>
                <Text className={styles.currentLocationText}>Usar ubicación actual como destino</Text>
                <Text className={styles.currentLocationSubtext}>Detectar automáticamente</Text>
              </div>
            </button>

            {/* Destinos populares */}
            <div className={styles.suggestionsSection}>
              <div className={styles.suggestionHeader}>
                <Star size={16} className={styles.suggestionIcon} />
                <Text className={styles.suggestionTitle}>Destinos populares</Text>
              </div>
              {popularDestinations.map((destination, index) => (
                <button
                  key={index}
                  className={styles.suggestionItem}
                  onClick={() => handleQuickSearch(destination)}
                >
                  <Star size={16} className={styles.suggestionItemIcon} />
                  <Text className={styles.suggestionItemText}>{destination}</Text>
                </button>
              ))}
            </div>

            {/* Destinos recientes */}
            <div className={styles.suggestionsSection}>
              <div className={styles.suggestionHeader}>
                <Clock size={16} className={styles.suggestionIcon} />
                <Text className={styles.suggestionTitle}>Destinos recientes</Text>
              </div>
              {recentDestinations.map((destination, index) => (
                <button
                  key={index}
                  className={styles.suggestionItem}
                  onClick={() => handleQuickSearch(destination)}
                >
                  <Clock size={16} className={styles.suggestionItemIcon} />
                  <Text className={styles.suggestionItemText}>{destination}</Text>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mapa */}
      <div className={`${styles.mapSection} ${showMap ? styles.mapSectionVisible : ''}`}>
        {!showMap && (
          <div className={styles.noMapContainer}>
            <div className={styles.noMapContent}>
              <Search size={48} className={styles.noMapIcon} />
              <Text className={styles.noMapTitle}>Selecciona tu destino</Text>
              <Text className={styles.noMapSubtitle}>
                Busca una dirección, explora destinos populares o usa tu ubicación actual
              </Text>
            </div>
          </div>
        )}
        
        {showMap && (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            options={{
              ...mapOptions,
              gestureHandling: 'greedy',
              zoomControl: true,
              streetViewControl: false,
              fullscreenControl: false,
              mapTypeControl: false,
            }}
            center={selectedLocation || currentLocation || { lat: 4.6097, lng: -74.0817 }}
            zoom={selectedLocation ? 16 : 13}
            onClick={handleMapClick}
            onLoad={(map: google.maps.Map) => {
              mapRef.current = map;
            }}
          >
            {selectedLocation && (
              <Marker
                position={selectedLocation}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: '#ff3366',
                  fillOpacity: 1,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 3,
                }}
              />
            )}
          </GoogleMap>
        )}
      </div>

      {selectedLocation && (
        <Button className={styles.confirmButton} onClick={handleContinue}>
          Siguiente
        </Button>
      )}
    </Container>
  );
}

export const Route = createFileRoute('/Destino/')({
  validateSearch: (search: Record<string, unknown>) => ({
    originAddress: search.originAddress as string | undefined,
  }),
  component: DestinoView,
});

export default DestinoView;
