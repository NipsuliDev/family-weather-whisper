
import React from "react";
import { useWeatherTips } from "@/hooks/useWeatherTips";

interface Props {
  familyContext?: string;
}

export const WeatherSummaryText: React.FC<Props> = ({ familyContext }) => {
  const { tips, loading, error } = useWeatherTips({ familyContext });

  if (loading) {
    return (
      <div className="bg-pink-100 text-pink-900 rounded-xl p-4 mt-2 text-lg font-medium leading-snug shadow-card animate-fade-in">
        Generating personalized weather advice…
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-pink-100 text-pink-900 rounded-xl p-4 mt-2 text-lg font-medium leading-snug shadow-card animate-fade-in">
        Sorry, couldn't fetch weather tips. {error.message}
      </div>
    );
  }

  if (!tips) return null;

  return (
    <div className="bg-pink-100 text-pink-900 rounded-xl p-4 mt-2 text-lg font-medium leading-snug shadow-card animate-fade-in">
      {tips}
    </div>
  );
};
