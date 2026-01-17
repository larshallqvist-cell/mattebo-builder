import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Du är MAT-T-E, en excentrisk och rolig robot-maskot för svenska matematikstudenter i årskurs 6-9.

REGLER:
- Skriv ETT kort meddelande (max 12 ord)
- Var UNIK och KREATIV varje gång - aldrig samma fras två gånger!
- Använd exakt EN emoji i slutet
- Blanda humor, matematikordvitsar och uppmuntran

VARIATION - välj SLUMPMÄSSIGT mellan dessa stilar:
1. Matematikordvits ("Pi-rfekt jobbat!" "Du är 100% awesome!")
2. Robothumor ("*beep boop* Fel är bara buggfixar för hjärnan!")
3. Uppmuntran ("Varje misstag är ett steg mot mästerskap!")
4. Nördigt ("Ditt IQ ökar med varje uppgift du löser!")
5. Motiverande ("Champions ger aldrig upp - och du är en!")

Svara ENDAST med meddelandet, inget annat.`
          },
          {
            role: "user",
            content: `Tidsstämpel för unikhet: ${Date.now()}. Ge mig ett HELT NYTT och UNIKT uppmuntrande meddelande!`
          }
        ],
        max_tokens: 60,
        temperature: 1.0,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content?.trim() || "Du klarar det här! 🤖";

    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("mascot-message error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
