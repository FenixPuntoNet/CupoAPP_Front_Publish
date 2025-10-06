// utils/tripSorting.ts
import type { Trip } from '../Actividades';

/**
 * Función utilitaria para ordenar viajes por prioridad inteligente
 * 
 * Orden de prioridad:
 * 1. Viajes con notificaciones (pasajeros pendientes) - PRIMERO
 * 2. Viajes en progreso (started) 
 * 3. Viajes activos (active)
 * 4. Viajes terminados (finished)
 * 5. Viajes cancelados (canceled) - ÚLTIMO
 * 
 * Dentro de cada categoría se ordenan por fecha/hora apropiadamente
 */
export const sortTripsByPriority = (trips: Trip[]): Trip[] => {
  return [...trips].sort((a, b) => {
    // 🔔 Prioridad 1: Viajes con notificaciones (pasajeros pendientes)
    const aHasNotifications = (a.seats_reserved || 0) > 0 && a.status === 'active';
    const bHasNotifications = (b.seats_reserved || 0) > 0 && b.status === 'active';
    
    if (aHasNotifications && !bHasNotifications) return -1;
    if (!aHasNotifications && bHasNotifications) return 1;
    
    // 📊 Prioridad 2: Estado del viaje (orden de importancia)
    const statusPriority = {
      'started': 1,    // 🚀 En progreso - máxima prioridad
      'active': 2,     // ✅ Activos - segunda prioridad  
      'finished': 3,   // ✔️ Terminados - tercera prioridad
      'canceled': 4    // ❌ Cancelados - última prioridad
    };
    
    const aPriority = statusPriority[a.status] || 5;
    const bPriority = statusPriority[b.status] || 5;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // 📅 Prioridad 3: Dentro del mismo estado, ordenar por fecha/hora
    const aTime = new Date(a.date_time).getTime();
    const bTime = new Date(b.date_time).getTime();
    
    if (a.status === 'finished' || a.status === 'canceled') {
      // Para terminados/cancelados: más recientes primero
      return bTime - aTime;
    } else {
      // Para activos/en progreso: próximos primero
      return aTime - bTime;
    }
  });
};

/**
 * Función para verificar si un viaje tiene notificaciones pendientes
 */
export const tripHasNotifications = (trip: Trip): boolean => {
  return (trip.seats_reserved || 0) > 0 && trip.status === 'active';
};

/**
 * Función para obtener la prioridad de un viaje (útil para debugging o UI)
 */
export const getTripPriority = (trip: Trip): { level: number; label: string; hasNotifications: boolean } => {
  const hasNotifications = tripHasNotifications(trip);
  
  const statusPriority = {
    'started': { level: 1, label: 'En Progreso' },
    'active': { level: 2, label: 'Activo' },
    'finished': { level: 3, label: 'Terminado' },
    'canceled': { level: 4, label: 'Cancelado' }
  };
  
  const priority = statusPriority[trip.status] || { level: 5, label: 'Desconocido' };
  
  return {
    level: hasNotifications ? 0 : priority.level, // Las notificaciones tienen prioridad 0
    label: hasNotifications ? `${priority.label} (Con Notificaciones)` : priority.label,
    hasNotifications
  };
};