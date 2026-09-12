import { normalizeProductKey, tokenSimilarity } from "./normalize.ts";

const REGION_COUNTRIES: Record<string, string[]> = {
  IN: ["india"], US: ["united states", "usa"], UK: ["united kingdom"],
  EU: ["france", "germany", "spain", "italy", "netherlands", "belgium"],
  AU: ["australia"], CA: ["canada"],
};

interface SourcePacket {
  status: "verified" | "limited";
  source: string;
  canonicalKey: string;
  matchedProduct: string;
  evidence: Record<string, unknown>;
}

function productTitle(product: Record<string, unknown>): string {
  const brand = String(product.brands ?? "").split(",")[0]?.trim();
  const name = String(product.product_name_en ?? product.product_name ?? "").trim();
  return [brand, name].filter(Boolean).join(" ").trim();
}

export async function fetchGrounding(productName: string, region: string): Promise<SourcePacket | null> {
  const params = new URLSearchParams({
    search_terms: productName,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: "10",
    fields: "code,product_name,product_name_en,brands,ingredients_text,ingredients_text_en,nutriments,nutrition_grades,labels,categories,countries,countries_tags,last_modified_t",
  });

  try {
    const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params}`, {
      headers: { "User-Agent": "EatSmart/1.0 (food product analysis)" },
    });
    if (response.ok) {
      const data = await response.json();
      const requested = normalizeProductKey(productName);
      const preferredCountries = REGION_COUNTRIES[region] ?? [];
      const ranked = (Array.isArray(data.products) ? data.products : [])
        .map((product: Record<string, unknown>) => {
          const title = productTitle(product);
          const countries = `${product.countries ?? ""} ${(product.countries_tags as string[] | undefined)?.join(" ") ?? ""}`.toLowerCase();
          const regionBoost = preferredCountries.some((country) => countries.includes(country)) ? 0.12 : 0;
          const hasIngredients = Boolean(product.ingredients_text_en || product.ingredients_text);
          return { product, title, score: tokenSimilarity(requested, title) + regionBoost + (hasIngredients ? 0.08 : 0) };
        })
        .sort((a: { score: number }, b: { score: number }) => b.score - a.score);

      const best = ranked[0];
      if (best && best.score >= 0.55 && best.title) {
        const product = best.product;
        return {
          status: "verified",
          source: "Open Food Facts",
          canonicalKey: normalizeProductKey(best.title),
          matchedProduct: best.title,
          evidence: {
            barcode: product.code ?? null,
            productName: best.title,
            ingredients: product.ingredients_text_en ?? product.ingredients_text ?? null,
            nutriments: product.nutriments ?? {},
            nutritionGrade: product.nutrition_grades ?? null,
            labels: product.labels ?? null,
            categories: product.categories ?? null,
            countries: product.countries ?? null,
            lastModified: product.last_modified_t ?? null,
          },
        };
      }
    }
  } catch (error) {
    console.warn("Open Food Facts lookup failed", error);
  }

  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!firecrawlKey) return null;
  const authority = region === "IN" ? "FSSAI India" : region === "US" ? "FDA United States" : region === "UK" ? "FSA UK" : region;
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `\"${productName}\" ingredients nutrition ${authority}`,
        limit: 5,
        scrapeOptions: { formats: ["markdown"] },
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const evidence = (Array.isArray(data.data) ? data.data : [])
      .map((item: Record<string, unknown>) => ({
        title: String(item.title ?? "").slice(0, 180),
        excerpt: String(item.markdown ?? item.description ?? "").replace(/\s+/g, " ").slice(0, 1200),
      }))
      .filter((item: { excerpt: string }) => item.excerpt.length > 80);
    if (evidence.length < 2) return null;
    return {
      status: "limited",
      source: "Trusted web search",
      canonicalKey: normalizeProductKey(productName),
      matchedProduct: productName,
      evidence: { searchResults: evidence, region },
    };
  } catch (error) {
    console.warn("Trusted search fallback failed", error);
    return null;
  }
}