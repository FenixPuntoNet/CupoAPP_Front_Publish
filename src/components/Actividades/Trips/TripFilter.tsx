import type React from 'react';
import { Select, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconCalendar } from '@tabler/icons-react';
import styles from './TripFilter.module.css';
import type { Trip } from '../Actividades';

interface TripFilterProps {
  trips: Trip[];
  filterValue: string | null;
  onFilterChange: (value: string | null) => void;
  dateFilter: Date | null;
  onDateFilterChange: (date: Date | null) => void;
}

const TripFilter: React.FC<TripFilterProps> = ({
  trips,
  filterValue,
  onFilterChange,
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

      <DatePickerInput
        placeholder="Seleccionar fecha"
        value={dateFilter}
        onChange={onDateFilterChange}
        locale="es"
        className={styles.filterSelect}
        firstDayOfWeek={1}
        weekdayFormat="short"
        clearable
        leftSection={<IconCalendar size={16} />}
        popoverProps={{ withinPortal: true }}
      />
    </div>
  );
};

export default TripFilter;
