import { useState, useRef, useCallback, useEffect } from 'react';
import { createFileRoute, Link, useSearch, useNavigate } from '@tanstack/react-router';
import {
  Container,
  Title,
  TextInput,
  Button,
  Text,
  Modal,
  Stack,
  Badge,
  Loader,
  ActionIcon,
  Popover,
  Switch
} from '@mantine/core';
import { 
  MapPin, 
  ArrowLeft, 
  Clock, 
  Navigation, 
  Car,
  DollarSign,
  Settings,
  Trees,
  CheckCircle,
  AlertCircle,
  Sparkles,
  X
} from 'lucide-react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { 
  mapOptions, 
  tripStore,
  type TripRoute,
  type TripLocation,
  errorMessages
} from '../../types/PublicarViaje/TripDataManagement';
import { calculateSuggestedPrice } from '@/services/config';
import { publishTrip } from '@/services/viajes';
import { getMyVehicle } from '@/services/vehicles';
import { useTripDraft } from '@/hooks/useTripDraft';
import styles from './index.module.css';
import { notifications } from '@mantine/notifications';
import { getCurrentUser } from '@/services/auth';
import { getCurrentUserProfile } from '@/services/profile';
import { useMaps } from '@/components/GoogleMapsProvider'; 


interface RoutePreferences {
  avoidTolls: boolean;
  avoidHighways: boolean;
  optimizeFuel: boolean;
}

interface SearchParams {
  selectedAddress?: string;
  selectedDestination?: string;
}

export const Route = createFileRoute('/publicarviaje/')({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    selectedAddress: search.selectedAddress as string | undefined,
    selectedDestination: search.selectedDestination as string | undefined,
  }),
  component: ReservarView,
});

function ReservarView(){
  const navigate = useNavigate();
  const { selectedAddress = '', selectedDestination = '' } = useSearch({ from: '/publicarviaje/' });
  const { isLoaded, loadError } = useMaps();
  
  // Hook para manejar borradores
  const { 
    hasDraft,
    safePointSelections,
    stopovers,
    clearTripDraft
  } = useTripDraft();
  
  // Estados base
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [routes, setRoutes] = useState<TripRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para modal de información
  // Función para determinar si el modal se puede cerrar
  const canCloseModal = () => {
    if (!modalInfo) return true;
    
    // Casos críticos que NO permiten cerrar el modal (requieren acción)
    const criticalCases = [
      '🚗 Acceso solo para conductores',
      '⏳ Verificación en proceso', 
      '❌ Verificación rechazada',
      '🔒 Cuenta bloqueada',
      '🚗 Vehículo no encontrado',
      '⏳ Vehículo en verificación',
      '❌ Vehículo no aprobado', 
      '🔒 Vehículo inactivo',
      '⚠️ Estado de verificación',
      '⚠️ Estado del vehículo'
    ];
    
    return !criticalCases.includes(modalInfo.title);
  };

  // Función para manejar el cierre del modal
  const handleModalClose = () => {
    if (canCloseModal()) {
      setShowInfoModal(false);
    } else {
      // Para casos críticos, redirigir al home en lugar de cerrar
      navigate({ to: '/home' });
    }
  };

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [modalInfo, setModalInfo] = useState<{
    type: 'error' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    actionText?: string;
    actionLink?: string;
    details?: string[];
  } | null>(null);
  
useEffect(() => {
  const validateUserAccess = async () => {
    try {
      const user = await getCurrentUser();
      
      if (!user.success || !user.user) {
        console.log('❌ Usuario no autenticado, redirigiendo...');
        navigate({ to: '/Login' });
        return;
      }

      console.log('✅ Usuario autenticado:', user.user.id);
      
      // Validar que exista el perfil del usuario
      const profile = await getCurrentUserProfile();
      
      if (!profile.success || !profile.data) {
        setModalInfo({
          type: 'warning',
          title: '⚠️ Perfil incompleto',
          message: 'Necesitas completar tu perfil antes de publicar viajes.',
          actionText: 'Completar Perfil',
          actionLink: '/perfil',
          details: [
            'Para publicar viajes necesitas tener un perfil completo',
            'Esto incluye foto, información personal y documentos',
            'Es un requisito de seguridad para todos los conductores'
          ]
        });
        setShowInfoModal(true);
        return;
      }

      console.log('✅ Perfil del usuario verificado');
      console.log('🔍 DEBUGGING - Raw profile data:', profile.data);
      console.log('🔍 DEBUGGING - Profile data keys:', Object.keys(profile.data));

      // ⚠️ VALIDACIÓN CRÍTICA: Verificar que el usuario sea DRIVER
      const userType = profile.data.status; // El backend envía el tipo de usuario en 'status'
      console.log('🔍 Verificando tipo de usuario:', userType);
      console.log('🔍 DEBUGGING - user_type field:', profile.data.user_type);
      console.log('🔍 DEBUGGING - status field:', profile.data.status);
      
      if (userType !== 'DRIVER') {
        console.log('❌ BLOCKING: User is not DRIVER, showing modal');
        setModalInfo({
          type: 'error',
          title: '🚗 Acceso solo para conductores',
          message: 'Solo los conductores registrados pueden publicar viajes.',
          actionText: 'Registrarse como Conductor',
          actionLink: '/RegistrarVehiculo',
          details: [
            'Para publicar viajes necesitas ser un conductor verificado',
            'Debes registrar tu vehículo y documentos',
            'El proceso incluye verificación de documentos',
            'Una vez aprobado podrás publicar viajes'
          ]
        });
        setShowInfoModal(true);
        return;
      }

      // ⚠️ VALIDACIÓN CRÍTICA: Verificar que el conductor esté VERIFICADO
      // Buscar el estado de verificación en el campo adecuado
      const verificationStatus = profile.data.verification || (profile.data as any).Verification || 'PENDIENTE';
      console.log('🔍 Verificando estado de verificación:', verificationStatus);
      console.log('🔍 DEBUGGING - verification field:', profile.data.verification);
      console.log('🔍 DEBUGGING - Verification field:', (profile.data as any).Verification);
      console.log('🔍 DEBUGGING - status field (user type):', profile.data.status);
      
      if (verificationStatus !== 'VERIFICADO' && verificationStatus !== 'APPROVED') {
        console.log('❌ BLOCKING: User verification status not valid, showing modal');
        console.log('🔍 DEBUGGING - Expected: VERIFICADO or APPROVED');
        console.log('🔍 DEBUGGING - Actual:', verificationStatus);
        
        const statusMessages = {
          'PENDIENTE': {
            title: '⏳ Verificación en proceso',
            message: 'Tu cuenta de conductor está siendo verificada.',
            details: [
              'Tus documentos están siendo revisados por nuestro equipo',
              'Este proceso puede tomar entre 24-48 horas',
              'Te notificaremos cuando la verificación esté completa',
              'Puedes completar o actualizar tu información mientras esperas'
            ]
          },
          'RECHAZADO': {
            title: '❌ Verificación rechazada',
            message: 'Tu documentación no fue aprobada.',
            details: [
              'Los documentos presentados no cumplen con los requisitos',
              'Verifica que todos los documentos estén vigentes y legibles',
              'Puedes actualizar y volver a subir los documentos corregidos',
              'Asegúrate de que las fotos sean claras y completas'
            ]
          },
          'BLOQUEADO': {
            title: '🔒 Cuenta bloqueada',
            message: 'Tu cuenta de conductor ha sido suspendida.',
            details: [
              'Tu cuenta fue suspendida por motivos de seguridad',
              'Puedes revisar y actualizar tu información en el módulo de registro',
              'Asegúrate de que todos tus documentos estén vigentes',
              'Una vez actualizada la información, podrás solicitar revisión'
            ]
          }
        };

        const statusInfo = statusMessages[verificationStatus as keyof typeof statusMessages] || {
          title: '⚠️ Estado de verificación',
          message: 'Tu cuenta necesita verificación para publicar viajes.',
          details: [
            'Tu estado de verificación es: ' + verificationStatus,
            'Puedes revisar y actualizar tu información de conductor',
            'Asegúrate de que todos los documentos estén completos y vigentes'
          ]
        };
        
        setModalInfo({
          type: 'warning',
          title: statusInfo.title,
          message: statusInfo.message,
          actionText: 'Revisar Documentos',
          actionLink: '/RegistrarVehiculo',
          details: statusInfo.details
        });
        setShowInfoModal(true);
        return;
      }

      console.log('✅ Usuario verificado como conductor - continuando validaciones...');

      // Validar que tenga un vehículo registrado y activo
      try {
        const vehicleCheck = await getMyVehicle();
        
        if (!vehicleCheck.success || !vehicleCheck.vehicle) {
          setModalInfo({
            type: 'error',
            title: '🚗 Vehículo no encontrado',
            message: 'Necesitas registrar un vehículo antes de publicar viajes.',
            actionText: 'Registrar Vehículo',
            actionLink: '/RegistrarVehiculo',
            details: [
              'Para publicar viajes necesitas tener un vehículo registrado',
              'El proceso de registro incluye documentos del vehículo',
              'También necesitarás SOAT, licencia y tarjeta de propiedad',
              'El registro es rápido y solo se hace una vez'
            ]
          });
          setShowInfoModal(true);
          return;
        }

        // Verificar estado del vehículo
        const vehicleStatus = vehicleCheck.vehicle.status || 'pendiente';
        console.log('🔍 Verificando estado del vehículo:', vehicleStatus);
        
        // Permitir vehículos activos y pendientes (ya que el usuario está verificado)
        if (vehicleStatus !== 'activo' && vehicleStatus !== 'pendiente') {
          const vehicleStatusMessages = {
            'pendiente': {
              title: '⏳ Vehículo en verificación',
              message: 'Tu vehículo está siendo verificado por nuestro equipo.',
              details: [
                'Los documentos de tu vehículo están en proceso de verificación',
                'Este proceso puede tomar entre 24-48 horas',
                'Te notificaremos cuando esté aprobado',
                'Puedes revisar que todos los documentos estén completos y legibles'
              ]
            },
            'rechazado': {
              title: '❌ Vehículo no aprobado',
              message: 'Tu vehículo no cumple con los requisitos necesarios.',
              details: [
                'Los documentos presentados no fueron aprobados',
                'Verifica que todos los documentos estén vigentes',
                'Las fotos deben ser claras y legibles',
                'Puedes actualizar los documentos en el módulo de registro'
              ]
            },
            'inactivo': {
              title: '🔒 Vehículo inactivo',
              message: 'Tu vehículo ha sido desactivado temporalmente.',
              details: [
                'Tu vehículo fue desactivado por motivos administrativos',
                'Puede ser por documentos vencidos o problemas de verificación',
                'Puedes actualizar la información y documentos',
                'Revisa si algún documento necesita renovación'
              ]
            }
          };

          const vehicleStatusInfo = vehicleStatusMessages[vehicleStatus as keyof typeof vehicleStatusMessages] || {
            title: '⚠️ Estado del vehículo',
            message: 'Tu vehículo no está disponible para publicar viajes.',
            details: ['Puedes revisar y actualizar la información de tu vehículo']
          };

          setModalInfo({
            type: 'warning',
            title: vehicleStatusInfo.title,
            message: vehicleStatusInfo.message,
            actionText: 'Actualizar Vehículo',
            actionLink: '/RegistrarVehiculo',
            details: vehicleStatusInfo.details
          });
          setShowInfoModal(true);
          return;
        }

        console.log('✅ Vehículo verificado - estado:', vehicleStatus, '(permitido para usuarios verificados)');
      } catch (vehicleError) {
        console.error('❌ Error verificando vehículo:', vehicleError);
        setModalInfo({
          type: 'error',
          title: '🚗 Error al verificar vehículo',
          message: 'No se pudo verificar el estado de tu vehículo.',
          actionText: 'Registrar Vehículo',
          actionLink: '/RegistrarVehiculo',
          details: [
            'Hubo un error al verificar tu vehículo',
            'Asegúrate de tener un vehículo registrado',
            'Si ya tienes uno registrado, intenta nuevamente',
            'Contacta soporte si el problema persiste'
          ]
        });
        setShowInfoModal(true);
        return;
      }
      
      // Validar que haya seleccionado origen y destino
      const tripData = tripStore.getStoredData();
      if (!tripData?.origin || !tripData?.destination) {
        setModalInfo({
          type: 'error',
          title: '📍 Ubicaciones faltantes',
          message: 'Debes seleccionar origen y destino antes de publicar.',
          actionText: 'Seleccionar Ubicaciones',
          actionLink: '/ubicaciones',
          details: [
            'El origen y destino son obligatorios para publicar un viaje',
            'Estas ubicaciones se mostrarán a los pasajeros',
            'Puedes cambiarlas en cualquier momento antes de publicar'
          ]
        });
        setShowInfoModal(true);
        return;
      }

      console.log('✅ Datos de viaje verificados:', tripData);

    } catch (error) {
      console.error('❌ Error validando acceso:', error);
      setError('Error validando datos del usuario');
    }
  };

  validateUserAccess();
}, [navigate]);


  // Estados de preferencias
  const [routePreferences, setRoutePreferences] = useState<RoutePreferences>({
    avoidTolls: false,
    avoidHighways: false,
    optimizeFuel: false
  });

  // Función para recalcular rutas cuando cambien las preferencias
  const recalculateRoutes = useCallback(async () => {
    if (!directions || !selectedAddress || !selectedDestination) return;
    
    console.log('Recalculando rutas con preferencias:', routePreferences);
    
    // Mostrar notificación de recálculo
    notifications.show({
      title: 'Recalculando rutas',
      message: 'Aplicando nuevas preferencias...',
      color: 'blue',
      autoClose: 2000,
    });
    
    try {
      const directionsService = new google.maps.DirectionsService();
      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route({
          origin: selectedAddress,
          destination: selectedDestination,
          travelMode: google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: true,
          optimizeWaypoints: true,
          avoidTolls: routePreferences.avoidTolls,
          avoidHighways: routePreferences.avoidHighways,
        }, (response, status) => {
          if (status === google.maps.DirectionsStatus.OK && response) {
            resolve(response);
          } else {
            reject(new Error('Error al recalcular rutas'));
          }
        });
      });

      const generateUniqueId = (): number => {
        return Math.floor(Math.random() * 1000000);
      };

      const processedRoutes: TripRoute[] = result.routes.map((route, index) => ({
        route_id: generateUniqueId(),
        index,
        distance: route.legs[0].distance?.text || '',
        duration: route.legs[0].duration?.text || '',
        summary: route.summary || '',
        startAddress: route.legs[0].start_address,
        endAddress: route.legs[0].end_address,
        bounds: route.bounds,
        polyline: route.overview_polyline,
        warnings: route.warnings || []
      }));

      setDirections(result);
      setRoutes(processedRoutes);
      setSelectedRouteIndex(0);

      if (processedRoutes.length > 0) {
        tripStore.setRoutes(processedRoutes, processedRoutes[0]);
      }

      // Mostrar notificación de éxito
      notifications.show({
        title: 'Rutas actualizadas',
        message: `Se encontraron ${processedRoutes.length} rutas con las nuevas preferencias`,
        color: 'green',
        autoClose: 3000,
      });

    } catch (error) {
      console.error('Error recalculando rutas:', error);
      notifications.show({
        title: 'Error al recalcular',
        message: 'No se pudieron aplicar las preferencias',
        color: 'red',
        autoClose: 3000,
      });
    }
  }, [selectedAddress, selectedDestination, routePreferences, directions]);

  // Efecto para recalcular cuando cambien las preferencias
  useEffect(() => {
    if (directions && showRouteMap) {
      recalculateRoutes();
    }
  }, [routePreferences.avoidTolls, routePreferences.avoidHighways, routePreferences.optimizeFuel]);

  // Manejador de cambio de preferencias
  const handlePreferenceChange = useCallback((key: keyof RoutePreferences, value: boolean) => {
    setRoutePreferences(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Referencias
  const mapRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  // Función para calcular rutas con manejo de marcadores
  const calculateRouteWithDirections = useCallback(async () => {
      
    const generateUniqueId = (): number => {
      return Math.floor(Math.random() * 1000000);
    };

    if (!selectedAddress || !selectedDestination) {
      setError('Se requieren ambas direcciones');
      return;
    }

    // Verificar si Google Maps está disponible
    if (!isLoaded || loadError) {
      setError('Google Maps no está disponible. Por favor, recarga la página.');
      return;
    }

    setIsLoading(true);
    setIsCalculatingRoute(true);
    setError(null);

    try {
      const geocoder = new google.maps.Geocoder();
      const [originResult, destResult] = await Promise.all([
        geocoder.geocode({ address: selectedAddress }),
        geocoder.geocode({ address: selectedDestination })
      ]);

      const origin = originResult.results[0];
      const destination = destResult.results[0];

      if (!origin?.geometry?.location || !destination?.geometry?.location) {
        throw new Error('No se pudieron encontrar las direcciones');
      }

      const originLocation: TripLocation = {
        location_id: generateUniqueId(), // ID unico generado
        placeId: origin.place_id,
        address: selectedAddress,
        coords: {
          lat: origin.geometry.location.lat(),
          lng: origin.geometry.location.lng()
        },
        mainText: origin.address_components[0].long_name,
        secondaryText: origin.formatted_address
      };

      const destinationLocation: TripLocation = {
        location_id: generateUniqueId(), // ID unico generado
        placeId: destination.place_id,
        address: selectedDestination,
        coords: {
          lat: destination.geometry.location.lat(),
          lng: destination.geometry.location.lng()
        },
        mainText: destination.address_components[0].long_name,
        secondaryText: destination.formatted_address
      };
// Coordenadas del origen y destino (ya no se usan para marcadores manuales)

      // Actualizar almacenamiento de ubicaciones
      tripStore.setOrigin(originLocation);
      tripStore.setDestination(destinationLocation);

      // Calcular rutas con opciones
      const directionsService = new google.maps.DirectionsService();
      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route({
          origin: originLocation.coords,
          destination: destinationLocation.coords,
          travelMode: google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: true,
          optimizeWaypoints: true,
          avoidTolls: routePreferences.avoidTolls,
          avoidHighways: routePreferences.avoidHighways,
        }, (response, status) => {
          if (status === google.maps.DirectionsStatus.OK && response) {
            if (response.routes.length > 0) {
              const bounds = new google.maps.LatLngBounds();
              response.routes[0].legs[0].steps.forEach((step) => {
                bounds.extend(step.start_location);
                bounds.extend(step.end_location);
              });
              if (mapRef.current) {
                mapRef.current.fitBounds(bounds, 50); // Padding en píxeles
              }
              
              resolve(response);
            } else {
              reject(new Error('No se encontraron rutas'));
            }
          } else {
            reject(new Error(errorMessages.ROUTE_CALCULATION_ERROR));
          }
        });
      });
    
        const processedRoutes: TripRoute[] = result.routes.map((route, index) => ({
        route_id: generateUniqueId(),  // Agregar el route_id generado
        index,
        distance: route.legs[0].distance?.text || '',
        duration: route.legs[0].duration?.text || '',
        summary: route.summary || '',
        startAddress: route.legs[0].start_address,
        endAddress: route.legs[0].end_address,
        bounds: route.bounds,
        polyline: route.overview_polyline,
        warnings: route.warnings || []
      }));

      setDirections(result);
      setRoutes(processedRoutes);
      setSelectedRouteIndex(0);

      if (processedRoutes.length > 0) {
        tripStore.setRoutes(processedRoutes, processedRoutes[0]);
      }

      setShowRouteMap(true);

    } catch (err) {
      console.error('Error:', err);
      setError(errorMessages.ROUTE_CALCULATION_ERROR);
    } finally {
      setIsLoading(false);
      setIsCalculatingRoute(false);
    }
  }, [selectedAddress, selectedDestination, routePreferences]);

  // Limpieza de recursos al desmontar el componente
  useEffect(() => {
    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, []);

  // Manejador de selección de ruta
  const handleRouteSelect = useCallback((index: number) => {
    if (!directions?.routes[index]) return;
    setSelectedRouteIndex(index);
    
    // El DirectionsRenderer componente se actualizará automáticamente
    // Solo necesitamos ajustar la vista del mapa
    if (mapInstance && directions.routes[index]?.bounds) {
      mapInstance.fitBounds(directions.routes[index].bounds, {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      });
      setTimeout(() => {
        const zoom = mapInstance.getZoom();
        if (zoom && zoom > 16) {
          mapInstance.setZoom(Math.min(zoom - 0.5, 16));
        }
      }, 200);
    }
    
    if (routes[index]) {
      tripStore.setRoutes(routes, routes[index]);
    }
  }, [directions, routes, mapInstance]);

  // Manejador de confirmación
  const handleRouteConfirm = useCallback(async () => {
    if (routes[selectedRouteIndex]) {
      const selectedRoute = routes[selectedRouteIndex];
      
      try {
        // Calcular precio sugerido basado en la distancia de la ruta
        const priceCalculation = await calculateSuggestedPrice(selectedRoute.distance);

        // Actualizar el store con la ruta seleccionada
        tripStore.updateData({
          currentStep: 'paradas',
          selectedRoute: selectedRoute
        });

        // Mostrar información del precio calculado si está disponible
        if (priceCalculation?.suggested_price_per_seat) {
          notifications.show({
            title: 'Ruta confirmada',
            message: `Precio sugerido: $${priceCalculation.suggested_price_per_seat.toLocaleString()} COP por asiento`,
            color: 'green',
            autoClose: 4000,
          });
        } else {
          notifications.show({
            title: 'Ruta confirmada',
            message: 'Procediendo a configurar las paradas del viaje',
            color: 'green',
            autoClose: 2000,
          });
        }

        navigate({ 
          to: '/SafePoints',
          search: {
            routeId: selectedRoute.index.toString()
          }
        });
      } catch (error) {
        console.error('Error calculando precio:', error);
        // Continuar sin precio sugerido
        tripStore.updateData({
          currentStep: 'paradas',
          selectedRoute: selectedRoute
        });
        
        notifications.show({
          title: 'Ruta confirmada',
          message: 'Procediendo a configurar las paradas del viaje',
          color: 'green',
          autoClose: 2000,
        });

        navigate({ 
          to: '/SafePoints',
          search: {
            routeId: selectedRoute.index.toString()
          }
        });
      }
    }
  }, [navigate, routes, selectedRouteIndex]);

  // Función de utilidad para preparar datos del viaje (usada por publishTrip más adelante en el flujo)
  const prepareTripData = useCallback(() => {
    if (!routes[selectedRouteIndex]) return null;

    const selectedRoute = routes[selectedRouteIndex];
    const originData = tripStore.getOrigin();
    const destinationData = tripStore.getDestination();

    if (!originData || !destinationData) return null;

    // Preparar los datos en el formato que espera publishTrip
    const tripData = {
      origin: {
        address: originData.address,
        latitude: originData.coords.lat.toString(),
        longitude: originData.coords.lng.toString(),
        main_text: originData.mainText,
        place_id: originData.placeId,
        secondary_text: originData.secondaryText
      },
      destination: {
        address: destinationData.address,
        latitude: destinationData.coords.lat.toString(),
        longitude: destinationData.coords.lng.toString(),
        main_text: destinationData.mainText,
        place_id: destinationData.placeId,
        secondary_text: destinationData.secondaryText
      },
      route_summary: selectedRoute.summary,
      estimated_duration: selectedRoute.duration,
      estimated_distance: selectedRoute.distance
    };

    return tripData;
  }, [routes, selectedRouteIndex]);

  // Esta función será llamada desde otras páginas del flujo cuando se complete el proceso
  const handlePublishTrip = useCallback(async (additionalData: any) => {
    try {
      // Validar vehículo antes de publicar
      const vehicleCheck = await getMyVehicle();
      
      if (!vehicleCheck.success || !vehicleCheck.vehicle) {
        setModalInfo({
          type: 'error',
          title: '🚗 Vehículo no encontrado',
          message: 'Necesitas registrar un vehículo antes de publicar un viaje.',
          actionText: 'Registrar Vehículo',
          actionLink: '/RegistrarVehiculo',
          details: [
            'Para publicar viajes necesitas tener un vehículo registrado',
            'El proceso de registro es rápido y solo se hace una vez',
            'También necesitarás subir los documentos del vehículo'
          ]
        });
        setShowInfoModal(true);
        return null;
      }

      // Verificar estado del vehículo
      const vehicleStatus = vehicleCheck.vehicle.status || 'pendiente';
      if (vehicleStatus !== 'activo') {
        const statusMessages = {
          'pendiente': {
            title: '⏳ Vehículo en verificación',
            message: 'Tu vehículo está siendo verificado por nuestro equipo.',
            details: [
              'Los documentos de tu vehículo están en proceso de verificación',
              'Este proceso puede tomar entre 24-48 horas',
              'Te notificaremos cuando esté aprobado',
              'Puedes revisar que todos los documentos estén completos y legibles'
            ]
          },
          'rechazado': {
            title: '❌ Vehículo no aprobado',
            message: 'Tu vehículo no cumple con los requisitos necesarios.',
            details: [
              'Los documentos presentados no fueron aprobados',
              'Verifica que todos los documentos estén vigentes',
              'Las fotos deben ser claras y legibles',
              'Puedes actualizar los documentos en el módulo de registro'
            ]
          },
          'inactivo': {
            title: '🔒 Vehículo inactivo',
            message: 'Tu vehículo ha sido desactivado temporalmente.',
            details: [
              'Tu vehículo fue desactivado por motivos administrativos',
              'Puede ser por documentos vencidos o problemas de verificación',
              'Puedes actualizar la información y documentos',
              'Revisa si algún documento necesita renovación'
            ]
          }
        };

        const statusInfo = statusMessages[vehicleStatus as keyof typeof statusMessages] || {
          title: '⚠️ Estado del vehículo',
          message: 'Tu vehículo no está disponible para publicar viajes.',
          details: ['Puedes revisar y actualizar la información de tu vehículo']
        };

        setModalInfo({
          type: 'warning',
          title: statusInfo.title,
          message: statusInfo.message,
          actionText: 'Actualizar Vehículo',
          actionLink: '/RegistrarVehiculo',
          details: statusInfo.details
        });
        setShowInfoModal(true);
        return null;
      }

      // Si llegamos aquí, el vehículo está activo, proceder con la publicación
      const preparedData = prepareTripData();
      if (!preparedData) {
        setModalInfo({
          type: 'error',
          title: '📋 Datos incompletos',
          message: 'Faltan datos necesarios para publicar el viaje.',
          details: [
            'Asegúrate de haber seleccionado origen y destino',
            'La ruta debe estar calculada correctamente',
            'Verifica que todos los campos estén completos'
          ]
        });
        setShowInfoModal(true);
        return null;
      }

      const fullTripData = {
        ...preparedData,
        vehicle_id: vehicleCheck.vehicle.id,
        ...additionalData // Datos adicionales como fecha, asientos, precio, etc.
      };

      // Mostrar loading
      setIsLoading(true);
      notifications.show({
        id: 'publishing-trip',
        title: '🚀 Publicando viaje...',
        message: 'Procesando tu viaje, por favor espera',
        color: 'blue',
        loading: true,
        autoClose: false,
      });

      // Obtener el usuario actual para logging
      const currentUser = await getCurrentUser();
      const userId = currentUser.success && currentUser.user ? currentUser.user.id : 'unknown';
      
      console.log('🚀 Publishing trip for user:', userId);
      console.log('📝 Trip data to publish:', fullTripData);

      const result = await publishTrip(fullTripData);
      
      console.log('📡 Publish trip result:', result);
      
      // Quitar loading
      setIsLoading(false);
      notifications.hide('publishing-trip');
      
      if (result.success) {
        // Limpiar notificación de migración
        notifications.hide('migration-notification');
        
        // Mostrar información detallada del éxito incluyendo migración
        const details = [
          `ID del viaje: #${result.data?.trip_id}`,
          `Garantía congelada: $${result.data?.frozen_amount?.toLocaleString()} COP`,
          'Los pasajeros ya pueden ver y reservar tu viaje',
          'Te notificaremos cuando alguien haga una reserva'
        ];
        
        // Agregar información de migración si hubo datos guardados
        if (hasDraft && (safePointSelections.length > 0 || stopovers.length > 0)) {
          details.splice(2, 0, 
            `✅ ${safePointSelections.length} SafePoints migrados correctamente`,
            `✅ ${stopovers.length} paradas migradas correctamente`
          );
        }
        
        setModalInfo({
          type: 'success',
          title: '🎉 ¡Viaje publicado exitosamente!',
          message: `Tu viaje ha sido publicado y está disponible para reservas.`,
          details
        });
        setShowInfoModal(true);
        
        // Limpiar borrador después de publicación exitosa
        if (hasDraft) {
          try {
            await clearTripDraft();
            console.log('✅ Borrador limpiado después de publicación exitosa');
          } catch (cleanupError) {
            console.warn('⚠️ Error limpiando borrador (no crítico):', cleanupError);
          }
        }
        
        return result;
      } else {
        throw new Error(result.error || 'Error al publicar viaje');
      }
    } catch (error) {
      setIsLoading(false);
      notifications.hide('publishing-trip');
      notifications.hide('migration-notification');
      
      console.error('Error publishing trip:', error);
      
      // Analizar el tipo de error para mostrar mensaje específico
      let errorMessage = 'Error desconocido';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const apiError = error as any;
        if (apiError.error) {
          errorMessage = apiError.error;
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }
      }
      
      // Mensajes específicos basados en el error
      if (errorMessage.includes('vehículo debe estar activo') || errorMessage.includes('vehicle') && errorMessage.includes('activo')) {
        setModalInfo({
          type: 'error',
          title: '🚗 Problema con el vehículo',
          message: 'Tu vehículo debe estar activo para publicar viajes.',
          actionText: 'Verificar Vehículo',
          actionLink: '/RegistrarVehiculo',
          details: [
            'Tu vehículo no está en estado activo',
            'Revisa el estado en la sección de vehículos',
            'Los documentos pueden estar vencidos o pendientes',
            'Contacta soporte si necesitas ayuda'
          ]
        });
      } else if (errorMessage.includes('balance') || errorMessage.includes('saldo') || errorMessage.includes('insufficient')) {
        setModalInfo({
          type: 'error',
          title: '💰 Saldo insuficiente',
          message: 'No tienes saldo suficiente para la garantía del viaje.',
          actionText: 'Recargar Saldo',
          actionLink: '/wallet',
          details: [
            'Se requiere el 5% del valor total como garantía',
            'Esta garantía se congela temporalmente',
            'Se devuelve al completar el viaje exitosamente',
            'Puedes recargar saldo desde la sección wallet'
          ]
        });
      } else if (errorMessage.includes('character(1)') || errorMessage.includes('value too long')) {
        setModalInfo({
          type: 'error',
          title: '📝 Error en los datos',
          message: 'Hay un problema con el formato de los datos del viaje.',
          details: [
            'Error en el formato de las preferencias del viaje',
            'Por favor intenta publicar el viaje nuevamente',
            'Si el problema persiste, contacta soporte',
            `Error técnico: ${errorMessage}`
          ]
        });
      } else if (errorMessage.includes('Token') || errorMessage.includes('auth')) {
        setModalInfo({
          type: 'error',
          title: '🔒 Sesión expirada',
          message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
          actionText: 'Iniciar Sesión',
          actionLink: '/Login',
          details: [
            'Tu sesión de usuario ha expirado',
            'Necesitas iniciar sesión para continuar',
            'Tus datos del viaje se mantendrán temporalmente'
          ]
        });
      } else if (errorMessage.includes('network') || errorMessage.includes('Network') || errorMessage.includes('fetch')) {
        setModalInfo({
          type: 'error',
          title: '🌐 Error de conexión',
          message: 'No se pudo conectar con el servidor. Verifica tu conexión.',
          details: [
            'Verifica tu conexión a internet',
            'El servidor puede estar temporalmente no disponible',
            'Intenta nuevamente en unos momentos',
            'Si el problema persiste, contacta soporte'
          ]
        });
      } else {
        setModalInfo({
          type: 'error',
          title: '❌ Error al publicar viaje',
          message: 'No se pudo publicar el viaje. Por favor intenta de nuevo.',
          details: [
            'Verifica que todos los datos estén completos',
            'Asegúrate de tener una conexión estable',
            'Si el problema persiste, contacta soporte',
            `Error técnico: ${errorMessage}`
          ]
        });
      }
      
      console.log('🚨 Error detected, showing modal with info:', {
        type: modalInfo?.type,
        title: modalInfo?.title,
        message: modalInfo?.message,
        errorMessage: errorMessage
      });
      
      setShowInfoModal(true);
      return null;
    }
  }, [prepareTripData, hasDraft, safePointSelections.length, stopovers.length, clearTripDraft]);

  // Hacer la función disponible globalmente para otras páginas del flujo
  (window as any).handlePublishTrip = handlePublishTrip;

  // Mostrar estado de carga si Google Maps no está disponible
  if (!isLoaded) {
    return (
      <Container fluid className={styles.container}>
        <div style={{height: '30px'}} />
        <div className={styles.header}>
          <Link to="/home" className={styles.backButton}>
            <ArrowLeft size={24} />
          </Link>
          <Title order={4} className={styles.headerTitle}>Publicar viaje</Title>
        </div>
        <Container size="sm" className={styles.content}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
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
        <div style={{height: '30px'}} />
        <div className={styles.header}>
          <Link to="/home" className={styles.backButton}>
            <ArrowLeft size={24} />
          </Link>
          <Title order={4} className={styles.headerTitle}>Publicar viaje</Title>
        </div>
        <Container size="sm" className={styles.content}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <AlertCircle size={48} color="red" />
            <Text size="sm" c="red" mt="md">Error al cargar Google Maps. Por favor, recarga la página.</Text>
          </div>
        </Container>
      </Container>
    );
  }

  return (
    <Container fluid className={styles.container}>
      <div style={{height: '30px'}} />
      <div className={styles.header}>
        <Link to="/home" className={styles.backButton}>
          <ArrowLeft size={24} />
        </Link>
        <Title order={4} className={styles.headerTitle}>Publicar viaje</Title>
      </div>
      
      <Container size="sm" className={styles.content}>
         <div className={styles.heroSection}>
          <div className={styles.heroTextContainer}>
            <Title order={2} className={styles.heroTitle}>
              ¿Listo para compartir tu viaje?
            </Title>
            <Text size="md" color="dimmed" className={styles.heroText}>
              Planifica tu ruta y encuentra compañeros de viaje
            </Text>
          </div>
        </div>
        <div className={styles.stepContent}>
          <Title className={styles.stepTitle}>¿Desde dónde sales?</Title>
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
        </div>

        {error && (
          <Text color="red" size="sm" className={styles.errorText}>
            {error}
          </Text>
        )}

        {selectedAddress && selectedDestination && (
          <div className={styles.actionButtonContainer}>
            <Button 
              onClick={calculateRouteWithDirections}
              className={styles.nextButton}
              loading={isLoading}
              leftSection={<Navigation size={20} />}
              rightSection={<Sparkles size={16} />}
            >
              {isLoading ? 'Calculando ruta...' : 'Ver ruta en el mapa'}
            </Button>
          </div>
        )}

        <Modal
          opened={showRouteMap}
          onClose={() => setShowRouteMap(false)}
          fullScreen
          classNames={{
            root: styles.routeModal,
            body: styles.routeModalBody
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Popover width={300} position="bottom" shadow="md">
                    <Popover.Target>
                      <div style={{ position: 'relative' }}>
                        <ActionIcon 
                          variant="light"
                          color={Object.values(routePreferences).some(v => v) ? 'green' : 'gray'}
                          size="lg"
                        >
                          <Settings size={20} />
                        </ActionIcon>
                        {Object.values(routePreferences).some(v => v) && (
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
                            onChange={(e) => handlePreferenceChange('avoidTolls', e.currentTarget.checked)}
                            color="green"
                            size="md"
                            thumbIcon={routePreferences.avoidTolls ? <CheckCircle size={12} /> : null}
                          />
                          <DollarSign size={16} className={styles.preferenceIcon} />
                        </div>
                        <div className={styles.preference}>
                          <Switch
                            label="Evitar autopistas"
                            checked={routePreferences.avoidHighways}
                            onChange={(e) => handlePreferenceChange('avoidHighways', e.currentTarget.checked)}
                            color="green"
                            size="md"
                            thumbIcon={routePreferences.avoidHighways ? <CheckCircle size={12} /> : null}
                          />
                          <Car size={16} className={styles.preferenceIcon} />
                        </div>
                        <div className={styles.preference}>
                          <Switch
                            label="Optimizar consumo"
                            checked={routePreferences.optimizeFuel}
                            onChange={(e) => handlePreferenceChange('optimizeFuel', e.currentTarget.checked)}
                            color="green"
                            size="md"
                            thumbIcon={routePreferences.optimizeFuel ? <CheckCircle size={12} /> : null}
                          />
                          <Trees size={16} className={styles.preferenceIcon} />
                        </div>
                        <div className={styles.preferenceStatus}>
                          <Text size="xs" color="dimmed">
                            {Object.values(routePreferences).some(v => v) 
                              ? '✓ Preferencias activas' 
                              : 'Sin preferencias activas'}
                          </Text>
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
                
                <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                options={{
                  ...mapOptions,
                  gestureHandling: 'greedy',
                  disableDoubleClickZoom: false,
                  zoomControl: true,
                  fullscreenControl: true,
                  streetViewControl: false,
                  mapTypeControl: false,
                  styles: [
                    // Tema oscuro personalizado
                    { featureType: "all", elementType: "geometry", stylers: [{ color: "#2c3e50" }] },
                    { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#ecf0f1" }] },
                    { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#34495e" }] },
                    { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#00ff9d" }, { lightness: -10 }] },
                    { featureType: "administrative.land_parcel", elementType: "geometry.stroke", stylers: [{ color: "#00ff9d" }, { lightness: -5 }] },
                    { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#34495e" }] },
                    { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#2c3e50" }] },
                    { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#2c3e50" }] },
                    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#34495e" }] },
                    { featureType: "poi", elementType: "labels.text", stylers: [{ visibility: "off" }] },
                    { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#27ae60" }, { lightness: -10 }] },
                    { featureType: "road", elementType: "geometry", stylers: [{ color: "#95a5a6" }] },
                    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#ecf0f1" }] },
                    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e74c3c" }] },
                    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#c0392b" }] },
                    { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#7f8c8d" }] },
                    { featureType: "road.local", elementType: "geometry", stylers: [{ color: "#bdc3c7" }] },
                    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#9b59b6" }] },
                    { featureType: "transit.line", elementType: "geometry.fill", stylers: [{ color: "#00ff9d" }] },
                    { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#00ff9d" }] },
                    { featureType: "water", elementType: "geometry", stylers: [{ color: "#3498db" }] },
                    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#ecf0f1" }] },
                    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#2980b9" }] }
                  ]
                }}
                onLoad={(map) => {
                  setMapInstance(map);
                  mapRef.current = map;
                  console.log('Mapa cargado correctamente');
                }}
              >
                {/* Mostrar direcciones usando DirectionsRenderer */}
                {directions && (
                  <DirectionsRenderer
                    directions={directions}
                    routeIndex={selectedRouteIndex}
                    options={{
                      suppressMarkers: true,
                      polylineOptions: {
                        strokeColor: '#00ff9d',
                        strokeWeight: 5,
                        strokeOpacity: 0.9,
                        zIndex: 100,
                      },
                      suppressInfoWindows: false,
                    }}
                  />
                )}

                {/* Marcadores simples tipo pin */}
                {directions && (
                  <>
                    <Marker
                      position={{
                        lat: directions.routes[0].legs[0].start_location.lat(),
                        lng: directions.routes[0].legs[0].start_location.lng(),
                      }}
                      title="Punto de Origen"
                    />
                    <Marker
                      position={{
                        lat: directions.routes[0].legs[0].end_location.lat(),
                        lng: directions.routes[0].legs[0].end_location.lng(),
                      }}
                      title="Punto de Destino"
                    />
                  </>
                )}
              </GoogleMap>
              </div>
        
              <div className={styles.routesSection}>
                {/* Contenedor de scroll independiente */}
                <div className={styles.routesList}>
                  <div className={styles.routesSectionHeader}>
                    <Text className={styles.routesTitle}>Rutas disponibles</Text>
                    <Badge variant="light" color="green" size="sm">
                      {routes.length} opciones
                    </Badge>
                  </div>
                  
                  {/* Mensaje de ayuda */}
                  <div className={styles.helpMessage}>
                    {routes.length > 0 && (
                      <Button
                        className={styles.selectRouteButton}
                        onClick={handleRouteConfirm}
                        size="lg"
                        leftSection={<CheckCircle size={18} />}
                        loading={isLoading}
                        fullWidth
                      >
                        Confirmar Ruta {selectedRouteIndex + 1} • {routes[selectedRouteIndex]?.duration}
                      </Button>
                    )}
                  </div>
                  
                  {/* Lista de rutas con scroll COMPLETAMENTE independiente */}
                  <div className={styles.routesListContent}>
                    {routes.map((route, index) => (
                      <div
                        key={route.index}
                        className={`${styles.routeOption} ${
                          route.index === selectedRouteIndex ? styles.routeOptionSelected : ''
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
                            <CheckCircle size={20} className={styles.routeSelectedIcon} />
                          )}
                        </div>
                        <Text size="sm" color="dimmed" className={styles.routeSummary}>
                          Vía {route.summary}
                        </Text>
                        {route.warnings && route.warnings.length > 0 && (
                          <div className={styles.routeWarnings}>
                            {route.warnings.map((warning: string, i: number) => (
                              <Badge key={i} color="yellow" size="sm" leftSection={<AlertCircle size={12} />}>
                                {warning}
                              </Badge>
                            ))}
                          </div>
                        )}
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
          title={null}
          withCloseButton={canCloseModal()}
          closeOnClickOutside={canCloseModal()}
          closeOnEscape={canCloseModal()}
          styles={{
            content: {
              backgroundColor: 'var(--mantine-color-dark-7)',
              border: '1px solid var(--mantine-color-dark-4)',
            },
            body: {
              padding: '2rem',
            }
          }}
        >
          {modalInfo && (
            <Stack gap="lg" align="center">
              {/* Título con emoji e ícono */}
              <div style={{ textAlign: 'center' }}>
                <Title order={3} style={{ 
                  color: modalInfo.type === 'success' ? '#51cf66' : 
                         modalInfo.type === 'warning' ? '#ffd43b' : 
                         modalInfo.type === 'error' ? '#ff6b6b' : '#74c0fc',
                  marginBottom: '0.5rem',
                  fontSize: '1.5rem'
                }}>
                  {modalInfo.title}
                </Title>
                <Text size="lg" c="dimmed" ta="center">
                  {modalInfo.message}
                </Text>
              </div>

              {/* Detalles */}
              {modalInfo.details && modalInfo.details.length > 0 && (
                <div style={{ width: '100%' }}>
                  <Text size="sm" fw={500} c="dimmed" mb="xs">
                    Detalles:
                  </Text>
                  <Stack gap="xs">
                    {modalInfo.details.map((detail, index) => (
                      <Text key={index} size="sm" c="dimmed" style={{
                        paddingLeft: '1rem',
                        borderLeft: '2px solid var(--mantine-color-dark-4)',
                        lineHeight: 1.5
                      }}>
                        • {detail}
                      </Text>
                    ))}
                  </Stack>
                </div>
              )}

              {/* Botones de acción */}
              <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                {/* Solo mostrar botón "Cerrar" para casos no críticos */}
                {canCloseModal() && (
                  <Button
                    variant="light"
                    color="gray"
                    onClick={handleModalClose}
                    style={{ flex: modalInfo.actionText && modalInfo.actionLink ? 1 : 2 }}
                  >
                    Cerrar
                  </Button>
                )}
                
                {/* Para casos críticos, mostrar botón "Volver al inicio" si no hay acción específica */}
                {!canCloseModal() && (!modalInfo.actionText || !modalInfo.actionLink) && (
                  <Button
                    variant="filled"
                    color="blue"
                    onClick={() => navigate({ to: '/home' })}
                    style={{ flex: 2 }}
                  >
                    Volver al inicio
                  </Button>
                )}
                
                {modalInfo.actionText && modalInfo.actionLink && (
                  modalInfo.actionLink.startsWith('mailto:') ? (
                    <Button
                      variant="filled"
                      color={modalInfo.type === 'success' ? 'green' : 
                             modalInfo.type === 'warning' ? 'yellow' : 
                             modalInfo.type === 'error' ? 'red' : 'blue'}
                      component="a"
                      href={modalInfo.actionLink}
                      onClick={() => setShowInfoModal(false)}
                      style={{ flex: canCloseModal() ? 1 : 2 }}
                    >
                      {modalInfo.actionText}
                    </Button>
                  ) : (
                    <Button
                      variant="filled"
                      color={modalInfo.type === 'success' ? 'green' : 
                             modalInfo.type === 'warning' ? 'yellow' : 
                             modalInfo.type === 'error' ? 'red' : 'blue'}
                      component={Link}
                      to={modalInfo.actionLink}
                      onClick={() => setShowInfoModal(false)}
                      style={{ flex: canCloseModal() ? 1 : 2 }}
                    >
                      {modalInfo.actionText}
                    </Button>
                  )
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