// Owner-only metadata browser. Google credentials remain on this server.
import { createClient } from "npm:@supabase/supabase-js@2";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";
const FILE_FIELDS = "id,name,mimeType,modifiedTime,size,iconLink,webViewLink,parents";
type Json = Record<string, unknown>;

// These environment/encryption/refresh helpers mirror the deployed Calendar
// function. Keep its AES-GCM format and database row shape compatible.
function env(name: string, fallback = "") { return (Deno.env.get(name) || fallback).trim(); }
function firstKeyFromJson(name: string) {
  try { return String(Object.values(JSON.parse(env(name) || "{}"))[0] || ""); } catch { return ""; }
}
function publishableKey() { return env("SUPABASE_ANON_KEY") || env("SUPABASE_PUBLISHABLE_KEY") || firstKeyFromJson("SUPABASE_PUBLISHABLE_KEYS"); }
function secretKey() { return env("SUPABASE_SERVICE_ROLE_KEY") || env("SUPABASE_SECRET_KEY") || firstKeyFromJson("SUPABASE_SECRET_KEYS"); }
function cors(req: Request) {
  let origin = "https://ghdtjdalskr-svg.github.io";
  try { origin = new URL(env("HANI_APP_ORIGIN", origin)).origin; } catch { /* default origin */ }
  return { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" };
}
function json(req: Request, body: Json, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}
function b64(bytes: Uint8Array) { let s = ""; for (const b of bytes) s += String.fromCharCode(b); return btoa(s); }
function unb64(value: string) { return Uint8Array.from(atob(value), c => c.charCodeAt(0)); }
async function cryptoKey() {
  const secret = env("HANI_GOOGLE_TOKEN_KEY");
  if (!secret) throw new Error("SERVER_CONFIG_ERROR");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
async function encryptText(value: string) {
  if (!value) return "";
  const key = await cryptoKey(), iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(value));
  return `${b64(iv)}.${b64(new Uint8Array(enc))}`;
}
async function decryptText(value: string) {
  if (!value) return "";
  const [ivRaw, dataRaw] = value.split(".");
  const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(ivRaw) }, await cryptoKey(), unb64(dataRaw));
  return new TextDecoder().decode(dec);
}
function googleSecrets() {
  const clientId = env("GOOGLE_CLIENT_ID"), clientSecret = env("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("SERVER_CONFIG_ERROR");
  return { clientId, clientSecret };
}
async function usableAccessToken(admin: ReturnType<typeof createClient>, userId: string, connection: any) {
  const expiresAt = connection?.token_expires_at ? new Date(connection.token_expires_at).getTime() : 0;
  if (connection?.access_token_enc && expiresAt > Date.now() + 90_000) return decryptText(connection.access_token_enc);
  const refreshToken = await decryptText(String(connection?.refresh_token_enc || ""));
  if (!refreshToken) throw new Error("RECONNECT");
  const { clientId, clientSecret } = googleSecrets();
  const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { if (data.error === "invalid_grant") throw new Error("RECONNECT"); throw new Error("REFRESH_FAILED"); }
  const access = String(data.access_token || "");
  if (!access) throw new Error("REFRESH_FAILED");
  const expires = new Date(Date.now() + Math.max(60, Number(data.expires_in || 3600)) * 1000).toISOString();
  const { error } = await admin.from("hani_google_calendar_connections").update({ access_token_enc: await encryptText(access), token_expires_at: expires, updated_at: new Date().toISOString() }).eq("user_id", userId);
  if (error) throw new Error("CONNECTION_FAILED");
  return access;
}
async function scopeRequired(req: Request, admin: ReturnType<typeof createClient>, userId: string) {
  const { clientId } = googleSecrets();
  const state = `${crypto.randomUUID()}${crypto.randomUUID().replaceAll("-", "")}`;
  const { error } = await admin.from("hani_google_calendar_oauth_states").insert({ state, user_id: userId, expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() });
  if (error) throw new Error("CONNECTION_FAILED");
  // The unchanged Calendar callback already handles this exact state row and
  // stores the granted scopes. No purpose column or second callback is needed.
  const qs = new URLSearchParams({ client_id: clientId, redirect_uri: `${env("SUPABASE_URL").replace(/\/$/, "")}/functions/v1/hani-google-calendar/callback`, response_type: "code", scope: `${CALENDAR_SCOPE} ${DRIVE_SCOPE}`, include_granted_scopes: "true", access_type: "offline", prompt: "consent", state });
  return json(req, { ok: false, code: "DRIVE_SCOPE_REQUIRED", authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${qs}`, message: "Google Drive 읽기 권한을 연결해 주세요." }, 409);
}
function literal(value: string) { return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'"); }

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { ok: false, code: "METHOD_NOT_ALLOWED" }, 405);
  const authorization = req.headers.get("Authorization") || "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) return json(req, { ok: false, code: "AUTH_REQUIRED" }, 401);
  if (!env("SUPABASE_URL") || !publishableKey()) return json(req, { ok: false, code: "SERVER_CONFIG_ERROR" }, 503);
  let user;
  try {
    const client = createClient(env("SUPABASE_URL"), publishableKey(), { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.auth.getUser();
    if (error || !data?.user?.id) return json(req, { ok: false, code: "AUTH_REQUIRED" }, 401);
    user = data.user;
  } catch { return json(req, { ok: false, code: "AUTH_REQUIRED" }, 401); }
  const owner = env("HANI_OWNER_USER_ID");
  if (!owner) return json(req, { ok: false, code: "OWNER_ACCESS_NOT_CONFIGURED" }, 503);
  if (user.id !== owner) return json(req, { ok: false, code: "OWNER_ACCESS_DENIED" }, 403);
  try {
    const body = await req.json().catch(() => null);
    const action = body?.action;
    if (!["status", "oauth_start", "list", "search", "recent"].includes(action)) return json(req, { ok: false, code: "INVALID_ACTION" }, 400);
    const folderId = body.folderId ?? "root", pageToken = body.pageToken ?? "";
    if (typeof folderId !== "string" || !/^[\w-]{1,256}$/.test(folderId) || typeof pageToken !== "string" || pageToken.length > 4096) return json(req, { ok: false, code: "INVALID_QUERY" }, 400);
    if (action === "search" && (typeof body.query !== "string" || !body.query.trim() || body.query.length > 200 || (body.fullText !== undefined && typeof body.fullText !== "boolean"))) return json(req, { ok: false, code: "INVALID_QUERY" }, 400);
    if (!secretKey()) throw new Error("SERVER_CONFIG_ERROR");
    const admin = createClient(env("SUPABASE_URL"), secretKey(), { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: connection, error } = await admin.from("hani_google_calendar_connections").select("*").eq("user_id", user.id).maybeSingle();
    if (error) throw new Error("CONNECTION_FAILED");
    if (action === "oauth_start" || !connection?.refresh_token_enc || !Array.isArray(connection.scopes) || !connection.scopes.includes(DRIVE_SCOPE)) return await scopeRequired(req, admin, user.id);
    let access;
    try { access = await usableAccessToken(admin, user.id, connection); }
    catch (e) { if (e instanceof Error && e.message === "RECONNECT") return await scopeRequired(req, admin, user.id); throw e; }
    const qs = new URLSearchParams();
    let path = "files";
    if (action === "status") { path = "about"; qs.set("fields", "user(displayName,emailAddress)"); }
    else {
      let q = "trashed = false";
      if (action === "list") q += ` and '${literal(folderId)}' in parents`;
      if (action === "search") q += ` and ${body.fullText === true ? "fullText" : "name"} contains '${literal(body.query.trim())}'`;
      qs.set("q", q); qs.set("pageSize", action === "recent" ? "20" : "50");
      qs.set("orderBy", action === "recent" ? "modifiedTime desc" : "folder,name_natural");
      qs.set("fields", `nextPageToken,files(${FILE_FIELDS})`);
      if (pageToken) qs.set("pageToken", pageToken);
    }
    const res = await fetch(`https://www.googleapis.com/drive/v3/${path}?${qs}`, { headers: { Authorization: `Bearer ${access}` } });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 || (res.status === 403 && data?.error?.errors?.some((e: any) => e.reason === "insufficientPermissions"))) return await scopeRequired(req, admin, user.id);
    if (!res.ok) return json(req, { ok: false, code: res.status === 403 ? "DRIVE_FORBIDDEN" : res.status === 429 ? "DRIVE_RATE_LIMIT" : "DRIVE_REQUEST_FAILED" }, res.status === 429 ? 429 : 502);
    if (action === "status") return json(req, { ok: true, connected: true, accountHint: String(data.user?.emailAddress || data.user?.displayName || "Google 계정") });
    // Never forward upstream bodies wholesale, even on a successful response.
    const files = (Array.isArray(data.files) ? data.files : []).map((file: Json) => Object.fromEntries(FILE_FIELDS.split(",").filter(key => file[key] !== undefined).map(key => [key, file[key]])));
    return json(req, { ok: true, connected: true, files, nextPageToken: String(data.nextPageToken || "") });
  } catch {
    // Database/OAuth failures may contain credentials. Do not log or echo them.
    return json(req, { ok: false, code: "DRIVE_UNAVAILABLE", message: "Drive 연결을 확인하지 못했어요. 잠시 후 다시 시도해 주세요." }, 503);
  }
});
