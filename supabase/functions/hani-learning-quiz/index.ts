// PROJECT HANI
// hani-learning-quiz v0.3.0 · READ-ONLY Dynamic Quiz Generator
// - Authenticated requests only
// - OpenAI key remains server-side
// - ZERO database write
// - ZERO public.hani_state read/write
// - Regeneration feedback is applied to each request

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function quizSchema(quizSize: number) {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      questions: {
        type: "array",
        minItems: quizSize,
        maxItems: quizSize,
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
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function cleanText(value: unknown, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}

function cleanTextList(value: unknown, limit: number, max = 260) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, limit).map((item) => cleanText(item, max)).filter(Boolean);
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function boundedInteger(value: unknown, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.max(minimum, Math.min(maximum, parsed)) : fallback;
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

function systemPrompt(quizSize: number, weaknessCount: number, isRetry: boolean) {
  return [
    "당신은 PROJECT HANI의 히나 학습 Agent입니다.",
    `사용자의 학습 프로젝트와 최근 약점을 바탕으로 오늘 풀 객관식 ${quizSize}문제를 만듭니다.`,
    `항상 정확히 ${quizSize}문제, 각 문제는 서로 다른 선택지 4개와 정답 1개를 제공합니다.`,
    "정답은 answer_index 0~3으로 표시하고, 각 문제에 짧고 학습 가능한 해설을 제공합니다.",
    `최근 약점이 있으면 최대 ${weaknessCount}문제에 약점 유형을 반영하세요.`,
    "accepted_prompts는 이미 채택되어 유지되는 문항입니다. 출력에 다시 포함하지 마세요.",
    "avoid_prompts와 rejected_prompts의 질문을 그대로 또는 문장 일부만 바꿔 반복하지 마세요.",
    "중복 금지는 질문·예문·상황·보기 구성이 실질적으로 같은 경우를 뜻합니다.",
    "같은 문법·어휘·학습 포인트 자체는 새 문장, 새 상황, 새 보기라면 복습 문제로 다시 출제할 수 있습니다.",
    "최근 약점 복습을 우선하되 이전 오답 문장을 복사하지 말고 다른 맥락으로 변형하세요.",
    isRetry ? "이번 요청은 부족한 문항만 보충하는 재시도입니다. 제공된 재시도 피드백을 반드시 적용하세요." : "첫 생성에서도 최근 출제 문항과 겹치지 않게 다양하게 구성하세요.",
    "어휘·문법·짧은 독해·표현/용법을 프로젝트 범위 안에서 가능한 한 균형 있게 섞으세요.",
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
  const feedback = asObject(body.generation_feedback);
  const projectName = cleanText(project.name, 120);
  if (!projectName) return json({ ok:false, error:"PROJECT_REQUIRED", message:"학습 프로젝트 이름이 필요합니다." }, 400);
  const focusAreas = cleanTextList(project.focus_areas, 12, 80);
  const examDate = cleanText(project.exam_date, 20);
  const scheduleType = cleanText(project.schedule_type, 40);
  const goal = cleanText(project.goal, 800) || focusAreas.join(" / ");
  const targetDate = cleanText(project.target_date, 20) || examDate;
  const quizSize = boundedInteger(project.quiz_size, 20, 1, 20);
  const attempt = boundedInteger(feedback.attempt, 1, 1, 12);
  const requestedCount = boundedInteger(feedback.requested_count, quizSize, 1, 20);
  const acceptedPrompts = cleanTextList(feedback.accepted_prompts, 20);
  const avoidPrompts = cleanTextList(feedback.avoid_prompts, 60);
  const rejectedPrompts = [
    ...cleanTextList(feedback.rejected_prompts, 60),
    ...cleanTextList([feedback.rejected_prompt], 1),
  ].filter((value, index, all) => all.indexOf(value) === index).slice(0, 60);
  const recentLearningPoints = (Array.isArray(feedback.recent_learning_points) ? feedback.recent_learning_points : [])
    .slice(0, 12).map((raw) => {
      const point = asObject(raw);
      return { point: cleanText(point.point, 100), count: boundedInteger(point.count, 1, 1, 50) };
    }).filter((item) => item.point);
  const weaknessReviewPriority = feedback.weakness_review_priority !== false;
  const feedbackInstruction = cleanText(feedback.instruction, 500);
  const weaknessQuestionCount = Math.max(1, Math.min(8, Math.round(quizSize * 0.33)));

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
      goal,
      target_date: targetDate,
      focus_areas: focusAreas,
      exam_date: examDate,
      schedule_type: scheduleType,
      quiz_size: quizSize,
    },
    weaknesses,
    generation_feedback: {
      attempt,
      requested_count: requestedCount,
      accepted_prompts: acceptedPrompts,
      avoid_prompts: avoidPrompts,
      rejected_prompts: rejectedPrompts,
      recent_learning_points: recentLearningPoints,
      weakness_review_priority: weaknessReviewPriority,
      instruction: feedbackInstruction,
    },
    question_sources: Array.isArray(body.question_sources) ? body.question_sources.slice(0, 24) : [],
    engine_contract: asObject(body.engine_contract),
  }, null, 2);

  const startedAt = Date.now();
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.6-luna",
      instructions: systemPrompt(quizSize, weaknessQuestionCount, attempt > 1 || acceptedPrompts.length > 0),
      input,
      max_output_tokens: Math.max(1800, Math.min(7000, quizSize * 350)),
      reasoning: { effort: "none" },
      text: { verbosity: "low", format: { type: "json_schema", name: "hani_daily_learning_quiz", strict: true, schema: quizSchema(quizSize) } },
      store: false,
    }),
  });
  const ai = await res.json().catch(() => ({}));
  if (!res.ok) return json({ ok:false, error:"QUIZ_MODEL_FAILED", message:ai?.error?.message || `OpenAI ${res.status}`, db_write:false, hani_state_touched:false }, 502);

  const output = extractOutputText(ai);
  let quiz: any = null;
  try { quiz = JSON.parse(output); } catch (_) { return json({ ok:false, error:"QUIZ_PARSE_FAILED", message:"퀴즈 JSON 파싱에 실패했습니다.", db_write:false, hani_state_touched:false }, 502); }
  if (!Array.isArray(quiz?.questions) || quiz.questions.length !== quizSize) return json({ ok:false, error:"QUIZ_COUNT_INVALID", message:`정확히 ${quizSize}문제를 생성하지 못했습니다.`, db_write:false, hani_state_touched:false }, 502);

  return json({
    ok:true,
    service:"PROJECT HANI",
    function:"hani-learning-quiz",
    version:"0.3.0",
    feedback_applied:true,
    requested_count:requestedCount,
    quiz,
    model:String(ai?.model || "gpt-5.6-luna"),
    usage:ai?.usage || null,
    latency_ms:Date.now() - startedAt,
    db_write:false,
    hani_state_touched:false,
    store:false,
    message:`오늘의 학습 퀴즈 ${quizSize}문제를 생성했습니다. 서버는 학습 기록을 저장하지 않았습니다.`,
  });
});
