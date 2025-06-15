
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { GoogleGenAI, Type } from "npm:@google/genai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAYPARTS = ["morning", "afternoon", "evening"] as const;

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
          error: "Missing or invalid 'forecast' or 'dayPart' (must be one of: morning, afternoon, evening)",
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
For each relevant period, return: label (string), temp (Celsius, number), icon (array of 1-2 from "sun", "cloud", "cloud-sun", "rain", "drizzle", "wind"), warning (array of strings), highlight (boolean).
No markdown, no explanation. Return only the JSON array.`;

    const genAI = new GoogleGenAI(GEMINI_API_KEY);

    let geminiResult;
    try {
      geminiResult = await genAI.models.generateContent({
        model: "gemini-1.5-flash-latest",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                temp: { type: Type.NUMBER },
                icon: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                    enum: ["sun", "cloud", "cloud-sun", "rain", "drizzle", "wind"],
                  },
                  minItems: 1,
                  maxItems: 2,
                },
                warning: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                highlight: { type: Type.BOOLEAN },
              },
              required: ["label", "temp", "icon", "warning", "highlight"],
              propertyOrdering: ["label", "temp", "icon", "warning", "highlight"],
            },
          },
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

    try {
      const outputText = geminiResult.response?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!outputText) throw new Error("No JSON output from Gemini");

      // The Google docs example puts JSON directly into text, so just parse and return.
      const parsed = JSON.parse(outputText);

      return new Response(JSON.stringify(parsed), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "AI output parse/validation error",
          detail: String(err),
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (err) {
    console.error("Unexpected error in convert-weather-info:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(err?.message || err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
