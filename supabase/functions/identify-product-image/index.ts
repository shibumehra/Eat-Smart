import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { GatewayError } from "../_shared/gateway.ts";
import { parseJsonObject } from "../_shared/json.ts";
import { consumeRateLimit, requireIdentity } from "../_shared/security.ts";

const respond = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, ...extraHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (req.method !== "POST") return respond({ error: "Method not allowed." }, 405);
    const identity = await requireIdentity(req);
    const rate = await consumeRateLimit(identity.identifierHash, "identify-product-image", 10, 600);
    if (!rate.allowed) return respond({ error: `Too many image scans. Try again in ${rate.retryAfterSeconds} seconds.` }, 429, { "Retry-After": String(rate.retryAfterSeconds) });

    const body = await req.json();
    const image = typeof body?.image === "string" ? body.image : "";
    if (!/^data:image\/(jpeg|png|webp);base64,/i.test(image)) return respond({ error: "Upload a JPEG, PNG, or WebP image." }, 400);
    if (image.length > 4_500_000) return respond({ error: "The image is too large. Please use a smaller photo." }, 413);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new GatewayError(401, "Image recognition is not configured.");
    const [metadata, base64Data] = image.split(",", 2);
    const mimeType = metadata.match(/^data:(image\/(?:jpeg|png|webp));base64$/i)?.[1]?.toLowerCase() ?? "image/jpeg";
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Identify the exact packaged food product from visible packaging text. Return JSON with productName and confidence (high|medium|low|none). If uncertain or not food, productName must be null. Never guess." },
          { role: "user", content: [
            { type: "text", text: "Read the brand, product, and variant from this package." },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } },
          ] },
        ],
      }),
    });
    const raw = await response.text();
    if (!response.ok) {
      let message = raw || "Image recognition failed.";
      try {
        const parsed = JSON.parse(raw);
        message = parsed?.error?.message || parsed?.message || parsed?.error || message;
      } catch {
        // Preserve the service message.
      }
      return respond({ error: String(message) }, response.status, response.status === 429 ? { "Retry-After": response.headers.get("Retry-After") ?? "10" } : {});
    }
    const gatewayBody = JSON.parse(raw);
    const parsed = parseJsonObject(gatewayBody.choices?.[0]?.message?.content ?? "");
    if (!parsed) return respond({ error: "The image result could not be validated." }, 502);
    return respond(parsed);
  } catch (error) {
    if (error instanceof Response) return new Response(error.body, { status: error.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    console.error("identify-product-image error", error);
    return respond({ error: error instanceof Error ? error.message : "Image recognition failed." }, error instanceof GatewayError ? error.status : 500);
  }
});