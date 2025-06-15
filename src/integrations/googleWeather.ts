// Removed incorrect import: import type { IconType } from "@/components/WeatherCard";

// Main response shape per Google Weather API
export interface GoogleHourlyForecastResponse {
  hours: Array<{
    forecastTime: string; // RFC3339 UTC timestamp
    temperature: number; // Celsius
    apparentTemperature: number;
    precipitationChance: number; // Fraction 0-1
    humidity: number; // Fraction 0-1
    windSpeed: number; // km/h
    windGust: number;  // km/h
    windDirection: number; // Degrees
    conditionCode: string;
    cloudCover: number; // Fraction 0-1
    visibility: number; // km
    [key: string]: any; // Additional fields
  }>;
  location: {
    latitude: number;
    longitude: number;
    regionCode: string;
    [key: string]: any;
  };
  updateTime?: string;
  [key: string]: any;
}

// Helper - params for invoking the Supabase edge function
export interface GetGoogleWeatherHourlyParams {
  lat: number;
  lng: number;
  hours?: number;
}

/** DayPart for weather summarization (used for LLM conversion etc) */
export type DayPart = "morning" | "afternoon" | "evening";

// Helper interface for WeatherInfo - match UI
export interface WeatherInfo {
  label: string;
  range: {
    low: number;
    high: number;
  };
  icon: string[]; // Array of string, will be validated in frontend
  warning: string[];
}

// Centralized IconType definition, so it can be imported elsewhere.
export type IconType =
  | "cloud" | "cloud-drizzle" | "cloud-fog" | "cloud-hail" | "cloud-lightning"
  | "cloud-moon" | "cloud-moon-rain" | "cloud-rain" | "cloud-rain-wind" | "cloud-snow"
  | "cloud-sun" | "cloud-sun-rain" | "cloudy" | "moon" | "moon-star"
  | "snowflake" | "sun" | "sun-dim" | "sun-medium" | "sun-moon" | "sun-snow"
  | "thermometer-snowflake" | "thermometer-sun" | "tornado" | "umbrella" | "wind";
