
import { useQuery } from "@tanstack/react-query";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { getGoogleWeatherHourly, GoogleHourlyForecastResponse } from "@/integrations/googleWeather";
import { useState, useEffect } from "react";

interface Options {
  enabled?: boolean;
  hours?: number;
}

type Location = { lat: number; lng: number } | null;

export function useHourlyWeather(opts?: Options) {
  const { user, loading: authLoading } = useSupabaseAuth();
  const [location, setLocation] = useState<Location>(null);
  const [locError, setLocError] = useState<string | null>(null);

  // Get browser location
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocError("Geolocation is not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocError(null);
      },
      (err) => {
        setLocError("Failed to get location: " + err.message);
      },
      { enableHighAccuracy: false, timeout: 15000 }
    );
  }, []);

  const queryKey = [
    "hourlyWeather",
    { userId: user?.id ?? null, lat: location?.lat, lng: location?.lng },
    opts?.hours ?? 24,
  ];

  return useQuery<GoogleHourlyForecastResponse, Error>({
    queryKey,
    queryFn: async () => {
      // The supabase anon key can be safely shared (is public)
      const supabaseKey =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJweWFzdHR2cXpvcm5xcnZrc29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjYwMzYsImV4cCI6MjA2NTUwMjAzNn0.FTy_QCH7jESTjp4XSdf3n3z9Y_8-Ptd221GQqFeXz3s";
      if (!location) throw new Error("Location unknown");
      return getGoogleWeatherHourly(
        {
          lat: location.lat,
          lng: location.lng,
          hours: opts?.hours ?? 24,
        },
        supabaseKey
      );
    },
    enabled: !authLoading && !!location && (opts?.enabled ?? true),
    staleTime: 1000 * 60 * 10, // 10 mins
    retry: 1,
    meta: {
      onError: (error: Error) => {
        console.error("Weather query failed:", error);
      },
    },
  });
}
