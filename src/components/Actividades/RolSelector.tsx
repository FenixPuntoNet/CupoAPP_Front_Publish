import type React from 'react';
import { useState, useEffect } from 'react';
import { Button, Group } from '@mantine/core';
import styles from './SrylesComponents/RolSelector.module.css';
import { supabase } from '@/lib/supabaseClient';

interface RolSelectorProps {
    onSelect: (option: string) => void;
}

const RolSelector: React.FC<RolSelectorProps> = ({ onSelect }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [userType, setUserType] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user?.id) return;

                const { data: profile, error } = await supabase
                    .from('user_profiles')
                    .select('status')  // Cambiado de user_type a status
                    .eq('user_id', session.user.id)
                    .single();

                if (error) throw error;
                setUserType(profile?.status || null);  // Usando status en lugar de user_type
                
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }
        };

        fetchUserProfile();
    }, []);

    const handleOptionSelect = (option: string) => {
        // Actualizando las comprobaciones para usar PASSENGER del campo status
        if (userType === 'PASSENGER' && option === 'Viajes Publicados') {
            return;
        }
        if (userType === 'PASSENGER' && option === "Cupos Creados") {
            onSelect(option);
            return;
        }
        setSelectedOption(option);
        onSelect(option);
    };


    return (
        <Group gap="md" mt="md">
            <Button 
                onClick={() => handleOptionSelect('Cupos Creados')}
                className={`${styles.button} ${selectedOption === 'Cupos Creados' ? styles.selected : ''}`}
            >
                Cupos Reservados
            </Button>
            <Button 
                onClick={() => handleOptionSelect('Viajes Publicados')}
                className={`${styles.button} ${selectedOption === 'Viajes Publicados' ? styles.selected : ''}`}
            >
                Viajes Publicados
            </Button>
        </Group>
    );
};

export default RolSelector;