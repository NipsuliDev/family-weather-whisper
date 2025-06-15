
import React from "react";
import { WeatherDataContainer } from "../components/WeatherDataContainer";
import { WeatherSummaryText } from "../components/WeatherSummaryText";
import { useHourlyWeather } from "@/hooks/useHourlyWeather";
import { LocationNotice } from "../components/LocationNotice";

export default function WeatherPage() {
  const suggestion = `Today starts off cloudy and cool. By afternoon, it will be sunny and quite warm, so dress the kids in layers and pack sunscreen. Expect rain by evening—bring a light raincoat and umbrella for pickup!`;

  // Use only for location/error display, not for weather data
  const { locError, locationLoading } = useHourlyWeather();

  return (
    <div className="w-full flex flex-col items-center pt-8 pb-24 animate-fade-in bg-pink-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-pink-700">Family Weather</h1>
      <LocationNotice locError={locError} loading={locationLoading} />
      <WeatherDataContainer />
      <WeatherSummaryText text={suggestion} />
    </div>
  );
}
