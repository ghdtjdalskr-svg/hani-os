// PROJECT HANI
// hani-learning-quiz v0.1.0 · READ-ONLY Daily Quiz Generator
// - Authenticated requests only
// - OpenAI key remains server-side
// - ZERO database write
// - ZERO public.hani_state read/write
// - One generation call per user request; no background generation

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const QUIZ_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    questions: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          type: { type: "string" },
          topic: { type: "string" },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          prompt: { type: "string" },
          choices: { type: "array", minItems: 4, maxItems: 4, items: { type: "string" } },
          answer_index: { type: "integer", minimum: 0, maximum: 3 },
          explanation: { type: "string" },
        },
        required: ["type", "topic", "difficulty", "prompt", "choices", "answer_index", "explanation"],
      },
    },
  },
  required: ["questions"],
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function cleanText(value: unknown, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function extractOutputText(payload: any): string {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) return payload.output_text.trim();
  const parts: string[] = [];
  for (const item of Array.isArray(payload?.output) ? payload.output : []) {
    for (const part of Array.isArray(item?.content) ? item.content : []) {
      if (part?.type === "output_text" && typeof part?.text === "string") parts.push(part.text);
    }
  }
  return parts.join("").trim();
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

function systemPrompt() {
  return [
    "당신은 PROJECT HANI의 히나 학습 Agent입니다.",
    "사용자의 학습 프로젝트와 최근 약점을 바탕으로 오늘 풀 객관식 5문제를 만듭니다.",
    "항상 정확히 5문제, 각 문제는 선택지 4개를 제공합니다.",
    "정답은 answer_index 0~3으로 표시하고, 각 문제에 짧고 학습 가능한 해설을 제공합니다.",
    "최근 약점이 있으면 5문제 중 2~3문제에 약점 유형을 반영하되 같은 문제를 그대로 복제하지 마세요.",
    "약점이 없으면 프로젝트 목표 범위를 균형 있게 샘플링하세요.",
    "JLPT 프로젝트라면 문제 지시문은 한국어로 쓰고, 실제 일본어 어휘/문법/독해 예문은 일본어를 사용하세요.",
    "JLPT N3라면 N3 수준을 우선하고 지나치게 쉬운 N5/N4 또는 N1 수준으로 치우치지 마세요.",
    "문제 자체에 정답을 암시하지 마세요.",
    "사실·문법적으로 모호하거나 정답이 둘 이상 가능한 문항은 만들지 마세요.",
    "사용자 개인정보나 프로젝트와 무관한 추정을 추가하지 마세요.",
    "결과는 지정된 JSON Schema만 따릅니다.",
  ].join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok:false, error:"METHOD_NOT_ALLOWED", message:"POST 요청만 허용됩니다." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
  const openaiKey = Deno.env.get("OPENAI_API_KEY") || "";
  if (!supabaseUrl || !publishableKey || !openaiKey) return json({ ok:false, error:"SERVER_CONFIG_ERROR", message:"서버 인증/API 설정을 확인하지 못했습니다." }, 500);

  const user = await authenticatedUser(req, supabaseUrl, publishableKey);
  if (!user) return json({ ok:false, error:"INVALID_SESSION", message:"HANI OS 로그인 세션이 필요합니다." }, 401);

  const body = asObject(await req.json().catch(() => ({})));
  const project = asObject(body.project);
  const projectName = cleanText(project.name, 120);
  if (!projectName) return json({ ok:false, error:"PROJECT_REQUIRED", message:"학습 프로젝트 이름이 필요합니다." }, 400);

  const weaknesses = (Array.isArray(body.weaknesses) ? body.weaknesses : []).slice(0, 12).map((raw: any) => ({
    type: cleanText(raw?.type, 80),
    topic: cleanText(raw?.topic, 100),
    wrong_count: Math.max(1, Math.min(20, Number(raw?.wrong_count || 1))),
    question: cleanText(raw?.question, 260),
  }));

  const input = JSON.stringify({
    local_date: cleanText(body.local_date, 20),
    project: {
      id: cleanText(project.id, 120),
      name: projectName,
      category: cleanText(project.category, 60),
      goal: cleanText(project.goal, 800),
      target_date: cleanText(project.target_date, 20),
    },
    weaknesses,
  }, null, 2);

  const startedAt = Date.now();
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.6-luna",
      instructions: systemPrompt(),
      input,
      max_output_tokens: 1800,
      reasoning: { effort: "none" },
      text: { verbosity: "low", format: { type: "json_schema", name: "hani_daily_learning_quiz", strict: true, schema: QUIZ_SCHEMA } },
      store: false,
    }),
  });
  const ai = await res.json().catch(() => ({}));
  if (!res.ok) return json({ ok:false, error:"QUIZ_MODEL_FAILED", message:ai?.error?.message || `OpenAI ${res.status}`, db_write:false, hani_state_touched:false }, 502);

  const output = extractOutputText(ai);
  let quiz: any = null;
  try { quiz = JSON.parse(output); } catch (_) { return json({ ok:false, error:"QUIZ_PARSE_FAILED", message:"퀴즈 JSON 파싱에 실패했습니다.", db_write:false, hani_state_touched:false }, 502); }
  if (!Array.isArray(quiz?.questions) || quiz.questions.length !== 5) return json({ ok:false, error:"QUIZ_COUNT_INVALID", message:"정확히 5문제를 생성하지 못했습니다.", db_write:false, hani_state_touched:false }, 502);

  return json({
    ok:true,
    service:"PROJECT HANI",
    function:"hani-learning-quiz",
    version:"0.1.0",
    quiz,
    model:String(ai?.model || "gpt-5.6-luna"),
    usage:ai?.usage || null,
    latency_ms:Date.now() - startedAt,
    db_write:false,
    hani_state_touched:false,
    store:false,
    message:"오늘의 학습 퀴즈 5문제를 생성했습니다. 서버는 학습 기록을 저장하지 않았습니다.",
  });
});
