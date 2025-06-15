
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

  // 3. Query for the summarized WeatherInfo[] only after hourly data is loaded
  const queryKey = [
    "weatherData",
    { dayPart: currentDayPart },
    { hourly: hourly.data }, // tracked for auto-refetch
  ];

  const enabled = !!hourly.data && !hourly.isLoading && !hourly.error;

  const query = useQuery<WeatherInfo[], Error>({
    queryKey,
    enabled,
    queryFn: async () => {
      // Defensive: if no data, throw – shouldn't run (see enabled)
      if (!hourly.data) throw new Error("Hourly weather missing");
      // Compose function input (schema must match server)
      const { data, error } = await supabase.functions.invoke<WeatherInfo[]>("convert-weather-info", {
        body: {
          forecast: hourly.data,
          dayPart: currentDayPart,
        }
      });
      if (error) throw new Error(error.message || "Failed to process weather data");
      if (!data) throw new Error("No result from weather AI function");
      return data;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    retry: false,
    meta: {
      onError: (error: Error) => {
        console.error("Weather summary fetch failed:", error);
      }
    }
  });

  // Return both the summarized weather info and the internal fetch status
  return {
    hourly,                // raw Google hourly data + status
    summary: query.data,   // WeatherInfo[] or undefined
    loading: hourly.isLoading || query.isLoading,
    error: hourly.error || query.error,
    refetch: query.refetch,
    dayPart: currentDayPart,
  };
}
