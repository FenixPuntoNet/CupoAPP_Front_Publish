import { useState, useEffect, useCallback } from 'react';
import { geocodeAddress } from '../services/geocoding';

interface UseMapNavigationProps {
  address?: string;
  isLoaded?: boolean;
}

interface MapCenter {
  lat: number;
  lng: number;
}

/**
 * Hook para navegación dinámica del mapa basada en geocodificación real
 */
export function useMapNavigation({ address, isLoaded }: UseMapNavigationProps) {
  const [mapCenter, setMapCenter] = useState<MapCenter>({ 
    lat: 4.5709, // Centro de Colombia por defecto 
    lng: -74.2973 
  });
  const [isGeocodingLocation, setIsGeocodingLocation] = useState(false);

  const geocodeAndCenter = useCallback(async (addressToGeocode: string) => {
    if (!addressToGeocode?.trim()) {
      console.log('🚫 [MAP_NAVIGATION] Dirección vacía, manteniendo centro actual');
      return;
    }

    if (!isLoaded) {
      console.log('⏳ [MAP_NAVIGATION] Google Maps no cargado, esperando...');
      return;
    }

    console.log('🗺️ [MAP_NAVIGATION] Iniciando geocodificación dinámica para:', addressToGeocode);
    setIsGeocodingLocation(true);

    try {
      const result = await geocodeAddress(addressToGeocode);
      
      if (result) {
        const newCenter = { lat: result.lat, lng: result.lng };
        console.log('✅ [MAP_NAVIGATION] Centro del mapa actualizado dinámicamente:', newCenter);
        console.log('📍 [MAP_NAVIGATION] Dirección geocodificada:', result.address);
        console.log('🏙️ [MAP_NAVIGATION] Ciudad detectada:', result.city);
        
        setMapCenter(newCenter);
      } else {
        console.log('❌ [MAP_NAVIGATION] No se pudo geocodificar, manteniendo centro actual');
      }
    } catch (error) {
      console.error('💥 [MAP_NAVIGATION] Error en geocodificación:', error);
    } finally {
      setIsGeocodingLocation(false);
    }
  }, [isLoaded]);

  // Efecto para geocodificar automáticamente cuando cambia la dirección
  useEffect(() => {
    if (address && isLoaded) {
      console.log('� [MAP_NAVIGATION] Nueva dirección detectada:', address);
      geocodeAndCenter(address);
    }
  }, [address, isLoaded, geocodeAndCenter]);

  return {
    mapCenter,
    setMapCenter,
    isGeocodingLocation,
    geocodeAndCenter // Función para geocodificación manual si es necesaria
  };
}