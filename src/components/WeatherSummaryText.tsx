
import React from "react";

interface Props {
  text: string;
}

export const WeatherSummaryText: React.FC<Props> = ({ text }) => (
  <div className="bg-pink-100 text-pink-900 rounded-xl p-4 mt-2 text-lg font-medium leading-snug shadow-card animate-fade-in">
    {text}
  </div>
);
