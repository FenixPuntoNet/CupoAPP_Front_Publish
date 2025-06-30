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
import { supabase } from '@/lib/supabaseClient';
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

function generateShortUniqueCode(length = 6) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    
  }
  return code;
}

export const TripReservationModal: React.FC<TripReservationModalProps> = ({ trip, isOpen, onClose }) => {
    const [passengersCount, setPassengersCount] = React.useState(1);
    const [passengers, setPassengers] = React.useState<Passenger[]>([]);
    const [currentStep, setCurrentStep] = React.useState<'confirm' | 'passengers' | 'finalize'>('confirm');
    const [bookingId, setBookingId] = React.useState<number | null>(null);
    const navigate = useNavigate();


    const handleConfirmReservation = async () => {
        const userId = localStorage.getItem('userId');
    
        if (!userId) {
            console.error('No se encontró el ID del usuario en localStorage. Por favor, inicia sesión.');
            return;
        }
    
        if (passengersCount < 1 || passengersCount > trip.seats) {
            console.error('Cantidad de asientos inválida. Por favor, verifica los campos.');
            return;
        }
    
        const bookingQr = generateShortUniqueCode();
        const bookingData = {
            trip_id: Number(trip.id), // Convertir a número si es string
            user_id: userId,
            seats_booked: passengersCount,
            total_price: passengersCount * trip.pricePerSeat,
            booking_status: 'pending',
            booking_qr: bookingQr,
            booking_date: dayjs().toISOString(),
        };
    
        try {
            const { data: bookings, error: bookingError } = await supabase
                .from('bookings')
                .insert(bookingData)
                .select();
    
            if (bookingError) {
                console.error('Error al crear la reserva en bookings:', bookingError);
                return;
            }
    
            const booking = bookings?.[0];
            if (!booking) {
                console.error('No se pudo obtener el booking después de la inserción.');
                return;
            }
    
            console.log('Reserva creada con éxito en bookings:', booking);
            setBookingId(booking.id); // Guardar el ID del booking
            setPassengers(Array(passengersCount).fill({ fullName: '', identificationNumber: '' }));
            setCurrentStep('passengers');
        } catch (error) {
            console.error('Error al procesar la reserva:', error);
        }
    };

    const handleSavePassengers = () => {
        // Validar que todos los pasajeros tengan datos completos
        for (const passenger of passengers) {
            if (!passenger.fullName || !passenger.identificationNumber) {
                console.error('Todos los pasajeros deben tener nombre e identificación.');
                return;
            }
        }

        setCurrentStep('finalize'); // Pasar a la subvista de confirmación
    };

    const handleFinalizeReservation = async () => {
        if (!bookingId) {
            console.error('No se encontró el ID del booking. No se puede continuar.');
            return;
        }
    
        const userId = localStorage.getItem('userId'); // Asegúrate de obtener userId aquí
    
        if (!userId) {
            console.error('No se encontró el ID del usuario en localStorage. Por favor, inicia sesión.');
            return;
        }
    
        try {
            console.log('Intentando actualizar el estado del booking con ID:', bookingId);
    
            // Actualizar el estado del booking a "reserved"
            const { data: updatedBooking, error: bookingUpdateError } = await supabase
                .from('bookings')
                .update({ booking_status: 'reserved' })
                .eq('id', bookingId)
                .select();
    
            if (bookingUpdateError) {
                console.error('Error al actualizar el estado del booking:', bookingUpdateError);
                return;
            }
    
            console.log('Estado del booking actualizado a "reserved":', updatedBooking);
    
            // Actualizar los asientos disponibles en la tabla trips
            const { data: tripData, error: tripError } = await supabase
                .from('trips')
                .select('seats, seats_reserved')
                .eq('id', Number(trip.id)) // Asegúrate de que trip.id sea un número
                .single();
    
            if (tripError || !tripData) {
                console.error('Error al obtener los datos del viaje:', tripError);
                return;
            }
    
            if (tripData.seats === null) {
                console.error('El número de asientos no está disponible.');
                return;
            }
    
            // Calcular los nuevos valores de seats_reserved y seats
            const newSeatsReserved = (tripData.seats_reserved || 0) + passengersCount;
            const newSeatsAvailable = tripData.seats - passengersCount;
    
            // Actualizar los valores en la tabla trips
            const { error: tripUpdateError } = await supabase
                .from('trips')
                .update({ seats_reserved: newSeatsReserved, seats: newSeatsAvailable })
                .eq('id', Number(trip.id));
    
            if (tripUpdateError) {
                console.error('Error al actualizar los asientos del viaje:', tripUpdateError);
                return;
            }
    
            console.log('Asientos actualizados en el viaje:', {
                seats_reserved: newSeatsReserved,
                seats: newSeatsAvailable,
            });

            // Preparar los datos de los pasajeros
            const passengerData = passengers.map((passenger) => ({
                booking_id: bookingId,
                full_name: passenger.fullName,
                identification_number: passenger.identificationNumber,
                user_id: userId,
                status: 'confirmed',
              }));
              
              // Insertar los pasajeros en Supabase y obtener sus IDs
              const { data: insertedPassengers, error: passengerError } = await supabase
                .from('booking_passengers')
                .insert(passengerData)
                .select();
              
              if (passengerError || !insertedPassengers?.length) {
                console.error('Error al crear los pasajeros en booking_passengers:', passengerError);
                return;
              }
              
              console.log('Pasajeros creados con éxito en booking_passengers');
              
              // Buscar el pasajero vinculado al usuario actual
              const userPassenger = insertedPassengers.find((p) => p.user_id === userId);
              
              if (!userPassenger) {
                console.error('No se encontró un pasajero asociado al usuario actual.');
                return;
              }

              // Buscar el chat relacionado al trip
            const { data: chatData, error: chatError } = await supabase
             .from('chats')
             .select('id')
             .eq('trip_id', Number(trip.id))
             .single();
            
            if (chatError || !chatData) {
            console.error('Error al obtener el chat del viaje:', chatError);
            return;
            }
            
            // Insertar al usuario como participante (rol passenger)
            const { error: participantInsertError } = await supabase
             .from('chat_participants')
             .insert([{
               chat_id: chatData.id,
               user_id: userId,
               role: 'passenger',
            }]);
            
            if (participantInsertError) {
            console.error('Error al agregar al usuario al chat:', participantInsertError);
            return;
            }
            
            console.log('Usuario agregado al chat como pasajero');
            
              
              // Redirigir al ticket con solo los parámetros necesarios
              navigate({
                to: '/Cupos/ViewTicket',
                search: { booking_id: bookingId.toString() }, // ✅ solo booking_id como string
              });     
            
        } catch (error) {
            console.error('Error al procesar la reserva:', error);
        }
    };

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
                opened={isOpen && currentStep === 'confirm'}
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

                    <Button
                        fullWidth
                        size="lg"
                        onClick={handleConfirmReservation}
                        className={styles.confirmButton}
                    >
                        Confirmar Reserva
                    </Button>
                </Stack>
            </Modal>

            <Modal
                opened={isOpen && currentStep === 'passengers'}
                onClose={onClose}
                title="Datos de los Pasajeros"
                size="lg"
                centered
                closeOnClickOutside={false}
            >
                <Stack gap="xl">
                    {passengers.map((passenger, index) => (
                        <Card key={index} shadow="sm" withBorder>
                            <Text fw={500}>Pasajero {index + 1}</Text>
                            <TextInput
                                label="Nombre completo"
                                placeholder="Ej: Juan Pérez"
                                value={passenger.fullName}
                                onChange={(e) =>
                                    handlePassengerChange(index, 'fullName', e.currentTarget.value)
                                }
                                required
                            />
                            <TextInput
                                label="Número de identificación"
                                placeholder="Ej: 123456789"
                                value={passenger.identificationNumber}
                                onChange={(e) =>
                                    handlePassengerChange(index, 'identificationNumber', e.currentTarget.value)
                                }
                                required
                            />
                        </Card>
                    ))}

                    <Button
                        fullWidth
                        size="lg"
                        onClick={handleSavePassengers}
                        className={styles.confirmButton}
                    >
                        Confirmar Pasajeros
                    </Button>
                </Stack>
            </Modal>

            <Modal
                opened={isOpen && currentStep === 'finalize'}
                onClose={onClose}
                title="Confirmar Reserva"
                size="lg"
                centered
                closeOnClickOutside={false}
            >
                <Stack gap="xl">
                    <Text>
                        Está a punto de confirmar su reserva. Recuerde que debe realizar el pago
                        directamente con el conductor (en efectivo, Nequi o Bancolombia).
                    </Text>
                    <Button
                        fullWidth
                        size="lg"
                        onClick={handleFinalizeReservation}
                        className={styles.confirmButton}
                    >
                        Reservar
                    </Button>
                </Stack>
            </Modal>
        </>
    );
};

export const Route = createFileRoute('/Reservas/TripReservationModal')({
    component: TripReservationModal,
});