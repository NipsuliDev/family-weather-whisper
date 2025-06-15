
import React from "react";
import { MapPin } from "lucide-react";

interface Props {
  locError?: string | null;
  loading?: boolean;
}

export const LocationNotice: React.FC<Props> = ({ locError, loading }) => {
  if (loading) {
    return (
      <div className="flex flex-row items-center gap-2 bg-pink-100 border border-pink-200 rounded-lg px-4 py-2 mb-4 text-pink-700 text-sm animate-pulse">
        <MapPin size={20} className="opacity-70 mr-1" />
        Detecting your location for local weather…
      </div>
    );
  }

  if (locError) {
    return (
      <div className="flex flex-row items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 mb-4 text-yellow-900 text-sm font-semibold">
        <MapPin size={20} className="opacity-70 mr-1" />
        {locError}
      </div>
    );
  }

  return null;
};
