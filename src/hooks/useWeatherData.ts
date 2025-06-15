import { useHourlyWeather } from "./useHourlyWeather";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { DayPart, WeatherInfo } from "@/integrations/googleWeather";

/**
 * Simple helper that picks an appropriate day part ("morning", "afternoon", "evening")
 * based on current time.
 */
export function getDayPart(now = new Date()): DayPart {
  const hour = now.getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

interface Options {
  enabled?: boolean;
  hours?: number;
  /** Optionally override the daypart sent to Gemini LLM */
  dayPart?: DayPart;
}

/**
 * useWeatherData - gets summarized/family friendly weather advisories for UI
 *
 * Step 1. Use the hourlyWeather hook to get fresh weather forecast data.
 * Step 2. Call Supabase Edge Function 'convert-weather-info' with hourly data and dayPart to get WeatherInfo[]
 */
export function useWeatherData(opts?: Options) {
  // 1. Get the core Google Weather hourly data first.
  const hourly = useHourlyWeather({
    enabled: opts?.enabled,
    hours: opts?.hours,
  });

  // 2. Compute current day part for family summaries (can override)
  const currentDayPart = opts?.dayPart || getDayPart();

  // Timezone helpers
  let timezone = "UTC";
  let localTime = new Date().toISOString();
  if (typeof window !== "undefined" && typeof Intl !== "undefined" && Intl.DateTimeFormat) {
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      localTime = new Date().toISOString();
    } catch {
      // fallback to UTC and ISO string
    }
  }

  // Detect when hourlyData is ready
  const hasHourlyData = !!hourly.data && !hourly.isLoading && !hourly.error;

  // DO NOT include the actual data in the key!
  // If hourly.data is a plain object, it can cause loop
  const queryKey = [
    "weatherData",
    { dayPart: currentDayPart },
    { hasHourlyData },
    { timezone, localTime },
  ];

  const query = useQuery<WeatherInfo[], Error>({
    queryKey,
    enabled: hasHourlyData,
    queryFn: async () => {
      if (!hourly.data) throw new Error("Hourly weather missing");
      const { data, error } = await supabase.functions.invoke<WeatherInfo[]>("convert-weather-info", {
        body: {
          forecast: hourly.data,
          dayPart: currentDayPart,
          timezone,
          localTime,
        }
      });
      if (error) throw new Error(error.message || "Failed to process weather data");
      if (!data) throw new Error("No result from weather AI function");
      return data;
    },
    staleTime: 1000 * 60 * 15,
    retry: false,
    meta: {
      onError: (error: Error) => {
        console.error("Weather summary fetch failed:", error);
      }
    }
  });

  return {
    hourly,
    summary: query.data,
    loading: hourly.isLoading || query.isLoading,
    error: hourly.error || query.error,
    refetch: query.refetch,
    dayPart: currentDayPart,
  };
}
