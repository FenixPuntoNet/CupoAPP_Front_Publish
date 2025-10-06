import React, { useState, useEffect } from 'react';
import { IconCalendar, IconClock, IconCheck, IconX, IconList } from '@tabler/icons-react';
import styles from './StatusSelector.module.css';

interface StatusSelectorProps {
    onSelect: (status: string | null) => void;
    selectedStatus?: string | null;
}

const StatusSelector: React.FC<StatusSelectorProps> = ({ onSelect, selectedStatus }) => {
    const [selectedOption, setSelectedOption] = useState<string>('all');

    const options = [
        { key: 'all', label: 'Todos', icon: IconList },
        { key: 'active', label: 'Activos', icon: IconCalendar },
        { key: 'inProgress', label: 'En Progreso', icon: IconClock },
        { key: 'completed', label: 'Terminados', icon: IconCheck },
        { key: 'cancelled', label: 'Cancelados', icon: IconX }
    ];

    // Update selectedOption when selectedStatus changes
    useEffect(() => {
        const statusToOption: Record<string, string> = {
            'active': 'active',     // trip.status 'active' -> UI option 'active'
            'started': 'inProgress', // trip.status 'started' -> UI option 'inProgress'
            'finished': 'completed', // trip.status 'finished' -> UI option 'completed' 
            'canceled': 'cancelled'  // trip.status 'canceled' -> UI option 'cancelled'
        };
        
        // Si selectedStatus es null, mostrar 'all'
        if (!selectedStatus) {
            setSelectedOption('all');
        } else {
            const newSelectedOption = statusToOption[selectedStatus] || 'all';
            setSelectedOption(newSelectedOption);
        }
        
        console.log('🔄 [StatusSelector] Sync:', { selectedStatus, selectedOption });
    }, [selectedStatus]);

    const handleOptionSelect = (optionKey: string) => {
        setSelectedOption(optionKey);
        
        // Map component internal keys to REAL trip status values
        const optionToStatus: Record<string, string | null> = {
            'all': null,
            'active': 'active',        // trip.status === 'active'
            'inProgress': 'started',   // trip.status === 'started' 
            'completed': 'finished',   // trip.status === 'finished'
            'cancelled': 'canceled'    // trip.status === 'canceled'
        };
        
        const statusValue = optionToStatus[optionKey] ?? null;
        console.log('🎯 [StatusSelector] Selected:', { optionKey, statusValue });
        onSelect(statusValue);
    };

    return (
        <div className={styles.statusSelector}>
            <div className={styles.buttonGroup}>
                {options.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedOption === option.key;
                    
                    return (
                        <button
                            key={option.key}
                            className={`${styles.statusButton} ${isSelected ? styles.selected : ''}`}
                            onClick={() => handleOptionSelect(option.key)}
                        >
                            <Icon size={14} />
                            <span>{option.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default StatusSelector;