import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseJsonObject } from "../_shared/json.ts";
import { normalizeProductKey, tokenSimilarity } from "../_shared/normalize.ts";
import { calculateIngredientPurity, normalizeRegulatoryStatus } from "./scoring.ts";

Deno.test("normalizes product names for cache reuse", () => {
  assertEquals(normalizeProductKey("  MAGGI® 2-Minute Noodles  "), "maggi 2 minute noodles");
  assertEquals(normalizeProductKey("Coca-Cola"), "coca cola");
});

Deno.test("measures close catalogue matches", () => {
  assertEquals(tokenSimilarity("Maggi Noodles", "Nestlé Maggi Noodles") > 0.6, true);
});

Deno.test("recovers fenced JSON without trailing commas", () => {
  assertEquals(parseJsonObject("```json\n{\"ok\":true,}\n```"), { ok: true });
});

Deno.test("calculates ingredient purity from visible classifications", () => {
  assertEquals(calculateIngredientPurity([{ status: "safe" }, { status: "caution" }, { status: "harmful" }, { status: "unknown" }]), 45);
  assertEquals(calculateIngredientPurity([]), 0);
});

Deno.test("does not turn unsupported regulatory claims into certification", () => {
  assertEquals(normalizeRegulatoryStatus("Certified"), "Certified");
  assertEquals(normalizeRegulatoryStatus("Unknown"), "Not Verified");
  assertEquals(normalizeRegulatoryStatus("Probably compliant"), "Not Verified");
});