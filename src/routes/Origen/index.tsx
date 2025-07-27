import { useState, useEffect, useRef } from 'react';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { Container, TextInput, Text, Button, Title } from '@mantine/core';
import { ArrowLeft, MapPin, Navigation, Search, Star, Clock } from 'lucide-react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useMaps } from '@/components/GoogleMapsProvider';
import { getPlaceSuggestions, getPlaceDetails, reverseGeocode } from '@/services/googleMaps';
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

function OrigenView() {
  const navigate = useNavigate();
  const { isLoaded, loadError } = useMaps();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Suggestion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [recentSearches] = useState<string[]>([
    'Universidad Javeriana Cali',
    'Universidad Autónoma de Occidente',
    'Universidad Icesi',
    'Universidad del Valle - Univalle'
  ]);
  const [popularPlaces] = useState<string[]>([
    'Universidad San Buenaventura',
    'Universidad Libre Cali',
    'Universidad Santiago de Cali',
    'Centro de Cali - Plaza Caicedo'
  ]);

  const mapRef = useRef<google.maps.Map | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  // Verificar si Google Maps está cargado
  useEffect(() => {
    if (loadError) {
      console.error('Google Maps load error:', loadError);
      setError('Error cargando Google Maps. Por favor, recarga la página.');
    } else if (isLoaded) {
      console.log('✅ Google Maps loaded successfully');
      setError(null);
    }
  }, [isLoaded, loadError]);

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
          // Ubicación por defecto (Cali)
          setCurrentLocation({ lat: 3.4516, lng: -76.5320 });
        }
      );
    } else {
      setCurrentLocation({ lat: 3.4516, lng: -76.5320 });
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
          console.log('🔍 Searching places with backend service:', searchTerm);
          const suggestions = await getPlaceSuggestions(searchTerm);
          console.log('✅ Search results received:', suggestions.length);
          setResults(suggestions);
          setIsSearching(false);
        } catch (error) {
          console.error('❌ Error searching places:', error);
          setError('Error al buscar ubicaciones. Intenta nuevamente.');
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
      console.log('📍 Getting place details for:', suggestion.placeId);
      
      // Usar el servicio del backend para obtener detalles del lugar
      const placeDetails = await getPlaceDetails(suggestion.placeId);
      
      if (placeDetails && placeDetails.location) {
        setSelectedLocation(placeDetails.location);
        setSelectedAddress(placeDetails.formattedAddress);
        setSearchTerm(placeDetails.formattedAddress);
        setShowMap(true);
        setResults([]);

        console.log('✅ Place details received:', placeDetails);

        // Animar el mapa suavemente
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.panTo(placeDetails.location);
            mapRef.current.setZoom(16);
          }
        }, 100);
      } else {
        setError('Error al obtener detalles del lugar');
      }
      
    } catch (err) {
      console.error('❌ Error getting place details:', err);
      setError('Error al obtener la ubicación del origen. Intenta nuevamente.');
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
      console.log('🗺️ Reverse geocoding location:', location);
      
      // Usar el servicio del backend para geocodificación inversa
      const address = await reverseGeocode(location.lat, location.lng);
      
      if (address) {
        setSelectedLocation(location);
        setSelectedAddress(address);
        setSearchTerm(address);
        setResults([]);
        console.log('✅ Address found:', address);
      } else {
        setError('No se pudo obtener la dirección de esta ubicación');
      }
    } catch (err) {
      console.error('❌ Error reverse geocoding:', err);
      setError('Error al obtener la dirección');
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!currentLocation) {
      setError('No se pudo obtener tu ubicación actual');
      return;
    }

    setSelectedLocation(currentLocation);
    setShowMap(true);
    
    try {
      console.log('📍 Getting address for current location:', currentLocation);
      
      // Obtener dirección de la ubicación actual usando el servicio del backend
      const address = await reverseGeocode(currentLocation.lat, currentLocation.lng);
      
      if (address) {
        setSelectedAddress(address);
        setSearchTerm(address);
        console.log('✅ Current location address:', address);
      } else {
        setSelectedAddress('Ubicación actual');
        setSearchTerm('Ubicación actual');
      }

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.panTo(currentLocation);
          mapRef.current.setZoom(16);
        }
      }, 100);
    } catch (err) {
      console.error('❌ Error with current location:', err);
      setError('Error al procesar tu ubicación actual');
    }
  };

  const handleQuickSearch = (place: string) => {
    setSearchTerm(place);
    setError(null);
  };

  const handleContinue = () => {
    if (selectedAddress) {
      navigate({
        to: '/Destino',
        search: { originAddress: selectedAddress },
      });
    }
  };

  return (
    <ErrorBoundary>
      <Container fluid className={styles.container}>
        <div className={styles.header}>
          <Link to="/publicarviaje" className={styles.backButton}>
            <ArrowLeft size={24} />
          </Link>
          <Title order={4} className={styles.headerTitle}>Origen del viaje</Title>
        </div>

      <div className={styles.searchSection}>
        <div className={styles.searchBox}>
          <MapPin className={styles.searchIcon} size={20} />
          <TextInput
            placeholder="Escribe la dirección completa"
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
                <Text className={styles.currentLocationText}>Usar ubicación actual</Text>
                <Text className={styles.currentLocationSubtext}>Detectar automáticamente</Text>
              </div>
            </button>

            {/* Búsquedas recientes */}
            <div className={styles.suggestionsSection}>
              <div className={styles.suggestionHeader}>
                <Clock size={16} className={styles.suggestionIcon} />
                <Text className={styles.suggestionTitle}>Búsquedas recientes</Text>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  className={styles.suggestionItem}
                  onClick={() => handleQuickSearch(search)}
                >
                  <Clock size={16} className={styles.suggestionItemIcon} />
                  <Text className={styles.suggestionItemText}>{search}</Text>
                </button>
              ))}
            </div>

            {/* Lugares populares */}
            <div className={styles.suggestionsSection}>
              <div className={styles.suggestionHeader}>
                <Star size={16} className={styles.suggestionIcon} />
                <Text className={styles.suggestionTitle}>Lugares populares</Text>
              </div>
              {popularPlaces.map((place, index) => (
                <button
                  key={index}
                  className={styles.suggestionItem}
                  onClick={() => handleQuickSearch(place)}
                >
                  <Star size={16} className={styles.suggestionItemIcon} />
                  <Text className={styles.suggestionItemText}>{place}</Text>
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
              <Text className={styles.noMapTitle}>Selecciona tu origen</Text>
              <Text className={styles.noMapSubtitle}>
                Busca una dirección, explora lugares populares o usa tu ubicación actual
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
            center={selectedLocation || currentLocation || { lat: 3.4516, lng: -76.5320 }}
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
                  fillColor: '#00ff9d',
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
    </ErrorBoundary>
  );
}export const Route = createFileRoute('/Origen/')({
  component: OrigenView,
});

export default OrigenView;
