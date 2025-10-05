import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
    Card,
    Group,
    Stack,
    Text,
    Badge,
    Drawer,
    NumberInput,
    TextInput,
    Button,
    Center,
    Box,
} from '@mantine/core';
import { Clock, Navigation, User } from 'lucide-react';
import { bookTrip } from '@/services/reservas';
import { createBookingWithSafePoints } from '@/services/booking-safepoints';
import { getCurrentUser } from '@/services/auth';
import TripSafePointSelector from '@/components/TripSafePointSelector/TripSafePointSelector';
import dayjs from 'dayjs';
import styles from './index.module.css';
import { useNavigate } from '@tanstack/react-router';
import ReservationSuccessModal from '@/routes/reservar/ReservationSuccessModal';

import type { Trip } from '@/types/Trip';
import type { TripSearchResult } from '@/services/trips';




interface Passenger {
    fullName: string;
    identificationNumber: string;
}

interface TripReservationModalProps {
    trip: Trip;
    isOpen: boolean;
    onClose: () => void;
}

export const TripReservationModal: React.FC<TripReservationModalProps> = ({ trip, isOpen, onClose }) => {
    const [passengersCount, setPassengersCount] = React.useState(1);
    const [passengers, setPassengers] = React.useState<Passenger[]>([]);
    const [showSuccessModal, setShowSuccessModal] = React.useState(false);
    const [isConfirming, setIsConfirming] = React.useState(false);
    const [bookingResult, setBookingResult] = React.useState<any>(null);
    const [showSafePointSelector, setShowSafePointSelector] = React.useState(false);
    const navigate = useNavigate();

    const handleSafePointsComplete = async (selectedPickupId?: number, selectedDropoffId?: number) => {
        console.log('🎯 SafePoints seleccionados, creando reserva final:', { selectedPickupId, selectedDropoffId });
        
        setIsConfirming(true);
        
        try {
            const passengerData = passengers.map(passenger => ({
                fullName: passenger.fullName,
                identificationNumber: passenger.identificationNumber
            }));

            let result;

            // Si se seleccionaron SafePoints, crear reserva CON SafePoints
            if (selectedPickupId || selectedDropoffId) {
                console.log('🎫 Creando reserva CON SafePoints seleccionados');
                result = await createBookingWithSafePoints(
                    Number(trip.id),
                    passengersCount,
                    selectedPickupId,
                    selectedDropoffId,
                    passengerData
                );
            } else {
                console.log('🎫 Creando reserva SIN SafePoints (método tradicional)');
                result = await bookTrip(
                    Number(trip.id),
                    passengerData,
                    passengersCount
                );
            }
            
            if (result.success) {
                const bookingData = (result as any).booking || (result as any).data;
                
                if (bookingData) {
                    console.log('✅ Reserva final creada:', bookingData);
                    
                    // Actualizar el resultado del booking
                    setBookingResult(bookingData);
                    setIsConfirming(false);
                    
                    // Cerrar el selector de SafePoints
                    setShowSafePointSelector(false);
                    
                    // Mostrar el modal de éxito final
                    setShowSuccessModal(true);
                } else {
                    throw new Error('No se recibieron datos de la reserva');
                }
            } else {
                throw new Error((result as any).error || 'Error creando reserva');
            }
            
        } catch (error) {
            console.error('❌ Error creando reserva final:', error);
            setIsConfirming(false);
            alert('Error creando la reserva. Por favor intenta nuevamente.');
        }
    };

    const handleConfirmReservation = async () => {
        try {
            const user = await getCurrentUser();
            if (!user.success || !user.user) {
                console.error('Usuario no autenticado');
                return;
            }
    
            if (passengersCount < 1 || passengersCount > trip.seats) {
                console.error('Cantidad de asientos inválida');
                return;
            }

            // Solo mostrar el modal de confirmación, NO crear la reserva aún
            setShowSuccessModal(true);

        } catch (error) {
            console.error('Error al procesar la solicitud:', error);
        }
    };

    const handleConfirmSuccess = async () => {
        // Solo mostrar el modal de confirmación, NO crear la reserva aún
        setShowSuccessModal(false);
        
        // Ir directamente al selector de SafePoints
        setShowSafePointSelector(true);
    };

    const handleCloseSuccess = () => {
        setShowSuccessModal(false);
        onClose();
        // Redirigir al home o reservar
        navigate({ to: '/reservar' });
    };

    // Convertir Trip a TripSearchResult para el modal de éxito
    const tripForSuccessModal: TripSearchResult = {
        id: trip.id.toString(),
        origin: trip.origin.address,
        destination: trip.destination.address,
        dateTime: trip.dateTime,
        pricePerSeat: trip.pricePerSeat,
        seats: trip.seats,
        allowPets: false,
        allowSmoking: false,
        selectedRoute: trip.selectedRoute || { duration: 'N/A', distance: 'N/A' },
        driverName: trip.driverName || 'No disponible',
        photo: trip.photo || '',
        vehicle: {
            brand: trip.vehicle?.brand || '',
            model: trip.vehicle?.model || '',
            plate: trip.vehicle?.plate || '',
            color: trip.vehicle?.color || '',
            photo_url: trip.vehicle?.photo_url || '',
            year: trip.vehicle?.year?.toString() || ''
        },
        rating: undefined
    };

    // Inicializar pasajeros cuando cambie la cantidad
    React.useEffect(() => {
        setPassengers(Array(passengersCount).fill({ fullName: '', identificationNumber: '' }));
    }, [passengersCount]);

    const handlePassengerChange = (index: number, field: keyof Passenger, value: string) => {
        setPassengers((prevPassengers) => {
            const updatedPassengers = [...prevPassengers];
            updatedPassengers[index] = {
                ...updatedPassengers[index],
                [field]: value,
            };
            return updatedPassengers;
        });
    };

    return (
        <>
            <Drawer
                opened={isOpen}
                onClose={onClose}
                title={null}
                size="85vh"
                position="bottom"
                closeOnClickOutside={false}
                withCloseButton={false}
                transitionProps={{
                    transition: 'slide-up',
                    duration: 400,
                    timingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            >
                {/* Header con gradiente y título */}
                <div
                    style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)',
                        padding: '24px 24px 20px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    {/* Patrón de fondo sutil */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: `
                                radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                                radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)
                            `,
                            pointerEvents: 'none'
                        }}
                    />
                    
                    {/* Indicador de arrastre */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '50px',
                            height: '4px',
                            background: 'rgba(255, 255, 255, 0.4)',
                            borderRadius: '2px',
                            zIndex: 1
                        }}
                    />
                    
                    {/* Botón de cierre personalizado */}
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            zIndex: 1003,
                            backgroundColor: 'rgba(239, 68, 68, 0.9)',
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.25s ease',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 1)';
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.5), 0 0 0 2px rgba(255, 255, 255, 0.3)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                        }}
                        onMouseDown={(e) => {
                            e.currentTarget.style.transform = 'scale(0.95)';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                    >
                        ✕
                    </button>
                    
                    <Text 
                        size="xl" 
                        fw={700} 
                        style={{ 
                            color: 'white', 
                            textAlign: 'center',
                            position: 'relative',
                            zIndex: 1 
                        }}
                    >
                        Reservar Viaje
                    </Text>
                </div>

                <Stack gap="md" p="lg" style={{ maxHeight: 'calc(70vh - 120px)', overflowY: 'auto' }}>
                    <Center>
                        <Card className={styles.tripSummary} shadow="sm" withBorder p="md">
                            <Group gap="apart" mb="sm">
                                <Text fw={500} size="md">
                                    {dayjs(trip.dateTime).format('DD MMM YYYY, hh:mm A')}
                                </Text>
                                <Badge color="green" size="md">
                                    ${trip.pricePerSeat.toLocaleString()} / asiento
                                </Badge>
                            </Group>

                            <Group gap="xs" mb="sm">
                                <Text size="xs" c="dimmed">Origen:</Text>
                                <Text fw={500} size="sm">{trip.origin.address}</Text>
                            </Group>
                            <Group gap="xs" mb="sm">
                                <Text size="xs" c="dimmed">Destino:</Text>
                                <Text fw={500} size="sm">{trip.destination.address}</Text>
                            </Group>

                            <Group gap="xs">
                                <Badge size="xs" leftSection={<Clock size={12} />}>
                                    {trip.selectedRoute.duration}
                                </Badge>
                                <Badge size="xs" leftSection={<Navigation size={12} />}>
                                    {trip.selectedRoute.distance}
                                </Badge>
                                <Badge size="xs" leftSection={<User size={12} />}>
                                    {trip.seats} disponibles
                                </Badge>
                            </Group>
                        </Card>
                    </Center>
                        <Card className={styles.tripSummary} shadow="sm" withBorder p="md">
                          <Group gap="md" align="start" mb="sm">
                            <img
                              src={trip.photo || 'https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/SinFotoPerfil.png'}
                              alt="Foto del conductor"
                              width={50}
                              height={50}
                              style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid #e0e0e0' }}
                            />
                            <div style={{ flex: 1 }}>
                              <Text fw={600} size="md">{trip.driverName || 'No disponible'}</Text>
                              {trip.license && (
                                <Badge size="xs" color="green" variant="light">
                                  VERIFICADO
                                </Badge>
                              )}
                            </div>
                          </Group>
                        
                          <Text fw={600} size="md" mb="sm">Vehículo</Text>
                          <Group gap="md" align="flex-start">
                            <Box style={{ width: '40%', flexShrink: 0 }}>
                              <img
                                src={trip.vehicle?.photo_url || 'https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/SinFotoAuto.png'}
                                alt="Foto del vehículo"
                                style={{ 
                                  width: '100%', 
                                  height: '80px', 
                                  borderRadius: '8px', 
                                  objectFit: 'cover', 
                                  border: '2px solid rgba(0, 255, 157, 0.3)',
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                                }}
                              />
                            </Box>
                            <Box style={{ flex: 1 }}>
                              <Text fw={500} size="sm">{trip.vehicle?.brand} {trip.vehicle?.model}</Text>
                              <Text size="xs" c="dimmed">Placa: {trip.vehicle?.plate}</Text>
                              {trip.vehicle?.color && (
                                <Text size="xs" c="dimmed">Color: {trip.vehicle.color}</Text>
                              )}
                              {trip.vehicle?.year && (
                                <Text size="xs" c="dimmed">Año: {trip.vehicle.year}</Text>
                              )}
                            </Box>
                          </Group>
                        </Card>

                    {/* Campos de pasajeros */}
                    <NumberInput
                        label="Número de asientos"
                        description="Selecciona cuántos asientos deseas reservar"
                        value={passengersCount}
                        onChange={(val) => setPassengersCount(Number(val))}
                        min={1}
                        max={trip.seats}
                        required
                        size="sm"
                        error={
                            passengersCount > trip.seats
                                ? 'No hay suficientes asientos disponibles'
                                : null
                        }
                    />

                    {/* Campos de pasajeros */}
                    {passengers.length > 0 && (
                        <Stack gap="sm">
                            <Text fw={500} size="sm">Datos de los Pasajeros</Text>
                            {passengers.map((passenger, index) => (
                                <Card key={index} className={styles.passengerCard} shadow="sm" withBorder p="sm">
                                    <Text fw={500} mb="xs" size="sm">Pasajero {index + 1}</Text>
                                    <TextInput
                                        label="Nombre completo"
                                        placeholder="Ej: Juan Pérez"
                                        value={passenger.fullName}
                                        onChange={(e) =>
                                            handlePassengerChange(index, 'fullName', e.currentTarget.value)
                                        }
                                        required
                                        mb="xs"
                                        size="sm"
                                    />
                                    <TextInput
                                        label="Número de identificación"
                                        placeholder="Ej: 123456789"
                                        value={passenger.identificationNumber}
                                        onChange={(e) => {
                                            const value = e.currentTarget.value;
                                            // Solo permitir números
                                            const numericValue = value.replace(/\D/g, '');
                                            handlePassengerChange(index, 'identificationNumber', numericValue);
                                        }}
                                        pattern="[0-9]*"
                                        inputMode="numeric"
                                        maxLength={15}
                                        required
                                        size="sm"
                                    />
                                </Card>
                            ))}
                        </Stack>
                    )}

                    <Button
                        fullWidth
                        size="md"
                        onClick={handleConfirmReservation}
                        className={styles.confirmButton}
                        disabled={passengers.some(p => !p.fullName.trim() || !p.identificationNumber.trim())}
                    >
                        Confirmar Reserva
                    </Button>
                </Stack>
            </Drawer>
            
            {/* Modal de éxito */}
            {showSuccessModal && (
                <ReservationSuccessModal
                    isOpen={showSuccessModal}
                    onClose={handleCloseSuccess}
                    trip={tripForSuccessModal}
                    passengers={passengersCount}
                    totalPrice={trip.pricePerSeat * passengersCount}
                    onConfirm={handleConfirmSuccess}
                    isConfirming={isConfirming}
                    bookingResult={bookingResult}
                />
            )}
            
            {/* Modal selector de SafePoints - APARECE ANTES DE CREAR LA RESERVA */}
            {showSafePointSelector && (
                <TripSafePointSelector
                    tripId={Number(trip.id)}
                    isOpen={showSafePointSelector}
                    onClose={() => {
                        setShowSafePointSelector(false);
                        setShowSuccessModal(true); // Volver al modal de confirmación
                    }}
                    onComplete={handleSafePointsComplete}
                />
            )}
        </>
    );
};

export const Route = createFileRoute('/Reservas/TripReservationModal')({
    component: TripReservationModal,
});