import React from 'react';
import { Card, Stack, Text, List, Button, Group } from '@mantine/core';
import styles from './ViewPassengers.module.css';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Booking, Passenger } from '../../components/Cupos/types';

// Definir los props que se esperan para el componente
interface ViewPassengersProps {
    booking?: Booking; // Objeto de reserva que contiene pasajeros
    onClose: () => void; // Función para cerrar la vista
}

const ViewPassengers: React.FC<ViewPassengersProps> = ({ booking, onClose }) => {
    const navigate = useNavigate();

    // Verificar si no hay pasajeros en la reserva
    if (!booking || !booking.passengers || booking.passengers.length === 0) return null;

    // Manejar la navegación al ticket de un pasajero específico
    const handleViewTicket = (passenger: Passenger) => {
        navigate({
            to: `/Cupos/ViewTicket`,
            //@ts-ignore
            state: { booking, passenger, selectedBooking: booking, showPassengers: true }, // Pass selected booking data and show passengers flag
        });
    };

    return (
        <Card className={styles.detailsCard} withBorder shadow="sm" style={{ padding: '20px', borderRadius: '12px', background: 'linear-gradient(145deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', border: '1px solid rgba(0, 255, 157, 0.1)', boxShadow:'0 4px 10px rgba(0, 255, 157, 0.05)' }}>
            <Stack gap="md">
                 <Text fw={700} size="xl" mb="md" ta="center" style={{color:'#fff', lineHeight: '1.3' }}>
                      Pasajeros
                </Text>
                <List type="ordered">
                    {booking.passengers.map((passenger) => (
                        <List.Item key={passenger.passenger_id} style={{ marginBottom: '10px', borderRadius: '8px',  overflow: 'hidden'}}>
                           <div style={{backgroundColor:'#222', padding: '10px', borderLeft: '4px solid #34D399'}}>
                               <Group justify="space-between" align="center" >
                                   <Stack style={{flex: 1}}>
                                      <Text fw={600}  style={{color:'#fff'}}>{passenger.full_name}</Text>
                                       <Text size="sm" style={{color:'#ddd'}}>Identificación: {passenger.identification_number}</Text>
                                        <Text size="xs" c="dimmed">QR: {passenger.booking_qr}</Text>
                                    </Stack>
                                    <Button size="xs" onClick={() => handleViewTicket(passenger)} style={{
                                                backgroundColor: 'transparent',
                                                color: '#34D399',
                                                borderRadius: '6px',
                                                border: '1px solid #34D399',
                                                padding: '5px 10px',
                                                 transition: 'background-color 0.3s, color 0.3s',
                                                '&:hover': {
                                                    backgroundColor: '#34D399',
                                                    color: 'black'
                                                },
                                        }}>
                                        Ver Ticket
                                    </Button>
                                </Group>
                          </div>
                         </List.Item>
                    ))}
                </List>
               <Button onClick={onClose} mt="md" size="xs" fullWidth variant="outline"  style={{ borderRadius:'8px',  borderColor:'#ccc' , transition: 'background-color 0.3s, color 0.3s',  '&:hover': {
                    backgroundColor: '#f0f0f0',
                     color: '#333'
                  }}}>
                    Cerrar Pasajeros
                </Button>
            </Stack>
        </Card>
    );
};

// Crear la ruta usando createFileRoute
export const Route = createFileRoute('/Cupos/ViewPassengers')({
    component: ViewPassengers,
});

export default ViewPassengers;