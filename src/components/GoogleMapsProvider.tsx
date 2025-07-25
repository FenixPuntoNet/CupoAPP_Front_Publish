import React, { createContext, useContext } from 'react';

// Interface for the Maps context (without Google Maps dependency)
interface MapsContextType {
  isAvailable: boolean;
}

// Create the context
const MapsContext = createContext<MapsContextType>({ isAvailable: true });

// Custom hook to use the Maps context
export const useMaps = () => {
  const context = useContext(MapsContext);
  if (!context) {
    throw new Error('useMaps must be used within a GoogleMapsProvider');
  }
  return context;
};

// Maps Provider component (simplified, uses backend services)
interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children }) => {
  // The maps functionality is handled by the backend services
  // This provider just ensures the context is available for components that expect it
  return (
    <MapsContext.Provider value={{ isAvailable: true }}>
      {children}
    </MapsContext.Provider>
  );
};
