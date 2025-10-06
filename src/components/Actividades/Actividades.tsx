// Actividades.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Title, Text, LoadingOverlay, Button } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { showNotification } from '@mantine/notifications';
import dayjs from 'dayjs';
import { RolSelector, StatusSelector } from './UI';
import { TripFilter } from './Trips';
import { CuposContent } from './Bookings';
import styles from './index.module.css';
import { TripCard } from './Trips';
import { getCurrentUser } from '@/services/auth';
import { 
  getActivitySummary, 
  getRecentActivities,
  type Activity,
  type ActivitySummary
} from '@/services/actividades';
import { getMyTrips, type TripDetails } from '@/services/viajes';
import { sortTripsByPriority } from './utils/tripSorting';

export interface Trip {
  id: number;
  origin: { address: string; main_text?: string };
  destination: { address: string; main_text?: string };
  date: string;
  time: string;
  duration?: string;
  distance?: string;
  seats: number;
  seats_reserved: number;
  pricePerSeat: number;
  price_per_seat: number;
  description?: string;
  allowPets?: boolean;
  allowSmoking?: boolean;
  is_active: boolean;
  user_id: string;
  date_time: string;
  status: 'active' | 'started' | 'finished' | 'canceled';
  vehicle?: {
    brand: string;
    model: string;
    plate: string;
    color: string;
  };
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

import BackButton from '@/components/Buttons/backButton';

const Actividades: React.FC = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [filterValue, setFilterValue] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const ActivityType = {
    RESUMEN: 'Resumen de Actividades',
    VIAJES: 'Viajes Publicados',
    CUPOS: 'Cupos Creados',
  } as const;
  type ActivityType = 'Resumen de Actividades' | 'Viajes Publicados' | 'Cupos Creados' | null;
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>(() => {
    // Verificar si venimos desde la ruta de Cupos basándonos en referrer
    if (typeof window !== 'undefined' && window.document.referrer.includes('/Cupos')) {
      console.log('🔗 [Actividades] Detected navigation from /Cupos, setting initial activity to Cupos Creados');
      return 'Cupos Creados';
    }
    return 'Resumen de Actividades';
  });
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
          setRecentActivities(result.data.activities || []);
        } else {
          console.error('Error loading recent activities:', result.error);
        }
      } catch (error) {
        console.error('Error loading recent activities:', error);
      }
    };  useEffect(() => {
    const loadTrips = async () => {
      setTripsLoading(true);
      try {
        console.log('🚀 [Actividades] Loading trips from backend...');
        
        const result = await getMyTrips();
        if (!result.success) {
          console.error('❌ [Actividades] Error loading trips:', result.error);
          showNotification({
            title: 'Error',
            message: result.error || 'Error al cargar los viajes',
            color: 'red',
          });
          return;
        }

        console.log('✅ [Actividades] Trips loaded:', result.data);
        
        // Transformar los datos del backend al formato esperado por el frontend
        const transformedTrips: Trip[] = (result.data?.trips || []).map((trip: TripDetails) => ({
          id: trip.id,
          origin: trip.origin,
          destination: trip.destination,
          date: new Date(trip.date_time).toLocaleDateString(),
          time: new Date(trip.date_time).toLocaleTimeString(),
          duration: '30 min', // Valor por defecto
          distance: '15 km', // Valor por defecto
          seats: trip.seats,
          seats_reserved: trip.seats_reserved,
          pricePerSeat: trip.price_per_seat,
          price_per_seat: trip.price_per_seat,
          description: trip.description,
          allowPets: trip.allow_pets === 'Y',
          allowSmoking: trip.allow_smoking === 'Y',
          is_active: trip.status === 'active',
          user_id: trip.user_id,
          date_time: trip.date_time,
          status: (() => {
            // Mapear estados del backend a estados del frontend
            switch (trip.status) {
              case 'in_progress': return 'started';  // Estado viejo del backend
              case 'started': return 'started';      // Estado nuevo del backend
              case 'completed': return 'finished';   // Estado viejo del backend 
              case 'finished': return 'finished';    // Estado nuevo del backend
              case 'cancelled': return 'canceled';   // Estado viejo del backend
              case 'canceled': return 'canceled';    // Estado nuevo del backend
              case 'active': return 'active';
              default: return 'active';
            }
          })() as 'active' | 'started' | 'finished' | 'canceled',
          vehicle: trip.vehicle ? {
            brand: trip.vehicle.brand,
            model: trip.vehicle.model,
            plate: trip.vehicle.plate,
            color: trip.vehicle.color,
          } : undefined,
        }));

        setTrips(transformedTrips);
        
        // 🚀 APLICAR ORDENAMIENTO INTELIGENTE INMEDIATAMENTE
        const sortedTrips = sortTripsByPriority(transformedTrips);
        setFilteredTrips(sortedTrips);

      } catch (error) {
        console.error('❌ [Actividades] Error loading trips:', error);
        showNotification({
          title: 'Error',
          message: 'Error al cargar los viajes',
          color: 'red',
        });
      } finally {
        setTripsLoading(false);
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
            <Text className={styles.summaryValue}>{activitySummary.driver_trips || activitySummary.total_trips || 0}</Text>
          </div>
          <div className={styles.summaryCard}>
            <Text className={styles.summaryLabel}>Reservas como Pasajero</Text>
            <Text className={styles.summaryValue}>{activitySummary.passenger_bookings || 0}</Text>
          </div>
          <div className={styles.summaryCard}>
            <Text className={styles.summaryLabel}>Referidos Realizados</Text>
            <Text className={styles.summaryValue}>{activitySummary.referrals_made || 0}</Text>
          </div>
          <div className={styles.summaryCard}>
            <Text className={styles.summaryLabel}>UniCoins</Text>
            <Text className={styles.summaryValue}>🪙 {activitySummary.unicoins_balance || 0}</Text>
          </div>
        </div>

        <div className={styles.recentActivitiesSection}>
          <Title order={3} className={styles.sectionTitle}>Actividad Reciente</Title>
          {recentActivities.length > 0 ? (
            <div className={styles.activitiesList}>
              {recentActivities.map((activity) => (
                <div key={activity.id} className={styles.activityItem}>
                  <div className={styles.activityInfo}>
                    <Text className={styles.activityTitle}>{activity.title || activity.description}</Text>
                    <Text className={styles.activityDescription}>{activity.description}</Text>
                  </div>
                  <div className={styles.activityMeta}>
                    {activity.amount && (
                      <Text className={styles.activityAmount}>
                        ${activity.amount.toLocaleString()}
                      </Text>
                    )}
                    <Text className={styles.activityTime}>
                      {new Date(activity.timestamp || activity.date).toLocaleDateString()}
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
    console.log('🔄 [Actividades] Applying filters and sorting...', {
      tripsCount: trips.length,
      filterValue,
      statusFilter,
      dateFilter
    });
    
    let filtered = [...trips];
    
    // Aplicar filtros
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

    // 🚀 SIEMPRE APLICAR ORDENAMIENTO INTELIGENTE POR PRIORIDAD
    const sortedTrips = sortTripsByPriority(filtered);
    
    console.log('✅ [Actividades] Trips sorted by priority:', {
      total: sortedTrips.length,
      withNotifications: sortedTrips.filter((t: Trip) => (t.seats_reserved || 0) > 0 && t.status === 'active').length,
      active: sortedTrips.filter((t: Trip) => t.status === 'active').length,
      started: sortedTrips.filter((t: Trip) => t.status === 'started').length,
      finished: sortedTrips.filter((t: Trip) => t.status === 'finished').length
    });
    
    setFilteredTrips(sortedTrips);
  }, [trips, filterValue, statusFilter, dateFilter]);

  // Usar useCallback para evitar recrear la función en cada render
  const handleActivitySelect = useCallback((activity: string) => {
    console.log('🎯 [Actividades] handleActivitySelect called with:', activity);
    console.log('🎯 [Actividades] Previous selectedActivity:', selectedActivity);
    console.log('🎯 [Actividades] Setting new selectedActivity to:', activity);
    setSelectedActivity(activity as ActivityType);
  }, [selectedActivity]); // Agregamos selectedActivity como dependencia

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
      <div className='top'>
        <BackButton to='/perfil' />
      </div>
      <div className={styles.headerContainer}>
        <Title className={styles.title}>
          {selectedActivity === 'Viajes Publicados' && userProfile?.user_type === 'DRIVER'
            ? <p>Tus viajes</p>
            : selectedActivity === 'Resumen de Actividades'
            ? <p>Tu resumen</p>
            : selectedActivity === 'Cupos Creados'
            ? <p>Tus cupos</p>
            : 'Mis Actividades'}
        </Title>
        <RolSelector onSelect={handleActivitySelect} selectedActivity={selectedActivity || undefined} />
      </div>

      {selectedActivity === 'Resumen de Actividades' && (
        renderActivitySummary()
      )}

      {selectedActivity === 'Viajes Publicados' && userProfile?.user_type === 'DRIVER' && (
        <>
          {tripsLoading ? (
            <Text className={styles.noTripsText}>Cargando viajes...</Text>
          ) : (
            <>
              <TripFilter
                trips={trips}
                filterValue={filterValue || ''}
                onFilterChange={setFilterValue}
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
              />
              
              {/* 🎯 SELECTOR DE ESTADO DE VIAJES - BACANO */}
              <div className={styles.statusSelectorContainer}>
                <Text className={styles.sectionLabel}>Estado del viaje:</Text>
                <StatusSelector
                  onSelect={setStatusFilter}
                  selectedStatus={statusFilter}
                />
              </div>
              
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
        </>
      )}

      {selectedActivity === 'Cupos Creados' && userProfile?.user_id && (
        <CuposContent />
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
