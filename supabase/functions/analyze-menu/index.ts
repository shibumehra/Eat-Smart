import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Dish {
  name: string;
  originalName?: string;
  description: string;
  calories: number | null;
  healthScore: number; // 0-10
  foodType: "veg" | "non-veg" | "unknown";
  spiceLevel?: "mild" | "medium" | "spicy" | "very-spicy";
  tags: string[]; // e.g. ["protein-rich","light","comfort"]
  matchScore?: number; // 0-100 mood match (only when mood provided)
  matchReason?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image, mood } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: "Image required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const mimeType = image.includes("data:")
      ? image.split(";")[0].split(":")[1]
      : "image/jpeg";

    const moodText = (mood && String(mood).trim()) || "";

    const systemPrompt = `You are an expert nutritionist and menu reader for the EatSmart app.

TASK: Read the restaurant menu image (which may be in English, Hindi, Hinglish, or any Indian/regional language). Extract every dish you can see. Translate non-English dish names to English while keeping the original name available. For each dish provide a compact nutrition snapshot grounded in typical preparation of that dish.

LANGUAGE HANDLING:
- Hinglish examples: "Paneer Tikka", "Aloo Gobi", "Dal Makhani", "Chicken Biryani", "Masala Dosa" — keep the dish name intact in English transliteration as "name", and original script (if different) as "originalName".
- If menu is in Hindi script, transliterate to readable English and provide originalName in Hindi.
- For purely English menus, originalName = name.

For each dish output:
- name: clean readable English/transliterated name
- originalName: as written on the menu (may match name)
- description: ONE concise sentence (max 18 words) — main ingredients + cooking style
- calories: integer estimate per typical serving (or null if truly impossible)
- healthScore: 0-10 (10 = excellent, 0 = very unhealthy). Consider oil, processing, fiber, protein, refined carbs, sugar.
- foodType: "veg" | "non-veg" | "unknown"
- spiceLevel: "mild" | "medium" | "spicy" | "very-spicy"
- tags: 2-4 short lowercase tags from this list ONLY: protein-rich, light, comfort, spicy, healthy, vegan, low-carb, high-fiber, fried, grilled, creamy, sweet, indulgent, kids-friendly, post-workout

${
  moodText
    ? `MOOD FILTER: The user's mood/craving is: "${moodText}". After listing dishes, score each one 0-100 for how well it matches this mood (matchScore) and give a 6-12 word matchReason. Sort dishes from highest matchScore to lowest.`
    : `No mood provided. Sort dishes by healthScore descending.`
}

Return ONLY valid JSON via the provided tool. Do NOT include any text outside the tool call.`;

    const tool = {
      type: "function",
      function: {
        name: "return_menu_analysis",
        description: "Return the structured menu analysis.",
        parameters: {
          type: "object",
          properties: {
            isMenu: {
              type: "boolean",
              description: "True if image actually contains a food menu.",
            },
            restaurantName: {
              type: "string",
              description: "Restaurant name if visible, else empty string.",
            },
            detectedLanguage: {
              type: "string",
              description: "Primary language of the menu (e.g. English, Hinglish, Hindi).",
            },
            dishes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  originalName: { type: "string" },
                  description: { type: "string" },
                  calories: { type: ["integer", "null"] },
                  healthScore: { type: "number", minimum: 0, maximum: 10 },
                  foodType: {
                    type: "string",
                    enum: ["veg", "non-veg", "unknown"],
                  },
                  spiceLevel: {
                    type: "string",
                    enum: ["mild", "medium", "spicy", "very-spicy"],
                  },
                  tags: { type: "array", items: { type: "string" } },
                  matchScore: { type: "number", minimum: 0, maximum: 100 },
                  matchReason: { type: "string" },
                },
                required: [
                  "name",
                  "description",
                  "healthScore",
                  "foodType",
                  "spiceLevel",
                  "tags",
                ],
                additionalProperties: false,
              },
            },
          },
          required: ["isMenu", "dishes", "detectedLanguage"],
          additionalProperties: false,
        },
      },
    };

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          temperature: 0,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: moodText
                    ? `Analyze this menu. Mood: "${moodText}". Return ALL dishes ranked by mood match.`
                    : `Analyze this menu and return ALL dishes ranked by healthScore.`,
                },
                {
                  type: "image_url",
                  image_url: { url: `data:${mimeType};base64,${base64Data}` },
                },
              ],
            },
          ],
          tools: [tool],
          tool_choice: {
            type: "function",
            function: { name: "return_menu_analysis" },
          },
        }),
      },
    );

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add funds in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error("Menu analysis failed");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("AI returned no structured output");
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    if (!parsed.isMenu || !Array.isArray(parsed.dishes) || parsed.dishes.length === 0) {
      return new Response(
        JSON.stringify({
          error: "NOT_MENU",
          message:
            "We couldn't detect a food menu in this image. Try a clearer photo of the menu page.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        restaurantName: parsed.restaurantName || "",
        detectedLanguage: parsed.detectedLanguage || "English",
        mood: moodText,
        dishes: parsed.dishes as Dish[],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("analyze-menu error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
