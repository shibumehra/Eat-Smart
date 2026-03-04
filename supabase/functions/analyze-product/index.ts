import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REGION_MAP: Record<string, string> = {
  IN: "FSSAI (Food Safety and Standards Authority of India)",
  US: "FDA (Food and Drug Administration)",
  UK: "FSA (Food Standards Agency)",
  EU: "EFSA (European Food Safety Authority)",
  AU: "FSANZ (Food Standards Australia New Zealand)",
  CA: "CFIA (Canadian Food Inspection Agency)",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { productName, region } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Normalize product key for cache lookup
    const productKey = productName.trim().toLowerCase().replace(/\s+/g, ' ');

    // Check cache first
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const { data: cached } = await sb
      .from("product_cache")
      .select("result")
      .eq("product_key", productKey)
      .eq("region", region)
      .maybeSingle();

    if (cached?.result) {
      console.log("Cache hit for:", productKey);
      return new Response(JSON.stringify(cached.result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authority = REGION_MAP[region] || REGION_MAP["IN"];

    const systemPrompt = `You are FoodScout, an AI food product analyst. You MUST analyze products based ONLY on real, verifiable information. Never fabricate data.

CRITICAL RULES:
1. If the user gives a short/common name like "Maggi", resolve it to the flagship product: "Maggi 2-Minute Noodles Masala"
2. ALL analysis must be grounded in real, publicly available information
3. Alternatives MUST be real, commercially available packaged products (NEVER "make at home" suggestions)
4. The regulatory authority for this region is: ${authority}
5. For crossRegionCertifications, ONLY include the certification for the user's region (${authority.split(' ')[0]})
6. FoodScout verdict must be witty, bold, and memorable - like a food critic's one-liner
7. If you cannot find enough real data, return: {"error": "NOT_FOUND"}
8. healthVerdict keys MUST be exactly: diabetics, children, pregnant, fitness, general

Return a JSON object with EXACTLY this structure:
{
  "productName": "Full product name with brand and variant",
  "brand": "Brand name",
  "category": "Product category",
  "foodType": "veg" | "non-veg" | "unknown",
  "overallScore": 0-10,
  "verdict": "Buy" | "Avoid" | "Try Once",
  "ingredientPurityScore": 0-100,
  "reviewAuthenticity": 0-100,
  "regulatoryStatus": "Certified" | "Not Certified" | "Unknown",
  "regulatoryReasoning": "Detailed reasoning for certification status",
  "crossRegionCertifications": {"${authority.split(' ')[0]}": "Certified/Not Certified/Unknown with brief reason"},
  "valueForMoney": 0-10,
  "about": "2-3 sentence description of the product",
  "foodScoutVerdict": "A witty, memorable one-liner verdict",
  "pros": ["pro1", "pro2", "pro3"],
  "cons": ["con1", "con2", "con3"],
  "ingredients": [{"name": "Ingredient", "status": "safe|caution|harmful|unknown", "detail": "Detailed explanation: what it is, why it's used, potential health effects, daily intake limits if relevant, and any controversies"}],
  "healthierAlternatives": [{"name": "Product Name", "score": 0-10, "brand": "Brand", "ingredientPurityScore": 0-100, "verdict": "Buy|Avoid|Try Once", "valueForMoney": 0-10, "regulatoryStatus": "Certified|Not Certified|Unknown", "reviewAuthenticity": 0-100, "reason": "Why this is a better alternative"}],
  "healthVerdict": {"diabetics": "advice", "children": "advice", "pregnant": "advice", "fitness": "advice", "general": "advice"},
  "publicSentiment": {"positive": 0-100, "neutral": 0-100, "negative": 0-100, "totalReviews": number},
  "topReviews": [{"text": "review text", "sentiment": "positive|neutral|negative", "platform": "YouTube|Reddit|Amazon|Twitter|Blog", "author": "Author Name"}]
}

IMPORTANT: Return ONLY valid JSON. No markdown, no code blocks.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze the food product: "${productName}" for the ${region} region. Provide comprehensive analysis grounded in real data.` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI analysis failed");
    }

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    try {
      const parsed = JSON.parse(content);
      // Cache the result (fire and forget)
      sb.from("product_cache").insert({ product_key: productKey, region, result: parsed }).then(() => {
        console.log("Cached result for:", productKey);
      });
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      console.error("Failed to parse AI response:", content.substring(0, 500));
      return new Response(JSON.stringify({ error: "Failed to parse analysis" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("analyze-product error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
