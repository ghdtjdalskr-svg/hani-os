import { LOUNGE_VOICES, LOUNGE_RELATIONS } from "./lounge-voices.mjs";
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
  const policy = Object.fromEntries(Object.entries(COMMENT_PERSONAS).map(([agent, value]) => [agent, { w: value.styles, ...LOUNGE_VOICES[agent] }]));
  for (const [key, voice] of Object.entries(LOUNGE_VOICES)) if (!policy[key]) policy[key] = {w:{SHORT:50,QUESTION:30,CHECK:20}, ...voice};
  policy.nauen = policy.naeun;
  policy.suyeon = policy.sooyeon;
  return policy;
}

export function commentVariationPlan(size = 20, random = Math.random) {
  return Array.from({ length: size }, () => ({ style_roll: Number(random().toFixed(4)), relationship_ok: random() < 0.25 }));
}

export const COMMENT_MAX_LENGTH = 160;
export const REPORT_PHRASES = /에\s*관한\s*제\s*생각|종합적으로|시사하는\s*바|판단됩니다|사료됩니다|분석\s*결과|검토\s*결과|보고드립니다|할\s*필요가\s*있습니다|주목할\s*필요|관점에서\s*볼\s*때/;
const alias = key => ({nauen:'naeun',suyeon:'sooyeon'})[key] || key;
export function drawCommentCount() {return 2 + Math.floor(Math.random() * 3);}
export function newsroomCommentInstructions() {
  return [
    '댓글을 상대 이름 부르기로 시작하지 말 것',
    '댓글은 하니 라운지에서 동료끼리 기사 보고 나누는 짧은 대화입니다. comments는 input.comment_count_plan대로 2~4개, 서로 다른 관련 직원만 참여하세요.',
    '각 직원의 input.persona_policy.voice/say/avoid/oppa를 지키세요. 직무 보고서 대신 구어체로 1~2문장, 공백 포함 최대 160자. 관점도 말투도 각자 달라야 합니다.',
    '금지: ~에 관한 제 생각:, 종합적으로, 시사하는 바, 판단됩니다, 사료됩니다, 분석 결과, 검토 결과, 보고드립니다, 할 필요가 있습니다, 주목할 필요, 관점에서 볼 때. 제목이나 요약을 길게 다시 말하지 마세요.',
    '대표에게 직접 말할 때 oppa=true만 오빠를 허용하고, false는 회장님/대표님과 존댓말. 동료에게도 직급과 관계에 맞는 호칭을 쓰며 이름만 부르거나 반말을 강요하지 마세요. 신입 유나·가은·세린은 존댓말.',
    'input.comment_variation_plan.relationship_ok=true일 때 뒤 댓글 하나가 앞 동료 의견에 짧게 질문하거나 다른 관점을 보탤 수 있습니다. 댓글 안의 호칭으로 연결하고 별도 reply 필드는 만들지 마세요. 관계별 호칭: '+JSON.stringify(LOUNGE_RELATIONS),
    'FACT > 기사 관련성 > 직원 관점 > 말투 > 유머. title/summary/why_it_matters와 확인한 원출처에 있는 사실만 사용하세요. 기사에 없는 숫자·날짜·인과·전망을 만들지 마세요. 의견과 확인 질문은 확정 사실과 구분하세요.',
    '심각한 보안·인명·건강 위험·소송·규제·손실에는 농담/ㅋㅋ/이모지 없이 짧은 질문이나 확인. 평소에도 모든 댓글에 농담이나 오빠를 붙이지 마세요.',
    'tone은 ANALYSIS/POSITIVE/SKEPTICAL/QUESTION/REACTION/LIGHT/COUNTERPOINT/CHECK/SHORT/PRACTICAL/LIFE/TREND/BANTER/COUNTER/CAUTION 중 선택. 연속 기사에서 같은 시작·캐치프레이즈·직원 조합 반복을 피하세요.'
  ].join('\n');
}
// Conservative fallbacks ask about the article; they never invent claims or numbers.
export const COMMENT_TEMPLATES = Object.freeze({
  hani:['이건 후속 소식까지 보고 판단하자. 제목만 보면 너무 빨라.', '일단 이 기사부터 보자. 범위 넓히기는 잠깐 ㅋㅋ'],
  jieun:['이 소식이 실제 비용에는 어떻게 이어질까?', '기대는 알겠는데, 돈 흐름도 같이 봐야겠어.'],
  sua:['기사에 나온 조건부터 확인해볼까요?', '실제로 적용되는 범위가 어디까지인지 궁금해요.'],
  hina:['읽고 나니 오히려 궁금한 게 늘었어 ㅎㅎ', '후속 소식 나오면 같이 볼래?'],
  naeun:['이 소식, 실제 생활에서는 어떻게 느껴질까?', '사람들에게 미치는 영향도 같이 보고 싶어.'],
  haru:['쓰는 사람 입장에서는 뭐가 달라질까?', '좋다는 얘기보다 실제로 잘 맞는지 궁금해.'],
  sooyeon:['기사 다음에 실제 현장 소식도 보고 싶네요.', '현장에선 어떻게 달라질지 궁금해요.'],
  minji:['제목보다 본문 쪽이 더 궁금해지네요.', '이건 댓글 반응도 한번 보고 싶어요 ㅎㅎ'],
  yuna:['기사에서 확인된 내용만 먼저 볼게요.', '후속 소식도 나오면 같이 확인할까요?'],
  serin:['같은 기준으로 비교한 자료도 있을까요?', '기사만으로 결론 내리기엔 더 궁금한데요.'],
  arin:['이 변화가 실제로 쓰는 사람에게도 느껴질까요?', '사용하는 흐름이 어떻게 달라질지 궁금해요.'],
  yuri:['확인된 사실과 아직 모르는 건 나눠봐야겠어요.', '이 기사만으로 단정하기는 이른 것 같아요.'],
  dohyun:['실제 적용 사례가 있는지도 궁금하네요.', '작게 확인해볼 수 있는 사례부터 보고 싶어요.'],
  seoyun:['기존 구조와 어떻게 연결될까요?', '변경되는 범위부터 같이 보면 좋겠어요.'],
  gaeun:['후속 일정이 확인되면 같이 볼까요?', '다음 소식이 언제 나오는지도 궁금하네요.'],
  mir:['왜 이런 변화가 생겼을까요?', '기사에 나온 이유를 조금 더 알고 싶어요.'],
  taeo:['고객에게는 어떤 변화로 느껴질까요?', '실제 요구와 연결되는 부분이 궁금해요.']
});
const TONES = new Set(['ANALYSIS','POSITIVE','SKEPTICAL','QUESTION','REACTION','LIGHT','COUNTERPOINT','CHECK','SHORT','PRACTICAL','LIFE','TREND','BANTER','COUNTER','CAUTION']);
export function validCommentText(key, value, article = {}) {
  key = alias(key);
  if (!LOUNGE_VOICES[key] || typeof value !== 'string') return false;
  const s = value.trim();
  if (!s || s.length > COMMENT_MAX_LENGTH || /[\r\n]/.test(s) || REPORT_PHRASES.test(s)) return false;
  if (!LOUNGE_VOICES[key].oppa && /오빠/.test(s)) return false;
  if (['yuna','gaeun','serin'].includes(key) && !/(?:요|니다|까요|죠)[.!?…~]*$/.test(s)) return false;
  const facts = [article.title,article.summary,article.why_it_matters].join(' ');
  const numbers = s.match(/\d+(?:[.,]\d+)*(?:%|조|억|만|천|원|달러|배|년|월|일)?/g) || [];
  const factNumbers = new Set(facts.match(/\d+(?:[.,]\d+)*(?:%|조|억|만|천|원|달러|배|년|월|일)?/g) || []);
  return numbers.every(n => factNumbers.has(n));
}
export function normalizeNewsComments(rows, article, count = 2) {
  const limit = Math.max(2,Math.min(4,Number(count)||2)), result = [], seen = new Set();
  for (const raw of Array.isArray(rows) ? rows : []) {
    const key = alias(String(raw?.agent_key || '').toLowerCase());
    if (!COMMENT_TEMPLATES[key] || seen.has(key)) continue;
    const fallback = COMMENT_TEMPLATES[key][0];
    result.push({agent_key:key,agent_name:String(raw.agent_name || key).slice(0,50),tone:TONES.has(raw.tone)?raw.tone:'SHORT',comment:validCommentText(key,raw.comment,article)?raw.comment.trim():fallback});
    seen.add(key); if (result.length === limit) break;
  }
  for (const key of ['yuna','serin','jieun','sua']) {
    if (result.length === limit) break;
    if (seen.has(key)) continue;
    result.push({agent_key:key,agent_name:({yuna:'유나',serin:'세린',jieun:'지은',sua:'수아'})[key],tone:'QUESTION',comment:COMMENT_TEMPLATES[key][0]});seen.add(key);
  }
  return result;
}
