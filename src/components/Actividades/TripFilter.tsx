import type React from 'react';
import { Select, Text } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import styles from './SrylesComponents/TripFilter.module.css';
import type { Trip } from './Actividades';

interface TripFilterProps {
  trips: Trip[];
  filterValue: string | null;
  onFilterChange: (value: string | null) => void;
  statusFilter: string | null;
  onStatusFilterChange: (value: string | null) => void;
  dateFilter: Date | null;
  onDateFilterChange: (date: Date | null) => void;
}

const TripFilter: React.FC<TripFilterProps> = ({
  trips,
  filterValue,
  onFilterChange,
  statusFilter,
  onStatusFilterChange,
  dateFilter,
  onDateFilterChange,
}) => {
  return (
    <div className={styles.filterContainer}>
      <Text className={styles.filterLabel}>Filtrar por:</Text>

      <Select
        placeholder="Origen o destino"
        value={filterValue}
        onChange={onFilterChange}
        data={Array.from(
          new Set(
            trips.flatMap((trip) => [
              trip.origin.address,
              trip.destination.address,
            ]),
          ),
        )}
        clearable
        searchable
        className={styles.filterSelect}
      />

      <Select
        placeholder="Estado del viaje"
        value={statusFilter}
        onChange={onStatusFilterChange}
        data={[
          { value: 'pending', label: 'Pendiente' }, // agruparemos A y pending bajo este filtro
          { value: 'progress', label: 'En progreso' },
          { value: 'finished', label: 'Finalizado' },
          { value: 'canceled', label: 'Cancelado' },
        ]}
        clearable
        className={styles.filterSelect}
      />


      <DateTimePicker
        placeholder="Fecha de viaje"
        value={dateFilter}
        onChange={onDateFilterChange}
        clearable
        locale="es"
        className={styles.filterSelect}
      />
    </div>
  );
};

export default TripFilter;
