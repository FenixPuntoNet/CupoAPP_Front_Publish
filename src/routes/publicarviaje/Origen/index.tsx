import { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { createFileRoute } from '@tanstack/react-router';
import { MapPin, Clock, Search, Locate } from 'lucide-react';
import { useOptimizedMaps } from '@/hooks/useOptimizedMaps';
import { useBackendAuth } from '@/context/BackendAuthContext';
import { getCurrentUserProfile } from '@/services/profile';
import styles from './index.module.css';

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

interface UserProfile {
  id: number | string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  [key: string]: any;
}

function OrigenView() {
  const navigate = useNavigate();
  const { user } = useBackendAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Suggestion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  // Modal state for confirmation
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingDestination, setPendingDestination] = useState<string | null>(null);
  // User profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Load user profile on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profileResponse = await getCurrentUserProfile();
        if (profileResponse.success && profileResponse.data) {
          setUserProfile(profileResponse.data);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };

    loadUserProfile();
  }, []);

  // Destinos populares según las imágenes
  const popularDestinations = [
    'Jamundi, Valle del Cauca, Colombia',
    'Cali, Valle del Cauca, Colombia',
    'Yumbo, Valle del Cauca, Colombia',
    'Medellin, Colombia',
    'Bogota, Colombia',
  ];

  // Búsquedas recientes simuladas
  const recentSearches = [
    'Universidad Javeriana Cali',
    'Universidad Autónoma de Occidente',
    'Universidad Icesi',
    'Universidad del Valle - Univalle'
  ];

  const { searchPlaces, getAddressFromCoords } = useOptimizedMaps();
  const searchTimeout = useRef<NodeJS.Timeout>();

  // Búsqueda con debounce
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (searchTerm && !selectedLocation) {
      setIsSearching(true);
      setError(null);
      searchTimeout.current = setTimeout(async () => {
        try {
          const suggestions = await searchPlaces(searchTerm);
          const convertedResults: Suggestion[] = suggestions.map(suggestion => ({
            placeId: suggestion.placeId,
            mainText: suggestion.mainText,
            secondaryText: suggestion.secondaryText,
            fullText: suggestion.fullText,
            types: suggestion.types
          }));
          setResults(convertedResults);
          setIsSearching(false);
        } catch (error) {
          setError('Error al buscar ubicaciones. Intenta nuevamente.');
          setResults([]);
          setIsSearching(false);
        }
      }, 500);
    } else if (!searchTerm) {
      setResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm, selectedLocation, searchPlaces]);

  const handlePlaceSelect = (suggestion: Suggestion) => {
    setSelectedAddress(suggestion.fullText);
    setSelectedLocation({ lat: 0, lng: 0 });
    setSearchTerm('');
    setResults([]);
    setError(null);

    // Navegar automáticamente al seleccionar
    navigate({
      to: '/publicarviaje/punto-recogida',
      search: { selectedAddress: suggestion.fullText }
    });
  };

  const handleDestinationSelect = (destination: string) => {
    setSelectedAddress(destination);
    setSelectedLocation({ lat: 0, lng: 0 });
    setPendingDestination(destination);
    setShowConfirmModal(true);
  };

  // Modal handlers
  const handleConfirmYes = () => {
    if (pendingDestination) {
      navigate({
        to: '/publicarviaje/Destino',
        search: {
          originAddress: pendingDestination,
          pickupSafePointId: '0'
        }
      });
    }
    setShowConfirmModal(false);
    setPendingDestination(null);
  };

  const handleConfirmNo = () => {
    if (pendingDestination) {
      navigate({
        to: '/publicarviaje/punto-recogida',
        search: { selectedAddress: pendingDestination }
      });
    }
    setShowConfirmModal(false);
    setPendingDestination(null);
  };

  const handleCurrentLocation = async () => {
    setError(null);
    setIsGettingLocation(true);

    if (!('geolocation' in navigator)) {
      setError('Geolocalización no disponible en este navegador');
      setIsGettingLocation(false);
      return;
    }

    // Verificar que getAddressFromCoords esté disponible
    if (!getAddressFromCoords) {
      setError('Servicio de geocodificación no disponible');
      setIsGettingLocation(false);
      return;
    }

    // Configurar opciones de geolocalización mejoradas
    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // 15 segundos para dar más tiempo a la localización precisa
      maximumAge: 0 // No usar cache - siempre obtener posición actual
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          console.log('🗺️ Ubicación obtenida:', { latitude, longitude });

          const address = await getAddressFromCoords(latitude, longitude);

          if (address) {
            console.log('📍 Dirección obtenida:', address);
            setSelectedAddress(address);
            setSelectedLocation({ lat: latitude, lng: longitude });

            // Mostrar confirmación igual que otros destinos
            setPendingDestination(address);
            setShowConfirmModal(true);
          } else {
            setError('No se pudo obtener la dirección de tu ubicación. Intenta de nuevo.');
            setIsGettingLocation(false);
          }
        } catch (error) {
          console.error('❌ Error al convertir coordenadas:', error);
          setError('Error al obtener la dirección actual. Intenta de nuevo.');
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error('❌ Error de geolocalización:', error);
        let errorMessage = 'Error al obtener la ubicación actual';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permisos de ubicación denegados. Por favor, permite el acceso a tu ubicación en la configuración del navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible. Verifica que tu GPS está activado y tienes conexión a internet.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo agotado al obtener ubicación. Asegúrate de estar en un lugar abierto e intenta de nuevo.';
            break;
        }

        setError(errorMessage);
        setIsGettingLocation(false);
      },
      options
    );
  };

  return (
    <div className={styles.container}>
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.7)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#111',
            padding: 32,
            width: '100vw',
            height: '100vh',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'start',
            justifyContent: 'center',
            color: '#ddd',
          }}>
            <h2 style={{ marginBottom: 16 }} className='text-5xl tracking-tight text-pretty'>
              <span className='text-green-400'>{userProfile?.first_name ? 
                userProfile.first_name : 
                user?.username || ''
              }</span><br />¿Tu punto de recogida es el mismo de descenso?
            </h2>
            <div className='bg-green-400 w-10 h-1 relative'></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'start' }} className='mt-8'>
              <a onClick={handleConfirmYes} href='#' className='text-left text-3xl text-green-400 tracking-tighter'>Sí,<br />son el mismo punto</a>
              <a onClick={handleConfirmNo} href='#' className='text-left text-sm mt-2 text-white/20 tracking-tighter'>No,<br />deseo seleccionar manualmente los puntos</a>
            </div>
          </div>
        </div>
      )}
      {/* Sección del título mejorada */}
      <div className={styles.titleSection}>
        <h1 className={styles.mainTitle}>
          ¿Desde dónde quieres viajar?
        </h1>
        <p className={styles.subtitle}>
          Escoge tu punto de partida para comenzar tu viaje
        </p>
      </div>

      {/* Sección de búsqueda */}
      <div className={styles.searchSection}>
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} size={20} />
          <input
            type="text"
            className={styles.input}
            placeholder="Escribe la dirección completa"
            value={selectedAddress || searchTerm}
            onChange={(e) => {
              if (!selectedAddress) {
                setSearchTerm(e.target.value);
              }
            }}
            onFocus={() => {
              if (selectedAddress) {
                setSelectedAddress('');
                setSelectedLocation(null);
              }
            }}
          />
          {isSearching && (
            <div className={styles.searchLoader}>
              <div className={styles.spinner} />
            </div>
          )}
        </div>        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}
      </div>

      <div className={styles.content}>
        {results.length > 0 && !selectedAddress && (
          <div className={styles.suggestionsContainer}>
            {results.map((suggestion) => (
              <button
                key={suggestion.placeId}
                className={styles.suggestionItem}
                onClick={() => handlePlaceSelect(suggestion)}
              >
                <MapPin className={styles.suggestionIcon} size={16} />
                <div className={styles.suggestionText}>
                  <div className={styles.suggestionTextTitle}>
                    {suggestion.mainText}
                  </div>
                  {suggestion.secondaryText && (
                    <div className={styles.suggestionTextSubtitle}>
                      {suggestion.secondaryText}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {!searchTerm && results.length === 0 && !selectedAddress && (
          <div className={styles.suggestionsContainer}>
            <button
              className={styles.currentLocationButton}
              onClick={handleCurrentLocation}
              disabled={isGettingLocation}
            >
              <Locate className={styles.currentLocationIcon} size={20} />
              <div className={styles.currentLocationContent}>
                <div className={styles.currentLocationText}>
                  {isGettingLocation ? 'Obteniendo ubicación...' : 'Utilizar ubicación actual'}
                </div>
                <div className={styles.currentLocationSubtext}>
                  {isGettingLocation ? 'Por favor espera...' : 'Obtener tu ubicación automáticamente'}
                </div>
              </div>
            </button>

            <div className={styles.suggestionsSection}>
              <div className={styles.suggestionHeader}>
                <Clock className={styles.suggestionIcon} size={16} />
                <span>Destinos populares</span>
              </div>
              {popularDestinations.map((destination, index) => (
                <button
                  key={index}
                  className={styles.suggestionItem}
                  onClick={() => handleDestinationSelect(destination)}
                >
                  <MapPin className={styles.suggestionIcon} size={16} />
                  <div className={styles.suggestionText}>
                    <div className={styles.suggestionTextTitle}>
                      {destination}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {recentSearches.length > 0 && (
              <div className={styles.suggestionsSection}>
                <div className={styles.suggestionHeader}>
                  <Clock className={styles.suggestionIcon} size={16} />
                  <span>Búsquedas recientes</span>
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    className={styles.suggestionItem}
                    onClick={() => handleDestinationSelect(search)}
                  >
                    <MapPin className={styles.suggestionIcon} size={16} />
                    <div className={styles.suggestionText}>
                      <div className={styles.suggestionTextTitle}>
                        {search}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/publicarviaje/Origen/')({
  component: OrigenView,
});

export default OrigenView;