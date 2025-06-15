import {
  Sun, Cloud, CloudRain, Wind, CloudDrizzle, CloudSun, CloudFog, CloudHail, CloudLightning, CloudMoon,
  CloudMoonRain, CloudRainWind, CloudSnow, CloudSunRain, Cloudy, Moon, MoonStar, Snowflake,
  SunDim, SunMedium, SunMoon, SunSnow, ThermometerSnowflake, ThermometerSun, Tornado, Umbrella
} from "lucide-react";
import React from "react";
import type { IconType } from "@/integrations/googleWeather"; // Centralized import

const iconMap: Record<IconType, React.ElementType> = {
  sun: Sun,
  "sun-dim": SunDim,
  "sun-medium": SunMedium,
  "sun-moon": SunMoon,
  "sun-snow": SunSnow,
  cloud: Cloud,
  "cloud-drizzle": CloudDrizzle,
  "cloud-fog": CloudFog,
  "cloud-hail": CloudHail,
  "cloud-lightning": CloudLightning,
  "cloud-moon": CloudMoon,
  "cloud-moon-rain": CloudMoonRain,
  "cloud-rain": CloudRain,
  "cloud-rain-wind": CloudRainWind,
  "cloud-snow": CloudSnow,
  "cloud-sun": CloudSun,
  "cloud-sun-rain": CloudSunRain,
  cloudy: Cloudy,
  moon: Moon,
  "moon-star": MoonStar,
  snowflake: Snowflake,
  "thermometer-snowflake": ThermometerSnowflake,
  "thermometer-sun": ThermometerSun,
  tornado: Tornado,
  umbrella: Umbrella,
  wind: Wind,
};

export interface WeatherInfo {
  label: string;
  range: {
    low: number;
    high: number;
  };
  icon: IconType[]; // Now supports 1–5
  warning: string[];
}

export const WeatherCard: React.FC<WeatherInfo> = ({
  label,
  range,
  icon,
  warning,
}) => {
  const icons = icon;

  return (
    <div
      className={`card flex flex-col items-center gap-2 w-full max-w-sm md:w-48 min-w-[210px] border border-pink-200`}
      style={{
        borderRadius: "1.5rem",
        marginLeft: 0,
        marginRight: 0,
      }}
    >
      <div className="text-xs font-semibold uppercase mb-0.5 text-center text-pink-900">{label}</div>
      <div className={`flex flex-row items-center gap-1 mb-1 ${icons.length > 2 ? "flex-wrap" : ""}`}>
        {icons.map((ic, idx) => {
          const IconComp = iconMap[ic];
          // fallback if AI "hallucinates": just skip icon
          if (!IconComp) return null;
          return (
            <IconComp
              size={32}
              color="#d84875"
              className="inline-block"
              aria-label={ic}
              key={ic + idx}
            />
          );
        })}
      </div>
      <div className="text-2xl font-bold mb-1 text-pink-900">
        {Math.round(range.low)}° – {Math.round(range.high)}°
      </div>
      {warning && warning.length > 0 && (
        <div className="flex flex-col items-center gap-1 mt-0.5 w-full">
          {warning.map((w, i) => (
            <div
              key={w + i}
              className="text-[11px] bg-accent-warn text-pink-700 px-2 py-1 rounded font-medium text-center w-full"
            >
              {w}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
