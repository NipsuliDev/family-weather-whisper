import { Sun, Cloud, CloudRain, Wind, CloudDrizzle, CloudSun } from "lucide-react";
import React from "react";

export type IconType = "sun" | "cloud" | "cloud-sun" | "rain" | "drizzle" | "wind";
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
  range: {
    low: number;
    high: number;
  };
  icon: IconType[];
  warning: string[];
}

export const WeatherCard: React.FC<WeatherInfo> = ({
  label,
  range,
  icon,
  warning,
}) => {
  // icons is always an array now
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
      <div className="flex flex-row items-center gap-1 mb-1">
        {icons.map((ic, idx) => {
          const IconComp = iconMap[ic];
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
