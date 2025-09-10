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
import { usePublishTripClick } from '@/hooks/useSingleClick';
import { useClarity, useClarityTracking } from '@/hooks/useClarity';
import PublishTripCosts from '@/components/pricing/PublishTripCosts';
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
import { getCurrentWallet, checkBalanceForTripPublish } from '@/services/wallet';
import { getUserVehicles } from '@/services/vehicles';
import { useAssumptions } from '../../hooks/useAssumptions';
import { 
    calculateTripPriceViaBackend as calculatePriceViaBackend, 
    type PriceCalculationResult 
} from '../../services/config';

interface FormattedNumberInputProps extends Omit<NumberInputProps, 'onChange'> {
    onChange: (value: number) => void;
    formatter?: (value: string) => string;
    parser?: (value: string) => string;
}

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isProcessing?: boolean;
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


const PreviewInfo: React.FC<PreviewModalProps> = ({ isOpen, onClose, onConfirm, isProcessing = false, data }) => {
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
                        loading={isProcessing}
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Publicando...' : 'Confirmar y publicar'}
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
    const [walletInfo, setWalletInfo] = useState<{totalBalance: number, frozenBalance: number, availableBalance: number} | null>(null);
    
    // Obtener información detallada del wallet cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            console.log('💰 [MODAL] Modal abierto, obteniendo información detallada del wallet...');
            getCurrentWallet().then(response => {
                if (response.success && response.data) {
                    const totalBalance = response.data.balance || 0;
                    const frozenBalance = response.data.frozen_balance || 0;
                    const availableBalance = Math.max(0, totalBalance - frozenBalance);
                    
                    console.log('💰 [MODAL] Información detallada del wallet:', {
                        totalBalance,
                        frozenBalance,
                        availableBalance,
                        currentBalance_prop: currentBalance,
                        requiredAmount
                    });
                    
                    setWalletInfo({
                        totalBalance,
                        frozenBalance,
                        availableBalance
                    });
                } else {
                    console.error('❌ [MODAL] Error obteniendo información detallada del wallet:', response.error);
                    setWalletInfo(null);
                }
            }).catch(error => {
                console.error('❌ [MODAL] Error en useEffect del modal:', error);
                setWalletInfo(null);
            });
        }
    }, [isOpen]);

    const handleRechargeWallet = () => {
        window.location.href = 'https://www.cupo.lat/login';
    };

    // Usar la información detallada del wallet si está disponible
    const displayBalance = walletInfo ? walletInfo.totalBalance : currentBalance; // Usar saldo TOTAL como "disponible"
    const hasDetailedInfo = walletInfo !== null;
    const deficit = Math.max(0, requiredAmount - displayBalance);

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
                        {displayBalance === 0 && hasDetailedInfo && walletInfo.frozenBalance > 0 && (
                            <Text size="sm" mt="xs" c="yellow" fw={500}>
                                Nota: Tienes ${walletInfo.frozenBalance.toLocaleString()} congelados de viajes anteriores que se liberarán cuando se completen.
                            </Text>
                        )}
                        {displayBalance === 0 && (!hasDetailedInfo || walletInfo.frozenBalance === 0) && (
                            <Text size="sm" mt="xs" c="blue">
                                Si recientemente tuviste viajes, es posible que tengas fondos congelados que se liberarán automáticamente cuando esos viajes se completen.
                            </Text>
                        )}
                    </Text>

                    <Card className={styles.balanceCard} mb="lg">
                        <Stack gap="sm">
                            {hasDetailedInfo && walletInfo.frozenBalance > 0 && (
                                <>
                                    <Group justify="space-between">
                                        <Text size="sm" c="dimmed">Fondos congelados:</Text>
                                        <Text size="sm" fw={500} c="orange">${walletInfo.frozenBalance.toLocaleString()}</Text>
                                    </Group>
                                    <div className={styles.divider} />
                                </>
                            )}
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">Tu saldo total:</Text>
                                <Text size="sm" fw={500}>${displayBalance.toLocaleString()}</Text>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">Monto requerido:</Text>
                                <Text size="sm" fw={500} c="red">${requiredAmount.toLocaleString()}</Text>
                            </Group>
                            <div className={styles.divider} />
                            <Group justify="space-between">
                                <Text size="sm" fw={600}>Necesitas recargar:</Text>
                                <Text size="sm" fw={600} c="orange">
                                    ${deficit.toLocaleString()}
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
                            {hasDetailedInfo && walletInfo.frozenBalance > 0 && (
                                <Text size="xs" c="dimmed" mt="xs" fw={500}>
                                    Los fondos congelados actuales (${walletInfo.frozenBalance.toLocaleString()}) se liberarán cuando tus viajes activos se completen.
                                </Text>
                            )}
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

import { migrateAllPendingDataToTrip, cleanupOldPendingData } from '@/services/backend-integration';

const DetallesViajeView = () => {
    const navigate = useNavigate();
    
    // Clarity tracking hooks
    const { setCustomTag } = useClarity({
        autoTrackPageViews: true,
        userProperties: {
            page_type: 'trip_details',
            flow: 'publish_trip'
        }
    });
    const { trackButtonClick, trackFormSubmit } = useClarityTracking();
    
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
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [vehicleId, setVehicleId] = useState<string | null>(null);

    // Hook para assumptions (solo para mostrar en UI si es necesario)
    const { assumptions, loading: assumptionsLoading } = useAssumptions();

    // Hook para prevenir múltiples clicks en publicar viaje
    const publishTripClick = usePublishTripClick(async () => {
        await performPublishTrip();
    });


    // Cálculo de garantía dinámica según assumptions (ahora incluye tarifa fija POR CUPO)
    const calculateRequiredBalance = (seats: number, pricePerSeat: number): number => {
        if (!assumptions) {
            console.log('⚠️ calculateRequiredBalance: assumptions no cargado, retornando 0');
            return 0;
        }
        const totalTripValue = seats * pricePerSeat;
        const percentageFee = Math.ceil(totalTripValue * ((assumptions.fee_percentage || 0) / 100));
        const fixedRatePerSeat = assumptions.fixed_rate || 0;
        const totalFixedRate = fixedRatePerSeat * seats; // Tarifa fija POR CUPO
        const totalRequired = percentageFee + totalFixedRate;
        
        console.log('💰 calculateRequiredBalance DEBUG:', {
            seats,
            pricePerSeat,
            totalTripValue,
            fee_percentage: assumptions.fee_percentage,
            percentageFee,
            fixed_rate: assumptions.fixed_rate,
            fixedRatePerSeat,
            totalFixedRate,
            totalRequired: totalRequired.toLocaleString()
        });
        
        return totalRequired;
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

    // useEffect para recalcular precio SOLO cuando cambian los datos del viaje
    useEffect(() => {
        if (tripData.selectedRoute?.distance) {
            console.log('🔄 [DETALLES] Trip data changed, recalculating via backend...');
            calculateSuggestedPrice();
        }
    }, [tripData.selectedRoute]);
      

    // useEffect para cargar los porcentajes de configuración desde assumptions
    useEffect(() => {
        if (assumptions && !assumptionsLoading) {
            console.log('📊 ASSUMPTIONS cargado:', {
                fee_percentage: assumptions.fee_percentage,
                fixed_rate: assumptions.fixed_rate,
                price_limit_percentage: assumptions.price_limit_percentage,
                alert_threshold_percentage: assumptions.alert_threshold_percentage
            });
            setPriceLimitPercentage(assumptions.price_limit_percentage);
            setAlertThresholdPercentage(assumptions.alert_threshold_percentage);
        } else if (assumptionsLoading) {
            console.log('⏳ ASSUMPTIONS cargando...');
        } else {
            console.log('❌ ASSUMPTIONS no disponible');
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
        trackButtonClick('preview_trip');
        setCustomTag('trip_seats', seats.toString());
        setCustomTag('trip_price', pricePerSeat.toString());
        
        if (validateForm()) {
            setShowPreviewModal(true);
        }
    };

    // Handlers con tracking para interacciones del usuario
    const handleSeatsChange = (value: number) => {
        setSeats(value);
        setCustomTag('seats_selected', value.toString());
        trackButtonClick('change_seats', value.toString());
    };

    const handleDateTimeChange = (date: Date | null) => {
        setDateTime(date);
        if (date) {
            setCustomTag('trip_date_set', 'true');
            trackButtonClick('set_date');
        }
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDescription(e.currentTarget.value);
        if (e.currentTarget.value.length > 0) {
            setCustomTag('description_added', 'true');
        }
    };

    const handlePetsToggle = (checked: boolean) => {
        setAllowPets(checked);
        setCustomTag('allow_pets', checked.toString());
        trackButtonClick('toggle_pets', checked.toString());
    };

    const handleSmokingToggle = (checked: boolean) => {
        setAllowSmoking(checked);
        setCustomTag('allow_smoking', checked.toString());
        trackButtonClick('toggle_smoking', checked.toString());
    };

    // Función que contiene toda la lógica de publicación del viaje
    const performPublishTrip = async () => {
        if (!validateForm()) return;
        setLoading(true);

        // Tracking del intento de publicación
        trackFormSubmit('publish_trip_attempt');
        setCustomTag('trip_distance', tripData.selectedRoute?.distance?.toString() || '0');
        setCustomTag('trip_duration', tripData.selectedRoute?.duration?.toString() || '0');

        try {
            if (!tripData.selectedRoute || !tripData.origin || !tripData.destination) {
                throw new Error("Los datos del viaje son incompletos.");
            }

            const user = await getCurrentUser();
            if (!user.success || !user.user) {
                throw new Error("Usuario no autenticado");
            }

            // ✅ NUEVA VERIFICACIÓN: Comprobar saldo ANTES de intentar publicar
            console.log('💰 [PUBLISH] Verificando saldo antes de publicar viaje...');
            const balanceCheck = await checkBalanceForTripPublish(seats, pricePerSeat);
            
            if (!balanceCheck.success) {
                throw new Error(balanceCheck.error || 'Error verificando saldo');
            }

            if (!balanceCheck.hasSufficientBalance) {
                console.log('💰 [PUBLISH] Saldo insuficiente detectado en verificación previa');
                console.log('💰 [PUBLISH] Mostrando modal de saldo insuficiente directamente');
                
                setRequiredAmount(balanceCheck.requiredAmount);
                setCurrentBalance(balanceCheck.totalBalance);
                setShowInsufficientBalanceModal(true);
                return; // No continuar con la publicación
            }

            console.log('✅ [PUBLISH] Verificación de saldo exitosa, procediendo con la publicación');

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
                // SI EL BACKEND DEVUELVE ERROR, verificar si es de saldo insuficiente
                const errorMessage = result.error || '';
                console.log('🔍 [ERROR] Received error from backend:', errorMessage);
                
                // Detectar errores de saldo insuficiente de manera más robusta
                const isSaldoInsuficiente = (
                    errorMessage.toLowerCase().includes('saldo') ||
                    errorMessage.toLowerCase().includes('balance') ||
                    errorMessage.toLowerCase().includes('fondos') ||
                    errorMessage.toLowerCase().includes('insuficiente') ||
                    errorMessage.toLowerCase().includes('disponible') ||
                    errorMessage.toLowerCase().includes('wallet') ||
                    errorMessage.toLowerCase().includes('billetera') ||
                    errorMessage.toLowerCase().includes('garantía') ||
                    errorMessage.toLowerCase().includes('garantia') ||
                    errorMessage.toLowerCase().includes('dinero') ||
                    errorMessage.toLowerCase().includes('money') ||
                    errorMessage.toLowerCase().includes('insufficient') ||
                    errorMessage.toLowerCase().includes('recargar') ||
                    errorMessage.toLowerCase().includes('funds')
                );
                
                if (isSaldoInsuficiente) {
                    console.log('💰 [MODAL] Error de saldo detectado. Mensaje:', errorMessage);
                    
                    // Calcular la cantidad requerida para mostrar en el modal
                    const requiredAmount = calculateRequiredBalance(seats, pricePerSeat);
                    
                    // Obtener el wallet actual para mostrar los saldos
                    try {
                        console.log('💰 [MODAL] Obteniendo información actualizada del wallet...');
                        const walletData = await getCurrentWallet();
                        if (walletData.success && walletData.data) {
                            const totalBalance = walletData.data.balance || 0;
                            const frozenBalance = walletData.data.frozen_balance || 0;
                            const availableBalance = Math.max(0, totalBalance - frozenBalance);
                            
                            console.log(`💰 [MODAL] Información del wallet obtenida:`, {
                                total_balance: totalBalance,
                                frozen_balance: frozenBalance,
                                calculated_available: availableBalance,
                                required_amount: requiredAmount,
                                deficit_from_total: Math.max(0, requiredAmount - totalBalance),
                                modal_will_show: true,
                                note: 'Using total_balance as displayBalance per user specification'
                            });
                            
                            console.log(`💰 [MODAL] Mostrando modal de saldo insuficiente:`);
                            console.log(`    - Saldo total (mostrado como disponible): $${totalBalance.toLocaleString()}`);
                            console.log(`    - Saldo congelado (informativo): $${frozenBalance.toLocaleString()}`);
                            console.log(`    - Monto requerido: $${requiredAmount.toLocaleString()}`);
                            console.log(`    - Necesita recargar: $${Math.max(0, requiredAmount - totalBalance).toLocaleString()}`);
                            console.log(`    - Nota: Usando saldo total como base para cálculo según especificación`);
                            
                            setRequiredAmount(requiredAmount);
                            setCurrentBalance(totalBalance); // Usar el saldo TOTAL como "disponible" según especificación
                            setShowInsufficientBalanceModal(true);
                            
                            // Log para confirmar que el estado se estableció
                            setTimeout(() => {
                                console.log(`💰 [MODAL] Modal state after setState - Modal debería estar visible ahora`);
                                console.log(`💰 [MODAL] Estados finales:`, {
                                    requiredAmount: requiredAmount,
                                    currentBalance: totalBalance, // Ahora usa saldo total
                                    showModal: true,
                                    deficit: Math.max(0, requiredAmount - totalBalance)
                                });
                            }, 100);
                            
                            return; // Salir sin mostrar error genérico
                        } else {
                            console.error('❌ [MODAL] Error obteniendo wallet:', walletData.error);
                            // Fallback: mostrar modal con información limitada
                            console.log('💰 [MODAL] Usando fallback para mostrar modal...');
                            setRequiredAmount(requiredAmount);
                            setCurrentBalance(0); // Mostrar 0 como saldo total si no se puede obtener
                            setShowInsufficientBalanceModal(true);
                            return;
                        }
                    } catch (walletError) {
                        console.error('❌ [MODAL] Error obteniendo wallet para modal:', walletError);
                        // Fallback: mostrar modal con información limitada  
                        console.log('💰 [MODAL] Usando fallback por error en wallet...');
                        setRequiredAmount(requiredAmount);
                        setCurrentBalance(0); // Mostrar 0 como saldo total si hay error
                        setShowInsufficientBalanceModal(true);
                        return;
                    }
                }
                
                throw new Error(result.error || 'Error al publicar el viaje');
            }

            console.log('✅ Viaje publicado exitosamente:', result.data);

            // 🚀 MIGRACIÓN AUTOMÁTICA: Migrar SafePoints y paradas pendientes
            if (result.data?.trip_id) {
                console.log('🔄 Iniciando migración automática de datos pendientes...');
                console.log('🎯 MIGRATION DEBUG: Trip published successfully, starting data migration:', {
                    trip_id: result.data.trip_id,
                    timestamp: new Date().toISOString(),
                    migration_target: 'SafePoints and Stopovers',
                    backend_integration_function: 'migrateAllPendingDataToTrip'
                });
                
                try {
                    // 1. MIGRACIÓN INTELIGENTE con filtro temporal
                    console.log('📞 MIGRATION: Calling migrateAllPendingDataToTrip...');
                    const migrationResult = await migrateAllPendingDataToTrip(result.data.trip_id);
                    
                    console.log('📋 MIGRATION RESULT RECEIVED:', {
                        success: migrationResult.success,
                        total_updated: migrationResult.total_updated,
                        safepoints_success: migrationResult.migrations.safepoints.success,
                        safepoints_count: migrationResult.migrations.safepoints.updated_count,
                        safepoints_error: migrationResult.migrations.safepoints.error,
                        stopovers_success: migrationResult.migrations.stopovers.success,
                        stopovers_count: migrationResult.migrations.stopovers.updated_count,
                        stopovers_error: migrationResult.migrations.stopovers.error,
                        overall_message: migrationResult.message
                    });
                    
                    // 2. LIMPIEZA AUTOMÁTICA de datos antiguos (en background)
                    cleanupOldPendingData().catch(error => {
                        console.warn('⚠️ Background cleanup had issues:', error);
                    });
                    
                    // Con el backend corregido, siempre será success=true
                    if (migrationResult.success) {
                        console.log('🎉 MIGRACIÓN COMPLETADA:', {
                            safepoints_migrated: migrationResult.migrations.safepoints.updated_count,
                            stopovers_migrated: migrationResult.migrations.stopovers.updated_count,
                            total_migrated: migrationResult.total_updated,
                            message: migrationResult.message
                        });
                        
                        if (migrationResult.total_updated > 0) {
                            notifications.show({
                                title: '🎉 Viaje publicado y datos migrados',
                                message: `Garantía congelada exitosamente. ${migrationResult.total_updated} elementos recientes migrados.`,
                                color: 'green',
                                autoClose: 5000
                            });
                        } else {
                            notifications.show({
                                title: '✅ Viaje publicado exitosamente',
                                message: 'Garantía congelada exitosamente. Tu viaje está activo y disponible para reservas.',
                                color: 'green',
                                autoClose: 4000
                            });
                        }
                        
                        // Verificar si hubo advertencias (errores no críticos)
                        if (migrationResult.error) {
                            console.warn('⚠️ ADVERTENCIAS EN MIGRACIÓN:', migrationResult.error);
                            
                            notifications.show({
                                title: 'ℹ️ Información adicional',
                                message: 'Algunos servicios auxiliares tuvieron problemas menores',
                                color: 'blue',
                                autoClose: 3000
                            });
                        }
                    }
                } catch (migrationError) {
                    console.error('❌ ERROR EN MIGRACIÓN:', migrationError);
                    
                    // La migración falló, pero el viaje ya se creó exitosamente
                    notifications.show({
                        title: '✅ Viaje creado exitosamente',
                        message: 'Garantía congelada exitosamente. Tu viaje está activo. Algunos datos auxiliares se migrarán automáticamente.',
                        color: 'green',
                        autoClose: 5000
                    });
                }
            }

            setShowPreviewModal(false);
            setShowSuccessModal(true);

            // Tracking del éxito de publicación
            trackFormSubmit('publish_trip_success', true);
            setCustomTag('trip_published', 'true');

            setTimeout(() => {
                navigate({ to: '/Actividades' });
            }, 2000);

        } catch (error: any) {
            console.error("Error durante el proceso de publicación:", error);
            const errorMessage = error.message || 'Error al guardar el viaje';
            setFormError(errorMessage);
            
            // Tracking del error
            trackFormSubmit('publish_trip_error', false);
            setCustomTag('error_type', 'publish_trip');
            
            // Mostrar notificación de error con información sobre la garantía
            notifications.show({
                title: '❌ Error al publicar viaje',
                message: `${errorMessage}. Nota: Si se congeló una garantía, será liberada automáticamente.`,
                color: 'red',
                autoClose: 7000
            });
        } finally {
            setLoading(false);
        }
    };

    // Nueva función handleSubmit que usa el hook de protección
    const handleSubmit = async () => {
        await publishTripClick.execute();
    };

    // Calcular precio usando EXCLUSIVAMENTE el backend
    const calculateSuggestedPrice = async () => {
        if (!tripData.selectedRoute?.distance) return;
        
        try {
            setLoading(true);
            
            console.log('� [DETALLES] Calling BACKEND for price calculation:', tripData.selectedRoute.distance);
            
            // Usar EXCLUSIVAMENTE el backend con assumptions
            const backendResult: PriceCalculationResult | null = await calculatePriceViaBackend(tripData.selectedRoute.distance);
            
            if (backendResult) {
                console.log('🎉 [DETALLES] Backend result received:', {
                    distance_km: backendResult.distance_km,
                    is_urban: backendResult.is_urban,
                    price_per_km: backendResult.price_per_km,
                    total_trip_price: backendResult.total_trip_price,
                    suggested_price_per_seat: backendResult.suggested_price_per_seat
                });
                
                // Usar DIRECTAMENTE los valores del backend
                const suggestedPricePerSeat = backendResult.suggested_price_per_seat;
                
                console.log('💰 [DETALLES] Setting suggested price from backend:', suggestedPricePerSeat);
                setSuggestedPrice(suggestedPricePerSeat);
                
                // Si no hay precio establecido, usar el del backend
                if (pricePerSeat === 0) {
                    setPricePerSeat(suggestedPricePerSeat);
                }
                
                // Validar rango usando el precio del backend
                validatePriceRange(pricePerSeat || suggestedPricePerSeat, suggestedPricePerSeat);
                
                console.log('✅ [DETALLES] Price configuration completed');
            } else {
                console.error('❌ [DETALLES] No result from backend calculation');
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
        // Tracking de cambio de precio
        setCustomTag('price_modified', 'true');
        setCustomTag('new_price', value.toString());
        
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
        
        // Tracking del estado del precio
        if (limitedPrice !== value) {
            setCustomTag('price_limited', 'true');
        }
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
                                    onChange={handleDateTimeChange}
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
                                    onChange={handleSeatsChange}
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
                                                <Text size="sm" c="dimmed">Comisión porcentual ({assumptions?.fee_percentage || 15}%):</Text>
                                                <Text size="md" fw={500} c="orange">
                                                    -${Math.round(pricePerSeat * seats * (assumptions?.fee_percentage || 15) / 100).toLocaleString()}
                                                </Text>
                                            </div>
                                            <div className={styles.earningsItem}>
                                                <Text size="sm" c="dimmed">Tarifa fija de servicio ({seats} cupo{seats > 1 ? 's' : ''} × ${(assumptions?.fixed_rate || 0).toLocaleString()}):</Text>
                                                <Text size="md" fw={500} c="orange">
                                                    -${((assumptions?.fixed_rate || 0) * seats).toLocaleString()}
                                                </Text>
                                            </div>
                                            <div className={styles.earningsDivider} />
                                            <div className={styles.earningsItem}>
                                                <Text size="sm" fw={500}>Ingresos netos estimados:</Text>
                                                <Text size="lg" fw={700} className={styles.netEarnings}>
                                                    ${(pricePerSeat * seats - Math.round(pricePerSeat * seats * (assumptions?.fee_percentage || 15) / 100) - ((assumptions?.fixed_rate || 0) * seats)).toLocaleString()}
                                                </Text>
                                            </div>
                                        </div>
                                        <Text size="xs" c="dimmed" className={styles.earningsNote}>
                                            * Los ingresos finales pueden variar según las reservas confirmadas
                                        </Text>
                                    </div>
                                )}

                                {/* Desglose de costos de publicación */}
                                {pricePerSeat > 0 && seats > 0 && assumptions && (
                                    <div style={{ marginTop: '16px' }}>
                                        <PublishTripCosts
                                            costs={{
                                                tripValue: pricePerSeat * seats,
                                                percentageFee: Math.ceil(pricePerSeat * seats * ((assumptions.fee_percentage || 0) / 100)),
                                                fixedRate: (assumptions.fixed_rate || 0) * seats, // Tarifa fija POR CUPO
                                                totalGuarantee: calculateRequiredBalance(seats, pricePerSeat),
                                                breakdown: `${assumptions.fee_percentage || 0}% ($${Math.ceil(pricePerSeat * seats * ((assumptions.fee_percentage || 0) / 100)).toLocaleString()}) + Tarifa fija (${seats} × $${(assumptions.fixed_rate || 0).toLocaleString()}) = $${calculateRequiredBalance(seats, pricePerSeat).toLocaleString()}`
                                            }}
                                            assumptions={assumptions}
                                            seats={seats}
                                        />
                                    </div>
                                )}
                            </Stack>
                        </Card>

                        <Textarea
                            label="Descripción del viaje"
                            description="Añade información importante para los pasajeros"
                            placeholder="Punto de encuentro, equipaje permitido..."
                            value={description}
                            onChange={handleDescriptionChange}
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
                                    onChange={(e) => handlePetsToggle(e?.currentTarget?.checked ?? !allowPets)}
                                    size="lg"
                                />
                                <Switch
                                    label="Se permite fumar"
                                    checked={allowSmoking}
                                    onChange={(e) => handleSmokingToggle(e?.currentTarget?.checked ?? !allowSmoking)}
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
                    isProcessing={publishTripClick.isProcessing || loading}
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
                                    (incluye {assumptions?.fee_percentage || 0}% del valor total + tarifa fija de ${(assumptions?.fixed_rate || 0).toLocaleString()}) como fee de publicación.
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