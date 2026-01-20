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
            content: `Du är MAT-T-E, en robot som läser klassiska aforismer och visdomsord från kända tänkare.

UPPGIFT:
- Dela en klassisk aforism eller ett berömt citat
- Citera kända filosofer, författare, vetenskapsmän och tänkare
- Aforismerna ska vara tidlösa och tankeväckande

REGLER:
- Skriv ETT kort citat (max 20 ord)
- Inkludera alltid upphovsmannens namn efter citatet
- Var UNIK varje gång - aldrig samma citat!
- Använd exakt EN emoji i slutet som passar citatet

EXEMPEL:
- "Den som vet att han inget vet, vet mer än den som tror sig veta allt." - Sokrates 🦉
- "I mitt liv har jag haft många bekymmer, de flesta hände aldrig." - Mark Twain 😌
- "Kunskap är makt." - Francis Bacon ⚡
- "Livet är det som händer medan du planerar andra saker." - John Lennon 🎵
- "Fantasin är viktigare än kunskap." - Albert Einstein 💭

Svara ENDAST med citatet och upphovsmannen, inget annat.`
          },
          {
            role: "user",
            content: `Tidsstämpel: ${Date.now()}. Ge mig en NY aforism från en berömd tänkare!`
          }
        ],
        max_tokens: 80,
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
