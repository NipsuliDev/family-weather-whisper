
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const GOOGLE_WEATHER_API_KEY = Deno.env.get("GOOGLE_WEATHER_API_KEY");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lng, hours = 24 } = await req.json();

    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      isNaN(lat) ||
      isNaN(lng)
    ) {
      return new Response(
        JSON.stringify({
          error: "Invalid or missing 'lat' and 'lng' in request body.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // https://developers.google.com/maps/documentation/weather/reference/rest/v1/forecast.hours/lookup
    // Example base: https://weatherapi.googleapis.com/v1/hourly?location.lat=...&location.lng=...&key=...

    const endpoint = `https://weatherapi.googleapis.com/v1/hourly?location.lat=${lat}&location.lng=${lng}&hours=${hours}&key=${GOOGLE_WEATHER_API_KEY}`;

    const apiRes = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!apiRes.ok) {
      const errorDetail = await apiRes.text();
      console.error("Google Weather API error:", errorDetail);
      return new Response(
        JSON.stringify({ error: "Failed to fetch weather data.", detail: errorDetail }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const weather = await apiRes.json();

    // Only return the relevant next N (24) hours per API reference
    return new Response(JSON.stringify(weather), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in get-google-weather:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(error?.message || error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
