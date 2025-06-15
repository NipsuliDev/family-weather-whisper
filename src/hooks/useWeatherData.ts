
import { useHourlyWeather } from "./useHourlyWeather";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import type { DayPart, WeatherInfo } from "@/integrations/googleWeather";

/**
 * Pick an appropriate day part ("morning", "afternoon", "evening")
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
 */
export function useWeatherData(opts?: Options) {
  // 1. Pull base weather
  const hourly = useHourlyWeather({
    enabled: opts?.enabled,
    hours: opts?.hours,
  });

  // 2. Get day part
  const currentDayPart = opts?.dayPart || getDayPart();

  // 3. Grab lat/lng and hours for key
  const lat = hourly.location?.lat;
  const lng = hourly.location?.lng;
  const hours = opts?.hours ?? 24;

  // 4. Stable query key ONLY using actual triggers
  const queryKey = [
    "weatherData",
    { dayPart: currentDayPart },
    { lat, lng },
    { hours }
  ];

  // 5. Only run when data ready
  const hasHourlyData = !!hourly.data && !hourly.isLoading && !hourly.error;

  // 6. Run the real query
  const query = useQuery<WeatherInfo[], Error>({
    queryKey,
    enabled: hasHourlyData,
    queryFn: async () => {
      if (!hourly.data) throw new Error("Hourly weather missing");
      // Compute localTime/timezone only here (not in key!)
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
