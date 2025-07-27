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
                console.log('🔧 Loading assumptions...');
                const data = await getAssumptions();
                console.log('✅ Assumptions loaded:', data);
                setAssumptions(data);
            } catch (error) {
                console.error('❌ Error loading assumptions:', error);
                // Usar valores por defecto si falla
                setAssumptions({
                    urban_price_per_km: 2000,
                    interurban_price_per_km: 1500,
                    price_limit_percentage: 100,
                    alert_threshold_percentage: 50,
                    fee_percentage: 10
                });
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
        setSearchMessage('');
        setSearchStatus('none');
        
        console.log('🔍 Starting search with formData:', formData);
    
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
            
            console.log('📅 Formatted search params:', {
                origin: formData.origin,
                destination: formData.destination,
                date: formattedDate,
                passengers: formData.passengers
            });
    
            // Usar el endpoint de búsqueda del backend
            const response = await searchTrips({
                origin: formData.origin,
                destination: formData.destination,
                date: formattedDate,
                passengers: formData.passengers
            });

            console.log('✅ Search response received:', response);

            // Actualizar los resultados con logs informativos
            setSearchResults(response.trips || []);
            setSearchMessage(response.message || 'Búsqueda completada');
            setSearchStatus(response.status || 'none');

            // Log del tipo de búsqueda realizada
            const searchType = {
                'exact': '🎯 Búsqueda exacta: origen + destino + fecha',
                'close': '📍 Búsqueda por ubicación: origen O destino coinciden',
                'date': '📅 Búsqueda por fecha: viajes disponibles en la fecha',
                'all': '🗂️ Búsqueda general: todos los viajes disponibles',
                'none': '❌ Sin resultados'
            };

            console.log(`📊 Resultado de búsqueda: ${searchType[response.status || 'none']}`);
            console.log(`📈 Viajes encontrados: ${response.trips.length}`);

            // Si no hay resultados, mostrar mensaje informativo
            if (response.trips.length === 0) {
                setSearchMessage(response.message || 'No se encontraron viajes disponibles. El sistema buscó por exactitud, similitud, fecha y viajes generales.');
            }

        } catch (error) {
            console.error('❌ Error in search:', error);
            
            // Manejo más específico de errores
            let errorMessage = 'Error al buscar viajes. Por favor intenta de nuevo.';
            let errorDetails = 'Error al conectar con el servidor. Verifica tu conexión e intenta nuevamente.';
            
            if (error instanceof Error) {
                if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                    errorMessage = 'Error de conexión';
                    errorDetails = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
                } else if (error.message.includes('500')) {
                    errorMessage = 'Error del servidor';
                    errorDetails = 'El servidor está experimentando problemas. Intenta nuevamente en unos momentos.';
                } else if (error.message.includes('404')) {
                    errorMessage = 'Servicio no disponible';
                    errorDetails = 'El servicio de búsqueda no está disponible temporalmente.';
                } else {
                    errorDetails = `Error técnico: ${error.message}`;
                }
            }
            
            setFormError(errorMessage);
            setSearchMessage(errorDetails);
            setSearchStatus('none');
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };    const handleInputFocus = (type: 'origin' | 'destination') => {
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
        if (!distanceStr) return 15; // Valor por defecto
        if (distanceStr.includes('no disponible')) return 15; // Valor por defecto
        const match = distanceStr.match(/([\d,.]+)/);
        if (!match) return 15; // Valor por defecto
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

    // Función para determinar el tipo de coincidencia de un viaje con la búsqueda
    const getTripMatchType = (trip: TripSearchResult): { 
        type: 'exact' | 'origin' | 'destination' | 'date' | 'general';
        badge: React.ReactNode;
        description: string;
    } => {
        const searchDate = formData.date ? dayjs(formData.date).format('YYYY-MM-DD') : '';
        const tripDate = dayjs(trip.dateTime).format('YYYY-MM-DD');
        
        // Función helper para comparar ubicaciones (texto similar)
        const isLocationMatch = (searchLocation: string, tripLocation: string): boolean => {
            if (!searchLocation || !tripLocation) return false;
            const searchLower = searchLocation.toLowerCase().trim();
            const tripLower = tripLocation.toLowerCase().trim();
            return tripLower.includes(searchLower) || searchLower.includes(tripLower);
        };

        const originMatch = isLocationMatch(formData.origin, trip.origin);
        const destinationMatch = isLocationMatch(formData.destination, trip.destination);
        const dateMatch = searchDate === tripDate;

        // Coincidencia exacta: origen + destino + fecha
        if (originMatch && destinationMatch && dateMatch) {
            return {
                type: 'exact',
                badge: <Badge color="green" size="sm" leftSection={<IconCircleCheck size={12} />}>Coincidencia Exacta</Badge>,
                description: 'Origen, destino y fecha coinciden perfectamente'
            };
        }

        // Coincidencia de origen y fecha
        if (originMatch && dateMatch) {
            return {
                type: 'origin',
                badge: <Badge color="blue" size="sm" leftSection={<MapPin size={12} />}>Mismo Origen</Badge>,
                description: 'Mismo origen y fecha'
            };
        }

        // Coincidencia de destino y fecha
        if (destinationMatch && dateMatch) {
            return {
                type: 'destination',
                badge: <Badge color="cyan" size="sm" leftSection={<Navigation size={12} />}>Mismo Destino</Badge>,
                description: 'Mismo destino y fecha'
            };
        }

        // Solo coincidencia de origen
        if (originMatch) {
            return {
                type: 'origin',
                badge: <Badge color="indigo" size="sm" variant="light" leftSection={<MapPin size={12} />}>Origen Similar</Badge>,
                description: 'Origen coincide'
            };
        }

        // Solo coincidencia de destino
        if (destinationMatch) {
            return {
                type: 'destination',
                badge: <Badge color="violet" size="sm" variant="light" leftSection={<Navigation size={12} />}>Destino Similar</Badge>,
                description: 'Destino coincide'
            };
        }

        // Solo coincidencia de fecha
        if (dateMatch) {
            return {
                type: 'date',
                badge: <Badge color="orange" size="sm" leftSection={<IconCalendar size={12} />}>Misma Fecha</Badge>,
                description: 'Fecha coincide'
            };
        }

        // Viaje general (sin coincidencias específicas)
        return {
            type: 'general',
            badge: <Badge color="gray" size="sm" variant="outline">Disponible</Badge>,
            description: 'Viaje disponible'
        };
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
                            
                            {/* Mensajes informativos basados en el tipo de búsqueda */}
                            {searchStatus === 'exact' && (
                                <Text size="sm" ta="center" c="green" mt="sm" fw={500}>
                                    🎯 ¡Encontramos viajes exactos para tu ruta y fecha!
                                </Text>
                            )}
                            {searchStatus === 'close' && (
                                <Text size="sm" ta="center" c="blue" mt="sm" fw={500}>
                                    📍 Viajes similares encontrados (origen o destino coinciden)
                                </Text>
                            )}
                            {searchStatus === 'date' && (
                                <Text size="sm" ta="center" c="orange" mt="sm" fw={500}>
                                    📅 Viajes disponibles para la fecha seleccionada
                                </Text>
                            )}
                            {searchStatus === 'all' && (
                                <Text size="sm" ta="center" c="indigo" mt="sm" fw={500}>
                                    🗂️ Todos los viajes disponibles - Ajusta tu búsqueda para mayor precisión
                                </Text>
                            )}
                            {searchStatus === 'none' && (
                                <Text size="sm" ta="center" c="dimmed" mt="sm">
                                    💡 Intenta cambiar las fechas o ubicaciones para encontrar más opciones
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
                              // Obtener tipo de coincidencia
                              const matchInfo = getTripMatchType(trip);
                              
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
                                  {/* Header con fecha, precio y tipo de coincidencia */}
                                  <div className={styles.headerSection}>
                                    <div className={styles.dateAndPrice}>
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
                                    {/* Badge de tipo de coincidencia */}
                                    <div style={{ marginTop: 4 }}>
                                      {matchInfo.badge}
                                    </div>
                                  </div>
                                  
                                  {/* Mensaje de estado de precio */}
                                  {priceStatusMsg}
                                  
                                  {/* Información del conductor */}
                                  <div className={styles.driverSection}>
                                    <img
                                      src={trip.photo}
                                      alt="Foto del conductor"
                                      className={styles.driverPhoto}
                                      onError={(e) => {
                                        e.currentTarget.src = 'https://tddaveymppuhweujhzwz.supabase.co/storage/v1/object/public/resourcers/Home/SinFotoPerfil.png';
                                      }}
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
                        <div className={styles.emptyState}>
                            {isSearching ? (
                                <div className={styles.loadingState}>
                                    <IconCalendar size={48} className={styles.loadingIcon} />
                                    <Text size="lg" fw={600} ta="center" mt="md">
                                        Buscando viajes disponibles...
                                    </Text>
                                    <Text size="sm" c="dimmed" ta="center" mt="xs">
                                        Revisando todas las opciones para tu viaje
                                    </Text>
                                </div>
                            ) : searchResults.length === 0 && (formData.origin || formData.destination || formData.date) ? (
                                <div className={styles.noResultsState}>
                                    <IconX size={48} className={styles.noResultsIcon} />
                                    <Text size="lg" fw={600} ta="center" mt="md">
                                        No se encontraron viajes
                                    </Text>
                                    <Text size="sm" c="dimmed" ta="center" mt="xs" maw={400} mx="auto">
                                        El sistema buscó por coincidencia exacta, ubicaciones similares, misma fecha y viajes generales. 
                                        Intenta cambiar las fechas o ubicaciones.
                                    </Text>
                                    <Group justify="center" mt="md" gap="sm">
                                        <Button 
                                            variant="light" 
                                            onClick={() => {
                                                setFormData({
                                                    origin: '',
                                                    destination: '',
                                                    date: null,
                                                    passengers: 1
                                                });
                                                setSearchResults([]);
                                                setSearchMessage('');
                                                setSearchStatus('none');
                                            }}
                                        >
                                            Buscar de nuevo
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            onClick={async () => {
                                                console.log('🔧 Testing backend connectivity...');
                                                try {
                                                    const testResponse = await searchTrips({
                                                        origin: 'Test',
                                                        destination: 'Test',
                                                        date: dayjs().format('YYYY-MM-DD'),
                                                        passengers: 1
                                                    });
                                                    console.log('✅ Backend test successful:', testResponse);
                                                    setSearchMessage('Conectividad con el servidor OK - Intenta una búsqueda real');
                                                } catch (error) {
                                                    console.error('❌ Backend test failed:', error);
                                                    setSearchMessage('Error de conectividad con el servidor');
                                                }
                                            }}
                                        >
                                            Probar conexión
                                        </Button>
                                    </Group>
                                </div>
                            ) : (
                                <div className={styles.initialState}>
                                    <MapPin size={48} className={styles.initialIcon} />
                                    <Text size="lg" fw={600} ta="center" mt="md">
                                        Encuentra tu viaje ideal
                                    </Text>
                                    <Text size="sm" c="dimmed" ta="center" mt="xs" maw={350} mx="auto">
                                        Ingresa tu origen, destino y fecha para ver todas las opciones disponibles
                                    </Text>
                                </div>
                            )}
                        </div>
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
                      <h3 className={styles.routeMapModalTitle}>
                        🗺️ Ruta del viaje
                      </h3>
                      <button
                        className={styles.closeButton}
                        onClick={() => setShowRouteModal(false)}
                        aria-label="Cerrar modal"
                        type="button"
                      >
                        ✕
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
                      <div 
                        style={{ 
                          width: '100%', 
                          height: '100%',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          position: 'relative'
                        }}
                      >
                        {/* Mapa embedido de Google Maps */}
                        <iframe
                          width="100%"
                          height="100%"
                          style={{ border: 0, borderRadius: '8px' }}
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          src={`https://www.google.com/maps/embed/v1/directions?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&origin=${encodeURIComponent(selectedRouteInfo.origin)}&destination=${encodeURIComponent(selectedRouteInfo.destination)}&mode=driving&language=es&region=CO&zoom=12`}
                          title="Ruta del viaje"
                        />
                        
                        {/* Información de la ruta sobrepuesta */}
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          background: 'rgba(0, 0, 0, 0.8)',
                          color: 'white',
                          padding: '12px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          maxWidth: '300px',
                          backdropFilter: 'blur(4px)'
                        }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>📍 Ruta del Viaje</div>
                          <div style={{ marginBottom: '4px' }}>
                            <strong>Origen:</strong> {selectedRouteInfo.origin}
                          </div>
                          <div>
                            <strong>Destino:</strong> {selectedRouteInfo.destination}
                          </div>
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