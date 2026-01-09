import type React from "react";
import { useState, useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Box,
  TextInput,
  Button,
  Title,
  Card,
  Text,
  Container,
  Badge,
  Group,
  ActionIcon,
  Modal,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { Calendar, User, Car, MapPin, Navigation } from "lucide-react";
import PassengerSelector from "../../components/ui/home/PassengerSelector";
import dayjs from "dayjs";
import {
  getFromLocalStorage,
  saveToLocalStorage,
} from "../../types/PublicarViaje/localStorageHelper";
import styles from "./reservar.module.css";
import { TripReservationModal } from "@/components/ReservationModals/TripReservationModal";
import type { Trip } from "@/types/Trip";
import { Drawer } from "@mantine/core";
import { Rating } from "@mantine/core";
import {
  IconArrowUpRight,
  IconArrowDownLeft,
  IconCheck,
  IconCircleCheck,
  IconCalendar,
  IconList,
  IconX,
  IconAlertCircle,
  IconRoute,
  IconMapPin,
  IconFlag,
  IconExternalLink,
  IconUsers,
  IconSettings,
  IconMusic,
  IconSnowflake,
  IconHeart,
  IconSmokingNo,
  IconPackage,
  IconShieldCheck,
  IconShieldX,
  IconCar,
} from "@tabler/icons-react";
import InteractiveMap from "@/components/InteractiveMap";
// Servicios del backend
import { useMaps } from "@/hooks/useMaps";
import { useClarity, useClarityTracking } from "@/hooks/useClarity";
import { searchTrips, type TripSearchResult } from "@/services/trips";
import { getAssumptions, ensureAssumptionsExist } from "@/services/config";
import type { PlaceSuggestion } from "@/services/googleMaps";
import { useReserveClick } from "@/hooks/useSingleClick";
import {
  getTripPreferencesPublic,
  mapPreferencesForDisplay,
  type TripPreferences,
} from "@/services/tripPreferences";

import { DriverModal } from "@/components/DriverModal";
import { SafePointsIcon } from "@/components/TripSafePointsInfo/SafePointsIcon";

import BackButton from "@/components/Buttons/backButton";

interface SearchFormData {
  origin: string;
  destination: string;
  date: Date | null;
  passengers: number;
}

const ReservarView = () => {
  // Clarity tracking hooks
  const { setCustomTag } = useClarity({
    autoTrackPageViews: true,
    userProperties: {
      page_type: "search_trips",
      flow: "find_ride",
    },
  });
  const { trackButtonClick, trackFormSubmit, trackSearch } =
    useClarityTracking();

  const [showRouteModal, setShowRouteModal] = useState(false);
  const [selectedRouteInfo, setSelectedRouteInfo] = useState<{
    origin: string;
    destination: string;
  } | null>(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<TripSearchResult | null>(
    null
  );
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [selectedTripForPreferences, setSelectedTripForPreferences] =
    useState<TripSearchResult | null>(null);
  const [tripPreferences, setTripPreferences] =
    useState<TripPreferences | null>(null);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const { searchPlaces, getDetails } = useMaps();

  const [formData, setFormData] = useState<SearchFormData>(() => {
    const storedFormData =
      getFromLocalStorage<SearchFormData>("searchFormData");
    if (storedFormData && storedFormData.date) {
      return {
        ...storedFormData,
        date: new Date(storedFormData.date),
      };
    }
    return (
      storedFormData || {
        origin: "",
        destination: "",
        date: null,
        passengers: 1,
      }
    );
  });
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(() => {
    const storedTrip = getFromLocalStorage<Trip | null>("selectedTrip");
    return storedTrip || null;
  });
  const [searchResults, setSearchResults] = useState<TripSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showPassengerSelector, setShowPassengerSelector] = useState(false);
  const [originSuggestions, setOriginSuggestions] = useState<PlaceSuggestion[]>(
    []
  );
  const [destinationSuggestions, setDestinationSuggestions] = useState<
    PlaceSuggestion[]
  >([]);
  const [focusedInput, setFocusedInput] = useState<
    "origin" | "destination" | null
  >(null);
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string>("");
  const [searchStatus, setSearchStatus] = useState<
    "exact" | "close" | "date" | "all" | "none"
  >("none");
  const [formError, setFormError] = useState<string | null>(null);
  const [assumptions, setAssumptions] = useState<any>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  // Hook para prevenir múltiples clicks en reservar
  const reserveClick = useReserveClick(async (trip: TripSearchResult) => {
    await performReservation(trip);
  });

  // Cargar assumptions al montar el componente
  useEffect(() => {
    const loadAssumptions = async () => {
      try {
        console.log("🔧 Loading assumptions...");
        const data = await getAssumptions();
        console.log("✅ Assumptions loaded:", data);

        if (data) {
          setAssumptions(data);
        } else {
          console.warn("⚠️ No assumptions found, trying to create defaults...");
          // Intentar crear assumptions por defecto
          const defaultData = await ensureAssumptionsExist();
          if (defaultData) {
            setAssumptions(defaultData);
          } else {
            // Solo como último recurso usar valores hardcodeados
            console.error(
              "❌ Could not create or load assumptions, using hardcoded values"
            );
            setAssumptions({
              urban_price_per_km: 2000,
              interurban_price_per_km: 3000, // Precio correcto para interurbano
              price_limit_percentage: 20,
              alert_threshold_percentage: 30,
              fee_percentage: 10,
            });
          }
        }
      } catch (error) {
        console.error("❌ Error loading assumptions:", error);
        // Usar valores por defecto si falla
        setAssumptions({
          urban_price_per_km: 2000,
          interurban_price_per_km: 3000, // Precio correcto para interurbano
          price_limit_percentage: 20,
          alert_threshold_percentage: 30,
          fee_percentage: 10,
        });
      }
    };
    loadAssumptions();
  }, []);

  useEffect(() => {
    saveToLocalStorage("searchFormData", {
      ...formData,
      date: formData.date ? formData.date.toISOString() : null,
    });
  }, [formData]);

  useEffect(() => {
    saveToLocalStorage("selectedTrip", selectedTrip);
  }, [selectedTrip]);

  const handlePlaceSearch = async (
    input: string,
    type: "origin" | "destination"
  ) => {
    if (!input.trim()) {
      type === "origin"
        ? setOriginSuggestions([])
        : setDestinationSuggestions([]);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      try {
        const suggestions = await searchPlaces(input);
        type === "origin"
          ? setOriginSuggestions(suggestions)
          : setDestinationSuggestions(suggestions);
      } catch (error) {
        console.error("Error searching places:", error);
      }
    }, 300);
  };

  const handleSuggestionClick = async (
    suggestion: PlaceSuggestion,
    type: "origin" | "destination"
  ) => {
    // Tracking de selección de lugar
    trackButtonClick(`select_${type}`, suggestion.mainText);
    setCustomTag(`${type}_selected`, suggestion.mainText);

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
      type === "origin"
        ? setOriginSuggestions([])
        : setDestinationSuggestions([]);
    } catch (error) {
      console.error("Error getting place details:", error);
      // Fallback al texto completo de la sugerencia
      setFormData((prev) => ({
        ...prev,
        [type]: suggestion.fullText,
      }));
      type === "origin"
        ? setOriginSuggestions([])
        : setDestinationSuggestions([]);
    }
  };

  const searchTripsHandler = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSearching(true);
    setSearchResults([]);
    setFormError(null);
    setSearchMessage("");
    setSearchStatus("none");

    // Tracking de búsqueda
    trackFormSubmit("search_trips");
    setCustomTag("search_origin", formData.origin);
    setCustomTag("search_destination", formData.destination);
    setCustomTag("search_passengers", formData.passengers.toString());
    if (formData.date) {
      setCustomTag("search_date", dayjs(formData.date).format("YYYY-MM-DD"));
    }

    console.log("🔍 Starting search with formData:", formData);

    try {
      if (!formData.origin || !formData.destination || !formData.date) {
        setFormError("Por favor completa todos los campos");
        setIsSearching(false);
        return;
      }

      // Validar que la fecha sea desde hoy en adelante
      if (dayjs(formData.date).isBefore(dayjs(), "day")) {
        setFormError("Solo puedes buscar viajes desde hoy en adelante");
        setIsSearching(false);
        return;
      }

      const formattedDate = dayjs(formData.date).format("YYYY-MM-DD");

      console.log("📅 Formatted search params:", {
        origin: formData.origin,
        destination: formData.destination,
        date: formattedDate,
        passengers: formData.passengers,
      });

      // Usar el endpoint de búsqueda del backend
      const response = await searchTrips({
        origin: formData.origin,
        destination: formData.destination,
        date: formattedDate,
        passengers: formData.passengers,
      });

      console.log("✅ Search response received:", response);

      // Actualizar los resultados con logs informativos
      setSearchResults(response.trips || []);
      setSearchMessage(response.message || "Búsqueda completada");
      setSearchStatus(response.status || "none");

      // Tracking de resultados de búsqueda
      setCustomTag("search_results_count", response.trips.length.toString());
      setCustomTag("search_status", response.status || "none");
      trackSearch(
        `${formData.origin} to ${formData.destination}`,
        response.trips.length
      );

      // Log del tipo de búsqueda realizada
      const searchType = {
        exact: "🎯 Búsqueda exacta: origen + destino + fecha",
        close: "📍 Búsqueda por ubicación: origen O destino coinciden",
        date: "📅 Búsqueda por fecha: viajes disponibles en la fecha",
        all: "🗂️ Búsqueda general: todos los viajes disponibles",
        none: "❌ Sin resultados",
      };

      console.log(
        `📊 Resultado de búsqueda: ${searchType[response.status || "none"]}`
      );
      console.log(`📈 Viajes encontrados: ${response.trips.length}`);

      // Si no hay resultados, mostrar mensaje informativo
      if (response.trips.length === 0) {
        setSearchMessage(
          response.message ||
            "No se encontraron viajes disponibles. El sistema buscó por exactitud, similitud, fecha y viajes generales."
        );
      }
    } catch (error) {
      console.error("❌ Error in search:", error);

      // Manejo más específico de errores
      let errorMessage = "Error al buscar viajes. Por favor intenta de nuevo.";
      let errorDetails =
        "Error al conectar con el servidor. Verifica tu conexión e intenta nuevamente.";

      if (error instanceof Error) {
        if (
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError")
        ) {
          errorMessage = "Error de conexión";
          errorDetails =
            "No se pudo conectar con el servidor. Verifica tu conexión a internet.";
        } else if (error.message.includes("500")) {
          errorMessage = "Error del servidor";
          errorDetails =
            "El servidor está experimentando problemas. Intenta nuevamente en unos momentos.";
        } else if (error.message.includes("404")) {
          errorMessage = "Servicio no disponible";
          errorDetails =
            "El servicio de búsqueda no está disponible temporalmente.";
        } else {
          errorDetails = `Error técnico: ${error.message}`;
        }
      }

      // Tracking de error en búsqueda
      setCustomTag("search_error", "true");
      setCustomTag("error_type", "search_trips");
      setCustomTag("error_message", errorMessage);

      setFormError(errorMessage);
      setSearchMessage(errorDetails);
      setSearchStatus("none");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  const handleInputFocus = (type: "origin" | "destination") => {
    setFocusedInput(type);
  };

  const handleInputBlur = () => {
    setTimeout(() => setFocusedInput(null), 200);
  };

  // Función que contiene la lógica de reserva
  const performReservation = async (trip: TripSearchResult) => {
    // Tracking de intento de reservación
    trackButtonClick("reserve_trip");
    setCustomTag("trip_id_selected", trip.id.toString());
    setCustomTag("trip_price_selected", trip.pricePerSeat.toString());
    setCustomTag("trip_seats_selected", trip.seats.toString());
    setCustomTag("driver_selected", trip.driverName || "unknown");

    // Convertir TripSearchResult a Trip para compatibilidad
    const tripData: Trip = {
      id: trip.id,
      user_id: trip.user_id,
      origin: {
        address: trip.origin,
        secondaryText: "",
      },
      destination: {
        address: trip.destination,
        secondaryText: "",
      },
      dateTime: trip.dateTime,
      seats: trip.seats,
      pricePerSeat: trip.pricePerSeat,
      allowPets: trip.allowPets,
      allowSmoking: trip.allowSmoking,
      selectedRoute: trip.selectedRoute,
      driverName: trip.driverName,
      photo: trip.photo,
      vehicle: trip.vehicle
        ? {
            brand: trip.vehicle.brand || null,
            model: trip.vehicle.model || null,
            plate: trip.vehicle.plate || "",
            color: trip.vehicle.color || null,
            photo_url: trip.vehicle.photo_url || null,
            year: trip.vehicle.year ? parseInt(trip.vehicle.year) : null,
          }
        : null,
      license: trip.license,
      propertyCard: trip.propertyCard,
      soat: trip.soat,
      rating: trip.rating,
    };

    setSelectedTrip(tripData);
    saveToLocalStorage("currentTrip", tripData);
    setReservationModalOpen(true);

    // No navegamos automáticamente, permanecemos en la página con los resultados
  };

  // Función actualizada que usa el hook de protección
  const handleReservation = async (trip: TripSearchResult) => {
    await reserveClick.execute(trip);
  };

  // Función para cargar las preferencias del viaje desde el backend
  const loadTripPreferences = async (tripId: number) => {
    setLoadingPreferences(true);
    setPreferencesError(null);
    setTripPreferences(null); // Reset previas preferencias

    try {
      console.log("🎯 [PREFERENCES] Loading preferences for trip:", tripId);
      const response = await getTripPreferencesPublic(tripId);

      if (response.success && response.data) {
        setTripPreferences(response.data);
        console.log(
          "✅ [PREFERENCES] Preferences loaded successfully:",
          response.data
        );
        console.log(
          "📝 [PREFERENCES] Are default preferences?",
          !response.data.id
        );
      } else {
        // Si hay un error específico, mostrarlo
        if (response.error) {
          setPreferencesError(response.error);
          console.error(
            "❌ [PREFERENCES] Error loading preferences:",
            response.error
          );
        } else {
          // Si no hay error pero tampoco datos, es que no hay preferencias
          setTripPreferences(null);
          console.log(
            "ℹ️ [PREFERENCES] No preferences found for trip:",
            tripId
          );
        }
      }
    } catch (error) {
      setPreferencesError("Error inesperado cargando preferencias del viaje");
      console.error("❌ [PREFERENCES] Exception loading preferences:", error);
    } finally {
      setLoadingPreferences(false);
    }
  };

  const handleCloseModal = () => {
    setReservationModalOpen(false);
  };

  // Utilidad para parsear distancia ("123 km" o "12.3 km") a número
  const parseDistanceKm = (distanceStr: string): number => {
    if (!distanceStr) return 15; // Valor por defecto
    if (distanceStr.includes("no disponible")) return 15; // Valor por defecto
    const match = distanceStr.match(/([\d,.]+)/);
    if (!match) return 15; // Valor por defecto
    return parseFloat(match[1].replace(",", "."));
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
    if (actual < alertMin)
      return {
        status: "low",
        color: "red",
        icon: <IconArrowDownLeft size={16} />,
      };
    if (actual > alertMax)
      return {
        status: "high",
        color: "red",
        icon: <IconArrowUpRight size={16} />,
      };
    if (actual < min)
      return {
        status: "low",
        color: "yellow",
        icon: <IconArrowDownLeft size={16} />,
      };
    if (actual > max)
      return {
        status: "high",
        color: "yellow",
        icon: <IconArrowUpRight size={16} />,
      };
    return { status: "normal", color: "green", icon: <IconCheck size={16} /> };
  };

  // Función para determinar el tipo de coincidencia de un viaje con la búsqueda
  const getTripMatchType = (
    trip: TripSearchResult
  ): {
    type: "exact" | "origin" | "destination" | "date" | "general";
    badge: React.ReactNode;
    description: string;
  } => {
    const searchDate = formData.date
      ? dayjs(formData.date).format("YYYY-MM-DD")
      : "";
    const tripDate = dayjs(trip.dateTime).format("YYYY-MM-DD");

    // Función helper para comparar ubicaciones (texto similar)
    const isLocationMatch = (
      searchLocation: string,
      tripLocation: string
    ): boolean => {
      if (!searchLocation || !tripLocation) return false;
      const searchLower = searchLocation.toLowerCase().trim();
      const tripLower = tripLocation.toLowerCase().trim();
      return tripLower.includes(searchLower) || searchLower.includes(tripLower);
    };

    const originMatch = isLocationMatch(formData.origin, trip.origin);
    const destinationMatch = isLocationMatch(
      formData.destination,
      trip.destination
    );
    const dateMatch = searchDate === tripDate;

    // Coincidencia exacta: origen + destino + fecha
    if (originMatch && destinationMatch && dateMatch) {
      return {
        type: "exact",
        badge: (
          <Badge
            color="green"
            size="sm"
            leftSection={<IconCircleCheck size={12} />}
          >
            Coincidencia Exacta
          </Badge>
        ),
        description: "Origen, destino y fecha coinciden perfectamente",
      };
    }

    // Coincidencia de origen y fecha
    if (originMatch && dateMatch) {
      return {
        type: "origin",
        badge: (
          <Badge color="blue" size="sm" leftSection={<MapPin size={12} />}>
            Mismo Origen
          </Badge>
        ),
        description: "Mismo origen y fecha",
      };
    }

    // Coincidencia de destino y fecha
    if (destinationMatch && dateMatch) {
      return {
        type: "destination",
        badge: (
          <Badge color="cyan" size="sm" leftSection={<Navigation size={12} />}>
            Mismo Destino
          </Badge>
        ),
        description: "Mismo destino y fecha",
      };
    }

    // Solo coincidencia de origen
    if (originMatch) {
      return {
        type: "origin",
        badge: (
          <Badge
            color="indigo"
            size="sm"
            variant="light"
            leftSection={<MapPin size={12} />}
          >
            Origen Similar
          </Badge>
        ),
        description: "Origen coincide",
      };
    }

    // Solo coincidencia de destino
    if (destinationMatch) {
      return {
        type: "destination",
        badge: (
          <Badge
            color="violet"
            size="sm"
            variant="light"
            leftSection={<Navigation size={12} />}
          >
            Destino Similar
          </Badge>
        ),
        description: "Destino coincide",
      };
    }

    // Solo coincidencia de fecha
    if (dateMatch) {
      return {
        type: "date",
        badge: (
          <Badge
            color="orange"
            size="sm"
            leftSection={<IconCalendar size={12} />}
          >
            Misma Fecha
          </Badge>
        ),
        description: "Fecha coincide",
      };
    }

    // Viaje general (sin coincidencias específicas)
    return {
      type: "general",
      badge: (
        <Badge color="gray" size="sm" variant="outline">
          Disponible
        </Badge>
      ),
      description: "Viaje disponible",
    };
  };

  return (
    <Container fluid className={styles.container}>
      <div className={styles.logoOverlay}></div>
      <Container size="md" className={styles.content}>
        <div className="top mb-6">
          <BackButton to="/" />
        </div>
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
                        handlePlaceSearch(value, "origin");
                      }}
                      onFocus={() => handleInputFocus("origin")}
                      onBlur={handleInputBlur}
                      variant="unstyled"
                      required
                      size="md"
                    />
                  </div>
                  {focusedInput === "origin" &&
                    originSuggestions.length > 0 && (
                      <div className={styles.suggestionsContainer}>
                        {originSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.placeId}
                            className={styles.suggestionItem}
                            onClick={() =>
                              handleSuggestionClick(suggestion, "origin")
                            }
                            type="button"
                          >
                            <MapPin
                              size={16}
                              className={styles.suggestionIcon}
                            />
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
                        setFormData((prev) => ({
                          ...prev,
                          destination: value,
                        }));
                        handlePlaceSearch(value, "destination");
                      }}
                      onFocus={() => handleInputFocus("destination")}
                      onBlur={handleInputBlur}
                      variant="unstyled"
                      required
                      size="md"
                    />
                  </div>
                  {focusedInput === "destination" &&
                    destinationSuggestions.length > 0 && (
                      <div className={styles.suggestionsContainer}>
                        {destinationSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.placeId}
                            className={styles.suggestionItem}
                            onClick={() =>
                              handleSuggestionClick(suggestion, "destination")
                            }
                            type="button"
                          >
                            <MapPin
                              size={16}
                              className={styles.suggestionIcon}
                            />
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
                    onChange={(date) =>
                      setFormData((prev) => ({ ...prev, date }))
                    }
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
                  onClick={() => {
                    setShowPassengerSelector(!showPassengerSelector);
                    if (!showPassengerSelector) {
                      trackButtonClick("open_passenger_selector");
                    }
                  }}
                >
                  <div className={styles.inputIcon}>
                    <User size={20} />
                  </div>
                  <TextInput
                    className={styles.input}
                    value={`${formData.passengers} ${
                      formData.passengers > 1 ? "Pasajeros" : "Pasajero"
                    }`}
                    readOnly
                    variant="unstyled"
                    rightSection={
                      <div className={styles.passengerIconWrapper}>
                        {Array.from({ length: formData.passengers }).map(
                          (_, i) => (
                            <User
                              key={`passenger-${i}`}
                              size={16}
                              className={styles.passengerIcon}
                            />
                          )
                        )}
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
                      // Tracking de selección de pasajeros
                      trackButtonClick("select_passengers", num.toString());
                      setCustomTag("passengers_selected", num.toString());
                    }}
                  />
                )}

                {/* Search Button */}
                <Button
                  className={`${styles.searchButton} ${
                    isSearching ? styles.searching : ""
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
                    "Buscar"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </Box>

        {/* Results Section */}
        <Box className={styles.resultsSection}>
          {/* Contador de viajes */}
          {searchResults.length > 0 && (
            <Box
              style={{
                background: "rgba(34, 197, 94, 0.08)",
                border: "1px solid rgba(34, 197, 94, 0.2)",
                borderRadius: "8px",
                padding: "3px 10px",
                margin: "0 auto 3px auto",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <IconList size={12} style={{ color: "#22c55e" }} />
              <Text size="xs" fw={500} style={{ color: "#22c55e", margin: 0 }}>
                {searchResults.length}{" "}
                {searchResults.length === 1
                  ? "viaje encontrado"
                  : "viajes encontrados"}
              </Text>
            </Box>
          )}

          {/* Search Message */}
          {searchMessage && (
            <Box
              style={{
                background:
                  "linear-gradient(90deg, rgba(59, 130, 246, 0.05) 0%, rgba(34, 197, 94, 0.05) 100%)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                borderRadius: "8px",
                padding: "6px 12px",
                margin: "0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              {/* Icono pequeño */}
              {searchStatus === "exact" && (
                <IconCircleCheck size={16} style={{ color: "#22c55e" }} />
              )}
              {searchStatus === "close" && (
                <MapPin size={16} style={{ color: "#3b82f6" }} />
              )}
              {searchStatus === "date" && (
                <IconCalendar size={16} style={{ color: "#f59e0b" }} />
              )}
              {searchStatus === "all" && (
                <IconList size={16} style={{ color: "#6366f1" }} />
              )}
              {searchStatus === "none" && (
                <IconX size={16} style={{ color: "#ef4444" }} />
              )}

              {/* Texto compacto pero informativo */}
              <Text
                size="xs"
                fw={500}
                style={{
                  color:
                    searchStatus === "exact"
                      ? "#22c55e"
                      : searchStatus === "close"
                        ? "#3b82f6"
                        : searchStatus === "date"
                          ? "#f59e0b"
                          : searchStatus === "all"
                            ? "#6366f1"
                            : "#ef4444",
                  margin: 0,
                  textAlign: "center",
                }}
              >
                {searchStatus === "exact" &&
                  "🎯 ¡Encontramos viajes exactos para tu ruta y fecha!"}
                {searchStatus === "close" &&
                  "📍 Viajes similares encontrados (origen o destino coinciden)"}
                {searchStatus === "date" &&
                  "📅 Viajes disponibles para la fecha seleccionada"}
                {searchStatus === "all" &&
                  "🗂️ Todos los viajes disponibles - Ajusta tu búsqueda para mayor precisión"}
                {searchStatus === "none" &&
                  "❌ No encontramos viajes para tu búsqueda específica. Estos son todos los viajes disponibles."}
              </Text>
            </Box>
          )}

          {/* Error Message */}
          {formError && (
            <Box
              style={{
                background: "rgba(239, 68, 68, 0.05)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "12px",
                padding: "8px 16px",
                margin: "0 0 6px 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <IconAlertCircle size={16} style={{ color: "#ef4444" }} />
              <Text size="xs" fw={500} style={{ color: "#ef4444", margin: 0 }}>
                {formError}
              </Text>
            </Box>
          )}

          {searchResults.length > 0 ? (
            <div className={styles.tripsGrid}>
              {searchResults.map((trip) => {
                // Obtener tipo de coincidencia
                const matchInfo = getTripMatchType(trip);

                // Calcular sugerido y estado del precio
                let priceBadge = null;
                let badge = null;
                if (assumptions && trip.selectedRoute?.distance) {
                  const distanceKm = parseDistanceKm(
                    trip.selectedRoute.distance
                  );
                  const isUrban = distanceKm <= 30; // Lógica para determinar si es urbano
                  const pricePerKm = isUrban
                    ? assumptions.urban_price_per_km
                    : assumptions.interurban_price_per_km;

                  // Calcular precio total del viaje
                  const totalTripPrice = distanceKm * pricePerKm;

                  // Dividir siempre entre 4 cupos estándar para obtener precio por cupo
                  const suggestedPricePerSeat = totalTripPrice / 4;

                  const { price_limit_percentage, alert_threshold_percentage } =
                    assumptions;
                  badge = getPriceStatus(
                    trip.pricePerSeat,
                    suggestedPricePerSeat,
                    price_limit_percentage,
                    alert_threshold_percentage
                  );
                  priceBadge = (
                    <Badge
                      color={badge.color}
                      leftSection={badge.icon}
                      size="lg"
                      radius="md"
                      variant="filled"
                      style={{
                        fontWeight: 600,
                        fontSize: "1.1rem",
                        marginBottom: 4,
                      }}
                    >
                      $
                      {trip.pricePerSeat.toLocaleString("es-CO", {
                        minimumFractionDigits: 0,
                      })}
                    </Badge>
                  );
                } else {
                  priceBadge = (
                    <Badge
                      color="gray"
                      size="lg"
                      radius="md"
                      variant="light"
                      style={{
                        fontWeight: 600,
                        fontSize: "1.1rem",
                        marginBottom: 4,
                      }}
                    >
                      $
                      {trip.pricePerSeat.toLocaleString("es-CO", {
                        minimumFractionDigits: 0,
                      })}
                    </Badge>
                  );
                }
                return (
                  <Card
                    key={trip.id}
                    className={styles.compactTripCard}
                    shadow="md"
                    radius="lg"
                    p="sm"
                    style={{ position: "relative" }}
                  >
                    {/* Badge de coincidencia a la izquierda */}
                    <div className={styles.leftBadgeSection}>
                      {matchInfo.badge}
                    </div>

                    {/* Header: Ruta principal con precio */}
                    <Group justify="space-between" align="flex-start" mb={4}>
                      <div className={styles.compactRouteHeader}>
                        <Text
                          fw={700}
                          size="lg"
                          className={styles.compactRouteText}
                          onClick={() => {
                            setSelectedRouteInfo({
                              origin: trip.origin,
                              destination: trip.destination,
                            });
                            setShowRouteModal(true);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          {trip.origin.split(",")[0]} →{" "}
                          {trip.destination.split(",")[0]}
                        </Text>
                        <Text
                          size="xs"
                          c="dimmed"
                          className={styles.compactSubroute}
                        >
                          {trip.origin.split(",").slice(1).join(",").trim()}
                        </Text>
                      </div>

                      <div
                        className={styles.priceSection}
                        style={{ alignSelf: "flex-start" }}
                      >
                        {priceBadge}
                      </div>
                    </Group>

                    {/* Línea 2: Fecha y hora */}
                    <Group justify="space-between" align="center" mb={4}>
                      <Group align="center" gap="xs">
                        <div className={styles.compactTimeIcon}>
                          <IconCalendar size={14} />
                        </div>
                        <Text size="sm" c="dimmed">
                          {new Date(trip.dateTime).toLocaleString("es-ES", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </Text>
                      </Group>
                    </Group>

                    {/* Iconos compactos: SafePoints y Ver Ruta */}
                    <Group justify="space-between" align="center" mb={2}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          flex: 1,
                          maxWidth: "40%",
                          gap: "3px",
                          marginTop: "1px",
                        }}
                      >
                        <IconUsers
                          size={20}
                          style={{
                            color: trip.seats > 0 ? "#22c55e" : "#ef4444",
                            marginRight: "4px",
                          }}
                        />
                        <div style={{ textAlign: "left" }}>
                          <Text
                            size="sm"
                            fw={500}
                            style={{
                              color: trip.seats > 0 ? "#22c55e" : "#ef4444",
                              marginBottom: "2px",
                            }}
                          >
                            {trip.seats} Disponibles
                          </Text>
                          <Text
                            size="10px"
                            c="dimmed"
                            style={{ lineHeight: 1 }}
                          >
                            {4 - trip.seats} Ocupados
                          </Text>
                        </div>
                      </div>
                      <Group align="center" gap="xs">
                        {/* SafePoints con el modal original integrado */}
                        <SafePointsIcon
                          tripId={trip.id.toString()}
                          className={styles.safePointsIconButton}
                          size="lg"
                          showLabel={true}
                        />
                        {/* Botón Ver Ruta */}
                        <Box style={{ textAlign: "center", lineHeight: 1 }}>
                          <ActionIcon
                            size="lg"
                            variant="subtle"
                            className={styles.routeViewIconButton}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              setSelectedRouteInfo({
                                origin: trip.origin,
                                destination: trip.destination,
                              });
                              setShowRouteModal(true);
                            }}
                            title="Ver ruta del viaje"
                          >
                            <IconRoute size={20} />
                          </ActionIcon>
                          <Text
                            size="8px"
                            c="dimmed"
                            style={{ marginTop: "1px", lineHeight: 0.9 }}
                          >
                            Ruta
                          </Text>
                        </Box>
                        {/* Botón Ver Preferencias */}
                        <Box style={{ textAlign: "center", lineHeight: 1 }}>
                          <ActionIcon
                            size="lg"
                            variant="subtle"
                            className={styles.preferencesViewIconButton}
                            onClick={async (e: React.MouseEvent) => {
                              e.stopPropagation();
                              setSelectedTripForPreferences(trip);
                              setShowPreferencesModal(true);
                              // Cargar las preferencias del backend
                              await loadTripPreferences(Number(trip.id));
                            }}
                            title="Ver preferencias del viaje"
                          >
                            <IconSettings size={20} />
                          </ActionIcon>
                          <Text
                            size="8px"
                            c="dimmed"
                            style={{ marginTop: "1px", lineHeight: 0.9 }}
                          >
                            Preferencias
                          </Text>
                        </Box>
                      </Group>
                    </Group>

                    {/* Sección del conductor - compacta con verificación */}
                    <div
                      className={`${styles.enhancedDriverSection} ${
                        trip.isUserVerified
                          ? styles.verifiedDriver
                          : styles.unverifiedDriver
                      }`}
                      onClick={() => {
                        setSelectedDriver(trip);
                        setShowDriverModal(true);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <img
                        src={trip.photo}
                        alt="Conductor"
                        className={styles.enhancedDriverPhoto}
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://tddaveymppuhweujhzwz.supabase.co/storage/v1/object/public/resourcers/Home/SinFotoPerfil.png";
                        }}
                      />
                      <div className={styles.enhancedDriverInfo}>
                        <Group
                          align="center"
                          justify="space-between"
                          style={{ width: "100%", marginBottom: "2px" }}
                        >
                          <Text
                            fw={600}
                            size="md"
                            lineClamp={1}
                            className={styles.driverName}
                          >
                            {trip.driverName || "No disponible"}
                          </Text>

                          {/* Estado de verificación del conductor */}
                          {trip.isUserVerified ? (
                            <Badge
                              size="xs"
                              color="green"
                              className={styles.verifiedBadge}
                              leftSection={<IconShieldCheck size={10} />}
                            >
                              Verificado
                            </Badge>
                          ) : (
                            <Badge
                              size="xs"
                              variant="outline"
                              color="orange"
                              className={styles.unverifiedBadge}
                              leftSection={<IconShieldX size={10} />}
                            >
                              Sin verificar
                            </Badge>
                          )}
                        </Group>

                        {/* Línea con rating y verificación de vehículo */}
                        <Group
                          align="center"
                          justify="space-between"
                          style={{ width: "100%" }}
                        >
                          <div className={styles.enhancedDriverRating}>
                            {trip.rating !== undefined ? (
                              <Group align="center" gap={2}>
                                <Rating
                                  value={trip.rating}
                                  readOnly
                                  size="xs"
                                />
                                <Text
                                  size="xs"
                                  c="dimmed"
                                  style={{ marginLeft: "2px" }}
                                >
                                  {trip.rating.toFixed(1)}
                                </Text>
                              </Group>
                            ) : (
                              <Text c="gray" size="xs">
                                Sin calificaciones
                              </Text>
                            )}
                          </div>

                          {/* Estado de verificación del vehículo */}
                          {trip.isVehicleVerified ? (
                            <Badge
                              size="xs"
                              color="blue"
                              variant="light"
                              leftSection={<IconCar size={10} />}
                            >
                              Vehículo ✓
                            </Badge>
                          ) : (
                            <Badge
                              size="xs"
                              variant="outline"
                              color="gray"
                              leftSection={<IconCar size={10} />}
                            >
                              Vehículo
                            </Badge>
                          )}
                        </Group>
                      </div>
                      <div className={styles.driverArrow}>
                        <IconArrowUpRight size={16} />
                      </div>
                    </div>

                    {/* Botón de reservar */}
                    <Button
                      fullWidth
                      className={styles.compactReserveButton}
                      onClick={() => handleReservation(trip)}
                      loading={reserveClick.isProcessing}
                      disabled={reserveClick.isProcessing}
                      size="sm"
                    >
                      {reserveClick.isProcessing ? "Procesando..." : "Reservar"}
                    </Button>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              {isSearching ? (
                <div className={styles.loadingState}>
                  <IconCalendar size={40} className={styles.loadingIcon} />
                  <Text size="md" fw={600} ta="center" mt="sm">
                    Buscando viajes disponibles...
                  </Text>
                  <Text size="xs" c="dimmed" ta="center" mt="xs">
                    Revisando todas las opciones para tu viaje
                  </Text>
                </div>
              ) : (
                <div className={styles.initialState}>
                  <MapPin size={48} className={styles.initialIcon} />
                  <Text size="lg" fw={600} ta="center" mt="md">
                    Encuentra tu viaje ideal
                  </Text>
                  <Text
                    size="sm"
                    c="dimmed"
                    ta="center"
                    mt="xs"
                    maw={350}
                    mx="auto"
                  >
                    Ingresa tu origen, destino y fecha para ver todas las
                    opciones disponibles
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

        {/* Modal de Preferencias del Viaje */}
        <Modal
          opened={showPreferencesModal}
          onClose={() => {
            setShowPreferencesModal(false);
            setTripPreferences(null);
            setPreferencesError(null);
            setLoadingPreferences(false);
          }}
          title="Preferencias del Viaje"
          size="md"
          centered
          classNames={{
            header: styles.modalHeader,
            title: styles.modalTitle,
            body: styles.modalBody,
          }}
        >
          {selectedTripForPreferences && (
            <div>
              {/* Header del conductor */}
              <Group mb="md" align="center">
                <img
                  src={selectedTripForPreferences.photo}
                  alt="Conductor"
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://tddaveymppuhweujhzwz.supabase.co/storage/v1/object/public/resourcers/Home/SinFotoPerfil.png";
                  }}
                />
                <div>
                  <Text fw={600} size="lg">
                    {selectedTripForPreferences.driverName || "Conductor"}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {selectedTripForPreferences.origin} →{" "}
                    {selectedTripForPreferences.destination}
                  </Text>
                </div>
              </Group>

              {/* Loading state */}
              {loadingPreferences && (
                <Text ta="center" py="xl" c="dimmed">
                  Cargando preferencias del viaje...
                </Text>
              )}

              {/* Error state */}
              {preferencesError && (
                <Card withBorder p="md" c="red" mb="md">
                  <Group gap="xs">
                    <IconAlertCircle size={18} />
                    <Text size="sm">Error: {preferencesError}</Text>
                  </Group>
                </Card>
              )}

              {/* Grid de Preferencias - Solo preferencias REALES configuradas por el conductor */}
              {!loadingPreferences &&
                !preferencesError &&
                tripPreferences &&
                tripPreferences.id && (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "12px",
                      }}
                    >
                      {mapPreferencesForDisplay(tripPreferences).map(
                        (preference, index) => (
                          <div
                            key={index}
                            className={
                              preference.enabled
                                ? styles.preferenceEnabled
                                : styles.preferenceDisabled
                            }
                          >
                            <Group gap="xs" align="center">
                              {preference.name === "Mascotas" && (
                                <IconHeart size={18} />
                              )}
                              {preference.name === "Fumar" && (
                                <IconSmokingNo size={18} />
                              )}
                              {preference.name ===
                                "Comida durante el viaje" && (
                                <IconPackage size={18} />
                              )}
                              {preference.name === "Música" && (
                                <IconMusic size={18} />
                              )}
                              {preference.name === "Equipaje extra" && (
                                <IconPackage size={18} />
                              )}
                              {preference.name === "Aire acondicionado" && (
                                <IconSnowflake size={18} />
                              )}
                              <div>
                                <Text size="sm" fw={500}>
                                  {preference.name}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {preference.enabled
                                    ? "Permitido"
                                    : "No permitido"}
                                </Text>
                              </div>
                            </Group>
                          </div>
                        )
                      )}
                    </div>

                    {/* Solo mostrar si son preferencias configuradas por el conductor */}
                    {tripPreferences.id && (
                      <Card mt="sm" p="xs" withBorder variant="light">
                        <Text size="xs" c="dimmed" ta="center">
                          Preferencias configuradas por el conductor
                        </Text>
                      </Card>
                    )}
                  </>
                )}

              {/* Mensaje cuando no hay preferencias configuradas */}
              {!loadingPreferences &&
                !preferencesError &&
                (!tripPreferences || !tripPreferences.id) && (
                  <Card withBorder p="md" ta="center">
                    <Group justify="center" gap="xs" mb="sm">
                      <IconAlertCircle size={20} color="gray" />
                      <Text size="sm" fw={500} c="dimmed">
                        Sin preferencias configuradas
                      </Text>
                    </Group>
                    <Text size="sm" c="dimmed">
                      El conductor no ha configurado preferencias específicas
                      para este viaje.
                    </Text>
                    <Text size="xs" c="dimmed" mt="xs">
                      Puedes consultar directamente con el conductor sobre las
                      reglas del viaje.
                    </Text>
                  </Card>
                )}
            </div>
          )}
        </Modal>

        {selectedRouteInfo && (
          <Drawer
            opened={showRouteModal}
            onClose={() => setShowRouteModal(false)}
            withCloseButton={false}
            size="70vh"
            position="bottom"
            classNames={{
              content: styles.mapModalContent,
            }}
            transitionProps={{
              transition: "slide-up",
              duration: 400,
              timingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div className={styles.mapModalContainer}>
              {/* Header con información de la ruta */}
              <div className={styles.mapModalHeader}>
                <div className={styles.mapModalHeaderContent}>
                  <div className={styles.mapModalTitle}>
                    <IconRoute size={24} className={styles.mapModalIcon} />
                    <div>
                      <Text
                        size="lg"
                        fw={700}
                        className={styles.mapModalTitleText}
                      >
                        Ruta del Viaje
                      </Text>
                      <Text
                        size="xs"
                        className={styles.mapModalSubtitle}
                        style={{ marginTop: 2 }}
                      >
                        Toca el mapa para interactuar
                      </Text>
                    </div>
                  </div>
                  <button
                    className={styles.mapModalCloseButton}
                    onClick={() => setShowRouteModal(false)}
                    aria-label="Cerrar modal"
                  >
                    ×
                  </button>
                </div>

                {/* Información de origen y destino */}
                <div className={styles.routeInfoSection}>
                  <div className={styles.routeInfoItem}>
                    <div className={styles.routeIconWrapper}>
                      <IconMapPin
                        size={16}
                        className={styles.routeOriginIcon}
                      />
                    </div>
                    <div className={styles.routeTextWrapper}>
                      <Text size="xs" fw={500} className={styles.routeLabel}>
                        Origen
                      </Text>
                      <Text size="sm" fw={600} className={styles.routeAddress}>
                        {selectedRouteInfo.origin}
                      </Text>
                    </div>
                  </div>

                  <div className={styles.routeInfoItem}>
                    <div className={styles.routeIconWrapper}>
                      <IconFlag
                        size={16}
                        className={styles.routeDestinationIcon}
                      />
                    </div>
                    <div className={styles.routeTextWrapper}>
                      <Text size="xs" fw={500} className={styles.routeLabel}>
                        Destino
                      </Text>
                      <Text size="sm" fw={600} className={styles.routeAddress}>
                        {selectedRouteInfo.destination}
                      </Text>
                    </div>
                  </div>
                </div>

                {/* Botón para abrir en Google Maps */}
                <div className={styles.mapActionsSection}>
                  <button
                    className={styles.openInGoogleMapsBtn}
                    onClick={() => {
                      const mapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(selectedRouteInfo.origin)}/${encodeURIComponent(selectedRouteInfo.destination)}`;
                      window.open(mapsUrl, "_blank");
                    }}
                  >
                    <IconExternalLink size={16} />
                    <span>Abrir en Google Maps</span>
                  </button>
                </div>
              </div>

              {/* Contenedor del mapa - Ahora ocupa todo el espacio */}
              <div className={styles.mapContentWrapper}>
                <InteractiveMap
                  origin={selectedRouteInfo.origin}
                  destination={selectedRouteInfo.destination}
                />
              </div>
            </div>
          </Drawer>
        )}

        {selectedDriver && (
          <DriverModal
            opened={showDriverModal}
            onClose={() => setShowDriverModal(false)}
            driverName={selectedDriver.driverName || "Conductor"}
            photo={selectedDriver.photo}
            rating={selectedDriver.rating || 0}
            vehicle={selectedDriver.vehicle}
            license={selectedDriver.license}
            propertyCard={selectedDriver.propertyCard}
            soat={selectedDriver.soat}
            // ✅ Pasar los nuevos campos de verificación del backend
            isUserVerified={selectedDriver.isUserVerified}
            isVehicleVerified={selectedDriver.isVehicleVerified}
            userVerificationStatus={selectedDriver.userVerificationStatus}
            vehicleVerificationStatus={selectedDriver.vehicleVerificationStatus}
          />
        )}
      </Container>
    </Container>
  );
};

export const Route = createFileRoute("/reservar/")({
  component: ReservarView,
});
