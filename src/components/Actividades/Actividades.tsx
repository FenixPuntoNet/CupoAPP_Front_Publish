// Actividades.tsx

import React, { useState, useEffect } from 'react';
import { Container, Title, Text, LoadingOverlay, Button } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { showNotification } from '@mantine/notifications';
import dayjs from 'dayjs';
import RolSelector from './RolSelector';
import TripFilter from './TripFilter';
import Cupos from '../../routes/Cupos';
import styles from './index.module.css';
import TripCard from './TripCard';
import { supabase } from '@/lib/supabaseClient';

export interface Trip {
  id: number;
  origin: { address: string };
  destination: { address: string };
  date: string;
  time: string;
  duration: string;
  distance: string;
  seats: number;
  seats_reserved: number;
  pricePerSeat: number;
  description: string;
  allowPets: boolean;
  allowSmoking: boolean;
  is_active: boolean;
  user_id: string;
  date_time: string;
  status: string;
}

interface UserProfile {
  user_id: string;
  email: string;
  phone_number: string | null;
  first_name: string;
  last_name: string;
  identification_type: string;
  identification_number: string | null;
  user_type: string;
}

const Actividades: React.FC = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [filterValue, setFilterValue] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const ActivityType = {
    VIAJES: 'Viajes Publicados',
    CUPOS: 'Cupos Creados',
  } as const;
  type ActivityType = 'Viajes Publicados' | 'Cupos Creados' | null;
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: '/Login' });
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (error) throw error;

        setUserProfile({
          ...data,
          email: session.user.email || '',
          user_type: data.status,
        });
      } catch (error: any) {
        console.error('Error fetching user profile:', error);
        showNotification({
          title: 'Error',
          message: error.message,
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [navigate]);

  useEffect(() => {
    const loadTrips = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate({ to: '/Login' });
          return;
        }

        const { data: tripsData, error } = await supabase
          .from('trips')
          .select(`
            id,
            created_at,
            seats,
            seats_reserved,
            price_per_seat,
            description,
            allow_pets,
            allow_smoking,
            status,
            user_id,
            route_id,
            routes (
              duration,
              distance,
              summary
            ),
            origin:locations!trips_origin_id_fkey (
              address
            ),
            destination:locations!trips_destination_id_fkey (
              address
            )
          `)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedTrips = tripsData.map((trip) => ({
          id: trip.id || 0,
          origin: {
            address: trip.origin?.address || 'Dirección no disponible',
          },
          destination: {
            address: trip.destination?.address || 'Dirección no disponible',
          },
          date: trip.created_at
            ? new Date(trip.created_at).toLocaleDateString()
            : new Date().toLocaleDateString(),
          time: trip.created_at
            ? new Date(trip.created_at).toLocaleTimeString()
            : new Date().toLocaleTimeString(),
          duration: trip.routes?.duration || 'Desconocida',
          distance: trip.routes?.distance || 'Desconocida',
          seats: trip.seats || 0,
          seats_reserved: Number(trip.seats_reserved) || 0,
          pricePerSeat: trip.price_per_seat || 0,
          description: trip.description || '',
          allowPets: trip.allow_pets === 'Y',
          allowSmoking: trip.allow_smoking === 'Y',
          is_active: trip.status === 'A',
          user_id: trip.user_id || '',
          date_time: trip.created_at || new Date().toISOString(),
          status: trip.status || 'inactive',
        }));

        setTrips(formattedTrips);
        setFilteredTrips(formattedTrips);
      } catch (error) {
        console.error('Error loading trips:', error);
        showNotification({
          title: 'Error',
          message: 'Error al cargar los viajes',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };

    if (selectedActivity === 'Viajes Publicados') {
      loadTrips();
    }
  }, [selectedActivity, navigate]);

  useEffect(() => {
    let filtered = [...trips];
    if (filterValue) {
      filtered = filtered.filter(
        (trip) =>
          trip.origin.address.toLowerCase().includes(filterValue.toLowerCase()) ||
          trip.destination.address.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    if (statusFilter) {
      filtered = filtered.filter((trip) => trip.status === statusFilter);
    }
    if (dateFilter) {
      filtered = filtered.filter((trip) =>
        dayjs(trip.date_time).isSame(dateFilter, 'day')
      );
    }
    setFilteredTrips(filtered);
  }, [trips, filterValue, statusFilter, dateFilter]);



  if (loading) {
    return (
      <Container className={styles.container}>
        <LoadingOverlay visible />
        <Title className={styles.title}>Mis Actividades</Title>
        <Text className={styles.noTripsText}>Cargando tus actividades...</Text>
      </Container>
    );
  }

  return (
    <Container className={styles.container}>
      <div style={{height: '30px'}} />
      <div className={styles.headerContainer}>
        <Title className={styles.title}>
          {selectedActivity === 'Viajes Publicados' && userProfile?.user_type === 'DRIVER'
            ? <>Tus viajes, <span className={styles.userName}>{userProfile?.first_name || 'Cliente'}</span></>
            : 'Mis Actividades'}
        </Title>
        <RolSelector onSelect={(activity) => setSelectedActivity(activity as ActivityType)} />
      </div>

      {selectedActivity === 'Viajes Publicados' && userProfile?.user_type === 'DRIVER' && (
        <>
          <TripFilter
            trips={trips}
            filterValue={filterValue || ''}
            onFilterChange={setFilterValue}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
          />
          <div className={styles.tripListContainer}>
            {filteredTrips.map((trip, ) => (
              <TripCard
                key={trip.id}
                trip={trip}
                userId={userProfile?.user_id || ''}
              />
            ))}
          </div>
        </>
      )}

      {selectedActivity === 'Cupos Creados' && userProfile?.user_id && (
        <Cupos userId={userProfile.user_id} />
      )}

      {selectedActivity === 'Viajes Publicados' && userProfile?.user_type === 'PASSENGER' && (
        <Text className={styles.noTripsText}>
          Para publicar viajes, necesitas completar tu perfil de conductor.
        </Text>
      )}

      {trips.length === 0 &&
        selectedActivity === 'Viajes Publicados' &&
        userProfile?.user_type === 'DRIVER' && (
          <Container className={styles.container}>
            <Text className={styles.noTripsText}>No tienes viajes publicados.</Text>
            <Button className={styles.publishButton} component="a" href="/publicarviaje">
              Publica tu primer viaje
            </Button>
          </Container>
        )}
    </Container>
  );
};

export default Actividades;
