import { parseJsonObject } from "./json.ts";

interface GatewayOptions {
  system: string;
  user: string;
  repairLabel: string;
}

export class GatewayError extends Error {
  status: number;
  retryAfter?: string;

  constructor(status: number, message: string, retryAfter?: string) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function requestGateway(system: string, user: string): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new GatewayError(401, "AI analysis is not configured.");

  let lastError: GatewayError | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0) {
      const retryAfter = Number(lastError?.retryAfter ?? 0);
      await delay(retryAfter > 0 ? retryAfter * 1000 : 700 * (2 ** (attempt - 1)) + Math.floor(Math.random() * 250));
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (response.ok) {
      const body = await response.json();
      return body.choices?.[0]?.message?.content ?? "";
    }

    const raw = await response.text();
    let message = raw || "AI analysis failed.";
    try {
      const parsed = JSON.parse(raw);
      message = parsed?.error?.message || parsed?.message || parsed?.error || message;
    } catch {
      // Preserve the gateway message when it is not JSON.
    }
    lastError = new GatewayError(response.status, String(message), response.headers.get("Retry-After") ?? undefined);
    if (response.status !== 429 && response.status < 500) throw lastError;
  }

  throw lastError ?? new GatewayError(500, "AI analysis failed after retries.");
}

export async function requestJson(options: GatewayOptions): Promise<Record<string, unknown>> {
  const first = await requestGateway(options.system, options.user);
  const parsed = parseJsonObject(first);
  if (parsed) return parsed;

  const repaired = await requestGateway(
    "Return one valid JSON object only. Do not use markdown, comments, or trailing commas.",
    `Repair this malformed ${options.repairLabel} response without adding facts:\n${first}`,
  );
  const repairedParsed = parseJsonObject(repaired);
  if (!repairedParsed) throw new GatewayError(502, `The ${options.repairLabel} response could not be validated.`);
  return repairedParsed;
}