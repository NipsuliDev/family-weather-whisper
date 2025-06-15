
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
    const { forecast, dayPart, timezone, localTime } = await req.json();

    // Validate inputs
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
    if (!timezone || typeof timezone !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'timezone' (IANA TZ string)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    if (!localTime || typeof localTime !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'localTime' (ISO 8601 string)" }),
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
    const prompt = 
`You are given a Google Weather hourly forecast: ${JSON.stringify(forecast)}.

The local timezone for this forecast is "${timezone}" and the current local time is "${localTime}".

The user has requested a family-friendly weather summary for the current part of the day ("daypart") which is "${dayPart}".

Your output should be an array of JSON objects, where each object summarizes weather for a specific time window during this part of the day.

FOR THE "label" FIELD: The value MUST be EXACTLY one of the following (case-insensitive): "morning", "afternoon", "evening" (these are called the DAYPARTS). DO NOT use any other label or add extra wording. Only use one of these three words for the "label".

For each object, set the following fields:
- "label" (string): (see previous instruction)
- "range" (object): The low and high temperatures *in Celsius* for this window, e.g., { "low": 16, "high": 22 }.
- "icon" (array): 1–2 of ["sun", "cloud", "cloud-sun", "rain", "drizzle", "wind"] representing the most important weather for the window.
- "warning" (array): Any important safety advisories or short tips in strings (e.g., "Bring an umbrella", "Strong wind").

ONLY return the JSON array of summaries. Do not return any markdown, do not provide explanations. Output must be valid JSON only.
`;

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
                range: {
                  type: Type.OBJECT,
                  properties: {
                    low: { type: Type.NUMBER },
                    high: { type: Type.NUMBER },
                  },
                  required: ["low", "high"],
                },
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
              },
              required: ["label", "range", "icon", "warning"],
              propertyOrdering: ["label", "range", "icon", "warning"],
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
      if (!geminiResult.text) throw new Error("No JSON output in geminiResult.text");
      // Directly parse the output using geminiResult.text
      const parsed = JSON.parse(geminiResult.text);
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
