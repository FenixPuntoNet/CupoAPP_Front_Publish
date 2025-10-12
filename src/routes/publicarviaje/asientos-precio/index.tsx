import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Button, NumberInput, Divider, Badge, LoadingOverlay, Group, Text, Modal, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ChevronLeft, Users, Minus, Plus, DollarSign, TrendingUp, TrendingDown, Edit3, ArrowRight } from 'lucide-react';
import { tripStore, type TripData } from '../../../types/PublicarViaje/TripDataManagement';
import { useAssumptions } from '../../../hooks/useAssumptions';
import { 
    calculateTripPriceViaBackend as calculatePriceViaBackend, 
    type PriceCalculationResult 
} from '../../../services/config';
import styles from './index.module.css';

function AsientosPrecioView() {
  const navigate = useNavigate();
  
  // Estados principales
  const [tripData, setTripData] = useState<TripData>(tripStore.getStoredData());
  const [seats, setSeats] = useState<number>(1);
  const [pricePerSeat, setPricePerSeat] = useState<number>(0);
  const [suggestedPrice, setSuggestedPrice] = useState<number>(0);
  const [priceStatus, setPriceStatus] = useState<'optimal' | 'high' | 'low'>('optimal');
  const [priceLimitPercentage, setPriceLimitPercentage] = useState<number>(50);
  const [alertThresholdPercentage, setAlertThresholdPercentage] = useState<number>(20);
  const [loading, setLoading] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [tempPrice, setTempPrice] = useState<number>(0);

  // Hook para assumptions
  const { assumptions, loading: assumptionsLoading } = useAssumptions();

  // Carga inicial y cálculo de precio sugerido
  useEffect(() => {
    const storedData = tripStore.getStoredData();
    setTripData(storedData);
    
    if (!storedData.selectedRoute || !storedData.origin || !storedData.destination) {
      navigate({ to: '/publicarviaje/Origen' });
      return;
    }
    
    calculateSuggestedPrice();
  }, [navigate]);

  // useEffect para cargar porcentajes de configuración
  useEffect(() => {
    if (assumptions && !assumptionsLoading) {
      const limitPercentage = assumptions.price_limit_percentage || 50;
      const alertPercentage = 20; // Usar valor fijo por ahora
      setPriceLimitPercentage(limitPercentage);
      setAlertThresholdPercentage(alertPercentage);
    }
  }, [assumptions, assumptionsLoading]);

  // Calcular precio sugerido usando el backend
  const calculateSuggestedPrice = async () => {
    if (!tripData.selectedRoute?.distance) return;
    
    try {
      setLoading(true);
      
      const backendResult: PriceCalculationResult | null = await calculatePriceViaBackend(tripData.selectedRoute.distance);
      
      if (backendResult) {
        const suggestedPricePerSeat = backendResult.suggested_price_per_seat;
        setSuggestedPrice(suggestedPricePerSeat);
        
        // Si no hay precio establecido, usar el del backend
        if (pricePerSeat === 0) {
          setPricePerSeat(suggestedPricePerSeat);
        }
        
        // Validar rango usando el precio del backend
        validatePriceRange(pricePerSeat || suggestedPricePerSeat, suggestedPricePerSeat);
      } else {
        // Fallback: establecer un precio mínimo
        setSuggestedPrice(5000);
        if (pricePerSeat === 0) {
          setPricePerSeat(5000);
        }
      }
    } catch (error) {
      console.error('Error calculating suggested price:', error);
    } finally {
      setLoading(false);
    }
  };

  // Validar rango de precios
  const validatePriceRange = (currentPrice: number, suggested: number) => {
    if (suggested === 0) return;
    
    const percentage = ((currentPrice - suggested) / suggested) * 100;
    
    if (percentage > alertThresholdPercentage) {
      setPriceStatus('high');
    } else if (percentage < -alertThresholdPercentage) {
      setPriceStatus('low');
    } else {
      setPriceStatus('optimal');
    }
  };

  const handleSeatsChange = (value: number) => {
    setSeats(Math.max(1, Math.min(5, value))); // Entre 1 y 5 asientos
  };

  const handlePriceChange = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseInt(value) || 0 : value;
    
    if (suggestedPrice === 0) {
      setPricePerSeat(Math.max(0, numValue));
      return;
    }
    
    // Limitar el precio usando el porcentaje dinámico
    const limitFactor = priceLimitPercentage / 100;
    const maxPrice = suggestedPrice * (1 + limitFactor);
    const minPrice = suggestedPrice * (1 - limitFactor);
    
    const limitedPrice = Math.max(minPrice, Math.min(maxPrice, Math.max(0, numValue)));
    setPricePerSeat(limitedPrice);
    validatePriceRange(limitedPrice, suggestedPrice);
  };

  const handlePriceIncrement = (increment: number) => {
    const newPrice = pricePerSeat + increment;
    handlePriceChange(newPrice);
  };

  const handleOpenPriceModal = () => {
    setTempPrice(pricePerSeat);
    setIsEditingPrice(true);
  };

  const handleSavePriceModal = () => {
    handlePriceChange(tempPrice);
    setIsEditingPrice(false);
  };

  const handleCancelPriceModal = () => {
    setTempPrice(pricePerSeat);
    setIsEditingPrice(false);
  };

  const handleContinue = () => {
    if (seats < 1 || seats > 5) {
      notifications.show({
        title: 'Asientos inválidos',
        message: 'Debes seleccionar entre 1 y 5 asientos',
        color: 'red',
      });
      return;
    }

    if (pricePerSeat <= 0) {
      notifications.show({
        title: 'Precio requerido',
        message: 'Debes establecer un precio por asiento',
        color: 'red',
      });
      return;
    }

    if (pricePerSeat < 2000) {
      notifications.show({
        title: 'Precio muy bajo',
        message: 'El precio mínimo por asiento es de $2,000 COP',
        color: 'red',
      });
      return;
    }

    // Guardar en tripStore para siguiente página
    const updatedData = {
      seats,
      pricePerSeat,
      suggestedPrice
    };
    tripStore.updateData(updatedData);

    notifications.show({
      title: '¡Configuración guardada!',
      message: `${seats} asiento${seats > 1 ? 's' : ''} por $${pricePerSeat.toLocaleString()} COP cada uno`,
      color: 'green',
    });

    // Navegar al módulo de vehículo y preferencias
    navigate({
      to: '/publicarviaje/vehiculo-preferencias',
    });
  };

  // Calcular ingresos totales
  const totalEarnings = seats * pricePerSeat;
  
  // Funciones auxiliares para mostrar estado del precio
  const getPriceStatusInfo = () => {
    if (suggestedPrice === 0) return null;
    
    const percentage = ((pricePerSeat - suggestedPrice) / suggestedPrice) * 100;
    
    if (priceStatus === 'high') {
      return {
        icon: <TrendingUp size={16} />,
        color: 'orange',
        text: `${percentage.toFixed(0)}% más alto que el sugerido`,
        description: 'Precio alto - podría reducir la demanda'
      };
    } else if (priceStatus === 'low') {
      return {
        icon: <TrendingDown size={16} />,
        color: 'blue',
        text: `${Math.abs(percentage).toFixed(0)}% más bajo que el sugerido`,
        description: 'Precio bajo - excelente para atraer pasajeros'
      };
    } else {
      return {
        icon: <DollarSign size={16} />,
        color: 'green',
        text: 'Precio óptimo',
        description: '¡Perfecto balance entre ganancias y demanda!'
      };
    }
  };

  const priceStatusInfo = getPriceStatusInfo();

  return (
    <div className={styles.container}>
      <LoadingOverlay visible={loading} />
      
      {/* Header */}
      <div className={styles.header}>
        <Button
          variant="subtle"
          size="lg"
          className={styles.backButton}
          onClick={() => navigate({ to: '/publicarviaje/fecha-hora' })}
        >
          <ChevronLeft size={20} />
        </Button>
        <h1 className={styles.title}>Asientos y Precio</h1>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Selección de Asientos y Precio - Integrados */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Users className={styles.sectionIcon} size={24} />
            <h2 className={styles.sectionTitle}>Configuración del viaje</h2>
          </div>
          
          {/* Selector de asientos */}
          <div className={styles.seatsSelector}>
            <Button
              variant="outline"
              size="lg"
              className={styles.seatsButton}
              onClick={() => handleSeatsChange(seats - 1)}
              disabled={seats <= 1}
            >
              <Minus size={20} />
            </Button>
            
            <div className={styles.seatsDisplay}>
              <span className={styles.seatsNumber}>{seats}</span>
              <span className={styles.seatsLabel}>
                asiento{seats > 1 ? 's' : ''}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="lg"
              className={styles.seatsButton}
              onClick={() => handleSeatsChange(seats + 1)}
              disabled={seats >= 5}
            >
              <Plus size={20} />
            </Button>
          </div>

          <p className={styles.seatsHelp}>
            Puedes ofrecer entre 1 y 5 asientos
          </p>

          <Divider className={styles.divider} />

          {/* Configuración de Precio Integrada */}
          <div className={styles.priceSection}>
            <div className={styles.sectionHeader}>
              <DollarSign className={styles.sectionIcon} size={24} />
              <h2 className={styles.sectionTitle}>Precio por asiento</h2>
            </div>

            {/* Display de precio bonito con botones */}
            <div className={styles.priceSelector}>
              <Button
                variant="outline"
                size="lg"
                className={styles.priceButton}
                onClick={() => handlePriceIncrement(-1000)}
                disabled={pricePerSeat <= 1000}
              >
                <Minus size={20} />
              </Button>
              
              <div className={styles.priceDisplayBeautiful}>
                <div 
                  className={styles.priceDisplayContent}
                  onClick={handleOpenPriceModal}
                >
                  <span className={`${styles.priceNumber} ${styles[`price${priceStatus.charAt(0).toUpperCase() + priceStatus.slice(1)}`]}`}>
                    ${pricePerSeat.toLocaleString()}
                  </span>
                  <div className={styles.priceMeta}>
                    <span className={styles.priceCurrency}>COP</span>
                    <Edit3 className={styles.editIcon} size={16} />
                  </div>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="lg"
                className={styles.priceButton}
                onClick={() => handlePriceIncrement(1000)}
              >
                <Plus size={20} />
              </Button>
            </div>

            {/* Badge de estado FUERA de la card, debajo del precio */}
            {suggestedPrice > 0 && priceStatusInfo && (
              <div className={styles.priceStatusBadgeContainer}>
                <Badge
                  color={priceStatusInfo.color}
                  variant="light"
                  size="sm"
                  className={styles.priceStatusCompact}
                  leftSection={priceStatusInfo.icon}
                >
                  {priceStatusInfo.text}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Resumen Compacto con Total y Continuar */}
        <div className={styles.compactSummary}>
          <div className={styles.totalDisplay}>
            <Text className={styles.totalLabel}>Total del viaje</Text>
            <div className={styles.totalAmount}>
              ${totalEarnings.toLocaleString()} COP
            </div>
            {seats > 1 && (
              <Text className={styles.totalBreakdown}>
                {seats} asientos × ${pricePerSeat.toLocaleString()}
              </Text>
            )}
          </div>
          
          <Button
            onClick={handleContinue}
            size="lg"
            className={styles.continueButtonCompact}
            disabled={seats < 1 || pricePerSeat <= 0}
            rightSection={<ArrowRight size={20} />}
          >
            Continuar
          </Button>
        </div>
      </div>

      {/* Modal de edición de precio */}
      <Modal
        opened={isEditingPrice}
        onClose={handleCancelPriceModal}
        title="Editar precio por asiento"
        centered
        classNames={{
          header: styles.modalHeader,
          title: styles.modalTitle,
          body: styles.modalBody
        }}
      >
        <Stack gap="lg">
          <div className={styles.modalPriceContainer}>
            <NumberInput
              value={tempPrice}
              onChange={(value) => setTempPrice(typeof value === 'number' ? value : 0)}
              placeholder="Ingresa el precio"
              size="xl"
              min={1000}
              max={200000}
              step={1000}
              className={styles.modalPriceInput}
              leftSection={<DollarSign size={20} />}
              rightSection={<Text size="sm" className={styles.modalCurrency}>COP</Text>}
              thousandSeparator=","
            />
          </div>
          
          {suggestedPrice > 0 && (
            <Text size="sm" className={styles.modalSuggestion}>
              💡 Precio sugerido: ${suggestedPrice.toLocaleString()} COP
            </Text>
          )}

          <Group justify="space-between" mt="md">
            <Button
              variant="subtle"
              onClick={handleCancelPriceModal}
              className={styles.modalCancelButton}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePriceModal}
              className={styles.modalSaveButton}
              disabled={tempPrice < 1000}
            >
              Guardar precio
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}

export const Route = createFileRoute('/publicarviaje/asientos-precio/')({
  component: AsientosPrecioView,
});