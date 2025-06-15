import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { GoogleGenAI, Type } from "npm:@google/genai";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

// --- Structured output response schema with Type values, as per Gemini docs ---
const WeatherInfoSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      label: { type: "string" },
      temp: { type: "number" },
      icon: {
        type: "array",
        items: {
          type: "string",
          enum: ["sun", "cloud", "cloud-sun", "rain", "drizzle", "wind"]
        },
        minItems: 1,
        maxItems: 2,
      },
      warning: {
        type: "array",
        items: { type: "string" }
      },
      highlight: { type: "boolean" }
    },
    required: ["label", "temp", "icon", "warning"],
    propertyOrdering: ["label", "temp", "icon", "warning", "highlight"]
  },
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { forecast, dayPart } = await req.json();

    if (!forecast || !dayPart || !DAYPARTS.includes(dayPart)) {
      return new Response(
        JSON.stringify({
          error:
            "Missing or invalid 'forecast' or 'dayPart' (must be one of: morning, afternoon, evening)",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not set in Supabase secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the prompt for the LLM
    const prompt = `You are given a Google Weather hourly forecast: ${JSON.stringify(
      forecast
    )}.
It's currently the "${dayPart}" time window.
Summarize the forecast for a family weather app.
For each relevant period, return: label (string), temp (Celsius, number), icon (array of 1-2 from "sun", "cloud", "cloud-sun", "rain", "drizzle", "wind"), warning (array of strings), highlight (optional boolean). 
No markdown, no explanation. Return only the JSON array.`;

    // Now use the documented responseMimeType and responseSchema (not tools)
    const genAI = new GoogleGenAI(GEMINI_API_KEY);
    let geminiResult;
    try {
      geminiResult = await genAI.models.generateContent({
        model: "gemini-1.5-flash-latest",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: WeatherInfoSchema,
          temperature: 0.4,
          maxOutputTokens: 600,
        },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Gemini SDK error", detail: String(err) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Response parsed as JSON
    let parsed: WeatherInfo[] | null = null;
    try {
      let outputRaw = geminiResult.response?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!outputRaw) {
        outputRaw = geminiResult.response?.candidates?.[0]?.content?.parts?.[0]?.functionCall?.args;
      }
      if (!outputRaw) throw new Error("No JSON output from Gemini");

      parsed = typeof outputRaw === "string" ? JSON.parse(outputRaw) : outputRaw;

      if (!Array.isArray(parsed)) throw new Error("Not an array");
      for (const w of parsed) {
        if (
          typeof w.label !== "string" ||
          typeof w.temp !== "number" ||
          !Array.isArray(w.icon) ||
          !w.icon.length ||
          !w.icon.every((ic: string) =>
            ["sun", "cloud", "cloud-sun", "rain", "drizzle", "wind"].includes(ic)
          ) ||
          !Array.isArray(w.warning) ||
          (typeof w.highlight !== "undefined" && typeof w.highlight !== "boolean")
        ) {
          throw new Error("Validation failed on WeatherInfo objects");
        }
      }
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "AI output parse/validation error",
          detail: String(err),
          ai_output: geminiResult?.response,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(parsed), {
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
