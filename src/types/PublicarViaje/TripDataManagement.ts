// src/types/PublicarViaje/TripDataManagement.ts

// Interfaces principales para manejo de ubicaciones y rutas
export interface Coordinates {
    lat: number;
    lng: number;
  }
  
  export interface TripLocation {
      location_id: number;
      placeId: string;
      address: string;
      coords: Coordinates;
      mainText: string;
      secondaryText: string;
      postalCode?: string; // Código postal opcional
  }
  
  export interface StopData {
      location_id: number;
      placeId: string;
      address: string;
      coords: Coordinates;
      mainText: string;
      secondaryText: string;
      postalCode?: string;
      distance?: string; // Added distance
      duration?: string;   // Added duration
  }
  
  export interface TripRoute {
      route_id: number;
      index: number;
      distance: string;
      duration: string;
      summary: string;
      startAddress: string;
      endAddress: string;
      bounds: google.maps.LatLngBounds;
      polyline: string;
      warnings?: string[];
  }
  
  export interface TripStopover {
    location: StopData;
    order: number;
    estimatedTime?: string;
  }
  
  export interface TripData {
    origin: TripLocation | null;
    destination: TripLocation | null;
    routes: TripRoute[] | null;
    selectedRoute: TripRoute | null;
    stopovers: TripStopover[];
    currentStep: 'origin' | 'destination' | 'routes' | 'stopovers' | 'details' | 'paradas';
    dateTime?: string;
    seats?: number;
    pricePerSeat?: number;
    description?: string;
    allowPets?: boolean;
    allowSmoking?: boolean;
    status?: 'active' | 'inactive';
    createdAt?: string;
  }
  
  
  // Configuraciones del mapa y renderizado de rutas
  export const mapOptions: google.maps.MapOptions = {
    styles: [
        // Configuración visual mejorada para el mapa
        {
            featureType: "all",
            elementType: "labels.text.fill",
            stylers: [{ color: "#6b6b6b" }]
        },
        {
            featureType: "landscape",
            elementType: "geometry.fill",
            stylers: [{ color: "#f8f9fa" }]
        },
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#e2e2e2" }]
        },
        {
            featureType: "road.arterial",
            elementType: "geometry.stroke",
            stylers: [{ color: "#d6d6d6" }]
        },
        {
            featureType: "water",
            elementType: "geometry.fill",
            stylers: [{ color: "#dceeff" }]
        }
    ],
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false,
    gestureHandling: "greedy",
    backgroundColor: "#ffffff",
  };
  
  export const directionsRendererOptions: google.maps.DirectionsRendererOptions = {
    suppressMarkers: false,
    preserveViewport: false,
    polylineOptions: {
        strokeColor: '#0088FF',
        strokeWeight: 2,
        strokeOpacity: 0.8
    },
  
  };
  
  const PUBLISHED_TRIPS_KEY = 'publishedTrips';
  // Store para manejar los datos del viaje
  export const tripStore = {
    // Obtener datos almacenados
    getStoredData(): TripData {
        const storedData = localStorage.getItem('tripData');
        if (storedData) {
            return JSON.parse(storedData);
        }
        return {
            origin: null,
            destination: null,
            routes: null,
            selectedRoute: null,
            stopovers: [],
            currentStep: 'origin',
        };
    },
  
    // Actualizar datos
    updateData(data: Partial<TripData>): TripData {
        const currentData = this.getStoredData();
        const updatedData = { ...currentData, ...data };
        localStorage.setItem('tripData', JSON.stringify(updatedData));
        return updatedData;
    },
    // Establecer origen
    setOrigin(location: TripLocation): void {
        this.updateData({
            origin: {
              ...location,
              location_id: 0,
            },
            currentStep: 'destination'
        });
    },
  
    // Establecer destino
    setDestination(location: TripLocation): void {
        this.updateData({
            destination: {
              ...location,
              location_id: 0
            },
            currentStep: 'routes'
        });
    },
  
  
  
    // Establecer rutas
    setRoutes(routes: TripRoute[], selectedRoute: TripRoute): void {
        this.updateData({
            routes,
             selectedRoute: {
               ...selectedRoute,
              route_id: 0
             },
            currentStep: 'stopovers'
        });
    },
  
    // Agregar parada
    addStopover(stopover: TripStopover): void {
        const currentData = this.getStoredData();
        const updatedStopovers = [...currentData.stopovers, stopover];
        this.updateData({
            stopovers: updatedStopovers
        });
    },
  
    // Remover parada
    removeStopover(index: number): void {
        const currentData = this.getStoredData();
        const updatedStopovers = currentData.stopovers.filter((_, i) => i !== index);
        this.updateData({
            stopovers: updatedStopovers
        });
    },
  
    // Limpiar datos
    clearData(): void {
        localStorage.removeItem('tripData');
    },
  
    // Obtener estado actual del viaje
    getCurrentStep(): TripData['currentStep'] {
        return this.getStoredData().currentStep;
    },
  
    // Verificar si hay una ruta seleccionada
    hasSelectedRoute(): boolean {
        const data = this.getStoredData();
        return !!data.selectedRoute;
    },
  
    // Obtener la ruta seleccionada
    getSelectedRoute(): TripRoute | null {
        return this.getStoredData().selectedRoute;
    },
  
    // Obtener todas las paradas ordenadas
    getSortedStopovers(): TripStopover[] {
        const data = this.getStoredData();
        return [...data.stopovers].sort((a, b) => a.order - b.order);
    },
  
    // Actualizar el orden de las paradas
    updateStopoverOrder(stopoverId: string, newOrder: number): void {
        const currentData = this.getStoredData();
        const stopovers = currentData.stopovers.map(stopover => {
            if (stopover.location.placeId === stopoverId) {
                return { ...stopover, order: newOrder };
            }
            return stopover;
        });
        this.updateData({
            stopovers: stopovers
        });
    },
  
    // Validar si se puede proceder al siguiente paso
    canProceedToNextStep(): boolean {
        const currentData = this.getStoredData();
        switch (currentData.currentStep) {
            case 'origin':
                return !!currentData.origin;
            case 'destination':
                return !!currentData.destination;
            case 'routes':
                return !!currentData.selectedRoute;
            case 'stopovers':
                return true; // Las paradas son opcionales
            case 'details':
                return true;
            case 'paradas':
                return true;
            default:
                return false;
        }
    },
  
    // Avanzar al siguiente paso si es posible
    proceedToNextStep(): boolean {
        if (!this.canProceedToNextStep()) return false;
  
        const currentData = this.getStoredData();
        const steps: TripData['currentStep'][] = ['origin', 'destination', 'routes', 'stopovers', 'paradas', 'details'];
        const currentIndex = steps.indexOf(currentData.currentStep);
  
        if (currentIndex < steps.length - 1) {
            this.updateData({
                currentStep: steps[currentIndex + 1]
            });
            return true;
        }
        return false;
    },
    getPublishedTrips(): TripData[] {
        const trips = localStorage.getItem(PUBLISHED_TRIPS_KEY);
        return trips ? JSON.parse(trips) : [];
    },
  
    savePublishedTrip(trip: TripData): void {
        const existingTrips = this.getPublishedTrips();
        existingTrips.push(trip);
        localStorage.setItem(PUBLISHED_TRIPS_KEY, JSON.stringify(existingTrips));
    },
  
    clearPublishedTrips(): void {
        localStorage.removeItem(PUBLISHED_TRIPS_KEY);
    },
    getOrigin(): TripLocation | null {
        return this.getStoredData().origin;
    },
  
    getDestination(): TripLocation | null {
        return this.getStoredData().destination;
    },
  };
    
    tripStore.getPublishedTrips = (): TripData[] => {
        const trips = localStorage.getItem(PUBLISHED_TRIPS_KEY);
        return trips ? JSON.parse(trips) : [];
    };
  
    tripStore.savePublishedTrip = function (trip: TripData): void {
        const existingTrips = this.getPublishedTrips();
        existingTrips.push(trip);
        localStorage.setItem(PUBLISHED_TRIPS_KEY, JSON.stringify(existingTrips));
    };
  
    tripStore.clearPublishedTrips = (): void => {
        localStorage.removeItem(PUBLISHED_TRIPS_KEY);
    };
  // Constantes para mensajes de error
  export const errorMessages = {
    GEOCODING_ERROR: 'No se pudo obtener la ubicación exacta',
    ROUTE_CALCULATION_ERROR: 'Error al calcular la ruta',
    INVALID_LOCATION: 'Ubicación no válida',
    NETWORK_ERROR: 'Error de conexión',
    PLACES_SERVICE_ERROR: 'Error al buscar lugares',
  };