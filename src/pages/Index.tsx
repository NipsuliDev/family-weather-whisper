
import React from "react";
import { WeatherCard, WeatherInfo } from "../components/WeatherCard";
import { WeatherSummaryText } from "../components/WeatherSummaryText";
import { getDayParts } from "../lib/dayParts";

// Import IconType for stricter typing
import type { IconType } from "@/components/WeatherCard";

function getWeatherMock(): WeatherInfo[] {
  const now = new Date();
  const parts = getDayParts(now);
  // Example usage storing warning as array, icon as IconType[]
  return [
    {
      label: parts.current,
      temp: 17,
      icon: ["cloud-sun", "wind"] as IconType[],
      warning: [],
    },
    {
      label: parts.next[0],
      temp: 23,
      icon: ["sun"] as IconType[],
      warning: ["High UV"],
      highlight: true,
    },
    {
      label: parts.next[1],
      temp: 17,
      icon: ["rain", "wind"] as IconType[],
      warning: ["Possible flooding", "Strong wind"],
      highlight: true,
    },
  ];
}

export default function WeatherPage() {
  const data = React.useMemo(getWeatherMock, []);
  const suggestion = `Today starts off cloudy and cool. By afternoon, it will be sunny and quite warm, so dress the kids in layers and pack sunscreen. Expect rain by evening—bring a light raincoat and umbrella for pickup!`;

  return (
    <div className="w-full flex flex-col items-center pt-8 pb-24 animate-fade-in bg-pink-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-pink-700">Family Weather</h1>
      <div className="w-full flex flex-col gap-6 mb-7 items-center justify-center max-w-3xl px-4">
        {data.map((w) => (
          <WeatherCard key={w.label} {...w} />
        ))}
      </div>
      <WeatherSummaryText text={suggestion} />
    </div>
  );
}
