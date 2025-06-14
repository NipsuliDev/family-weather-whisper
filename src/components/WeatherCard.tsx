
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
    <div
      className={`card flex flex-col items-center gap-1 w-32 md:w-40 min-w-[8rem] max-w-[9rem] ${highlight ? "card-highlight" : ""}`}
      style={{ flexShrink: 0 }}
    >
      <div className="text-[10px] font-semibold uppercase mb-1 text-center">{label}</div>
      <IconComp size={32} color="#d84875" className="mb-0.5" aria-label={icon} />
      <div className="text-2xl font-bold mb-0.5">{Math.round(temp)}°</div>
      {warning && (
        <div className="text-[10px] bg-accent-warn text-pink-700 px-1.5 py-0.5 rounded font-medium mt-0.5 text-center">{warning}</div>
      )}
    </div>
  );
};
