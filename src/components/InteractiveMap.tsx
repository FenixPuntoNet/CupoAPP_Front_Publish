import React, { useEffect, useRef, useState } from 'react';
import styles from './InteractiveMap.module.css';

interface InteractiveMapProps {
  origin: string;
  destination: string;
  onClose: () => void;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ origin, destination, onClose }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGoogleMapsScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Error loading Google Maps'));
      
      document.head.appendChild(script);
    });
  };

  const initializeMap = async () => {
    try {
      await loadGoogleMapsScript();
      
      if (!mapRef.current) return;

      // Configuración del mapa con tema oscuro
      const mapOptions = {
        zoom: 10,
        center: { lat: 3.4516, lng: -76.5319 }, // Centro de Colombia
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#212121" }] },
          { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
          {
            featureType: "administrative",
            elementType: "geometry",
            stylers: [{ color: "#757575" }]
          },
          {
            featureType: "administrative.country",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9ca5b3" }]
          },
          {
            featureType: "administrative.land_parcel",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#bdbdbd" }]
          },
          {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#757575" }]
          },
          {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#181818" }]
          },
          {
            featureType: "poi.park",
            elementType: "labels.text.fill",
            stylers: [{ color: "#616161" }]
          },
          {
            featureType: "poi.park",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#1b1b1b" }]
          },
          {
            featureType: "road",
            elementType: "geometry.fill",
            stylers: [{ color: "#2c2c2c" }]
          },
          {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#8a8a8a" }]
          },
          {
            featureType: "road.arterial",
            elementType: "geometry",
            stylers: [{ color: "#373737" }]
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#3c3c3c" }]
          },
          {
            featureType: "road.highway.controlled_access",
            elementType: "geometry",
            stylers: [{ color: "#4e4e4e" }]
          },
          {
            featureType: "road.local",
            elementType: "labels.text.fill",
            stylers: [{ color: "#616161" }]
          },
          {
            featureType: "transit",
            elementType: "labels.text.fill",
            stylers: [{ color: "#757575" }]
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#000000" }]
          },
          {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#3d3d3d" }]
          }
        ],
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: true,
        fullscreenControl: true,
        gestureHandling: 'greedy',
        clickableIcons: false
      };

      // Crear instancia del mapa
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
      
      // Crear servicios de direcciones
      directionsServiceRef.current = new window.google.maps.DirectionsService();
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#00ff9d',
          strokeWeight: 4,
          strokeOpacity: 0.8
        },
        markerOptions: {
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#00ff9d',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        }
      });

      directionsRendererRef.current.setMap(mapInstanceRef.current);

      // Calcular y mostrar la ruta
      await calculateAndDisplayRoute();
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Error loading map');
      setIsLoading(false);
    }
  };

  const calculateAndDisplayRoute = async () => {
    try {
      const request = {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
        region: 'CO'
      };

      directionsServiceRef.current.route(request, (result: any, status: any) => {
        if (status === 'OK') {
          directionsRendererRef.current.setDirections(result);
          
          // Ajustar la vista para mostrar toda la ruta
          const bounds = new window.google.maps.LatLngBounds();
          const route = result.routes[0];
          
          route.legs.forEach((leg: any) => {
            bounds.extend(leg.start_location);
            bounds.extend(leg.end_location);
          });
          
          mapInstanceRef.current.fitBounds(bounds);
          
          // Agregar un poco de padding
          setTimeout(() => {
            mapInstanceRef.current.panToBounds(bounds);
          }, 100);
        } else {
          console.error('Directions request failed due to ' + status);
          setError('Could not calculate route');
        }
      });
    } catch (error) {
      console.error('Error calculating route:', error);
      setError('Error calculating route');
    }
  };

  useEffect(() => {
    initializeMap();

    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [origin, destination]);

  return (
    <div className={styles.mapContainer}>
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <p>Loading interactive map...</p>
        </div>
      )}
      
      {error && (
        <div className={styles.errorOverlay}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      <div ref={mapRef} className={styles.mapElement} />
      
      <button 
        className={styles.closeButton} 
        onClick={onClose}
        aria-label="Close map"
      >
        ×
      </button>

      <div className={styles.mapInfo}>
        <div className={styles.routeInfo}>
          <div className={styles.routePoint}>
            <span className={styles.routeLabel}>From:</span>
            <span className={styles.routeText}>{origin}</span>
          </div>
          <div className={styles.routePoint}>
            <span className={styles.routeLabel}>To:</span>
            <span className={styles.routeText}>{destination}</span>
          </div>
        </div>
      </div>

      <button 
        className={styles.openMapsButton}
        onClick={() => {
          const mapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}`;
          window.open(mapsUrl, '_blank');
        }}
        title="Abrir en Google Maps"
      >
        🗺️
      </button>
    </div>
  );
};

export default InteractiveMap;
