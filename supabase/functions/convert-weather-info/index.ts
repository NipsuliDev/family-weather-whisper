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

const WeatherInfoSchema = Type.array(
  Type.object({
    label: Type.string(),
    temp: Type.number(),
    icon: Type.array(
      Type.union([
        Type.literal("sun"),
        Type.literal("cloud"),
        Type.literal("cloud-sun"),
        Type.literal("rain"),
        Type.literal("drizzle"),
        Type.literal("wind"),
      ])
    ),
    warning: Type.array(Type.string()),
    highlight: Type.optional(Type.boolean())
  })
);

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    // Some browsers require status 200 for CORS preflight
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

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not set in Supabase secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build prompt for the LLM
    const prompt = `You are given a Google Weather hourly forecast: ${JSON.stringify(
      forecast
    )}.
It's currently the "${dayPart}" time window.
Summarize the forecast for a family weather app.
For each relevant period, return: label (string), temp (Celsius, number), icon (array of 1-2 from "sun", "cloud", "cloud-sun", "rain", "drizzle", "wind"), warning (array of strings), highlight (optional boolean). 
No markdown, no explanation. Return only the JSON array.`;

    // Gemini API with Structured Output
    const genAI = new GoogleGenAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 600,
      },
    });

    // Ask Google Gemini for structured weather info
    let geminiResult;
    try {
      geminiResult = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [{ functionDeclarations: [WeatherInfoSchema] }],
        toolConfig: { functionCallingConfig: { mode: "ANY" } }
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Gemini SDK error", detail: String(err) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Parse and validate the structured output (see docs for Gemini structured tools)
    let parsed: WeatherInfo[] | null = null;
    try {
      // Extract function call output
      const candidate = geminiResult.response.candidates?.[0];
      const fnArguments = candidate?.content?.parts?.find((p: any) => 
        p.functionCall && p.functionCall.args
      )?.functionCall?.args;

      if (!fnArguments) {
        throw new Error("Gemini did not return any structured output.");
      }
      // Output is already type-checked, but we'll still validate structure
      // (If Gemini returns a stringified JSON, parse if needed)
      if (typeof fnArguments === "string") {
        parsed = JSON.parse(fnArguments);
      } else {
        parsed = fnArguments as WeatherInfo[];
      }

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
