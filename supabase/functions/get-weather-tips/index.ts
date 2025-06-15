
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { forecast, dayPart, timezone, localTime, familyContext } = await req.json();

    // Validate input
    if (!forecast || !dayPart || !timezone || !localTime) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter(s): forecast, dayPart, timezone, localTime" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not set in Supabase secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Construct the prompt
    let prompt =
`You will be given weather data and a brief description of the user's family and clothing preferences.

ONLY output specific, actionable recommendations on what to wear and how to prepare for the weather for the next ~12 hours (the current and next two dayparts).
- Focus on clothing choices: for example, long vs short sleeves, if a jacket is needed, if rubber boots and rain gear are a good idea, or if one should consider avoiding going out entirely.
- Pay special attention to advice for children and day programs like daycare or school, such as suggesting packing extra clothes for the afternoon if the weather is expected to shift.
- Highlight important changes between morning, afternoon, and evening.

Inputs:
- forecast: ${JSON.stringify(forecast)}
- current dayPart: ${JSON.stringify(dayPart)}
- timezone: ${timezone}
- local time: ${localTime}
`;

    if (typeof familyContext === "string" && familyContext.trim().length > 0) {
      prompt += `
- family/preferences: ${familyContext}
`;
    }

    prompt += `

RESPONSE FORMAT:
- Write 1-2 short paragraphs of actionable advice (no markdown, no JSON, just plain text).
- Do NOT explain the weather in detail—focus on what to wear or pack and recommended actions.
`;

    // Call Gemini API
    const genAI = new GoogleGenAI(GEMINI_API_KEY);

    let genaiResult;
    try {
      genaiResult = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "text/plain",
          temperature: 0.5,
          maxOutputTokens: 512,
        }
      });
    } catch (err) {
      console.error("Gemini SDK error", err);
      return new Response(
        JSON.stringify({ error: "Gemini SDK error", detail: String(err) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    try {
      if (!genaiResult.text) throw new Error("No text output in genAI result");
      // Return plain text advice
      return new Response(genaiResult.text, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    } catch (err) {
      console.error("Parsing AI output failed", err);
      return new Response(
        JSON.stringify({
          error: "Error producing weather tips",
          detail: String(err),
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (err) {
    console.error("Weather tips function error", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(err?.message || err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
