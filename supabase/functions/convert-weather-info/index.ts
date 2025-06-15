
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

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

    // Prompt for Gemini
    const prompt = `You are given a Google Weather hourly forecast: ${JSON.stringify(forecast)}.
It's currently the "${dayPart}" time window.
Summarize the forecast for a family weather app. 
For each relevant period, return a JSON object with: label (string), temp (Celsius, number), icon (array, 1-2, only "sun", "cloud", "cloud-sun", "rain", "drizzle", or "wind"), warnings (array of strings), and highlight (boolean, optional). Output a pure JSON array ONLY. Do not include markdown or any explanation. Example: [{"label":"This morning","temp":23,"icon":["sun"],"warning":[]}]`;

    // Prepare Gemini API payload
    const geminiReqBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 600,
        responseMimeType: "application/json"
      }
    };

    const geminiResp = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(geminiReqBody)
    });

    if (!geminiResp.ok) {
      const errorText = await geminiResp.text();
      return new Response(
        JSON.stringify({ error: "Gemini API error", detail: errorText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResp.json();
    // Gemini API returns candidates[].content.parts[].text
    // We'll find the first candidate with a .content.parts[0].text
    let rawJson = null;
    try {
      rawJson =
        geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
        geminiData?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (_e) {}
    if (!rawJson) {
      return new Response(
        JSON.stringify({ error: "Gemini did not return usable output", raw: geminiData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Remove potential markdown code block, trim, parse
    let content = String(rawJson).trim();
    // Remove leading "```json" or "```"
    if (content.startsWith("```json")) content = content.slice(7);
    else if (content.startsWith("```")) content = content.slice(3);
    content = content.trim();
    if (content.endsWith("```")) content = content.slice(0, -3).trim();

    let parsed: WeatherInfo[] | null = null;
    try {
      parsed = JSON.parse(content);
      // Validate: must be an array of objects with required props
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
          throw new Error("Validation failed on WeatherInfo object(s)");
        }
      }
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "AI output parse/validation error", detail: String(err), ai_output: content }),
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
