import { createClient } from "npm:@supabase/supabase-js@2";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const GOOGLE_SCOPE = "https://www.googleapis.com/auth/calendar.events";
const DEFAULT_APP_ORIGIN = "https://ghdtjdalskr-svg.github.io";
const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

type Json = Record<string, unknown>;

function env(name: string, fallback = "") {
  return (Deno.env.get(name) || fallback).trim();
}
function firstKeyFromJson(name: string) {
  try {
    const raw = env(name);
    if (!raw) return "";
    const obj = JSON.parse(raw);
    return String(Object.values(obj || {})[0] || "");
  } catch {
    return "";
  }
}
function publishableKey() {
  return env("SUPABASE_ANON_KEY") || env("SUPABASE_PUBLISHABLE_KEY") || firstKeyFromJson("SUPABASE_PUBLISHABLE_KEYS");
}
function secretKey() {
  return env("SUPABASE_SERVICE_ROLE_KEY") || env("SUPABASE_SECRET_KEY") || firstKeyFromJson("SUPABASE_SECRET_KEYS");
}
function appOrigin() {
  try { return new URL(env("HANI_APP_ORIGIN", DEFAULT_APP_ORIGIN)).origin; }
  catch { return DEFAULT_APP_ORIGIN; }
}
function cors(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowed = appOrigin();
  return {
    "Access-Control-Allow-Origin": origin === allowed ? origin : allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Vary": "Origin",
  };
}
function json(req: Request, body: Json, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...cors(req) } });
}
function callbackRedirect(ok: boolean, reason = "callback_failed") {
  const target = new URL("/hani-os/", appOrigin());
  target.searchParams.set("google", ok ? "connected" : "error");
  if (!ok) target.searchParams.set("reason", reason === "access_denied" ? "access_denied" : "callback_failed");
  return new Response(null, { status: 302, headers: { "Location": target.href, "Cache-Control": "no-store" } });
}
function b64(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function unb64(value: string) {
  const s = atob(value);
  return Uint8Array.from(s, c => c.charCodeAt(0));
}
async function cryptoKey() {
  const secret = env("HANI_GOOGLE_TOKEN_KEY");
  if (!secret) throw new Error("HANI_GOOGLE_TOKEN_KEY secret is missing");
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
  if (!ivRaw || !dataRaw) throw new Error("Encrypted token format is invalid");
  const key = await cryptoKey();
  const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(ivRaw) }, key, unb64(dataRaw));
  return new TextDecoder().decode(dec);
}
function addOneDay(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
function isDate(value: unknown): value is string {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}
function callbackUrl() {
  const base = env("SUPABASE_URL").replace(/\/$/, "");
  return `${base}/functions/v1/hani-google-calendar/callback`;
}
function requireGoogleSecrets() {
  const clientId = env("GOOGLE_CLIENT_ID"), clientSecret = env("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Google OAuth client secrets are not configured");
  return { clientId, clientSecret };
}
function clients() {
  const url = env("SUPABASE_URL"), pub = publishableKey(), secret = secretKey();
  if (!url || !pub || !secret) throw new Error("Supabase function environment is incomplete");
  return {
    admin: createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } }),
    publicClient: createClient(url, pub, { auth: { persistSession: false, autoRefreshToken: false } }),
  };
}
async function userFromRequest(req: Request, admin: ReturnType<typeof createClient>) {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new Error("AUTH_REQUIRED");
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user?.id) throw new Error("AUTH_REQUIRED");
  return data.user;
}
async function googleTokenRequest(params: URLSearchParams) {
  const res = await fetch(GOOGLE_TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: params });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Google token exchange failed: ${String(data?.error_description || data?.error || res.status)}`);
  return data;
}
async function getConnection(admin: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await admin.from("hani_google_calendar_connections").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}
async function usableAccessToken(admin: ReturnType<typeof createClient>, userId: string, connection: any) {
  const expiresAt = connection?.token_expires_at ? new Date(connection.token_expires_at).getTime() : 0;
  if (connection?.access_token_enc && expiresAt > Date.now() + 90_000) return decryptText(connection.access_token_enc);
  const refreshToken = await decryptText(String(connection?.refresh_token_enc || ""));
  if (!refreshToken) throw new Error("Google refresh token is missing. Reconnect Calendar.");
  const { clientId, clientSecret } = requireGoogleSecrets();
  const data = await googleTokenRequest(new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }));
  const access = String(data.access_token || "");
  if (!access) throw new Error("Google access token refresh returned no token");
  const expires = new Date(Date.now() + Math.max(60, Number(data.expires_in || 3600)) * 1000).toISOString();
  const { error } = await admin.from("hani_google_calendar_connections").update({ access_token_enc: await encryptText(access), token_expires_at: expires, updated_at: new Date().toISOString() }).eq("user_id", userId);
  if (error) throw error;
  return access;
}
async function googleJson(url: string, accessToken: string, init: RequestInit = {}) {
  const res = await fetch(url, { ...init, headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json", ...(init.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}
async function findTaskEvent(accessToken: string, calendarId: string, taskId: string) {
  const qs = new URLSearchParams({ maxResults: "1", singleEvents: "true", privateExtendedProperty: `hani_task_id=${taskId}` });
  const { res, data } = await googleJson(`${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${qs}`, accessToken);
  if (!res.ok) throw new Error(`Google Calendar search failed (${res.status})`);
  return Array.isArray(data?.items) && data.items[0] ? data.items[0] : null;
}
async function upsertTaskEvent(accessToken: string, calendarId: string, task: any) {
  const taskId = String(task.id || "").trim(), text = String(task.text || "").trim(), due = String(task.due || "").trim();
  if (!taskId || !text || !isDate(due)) throw new Error("Task id/text/due validation failed");
  const body = {
    summary: text.slice(0, 512),
    description: `HANI OS 할 일에서 단방향 동기화됨.\nHANI Task ID: ${taskId}`,
    start: { date: due },
    end: { date: addOneDay(due) },
    extendedProperties: { private: { hani_task_id: taskId, hani_source: "HANI_OS_TASKS" } },
  };
  let eventId = String(task.event_id || "").trim();
  if (!eventId) eventId = String((await findTaskEvent(accessToken, calendarId, taskId))?.id || "");
  if (eventId) {
    const { res, data } = await googleJson(`${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, accessToken, { method: "PATCH", body: JSON.stringify(body) });
    if (res.ok) return data;
    if (res.status !== 404 && res.status !== 410) throw new Error(`Google Calendar update failed (${res.status})`);
  }
  const { res, data } = await googleJson(`${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`, accessToken, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Google Calendar insert failed (${res.status})`);
  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  const url = new URL(req.url);
  const { admin } = clients();

  if (req.method === "GET" && url.pathname.endsWith("/callback")) {
    const state = url.searchParams.get("state") || "", code = url.searchParams.get("code") || "", oauthError = url.searchParams.get("error") || "";
    try {
      if (!state) throw new Error("OAuth state가 없습니다.");
      const { data: stateRow, error: stateError } = await admin.from("hani_google_calendar_oauth_states").select("user_id,expires_at").eq("state", state).maybeSingle();
      if (stateError || !stateRow?.user_id) throw new Error("OAuth state가 유효하지 않습니다.");
      await admin.from("hani_google_calendar_oauth_states").delete().eq("state", state);
      if (new Date(stateRow.expires_at).getTime() < Date.now()) throw new Error("Google 연결 요청이 만료되었습니다. 다시 연결해 주세요.");
      if (oauthError) throw new Error(`Google 연결이 취소되었거나 거부되었습니다. (${oauthError})`);
      if (!code) throw new Error("Google authorization code가 없습니다.");
      const { clientId, clientSecret } = requireGoogleSecrets();
      const tokenData = await googleTokenRequest(new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: callbackUrl(), grant_type: "authorization_code" }));
      const old = await getConnection(admin, stateRow.user_id);
      const refreshRaw = String(tokenData.refresh_token || "") || (old?.refresh_token_enc ? await decryptText(old.refresh_token_enc) : "");
      if (!refreshRaw) throw new Error("Google refresh token을 받지 못했습니다. 연결을 다시 시도해 주세요.");
      const accessRaw = String(tokenData.access_token || "");
      const now = new Date().toISOString();
      const row = {
        user_id: stateRow.user_id,
        calendar_id: "primary",
        access_token_enc: accessRaw ? await encryptText(accessRaw) : old?.access_token_enc || "",
        refresh_token_enc: await encryptText(refreshRaw),
        token_expires_at: accessRaw ? new Date(Date.now() + Math.max(60, Number(tokenData.expires_in || 3600)) * 1000).toISOString() : old?.token_expires_at || null,
        scopes: String(tokenData.scope || GOOGLE_SCOPE).split(/\s+/).filter(Boolean),
        connected_at: old?.connected_at || now,
        updated_at: now,
      };
      const { error: upsertError } = await admin.from("hani_google_calendar_connections").upsert(row, { onConflict: "user_id" });
      if (upsertError) throw upsertError;
      return callbackRedirect(true);
    } catch (e) {
      return callbackRedirect(false, oauthError === "access_denied" ? "access_denied" : "callback_failed");
    }
  }

  if (req.method !== "POST") return json(req, { ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
  try {
    const user = await userFromRequest(req, admin);
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "");

    if (action === "status") {
      const connection = await getConnection(admin, user.id);
      return json(req, { ok: true, connected: !!connection?.refresh_token_enc, calendar_id: connection?.calendar_id || "primary", connected_at: connection?.connected_at || "" });
    }

    if (action === "oauth_start") {
      const { clientId } = requireGoogleSecrets();
      const state = `${crypto.randomUUID()}${crypto.randomUUID().replaceAll("-", "")}`;
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const { error } = await admin.from("hani_google_calendar_oauth_states").insert({ state, user_id: user.id, expires_at: expiresAt });
      if (error) throw error;
      const qs = new URLSearchParams({ client_id: clientId, redirect_uri: callbackUrl(), response_type: "code", scope: GOOGLE_SCOPE, access_type: "offline", prompt: "consent", include_granted_scopes: "true", state });
      return json(req, { ok: true, auth_url: `${GOOGLE_AUTH_URL}?${qs}` });
    }

    if (action === "disconnect") {
      const connection = await getConnection(admin, user.id);
      if (connection) {
        try {
          const token = connection.refresh_token_enc ? await decryptText(connection.refresh_token_enc) : (connection.access_token_enc ? await decryptText(connection.access_token_enc) : "");
          if (token) await fetch(`${GOOGLE_REVOKE_URL}?token=${encodeURIComponent(token)}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" } });
        } catch { /* local deletion still proceeds */ }
        const { error } = await admin.from("hani_google_calendar_connections").delete().eq("user_id", user.id);
        if (error) throw error;
      }
      return json(req, { ok: true, disconnected: true });
    }

    if (action === "sync_tasks") {
      const tasks = Array.isArray(body?.tasks) ? body.tasks.slice(0, 50) : [];
      if (!tasks.length) return json(req, { ok: false, error: "NO_TASKS", message: "동기화할 할 일이 없습니다." }, 400);
      const connection = await getConnection(admin, user.id);
      if (!connection?.refresh_token_enc) return json(req, { ok: false, error: "GOOGLE_NOT_CONNECTED", message: "Google Calendar를 먼저 연결해 주세요." }, 409);
      const accessToken = await usableAccessToken(admin, user.id, connection), calendarId = String(connection.calendar_id || "primary");
      const results: any[] = [], errors: any[] = [];
      for (const task of tasks) {
        try {
          const event = await upsertTaskEvent(accessToken, calendarId, task);
          results.push({ task_id: String(task.id), event_id: String(event.id || ""), html_link: String(event.htmlLink || ""), calendar_id: calendarId, synced_at: new Date().toISOString() });
        } catch (e) {
          errors.push({ task_id: String(task?.id || ""), message: e instanceof Error ? e.message : String(e) });
        }
      }
      return json(req, { ok: true, results, errors, synced: results.length, failed: errors.length });
    }

    return json(req, { ok: false, error: "UNKNOWN_ACTION", message: "지원하지 않는 Calendar action입니다." }, 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "AUTH_REQUIRED") return json(req, { ok: false, error: "AUTH_REQUIRED", message: "HANI OS Cloud 로그인이 필요합니다." }, 401);
    console.error("hani-google-calendar", msg);
    return json(req, { ok: false, error: "CALENDAR_ERROR", message: msg }, 500);
  }
});
