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
import { getCurrentUser } from '@/services/auth';
import { 
  getActivitySummary, 
  getRecentActivities,
  type Activity,
  type ActivitySummary 
} from '@/services/actividades';

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
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const ActivityType = {
    RESUMEN: 'Resumen de Actividades',
    VIAJES: 'Viajes Publicados',
    CUPOS: 'Cupos Creados',
  } as const;
  type ActivityType = 'Resumen de Actividades' | 'Viajes Publicados' | 'Cupos Creados' | null;
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('Resumen de Actividades');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const result = await getCurrentUser();
        if (!result.success || !result.user) {
          navigate({ to: '/Login' });
          return;
        }

        // Simular user profile basado en el usuario del backend
        setUserProfile({
          user_id: result.user.id,
          email: result.user.email || '',
          phone_number: null,
          first_name: 'Usuario',
          last_name: '',
          identification_type: 'CC',
          identification_number: null,
          user_type: 'DRIVER', // Por defecto, se podría obtener del backend
        });

        // Cargar resumen de actividades
        await loadActivitySummary();
        await loadRecentActivities();

      } catch (error: any) {
        console.error('Error fetching user profile:', error);
        showNotification({
          title: 'Error',
          message: 'Error al cargar el perfil de usuario',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [navigate]);

  const loadActivitySummary = async () => {
    try {
      const result = await getActivitySummary();
      if (result.success && result.data) {
        setActivitySummary(result.data.summary);
      } else {
        console.error('Error loading activity summary:', result.error);
      }
    } catch (error) {
      console.error('Error loading activity summary:', error);
    }
  };

  const loadRecentActivities = async () => {
    try {
      const result = await getRecentActivities(10);
      if (result.success && result.data) {
        setRecentActivities(result.data.activities);
      } else {
        console.error('Error loading recent activities:', result.error);
      }
    } catch (error) {
      console.error('Error loading recent activities:', error);
    }
  };

  useEffect(() => {
    const loadTrips = async () => {
      setLoading(true);
      try {
        const result = await getCurrentUser();
        if (!result.success || !result.user) {
          navigate({ to: '/Login' });
          return;
        }

        // TODO: Implementar endpoint para obtener viajes del usuario desde el backend
        // Por ahora, mostrar datos vacíos
        setTrips([]);
        setFilteredTrips([]);

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

  const renderActivitySummary = () => {
    if (!activitySummary) {
      return (
        <Text className={styles.noTripsText}>
          Cargando resumen de actividades...
        </Text>
      );
    }

    return (
      <div className={styles.summaryContainer}>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <Text className={styles.summaryLabel}>Viajes como Conductor</Text>
            <Text className={styles.summaryValue}>{activitySummary.driver_trips}</Text>
          </div>
          <div className={styles.summaryCard}>
            <Text className={styles.summaryLabel}>Reservas como Pasajero</Text>
            <Text className={styles.summaryValue}>{activitySummary.passenger_bookings}</Text>
          </div>
          <div className={styles.summaryCard}>
            <Text className={styles.summaryLabel}>Total Ganado</Text>
            <Text className={styles.summaryValue}>${activitySummary.total_earned.toLocaleString()}</Text>
          </div>
          <div className={styles.summaryCard}>
            <Text className={styles.summaryLabel}>Total Gastado</Text>
            <Text className={styles.summaryValue}>${activitySummary.total_spent.toLocaleString()}</Text>
          </div>
          <div className={styles.summaryCard}>
            <Text className={styles.summaryLabel}>Referidos Realizados</Text>
            <Text className={styles.summaryValue}>{activitySummary.referrals_made}</Text>
          </div>
          <div className={styles.summaryCard}>
            <Text className={styles.summaryLabel}>UniCoins</Text>
            <Text className={styles.summaryValue}>🪙 {activitySummary.unicoins_balance}</Text>
          </div>
        </div>

        <div className={styles.recentActivitiesSection}>
          <Title order={3} className={styles.sectionTitle}>Actividad Reciente</Title>
          {recentActivities.length > 0 ? (
            <div className={styles.activitiesList}>
              {recentActivities.map((activity) => (
                <div key={activity.id} className={styles.activityItem}>
                  <div className={styles.activityInfo}>
                    <Text className={styles.activityTitle}>{activity.title}</Text>
                    <Text className={styles.activityDescription}>{activity.description}</Text>
                  </div>
                  <div className={styles.activityMeta}>
                    {activity.amount && (
                      <Text className={styles.activityAmount}>
                        ${activity.amount.toLocaleString()}
                      </Text>
                    )}
                    <Text className={styles.activityTime}>
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Text className={styles.noTripsText}>No hay actividad reciente</Text>
          )}
        </div>
      </div>
    );
  };

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
            : selectedActivity === 'Resumen de Actividades'
            ? <>Tu resumen, <span className={styles.userName}>{userProfile?.first_name || 'Usuario'}</span></>
            : 'Mis Actividades'}
        </Title>
        <RolSelector onSelect={(activity) => setSelectedActivity(activity as ActivityType)} />
      </div>

      {selectedActivity === 'Resumen de Actividades' && (
        renderActivitySummary()
      )}

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
