import { createClient } from "npm:@supabase/supabase-js@2";

export interface RequestIdentity {
  identifierHash: string;
  userId: string;
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function requireIdentity(req: Request): Promise<RequestIdentity> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authorization = req.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  if (!supabaseUrl || !anonKey || !token) {
    throw new Response(JSON.stringify({ error: "Please sign in to analyze products." }), { status: 401 });
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) {
    throw new Response(JSON.stringify({ error: "Your session has expired. Please sign in again." }), { status: 401 });
  }

  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || req.headers.get("x-real-ip") || "unknown";
  return {
    userId: data.user.id,
    identifierHash: await sha256(`${data.user.id}:${ip}`),
  };
}

export async function consumeRateLimit(
  identifierHash: string,
  endpoint: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) throw new Error("Backend configuration is incomplete.");

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.rpc("consume_analysis_rate_limit", {
    p_identifier_hash: identifierHash,
    p_endpoint: endpoint,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : null;
  return {
    allowed: row?.allowed === true,
    remaining: Number(row?.remaining ?? 0),
    retryAfterSeconds: Number(row?.retry_after_seconds ?? windowSeconds),
  };
}