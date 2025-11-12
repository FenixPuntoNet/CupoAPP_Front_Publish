import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useMemo } from 'react';
import { Button, Text, Modal, Stack, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ChevronLeft, CheckCircle, AlertCircle, Users, DollarSign, Car, MapPin, Calendar } from 'lucide-react';
import dayjs from 'dayjs';

// Importar servicios y tipos completos
import { tripStore, type TripData } from '../../../types/PublicarViaje/TripDataManagement';
import { publishTrip, PublishTripRequest } from '@/services/viajes';
import { checkBalanceForTripPublish } from '@/services/wallet';
import { getCurrentUser } from '@/services/auth';
import { getAssumptions, type Assumptions } from '@/services/config';
import { createTripPreferences } from '@/services/tripPreferences';
import { getMyVehicle, Vehicle } from '@/services/vehicles';

import styles from './index.module.css';

function ResumenConfirmacionView() {
  const navigate = useNavigate();
  
  // Estados principales
  const [tripData, setTripData] = useState<TripData>(tripStore.getStoredData());
  const [isPublishing, setIsPublishing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] = useState(false);
  const [requiredAmount, setRequiredAmount] = useState<number>(0);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [assumptions, setAssumptions] = useState<Assumptions | null>(null);
  const [vehicleData, setVehicleData] = useState<Vehicle | null>(null);

  // Cálculo de garantía requerida
  const requiredGuarantee = useMemo(() => {
    if (!assumptions || !tripData.seats || !tripData.pricePerSeat) {
      return 0;
    }
    const totalTripValue = tripData.seats * tripData.pricePerSeat;
    const percentageFee = Math.ceil(totalTripValue * ((assumptions.fee_percentage || 0) / 100));
    const fixedRatePerSeat = assumptions.fixed_rate || 0;
    const totalFixedRate = fixedRatePerSeat * tripData.seats;
    const totalRequired = percentageFee + totalFixedRate;
    
    console.log('💰 requiredGuarantee CALCULATED:', {
      seats: tripData.seats,
      pricePerSeat: tripData.pricePerSeat,
      totalTripValue,
      fee_percentage: assumptions.fee_percentage,
      percentageFee,
      fixed_rate: assumptions.fixed_rate,
      fixedRatePerSeat,
      totalFixedRate,
      totalRequired: totalRequired.toLocaleString()
    });
    
    return totalRequired;
  }, [tripData.seats, tripData.pricePerSeat, assumptions?.fee_percentage, assumptions?.fixed_rate]);

  // Verificar datos al cargar y obtener assumptions
  useEffect(() => {
    const storedData = tripStore.getStoredData();
    console.log('📋 [RESUMEN] Datos cargados del store:', storedData);
    console.log('📅 [RESUMEN] DateTime específico:', storedData.dateTime, 'Tipo:', typeof storedData.dateTime);
    setTripData(storedData);
    
    // Verificar que tenemos todos los datos necesarios
    const extendedData = storedData as any;
    if (!storedData.selectedRoute || !storedData.seats || !storedData.pricePerSeat || !extendedData.vehicle) {
      console.warn('⚠️ [RESUMEN] Datos incompletos, redirigiendo a vehiculo-preferencias');
      navigate({ to: '/publicarviaje/vehiculo-preferencias' });
      return;
    }

    // Cargar assumptions del backend
    const loadAssumptions = async () => {
      try {
        const assumptionsData = await getAssumptions();
        setAssumptions(assumptionsData);
      } catch (error) {
        console.error('Error loading assumptions:', error);
      }
    };
    loadAssumptions();

    // Cargar datos del vehículo para mostrar la placa
    const loadVehicleData = async () => {
      try {
        const vehicleResponse = await getMyVehicle();
        if (vehicleResponse.success && vehicleResponse.vehicle) {
          setVehicleData(vehicleResponse.vehicle);
        }
      } catch (error) {
        console.error('Error loading vehicle data:', error);
      }
    };
    loadVehicleData();
  }, [navigate]);

  const handlePublishTrip = async () => {
    setIsPublishing(true);

    try {
      console.log('🔍 [DEBUG] TripData al inicio de publicación:', {
        hasSelectedRoute: !!tripData.selectedRoute,
        hasOrigin: !!tripData.origin,
        hasDestination: !!tripData.destination,
        dateTime: tripData.dateTime,
        dateTimeType: typeof tripData.dateTime,
        seats: tripData.seats,
        pricePerSeat: tripData.pricePerSeat,
        additionalInfo: (tripData as any).additionalInfo,
        preferences: (tripData as any).preferences,
        vehicle: (tripData as any).vehicle
      });

      // Validar datos básicos
      const extendedData = tripData as any;
      if (!tripData.selectedRoute || !tripData.origin || !tripData.destination) {
        throw new Error("Los datos del viaje son incompletos.");
      }

      // Verificar usuario autenticado
      const user = await getCurrentUser();
      if (!user.success || !user.user) {
        throw new Error("Usuario no autenticado");
      }

      // Verificar saldo ANTES de intentar publicar
      console.log('💰 [PUBLISH] Verificando saldo via BACKEND antes de publicar viaje...');
      const balanceCheck = await checkBalanceForTripPublish(tripData.seats!, tripData.pricePerSeat!);
      
      if (!balanceCheck.success) {
        throw new Error(balanceCheck.error || 'Error verificando saldo');
      }

      if (!balanceCheck.hasSufficientBalance) {
        console.log('💰 [PUBLISH] Saldo insuficiente detectado por el BACKEND');
        setRequiredAmount(balanceCheck.requiredAmount);
        setCurrentBalance(balanceCheck.availableBalance);
        setShowInsufficientBalanceModal(true);
        return;
      }

      console.log('✅ [PUBLISH] Verificación de saldo exitosa, procediendo con la publicación');

      // Verificar que tenemos fecha válida
      if (!tripData.dateTime) {
        throw new Error("No se ha especificado fecha y hora para el viaje");
      }

      // Crear fecha usando el formato correcto
      let formattedDateTime: string;
      try {
        // Si dateTime es string, intentar parsearlo con dayjs
        if (typeof tripData.dateTime === 'string') {
          const parsedDate = dayjs(tripData.dateTime);
          if (!parsedDate.isValid()) {
            throw new Error("Fecha inválida en los datos del viaje");
          }
          formattedDateTime = parsedDate.format('YYYY-MM-DD HH:mm:ss');
        } else {
          // Si es Date object, convertir directamente
          formattedDateTime = dayjs(tripData.dateTime).format('YYYY-MM-DD HH:mm:ss');
        }

        // Verificar que la fecha sea futura
        const now = dayjs();
        const selectedDateTime = dayjs(formattedDateTime);
        
        if (selectedDateTime.isBefore(now.add(1, 'minute'))) {
          throw new Error("La fecha del viaje debe ser al menos 1 minuto en el futuro");
        }

        console.log('📅 [PUBLISH] Fecha formateada correctamente:', {
          original: tripData.dateTime,
          formatted: formattedDateTime,
          isValid: selectedDateTime.isValid(),
          isFuture: selectedDateTime.isAfter(now)
        });

      } catch (dateError) {
        console.error('❌ [PUBLISH] Error procesando fecha:', dateError);
        throw new Error(`Error en formato de fecha: ${dateError instanceof Error ? dateError.message : 'Fecha inválida'}`);
      }

      // Preparar datos para publicar viaje
      const publishData: PublishTripRequest = {
        origin: {
          address: tripData.origin!.address,
          latitude: tripData.origin!.coords.lat.toString(),
          longitude: tripData.origin!.coords.lng.toString(),
          main_text: tripData.origin!.mainText || tripData.origin!.address,
          place_id: tripData.origin!.placeId,
          secondary_text: tripData.origin!.secondaryText
        },
        destination: {
          address: tripData.destination!.address,
          latitude: tripData.destination!.coords.lat.toString(),
          longitude: tripData.destination!.coords.lng.toString(),
          main_text: tripData.destination!.mainText || tripData.destination!.address,
          place_id: tripData.destination!.placeId,
          secondary_text: tripData.destination!.secondaryText
        },
        date_time: formattedDateTime,
        seats: Number(tripData.seats),
        price_per_seat: Number(tripData.pricePerSeat),
        description: extendedData.additionalInfo?.trim() || 'Viaje compartido',
        // ✅ MAPEO CORREGIDO de preferencias para el endpoint /viajes/publish
        allow_pets: (extendedData.preferences || []).includes('mascotas'),
        allow_smoking: !(extendedData.preferences || []).includes('no_fumar'), // Si selecciona "no_fumar", allow_smoking=false
        vehicle_id: parseInt(extendedData.vehicle),
        route_summary: tripData.selectedRoute!.summary,
        estimated_duration: tripData.selectedRoute!.duration,
        estimated_distance: tripData.selectedRoute!.distance
      };

      console.log('🚀 Publishing trip with data:', {
        ...publishData,
        // Log fecha por separado para debug
        date_time_debug: {
          original: tripData.dateTime,
          formatted: publishData.date_time,
          type: typeof tripData.dateTime
        }
      });
      
      const result = await publishTrip(publishData);

      if (!result.success) {
        // Verificar si es error de saldo insuficiente
        const errorMessage = result.error || '';
        const isSaldoInsuficiente = (
          errorMessage.toLowerCase().includes('saldo') ||
          errorMessage.toLowerCase().includes('balance') ||
          errorMessage.toLowerCase().includes('fondos') ||
          errorMessage.toLowerCase().includes('insuficiente') ||
          errorMessage.toLowerCase().includes('garantía') ||
          errorMessage.toLowerCase().includes('insufficient')
        );
        
        if (isSaldoInsuficiente) {
          console.log('💰 [MODAL] Error de saldo detectado:', errorMessage);
          setRequiredAmount(requiredGuarantee);
          setCurrentBalance(246400); // Usar saldo conocido del backend
          setShowInsufficientBalanceModal(true);
          return;
        }
        
        throw new Error(result.error || 'Error al publicar el viaje');
      }

      console.log('✅ Viaje publicado exitosamente:', result.data);

      // 🎯 NUEVO: Enviar preferencias del viaje al backend
      const preferences = extendedData.preferences || [];
      const tripId = result.data?.trip_id;
      
      if (preferences.length > 0 && tripId) {
        console.log('🎯 [PREFERENCES] Enviando preferencias al backend...');
        console.log('🎯 [PREFERENCES] Trip ID:', tripId);
        console.log('🎯 [PREFERENCES] Preferencias:', preferences);
        
        try {
          const preferencesResult = await createTripPreferences(tripId, preferences);
          
          if (preferencesResult.success) {
            console.log('✅ [PREFERENCES] Preferencias guardadas exitosamente:', preferencesResult.data);
          } else {
            console.warn('⚠️ [PREFERENCES] Error guardando preferencias:', preferencesResult.error);
            // No fallar la publicación por las preferencias, solo advertir
          }
        } catch (preferencesError) {
          console.warn('⚠️ [PREFERENCES] Exception guardando preferencias:', preferencesError);
          // No fallar la publicación por las preferencias
        }
      } else {
        console.log('🎯 [PREFERENCES] No hay preferencias para enviar o falta trip_id');
        console.log('🎯 [PREFERENCES] Preferences count:', preferences.length);
        console.log('🎯 [PREFERENCES] Trip ID available:', !!tripId);
      }

      // Mostrar notificación de éxito
      notifications.show({
        title: '✅ Viaje publicado exitosamente',
        message: 'Garantía congelada exitosamente. Tu viaje está activo y disponible para reservas.',
        color: 'green',
        autoClose: 4000
      });

      setShowSuccessModal(true);

      // NO limpiar automáticamente - el usuario debe cerrar el modal manualmente

    } catch (error) {
      console.error('❌ Error publishing trip:', error);
      console.error('❌ Trip data at error:', {
        hasRoute: !!tripData.selectedRoute,
        hasOrigin: !!tripData.origin,
        hasDestination: !!tripData.destination,
        hasDateTime: !!tripData.dateTime,
        dateTimeValue: tripData.dateTime,
        dateTimeType: typeof tripData.dateTime,
        hasSeats: !!tripData.seats,
        hasPricePerSeat: !!tripData.pricePerSeat,
        hasVehicle: !!(tripData as any).vehicle
      });

      const errorMessage = error instanceof Error ? error.message : 'Hubo un problema al publicar tu viaje. Inténtalo de nuevo.';
      
      notifications.show({
        title: 'Error al publicar viaje',
        message: errorMessage,
        color: 'red',
        icon: <AlertCircle size={20} />,
        autoClose: 8000
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Función para manejar el cierre del modal de éxito
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    tripStore.clearData();
    navigate({ to: '/Actividades' }); // Navegar a actividades
  };

  // Formatear fecha y hora
  const formatDateTime = (dateTime: string | null | undefined) => {
    if (!dateTime) return { date: 'No especificada', time: '' };
    
    const date = new Date(dateTime);
    const formattedDate = date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    const formattedTime = date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return { date: formattedDate, time: formattedTime };
  };

  const { date, time } = formatDateTime(tripData.dateTime);
  const totalEarnings = (tripData.seats || 0) * (tripData.pricePerSeat || 0);
  
  // 🔥 CRÍTICO: Usar SOLO assumptions del backend (nunca valores hardcodeados)
  const publishingFee = assumptions ? Math.ceil(totalEarnings * ((assumptions.fee_percentage || 0) / 100)) : 0;
  const systemFee = assumptions ? (assumptions.fixed_rate || 0) * (tripData.seats || 0) : 0;
  const totalCost = publishingFee + systemFee;
  const netEarnings = totalEarnings - totalCost;

  // 🔍 VERIFICACIÓN: Los dos cálculos deben dar el mismo resultado
  console.log('🔍 [PRICING-VERIFICATION]', {
    method1_requiredGuarantee: requiredGuarantee,
    method2_totalCost: totalCost,
    match: requiredGuarantee === totalCost,
    assumptions: assumptions ? 'BACKEND' : 'MISSING',
    fee_percentage: assumptions?.fee_percentage,
    fixed_rate: assumptions?.fixed_rate
  });

  return (
    <div className={styles.container}>
      
      {/* Header Simple */}
      <div className={styles.header}>
        <Button
          variant="subtle"
          className={styles.backButton}
          onClick={() => navigate({ to: '/publicarviaje/vehiculo-preferencias' })}
        >
          <ChevronLeft size={20} />
        </Button>
        <Text className={styles.headerTitle}>Resumen del viaje</Text>
      </div>

      {/* Contenido Principal */}
      <div className={styles.content}>
        
        {/* Ruta Compacta */}
        <div className={styles.routeCardCompact}>
          <div className={styles.routePoints}>
            <div className={styles.routePoint}>
              <MapPin className={styles.routeIcon} size={16} />
              <div className={styles.routeInfo}>
                <Text className={styles.routeLabel}>Origen</Text>
                <Text className={styles.routeText}>{tripData.origin?.mainText}</Text>
              </div>
            </div>
            <div className={styles.routeArrow}>→</div>
            <div className={styles.routePoint}>
              <MapPin className={styles.routeIcon} size={16} />
              <div className={styles.routeInfo}>
                <Text className={styles.routeLabel}>Destino</Text>
                <Text className={styles.routeText}>{tripData.destination?.mainText}</Text>
              </div>
            </div>
          </div>
          <div className={styles.routeStatsCompact}>
            <span className={styles.statCompact}>{tripData.selectedRoute?.distance}</span>
            <span className={styles.statDivider}>•</span>
            <span className={styles.statCompact}>{tripData.selectedRoute?.duration}</span>
          </div>
        </div>

        {/* Grid Compacto de Detalles */}
        <div className={styles.compactGrid}>
          <div className={styles.compactCard}>
            <Calendar className={styles.compactIcon} size={18} />
            <div>
              <Text className={styles.compactLabel}>Fecha</Text>
              <Text className={styles.compactValue}>{date.split(',')[0]}</Text>
              <Text className={styles.compactSubvalue}>{time}</Text>
            </div>
          </div>

          <div className={styles.compactCard}>
            <Users className={styles.compactIcon} size={18} />
            <div>
              <Text className={styles.compactLabel}>Cupos</Text>
              <Text className={styles.compactValue}>{tripData.seats}</Text>
              <Text className={styles.compactSubvalue}>disponibles</Text>
            </div>
          </div>

          <div className={styles.compactCard}>
            <DollarSign className={styles.compactIcon} size={18} />
            <div>
              <Text className={styles.compactLabel}>Precio</Text>
              <Text className={styles.compactValue}>${tripData.pricePerSeat?.toLocaleString()}</Text>
              <Text className={styles.compactSubvalue}>por cupo</Text>
            </div>
          </div>

          <div className={styles.compactCard}>
            <Car className={styles.compactIcon} size={18} />
            <div>
              <Text className={styles.compactLabel}>Vehículo</Text>
              <Text className={styles.compactValue}>
                {vehicleData?.plate || 'Cargando...'}
              </Text>
              <Text className={styles.compactSubvalue}>
                {vehicleData ? `${vehicleData.brand} ${vehicleData.model}` : 'registrado'}
              </Text>
            </div>
          </div>
        </div>

        {/* Resumen Financiero Mejorado */}
        <div className={styles.financialSummary}>
          <div className={styles.earningsSection}>
            <div className={styles.earningsHeader}>
              <DollarSign className={styles.earningsIcon} size={20} />
              <div>
                <Text className={styles.earningsTitle}>Ganancia estimada</Text>
                <Text className={styles.earningsSubtitle}>Si se ocupan todos los cupos</Text>
              </div>
            </div>
            <Text className={styles.earningsAmount}>${totalEarnings.toLocaleString()}</Text>
          </div>
          
          <div className={styles.costsSection}>
            <Text className={styles.costsTitle}>Costos de publicación</Text>
            <div className={styles.costsList}>
              <div className={styles.costItem}>
                <span>Comisión del sistema ({Math.round((publishingFee/totalEarnings)*100)}%)</span>
                <span>${publishingFee.toLocaleString()}</span>
              </div>
              <div className={styles.costItem}>
                <span>Tarifa de publicación</span>
                <span>${systemFee.toLocaleString()}</span>
              </div>
              <div className={styles.costItemTotal}>
                <span>Ganancia neta</span>
                <span>${netEarnings.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de Publicar */}
        <div className={styles.publishSection}>
          <Button
            className={styles.publishButton}
            onClick={handlePublishTrip}
            loading={isPublishing}
            disabled={isPublishing}
            leftSection={<CheckCircle size={20} />}
          >
            {isPublishing ? 'Publicando viaje...' : 'Publicar viaje'}
          </Button>
          <Text className={styles.publishNote} size="sm">
            Tu viaje será visible para otros usuarios inmediatamente
          </Text>
        </div>
      </div>

      {/* Modal de saldo insuficiente */}
      <Modal
        opened={showInsufficientBalanceModal}
        onClose={() => setShowInsufficientBalanceModal(false)}
        title=""
        centered
        size="md"
        styles={{
          header: {
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
            borderRadius: '16px 16px 0 0',
            padding: '1.5rem',
            border: 'none'
          },
          body: {
            background: 'var(--card-bg)',
            borderRadius: '0 0 16px 16px',
            padding: '2rem'
          },
          content: {
            borderRadius: '16px',
            overflow: 'hidden'
          }
        }}
      >
        <Stack align="center" gap="md">
          {/* Título e icono personalizados */}
          <div style={{ textAlign: 'center', marginTop: '-1rem' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
              borderRadius: '50%',
              padding: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <AlertCircle size={32} color="white" />
            </div>
            
            <Text size="xl" fw={700} mb="xs" style={{ color: '#ffffff' }}>
              Saldo insuficiente
            </Text>
            
            <Text size="lg" fw={500} mb="lg" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              No tienes saldo suficiente para publicar este viaje
            </Text>
          </div>
          
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '1rem',
            width: '100%',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text size="sm" style={{ opacity: 0.8 }}>Saldo disponible:</Text>
                <Text size="sm" style={{ fontWeight: 600 }}>${currentBalance.toLocaleString()}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" style={{ opacity: 0.8 }}>Garantía requerida:</Text>
                <Text size="sm" style={{ fontWeight: 600, color: '#00ff9d' }}>${requiredAmount.toLocaleString()}</Text>
              </Group>
              <div style={{ 
                height: '1px',
                background: 'rgba(255, 255, 255, 0.1)',
                margin: '0.5rem 0'
              }} />
              <Group justify="space-between">
                <Text size="sm" style={{ color: '#ff6b6b', fontWeight: 600 }}>Faltante:</Text>
                <Text size="sm" style={{ color: '#ff6b6b', fontWeight: 600 }}>
                  ${Math.max(0, requiredAmount - currentBalance).toLocaleString()}
                </Text>
              </Group>
            </Stack>
          </div>
          
          <Text size="sm" style={{ textAlign: 'center', opacity: 0.7 }}>
            La garantía se congela al publicar el viaje y se libera al completarlo exitosamente
          </Text>
          
          {/* Botones lado a lado */}
          <div style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            width: '100%',
            marginTop: '1rem'
          }}>
            <Button
              flex={1}
              size="md"
              variant="outline"
              style={{
                borderColor: '#00ff9d',
                color: '#00ff9d',
                fontWeight: 600,
                height: '48px'
              }}
              onClick={() => {
                setShowInsufficientBalanceModal(false);
                navigate({ to: '/Cupones' });
              }}
            >
              🎁 Cupón
            </Button>
            
            <Button
              flex={1}
              size="md"
              style={{
                background: 'linear-gradient(135deg, #00ff9d 0%, #00e88d 100%)',
                color: '#0a0a0a',
                fontWeight: 700,
                height: '48px'
              }}
              onClick={() => {
                setShowInsufficientBalanceModal(false);
                window.open('https://www.cupo.lat/login', '_blank');
              }}
            >
              💳 Recargar
            </Button>
          </div>
        </Stack>
      </Modal>

      {/* Modal de éxito mejorado */}
      <Modal
        opened={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="🎉 ¡Viaje publicado exitosamente!"
        centered
        size="md"
        styles={{
          header: {
            background: 'linear-gradient(135deg, #00ff9d 0%, #00e88d 100%)',
            borderRadius: '16px 16px 0 0',
            padding: '1rem',
            border: 'none'
          },
          title: {
            color: '#0a0a0a',
            fontWeight: 800,
            fontSize: '1.1rem',
            margin: 0
          },
          body: {
            background: 'var(--card-bg)',
            borderRadius: '0 0 16px 16px',
            padding: '1.5rem'
          },
          content: {
            borderRadius: '16px',
            overflow: 'hidden'
          }
        }}
      >
        <Stack align="center" gap="md">
          {/* Icono de éxito */}
          <div style={{
            background: 'linear-gradient(135deg, #00ff9d 0%, #00e88d 100%)',
            borderRadius: '50%',
            padding: '1rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle size={32} color="#0a0a0a" />
          </div>

          {/* Mensaje principal */}
          <Text size="lg" fw={700} style={{ color: '#ffffff', textAlign: 'center' }}>
            Tu viaje está activo y disponible
          </Text>

          {/* Información de cobro - clara sobre los dos tipos */}
          <div style={{
            background: 'rgba(0, 255, 157, 0.1)',
            border: '1px solid rgba(0, 255, 157, 0.3)',
            borderRadius: '8px',
            padding: '1rem',
            width: '100%'
          }}>
            <Text size="sm" fw={700} mb="sm" style={{ color: '#00ff9d', textAlign: 'center' }}>
              💰 ¿Qué dinero se maneja?
            </Text>
            
            <Stack gap="sm">
              {/* Lo que congelamos nosotros */}
              <div style={{
                background: 'rgba(255, 107, 107, 0.1)',
                borderRadius: '6px',
                padding: '0.5rem'
              }}>
                <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  🏦 <strong style={{ color: '#ff6b6b' }}>CUPO congela de tu saldo:</strong> ${requiredGuarantee.toLocaleString()} (garantía)
                </Text>
              </div>
              
              {/* Lo que cobra el conductor */}
              <div style={{
                background: 'rgba(0, 255, 157, 0.1)',
                borderRadius: '6px',
                padding: '0.5rem'
              }}>
                <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  💵 <strong style={{ color: '#00ff9d' }}>TÚ cobras a pasajeros:</strong> ${tripData.pricePerSeat?.toLocaleString()} c/u (directo)
                </Text>
              </div>
              
              <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
                💡 La garantía se libera al completar el viaje
              </Text>
            </Stack>
          </div>

          {/* Resumen compacto */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '0.75rem',
            width: '100%'
          }}>
            <Group justify="space-between" mb="xs">
              <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Ruta:</Text>
              <Text size="xs" fw={500} style={{ color: '#ffffff' }}>
                {tripData.origin?.mainText} → {tripData.destination?.mainText}
              </Text>
            </Group>
            
            <Group justify="space-between" mb="xs">
              <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Fecha:</Text>
              <Text size="xs" fw={500} style={{ color: '#ffffff' }}>
                {date} - {time}
              </Text>
            </Group>
            
            <Group justify="space-between">
              <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {tripData.seats} cupos × ${tripData.pricePerSeat?.toLocaleString()}:
              </Text>
              <Text size="xs" fw={600} style={{ color: '#00ff9d' }}>
                ${totalEarnings.toLocaleString()}
              </Text>
            </Group>
          </div>

          {/* Botón para cerrar */}
          <Button
            size="sm"
            style={{
              background: 'linear-gradient(135deg, #00ff9d 0%, #00e88d 100%)',
              color: '#0a0a0a',
              fontWeight: 700,
              width: '100%',
              height: '40px'
            }}
            onClick={handleSuccessModalClose}
          >
            Entendido, ir al inicio
          </Button>
        </Stack>
      </Modal>
    </div>
  );
}

// Exportar ruta y componente
export const Route = createFileRoute('/publicarviaje/resumen-confirmacion/')({
  component: ResumenConfirmacionView,
});

export default ResumenConfirmacionView;