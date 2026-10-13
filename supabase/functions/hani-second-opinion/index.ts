// PROJECT HANI · authenticated owner only · server-only Gemini key · no DB writes
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

// Same server-only allowlist policy as hani-learning-quiz.
function ownerAccess(user: { id?: string } | null, configuredId: string | undefined) {
  const allowedId = (configuredId || "").trim();
  if (!allowedId) return { ok: false, status: 503, error: "OWNER_ACCESS_NOT_CONFIGURED" };
  if (!user?.id || user.id !== allowedId) return { ok: false, status: 403, error: "OWNER_ACCESS_DENIED" };
  return { ok: true, status: 200, error: "" };
}
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } });
}
async function authenticatedUser(req: Request, supabaseUrl: string, publishableKey: string) {
  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return null;
  const client = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: { user }, error } = await client.auth.getUser();
  return error ? null : user;
}

// Per warm isolate only; restarts/other isolates have independent counters.
const requests = new Map<string, { start: number; count: number }>();
const windowMs = 10 * 60 * 1000;
function allowRequest(userId: string) {
  const now = Date.now();
  for (const [id, entry] of requests) if (now - entry.start >= windowMs) requests.delete(id);
  const entry = requests.get(userId) || { start: now, count: 0 };
  if (entry.count >= 6) return false;
  entry.count++; requests.set(userId, entry); return true;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);
  if (!/^Bearer\s+\S+$/i.test(req.headers.get("Authorization") || "")) return json({ ok: false, code: "INVALID_SESSION" }, 401);
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
  if (!supabaseUrl || !publishableKey) return json({ ok: false, code: "SERVER_CONFIG_ERROR" }, 503);
  let user;
  try { user = await authenticatedUser(req, supabaseUrl, publishableKey); }
  catch (_) { return json({ ok: false, code: "INVALID_SESSION" }, 401); }
  if (!user?.id) return json({ ok: false, code: "INVALID_SESSION" }, 401);
  const access = ownerAccess(user, Deno.env.get("HANI_OWNER_USER_ID"));
  if (!access.ok) return json({ ok: false, code: access.error }, access.status);
  const body = await req.json().catch(() => null);
  if (!body || typeof body.prompt !== "string" || !body.prompt.trim()) return json({ ok: false, code: "PROMPT_REQUIRED" }, 400);
  if (body.prompt.length > 60000) return json({ ok: false, code: "PROMPT_TOO_LONG" }, 400);
  const key = Deno.env.get("GEMINI_API_KEY") || "";
  if (!key) return json({ ok: false, code: "GEMINI_KEY_MISSING" }, 503);
  const model = Deno.env.get("GEMINI_MODEL") || "gemini-flash-latest";
  // Prevent a misconfigured model from changing the endpoint or echoing a secret.
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(model) || model.includes(key)) return json({ ok: false, code: "SERVER_CONFIG_ERROR" }, 503);
  if (!allowRequest(user.id)) return json({ ok: false, code: "RATE_LIMIT" }, 429);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: body.prompt }] }], generationConfig: { temperature: 0.4 } }),
      signal: controller.signal,
    });
    // Never echo upstream bodies/errors: they may contain credentials or prompt data.
    if (!response.ok) return json({ ok: false, code: response.status === 429 ? "GEMINI_QUOTA" : "GEMINI_UPSTREAM", status: response.status }, response.status === 429 ? 429 : 502);
    const payload = await response.json();
    const parts = payload?.candidates?.[0]?.content?.parts;
    const text = (Array.isArray(parts) ? parts.filter((part: { text?: unknown; thought?: boolean }) => !part.thought && typeof part.text === "string").map((part: { text: string }) => part.text).join("") : "").trim();
    if (!text || text.includes(key)) return json({ ok: false, code: "GEMINI_UPSTREAM", status: response.status }, 502);
    return json({ ok: true, text, model });
  } catch (_) {
    return json({ ok: false, code: "GEMINI_UPSTREAM", status: 0 }, 502);
  } finally { clearTimeout(timeout); }
});
