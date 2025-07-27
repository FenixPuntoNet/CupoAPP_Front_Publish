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
import { getCurrentUser } from '@/services/auth';
import dayjs from 'dayjs';
import styles from './index.module.css';
import { useNavigate } from '@tanstack/react-router';


import type { Trip } from '@/types/Trip';




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
    const [bookingId, setBookingId] = React.useState<string | null>(null);
    const [isConfirming, setIsConfirming] = React.useState(false);
    const navigate = useNavigate();


    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        if (bookingId) {
            navigate({ 
                to: '/Cupos/ViewTicket',
                search: { booking_id: bookingId }
            });
        } else {
            navigate({ to: '/Actividades' });
        }
    };

    const handleConfirmReservation = async () => {
        // Prevenir múltiples clicks
        if (isConfirming) {
            console.log('Reserva ya en proceso, ignorando click adicional');
            return;
        }

        setIsConfirming(true);

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

            // Preparar datos de pasajeros
            const passengerData = passengers.map(passenger => ({
                fullName: passenger.fullName,
                identificationNumber: passenger.identificationNumber
            }));

            console.log('Iniciando proceso de reserva...', { tripId: trip.id, passengers: passengerData.length });

            const result = await bookTrip(
                Number(trip.id),
                passengerData,
                passengersCount
            );

            if (result.success && result.data) {
                console.log('Reserva creada exitosamente:', result.data);
                
                // Guardar el booking_id para redirigir al ticket
                setBookingId(result.data.booking.id.toString());
                
                // Mostrar modal de éxito
                setShowSuccessModal(true);
                
            } else {
                console.error('Error al crear reserva:', result.error);
                // En caso de error, permitir intentar de nuevo
                setIsConfirming(false);
            }

        } catch (error) {
            console.error('Error al procesar la reserva:', error);
            // En caso de error, permitir intentar de nuevo
            setIsConfirming(false);
        }
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
            {!showSuccessModal && (
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
                            disabled={passengers.some(p => !p.fullName.trim() || !p.identificationNumber.trim()) || isConfirming}
                            loading={isConfirming}
                        >
                            {isConfirming ? 'Procesando Reserva...' : 'Confirmar Reserva'}
                        </Button>
                    </Stack>
                </Modal>
            )}

            {/* Modal de éxito */}
            <Modal
                opened={showSuccessModal}
                onClose={handleSuccessModalClose}
                title=""
                size="md"
                centered
                closeOnClickOutside={false}
                withCloseButton={false}
                className={styles.successModal}
            >
                <Stack align="center" gap="lg">
                    <div className={styles.successIcon}>
                        ✅
                    </div>
                    
                    <Stack align="center" gap="xs">
                        <Text className={styles.successTitle}>
                            ¡Reserva Exitosa!
                        </Text>
                        <Text className={styles.successSubtitle}>
                            Tu reserva ha sido confirmada. Ya puedes ver tu ticket digital.
                        </Text>
                    </Stack>

                    <Card className={styles.paymentInfo} shadow="sm" withBorder w="100%">
                        <Text className={styles.paymentTitle}>
                            💳 Información de Pago
                        </Text>
                        <Text className={styles.paymentDescription}>
                            El pago se realiza directamente con el conductor mediante:
                        </Text>
                        <Stack gap="xs">
                            <div className={styles.paymentOption}>Efectivo</div>
                            <div className={styles.paymentOption}>Transferencia bancaria</div>
                            <div className={styles.paymentOption}>Nequi</div>
                            <div className={styles.paymentOption}>A conveniencia del conductor</div>
                        </Stack>
                        <Text className={styles.paymentNote}>
                            💡 Coordina el método de pago con el conductor antes del viaje
                        </Text>
                    </Card>

                    <Button
                        fullWidth
                        size="lg"
                        onClick={handleSuccessModalClose}
                        className={styles.successButton}
                    >
                        Ver Mi Ticket
                    </Button>
                </Stack>
            </Modal>
        </>
    );
};

export const Route = createFileRoute('/Reservas/TripReservationModal')({
    component: TripReservationModal,
});