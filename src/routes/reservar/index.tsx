import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Box, TextInput, Button, Title, Card, Text, Container, Badge, Group } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { Calendar, User, Car, MapPin, Clock, Navigation } from 'lucide-react';
import PassengerSelector from '../../components/ui/home/PassengerSelector';
import dayjs from 'dayjs';
import { getFromLocalStorage, saveToLocalStorage } from '../../types/PublicarViaje/localStorageHelper';
import styles from './reservar.module.css';
import { TripReservationModal } from '../Reservas/TripReservationModal';
import type { Trip } from '@/types/Trip';
import { Modal } from '@mantine/core';
import { Rating } from '@mantine/core';
import { IconArrowUpRight, IconArrowDownLeft, IconCheck, IconCircleCheck, IconCalendar, IconList, IconX, IconAlertCircle } from '@tabler/icons-react';
// Servicios del backend
import { useMaps } from '@/hooks/useMaps';
import { searchTrips, getAssumptions, type TripSearchResult } from '@/services/trips';
import type { PlaceSuggestion } from '@/services/googleMaps';

interface SearchFormData {
    origin: string;
    destination: string;
    date: Date | null;
    passengers: number;
}

const ReservarView = () => {
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [selectedRouteInfo, setSelectedRouteInfo] = useState<{ origin: string; destination: string } | null>(null);
    const navigate = useNavigate();
    const { searchPlaces, getDetails } = useMaps();
    
    const [formData, setFormData] = useState<SearchFormData>(() => {
        const storedFormData = getFromLocalStorage<SearchFormData>('searchFormData');
        if (storedFormData && storedFormData.date) {
            return {
                ...storedFormData,
                date: new Date(storedFormData.date),
            };
        }
        return storedFormData || {
            origin: '',
            destination: '',
            date: null,
            passengers: 1,
        };
    });
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(() => {
        const storedTrip = getFromLocalStorage<Trip | null>('selectedTrip');
        return storedTrip || null;
    });
    const [searchResults, setSearchResults] = useState<TripSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showPassengerSelector, setShowPassengerSelector] = useState(false);
    const [originSuggestions, setOriginSuggestions] = useState<PlaceSuggestion[]>([]);
    const [destinationSuggestions, setDestinationSuggestions] = useState<PlaceSuggestion[]>([]);
    const [focusedInput, setFocusedInput] = useState<'origin' | 'destination' | null>(null);
    const [reservationModalOpen, setReservationModalOpen] = useState(false);
    const [searchMessage, setSearchMessage] = useState<string>('');
    const [searchStatus, setSearchStatus] = useState<'exact' | 'close' | 'date' | 'all' | 'none'>('none');
    const [formError, setFormError] = useState<string | null>(null);
    const [assumptions, setAssumptions] = useState<any>(null);
    const searchTimeout = useRef<NodeJS.Timeout>();

    // Cargar assumptions al montar el componente
    useEffect(() => {
        const loadAssumptions = async () => {
            try {
                const data = await getAssumptions();
                setAssumptions(data);
            } catch (error) {
                console.error('Error loading assumptions:', error);
            }
        };
        loadAssumptions();
    }, []);
    

    useEffect(() => {
        saveToLocalStorage('searchFormData', {
            ...formData,
            date: formData.date ? formData.date.toISOString() : null,
        });
    }, [formData]);

    useEffect(() => {
        saveToLocalStorage('selectedTrip', selectedTrip);
    }, [selectedTrip]);

    const handlePlaceSearch = async (input: string, type: 'origin' | 'destination') => {
        if (!input.trim()) {
            type === 'origin' ? setOriginSuggestions([]) : setDestinationSuggestions([]);
            return;
        }

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        searchTimeout.current = setTimeout(async () => {
            try {
                const suggestions = await searchPlaces(input);
                type === 'origin' 
                    ? setOriginSuggestions(suggestions) 
                    : setDestinationSuggestions(suggestions);
            } catch (error) {
                console.error('Error searching places:', error);
            }
        }, 300);
    };

    const handleSuggestionClick = async (suggestion: PlaceSuggestion, type: 'origin' | 'destination') => {
        try {
            const details = await getDetails(suggestion.placeId);
            if (details) {
                setFormData((prev) => ({
                    ...prev,
                    [type]: details.formattedAddress,
                }));
            } else {
                // Fallback al texto completo de la sugerencia
                setFormData((prev) => ({
                    ...prev,
                    [type]: suggestion.fullText,
                }));
            }
            type === 'origin' ? setOriginSuggestions([]) : setDestinationSuggestions([]);
        } catch (error) {
            console.error('Error getting place details:', error);
            // Fallback al texto completo de la sugerencia
            setFormData((prev) => ({
                ...prev,
                [type]: suggestion.fullText,
            }));
            type === 'origin' ? setOriginSuggestions([]) : setDestinationSuggestions([]);
        }
    };



    const searchTripsHandler = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSearching(true);
        setSearchResults([]);
        setFormError(null);
        console.log('formData before API call:', formData);
    
        try {
            if (!formData.origin || !formData.destination || !formData.date) {
                setFormError('Por favor completa todos los campos');
                setIsSearching(false);
                return;
            }

            // Validar que la fecha sea desde hoy en adelante
            if (dayjs(formData.date).isBefore(dayjs(), 'day')) {
                setFormError('Solo puedes buscar viajes desde hoy en adelante');
                setIsSearching(false);
                return;
            }
    
            const formattedDate = dayjs(formData.date).format('YYYY-MM-DD');
    
            // Usar el endpoint de búsqueda del backend
            const response = await searchTrips({
                origin: formData.origin,
                destination: formData.destination,
                date: formattedDate,
                passengers: formData.passengers
            });

            // Actualizar los resultados
            setSearchResults(response.trips);
            setSearchMessage(response.message);
            setSearchStatus(response.status);

        } catch (error) {
            console.error('Error in search:', error);
            setFormError('Error al buscar viajes. Por favor intenta de nuevo.');
            setSearchMessage('Error al buscar viajes. Por favor intenta de nuevo.');
            setSearchStatus('none');
        } finally {
            setIsSearching(false);
        }
    };

    const handleInputFocus = (type: 'origin' | 'destination') => {
        setFocusedInput(type);
    };

    const handleInputBlur = () => {
        setTimeout(() => setFocusedInput(null), 200);
    };

    const handleReservation = (trip: TripSearchResult) => {
        // Convertir TripSearchResult a Trip para compatibilidad
        const tripData: Trip = {
            id: trip.id,
            origin: {
                address: trip.origin,
                secondaryText: ''
            },
            destination: {
                address: trip.destination,
                secondaryText: ''
            },
            dateTime: trip.dateTime,
            seats: trip.seats,
            pricePerSeat: trip.pricePerSeat,
            allowPets: trip.allowPets,
            allowSmoking: trip.allowSmoking,
            selectedRoute: trip.selectedRoute,
            driverName: trip.driverName,
            photo: trip.photo,
            vehicle: trip.vehicle ? {
                brand: trip.vehicle.brand || null,
                model: trip.vehicle.model || null,
                plate: trip.vehicle.plate || '',
                color: trip.vehicle.color || null,
                photo_url: trip.vehicle.photo_url || null,
                year: trip.vehicle.year ? parseInt(trip.vehicle.year) : null
            } : null,
            license: trip.license,
            propertyCard: trip.propertyCard,
            soat: trip.soat,
            rating: trip.rating
        };
        
        setSelectedTrip(tripData);
        saveToLocalStorage('currentTrip', tripData);
        navigate({ to: '/Reservas' });
    };

    const handleCloseModal = () => {
        setReservationModalOpen(false);
    };

    // Utilidad para parsear distancia ("123 km" o "12.3 km") a número
    const parseDistanceKm = (distanceStr: string): number => {
        if (!distanceStr) return 0;
        const match = distanceStr.match(/([\d,.]+)/);
        if (!match) return 0;
        return parseFloat(match[1].replace(',', '.'));
    };

    // Determina el estado del precio ("high", "low", "normal")
    const getPriceStatus = (
        actual: number,
        suggested: number,
        priceLimit: number,
        alertThreshold: number
    ) => {
        const min = suggested * (1 - priceLimit / 100);
        const max = suggested * (1 + priceLimit / 100);
        const alertMin = suggested * (1 - alertThreshold / 100);
        const alertMax = suggested * (1 + alertThreshold / 100);
        if (actual < alertMin) return { status: 'low', color: 'red', icon: <IconArrowDownLeft size={16} /> };
        if (actual > alertMax) return { status: 'high', color: 'red', icon: <IconArrowUpRight size={16} /> };
        if (actual < min) return { status: 'low', color: 'yellow', icon: <IconArrowDownLeft size={16} /> };
        if (actual > max) return { status: 'high', color: 'yellow', icon: <IconArrowUpRight size={16} /> };
        return { status: 'normal', color: 'green', icon: <IconCheck size={16} /> };
    };

    return (
        <Container fluid className={styles.container}>
            <div className={styles.logoOverlay}></div>
            <Container size="md" className={styles.content}>
                <div style={{height: '30px'}} />
                {/* Search Section */}
                <Box className={styles.searchSection}>
                    <Title className={styles.searchTitle}>
                        Encuentra tu viaje ideal
                        <div className={styles.titleUnderline} />
                    </Title>
                    <Card className={styles.searchCard}>
                        <form onSubmit={searchTripsHandler}>
                            <div className={styles.searchInputs}>
                                {/* Origin Input */}
                                <div className={styles.inputWrapper}>
                                    <div className={styles.inputContainer}>
                                        <div className={styles.inputIcon}>
                                            <MapPin size={20} />
                                        </div>
                                        <TextInput
                                            className={styles.input}
                                            placeholder="¿De dónde sales?"
                                            value={formData.origin}
                                            onChange={(e) => {
                                                const value = e.currentTarget.value;
                                                setFormData((prev) => ({ ...prev, origin: value }));
                                                handlePlaceSearch(value, 'origin');
                                            }}
                                            onFocus={() => handleInputFocus('origin')}
                                            onBlur={handleInputBlur}
                                            variant="unstyled"
                                            required
                                            size="md"
                                        />
                                    </div>
                                    {focusedInput === 'origin' && originSuggestions.length > 0 && (
                                        <div className={styles.suggestionsContainer}>
                                            {originSuggestions.map((suggestion) => (
                                                <button
                                                    key={suggestion.placeId}
                                                    className={styles.suggestionItem}
                                                    onClick={() => handleSuggestionClick(suggestion, 'origin')}
                                                    type="button"
                                                >
                                                    <MapPin size={16} className={styles.suggestionIcon} />
                                                    <div>
                                                        <Text className={styles.suggestionMain}>
                                                            {suggestion.mainText}
                                                        </Text>
                                                        <Text className={styles.suggestionSecondary}>
                                                            {suggestion.secondaryText}
                                                        </Text>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Destination Input */}
                                <div className={styles.inputWrapper}>
                                    <div className={styles.inputContainer}>
                                        <div className={styles.inputIcon}>
                                            <MapPin size={20} />
                                        </div>
                                        <TextInput
                                            className={styles.input}
                                            placeholder="¿A dónde vas?"
                                            value={formData.destination}
                                            onChange={(e) => {
                                                const value = e.currentTarget.value;
                                                setFormData((prev) => ({ ...prev, destination: value }));
                                                handlePlaceSearch(value, 'destination');
                                            }}
                                            onFocus={() => handleInputFocus('destination')}
                                            onBlur={handleInputBlur}
                                            variant="unstyled"
                                            required
                                            size="md"
                                        />
                                    </div>
                                    {focusedInput === 'destination' && destinationSuggestions.length > 0 && (
                                        <div className={styles.suggestionsContainer}>
                                            {destinationSuggestions.map((suggestion) => (
                                                <button
                                                    key={suggestion.placeId}
                                                    className={styles.suggestionItem}
                                                    onClick={() =>
                                                        handleSuggestionClick(suggestion, 'destination')
                                                    }
                                                    type="button"
                                                >
                                                    <MapPin size={16} className={styles.suggestionIcon} />
                                                    <div>
                                                        <Text className={styles.suggestionMain}>
                                                            {suggestion.mainText}
                                                        </Text>
                                                        <Text className={styles.suggestionSecondary}>
                                                            {suggestion.secondaryText}
                                                        </Text>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Date Picker */}
                                <div className={styles.inputContainer}>
                                    <div className={styles.inputIcon}>
                                        <Calendar size={20} className={styles.calendarIcon} />
                                    </div>
                                    <DatePickerInput
                                        className={styles.input}
                                        placeholder="¿Cuándo viajas?"
                                        value={formData.date}
                                        onChange={(date) => setFormData((prev) => ({ ...prev, date }))}
                                        minDate={new Date()}
                                        classNames={{
                                            input: styles.dateInput,
                                            day: styles.dateDay,
                                            weekday: styles.dateWeekday,
                                            month: styles.dateMonth,
                                        }}
                                        size="md"
                                    />
                                </div>

                                {/* Passenger Selector */}
                                <div
                                    className={styles.inputContainer}
                                    onClick={() => setShowPassengerSelector(!showPassengerSelector)}
                                >
                                    <div className={styles.inputIcon}>
                                        <User size={20} />
                                    </div>
                                    <TextInput
                                        className={styles.input}
                                        value={`${formData.passengers} ${
                                            formData.passengers > 1 ? 'Pasajeros' : 'Pasajero'
                                        }`}
                                        readOnly
                                        variant="unstyled"
                                        rightSection={
                                            <div className={styles.passengerIconWrapper}>
                                                {Array.from({ length: formData.passengers }).map((_, i) => (
                                                    <User
                                                        key={`passenger-${i}`}
                                                        size={16}
                                                        className={styles.passengerIcon}
                                                    />
                                                ))}
                                            </div>
                                        }
                                    />
                                </div>

                                {showPassengerSelector && (
                                    <PassengerSelector
                                        value={formData.passengers}
                                        onChange={(num) => {
                                            setFormData((prev) => ({ ...prev, passengers: num }));
                                            setShowPassengerSelector(false);
                                        }}
                                    />
                                )}

                                {/* Search Button */}
                                <Button
                                    className={`${styles.searchButton} ${
                                        isSearching ? styles.searching : ''
                                    }`}
                                    type="submit"
                                    disabled={isSearching}
                                >
                                    {isSearching ? (
                                        <div className={styles.searchingAnimation}>
                                            <Car className={styles.carIcon} size={24} />
                                            <div className={styles.road}>
                                                <div className={styles.roadLine} />
                                                <div className={styles.roadLine} />
                                                <div className={styles.roadLine} />
                                            </div>
                                        </div>
                                    ) : (
                                        'Buscar'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </Box>

                {/* Results Section */}
                <Box className={styles.resultsSection}>
                    {/* Search Message */}
                    {searchMessage && (
                        <Card className={styles.searchMessageCard} shadow="sm" radius="lg" p="xl" mb="xl">
                            <Group justify="center" mb="md">
                                {searchStatus === 'exact' && <IconCircleCheck size={32} className={styles.exactIcon} />}
                                {searchStatus === 'close' && <MapPin size={32} className={styles.closeIcon} />}
                                {searchStatus === 'date' && <IconCalendar size={32} className={styles.dateIcon} />}
                                {searchStatus === 'all' && <IconList size={32} className={styles.allIcon} />}
                                {searchStatus === 'none' && <IconX size={32} className={styles.noneIcon} />}
                            </Group>
                            <Text 
                                size="lg" 
                                ta="center" 
                                fw={600} 
                                className={`${styles.searchMessage} ${styles[`searchMessage--${searchStatus}`]}`}
                            >
                                {searchMessage}
                            </Text>
                            {searchStatus === 'all' && (
                                <Text size="sm" ta="center" c="dimmed" mt="sm">
                                    Puedes ajustar tu búsqueda para encontrar opciones más específicas
                                </Text>
                            )}
                        </Card>
                    )}

                    {/* Error Message */}
                    {formError && (
                        <Card className={styles.errorCard} shadow="sm" radius="lg" p="xl" mb="xl">
                            <Group justify="center" mb="md">
                                <IconAlertCircle size={32} className={styles.errorIcon} />
                            </Group>
                            <Text size="lg" ta="center" fw={600} c="red">
                                {formError}
                            </Text>
                        </Card>
                    )}

                    {searchResults.length > 0 ? (
                        <div className={styles.resultsList}>
                            {searchResults.map((trip) => {
                              // Calcular sugerido y estado del precio
                              let priceBadge = null;
                              let priceStatusMsg = null;
                              let badge = null;
                              if (assumptions && trip.selectedRoute?.distance) {
                                const distanceKm = parseDistanceKm(trip.selectedRoute.distance);
                                const isUrban = distanceKm <= 30; // Lógica para determinar si es urbano
                                const pricePerKm = isUrban
                                    ? assumptions.urban_price_per_km
                                    : assumptions.interurban_price_per_km;
                                
                                // Calcular precio total del viaje
                                const totalTripPrice = distanceKm * pricePerKm;
                                
                                // Dividir siempre entre 4 cupos estándar para obtener precio por cupo
                                const suggestedPricePerSeat = totalTripPrice / 4;
                                
                                const { price_limit_percentage, alert_threshold_percentage } = assumptions;
                                badge = getPriceStatus(
                                    trip.pricePerSeat,
                                    suggestedPricePerSeat,
                                    price_limit_percentage,
                                    alert_threshold_percentage
                                );
                                priceBadge = (
                                  <Badge color={badge.color} leftSection={badge.icon} size="lg" radius="md" variant="filled" style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 4 }}>
                                    ${trip.pricePerSeat.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                                  </Badge>
                                );
                                // Mensaje breve según estado
                                let msg = '';
                                if (badge.status === 'high') msg = 'El precio está alto para esta ruta';
                                else if (badge.status === 'low') msg = 'El precio está bajo para esta ruta';
                                else msg = 'Precio recomendado para la ruta';
                                priceStatusMsg = (
                                  <div className={`${styles.priceStatusMsg} ${styles['priceStatusMsg--' + badge.color]}`}>{msg}</div>
                                );
                              } else {
                                priceBadge = (
                                  <Badge color="gray" size="lg" radius="md" variant="light" style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 4 }}>
                                    ${trip.pricePerSeat.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                                  </Badge>
                                );
                              }
                                return (
                                <Card key={trip.id} className={styles.resultCard} shadow="md" radius="lg" p="lg">
                                  {/* Header con fecha y precio */}
                                  <div className={styles.headerSection}>
                                    <Text fw={600} size="md" className={styles.dateText}>
                                      {new Date(trip.dateTime).toLocaleString('es-ES', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true,
                                      })}
                                    </Text>
                                    {priceBadge}
                                  </div>
                                  
                                  {/* Mensaje de estado de precio */}
                                  {priceStatusMsg}
                                  
                                  {/* Información del conductor */}
                                  <div className={styles.driverSection}>
                                    <img
                                      src={trip.photo}
                                      alt="Foto del conductor"
                                      className={styles.driverPhoto}
                                    />
                                    <div className={styles.driverInfo}>
                                      <div className={styles.driverLabel}>Conductor</div>
                                      <div className={styles.driverName}>{trip.driverName || 'No disponible'}</div>
                                      <div className={styles.driverRating}>
                                        {trip.rating !== undefined ? (
                                          <Rating value={trip.rating} readOnly size="xs" />
                                        ) : (
                                          <Text c="gray" size="xs">Nuevo</Text>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Ruta de origen a destino */}
                                  <div className={styles.tripRoute}
                                    onClick={() => {
                                      setSelectedRouteInfo({
                                        origin: trip.origin,
                                        destination: trip.destination,
                                      });
                                      setShowRouteModal(true);
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        setSelectedRouteInfo({
                                          origin: trip.origin,
                                          destination: trip.destination,
                                        });
                                        setShowRouteModal(true);
                                      }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <div className={styles.routePoint}>
                                      <div className={styles.iconWrapper}>
                                        <MapPin size={20} className={`${styles.routeIcon} ${styles.originIcon}`} />
                                      </div>
                                      <div className={styles.routeDetails}>
                                        <Text fw={600} className={styles.routeLabel}>Origen</Text>
                                        <Text fw={500} className={styles.routeAddress}>{trip.origin}</Text>
                                      </div>
                                    </div>
                                    <div className={styles.routeLineWrapper}>
                                      <div className={styles.routeLine}></div>
                                    </div>
                                    <div className={styles.routePoint}>
                                      <div className={styles.iconWrapper}>
                                        <MapPin size={20} className={`${styles.routeIcon} ${styles.destinationIcon}`} />
                                      </div>
                                      <div className={styles.routeDetails}>
                                        <Text fw={600} className={styles.routeLabel}>Destino</Text>
                                        <Text fw={500} className={styles.routeAddress}>{trip.destination}</Text>
                                      </div>
                                    </div>
                                  </div>

                                  <div className={styles.routeViewButtonWrapper}>
                                    <Button
                                      variant="outline"
                                      size="xs"
                                      className={styles.routeViewButton}
                                      onClick={() => {
                                        setSelectedRouteInfo({
                                          origin: trip.origin,
                                          destination: trip.destination,
                                        });
                                        setShowRouteModal(true);
                                      }}
                                    >
                                      Ver ruta
                                    </Button>
                                  </div>
                                  
                                  

                                   {/* Información adicional */}
                                  <div className={styles.additionalInfo}>
                                      <div className={styles.infoItem}>
                                          <Clock size={16} className={styles.infoIcon} />
                                          <Text fw={500} size="sm" className={styles.infoText}>
                                              {trip.selectedRoute.duration} - Tiempo de Viaje
                                          </Text>
                                      </div>
                                      <div className={styles.infoItem}>
                                          <Navigation size={16} className={styles.infoIcon} />
                                          <Text fw={500} size="sm" className={styles.infoText}>
                                              {trip.selectedRoute.distance} - Distancia de Viaje
                                          </Text>
                                      </div>
                                      <div className={styles.infoItem}>
                                          <User size={16} className={styles.infoIcon} />
                                          <Text fw={500} size="sm" className={styles.infoText}>
                                        {(trip.seats ?? 0).toString()} - Cupos disponibles
                                          </Text>
                                      </div>
                                  </div>
                                  
                                  {/* Botón de reservar */}
                                  <Button
                                      fullWidth
                                      className={styles.reserveButton}
                                      onClick={() => {
                                          handleReservation(trip);
                                          setReservationModalOpen(true);
                                      }}
                                  >
                                      Reservar
                                  </Button>
                                </Card>
                            );
                            })}
                        </div>
                    ) : (
                        <Text className={styles.resultsSubtitle}>
                            {isSearching
                                ? 'Buscando viajes disponibles...'
                                : 'Ingresa los detalles de tu viaje para ver las opciones disponibles'}
                        </Text>
                    )}
                </Box>

                {selectedTrip && (
                    <TripReservationModal
                        trip={selectedTrip}
                        isOpen={reservationModalOpen}
                        onClose={handleCloseModal}
                    />
                )}
                
                {selectedRouteInfo && (
                <Modal
                  opened={showRouteModal}
                  onClose={() => setShowRouteModal(false)}
                  title={
                    <div className={styles.routeMapModalHeader}>
                      <h3 className={styles.routeMapModalTitle}>Ruta del viaje</h3>
                      <button
                        className={styles.closeButton}
                        onClick={() => setShowRouteModal(false)}
                        aria-label="Cerrar"
                      >
                        &times;
                      </button>
                    </div>
                  }
                  classNames={{
                    root: styles.routeMapModal,
                  }}
                  size="xl"
                  yOffset="calc(env(safe-area-inset-top, 0px) + 40px)"
                  overlayProps={{
                    color: '#000',
                    opacity: 0.85,
                    blur: 6,
                  }}
                  withCloseButton={false}
                >
                    <div className={styles.mapContainer}>
                      <div style={{ 
                        width: '100%', 
                        height: '400px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '8px',
                        flexDirection: 'column',
                        gap: '16px'
                      }}>
                        <MapPin size={48} color="#666" />
                        <div style={{ textAlign: 'center' }}>
                          <Text size="lg" fw={600} mb="xs">Ruta del viaje</Text>
                          <Text size="sm" c="dimmed">
                            <strong>Origen:</strong> {selectedRouteInfo.origin}
                          </Text>
                          <Text size="sm" c="dimmed">
                            <strong>Destino:</strong> {selectedRouteInfo.destination}
                          </Text>
                          <Text size="xs" c="dimmed" mt="md">
                            Mapa interactivo próximamente disponible
                          </Text>
                        </div>
                      </div>
                    </div>
                  </Modal>
                )}

            </Container>
        </Container>
    );
};

export const Route = createFileRoute('/reservar/')({
    component: ReservarView,
});