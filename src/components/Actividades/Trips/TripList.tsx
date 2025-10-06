import React, { useMemo } from 'react';
import CompactTripCard from './CompactTripCard';
import { Stack, Text } from '@mantine/core';
import styles from '../index.module.css';
import type { Trip } from '../Actividades.tsx';
import { sortTripsByPriority } from '../utils/tripSorting';

interface TripListProps {
  trips: Trip[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

const TripList: React.FC<TripListProps> = ({ trips }) => {
  // 🚀 ORDENAMIENTO INTELIGENTE POR PRIORIDAD
  const sortedTrips = useMemo(() => {
    console.log('🔄 [TripList] Applying intelligent sorting to trips:', {
      inputTrips: trips.length,
      withNotifications: trips.filter(t => (t.seats_reserved || 0) > 0 && t.status === 'active').length
    });
    
    const sorted = sortTripsByPriority(trips);
    
    console.log('✅ [TripList] Trips sorted successfully:', {
      outputTrips: sorted.length,
      firstTripStatus: sorted[0]?.status,
      firstTripHasNotifications: sorted[0] ? (sorted[0].seats_reserved || 0) > 0 : false
    });
    
    return sorted;
  }, [trips]);

  if (trips.length === 0) {
    return (
      <Text className={styles.noTripsText}>
        No se encontraron viajes con el filtro seleccionado.
      </Text>
    );
  }
    
  return (
    <Stack gap="sm">
      {sortedTrips.map((trip) => (
        <CompactTripCard
          userId={'0'}
          key={trip.id}
          trip={trip}
        />
      ))}
    </Stack>
  );
};

export default TripList;