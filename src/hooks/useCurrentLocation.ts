
import { useState, useEffect } from "react";

type Location = { lat: number; lng: number } | null;

export function useCurrentLocation() {
  const [location, setLocation] = useState<Location>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocError(null);
        setLoading(false);
      },
      (err) => {
        setLocError("Failed to get location: " + err.message);
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 15000 }
    );
  }, []);

  return { location, locError, loading };
}
