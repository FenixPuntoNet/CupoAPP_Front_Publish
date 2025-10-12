import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { createFileRoute } from '@tanstack/react-router';
import { MapPin, ArrowLeft, Clock, Search } from 'lucide-react';
import { useOptimizedMaps } from '@/hooks/useOptimizedMaps';
import styles from './index.module.css';

interface Suggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
  types?: string[];
}

function DestinoView() {
  const navigate = useNavigate();
  const { originAddress = '', pickupSafePointId = '' } = useSearch({ from: '/publicarviaje/Destino/' });
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Suggestion[]>([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Destinos populares para el destino
  const popularDestinations = [
    'Jamundi, Valle del Cauca, Colombia',
    'Cali, Valle del Cauca, Colombia',
    'Yumbo, Valle del Cauca, Colombia',
    'Medellin, Colombia', 
    'Bogota, Colombia',
  ];

  // Destinos recientes simulados  
  const recentDestinations = [
    'Universidad Libre Cali',
    'Universidad Santiago de Cali', 
    'Universidad Católica Luis Amigó',
    'Aeropuerto Alfonso Bonilla Aragón'
  ];

  const { searchPlaces } = useOptimizedMaps();
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (searchTerm && !selectedAddress) {
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
  }, [searchTerm, selectedAddress, searchPlaces]);

  const handlePlaceSelect = (suggestion: Suggestion) => {
    setSelectedAddress(suggestion.fullText);
    setSearchTerm('');
    setResults([]);
    setError(null);
    
    // Navegar automáticamente al seleccionar
    navigate({
      to: '/publicarviaje/puntos-descenso',
      search: { 
        selectedAddress: originAddress, 
        selectedDestination: suggestion.fullText,
        pickupSafePointId: pickupSafePointId 
      }
    });
  };

  const handleDestinationSelect = (destination: string) => {
    setSelectedAddress(destination);
    
    // Navegar automáticamente al seleccionar
    navigate({
      to: '/publicarviaje/puntos-descenso',
      search: { 
        selectedAddress: originAddress, 
        selectedDestination: destination,
        pickupSafePointId: pickupSafePointId 
      }
    });
  };

  return (
    <div className={styles.container}>
      {/* Header compacto */}
      <header className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => navigate({ 
            to: '/publicarviaje/punto-recogida', 
            search: { 
              selectedAddress: originAddress,
              // Preservar el SafePoint seleccionado al volver
              ...(pickupSafePointId && { pickupSafePointId })
            } 
          })}
        >
          <ArrowLeft size={20} />
        </button>
      </header>

      {/* Sección del título */}
      <div className={styles.titleSection}>
        <h1 className={styles.mainTitle}>
          ¿A dónde vas?
        </h1>
        <p className={styles.subtitle}>
          Selecciona tu destino
        </p>
      </div>

      {originAddress && (
        <div className={styles.originInfo}>
          <MapPin className={styles.originIcon} size={16} />
          <div className={styles.originText}>
            Desde: <strong>{originAddress}</strong>
          </div>
        </div>
      )}

      <div className={styles.searchSection}>
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} size={20} />
          <div className={styles.input}>
            <input
              type="text"
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
                }
              }}
            />
          </div>
          {isSearching && (
            <div className={styles.searchLoader}>
              <div className={styles.spinner} />
            </div>
          )}
        </div>

        {error && (
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

            {recentDestinations.length > 0 && (
              <div className={styles.suggestionsSection}>
                <div className={styles.suggestionHeader}>
                  <Clock className={styles.suggestionIcon} size={16} />
                  <span>Destinos recientes</span>
                </div>
                {recentDestinations.map((destination, index) => (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/publicarviaje/Destino/')({
  validateSearch: (search: Record<string, unknown>) => ({
    originAddress: search.originAddress as string | undefined,
    pickupSafePointId: search.pickupSafePointId as string | undefined,
  }),
  component: DestinoView,
});

export default DestinoView;