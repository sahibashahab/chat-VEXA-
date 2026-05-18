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
    const { imageBase64, question, language } = await req.json();
    const apiKey = Deno.env.get("GROQ_API_KEY");

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GROQ_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langInstruction = language && language !== "en"
      ? ` Respond in ${language}.`
      : "";

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "system",
            content: `You are a visual AI assistant. Describe and explain images in detail. Be thorough, accurate, and helpful.${langInstruction}`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: question || "Describe this image in detail. What do you see? Explain the content, context, and any notable elements." },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        max_tokens: 1024,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Groq error: ${response.status} - ${errBody}`);
    }

    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ explanation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
