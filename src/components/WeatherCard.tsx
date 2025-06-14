
import { Sun, Cloud, CloudRain, Wind, CloudDrizzle, CloudSun } from "lucide-react";
import React from "react";

type IconType = "sun" | "cloud" | "cloud-sun" | "rain" | "drizzle" | "wind";
const iconMap: Record<IconType, React.ElementType> = {
  sun: Sun,
  cloud: Cloud,
  "cloud-sun": CloudSun,
  rain: CloudRain,
  drizzle: CloudDrizzle,
  wind: Wind,
};

export interface WeatherInfo {
  label: string;
  temp: number;
  icon: IconType;
  warning?: string;
  highlight?: boolean;
}

export const WeatherCard: React.FC<WeatherInfo> = ({
  label,
  temp,
  icon,
  warning,
  highlight = false,
}) => {
  const IconComp = iconMap[icon];
  return (
    <div className={`card flex flex-col items-center gap-2 w-full md:w-52 ${highlight ? "card-highlight" : ""}`}>
      <div className="text-xs font-semibold uppercase mb-2">{label}</div>
      <IconComp size={44} color="#d84875" className="mb-1" aria-label={icon} />
      <div className="text-3xl font-bold mb-1">{Math.round(temp)}°</div>
      {warning && (
        <div className="text-xs bg-accent-warn text-pink-700 px-2 py-0.5 rounded font-medium">{warning}</div>
      )}
    </div>
  );
};
