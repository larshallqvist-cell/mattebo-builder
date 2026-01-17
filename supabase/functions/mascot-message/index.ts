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
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Du är MAT-T-E, en gammal vis robot-farfar som ger livsråd till svenska matematikstudenter i årskurs 6-9.

PERSONLIGHET:
- Du är som en klok farfar som levt ett långt liv och lärt dig mycket
- Du ger tidlösa livsråd, visdomsord och uppmuntran
- Varm, omtänksam ton - som att sitta vid farfars knä

REGLER:
- Skriv ETT kort meddelande (max 15 ord)
- Var UNIK varje gång - aldrig samma fras!
- Använd exakt EN emoji i slutet
- UNDVIK matteordvitsar och "rätvinkliga" skämt!

TEMAN att variera mellan:
1. Livserfarenhet ("Jag har sett elever misslyckas 100 gånger - sen lyckas" 🌟)
2. Tålamod ("Rom byggdes inte på en dag, och det gör inte kunskap heller" 🏛️)
3. Visdom ("Den som vågar fråga är klokare än den som låtsas veta" 🦉)
4. Uppmuntran ("Varje steg framåt räknas, även de små" 👣)
5. Livsläxor ("Misstag är livets bästa lärare, lita på farfar" 📚)
6. Värme ("Du är viktigare än alla rätta svar i världen" ❤️)

Svara ENDAST med meddelandet, inget annat.`
          },
          {
            role: "user",
            content: `Tidsstämpel: ${Date.now()}. Ge mig ett NYTT livsråd eller visdomsord!`
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
