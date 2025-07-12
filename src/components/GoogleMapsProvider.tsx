import { useEffect } from 'react';
import { LoadScript } from '@react-google-maps/api';

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children }) => {
  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      console.log('Google Maps is already loaded');
    }
  }, []);

  const handleLoad = () => {
    console.log('Google Maps loaded successfully');
  };

  const handleError = (error: Error) => {
    console.error('Google Maps failed to load:', error);
  };

  // If we don't have an API key, render children without Google Maps
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn('Google Maps API key not found. Some features may not work.');
    return <>{children}</>;
  }

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      libraries={libraries}
      onLoad={handleLoad}
      onError={handleError}
      loadingElement={<div>Loading Google Maps...</div>}
    >
      {children}
    </LoadScript>
  );
};
