import React, { createContext, useContext, useEffect, useState } from 'react';
import { LoadScript } from '@react-google-maps/api';

// Interface for the Maps context
interface MapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
}

// Create the context
const MapsContext = createContext<MapsContextType>({ isLoaded: false, loadError: undefined });

// Custom hook to use the Maps context
export const useMaps = () => {
  const context = useContext(MapsContext);
  if (!context) {
    throw new Error('useMaps must be used within a GoogleMapsProvider');
  }
  return context;
};

// Google Maps libraries to load
const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places", "geometry"];

// Maps Provider component
interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | undefined>(undefined);

  const handleLoad = () => {
    console.log('✅ Google Maps loaded successfully');
    setIsLoaded(true);
    setLoadError(undefined);
  };

  const handleError = (error: Error) => {
    console.error('❌ Google Maps failed to load:', error);
    setLoadError(error);
    setIsLoaded(false);
  };

  // Fallback check for existing Google Maps
  useEffect(() => {
    if (window.google?.maps && !isLoaded) {
      console.log('✅ Google Maps already available');
      setIsLoaded(true);
    }
  }, [isLoaded]);

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!googleMapsApiKey) {
    console.error('❌ Google Maps API key not found');
    return (
      <MapsContext.Provider value={{ isLoaded: false, loadError: new Error('API key not found') }}>
        {children}
      </MapsContext.Provider>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={googleMapsApiKey}
      libraries={libraries}
      onLoad={handleLoad}
      onError={handleError}
      loadingElement={<div>Cargando Google Maps...</div>}
    >
      <MapsContext.Provider value={{ isLoaded, loadError }}>
        {children}
      </MapsContext.Provider>
    </LoadScript>
  );
};
