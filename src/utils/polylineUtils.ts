// 🚀 Utilidad para decodificar polylines sin depender de Google Maps geometry library
// Esto reduce costos evitando cargar librerías adicionales

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Decodifica un polyline encoded string a un array de coordenadas LatLng
 * Implementación basada en el algoritmo de Google Polyline Algorithm
 * @param encoded - String polyline encoded
 * @returns Array de coordenadas LatLng
 */
export const decodePolyline = (encoded: string): LatLng[] => {
  if (!encoded) return [];
  
  const poly: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    
    // Decodificar latitud
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const deltaLat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += deltaLat;

    shift = 0;
    result = 0;
    
    // Decodificar longitud
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const deltaLng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += deltaLng;

    poly.push({
      lat: lat / 1e5,
      lng: lng / 1e5
    });
  }

  return poly;
};

/**
 * Codifica un array de coordenadas LatLng a polyline string
 * @param path - Array de coordenadas LatLng
 * @returns String polyline encoded
 */
export const encodePolyline = (path: LatLng[]): string => {
  if (!path || path.length === 0) return '';
  
  let lastLat = 0;
  let lastLng = 0;
  let encoded = '';

  for (const point of path) {
    const lat = Math.round(point.lat * 1e5);
    const lng = Math.round(point.lng * 1e5);
    
    const deltaLat = lat - lastLat;
    const deltaLng = lng - lastLng;
    
    encoded += encodeSignedNumber(deltaLat);
    encoded += encodeSignedNumber(deltaLng);
    
    lastLat = lat;
    lastLng = lng;
  }

  return encoded;
};

/**
 * Codifica un número con signo según el algoritmo de polyline
 * @param num - Número a codificar
 * @returns String codificado
 */
const encodeSignedNumber = (num: number): string => {
  let signedNum = num << 1;
  if (num < 0) {
    signedNum = ~signedNum;
  }
  return encodeUnsignedNumber(signedNum);
};

/**
 * Codifica un número sin signo según el algoritmo de polyline
 * @param num - Número a codificar
 * @returns String codificado
 */
const encodeUnsignedNumber = (num: number): string => {
  let encoded = '';
  while (num >= 0x20) {
    encoded += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
    num >>= 5;
  }
  encoded += String.fromCharCode(num + 63);
  return encoded;
};

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine
 * @param point1 - Primer punto
 * @param point2 - Segundo punto
 * @returns Distancia en kilómetros
 */
export const calculateDistance = (point1: LatLng, point2: LatLng): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Calcula la distancia total de una ruta polyline
 * @param encoded - String polyline encoded
 * @returns Distancia total en kilómetros
 */
export const calculatePolylineDistance = (encoded: string): number => {
  const path = decodePolyline(encoded);
  if (path.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 1; i < path.length; i++) {
    totalDistance += calculateDistance(path[i-1], path[i]);
  }
  
  return totalDistance;
};

/**
 * Obtiene los bounds (límites) de una ruta polyline
 * @param encoded - String polyline encoded
 * @returns Bounds de la ruta
 */
export const getPolylineBounds = (encoded: string): {
  northeast: LatLng;
  southwest: LatLng;
} | null => {
  const path = decodePolyline(encoded);
  if (path.length === 0) return null;
  
  let minLat = path[0].lat;
  let maxLat = path[0].lat;
  let minLng = path[0].lng;
  let maxLng = path[0].lng;
  
  for (const point of path) {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLng = Math.min(minLng, point.lng);
    maxLng = Math.max(maxLng, point.lng);
  }
  
  return {
    northeast: { lat: maxLat, lng: maxLng },
    southwest: { lat: minLat, lng: minLng }
  };
};

export default {
  decodePolyline,
  encodePolyline,
  calculateDistance,
  calculatePolylineDistance,
  getPolylineBounds
};
