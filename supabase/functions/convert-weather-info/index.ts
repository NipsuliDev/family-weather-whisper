
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WeatherInfo {
  label: string;
  temp: number;
  icon: string[];
  warning: string[];
  highlight?: boolean;
}

const DAYPARTS = ["morning", "afternoon", "evening"] as const;
type DayPart = typeof DAYPARTS[number];

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

    // Prompt for Gemini: expects WeatherInfo[] JSON output, day part provided, explain or mark warning/highlight
    const prompt = [
      {
        role: "user",
        parts: [
          { text:
`Given this JSON weather forecast (in Google Weather API hourly format) and the current time period "${dayPart}", generate an array of summary objects suitable for a family weather app. 
Each object (WeatherInfo) should summarize main period labels (e.g. 'This morning', 'This afternoon', 'This evening'), pick main temp for the period, assign 1-2 icons from: ["sun", "cloud", "cloud-sun", "rain", "drizzle", "wind"], list any weather warnings, and mark highlight if there's a safety or drastic change (high UV, flood risk, etc). Prefer concise, actionable summaries. Output full WeatherInfo[] as valid JSON (no markdown, just plain JSON).

Here is the forecast JSON:
${JSON.stringify(forecast)}
`}
        ]
      }
    ];

    const geminiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: prompt,
        generationConfig: {
          response_mime_type: "application/json",
        },
        tools: [],
        safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }]
      }),
    });

    if (!geminiRes.ok) {
      const errorDetail = await geminiRes.text();
      console.error("Gemini API error:", errorDetail);
      return new Response(
        JSON.stringify({ error: "Failed to call Gemini", detail: errorDetail }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiRes.json();
    
    // Gemini's structured response format: data.candidates[0].content.parts[0].text (as JSON string of WeatherInfo[])
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    let parsed: WeatherInfo[] | null = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch (err) {
      console.error("Failed to parse Gemini output as JSON", err, text);
    }

    if (!Array.isArray(parsed)) {
      return new Response(
        JSON.stringify({ error: "Gemini output was not a WeatherInfo[] JSON array", raw: text }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
