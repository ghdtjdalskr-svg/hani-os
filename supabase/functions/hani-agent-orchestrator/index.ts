// PROJECT HANI
// hani-agent-orchestrator v1.8.0 · Investment Newsroom v0.3 + Purchase Review v2
// Phase 11: Adaptive Policy Engine v0.2 + confidence-weighted policy evidence.
// Learned rules are advisory heuristics that strengthen/weaken with evidence.
// Constitution / hard-stop governance remains representative-controlled.
// IMPORTANT:
// - Writes ONLY to hani_agent_cases, hani_agent_reviews, hani_agent_decisions, hani_agent_events, hani_agent_policies, and hani_agent_policy_evidence.
// - DOES NOT read/write public.hani_state.
// - Calls OpenAI for investment_news, classify_request, extract_intake_image, extract_intake_text, openai_health, run_reviews, verify_and_synthesize, and research_case actions.
// - Representative decisions are recorded WITHOUT committing to public.hani_state.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const WORKFLOWS = new Set([
  "PURCHASE_REVIEW",
  "INVESTMENT_REVIEW",
  "DESIGN_REVIEW",
  "HEALTH_REVIEW",
  "STUDY_REVIEW",
  "TRAVEL_REVIEW",
  "CONTENT_RECOMMENDATION",
  "TECH_REVIEW",
  "FINANCE_REVIEW",
  "KNOWLEDGE_REVIEW",
  "GENERAL_REVIEW",
]);

const RISK_LEVELS = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const COMPANY_POLICY = {
  constitution_version: "1.0",
  operating_policy_version: "0.3",
  principles: [
    "대표가 최종 의사결정권자이며 AI는 승인 없이 중요한 Commit을 실행하지 않는다.",
    "데이터 보존 > 안정성 > 입력 편의 > 조회/시각화 > 디자인 순으로 판단한다.",
    "직급·다수결·하니의 의견 자체는 근거가 아니며 각 Agent는 독립적으로 판단한다.",
    "사실, 추론, 미확인을 구분하고 근거와 불확실성을 함께 제시한다.",
    "학습 규정은 절대 규칙이 아니다. 반복 근거와 반례에 따라 confidence와 적용 강도가 자동으로 오르내리며, 현재 Case와 충돌하면 이유를 남기고 다르게 판단할 수 있다.",
    "CONSTITUTION·HARD_STOP 성격의 규정은 AI가 자동 승격하지 않으며 대표의 명시적 승인을 요구한다.",
  ],
  purchase_rules: [
    { id: "PURCHASE-001", rule: "대표가 특정 제품을 지정하지 않았다면 후보 탐색은 AI 구매조직(PROCUREMENT)의 업무다." },
    { id: "PURCHASE-002", rule: "제품 탐색 전에 구매 목적과 실제 사용 시나리오를 확인한다. 사용 시나리오가 제품 카테고리를 바꾸면 대표에게 먼저 최소 질문을 한다." },
    { id: "PURCHASE-003", rule: "기존 HANI OS 행동 데이터와 비교해 구매가 실제 부족을 해결하는지, 기존 활동을 대체하는지, 새로운 효용을 추가하는지 판단한다." },
    { id: "INFO-001", rule: "대표만 아는 사실(HUMAN_REQUIRED)과 내부/외부 조사로 얻을 수 있는 사실(RESEARCH_REQUIRED)을 분리한다. 조사 가능한 정보를 대표에게 떠넘기지 않는다." },
    { id: "FINANCE-001", rule: "살 수 있다는 것(Affordability)과 지금 사도 된다는 것(Timing)은 별개다. 부채상환·비상금·저축목표·예정지출과 충돌하면 구매 시점 연기를 권고할 수 있다." },
    { id: "PURCHASE-004", rule: "최종 결재안은 사도 되는가 / 무엇을 살 것인가 / 어떤 방식으로 / 언제 살 것인가를 모두 포함하며, Agent 간 이견을 숨기지 않는다." },
    { id: "INFO-002", rule: "대표가 이미 답한 사실은 표현이 달라도 같은 의미의 질문으로 반복하지 않는다. 답변은 Case의 누적 Answer Memory로 보존한다." },
    { id: "INFO-003", rule: "LOW/MEDIUM 구매안건은 HUMAN_REQUIRED 질문을 원칙적으로 최대 2라운드까지만 허용한다. 이후 남는 비핵심 불확실성은 조건/가정으로 내려 결재안을 만든다." },
    { id: "DECISION-001", rule: "AI는 완벽한 정보가 아니라 충분한 정보로 결재안을 만든다. 안전·법적·치명적 재무 리스크가 아닌 한 끝없는 추가질문으로 대표 결정을 막지 않는다." },
  ],
} as const;

function companyPolicyForPrompt() {
  return JSON.stringify(COMPANY_POLICY, null, 2);
}

const POLICY_STATUSES = new Set(["DRAFT", "LEARNING", "ACTIVE", "REJECTED", "SUPERSEDED", "RETIRED"]);
const POLICY_TYPES = new Set(["CONSTITUTION", "OPERATING_POLICY", "WORKFLOW_PLAYBOOK", "AGENT_RULE", "DECISION_LESSON"]);

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function policyCodePrefix(workflow: string): string {
  const wf = String(workflow || "GLOBAL").toUpperCase();
  return wf === "PURCHASE_REVIEW" ? "PUR"
    : wf === "INVESTMENT_REVIEW" ? "INV"
    : wf === "FINANCE_REVIEW" ? "FIN"
    : wf === "HEALTH_REVIEW" ? "HLT"
    : wf === "TECH_REVIEW" ? "TEC"
    : "POL";
}

function clamp01(value: unknown, fallback = 0.5): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function policyLearningStage(confidenceValue: unknown): "WEAKENED" | "OBSERVED" | "LEARNING" | "ESTABLISHED" {
  const confidence = clamp01(confidenceValue);
  if (confidence < 0.40) return "WEAKENED";
  if (confidence < 0.60) return "OBSERVED";
  if (confidence < 0.80) return "LEARNING";
  return "ESTABLISHED";
}

function policyInfluenceWeight(confidenceValue: unknown): number {
  const confidence = clamp01(confidenceValue);
  if (confidence < 0.40) return 0.15;
  if (confidence < 0.60) return 0.35;
  if (confidence < 0.75) return 0.55;
  if (confidence < 0.85) return 0.75;
  return 0.90;
}

async function loadActivePolicySnapshot(admin: any, userId: string, workflow: string) {
  const { data, error } = await admin
    .from("hani_agent_policies")
    .select("id,policy_code,policy_type,scope,workflow,title,rule_text,status,version,governance_mode,enforcement_level,confidence,learning_stage,evidence_count,support_count,contradict_count,application_count,representative_support_count,auto_apply,representative_locked,approved_at,last_evidence_at,last_applied_at,updated_at")
    .eq("user_id", userId)
    .in("status", ["DRAFT", "LEARNING", "ACTIVE"])
    .order("updated_at", { ascending: true })
    .limit(150);

  if (error) {
    console.warn("Policy Registry unavailable; continuing with static COMPANY_POLICY", error.message);
    return {
      available: false,
      registry_version: "0.2",
      mode: "ADAPTIVE",
      as_of: new Date().toISOString(),
      workflow,
      policies: [],
      warning: error.message,
    };
  }

  const relevant = (data || []).filter((p: any) => {
    const scope = String(p.scope || "GLOBAL").toUpperCase();
    const policyWorkflow = String(p.workflow || "").toUpperCase();
    const governanceMode = String(p.governance_mode || "ADAPTIVE").toUpperCase();
    const status = String(p.status || "").toUpperCase();
    const confidence = clamp01(p.confidence, 0.5);
    const scopeMatches = scope === "GLOBAL" || policyWorkflow === String(workflow || "").toUpperCase();
    if (!scopeMatches) return false;
    if (governanceMode === "MANUAL") return status === "ACTIVE";
    return p.auto_apply !== false && ["LEARNING", "ACTIVE"].includes(status) && confidence >= 0.35;
  }).map((p: any) => ({
    ...p,
    confidence: clamp01(p.confidence, 0.5),
    learning_stage: p.learning_stage || policyLearningStage(p.confidence),
    influence_weight: policyInfluenceWeight(p.confidence),
    policy_behavior: String(p.governance_mode || "ADAPTIVE").toUpperCase() === "MANUAL" ? "GOVERNING" : "ADVISORY_WEIGHTED",
  }));

  return {
    available: true,
    registry_version: "0.2",
    mode: "ADAPTIVE",
    as_of: new Date().toISOString(),
    workflow,
    policies: relevant,
  };
}

async function recordPolicyEvidence(
  admin: any,
  userId: string,
  existingCase: any,
  policyId: string,
  effectValue: unknown,
  strengthValue: unknown,
  rationaleValue: unknown,
  sourceType = "CASE_SYNTHESIS",
) {
  const effect = cleanText(effectValue, 24).toUpperCase();
  if (!policyId || !["SUPPORT", "CONTRADICT", "NEUTRAL"].includes(effect)) return { ok: false, skipped: true };
  const strength = clamp01(strengthValue, 0.5);
  const rationale = cleanText(rationaleValue, 1600);

  const { data: policy, error: readError } = await admin
    .from("hani_agent_policies")
    .select("id,status,governance_mode,enforcement_level,confidence,learning_stage,evidence_count,support_count,contradict_count,application_count,representative_support_count,representative_locked")
    .eq("id", policyId)
    .eq("user_id", userId)
    .single();
  if (readError || !policy) return { ok: false, skipped: true, warning: readError?.message || "POLICY_NOT_FOUND" };

  const governanceMode = String(policy.governance_mode || "ADAPTIVE").toUpperCase();
  if (governanceMode !== "ADAPTIVE" && sourceType !== "MANUAL") {
    return { ok: true, skipped: true, reason: "MANUAL_POLICY_NOT_AUTO_LEARNED" };
  }

  const baseDelta = effect === "SUPPORT" ? 0.060 : effect === "CONTRADICT" ? -0.100 : 0;
  const delta = Number((baseDelta * strength).toFixed(5));
  const evidenceRow = {
    user_id: userId,
    policy_id: policy.id,
    case_id: existingCase?.id || null,
    case_code: existingCase?.case_code || null,
    source_type: sourceType,
    effect,
    strength,
    confidence_delta: delta,
    rationale: rationale || null,
  };

  const { error: evidenceError } = await admin.from("hani_agent_policy_evidence").insert(evidenceRow);
  if (evidenceError) {
    if (evidenceError.code === "23505") return { ok: true, skipped: true, reason: "EVIDENCE_ALREADY_RECORDED" };
    console.warn("Policy evidence insert failed", evidenceError.message);
    return { ok: false, skipped: true, warning: evidenceError.message };
  }

  const confidence = Math.max(0.10, Math.min(0.95, Number(policy.confidence || 0.5) + delta));
  const evidenceCount = Number(policy.evidence_count || 0) + 1;
  const supportCount = Number(policy.support_count || 0) + (effect === "SUPPORT" ? 1 : 0);
  const contradictCount = Number(policy.contradict_count || 0) + (effect === "CONTRADICT" ? 1 : 0);
  const stage = policyLearningStage(confidence);
  const locked = policy.representative_locked === true;
  let status = String(policy.status || "LEARNING").toUpperCase();
  if (!locked) {
    if (confidence >= 0.80 && evidenceCount >= 5 && contradictCount / Math.max(1, evidenceCount) <= 0.20) status = "ACTIVE";
    else if (["ACTIVE", "LEARNING", "DRAFT"].includes(status)) status = "LEARNING";
  }
  const enforcement = locked ? String(policy.enforcement_level || "STRONG") : (confidence >= 0.80 ? "STRONG" : "ADVISORY");
  const { error: updateError } = await admin.from("hani_agent_policies").update({
    confidence,
    learning_stage: stage,
    evidence_count: evidenceCount,
    support_count: supportCount,
    contradict_count: contradictCount,
    status,
    enforcement_level: enforcement,
    last_evidence_at: new Date().toISOString(),
  }).eq("id", policy.id).eq("user_id", userId);
  if (updateError) return { ok: false, warning: updateError.message };
  return { ok: true, policy_id: policy.id, effect, strength, confidence, stage, status, delta };
}

async function applyPolicyEvidence(admin: any, userId: string, existingCase: any, evidenceValue: unknown) {
  const items = Array.isArray(evidenceValue) ? evidenceValue.slice(0, 8) : [];
  const results: any[] = [];
  for (const raw of items) {
    const item = asObject(raw);
    const policyId = cleanText((item as any).policy_id, 64);
    if (!policyId) continue;
    results.push(await recordPolicyEvidence(admin, userId, existingCase, policyId, (item as any).effect, (item as any).strength, (item as any).rationale, "CASE_SYNTHESIS"));
  }
  return { attempted: items.length, updated: results.filter((x) => x?.ok && !x?.skipped).length, results };
}

async function recordPolicyApplications(admin: any, userId: string, existingCase: any) {
  const snapshot = asObject(asObject(existingCase?.context).active_policy_registry);
  const policies = Array.isArray((snapshot as any).policies) ? (snapshot as any).policies : [];
  const now = new Date().toISOString();
  for (const raw of policies.slice(0, 100)) {
    const p = asObject(raw);
    const policyId = cleanText((p as any).id, 64);
    if (!policyId) continue;
    const nextCount = Math.max(0, Number((p as any).application_count || 0)) + 1;
    await admin.from("hani_agent_policies").update({ application_count: nextCount, last_applied_at: now }).eq("id", policyId).eq("user_id", userId);
  }
}

async function reinforcePoliciesFromRepresentativeDecision(admin: any, userId: string, existingCase: any, haniFinal: any, isOverride: boolean, expected: string, representativeDecision: string) {
  if (isOverride || !expected || expected !== representativeDecision) return { updated: 0 };
  const evidence = Array.isArray(haniFinal?.policy_evidence) ? haniFinal.policy_evidence : [];
  let updated = 0;
  for (const raw of evidence.slice(0, 8)) {
    const item = asObject(raw);
    if (String((item as any).effect || "").toUpperCase() !== "SUPPORT") continue;
    const policyId = cleanText((item as any).policy_id, 64);
    if (!policyId) continue;
    const result = await recordPolicyEvidence(admin, userId, existingCase, policyId, "SUPPORT", 0.35, "대표 결정이 해당 Case의 하니 권고와 일치함. 약한 보강 근거로만 반영.", "REPRESENTATIVE_ALIGNMENT");
    if (result?.ok && !result?.skipped) {
      updated += 1;
      const { data: row } = await admin.from("hani_agent_policies").select("representative_support_count").eq("id", policyId).eq("user_id", userId).single();
      if (row) await admin.from("hani_agent_policies").update({ representative_support_count: Number(row.representative_support_count || 0) + 1 }).eq("id", policyId).eq("user_id", userId);
    }
  }
  return { updated };
}

function attachPolicySnapshot(existingCase: any, snapshot: any) {
  const context = asObject(existingCase?.context);
  existingCase.context = {
    ...context,
    active_policy_registry: snapshot,
  };
  return existingCase;
}

async function syncPolicyLearningCandidates(
  admin: any,
  userId: string,
  existingCase: any,
  candidatesValue: unknown,
) {
  const candidates = Array.isArray(candidatesValue)
    ? candidatesValue.map((x) => cleanText(x, 1200)).filter(Boolean).slice(0, 3)
    : [];
  if (!candidates.length) return { available: true, created: 0, existing: 0, reinforced: 0, ids: [] as string[] };

  let created = 0;
  let existing = 0;
  let reinforced = 0;
  const ids: string[] = [];
  for (let i = 0; i < candidates.length; i++) {
    const rule = candidates[i];
    const dedupeKey = await sha256Hex(`${String(existingCase.workflow || "GENERAL_REVIEW").toUpperCase()}|${rule.toLowerCase().replace(/\s+/g, " ").trim()}`);
    const row = {
      user_id: userId,
      policy_type: "WORKFLOW_PLAYBOOK",
      scope: "WORKFLOW",
      workflow: String(existingCase.workflow || "GENERAL_REVIEW").toUpperCase(),
      title: `${String(existingCase.case_code || "CASE")} 학습 규정 ${i + 1}`,
      rule_text: rule,
      status: "LEARNING",
      governance_mode: "ADAPTIVE",
      enforcement_level: "ADVISORY",
      confidence: 0.5000,
      learning_stage: "OBSERVED",
      evidence_count: 1,
      support_count: 1,
      contradict_count: 0,
      auto_apply: true,
      representative_locked: false,
      last_evidence_at: new Date().toISOString(),
      dedupe_key: dedupeKey,
      source_case_id: existingCase.id,
      source_case_code: existingCase.case_code,
      source_candidate_index: i + 1,
      proposed_by: "HANI",
      rationale: "Adaptive Policy Engine v0.2: HANI Executive Synthesis에서 발견된 재사용 가능 원칙. 낮은 가중치로 자동 학습 시작.",
    };

    const { data: inserted, error: insertError } = await admin
      .from("hani_agent_policies")
      .insert(row)
      .select("id")
      .single();

    if (!insertError && inserted?.id) {
      created += 1;
      ids.push(String(inserted.id));
      await admin.from("hani_agent_policy_evidence").insert({
        user_id: userId,
        policy_id: inserted.id,
        case_id: existingCase.id,
        case_code: existingCase.case_code,
        source_type: "CASE_SYNTHESIS",
        effect: "SUPPORT",
        strength: 0.50,
        confidence_delta: 0,
        rationale: "신규 학습 원칙의 최초 관찰 근거. 초기 confidence 0.50에서 시작.",
      });
      continue;
    }

    if (insertError?.code === "23505") {
      existing += 1;
      const { data: existingPolicy } = await admin.from("hani_agent_policies").select("id").eq("user_id", userId).eq("dedupe_key", dedupeKey).single();
      if (existingPolicy?.id) {
        const result = await recordPolicyEvidence(admin, userId, existingCase, String(existingPolicy.id), "SUPPORT", 0.65, "동일한 학습 원칙이 다른 Case에서 다시 독립적으로 발견됨.", "CANDIDATE_RECURRENCE");
        if (result?.ok && !result?.skipped) reinforced += 1;
      }
      continue;
    }

    console.warn("Policy candidate sync skipped", insertError?.message || insertError);
    return { available: false, created, existing, reinforced, ids, warning: insertError?.message || "POLICY_REGISTRY_WRITE_FAILED" };
  }
  return { available: true, created, existing, reinforced, ids };
}

const REPRESENTATIVE_DECISIONS = new Set([
  "APPROVE",
  "HOLD",
  "REJECT",
  "REVISION_REQUESTED",
]);

function expectedRepresentativeDecision(aiRecommendation: string): string {
  switch (String(aiRecommendation || "").toUpperCase()) {
    case "PROCEED":
    case "CONDITIONAL":
      return "APPROVE";
    case "REJECT":
      return "REJECT";
    case "DELAY":
    case "NEEDS_DATA":
      return "HOLD";
    default:
      return "";
  }
}

function representativeCaseStatus(decision: string): string {
  return {
    APPROVE: "APPROVED",
    HOLD: "HELD",
    REJECT: "REJECTED",
    REVISION_REQUESTED: "ANALYZING",
  }[decision] || "AWAITING_APPROVAL";
}
const SOURCE_TYPES = new Set([
  "USER_TEXT",
  "HANI_OS_DATA",
  "IMAGE",
  "SCREENSHOT",
  "EMAIL",
  "PDF",
  "EXCEL",
  "WEB",
  "DOCUMENT",
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function getDefaultKey(envName: string, legacyName: string): string {
  const raw = Deno.env.get(envName);
  if (raw) {
    try {
      const keys = JSON.parse(raw);
      if (keys?.default) return String(keys.default);
    } catch (_) {}
  }
  return Deno.env.get(legacyName) ?? "";
}

function workflowPrefix(workflow: string): string {
  return {
    PURCHASE_REVIEW: "PUR",
    INVESTMENT_REVIEW: "INV",
    DESIGN_REVIEW: "DSN",
    HEALTH_REVIEW: "HLT",
    STUDY_REVIEW: "STD",
    TRAVEL_REVIEW: "TRV",
    CONTENT_RECOMMENDATION: "CNT",
    TECH_REVIEW: "TEC",
    FINANCE_REVIEW: "FIN",
    KNOWLEDGE_REVIEW: "KNW",
    GENERAL_REVIEW: "GEN",
  }[workflow] ?? "GEN";
}

function makeCaseCode(workflow: string): string {
  const d = new Date();
  const y = String(d.getUTCFullYear());
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const random = crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
  return `${workflowPrefix(workflow)}-${y}${m}${day}-${random}`;
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function cleanText(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

async function getAuthenticatedUser(req: Request, supabaseUrl: string, publishableKey: string) {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return { user: null, error: "HANI OS 로그인 세션이 필요합니다." };
  }

  const authClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authHeader } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    return { user: null, error: "HANI OS 로그인 세션을 확인하지 못했습니다." };
  }

  return { user, error: null };
}

type RouteMember = {
  agent_key: string;
  display_name: string;
  rank: string;
  role: string;
  reason: string;
  required: boolean;
};

function addAgent(
  list: RouteMember[],
  agent_key: string,
  display_name: string,
  rank: string,
  role: string,
  reason: string,
  required = false,
) {
  if (list.some((x) => x.agent_key === agent_key)) return;
  list.push({ agent_key, display_name, rank, role, reason, required });
}

function buildRouting(input: {
  workflow: string;
  risk_level: string;
  title: string;
  source_text: string | null;
  context: Record<string, unknown>;
}) {
  const selected: RouteMember[] = [];
  const text = `${input.title}\n${input.source_text ?? ""}\n${JSON.stringify(input.context)}`.toLowerCase();

  let verification_required = false;
  let verification_reason = "";
  let chair = {
    agent_key: "HANI",
    display_name: "하니",
    rank: "부장",
    role: "CHIEF_OF_STAFF",
    reason: "전문 Agent 의견을 종합해 대표 결재안을 작성",
  };

  switch (input.workflow) {
    case "PURCHASE_REVIEW": {
      const purchaseRouter = asObject((input.context as any).router_v2);
      const purchaseMode = String((purchaseRouter as any).purchase_decision_mode || "BUY_OR_NOT").toUpperCase();
      const purchaseDomains = new Set(
        Array.isArray((purchaseRouter as any).context_domains)
          ? (purchaseRouter as any).context_domains.map((x: unknown) => String(x || "").toUpperCase())
          : [],
      );
      const productSelectionMode = ["SELECT_PRODUCT", "CONDITION_SEARCH"].includes(purchaseMode);
      const upgradeMode = purchaseMode === "UPGRADE_REPLACE";

      if (productSelectionMode) {
        addAgent(selected, "HARU", "하루", "대리", "USER_REVIEW_EXPERIENCE", "실사용 후기·착용/사용감·생활 적합성 검토", true);
        addAgent(selected, "SUYEON", "수연", "대리", "QUALITY_PERFORMANCE", "제품군에 맞는 품질·성능·내구성 검토", true);
        addAgent(selected, "JIEUN", "지은", "대리", "VALUE_PRICE", "가격 차이가 실제 효용 차이로 정당화되는지 검토", true);
        addAgent(selected, "MINJI", "민지", "대리", "DESIGN_PREFERENCE", "디자인·형태·재질·선호 적합성과 감성 만족 검토", true);
      } else if (upgradeMode) {
        addAgent(selected, "HARU", "하루", "대리", "USER_REVIEW_EXPERIENCE", "기존 제품 대비 체감 개선과 실사용 가치 검토", true);
        addAgent(selected, "SUYEON", "수연", "대리", "QUALITY_PERFORMANCE", "기존 대비 성능·품질 개선폭 검토", true);
        addAgent(selected, "JIEUN", "지은", "대리", "VALUE_PRICE", "교체 비용 대비 개선 효용 검토", true);
        addAgent(selected, "MINJI", "민지", "대리", "PREFERENCE_MEMORY", "기존 사용·선호 기록과 교체 이유 비교", true);
      } else {
        addAgent(selected, "HARU", "하루", "대리", "UX_EXPERIENCE", "구매 필요성·실제 사용가치·경험효용 검토", true);
        const financeRelevant = purchaseDomains.has("FINANCE") || purchaseDomains.has("CASHFLOW") || /(예산|현금흐름|부채|카드값|할부|대출|저축|재무)/i.test(text);
        addAgent(selected, "JIEUN", "지은", "대리", financeRelevant ? "FINANCE_RISK" : "VALUE_PRICE", financeRelevant ? "구매여력·현금흐름·기회비용 검토" : "가격 대비 효용과 과투자 여부 검토", true);
        if (/(tv|티비|텔레비전|oled|qled|mini[\s-]?led|노트북|태블릿|폰|휴대폰|모니터|전자기기|가전|gpu|cpu|이어폰|헤드폰|스피커|자전거|자동차|가구)/i.test(text)) {
          addAgent(selected, "SUYEON", "수연", "대리", "QUALITY_PERFORMANCE", "품질·성능·구조와 상위모델 필요성 검토");
        }
      }
      if (/(건강|운동|수면|식단|안마|의료|헬스)/i.test(text) && selected.length < 5) {
        addAgent(selected, "NAEUN", "나은", "대리", "SUSTAINABILITY_BEHAVIOR", "건강·지속가능성 영향 검토");
      }
      verification_required = productSelectionMode || upgradeMode || input.risk_level !== "LOW" || selected.some((x) => x.agent_key === "SUYEON");
      verification_reason = verification_required
        ? `Purchase Review v2 ${purchaseMode}: 후보·품질·가격·목적 적합성 검증 필요`
        : "LOW 위험도의 구매 여부 심의";
      break;
    }

    case "INVESTMENT_REVIEW":
      addAgent(selected, "HANI", "하니", "부장", "INVESTMENT_PM", "투자 Thesis·포지션·전략 검토", true);
      addAgent(selected, "JIEUN", "지은", "대리", "FINANCE_RISK", "현금흐름·집중도·손실감내 검토", true);
      addAgent(selected, "MINJI", "민지", "대리", "DECISION_MEMORY", "과거 투자판단·Thesis Drift 검토");
      if (/(ai|반도체|클라우드|소프트웨어|로봇|기술|테크)/i.test(text)) {
        addAgent(selected, "SUYEON", "수연", "대리", "TECH_INDUSTRY", "기술·산업 경쟁력 검토");
      }
      verification_required = true;
      verification_reason = "투자안건은 최신 가격·공시·뉴스·기초데이터 검증 필수";
      chair = {
        agent_key: "HANI",
        display_name: "하니",
        rank: "부장",
        role: "INVESTMENT_PM_FINAL",
        reason: "투자위원회 의견을 종합해 대표 결재안 작성",
      };
      break;

    case "DESIGN_REVIEW":
      addAgent(selected, "HARU", "하루", "대리", "UX_UI_LEAD", "UX·UI·정보위계·사용성 검토", true);
      addAgent(selected, "SUYEON", "수연", "대리", "TECH_REVIEW", "구현성·반응형·유지보수 검토", true);
      addAgent(selected, "HINA", "히나", "대리", "QA_PROCESS", "PC·모바일·일관성·회귀 QA", true);
      if (/(기존|과거|예전|이력|다시|재검토)/i.test(text)) {
        addAgent(selected, "MINJI", "민지", "대리", "DESIGN_MEMORY", "기존 디자인 이력·대표 피드백 비교");
      }
      verification_required = true;
      verification_reason = "디자인 변경은 구현·QA 검증 필요";
      break;

    case "HEALTH_REVIEW":
      addAgent(selected, "NAEUN", "나은", "대리", "SUSTAINABILITY_BEHAVIOR", "건강·습관·지속가능성 검토", true);
      verification_required = input.risk_level === "HIGH" || input.risk_level === "CRITICAL";
      verification_reason = verification_required ? "고위험 건강안건 검증 필요" : "일반 건강계획";
      break;

    case "STUDY_REVIEW":
      addAgent(selected, "HINA", "히나", "대리", "QA_PROCESS", "일정·과정·누락·학습계획 검토", true);
      if (/(비용|등록금|결제|예산)/i.test(text)) {
        addAgent(selected, "JIEUN", "지은", "대리", "FINANCE_RISK", "교육비·예산 영향 검토");
      }
      verification_required = /(시험|마감|신청|기한|일정)/i.test(text);
      verification_reason = verification_required ? "일정·기한 정확성 검증 필요" : "일반 학습안건";
      break;

    case "TRAVEL_REVIEW":
      addAgent(selected, "SUYEON", "수연", "대리", "TRAVEL_ARCHITECTURE", "동선·교통·일정 구조 검토", true);
      addAgent(selected, "HARU", "하루", "대리", "EXPERIENCE", "숙소·식당·여행경험 검토", true);
      addAgent(selected, "JIEUN", "지은", "대리", "FINANCE_RISK", "예산·비용 검토", true);
      if (/(걷|체력|피로|운동|휴식)/i.test(text)) {
        addAgent(selected, "NAEUN", "나은", "대리", "SUSTAINABILITY_BEHAVIOR", "체력·일정 지속가능성 검토");
      }
      addAgent(selected, "MINJI", "민지", "대리", "PREFERENCE_MEMORY", "과거 여행취향·기록 비교");
      verification_required = true;
      verification_reason = "여행은 가격·운영시간·교통 등 최신정보 검증 필요";
      break;

    case "CONTENT_RECOMMENDATION":
      addAgent(selected, "MINJI", "민지", "대리", "KNOWLEDGE_CULTURE", "콘텐츠 취향·기록 기반 추천", true);
      verification_required = false;
      verification_reason = "일반 콘텐츠 추천";
      break;

    case "TECH_REVIEW":
      addAgent(selected, "SUYEON", "수연", "대리", "TECH_ARCHITECTURE", "기술·구현성·안정성 검토", true);
      addAgent(selected, "HINA", "히나", "대리", "QA_PROCESS", "QA·누락·회귀 검증", true);
      verification_required = true;
      verification_reason = "기술변경안 검증 필수";
      break;

    case "FINANCE_REVIEW":
      addAgent(selected, "JIEUN", "지은", "대리", "FINANCE_RISK", "재무·현금흐름·리스크 검토", true);
      verification_required = input.risk_level !== "LOW";
      verification_reason = verification_required ? "재무 수치 검증 필요" : "LOW 위험도 재무검토";
      break;

    case "KNOWLEDGE_REVIEW":
      addAgent(selected, "MINJI", "민지", "대리", "KNOWLEDGE_MEMORY", "기록·맥락·과거결정 검토", true);
      verification_required = false;
      verification_reason = "기록 중심 안건";
      break;

    default:
      addAgent(selected, "HANI", "하니", "부장", "GENERAL_TRIAGE", "일반 안건 1차 판단", true);
      verification_required = input.risk_level === "HIGH" || input.risk_level === "CRITICAL";
      verification_reason = verification_required ? "고위험 일반 안건" : "일반 안건";
  }

  // Router v2 context domains can add cross-domain specialists without changing the primary workflow.
  const routerV2 = asObject((input.context as any).router_v2);
  const contextDomains = new Set(
    Array.isArray((routerV2 as any).context_domains)
      ? (routerV2 as any).context_domains.map((x: unknown) => String(x || "").toUpperCase())
      : [],
  );

  if (contextDomains.has("HEALTH") || contextDomains.has("EXERCISE")) {
    addAgent(selected, "NAEUN", "나은", "대리", "SUSTAINABILITY_BEHAVIOR", "HANI OS 건강·운동 맥락과 지속가능성 검토");
  }
  if (contextDomains.has("FINANCE") || contextDomains.has("CASHFLOW")) {
    addAgent(selected, "JIEUN", "지은", "대리", "FINANCE_RISK", "재무·현금흐름 맥락 검토");
  }
  if (contextDomains.has("UX") || contextDomains.has("EXPERIENCE")) {
    addAgent(selected, "HARU", "하루", "대리", "UX_EXPERIENCE", "실제 사용성·경험가치 맥락 검토");
  }
  if (contextDomains.has("TECH") || contextDomains.has("PRODUCT_TECH")) {
    addAgent(selected, "SUYEON", "수연", "대리", "TECH_ARCHITECTURE", "기술·제품 적합성 맥락 검토");
  }
  if (contextDomains.has("MEMORY") || contextDomains.has("PREFERENCE")) {
    addAgent(selected, "MINJI", "민지", "대리", "DECISION_MEMORY", "과거 기록·행동·선호 맥락 비교");
  }

  if (input.risk_level === "CRITICAL") {
    addAgent(selected, "SUYEON", "수연", "대리", "TECH_ARCHITECTURE", "CRITICAL 위험도 기술 검토", true);
    addAgent(selected, "HINA", "히나", "대리", "QA_PROCESS", "CRITICAL 위험도 QA 검토", true);
    verification_required = true;
    verification_reason = "CRITICAL 위험도: Verification 강제";
  }

  // Pilot concurrency cap: keep required specialists first, then optional specialists.
  if (selected.length > 5) {
    const requiredAgents = selected.filter((x) => x.required);
    const optionalAgents = selected.filter((x) => !x.required);
    selected.splice(0, selected.length, ...[...requiredAgents, ...optionalAgents].slice(0, 5));
  }

  return {
    engine_version: "1.7.0",
    strategy: "MINIMUM_RELEVANT_AGENTS",
    selected_agents: selected,
    chair,
    verification: {
      required: verification_required,
      reason: verification_reason,
      status: "PENDING",
    },
    escalation: {
      enabled: true,
      max_depth: 2,
    },
    representative_can_force_agent: true,
    router_v2: {
      primary_intent: String((routerV2 as any).primary_intent || input.workflow),
      purchase_decision_mode: String((routerV2 as any).purchase_decision_mode || (input.workflow === "PURCHASE_REVIEW" ? "BUY_OR_NOT" : "NOT_APPLICABLE")),
      context_domains: Array.from(contextDomains),
      internal_data_requests: Array.isArray((routerV2 as any).internal_data_requests)
        ? (routerV2 as any).internal_data_requests
        : [],
      external_research: String((routerV2 as any).external_research || "NONE"),
      entity_resolution: asObject((routerV2 as any).entity_resolution),
    },
    generated_at: new Date().toISOString(),
  };
}

function extractOpenAIOutputText(payload: any): string {
  // Some SDKs expose response.output_text as a convenience property,
  // while raw REST responses reliably expose generated text inside
  // output[].content[].text.
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const parts: string[] = [];
  const output = Array.isArray(payload?.output) ? payload.output : [];

  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (part?.type === "output_text" && typeof part?.text === "string") {
        parts.push(part.text);
      }
    }
  }

  return parts.join("").trim();
}

type AgentReviewOutput = {
  verdict: "PROCEED" | "CONDITIONAL" | "DELAY" | "REJECT" | "NEEDS_DATA";
  confidence: number;
  summary: string;
  reasons: string[];
  risks: string[];
  conditions: string[];
  missing_data: string[];
  evidence: string[];
  candidate_scores: Array<{
    candidate_name: string;
    overall_score: number;
    score_reason: string;
    axis_scores: Array<{ axis_key: string; score: number; note: string }>;
  }>;
  escalation: {
    requested: boolean;
    requested_agent: string;
    reason: string;
  };
  hard_stop: boolean;
  notes: string;
};

const AGENT_BEHAVIOR: Record<string, {
  name: string;
  rank: string;
  principle: string;
  style: string;
  bias: string;
  hardStop: string;
  blindSpot: string;
}> = {
  HARU: {
    name: "하루",
    rank: "대리",
    principle: "결국 사람이 실제로 잘 쓰고 좋아해야 가치가 있다.",
    style: "스펙 자체보다 실제 사용빈도, 편리성, 만족도, 기존 대비 체감 개선폭과 장기 경험가치를 본다.",
    bias: "반복 사용 가치가 높으면 긍정적이지만, 사용 시나리오가 불분명하면 보류한다.",
    hardStop: "기능보다 디자인만 남거나 기존 제품과 실질 차이가 거의 없고 사용 시나리오가 없을 때.",
    blindSpot: "좋은 경험이 곧 재무적으로 좋은 결정이라는 보장은 없다.",
  },
  JIEUN: {
    name: "지은",
    rank: "대리",
    principle: "살 수 있다는 것과 사도 된다는 것은 다르다.",
    style: "숫자, 현금흐름, 기회비용, 계획 영향, 손실 가능성을 우선한다.",
    bias: "정보가 부족하면 승인보다 DELAY 또는 NEEDS_DATA를 선호한다.",
    hardStop: "필수생활비·비상자금 훼손, 부채 위험 증가, 근거 없는 레버리지, 생활자금과 투자자금 혼용.",
    blindSpot: "절약 자체가 항상 삶의 효용을 높이는 것은 아니다.",
  },
  SUYEON: {
    name: "수연",
    rank: "대리",
    principle: "멋진 설계보다 실제로 잘 돌아가고 필요한 구조가 먼저다.",
    style: "기술적 적합성, 실제 체감 차이, 구현·유지비용, 상위 사양의 필요성을 구조적으로 본다.",
    bias: "비슷한 선택지라면 더 단순하고 필요한 수준의 제품·구조를 선호한다.",
    hardStop: "검증되지 않은 기술을 핵심에 바로 적용하거나, 보안·데이터 손실 가능성이 있는 변경.",
    blindSpot: "기술적으로 깔끔한 선택이 사용자 경험상 최선이라는 보장은 없다.",
  },
  NAEUN: {
    name: "나은",
    rank: "대리",
    principle: "최고의 계획은 가장 강한 계획이 아니라 계속할 수 있는 계획이다.",
    style: "건강, 습관, 피로, 반복 가능성, 회복과 지속가능성을 본다.",
    bias: "극단적 선택보다 강도를 낮춰 지속하는 방향을 선호한다.",
    hardStop: "명백히 위험한 건강행동, 극단적 식사·운동, 수면 희생, 회복 무시.",
    blindSpot: "지속가능성을 중시하다 도전적 목표를 지나치게 완화할 수 있다.",
  },
  HINA: {
    name: "히나",
    rank: "대리",
    principle: "확인하지 않은 것을 PASS라고 부르지 않는다.",
    style: "누락, 규칙, 일정, 조건, 일관성, 테스트, 데이터 정합성을 엄격하게 본다.",
    bias: "애매하면 PASS 대신 NEEDS_DATA 또는 검증 필요를 선택한다.",
    hardStop: "데이터 손상 가능성, 테스트 실패, 필수 조건 누락, 복원 검증 실패, 보안 규칙 위반.",
    blindSpot: "완벽주의 때문에 사소한 문제까지 진행을 늦출 수 있다.",
  },
  MINJI: {
    name: "민지",
    rank: "대리",
    principle: "결과뿐 아니라 그때 왜 그렇게 판단했는지가 남아야 한다.",
    style: "과거 결정, 실제 행동, 취향 변화, 반복 패턴과 현재 판단의 맥락을 연결한다.",
    bias: "과거와 다르면 틀렸다고 단정하지 않고 변화 이유를 확인한다.",
    hardStop: "과거 기록 무단 삭제, 출처 없는 기억 생성, 추정을 사실로 확정.",
    blindSpot: "과거 기록에 너무 의존하면 사람의 변화 가능성을 과소평가할 수 있다.",
  },
  HANI: {
    name: "하니",
    rank: "부장",
    principle: "전체 최적화가 개별 영역의 최적화보다 중요하다.",
    style: "전문가 의견을 통합하지만 전문영역을 대신하지 않고 팩트·가설·선호를 구분한다.",
    bias: "애매하면 추가 검토나 작은 Pilot을 선호한다.",
    hardStop: "중요 데이터 손실, 보안 노출, 돌이킬 수 없는 행동의 근거 부족, 대표 승인 없는 중요 Commit.",
    blindSpot: "모든 영역에 개입하면 다른 Agent의 독립성이 사라질 수 있다.",
  },
};

const AGENT_REVIEW_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    verdict: {
      type: "string",
      enum: ["PROCEED", "CONDITIONAL", "DELAY", "REJECT", "NEEDS_DATA"],
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    summary: { type: "string" },
    reasons: { type: "array", minItems: 1, maxItems: 4, items: { type: "string" } },
    risks: { type: "array", maxItems: 4, items: { type: "string" } },
    conditions: { type: "array", maxItems: 4, items: { type: "string" } },
    missing_data: { type: "array", maxItems: 5, items: { type: "string" } },
    evidence: { type: "array", maxItems: 5, items: { type: "string" } },
    candidate_scores: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object", additionalProperties: false,
        properties: {
          candidate_name: { type: "string" },
          overall_score: { type: "number", minimum: 0, maximum: 5 },
          score_reason: { type: "string" },
          axis_scores: {
            type: "array", maxItems: 6,
            items: {
              type: "object", additionalProperties: false,
              properties: {
                axis_key: { type: "string" },
                score: { type: "number", minimum: 0, maximum: 5 },
                note: { type: "string" },
              },
              required: ["axis_key", "score", "note"],
            },
          },
        },
        required: ["candidate_name", "overall_score", "score_reason", "axis_scores"],
      },
    },
    escalation: {
      type: "object",
      additionalProperties: false,
      properties: {
        requested: { type: "boolean" },
        requested_agent: { type: "string" },
        reason: { type: "string" },
      },
      required: ["requested", "requested_agent", "reason"],
    },
    hard_stop: { type: "boolean" },
    notes: { type: "string" },
  },
  required: [
    "verdict",
    "confidence",
    "summary",
    "reasons",
    "risks",
    "conditions",
    "missing_data",
    "evidence",
    "candidate_scores",
    "escalation",
    "hard_stop",
    "notes",
  ],
};

function purchaseRoleGuidance(roleValue: unknown): string {
  const role = String(roleValue || "").toUpperCase();
  const map: Record<string, string> = {
    USER_REVIEW_EXPERIENCE: "실사용·리뷰 렌즈: 장시간 사용성, 착용/조작감, 반복 불편, 실제 사용자 후기의 일관성, 사용환경 적합성을 우선한다.",
    QUALITY_PERFORMANCE: "품질·성능 렌즈: 제품군에 맞는 핵심 성능, 마감/내구성, 안정성, 호환성, 사양 차이가 실제 체감으로 이어지는지를 우선한다.",
    VALUE_PRICE: "가격·가치 렌즈: 가장 싼 제품을 고르는 역할이 아니다. 가격 차이만큼 성능·품질·경험 효용이 늘어나는지 평가하며, SELECT_PRODUCT에서는 구매 자체를 다시 반대하지 않는다.",
    DESIGN_PREFERENCE: "디자인·선호 렌즈: 외형, 형태, 재질, 마감, 크기, 휴대/공간 조화, 사용자가 보거나 만질 때의 만족도를 정식 구매 기준으로 평가한다. 디자인이 목적상 중요하지 않으면 그 비중이 낮다고 명시한다.",
    PREFERENCE_MEMORY: "선호·교체 렌즈: 기존 사용 기록과 선호 변화, 교체 이유가 실제 후보의 장점과 맞물리는지 본다.",
    FINANCE_RISK: "재무 렌즈: 실제 재무 Context가 있는 BUY_OR_NOT에서만 현금흐름·부채·저축목표 충돌을 강하게 본다.",
  };
  return map[role] || "";
}

function agentSystemPrompt(agent: any): string {
  const behavior = AGENT_BEHAVIOR[String(agent?.agent_key || "")] ?? {
    name: String(agent?.display_name || agent?.agent_key || "Agent"),
    rank: String(agent?.rank || ""),
    principle: "주어진 전문역할에 따라 독립적으로 판단한다.",
    style: "현재 제공된 근거만 사용한다.",
    bias: "정보가 부족하면 부족하다고 명시한다.",
    hardStop: "중대한 안전·데이터·보안 위험.",
    blindSpot: "전문영역 밖의 판단.",
  };

  return [
    `당신은 PROJECT HANI의 ${behavior.name} ${behavior.rank}입니다.`,
    `이번 역할: ${String(agent?.role || "")}.`,
    `핵심 원칙: ${behavior.principle}`,
    `업무 스타일: ${behavior.style}`,
    `기본 성향: ${behavior.bias}`,
    `Hard Stop: ${behavior.hardStop}`,
    `Blind Spot: ${behavior.blindSpot}`,
    purchaseRoleGuidance(agent?.role) ? `이번 구매심의 렌즈: ${purchaseRoleGuidance(agent?.role)}` : "",
    "",
    "중요 운영규칙:",
    "- 직급이나 하니 부장의 의견은 근거가 아니다. 독립적으로 판단한다.",
    "- 제공된 Source/Context에 없는 현재 가격, 최신 제품정보, 행사, 재무수치, 사용자 취향을 만들어내지 않는다.",
    "- 최신 외부정보가 필요하지만 제공되지 않았다면 missing_data에 명확히 적되, 모델명·상품링크·현재 가격처럼 AI가 조사할 수 있는 정보는 대표가 직접 찾아오라고 요구하지 않는다.",
    "- PURCHASE_REVIEW에서는 context.router_v2.purchase_decision_mode를 먼저 따른다. BUY_OR_NOT이면 구매 필요성까지 심의하고, SELECT_PRODUCT/CONDITION_SEARCH이면 구매 필요는 이미 확정된 전제로 후보 선택에 집중한다. UPGRADE_REPLACE이면 기존 제품 대비 교체 가치를 먼저 본다.",
    "- JIEUN/FINANCE_RISK 역할은 '살 수 있음'과 '지금 사도 됨'을 분리한다. 실제 재무 데이터에 부채상환·비상금·저축목표 충돌 근거가 있으면 구체 조건/시점까지 DELAY를 제안할 수 있다.",
    "- JIEUN/VALUE_PRICE 역할은 가성비를 '최저가'로 정의하지 않는다. 추가 비용으로 얻는 성능·품질·디자인·사용경험의 가치가 충분한지 평가한다.",
    "- 구매 후보가 context.external_research.candidate_options에 있으면 본인 관점에서 모든 후보를 독립 비교한다. 후보 탐색 자체는 PROCUREMENT의 책임이다.",
    "- 후보가 있으면 candidate_scores에 후보별 overall_score(0~5)를 모두 제출한다. context.external_research.procurement.evaluation_axes가 있으면 본인 역할과 근거가 있는 축만 axis_scores로 채우고 axis_key는 제공된 key를 그대로 사용한다. 근거가 부족한 축은 억지 점수를 만들지 않는다.",
    "- 후보가 아직 없는 1차 Review나 비구매 안건에서는 candidate_scores=[]로 둔다.",
    "- context.internal_data에 본인 역할과 관련된 실제 수치가 있으면 summary 또는 reasons에서 최소 1개의 구체 수치를 인용하세요. 단, 그 수치로 사용자의 미래 행동을 단정하지 마세요.",
    "- evidence에는 근거 유형을 짧게 표시한다. 예: USER_INPUT, HANI_OS_DATA, MODEL_INFERENCE.",
    "- MODEL_INFERENCE는 사실이 아니라 추정임을 명확히 한다.",
    "- context.revision_request가 있으면 대표가 방금 요청한 수정사항을 최우선 PATCH 지시로 취급하세요. 수정 요청에 언급되지 않은 기존 사용자 조건·답변·결정 전제는 그대로 보존하고, 새 근거가 직접 충돌하지 않는 한 임의로 다시 해석하거나 바꾸지 마세요.",
    "- context.active_policy_registry.policies에는 적응형 학습 규정이 포함될 수 있습니다. governance_mode=ADAPTIVE 규정은 절대명령이 아니며 confidence/influence_weight에 비례해 참고하세요. 현재 Case 근거가 더 강하면 규정과 다르게 판단하고 그 이유를 남기세요.",
    "- enforcement_level=HARD_STOP 또는 governance_mode=MANUAL + ACTIVE가 아닌 적응형 규정을 Hard Stop처럼 취급하지 마세요.",
    "- confidence는 '정답 확률'이 아니라 현재 정보로 결론을 내릴 근거의 충분도다.",
    "- 장문의 사고과정은 쓰지 말고, 대표가 검토할 수 있는 간결한 판단 근거만 제출한다.",
    "- escalation이 필요하지 않으면 requested=false, requested_agent와 reason은 빈 문자열로 둔다.",
    "- 본인의 agent_key/role 값은 서버가 이미 알고 있으므로 JSON에 직접 쓰지 않는다.",
    "- 결과는 반드시 지정된 JSON Schema만 따른다.",
    "",
    "[ACTIVE COMPANY POLICY]",
    companyPolicyForPrompt(),
  ].join("\n");
}


function compactContextForAgentReview(contextValue: unknown) {
  const context = asObject(contextValue);
  const compactResearch = (value: unknown) => {
    const research = asObject(value);
    if (!Object.keys(research).length) return {};
    const sources = Array.isArray((research as any).sources) ? (research as any).sources : [];
    const { raw_research_memo: _rawResearchMemo, sources: _allSources, ...core } = research as any;
    return {
      ...core,
      source_count: sources.length,
      source_sample: sources.slice(0, 8).map((x: any) => ({
        title: String(x?.title ?? ""),
        url: String(x?.url ?? ""),
      })),
      prompt_note: "비용 절감을 위해 원문 Research Memo와 전체 Source 목록은 제외했습니다. 구조화 결과와 source_sample을 우선 사용하세요.",
    };
  };

  const market = compactResearch((context as any).market_research);
  const external = compactResearch((context as any).external_research);
  return {
    ...context,
    ...(Object.keys(market).length ? { market_research: market } : {}),
    ...(Object.keys(external).length ? { external_research: external } : {}),
  };
}

function agentUserPrompt(existingCase: any, agent: any): string {
  return [
    "[CASE]",
    `Case Code: ${existingCase.case_code}`,
    `Workflow: ${existingCase.workflow}`,
    `Title: ${existingCase.title}`,
    `Risk Level: ${existingCase.risk_level}`,
    `Source Type: ${existingCase.source_type}`,
    "",
    "[ORIGINAL SOURCE]",
    String(existingCase.source_text || "(원문 없음)"),
    "",
    "[STRUCTURED CONTEXT]",
    JSON.stringify(compactContextForAgentReview(existingCase.context), null, 2),
    "",
    "[YOUR ASSIGNMENT]",
    `Agent Key: ${agent.agent_key}`,
    `Role: ${agent.role}`,
    `Routing Reason: ${agent.reason}`,
    "",
    "위 자료만으로 독립 Review를 제출하세요. PURCHASE_REVIEW라면 먼저 '왜 필요한가 / 기존 활동과 어떤 관계인가 / 실제 사용 시나리오가 무엇인가'를 평가하세요. 모델·가격처럼 AI가 조사할 수 있는 정보는 대표에게 요구하지 말고 Research 필요로 분류하세요. 대표만 아는 목적·환경·선호가 제품 카테고리를 바꾸는 경우에만 추가정보를 요구하세요.",
  ].join("\n");
}

async function callAgentReview(openaiKey: string, existingCase: any, agent: any) {
  const baseInstructions = agentSystemPrompt(agent);
  const userPrompt = agentUserPrompt(existingCase, agent);

  async function oneAttempt(attempt: number) {
    const retryInstruction =
      attempt === 1
        ? ""
        : [
            "",
            "RETRY 규칙:",
            "- 이전 응답이 JSON 완결성 문제로 실패했습니다.",
            "- 반드시 간결하게 작성하세요.",
            "- reasons/risks/conditions는 각각 최대 4개, missing_data/evidence는 최대 5개만 사용하세요.",
            "- 각 문장은 짧게 작성하고 notes도 한 문장 이내로 제한하세요.",
            "- candidate_scores는 후보당 한 항목, axis_scores는 근거 있는 축만 최대 6개로 간결하게 작성하세요.",
          ].join("\n");

    const aiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        instructions: baseInstructions + retryInstruction,
        input: userPrompt,
        max_output_tokens: attempt === 1 ? 1400 : 1800,
        reasoning: { effort: "none" },
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "hani_agent_review",
            strict: true,
            schema: AGENT_REVIEW_SCHEMA,
          },
        },
        store: false,
      }),
    });

    const aiJson = await aiRes.json().catch(() => ({}));

    if (!aiRes.ok) {
      throw new Error(
        `${agent.agent_key} OpenAI ${aiRes.status}: ${aiJson?.error?.message ?? "API 호출 실패"}`
      );
    }

    const outputText = extractOpenAIOutputText(aiJson);
    const responseStatus = String(aiJson?.status ?? "");
    const incompleteReason = String(aiJson?.incomplete_details?.reason ?? "");

    if (!outputText) {
      return {
        ok: false,
        retryable: true,
        reason: `${agent.agent_key} 응답 텍스트가 비어 있습니다. status=${responseStatus} incomplete=${incompleteReason}`,
        aiJson,
      };
    }

    try {
      const review = JSON.parse(outputText) as AgentReviewOutput;
      return {
        ok: true,
        review,
        aiJson,
      };
    } catch (_) {
      return {
        ok: false,
        retryable: true,
        reason:
          `${agent.agent_key} Structured Output JSON 파싱 실패. ` +
          `status=${responseStatus || "unknown"} incomplete=${incompleteReason || "none"} ` +
          `chars=${outputText.length}`,
        aiJson,
      };
    }
  }

  const first = await oneAttempt(1);

  let finalAttempt = first;
  let retryUsed = false;

  if (!first.ok && first.retryable) {
    retryUsed = true;
    finalAttempt = await oneAttempt(2);
  }

  if (!finalAttempt.ok) {
    throw new Error(finalAttempt.reason);
  }

  const aiJson = finalAttempt.aiJson;
  return {
    agent,
    review: finalAttempt.review,
    provider: "OPENAI",
    model: String(aiJson?.model ?? "gpt-5.6-luna"),
    response_id: String(aiJson?.id ?? ""),
    usage: aiJson?.usage ?? null,
    retry_used: retryUsed,
  };
}

function usageTotals(results: any[]) {
  return results.reduce((acc, x) => {
    const u = x?.usage ?? {};
    acc.input_tokens += Number(u.input_tokens || 0);
    acc.output_tokens += Number(u.output_tokens || 0);
    acc.total_tokens += Number(u.total_tokens || 0);
    return acc;
  }, { input_tokens: 0, output_tokens: 0, total_tokens: 0 });
}

type VerificationOutput = {
  status: "PASS" | "NEEDS_DATA" | "CONFLICT" | "FAIL";
  summary: string;
  missing: string[];
  decision_blockers: string[];
  conditional_checks: string[];
  optimization_questions: string[];
  conflicts: string[];
  anomalies: string[];
  critical_anomalies: string[];
  duplicates: string[];
  existing_data_mismatch: string[];
  consolidated_questions: string[];
  human_required_questions: string[];
  research_required_items: string[];
  research_needed: boolean;
  research_blocking: boolean;
  research_items: string[];
  blocker_reason: string;
};

type HaniSynthesisOutput = {
  recommendation: "PROCEED" | "CONDITIONAL" | "DELAY" | "REJECT" | "NEEDS_DATA";
  confidence: number;
  ready_for_decision: boolean;
  executive_summary: string;
  purchase_eligibility: string;
  product_selection: string;
  purchase_method: string;
  timing: string;
  agent_positions: Array<{
    agent_key: string;
    verdict: string;
    key_point: string;
  }>;
  key_conflicts: string[];
  required_next_actions: string[];
  representative_questions: string[];
  policy_learning_candidates: string[];
  policy_evidence: Array<{
    policy_id: string;
    effect: "SUPPORT" | "CONTRADICT" | "NEUTRAL";
    strength: number;
    rationale: string;
  }>;
  decision_note: string;
};

const VERIFICATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: { type: "string", enum: ["PASS", "NEEDS_DATA", "CONFLICT", "FAIL"] },
    summary: { type: "string" },
    missing: { type: "array", maxItems: 3, items: { type: "string" } },
    decision_blockers: { type: "array", maxItems: 3, items: { type: "string" } },
    conditional_checks: { type: "array", maxItems: 5, items: { type: "string" } },
    optimization_questions: { type: "array", maxItems: 5, items: { type: "string" } },
    conflicts: { type: "array", items: { type: "string" } },
    anomalies: { type: "array", maxItems: 5, items: { type: "string" } },
    critical_anomalies: { type: "array", maxItems: 3, items: { type: "string" } },
    duplicates: { type: "array", items: { type: "string" } },
    existing_data_mismatch: { type: "array", items: { type: "string" } },
    consolidated_questions: {
      type: "array",
      maxItems: 3,
      items: { type: "string" },
    },
    human_required_questions: { type: "array", maxItems: 3, items: { type: "string" } },
    research_required_items: { type: "array", maxItems: 8, items: { type: "string" } },
    research_needed: { type: "boolean" },
    research_blocking: { type: "boolean" },
    research_items: { type: "array", items: { type: "string" } },
    blocker_reason: { type: "string" },
  },
  required: [
    "status",
    "summary",
    "missing",
    "decision_blockers",
    "conditional_checks",
    "optimization_questions",
    "conflicts",
    "anomalies",
    "critical_anomalies",
    "duplicates",
    "existing_data_mismatch",
    "consolidated_questions",
    "human_required_questions",
    "research_required_items",
    "research_needed",
    "research_blocking",
    "research_items",
    "blocker_reason",
  ],
};

const HANI_SYNTHESIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    recommendation: {
      type: "string",
      enum: ["PROCEED", "CONDITIONAL", "DELAY", "REJECT", "NEEDS_DATA"],
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    ready_for_decision: { type: "boolean" },
    executive_summary: { type: "string" },
    purchase_eligibility: { type: "string" },
    product_selection: { type: "string" },
    purchase_method: { type: "string" },
    timing: { type: "string" },
    agent_positions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          agent_key: { type: "string" },
          verdict: { type: "string" },
          key_point: { type: "string" },
        },
        required: ["agent_key", "verdict", "key_point"],
      },
    },
    key_conflicts: { type: "array", items: { type: "string" } },
    required_next_actions: { type: "array", items: { type: "string" } },
    representative_questions: {
      type: "array",
      maxItems: 5,
      items: { type: "string" },
    },
    policy_learning_candidates: { type: "array", maxItems: 3, items: { type: "string" } },
    policy_evidence: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          policy_id: { type: "string" },
          effect: { type: "string", enum: ["SUPPORT", "CONTRADICT", "NEUTRAL"] },
          strength: { type: "number", minimum: 0, maximum: 1 },
          rationale: { type: "string" },
        },
        required: ["policy_id", "effect", "strength", "rationale"],
      },
    },
    decision_note: { type: "string" },
  },
  required: [
    "recommendation",
    "confidence",
    "ready_for_decision",
    "executive_summary",
    "purchase_eligibility",
    "product_selection",
    "purchase_method",
    "timing",
    "agent_positions",
    "key_conflicts",
    "required_next_actions",
    "representative_questions",
    "policy_learning_candidates",
    "policy_evidence",
    "decision_note",
  ],
};

async function callStructuredJson(
  openaiKey: string,
  schemaName: string,
  schema: any,
  instructions: string,
  input: string,
  maxOutputTokens = 1200,
) {
  const aiRes = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.6-luna",
      instructions,
      input,
      max_output_tokens: maxOutputTokens,
      reasoning: { effort: "none" },
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: schemaName,
          strict: true,
          schema,
        },
      },
      store: false,
    }),
  });

  const aiJson = await aiRes.json().catch(() => ({}));
  if (!aiRes.ok) {
    throw new Error(
      `OpenAI ${aiRes.status}: ${aiJson?.error?.message ?? "API 호출 실패"}`
    );
  }

  const outputText = extractOpenAIOutputText(aiJson);
  if (!outputText) throw new Error(`${schemaName} 응답 텍스트가 비어 있습니다.`);

  let parsed: any;
  try {
    parsed = JSON.parse(outputText);
  } catch (_) {
    throw new Error(`${schemaName} Structured Output JSON 파싱에 실패했습니다.`);
  }

  return {
    parsed,
    model: String(aiJson?.model ?? "gpt-5.6-luna"),
    response_id: String(aiJson?.id ?? ""),
    usage: aiJson?.usage ?? null,
  };
}

function reviewForPrompt(review: any) {
  return {
    agent_key: review.agent_key,
    agent_rank: review.agent_rank,
    role: review.role,
    verdict: review.verdict,
    confidence: review.confidence,
    summary: review.summary,
    reasons: review.reasons,
    risks: review.risks,
    conditions: review.conditions,
    missing_data: review.missing_data,
    evidence: review.evidence,
    candidate_scores: Array.isArray(review.candidate_scores) ? review.candidate_scores : [],
    escalation: review.escalation,
    hard_stop: review.hard_stop,
    notes: review.notes,
  };
}

async function runVerification(openaiKey: string, existingCase: any, reviews: any[]) {
  const instructions = [
    "당신은 PROJECT HANI의 Verification Engine입니다.",
    "당신은 의사결정자가 아니라 검사관입니다.",
    "Agent 의견 중 누락, 충돌, 이상, 중복, 기존 데이터 불일치를 분리해서 검출하세요.",
    "Agent들의 missing_data를 그대로 전부 복사하지 말고 의미가 겹치는 항목을 정리하세요.",
    "정보 부족은 반드시 세 등급으로 분류하세요:",
    "1) decision_blockers: 없으면 지금 결재안 자체를 만들 수 없는 핵심 정보.",
    "2) conditional_checks: 결재는 가능하지만 실제 구매/Commit 직전에 확인해야 하는 조건.",
    "3) optimization_questions: 알면 더 나은 선택이 가능하지만 없어도 결재 가능한 보조정보.",
    "missing은 backward compatibility 필드이며 decision_blockers와 같은 내용만 넣으세요.",
    "consolidated_questions와 human_required_questions에는 대표만이 답할 수 있는 decision_blockers만 최대 3개 넣고 두 필드는 같은 의미로 유지하세요.",
    "research_required_items에는 AI가 내부조회/웹조사/구매팀 탐색으로 해결해야 할 항목만 넣고 research_items와 같은 의미로 유지하세요.",
    "대표에게 묻기 전에 정보 소유자를 먼저 판단하세요.",
    "PURCHASE_REVIEW에서 대표에게 후보 제품명·상품 링크·판매처·현재 가격을 찾아달라고 요구하는 것은 금지합니다. 이것은 PROCUREMENT/Research 업무입니다.",
    "PURCHASE_REVIEW에서 구매 목적 또는 사용 시나리오가 제품 카테고리를 실제로 바꿀 수 있을 정도로 불명확하면, 제품 탐색보다 먼저 '왜 기존 활동을 대체/보완하려는지'와 '실제 사용 환경'만 대표에게 질문하세요.",
    "기존 HANI OS 활동량이 이미 충분해 보이면 구매 필요성을 자동 찬성하지 말고, 새로운 효용(취미/접근성/주말 활동/편의 등)이 있는지 확인하세요.",
    "- HANI OS 내부 데이터로 해결 가능한 정보는 대표 질문으로 넣지 마세요. context.internal_data에 이미 조회 결과가 있으면 HANI_OS_DATA 근거로 사용하고, 없을 때만 conditional_checks에 'HANI OS 자동조회 필요'로 기록하세요.",
    "- 단, context.case_policy.financial_context.status가 DEFERRED이고 allow_conditional_approval=true이면 현재 Financial Context 부재 자체를 decision_blocker로 만들지 마세요. '최종 결제 전 월 할부 부담 가능 여부 확인'을 conditional_checks로 내리세요.",
    "- 이 정책은 재무안전성을 무시하라는 뜻이 아닙니다. 구매 총액 상한을 넘기거나 유이자 고비용 할부·리볼빙·대출을 권고하지 마세요.",
    "- 최신 외부정보는 대표 질문으로 넣지 말고 research_items에 넣으세요.",
    "- 대표만 아는 사실만 consolidated_questions에 넣으세요.",
    "context.active_policy_registry의 ADAPTIVE 규정은 confidence-weighted advisory입니다. 낮은 confidence 규정과 Case의 직접 근거가 충돌하면 규정 자체를 우선하지 마세요.",
    "현재 정보에 없는 사실을 만들지 마세요.",
    "특정 제품 모델, 현재 가격, 프로모션, 출시일처럼 최신 외부정보가 필요한 경우 representative 질문과 섞지 말고 research_needed=true 및 research_items에 기록하세요.",
    "research_needed는 '조사가 유용함'을 뜻하고, research_blocking은 '그 조사 없이는 현재 결재 자체가 불가능함'을 뜻합니다. 둘을 구분하세요.",
    "구매 직전 가격·재고·카드혜택 재확인처럼 변동성 관리용 Research는 보통 research_needed=true, research_blocking=false입니다.",
    "이미 시장조사로 후보/가격대/구매방식 판단이 가능하고 대표 정보도 충분하다면 PASS가 가능하며, 단지 구매 직전 재확인이 필요하다는 이유만으로 NEEDS_DATA를 사용하지 마세요.",
    "NEEDS_DATA는 decision_blockers 또는 대표 질문이 실제로 남아 있거나 research_blocking=true일 때만 사용하세요.",
    "context.revision_request가 있으면 대표의 최신 수정 메모를 PATCH_ONLY 지시로 처리하세요. 언급한 항목만 재검증하고, 언급하지 않은 기존 조건·답변·전제는 유지하세요. 단, 새 근거와 직접 충돌하는 경우에만 충돌을 명시하세요.",
    "context.representative_answer_history와 representative_answers에 이미 답변한 내용이 있으면 같은 의미를 표현만 바꿔 다시 질문하지 마세요.",
    "LOW/MEDIUM 구매안건에서 대표가 이미 여러 차례 답했다면 완벽한 정보 수집보다 충분한 정보로 조건부 결재안을 만드는 쪽을 우선하세요. 안전·법적·치명적 재무 위험이 아니면 반복 질문으로 결재를 계속 막지 마세요.",
    "anomalies는 주의·재확인·최신성 경고처럼 결재를 막지 않는 이상징후입니다. anomalies가 있다는 이유만으로 FAIL을 사용하지 마세요.",
    "critical_anomalies는 데이터 무결성 훼손, 보안 문제, 핵심 근거의 심각한 모순처럼 결재를 중단해야 하는 경우에만 기록하세요.",
    "FAIL은 critical_anomalies 또는 의사결정 핵심 데이터의 치명적 existing_data_mismatch가 있을 때만 사용하세요.",
    "FAIL은 중대한 데이터/보안/무결성 문제처럼 현재 흐름을 막아야 할 때만 사용하세요.",
    "PURCHASE_REVIEW에서 후보의 허용하중·프레임 사이즈·피팅·중고 매물 상태·정비이력·재고·가격이 아직 확정되지 않았다는 사실은 existing_data_mismatch나 critical_anomalies가 아닙니다. 실제 구매 직전 확인할 conditional_checks로 분류하세요.",
    "existing_data_mismatch는 HANI OS/Case에 이미 존재하는 두 값이 서로 모순될 때만 사용하세요. 단순 미확인·외부 사양 미조회·피팅 필요는 mismatch가 아닙니다.",
    "Agent의 찬반 또는 시점 의견이 다르다는 사실 자체는 Verification CONFLICT가 아닙니다. 두 조건을 동시에 만족할 수 없는 논리적 모순일 때만 conflicts를 사용하세요.",
    "Agent 의견이 실제로 양립 불가능할 때만 CONFLICT를 사용하세요.",
    "결과는 지정된 JSON Schema만 따르세요.",
    "",
    "[ACTIVE COMPANY POLICY]",
    companyPolicyForPrompt(),
  ].join("\n");

  const input = JSON.stringify({
    case: {
      case_code: existingCase.case_code,
      workflow: existingCase.workflow,
      title: existingCase.title,
      risk_level: existingCase.risk_level,
      source_type: existingCase.source_type,
      source_text: existingCase.source_text,
      context: existingCase.context,
    },
    reviews: reviews.map(reviewForPrompt),
  }, null, 2);

  return await callStructuredJson(
    openaiKey,
    "hani_verification",
    VERIFICATION_SCHEMA,
    instructions,
    input,
    1200,
  );
}



function applyCasePolicyToVerification(
  v: VerificationOutput,
  contextValue: unknown,
): VerificationOutput {
  const context = asObject(contextValue);
  const casePolicy = asObject((context as any).case_policy);
  const financialPolicy = asObject((casePolicy as any).financial_context);

  const deferredFinance =
    String((financialPolicy as any).status || "").toUpperCase() === "DEFERRED" &&
    Boolean((financialPolicy as any).allow_conditional_approval);

  if (!deferredFinance) return v;

  const financeRegex =
    /(할부|상환|부채|비상자금|생활비|현금흐름|월\s*부담|가용\s*현금|재무|소득|고정지출)/i;

  const moved: string[] = [];
  const remainingBlockers = (v.decision_blockers || []).filter((item) => {
    if (financeRegex.test(String(item))) {
      moved.push(String(item));
      return false;
    }
    return true;
  });

  const remainingQuestions = (v.consolidated_questions || []).filter((item) => {
    if (financeRegex.test(String(item))) {
      moved.push(String(item));
      return false;
    }
    return true;
  });

  const conditional = [...(v.conditional_checks || [])];
  if (moved.length) {
    const standardCheck =
      "최종 결제 전 지은 대리가 최신 Financial Context(가계부/현금흐름)를 확인해 월 할부 부담 가능 여부를 재검증";
    if (!conditional.some((x) => String(x).includes("월 할부 부담"))) {
      conditional.unshift(standardCheck);
    }
  }

  return {
    ...v,
    decision_blockers: remainingBlockers,
    missing: remainingBlockers,
    consolidated_questions: remainingQuestions,
    human_required_questions: remainingQuestions,
    conditional_checks: conditional.slice(0, 5),
  };
}



function collectRepresentativeAnswerMemory(contextValue: unknown): Array<{question:string;answer:string;supplied_at:string}> {
  const context = asObject(contextValue);
  const rows: Array<{question:string;answer:string;supplied_at:string}> = [];
  const pushFrom = (value: unknown, suppliedAt = "") => {
    const obj = asObject(value);
    const qa = Array.isArray((obj as any).qa) ? (obj as any).qa : [];
    for (const item of qa) {
      const q = cleanText((item as any)?.question, 1000);
      const a = cleanText((item as any)?.answer, 3000);
      if (!q || !a) continue;
      rows.push({ question: q, answer: a, supplied_at: suppliedAt || cleanText((obj as any).supplied_at, 80) });
    }
  };
  const history = Array.isArray((context as any).representative_answer_history)
    ? (context as any).representative_answer_history : [];
  for (const h of history) pushFrom(h, cleanText((h as any)?.supplied_at, 80));
  pushFrom((context as any).representative_answers);
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.question}\n${row.answer}`.toLowerCase().replace(/\s+/g, " ").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(-30);
}

function purchaseQuestionTopics(textValue: unknown): string[] {
  const text = String(textValue || "");
  const topics: string[] = [];
  const add = (name: string, re: RegExp) => { if (re.test(text) && !topics.includes(name)) topics.push(name); };
  add("PURPOSE_USAGE", /(왜|목적|대체|보완|취미|사용\s*환경|어디서|한강|자전거도로|야외|라이딩|출퇴근|도로주행|동네주행|공원|실내|홈트|스핀)/i);
  add("FREQUENCY_WEATHER", /(얼마나\s*자주|빈도|주\s*\d|주말|평일|날씨|우천|비\s*오|계절|대체\s*계획)/i);
  add("STORAGE_TRANSPORT", /(보관|거치|계단|엘리베이터|운반|옮길|이동\s*동선|주차|자전거\s*보관)/i);
  add("BUDGET_PAYMENT", /(예산|가격|할부|월\s*부담|현금|카드|무이자|총액|지출)/i);
  add("BODY_FIT", /(키|신장|체중|무릎|허리|통증|부상|신체|사이즈|피팅)/i);
  add("PREFERENCE", /(브랜드|색상|디자인|선호|싫|접이식|하이브리드|로드|MTB|미니벨로)/i);
  return topics;
}

function resolvedPurchaseTopics(existingCase: any): Set<string> {
  const context = asObject(existingCase?.context);
  const answered = collectRepresentativeAnswerMemory(context);
  const resolved = new Set<string>();
  for (const row of answered) {
    for (const topic of purchaseQuestionTopics(`${row.question}\n${row.answer}`)) resolved.add(topic);
  }
  // Research may contain a purpose/category that was derived from representative answers.
  // Use it only as supporting evidence when Answer Memory already exists.
  if (answered.length) {
    const external = asObject((context as any).external_research);
    const procurement = asObject((external as any).procurement);
    const supportText = `${String((procurement as any).purpose_interpretation || "")} ${String((procurement as any).recommended_category || "")}`;
    for (const topic of purchaseQuestionTopics(supportText)) resolved.add(topic);
  }
  return resolved;
}

function questionAlreadyAnswered(question: string, existingCase: any): boolean {
  if (String(existingCase?.workflow || "").toUpperCase() !== "PURCHASE_REVIEW") return false;
  const topics = purchaseQuestionTopics(question);
  if (!topics.length) return false;
  const resolved = resolvedPurchaseTopics(existingCase);
  // A question is considered answered only when all of its detected semantic topics
  // have previously been covered. This is conservative enough to avoid hiding genuinely new facts.
  return topics.every((topic) => resolved.has(topic));
}

function applyHumanQuestionBudgetPolicy(
  v: VerificationOutput,
  existingCase: any,
  latestReviewRound: number,
  forceFinalize = false,
): VerificationOutput {
  const workflow = String(existingCase?.workflow || "").toUpperCase();
  const risk = String(existingCase?.risk_level || "LOW").toUpperCase();
  const context = asObject(existingCase?.context);
  const external = asObject((context as any).external_research);
  const candidates = Array.isArray((external as any).candidate_options) ? (external as any).candidate_options : [];
  const answeredMemory = collectRepresentativeAnswerMemory(context);
  const humanRounds = Math.max(
    Number((context as any).human_question_round_count || 0),
    answeredMemory.length ? Math.max(1, latestReviewRound - 1) : 0,
  );

  let questions = (v.human_required_questions || v.consolidated_questions || []).filter(Boolean);
  let blockers = (v.decision_blockers || []).filter(Boolean);

  const repeatedQuestions = questions.filter((q) => questionAlreadyAnswered(String(q), existingCase));
  questions = questions.filter((q) => !questionAlreadyAnswered(String(q), existingCase));
  blockers = blockers.filter((q) => !questionAlreadyAnswered(String(q), existingCase));

  const shouldBound = workflow === "PURCHASE_REVIEW" && ["LOW", "MEDIUM"].includes(risk) && (forceFinalize || humanRounds >= 2 || latestReviewRound >= 3);
  const conditional = [...(v.conditional_checks || [])];
  const optimization = [...(v.optimization_questions || [])];
  const anomalies = [...(v.anomalies || [])];

  if (repeatedQuestions.length) {
    anomalies.unshift(`Answer Memory로 이미 답한 의미의 반복 질문 ${repeatedQuestions.length}개를 제거했습니다.`);
  }

  if (shouldBound && (questions.length || blockers.length)) {
    const remaining = [...blockers, ...questions].filter((x, i, a) => a.indexOf(x) === i);
    for (const item of remaining.slice(0, 5)) {
      if (!conditional.some((x) => String(x).includes(String(item)))) {
        conditional.push(`구매/실행 직전 필요 시 재확인: ${item}`);
      }
    }
    questions = [];
    blockers = [];
    anomalies.unshift("HUMAN_REQUIRED 질문 상한을 적용해 비핵심 불확실성을 조건부 확인사항으로 전환했습니다.");
  }

  const researchBlocking = Boolean(v.research_blocking && candidates.length === 0);
  const hasHardStop = (v.critical_anomalies || []).length > 0 || (v.existing_data_mismatch || []).length > 0 || (v.conflicts || []).length > 0;
  let status = v.status;
  if (!questions.length && !blockers.length && !researchBlocking && !hasHardStop) status = "PASS";

  return {
    ...v,
    status,
    missing: blockers.slice(0, 3),
    decision_blockers: blockers.slice(0, 3),
    consolidated_questions: questions.slice(0, 3),
    human_required_questions: questions.slice(0, 3),
    conditional_checks: conditional.slice(0, 5),
    optimization_questions: optimization.slice(0, 5),
    anomalies: anomalies.slice(0, 5),
    research_blocking: researchBlocking,
    blocker_reason: status === "PASS" ? "" : String(v.blocker_reason || ""),
  };
}


function purchaseSoftGateReason(textValue: unknown): boolean {
  const text = String(textValue || "");
  if (!text.trim()) return false;
  const soft = /(허용\s*하중|시스템\s*허용하중|프레임\s*사이즈|사이즈\s*확정|피팅|승차\s*자세|실측|중고\s*매물|매물\s*상태|정비\s*이력|휠|스포크|타이어|브레이크|재고|현재\s*가격|판매처|A\/?S|보증|헬멧|등화|자물쇠|펌프|초기\s*정비|공식\s*자료|판매점|구매\s*직전|재확인|미확인|확인\s*필요|확정할\s*수\s*없)/i;
  const trulyCritical = /(데이터\s*무결성|보안|위조|사기|리콜|법적\s*금지|사용\s*금지|치명적|파손\s*확정|결함\s*확정|허용하중\s*초과\s*확정|안전\s*기준\s*위반\s*확정)/i;
  return soft.test(text) && !trulyCritical.test(text);
}

function applyForceFinalizeCurrentContextPolicy(
  v: VerificationOutput,
  existingCase: any,
  forceFinalize: boolean,
): VerificationOutput {
  if (!forceFinalize) return v;
  const workflow = String(existingCase?.workflow || "").toUpperCase();
  const risk = String(existingCase?.risk_level || "LOW").toUpperCase();
  if (workflow !== "PURCHASE_REVIEW" || !["LOW", "MEDIUM"].includes(risk)) return v;

  const conditional = [...(v.conditional_checks || [])];
  const anomalies = [...(v.anomalies || [])];

  const keepCritical: string[] = [];
  const keepMismatch: string[] = [];
  const demoted: string[] = [];

  for (const item of v.critical_anomalies || []) {
    if (purchaseSoftGateReason(item)) demoted.push(String(item));
    else keepCritical.push(String(item));
  }
  for (const item of v.existing_data_mismatch || []) {
    if (purchaseSoftGateReason(item)) demoted.push(String(item));
    else keepMismatch.push(String(item));
  }

  for (const item of demoted) {
    const row = `구매 직전 확인: ${item}`;
    if (!conditional.some((x) => String(x) === row || String(x).includes(String(item)))) conditional.push(row);
  }
  if (demoted.length) {
    anomalies.unshift(`현재 정보로 결론내기 정책에 따라 구매 전 확인사항 ${demoted.length}개를 결재 차단에서 조건부 확인으로 전환했습니다.`);
  }

  const hasHardBlock = keepCritical.length > 0 || keepMismatch.length > 0 || (v.conflicts || []).length > 0;
  return {
    ...v,
    critical_anomalies: keepCritical.slice(0, 3),
    existing_data_mismatch: keepMismatch,
    conditional_checks: conditional.slice(0, 5),
    anomalies: anomalies.slice(0, 5),
    status: hasHardBlock ? v.status : "PASS",
    blocker_reason: hasHardBlock ? String(v.blocker_reason || "") : "",
  };
}

function applyInformationOwnershipPolicy(
  v: VerificationOutput,
  existingCase: any,
): VerificationOutput {
  const workflow = String(existingCase?.workflow || "").toUpperCase();
  const context = asObject(existingCase?.context);
  const external = asObject((context as any).external_research);
  const market = asObject((context as any).market_research);
  const candidates = Array.isArray((external as any).candidate_options)
    ? (external as any).candidate_options
    : Array.isArray((market as any).candidates)
    ? (market as any).candidates
    : [];

  const human = Array.isArray(v.human_required_questions)
    ? [...v.human_required_questions]
    : [...(v.consolidated_questions || [])];
  const research = Array.isArray(v.research_required_items)
    ? [...v.research_required_items]
    : [...(v.research_items || [])];

  if (workflow !== "PURCHASE_REVIEW") {
    return {
      ...v,
      human_required_questions: human.slice(0, 3),
      consolidated_questions: human.slice(0, 3),
      research_required_items: research.slice(0, 8),
      research_items: research.slice(0, 8),
    };
  }

  // Researchable product discovery must never be delegated back to the representative.
  const procurementRegex = /(후보|제품|상품|모델).*(링크|모델명|상품명|제품명|판매처|가격|찾|알려|제공)|(?:링크|모델명|상품명|제품명|판매처|현재\s*가격).*(후보|제품|상품|모델|알려|제공)/i;
  const movedToResearch: string[] = [];
  const filteredHuman = human.filter((q) => {
    if (procurementRegex.test(String(q))) {
      movedToResearch.push(String(q));
      return false;
    }
    return true;
  });
  const filteredBlockers = (v.decision_blockers || []).filter((q) => {
    if (procurementRegex.test(String(q))) {
      movedToResearch.push(String(q));
      return false;
    }
    return true;
  });

  const nextResearch = [...research];
  if (movedToResearch.length && !nextResearch.some((x) => /후보|모델|상품/.test(String(x)))) {
    nextResearch.unshift("PROCUREMENT가 대표 조건에 맞는 실제 구매 후보 3~5개와 현재 가격·핵심사양·제약조건을 조사");
  }
  if (!candidates.length && !nextResearch.some((x) => /후보|모델|상품|구매/.test(String(x)))) {
    nextResearch.unshift("PROCUREMENT가 구매 목적·사용 시나리오·예산·신체/공간 조건에 맞는 실제 판매 후보를 조사");
  }

  // Purpose-first deterministic guard for category-ambiguous bicycle purchases.
  // This prevents a generic "자전거" request from being prematurely researched as an indoor bike or outdoor bike.
  const repContext = JSON.stringify((context as any).representative_answers || {});
  const routerAnswers = String((context as any).router_source_with_answers || "");
  const sourceText = `${String(existingCase?.source_text || "")} ${repContext} ${routerAnswers}`;
  const isBikePurchase = /자전거|바이크/i.test(sourceText);
  const hasBikeUsageScenario = /(한강|자전거도로|야외|라이딩|출퇴근|도로주행|동네주행|공원|실내|스핀|고정식|홈트)/i.test(sourceText);
  if (isBikePurchase && !hasBikeUsageScenario && filteredHuman.length < 3) {
    const internal = asObject((context as any).internal_data);
    const exercise = asObject((internal as any).exercise_recent_90d);
    const avg = Number((exercise as any).avg_steps_on_recorded_step_days || 0);
    const question = avg >= 7000
      ? `HANI OS 운동 기록일 평균이 약 ${Math.round(avg).toLocaleString("ko-KR")}보로 이미 활동이 있는 편입니다. 자전거를 기존 운동의 대체/보완/새 취미 중 어떤 목적으로 추가하려는지, 실제 사용 환경(예: 한강 자전거도로·출퇴근·실내)을 알려주세요.`
      : "자전거를 기존 운동의 대체/보완/새 취미 중 어떤 목적으로 추가하려는지와 실제 사용 환경(야외 자전거도로/출퇴근/실내 등)을 알려주세요.";
    filteredHuman.unshift(question);
  }

  const hasHumanBlocker = filteredHuman.length > 0 || filteredBlockers.length > 0;
  const needsProcurement = candidates.length === 0;

  return {
    ...v,
    decision_blockers: filteredBlockers.slice(0, 3),
    missing: filteredBlockers.slice(0, 3),
    consolidated_questions: filteredHuman.slice(0, 3),
    human_required_questions: filteredHuman.slice(0, 3),
    research_items: nextResearch.slice(0, 8),
    research_required_items: nextResearch.slice(0, 8),
    research_needed: Boolean(v.research_needed || needsProcurement || movedToResearch.length),
    // Before final purchase approval, actual candidates are a blocking Research item.
    // If human purpose/use-case is still unresolved, ask that first and research after answers.
    research_blocking: hasHumanBlocker ? false : Boolean(v.research_blocking || needsProcurement),
    blocker_reason: hasHumanBlocker
      ? (v.blocker_reason || "대표만 알 수 있는 구매 목적/사용 시나리오 확인 필요")
      : needsProcurement
      ? "구매 결재 전 PROCUREMENT 후보 탐색 필요"
      : v.blocker_reason,
  };
}

function normalizeVerification(v: VerificationOutput): VerificationOutput {
  const blockers = Array.isArray(v.decision_blockers) ? v.decision_blockers : [];
  const questions = Array.isArray(v.human_required_questions)
    ? v.human_required_questions
    : Array.isArray(v.consolidated_questions) ? v.consolidated_questions : [];
  const researchItems = Array.isArray(v.research_required_items)
    ? v.research_required_items
    : Array.isArray(v.research_items) ? v.research_items : [];
  const conflicts = Array.isArray(v.conflicts) ? v.conflicts : [];
  const anomalies = Array.isArray(v.anomalies) ? v.anomalies : [];
  const criticalAnomalies =
    Array.isArray(v.critical_anomalies) ? v.critical_anomalies : [];
  const mismatches =
    Array.isArray(v.existing_data_mismatch) ? v.existing_data_mismatch : [];

  const hasConflicts = conflicts.length > 0;
  const hasCriticalAnomaly = criticalAnomalies.length > 0;
  const hasMismatch = mismatches.length > 0;
  const hasDecisionBlocker =
    blockers.length > 0 ||
    questions.length > 0 ||
    Boolean(v.research_blocking);

  let status = v.status;

  // Backward compatibility: missing mirrors true decision blockers only.
  const missing = blockers;

  // Non-blocking anomaly warnings must never create FAIL by themselves.
  if (status === "NEEDS_DATA" && !hasDecisionBlocker) {
    status = hasConflicts ? "CONFLICT"
      : (hasCriticalAnomaly || hasMismatch) ? "FAIL"
      : "PASS";
  }

  // A model-generated FAIL without a critical reason is normalized away.
  if (
    status === "FAIL" &&
    !hasCriticalAnomaly &&
    !hasMismatch &&
    !hasConflicts &&
    !hasDecisionBlocker
  ) {
    status = "PASS";
  }

  // PASS cannot coexist with a real blocker or critical integrity issue.
  if (status === "PASS") {
    if (hasConflicts) {
      status = "CONFLICT";
    } else if (hasCriticalAnomaly || hasMismatch) {
      status = "FAIL";
    } else if (hasDecisionBlocker) {
      status = "NEEDS_DATA";
    }
  }

  return {
    ...v,
    missing,
    decision_blockers: blockers,
    consolidated_questions: questions.slice(0, 3),
    human_required_questions: questions.slice(0, 3),
    research_items: researchItems.slice(0, 8),
    research_required_items: researchItems.slice(0, 8),
    research_needed: Boolean(v.research_needed || researchItems.length),
    anomalies,
    critical_anomalies: criticalAnomalies,
    status,
    blocker_reason:
      status === "PASS"
        ? ""
        : String(v.blocker_reason || ""),
  };
}

type PurchaseAxis = { key: string; label: string; emoji: string; weight: number; reason: string };

function purchaseModeFromCase(existingCase: any): string {
  const router = asObject(asObject(existingCase?.context).router_v2);
  return String((router as any).purchase_decision_mode || "BUY_OR_NOT").toUpperCase();
}

function purchaseScorecard(existingCase: any, reviews: any[], haniParsed: any) {
  if (String(existingCase?.workflow || "").toUpperCase() !== "PURCHASE_REVIEW") return null;
  const context = asObject(existingCase?.context);
  const external = asObject((context as any).external_research);
  const procurement = asObject((external as any).procurement);
  const candidates = Array.isArray((external as any).candidate_options) ? (external as any).candidate_options : [];
  if (!candidates.length) return {
    decision_mode: purchaseModeFromCase(existingCase), evaluation_axes: [], candidates: [], picks: [], hani_pick_candidate: "", generated_at: new Date().toISOString(),
  };

  const declaredAxes: PurchaseAxis[] = Array.isArray((procurement as any).evaluation_axes)
    ? (procurement as any).evaluation_axes.slice(0, 6).map((x: any) => ({
        key: String(x?.key || "").toUpperCase(), label: String(x?.label || x?.key || "평가"), emoji: String(x?.emoji || "🏷️"),
        weight: Math.max(0, Math.min(1, Number(x?.weight || 0))), reason: String(x?.reason || ""),
      })).filter((x: PurchaseAxis) => x.key)
    : [];
  const axisMap = new Map(declaredAxes.map((x) => [x.key, x]));
  for (const review of reviews) {
    for (const cs of Array.isArray(review?.candidate_scores) ? review.candidate_scores : []) {
      for (const ax of Array.isArray(cs?.axis_scores) ? cs.axis_scores : []) {
        const key = String(ax?.axis_key || "").toUpperCase();
        if (key && !axisMap.has(key)) axisMap.set(key, { key, label: key.replace(/_/g, " "), emoji: "🏷️", weight: 0.5, reason: "Agent 평가축" });
      }
    }
  }
  const axes = Array.from(axisMap.values()).slice(0, 6);
  const norm = (v: unknown) => String(v || "").toLocaleLowerCase("ko-KR").replace(/[\s·\-_/()\[\]{}:："'“”‘’.,]+/g, "");

  const rows = candidates.slice(0, 5).map((candidate: any) => {
    const name = String(candidate?.name || "");
    const key = norm(name);
    const agentScores: any[] = [];
    const axisBuckets = new Map<string, number[]>();
    for (const review of reviews) {
      const scores = Array.isArray(review?.candidate_scores) ? review.candidate_scores : [];
      const match = scores.find((x: any) => norm(x?.candidate_name) === key || (key && (norm(x?.candidate_name).includes(key) || key.includes(norm(x?.candidate_name)))));
      if (!match) continue;
      const overall = Math.max(0, Math.min(5, Number(match?.overall_score || 0)));
      if (overall > 0) agentScores.push({ agent_key: String(review.agent_key || ""), role: String(review.role || ""), score: Math.round(overall * 10) / 10, reason: String(match?.score_reason || "") });
      for (const ax of Array.isArray(match?.axis_scores) ? match.axis_scores : []) {
        const axKey = String(ax?.axis_key || "").toUpperCase();
        const score = Math.max(0, Math.min(5, Number(ax?.score || 0)));
        if (!axKey || score <= 0) continue;
        if (!axisBuckets.has(axKey)) axisBuckets.set(axKey, []);
        axisBuckets.get(axKey)!.push(score);
      }
    }
    const axisScores = axes.map((axis) => {
      const vals = axisBuckets.get(axis.key) || [];
      const score = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return { axis_key: axis.key, label: axis.label, emoji: axis.emoji, score: Math.round(score * 10) / 10, weight: axis.weight };
    }).filter((x) => x.score > 0);
    const average = agentScores.length ? agentScores.reduce((a, b) => a + Number(b.score || 0), 0) / agentScores.length : 0;
    const weightedDen = axisScores.reduce((a, x) => a + Number(x.weight || 0), 0);
    const weighted = weightedDen ? axisScores.reduce((a, x) => a + x.score * Number(x.weight || 0), 0) / weightedDen : average;
    return { name, average_score: Math.round(average * 10) / 10, purpose_score: Math.round(weighted * 10) / 10, agent_scores: agentScores, axis_scores: axisScores, picks: [] as string[], hani_pick: false };
  });

  const picks: any[] = [];
  for (const axis of axes) {
    const ranked = rows.filter((r) => r.axis_scores.some((x: any) => x.axis_key === axis.key)).map((r) => ({ row: r, score: r.axis_scores.find((x: any) => x.axis_key === axis.key)?.score || 0 })).sort((a, b) => b.score - a.score);
    if (!ranked.length || ranked[0].score <= 0) continue;
    ranked[0].row.picks.push(axis.key);
    picks.push({ axis_key: axis.key, label: axis.label, emoji: axis.emoji, candidate_name: ranked[0].row.name, score: ranked[0].score, reason: axis.reason });
  }
  const selection = norm(haniParsed?.product_selection || "");
  const matchedByText = rows
    .map((r) => ({ row: r, pos: selection && norm(r.name) ? selection.indexOf(norm(r.name)) : -1 }))
    .filter((x) => x.pos >= 0)
    .sort((a, b) => a.pos - b.pos);
  let haniPick = matchedByText[0]?.row;
  if (!haniPick) haniPick = [...rows].sort((a, b) => b.purpose_score - a.purpose_score || b.average_score - a.average_score)[0];
  if (haniPick) haniPick.hani_pick = true;
  return { decision_mode: purchaseModeFromCase(existingCase), evaluation_axes: axes, candidates: rows, picks, hani_pick_candidate: haniPick?.name || "", generated_at: new Date().toISOString() };
}

async function runHaniSynthesis(
  openaiKey: string,
  existingCase: any,
  reviews: any[],
  verification: VerificationOutput,
) {
  const instructions = [
    "당신은 PROJECT HANI의 하니 부장, Chief of Staff입니다.",
    "전문 Agent의 원문 의견을 수정하거나 덮어쓰지 말고 종합 결재안만 작성하세요.",
    "다수결하지 말고 왜 의견이 갈리는지와 현재 결정을 막는 핵심 조건을 정리하세요.",
    "PURCHASE_REVIEW에서는 context.router_v2.purchase_decision_mode를 먼저 확인하세요. BUY_OR_NOT이면 ① 살지 말지 ② 산다면 어떤 후보 ③ 구매 방식 ④ 시점을 정리합니다. SELECT_PRODUCT/CONDITION_SEARCH이면 구매 필요를 재심의하지 말고 ① 구매 전제/목적 ② 가장 적합한 후보와 대안 ③ 선택 포인트/구매 전 확인 ④ 시점을 정리합니다. UPGRADE_REPLACE이면 기존 제품 대비 교체 가치와 후보를 정리합니다.",
    "PURCHASE_REVIEW의 BUY_OR_NOT/UPGRADE_REPLACE에서는 기존 데이터상 충분한지와 추가/대체 이유를 해석하세요. SELECT_PRODUCT/CONDITION_SEARCH에서는 '구매는 확정'이라는 사용자의 결정 목적을 존중하고, 안전·명백한 모순이 없는 한 구매 자체를 다시 반대하지 마세요.",
    "SELECT_PRODUCT에서는 최저가를 자동 1위로 만들지 마세요. Agent별 candidate_scores와 평가축 차이를 보존하고 사용 목적상 중요한 축에 더 큰 의미를 두세요. 평균점수가 근소하게 높다는 이유만으로 기계적으로 선택하지 마세요.",
    "대표가 특정 제품을 지정하지 않았으면 대표에게 후보 제품을 찾아오라고 하지 마세요. context.external_research.candidate_options가 있으면 product_selection에 실제 후보 1~3개를 이름과 적합 이유로 제시하세요.",
    "재무 Agent가 실제 자산/부채/현금흐름 근거로 시점 반대를 제시하면 숨기지 말고 timing에 '언제/어떤 조건이면 재검토할지'를 구체화하세요. 예산 한도는 구매 허가가 아닙니다.",
    "Agent 간 찬반이 갈리면 다수결로 지우지 말고 key_conflicts에 남기고, 최종 권고가 왜 그 이견을 받아들이거나 기각했는지 executive_summary에 반영하세요.",
    "구매가 아닌 안건에서는 기존 JSON 필드명을 그대로 사용하되 의미를 일반화하세요: purchase_eligibility=결정 가능 여부, product_selection=핵심 권고안, purchase_method=진행 방식, timing=시점/다음 단계.",
    "정보가 부족하면 특정 모델·가격·구매시기를 상상해서 확정하지 마세요.",
    "Verification이 NEEDS_DATA/CONFLICT/FAIL이면 ready_for_decision=true로 만들지 마세요.",
    "Verification이 PASS이고 research_needed=true라도 research_blocking=false라면 조건부 결재안은 작성할 수 있습니다. 구매 직전 최신 가격·재고·카드혜택 재확인을 조건으로 두세요.",
    "conditional_checks가 남아 있어도 decision_blockers가 없다면 ready_for_decision=true가 가능합니다.",
    "context.case_policy.financial_context가 DEFERRED + allow_conditional_approval=true라면, 재무 검토는 '최종 결제 전 월 할부 부담 가능 여부 확인' 조건으로 남기고 조건부 결재안을 작성할 수 있습니다.",
    "이 경우 무이자 할부를 우선 검토하고, 유이자 고비용 할부·리볼빙·대출 사용을 결재조건으로 허용하지 마세요.",
    "optimization_questions는 결재를 막지 말고 필요 시 '선호에 따른 최적화 포인트'로만 요약하세요.",
    "Verification의 anomalies는 경고로 요약할 수 있지만 critical_anomalies가 아니라면 ready_for_decision을 막지 마세요.",
    "representative_questions는 Verification의 human_required_questions를 우선 사용하고 최대 5개만 남기세요. 제품 후보·링크·가격 조사 요청은 representative_questions에 절대 넣지 마세요.",
    "최신 시장조사나 후보 탐색이 필요하면 required_next_actions에 'PROCUREMENT/Research 수행'을 명시하세요.",
    "context.active_policy_registry.policies의 ADAPTIVE 규정은 절대 규칙이 아니라 confidence/influence_weight만큼 참고하는 학습 가설입니다. 현재 Case가 규정을 지지하거나 반박하면 policy_evidence에 해당 policy_id, SUPPORT/CONTRADICT, strength, 간단한 근거를 기록하세요. 단순히 규정이 Context에 있었다는 이유만으로 SUPPORT하지 마세요.",
    "policy_evidence의 CONTRADICT는 실제 반례나 명확한 충돌이 있을 때만 사용하세요. 정책과 무관한 Case는 evidence에 넣지 않습니다.",
    "policy_learning_candidates에는 기존 Adaptive Policy와 의미가 겹치지 않는, 이번 Case에서 새로 발견된 재사용 가능 원칙만 최대 3개 제안하세요. 개인 사실·일회성 제품정보·이번 Case 결론은 제외하세요. 신규 후보는 대표 승인 없이 낮은 confidence의 LEARNING 상태로 시작하며 반복 근거에 따라 강해지거나 약해집니다.",
    "context.revision_request가 있으면 최신 대표 수정 메모를 PATCH_ONLY 지시로 반영하세요. 수정 요청에 없는 기존 결재 조건과 사용자 답변은 유지하고, 변경된 부분이 무엇인지 executive_summary에서 짧게 드러내세요.",
    "대표 승인 전 기존 HANI OS 데이터 Commit을 권고하지 마세요.",
    "결과는 대표가 20초 안에 이해할 수 있는 간결한 Executive Memo 형식으로 작성하고 지정된 JSON Schema만 따르세요.",
    "",
    "[ACTIVE COMPANY POLICY]",
    companyPolicyForPrompt(),
  ].join("\n");

  const input = JSON.stringify({
    case: {
      case_code: existingCase.case_code,
      workflow: existingCase.workflow,
      title: existingCase.title,
      risk_level: existingCase.risk_level,
      source_type: existingCase.source_type,
      source_text: existingCase.source_text,
      context: existingCase.context,
    },
    reviews: reviews.map(reviewForPrompt),
    verification,
  }, null, 2);

  return await callStructuredJson(
    openaiKey,
    "hani_executive_synthesis",
    HANI_SYNTHESIS_SCHEMA,
    instructions,
    input,
    1400,
  );
}

type MarketResearchOutput = {
  as_of: string;
  summary: string;
  purchase_fit: string;
  candidates: Array<{
    brand: string;
    model: string;
    model_year: number;
    panel_or_series: string;
    observed_price_krw: number;
    price_basis: string;
    gaming_fit: string;
    movie_ott_fit: string;
    major_strengths: string[];
    major_limits: string[];
    budget_fit: "WITHIN_BUDGET" | "NEAR_BUDGET" | "OVER_BUDGET" | "UNKNOWN";
  }>;
  purchase_methods: Array<{
    method: string;
    suitability: string;
    notes: string;
  }>;
  timing_recommendation: string;
  price_watch_targets: Array<{
    model: string;
    target_price_krw: number;
    rationale: string;
  }>;
  unresolved: string[];
};

const MARKET_RESEARCH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    as_of: { type: "string" },
    summary: { type: "string" },
    purchase_fit: { type: "string" },
    candidates: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          brand: { type: "string" },
          model: { type: "string" },
          model_year: { type: "integer" },
          panel_or_series: { type: "string" },
          observed_price_krw: { type: "integer", minimum: 0 },
          price_basis: { type: "string" },
          gaming_fit: { type: "string" },
          movie_ott_fit: { type: "string" },
          major_strengths: { type: "array", items: { type: "string" } },
          major_limits: { type: "array", items: { type: "string" } },
          budget_fit: {
            type: "string",
            enum: ["WITHIN_BUDGET", "NEAR_BUDGET", "OVER_BUDGET", "UNKNOWN"],
          },
        },
        required: [
          "brand",
          "model",
          "model_year",
          "panel_or_series",
          "observed_price_krw",
          "price_basis",
          "gaming_fit",
          "movie_ott_fit",
          "major_strengths",
          "major_limits",
          "budget_fit",
        ],
      },
    },
    purchase_methods: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          method: { type: "string" },
          suitability: { type: "string" },
          notes: { type: "string" },
        },
        required: ["method", "suitability", "notes"],
      },
    },
    timing_recommendation: { type: "string" },
    price_watch_targets: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          model: { type: "string" },
          target_price_krw: { type: "integer", minimum: 0 },
          rationale: { type: "string" },
        },
        required: ["model", "target_price_krw", "rationale"],
      },
    },
    unresolved: { type: "array", items: { type: "string" } },
  },
  required: [
    "as_of",
    "summary",
    "purchase_fit",
    "candidates",
    "purchase_methods",
    "timing_recommendation",
    "price_watch_targets",
    "unresolved",
  ],
};

function extractWebSources(payload: any) {
  const seen = new Set<string>();
  const sources: Array<{url: string; title: string}> = [];
  const output = Array.isArray(payload?.output) ? payload.output : [];

  for (const item of output) {
    if (item?.type !== "web_search_call") continue;
    const actionSources = Array.isArray(item?.action?.sources) ? item.action.sources : [];
    for (const s of actionSources) {
      const url = String(s?.url ?? "").trim();
      if (!url || seen.has(url)) continue;
      seen.add(url);
      sources.push({
        url,
        title: String(s?.title ?? s?.name ?? url).trim(),
      });
    }
  }

  return sources;
}


const INVESTMENT_NEWS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    market_brief: { type: "string" },
    weekly_brief: {
      type: "object",
      additionalProperties: false,
      properties: {
        korea_market: { type: "string" },
        us_market: { type: "string" },
        major_events: { type: "array", minItems: 3, maxItems: 6, items: { type: "string" } },
        macro_flow: { type: "array", minItems: 2, maxItems: 5, items: { type: "string" } },
        key_themes: { type: "array", minItems: 3, maxItems: 6, items: { type: "string" } },
        checkpoints: { type: "array", minItems: 3, maxItems: 6, items: { type: "string" } },
        hani_view: { type: "string" }
      },
      required: ["korea_market","us_market","major_events","macro_flow","key_themes","checkpoints","hani_view"]
    },
    entities: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          ticker: { type: "string" },
          market: { type: "string", enum: ["KR", "US", "OTHER"] },
          issuer_name: { type: "string" },
          issuer_ticker: { type: "string" },
          security_type: { type: "string", enum: ["COMMON", "PREFERRED", "OTHER"] },
          signal: { type: "string", enum: ["POSITIVE", "NEUTRAL", "NEGATIVE", "MIXED", "NO_NEWS"] },
          summary: { type: "string" },
          watch_point: { type: "string" },
          news: {
            type: "array",
            maxItems: 4,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                summary: { type: "string" },
                why_it_matters: { type: "string" },
                hani_view: { type: "string" },
                published_at: { type: "string" },
                source_name: { type: "string" },
                source_url: { type: "string" },
                source_grade: { type: "string", enum: ["OFFICIAL", "MEDIA", "BROKER", "RUMOR"] },
                sentiment: { type: "string", enum: ["POSITIVE", "NEUTRAL", "NEGATIVE", "MIXED"] },
                importance: { type: "integer", minimum: 1, maximum: 5 },
                event_type: { type: "string" },
                scope: { type: "string", enum: ["COMPANY_COMMON", "PREFERRED_DIRECT", "BOTH"] },
                comments: {
                  type: "array",
                  minItems: 1,
                  maxItems: 7,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      agent_key: { type: "string", enum: ["jieun","sua","hina","nauen","haru","suyeon","minji","yuna","arin"] },
                      agent_name: { type: "string" },
                      tone: { type: "string", enum: ["ANALYSIS","SHORT","BANTER","COUNTER","CAUTION"] },
                      comment: { type: "string" }
                    },
                    required: ["agent_key","agent_name","tone","comment"]
                  }
                }
              },
              required: [
                "title", "summary", "why_it_matters", "hani_view", "published_at", "source_name",
                "source_url", "source_grade", "sentiment", "importance", "event_type", "scope", "comments"
              ]
            }
          }
        },
        required: ["name", "ticker", "market", "issuer_name", "issuer_ticker", "security_type", "signal", "summary", "watch_point", "news"]
      }
    }
  },
  required: ["market_brief", "weekly_brief", "entities"]
};

function canonicalNewsUrl(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!/^https?:\/\//i.test(raw)) return "";
  try {
    const u = new URL(raw);
    u.hash = "";
    ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","gclid","fbclid"].forEach(k => u.searchParams.delete(k));
    return u.toString().replace(/\/$/, "");
  } catch (_) {
    return "";
  }
}

function normalizeNewsMarket(value: unknown): "KR" | "US" | "OTHER" {
  const v = String(value ?? "").trim().toUpperCase();
  return v === "KR" || v === "US" ? v : "OTHER";
}

function normalizeInvestmentNewsTargets(value: unknown) {
  const rows = Array.isArray(value) ? value : [];
  const seen = new Set<string>();
  const out: Array<{name:string;ticker:string;market:"KR"|"US"|"OTHER";reason:string;held:boolean;issuer_name:string;issuer_ticker:string;security_type:"COMMON"|"PREFERRED"|"OTHER"}> = [];
  for (const raw of rows) {
    const x = asObject(raw);
    const name = cleanText(x.name, 120);
    const ticker = cleanText(x.ticker, 40).toUpperCase();
    const market = normalizeNewsMarket(x.market);
    const reason = cleanText(x.reason, 900);
    const held = x.held === true;
    const issuer_name = cleanText(x.issuer_name, 120) || name;
    const issuer_ticker = cleanText(x.issuer_ticker, 40).toUpperCase() || ticker;
    const st = String(x.security_type ?? "").toUpperCase();
    const security_type: "COMMON"|"PREFERRED"|"OTHER" = st === "PREFERRED" ? "PREFERRED" : st === "COMMON" ? "COMMON" : "OTHER";
    if (!name) continue;
    const key = `${market}|${ticker || name.toLocaleLowerCase("ko-KR")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, ticker, market, reason, held, issuer_name, issuer_ticker, security_type });
    if (out.length >= 5) break;
  }
  return out;
}

async function runInvestmentNews(openaiKey: string, rawTargets: unknown, rawLookbackHours: unknown) {
  const targets = normalizeInvestmentNewsTargets(rawTargets);
  if (!targets.length) throw new Error("뉴스 추적 대상이 없습니다. 관심종목에서 뉴스 추적 종목을 먼저 선택해 주세요.");
  const requested = Number(rawLookbackHours);
  const lookbackHours = Number.isFinite(requested) ? Math.max(72, Math.min(168, Math.round(requested))) : 168;
  const drawCommentCount = () => {
    const r = crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
    if (r < 0.20) return 1;
    if (r < 0.45) return 2;
    if (r < 0.70) return 3;
    if (r < 0.82) return 4;
    if (r < 0.90) return 5;
    if (r < 0.96) return 6;
    return 7;
  };
  const commentCountPlan = Array.from({ length: 20 }, drawCommentCount);
  if (new Set(commentCountPlan.slice(0, 6)).size === 1) commentCountPlan[1] = commentCountPlan[0] === 2 ? 3 : 2;

  const instructions = [
    "당신은 PROJECT HANI의 Investment Newsroom v0.3 Research Utility입니다.",
    "한 번의 검색 결과로 ① 최근 7일 한국/미국 시장 종합 브리핑과 ② 사용자가 지정한 관심종목 최근 72시간 이벤트를 함께 만드세요.",
    "market_brief는 최근 7일 시장을 4~6문장으로 압축한 Executive Overview입니다. 한국/미국 흐름, 핵심 위험요인, 주요 수급 또는 정책 변수를 함께 포함하세요.",
    "weekly_brief.korea_market과 weekly_brief.us_market은 각각 최근 7일의 흐름·수급·대표 업종·핵심 동인을 3~5문장으로 충분히 설명하세요.",
    "weekly_brief.major_events는 이번 주 시장을 이해하는 데 필요한 주요 사건을 3~6개로 정리하세요. 각 항목은 사건과 시장 영향이 한눈에 보이게 1문장으로 작성하세요.",
    "weekly_brief.macro_flow는 금리·환율·유가·채권·외국인/기관 수급·정책처럼 시장 전체에 영향을 준 변수를 2~5개로 정리하세요.",
    "weekly_brief.key_themes는 3~6개, checkpoints는 다음 거래일/주간에 확인할 구체적 이벤트·지표를 3~6개로 작성하세요. 날짜를 모르면 추측하지 마세요.",
    "weekly_brief.hani_view는 사실 요약과 구분되는 HANI의 판단 코멘트입니다. 현재 시장에서 무엇을 우선 확인할지 3~5문장으로 작성하되 매수·매도 지시는 하지 마세요.",
    "관심종목은 최대 5개만 다룹니다. 각 종목 news는 최근 72시간의 투자판단에 의미 있는 신규 이벤트만 최대 4건 반환하세요.",
    "같은 사건을 여러 매체가 보도하면 하나로 합치고 가장 신뢰도 높은 원출처 또는 대표 출처를 선택하세요.",
    "PREFERRED 종목은 우선주 자체만 검색하지 마세요. issuer_name/issuer_ticker의 기업 공통 뉴스와 해당 우선주의 직접 요인(배당, 주주환원, 보통주-우선주 괴리, 유동성, 우선주 직접 공시)을 함께 검색하세요.",
    "우선주 뉴스 scope는 COMPANY_COMMON=발행회사 공통 영향, PREFERRED_DIRECT=우선주에 직접 해당, BOTH=둘 다로 구분하세요. 보통주는 보통 COMPANY_COMMON을 사용하세요.",
    "한국 종목은 한국어와 영어 검색을 함께 고려하고, 미국 종목은 영어 원문을 우선하세요.",
    "출처 등급은 엄격히 분리하세요: OFFICIAL=기업 IR/공시/거래소/정부·규제기관 공식자료, MEDIA=신뢰 가능한 언론, BROKER=증권사·애널리스트 전망/리포트, RUMOR=공식 확인이 없는 시장 루머.",
    "공식 확정과 전망·루머를 섞지 마세요. 제목만 자극적인 기사는 중요도를 낮추세요.",
    "sentiment는 해당 종목의 사업/실적/주가 재료 관점에서 POSITIVE/NEUTRAL/NEGATIVE/MIXED로 분류하되 매수·매도 지시를 하지 마세요.",
    "importance는 1~5. 5는 실적·가이던스·대형 수주·규제·자본정책·핵심 제품/기술처럼 투자논리를 바꿀 수 있는 사건에만 사용하세요.",
    "published_at은 출처에서 확인 가능한 경우 ISO 날짜/시간 또는 YYYY-MM-DD로 쓰고, 확인할 수 없으면 빈 문자열로 두세요. 날짜를 추측하지 마세요.",
    "source_url은 실제 검색으로 확인한 해당 출처 URL만 넣으세요. URL을 만들어내지 마세요.",
    "summary는 사실 중심 1~2문장, why_it_matters는 기존 투자논리에 왜 중요한지 1문장으로 쓰세요.",
    "각 뉴스의 hani_view는 반드시 작성하세요. 확인된 사실을 반복하기보다 ‘그래서 무엇을 더 확인해야 하는가’를 짧고 냉정하게 적으세요.",
    "각 뉴스의 comments 개수는 input.comment_count_plan을 뉴스 출력 순서대로 정확히 따르세요. 1~7개이며, 1~3개가 자주 나오고 4~5개는 가끔, 6~7개는 드물게 나오도록 서버가 이미 가중 랜덤으로 계획했습니다.",
    "여러 뉴스가 있을 때 댓글 수를 똑같이 맞추지 마세요. comments는 하니를 제외한 관련 Agent만 사용하고, 같은 Agent 조합이 매 기사 반복되지 않게 하고 한 뉴스 안에서 같은 Agent를 중복 배치하지 마세요.",
    "각 댓글에는 tone을 지정하세요: ANALYSIS=근거 중심 분석, SHORT=짧은 한마디, BANTER=가벼운 캐릭터 농담/반응, COUNTER=다른 관점/반론, CAUTION=리스크·확인사항.",
    "댓글이 3개 이상이면 ANALYSIS 외 tone을 최소 1개 섞고, 전체 응답에서도 ANALYSIS만 반복하지 마세요. 같은 tone이 기사마다 기계적으로 반복되지 않게 SHORT/BANTER/COUNTER/CAUTION을 적절히 분산하세요. 다만 규제·소송·대규모 손실 등 중대한 악재는 BANTER를 억지로 사용하지 마세요.",
    "SHORT와 BANTER는 한 문장 중심의 자연스러운 구어체·캐릭터 반응을 허용합니다. 모든 댓글을 증권사 리포트처럼 쓰지 마세요. COUNTER는 다른 댓글과 다른 관점을 제시하고, CAUTION은 확인할 리스크를 짚으세요.",
    "댓글 캐릭터: 지은=재무·가격·현금흐름·실적 확인, 수아=실제 계약/실행/사업화, 수연=전략·경쟁구도·후속 흐름, 하루=제품·실사용·소비자 반응, 히나=일본·학습/성장 맥락, 나은=건강/웰니스 산업만, 민지=미디어·콘텐츠·대중 반응, 유나=밝고 직관적인 신입 시선, 아린=제품/디자인/UX 맥락. 관련 없는 Agent를 억지로 넣지 마세요.",
    "댓글은 캐릭터 말투를 살리되 새로운 사실을 만들어내지 말고, 해당 뉴스의 summary/why_it_matters와 확인할 포인트 범위 안에서만 말하세요. 전문 분석과 짧은 반응이 자연스럽게 섞여 사내 게시판처럼 느껴지게 하세요.",
    "종목별 summary와 watch_point는 최신 뉴스 묶음을 종합하되, 의미 있는 신규 뉴스가 없으면 signal=NO_NEWS로 하고 news=[]로 두세요.",
    "관심 이유(reason)가 제공되면 그 투자 논리와 연결되는 변화에 우선순위를 두세요.",
    "결과는 지정된 JSON Schema만 따르세요."
  ].join("\n");

  const input = JSON.stringify({
    as_of: new Date().toISOString(),
    user_locale: "ko-KR",
    lookback_hours: lookbackHours,
    comment_count_plan: commentCountPlan,
    targets
  }, null, 2);

  const aiRes = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.6-luna",
      instructions,
      input,
      tools: [{
        type: "web_search",
        search_context_size: "low",
        user_location: {
          type: "approximate",
          country: "KR",
          timezone: "Asia/Seoul"
        }
      }],
      tool_choice: "required",
      include: ["web_search_call.action.sources"],
      max_output_tokens: 9500,
      reasoning: { effort: "none" },
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: "hani_investment_news",
          strict: true,
          schema: INVESTMENT_NEWS_SCHEMA
        }
      },
      store: false
    })
  });

  const aiJson = await aiRes.json().catch(() => ({}));
  if (!aiRes.ok) {
    throw new Error(`OpenAI News ${aiRes.status}: ${aiJson?.error?.message ?? "API 호출 실패"}`);
  }

  const outputText = extractOpenAIOutputText(aiJson);
  if (!outputText) throw new Error("Investment News 응답이 비어 있습니다.");
  let parsed: any;
  try { parsed = JSON.parse(outputText); }
  catch (_) { throw new Error("Investment News Structured Output JSON 파싱에 실패했습니다."); }

  const sources = extractWebSources(aiJson);
  const sourceMap = new Map<string, {url:string;title:string}>();
  for (const s of sources) {
    const key = canonicalNewsUrl(s.url);
    if (key) sourceMap.set(key, { url: s.url, title: s.title });
  }

  const seenEvents = new Set<string>();
  const validAgentKeys = new Set(["jieun","sua","hina","nauen","haru","suyeon","minji","yuna","arin"]);
  const validCommentTones = new Set(["ANALYSIS","SHORT","BANTER","COUNTER","CAUTION"]);
  let newsOrdinal = 0;
  const targetByKey = new Map(targets.map((t:any)=>[`${t.market}|${String(t.ticker||t.name).toUpperCase()}`,t]));
  const entities = (Array.isArray(parsed?.entities) ? parsed.entities : []).map((rawEntity: any) => {
    const entity = asObject(rawEntity);
    const market = normalizeNewsMarket(entity.market);
    const ticker = cleanText(entity.ticker, 40).toUpperCase();
    const target = targetByKey.get(`${market}|${String(ticker||cleanText(entity.name,120)).toUpperCase()}`) || targets.find((t:any)=>t.ticker===ticker) || {} as any;
    const news = (Array.isArray(entity.news) ? entity.news : []).map((rawNews: any) => {
      const item = asObject(rawNews);
      const candidateUrl = canonicalNewsUrl(item.source_url);
      const matchedSource = candidateUrl ? sourceMap.get(candidateUrl) : undefined;
      const plannedCommentCount = Math.max(1, Math.min(7, Number(commentCountPlan[newsOrdinal++]) || 2));
      const comments = (Array.isArray(item.comments) ? item.comments : []).map((rawComment:any)=>{
        const c=asObject(rawComment),key=cleanText(c.agent_key,30).toLowerCase(),tone=cleanText(c.tone,30).toUpperCase();
        if(!validAgentKeys.has(key))return null;
        return {
          agent_key:key,
          agent_name:cleanText(c.agent_name,40),
          tone:validCommentTones.has(tone)?tone:"ANALYSIS",
          comment:cleanText(c.comment,360)
        };
      }).filter(Boolean).slice(0,plannedCommentCount);
      return {
        title: cleanText(item.title, 240),
        summary: cleanText(item.summary, 700),
        why_it_matters: cleanText(item.why_it_matters, 500),
        hani_view: cleanText(item.hani_view, 700),
        published_at: cleanText(item.published_at, 64),
        source_name: cleanText(matchedSource?.title || item.source_name, 180),
        source_url: matchedSource?.url || "",
        source_verified: !!matchedSource,
        source_grade: ["OFFICIAL","MEDIA","BROKER","RUMOR"].includes(String(item.source_grade)) ? String(item.source_grade) : "MEDIA",
        sentiment: ["POSITIVE","NEUTRAL","NEGATIVE","MIXED"].includes(String(item.sentiment)) ? String(item.sentiment) : "NEUTRAL",
        importance: Math.max(1, Math.min(5, Math.round(Number(item.importance) || 1))),
        event_type: cleanText(item.event_type, 80),
        scope: ["COMPANY_COMMON","PREFERRED_DIRECT","BOTH"].includes(String(item.scope)) ? String(item.scope) : "COMPANY_COMMON",
        comments
      };
    }).filter((item: any) => {
      if (!item.title) return false;
      const key = `${ticker}|${item.title.toLocaleLowerCase("ko-KR").replace(/\s+/g," ").slice(0,180)}`;
      if (seenEvents.has(key)) return false;
      seenEvents.add(key);
      return true;
    }).slice(0, 4);
    const st=String(entity.security_type||target.security_type||"").toUpperCase();
    return {
      name: cleanText(entity.name, 120) || cleanText(target.name,120),
      ticker: ticker || cleanText(target.ticker,40).toUpperCase(),
      market,
      issuer_name: cleanText(entity.issuer_name,120) || cleanText(target.issuer_name,120) || cleanText(entity.name,120),
      issuer_ticker: cleanText(entity.issuer_ticker,40).toUpperCase() || cleanText(target.issuer_ticker,40).toUpperCase() || ticker,
      security_type: st === "PREFERRED" ? "PREFERRED" : st === "COMMON" ? "COMMON" : "OTHER",
      signal: ["POSITIVE","NEUTRAL","NEGATIVE","MIXED","NO_NEWS"].includes(String(entity.signal)) ? String(entity.signal) : (news.length ? "NEUTRAL" : "NO_NEWS"),
      summary: cleanText(entity.summary, 700),
      watch_point: cleanText(entity.watch_point, 500),
      news
    };
  }).slice(0, 5);

  return {
    generated_at: new Date().toISOString(),
    lookback_hours: lookbackHours,
    market_brief: cleanText(parsed?.market_brief, 1600),
    weekly_brief: {
      korea_market: cleanText(parsed?.weekly_brief?.korea_market, 1800),
      us_market: cleanText(parsed?.weekly_brief?.us_market, 1800),
      major_events: (Array.isArray(parsed?.weekly_brief?.major_events) ? parsed.weekly_brief.major_events : []).map((x:any)=>cleanText(x,360)).filter(Boolean).slice(0,6),
      macro_flow: (Array.isArray(parsed?.weekly_brief?.macro_flow) ? parsed.weekly_brief.macro_flow : []).map((x:any)=>cleanText(x,360)).filter(Boolean).slice(0,5),
      key_themes: (Array.isArray(parsed?.weekly_brief?.key_themes) ? parsed.weekly_brief.key_themes : []).map((x:any)=>cleanText(x,300)).filter(Boolean).slice(0,6),
      checkpoints: (Array.isArray(parsed?.weekly_brief?.checkpoints) ? parsed.weekly_brief.checkpoints : []).map((x:any)=>cleanText(x,320)).filter(Boolean).slice(0,6),
      hani_view: cleanText(parsed?.weekly_brief?.hani_view, 1600),
    },
    entities,
    sources: sources.slice(0, 30),
    model: String(aiJson?.model ?? "gpt-5.6-luna"),
    response_id: String(aiJson?.id ?? ""),
    usage: aiJson?.usage ?? null,
    web_status: String(aiJson?.status ?? "")
  };
}

async function runMarketResearch(openaiKey: string, existingCase: any) {
  // v0.6.1 deliberately separates "search" from "structuring".
  // Web search may return tool items + citation-bearing prose.
  // A second no-tool call converts that grounded research into strict JSON.
  const researchInstructions = [
    "당신은 PROJECT HANI의 Market Research Utility입니다.",
    "대한민국에서 현재 구매 가능한 65인치 OLED TV를 조사하세요.",
    "대표의 최신 Context와 원본 요청을 최우선으로 반영하세요.",
    "이번 안건은 영화/OTT와 콘솔 스포츠게임 경험, 예산, 구매방식, 시기를 함께 검토하는 구매 심의입니다.",
    "최신 모델, 실제 관측 가격, 공식 사양, 카드 무이자/구매형태처럼 변동 가능한 정보는 반드시 웹 검색 근거를 사용하세요.",
    "가능하면 LG전자·삼성전자 공식 한국 사이트와 다나와를 우선하세요.",
    "해외 가격은 한국 구매가격으로 사용하지 마세요.",
    "관측 가격과 출시가를 혼동하지 마세요.",
    "예산을 넘는 모델은 좋은 제품이어도 예산 초과라고 명시하세요.",
    "특정 판매점 한 곳의 일시적 혜택을 일반적인 시장가격처럼 단정하지 마세요.",
    "후보는 최대 5개만 조사하세요.",
    "이 단계에서는 JSON을 만들지 말고, 출처 기반의 간결한 조사 메모를 작성하세요.",
  ].join("\n");

  const researchInput = JSON.stringify({
    case: {
      case_code: existingCase.case_code,
      workflow: existingCase.workflow,
      title: existingCase.title,
      source_text: existingCase.source_text,
      context: existingCase.context,
      risk_level: existingCase.risk_level,
    },
    research_scope: {
      country: "KR",
      size_inches: 65,
      category: "OLED TV",
      topics: [
        "current Korean street price",
        "2025 and 2026 model candidates",
        "console sports gaming suitability",
        "movie OTT suitability",
        "install options",
        "interest-free installment or purchase options",
        "buy now versus wait",
      ],
    },
  }, null, 2);

  // -------------------------------------------------------
  // Stage A: web-grounded research memo
  // -------------------------------------------------------
  const researchRes = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.6-luna",
      instructions: researchInstructions,
      input: researchInput,
      tools: [
        {
          type: "web_search",
          search_context_size: "medium",
          user_location: {
            type: "approximate",
            country: "KR",
            timezone: "Asia/Seoul",
          },
          filters: {
            allowed_domains: ["lge.co.kr", "samsung.com", "danawa.com"],
          },
        },
      ],
      tool_choice: "auto",
      include: ["web_search_call.action.sources"],
      max_output_tokens: 2600,
      reasoning: { effort: "none" },
      text: { verbosity: "low" },
      store: false,
    }),
  });

  const researchJson = await researchRes.json().catch(() => ({}));
  if (!researchRes.ok) {
    throw new Error(
      `OpenAI Research ${researchRes.status}: ${researchJson?.error?.message ?? "API 호출 실패"}`
    );
  }

  const rawResearchText = extractOpenAIOutputText(researchJson);
  if (!rawResearchText) {
    throw new Error(
      `Market Research 메모가 비어 있습니다. status=${String(researchJson?.status ?? "unknown")}`
    );
  }

  const sources = extractWebSources(researchJson);

  // -------------------------------------------------------
  // Stage B: normalize grounded memo into strict JSON
  // -------------------------------------------------------
  const structureInstructions = [
    "당신은 PROJECT HANI의 Research Structuring Utility입니다.",
    "아래 WEB_RESEARCH_MEMO와 SOURCES만 사용해 구매심의용 구조화 데이터를 만드세요.",
    "새로운 사실, 모델, 가격, 프로모션을 추가로 추정하거나 생성하지 마세요.",
    "관측 가격이 메모에 명확하지 않으면 observed_price_krw=0, budget_fit=UNKNOWN으로 두세요.",
    "후보 모델명과 가격은 조사 메모에 실제로 등장한 것만 사용하세요.",
    "현재 대표 예산은 Context의 max_total_krw를 기준으로 판정하세요.",
    "결과는 지정된 JSON Schema만 따르세요.",
  ].join("\n");

  const structureInput = JSON.stringify({
    case: {
      case_code: existingCase.case_code,
      title: existingCase.title,
      context: existingCase.context,
    },
    web_research_memo: rawResearchText,
    sources,
  }, null, 2);

  const structured = await callStructuredJson(
    openaiKey,
    "hani_market_research",
    MARKET_RESEARCH_SCHEMA,
    structureInstructions,
    structureInput,
    2200,
  );

  return {
    parsed: structured.parsed as MarketResearchOutput,
    sources,
    raw_research_memo: rawResearchText.slice(0, 16000),
    web_response_id: String(researchJson?.id ?? ""),
    structure_response_id: structured.response_id,
    model: structured.model,
    web_model: String(researchJson?.model ?? "gpt-5.6-luna"),
    usage: usageTotals([
      { usage: researchJson?.usage ?? null },
      { usage: structured.usage ?? null },
    ]),
    web_status: String(researchJson?.status ?? ""),
    web_incomplete_details: researchJson?.incomplete_details ?? null,
  };
}


type RouterV2Output = {
  primary_intent: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  decision_target: string;
  purchase_decision_mode: "BUY_OR_NOT" | "SELECT_PRODUCT" | "UPGRADE_REPLACE" | "CONDITION_SEARCH" | "NOT_APPLICABLE";
  context_domains: string[];
  internal_data_requests: string[];
  external_research: "NONE" | "IF_NEEDED" | "REQUIRED";
  entity_resolution: {
    status: "RESOLVED" | "AMBIGUOUS" | "NONE";
    canonical_name: string;
    ticker: string;
    notes: string;
  };
  ambiguity_questions: string[];
  rationale_short: string;
};

const ROUTER_V2_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    primary_intent: { type: "string", enum: Array.from(WORKFLOWS) },
    risk_level: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
    decision_target: { type: "string" },
    purchase_decision_mode: { type: "string", enum: ["BUY_OR_NOT", "SELECT_PRODUCT", "UPGRADE_REPLACE", "CONDITION_SEARCH", "NOT_APPLICABLE"] },
    context_domains: {
      type: "array",
      maxItems: 8,
      items: {
        type: "string",
        enum: [
          "HEALTH", "EXERCISE", "FINANCE", "CASHFLOW", "UX", "EXPERIENCE",
          "TECH", "PRODUCT_TECH", "MARKET", "INVESTMENT", "STUDY", "TRAVEL",
          "CONTENT", "MEMORY", "PREFERENCE", "DATA", "GENERAL"
        ],
      },
    },
    internal_data_requests: {
      type: "array",
      maxItems: 8,
      items: {
        type: "string",
        enum: [
          "EXERCISE_RECENT_90D", "BODY_RECENT_90D", "INVESTMENT_CURRENT",
          "ASSET_CURRENT", "LEDGER_RECENT_90D", "CAMPUS_CURRENT",
          "TRAVEL_HISTORY", "CONTENT_HISTORY"
        ],
      },
    },
    external_research: { type: "string", enum: ["NONE", "IF_NEEDED", "REQUIRED"] },
    entity_resolution: {
      type: "object",
      additionalProperties: false,
      properties: {
        status: { type: "string", enum: ["RESOLVED", "AMBIGUOUS", "NONE"] },
        canonical_name: { type: "string" },
        ticker: { type: "string" },
        notes: { type: "string" },
      },
      required: ["status", "canonical_name", "ticker", "notes"],
    },
    ambiguity_questions: { type: "array", maxItems: 2, items: { type: "string" } },
    rationale_short: { type: "string" },
  },
  required: [
    "primary_intent", "risk_level", "decision_target", "purchase_decision_mode", "context_domains",
    "internal_data_requests", "external_research", "entity_resolution",
    "ambiguity_questions", "rationale_short"
  ],
};

const INTAKE_VISION_TARGETS = ["auto", "task", "body", "exercise", "book", "movie", "diary", "wishlist", "travelWish", "certificate", "university", "asset"] as const;
const INTAKE_VISION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    target_hint: { type: "string", enum: [...INTAKE_VISION_TARGETS] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    extracted_text: { type: "string" },
    structured_json: { type: "string" },
    warnings: { type: "array", maxItems: 6, items: { type: "string" } },
    financial_detected: { type: "boolean" },
  },
  required: ["target_hint", "confidence", "extracted_text", "structured_json", "warnings", "financial_detected"],
};

const nullableString = { type: ["string", "null"] };
const nullableNumber = { type: ["number", "null"] };
const ASSET_HOLDING_SCHEMA = {
  type: "object", additionalProperties: false,
  properties: {
    name: nullableString, ticker: nullableString, quantity: nullableNumber,
    averagePrice: nullableNumber, purchaseAmount: nullableNumber,
    valuationAmount: nullableNumber, profitLoss: nullableNumber, returnRate: nullableNumber,
  },
  required: ["name", "ticker", "quantity", "averagePrice", "purchaseAmount", "valuationAmount", "profitLoss", "returnRate"],
};
const ASSET_VISION_SCHEMA = {
  type: "object", additionalProperties: false,
  properties: {
    target_hint: { type: "string", enum: ["asset"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    extracted_text: { type: "string" },
    financialInstitution: nullableString, accountName: nullableString, accountType: nullableString,
    currentAsset: nullableNumber, balance: nullableNumber, asOfDate: nullableString,
    purchaseAmount: nullableNumber, principal: nullableNumber, valuationAmount: nullableNumber,
    profitLoss: nullableNumber, returnRate: nullableNumber,
    holdings: { type: "array", maxItems: 80, items: ASSET_HOLDING_SCHEMA },
    mismatch: nullableNumber,
    warnings: { type: "array", maxItems: 6, items: { type: "string" } },
    financial_detected: { type: "boolean" },
  },
  required: ["target_hint", "confidence", "extracted_text", "financialInstitution", "accountName", "accountType", "currentAsset", "balance", "asOfDate", "purchaseAmount", "principal", "valuationAmount", "profitLoss", "returnRate", "holdings", "mismatch", "warnings", "financial_detected"],
};

function validateAssetExtraction(parsed: any) {
  const purchase = Number.isFinite(parsed?.purchaseAmount) ? parsed.purchaseAmount : parsed?.principal;
  const current = Number.isFinite(parsed?.valuationAmount) ? parsed.valuationAmount : (Number.isFinite(parsed?.currentAsset) ? parsed.currentAsset : parsed?.balance);
  const pnl = parsed?.profitLoss;
  if (Number.isFinite(purchase) && Number.isFinite(pnl) && Number.isFinite(current)) {
    const mismatch = Math.abs(Math.round((purchase + pnl) - current));
    parsed.mismatch = mismatch;
    if (mismatch > 0) parsed.warnings = [...new Set([...(parsed.warnings || []), `화면에 표시된 값 사이에 ${mismatch.toLocaleString("ko-KR")}원의 차이가 있습니다. 원본 표시값을 확인해주세요.`])].slice(0, 6);
  } else parsed.mismatch = null;
  return parsed;
}

async function extractIntakeImage(openaiKey: string, imageDataUrl: string, targetHint: string, fileName: string) {
  const assetMode = targetHint === "asset";
  const instructions = (assetMode ? [
    "당신은 PROJECT HANI의 Asset Vision Extractor입니다. 계좌·통장·투자자산의 현재 상태만 읽습니다.",
    "은행 입출금·저축·파킹·CMA·예금·적금·증권 위탁·ISA·연금저축·IRP·보유종목 요약 화면만 지원합니다.",
    "카드 결제내역·영수증·소비내역·가계부 입력은 지원하지 말고, 모든 자산 필드를 null로 두고 warnings에 지원 범위 밖이라고 적으세요.",
    "화면에 실제로 보이는 값만 반환하세요. 못 읽은 값은 null이며 이름·날짜·숫자를 추측하지 마세요.",
    "currentAsset와 balance 중 화면 의미에 맞는 필드를 사용하고, 투자 화면은 purchaseAmount/principal/valuationAmount/profitLoss/returnRate를 보이는 경우에만 채우세요.",
    "화면 숫자를 산술적으로 고치지 마세요. 불일치는 원본값을 보존한 채 mismatch와 warnings로 알립니다.",
    "financial_detected는 true, target_hint는 asset으로 반환하세요. 저장이나 DB 쓰기는 하지 않습니다.",
  ] : [
    "당신은 PROJECT HANI의 AI Intake Vision Extractor입니다.",
    "사용자가 제공한 스크린샷/이미지를 읽고 HANI OS Preview용 데이터만 추출하세요.",
    "이미지에 실제로 보이는 정보만 사용하고, 보이지 않는 날짜·수치·이름을 추측하거나 만들어내지 마세요.",
    "지원 target은 task, body, exercise, book, movie, diary, wishlist, travelWish, certificate, university입니다.",
    "투자·주식·가계부·카드결제·계좌잔액 등 금융 기록이 주된 내용이면 financial_detected=true로 하고 structured_json은 반드시 [] 문자열로 반환하세요.",
    "target_hint가 auto가 아니면 그 대상을 우선 고려하되 이미지 내용과 명백히 충돌하면 warnings에 적고 실제 안전한 target_hint를 반환하세요.",
    "structured_json은 반드시 JSON 문자열이어야 하며, 가능하면 [{\"target\":\"body\",\"data\":{...}}] 형태의 배열 문자열로 작성하세요.",
    "body 필드: date, weight, fat, muscle. exercise: date, steps, distance, strength, note. book: title, author, status, rating, completedDate, review.",
    "movie: title, director, actors, status, rating, watchedDate, review, origin. diary: date, mood, title, content. wishlist: name, kind(item/experience), category, estimatedPrice, priority(high/medium/low), status(consider/planned/purchased/hold), reason, note, sourceType. travelWish: destination, reason, expectedDate, transport, places, foods, restaurants, lodging, note.",
    "certificate: name, issuer, grade, examDate, status, resultDate, score, result. task: text, due.",
    "university는 강의계획표·주차별 계획·과제/퀴즈/시험 공지용입니다. data는 semesterTerm, courseName, weeks, assessments 구조를 사용하세요.",
    "university.weeks 각 항목: week, startAt, endAt, topic, lectures(문자열 배열 권장), evaluation, reference. 화면에 보이는 1교시/2교시/3교시 제목은 lectures에 순서대로 보존하세요.",
    "university.assessments 각 항목: week, type(퀴즈/과제/중간고사/기말고사/시험), title, due, points, note. 마감일시가 화면에 보이면 YYYY-MM-DD HH:MM으로 보존하세요.",
    "대학교 자료에서 과목명이나 학기명이 화면에 명시되지 않았다면 추측하지 말고 courseName 또는 semesterTerm을 빈 문자열로 두고 warnings에 확인 필요를 적으세요.",
    "평가계획에 퀴즈/과제/시험만 표시되고 별도 마감일이 보이지 않으면 assessments에는 해당 평가를 넣되 due는 빈 문자열로 두세요. 수강 종료일을 평가 마감일로 추정하지 마세요.",
    "여러 주차가 한 이미지에 있으면 보이는 모든 주차를 weeks 배열에 빠짐없이 넣으세요. 표 머리글이나 빈 셀은 데이터로 만들지 마세요.",
    "날짜가 이미지에 없으면 빈 문자열로 두세요. 숫자는 단위를 제거한 숫자로 넣어도 됩니다.",
    "extracted_text에는 사람이 검토할 수 있도록 핵심 원문을 간결하게 보존하세요.",
    "결과는 지정된 JSON Schema만 따르세요.",
  ]).join("\n");

  const aiRes = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.6-luna",
      instructions,
      input: [{
        role: "user",
        content: [
          { type: "input_text", text: JSON.stringify({ target_hint: targetHint || "auto", file_name: fileName || "image" }) },
          { type: "input_image", image_url: imageDataUrl, detail: "high" },
        ],
      }],
      max_output_tokens: 2400,
      reasoning: { effort: "none" },
      text: { verbosity: "low", format: { type: "json_schema", name: assetMode ? "hani_asset_vision" : "hani_intake_vision", strict: true, schema: assetMode ? ASSET_VISION_SCHEMA : INTAKE_VISION_SCHEMA } },
      store: false,
    }),
  });
  const aiJson = await aiRes.json().catch(() => ({}));
  if (!aiRes.ok) throw new Error(`OpenAI ${aiRes.status}: ${aiJson?.error?.message ?? "Vision API 호출 실패"}`);
  const outputText = extractOpenAIOutputText(aiJson);
  if (!outputText) throw new Error("HANI Intake Vision 응답이 비어 있습니다.");
  let parsed: any;
  try { parsed = JSON.parse(outputText); } catch (_) { throw new Error("HANI Intake Vision JSON 파싱에 실패했습니다."); }
  if (assetMode) parsed = validateAssetExtraction(parsed);
  return { parsed, model: String(aiJson?.model ?? "gpt-5.6-luna"), response_id: String(aiJson?.id ?? ""), usage: aiJson?.usage ?? null };
}

async function extractIntakeText(openaiKey: string, sourceText: string, targetHint: string) {
  const instructions = [
    "당신은 PROJECT HANI의 Conversation Intake Extractor입니다.",
    "사용자가 붙여넣은 대화/메모에서 HANI OS Preview 후보만 구조화하세요. 저장이나 DB 쓰기는 절대 하지 않습니다.",
    "현재 주 목적은 wishlist입니다. target_hint가 wishlist이면 구매할 것, 읽고 싶은 책, 해보고 싶은 경험 후보를 추출하세요.",
    "단순 언급과 실제 관심/추천 후보를 구분하세요. 사용자가 '이 대화 바탕으로 Wish-list 후보 정리'처럼 명시하면 대화에서 추천된 유력 후보를 포함할 수 있습니다.",
    "사용자가 이미 샀다고 명확히 말하지 않는 한 status는 consider로 두세요. 살지 말지 고민 중인 것은 consider, 구매/실행을 확정했다고 명확히 말한 경우만 planned입니다.",
    "가격은 원문에 명시된 경우에만 estimatedPrice에 숫자로 넣고, 모르면 null 또는 빈 값으로 두세요. 가격·저자·모델명을 추측하지 마세요.",
    "wishlist 각 data 필드: name, kind(item/experience), category, estimatedPrice, priority(high/medium/low), status(consider/planned/purchased/hold), reason, note, sourceType.",
    "sourceType은 conversation으로 두세요. reason은 왜 후보인지 1~2문장으로 요약하고 원문 전체를 복사하지 마세요.",
    "중복되는 같은 후보는 하나로 합치세요. 최대 12개까지만 반환하세요.",
    "structured_json은 반드시 JSON 문자열이며 [{\"target\":\"wishlist\",\"data\":{...}}] 형태의 배열 문자열이어야 합니다.",
    "사용자가 구매를 원하는 게 아니라 계좌잔액·카드명세·투자보유현황 같은 금융 원장 입력을 요구하는 내용이 주된 경우 financial_detected=true로 하고 wishlist 후보는 만들지 마세요.",
    "extracted_text에는 후보 판단에 필요한 핵심 요약만 남기세요. 개인정보나 계좌번호를 재출력하지 마세요.",
    "결과는 지정된 JSON Schema만 따르세요.",
  ].join("\n");

  const result = await callStructuredJson(
    openaiKey,
    "hani_intake_text",
    INTAKE_VISION_SCHEMA,
    instructions,
    JSON.stringify({ target_hint: targetHint || "wishlist", source_text: sourceText }),
    1800,
  );
  return { parsed: result.parsed, model: result.model, response_id: result.response_id, usage: result.usage };
}

async function classifyRequestV2(openaiKey: string, sourceText: string) {
  const instructions = [
    "당신은 PROJECT HANI Router v2의 Natural Language Intent Classifier입니다.",
    "가장 먼저 사용자가 궁극적으로 무엇을 결정하거나 하려는지 Primary Intent를 정하세요.",
    "건강/운동/재무 같은 단어가 등장해도 그것이 목적의 맥락인지, 실제 Primary Intent인지 구분하세요.",
    "예: '다이어트를 위해 자전거를 사고 싶다'는 PURCHASE_REVIEW이며 HEALTH/EXERCISE는 Context Domain입니다.",
    "예: 'AWS 주식을 사도 될까'는 INVESTMENT_REVIEW입니다. AWS가 Amazon.com Inc.(AMZN)를 뜻하는지 확실하지 않으면 entity_resolution=AMBIGUOUS로 표시하세요.",
    "예: '65인치 TV 사고 싶다'는 PURCHASE_REVIEW + UX/PRODUCT_TECH/FINANCE/MARKET입니다.",
    "PURCHASE_REVIEW이면 purchase_decision_mode를 반드시 분류하세요: BUY_OR_NOT=구매 자체가 미정('살까 말까?'), SELECT_PRODUCT=구매는 확정이고 무엇을 살지 선택('사야 하는데 뭐가 좋아?'), UPGRADE_REPLACE=기존 제품 교체/업그레이드 가치 판단, CONDITION_SEARCH=가격·크기·기능 등 조건으로 후보를 탐색. 구매안건이 아니면 NOT_APPLICABLE입니다.",
    "SELECT_PRODUCT/CONDITION_SEARCH에서는 단순히 가격이 언급됐다는 이유만으로 FINANCE/CASHFLOW 내부자료를 요구하지 마세요. 사용자가 구매여력·현금흐름 판단을 요청했거나 실제 재무 충돌이 의사결정에 필요한 경우에만 재무 Context를 요청하세요.",
    "HANI OS 내부기록이 의사결정에 실제 도움이 되는 경우만 internal_data_requests를 선택하세요.",
    "최신 가격·공시·제품·영업시간·시장정보처럼 외부 최신성이 결론에 중요하면 external_research=REQUIRED로 두세요.",
    "IF_NEEDED는 있으면 개선되지만 1차 결론 자체에는 필수가 아닌 경우입니다.",
    "ambiguity_questions는 Primary Intent 또는 Entity 자체를 결정할 수 없고 대표만 답할 수 있을 때만 최대 2개 작성하세요.",
    "PURCHASE_REVIEW의 구매 목적·사용 시나리오 질문은 Router 단계에서 미리 묻지 말고, HANI OS 내부자료와 1차 Agent Review를 본 뒤 Preflight가 판단하게 하세요. 제품 후보·가격·링크는 대표에게 질문하지 마세요.",
    "키워드 우선 분류를 하지 말고 문장 전체의 목적을 이해하세요.",
    "결과는 지정된 JSON Schema만 따르세요.",
  ].join("\n");

  return await callStructuredJson(
    openaiKey,
    "hani_router_v2",
    ROUTER_V2_SCHEMA,
    instructions,
    JSON.stringify({ source_text: sourceText }, null, 2),
    900,
  );
}

type GenericResearchOutput = {
  as_of: string;
  summary: string;
  procurement: {
    purpose_interpretation: string;
    recommended_category: string;
    decision_mode: string;
    selection_criteria: string[];
    evaluation_axes: Array<{ key: string; label: string; emoji: string; weight: number; reason: string }>;
  };
  entity_resolution: { canonical_name: string; ticker: string; status: string; notes: string };
  findings: Array<{ topic: string; finding: string; evidence_quality: string }>;
  candidate_options: Array<{
    name: string;
    category: string;
    observed_price_krw: number;
    price_basis: string;
    strengths: string[];
    limits: string[];
    fit: string;
  }>;
  timing_or_market_notes: string[];
  unresolved: string[];
};

const GENERIC_RESEARCH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    as_of: { type: "string" },
    summary: { type: "string" },
    procurement: {
      type: "object", additionalProperties: false,
      properties: {
        purpose_interpretation: { type: "string" },
        recommended_category: { type: "string" },
        decision_mode: { type: "string" },
        selection_criteria: { type: "array", maxItems: 6, items: { type: "string" } },
        evaluation_axes: {
          type: "array", maxItems: 6,
          items: {
            type: "object", additionalProperties: false,
            properties: {
              key: { type: "string" }, label: { type: "string" }, emoji: { type: "string" },
              weight: { type: "number", minimum: 0, maximum: 1 }, reason: { type: "string" },
            },
            required: ["key", "label", "emoji", "weight", "reason"],
          },
        },
      },
      required: ["purpose_interpretation", "recommended_category", "decision_mode", "selection_criteria", "evaluation_axes"],
    },
    entity_resolution: {
      type: "object",
      additionalProperties: false,
      properties: {
        canonical_name: { type: "string" }, ticker: { type: "string" },
        status: { type: "string" }, notes: { type: "string" },
      },
      required: ["canonical_name", "ticker", "status", "notes"],
    },
    findings: {
      type: "array", maxItems: 10,
      items: {
        type: "object", additionalProperties: false,
        properties: {
          topic: { type: "string" }, finding: { type: "string" }, evidence_quality: { type: "string" },
        },
        required: ["topic", "finding", "evidence_quality"],
      },
    },
    candidate_options: {
      type: "array", maxItems: 5,
      items: {
        type: "object", additionalProperties: false,
        properties: {
          name: { type: "string" }, category: { type: "string" },
          observed_price_krw: { type: "integer", minimum: 0 }, price_basis: { type: "string" },
          strengths: { type: "array", maxItems: 4, items: { type: "string" } },
          limits: { type: "array", maxItems: 4, items: { type: "string" } },
          fit: { type: "string" },
        },
        required: ["name", "category", "observed_price_krw", "price_basis", "strengths", "limits", "fit"],
      },
    },
    timing_or_market_notes: { type: "array", maxItems: 6, items: { type: "string" } },
    unresolved: { type: "array", maxItems: 6, items: { type: "string" } },
  },
  required: ["as_of", "summary", "procurement", "entity_resolution", "findings", "candidate_options", "timing_or_market_notes", "unresolved"],
};

async function runGenericResearch(openaiKey: string, existingCase: any) {
  const researchInstructions = [
    "당신은 PROJECT HANI External Research Utility입니다.",
    "원본 요청과 Router v2 분류, HANI OS 내부 Context를 바탕으로 현재 의사결정에 필요한 최신 외부정보만 조사하세요.",
    "공식/1차 자료를 우선하고, 공식 정보가 부족하면 신뢰할 수 있는 주요 매체·전문 비교 자료를 보조로 사용하세요.",
    "한국 사용자의 구매/생활 맥락에서는 대한민국 기준 가격·출시·서비스 조건을 우선하세요.",
    "투자안건이면 회사/티커/entity를 먼저 확인하고 최신 가격·공시·실적·주요 뉴스 중 판단에 필요한 것만 조사하세요.",
    "구매안건에서는 당신이 AI 구매팀(PROCUREMENT)입니다. 대표에게 후보를 찾아오라고 하지 말고, 확인된 구매 목적·사용 시나리오·예산·신체/공간 조건에 맞는 실제 판매 후보 3~5개를 직접 찾으세요.",
    "Router의 purchase_decision_mode가 SELECT_PRODUCT/CONDITION_SEARCH이면 구매 필요성보다 후보 간 차이를 조사하세요. BUY_OR_NOT이면 구매 필요성과 대안도 함께 조사하되 산다면 후보를 제시하세요.",
    "제품군과 사용 목적에 따라 평가축을 설계할 근거도 조사하세요. 예: 이어폰은 음질/ANC/마이크/착용감/디자인/가치, TV는 화질/게임/스포츠/디자인/사운드/가치처럼 달라질 수 있습니다. 항상 같은 축을 강제하지 마세요.",
    "구매 후보마다 현재 관측가격, 사이즈/허용하중/핵심사양 등 목적 적합성, 제약, A/S 또는 구매 전 확인사항을 조사하세요. 값이 불명확하면 불명확하다고 표시하세요.",
    "구매 목적/환경이 아직 불명확해서 실내자전거와 야외자전거처럼 카테고리가 달라질 수 있으면 임의로 카테고리를 확정하지 말고 unresolved에 '대표 사용 시나리오 확인 필요'를 남기세요.",
    "여행/학사/기술안건이면 현재 일정·운영시간·공식 문서 등 변동 가능한 사실을 우선 확인하세요.",
    "사용자가 직접 제공해야 하는 사적 사실을 웹에서 추정하지 마세요.",
    "이 단계에서는 JSON을 만들지 말고 출처 기반의 간결한 조사 메모를 작성하세요.",
  ].join("\n");

  const researchInput = JSON.stringify({
    case: {
      case_code: existingCase.case_code,
      workflow: existingCase.workflow,
      title: existingCase.title,
      source_text: existingCase.source_text,
      context: compactContextForAgentReview(existingCase.context),
      risk_level: existingCase.risk_level,
    },
  }, null, 2);

  const researchRes = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.6-luna",
      instructions: researchInstructions,
      input: researchInput,
      tools: [{
        type: "web_search",
        search_context_size: "medium",
        user_location: { type: "approximate", country: "KR", timezone: "Asia/Seoul" },
      }],
      tool_choice: "auto",
      include: ["web_search_call.action.sources"],
      max_output_tokens: 2600,
      reasoning: { effort: "none" },
      text: { verbosity: "low" },
      store: false,
    }),
  });

  const researchJson = await researchRes.json().catch(() => ({}));
  if (!researchRes.ok) {
    throw new Error(`OpenAI Research ${researchRes.status}: ${researchJson?.error?.message ?? "API 호출 실패"}`);
  }
  const memo = extractOpenAIOutputText(researchJson);
  if (!memo) throw new Error("External Research 메모가 비어 있습니다.");
  const sources = extractWebSources(researchJson);

  const structureInstructions = [
    "당신은 PROJECT HANI Research Structuring Utility입니다.",
    "WEB_RESEARCH_MEMO와 SOURCES에 실제로 근거한 내용만 구조화하세요.",
    "가격이 명확하지 않으면 observed_price_krw=0으로 두세요.",
    "투자안건의 ticker/entity는 메모에서 확인되지 않으면 빈 문자열/AMBIGUOUS로 두세요.",
    "PURCHASE_REVIEW에서는 구매 목적/사용 시나리오가 충분히 확인되었다면 candidate_options에 실제 후보 3~5개를 넣으세요. 불명확해 카테고리 자체가 달라질 수 있을 때만 빈 배열을 허용하고 unresolved에 이유를 적으세요.",
    "PURCHASE_REVIEW의 procurement.decision_mode에는 Router의 purchase_decision_mode를 그대로 보존하세요.",
    "PURCHASE_REVIEW의 evaluation_axes는 제품군과 목적에 맞는 4~6개 축을 만드세요. key는 영문 대문자/언더스코어의 짧은 식별자, label은 한국어, emoji는 한 개, weight는 중요도 0~1입니다. 디자인·가성비를 무조건 넣지 말고 실제 선택에 의미 있을 때 넣으세요. PURPOSE_FIT 또는 동등한 목적 적합 축은 일반적으로 포함하세요.",
    "구매안건이 아니면 procurement.purpose_interpretation/recommended_category는 빈 문자열, decision_mode=NOT_APPLICABLE, selection_criteria/evaluation_axes/candidate_options는 빈 배열이어도 됩니다.",
    "새로운 사실을 추정해서 추가하지 마세요.",
    "결과는 지정된 JSON Schema만 따르세요.",
  ].join("\n");

  const structured = await callStructuredJson(
    openaiKey,
    "hani_external_research",
    GENERIC_RESEARCH_SCHEMA,
    structureInstructions,
    JSON.stringify({
      case: {
        case_code: existingCase.case_code, workflow: existingCase.workflow, title: existingCase.title,
        source_text: existingCase.source_text,
        purchase_decision_mode: String((asObject(asObject(existingCase.context).router_v2) as any).purchase_decision_mode || "NOT_APPLICABLE"),
      },
      web_research_memo: memo,
      sources,
    }, null, 2),
    2200,
  );

  return {
    parsed: structured.parsed as GenericResearchOutput,
    sources,
    raw_research_memo: memo.slice(0, 16000),
    web_response_id: String(researchJson?.id ?? ""),
    structure_response_id: structured.response_id,
    model: structured.model,
    web_model: String(researchJson?.model ?? "gpt-5.6-luna"),
    usage: usageTotals([{ usage: researchJson?.usage ?? null }, { usage: structured.usage ?? null }]),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method !== "POST") {
    return json({ ok: false, error: "METHOD_NOT_ALLOWED", message: "POST 요청만 허용됩니다." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const publishableKey = getDefaultKey("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
  const secretKey = getDefaultKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !publishableKey) {
    return json({ ok: false, error: "SERVER_CONFIG_ERROR", message: "Supabase 인증 환경 변수를 확인할 수 없습니다." }, 500);
  }

  const auth = await getAuthenticatedUser(req, supabaseUrl, publishableKey);
  if (!auth.user) {
    return json({ ok: false, error: "INVALID_SESSION", message: auth.error }, 401);
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch (_) { body = {}; }
  const action = cleanText(body.action || "health", 64).toLowerCase();

  if (action === "health") {
    return json({
      ok: true,
      service: "PROJECT HANI",
      function: "hani-agent-orchestrator",
      version: "1.7.0",
      phase: "INVESTMENT_NEWS_V0_3_PURCHASE_REVIEW_V2",
      authenticated: true,
      user_id: auth.user.id,
      hani_state_write_enabled: false,
      llm_enabled: true,
      message: "Investment Newsroom v0.3 + Adaptive Policy Engine v0.2 정상.",
      timestamp: new Date().toISOString(),
    });
  }

  // -------------------------------------------------------
  // OpenAI connectivity check: no DB write
  // -------------------------------------------------------
  if (action === "openai_health") {
    const openaiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
    if (!openaiKey) {
      return json({
        ok: false,
        error: "OPENAI_SECRET_MISSING",
        message: "OPENAI_API_KEY Secret을 확인할 수 없습니다.",
      }, 500);
    }

    const startedAt = Date.now();
    const aiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        input: [
          {
            role: "system",
            content: "You are PROJECT HANI connectivity checker. Follow the user's exact response instruction."
          },
          {
            role: "user",
            content: "Reply with exactly HANI_OK and nothing else."
          }
        ],
        max_output_tokens: 16,
        reasoning: { effort: "none" },
        text: { verbosity: "low" },
        store: false
      }),
    });

    const aiJson = await aiRes.json().catch(() => ({}));
    if (!aiRes.ok) {
      console.error("OpenAI health failed", aiRes.status, aiJson);
      return json({
        ok: false,
        error: "OPENAI_CALL_FAILED",
        status: aiRes.status,
        message: aiJson?.error?.message ?? "OpenAI API 호출에 실패했습니다.",
      }, 502);
    }

    const outputText = extractOpenAIOutputText(aiJson);
    const passed = outputText === "HANI_OK";

    return json({
      ok: passed,
      service: "PROJECT HANI",
      function: "hani-agent-orchestrator",
      version: "1.7.0",
      action: "OPENAI_HEALTH",
      model: aiJson?.model ?? "gpt-5.6-luna",
      response_status: aiJson?.status ?? null,
      output_text: outputText,
      usage: aiJson?.usage ?? null,
      latency_ms: Date.now() - startedAt,
      db_write: false,
      hani_state_touched: false,
      message: passed
        ? "OpenAI API 연결 및 응답 검증 성공."
        : "OpenAI API는 정상 응답했지만 추출된 텍스트가 예상한 HANI_OK와 일치하지 않습니다.",
      output_item_count: Array.isArray(aiJson?.output) ? aiJson.output.length : 0,
    }, passed ? 200 : 502);
  }

  if (action === "classify_request") {
    const openaiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
    if (!openaiKey) return json({ ok: false, error: "OPENAI_SECRET_MISSING", message: "OPENAI_API_KEY Secret을 확인할 수 없습니다." }, 500);
    const sourceText = cleanText(body.source_text, 12000);
    if (!sourceText) return json({ ok: false, error: "SOURCE_REQUIRED", message: "분류할 사용자 원문이 필요합니다." }, 400);
    const startedAt = Date.now();
    try {
      const result = await classifyRequestV2(openaiKey, sourceText);
      const parsed = result.parsed as RouterV2Output;
      if (!WORKFLOWS.has(String(parsed.primary_intent))) throw new Error("Router v2가 지원하지 않는 workflow를 반환했습니다.");
      if (!RISK_LEVELS.has(String(parsed.risk_level))) throw new Error("Router v2 risk_level이 올바르지 않습니다.");
      return json({
        ok: true, service: "PROJECT HANI", function: "hani-agent-orchestrator", version: "1.7.0",
        action: "CLASSIFY_REQUEST", router: parsed, usage: result.usage, model: result.model,
        latency_ms: Date.now() - startedAt, db_write: false, hani_state_touched: false,
        message: "Router v2가 Primary Intent, Context Domain, 내부 데이터 요청, Research 정책을 분류했습니다.",
      });
    } catch (e) {
      console.error("classify_request failure", e);
      return json({ ok: false, error: "ROUTER_V2_FAILED", message: e instanceof Error ? e.message : "Router v2 분류에 실패했습니다.", hani_state_touched: false }, 502);
    }
  }

  if (action === "extract_intake_image") {
    const openaiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
    if (!openaiKey) return json({ ok: false, error: "OPENAI_SECRET_MISSING", message: "OPENAI_API_KEY Secret을 확인할 수 없습니다." }, 500);
    const rawImage = cleanText(body.image_data_url, 3500000);
    const targetHintRaw = cleanText(body.target_hint || "auto", 32);
    const targetHint = (INTAKE_VISION_TARGETS as readonly string[]).includes(targetHintRaw) ? targetHintRaw : "auto";
    const fileName = cleanText(body.file_name || "image", 160);
    if (!rawImage) return json({ ok: false, error: "IMAGE_REQUIRED", message: "분석할 이미지가 필요합니다." }, 400);
    if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/i.test(rawImage)) {
      return json({ ok: false, error: "INVALID_IMAGE_DATA", message: "PNG·JPG·WEBP base64 data URL만 허용됩니다." }, 400);
    }
    if (rawImage.length >= 3499000) return json({ ok: false, error: "IMAGE_TOO_LARGE", message: "Vision 전송 이미지가 너무 큽니다. 더 작은 캡처를 사용해 주세요." }, 413);
    const startedAt = Date.now();
    try {
      const result = await extractIntakeImage(openaiKey, rawImage, targetHint, fileName);
      return json({
        ok: true, service: "PROJECT HANI", function: "hani-agent-orchestrator", version: "1.7.0",
        action: "EXTRACT_INTAKE_IMAGE", extraction: result.parsed, usage: result.usage, model: result.model,
        response_id: result.response_id, latency_ms: Date.now() - startedAt,
        db_write: false, hani_state_touched: false,
        message: "스크린샷/이미지를 AI Intake Preview용 구조화 데이터로 추출했습니다. Life OS 데이터는 변경하지 않았습니다.",
      });
    } catch (e) {
      console.error("extract_intake_image failure", e);
      return json({ ok: false, error: "INTAKE_VISION_FAILED", message: e instanceof Error ? e.message : "이미지 분석에 실패했습니다.", hani_state_touched: false }, 502);
    }
  }

  if (action === "extract_intake_text") {
    const openaiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
    if (!openaiKey) return json({ ok: false, error: "OPENAI_SECRET_MISSING", message: "OPENAI_API_KEY Secret을 확인할 수 없습니다." }, 500);
    const sourceText = cleanText(body.source_text, 18000);
    const targetHintRaw = cleanText(body.target_hint || "wishlist", 32);
    const targetHint = (INTAKE_VISION_TARGETS as readonly string[]).includes(targetHintRaw) ? targetHintRaw : "wishlist";
    if (!sourceText) return json({ ok: false, error: "SOURCE_REQUIRED", message: "구조화할 대화/원문이 필요합니다." }, 400);
    const startedAt = Date.now();
    try {
      const result = await extractIntakeText(openaiKey, sourceText, targetHint);
      return json({
        ok: true, service: "PROJECT HANI", function: "hani-agent-orchestrator", version: "1.7.0",
        action: "EXTRACT_INTAKE_TEXT", extraction: result.parsed, usage: result.usage, model: result.model,
        response_id: result.response_id, latency_ms: Date.now() - startedAt,
        db_write: false, hani_state_touched: false,
        message: "대화/원문에서 Preview 후보를 구조화했습니다. Life OS 데이터는 변경하지 않았습니다.",
      });
    } catch (e) {
      console.error("extract_intake_text failure", e);
      return json({ ok: false, error: "INTAKE_TEXT_FAILED", message: e instanceof Error ? e.message : "대화 구조화에 실패했습니다.", hani_state_touched: false }, 502);
    }
  }


  // -------------------------------------------------------
  // Investment News Feed v0.1: authenticated, read-only web research.
  // No hani_state write. Client keeps a non-authoritative 3-hour cache.
  // -------------------------------------------------------
  if (action === "investment_news") {
    const openaiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
    if (!openaiKey) {
      return json({
        ok: false,
        error: "OPENAI_SECRET_MISSING",
        message: "OPENAI_API_KEY Secret을 확인할 수 없습니다.",
      }, 500);
    }

    const startedAt = Date.now();
    try {
      const result = await runInvestmentNews(openaiKey, body.targets, body.lookback_hours);
      return json({
        ok: true,
        service: "PROJECT HANI",
        function: "hani-agent-orchestrator",
        version: "1.7.0",
        action: "INVESTMENT_NEWS",
        news: result,
        latency_ms: Date.now() - startedAt,
        db_write: false,
        hani_state_touched: false,
        cache_policy_seconds: 10800,
        message: "관심종목 최신 뉴스를 검색·중복정리·등급화했습니다. Life OS 데이터는 변경하지 않았습니다.",
      });
    } catch (e) {
      console.error("investment_news failure", e);
      return json({
        ok: false,
        error: "INVESTMENT_NEWS_FAILED",
        message: e instanceof Error ? e.message : "투자 뉴스 검색에 실패했습니다.",
        hani_state_touched: false,
      }, 502);
    }
  }

  if (!secretKey) {
    return json({ ok: false, error: "SERVER_SECRET_MISSING", message: "Supabase Secret Key를 확인할 수 없습니다." }, 500);
  }

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  if (action === "create_case") {
    const workflow = cleanText(body.workflow || "GENERAL_REVIEW", 64).toUpperCase();
    const title = cleanText(body.title, 200);
    const riskLevel = cleanText(body.risk_level || "LOW", 16).toUpperCase();
    const sourceType = cleanText(body.source_type || "USER_TEXT", 32).toUpperCase();
    const sourceText = cleanText(body.source_text, 20000);
    const context = asObject(body.context);

    if (!WORKFLOWS.has(workflow)) return json({ ok: false, error: "INVALID_WORKFLOW", message: "지원하지 않는 workflow입니다." }, 400);
    if (!RISK_LEVELS.has(riskLevel)) return json({ ok: false, error: "INVALID_RISK_LEVEL", message: "risk_level 값이 올바르지 않습니다." }, 400);
    if (!SOURCE_TYPES.has(sourceType)) return json({ ok: false, error: "INVALID_SOURCE_TYPE", message: "source_type 값이 올바르지 않습니다." }, 400);
    if (!title) return json({ ok: false, error: "TITLE_REQUIRED", message: "안건 제목이 필요합니다." }, 400);
    if (!sourceText && sourceType === "USER_TEXT") return json({ ok: false, error: "SOURCE_REQUIRED", message: "사용자 원문이 필요합니다." }, 400);

    const caseCode = makeCaseCode(workflow);

    const { data: createdCase, error: caseError } = await admin
      .from("hani_agent_cases")
      .insert({
        user_id: auth.user.id,
        case_code: caseCode,
        workflow,
        title,
        status: "DRAFT",
        risk_level: riskLevel,
        source_type: sourceType,
        source_text: sourceText || null,
        context,
        routing: {},
        verification: {},
        hani_final: {},
      })
      .select("id,case_code,workflow,title,status,risk_level,source_type,created_at")
      .single();

    if (caseError || !createdCase) {
      console.error("create_case insert failed", caseError);
      return json({ ok: false, error: "CASE_CREATE_FAILED", message: "Agent Case 생성에 실패했습니다.", detail: caseError?.message ?? null }, 500);
    }

    const { error: eventError } = await admin.from("hani_agent_events").insert({
      user_id: auth.user.id,
      case_id: createdCase.id,
      event_type: "CASE_CREATED",
      actor_type: "USER",
      actor_key: "REPRESENTATIVE",
      payload: { workflow, risk_level: riskLevel, source_type: sourceType },
    });

    return json({
      ok: true,
      service: "PROJECT HANI",
      function: "hani-agent-orchestrator",
      version: "1.7.0",
      action: "CREATE_CASE",
      case: createdCase,
      event_logged: !eventError,
      hani_state_touched: false,
      llm_called: false,
      message: "검토 안건을 Agent Workspace에 안전하게 접수했습니다.",
    }, 201);
  }

  if (action === "route_case") {
    const caseId = cleanText(body.case_id, 64);
    if (!caseId) return json({ ok: false, error: "CASE_ID_REQUIRED", message: "case_id가 필요합니다." }, 400);

    const { data: existingCase, error: readError } = await admin
      .from("hani_agent_cases")
      .select("id,user_id,case_code,workflow,title,status,risk_level,source_text,context,routing")
      .eq("id", caseId)
      .eq("user_id", auth.user.id)
      .single();

    if (readError || !existingCase) {
      return json({ ok: false, error: "CASE_NOT_FOUND", message: "본인 소유의 안건을 찾지 못했습니다." }, 404);
    }

    if (!["DRAFT", "ANALYZING"].includes(existingCase.status)) {
      return json({
        ok: false,
        error: "INVALID_CASE_STATUS",
        message: `현재 상태(${existingCase.status})에서는 Routing을 다시 실행하지 않습니다.`,
      }, 409);
    }

    const routing = buildRouting({
      workflow: existingCase.workflow,
      risk_level: existingCase.risk_level,
      title: existingCase.title,
      source_text: existingCase.source_text,
      context: asObject(existingCase.context),
    });

    const { data: updatedCase, error: updateError } = await admin
      .from("hani_agent_cases")
      .update({
        routing,
        status: "ANALYZING",
      })
      .eq("id", existingCase.id)
      .eq("user_id", auth.user.id)
      .select("id,case_code,workflow,title,status,risk_level,routing,updated_at")
      .single();

    if (updateError || !updatedCase) {
      console.error("route_case update failed", updateError);
      return json({ ok: false, error: "ROUTING_SAVE_FAILED", message: "Routing 결과 저장에 실패했습니다.", detail: updateError?.message ?? null }, 500);
    }

    const { error: eventError } = await admin.from("hani_agent_events").insert({
      user_id: auth.user.id,
      case_id: existingCase.id,
      event_type: "ROUTING_COMPLETED",
      actor_type: "ROUTER",
      actor_key: "ROUTING_ENGINE_V0.9.1",
      payload: {
        selected_agents: routing.selected_agents,
        chair: routing.chair,
        verification: routing.verification,
        router_v2: routing.router_v2,
      },
    });

    return json({
      ok: true,
      service: "PROJECT HANI",
      function: "hani-agent-orchestrator",
      version: "1.7.0",
      action: "ROUTE_CASE",
      case: updatedCase,
      selected_agents: routing.selected_agents,
      chair: routing.chair,
      verification: routing.verification,
      event_logged: !eventError,
      hani_state_touched: false,
      llm_called: false,
      message: "Routing Engine이 필요한 Agent를 결정했습니다.",
    });
  }



  if (action === "preflight_case") {
    const openaiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
    if (!openaiKey) return json({ ok: false, error: "OPENAI_SECRET_MISSING", message: "OPENAI_API_KEY Secret을 확인할 수 없습니다." }, 500);
    const caseId = cleanText(body.case_id, 64);
    if (!caseId) return json({ ok: false, error: "CASE_ID_REQUIRED", message: "case_id가 필요합니다." }, 400);

    const { data: existingCase, error: caseError } = await admin
      .from("hani_agent_cases")
      .select("id,user_id,case_code,workflow,title,status,risk_level,source_type,source_text,context,routing")
      .eq("id", caseId).eq("user_id", auth.user.id).single();
    if (caseError || !existingCase) return json({ ok: false, error: "CASE_NOT_FOUND", message: "본인 소유의 안건을 찾지 못했습니다." }, 404);
    if (existingCase.status !== "REVIEW_COMPLETE") return json({ ok: false, error: "INVALID_CASE_STATUS", message: `현재 상태(${existingCase.status})에서는 Preflight를 실행하지 않습니다.` }, 409);

    const { data: allReviews, error: reviewsError } = await admin
      .from("hani_agent_reviews")
      .select("review_round,agent_key,agent_rank,role,provider,model,verdict,confidence,summary,reasons,risks,conditions,missing_data,evidence,candidate_scores,escalation,hard_stop,notes,created_at")
      .eq("case_id", existingCase.id).eq("user_id", auth.user.id)
      .order("review_round", { ascending: false }).order("created_at", { ascending: true });
    if (reviewsError || !allReviews?.length) return json({ ok: false, error: "REVIEWS_REQUIRED", message: "Preflight에 사용할 Agent Review가 없습니다." }, 409);
    const latestReviewRound = Math.max(...allReviews.map((x: any) => Number(x.review_round || 1)));
    const reviews = allReviews.filter((x: any) => Number(x.review_round || 1) === latestReviewRound);

    let result: any;
    try {
      result = await runVerification(openaiKey, existingCase, reviews);
    } catch (e) {
      return json({ ok: false, error: "PREFLIGHT_FAILED", message: e instanceof Error ? e.message : "Preflight 생성에 실패했습니다." }, 502);
    }
    const raw = result.parsed as VerificationOutput;
    const caseAdjusted = applyCasePolicyToVerification(raw, existingCase.context);
    const owned = applyInformationOwnershipPolicy(caseAdjusted, existingCase);
    const bounded = applyHumanQuestionBudgetPolicy(owned, existingCase, latestReviewRound, false);
    const verification = normalizeVerification(bounded);
    const humanQuestions = verification.human_required_questions || verification.consolidated_questions || [];
    const researchItems = verification.research_required_items || verification.research_items || [];

    const { data: updatedCase, error: updateError } = await admin
      .from("hani_agent_cases")
      .update({
        verification_status: verification.status,
        verification: { ...verification, stage: "PREFLIGHT", preflight_at: new Date().toISOString() },
        hani_final: {},
        status: "REVIEW_COMPLETE",
      })
      .eq("id", existingCase.id).eq("user_id", auth.user.id)
      .select("id,case_code,status,verification_status,verification,updated_at").single();
    if (updateError || !updatedCase) return json({ ok: false, error: "PREFLIGHT_SAVE_FAILED", message: "Preflight 저장에 실패했습니다.", detail: updateError?.message ?? null }, 500);

    await admin.from("hani_agent_events").insert({
      user_id: auth.user.id, case_id: existingCase.id,
      event_type: "PURPOSE_PREFLIGHT_COMPLETED", actor_type: "UTILITY", actor_key: "PREFLIGHT_V0.9.1",
      payload: { review_round: latestReviewRound, human_required_count: humanQuestions.length, research_required_count: researchItems.length, research_blocking: verification.research_blocking },
    });

    return json({
      ok: true, service: "PROJECT HANI", function: "hani-agent-orchestrator", version: "1.7.0",
      action: "PREFLIGHT_CASE", case: updatedCase, verification: updatedCase.verification,
      human_required_questions: humanQuestions, research_required_items: researchItems,
      can_auto_research: humanQuestions.length === 0 && (verification.research_needed || researchItems.length > 0),
      hani_state_touched: false,
      message: humanQuestions.length
        ? "대표만 알 수 있는 구매 목적/사용환경을 먼저 확인합니다. 제품 후보 탐색은 답변 후 AI 구매팀이 수행합니다."
        : "대표 추가질문 없이 AI 구매팀/Research 단계로 진행할 수 있습니다.",
    });
  }

  if (action === "run_reviews") {
    const openaiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
    if (!openaiKey) {
      return json({
        ok: false,
        error: "OPENAI_SECRET_MISSING",
        message: "OPENAI_API_KEY Secret을 확인할 수 없습니다.",
      }, 500);
    }

    const caseId = cleanText(body.case_id, 64);
    const reviewRound = Math.max(1, Math.min(20, Number(body.review_round || 1)));

    if (!caseId) {
      return json({ ok: false, error: "CASE_ID_REQUIRED", message: "case_id가 필요합니다." }, 400);
    }

    const { data: existingCase, error: readError } = await admin
      .from("hani_agent_cases")
      .select("id,user_id,case_code,workflow,title,status,risk_level,source_type,source_text,context,routing")
      .eq("id", caseId)
      .eq("user_id", auth.user.id)
      .single();

    if (readError || !existingCase) {
      return json({ ok: false, error: "CASE_NOT_FOUND", message: "본인 소유의 안건을 찾지 못했습니다." }, 404);
    }

    if (existingCase.status !== "ANALYZING") {
      return json({
        ok: false,
        error: "INVALID_CASE_STATUS",
        message: `현재 상태(${existingCase.status})에서는 Agent Review를 실행하지 않습니다.`,
      }, 409);
    }

    const activePolicySnapshot = await loadActivePolicySnapshot(admin, auth.user.id, existingCase.workflow);
    attachPolicySnapshot(existingCase, activePolicySnapshot);
    const context = asObject(existingCase.context);
    if (reviewRound === 2) {
      const routerV2 = asObject((context as any).router_v2);
      const researchPolicy = String((routerV2 as any).external_research || "NONE").toUpperCase();
      const hasResearch =
        Object.keys(asObject((context as any).external_research)).length > 0 ||
        Object.keys(asObject((context as any).market_research)).length > 0;
      if (researchPolicy === "REQUIRED" && !hasResearch) {
        return json({
          ok: false,
          error: "EXTERNAL_RESEARCH_REQUIRED",
          message: "Router v2가 필수로 지정한 External Research가 아직 없습니다.",
        }, 409);
      }
    }

    const routing = asObject(existingCase.routing);
    const selectedAgents = Array.isArray((routing as any).selected_agents)
      ? (routing as any).selected_agents
      : [];

    if (!selectedAgents.length) {
      return json({
        ok: false,
        error: "ROUTING_REQUIRED",
        message: "먼저 Routing Engine을 실행해야 합니다.",
      }, 409);
    }

    if (selectedAgents.length > 5) {
      return json({
        ok: false,
        error: "TOO_MANY_AGENTS_FOR_PILOT",
        message: "Pilot은 한 번에 최대 5명의 전문 Agent만 실행합니다.",
      }, 409);
    }

    const { data: priorReviews, error: priorError } = await admin
      .from("hani_agent_reviews")
      .select("id,agent_key,review_round")
      .eq("case_id", existingCase.id)
      .eq("user_id", auth.user.id)
      .eq("review_round", reviewRound)
      .limit(10);

    if (priorError) {
      return json({
        ok: false,
        error: "REVIEW_PRECHECK_FAILED",
        message: "기존 Review 여부 확인에 실패했습니다.",
        detail: priorError.message,
      }, 500);
    }

    if (priorReviews?.length) {
      return json({
        ok: false,
        error: "REVIEWS_ALREADY_EXIST",
        message: `이 안건의 ${reviewRound}차 Agent Review가 이미 존재합니다. 중복 API 호출을 중단했습니다.`,
        existing_agents: priorReviews.map((x: any) => x.agent_key),
        review_round: reviewRound,
      }, 409);
    }

    const startedAt = Date.now();

    let results: any[];
    try {
      results = await Promise.all(
        selectedAgents.map((agent: any) => callAgentReview(openaiKey, existingCase, agent))
      );
    } catch (e) {
      console.error("run_reviews OpenAI failure", e);
      return json({
        ok: false,
        error: "AGENT_REVIEW_GENERATION_FAILED",
        message: e instanceof Error ? e.message : "Agent Review 생성에 실패했습니다.",
        review_round: reviewRound,
        db_write: false,
        hani_state_touched: false,
      }, 502);
    }

    const rows = results.map((x: any) => ({
      user_id: auth.user.id,
      case_id: existingCase.id,
      review_round: reviewRound,
      agent_key: x.agent.agent_key,
      agent_rank: x.agent.rank || null,
      role: x.agent.role,
      provider: x.provider,
      model: x.model,
      verdict: x.review.verdict,
      confidence: x.review.confidence,
      summary: x.review.summary,
      reasons: x.review.reasons,
      risks: x.review.risks,
      conditions: x.review.conditions,
      missing_data: x.review.missing_data,
      evidence: x.review.evidence,
      candidate_scores: Array.isArray(x.review.candidate_scores) ? x.review.candidate_scores : [],
      escalation: x.review.escalation?.requested
        ? {
            requested_agent: x.review.escalation.requested_agent,
            reason: x.review.escalation.reason,
          }
        : null,
      hard_stop: x.review.hard_stop,
      notes: x.review.notes || null,
    }));

    const { data: writtenReviews, error: reviewWriteError } = await admin
      .from("hani_agent_reviews")
      .insert(rows)
      .select("id,review_round,agent_key,agent_rank,role,provider,model,verdict,confidence,summary,reasons,risks,conditions,missing_data,evidence,candidate_scores,escalation,hard_stop,created_at");

    if (reviewWriteError || !writtenReviews) {
      console.error("run_reviews DB insert failed", reviewWriteError);
      return json({
        ok: false,
        error: "REVIEW_SAVE_FAILED",
        message: "Agent Review 저장에 실패했습니다.",
        detail: reviewWriteError?.message ?? null,
        review_round: reviewRound,
        hani_state_touched: false,
      }, 500);
    }

    const { data: updatedCase, error: statusError } = await admin
      .from("hani_agent_cases")
      .update({ status: "REVIEW_COMPLETE", context: existingCase.context })
      .eq("id", existingCase.id)
      .eq("user_id", auth.user.id)
      .select("id,case_code,status,updated_at")
      .single();

    const totals = usageTotals(results);

    const { error: eventError } = await admin.from("hani_agent_events").insert({
      user_id: auth.user.id,
      case_id: existingCase.id,
      event_type: reviewRound === 1
        ? "AGENT_REVIEWS_COMPLETED"
        : "AGENT_REVIEWS_ROUND2_COMPLETED",
      actor_type: "SYSTEM",
      actor_key: "AGENT_REVIEW_ENGINE_V1.0.0",
      payload: {
        review_round: reviewRound,
        agents: results.map((x: any) => ({
          agent_key: x.agent.agent_key,
          provider: x.provider,
          model: x.model,
          verdict: x.review.verdict,
          confidence: x.review.confidence,
          response_id: x.response_id,
          retry_used: Boolean(x.retry_used),
        })),
        compact_research_context: reviewRound === 2,
        active_policy_registry_available: Boolean(activePolicySnapshot?.available),
        active_policy_count: Array.isArray(activePolicySnapshot?.policies) ? activePolicySnapshot.policies.length : 0,
        usage: totals,
        latency_ms: Date.now() - startedAt,
      },
    });

    return json({
      ok: true,
      service: "PROJECT HANI",
      function: "hani-agent-orchestrator",
      version: "1.7.0",
      action: "RUN_REVIEWS",
      review_round: reviewRound,
      case: updatedCase ?? {
        id: existingCase.id,
        case_code: existingCase.case_code,
        status: statusError ? existingCase.status : "REVIEW_COMPLETE",
      },
      reviews: writtenReviews,
      usage: totals,
      status_updated: !statusError,
      event_logged: !eventError,
      warning: statusError
        ? "Review는 저장됐지만 Case 상태 갱신에 실패했습니다. Review 데이터는 삭제하지 않고 보존합니다."
        : eventError
        ? "Review와 상태는 저장됐지만 Audit Event 기록에 실패했습니다."
        : null,
      hani_state_touched: false,
      representative_decision_created: false,
      agent_identity_source: "SERVER_ROUTING_METADATA",
      compact_context_used: reviewRound === 2,
      active_policy_count: Array.isArray(activePolicySnapshot?.policies) ? activePolicySnapshot.policies.length : 0,
      retries_used: results.filter((x: any) => Boolean(x.retry_used)).map((x: any) => x.agent.agent_key),
      message: `${reviewRound}차 전문 Agent 독립 Review 제출을 완료했습니다.`,
    });
  }


  if (action === "verify_and_synthesize") {
    const openaiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
    if (!openaiKey) {
      return json({
        ok: false,
        error: "OPENAI_SECRET_MISSING",
        message: "OPENAI_API_KEY Secret을 확인할 수 없습니다.",
      }, 500);
    }

    const caseId = cleanText(body.case_id, 64);
    if (!caseId) {
      return json({ ok: false, error: "CASE_ID_REQUIRED", message: "case_id가 필요합니다." }, 400);
    }

    const { data: existingCase, error: caseError } = await admin
      .from("hani_agent_cases")
      .select("id,user_id,case_code,workflow,title,status,risk_level,source_type,source_text,context,routing,verification_status,verification,hani_final")
      .eq("id", caseId)
      .eq("user_id", auth.user.id)
      .single();

    if (caseError || !existingCase) {
      return json({ ok: false, error: "CASE_NOT_FOUND", message: "본인 소유의 안건을 찾지 못했습니다." }, 404);
    }

    if (existingCase.status !== "REVIEW_COMPLETE") {
      return json({
        ok: false,
        error: "INVALID_CASE_STATUS",
        message: `현재 상태(${existingCase.status})에서는 Verification을 실행하지 않습니다.`,
      }, 409);
    }

    const existingHaniFinal = asObject(existingCase.hani_final);
    const forceReverify = body.force_reverify === true;

    if (
      (existingCase.verification_status || Object.keys(existingHaniFinal).length > 0) &&
      !forceReverify
    ) {
      return json({
        ok: false,
        error: "VERIFICATION_ALREADY_EXISTS",
        message: "이 안건의 Verification 또는 HANI Synthesis가 이미 존재합니다. 재검증하려면 force_reverify=true가 필요합니다.",
        verification_status: existingCase.verification_status,
      }, 409);
    }

    if (forceReverify && existingCase.status !== "REVIEW_COMPLETE") {
      return json({
        ok: false,
        error: "REVERIFY_STATUS_BLOCKED",
        message: "재검증은 REVIEW_COMPLETE 상태에서만 허용됩니다.",
      }, 409);
    }

    const { data: allReviews, error: reviewsError } = await admin
      .from("hani_agent_reviews")
      .select("review_round,agent_key,agent_rank,role,provider,model,verdict,confidence,summary,reasons,risks,conditions,missing_data,evidence,candidate_scores,escalation,hard_stop,notes,created_at")
      .eq("case_id", existingCase.id)
      .eq("user_id", auth.user.id)
      .order("review_round", { ascending: false })
      .order("created_at", { ascending: true });

    if (reviewsError || !allReviews?.length) {
      return json({
        ok: false,
        error: "REVIEWS_REQUIRED",
        message: "Verification에 사용할 Agent Review를 찾지 못했습니다.",
        detail: reviewsError?.message ?? null,
      }, 409);
    }

    const latestReviewRound = Math.max(...allReviews.map((x: any) => Number(x.review_round || 1)));
    const reviews = allReviews.filter((x: any) => Number(x.review_round || 1) === latestReviewRound);

    const activePolicySnapshot = await loadActivePolicySnapshot(admin, auth.user.id, existingCase.workflow);
    attachPolicySnapshot(existingCase, activePolicySnapshot);
    const startedAt = Date.now();

    let verificationResult: any;
    let haniResult: any;
    let rawVerification: VerificationOutput;
    let verification: VerificationOutput;
    let verificationNormalized = false;

    try {
      // 1) Verification model output
      verificationResult = await runVerification(openaiKey, existingCase, reviews);
      rawVerification = verificationResult.parsed as VerificationOutput;

      // 2) Server governance/policy normalization MUST happen before HANI sees it.
      const policyAdjustedVerification = applyCasePolicyToVerification(
        rawVerification,
        existingCase.context,
      );
      const ownershipAdjustedVerification = applyInformationOwnershipPolicy(
        policyAdjustedVerification,
        existingCase,
      );
      const forceFinalizeWithCurrentContext = body.force_finalize_with_current_context === true;
      const questionBudgetAdjustedVerification = applyHumanQuestionBudgetPolicy(
        ownershipAdjustedVerification,
        existingCase,
        latestReviewRound,
        forceFinalizeWithCurrentContext,
      );
      const forceFinalizedVerification = applyForceFinalizeCurrentContextPolicy(
        questionBudgetAdjustedVerification,
        existingCase,
        forceFinalizeWithCurrentContext,
      );
      verification = normalizeVerification(forceFinalizedVerification);
      verificationNormalized =
        rawVerification.status !== verification.status ||
        JSON.stringify(rawVerification.decision_blockers || []) !==
          JSON.stringify(verification.decision_blockers || []) ||
        JSON.stringify(rawVerification.consolidated_questions || []) !==
          JSON.stringify(verification.consolidated_questions || []);

      // 3) HANI synthesizes against the FINAL normalized Verification,
      //    never against the raw model verdict.
      haniResult = await runHaniSynthesis(
        openaiKey,
        existingCase,
        reviews,
        verification,
      );
    } catch (e) {
      console.error("verify_and_synthesize OpenAI failure", e);
      return json({
        ok: false,
        error: "VERIFY_SYNTHESIS_GENERATION_FAILED",
        message: e instanceof Error ? e.message : "Verification/HANI Synthesis 생성에 실패했습니다.",
        db_write: false,
        hani_state_touched: false,
      }, 502);
    }

    const parsedHani = { ...haniResult.parsed } as HaniSynthesisOutput;
    if (verification.status === "PASS") {
      parsedHani.representative_questions = [];
      if (parsedHani.recommendation === "NEEDS_DATA") parsedHani.recommendation = "CONDITIONAL";
      parsedHani.ready_for_decision = true;
    }
    const scorecard = purchaseScorecard(existingCase, reviews, parsedHani);
    const haniFinal = {
      ...parsedHani,
      ...(scorecard ? { purchase_scorecard: scorecard } : {}),
      generated_by: "HANI",
      display_name: "하니",
      rank: "부장",
      role: "CHIEF_OF_STAFF",
      provider: "OPENAI",
      model: haniResult.model,
      generated_at: new Date().toISOString(),
      verification_status: verification.status,
    };

    const nextStatus =
      verification.status === "PASS" && haniFinal.ready_for_decision
        ? "AWAITING_APPROVAL"
        : "REVIEW_COMPLETE";

    const { data: updatedCase, error: updateError } = await admin
      .from("hani_agent_cases")
      .update({
        context: existingCase.context,
        verification_status: verification.status,
        verification,
        hani_final: haniFinal,
        status: nextStatus,
      })
      .eq("id", existingCase.id)
      .eq("user_id", auth.user.id)
      .select("id,case_code,status,verification_status,verification,hani_final,updated_at")
      .single();

    if (updateError || !updatedCase) {
      console.error("verify_and_synthesize DB update failed", updateError);
      return json({
        ok: false,
        error: "VERIFY_SYNTHESIS_SAVE_FAILED",
        message: "Verification/HANI Synthesis 저장에 실패했습니다.",
        detail: updateError?.message ?? null,
        hani_state_touched: false,
      }, 500);
    }

    const policySync = await syncPolicyLearningCandidates(
      admin,
      auth.user.id,
      existingCase,
      haniFinal.policy_learning_candidates,
    );
    const policyEvidenceUpdate = await applyPolicyEvidence(
      admin,
      auth.user.id,
      existingCase,
      haniFinal.policy_evidence,
    );
    await recordPolicyApplications(admin, auth.user.id, existingCase);

    const usage = usageTotals([
      { usage: verificationResult.usage },
      { usage: haniResult.usage },
    ]);

    const eventRows = [
      {
        user_id: auth.user.id,
        case_id: existingCase.id,
        event_type: "VERIFICATION_COMPLETED",
        actor_type: "UTILITY",
        actor_key: "VERIFICATION_ENGINE_V1.2.0",
        payload: {
          status: verification.status,
          raw_status: rawVerification.status,
          normalized: verificationNormalized,
          case_policy_applied: true,
          research_blocking: verification.research_blocking,
          decision_blocker_count: verification.decision_blockers.length,
          conditional_check_count: verification.conditional_checks.length,
          optimization_question_count: verification.optimization_questions.length,
          anomaly_count: verification.anomalies.length,
          critical_anomaly_count: verification.critical_anomalies.length,
          review_round: latestReviewRound,
          research_needed: verification.research_needed,
          question_count: verification.human_required_questions.length,
          research_required_count: verification.research_required_items.length,
          force_finalize_with_current_context: body.force_finalize_with_current_context === true,
          response_id: verificationResult.response_id,
          model: verificationResult.model,
        },
      },
      {
        user_id: auth.user.id,
        case_id: existingCase.id,
        event_type: "HANI_SYNTHESIS_COMPLETED",
        actor_type: "AGENT",
        actor_key: "HANI",
        payload: {
          recommendation: haniFinal.recommendation,
          review_round: latestReviewRound,
          ready_for_decision: haniFinal.ready_for_decision,
          response_id: haniResult.response_id,
          model: haniResult.model,
          next_status: nextStatus,
          verification_input_status: verification.status,
          raw_verification_status: rawVerification.status,
        },
      },
      ...(policySync.created > 0 ? [{
        user_id: auth.user.id,
        case_id: existingCase.id,
        event_type: "POLICY_DRAFTS_CREATED",
        actor_type: "AGENT",
        actor_key: "HANI",
        payload: {
          created: policySync.created,
          existing: policySync.existing,
          policy_ids: policySync.ids,
          registry_available: policySync.available,
        },
      }] : []),
    ];

    const { error: eventError } = await admin
      .from("hani_agent_events")
      .insert(eventRows);

    return json({
      ok: true,
      service: "PROJECT HANI",
      function: "hani-agent-orchestrator",
      version: "1.7.0",
      action: "VERIFY_AND_SYNTHESIZE",
      case: {
        id: updatedCase.id,
        case_code: updatedCase.case_code,
        status: updatedCase.status,
        verification_status: updatedCase.verification_status,
      },
      review_round_used: latestReviewRound,
      verification_normalized: verificationNormalized,
      raw_verification_status: rawVerification.status,
      hani_verification_input_status: verification.status,
      verification_triage: {
        decision_blockers: verification.decision_blockers.length,
        conditional_checks: verification.conditional_checks.length,
        optimization_questions: verification.optimization_questions.length,
        human_required_questions: verification.human_required_questions.length,
        research_required_items: verification.research_required_items.length,
        anomalies: verification.anomalies.length,
        critical_anomalies: verification.critical_anomalies.length,
      },
      verification: updatedCase.verification,
      hani_final: updatedCase.hani_final,
      policy_registry: {
        active_count: Array.isArray(activePolicySnapshot?.policies) ? activePolicySnapshot.policies.length : 0,
        draft_sync_created: policySync.created,
        draft_sync_existing: policySync.existing,
        available: policySync.available,
      },
      usage,
      event_logged: !eventError,
      hani_state_touched: false,
      representative_decision_created: false,
      commit_executed: false,
      message: updatedCase.status === "AWAITING_APPROVAL"
        ? "Verification과 하니 부장 Executive Synthesis가 완료되어 대표 결재 대기 상태입니다."
        : "Verification과 하니 부장 Executive Synthesis가 완료되었습니다. 실제 의사결정 차단 정보가 남아 있어 아직 대표 결재 단계로 넘기지 않았습니다.",
    });
  }


  if (action === "apply_representative_context") {
    const caseId = cleanText(body.case_id, 64);
    const representativeContext = asObject(body.representative_context);

    if (!caseId) {
      return json({ ok: false, error: "CASE_ID_REQUIRED", message: "case_id가 필요합니다." }, 400);
    }

    if (!Object.keys(representativeContext).length) {
      return json({ ok: false, error: "CONTEXT_REQUIRED", message: "representative_context가 필요합니다." }, 400);
    }

    const { data: existingCase, error: caseError } = await admin
      .from("hani_agent_cases")
      .select("id,user_id,case_code,status,context")
      .eq("id", caseId)
      .eq("user_id", auth.user.id)
      .single();

    if (caseError || !existingCase) {
      return json({ ok: false, error: "CASE_NOT_FOUND", message: "본인 소유의 안건을 찾지 못했습니다." }, 404);
    }

    if (!["REVIEW_COMPLETE", "ANALYZING"].includes(existingCase.status)) {
      return json({
        ok: false,
        error: "INVALID_CASE_STATUS",
        message: `현재 상태(${existingCase.status})에서는 Context 보완을 적용하지 않습니다.`,
      }, 409);
    }

    const currentContext = asObject(existingCase.context);
    const priorHistory = Array.isArray((currentContext as any).representative_answer_history)
      ? (currentContext as any).representative_answer_history : [];
    const previousLatest = asObject((currentContext as any).representative_answers);
    const historyWithPrevious = Object.keys(previousLatest).length
      ? [...priorHistory, previousLatest]
      : priorHistory;
    const previousReviewRound = Number((representativeContext as any).previous_review_round || 0);
    const priorHumanRounds = Number((currentContext as any).human_question_round_count || 0);
    const inferredHumanRounds = previousReviewRound >= 2 ? previousReviewRound - 1 : 0;
    const humanQuestionRoundCount = Math.max(priorHumanRounds + 1, inferredHumanRounds);
    const mergedContext = {
      ...currentContext,
      representative_answers: representativeContext,
      representative_answer_history: historyWithPrevious.slice(-12),
      human_question_round_count: humanQuestionRoundCount,
      representative_answers_updated_at: new Date().toISOString(),
    };

    const { data: updatedCase, error: updateError } = await admin
      .from("hani_agent_cases")
      .update({
        context: mergedContext,
        status: "ANALYZING",
        verification_status: null,
        verification: {},
        hani_final: {},
      })
      .eq("id", existingCase.id)
      .eq("user_id", auth.user.id)
      .select("id,case_code,status,context,verification_status,updated_at")
      .single();

    if (updateError || !updatedCase) {
      return json({
        ok: false,
        error: "CONTEXT_SAVE_FAILED",
        message: "대표 추가 Context 저장에 실패했습니다.",
        detail: updateError?.message ?? null,
      }, 500);
    }

    const { error: eventError } = await admin
      .from("hani_agent_events")
      .insert({
        user_id: auth.user.id,
        case_id: existingCase.id,
        event_type: "REPRESENTATIVE_CONTEXT_APPLIED",
        actor_type: "USER",
        actor_key: "REPRESENTATIVE",
        payload: {
          keys: Object.keys(representativeContext),
          verification_reset: true,
          hani_final_reset: true,
          human_question_round_count: humanQuestionRoundCount,
          answer_memory_preserved: true,
        },
      });

    return json({
      ok: true,
      service: "PROJECT HANI",
      function: "hani-agent-orchestrator",
      version: "1.7.0",
      action: "APPLY_REPRESENTATIVE_CONTEXT",
      case: updatedCase,
      event_logged: !eventError,
      old_reviews_preserved: true,
      hani_state_touched: false,
      message: "대표 추가정보를 Context에 반영했습니다. 기존 Review 이력은 모두 보존했습니다.",
    });
  }

  if (action === "research_case") {
    const openaiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
    if (!openaiKey) {
      return json({ ok: false, error: "OPENAI_SECRET_MISSING", message: "OPENAI_API_KEY Secret을 확인할 수 없습니다." }, 500);
    }

    const caseId = cleanText(body.case_id, 64);
    if (!caseId) return json({ ok: false, error: "CASE_ID_REQUIRED", message: "case_id가 필요합니다." }, 400);

    const { data: existingCase, error: caseError } = await admin
      .from("hani_agent_cases")
      .select("id,user_id,case_code,workflow,title,status,risk_level,source_type,source_text,context")
      .eq("id", caseId)
      .eq("user_id", auth.user.id)
      .single();

    if (caseError || !existingCase) {
      return json({ ok: false, error: "CASE_NOT_FOUND", message: "본인 소유의 안건을 찾지 못했습니다." }, 404);
    }
    // Auto-Research runs AFTER round-1 reviews, and run_reviews intentionally moves
    // the case to REVIEW_COMPLETE. Therefore Research must accept both states.
    // research_case itself returns the case to ANALYZING before round-2 reviews.
    if (!["ANALYZING", "REVIEW_COMPLETE"].includes(existingCase.status)) {
      return json({ ok: false, error: "INVALID_CASE_STATUS", message: `현재 상태(${existingCase.status})에서는 Research를 실행하지 않습니다.` }, 409);
    }

    const context = asObject(existingCase.context);
    const forceRefresh = body.force_refresh === true;
    const currentResearch = asObject((context as any).external_research);
    if (Object.keys(currentResearch).length && !forceRefresh) {
      return json({ ok: false, error: "RESEARCH_ALREADY_EXISTS", message: "이 안건의 External Research가 이미 존재합니다. 중복 검색을 중단했습니다." }, 409);
    }

    const startedAt = Date.now();
    let researchResult: any;
    try {
      researchResult = await runGenericResearch(openaiKey, existingCase);
    } catch (e) {
      console.error("research_case failure", e);
      return json({ ok: false, error: "EXTERNAL_RESEARCH_FAILED", message: e instanceof Error ? e.message : "External Research 생성에 실패했습니다.", db_write: false, hani_state_touched: false }, 502);
    }

    const researchRecord = {
      ...researchResult.parsed,
      sources: researchResult.sources,
      provider: "OPENAI",
      model: researchResult.model,
      web_model: researchResult.web_model,
      web_response_id: researchResult.web_response_id,
      structure_response_id: researchResult.structure_response_id,
      raw_research_memo: researchResult.raw_research_memo,
      researched_at: new Date().toISOString(),
    };

    const priorHistory = Array.isArray((context as any).external_research_history)
      ? (context as any).external_research_history
      : [];
    const nextHistory = Object.keys(currentResearch).length && forceRefresh
      ? [...priorHistory, { ...currentResearch, superseded_at: new Date().toISOString() }].slice(-8)
      : priorHistory;
    const nextContext = {
      ...context,
      external_research: researchRecord,
      external_research_history: nextHistory,
      external_research_refresh_reason: forceRefresh ? cleanText(body.reason, 120) || "FORCE_REFRESH" : null,
    };
    const { data: updatedCase, error: updateError } = await admin
      .from("hani_agent_cases")
      .update({ context: nextContext, status: "ANALYZING" })
      .eq("id", existingCase.id)
      .eq("user_id", auth.user.id)
      .select("id,case_code,status,context,updated_at")
      .single();

    if (updateError || !updatedCase) {
      return json({ ok: false, error: "RESEARCH_SAVE_FAILED", message: "External Research 저장에 실패했습니다.", detail: updateError?.message ?? null, hani_state_touched: false }, 500);
    }

    const { error: eventError } = await admin.from("hani_agent_events").insert({
      user_id: auth.user.id,
      case_id: existingCase.id,
      event_type: "EXTERNAL_RESEARCH_COMPLETED",
      actor_type: "UTILITY",
      actor_key: "EXTERNAL_RESEARCH_V0.9.1",
      payload: {
        source_count: researchResult.sources.length,
        finding_count: Array.isArray(researchResult.parsed?.findings) ? researchResult.parsed.findings.length : 0,
        candidate_count: Array.isArray(researchResult.parsed?.candidate_options) ? researchResult.parsed.candidate_options.length : 0,
        web_response_id: researchResult.web_response_id,
        structure_response_id: researchResult.structure_response_id,
        model: researchResult.model,
        web_model: researchResult.web_model,
        latency_ms: Date.now() - startedAt,
        usage: researchResult.usage,
        force_refresh: forceRefresh,
        archived_previous_research: forceRefresh && Object.keys(currentResearch).length > 0,
      },
    });

    return json({
      ok: true, service: "PROJECT HANI", function: "hani-agent-orchestrator", version: "1.7.0",
      action: "RESEARCH_CASE",
      case: { id: updatedCase.id, case_code: updatedCase.case_code, status: updatedCase.status },
      research: researchRecord,
      usage: researchResult.usage,
      pipeline: "GENERIC_WEB_SEARCH_MEMO -> STRICT_JSON_STRUCTURE",
      event_logged: !eventError,
      hani_state_touched: false,
      old_reviews_preserved: true,
      representative_decision_created: false,
      message: "Router v2 Context에 맞춘 External Research를 완료했습니다. 다음 단계는 2차 Agent Review입니다.",
    });
  }


  if (action === "sync_case_policy_candidates") {
    const caseId = cleanText(body.case_id, 64);
    if (!caseId) return json({ ok: false, error: "CASE_ID_REQUIRED", message: "case_id가 필요합니다." }, 400);
    const { data: existingCase, error: caseError } = await admin
      .from("hani_agent_cases")
      .select("id,user_id,case_code,workflow,hani_final")
      .eq("id", caseId)
      .eq("user_id", auth.user.id)
      .single();
    if (caseError || !existingCase) return json({ ok: false, error: "CASE_NOT_FOUND", message: "본인 소유의 안건을 찾지 못했습니다." }, 404);
    const haniFinal = asObject(existingCase.hani_final);
    const result = await syncPolicyLearningCandidates(admin, auth.user.id, existingCase, (haniFinal as any).policy_learning_candidates);
    if (!result.available) return json({ ok: false, error: "POLICY_REGISTRY_UNAVAILABLE", message: "Policy Registry 동기화에 실패했습니다. SQL migration을 확인해 주세요.", detail: result.warning || null }, 503);
    await admin.from("hani_agent_events").insert({
      user_id: auth.user.id,
      case_id: existingCase.id,
      event_type: "POLICY_DRAFTS_SYNC_REQUESTED",
      actor_type: "USER",
      actor_key: "REPRESENTATIVE",
      payload: { created: result.created, existing: result.existing, policy_ids: result.ids },
    });
    return json({ ok: true, version: "1.7.0", action: "SYNC_CASE_POLICY_CANDIDATES", result, hani_state_touched: false, message: result.created ? `${result.created}개의 새 원칙을 LEARNING 상태로 등록했습니다.` : result.reinforced ? `${result.reinforced}개의 기존 원칙을 반복 근거로 보강했습니다.` : "동일 학습 원칙이 이미 Registry에 있습니다." });
  }

  if (action === "list_policy_registry") {
    const { data, error } = await admin
      .from("hani_agent_policies")
      .select("id,policy_code,policy_type,scope,workflow,title,rule_text,status,version,source_case_id,source_case_code,proposed_by,rationale,governance_mode,enforcement_level,confidence,learning_stage,evidence_count,support_count,contradict_count,application_count,representative_support_count,auto_apply,representative_locked,last_evidence_at,last_applied_at,approved_at,rejected_at,retired_at,created_at,updated_at")
      .eq("user_id", auth.user.id)
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) {
      return json({ ok: false, error: "POLICY_REGISTRY_UNAVAILABLE", message: "Policy Registry를 읽지 못했습니다. SQL migration 적용 여부를 확인해 주세요.", detail: error.message }, 503);
    }
    return json({
      ok: true,
      service: "PROJECT HANI",
      function: "hani-agent-orchestrator",
      version: "1.7.0",
      action: "LIST_POLICY_REGISTRY",
      base_policy: COMPANY_POLICY,
      policies: data || [],
      counts: {
        total: (data || []).length,
        draft: (data || []).filter((x: any) => x.status === "DRAFT").length,
        learning: (data || []).filter((x: any) => x.status === "LEARNING").length,
        active: (data || []).filter((x: any) => x.status === "ACTIVE").length,
        adaptive: (data || []).filter((x: any) => String(x.governance_mode || "ADAPTIVE") === "ADAPTIVE" && ["LEARNING","ACTIVE"].includes(String(x.status))).length,
        established: (data || []).filter((x: any) => Number(x.confidence || 0) >= 0.80 && ["LEARNING","ACTIVE"].includes(String(x.status))).length,
      },
      hani_state_touched: false,
    });
  }

  if (action === "approve_policy") {
    const policyId = cleanText(body.policy_id, 64);
    if (!policyId) return json({ ok: false, error: "POLICY_ID_REQUIRED", message: "policy_id가 필요합니다." }, 400);
    const { data: policy, error: readError } = await admin
      .from("hani_agent_policies")
      .select("*")
      .eq("id", policyId)
      .eq("user_id", auth.user.id)
      .single();
    if (readError || !policy) return json({ ok: false, error: "POLICY_NOT_FOUND", message: "본인 소유의 규정 후보를 찾지 못했습니다." }, 404);
    if (!["DRAFT", "LEARNING"].includes(policy.status)) return json({ ok: false, error: "POLICY_NOT_APPROVABLE", message: `현재 상태(${policy.status})에서는 대표 고정 승인을 할 수 없습니다.` }, 409);
    const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
    const policyCode = policy.policy_code || `${policyCodePrefix(policy.workflow)}-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${suffix}`;
    const { data: updated, error: updateError } = await admin
      .from("hani_agent_policies")
      .update({ status: "ACTIVE", policy_code: policyCode, approved_at: new Date().toISOString(), representative_locked: true, governance_mode: policy.governance_mode || "MANUAL", confidence: Math.max(Number(policy.confidence || 0.5), 0.85), learning_stage: "ESTABLISHED", enforcement_level: policy.enforcement_level === "HARD_STOP" ? "HARD_STOP" : "STRONG" })
      .eq("id", policy.id)
      .eq("user_id", auth.user.id)
      .select("*")
      .single();
    if (updateError || !updated) return json({ ok: false, error: "POLICY_APPROVE_FAILED", message: "규정 활성화에 실패했습니다.", detail: updateError?.message ?? null }, 500);
    await admin.from("hani_agent_events").insert({
      user_id: auth.user.id,
      case_id: policy.source_case_id || null,
      event_type: "POLICY_ACTIVATED",
      actor_type: "USER",
      actor_key: "REPRESENTATIVE",
      payload: { policy_id: policy.id, policy_code: policyCode, workflow: policy.workflow, rule_text: policy.rule_text },
    });
    return json({ ok: true, version: "1.7.0", action: "APPROVE_POLICY", policy: updated, hani_state_touched: false, message: "대표 고정 승인으로 규정을 ACTIVE/STRONG 상태로 잠갔습니다. 일반 학습 규정은 이 작업 없이도 confidence에 따라 자동 반영됩니다." });
  }

  if (action === "reject_policy") {
    const policyId = cleanText(body.policy_id, 64);
    const note = cleanText(body.note, 1200);
    if (!policyId) return json({ ok: false, error: "POLICY_ID_REQUIRED", message: "policy_id가 필요합니다." }, 400);
    const { data: policy, error: readError } = await admin.from("hani_agent_policies").select("*").eq("id", policyId).eq("user_id", auth.user.id).single();
    if (readError || !policy) return json({ ok: false, error: "POLICY_NOT_FOUND", message: "본인 소유의 규정 후보를 찾지 못했습니다." }, 404);
    if (!["DRAFT", "LEARNING"].includes(policy.status)) return json({ ok: false, error: "POLICY_NOT_REJECTABLE", message: `현재 상태(${policy.status})에서는 반려할 수 없습니다.` }, 409);
    const { data: updated, error: updateError } = await admin
      .from("hani_agent_policies")
      .update({ status: "REJECTED", rejected_at: new Date().toISOString(), rationale: note || policy.rationale })
      .eq("id", policy.id).eq("user_id", auth.user.id).select("*").single();
    if (updateError || !updated) return json({ ok: false, error: "POLICY_REJECT_FAILED", message: "규정 후보 반려에 실패했습니다.", detail: updateError?.message ?? null }, 500);
    await admin.from("hani_agent_events").insert({ user_id: auth.user.id, case_id: policy.source_case_id || null, event_type: "POLICY_REJECTED", actor_type: "USER", actor_key: "REPRESENTATIVE", payload: { policy_id: policy.id, note } });
    return json({ ok: true, version: "1.7.0", action: "REJECT_POLICY", policy: updated, hani_state_touched: false, message: "규정 후보를 반려했습니다." });
  }

  if (action === "retire_policy") {
    const policyId = cleanText(body.policy_id, 64);
    const note = cleanText(body.note, 1200);
    if (!policyId) return json({ ok: false, error: "POLICY_ID_REQUIRED", message: "policy_id가 필요합니다." }, 400);
    const { data: policy, error: readError } = await admin.from("hani_agent_policies").select("*").eq("id", policyId).eq("user_id", auth.user.id).single();
    if (readError || !policy) return json({ ok: false, error: "POLICY_NOT_FOUND", message: "본인 소유의 규정을 찾지 못했습니다." }, 404);
    if (!["ACTIVE", "LEARNING"].includes(policy.status)) return json({ ok: false, error: "POLICY_NOT_ACTIVE", message: `현재 상태(${policy.status})에서는 비활성화할 수 없습니다.` }, 409);
    const { data: updated, error: updateError } = await admin.from("hani_agent_policies").update({ status: "RETIRED", retired_at: new Date().toISOString(), rationale: note || policy.rationale }).eq("id", policy.id).eq("user_id", auth.user.id).select("*").single();
    if (updateError || !updated) return json({ ok: false, error: "POLICY_RETIRE_FAILED", message: "규정 비활성화에 실패했습니다.", detail: updateError?.message ?? null }, 500);
    await admin.from("hani_agent_events").insert({ user_id: auth.user.id, case_id: policy.source_case_id || null, event_type: "POLICY_RETIRED", actor_type: "USER", actor_key: "REPRESENTATIVE", payload: { policy_id: policy.id, policy_code: policy.policy_code, note } });
    return json({ ok: true, version: "1.7.0", action: "RETIRE_POLICY", policy: updated, hani_state_touched: false, message: "규정을 RETIRED 처리했습니다. 다음 Agent 검토부터 적용되지 않습니다." });
  }

  if (action === "representative_decision") {
    const caseId = cleanText(body.case_id, 64);
    const representativeDecision = cleanText(body.representative_decision, 32).toUpperCase();
    const representativeNote = cleanText(body.representative_note, 4000);

    if (!caseId) {
      return json({ ok: false, error: "CASE_ID_REQUIRED", message: "case_id가 필요합니다." }, 400);
    }
    if (!REPRESENTATIVE_DECISIONS.has(representativeDecision)) {
      return json({
        ok: false,
        error: "INVALID_REPRESENTATIVE_DECISION",
        message: "대표 결정은 APPROVE / HOLD / REJECT / REVISION_REQUESTED 중 하나여야 합니다.",
      }, 400);
    }
    if (representativeDecision === "REVISION_REQUESTED" && !representativeNote) {
      return json({
        ok: false,
        error: "REVISION_NOTE_REQUIRED",
        message: "수정 요청에는 대표 메모가 필요합니다.",
      }, 400);
    }

    const { data: existingCase, error: readError } = await admin
      .from("hani_agent_cases")
      .select("id,user_id,case_code,workflow,title,status,context,verification_status,hani_final")
      .eq("id", caseId)
      .eq("user_id", auth.user.id)
      .single();

    if (readError || !existingCase) {
      return json({ ok: false, error: "CASE_NOT_FOUND", message: "본인 소유의 안건을 찾지 못했습니다." }, 404);
    }

    if (!["REVIEW_COMPLETE", "AWAITING_APPROVAL", "HELD"].includes(existingCase.status)) {
      return json({
        ok: false,
        error: "INVALID_CASE_STATUS",
        message: `현재 상태(${existingCase.status})에서는 대표 결정을 기록하지 않습니다.`,
      }, 409);
    }

    const haniFinal = asObject(existingCase.hani_final);
    if (!Object.keys(haniFinal).length) {
      return json({
        ok: false,
        error: "HANI_SYNTHESIS_REQUIRED",
        message: "대표 결정을 기록하려면 먼저 하니 Executive Synthesis가 필요합니다.",
      }, 409);
    }
    const aiRecommendation = cleanText((haniFinal as any).recommendation, 32).toUpperCase();

    // Representative Decision is a human governance action, not an automatic Commit.
    // A non-PASS Verification may still be approved/held/rejected/revised as an explicit override;
    // the override flag preserves that fact and hani_state is never auto-committed here.
    if (existingCase.status === "AWAITING_APPROVAL" && (haniFinal as any).ready_for_decision !== true) {
      return json({
        ok: false,
        error: "HANI_NOT_READY",
        message: "하니 Executive Synthesis가 결재 준비 상태가 아닙니다.",
      }, 409);
    }

    const { data: priorDecisions, error: priorError } = await admin
      .from("hani_agent_decisions")
      .select("decision_round")
      .eq("case_id", existingCase.id)
      .eq("user_id", auth.user.id)
      .order("decision_round", { ascending: false })
      .limit(1);

    if (priorError) {
      return json({
        ok: false,
        error: "DECISION_HISTORY_READ_FAILED",
        message: "대표 결정 이력을 확인하지 못했습니다.",
        detail: priorError.message,
      }, 500);
    }

    const decisionRound = Math.max(1, Number(priorDecisions?.[0]?.decision_round || 0) + 1);
    const expected = expectedRepresentativeDecision(aiRecommendation);
    const isOverride = Boolean((expected && expected !== representativeDecision) || existingCase.verification_status !== "PASS" || (haniFinal as any).ready_for_decision !== true);
    const nextStatus = representativeCaseStatus(representativeDecision);
    const decidedAt = new Date().toISOString();

    // Preserve the human decision first. Never delete it if a later update fails.
    const { data: decisionRow, error: decisionError } = await admin
      .from("hani_agent_decisions")
      .insert({
        user_id: auth.user.id,
        case_id: existingCase.id,
        decision_round: decisionRound,
        ai_recommendation: aiRecommendation || null,
        representative_decision: representativeDecision,
        override: isOverride,
        representative_note: representativeNote || null,
        commit_status: "NOT_STARTED",
        decided_at: decidedAt,
      })
      .select("id,case_id,decision_round,ai_recommendation,representative_decision,override,representative_note,commit_status,decided_at")
      .single();

    if (decisionError || !decisionRow) {
      return json({
        ok: false,
        error: "REPRESENTATIVE_DECISION_SAVE_FAILED",
        message: "대표 결정 기록에 실패했습니다.",
        detail: decisionError?.message ?? null,
        hani_state_touched: false,
        commit_executed: false,
      }, 500);
    }

    let nextContext = asObject(existingCase.context);
    let casePatch: Record<string, unknown> = { status: nextStatus };

    if (representativeDecision === "REVISION_REQUESTED") {
      nextContext = {
        ...nextContext,
        revision_request: {
          decision_round: decisionRound,
          note: representativeNote,
          mode: "PATCH_ONLY",
          preserve_unmentioned_fields: true,
          requested_at: decidedAt,
        },
      };
      casePatch = {
        ...casePatch,
        context: nextContext,
        verification_status: null,
        verification: {},
        hani_final: {},
      };
    }

    const { data: updatedCase, error: caseUpdateError } = await admin
      .from("hani_agent_cases")
      .update(casePatch)
      .eq("id", existingCase.id)
      .eq("user_id", auth.user.id)
      .select("id,case_code,status,verification_status,updated_at")
      .single();

    const { error: eventError } = await admin
      .from("hani_agent_events")
      .insert({
        user_id: auth.user.id,
        case_id: existingCase.id,
        event_type: "REPRESENTATIVE_DECISION_RECORDED",
        actor_type: "USER",
        actor_key: "REPRESENTATIVE",
        payload: {
          decision_round: decisionRound,
          ai_recommendation: aiRecommendation || null,
          representative_decision: representativeDecision,
          override: isOverride,
          next_status: caseUpdateError ? existingCase.status : nextStatus,
          commit_status: "NOT_STARTED",
          case_status_update_ok: !caseUpdateError,
        },
      });

    const representativePolicyLearning = await reinforcePoliciesFromRepresentativeDecision(
      admin,
      auth.user.id,
      existingCase,
      haniFinal,
      isOverride,
      expected,
      representativeDecision,
    );

    return json({
      ok: true,
      service: "PROJECT HANI",
      function: "hani-agent-orchestrator",
      version: "1.7.0",
      action: "REPRESENTATIVE_DECISION",
      case: updatedCase ?? {
        id: existingCase.id,
        case_code: existingCase.case_code,
        status: existingCase.status,
        verification_status: existingCase.verification_status,
      },
      decision: decisionRow,
      event_logged: !eventError,
      case_status_updated: !caseUpdateError,
      representative_decision_created: true,
      commit_executed: false,
      hani_state_touched: false,
      warning: caseUpdateError
        ? "대표 결정은 안전하게 보존했지만 Case 상태 갱신에 실패했습니다. 결정을 삭제하지 않고 운영자 확인이 필요합니다."
        : eventError
        ? "대표 결정과 Case 상태는 저장했지만 Audit Event 기록에 실패했습니다."
        : null,
      message:
        representativeDecision === "APPROVE"
          ? "대표 승인을 기록했습니다. 아직 HANI OS Commit은 실행하지 않았습니다."
          : representativeDecision === "HOLD"
          ? "대표 보류 결정을 기록했습니다. HANI OS Commit은 실행하지 않았습니다."
          : representativeDecision === "REJECT"
          ? "대표 반려 결정을 기록했습니다. HANI OS Commit은 실행하지 않았습니다."
          : "대표 수정 요청을 기록했습니다. 기존 Review/결정 이력은 보존하며 재검토 상태로 전환합니다.",
    });
  }


  if (action === "apply_case_policy") {
    const caseId = cleanText(body.case_id, 64);
    const policy = asObject(body.case_policy);

    if (!caseId) {
      return json({ ok: false, error: "CASE_ID_REQUIRED", message: "case_id가 필요합니다." }, 400);
    }
    if (!Object.keys(policy).length) {
      return json({ ok: false, error: "CASE_POLICY_REQUIRED", message: "case_policy가 필요합니다." }, 400);
    }

    const { data: existingCase, error: readError } = await admin
      .from("hani_agent_cases")
      .select("id,user_id,case_code,status,context")
      .eq("id", caseId)
      .eq("user_id", auth.user.id)
      .single();

    if (readError || !existingCase) {
      return json({ ok: false, error: "CASE_NOT_FOUND", message: "본인 소유의 안건을 찾지 못했습니다." }, 404);
    }

    const nextContext = {
      ...asObject(existingCase.context),
      case_policy: {
        ...asObject((asObject(existingCase.context) as any).case_policy),
        ...policy,
        updated_at: new Date().toISOString(),
      },
    };

    const { data: updatedCase, error: updateError } = await admin
      .from("hani_agent_cases")
      .update({
        context: nextContext,
        status: "REVIEW_COMPLETE",
      })
      .eq("id", existingCase.id)
      .eq("user_id", auth.user.id)
      .select("id,case_code,status,context,updated_at")
      .single();

    if (updateError || !updatedCase) {
      return json({
        ok: false,
        error: "CASE_POLICY_SAVE_FAILED",
        message: "Case Policy 저장에 실패했습니다.",
        detail: updateError?.message ?? null,
      }, 500);
    }

    const { error: eventError } = await admin.from("hani_agent_events").insert({
      user_id: auth.user.id,
      case_id: existingCase.id,
      event_type: "CASE_POLICY_APPLIED",
      actor_type: "USER",
      actor_key: "REPRESENTATIVE",
      payload: {
        case_policy: policy,
      },
    });

    return json({
      ok: true,
      service: "PROJECT HANI",
      function: "hani-agent-orchestrator",
      version: "1.7.0",
      action: "APPLY_CASE_POLICY",
      case: updatedCase,
      event_logged: !eventError,
      hani_state_touched: false,
      message: "대표가 승인한 Case Policy를 적용했습니다.",
    });
  }

  return json({ ok: false, error: "UNKNOWN_ACTION", message: "지원하지 않는 action입니다." }, 400);
});
