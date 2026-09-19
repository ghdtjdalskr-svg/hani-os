// Independent weekly Company & Industry F/U publisher.
// Existing hani_newsroom_posts only; never writes hani_state or Life OS storage.
import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = "gpt-5.6-luna";
const CHANNELS = ["semiconductor", "lg", "infra", "frontier", "world"];
const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hani-cron-secret", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { ...headers, "Content-Type": "application/json; charset=utf-8" } });
const object = (v: any): Record<string, any> => v && typeof v === "object" && !Array.isArray(v) ? v : {};
const list = (v: any): any[] => Array.isArray(v) ? v : [];
const text = (v: any, n = 1000) => String(v ?? "").trim().slice(0, n);
function defaultKey(envName: string, legacyName: string) {
  const raw = Deno.env.get(envName);
  if (raw) { try { const keys = JSON.parse(raw); if (keys?.default) return String(keys.default); } catch { /* legacy fallback */ } }
  return Deno.env.get(legacyName) ?? "";
}
function period(now = new Date()) {
  const pieces = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const value = (part: string) => Number(pieces.find(p => p.type === part)?.value || 0);
  const year = value("year"), month = value("month"), week = Math.floor((value("day") - 1) / 7) + 1;
  return { key: `company-followup:${year}-${String(month).padStart(2, "0")}-W${week}`, label: `${month}월 ${week}주차` };
}
function outputText(value: any) {
  if (typeof value?.output_text === "string" && value.output_text.trim()) return value.output_text.trim();
  return list(value?.output).flatMap((x: any) => list(x?.content)).filter((x: any) => x?.type === "output_text").map((x: any) => x.text).join("").trim();
}
function sourceUrls(value: any) {
  return new Set(list(value?.output).filter((x: any) => x?.type === "web_search_call").flatMap((x: any) => list(x?.action?.sources)).map((x: any) => safeUrl(x?.url)).filter(Boolean));
}
function safeUrl(value: any) {
  try { const u = new URL(text(value, 2000)); if (!/^https?:$/.test(u.protocol)) return ""; u.hash = ""; for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"]) u.searchParams.delete(key); return u.href.replace(/\/$/, ""); } catch { return ""; }
}
const sourceSchema = { type: "object", additionalProperties: false, properties: { name: { type: "string" }, url: { type: "string" } }, required: ["name", "url"] };
const commentSchema = { type: "object", additionalProperties: false, properties: {
  agent_key: { type: "string", enum: ["hani", "jieun", "sua", "hina", "nauen", "haru", "suyeon", "minji", "yuna", "arin"] },
  agent_name: { type: "string" }, role: { type: "string" }, comment: { type: "string" },
}, required: ["agent_key", "agent_name", "role", "comment"] };
const issueSchema = { type: "object", additionalProperties: false, properties: {
  title: { type: "string" }, topic: { type: "string" }, importance: { type: "string", enum: ["핵심", "관찰"] },
  event_at: { type: "string" }, change: { type: "string" }, summary: { type: "string" }, next_check: { type: "string" },
  sentiment: { type: "string", enum: ["POSITIVE", "NEGATIVE", "MIXED", "NEUTRAL"] },
  sources: { type: "array", maxItems: 3, items: sourceSchema }, comments: { type: "array", maxItems: 3, items: commentSchema },
}, required: ["title", "topic", "importance", "event_at", "change", "summary", "next_check", "sentiment", "sources", "comments"] };
const schema = { type: "object", additionalProperties: false, properties: {
  headlines: { type: "object", additionalProperties: false, properties: Object.fromEntries(CHANNELS.map(key => [key, { type: "string" }])), required: CHANNELS },
  channels: { type: "object", additionalProperties: false, properties: Object.fromEntries(CHANNELS.map(key => [key, { type: "array", maxItems: 3, items: issueSchema }])), required: CHANNELS },
}, required: ["headlines", "channels"] };
async function research(apiKey: string, now: Date) {
  const instructions = [
    "당신은 HANI OS 주간 기업·산업 F/U 편집자입니다. 한국어로 작성하세요.",
    "현재 시각과 지난 7일을 기준으로 웹 검색으로 확인한 중요한 신규 변화만 선정합니다. 각 채널 0~3건이며 변화가 없으면 빈 배열입니다. 빈자리를 채우기 위한 가짜 사건, 전망 반복, 단순 재보도는 금지합니다.",
    "채널: semiconductor=삼성전자·SK하이닉스 국내 반도체, lg=LG전자 회사 사업(주식/우선주 설명 금지), infra=AWS·Google·Microsoft·NVIDIA AI 인프라와 클라우드, frontier=OpenAI·Anthropic, world=한국 경제와 관심 산업에 직접 연결되는 국제 정책·외교·공급망.",
    "한 사건은 가장 적합한 채널 한 곳에만 배치하고 다른 채널에는 중복 생성하지 마세요. 직접 영향이 없다면 국제 정세 기사도 제외하세요.",
    "출처 URL은 검색으로 확인한 실제 기사 또는 공식 발표만 사용하세요. 각 이슈에 검증 가능한 출처가 없다면 제외하세요. event_at은 확인된 사건 날짜 ISO 형식으로 쓰세요.",
    "sentiment는 해당 채널에 대한 확인된 영향만 POSITIVE/NEGATIVE/MIXED/NEUTRAL로 판단하고, 과장된 투자 조언은 금지합니다.",
    "AI TEAM 의견은 사실 요약 반복 대신 근거 해석과 반론 또는 다음 체크포인트를 서로 다르게 1~2개만 쓰세요. 실제 이용자 댓글인 척하지 마세요.",
  ].join("\n");
  const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({
    model: MODEL, instructions, input: JSON.stringify({ as_of: now.toISOString(), lookback_days: 7, timezone: "Asia/Seoul" }),
    tools: [{ type: "web_search", search_context_size: "medium", user_location: { type: "approximate", country: "KR", timezone: "Asia/Seoul" } }],
    tool_choice: "required", include: ["web_search_call.action.sources"], max_output_tokens: 10000, reasoning: { effort: "none" },
    text: { verbosity: "low", format: { type: "json_schema", name: "company_followup_weekly", strict: true, schema } }, store: false,
  }) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Research API ${response.status}: ${text(body?.error?.message, 300)}`);
  const raw = outputText(body);
  if (!raw) throw new Error("Research output is empty");
  const result = JSON.parse(raw), cited = sourceUrls(body), weekStart = now.getTime() - 8 * 86400000;
  const seen = new Set<string>(), channels: Record<string, any[]> = {};
  for (const key of CHANNELS) {
    channels[key] = [];
    for (const issue of list(object(result.channels)[key]).slice(0, 3)) {
      const x = object(issue), title = text(x.title, 180), eventAt = new Date(x.event_at), signature = title.toLowerCase().replace(/\s+/g, "");
      if (!title || seen.has(signature) || Number.isNaN(eventAt.getTime()) || eventAt.getTime() < weekStart || eventAt.getTime() > now.getTime() + 86400000) continue;
      const sources = list(x.sources).map(s => ({ name: text(object(s).name, 100), url: safeUrl(object(s).url) })).filter(s => s.url && cited.has(s.url)).slice(0, 3);
      if (!sources.length) continue;
      seen.add(signature);
      channels[key].push({ title, topic: text(x.topic, 60), importance: x.importance === "핵심" ? "핵심" : "관찰", event_at: eventAt.toISOString(),
        change: text(x.change, 240), summary: text(x.summary, 900), next_check: text(x.next_check, 200),
        sentiment: ["POSITIVE", "NEGATIVE", "MIXED", "NEUTRAL"].includes(x.sentiment) ? x.sentiment : "NEUTRAL", sources,
        comments: list(x.comments).slice(0, 2).filter(c => text(object(c).comment)).map(c => ({ agent_key: text(c.agent_key, 30), agent_name: text(c.agent_name, 30), role: text(c.role, 40), comment: text(c.comment, 500) })),
      });
    }
  }
  return { version: 1, week_label: period(now).label, headlines: object(result.headlines), channels, researched_at: now.toISOString(), model: MODEL };
}
Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return json({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
  const url = Deno.env.get("SUPABASE_URL") || "", serviceKey = defaultKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");
  const openaiKey = Deno.env.get("OPENAI_API_KEY") || "", cronSecret = Deno.env.get("HANI_NEWSROOM_CRON_SECRET") || "";
  if (!url || !serviceKey || !openaiKey || !cronSecret) return json({ ok: false, error: "SERVER_CONFIG_ERROR" }, 500);
  if (!request.headers.get("x-hani-cron-secret") || request.headers.get("x-hani-cron-secret") !== cronSecret) return json({ ok: false, error: "UNAUTHORIZED" }, 401);
  let body: Record<string, any> = {}; try { body = object(await request.json()); } catch { /* default */ }
  if (body.action !== "scheduled_publish") return json({ ok: false, error: "UNKNOWN_ACTION" }, 400);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const now = new Date(), week = period(now);
  const { data: existing, error: existingError } = await admin.from("hani_newsroom_posts").select("user_id").eq("dedupe_key", week.key);
  if (existingError) return json({ ok: false, error: "READ_FAILED" }, 500);
  const published = new Set(list(existing).map(x => x.user_id));
  const { data: states, error: usersError } = await admin.from("hani_state").select("user_id");
  if (usersError) return json({ ok: false, error: "USER_DISCOVERY_FAILED" }, 500);
  const recipients = [...new Set(list(states).map(x => text(x.user_id, 100)).filter(Boolean))].filter(id => !published.has(id));
  if (!recipients.length) return json({ ok: true, period_key: week.key, published: 0, reason: "ALREADY_PUBLISHED" });
  let followup: any;
  try { followup = await research(openaiKey, now); } catch (e) { return json({ ok: false, error: "RESEARCH_FAILED", message: text((e as Error)?.message, 300) }, 502); }
  const count = CHANNELS.reduce((n, key) => n + list(followup.channels[key]).length, 0);
  if (!count) return json({ ok: true, period_key: week.key, published: 0, reason: "NO_VERIFIED_CHANGES" });
  const rows = recipients.map(user_id => ({ user_id, post_type: "WEEKLY", period_key: week.key, dedupe_key: week.key,
    title: `${week.label} 기업·산업 F/U`, entity_name: "기업·산업 F/U", published_at: now.toISOString(),
    summary: `5개 채널 · 핵심 이슈 ${count}개`, comments: [], payload: { company_followup: followup } }));
  const { data, error } = await admin.from("hani_newsroom_posts").upsert(rows, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true }).select("id,user_id,dedupe_key");
  if (error) return json({ ok: false, error: "ARCHIVE_WRITE_FAILED", message: text(error.message, 300) }, 500);
  const { data: checked, error: readError } = await admin.from("hani_newsroom_posts").select("user_id").eq("dedupe_key", week.key).in("user_id", recipients);
  if (readError || list(checked).length !== recipients.length) return json({ ok: false, error: "READ_BACK_FAILED", inserted: list(data).length }, 500);
  return json({ ok: true, period_key: week.key, published: list(data).length, issue_count: count });
});
