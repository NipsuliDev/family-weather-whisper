import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// Import the ai-sdk and the Google provider for Gemini
import { GoogleGenerativeAIProvider } from "npm:ai-sdk-providers@0.2.5/google-generative-ai";
import { generateStructuredOutput } from "npm:ai-sdk@1.2.6";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Must match frontend types!
const DAYPARTS = ["morning", "afternoon", "evening"] as const;
type DayPart = typeof DAYPARTS[number];
type IconType = "sun" | "cloud" | "cloud-sun" | "rain" | "drizzle" | "wind";
interface WeatherInfo {
  label: string;
  temp: number;
  icon: IconType[];
  warning: string[];
  highlight?: boolean;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { forecast, dayPart } = await req.json();

    if (!forecast || !dayPart || !DAYPARTS.includes(dayPart)) {
      return new Response(
        JSON.stringify({
          error: "Missing or invalid 'forecast' or 'dayPart' (must be one of: morning, afternoon, evening)",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const google = new GoogleGenerativeAIProvider({
      apiKey: GEMINI_API_KEY,
      model: "gemini-2.0-flash",
    });

    // WeatherInfo schema for structured output
    const weatherInfoSchema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string", description: "A human-readable time period label, e.g., 'This morning'" },
          temp: { type: "number", description: "Representative temperature for the period (Celsius)" },
          icon: {
            type: "array",
            items: { type: "string", enum: ["sun", "cloud", "cloud-sun", "rain", "drizzle", "wind"] },
            description: "1-2 icon codes for summary",
            minItems: 1,
            maxItems: 2,
          },
          warning: {
            type: "array",
            items: { type: "string" },
            description: "Weather warnings or risk messages",
          },
          highlight: {
            type: "boolean",
            description: "Highlight if there is a drastic or safety-relevant situation",
            nullable: true
          },
        },
        required: ["label", "temp", "icon", "warning"],
        additionalProperties: false,
      },
      description: "Array of summarized weather info objects for UI display."
    };

    const prompt = `You are given a Google Weather hourly forecast: ${JSON.stringify(forecast)}.
It's currently the "${dayPart}" time window.
Summarize the forecast for a family weather app. For each relevant period, return an object with: label, temp (Celsius), 1-2 suitable weather icons (only "sun", "cloud", "cloud-sun", "rain", "drizzle", or "wind"), warnings as array, and highlight as boolean if there's notable safety/drastic change. Favor concise, actionable summaries. Output a pure JSON array, matching this schema, no markdown or explanation.`;

    const result = await generateStructuredOutput({
      model: google,
      maxRetries: 2,
      schema: weatherInfoSchema,
      prompt,
    });

    if (!result?.output || !Array.isArray(result.output)) {
      return new Response(
        JSON.stringify({ error: "Gemini did not return a valid WeatherInfo[] array", raw: result }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(result.output), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Unexpected error in convert-weather-info:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(err?.message || err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
