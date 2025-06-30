import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
    Stack,
    Text,
    Container,
    Button
} from '@mantine/core';
import { getFromLocalStorage } from '../../types/PublicarViaje/localStorageHelper';
import { TripReservationModal } from './TripReservationModal';
import styles from './index.module.css';

import type { Trip } from '@/types/Trip';

const ReservasView = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = React.useState(true);
    const trip = getFromLocalStorage<Trip>('currentTrip');

    const handleClose = () => {
        setIsModalOpen(false);
        navigate({ to: '/reservar' });
    };

    if (!trip) {
        return (
            <Container className={styles.errorContainer}>
                <Stack align="center" gap="md">
                    <Text size="lg" fw={500}>No se encontró información del viaje</Text>
                    <Button onClick={() => navigate({ to: '/reservar' })}>
                        Volver a búsqueda
                    </Button>
                </Stack>
            </Container>
        );
    }

    return (
        <TripReservationModal
            trip={trip}
            isOpen={isModalOpen}
            onClose={handleClose}
        />
    );
};

export const Route = createFileRoute('/Reservas/')({
    component: ReservasView
});