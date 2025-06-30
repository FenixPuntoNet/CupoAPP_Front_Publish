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
} from 'lucide-react';
import type { MantineTheme, } from '@mantine/core';
import { DateTimePicker, } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { tripStore, type TripData, type TripStopover } from '../../types/PublicarViaje/TripDataManagement';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import styles from './index.module.css';
import { supabase } from '@/lib/supabaseClient';

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
                                        <Text size="sm" fw={500}>Asientos</Text>
                                        <Text size="xl" fw={600}>{data.seats}</Text>
                                    </div>
                                </Group>
                            </Card>

                            <Card className={styles.infoCard}>
                                <Group gap="sm">
                                    <DollarSign className={styles.infoIcon} />
                                    <div>
                                        <Text size="sm" fw={500}>Precio por asiento</Text>
                                        <Text size="xl" fw={600}>
                                            ${data.pricePerSeat.toLocaleString()}
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
    const [description, setDescription] = useState<string>('');
    const [allowPets, setAllowPets] = useState<boolean>(false);
    const [allowSmoking, setAllowSmoking] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
    const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
    const [dateTime, setDateTime] = useState<Date | null>(null);
    const [stopovers, setStopovers] = useState<TripStopover[]>([]);
    const [loading, setLoading] = useState(false);
    const isSubmittingRef = useRef(false);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [vehicleId, setVehicleId] = useState<string | null>(null);


    const calculateRequiredBalance = (seats: number, pricePerSeat: number): number => {
        const totalTripValue = seats * pricePerSeat;
        return Math.ceil(totalTripValue * 0.15); // 15% del valor total del viaje
    };

    const checkAndFreezeWalletBalance = async (userId: string, requiredAmount: number) => {
        try {
          const { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('id, balance, frozen_balance')
            .eq('user_id', userId)
            .single();
      
          if (walletError) throw walletError;
          if (!wallet) {
            throw new Error('No tienes una billetera activa. Por favor, recarga tu billetera primero.');
          }
      
          const availableBalance = (wallet.balance || 0) - (wallet.frozen_balance || 0);
          if (availableBalance < requiredAmount) {
            throw new Error(`Saldo insuficiente. Necesitas $${requiredAmount.toLocaleString()} disponibles en tu billetera para crear este viaje. Tu saldo disponible es $${availableBalance.toLocaleString()}`);
          }
      
          // Actualizar balance y frozen_balance
          const { error: updateError } = await supabase
            .from('wallets')
            .update({
              balance: (wallet.balance ?? 0) - requiredAmount,
              frozen_balance: (wallet.frozen_balance || 0) + requiredAmount
            })
            .eq('id', wallet.id);
      
          if (updateError) throw updateError;
      
          // Registrar transacción tipo "congelado"
          const { error: insertError } = await supabase
            .from('wallet_transactions')
            .insert([{
              wallet_id: wallet.id,
              transaction_type: 'congelado',
              amount: requiredAmount,
              detail: 'Monto congelado al publicar viaje',
              status: 'completed',
              payment_gateway_id: null
            }]);
      
          if (insertError) throw insertError;
      
          return {
            success: true,
            message: `Se han congelado $${requiredAmount.toLocaleString()} de tu billetera como garantía para este viaje.`
          };
        } catch (error: any) {
          console.error('Error checking wallet:', error);
          throw error;
        }
      };
      

    useEffect(() => {
        const storedData = tripStore.getStoredData();
        setStopovers(storedData?.stopovers || []);
        console.log("Datos del viaje en Detalles (al cargar el componente):", storedData);
        setTripData(storedData);
      
        const fetchVehicles = async () => {
          const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
      
          if (sessionError || !sessionData?.user) {
            console.error('Usuario no autenticado o error al obtener sesión:', sessionError?.message);
            return;
          }
      
          const { user } = sessionData;
      
          const { data, error } = await supabase
            .from('vehicles')
            .select('id, brand, model, plate')
            .eq('user_id', user.id);
      
          if (error) {
            console.error('Error obteniendo vehículos:', error.message);
            return;
          }
      
          setVehicles(data);
          if (data.length === 1) {
            setVehicleId(data[0].id.toString());
          }
        };
      
        fetchVehicles();
      
        if (!storedData.selectedRoute || !storedData.origin || !storedData.destination) {
          navigate({ to: '/publicarviaje' });
        }
    }, [navigate]);
      


    const validateForm = () => {
        if (!dateTime) {
            setFormError('Selecciona la fecha y hora del viaje');
            return false;
        }

        if (dayjs(dateTime).isBefore(dayjs())) {
            setFormError('La fecha y hora deben ser posteriores al momento actual');
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

    const getOrCreateLocation = async (locationData: any) => {
        try {
            // Primero intentar obtener la ubicación existente
            const { data: existingLocation, } = await supabase
                .from('locations')
                .select('*')
                .eq('place_id', locationData.place_id)
                .single();

            if (existingLocation) {
                console.log('Location found:', existingLocation);
                return existingLocation;
            }

            // Si no existe, crear nueva ubicación
            const { data: newLocation, error: insertError } = await supabase
                .from('locations')
                .insert({
                    place_id: locationData.place_id,
                    address: locationData.address,
                    latitude: locationData.latitude,
                    longitude: locationData.longitude,
                    postal_code: locationData.postal_code,
                    main_text: locationData.main_text,
                    secondary_text: locationData.secondary_text,
                    user_id: locationData.user_id
                })
                .select()
                .single();

            if (insertError) throw insertError;
            return newLocation;
        } catch (error) {
            console.error('Error in getOrCreateLocation:', error);
            throw error;
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

            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) {
                throw new Error("Usuario no autenticado");
            }

            // Calcular y verificar el balance requerido
            const requiredAmount = calculateRequiredBalance(seats, pricePerSeat);

            // Intentar congelar el balance antes de crear el viaje
            const walletCheck = await checkAndFreezeWalletBalance(session.user.id, requiredAmount);

            // Si el congelamiento fue exitoso, mostrar mensaje y continuar con la creación del viaje
            notifications.show({
                title: 'Garantía reservada',
                message: walletCheck.message,
                color: 'green'
            });

            // 1. Verificar si el usuario ya tiene rutas
            const { count: routeCount } = await supabase
                .from('routes')
                .select('*', { count: 'exact' })
                .eq('user_id', session.user.id);

            // 2. Obtener o crear ubicaciones
            const [originLocation, destinationLocation] = await Promise.all([
                getOrCreateLocation({
                    place_id: tripData.origin.placeId,
                    address: tripData.origin.address,
                    latitude: tripData.origin.coords.lat.toString(),
                    longitude: tripData.origin.coords.lng.toString(),
                    postal_code: tripData.origin.postalCode || null,
                    main_text: tripData.origin.mainText || null,
                    secondary_text: tripData.origin.secondaryText || null,
                    user_id: session.user.id
                }),
                getOrCreateLocation({
                    place_id: tripData.destination.placeId,
                    address: tripData.destination.address,
                    latitude: tripData.destination.coords.lat.toString(),
                    longitude: tripData.destination.coords.lng.toString(),
                    postal_code: tripData.destination.postalCode || null,
                    main_text: tripData.destination.mainText || null,
                    secondary_text: tripData.destination.secondaryText || null,
                    user_id: session.user.id
                })
            ]);

            // 3. Crear la ruta con índice y bounds simplificados
            console.log('Bounds structure:', tripData.selectedRoute.bounds);
            console.log('Tipo de dato de bounds:', typeof tripData.selectedRoute.bounds);

            const routeData = {
                user_id: session.user.id,
                index: routeCount ? routeCount + 1 : 1,
                distance: tripData.selectedRoute.distance,
                duration: tripData.selectedRoute.duration,
                start_address: tripData.selectedRoute.startAddress,
                end_address: tripData.selectedRoute.endAddress,
                summary: tripData.selectedRoute.summary,
                polyline: tripData.selectedRoute.polyline || null,
                bounds_ne_lat: 0,
                bounds_ne_lng: 0,
                bounds_sw_lat: 0,
                bounds_sw_lng: 0
            };

            // Intentar extraer la información de los límites
            try {
                if (tripData.selectedRoute.bounds) {
                    // Asumiendo que bounds es un objeto con northEast y southWest
                    if (typeof tripData.selectedRoute.bounds === 'string') {
                        // Si es una cadena JSON, parsearla
                        tripData.selectedRoute.bounds = JSON.parse(tripData.selectedRoute.bounds);
                    }

                    const northEast = tripData.selectedRoute.bounds.getNorthEast();
                    const southWest = tripData.selectedRoute.bounds.getSouthWest();
                    routeData.bounds_ne_lat = Number(northEast.lat() || 0);
                    routeData.bounds_ne_lng = Number(northEast.lng() || 0);
                    routeData.bounds_sw_lat = Number(southWest.lat() || 0);
                    routeData.bounds_sw_lng = Number(southWest.lng() || 0);
                } else {
                    console.warn('No se encontraron límites para la ruta.');
                }
            } catch (error) {
                console.error('Error al procesar los límites:', error);
            }

            console.log('Route data a insertar:', routeData);

            const { data: route, error: routeError } = await supabase
                .from('routes')
                .insert([routeData])
                .select()
                .single();

            if (routeError) {
                console.error('Route insertion error:', routeError);
                throw routeError;
            }

            // 4. Crear el viaje (corregido para CHAR(1))
            const tripDetails = {
                user_id: session.user.id,
                origin_id: originLocation.id,
                destination_id: destinationLocation.id,
                route_id: route.id,
                date_time: dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss'),
                seats: Number(seats),
                price_per_seat: Number(pricePerSeat),
                description,
                vehicle_id: Number(vehicleId),
                allow_pets: allowPets ? 'Y' : 'N',      // Cambiado a CHAR(1)
                allow_smoking: allowSmoking ? 'Y' : 'N', // Cambiado a CHAR(1)
                status: 'pending',
                created_at: new Date().toISOString()
            };

            console.log('Trip details to insert:', tripDetails); // Para debugging

            const { data: newTrip, error: tripError } = await supabase
                .from('trips')
                .insert([tripDetails])
                .select()
                .single();

            if (tripError) {
                console.error('Trip insertion error:', tripError);
                throw tripError;
            }
              
            // Crear el chat vinculado al nuevo trip
            const { data: newChat, error: chatError } = await supabase
              .from('chats')
              .insert([{ trip_id: newTrip.id }])
              .select()
              .single();
            
            if (chatError) {
              console.error('Chat creation error:', chatError);
              throw chatError;
            }
            
            // ➕ Insertar conductor como participante en el chat
            const { error: participantError } = await supabase
              .from('chat_participants')
              .insert([{
                chat_id: newChat.id,
                user_id: session.user.id,
                role: 'driver'
              }]);
            
            if (participantError) {
              console.error('Error al agregar conductor al chat:', participantError);
              throw participantError;
            }
          
              
            // 5. Procesar paradas con índices secuenciales
            if (stopovers && stopovers.length > 0) {
                const stopoverPromises = stopovers.map(async (stopover, index) => {
                    const stopLocation = await getOrCreateLocation({
                        place_id: stopover.location.placeId,
                        address: stopover.location.address,
                        latitude: stopover.location.coords.lat.toString(),
                        longitude: stopover.location.coords.lng.toString(),
                        postal_code: stopover.location.postalCode || null,
                        main_text: stopover.location.mainText || null,
                        secondary_text: stopover.location.secondaryText || null,
                        user_id: session.user.id
                    });

                    return supabase
                        .from('stopovers')
                        .insert({
                            trip_id: newTrip.id,
                            location_id: stopLocation.id,
                            order: index + 1,
                            user_id: session.user.id,
                            estimated_time: '5 minutes'
                        });
                });

                await Promise.all(stopoverPromises);
            }

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
                                    description="Selecciona cuándo saldrás"
                                    placeholder="Selecciona fecha y hora"
                                    value={dateTime}
                                    onChange={setDateTime}
                                    valueFormat="DD MMM YYYY hh:mm A"
                                    locale="es"
                                    clearable={false}
                                    minDate={dayjs().add(1, 'day').toDate()}
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

                        <Group grow>
                            <FormattedNumberInput
                                label="Asientos disponibles"
                                description="Máximo 6 asientos"
                                value={seats}
                                onChange={setSeats}
                                min={1}
                                max={6}
                                required
                                leftSection={<Users size={18} />}
                                error={formError && formError.includes('asientos') ? formError : null}
                            />

                            <FormattedNumberInput
                                label="Precio por asiento"
                                description="En COP"
                                value={pricePerSeat}
                                onChange={setPricePerSeat}
                                min={1000}
                                required
                                leftSection={<DollarSign size={18} />}
                                error={formError && formError.includes('precio') ? formError : null}
                                formatter={(value) => !value ? '$ 0' : `$ ${Number.parseInt(value).toLocaleString()}`}
                                parser={(value) => value.replace(/[^\d]/g, '')}
                            />
                        </Group>

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
                                    onChange={(e) => setAllowPets(e.currentTarget.checked)}
                                    size="lg"
                                />
                                <Switch
                                    label="Se permite fumar"
                                    checked={allowSmoking}
                                    onChange={(e) => setAllowSmoking(e.currentTarget.checked)}
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
                                    Serás redirigido a tus viajes publicados
                                </Text>
                            </Stack>
                        </Stack>
                    </Modal>
                )}
            </Container>
        </Container>
    );
}

export const Route = createFileRoute('/DetallesViaje/')({
    component: DetallesViajeView,
});

export default DetallesViajeView;