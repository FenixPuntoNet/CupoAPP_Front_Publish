import type React from 'react';
import { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
    Container,
    Title,
    Text,
    Button,
    UnstyledButton,
    Card,
    Group,
    Stack,
    Badge,
    NumberInput,
    type NumberInputProps,
    Textarea,
    Switch,
    Modal,
    LoadingOverlay,
    Select,
} from '@mantine/core';
import {
    ArrowLeft,
    Clock,
    Navigation,
    Users,
    DollarSign,
    Calendar,
    Check,
    MapPin,
    AlertTriangle,
    AlertCircle,
    Info,
} from 'lucide-react';
import type { MantineTheme, } from '@mantine/core';
import { DateTimePicker, } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { tripStore, type TripData, type TripStopover } from '../../types/PublicarViaje/TripDataManagement';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import styles from './index.module.css';
import { getCurrentUser } from '@/services/auth';
import { publishTrip } from '@/services/viajes';
import { checkAndFreezeBalance, getCurrentWallet } from '@/services/wallet';
import { getUserVehicles } from '@/services/vehicles';
import { useAssumptions } from '../../hooks/useAssumptions';

interface FormattedNumberInputProps extends Omit<NumberInputProps, 'onChange'> {
    onChange: (value: number) => void;
    formatter?: (value: string) => string;
    parser?: (value: string) => string;
}

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    data: {
        tripData: TripData;
        dateTime: Date | null;
        seats: number;
        pricePerSeat: number;
        description: string;
        allowPets: boolean;
        allowSmoking: boolean;
        stopovers: TripStopover[];
    };
}


const PreviewInfo: React.FC<PreviewModalProps> = ({ isOpen, onClose, onConfirm, data }) => {
    if (!data.tripData.selectedRoute) return null;

    return (
        <Modal
            opened={isOpen}
            onClose={onClose}
            title="Vista previa del viaje"
            size="lg"
            centered
            classNames={{
                header: styles.previewHeader,
                title: styles.previewTitle
            }}
        >
            <Stack gap="xl">
                <Card className={styles.previewCard}>
                    <Stack gap="md">
                        <Group gap="apart">
                            <div>
                                <Text fw={500} size="lg">Fecha y Hora</Text>
                                <Text>
                                    {data.dateTime
                                        ? dayjs(data.dateTime).format('DD MMM YYYY hh:mm A')
                                        : ''}
                                </Text>
                            </div>
                            <Badge
                                size="lg"
                                variant="gradient"
                                gradient={{ from: 'teal', to: 'lime' }}
                            >
                                {data.tripData.selectedRoute.duration}
                            </Badge>
                        </Group>

                        <div className={styles.locationPreview}>
                            <Text fw={500}>Origen</Text>
                            <Text className={styles.locationText}>
                                {data.tripData.origin?.address}
                            </Text>
                            <div className={styles.previewSeparator} />
                            <Text fw={500}>Destino</Text>
                            <Text className={styles.locationText}>
                                {data.tripData.destination?.address}
                            </Text>
                        </div>
                        {data.stopovers && data.stopovers.length > 0 && (
                            <div className={styles.stopoverPreview}>
                                <Text fw={500} mb="sm">Paradas</Text>
                                <Group gap="md">
                                    {data.stopovers.map((stopover, index) => (
                                        <div key={index} className={styles.stopItem}>
                                            <MapPin size={16} className={styles.stopIcon} />
                                            <Text>
                                                {stopover.location.mainText}
                                                {stopover.location.postalCode ? ` (${stopover.location.postalCode})` : ''}
                                            </Text>
                                        </div>
                                    ))}
                                </Group>
                            </div>
                        )}
                        <Group grow>
                            <Card className={styles.infoCard}>
                                <Group gap="sm">
                                    <Users className={styles.infoIcon} />
                                    <div>
                                        <Text size="sm" fw={500}>Cupos disponibles</Text>
                                        <Text size="xl" fw={600}>{data.seats}</Text>
                                    </div>
                                </Group>
                            </Card>

                            <Card className={styles.infoCard}>
                                <Group gap="sm">
                                    <DollarSign className={styles.infoIcon} />
                                    <div>
                                        <Text size="sm" fw={500}>Precio por cupo</Text>
                                        <Text size="xl" fw={600}>
                                            ${data.pricePerSeat.toLocaleString()}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            Total: ${(data.pricePerSeat * data.seats).toLocaleString()}
                                        </Text>
                                    </div>
                                </Group>
                            </Card>
                        </Group>

                        {data.description && (
                            <div className={styles.descriptionPreview}>
                                <Text fw={500}>Descripción</Text>
                                <Text>{data.description}</Text>
                            </div>
                        )}

                        <div className={styles.preferencesPreview}>
                            <Text fw={500} mb="sm">Preferencias</Text>
                            <Group>
                                <Badge
                                    color={data.allowPets ? "teal" : "red"}
                                    variant="light"
                                    size="lg"
                                >
                                    {data.allowPets ? "Mascotas permitidas" : "No se permiten mascotas"}
                                </Badge>
                                <Badge
                                    color={data.allowSmoking ? "teal" : "red"}
                                    variant="light"
                                    size="lg"
                                >
                                    {data.allowSmoking ? "Se permite fumar" : "No se permite fumar"}
                                </Badge>
                            </Group>
                        </div>
                    </Stack>
                </Card>

                <Group gap="md">
                    <Button
                        variant="default"
                        onClick={onClose}
                        className={styles.previewButton}
                    >
                        Editar
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className={styles.confirmButton}
                    >
                        Confirmar y publicar
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

// Modal de saldo insuficiente
interface InsufficientBalanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    requiredAmount: number;
    currentBalance: number;
}

const InsufficientBalanceModal: React.FC<InsufficientBalanceModalProps> = ({ 
    isOpen, 
    onClose, 
    requiredAmount, 
    currentBalance 
}) => {
    const handleRechargeWallet = () => {
        window.location.href = 'https://www.cupo.dev/login';
    };

    return (
        <Modal
            opened={isOpen}
            onClose={onClose}
            title=""
            size="md"
            centered
            withCloseButton={false}
            classNames={{
                header: styles.modalHeader,
                body: styles.modalBody
            }}
        >
            <Stack gap="xl" align="center">
                <div className={styles.modalIconContainer}>
                    <DollarSign size={48} className={styles.walletIcon} />
                </div>
                
                <div className={styles.modalContent}>
                    <Title order={3} ta="center" mb="md" className={styles.modalTitle}>
                        ¡Necesitas recargar tu billetera!
                    </Title>
                    
                    <Text ta="center" size="md" c="dimmed" mb="lg">
                        Para publicar este viaje necesitas tener fondos disponibles en tu billetera como garantía.
                    </Text>

                    <Card className={styles.balanceCard} mb="lg">
                        <Stack gap="sm">
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">Tu saldo actual:</Text>
                                <Text size="sm" fw={500}>${currentBalance.toLocaleString()}</Text>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">Monto requerido:</Text>
                                <Text size="sm" fw={500} c="red">${requiredAmount.toLocaleString()}</Text>
                            </Group>
                            <div className={styles.divider} />
                            <Group justify="space-between">
                                <Text size="sm" fw={600}>Necesitas recargar:</Text>
                                <Text size="sm" fw={600} c="orange">
                                    ${(requiredAmount - currentBalance).toLocaleString()}
                                </Text>
                            </Group>
                        </Stack>
                    </Card>

                    <div className={styles.explanationBox}>
                        <AlertCircle size={20} className={styles.infoIcon} />
                        <div>
                            <Text size="sm" fw={500} mb="xs">¿Por qué necesito esto?</Text>
                            <Text size="xs" c="dimmed">
                                En Cupo, congelamos temporalmente un pequeño monto de tu billetera como garantía 
                                cuando publicas un viaje. Esto asegura que todos los usuarios sean responsables 
                                y comprometidos con sus viajes. El dinero se libera automáticamente cuando el 
                                viaje se completa exitosamente.
                            </Text>
                        </div>
                    </div>
                </div>

                <Group gap="md" style={{ width: '100%' }}>
                    <Button 
                        variant="default" 
                        onClick={onClose}
                        style={{ flex: 1 }}
                        size="lg"
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleRechargeWallet}
                        style={{ flex: 1 }}
                        size="lg"
                        className={styles.rechargeButton}
                    >
                        Recargar Wallet
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

function FormattedNumberInput({
    value,
    onChange,
    formatter,
    parser,
    ...props
}: FormattedNumberInputProps) {
    const handleChange = (val: string | number) => {
        const numericValue = typeof val === 'string' ? Number.parseFloat(val) : val;
        onChange(isNaN(numericValue) ? 0 : numericValue);
    };

    return (
        <NumberInput
            value={value}
            onChange={handleChange}
            {...props}
            styles={{
                input: (theme: MantineTheme) => ({
                    borderColor: theme.colors.gray[4],
                    '&:focus': {
                        borderColor: theme.colors.blue[6],
                    },
                }),
            }}
        />
    );
}

import { useRef } from 'react';

const DetallesViajeView = () => {
    const navigate = useNavigate();
    const [tripData, setTripData] = useState<TripData>(tripStore.getStoredData());
    const [seats, setSeats] = useState<number>(1);
    const [pricePerSeat, setPricePerSeat] = useState<number>(0);
    const [suggestedPrice, setSuggestedPrice] = useState<number>(0);
    const [priceStatus, setPriceStatus] = useState<'normal' | 'high' | 'low'>('normal');
    const [priceLimitPercentage, setPriceLimitPercentage] = useState<number>(50);
    const [alertThresholdPercentage, setAlertThresholdPercentage] = useState<number>(20);
    const [description, setDescription] = useState<string>('');
    const [allowPets, setAllowPets] = useState<boolean>(false);
    const [allowSmoking, setAllowSmoking] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
    const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
    const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] = useState<boolean>(false);
    const [requiredAmount, setRequiredAmount] = useState<number>(0);
    const [currentBalance, setCurrentBalance] = useState<number>(0);
    const [dateTime, setDateTime] = useState<Date | null>(null);
    const [stopovers, setStopovers] = useState<TripStopover[]>([]);
    const [loading, setLoading] = useState(false);
    const isSubmittingRef = useRef(false);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [vehicleId, setVehicleId] = useState<string | null>(null);

    // Hook para assumptions
    const { assumptions, loading: assumptionsLoading, calculateTripPrice } = useAssumptions();


    // Cálculo de garantía dinámica según assumptions
    const calculateRequiredBalance = (seats: number, pricePerSeat: number): number => {
        if (!assumptions) return 0;
        const totalTripValue = seats * pricePerSeat;
        const fee = (assumptions.fee_percentage || 0) / 100;
        return Math.ceil(totalTripValue * fee);
    };

    const checkAndFreezeWalletBalance = async (requiredAmount: number) => {
        try {
            const result = await checkAndFreezeBalance(requiredAmount);
            
            if (result.showModal) {
                // Obtener el wallet actual para mostrar los saldos
                const walletData = await getCurrentWallet();
                if (walletData.success && walletData.data) {
                    const availableBalance = (walletData.data.balance || 0) - (walletData.data.frozen_balance || 0);
                    setRequiredAmount(requiredAmount);
                    setCurrentBalance(availableBalance);
                    setShowInsufficientBalanceModal(true);
                }
                return { success: false, showModal: true };
            }

            if (!result.success) {
                throw new Error(result.error);
            }

            return {
                success: true,
                message: result.message
            };
        } catch (error: any) {
            console.error('Error checking wallet:', error);
            throw error;
        }
    };
      

    // useEffect de carga inicial (solo una vez)
    useEffect(() => {
        const storedData = tripStore.getStoredData();
        setStopovers(storedData?.stopovers || []);
        setTripData(storedData);

        const fetchVehicles = async () => {
            const result = await getUserVehicles();
            if (result.success && result.vehicle) {
                setVehicles([result.vehicle]);
                setVehicleId(result.vehicle.id.toString());
            }
        };
        fetchVehicles();
        if (!storedData.selectedRoute || !storedData.origin || !storedData.destination) {
            navigate({ to: '/publicarviaje' });
        }
    }, [navigate]);

    // useEffect para recalcular precio cuando cambian los datos del viaje o assumptions
    useEffect(() => {
        if (tripData.selectedRoute?.distance && !assumptionsLoading && assumptions) {
            calculateSuggestedPrice();
        }
    }, [tripData.selectedRoute, assumptionsLoading, assumptions]);
      

    // useEffect para cargar los porcentajes de configuración desde assumptions
    useEffect(() => {
        if (assumptions && !assumptionsLoading) {
            setPriceLimitPercentage(assumptions.price_limit_percentage);
            setAlertThresholdPercentage(assumptions.alert_threshold_percentage);
        }
    }, [assumptions, assumptionsLoading]);


    const validateForm = () => {
        if (!dateTime) {
            setFormError('Selecciona la fecha y hora del viaje');
            return false;
        }

        if (dayjs(dateTime).isBefore(dayjs(), 'minute')) {
            setFormError('La fecha y hora deben ser desde hoy en adelante');
            return false;
        }

        if (seats < 1 || seats > 6) {
            setFormError('El número de asientos debe estar entre 1 y 6');
            return false;
        }

        if (pricePerSeat <= 0) {
            setFormError('Ingresa un precio válido por asiento');
            return false;
        }

        if (!description.trim()) {
            setFormError('Agrega una descripción del viaje');
            return false;
        }

        return true;
    };

    const handlePreviewClick = () => {
        if (validateForm()) {
            setShowPreviewModal(true);
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        if (isSubmittingRef.current) return; // evita múltiples clics
        isSubmittingRef.current = true;
        setLoading(true);

        try {
            if (!tripData.selectedRoute || !tripData.origin || !tripData.destination) {
                throw new Error("Los datos del viaje son incompletos.");
            }

            const user = await getCurrentUser();
            if (!user.success || !user.user) {
                throw new Error("Usuario no autenticado");
            }

            // Calcular y verificar el balance requerido
            const requiredAmountToCheck = calculateRequiredBalance(seats, pricePerSeat);

            // Intentar congelar el balance antes de crear el viaje
            const walletCheck = await checkAndFreezeWalletBalance(requiredAmountToCheck);

            // Si no hay saldo suficiente, mostrar modal y salir
            if (walletCheck.showModal) {
                return;
            }

            // Si el congelamiento fue exitoso, mostrar mensaje y continuar con la creación del viaje
            notifications.show({
                title: 'Garantía reservada',
                message: walletCheck.message,
                color: 'green'
            });

            // Usar el servicio para publicar el viaje
            const tripPublishData = {
                origin: {
                    address: tripData.origin.address,
                    latitude: tripData.origin.coords.lat.toString(),
                    longitude: tripData.origin.coords.lng.toString(),
                    main_text: tripData.origin.mainText || tripData.origin.address,
                    place_id: tripData.origin.placeId,
                    secondary_text: tripData.origin.secondaryText
                },
                destination: {
                    address: tripData.destination.address,
                    latitude: tripData.destination.coords.lat.toString(),
                    longitude: tripData.destination.coords.lng.toString(),
                    main_text: tripData.destination.mainText || tripData.destination.address,
                    place_id: tripData.destination.placeId,
                    secondary_text: tripData.destination.secondaryText
                },
                date_time: dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss'),
                seats: Number(seats),
                price_per_seat: Number(pricePerSeat),
                description,
                allow_pets: allowPets,
                allow_smoking: allowSmoking,
                vehicle_id: Number(vehicleId),
                route_summary: tripData.selectedRoute.summary,
                estimated_duration: tripData.selectedRoute.duration,
                estimated_distance: tripData.selectedRoute.distance,
                stopovers: stopovers.map(stopover => ({
                    address: stopover.location.address,
                    latitude: stopover.location.coords.lat.toString(),
                    longitude: stopover.location.coords.lng.toString(),
                    main_text: stopover.location.mainText || stopover.location.address,
                    place_id: stopover.location.placeId,
                    secondary_text: stopover.location.secondaryText
                }))
            };

            const result = await publishTrip(tripPublishData);

            if (!result.success) {
                throw new Error(result.error || 'Error al publicar el viaje');
            }

            console.log('Viaje publicado exitosamente:', result.data);

            setShowPreviewModal(false);
            setShowSuccessModal(true);

            setTimeout(() => {
                navigate({ to: '/Actividades' });
            }, 2000);

        } catch (error: any) {
            console.error("Error durante el proceso de publicación:", error);
            setFormError(error.message || 'Error al guardar el viaje');
        } finally {
            setLoading(false);
            isSubmittingRef.current = false;
        }
    };

    // Calcular precio sugerido por cupo (siempre dividido entre 4 cupos estándar)
    const calculateSuggestedPrice = async () => {
        if (!tripData.selectedRoute?.distance || !assumptions) return;
        try {
            setLoading(true);
            const distanceMatch = tripData.selectedRoute.distance.match(/(\d+\.?\d*)/);
            const distanceKm = distanceMatch ? parseFloat(distanceMatch[1]) : 0;
            if (distanceKm > 0) {
                const isUrban = distanceKm <= 30;
                // Calcular precio total del viaje
                const totalTripPrice = await calculateTripPrice(distanceKm, isUrban);
                // Dividir siempre entre 4 cupos para obtener precio estándar por cupo
                const suggestedPricePerSeat = Math.round(totalTripPrice / 4);
                setSuggestedPrice(suggestedPricePerSeat);
                if (pricePerSeat === 0) {
                    setPricePerSeat(suggestedPricePerSeat);
                }
                validatePriceRange(pricePerSeat || suggestedPricePerSeat, suggestedPricePerSeat);
            }
        } catch (error) {
            console.error('Error calculating suggested price:', error);
        } finally {
            setLoading(false);
        }
    };

    // Función para validar el rango de precios
    const validatePriceRange = (currentPrice: number, suggested: number) => {
        if (suggested === 0) return;
        
        const percentage = ((currentPrice - suggested) / suggested) * 100;
        
        if (percentage > alertThresholdPercentage) {
            setPriceStatus('high');
        } else if (percentage < -alertThresholdPercentage) {
            setPriceStatus('low');
        } else {
            setPriceStatus('normal');
        }
    };

    // Función para manejar cambios en el precio
    const handlePriceChange = (value: number) => {
        if (suggestedPrice === 0) {
            setPricePerSeat(value);
            return;
        }
        
        // Limitar el precio usando el porcentaje dinámico
        const limitFactor = priceLimitPercentage / 100;
        const maxPrice = suggestedPrice * (1 + limitFactor);
        const minPrice = suggestedPrice * (1 - limitFactor);
        
        const limitedPrice = Math.max(minPrice, Math.min(maxPrice, value));
        setPricePerSeat(limitedPrice);
        validatePriceRange(limitedPrice, suggestedPrice);
    };

    if (!tripData.selectedRoute) return null;

    return (
        <Container fluid className={styles.container}>
            <LoadingOverlay visible={loading} />
            <div className={styles.header}>
                <UnstyledButton
                    onClick={() => navigate({ to: '/publicarviaje' })}
                    className={styles.backButton}
                >
                    <ArrowLeft size={24} />
                </UnstyledButton>
                <Title className={styles.headerTitle}>Detalles del viaje</Title>
            </div>

            <Container size="sm" className={styles.content}>
                <Card className={styles.routeCard}>
                    <Stack gap="md">
                        <Group gap="xs">
                            <Badge leftSection={<Clock size={14} />} className={styles.routeBadge}>
                                {tripData.selectedRoute.duration}
                            </Badge>
                            <Badge leftSection={<Navigation size={14} />} className={styles.routeBadge}>
                                {tripData.selectedRoute.distance}
                            </Badge>
                        </Group>

                        <div className={styles.locationInfo}>
                            <Text className={styles.locationTitle}>Origen</Text>
                            <Text className={styles.locationAddress}>
                                {tripData.origin?.address}
                            </Text>
                            <div className={styles.routeLine} />
                            <Text className={styles.locationTitle}>Destino</Text>
                            <Text className={styles.locationAddress}>
                                {tripData.destination?.address}
                            </Text>
                        </div>
                        {stopovers && stopovers.length > 0 && (
                            <div className={styles.stopoverSection}>
                                <Text fw={500} mb="sm">Paradas</Text>
                                <Group gap="md">
                                    {stopovers.map((stopover, index) => (
                                        <div key={index} className={styles.stopItem}>
                                            <MapPin size={16} className={styles.stopIcon} />
                                            <Text>
                                                {stopover.location.mainText}
                                                {stopover.location.postalCode ? ` (${stopover.location.postalCode})` : ''}
                                            </Text>
                                        </div>
                                    ))}
                                </Group>
                            </div>
                        )}
                        <Text size="sm" c="dimmed">
                            Vía {tripData.selectedRoute.summary}
                        </Text>
                    </Stack>
                </Card>

                <form onSubmit={(e) => e.preventDefault()} className={styles.form}>
                    <Stack gap="xl">
                        <div className={styles.dateTimeSection}>
                            <Card className={styles.dateCard}>
                                <Group gap="apart" mb="md">
                                    <div>
                                        <Text fw={500}>Fecha y hora del viaje</Text>
                                        <Text size="sm" c="dimmed">Selecciona cuándo saldrás</Text>
                                    </div>
                                    <Calendar size={24} className={styles.dateIcon} />
                                </Group>

                                <DateTimePicker
                                    label="Fecha y hora del viaje"
                                    description="Selecciona cuándo saldrás (solo fechas desde hoy en adelante)"
                                    placeholder="Selecciona fecha y hora"
                                    value={dateTime}
                                    onChange={setDateTime}
                                    valueFormat="DD MMM YYYY hh:mm A"
                                    locale="es"
                                    clearable={false}
                                    minDate={new Date()}
                                    required
                                    error={formError && formError.includes('fecha') ? formError : null}
                                    leftSection={<Calendar size={18} />}

                                />
                            </Card>
                        </div>
                        {vehicles.length > 0 && (
                          <Select
                            label="Vehículo"
                            placeholder="Selecciona un vehículo"
                            data={vehicles.map((v) => ({
                              value: v.id.toString(),
                              label: `${v.brand} ${v.model} (${v.plate})`,
                            }))}
                            value={vehicleId}
                            onChange={setVehicleId}
                            required
                            error={!vehicleId ? 'Selecciona un vehículo' : undefined}
                          />
                        )}

                        {/* Sección de asientos */}
                        <Card className={styles.seatsCard}>
                            <Stack gap="md">
                                <Group gap="apart" align="center">
                                    <div>
                                        <Text fw={600} size="lg">Asientos disponibles</Text>
                                        <Text size="sm" c="dimmed">Selecciona cuántos cupos ofrecerás</Text>
                                    </div>
                                    <Users size={24} className={styles.seatsIcon} />
                                </Group>
                                
                                <FormattedNumberInput
                                    value={seats}
                                    onChange={setSeats}
                                    min={1}
                                    max={6}
                                    required
                                    size="lg"
                                    leftSection={<Users size={20} />}
                                    error={formError && formError.includes('asientos') ? formError : null}
                                    className={styles.seatsInput}
                                />
                                
                                <Text size="xs" c="dimmed" className={styles.seatsHint}>
                                    El precio se calcula de forma estándar para 4 cupos, sin importar cuántos publiques
                                </Text>
                            </Stack>
                        </Card>

                        {/* Sección de precio rediseñada */}
                        <Card className={styles.priceCard}>
                            <Stack gap="lg">
                                <Group gap="apart" align="center">
                                    <div>
                                        <Text fw={600} size="lg">Configuración de precios</Text>
                                        <Text size="sm" c="dimmed">Establece el precio por cupo de tu viaje</Text>
                                    </div>
                                    <DollarSign size={24} className={styles.priceIcon} />
                                </Group>

                                {/* Información del costo estimado del viaje */}
                                {suggestedPrice > 0 && (
                                    <div className={styles.tripCostInfo}>
                                        <Text fw={500} size="md" mb="sm">💡 Análisis de costos del viaje</Text>
                                        <div className={styles.costBreakdown}>
                                            <div className={styles.costItem}>
                                                <Text size="sm" c="dimmed">Costo estimado total del viaje:</Text>
                                                <Text size="lg" fw={600} className={styles.totalCost}>
                                                    ${(suggestedPrice * 4).toLocaleString()}
                                                </Text>
                                            </div>
                                            <div className={styles.costDivider} />
                                            <div className={styles.costItem}>
                                                <Text size="sm" c="dimmed">Precio sugerido por cupo (÷4):</Text>
                                                <Text size="lg" fw={600} className={styles.suggestedCost}>
                                                    ${suggestedPrice.toLocaleString()}
                                                </Text>
                                            </div>
                                            <Text size="xs" c="dimmed" className={styles.costExplanation}>
                                                Este cálculo incluye combustible, peajes, desgaste del vehículo y otros gastos del viaje.
                                            </Text>
                                        </div>
                                    </div>
                                )}

                                {/* Input de precio con validación visual */}
                                <div className={styles.priceInputSection}>
                                    <Text fw={500} mb="xs">Tu precio por cupo</Text>
                                    <FormattedNumberInput
                                        value={pricePerSeat}
                                        onChange={handlePriceChange}
                                        min={suggestedPrice > 0 ? suggestedPrice * (1 - priceLimitPercentage / 100) : 1000}
                                        max={suggestedPrice > 0 ? suggestedPrice * (1 + priceLimitPercentage / 100) : 999999}
                                        required
                                        size="lg"
                                        leftSection={<DollarSign size={20} />}
                                        error={formError && formError.includes('precio') ? formError : null}
                                        formatter={(value) => !value ? '$ 0' : `$ ${Number.parseInt(value).toLocaleString()}`}
                                        parser={(value) => value.replace(/[^\d]/g, '')}
                                        className={`${styles.priceInput} ${
                                            priceStatus === 'high' ? styles.priceHigh : 
                                            priceStatus === 'low' ? styles.priceLow : 
                                            priceStatus === 'normal' ? styles.priceNormal : ''
                                        }`}
                                        placeholder="Ingresa tu precio"
                                    />
                                    
                                    {/* Indicador visual del precio */}
                                    {suggestedPrice > 0 && (
                                        <div className={`${styles.priceIndicator} ${styles[`priceIndicator${priceStatus.charAt(0).toUpperCase() + priceStatus.slice(1)}`]}`}>
                                            {priceStatus === 'high' && (
                                                <>
                                                    <AlertTriangle size={16} />
                                                    <Text size="sm" fw={500}>
                                                        Precio alto - ${((pricePerSeat - suggestedPrice) / suggestedPrice * 100).toFixed(0)}% por encima del sugerido
                                                    </Text>
                                                </>
                                            )}
                                            
                                            {priceStatus === 'low' && (
                                                <>
                                                    <AlertCircle size={16} />
                                                    <Text size="sm" fw={500}>
                                                        Precio bajo - ${Math.abs((pricePerSeat - suggestedPrice) / suggestedPrice * 100).toFixed(0)}% por debajo del sugerido
                                                    </Text>
                                                </>
                                            )}
                                            
                                            {priceStatus === 'normal' && (
                                                <>
                                                    <Info size={16} />
                                                    <Text size="sm" fw={500}>
                                                        Precio recomendado - Dentro del rango ideal
                                                    </Text>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Resumen de ingresos */}
                                {pricePerSeat > 0 && seats > 0 && (
                                    <div className={styles.earningsPreview}>
                                        <Text fw={500} size="md" mb="sm">📊 Resumen de ingresos</Text>
                                        <div className={styles.earningsBreakdown}>
                                            <div className={styles.earningsItem}>
                                                <Text size="sm" c="dimmed">Ingresos brutos ({seats} cupos):</Text>
                                                <Text size="md" fw={600}>
                                                    ${(pricePerSeat * seats).toLocaleString()}
                                                </Text>
                                            </div>
                                            <div className={styles.earningsItem}>
                                                <Text size="sm" c="dimmed">Comisión de la plataforma ({assumptions?.fee_percentage || 15}%):</Text>
                                                <Text size="md" fw={500} c="orange">
                                                    -${Math.round(pricePerSeat * seats * (assumptions?.fee_percentage || 15) / 100).toLocaleString()}
                                                </Text>
                                            </div>
                                            <div className={styles.earningsDivider} />
                                            <div className={styles.earningsItem}>
                                                <Text size="sm" fw={500}>Ingresos netos estimados:</Text>
                                                <Text size="lg" fw={700} className={styles.netEarnings}>
                                                    ${Math.round(pricePerSeat * seats * (1 - (assumptions?.fee_percentage || 15) / 100)).toLocaleString()}
                                                </Text>
                                            </div>
                                        </div>
                                        <Text size="xs" c="dimmed" className={styles.earningsNote}>
                                            * Los ingresos finales pueden variar según las reservas confirmadas
                                        </Text>
                                    </div>
                                )}
                            </Stack>
                        </Card>

                        <Textarea
                            label="Descripción del viaje"
                            description="Añade información importante para los pasajeros"
                            placeholder="Punto de encuentro, equipaje permitido..."
                            value={description}
                            onChange={(e) => setDescription(e.currentTarget.value)}
                            minRows={3}
                            maxRows={5}
                            required
                            error={formError && formError.includes('descripción') ? formError : null}
                        />

                        <Card className={styles.preferencesCard}>
                            <Title order={5}>Preferencias del viaje</Title>
                            <Group mt="md">
                                <Switch
                                    label="Mascotas permitidas"
                                    checked={allowPets}
                                    onChange={(e) => setAllowPets(e?.currentTarget?.checked ?? !allowPets)}
                                    size="lg"
                                />
                                <Switch
                                    label="Se permite fumar"
                                    checked={allowSmoking}
                                    onChange={(e) => setAllowSmoking(e?.currentTarget?.checked ?? !allowSmoking)}
                                    size="lg"
                                />
                            </Group>
                        </Card>

                        {formError && (
                            <Text color="red" size="sm" className={styles.errorText}>
                                {formError}
                            </Text>
                        )}

                        <Button
                            onClick={handlePreviewClick}
                            size="lg"
                            className={styles.submitButton}
                        >
                            Vista previa
                        </Button>
                    </Stack>
                </form>

                <PreviewInfo
                    isOpen={showPreviewModal}
                    onClose={() => setShowPreviewModal(false)}
                    onConfirm={handleSubmit}
                    data={{
                        tripData,
                        dateTime,
                        seats,
                        pricePerSeat,
                        description,
                        allowPets,
                        allowSmoking,
                        stopovers,
                    }}
                />

                {showSuccessModal && (
                    <Modal
                        opened={showSuccessModal}
                        onClose={() => setShowSuccessModal(false)}
                        withCloseButton={false}
                        centered
                        classNames={{
                            header: styles.modalHeader,
                            title: styles.modalTitle,
                            body: styles.modalBody,
                        }}
                    >
                        <Stack align="center" gap="md" py="xl">
                            <div className={styles.successIcon}>
                                <Check
                                    size={32}
                                    strokeWidth={2}
                                    className={styles.successCheck}
                                />
                            </div>
                            <Stack align="center" gap={4}>
                                <Text size="lg" fw={600} ta="center" className={styles.modalTitle}>
                                    ¡Viaje publicado exitosamente!
                                </Text>
                                <Text size="sm" c="dimmed" ta="center">
                                    <b>{seats} cupo{seats > 1 ? 's' : ''}</b> disponible{seats > 1 ? 's' : ''} a <b>${pricePerSeat.toLocaleString()}</b> cada uno
                                </Text>
                                <Text size="sm" c="dimmed" ta="center">
                                    Se ha congelado una garantía de <b>${calculateRequiredBalance(seats, pricePerSeat).toLocaleString()}</b> COP 
                                    ({assumptions?.fee_percentage || 0}% del valor total) como fee de publicación.
                                </Text>
                                <Text size="sm" c="dimmed" ta="center">
                                    Serás redirigido a tus viajes publicados
                                </Text>
                            </Stack>
                        </Stack>
                    </Modal>
                )}

                {/* Modal de saldo insuficiente */}
                <InsufficientBalanceModal
                    isOpen={showInsufficientBalanceModal}
                    onClose={() => setShowInsufficientBalanceModal(false)}
                    requiredAmount={requiredAmount}
                    currentBalance={currentBalance}
                />
            </Container>
        </Container>
    );
}

export const Route = createFileRoute('/DetallesViaje/')({
    component: DetallesViajeView,
});

export default DetallesViajeView;