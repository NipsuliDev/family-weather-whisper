
/**
 * Typed helper for calling Google Weather edge function
 * Ref: https://developers.google.com/maps/documentation/weather/reference/rest/v1/forecast.hours/lookup
 */

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

export async function getGoogleWeatherHourly(
  params: { lat: number; lng: number; hours?: number },
  accessToken: string // raw supabase key (picked up from client)
): Promise<GoogleHourlyForecastResponse> {
  const res = await fetch(
    "https://bpyasttvqzornqrvksog.functions.supabase.co/get-google-weather",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": accessToken,
      },
      body: JSON.stringify({
        lat: params.lat,
        lng: params.lng,
        hours: params.hours ?? 24
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`Weather API failed: ${res.statusText}`);
  }
  return res.json();
}
