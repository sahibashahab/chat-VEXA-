import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { content, type, language } = await req.json();
    const apiKey = Deno.env.get("GROQ_API_KEY");

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GROQ_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langInstruction = language && language !== "en"
      ? ` Write in ${language}.`
      : "";

    const prompts: Record<string, string> = {
      summary: `Create a concise summary of the following content. Capture key points and main ideas.${langInstruction}\n\nCONTENT:\n${content}`,
      report: `Generate a structured report based on the following content. Include: Executive Summary, Key Findings, Detailed Analysis, Conclusions, and References.${langInstruction}\n\nCONTENT:\n${content}`,
      voice_note: `Convert the following content into a natural voice note script. Make it conversational, clear, and easy to listen to. Use natural transitions and a friendly tone.${langInstruction}\n\nCONTENT:\n${content}`,
      references: `Extract and format all references, citations, and sources from the following content. If no explicit references exist, suggest credible sources that could be referenced.${langInstruction}\n\nCONTENT:\n${content}`,
    };

    const prompt = prompts[type] || prompts.summary;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a professional content analyst and writer. Produce well-structured, accurate output." },
          { role: "user", content: prompt },
        ],
        max_tokens: 2048,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Groq error: ${response.status} - ${errBody}`);
    }

    const data = await response.json();
    const output = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ output }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
