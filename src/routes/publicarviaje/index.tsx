import { useCallback, useEffect, useRef, useState } from "react";
import {
  createFileRoute,
  Link,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import {
  ActionIcon,
  Badge,
  Button,
  Container,
  Group,
  Loader,
  Modal,
  Popover,
  Stack,
  Stepper,
  Switch,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  AlertCircle,
  ArrowLeft,
  Car,
  CheckCircle,
  Clock,
  DollarSign,
  MapPin,
  Navigation,
  Route as RouteIcon,
  Settings,
  Sparkles,
  Trees,
  X,
} from "lucide-react";
import {
  type TripLocation,
  type TripRoute,
  tripStore,
} from "../../types/PublicarViaje/TripDataManagement";
import { calculateSuggestedPrice } from "@/services/config";
// import { publishTrip } from "@/services/viajes";
import { getMyVehicle } from "@/services/vehicles";
// import { useTripDraft } from "@/hooks/useTripDraft";
// import { ConditionalMap } from "@/components/ui/OptimizedMap";
import { useOptimizedMaps } from "@/hooks/useOptimizedMaps";
import styles from "./index.module.css";
import { notifications } from "@mantine/notifications";
import { getCurrentUser } from "@/services/auth";
import { getCurrentUserProfile } from "@/services/profile";
import { useMaps } from "@/components/GoogleMapsProvider";

interface RoutePreferences {
  avoidTolls: boolean;
  avoidHighways: boolean;
  optimizeFuel: boolean;
}

interface SearchParams {
  selectedAddress?: string;
  selectedDestination?: string;
}

export const Route = createFileRoute("/publicarviaje/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    selectedAddress: search.selectedAddress as string | undefined,
    selectedDestination: search.selectedDestination as string | undefined,
  }),
  component: ReservarView,
});

import BackButton from '@/components/Buttons/backButton';
import { GoogleMap } from "@react-google-maps/api";

function ReservarView() {
  const navigate = useNavigate();
  const { selectedAddress = "", selectedDestination = "" } = useSearch({
    from: "/publicarviaje/",
  });
  const { isLoaded, loadError } = useMaps();

  const mapRef = useRef<google.maps.Map | null>(null);

  // 🚀 Hook optimizado para reducir costos de Google Maps
  const { calculateRouteInfo } = useOptimizedMaps();

  // Estados base
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [directions, setDirections] = useState<any | null>(null);
  const [routes, setRoutes] = useState<TripRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Estados para modal de información
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [modalInfo, setModalInfo] = useState<
    {
      type: "error" | "warning" | "info" | "success";
      title: string;
      message: string;
      actionText?: string;
      actionLink?: string;
      details?: string[];
    } | null
  >(null);

  // Estados de preferencias
  const [routePreferences, setRoutePreferences] = useState<RoutePreferences>({
    avoidTolls: false,
    avoidHighways: false,
    optimizeFuel: false,
  });

  // Referencias
  const directionsRendererRef = useRef<any | null>(null);

  // Validación de acceso del usuario
  useEffect(() => {
    const validateUserAccess = async () => {
      try {
        const user = await getCurrentUser();

        if (!user.success || !user.user) {
          navigate({ to: "/Login" });
          return;
        }

        const profile = await getCurrentUserProfile();

        if (!profile.success || !profile.data) {
          setModalInfo({
            type: "warning",
            title: "⚠️ Perfil incompleto",
            message: "Necesitas completar tu perfil antes de publicar viajes.",
            actionText: "Completar Perfil",
            actionLink: "/perfil",
          });
          setShowInfoModal(true);
          return;
        }

        // Validar que el usuario sea conductor
        const userType = profile.data.status;
        if (userType !== "DRIVER") {
          setModalInfo({
            type: "error",
            title: "🚗 Acceso solo para conductores",
            message: "Solo los conductores registrados pueden publicar viajes.",
            actionText: "Registrarse como Conductor",
            actionLink: "/RegistrarVehiculo",
          });
          setShowInfoModal(true);
          return;
        }

        // Validar verificación del conductor
        const verificationStatus = profile.data.verification ||
          (profile.data as any).Verification || "PENDIENTE";
        if (
          verificationStatus !== "VERIFICADO" &&
          verificationStatus !== "APPROVED"
        ) {
          const statusMessages = {
            "PENDIENTE": {
              title: "⏳ Verificación en proceso",
              message: "Tu documentación está siendo revisada.",
              actionText: "Editar Información",
              actionLink: "/RegistrarVehiculo",
            },
            "RECHAZADO": {
              title: "❌ Verificación rechazada",
              message: "Tu documentación necesita correcciones.",
              actionText: "Corregir Documentos",
              actionLink: "/RegistrarVehiculo",
            },
            "BLOQUEADO": {
              title: "🔒 Cuenta suspendida",
              message: "Tu cuenta requiere revisión.",
              actionText: "Actualizar Información",
              actionLink: "/RegistrarVehiculo",
            },
          };

          const statusInfo =
            statusMessages[verificationStatus as keyof typeof statusMessages] ||
            {
              title: "⚠️ Estado de verificación pendiente",
              message: "Tu cuenta necesita completar la verificación.",
              actionText: "Actualizar Información",
              actionLink: "/RegistrarVehiculo",
            };

          setModalInfo({
            type: verificationStatus === "PENDIENTE" ? "info" : "warning",
            ...statusInfo,
          });
          setShowInfoModal(true);
          return;
        }

        // Validar vehículo
        try {
          const vehicleCheck = await getMyVehicle();

          if (!vehicleCheck.success || !vehicleCheck.vehicle) {
            setModalInfo({
              type: "error",
              title: "🚗 Vehículo no encontrado",
              message:
                "Necesitas registrar un vehículo antes de publicar viajes.",
              actionText: "Registrar Vehículo",
              actionLink: "/RegistrarVehiculo",
            });
            setShowInfoModal(true);
            return;
          }

          const vehicleStatus = vehicleCheck.vehicle.status || "pendiente";
          if (vehicleStatus !== "activo" && vehicleStatus !== "pendiente") {
            const vehicleStatusMessages = {
              "pendiente": {
                title: "⏳ Vehículo en verificación",
                message:
                  "Los documentos de tu vehículo están siendo revisados.",
                actionText: "Editar Documentos",
                actionLink: "/RegistrarVehiculo",
              },
              "rechazado": {
                title: "❌ Vehículo no aprobado",
                message:
                  "Los documentos de tu vehículo necesitan correcciones.",
                actionText: "Corregir Documentos",
                actionLink: "/RegistrarVehiculo",
              },
              "inactivo": {
                title: "🔒 Vehículo inactivo",
                message: "Tu vehículo necesita actualización de documentos.",
                actionText: "Reactivar Vehículo",
                actionLink: "/RegistrarVehiculo",
              },
            };

            const vehicleStatusInfo =
              vehicleStatusMessages[
                vehicleStatus as keyof typeof vehicleStatusMessages
              ] || {
                title: "⚠️ Estado del vehículo",
                message: "Tu vehículo requiere atención.",
                actionText: "Revisar Vehículo",
                actionLink: "/RegistrarVehiculo",
              };

            setModalInfo({
              type: vehicleStatus === "pendiente" ? "info" : "warning",
              ...vehicleStatusInfo,
            });
            setShowInfoModal(true);
            return;
          }
        } catch (vehicleError) {
          console.error("Error verificando vehículo:", vehicleError);
          setModalInfo({
            type: "error",
            title: "🚗 Error al verificar vehículo",
            message: "No se pudo verificar el estado de tu vehículo.",
            actionText: "Registrar Vehículo",
            actionLink: "/RegistrarVehiculo",
          });
          setShowInfoModal(true);
          return;
        }

        // Actualizar paso actual basado en las selecciones
        if (selectedAddress && selectedDestination) {
          setCurrentStep(2); // Listo para calcular ruta
        } else if (selectedAddress) {
          setCurrentStep(1); // Solo origen seleccionado
        }
      } catch (error) {
        console.error("Error validando acceso:", error);
        setError("Error validando datos del usuario");
      }
    };

    validateUserAccess();
  }, [navigate, selectedAddress, selectedDestination]);

  // 🚀 Función optimizada para calcular rutas
  const calculateRouteWithDirections = useCallback(async () => {
    const generateUniqueId = (): number => {
      return Math.floor(Math.random() * 1000000);
    };

    if (!selectedAddress || !selectedDestination) {
      setError("Se requieren ambas direcciones");
      return;
    }

    if (!isLoaded || loadError) {
      setError("Google Maps no está disponible. Por favor, reinicia la app.");
      return;
    }

    setIsLoading(true);
    setIsCalculatingRoute(true);
    setError(null);

    try {
      const routeInfo = await calculateRouteInfo(
        selectedAddress,
        selectedDestination,
        "driving",
      );

      if (!routeInfo) {
        throw new Error("No se pudieron calcular las rutas");
      }

      const originLocation: TripLocation = {
        location_id: generateUniqueId(),
        placeId: `origin_${Date.now()}`,
        address: selectedAddress,
        coords: { lat: 0, lng: 0 },
        mainText: selectedAddress.split(",")[0] || selectedAddress,
        secondaryText: selectedAddress,
      };

      const destinationLocation: TripLocation = {
        location_id: generateUniqueId(),
        placeId: `destination_${Date.now()}`,
        address: selectedDestination,
        coords: { lat: 0, lng: 0 },
        mainText: selectedDestination.split(",")[0] || selectedDestination,
        secondaryText: selectedDestination,
      };

      tripStore.setOrigin(originLocation);
      tripStore.setDestination(destinationLocation);

      const processedRoutes: TripRoute[] = [{
        route_id: generateUniqueId(),
        index: 0,
        distance: routeInfo.distance.text,
        duration: routeInfo.duration.text,
        summary: "Ruta optimizada",
        startAddress: routeInfo.startAddress,
        endAddress: routeInfo.endAddress,
        bounds: routeInfo.bounds || null,
        polyline: routeInfo.polyline || "",
        warnings: [],
      }];

      setDirections({ routes: processedRoutes, status: "OK" });
      setRoutes(processedRoutes);
      setSelectedRouteIndex(0);
      setCurrentStep(3); // Ruta calculada

      if (processedRoutes.length > 0) {
        tripStore.setRoutes(processedRoutes, processedRoutes[0]);
      }

      setShowRouteMap(true);

      notifications.show({
        title: "✅ Ruta calculada",
        message: "Se han encontrado rutas disponibles",
        color: "green",
      });
    } catch (error) {
      console.error("Error calculando ruta:", error);
      setError("Error al calcular la ruta. Intenta nuevamente.");
      notifications.show({
        title: "❌ Error",
        message: "No se pudo calcular la ruta",
        color: "red",
      });
    } finally {
      setIsLoading(false);
      setIsCalculatingRoute(false);
    }
  }, [
    selectedAddress,
    selectedDestination,
    isLoaded,
    loadError,
    calculateRouteInfo,
  ]);

  // 🚀 Función optimizada para recalcular rutas
  const recalculateRoutes = useCallback(async () => {
    if (!directions || !selectedAddress || !selectedDestination) return;

    notifications.show({
      title: "Recalculando rutas",
      message: "Aplicando nuevas preferencias...",
      color: "blue",
      autoClose: 2000,
    });

    try {
      const routeInfo = await calculateRouteInfo(
        selectedAddress,
        selectedDestination,
        "driving",
      );

      if (!routeInfo) {
        throw new Error("No se pudieron calcular las rutas");
      }

      const generateUniqueId = (): number => {
        return Math.floor(Math.random() * 1000000);
      };

      const processedRoutes: TripRoute[] = [{
        route_id: generateUniqueId(),
        index: 0,
        distance: routeInfo.distance.text,
        duration: routeInfo.duration.text,
        summary: "Ruta optimizada",
        startAddress: routeInfo.startAddress,
        endAddress: routeInfo.endAddress,
        bounds: routeInfo.bounds || null,
        polyline: routeInfo.polyline || "",
        warnings: [],
      }];

      setDirections({ routes: processedRoutes, status: "OK" });
      setRoutes(processedRoutes);

      notifications.show({
        title: "Rutas actualizadas",
        message: `Ruta optimizada calculada exitosamente`,
        color: "green",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error recalculando rutas:", error);
      notifications.show({
        title: "Error al recalcular",
        message: "No se pudieron aplicar las preferencias",
        color: "red",
        autoClose: 3000,
      });
    }
  }, [selectedAddress, selectedDestination, directions, calculateRouteInfo]);

  // Efecto para recalcular cuando cambien las preferencias
  useEffect(() => {
    if (directions && showRouteMap) {
      recalculateRoutes();
    }
  }, [
    routePreferences.avoidTolls,
    routePreferences.avoidHighways,
    routePreferences.optimizeFuel,
  ]);

  // Manejador de cambio de preferencias
  const handlePreferenceChange = useCallback(
    (key: keyof RoutePreferences, value: boolean) => {
      setRoutePreferences((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  // 🚀 Manejador optimizado de selección de ruta
  const handleRouteSelect = useCallback((index: number) => {
    if (!directions?.routes[index]) return;
    setSelectedRouteIndex(index);

    if (routes[index]) {
      tripStore.setRoutes(routes, routes[index]);
    }
  }, [directions, routes]);

  // Manejador de confirmación de ruta
  const handleRouteConfirm = useCallback(async () => {
    if (routes[selectedRouteIndex]) {
      const selectedRoute = routes[selectedRouteIndex];

      try {
        const priceCalculation = await calculateSuggestedPrice(
          selectedRoute.distance,
        );

        tripStore.updateData({
          currentStep: "paradas",
          selectedRoute: selectedRoute,
        });

        if (priceCalculation?.suggested_price_per_seat) {
          notifications.show({
            title: "Ruta confirmada",
            message:
              `Precio sugerido: $${priceCalculation.suggested_price_per_seat.toLocaleString()} COP por asiento`,
            color: "green",
            autoClose: 4000,
          });
        }

        navigate({
          to: "/SafePoints",
          search: { routeId: selectedRoute.index.toString() },
        });
      } catch (error) {
        console.error("Error calculando precio:", error);
        tripStore.updateData({
          currentStep: "paradas",
          selectedRoute: selectedRoute,
        });

        navigate({
          to: "/SafePoints",
          search: { routeId: selectedRoute.index.toString() },
        });
      }
    }
  }, [navigate, routes, selectedRouteIndex]);

  // Función de utilidad para preparar datos del viaje
  /* const prepareTripData = useCallback(() => {
    if (!routes[selectedRouteIndex]) return null;

    const selectedRoute = routes[selectedRouteIndex];
    const originData = tripStore.getOrigin();
    const destinationData = tripStore.getDestination();

    if (!originData || !destinationData) return null;

    return {
      origin: {
        address: originData.address,
        latitude: originData.coords.lat.toString(),
        longitude: originData.coords.lng.toString(),
        main_text: originData.mainText,
        place_id: originData.placeId,
        secondary_text: originData.secondaryText,
      },
      destination: {
        address: destinationData.address,
        latitude: destinationData.coords.lat.toString(),
        longitude: destinationData.coords.lng.toString(),
        main_text: destinationData.mainText,
        place_id: destinationData.placeId,
        secondary_text: destinationData.secondaryText,
      },
      route_summary: selectedRoute.summary,
      estimated_duration: selectedRoute.duration,
      estimated_distance: selectedRoute.distance,
    };
  }, [routes, selectedRouteIndex]); */

  // Función para manejar el cierre del modal
  const handleModalClose = () => {
    const criticalCases = [
      "🚗 Acceso solo para conductores",
      "⏳ Verificación en proceso",
      "❌ Verificación rechazada",
      "🔒 Cuenta suspendida",
      "🚗 Vehículo no encontrado",
      "⏳ Vehículo en verificación",
      "❌ Vehículo no aprobado",
      "🔒 Vehículo inactivo",
    ];

    if (!modalInfo || !criticalCases.includes(modalInfo.title)) {
      setShowInfoModal(false);
    } else {
      navigate({ to: "/home" });
    }
  };

  // Limpieza de recursos
  useEffect(() => {
    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, []);

  // Mostrar estado de carga si Google Maps no está disponible
  if (!isLoaded) {
    return (
      <Container fluid className={styles.container}>
        <div style={{ height: "30px" }} />
        <div className={styles.header}>
          <Link to="/home" className={styles.backButton}>
            <ArrowLeft size={24} />
          </Link>
          <Title order={4} className={styles.headerTitle}>Publicar viaje</Title>
        </div>
        <Container size="sm" className={styles.content}>
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <Loader size="lg" />
            <Text size="sm" c="dimmed" mt="md">Cargando Google Maps...</Text>
          </div>
        </Container>
      </Container>
    );
  }

  // Mostrar error si Google Maps falló al cargar
  if (loadError) {
    return (
      <Container fluid className={styles.container}>
        <div style={{ height: "30px" }} />
        <div className={styles.header}>
          <Link to="/home" className={styles.backButton}>
            <ArrowLeft size={24} />
          </Link>
          <Title order={4} className={styles.headerTitle}>Publicar viaje</Title>
        </div>
        <Container size="sm" className={styles.content}>
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <AlertCircle size={48} color="red" />
            <Text size="sm" c="red" mt="md">
              Error al cargar Google Maps. Por favor, reinicia la app.
            </Text>
          </div>
        </Container>
      </Container>
    );
  }

  return (
    <Container fluid className={styles.container}>
      <div className='flex items-center gap-4 p-4'>
        <BackButton to="/home" />
        <Title order={4} className={styles.headerTitle}>Publicar viaje</Title>
      </div>

      <Container size="sm" className='mt-8'>
        <Stepper
          className="w-fit mx-auto"
          orientation="vertical"
          active={currentStep}
          size="sm"
          mb="xl"
        >
          <Stepper.Step
            label="Origen"
            description="Punto de partida"
            icon={<MapPin size={18} />}
          />
          <Stepper.Step
            label="Destino"
            description="Escoge tu destino"
            icon={<MapPin size={18} />}
          />
          <Stepper.Step
            label="Ruta"
            description="Calcula tu ruta"
            icon={<RouteIcon size={18} />}
          />
          <Stepper.Step
            label="Confirmar"
            description="Revisa y publica"
            icon={<CheckCircle size={18} />}
          />
        </Stepper>

        <div className={styles.heroSection}>
          <div className={styles.heroTextContainer}>
            <Title order={2} className={styles.heroTitle}>
              {currentStep === 0 && "¿Desde dónde sales?"}
              {currentStep === 1 && "¿A dónde vas?"}
              {currentStep === 2 && "¿Listo para calcular tu ruta?"}
              {currentStep === 3 && "Ruta calculada ✓"}
            </Title>
            <Text size="md" color="dimmed" className={styles.heroText}>
              {currentStep === 0 &&
                "Selecciona tu punto de partida para comenzar"}
              {currentStep === 1 && "Elige tu destino para continuar"}
              {currentStep === 2 && "Calcula la mejor ruta para tu viaje"}
              {currentStep === 3 && "Revisa y confirma tu ruta seleccionada"}
            </Text>
          </div>
        </div>

        <div className={styles.stepContent}>
          {/* Paso 1: Origen */}
          {(currentStep === 0 || currentStep === 1) && (
            <>
              <div className={styles.searchBox}>
                <MapPin className={styles.searchIcon} size={20} />
                <Link to="/Origen" className={styles.searchLink}>
                  <TextInput
                    placeholder="Escribe la dirección completa"
                    className={styles.input}
                    value={selectedAddress}
                    readOnly
                  />
                </Link>
              </div>
            </>
          )}

          {/* Paso 2: Destino */}
          {(currentStep === 1 || currentStep === 2) && (
            <>
              <Title className={styles.stepTitle}>¿A dónde vas?</Title>
              <div className={styles.searchBox}>
                <MapPin className={styles.searchIcon} size={20} />
                <Link
                  to="/Destino"
                  search={{ originAddress: selectedAddress }}
                  className={styles.searchLink}
                >
                  <TextInput
                    placeholder="Escribe la dirección completa"
                    className={styles.input}
                    value={selectedDestination}
                    readOnly
                  />
                </Link>
              </div>
            </>
          )}

          {error && (
            <Text color="red" size="sm" className={styles.errorText}>
              {error}
            </Text>
          )}

          {/* Botones de acción según el paso actual */}
          <Group grow mt="xl">
            {currentStep === 0 && selectedAddress && (
              <Button
                onClick={() => setCurrentStep(1)}
                className={styles.nextButton}
                rightSection={
                  <ArrowLeft
                    size={16}
                    style={{ transform: "rotate(180deg)" }}
                  />
                }
              >
                Continuar a Destino
              </Button>
            )}

            {currentStep === 1 && selectedDestination && (
              <Button
                onClick={() => setCurrentStep(2)}
                className={styles.nextButton}
                rightSection={
                  <ArrowLeft
                    size={16}
                    style={{ transform: "rotate(180deg)" }}
                  />
                }
              >
                Continuar a Ruta
              </Button>
            )}

            {currentStep === 2 && selectedAddress && selectedDestination && (
              <Button
                onClick={calculateRouteWithDirections}
                className={styles.nextButton}
                loading={isLoading}
                leftSection={<Navigation size={20} />}
                rightSection={<Sparkles size={16} />}
              >
                {isLoading ? "Calculando ruta..." : "Calcular Ruta"}
              </Button>
            )}

            {currentStep === 3 && (
              <Button
                onClick={() => setShowRouteMap(true)}
                className={styles.nextButton}
                leftSection={<RouteIcon size={20} />}
                variant="light"
              >
                Ver Ruta en Mapa
              </Button>
            )}
          </Group>
        </div>

        {/* Modal de ruta */}
        <Modal
          opened={showRouteMap}
          onClose={() => setShowRouteMap(false)}
          fullScreen
          classNames={{
            root: styles.routeModal,
            body: styles.routeModalBody,
          }}
        >
          <div className={styles.routeContent}>
            <div className={styles.mapControls}>
              <div className={styles.mapOptions}>
                <div className={styles.mapOptionsLeft}>
                  <div>
                    <Text className={styles.mapTitle}>Selecciona tu ruta</Text>
                    <Text className={styles.mapSubtitle}>
                      {selectedAddress} → {selectedDestination}
                    </Text>
                  </div>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <Popover width={300} position="bottom" shadow="md">
                    <Popover.Target>
                      <div style={{ position: "relative" }}>
                        <ActionIcon
                          variant="light"
                          color={Object.values(routePreferences).some((v) => v)
                            ? "green"
                            : "gray"}
                          size="lg"
                        >
                          <Settings size={20} />
                        </ActionIcon>
                        {Object.values(routePreferences).some((v) => v) && (
                          <div className={styles.activePreferenceIndicator}>
                            <Sparkles size={10} />
                          </div>
                        )}
                      </div>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <Stack gap="xs">
                        <Text fw={500}>Preferencias de ruta</Text>
                        <div className={styles.preference}>
                          <Switch
                            label="Evitar peajes"
                            checked={routePreferences.avoidTolls}
                            onChange={(e) =>
                              handlePreferenceChange(
                                "avoidTolls",
                                e.currentTarget.checked,
                              )}
                            color="green"
                            size="md"
                          />
                          <DollarSign
                            size={16}
                            className={styles.preferenceIcon}
                          />
                        </div>
                        <div className={styles.preference}>
                          <Switch
                            label="Evitar autopistas"
                            checked={routePreferences.avoidHighways}
                            onChange={(e) =>
                              handlePreferenceChange(
                                "avoidHighways",
                                e.currentTarget.checked,
                              )}
                            color="green"
                            size="md"
                          />
                          <Car size={16} className={styles.preferenceIcon} />
                        </div>
                        <div className={styles.preference}>
                          <Switch
                            label="Optimizar consumo"
                            checked={routePreferences.optimizeFuel}
                            onChange={(e) =>
                              handlePreferenceChange(
                                "optimizeFuel",
                                e.currentTarget.checked,
                              )}
                            color="green"
                            size="md"
                          />
                          <Trees size={16} className={styles.preferenceIcon} />
                        </div>
                      </Stack>
                    </Popover.Dropdown>
                  </Popover>
                  <ActionIcon
                    className={styles.closeButton}
                    onClick={() => setShowRouteMap(false)}
                    size="lg"
                  >
                    <X size={20} />
                  </ActionIcon>
                </div>
              </div>
            </div>

            {/* Layout horizontal - Mapa y rutas lado a lado */}
            <div className={styles.mainLayout}>
              <div className={styles.mapSection}>
                {isCalculatingRoute && (
                  <div className={styles.mapLoading}>
                    <Loader color="#00ff9d" size="lg" />
                    <Text mt="md" fw={500} color="dimmed">
                      Calculando las mejores rutas...
                    </Text>
                  </div>
                )}

                {/* <ConditionalMap
                  center={{ lat: 3.4516, lng: -76.5320 }}
                  zoom={13}
                  height="100%"
                  width="100%"
                  triggerLoad={showRouteMap}
                  loadButtonText="Ver ruta en el mapa"
                  optimizedRoute={routes[selectedRouteIndex]
                    ? {
                      polyline: routes[selectedRouteIndex].polyline,
                      startAddress: routes[selectedRouteIndex].startAddress,
                      endAddress: routes[selectedRouteIndex].endAddress,
                      distance: routes[selectedRouteIndex].distance,
                      duration: routes[selectedRouteIndex].duration,
                    }
                    : undefined}
                  showTraffic={false}
                /> */}

                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  options={{
                    gestureHandling: "greedy",
                    zoomControl: true,
                    streetViewControl: false,
                    fullscreenControl: false,
                    mapTypeControl: false
                  }}
                  center={{ lat: 3.4516, lng: -76.5320 }}
                  zoom={13}
                  onClick={() => {}}
                  onLoad={(map: google.maps.Map) => {
                    mapRef.current = map;
                  }}
                />
              </div>

              <div className={styles.routesSection}>
                <div className={styles.routesList}>
                  <div className={styles.routesSectionHeader}>
                    <Text className={styles.routesTitle}>
                      Rutas disponibles
                    </Text>
                    <Badge variant="light" color="green" size="sm">
                      {routes.length} opciones
                    </Badge>
                  </div>

                  {routes.length > 0 && (
                    <Button
                      className={styles.selectRouteButton}
                      onClick={handleRouteConfirm}
                      size="lg"
                      leftSection={<CheckCircle size={18} />}
                      loading={isLoading}
                      fullWidth
                    >
                      Confirmar Ruta {selectedRouteIndex + 1} •{" "}
                      {routes[selectedRouteIndex]?.duration}
                    </Button>
                  )}

                  <div className={styles.routesListContent}>
                    {routes.map((route, index) => (
                      <div
                        key={route.index}
                        className={`${styles.routeOption} ${
                          route.index === selectedRouteIndex
                            ? styles.routeOptionSelected
                            : ""
                        }`}
                        onClick={() => handleRouteSelect(route.index)}
                      >
                        <div className={styles.routeHeader}>
                          <div className={styles.routeNumber}>
                            <Text size="xs" fw={600}>{index + 1}</Text>
                          </div>
                          <div className={styles.routeMainInfo}>
                            <div className={styles.routeTime}>
                              <Clock size={16} />
                              <Text size="xs" fw={600}>{route.duration}</Text>
                            </div>
                            <div className={styles.routeDistance}>
                              <Navigation size={16} />
                              <Text size="xs" fw={600}>{route.distance}</Text>
                            </div>
                          </div>
                          {route.index === selectedRouteIndex && (
                            <CheckCircle
                              size={20}
                              className={styles.routeSelectedIcon}
                            />
                          )}
                        </div>
                        <Text
                          size="sm"
                          color="dimmed"
                          className={styles.routeSummary}
                        >
                          Vía {route.summary}
                        </Text>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>

        {/* Modal de información/errores */}
        <Modal
          opened={showInfoModal}
          onClose={handleModalClose}
          centered
          size="md"
          withCloseButton={true}
          closeOnClickOutside={true}
          closeOnEscape={true}
        >
          {modalInfo && (
            <Stack gap="lg" align="center">
              <div style={{ textAlign: "center" }}>
                <Title
                  order={3}
                  style={{
                    color: modalInfo.type === "success"
                      ? "#51cf66"
                      : modalInfo.type === "warning"
                      ? "#ffd43b"
                      : modalInfo.type === "error"
                      ? "#ff6b6b"
                      : "#74c0fc",
                    marginBottom: "0.5rem",
                  }}
                >
                  {modalInfo.title}
                </Title>
                <Text size="lg" c="dimmed" ta="center">
                  {modalInfo.message}
                </Text>
              </div>

              {modalInfo.details && (
                <div style={{ width: "100%" }}>
                  <Stack gap="xs">
                    {modalInfo.details.map((detail, index) => (
                      <Text key={index} size="sm" c="dimmed">
                        • {detail}
                      </Text>
                    ))}
                  </Stack>
                </div>
              )}

              <div style={{ display: "flex", gap: "1rem", width: "100%" }}>
                <Button
                  variant="light"
                  color="gray"
                  onClick={handleModalClose}
                  style={{ flex: 1 }}
                >
                  Cerrar
                </Button>

                {modalInfo.actionText && modalInfo.actionLink && (
                  <Button
                    variant="filled"
                    color={modalInfo.type === "success"
                      ? "green"
                      : modalInfo.type === "warning"
                      ? "yellow"
                      : modalInfo.type === "error"
                      ? "red"
                      : "blue"}
                    component={Link}
                    to={modalInfo.actionLink}
                    onClick={() => setShowInfoModal(false)}
                    style={{ flex: 1 }}
                  >
                    {modalInfo.actionText}
                  </Button>
                )}
              </div>
            </Stack>
          )}
        </Modal>
      </Container>
    </Container>
  );
}

export default ReservarView;
