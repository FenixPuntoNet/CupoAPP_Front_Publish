// types/maps.ts
export interface Location {
  lat: number;
  lng: number;
}

export interface LocationWithAddress {
  address: string;
  location: Location;
}

export interface RouteInfo {
  distance: string;
  duration: string;
  route?: google.maps.DirectionsResult;
}

declare global {
  interface Window {
    google?: typeof google;
    initMap?: (() => void) | undefined;
    [key: string]: any;
  }
}