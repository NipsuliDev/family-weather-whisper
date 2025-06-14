
import React from "react";
import { WeatherCard, WeatherInfo } from "../components/WeatherCard";
import { WeatherSummaryText } from "../components/WeatherSummaryText";
import { getDayParts } from "../lib/dayParts";

// -- MOCK DATA for now
function getWeatherMock() {
  // This would be replaced by actual weather API calls.
  const now = new Date();
  const parts = getDayParts(now);
  // Simulate possible big weather change for demonstration.
  return [
    {
      label: parts.current,
      temp: 17,
      icon: "cloud-sun",
      warning: undefined,
    },
    {
      label: parts.next[0],
      temp: 23,
      icon: "sun",
      warning: "High UV",
      highlight: true,
    },
    {
      label: parts.next[1],
      temp: 17,
      icon: "rain",
      warning: undefined,
      highlight: true,
    },
  ] as WeatherInfo[];
}

export default function WeatherPage() {
  const data = React.useMemo(getWeatherMock, []);
  // This should be replaced by personalized text based on weather and settings.
  const suggestion = `Today starts off cloudy and cool. By afternoon, it will be sunny and quite warm, so dress the kids in layers and pack sunscreen. Expect rain by evening—bring a light raincoat and umbrella for pickup!`;

  return (
    <div className="w-full flex flex-col items-center pt-8 pb-24 animate-fade-in">
      <h1 className="text-3xl font-bold mb-6 text-pink-700">Family Weather</h1>
      <div className="w-full flex overflow-x-auto gap-4 mb-7 px-2 max-w-3xl scrollbar-hide">
        {data.map((w) => (
          <WeatherCard key={w.label} {...w} />
        ))}
      </div>
      <WeatherSummaryText text={suggestion} />
    </div>
  );
}

