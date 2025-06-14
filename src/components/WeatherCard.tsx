
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
      className={`card flex flex-col items-center gap-2 w-full max-w-sm md:w-48 min-w-[210px] ${highlight ? "card-highlight" : ""} ${
        highlight
          ? "border-2 border-pink-400 bg-pink-100"
          : "border border-pink-200"
      }`}
      style={{
        borderRadius: "1.5rem",
        marginLeft: 0,
        marginRight: 0,
      }}
    >
      <div className="text-xs font-semibold uppercase mb-0.5 text-center text-pink-900">{label}</div>
      <IconComp size={36} color="#d84875" className="mb-1" aria-label={icon} />
      <div className="text-2xl font-bold mb-1 text-pink-900">{Math.round(temp)}°</div>
      {warning && (
        <div className="text-[11px] bg-accent-warn text-pink-700 px-2 py-1 rounded font-medium mt-0.5 text-center">
          {warning}
        </div>
      )}
    </div>
  );
};
