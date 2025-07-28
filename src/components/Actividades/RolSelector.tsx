import type React from 'react';
import { useState, useEffect } from 'react';
import { Button, Group } from '@mantine/core';
import styles from './SrylesComponents/RolSelector.module.css';
import { getCurrentUser } from '@/services/auth';

interface RolSelectorProps {
    onSelect: (option: string) => void;
}

const RolSelector: React.FC<RolSelectorProps> = ({ onSelect }) => {
    const [selectedOption, setSelectedOption] = useState<string>('Resumen de Actividades');
    const [userType, setUserType] = useState<string | null>(null);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const result = await getCurrentUser();
                if (result.success && result.user) {
                    // Por defecto asumimos DRIVER, esto podría venir del backend
                    setUserType('DRIVER');
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }
        };

        fetchUserProfile();
    }, []); // Sin dependencias para evitar re-renderizados

    // Efecto para selección inicial - solo una vez
    useEffect(() => {
        if (!initialized && userType) {
            console.log('🎯 [RolSelector] Initial selection: Resumen de Actividades');
            onSelect('Resumen de Actividades');
            setInitialized(true);
        }
    }, [userType, initialized]); // Removemos onSelect de las dependencias

    const handleOptionSelect = (option: string) => {
        console.log('🎯 [RolSelector] Option selected:', option);
        
        if (userType === 'PASSENGER' && option === 'Viajes Publicados') {
            console.log('🚫 [RolSelector] Blocking Viajes Publicados for PASSENGER');
            return;
        }
        if (userType === 'PASSENGER' && option === 'Cupos Reservados') {
            console.log('🚫 [RolSelector] Blocking Cupos Reservados for PASSENGER');
            return;
        }
        
        setSelectedOption(option);
        onSelect(option);
    };
    return (
        <Group gap="md" mt="md">
            <Button 
                onClick={() => handleOptionSelect('Resumen de Actividades')}
                className={`${styles.button} ${selectedOption === 'Resumen de Actividades' ? styles.selected : ''}`}
            >
                📊 Resumen
            </Button>
            <Button 
                onClick={() => handleOptionSelect('Cupos Creados')}
                className={`${styles.button} ${selectedOption === 'Cupos Creados' ? styles.selected : ''}`}
            >
                🎫 Cupos Reservados
            </Button>
            <Button 
                onClick={() => handleOptionSelect('Viajes Publicados')}
                className={`${styles.button} ${selectedOption === 'Viajes Publicados' ? styles.selected : ''}`}
            >
                🚗 Viajes Publicados
            </Button>
        </Group>
    );
};

export default RolSelector;