import type React from 'react';
import { useState, useEffect } from 'react';
import { Text } from '@mantine/core';
import { IconChartBar, IconTicket, IconCar } from '@tabler/icons-react';
import styles from './RolSelector.module.css';
import { getCurrentUser } from '@/services/auth';

interface RolSelectorProps {
    onSelect: (option: string) => void;
    selectedActivity?: string; // ✅ NUEVO: Recibir el estado del componente padre
}

const RolSelector: React.FC<RolSelectorProps> = ({ onSelect, selectedActivity }) => {
    const [selectedOption, setSelectedOption] = useState<string>('Resumen de Actividades');
    const [userType, setUserType] = useState<string | null>(null);
    const [initialized, setInitialized] = useState(false);

    // ✅ MEJORADO: Sincronizar con el estado del padre de forma más robusta
    useEffect(() => {
        if (selectedActivity && selectedActivity !== selectedOption) {
            console.log('🔄 [RolSelector] Syncing with parent state:', selectedActivity, 'current:', selectedOption);
            setSelectedOption(selectedActivity);
        }
    }, [selectedActivity, selectedOption]); // Agregamos selectedOption para detectar cambios

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
            // Si hay una actividad preseleccionada desde el prop, usarla
            const initialActivity = selectedActivity || 'Resumen de Actividades';
            console.log(`🎯 [RolSelector] Initial selection: ${initialActivity}`);
            console.log(`🎯 [RolSelector] UserType: ${userType}, Initialized: ${initialized}`);
            
            setSelectedOption(initialActivity);
            onSelect(initialActivity);
            setInitialized(true);
        }
    }, [userType, initialized, selectedActivity, onSelect]); // Agregamos onSelect para evitar problemas de dependencias

    const handleOptionSelect = (option: string) => {
        console.log('🎯 [RolSelector] Option selected:', option);
        console.log('🎯 [RolSelector] Current userType:', userType);
        console.log('🎯 [RolSelector] Current selectedOption:', selectedOption);
        
        // ✅ CORREGIDO: Solo bloquear para PASSENGER específico, y solo ciertas opciones
        if (userType === 'PASSENGER' && option === 'Viajes Publicados') {
            console.log('🚫 [RolSelector] Blocking Viajes Publicados for PASSENGER');
            return;
        }
        // ✅ REMOVIDO: No bloquear "Cupos Reservados" para ningún usuario
        // Todos los usuarios pueden ver sus cupos reservados
        
        console.log('✅ [RolSelector] Allowing navigation to:', option);
        setSelectedOption(option);
        onSelect(option);
    };
    const options = [
        {
            key: 'Resumen de Actividades',
            label: 'Resumen',
            icon: IconChartBar,
            disabled: false
        },
        {
            key: 'Cupos Creados',
            label: 'Mis Cupos',
            icon: IconTicket,
            disabled: false
        },
        {
            key: 'Viajes Publicados',
            label: 'Mis Viajes',
            icon: IconCar,
            disabled: userType === 'PASSENGER'
        }
    ];

    return (
        <div className={styles.segmentedContainer}>
            <div className={styles.segmentedControl}>
                {/* Sliding background indicator */}
                <div 
                    className={styles.segmentedIndicator}
                    style={{
                        transform: `translateX(${options.findIndex(opt => opt.key === selectedOption) * 100}%)`,
                        width: `${100 / options.length}%`
                    }}
                />
                
                {/* Option buttons */}
                {options.map((option) => {
                    const Icon = option.icon;
                    return (
                        <button
                            key={option.key}
                            className={`${styles.segmentedOption} ${
                                selectedOption === option.key ? styles.segmentedSelected : ''
                            } ${option.disabled ? styles.segmentedDisabled : ''}`}
                            onClick={() => !option.disabled && handleOptionSelect(option.key)}
                            disabled={option.disabled}
                        >
                            <Icon size={16} className={styles.segmentedIcon} />
                            <Text size="sm" fw={500} className={styles.segmentedLabel}>
                                {option.label}
                            </Text>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default RolSelector;