
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

    // Construct the prompt (updated to be only 1 paragraph, clothing tips only)
    let prompt =
`Give a single concise paragraph with actionable recommendations about what to wear for the next ~12 hours, strictly based on the provided weather data.

Your ONLY focus is on clear, specific clothing advice for the whole family (infants, children, adults). Give recommendations like: short sleeves or long sleeves, whether to add a jacket, if layers are wise, if boots or rain clothes are necessary, if rubber boots are needed, or if the weather calls for staying indoors. Mention when weather changes during the day mean an outfit swap will help, particularly for children headed to daycare or school.

Do NOT explain or recap the general weather, do NOT talk about packing or preparations, ONLY list what to wear or put on, and if it's better to avoid outdoor activities for comfort/safety.

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
- Only a single paragraph, only about clothing choices. No markdown, no lists, no JSON, just plain text.
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
