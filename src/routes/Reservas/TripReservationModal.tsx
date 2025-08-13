import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
    Card,
    Group,
    Stack,
    Text,
    Badge,
    Modal,
    NumberInput,
    TextInput,
    Button,
    Center,
} from '@mantine/core';
import { Clock, Navigation, User } from 'lucide-react';
import { bookTrip } from '@/services/reservas';
import { createBookingWithSafePoints } from '@/services/booking-safepoints';
import { getCurrentUser } from '@/services/auth';
import TripSafePointSelector from '@/components/TripSafePointSelector/TripSafePointSelector';
import dayjs from 'dayjs';
import styles from './index.module.css';
import { useNavigate } from '@tanstack/react-router';
import ReservationSuccessModal from '@/components/ReservationSuccessModal';

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
            <Modal
                opened={isOpen}
                onClose={onClose}
                title="Reservar Viaje"
                size="lg"
                centered
                closeOnClickOutside={false}
            >
                <Stack gap="xl">
                    <Center>
                        <Card className={styles.tripSummary} shadow="sm" withBorder>
                            <Group gap="apart">
                                <Text fw={500} size="lg">
                                    {dayjs(trip.dateTime).format('DD MMM YYYY, hh:mm A')}
                                </Text>
                                <Badge color="green" size="lg">
                                    ${trip.pricePerSeat.toLocaleString()} / asiento
                                </Badge>
                            </Group>

                            <div className={styles.routeInfo}>
                                <Text c="dimmed" size="sm">
                                    Origen
                                </Text>
                                <Text fw={500}>{trip.origin.address}</Text>
                                <div className={styles.routeDivider} />
                                <Text c="dimmed" size="sm">
                                    Destino
                                </Text>
                                <Text fw={500}>{trip.destination.address}</Text>
                            </div>

                            <Group mt="md">
                                <Badge leftSection={<Clock size={14} />}>
                                    {trip.selectedRoute.duration}
                                </Badge>
                                <Badge leftSection={<Navigation size={14} />}>
                                    {trip.selectedRoute.distance}
                                </Badge>
                                <Badge leftSection={<User size={14} />}>
                                    {trip.seats} disponibles
                                </Badge>
                            </Group>
                        </Card>
                    </Center>
                        <Card className={styles.tripSummary} shadow="sm" withBorder>
                          <Text fw={600} size="lg" mb="xs">Información del Conductor</Text>
                          <Group gap="md" align="start">
                            <img
                              src={trip.photo || 'https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/SinFotoPerfil.png'}
                              alt="Foto del conductor"
                              width={60}
                              height={60}
                              style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid #e0e0e0' }}
                            />
                            <div>
                              <Text fw={500}>{trip.driverName || 'No disponible'}</Text>
                        
                              {trip.license && (
                                <>
                                  <Text size="sm" c="dimmed">Licencia: {trip.license.license_number}</Text>
                                  <Text size="sm" c="dimmed">Categoría: {trip.license.license_category}</Text>
                                  <Text size="sm" c="yellow">
                                    Válida hasta: {dayjs(trip.license.expiration_date).format('DD/MM/YYYY')}
                                  </Text>
                                  <Badge mt={4} color="green" variant="light">
                                    VERIFICADO
                                  </Badge>
                                </>
                              )}
                            </div>
                          </Group>
                        
                          <div className={styles.routeDivider} />
                        
                          <Text fw={600} size="lg" mt="md" mb="xs">Vehículo</Text>
                          <Group gap="md" align="start">
                            <img
                              src={trip.vehicle?.photo_url || 'https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/SinFotoAuto.png'}
                              alt="Foto del vehículo"
                              width={90}
                              height={60}
                              style={{ borderRadius: 8, objectFit: 'cover', border: '2px solid #eee' }}
                            />
                            <div>
                              <Text fw={500}>{trip.vehicle?.brand} {trip.vehicle?.model} - {trip.vehicle?.plate}</Text>
                              {trip.vehicle?.color && (
                                <Text size="sm" c="dimmed">Color: {trip.vehicle.color}</Text>
                              )}
                              {trip.vehicle?.year && (
                                <Text size="sm" c="dimmed">Año: {trip.vehicle.year}</Text>
                              )}
                              {trip.propertyCard?.passager_capacity && (
                                <Text size="sm">Capacidad: {trip.propertyCard.passager_capacity} pasajeros</Text>
                              )}
                              {trip.soat && (
                                <Text size="sm" c="yellow">
                                  SOAT válido hasta: {dayjs(trip.soat.validity_to).format('DD/MM/YYYY')}
                                </Text>
                              )}
                            </div>
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
                        error={
                            passengersCount > trip.seats
                                ? 'No hay suficientes asientos disponibles'
                                : null
                        }
                    />

                    {/* Campos de pasajeros */}
                    {passengers.length > 0 && (
                        <Stack gap="md">
                            <Text fw={500} size="md">Datos de los Pasajeros</Text>
                            {passengers.map((passenger, index) => (
                                <Card key={index} className={styles.passengerCard} shadow="sm" withBorder>
                                    <Text fw={500} mb="xs">Pasajero {index + 1}</Text>
                                    <TextInput
                                        label="Nombre completo"
                                        placeholder="Ej: Juan Pérez"
                                        value={passenger.fullName}
                                        onChange={(e) =>
                                            handlePassengerChange(index, 'fullName', e.currentTarget.value)
                                        }
                                        required
                                        mb="sm"
                                    />
                                    <TextInput
                                        label="Número de identificación (solo números)"
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
                                    />
                                </Card>
                            ))}
                        </Stack>
                    )}

                    <Button
                        fullWidth
                        size="lg"
                        onClick={handleConfirmReservation}
                        className={styles.confirmButton}
                        disabled={passengers.some(p => !p.fullName.trim() || !p.identificationNumber.trim())}
                    >
                        Confirmar Reserva
                    </Button>
                </Stack>
            </Modal>
            
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