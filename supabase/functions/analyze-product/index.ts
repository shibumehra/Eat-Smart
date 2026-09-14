import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { fetchGrounding } from "../_shared/sources.ts";
import { normalizeProductKey } from "../_shared/normalize.ts";
import { GatewayError, requestJson } from "../_shared/gateway.ts";
import { consumeRateLimit, requireIdentity } from "../_shared/security.ts";

const REGION_MAP: Record<string, string> = {
  IN: "FSSAI (Food Safety and Standards Authority of India)",
  US: "FDA (Food and Drug Administration)",
  UK: "FSA (Food Standards Agency)",
  EU: "EFSA (European Food Safety Authority)",
  AU: "FSANZ (Food Standards Australia New Zealand)",
  CA: "CFIA (Canadian Food Inspection Agency)",
};

const encoder = new TextEncoder();
const jsonLine = (value: unknown) => encoder.encode(`${JSON.stringify(value)}\n`);
const REPORT_VERSION = 2;

function stringValue(value: unknown, fallback = "Unknown"): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function numberValue(value: unknown, min: number, max: number, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function stringArray(value: unknown, limit = 8): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, limit) : [];
}

type IngredientStatus = "safe" | "caution" | "harmful" | "unknown";

export function calculateIngredientPurity(ingredients: Array<{ status: IngredientStatus }>): number {
  if (ingredients.length === 0) return 0;
  const weights: Record<IngredientStatus, number> = { safe: 100, caution: 55, harmful: 0, unknown: 25 };
  const total = ingredients.reduce((sum, ingredient) => sum + weights[ingredient.status], 0);
  return Math.round(total / ingredients.length);
}

export function normalizeRegulatoryStatus(value: unknown): "Certified" | "Compliant" | "Not Verified" | "Non-Compliant" {
  return ["Certified", "Compliant", "Not Verified", "Non-Compliant"].includes(String(value))
    ? String(value) as "Certified" | "Compliant" | "Not Verified" | "Non-Compliant"
    : "Not Verified";
}

function buildReport(
  facts: Record<string, unknown>,
  scoring: Record<string, unknown>,
  voice: Record<string, unknown>,
  source: { status: string; source: string },
) {
  const allowedFoodTypes = ["veg", "non-veg", "unknown"];
  const allowedVerdicts = ["Buy", "Avoid", "Try Once"];
  const rawIngredients = Array.isArray(facts.ingredients) ? facts.ingredients : [];
  const rawAlternatives = Array.isArray(scoring.healthierAlternatives) ? scoring.healthierAlternatives : [];
  const rawHealth = scoring.healthVerdict && typeof scoring.healthVerdict === "object" ? scoring.healthVerdict as Record<string, unknown> : {};

  const ingredients = rawIngredients.slice(0, 40).map((item) => {
    const ingredient = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const status = ["safe", "caution", "harmful", "unknown"].includes(String(ingredient.status)) ? ingredient.status as IngredientStatus : "unknown";
    return { name: stringValue(ingredient.name), status, detail: stringValue(ingredient.detail, "No reliable detail available.") };
  });

  return {
    analysisVersion: REPORT_VERSION,
    productName: stringValue(facts.productName),
    brand: stringValue(facts.brand),
    category: stringValue(facts.category),
    foodType: allowedFoodTypes.includes(String(facts.foodType)) ? facts.foodType : "unknown",
    overallScore: numberValue(scoring.overallScore, 0, 10),
    verdict: allowedVerdicts.includes(String(scoring.verdict)) ? scoring.verdict : "Try Once",
    ingredientPurityScore: calculateIngredientPurity(ingredients),
    reviewAuthenticity: 0,
    regulatoryStatus: normalizeRegulatoryStatus(scoring.regulatoryStatus),
    regulatoryReasoning: stringValue(scoring.regulatoryReasoning, "No explicit regional registration, compliance, or certification evidence was found in the current sources."),
    crossRegionCertifications: scoring.crossRegionCertifications && typeof scoring.crossRegionCertifications === "object" ? scoring.crossRegionCertifications : {},
    valueForMoney: numberValue(scoring.valueForMoney, 0, 10, 5),
    about: stringValue(facts.about),
    foodScoutVerdict: stringValue(voice.foodScoutVerdict, "Worth a label check before it earns a place in your cart."),
    pros: stringArray(scoring.pros, 4),
    cons: stringArray(scoring.cons, 4),
    ingredients,
    healthierAlternatives: rawAlternatives.slice(0, 4).map((item) => {
      const alternative = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return {
        name: stringValue(alternative.name),
        brand: stringValue(alternative.brand),
        score: numberValue(alternative.score, 0, 10),
        ingredientPurityScore: numberValue(alternative.ingredientPurityScore, 0, 100),
        verdict: allowedVerdicts.includes(String(alternative.verdict)) ? alternative.verdict : "Try Once",
        valueForMoney: numberValue(alternative.valueForMoney, 0, 10, 5),
        regulatoryStatus: normalizeRegulatoryStatus(alternative.regulatoryStatus),
        reviewAuthenticity: 0,
        reason: stringValue(alternative.reason, "A packaged option with a stronger ingredient profile."),
      };
    }),
    healthVerdict: {
      diabetics: stringValue(rawHealth.diabetics, "Not enough verified data for tailored advice."),
      children: stringValue(rawHealth.children, "Not enough verified data for tailored advice."),
      pregnant: stringValue(rawHealth.pregnant, "Not enough verified data for tailored advice."),
      fitness: stringValue(rawHealth.fitness, "Not enough verified data for tailored advice."),
      general: stringValue(rawHealth.general, "Check the serving size and ingredient list."),
    },
    publicSentiment: { positive: 0, neutral: 100, negative: 0, totalReviews: 0 },
    topReviews: [],
    sourceStatus: source.status,
    sourceName: source.source,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const responseHeaders = { ...corsHeaders, "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" };
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (value: unknown) => controller.enqueue(jsonLine(value));
      try {
        if (req.method !== "POST") throw new Response(JSON.stringify({ error: "Method not allowed." }), { status: 405 });
        const identity = await requireIdentity(req);
        const body = await req.json();
        const productName = typeof body?.productName === "string" ? body.productName.trim() : "";
        const region = typeof body?.region === "string" && REGION_MAP[body.region] ? body.region : "IN";
        if (productName.length < 2 || productName.length > 160) {
          throw new Response(JSON.stringify({ error: "Enter a product name between 2 and 160 characters." }), { status: 400 });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!supabaseUrl || !serviceKey) throw new Error("Backend configuration is incomplete.");
        const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
        const inputKey = normalizeProductKey(productName);

        emit({ type: "stage", step: 0, label: "Checking fresh cached research" });
        const { data: cached } = await admin
          .from("product_cache")
          .select("result, expires_at")
          .eq("product_key", inputKey)
          .eq("region", region)
          .gt("expires_at", new Date().toISOString())
          .maybeSingle();
        if (cached?.result && Number((cached.result as Record<string, unknown>).analysisVersion) === REPORT_VERSION) {
          emit({ type: "result", data: cached.result, cached: true });
          return;
        }

        const rate = await consumeRateLimit(identity.identifierHash, "analyze-product", 8, 600);
        if (!rate.allowed) {
          emit({ type: "error", status: 429, message: `Too many new analyses. Try again in ${rate.retryAfterSeconds} seconds.` });
          return;
        }

        emit({ type: "stage", step: 0, label: "Finding current product facts" });
        const grounding = await fetchGrounding(productName, region);
        if (!grounding) {
          emit({ type: "result", data: { error: "NOT_FOUND", explanation: "No sufficiently reliable current product evidence was found." } });
          return;
        }

        const authority = REGION_MAP[region];
        const evidence = JSON.stringify(grounding.evidence);
        emit({ type: "stage", step: 1, label: `Reviewing ${grounding.source} ingredients` });
        const facts = await requestJson({
          repairLabel: "facts and ingredients",
          system: `You are a strict food data extractor. Use ONLY the supplied source evidence. Never recall or invent ingredients, nutrition, certifications, or claims. Missing facts must be Unknown. Split the supplied ingredient list into its actual named ingredients and additives. Classify safe only when ordinary use is supported by the evidence; caution for high sugar/sodium, caffeine, allergens, or additives that warrant moderation; harmful only when the sourced evidence identifies the ingredient as prohibited or unsafe at the stated use; unknown when evidence is insufficient. Never call a legally permitted additive harmful merely because it has an E-number. Return JSON with productName, brand, category, foodType (veg|non-veg|unknown), about, ingredients [{name,status:safe|caution|harmful|unknown,detail}]. If evidence is for a different product, return {"error":"NOT_FOUND"}.`,
          user: `Requested product: ${productName}\nRegion: ${region}\nSource: ${grounding.source}\nMatch: ${grounding.matchedProduct}\nEvidence JSON: ${evidence}`,
        });
        if (facts.error === "NOT_FOUND") {
          emit({ type: "result", data: { error: "NOT_FOUND" } });
          return;
        }

        emit({ type: "stage", step: 2, label: "Scoring sourced facts for your region" });
        const scoring = await requestJson({
          repairLabel: "health scoring",
          system: `You are a conservative food scoring analyst. Score ONLY from the supplied extracted facts and source evidence. The user's authority is ${authority}. Regulatory status meanings are strict: Certified only when an explicit product certification mark or licence is present in evidence; Compliant only when evidence explicitly confirms current compliance or lawful registration with the named authority; Non-Compliant only when reliable evidence explicitly records a violation; otherwise Not Verified. Market availability, brand reputation, permitted ingredients, or absence of violations are not proof of compliance. Explain exactly what evidence supports the status. The server computes the final ingredient purity score from ingredient classifications, so do not infer hidden quantities. Alternatives must be real commercial packaged products, never recipes. Return JSON with overallScore 0-10, verdict Buy|Avoid|Try Once, regulatoryStatus Certified|Compliant|Not Verified|Non-Compliant, regulatoryReasoning, crossRegionCertifications containing only the current authority, valueForMoney 0-10, pros, cons, healthierAlternatives [{name,brand,score,ingredientPurityScore,verdict,valueForMoney,regulatoryStatus,reason}], healthVerdict {diabetics,children,pregnant,fitness,general}.`,
          user: `Region: ${region}\nAuthority: ${authority}\nGrounding status: ${grounding.status}\nExtracted facts JSON: ${JSON.stringify(facts)}\nSource evidence JSON: ${evidence}`,
        });

        emit({ type: "stage", step: 3, label: "Writing the final verdict" });
        const voice = await requestJson({
          repairLabel: "verdict",
          system: "Write one witty, bold, memorable food-critic verdict grounded only in the supplied score and facts. Do not add any facts. Return JSON with foodScoutVerdict only.",
          user: `Facts: ${JSON.stringify(facts)}\nScoring: ${JSON.stringify(scoring)}`,
        });

        const report = buildReport(facts, scoring, voice, grounding);
        const canonicalKey = grounding.canonicalKey || inputKey;
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const cacheRow = {
          product_key: canonicalKey,
          region,
          result: report,
          data_source: grounding.status === "verified" ? "open_food_facts" : "trusted_search",
          source_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: expiresAt,
        };
        const { error: cacheError } = await admin.from("product_cache").upsert(cacheRow, { onConflict: "product_key,region" });
        if (cacheError) console.error("Cache upsert failed", cacheError);
        if (canonicalKey !== inputKey) {
          const { error: aliasCacheError } = await admin.from("product_cache").upsert({ ...cacheRow, product_key: inputKey }, { onConflict: "product_key,region" });
          if (aliasCacheError) console.error("Alias cache upsert failed", aliasCacheError);
        }

        emit({ type: "result", data: report, cached: false });
      } catch (error) {
        if (error instanceof Response) {
          let message = "Request failed.";
          try {
            const parsed = JSON.parse(await error.text());
            message = parsed.error || message;
          } catch {
            // Keep the safe fallback.
          }
          emit({ type: "error", status: error.status, message });
        } else if (error instanceof GatewayError) {
          emit({ type: "error", status: error.status, message: error.message, retryAfter: error.retryAfter });
        } else {
          console.error("analyze-product error", error);
          emit({ type: "error", status: 500, message: error instanceof Error ? error.message : "Analysis failed." });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: responseHeaders });
});