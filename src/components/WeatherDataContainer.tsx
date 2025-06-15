import React from "react";
import { WeatherCard, IconType } from "./WeatherCard";
import { useWeatherData } from "@/hooks/useWeatherData";
import { Skeleton } from "./ui/skeleton";
import {
  Sun, CloudRain, Wind, Cloud, CloudSun, CloudDrizzle, CloudFog, CloudHail, CloudLightning, CloudMoon,
  CloudMoonRain, CloudRainWind, CloudSnow, CloudSunRain, Cloudy, Moon, MoonStar, Snowflake,
  SunDim, SunMedium, SunMoon, SunSnow, ThermometerSnowflake, ThermometerSun, Tornado, Umbrella
} from "lucide-react";

// Helper: fun animated weather loader
function WeatherLoadingIndicator() {
  return (
    <div className="flex flex-col items-center py-8 w-full gap-3">
      <div className="flex flex-row gap-3 animate-pulse">
        <Sun size={42} color="#ffd73b" className="animate-spin-slow" />
        <CloudSun size={42} color="#ffcbe2" className="animate-bounce" />
        <Cloud size={42} color="#dce5f7" className="animate-fade-in" />
        <Wind size={42} color="#e66c96" className="animate-wiggle" />
        <CloudRain size={42} color="#b6e1fa" className="animate-bounce" />
      </div>
      <div className="mt-4">
        <Skeleton className="w-64 h-10 rounded-2xl mb-2" />
        <Skeleton className="w-40 h-4 rounded-xl" />
      </div>
      <div className="font-semibold text-pink-600 text-md animate-pulse mt-4">
        Fetching family-friendly weather…
      </div>
    </div>
  );
}

// Helper: error block
function WeatherErrorIndicator({ error }: { error: Error | null }) {
  return (
    <div className="flex flex-col items-center py-8 w-full">
      <span className="bg-pink-100 text-pink-800 px-4 py-2 rounded-lg font-semibold shadow animate-fade-in">
        {error ? error.message : "Something went wrong with weather data…"}
      </span>
      <div className="flex flex-row gap-2 mt-4 opacity-70">
        <CloudRain size={32} color="#ff726f" />
        <Wind size={32} color="#f5b6ce" />
      </div>
    </div>
  );
}

// Expanded valid IconTypes (see WeatherCard and integrations/googleWeather)
const ALLOWED_ICONS: IconType[] = [
  "cloud","cloud-drizzle","cloud-fog","cloud-hail","cloud-lightning","cloud-moon","cloud-moon-rain",
  "cloud-rain","cloud-rain-wind","cloud-snow","cloud-sun","cloud-sun-rain","cloudy","moon","moon-star",
  "snowflake","sun","sun-dim","sun-medium","sun-moon","sun-snow","thermometer-snowflake",
  "thermometer-sun","tornado","umbrella","wind"
];

// Main container
export const WeatherDataContainer: React.FC = () => {
  const { summary, loading, error } = useWeatherData();

  if (loading) {
    return <WeatherLoadingIndicator />;
  }

  if (error) {
    return <WeatherErrorIndicator error={error as Error} />;
  }

  if (summary && summary.length > 0) {
    return (
      <div className="w-full flex flex-col gap-6 items-center justify-center max-w-3xl px-4 animate-fade-in">
        {summary.map((w) => {
          // Safely cast icons to IconType[]
          const safeIcons: IconType[] = Array.isArray(w.icon)
            ? w.icon.filter((ic: string): ic is IconType => ALLOWED_ICONS.includes(ic as IconType))
            : [];

          return (
            <WeatherCard
              key={w.label}
              label={w.label}
              range={w.range}
              icon={safeIcons}
              warning={w.warning}
            />
          );
        })}
      </div>
    );
  }

  // Empty state (should rarely hit)
  return (
    <div className="flex flex-col items-center py-8 w-full">
      <span className="text-pink-900 font-semibold mt-8">No weather information found.</span>
    </div>
  );
};

// Custom CSS for fancy icon animations (spin-slow, wiggle)
const styleElem = document.createElement("style");
styleElem.innerHTML = `
@keyframes spin-slow { 100% { transform: rotate(360deg); } }
@keyframes wiggle { 0%,100%{ transform: rotate(-1deg);} 20%,80%{transform: rotate(3deg);} 50%{transform:rotate(-3deg);} }
.animate-spin-slow { animation: spin-slow 3s linear infinite; }
.animate-wiggle { animation: wiggle 1.5s ease-in-out infinite; }
`;
if (typeof window !== "undefined" && !document.getElementById("weather-anim-css")) {
  styleElem.id = "weather-anim-css";
  document.head.appendChild(styleElem);
}
