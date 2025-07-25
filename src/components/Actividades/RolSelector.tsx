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
        // Seleccionar por defecto el resumen
        onSelect('Resumen de Actividades');
    }, [onSelect]);

    const handleOptionSelect = (option: string) => {
        if (userType === 'PASSENGER' && option === 'Viajes Publicados') {
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