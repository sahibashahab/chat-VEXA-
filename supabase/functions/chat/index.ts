import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const EMOTION_MAP: Record<string, string> = {
  happy: "You are cheerful, warm, and enthusiastic. Use positive language and occasional exclamation marks.",
  sad: "You are gentle, comforting, and empathetic. Use softer language and show understanding.",
  angry: "You are firm, direct, and assertive. Use strong, clear language without being rude.",
  neutral: "You are calm, balanced, and professional. Use measured, even-toned language.",
  excited: "You are energetic, passionate, and animated. Use vivid language and express enthusiasm.",
  curious: "You are inquisitive, thoughtful, and exploratory. Ask follow-up questions and show genuine interest.",
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  en: "Respond in English.",
  ur: "Respond in Urdu (اردو). Use Urdu script.",
  roman_ur: "Respond in Roman Urdu (Urdu written in English letters).",
  hi: "Respond in Hindi (हिन्दी). Use Devanagari script.",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const {
      messages,
      documentContext,
      language = "en",
      emotion = "neutral",
      emotionMode = true,
      memories = [],
      offlineMode = false,
    } = await req.json();

    // Build system prompt
    let systemPrompt = "You are a helpful AI assistant.";

    // Language
    if (LANGUAGE_INSTRUCTIONS[language]) {
      systemPrompt += " " + LANGUAGE_INSTRUCTIONS[language];
    }

    // Emotion
    if (emotionMode && EMOTION_MAP[emotion]) {
      systemPrompt += " " + EMOTION_MAP[emotion];
    }

    // Document context
    if (documentContext) {
      systemPrompt += `\n\nThe user has shared documents. Use this content to answer questions:\n${documentContext}`;
    }

    // Memory context
    if (memories.length > 0) {
      const memoryText = memories.map((m: { key: string; content: string }) => `- ${m.key}: ${m.content}`).join("\n");
      systemPrompt += `\n\nYou remember these facts about the user:\n${memoryText}\nUse this context when relevant.`;
    }

    // Offline mode - return canned response
    if (offlineMode) {
      const lastMessage = messages[messages.length - 1]?.content || "";
      return new Response(JSON.stringify({
        reply: `[Offline Mode] I'm currently in offline mode and can't reach the AI service. Your message "${lastMessage.slice(0, 50)}" will be processed when connectivity is restored.`,
        emotion: emotion,
        detectedEmotion: "neutral",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GROQ_API_KEY");

    if (apiKey) {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Groq error: ${response.status} - ${errBody}`);
      }

      const data = await response.json();
      const reply = data.choices[0].message.content;

      // Simple emotion detection from user's last message
      let detectedEmotion = "neutral";
      if (emotionMode) {
        const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";
        if (/\b(happy|great|awesome|love|wonderful|amazing|thanks|thank)\b/.test(lastMsg)) detectedEmotion = "happy";
        else if (/\b(sad|sorry|unfortunately|miss|lost|bad|terrible|awful)\b/.test(lastMsg)) detectedEmotion = "sad";
        else if (/\b(angry|frustrated|annoyed|hate|stupid|worst|ridiculous)\b/.test(lastMsg)) detectedEmotion = "angry";
        else if (/\b(wow|excited|incredible|can't wait|looking forward)\b/.test(lastMsg)) detectedEmotion = "excited";
        else if (/\b(what|how|why|when|where|who|curious|wonder|interesting)\b/.test(lastMsg)) detectedEmotion = "curious";
      }

      return new Response(JSON.stringify({ reply, emotion, detectedEmotion }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lastMessage = messages[messages.length - 1]?.content || "";
    const reply = documentContext
      ? `I've read the document you shared. You asked: "${lastMessage}". To get real AI responses, please configure a GROQ_API_KEY.`
      : `You said: "${lastMessage}". To enable AI responses, please add a GROQ_API_KEY to your Supabase edge function secrets.`;

    return new Response(JSON.stringify({ reply, emotion, detectedEmotion: "neutral" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
