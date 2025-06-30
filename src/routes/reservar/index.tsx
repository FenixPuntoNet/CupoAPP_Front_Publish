import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Box, TextInput, Button, Title, Card, Text, Container, Badge } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { Calendar, User, Car, MapPin, Clock, Navigation } from 'lucide-react';
import PassengerSelector from '../../components/ui/home/PassengerSelector';
import dayjs from 'dayjs';
import { supabase } from '@/lib/supabaseClient';
import { getFromLocalStorage, saveToLocalStorage } from '../../types/PublicarViaje/localStorageHelper';
import styles from './reservar.module.css';
import { TripReservationModal } from '../Reservas/TripReservationModal';
import { useJsApiLoader } from '@react-google-maps/api';
import type { Trip } from '@/types/Trip';
import { Modal } from '@mantine/core';
import { GoogleMap } from '@react-google-maps/api';
import { Rating } from '@mantine/core';



interface PlaceSuggestion {
    placeId: string;
    mainText: string;
    secondaryText: string;
    fullText: string;
}




interface SearchFormData {
    origin: string;
    destination: string;
    date: Date | null;
    passengers: number;
}

const ReservarView = () => {
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [selectedRouteInfo, setSelectedRouteInfo] = useState<{ origin: string; destination: string } | null>(null);
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: ['places'],
    });    
    const navigate = useNavigate();
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
    const [searchResults, setSearchResults] = useState<Trip[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showPassengerSelector, setShowPassengerSelector] = useState(false);
    const [originSuggestions, setOriginSuggestions] = useState<PlaceSuggestion[]>([]);
    const [destinationSuggestions, setDestinationSuggestions] = useState<PlaceSuggestion[]>([]);
    const [focusedInput, setFocusedInput] = useState<'origin' | 'destination' | null>(null);
    const [reservationModalOpen, setReservationModalOpen] = useState(false);
    const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
    const placesService = useRef<google.maps.places.PlacesService | null>(null);
    const searchTimeout = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (
            typeof window !== 'undefined' &&
            isLoaded &&
            window.google?.maps?.places &&
            !autocompleteService.current
        ) {
            autocompleteService.current = new window.google.maps.places.AutocompleteService();
            placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
        }
    }, [isLoaded]);
    

    useEffect(() => {
        saveToLocalStorage('searchFormData', {
            ...formData,
            date: formData.date ? formData.date.toISOString() : null,
        });
    }, [formData]);

    useEffect(() => {
        saveToLocalStorage('selectedTrip', selectedTrip);
    }, [selectedTrip]);

    const handlePlaceSearch = (input: string, type: 'origin' | 'destination') => {
        if (!input.trim() || !autocompleteService.current) {
            type === 'origin' ? setOriginSuggestions([]) : setDestinationSuggestions([]);
            return;
        }

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        searchTimeout.current = setTimeout(() => {
            const request = {
                input,
                componentRestrictions: { country: 'co' },
            };

            autocompleteService.current?.getPlacePredictions(request, (predictions, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                    const suggestions = predictions.map((prediction) => ({
                        placeId: prediction.place_id,
                        mainText: prediction.structured_formatting.main_text,
                        secondaryText: prediction.structured_formatting.secondary_text,
                        fullText: prediction.description,
                    }));

                    type === 'origin'
                        ? setOriginSuggestions(suggestions)
                        : setDestinationSuggestions(suggestions);
                }
            });
        }, 300);
    };

    const fetchPlaceDetails = (placeId: string, type: 'origin' | 'destination') => {
        if (!placesService.current) return;
        placesService.current.getDetails(
            { placeId, fields: ['formatted_address', 'address_components'] },
            (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                    const secondaryText =
                        place.address_components?.find((component) =>
                            component.types.includes('locality')
                        )?.long_name ||
                        place.address_components?.find((component) =>
                            component.types.includes('administrative_area_level_2')
                        )?.long_name ||
                        place.address_components?.find((component) =>
                            component.types.includes('administrative_area_level_1')
                        )?.long_name ||
                        place.formatted_address;

                    setFormData((prev) => ({
                        ...prev,
                        [type]: secondaryText || place.formatted_address,
                    }));
                    type === 'origin' ? setOriginSuggestions([]) : setDestinationSuggestions([]);
                }
            }
        );
    };



    const searchTrips = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSearching(true);
        setSearchResults([]);
        console.log('formData before API call:', formData);
    
        try {
            if (!formData.origin || !formData.destination || !formData.date) {
                console.error('Origin, destination, and date are required.');
                setIsSearching(false);
                return;
            }
    
            const formattedDate = dayjs(formData.date).format('YYYY-MM-DD HH:mm:ss');
    
            const { data, error } = await supabase
              .from('trips')
              .select(`
                id,
                date_time,
                seats,
                price_per_seat,
                allow_pets,
                allow_smoking,
                vehicle_id,
                user_id,
                status,
                route:routes(id, start_address, end_address, duration, distance),
                vehicle:vehicles(
                  brand,
                  model,
                  plate,
                  color,
                  photo_url,
                  year
                )
              `)
              .gte('date_time', formattedDate)
              .in('status', ['pending', 'A'])
              .gt('seats', 0);
          
              
              
    
            if (error) {
                console.error('Error fetching trips:', error);
                setIsSearching(false);
                return;
            }
    
            // Obtener los perfiles de usuario relacionados
            const userIds = data.map((trip) => trip.user_id).filter((id): id is string => id !== null);
            // Licencias por user_id
            const { data: licenses } = await supabase
              .from('driver_licenses')
              .select('user_id, license_number, license_category, expiration_date');
            
            // Propiedad por vehículo
            const { data: propertyCards } = await supabase
              .from('property_cards')
              .select('vehicle_id, passager_capacity');
            
            // SOAT por vehículo
            const { data: soats } = await supabase
              .from('soat_details')
              .select('vehicle_id, validity_to, insurance_company');
            
            const { data: userProfiles, error: userProfilesError } = await supabase
                .from('user_profiles')
                .select('user_id, first_name, last_name, photo_user')
                .in('user_id', userIds);
    
            if (userProfilesError) {
                console.error('Error fetching user profiles:', userProfilesError);
                setIsSearching(false);
                return;
            }
            // Obtener calificaciones por conductor
            const { data: allCalifications, error: calificationsError } = await supabase
            .from('califications')
            .select('driver_id, value');
            
            if (calificationsError) {
            console.error('Error fetching califications:', calificationsError);
            }
            
    

            // Normalizar texto para comparar sin tildes ni mayúsculas
            const normalize = (text: string) =>
                text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
              
                let filteredTrips = data.filter((trip) => {
                    const start = trip.route?.start_address || '';
                    const end = trip.route?.end_address || '';
                    return (
                      normalize(start).includes(normalize(formData.origin)) &&
                      normalize(end).includes(normalize(formData.destination))
                    );
                  });
                  
                  // Si no hay coincidencias exactas, mostrar todos los disponibles (ya filtrados por SQL)
                  if (filteredTrips.length === 0 && data.length > 0) {
                    filteredTrips = data;
                  }
                  
              
              // Esta lógica se moverá después del mapeo
              const hasExactMatches = filteredTrips.length > 0;
              if (!hasExactMatches) {
                filteredTrips = data;
              }
              
              
              
              const trips = filteredTrips.map((trip) => {
                const userProfile = userProfiles.find((profile) => profile.user_id === trip.user_id);
                const driverRatings = allCalifications?.filter(c => c.driver_id === trip.user_id);
                const averageRating = driverRatings && driverRatings.length > 0
                  ? driverRatings.reduce((acc, curr) => acc + (curr.value || 0), 0) / driverRatings.length
                  : null;
                const licenseRaw = licenses?.find((l) => l.user_id === trip.user_id);
                const license = licenseRaw &&
                  licenseRaw.license_number &&
                  licenseRaw.license_category &&
                  licenseRaw.expiration_date &&
                  licenseRaw.user_id
                  ? {
                      license_number: licenseRaw.license_number!,
                      license_category: licenseRaw.license_category!,
                      expiration_date: licenseRaw.expiration_date!,
                      user_id: licenseRaw.user_id!,
                    }
                  : undefined;
                const propertyCard = propertyCards?.find((p) => p.vehicle_id === trip.vehicle_id) || null;
                const soat = soats?.find((s) => s.vehicle_id === trip.vehicle_id) || null;
              
                return {
                  id: trip.id.toString(),
                  origin: {
                    address: trip.route?.start_address || 'Origen no disponible',
                    secondaryText: 'Información adicional no disponible',
                  },
                  destination: {
                    address: trip.route?.end_address || 'Destino no disponible',
                    secondaryText: 'Información adicional no disponible',
                  },
                  dateTime: trip.date_time || '',
                  seats: trip.seats ?? 0,
                  pricePerSeat: trip.price_per_seat || 0,
                  allowPets: trip.allow_pets === 'true',
                  allowSmoking: trip.allow_smoking === 'true',
                  selectedRoute: {
                    duration: trip.route?.duration || 'Duración no disponible',
                    distance: trip.route?.distance || 'Distancia no disponible',
                  },
                  driverName: userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : 'No disponible',
                  photo: userProfile?.photo_user || 'https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/SinFotoPerfil.png',
                  vehicle: trip.vehicle,
                  license,
                  propertyCard,
                  soat,
                  rating: averageRating !== null ? averageRating : undefined,

                };
            });

            const availableTrips = trips.filter((trip) => trip.seats > 0);
    
            setSearchResults(availableTrips);
        } catch (error) {
            console.error('Error searching trips:', error);
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

    const handleSuggestionClick = (suggestion: PlaceSuggestion, type: 'origin' | 'destination') => {
        fetchPlaceDetails(suggestion.placeId, type);
    };

    const handleReservation = (trip: Trip) => {
        setSelectedTrip(trip);
        saveToLocalStorage('currentTrip', trip);
        navigate({ to: '/Reservas' });
    };

    const handleCloseModal = () => {
        setReservationModalOpen(false);
    };

    if (loadError) {
        return <div>Error al cargar Google Maps</div>;
      }
      
      if (!isLoaded) {
        return <div>Cargando mapa...</div>;
      }
      

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
                        <form onSubmit={searchTrips}>
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
                    <Title className={styles.resultsTitle}>Viajes disponibles</Title>

                    {searchResults.length > 0 ? (
                        <div className={styles.tripsGrid}>
                            {searchResults.map((trip) => (
                                <Card key={trip.id} className={styles.tripCard}>
                                    {/* Fecha y precio */}
                                    <div className={styles.headerSection}>
                                       <Text fw={600} size="md" className={styles.dateText}>
                                         {new Date(trip.dateTime).toLocaleString('es-ES', {
                                           day: '2-digit',
                                           month: '2-digit',
                                           year: 'numeric',
                                           hour: '2-digit',
                                           minute: '2-digit',
                                           hour12: true, // si prefieres formato 12h con AM/PM, cámbialo a false si prefieres 24h
                                         })}
                                       </Text>
                                    </div>
                            
                                    {/* Información del conductor */}
                                    <div className={styles.driverSection}>
                                        <img
                                            src={trip.photo}
                                            alt="Foto del conductor"
                                            className={styles.driverPhoto}
                                        />
                                        <div>
                                            <Text fw={500} size="xs" className={styles.driverLabel}>
                                                Conductor:
                                            </Text>
                                            <Text fw={500} size="sm" className={styles.driverName}>
                                                {trip.driverName || 'No disponible'}
                                            </Text>
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
                                          origin: trip.origin.address,
                                          destination: trip.destination.address,
                                        });
                                        setShowRouteModal(true);
                                      }}
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          setSelectedRouteInfo({
                                            origin: trip.origin.address,
                                            destination: trip.destination.address,
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
                                          <Text fw={500} className={styles.routeAddress}>{trip.origin.address}</Text>
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
                                          <Text fw={500} className={styles.routeAddress}>{trip.destination.address}</Text>
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
                                            origin: trip.origin.address,
                                            destination: trip.destination.address,
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
                                    <Badge className={styles.priceBadge}>
                                            ${trip.pricePerSeat.toLocaleString()} cupo
                                    </Badge>
                            
                                    {/* Botón de reservar */}
                                    <Button
                                        className={styles.reserveButton}
                                        onClick={() => {
                                            handleReservation(trip);
                                            setReservationModalOpen(true);
                                        }}
                                    >
                                        Reservar
                                    </Button>
                                </Card>
                            ))}
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
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        options={{
                          zoomControl: true,
                          fullscreenControl: true,
                          streetViewControl: false,
                          mapTypeControl: false,
                          gestureHandling: 'greedy',
                        }}
                        onLoad={(map: google.maps.Map) => {
                          const directionsService = new google.maps.DirectionsService();
                          const directionsRenderer = new google.maps.DirectionsRenderer({
                            map,
                            suppressMarkers: false,
                          });
                
                          directionsService.route(
                            {
                              origin: selectedRouteInfo.origin,
                              destination: selectedRouteInfo.destination,
                              travelMode: google.maps.TravelMode.DRIVING,
                            },
                            (result, status) => {
                              if (status === google.maps.DirectionsStatus.OK && result) {
                                directionsRenderer.setDirections(result);
                              } else {
                                console.error('Error al obtener ruta:', status);
                              }
                            }
                          );
                        }}
                      />
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