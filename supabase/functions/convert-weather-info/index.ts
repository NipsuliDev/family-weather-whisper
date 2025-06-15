import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { GoogleGenAI, Type } from "npm:@google/genai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ICONS = [
  "cloud",
  "cloud-drizzle",
  "cloud-fog",
  "cloud-hail",
  "cloud-lightning",
  "cloud-moon",
  "cloud-moon-rain",
  "cloud-rain",
  "cloud-rain-wind",
  "cloud-snow",
  "cloud-sun",
  "cloud-sun-rain",
  "cloudy",
  "moon",
  "moon-star",
  "snowflake",
  "sun",
  "sun-dim",
  "sun-medium",
  "sun-moon",
  "sun-snow",
  "thermometer-snowflake",
  "thermometer-sun",
  "tornado",
  "umbrella",
  "wind"
];
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

The user interface will display THREE weather summary cards:
1. The current daypart ("morning", "afternoon", or "evening") based on the given local time.
2. The next upcoming daypart in the order described below.
3. The following daypart after that (if the day changes, label it as "Tomorrow morning" or "Tomorrow afternoon" as appropriate).

For the next two dayparts, follow this rule:
- If the current daypart is "morning", use "afternoon" and "evening".
- If the current daypart is "afternoon", use "evening" and "tomorrow morning".
- If the current daypart is "evening", use "tomorrow morning" and "tomorrow afternoon".

Return ONLY an array of three JSON objects for these three dayparts, IN ORDER (current, next, and the following).
- For each object, set the field "label" as EXACTLY one of: "morning", "afternoon", or "evening" (case-insensitive). Do NOT add "today", "tonight", etc.
- The "label" MUST be one of those three. DO NOT use any other label or extra text.

For each object, set these fields:
- "label" (string): the daypart ("morning", "afternoon", or "evening"), matching the above requirements.
- "range" (object): The low and high temperatures in Celsius for that window, e.g., { "low": 16, "high": 22 }.
- "icon" (array): 1–5 of [${ICONS.map((i) => `"${i}"`).join(", ")}] representing the most important weather for the window. Pick the best-fit comfort & safety-wise (e.g., sun, various clouds, precipitation type, wind, umbrella, thermometer-sun, etc).
- "warning" (array): Only include safety advisories or tips for extreme, hazardous, or significant weather events (e.g., strong wind, high UV, ice, heavy thunder, hail, extreme heat/cold, severe rain, etc). Do NOT include routine recommendations for light rain, mild conditions, or generic tips. Leave the array empty if there are no significant warnings.

Return ONLY the JSON array of three weather summaries. Do not return markdown or explanations. Output must be valid JSON only.
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
                    enum: ICONS,
                  },
                  minItems: 1,
                  maxItems: 5,
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
