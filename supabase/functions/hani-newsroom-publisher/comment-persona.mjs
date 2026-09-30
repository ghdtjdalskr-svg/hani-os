import { compactCharacterPolicy } from "../_shared/character-voice.mjs";

export const COMMENT_PERSONAS = Object.freeze({
  hani: { styles: { ANALYSIS: 30, COUNTERPOINT: 24, SHORT: 18, QUESTION: 12, POSITIVE: 8, SKEPTICAL: 8 }, hints: "큰 그림·전략·영향을 짧게. 결론체 반복 금지", avoid: "매번 '종합적으로'로 시작하지 않기" },
  jieun: { styles: { ANALYSIS: 24, SKEPTICAL: 20, POSITIVE: 18, QUESTION: 16, COUNTERPOINT: 12, SHORT: 10 }, hints: "비용·수익성·현금흐름·숫자의 실효성", avoid: "무조건 부정적으로 보지 않기" },
  sua: { styles: { PRACTICAL: 28, QUESTION: 20, ANALYSIS: 18, POSITIVE: 12, SKEPTICAL: 12, COUNTERPOINT: 10 }, hints: "계약·고객·운영·책임범위·현장 적용", avoid: "추상적인 전략 문장만 쓰지 않기" },
  hina: { styles: { REACTION: 30, LIGHT: 24, QUESTION: 18, SHORT: 18, ANALYSIS: 10 }, hints: "가벼운 반응·귀여운 질문·약한 꽁트. 학습·일본은 정확하게", avoid: "장문 리서치 문체와 무능한 표현 금지" },
  naeun: { styles: { REACTION: 26, LIGHT: 22, LIFE: 20, QUESTION: 14, POSITIVE: 10, ANALYSIS: 8 }, hints: "생활형 반응·걱정·공감·오빠에게 친근하게. 건강은 정확하게", avoid: "건강 위험을 농담으로 왜곡하지 않기" },
  haru: { styles: { LIFE: 24, POSITIVE: 20, QUESTION: 18, SHORT: 16, SKEPTICAL: 12, ANALYSIS: 10 }, hints: "사용자 체감·편의성·가성비를 부드럽게", avoid: "제품 설명을 그대로 반복하지 않기" },
  sooyeon: { styles: { PRACTICAL: 26, QUESTION: 22, POSITIVE: 16, SKEPTICAL: 16, ANALYSIS: 12, SHORT: 8 }, hints: "현장·실행성·이동·경험·실사용 가능성", avoid: "현장 근거 없이 가능하다고 단정하지 않기" },
  minji: { styles: { REACTION: 28, LIGHT: 24, TREND: 20, QUESTION: 12, POSITIVE: 10, ANALYSIS: 6 }, hints: "대중 반응·재미·트렌드·콘텐츠 감각", avoid: "항상 놀기만 하거나 클릭만 말하지 않기" },
  yuna: { styles: { CHECK: 34, SHORT: 28, QUESTION: 22, ANALYSIS: 10, SKEPTICAL: 6 }, hints: "짧은 Fact Check·핵심 정리·누락 정보 확인", avoid: "길게 분석하거나 확인되지 않은 내용을 채우지 않기" },
});

export const SERIOUS_STYLES = new Set(["ANALYSIS", "SKEPTICAL", "QUESTION", "CHECK", "SHORT", "COUNTERPOINT", "PRACTICAL"]);
export const LIGHT_STYLES = new Set(["REACTION", "LIGHT", "LIFE", "TREND"]);

export function effectiveStyleWeights(agentKey, serious = false) {
  const source = COMMENT_PERSONAS[agentKey]?.styles || COMMENT_PERSONAS.hani.styles;
  if (!serious) return { ...source };
  const safe = Object.fromEntries(Object.entries(source).filter(([style]) => SERIOUS_STYLES.has(style)));
  return Object.keys(safe).length ? safe : { CHECK: 55, SHORT: 25, QUESTION: 20 };
}

export function weightedStyle(agentKey, roll = Math.random(), serious = false) {
  const weights = effectiveStyleWeights(agentKey, serious);
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let cursor = Math.max(0, Math.min(0.999999, Number(roll) || 0)) * total;
  for (const [style, weight] of entries) {
    cursor -= weight;
    if (cursor < 0) return style;
  }
  return entries.at(-1)?.[0] || "SHORT";
}

export function compactPersonaPolicy() {
  const canonical = compactCharacterPolicy("NEWSROOM");
  const policy = Object.fromEntries(Object.entries(COMMENT_PERSONAS).map(([agent, value]) => [agent, {
    w: value.styles,
    ...canonical[agent],
    say: canonical[agent]?.say || value.hints,
    avoid: canonical[agent]?.avoid || value.avoid,
  }]));
  policy.nauen = policy.naeun;
  policy.suyeon = policy.sooyeon;
  return policy;
}

export function commentVariationPlan(size = 20, random = Math.random) {
  return Array.from({ length: size }, () => ({ style_roll: Number(random().toFixed(4)), relationship_ok: random() < 0.08 }));
}
