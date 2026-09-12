export function parseJsonObject(value: string): Record<string, unknown> | null {
  const cleaned = value.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const candidates = [cleaned];
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(cleaned.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate.replace(/,\s*([}\]])/g, "$1"));
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Try the next safe extraction strategy.
    }
  }
  return null;
}