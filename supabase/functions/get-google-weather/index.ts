
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user from auth token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { lat, lng, hours = 24 } = await req.json();

    if (!GOOGLE_WEATHER_API_KEY) {
      console.error("GOOGLE_WEATHER_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "Google Weather API key is not set." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Use the correct API endpoint and parameters per Google documentation
    const endpoint = `https://weather.googleapis.com/v1/forecast/hours:lookup` +
      `?key=${encodeURIComponent(GOOGLE_WEATHER_API_KEY)}` +
      `&location.latitude=${encodeURIComponent(lat)}` +
      `&location.longitude=${encodeURIComponent(lng)}` +
      (hours ? `&hours=${encodeURIComponent(hours)}` : "");

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
