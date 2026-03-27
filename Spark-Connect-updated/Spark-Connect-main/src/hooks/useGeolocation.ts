import { useState, useCallback } from 'react';

export interface GeoPosition {
  lat: number;
  lng: number;
  city: string;
  country: string;
  accuracy: number;
}

interface GeolocationState {
  position: GeoPosition | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
}

// Reverse geocoding using Nominatim (free, no API key)
async function reverseGeocode(lat: number, lng: number): Promise<{ city: string; country: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      { headers: { 'Accept-Language': 'pl', 'User-Agent': 'SparkConnect/1.0' } }
    );
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    const addr = data.address ?? {};
    const city = addr.city || addr.town || addr.village || addr.municipality || 'Nieznane';
    const country = addr.country || '';
    return { city, country };
  } catch {
    return { city: 'Twoja lokalizacja', country: '' };
  }
}

// Haversine distance in km between two points
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    loading: false,
    error: null,
    permissionDenied: false,
  });

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: 'Geolokalizacja nie jest obsługiwana przez tę przeglądarkę' }));
      return null;
    }

    setState(s => ({ ...s, loading: true, error: null }));

    return new Promise<GeoPosition | null>(resolve => {
      navigator.geolocation.getCurrentPosition(
        async coords => {
          const { latitude: lat, longitude: lng, accuracy } = coords.coords;
          const { city, country } = await reverseGeocode(lat, lng);
          const position: GeoPosition = { lat, lng, city, country, accuracy };
          setState({ position, loading: false, error: null, permissionDenied: false });
          resolve(position);
        },
        err => {
          const denied = err.code === GeolocationPositionError.PERMISSION_DENIED;
          setState(s => ({
            ...s,
            loading: false,
            permissionDenied: denied,
            error: denied
              ? 'Dostęp do lokalizacji zablokowany. Zmień ustawienia przeglądarki.'
              : 'Nie udało się pobrać lokalizacji.',
          }));
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 }
      );
    });
  }, []);

  return { ...state, requestLocation };
}
