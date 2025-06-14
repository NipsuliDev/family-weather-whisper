import React from "react";
import { LogoutButton } from "@/components/LogoutButton";

const FAMILY_KEY = "family_info";

export default function SettingsPage() {
  const [family, setFamily] = React.useState(() => localStorage.getItem(FAMILY_KEY) || "");

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFamily(e.target.value);
    localStorage.setItem(FAMILY_KEY, e.target.value);
  };

  return (
    <div className="flex flex-col items-center w-full pt-10 pb-24 animate-fade-in">
      <div className="flex w-full items-center justify-between md:w-96 mb-4">
        <h2 className="text-2xl font-bold text-pink-700">Family Settings</h2>
        <LogoutButton />
      </div>
      <label htmlFor="family" className="block text-sm text-pink-700 mb-2">
        Briefly describe your family and clothing preferences. This helps personalize the recommendations!
      </label>
      <textarea
        id="family"
        placeholder="E.g. 2 adults, 2 kids aged 7 and 5. We prefer layered clothing for kids..."
        className="w-full md:w-96 min-h-32 rounded-xl bg-white border-2 border-pink-200 focus:border-pink-400 p-3 shadow"
        value={family}
        onChange={handleChange}
      />
    </div>
  );
}
