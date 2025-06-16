
import React from "react";
import { LogoutButton } from "@/components/LogoutButton";
import { useFamilySettings } from "@/hooks/useFamilySettings";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

export default function SettingsPage() {
  const { family, setFamily } = useFamilySettings();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFamily(e.target.value);
  };

  const handleFeedbackClick = () => {
    window.open("https://github.com/NipsuliDev/family-weather-whisper/issues", "_blank");
  };

  return (
    <div className="w-full px-4 md:px-0">
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
        
        <Button
          onClick={handleFeedbackClick}
          variant="outline"
          className="mt-6 w-full md:w-96 text-pink-700 border-pink-300 hover:bg-pink-50"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Give Feedback
        </Button>
      </div>
    </div>
  );
}
