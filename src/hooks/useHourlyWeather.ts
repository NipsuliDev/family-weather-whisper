
import { useQuery } from "@tanstack/react-query";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentLocation } from "./useCurrentLocation";
import type { GoogleHourlyForecastResponse, GetGoogleWeatherHourlyParams } from "@/integrations/googleWeather";

interface Options {
  enabled?: boolean;
  hours?: number;
}

export function useHourlyWeather(opts?: Options) {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { location, locError, loading: locationLoading } = useCurrentLocation();

  const queryKey = [
    "hourlyWeather",
    { userId: user?.id ?? null, lat: location?.lat, lng: location?.lng },
    opts?.hours ?? 24,
  ];

  return {
    ...useQuery<GoogleHourlyForecastResponse, Error>({
      queryKey,
      queryFn: async () => {
        if (!location) throw new Error("Location unknown");
        const params: GetGoogleWeatherHourlyParams = {
          lat: location.lat,
          lng: location.lng,
          hours: opts?.hours ?? 24,
        };
        const { data, error } = await supabase.functions.invoke<GoogleHourlyForecastResponse>(
          "get-google-weather",
          { body: params }
        );
        if (error) throw new Error(error.message);
        if (!data) throw new Error("No weather data returned");
        return data;
      },
      enabled: !authLoading && !!location && (opts?.enabled ?? true),
      staleTime: 1000 * 60 * 10, // 10 mins
      retry: false,
      meta: {
        onError: (error: Error) => {
          console.error("Weather query failed:", error);
        },
      },
    }),
    location,
    locError,
    locationLoading,
  };
}
