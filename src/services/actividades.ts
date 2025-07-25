import { apiRequest } from '@/config/api';

export interface ActivitySummary {
  driver_trips: number;
  passenger_bookings: number;
  wallet_transactions: number;
  total_earned: number;
  total_spent: number;
  referrals_made: number;
  ratings_received: number;
  active_chats: number;
  unicoins_balance: number;
}

export interface ActivitySummaryResponse {
  summary: ActivitySummary;
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  amount?: number;
}

export interface RecentActivitiesResponse {
  activities: Activity[];
}

export interface DriverTripStats {
  count: number;
  earnings: number;
  completed: number;
  cancelled: number;
}

export interface PassengerBookingStats {
  count: number;
  spending: number;
  confirmed: number;
  cancelled: number;
}

export interface WalletTransactionStats {
  count: number;
  total_earned: number;
  total_spent: number;
}

export interface ActivityStats {
  driver_trips: DriverTripStats;
  passenger_bookings: PassengerBookingStats;
  wallet_transactions: WalletTransactionStats;
  net_balance: number;
}

export interface ActivityStatsResponse {
  period_days: number;
  stats: ActivityStats;
}

// Obtener resumen de actividades del usuario
export async function getActivitySummary(): Promise<{ success: boolean; data?: ActivitySummaryResponse; error?: string }> {
  try {
    const response = await apiRequest('/actividades/summary', {
      method: 'GET'
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || 'Error al obtener resumen de actividades' 
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error in getActivitySummary:', error);
    return { 
      success: false, 
      error: 'Error de conexión al obtener resumen de actividades' 
    };
  }
}

// Obtener actividad reciente del usuario
export async function getRecentActivities(limit: number = 20): Promise<{ success: boolean; data?: RecentActivitiesResponse; error?: string }> {
  try {
    const response = await apiRequest(`/actividades/recent?limit=${limit}`, {
      method: 'GET'
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || 'Error al obtener actividades recientes' 
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error in getRecentActivities:', error);
    return { 
      success: false, 
      error: 'Error de conexión al obtener actividades recientes' 
    };
  }
}

// Obtener estadísticas de actividad por período
export async function getActivityStats(period: number = 30): Promise<{ success: boolean; data?: ActivityStatsResponse; error?: string }> {
  try {
    const response = await apiRequest(`/actividades/stats?period=${period}`, {
      method: 'GET'
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || 'Error al obtener estadísticas de actividades' 
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error in getActivityStats:', error);
    return { 
      success: false, 
      error: 'Error de conexión al obtener estadísticas de actividades' 
    };
  }
}
