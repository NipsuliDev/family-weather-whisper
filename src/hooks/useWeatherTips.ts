
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHourlyWeather } from "./useHourlyWeather";
import { getDayPart } from "./useWeatherData";
import { useFamilySettings } from "./useFamilySettings";

/**
 * Custom hook to fetch actionable weather tips for families.
 * Uses family preferences stored in localStorage via useFamilySettings.
 */
export function useWeatherTips() {
  const hourly = useHourlyWeather();
  const { family: familyContext } = useFamilySettings();

  const dayPart = getDayPart();
  const lat = hourly.location?.lat;
  const lng = hourly.location?.lng;

  // Only run if we have the necessary weather/location data
  const enabled = !!hourly.data && !!lat && !!lng && !hourly.isLoading && !hourly.error;

  const query = useQuery<string, Error>({
    queryKey: [
      "weatherTips",
      { lat, lng, dayPart, familyContext }
    ],
    enabled,
    queryFn: async () => {
      if (!hourly.data || !lat || !lng) throw new Error("Missing weather/location data");

      let timezone = "UTC";
      let localTime = new Date().toISOString();
      if (typeof window !== "undefined" && typeof Intl !== "undefined" && Intl.DateTimeFormat) {
        try {
          timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        } catch {
          timezone = "UTC";
        }
        localTime = new Date().toISOString();
      }

      const { data, error } = await supabase.functions.invoke<string>("get-weather-tips", {
        body: {
          forecast: hourly.data,
          dayPart,
          timezone,
          localTime,
          familyContext,
        },
      });

      if (error) throw new Error(error.message ?? "Could not get weather tips");
      if (!data) throw new Error("No weather tips returned.");
      return data;
    },
    staleTime: 1000 * 60 * 15,
    retry: false,
    meta: {
      onError: (error: Error) => {
        console.error("Weather tips fetch failed:", error);
      },
    }
  });

  return {
    loading: hourly.isLoading || query.isLoading,
    error: hourly.error || query.error,
    tips: query.data,
    refetch: query.refetch,
  };
}
