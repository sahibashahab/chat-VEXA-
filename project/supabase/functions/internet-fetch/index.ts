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
    const { query, type } = await req.json();
    const apiKey = Deno.env.get("GROQ_API_KEY");

    let searchQuery = query;
    if (type === "weather") {
      searchQuery = `current weather ${query}`;
    } else if (type === "news") {
      searchQuery = `latest news today ${query}`;
    } else if (type === "ai_updates") {
      searchQuery = "latest AI updates news this week 2025";
    }

    // Use DuckDuckGo HTML search
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
    const searchResponse = await fetch(searchUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const searchHtml = await searchResponse.text();

    const results: { title: string; snippet: string }[] = [];
    const resultRegex = /class="result__snippet"[^>]*>(.*?)<\/a>/gs;
    const titleRegex = /class="result__a"[^>]*>(.*?)<\/a>/gs;

    let match;
    const titles: string[] = [];
    while ((match = titleRegex.exec(searchHtml)) !== null && titles.length < 5) {
      titles.push(match[1].replace(/<[^>]*>/g, "").trim());
    }

    let idx = 0;
    while ((match = resultRegex.exec(searchHtml)) !== null && idx < 5) {
      results.push({
        title: titles[idx] || "Result",
        snippet: match[1].replace(/<[^>]*>/g, "").trim(),
      });
      idx++;
    }

    if (results.length === 0) {
      if (apiKey) {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: "You are a helpful assistant. Provide current information about the user's query. Be concise and factual. If you don't have current data, say so clearly." },
              { role: "user", content: searchQuery },
            ],
            max_tokens: 512,
            temperature: 0.3,
          }),
        });
        const data = await groqRes.json();
        return new Response(JSON.stringify({ results: [{ title: "AI Response", snippet: data.choices?.[0]?.message?.content || "No data available" }] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ results: [], message: "No results found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
