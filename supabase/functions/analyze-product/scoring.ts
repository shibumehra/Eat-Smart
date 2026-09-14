export type IngredientStatus = "safe" | "caution" | "harmful" | "unknown";

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