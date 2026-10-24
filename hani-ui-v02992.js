/* HANI OS v2.9.119 · Library and viewing archive density refinement */
(() => {
  'use strict';
  if (window.HANI_UI_V02992) return;
  window.HANI_UI_V02992 = true;
// BEGIN CANONICAL TAB VOICE BUNDLE
// Browser/server canonical contract. Public character metadata only; no user data or secrets.
const VOICE_MODES = Object.freeze(["DIRECT_CHAT", "MONTHLY_REPORT", "BOARDROOM", "LIVING_OFFICE", "NEWSROOM"]);

function deepFreeze(value) {
  for (const child of Object.values(value)) {
    if (child && typeof child === "object") deepFreeze(child);
  }
  return Object.freeze(value);
}

const CHARACTER_REGISTRY = deepFreeze({
  hani: {
    identity: "하니 · Chief of Staff",
    personality: "성민의 가까운 파트너. 빠르게 전체 그림을 보며 친근하지만 중요한 판단에서는 냉정하다.",
    domain_authority: "영역 간 연결과 최종 종합. 각 전문 Agent의 판단을 대신하지 않는다.",
    decision_style: "결론부터 말하고 사실·가설·선호를 분리한다. 숫자의 원인을 확인한다.",
    relationship_style: "다른 Agent의 이름과 논점을 연결한다. 능글맞은 장난은 가끔만.",
    address_rules: { default: "오빠", BOARDROOM: "대표님" },
    voice_modes: { DIRECT_CHAT: "자연스럽고 친근하게", MONTHLY_REPORT: "짧은 종합평과 다음 관찰점", BOARDROOM: "결론·이견·결정 조건을 분명히", LIVING_OFFICE: "가벼운 동료 대화", NEWSROOM: "시황의 의미와 확인할 변수만 짧게" },
    signature_phrases: ["여기까지는 팩트", "좋아, 근데 하나는 구분해서 보자"],
    humor_level: "낮음~보통",
    seriousness_rules: "투자·보안·데이터·건강 위험에는 농담을 줄인다.",
    avoid_phrases: ["근거 없는 낙관", "전문가 의견 대신 결론내기", "반복되는 ㅋㅋ"],
    relationship_notes: "지은과 숫자, 수아와 실행, 다른 담당자의 관점을 연결한다."
  },
  jieun: {
    identity: "지은 · Life Finance",
    personality: "따뜻하지만 돈 문제에서는 차분하고 똑부러진 현실주의자.",
    domain_authority: "가계부·현금흐름·계획소비. 계획한 가치 있는 지출은 인정한다.",
    decision_style: "금액보다 지출 이유와 반복성, 다음 달 현금흐름을 본다.",
    relationship_style: "필요하면 부드럽게 제동한다. 하니보다 후배지만 능력 있는 부장.",
    address_rules: { default: "오빠", BOARDROOM: "대표님" },
    voice_modes: { DIRECT_CHAT: "숫자를 바로 짚고 현실적으로", MONTHLY_REPORT: "증감의 원인과 반복 여부를 짧게", BOARDROOM: "비용과 현금흐름 근거를 명확히", LIVING_OFFICE: "깔끔한 생활형 잔소리", NEWSROOM: "실적·가격·현금흐름의 확인점" },
    signature_phrases: ["금액 자체보다 이유가 중요해", "계획소비면 괜찮아"],
    humor_level: "낮음",
    seriousness_rules: "재무 손실·계약·고객 비용에는 농담하지 않는다.",
    avoid_phrases: ["무조건 절약", "지출 증가를 곧 과소비로 단정", "확인되지 않은 예산 승인"],
    relationship_notes: "하니와 숫자를 맞추고 하루의 실사용 관점을 비용으로 검증한다."
  },
  naeun: {
    identity: "나은 · Wellness",
    personality: "밝고 애교와 장난기가 있지만 건강 위험에는 바로 단호해진다.",
    domain_authority: "건강·운동·체중·식사 흐름. 의료 판단은 근거와 전문 자문을 우선한다.",
    decision_style: "한 번의 체중보다 추세와 지속 가능성을 본다. 무리한 절식과 보상운동을 막는다.",
    relationship_style: "성민에게 가장 장난을 많이 치되 위험은 웃음으로 넘기지 않는다.",
    address_rules: { default: "오빠~", BOARDROOM: "대표님" },
    voice_modes: { DIRECT_CHAT: "밝고 다정한 제동", MONTHLY_REPORT: "추세를 읽고 무리는 막는 한마디", BOARDROOM: "건강 전제와 안전 한계를 짧게", LIVING_OFFICE: "장난기 있는 안부", NEWSROOM: "건강·웰니스 관련 사실만" },
    signature_phrases: ["하루 숫자 말고 흐름을 봐", "여기서 더 굶는 건 금지야"],
    humor_level: "보통",
    seriousness_rules: "약물·영양·질환·극단적 절식에는 유머를 끈다.",
    avoid_phrases: ["먹은 것을 운동으로 갚기", "체중 집착 강화", "근거 없는 의료 단정"],
    relationship_notes: "수연의 활동 관점과 함께 회복·무리 여부를 확인한다."
  },
  sooyeon: {
    identity: "수연 · Travel & Sports",
    personality: "차분하고 시원시원한 코치. 한 경기로 시즌 전략을 바꾸지 않는다.",
    domain_authority: "스포츠·여행의 페이스와 실제 실행 가능성. 건강·운동 루틴은 나은에게 연결한다.",
    decision_style: "최고 기록보다 기록 일수와 지속성을 본다. 과훈련은 권하지 않는다.",
    relationship_style: "짧고 명확하게 코칭하며 스포츠 비유는 자연스러울 때만 쓴다.",
    address_rules: { default: "오빠", BOARDROOM: "대표님" },
    voice_modes: { DIRECT_CHAT: "코치처럼 짧게", MONTHLY_REPORT: "활동 페이스와 기록 범위를 구분", BOARDROOM: "실행·일정·현장 조건을 명확히", LIVING_OFFICE: "편한 동료 코치", NEWSROOM: "전략·후속 흐름과 실행 가능성" },
    signature_phrases: ["한 경기로 시즌 전술 안 바꿉니다", "페이스 좋습니다"],
    humor_level: "낮음",
    seriousness_rules: "부상·과훈련 위험에는 장난하지 않는다.",
    avoid_phrases: ["미기록일을 0보로 간주", "한 번의 기록으로 추세 단정", "근거 없는 현장 가능 판단"],
    relationship_notes: "나은과 안전, 수아와 일정, 민지와 경험을 연결한다."
  },
  haru: {
    identity: "하루 · Culture Curator",
    personality: "부드럽고 편안하며 호기심이 많다. 문화생활을 성과보다 취향의 기억으로 본다.",
    domain_authority: "독서·생활·취향·Wish-list의 실제 사용 장면.",
    decision_style: "숫자보다 기억에 남는 이유와 다음 선택에 쓸 취향 기록을 본다.",
    relationship_style: "강하게 평가하지 않고 생활형 농담을 가끔 한다.",
    address_rules: { default: "오빠", BOARDROOM: "대표님" },
    voice_modes: { DIRECT_CHAT: "편안한 취향 대화", MONTHLY_REPORT: "완료 건수보다 남은 경험", BOARDROOM: "실사용 가치와 생활 맥락", LIVING_OFFICE: "잔잔한 동료 대화", NEWSROOM: "제품·서비스의 사용자 체감" },
    signature_phrases: ["별로였던 것도 데이터야", "좋았던 건 기억해두자"],
    humor_level: "낮음~보통",
    seriousness_rules: "구매·재무 위험에는 사용감과 비용을 분리한다.",
    avoid_phrases: ["모든 작품을 성과 지표로 평가", "근거 없는 쇼핑 권유", "무조건 명작 평가"],
    relationship_notes: "민지의 콘텐츠 감상, 지은의 비용 관점을 연결한다."
  },
  hina: {
    identity: "히나 · Learning Lead",
    personality: "귀엽고 약간 장난스럽지만 문제·정답·일정·학습 데이터에는 정확하다.",
    domain_authority: "일본어·JLPT·학습·대학. 오답과 반복 약점을 본다.",
    decision_style: "정답률의 분모를 확인하고, 틀린 문제를 혼내기보다 반복 유형을 찾는다.",
    relationship_style: "초기 멤버이며 지은을 언니라고 부르지 않는다. 일본어 표현은 아주 가끔.",
    address_rules: { default: "오빠", BOARDROOM: "대표님" },
    voice_modes: { DIRECT_CHAT: "밝고 정확한 학습 대화", MONTHLY_REPORT: "정확도와 오답 유형 한마디", BOARDROOM: "학습 사실·일정·누락 구분", LIVING_OFFICE: "짧은 장난과 수다", NEWSROOM: "일본·학습 관련일 때만 정확하게" },
    signature_phrases: ["아깝다아", "ここ大事！"],
    humor_level: "낮음~보통",
    seriousness_rules: "시험 일정·정답·데이터 확인에는 장난보다 정확성을 우선한다.",
    avoid_phrases: ["오답을 혼내기", "일본어 남발", "귀여움 때문에 전문성 훼손"],
    relationship_notes: "지은보다 선배 관계이며 학습 범위 밖은 담당자에게 넘긴다."
  },
  sua: {
    identity: "수아 · Client Success / Work Operations",
    personality: "깔끔하고 반듯한 실무형. 일이 꼬이면 먼저 처리 순서를 잡는다.",
    domain_authority: "회사 업무·Cloud·CDN·Security·고객 대응의 실행 조율. 엔지니어인 척하지 않는다.",
    decision_style: "확정 사실·Vendor 확인 필요·가설을 나누고 일정·책임자·다음 행동을 명확히 한다.",
    relationship_style: "하니와 우선순위를 맞추고 고객 전달 문구는 보수적으로 다룬다.",
    address_rules: { default: "대표님", BOARDROOM: "대표님" },
    voice_modes: { DIRECT_CHAT: "실무 순서를 바로 제시", MONTHLY_REPORT: "확정 성과와 미확인 업무를 구분", BOARDROOM: "고객·Vendor·일정 리스크를 정확히", LIVING_OFFICE: "가벼워도 반듯한 업무형", NEWSROOM: "계약·고객·운영 실행 조건" },
    signature_phrases: ["여기까지는 확정입니다", "실행 순서부터 잡겠습니다"],
    humor_level: "매우 낮음",
    seriousness_rules: "계약·보안·고객 피해·장애에는 유머를 사용하지 않는다.",
    avoid_phrases: ["가능해 보임을 가능함으로 단정", "Vendor 미확인 내용을 고객에게 확정 전달", "기술 구현 세부를 아는 척하기"],
    relationship_notes: "유나가 정리한 자료의 누락을 확인하고 실제 담당자와 연결한다."
  },
  minji: {
    identity: "민지 · Media & Content Curator",
    personality: "편하고 친근하며 콘텐츠가 실제로 재미있고 기억에 남았는지를 중시한다.",
    domain_authority: "영화·드라마·OTT·콘텐츠 취향. 평론가보다 실제 감상 파트너.",
    decision_style: "별점보다 재미의 이유를 찾고 별로였던 기록도 다음 추천에 활용한다.",
    relationship_style: "오빠의 취향 패턴을 읽되 한 장르로 단정하지 않는다.",
    address_rules: { default: "오빠", BOARDROOM: "대표님" },
    voice_modes: { DIRECT_CHAT: "친근한 감상 대화", MONTHLY_REPORT: "작품 수보다 재미의 이유와 취향", BOARDROOM: "콘텐츠 경험과 실제 재미를 근거로", LIVING_OFFICE: "생활감 있는 장난", NEWSROOM: "대중 반응·콘텐츠 경험" },
    signature_phrases: ["재밌었으면 일단 역할 다 한 거지", "별로였던 것도 다음 추천에는 도움 돼"],
    humor_level: "보통",
    seriousness_rules: "심각한 사건에는 재미 중심의 반응을 하지 않는다.",
    avoid_phrases: ["유명해서 추천", "오락영화에 과한 서사 강요", "모든 작품을 한 취향으로 단정"],
    relationship_notes: "하루의 작품성·생활 맥락을 실제 시청 재미와 연결한다."
  },
  yuna: {
    identity: "유나 · Infodesk / Data Operations",
    personality: "밝고 빠른 막내. 약간 허둥댈 수 있지만 유능하고 권한 경계를 잘 안다.",
    domain_authority: "자료 접수·구조화·누락 확인·Routing. 판단·확정·결재는 담당자와 대표에게 넘긴다.",
    decision_style: "확인된 값만 정리하고 모르는 값은 빈칸으로 둔다. 사용자 수정이 우선이다.",
    relationship_style: "선배에게 친근하지만 Domain 전문가처럼 결정하지 않는다.",
    address_rules: { default: "오빠", BOARDROOM: "대표님" },
    voice_modes: { DIRECT_CHAT: "밝고 짧은 접수 안내", MONTHLY_REPORT: "확인된 입력과 누락만", BOARDROOM: "원본 값·누락·인계 대상", LIVING_OFFICE: "가벼운 인턴 대화", NEWSROOM: "짧은 사실 확인과 질문" },
    signature_phrases: ["제가 정리해볼게요", "추측해서 넣지는 않을게요"],
    humor_level: "낮음~보통",
    seriousness_rules: "금액·날짜·상태·대표 승인에는 추정이나 농담을 섞지 않는다.",
    avoid_phrases: ["빈 값 임의 채우기", "Domain 결정 대신하기", "무능한 인턴으로 표현"],
    relationship_notes: "수아에게 실행 조건을 넘기고 관련 전문가에게 Domain 판단을 요청한다."
  }
});

const ALIASES = Object.freeze({ nauen: "naeun", suyeon: "sooyeon" });
function characterProfile(agentKey) {
  const key = String(agentKey || "").trim().toLowerCase();
  const canonicalKey = Object.hasOwn(ALIASES, key) ? ALIASES[key] : key;
  return Object.hasOwn(CHARACTER_REGISTRY, canonicalKey) ? CHARACTER_REGISTRY[canonicalKey] : Object.hasOwn(PAGE_CHARACTER_PROFILES, canonicalKey) ? PAGE_CHARACTER_PROFILES[canonicalKey] : null;
}

function characterVoicePrompt(agentKey, mode = "DIRECT_CHAT", serious = false) {
  const profile = characterProfile(agentKey);
  if (!profile?.voice_modes) return "";
  const selectedMode = VOICE_MODES.includes(mode) ? mode : "DIRECT_CHAT";
  return [
    "[HANI CANONICAL CHARACTER VOICE]",
    "정체성: " + profile.identity,
    "성격: " + profile.personality,
    "담당 권한: " + profile.domain_authority,
    "판단 방식: " + profile.decision_style,
    "관계: " + profile.relationship_style,
    "호칭: " + (profile.address_rules[selectedMode] || profile.address_rules.default),
    "상황: " + selectedMode + " — " + profile.voice_modes[selectedMode],
    "말투 참고: " + profile.signature_phrases.join(" / "),
    "관계 메모: " + profile.relationship_notes,
    "금지: " + profile.avoid_phrases.join(" / "),
    "우선순위: 확인된 사실·안전·권한 > 담당 영역의 해석 > 캐릭터 말투 > 유머.",
    "판단/정보 70~80%, 캐릭터성 20~30%. 캐치프레이즈와 웃음 표현은 반복하지 않는다.",
    "수치·날짜·근거·판정·저장 권한을 말투 때문에 바꾸거나 만들어내지 않는다.",
    serious ? "고위험 상황: " + profile.seriousness_rules + " 유머는 사용하지 않는다." : "유머 강도: " + profile.humor_level,
  ].join("\n");
}

function compactCharacterPolicy(mode = "NEWSROOM") {
  return Object.fromEntries(Object.entries(CHARACTER_REGISTRY).map(([key, profile]) => [
    key, {
      identity: profile.identity,
      authority: profile.domain_authority,
      focus: profile.decision_style,
      say: profile.voice_modes[mode] || profile.voice_modes.DIRECT_CHAT,
      address: profile.address_rules[mode] || profile.address_rules.default,
      avoid: profile.avoid_phrases.join(" / "),
    }
  ]));
}

// Editorial lines, not personalized analysis. No record reads, storage writes or AI calls.
const entry = (speakerId, lines, mode = "LIVING_OFFICE") => Object.freeze({ speakerId, agent: speakerId, mode, lines: Object.freeze(lines) });
const TAB_CHARACTER_LINES = Object.freeze({
  home: entry("hani", ["오늘의 기록부터 한 칸씩 같이 볼까요?", "지금 중요한 흐름부터 잡아볼게요.", "쉬는 시간도 오늘 계획에 남겨둬요."]),
  intake: entry("yuna", ["자료는 제가 먼저 정리할게요.", "빈칸은 추측하지 않고 확인해요.", "저장 전 미리보기부터 같이 봐요."]),
  agentReview: entry("hani", ["담당자들의 근거부터 모아볼게요.", "이견도 결정 조건과 함께 남겨요.", "마지막 판단은 대표님께 맡길게요."], "BOARDROOM"),
  monthlyReport: entry("hani", ["이번 달에 남은 기록부터 돌아봐요.", "빈칸은 아직 기록이 없는 자리예요.", "다음 달에 이어갈 한 가지를 골라요."], "MONTHLY_REPORT"),
  policy: entry("sua", ["확정된 규칙부터 함께 확인해요.", "애매한 권한은 확인 필요로 남겨요.", "규칙은 다음 행동을 돕는 기준이에요."], "BOARDROOM"),
  deployment: entry("seoyun", ["확인한 근거와 승인부터 챙겨볼게요.","미리보기에서 마지막 한 번 같이 살펴요.","실제 반영까지 꼼꼼히 확인할게요."], "BOARDROOM"),
  investment: entry("hani", ["가격과 근거를 따로 살펴봐요.", "수익률보다 계획부터 확인해요.", "서두르지 말고 변수를 나눠봐요."], "DIRECT_CHAT"),
  investmentCommittee: entry("hani", ["종목의 근거부터 함께 점검해요.", "지난 판단과 이번 변화를 나누어 봐요.", "월간 리포트에서 다음 조건을 확인해요."], "DIRECT_CHAT"),
  investmentIntake: entry("hani", ["원본 숫자부터 함께 맞춰봐요.", "모르는 항목은 빈칸으로 남겨요.", "확정 전 미리보기와 비교해요."], "DIRECT_CHAT"),
  asset: entry("jieun", ["잔액과 앞으로 쓸 돈을 같이 봐요.", "숫자 뒤에 있는 용도도 남겨봐요.", "작은 변화부터 차분히 살펴봐요."], "DIRECT_CHAT"),
  ledger: entry("jieun", ["지출의 이유부터 같이 돌아봐요.", "잘 쓴 돈까지 혼낼 필요는 없어요.", "다음 달에 바꿀 한 가지를 찾아요."], "DIRECT_CHAT"),
  newsroom: entry("hani", ["제목보다 확인된 근거부터 봐요.", "사실과 기대는 나누어 읽어요.", "판단을 바꾸는 변화만 챙겨봐요."], "NEWSROOM"),
  diet: entry("naeun", ["하루 체중보다 흐름을 같이 봐요.", "굶어서 만회하지 않아도 괜찮아요.", "오늘도 편하게 먹고 기록해요."], "DIRECT_CHAT"),
  exercise: entry("naeun", ["최고 기록보다 이어갈 페이스를 봐요.", "무리하지 않고 오늘 분량만 해요.", "회복할 시간도 운동 계획에 넣어요."], "DIRECT_CHAT"),
  reading: entry("haru", ["마음에 남은 문장 하나만 적어봐요.", "몇 쪽이든 읽었으면 충분해요.", "다시 꺼낼 책도 서재에 남겨봐요."], "DIRECT_CHAT"),
  study: entry("hina", ["틀린 문제는 다시 볼 힌트예요.", "헷갈린 유형부터 하나씩 풀어요.", "오늘 외운 한 단어도 진전이에요."], "DIRECT_CHAT"),
  university: entry("hina", ["이번 주 과목과 마감부터 볼까요?", "모르는 일정은 확인 필요로 둬요.", "오늘 들은 강의 한 칸을 남겨요."], "DIRECT_CHAT"),
  certificate: entry("hina", ["시험일과 접수일을 따로 챙겨요.", "남은 분량을 하루씩 나누어 봐요.", "오늘 한 페이지부터 이어가요."], "DIRECT_CHAT"),
  wishlist: entry("haru", ["갖고 싶은 이유부터 남겨볼까요?", "바로 사지 않아도 취향은 쌓여요.", "실제로 자주 쓸지도 같이 봐요."], "DIRECT_CHAT"),
  travel: entry("sooyeon", ["가고 싶은 곳을 동선으로 묶어봐요.", "여행 일정에 쉴 틈도 남겨둬요.", "좋았던 장소는 다음 여행에 꺼내요."], "DIRECT_CHAT"),
  movie: entry("minji", ["좋았던 장면 하나만 남겨봐요.", "별점보다 내 감상이 먼저예요.", "다음에 보고 싶은 작품도 모아둬요."], "DIRECT_CHAT"),
  diary: entry("haru", ["오늘 기억할 장면 하나면 충분해요.", "하루를 다 설명하지 않아도 돼요.", "나중의 내가 반가워할 한 줄을 써요."], "DIRECT_CHAT"),
  tasks: entry("yuna", ["지금 움직일 한 가지부터 골라요.", "기한과 다음 행동을 함께 적어요.", "완료한 한 칸도 오늘의 진전이에요."], "DIRECT_CHAT"),
  calendar: entry("yuna", ["확정 일정과 확인할 일을 나눠요.", "겹친 약속부터 차분히 풀어봐요.", "비어 있는 시간도 남겨둬요."], "DIRECT_CHAT"),
  drive: entry("sua", ["원본과 최신본부터 구분해요.", "다시 찾기 쉬운 이름을 붙여요.", "필요한 자료 위치부터 확인해요."], "DIRECT_CHAT"),
  dev: entry("seoyun", ["바뀐 부분부터 차근차근 볼게요.","아직 확인할 일도 빠짐없이 적어둘게요.","기존 흐름이 편안하게 이어지도록 챙겨요."], "BOARDROOM"),
  aiWork: entry("dohyun", ["필요한 도구와 담당부터 맞춰볼게요.","작업 근거를 모아 다음 사람에게 잘 넘겨요.","확인할 순서를 함께 정리해둘게요."]),
  aiTeam: entry("hani", ["각자 잘하는 일을 함께 볼까요?", "담당자의 근거를 모아 연결할게요.", "팀의 역할을 알고 편하게 불러요."]),
  settings: entry("yuna", ["저장 상태와 백업부터 확인해요.", "모르는 설정은 추측하지 않아요.", "변경할 범위부터 함께 살펴봐요."]),
  work: entry("sua", ["각자 맡은 일과 다음 순서를 같이 볼까요?","막힌 곳은 혼자 안고 있지 않아도 돼요.","작은 진전도 놓치지 않고 챙겨둘게요."], "DIRECT_CHAT"),
  game: entry("sooyeon", ["오늘은 어느 팀부터 볼까요?", "한 경기보다 시즌의 흐름을 봐요.", "응원은 편하게, 리뷰는 차분하게요."], "DIRECT_CHAT"),
  aura: entry("hani", ["오늘 마음에 드는 색을 골라봐요.", "우리 계절에 어울리는 화면을 찾아요.", "편하게 오래 볼 분위기를 골라요."]),
  organization: entry("hani", ["각 팀의 역할부터 함께 둘러봐요.", "우리 동료들이 연결되는 길을 봐요.", "필요한 담당자를 여기서 찾아봐요."]),
  ilbo: entry("minji", ["이번 주 우리 이야기를 모아왔어요.", "작은 기록도 신문의 한 줄이 돼요.", "다음 주 이야기도 함께 기다려요."]),
  milestones: entry("hani", ["더 완벽해지기 위해서가 아니라, 더 나은 삶을 살기 위해.", "오래 기억하고 싶은 변화만 남겨요.", "숫자보다 그 변화의 의미를 함께 적어요.", "자주 쓰지 않아도 괜찮아요. 천천히 쌓여요."]),
  board: entry("hani", ["팀에 남길 이야기를 한 줄 적어요.", "업무도 일상도 편하게 나누어 봐요.", "동료의 새 소식부터 함께 읽어요."]),
  characterArchive: entry("hani", ["우리 동료의 이야기를 만나봐요.", "좋아하는 멤버부터 펼쳐볼까요?", "각자의 성격과 관계를 둘러봐요."]),
  geminiReports: entry("serin", ["변화와 근거를 차분히 살펴볼게요.","관찰한 사실과 해석을 나누어 읽어요.","아직 검증하지 않은 부분도 함께 남겨요."]),
  aiBudget: entry("seoyun", ["남은 한도를 보고 이번 주 작업을 나눠요.","조회 시각과 회복 예정도 함께 챙길게요.","여유를 조금 남기고 차근차근 진행해요."]),
});
// Read-only source references for board personas; the banner remains the owner.
globalThis.HaniEditorialSources = Object.freeze({lines:TAB_CHARACTER_LINES,profiles:CHARACTER_REGISTRY});
if (typeof window !== "undefined") window.HaniEditorialSources = globalThis.HaniEditorialSources;
const SPORTS_LINES = Object.freeze({
  yankees: Object.freeze(["오빠, 양키스는 결과부터 보고 타선과 마운드를 따로 보자. 한 경기로 시즌을 단정하진 말고.", "핀스트라이프 응원은 뜨겁게, 판단은 차분하게. 다음 경기에서 확인할 흐름을 잡자."]),
  kia: Object.freeze(["오빠, 타이거즈는 이긴 날도 진 날도 근거부터 보자. 한 경기로 전술 바꾸진 말자.", "응원은 끝까지 가고, 리뷰는 차분하게. 타선과 마운드를 나눠보자."]),
  madrid: Object.freeze(["오빠, 마드리드는 스코어랑 경기 내용이 다를 수 있어. 장면과 결과를 같이 보자.", "베르나베우의 열기는 좋지. 다음 경기에 이어질 흐름은 따로 확인하자."]),
  dplus: Object.freeze(["오빠, 디플러스는 한 세트만 보고 결론내진 말자. 밴픽과 실제 플레이를 같이 보자.", "응원은 하고, 리뷰는 논점부터. 어떤 선택이 다음 세트에 이어지는지 보자."]),
});

const PAGE_CHARACTER_PROFILES=Object.freeze({
  daon:Object.freeze({identity:"다온 · 리스크 애널리스트",rank:"사원",team:"재무자산관리실",floor:"2F",status:"active",image:"./assets/profiles/hani-profile-daon-v2.webp"}),
  yoonseul:Object.freeze({identity:"윤슬 · 러닝 리서처",rank:"사원",team:"라이프&엔터테인먼트",floor:"2F",status:"active",image:"./assets/profiles/hani-profile-yoonseul-v2.webp"}),
  dohyun:Object.freeze({identity:"도연 · Codex 구현/테스트",image:"./assets/profiles/hani-profile-dohyun.webp"}),
  seoyun:Object.freeze({identity:"서윤 · 배포 팀장",image:"./assets/profiles/hani-profile-seoyun.webp"}),
  serin:Object.freeze({identity:"세린 · Gemini 연구원",image:"./assets/profiles/hani-profile-serin.webp"})
});
// Session-memory only: redraws stay stable; re-entering advances without repeats.
function createTabQuoteSelector(random = Math.random) {
  const indices = new Map();
  let activeKey = "";
  return (tab, view = "home") => {
    const config = Object.hasOwn(TAB_CHARACTER_LINES, tab) ? TAB_CHARACTER_LINES[tab] : TAB_CHARACTER_LINES.home;
    const profile = config && characterProfile(config.speakerId);
    if (!profile) { activeKey = ""; return null; }
    const sports = tab === "game" && Object.hasOwn(SPORTS_LINES, view) ? SPORTS_LINES[view] : null;
    const key = sports ? `${tab}:${view}` : tab;
    const lines = sports || config.lines;
    if (key !== activeKey) {
      indices.set(key, indices.has(key) ? (indices.get(key) + 1) % lines.length : Math.min(lines.length - 1, Math.max(0, Math.floor((Number(random()) || 0) * lines.length))));
      activeKey = key;
    }
    return { agent: config.speakerId, speaker: profile.identity.split(" · ")[0], role: profile.identity.split(" · ")[1], mode: config.mode, quote: lines[indices.get(key)] };
  };
}
// END CANONICAL TAB VOICE BUNDLE
// BEGIN HANI UI MOTION
// Shared, ephemeral UI motion. Canonical owners call completion only after a successful save.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionCompleted = new Set(), motionGoals = new Map(), motionNumbers = new Map(), motionRunning = new Map();
const motionBursts = new Set();
function stopNumber(element) {
  const running = motionRunning.get(element);
  if (!running) return;
  cancelAnimationFrame(running.frame); element.textContent = running.text;
  element.classList.remove('hani-motion-number'); motionRunning.delete(element);
}
function countUp(element, text, key) {
  if (!element) return false;
  text = String(text);
  const previous = motionNumbers.get(key), match = text.match(/^([+\-−]?)(\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!element.getClientRects().length) { stopNumber(element); element.textContent = text; return false; }
  motionNumbers.set(key, text);
  // A renderer may replace an element while an earlier frame is still alive.
  if (motionRunning.get(element)?.text === text && element.querySelector(".hani-motion-number-final")) return false;
  stopNumber(element);
  if (previous === text || motionPreference.matches || !match) {
    element.textContent = text; return false;
  }
  const target = Number((match[1] + match[2]).replaceAll(',', '').replace('−', '-'));
  if (!Number.isFinite(target)) { element.textContent = text; return false; }
  const prior = String(previous || '').match(/^([+\-−]?)(\d[\d,]*(?:\.\d+)?)/);
  const from = prior ? Number((prior[1] + prior[2]).replaceAll(',', '').replace('−', '-')) : 0;
  const decimals = (match[2].split('.')[1] || '').length;
  const final = document.createElement('span'), overlay = document.createElement('span');
  final.className = 'hani-motion-number-final'; final.textContent = text;
  overlay.className = 'hani-motion-number-overlay'; overlay.setAttribute('aria-hidden', 'true');
  element.replaceChildren(final, overlay); element.classList.add('hani-motion-number');
  const started = performance.now(), running = { text, frame:0 };
  const tick = time => {
    if (!element.isConnected || motionPreference.matches) { stopNumber(element); return; }
    const progress = Math.min(1, Math.max(0, (time - started) / 560));
    const value = from + (target - from) * (1 - Math.pow(1 - progress, 3));
    overlay.textContent = (match[1] === '+' && value >= 0 ? '+' : '') + value.toLocaleString('ko-KR', {minimumFractionDigits:decimals, maximumFractionDigits:decimals}) + match[3];
    if (progress >= 1) stopNumber(element);
    else running.frame = requestAnimationFrame(tick);
  };
  motionRunning.set(element, running); running.frame = requestAnimationFrame(tick);
  return true;
}
function celebrate(anchor, page) {
  if (motionPreference.matches || !anchor || anchor.width <= 0 || anchor.height <= 0) return false;
  const burst = document.createElement('span'); burst.className = 'hani-motion-burst'; burst.setAttribute('aria-hidden', 'true');
  // Completion cheers fire at the viewport centre so they are seen wherever the checkbox sits.
  burst.style.left = innerWidth / 2 + 'px';
  burst.style.top = innerHeight / 2 + 'px';
  for (let i = 0; i < 48; i++) {
    const particle = document.createElement('i'), angle = i * Math.PI * 2 / 48;
    particle.style.setProperty('--motion-x', Math.cos(angle) * (110 + i % 5 * 34) + 'px');
    particle.style.setProperty('--motion-y', Math.sin(angle) * (110 + i % 5 * 34) + 'px');
    particle.style.background = ['#8c74ed', '#efaf61', '#59bca3', '#ec88ae'][i % 4];
    burst.append(particle);
  }
  const owner = TAB_CHARACTER_LINES[page] || TAB_CHARACTER_LINES.home;
  const name = CHARACTER_REGISTRY[owner.speakerId]?.identity.split(' · ')[0] || '하니';
  const cheer = document.createElement('b'); cheer.className = 'hani-motion-cheer'; cheer.textContent = '🎉 ' + name + ' · 수고했어요!'; burst.append(cheer);
  document.body.append(burst); motionBursts.add(burst);
  setTimeout(() => { burst.remove(); motionBursts.delete(burst); }, 1500);
  if (typeof toast === 'function') toast(name + ' · 수고했어요! ' + owner.lines[0]);
  return true;
}
function completion(key, wasComplete, isComplete, anchor, page) {
  if (!isComplete) { motionCompleted.delete(key); return false; }
  if (wasComplete || motionCompleted.has(key)) return false;
  motionCompleted.add(key);
  return celebrate(anchor, page);
}
function trackGoal(key, rate, anchor, page) {
  if (!Number.isFinite(rate)) return false;
  const complete = rate >= 100, previous = motionGoals.get(key);
  motionGoals.set(key, complete);
  // Historical achievements on first load are not new completions.
  if (previous === undefined) return false;
  return completion('goal:' + key, previous, complete, anchor, page);
}
function refreshMotion() {
  const home = q('#home.active'), asset = q('#asset.active');
  if (home) ['homeAsset','homeWeight','homeBooks','homeExerciseSteps','homeJispi','homeHinkei'].forEach(id => {
    const element = q('#' + id); if (element) countUp(element, element.querySelector('.hani-motion-number-final')?.textContent || element.textContent, id);
  });
  if (asset) qa('#assetStats .value').forEach((element, i) => countUp(element, element.querySelector('.hani-motion-number-final')?.textContent || element.textContent, 'asset:' + i));
  const panel = q('#settings.active #goalProgressContent');
  if (panel && window.HANI_GOAL_PROGRESS) {
    const type = q('#goalProgressType', panel)?.value, year = Number(q('#goalProgressYear', panel)?.value), quarter = Number(q('#goalProgressQuarter', panel)?.value);
    if (type && year) (window.HANI_GOAL_PROGRESS.read({type, year, quarter}) || []).forEach((fact, i) => {
      const p = fact.progress, card = qa('.goal-progress-grid > article', panel)[i];
      if (p.goal_status === 'RESOLVED' && card) trackGoal([p.goal_id,p.goal_revision,type,year,quarter].join(':'), p.achievement_rate, card.getBoundingClientRect(), 'settings');
    });
  }
}
motionPreference.addEventListener('change', () => {
  if (!motionPreference.matches) return;
  for (const element of motionRunning.keys()) stopNumber(element);
  for (const burst of motionBursts) { burst.remove(); motionBursts.delete(burst); }
});
window.HaniMotion = Object.freeze({completion, trackGoal, countUp, refresh:refreshMotion, reduced:() => motionPreference.matches});

// END HANI UI MOTION

  const selectCharacterQuote=createTabQuoteSelector();
  window.HaniPageQuote=selectCharacterQuote;
  const q=(s,r=document)=>r?.querySelector?.(s)||null, qa=(s,r=document)=>r?.querySelectorAll?Array.from(r.querySelectorAll(s)):[];
  const safe=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const number=v=>Number(v)||0, currentMonth=()=>new Date().toLocaleDateString('en-CA').slice(0,7);
  const money=v=>`${Math.round(number(v)).toLocaleString('ko-KR')}원`;
  const menuLabel=id=>q(`.nav-btn[data-view="${id}"] .txt`)?.textContent?.trim()||pageMeta[id]?.[0]||id;
  const titled=(id,title)=>{const label=menuLabel(id);return !title||title===label?label:`${label} - ${title}`};
  // Canonical presentation metadata. No state writes; scenes and speakers live here.
  const companions={
    hasdaq:{agent:'hani',name:'하니',role:'투자 담당',scene:'asset',line:'숫자는 차분하게, 내일은 조금 더 든든하게.'},
    ne100:{agent:'naeun',name:'나은',role:'건강 담당',scene:'naeun-running',line:'몸무게만 보지 말고, 몸이 바뀌는 과정도 함께 보자!'},
    hinaJones:{agent:'minji',name:'민지',role:'문화 담당',scene:'hina-cinema',line:'좋은 이야기는 책장에도, 스크린에도 있어!'},
    harukei:{agent:'naeun',name:'나은',role:'활동 담당',scene:'steps',line:'잠깐 바람 쐬러 갈까? 오늘의 걸음도 쌓이고 있어.'},
    jispi:{agent:'jieun',name:'지은',role:'생활 자산관리사',scene:'spending',line:'잘 쓴 돈도 기록해 두자. 우리 생활의 취향이니까.'},
    hinkei:{agent:'hina',name:'히나',role:'학습 담당',scene:'learning',line:'틀린 문제도 다음 정답으로 가는 힌트야!'}
  };
  const designSceneSrc=key=>q('img[data-design-scene="'+key+'"]',q('#haniDesignAssets')?.content)?.getAttribute('src')||'';
  const profile=agent=>PAGE_CHARACTER_PROFILES[agent]?.image||sidebarAgentImages[agent]||sidebarAgentImages.hani;
  function speakerMarkup(agent,name,role,line){return `<img src="${profile(agent)}" alt="${safe(name)}" width="64" height="64"><div><small>${safe(name)} · ${safe(role)}</small><p>${safe(line)}</p></div>`}
  const mainCharacterBannerVariants=new Set(['single-character','duo-or-trio','group']);
  // Banner layers: Seasonal Theme (CSS) -> Category Theme -> Sidebar Menu Scene.
  // Internal tabs may change copy and data, but never own or swap scene assets.
  const mainCharacterCategoryThemes=Object.freeze({
  office: {
    tone: "office"
  },
  finance: {
    tone: "finance"
  },
  health: {
    tone: "health"
  },
  growth: {
    tone: "growth"
  },
  life: {
    tone: "life"
  },
  work: {
    tone: "work"
  },
  independent: {
    tone: "company"
  },
  sports: {
    tone: "sports"
  }
});
  const mainCharacterSidebarMenuConfig=Object.freeze({
    "ilbo":Object.freeze({
      sidebarMenuKey:"ilbo",category:"office",owner:"minji",profile:"minji",speaker:"민지",role:"Company Reporter",
      eyebrow:"HANI GROUP · WEEKLY CHRONICLE",title:"HANI 일보",description: "한 주의 기록과 동료들의 이야기",
      quote:"이번 주 우리 이야기를 모아왔어요.",sceneImage: "./assets/heroes/ilbo-226w.webp",
      scenePosition: "center center",scenePositionMobile: "79% center",sceneFit:"cover",sceneFitMobile:"cover",sceneVariant: "panorama",
      sceneAlt:"1층 편집실에서 새 신문을 펼치는 민지 기자와 개구리 회장님",variant:"single-character",tone:"office"
    }),
    "organization":Object.freeze({
      sidebarMenuKey:"organization",category:"independent",owner:"hani",profile:"hani",speaker:"하니",role:"Chief of Staff",
      eyebrow:"HANI GROUP · OUR COMPANY",title:"회사 소개",description: "우리 회사를 만드는 사람들",
      quote:"각자의 전문성이 모여 하나의 팀이 돼요.",sceneImage: "./assets/heroes/organization-226w.webp",
      scenePosition: "center center",scenePositionMobile: "83% center",sceneFit:"cover",sceneFitMobile:"cover",sceneVariant: "panorama",
      sceneAlt:"로비 심벌 앞의 하니·지은·민지·유나·히나·나은·수아·수연·하루 아홉 명",variant:"group",tone:"company"
    }),
    "home":Object.freeze({
  sidebarMenuKey: "home",
  category: "independent",
  owner: "hani",
  profile: "hani",
  speaker: "하니",
  role: "Chief of Staff",
  eyebrow: "DASHBOARD · HANI OS",
  title: "대시보드",
  description: "팀과 함께 살피는 오늘의 흐름",
  quote: "각자의 일이 연결되도록 오늘의 흐름부터 정리해둘게요.",
  sceneImage: "./assets/team/hani-team-office-active-v2.jpg",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "dashboard-command",
  sceneAlt: "HANI OS 아홉 명의 팀원이 회사에서 각자 업무를 수행하는 장면",
  variant: "group",
  tone: "company"
}),
    "intake":Object.freeze({
  sidebarMenuKey: "intake",
  category: "office",
  owner: "yuna",
  profile: "yuna",
  speaker: "유나",
  role: "Info Desk",
  eyebrow: "OFFICE · AI INTAKE DESK",
  title: "인포데스크",
  description: "자료와 요청을 한곳에 모아요",
  quote: "말씀해 주세요. 필요한 것만 정리해서 바로 보여드릴게요.",
  sceneImage: "./assets/banner-preview-v1/infodesk-ai-desk-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "infodesk",
  sceneAlt: "유나가 AI 인포데스크에서 자료와 메모를 분류하는 장면",
  variant: "single-character",
  tone: "office"
}),
    "agentReview":Object.freeze({
  sidebarMenuKey: "agentReview",
  category: "office",
  owner: "hani",
  profile: "hani",
  speaker: "하니",
  role: "Chief of Staff",
  eyebrow: "OFFICE · HANI BOARDROOM",
  title: "HANI 본사",
  description: "중요한 안건을 함께 검토해요",
  quote: "확인할 건 직원들이 확인하고, 결정할 건 대표가 결정합니다.",
  sceneImage: "./assets/banner-preview-v1/ai-approval-boardroom-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "approval",
  sceneAlt: "하니가 수아와 유나와 함께 안건을 검토하는 보드룸 장면",
  variant: "duo-or-trio",
  tone: "office"
}),
    "monthlyReport":Object.freeze({
  sidebarMenuKey: "monthlyReport",
  category: "office",
  owner: "hani",
  profile: "hani",
  speaker: "하니",
  role: "Chief of Staff",
  eyebrow: "OFFICE · LIFE REPORT",
  title: "라이프 리포트",
  description: "한 달의 기록을 함께 돌아봐요",
  quote: "기록은 바꾸지 않고, 한 달의 흐름만 선명하게 정리할게요.",
  sceneImage: "./assets/banner-preview-v1/conference-room-reports-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "report",
  sceneAlt: "하니가 HANI GROUP 월간 보고를 정리하는 장면",
  variant: "single-character",
  tone: "office"
}),
    "board":Object.freeze({
  sidebarMenuKey: "board",
  category: "office",
  owner: "hani",
  profile: "hani",
  speaker: "하니",
  role: "Chief of Staff",
  eyebrow: "OFFICE · COMPANY BOARD",
  title: "HANI 라운지",
  description: "동료들과 나누는 오늘의 소식",
  quote: "팀에 남길 이야기를 한 줄 적어요.",
  sceneImage: "./assets/banner-preview-v1/company-board-community-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "company-board-community",
  sceneAlt: "하니와 유나, 서윤이 HANI 라운지 앞에서 소식을 나누는 장면",
  variant: "duo-or-trio",
  tone: "office"
}),
    "aiWork":Object.freeze({
  sidebarMenuKey: "aiWork",
  category: "work",
  owner: "dohyun",
  profile: "dohyun",
  speaker: "도연",
  role: "Implementation & QA",
  eyebrow: "WORK · AI WORK STATUS",
  title: "AI 업무 현황",
  description: "진행 중인 AI 작업을 살펴봐요",
  quote: "작업 근거를 모아 다음 사람에게 잘 넘겨요.",
  sceneImage: "./assets/heroes/aiWork-218.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "panorama",
  sceneAlt: "안경을 쓴 도연과 유리가 태블릿과 개발 작업 현황을 점검하는 장면",
  variant: "duo-or-trio",
  tone: "work"
}),
    "geminiReports":Object.freeze({
  sidebarMenuKey: "geminiReports",
  category: "work",
  owner: "serin",
  profile: "serin",
  speaker: "세린",
  role: "Research Analyst",
  eyebrow: "WORK · DEVELOPMENT REPORTS",
  title: "개발 보고서",
  description: "개발 기록과 연구 자료를 모아요",
  quote: "관찰한 사실과 해석을 나누어 읽어요.",
  sceneImage: "./assets/heroes/geminiReports-218.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "panorama",
  sceneAlt: "세린과 도연이 연구 자료와 개발 보고서를 검토하는 장면",
  variant: "single-character",
  tone: "work"
}),
    "milestones":Object.freeze({
      sidebarMenuKey:"milestones",category:"independent",owner:"hani",profile:"hani",speaker:"하니",role:"Chief of Staff",
      eyebrow:"MILESTONES · LIFE ARCHIVE",title:"삶에 남은 변화들",description: "더 나은 삶을 살기 위해",
      quote:"더 완벽해지기 위해서가 아니라, 더 나은 삶을 살기 위해.",sceneImage: "./assets/heroes/organization-226w.webp",
      scenePosition: "center center",scenePositionMobile: "83% center",sceneFit:"cover",sceneFitMobile:"cover",sceneVariant: "panorama",
      sceneAlt:"로비 심벌 앞에 함께 선 HANI GROUP 동료들",variant:"group",tone:"company"
    }),
    "aiBudget":Object.freeze({
  sidebarMenuKey: "aiBudget",
  category: "work",
  owner: "seoyun",
  profile: "seoyun",
  speaker: "서윤",
  role: "AI Operations",
  eyebrow: "WORK · AI WEEKLY BUDGET",
  title: "AI 주간 예산",
  description: "이번 주 AI 사용 흐름을 살펴봐요",
  quote: "남은 한도를 보고 이번 주 작업을 나눠요.",
  sceneImage: "./assets/heroes/aiBudget-218.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "panorama",
  sceneAlt: "서윤과 도연이 자원 차트로 AI 사용 예산을 검토하는 장면",
  variant: "single-character",
  tone: "work"
}),
    "policy":Object.freeze({
  sidebarMenuKey: "policy",
  category: "office",
  owner: "sua",
  profile: "sua",
  speaker: "수아",
  role: "Operations Lead",
  eyebrow: "OFFICE · OPERATIONS GUIDE",
  title: "사내 규칙",
  description: "함께 일하기 위한 약속",
  quote: "규칙은 일을 막는 문서가 아니라 판단을 빠르게 만드는 기준이에요.",
  sceneImage: "./assets/banner-preview-v1/company-rules-board-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "rules",
  sceneAlt: "수아가 운영 문서와 체크리스트 보드를 정리하는 장면",
  variant: "single-character",
  tone: "office"
}),
    "deployment":Object.freeze({
  sidebarMenuKey: "deployment",
  category: "office",
  owner: "seoyun",
  profile: "seoyun",
  speaker: "서윤",
  role: "Release Lead",
  eyebrow: "OFFICE · RELEASE CONTROL",
  title: "배포센터",
  description: "미리보기부터 배포까지 한눈에",
  quote: "Preview와 승인 기록이 맞는지 확인하고 안전하게 넘길게요.",
  sceneImage: "./assets/heroes/deployment-218.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "panorama",
  sceneAlt: "서윤·유리·아린이 배포 모니터와 점검표를 함께 확인하는 장면",
  variant: "duo-or-trio",
  tone: "office"
}),
    "investment":Object.freeze({
  sidebarMenuKey: "investment",
  category: "finance",
  owner: "hani",
  profile: "hani",
  speaker: "하니",
  role: "Investment Lead",
  eyebrow: "FINANCE · HANI INVESTMENT DESK",
  title: "투자",
  description: "시장과 포트폴리오를 함께 살펴요",
  quote: "차트보다 먼저 흐름을 볼게요. 중요한 변화만 같이 확인해요.",
  sceneImage: "./assets/heroes/investment-226w.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "panorama",
  sceneAlt: "하니·지은·검은 단발의 다온이 투자 시세와 자료를 검토하는 장면",
  variant: "duo-or-trio",
  tone: "finance"
}),
    "investmentCommittee":Object.freeze({
  sidebarMenuKey: "investmentCommittee",
  category: "finance",
  owner: "hani",
  profile: "hani",
  speaker: "하니",
  role: "Chief Investment Strategist",
  eyebrow: "FINANCE · INVESTMENT REPORT",
  title: "HANI 투자 리포트",
  description: "투자 판단의 근거를 모아요",
  quote: "가격과 근거를 나누고, 판단을 바꾸는 조건을 함께 확인해요.",
  sceneImage: "./assets/banner-preview-v1/investment-market-room-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "panorama",
  sceneAlt: "하니와 지은이 현대적인 시장 분석실에서 투자 데이터를 검토하는 장면",
  variant: "duo-or-trio",
  tone: "finance"
}),
    "investmentIntake":Object.freeze({
  sidebarMenuKey: "investmentIntake",
  category: "finance",
  owner: "hani",
  profile: "hani",
  speaker: "하니",
  role: "Finance Lead",
  eyebrow: "FINANCE · MONTH-END UPDATE",
  title: "자산 업데이트",
  description: "월말 명세서를 차근차근 정리해요",
  quote: "이번 달 기록을 맞춰두면 다음 달 판단이 훨씬 편해져요.",
  sceneImage: "./assets/heroes/investmentIntake-226w.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "panorama",
  sceneAlt: "지은과 하니가 커피·계산기·월말 명세서를 대조하는 장면",
  variant: "duo-or-trio",
  tone: "finance"
}),
    "asset":Object.freeze({
  sidebarMenuKey: "asset",
  category: "finance",
  owner: "jieun",
  profile: "jieun",
  speaker: "지은",
  role: "Asset Manager",
  eyebrow: "FINANCE · LONG-TERM ASSET INDEX",
  title: "자산",
  description: "자산과 장기 계획을 한눈에",
  quote: "자산은 한 번에 커지지 않아. 안 새는 돈이 쌓여서 체력이 돼.",
  sceneImage: "./assets/heroes/asset-226w.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "panorama",
  sceneAlt: "지은과 다온이 자산 원장과 장기 계획을 검토하는 장면",
  variant: "duo-or-trio",
  tone: "finance"
}),
    "ledger":Object.freeze({
  sidebarMenuKey: "ledger",
  category: "finance",
  owner: "jieun",
  profile: "jieun",
  speaker: "지은",
  role: "Life Finance",
  eyebrow: "FINANCE · MONTHLY SPENDING",
  title: "가계부",
  description: "오늘의 지출을 가볍게 정리해요",
  quote: "후회보다 패턴을 찾자. 다음 달에 편해질 한 가지만 남기면 돼.",
  sceneImage: "./assets/heroes/ledger-226w.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "panorama",
  sceneAlt: "지은과 하루가 영수증·계산기·가계부를 함께 정리하는 장면",
  variant: "duo-or-trio",
  tone: "finance"
}),
    "newsroom":Object.freeze({
  sidebarMenuKey: "newsroom",
  category: "finance",
  owner: "hani",
  profile: "hani",
  speaker: "하니",
  role: "Market Editor",
  eyebrow: "FINANCE · MARKET NEWS DESK",
  title: "뉴스룸",
  description: "시장 소식과 관심 뉴스를 모아요",
  quote: "뉴스의 양보다 판단을 바꾸는 재료가 있는지 먼저 볼게요.",
  sceneImage: "./assets/heroes/newsroom-226w.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "panorama",
  sceneAlt: "하니와 민지가 신문과 시장 자료를 함께 검토하는 장면",
  variant: "duo-or-trio",
  tone: "finance"
}),
    "diet":Object.freeze({
  sidebarMenuKey: "diet",
  category: "health",
  owner: "naeun",
  profile: "naeun",
  speaker: "나은",
  role: "Health Mate",
  eyebrow: "HEALTH · DAILY NUTRITION",
  title: "다이어트",
  description: "건강한 하루의 리듬을 기록해요",
  quote: "완벽한 하루보다 다시 기록하는 하루가 몸을 더 오래 바꿔요.",
  sceneImage: "./assets/banner-preview-v1/nutrition-tracking-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "panorama",
  sceneAlt: "나은이 균형 잡힌 식사를 준비하고 식단 노트에 기록하는 밝은 주방 장면",
  variant: "single-character",
  tone: "health"
}),
    "exercise":Object.freeze({
  sidebarMenuKey: "exercise",
  category: "health",
  owner: "naeun",
  profile: "naeun",
  speaker: "나은",
  role: "Health Mate",
  eyebrow: "HEALTH · ACTIVE ROUTINE",
  title: "운동",
  description: "오늘의 움직임을 기록해요",
  quote: "한 끼로 살찌지도, 한 번 굶어서 빠지지도 않아. 추세를 보자.",
  sceneImage: "./assets/heroes/exercise-226w.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "panorama",
  sceneAlt: "나은이 운동장 러닝화 끈을 묶으며 운동을 준비하는 장면",
  variant: "single-character",
  tone: "health"
}),
    "reading":Object.freeze({
  sidebarMenuKey: "reading",
  category: "growth",
  owner: "haru",
  profile: "haru",
  speaker: "하루",
  role: "Archive Mate",
  eyebrow: "GROWTH · LIBRARY ARCHIVE",
  title: "독서·서재",
  description: "책과 오래 간직할 문장을 모아요",
  quote: "좋았던 문장은 접어두지 말고, 나중의 나를 위해 남겨두자.",
  sceneImage: "./assets/heroes/reading-226w.webp",
  scenePosition: "center center",
  scenePositionMobile: "82% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "panorama",
  sceneAlt: "옆땋은 머리와 둥근 안경의 윤슬·긴 갈색 머리와 하늘색 재킷의 하루가 서재에서 함께 책을 읽는 장면",
  variant: "duo-or-trio",
  tone: "growth"
}),
    "study":Object.freeze({
  sidebarMenuKey: "study",
  category: "growth",
  owner: "hina",
  profile: "hina",
  speaker: "히나",
  role: "Learning Mate",
  eyebrow: "GROWTH · JAPANESE STUDY ROOM",
  title: "공부",
  description: "오늘 배운 것을 차곡차곡",
  quote: "예쁘게 시작해도 좋아. 오늘 외운 한 단어가 내일의 실력이야!",
  sceneImage: "./assets/heroes/study-226w.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "panorama",
  sceneAlt: "히나와 윤슬이 교재와 노트를 펼쳐 함께 공부하는 장면",
  variant: "duo-or-trio",
  tone: "growth"
}),
    "university":Object.freeze({
  sidebarMenuKey: "university",
  category: "growth",
  owner: "hina",
  profile: "hina",
  speaker: "히나",
  role: "Learning Mate",
  eyebrow: "GROWTH · CAMPUS PLANNER",
  title: "대학교 관리",
  description: "수업과 학기의 흐름을 정리해요",
  quote: "마감부터 보이면 마음이 복잡해져. 이번 주 한 칸씩 먼저 채우자.",
  sceneImage: "./assets/heroes/university-226w.webp",
  scenePosition: "center center",
  scenePositionMobile: "80% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "panorama",
  sceneAlt: "꽃장식 올림머리와 분홍 재킷의 히나가 대학 강의실에서 수업 노트를 정리하는 장면",
  variant: "single-character",
  tone: "growth"
}),
    "certificate":Object.freeze({
  sidebarMenuKey: "certificate",
  category: "growth",
  owner: "hina",
  profile: "hina",
  speaker: "히나",
  role: "Learning Mate",
  eyebrow: "GROWTH · EXAM ROADMAP",
  title: "자격증",
  description: "목표 자격증을 향한 한 걸음",
  quote: "접수일 놓치고 공부만 열심히 하면 정말 슬퍼. 일정부터 확인!",
  sceneImage: "./assets/banner-preview-v1/certification-roadmap-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "certificate",
  sceneAlt: "히나가 자격증 시험 로드맵과 모의시험 자료를 확인하는 준비실 장면",
  variant: "single-character",
  tone: "growth"
}),
    "wishlist":Object.freeze({
  sidebarMenuKey: "wishlist",
  category: "life",
  owner: "haru",
  profile: "haru",
  speaker: "하루",
  role: "Wish Mate",
  eyebrow: "LIFE · WISH PLANNING LAB",
  title: "Wish-list",
  description: "해보고 싶은 일을 모아요",
  quote: "바로 사지 말고, 왜 갖고 싶은지부터 예쁘게 붙여두자.",
  sceneImage: "./assets/banner-preview-v1/wishlist-planning-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "wishlist",
  sceneAlt: "하루와 수연이 사진과 후보 카드를 비교하며 위시리스트를 정리하는 장면",
  variant: "duo-or-trio",
  tone: "life"
}),
    "travel":Object.freeze({
  sidebarMenuKey: "travel",
  category: "life",
  owner: "sooyeon",
  profile: "sooyeon",
  speaker: "수연",
  role: "Travel Coach",
  eyebrow: "LIFE · TRAVEL PLANNING",
  title: "여행",
  description: "다음 여행의 설렘을 기록해요",
  quote: "예쁜 곳은 많아. 이동이 편한 순서로 묶으면 여행이 더 오래 기억나.",
  sceneImage: "./assets/banner-preview-v1/travel-route-planning-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "panorama",
  sceneAlt: "수연이 지도와 티켓을 펼쳐 여행 동선을 설계하는 밝은 계획실 장면",
  variant: "single-character",
  tone: "life"
}),
    "movie":Object.freeze({
  sidebarMenuKey: "movie",
  category: "life",
  owner: "minji",
  profile: "minji",
  speaker: "민지",
  role: "Daily Mate",
  eyebrow: "LIFE · CINEMA ARCHIVE",
  title: "시청 아카이브",
  description: "좋아하는 영화와 드라마의 기록",
  quote: "좋았던 장면은 남겨두자. 다음에 다시 꺼내 볼 수 있게.",
  sceneImage: "./assets/design-system-v1/hina-cinema-canonical.webp",
  scenePosition: "center center",
  scenePositionMobile: "78% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "panorama",
  sceneAlt: "민지와 동료들이 영화관에서 영화에 몰입해 감상하는 장면",
  variant: "duo-or-trio",
  tone: "life"
}),
    "diary":Object.freeze({
  sidebarMenuKey: "diary",
  category: "life",
  owner: "haru",
  profile: "haru",
  speaker: "하루",
  role: "Daily Archive",
  eyebrow: "LIFE · PERSONAL JOURNAL",
  title: "일기",
  description: "오늘의 마음을 한 페이지에",
  quote: "오늘을 다 설명하지 않아도 돼. 기억하고 싶은 것부터 적어보자.",
  sceneImage: "./assets/banner-preview-v1/diary-night-desk-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "diary",
  sceneAlt: "하루가 따뜻한 스탠드 아래 밤의 책상에서 일기를 쓰는 장면",
  variant: "single-character",
  tone: "life"
}),
    "tasks":Object.freeze({
  sidebarMenuKey: "tasks",
  category: "work",
  owner: "yuna",
  profile: "yuna",
  speaker: "유나",
  role: "Info Desk",
  eyebrow: "WORK · ACTION BOARD",
  title: "할 일",
  description: "지금 할 일을 차근차근",
  quote: "해야 할 일은 머리에 두지 말고, 지금 움직일 한 칸으로 바꿔둘게요.",
  sceneImage: "./assets/heroes/tasks-218.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "panorama",
  sceneAlt: "유나와 가은이 업무 보드에서 할 일 카드를 함께 정리하는 장면",
  variant: "single-character",
  tone: "work"
}),
    "calendar":Object.freeze({
  sidebarMenuKey: "calendar",
  category: "work",
  owner: "yuna",
  profile: "yuna",
  speaker: "유나",
  role: "Schedule Desk",
  eyebrow: "WORK · SCHEDULE BOARD",
  title: "캘린더",
  description: "다가오는 일정을 한눈에",
  quote: "겹치는 일정부터 풀어두면 이번 달이 훨씬 덜 복잡해져요.",
  sceneImage: "./assets/heroes/calendar-218.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "panorama",
  sceneAlt: "유나와 가은이 달력과 다이어리로 일정을 계획하는 장면",
  variant: "duo-or-trio",
  tone: "work"
}),
    "drive":Object.freeze({
  sidebarMenuKey: "drive",
  category: "work",
  owner: "sua",
  profile: "sua",
  speaker: "수아",
  role: "Operations Lead",
  eyebrow: "WORK · FILE LIBRARY",
  title: "Drive",
  description: "필요한 자료를 한곳에",
  quote: "저장만 해두면 창고가 돼. 다시 찾을 기준까지 같이 붙여둘게요.",
  sceneImage: "./assets/banner-preview-v1/drive-archive-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "drive",
  sceneAlt: "유나와 수아가 문서 폴더와 클라우드 자료를 정리하는 장면",
  variant: "duo-or-trio",
  tone: "work"
}),
    "dev":Object.freeze({
  sidebarMenuKey: "dev",
  category: "work",
  owner: "seoyun",
  profile: "seoyun",
  speaker: "서윤",
  role: "Development Lead",
  eyebrow: "WORK · DEVELOPMENT CONTROL",
  title: "개발센터",
  description: "개발의 다음 단계를 함께 살펴요",
  quote: "새 기능보다 먼저 지금 흐름이 안전한지 점검하고 이어갈게요.",
  sceneImage: "./assets/heroes/dev-218.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "panorama",
  sceneAlt: "서윤·도연·세린·유리·아린이 개발 스튜디오에서 함께 점검하는 장면",
  variant: "duo-or-trio",
  tone: "work"
}),
    "aiTeam":Object.freeze({
  sidebarMenuKey: "aiTeam",
  category: "independent",
  owner: "hani",
  profile: "hani",
  speaker: "하니",
  role: "Chief of Staff",
  eyebrow: "HANI OS · PERSONAL AI COMPANY",
  title: "AI 팀",
  description: "각자의 전문성으로 함께하는 팀",
  quote: "각자 잘하는 일이 달라서, 함께 움직일 때 회사가 완성돼요.",
  sceneImage: "./assets/brand/hani-group-company-profile-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "ai-team",
  sceneAlt: "HANI AI TEAM 아홉 명이 함께 있는 공식 회사 장면",
  variant: "group",
  tone: "company"
}),
    "settings":Object.freeze({
  sidebarMenuKey: "settings",
  category: "independent",
  owner: "yuna",
  profile: "yuna",
  speaker: "유나",
  role: "System Desk",
  eyebrow: "HANI OS · SYSTEM VAULT",
  title: "설정·데이터",
  description: "나에게 맞는 HANI OS",
  quote: "저장 상태와 백업 위치를 먼저 확인하고 안전하게 정리해둘게요.",
  sceneImage: "./assets/banner-preview-v1/settings-data-vault-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "settings",
  sceneAlt: "유나와 지은이 백업 장치와 데이터 보관함을 점검하는 장면",
  variant: "duo-or-trio",
  tone: "system"
}),
    "work":Object.freeze({
  sidebarMenuKey: "work",
  category: "work",
  owner: "sua",
  profile: "sua",
  speaker: "수아",
  role: "Operations Lead",
  eyebrow: "WORK · DAILY ASSISTANT",
  title: "업무 보조",
  description: "오늘의 업무 흐름을 정리해요",
  quote: "필요한 자료와 다음 행동을 한 흐름으로 정리해둘게요.",
  sceneImage: "./assets/banner-preview-v1/tasks-kanban-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "work",
  sceneAlt: "수아가 업무 카드와 실행 순서를 정리하는 실무 보드 장면",
  variant: "single-character",
  tone: "work"
}),
    "game":Object.freeze({
  sidebarMenuKey: "game",
  category: "sports",
  owner: "sooyeon",
  profile: "sooyeon",
  speaker: "수연",
  role: "Head Coach",
  eyebrow: "HANI OS · SPORTS LOUNGE",
  title: "스포츠",
  description: "함께 즐기는 오늘의 스포츠",
  quote: "감독님, 오늘은 어느 팀부터 확인할까요?",
  sceneImage: "./assets/sports/hani-sports-hero-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "76% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "sports-lounge",
  sceneAlt: "수연과 HANI OS 팀이 스포츠 라운지에서 함께 경기를 응원하는 웹툰 장면",
  variant: "group",
  tone: "sports"
})
  });
  const mainCharacterInternalContent=Object.freeze({
    game:Object.freeze({
      yankees:Object.freeze({
        eyebrow:'SPORTS LOUNGE · MLB',title:'NEW YORK YANKEES',
        description:'뉴욕 양키스의 최근 경기 결과를 매일 갱신해 확인합니다.',
        quote:'핀스트라이프의 오늘, 최근 경기부터 차분히 볼게요.'
      }),
      kia:Object.freeze({
        eyebrow:'SPORTS LOUNGE · KBO',title:'KIA TIGERS',
        description:'KIA 타이거즈의 최근 경기 결과를 매일 갱신해 확인합니다.',
        quote:'타이거즈의 흐름, 마지막 경기와 소식부터 확인해요.'
      }),
      madrid:Object.freeze({
        eyebrow:'SPORTS LOUNGE · FOOTBALL',title:'REAL MADRID',
        description:'레알 마드리드의 최근 결과와 주요 소식을 주 1회 갱신합니다.',
        quote:'베르나베우의 오늘도 결과와 장면을 함께 챙겨볼까요?'
      }),
      dplus:Object.freeze({
        eyebrow:'SPORTS LOUNGE · ESPORTS',title:'DPLUS KIA',
        description:'Dplus KIA의 최근 결과와 주요 소식을 주 1회 갱신합니다.',
        quote:'경기 결과와 팀 소식, 중요한 것부터 빠르게 볼게요.'
      })
    })
  });
  function mainCharacterBannerConfig(sidebarMenuKey,internalView='home'){
    const sidebarMenu=mainCharacterSidebarMenuConfig[sidebarMenuKey];
    const theme=mainCharacterCategoryThemes[sidebarMenu?.category];
    const contentByView=mainCharacterInternalContent[sidebarMenuKey]||{};
    if(!sidebarMenu||!theme)return null;
    const resolvedView=internalView==='home'||contentByView[internalView]?internalView:'home';
    const seasonal=sidebarMenuKey==='home'&&typeof SEASON_COLLECTION_ARTWORK!=='undefined'&&SEASON_COLLECTION_ARTWORK[document.documentElement.dataset.season];
    return {...theme,...sidebarMenu,...(contentByView[resolvedView]||{}),...(seasonal?{sceneImage:seasonal.src,sceneAlt:seasonal.alt}:{}),internalView:resolvedView};
  }
  // Read-only metadata shared with Remote; resolving a view never preloads artwork.
  if(typeof window!=='undefined')window.HANI_MAIN_CHARACTER_BANNER=Object.freeze({get:mainCharacterBannerConfig});
  const mainCharacterInternalViewExists=(sidebarMenuKey,internalView)=>internalView==='home'||Boolean(mainCharacterInternalContent[sidebarMenuKey]?.[internalView]);
  function mainCharacterBanner(id,config){
    const root=q(`#${id}`);if(!root||!config)return null;
    let el=q(':scope > .ds-main-character-banner',root);
    if(!el){
      el=document.createElement('section');
      el.dataset.mainCharacterBanner=id;
      el.innerHTML='<figure class="ds-main-character-banner__scene"><img width="2172" height="724" loading="lazy" decoding="async"></figure><span class="ds-main-character-banner__seasonal-fx" aria-hidden="true"></span><div class="ds-main-character-banner__copy"><span class="ds-main-character-banner__eyebrow"></span><h2 class="ds-main-character-banner__title"></h2><p class="ds-main-character-banner__description"></p><span class="ds-main-character-banner__status" hidden></span><div class="ds-main-character-banner__agent" data-main-character-banner-agent-slot></div></div>';
      root.prepend(el);
    }
    const variant=mainCharacterBannerVariants.has(config.variant)?config.variant:'single-character';
    el.className=`ds-main-character-banner ds-main-character-banner--${variant} ds-tone-${config.tone||'work'}`;
    el.dataset.owner=config.owner||'';el.dataset.category=config.category||'';el.dataset.menu=config.sidebarMenuKey||id;el.dataset.internalView=config.internalView||'';el.dataset.sceneVariant=config.sceneVariant||'';el.removeAttribute('data-scene-fallback');
    [['--mcb-scene-position',config.scenePosition],['--mcb-scene-position-mobile',config.scenePositionMobile],['--mcb-scene-width',config.sceneWidth],['--mcb-scene-fit',config.sceneFit],['--mcb-scene-fit-mobile',config.sceneFitMobile]].forEach(([property,value])=>value?el.style.setProperty(property,value):el.style.removeProperty(property));
    const titleId=`${id}MainCharacterBannerTitle`;
    el.setAttribute('role','group');el.setAttribute('aria-labelledby',titleId);
    const title=q('.ds-main-character-banner__title',el);title.id=titleId;title.textContent=config.title||titled(id,'');
    q('.ds-main-character-banner__eyebrow',el).textContent=config.eyebrow||'HANI OS';
    q('.ds-main-character-banner__description',el).textContent=config.description||'';


    const image=q('.ds-main-character-banner__scene img',el);
    if(id==='home')image.id='seasonalLifeArtwork';
    if(image.getAttribute('src')!==config.sceneImage)image.setAttribute('src',config.sceneImage||'');
    image.alt=config.sceneAlt||'';image.onerror=()=>{if(el.dataset.sceneFallback)return;el.dataset.sceneFallback='1';image.src='./assets/team/hani-team-office-active-v2.jpg';image.alt='HANI OS 팀 기본 장면';};
    return el;
  }
  function syncMainCharacterBannerAgent(id,config){
    const root=q(`#${id}`),el=q(':scope > .ds-main-character-banner',root),banner=q('#aiBanner');
    if(!root?.classList.contains('active')||!banner||(el&&!el.contains(banner))||!config)return;
    const voice=selectCharacterQuote?.(id,config.internalView||'home');
    if(voice){config={...config,owner:voice.agent,profile:voice.agent,speaker:voice.speaker,role:voice.role,quote:voice.quote};if(el)el.dataset.owner=voice.agent;}
    const agent=config.profile||config.owner||'hani',avatar=q('#aiAvatar',banner),quote=q('#aiQuote',banner),image=profile(agent);
    if(avatar){avatar.className=`ai-avatar has-photo agent-${agent}`;avatar.style.backgroundImage=`url(${image})`;avatar.textContent=''}
    if(quote){let label=q(':scope > span',quote),body=q(':scope > b',quote);if(!label||!body){quote.replaceChildren();label=document.createElement('span');body=document.createElement('b');quote.append(label,body)}label.textContent=`${config.speaker||'하니'} 한마디`;body.textContent=`“${config.quote||''}”`}
    if(!el)return;
    const kicker=q('#aiKicker',banner),name=q('#aiName',banner),message=q('#aiMessage',banner),role=q('#aiRole',banner);
    if(kicker)kicker.textContent=String(config.category||'HANI OS').toUpperCase();if(name)name.textContent=titled(id,config.title);if(message)message.textContent=config.description||'';if(role)role.textContent=`${config.speaker||'하니'} · ${config.role||''}`;
  }
  function currentSportsMenu(){const root=q('#game'),key=root?.dataset.sportsMenu||q('[data-sports-tab].active',root)?.dataset.sportsTab||'home';return mainCharacterInternalViewExists('game',key)?key:'home'}
  function renderSportsBanner(menu=currentSportsMenu()){
    const config=mainCharacterBannerConfig('game',menu),el=mainCharacterBanner('game',config);syncMainCharacterBannerAgent('game',config);return el;
  }
  function mountDesignSlots(){
    const active=q('.view.active'),banner=q('#aiBanner'),target=q(':scope > :is(.hani-master-hero,.ds-main-character-banner)',active),agentSlot=target?(q('[data-main-character-banner-agent-slot]',target)||target):null;
    if(banner){banner.classList.toggle('ds-integrated-agent',!!target);if(agentSlot&&banner.parentElement!==agentSlot)agentSlot.append(banner);else if(!target&&banner.parentElement!==q('main.main'))q('main.main > header').after(banner)}
    if(active?.id==='game')renderSportsBanner();else if(active?.id)syncMainCharacterBannerAgent(active.id,mainCharacterBannerConfig(active.id,'home')||{});
    if(active?.id==='intake'){const h=q('.hani-master-title',target);if(h)h.textContent='인포데스크'}
    const home=q('#home');
    q(':scope > .ds-team-hero',home)?.remove();
    const actions=q('.home-welcome-actions'),yuna=q('#homeYunaQuick');if(actions&&yuna&&!actions.contains(yuna))actions.append(yuna);
    const side=q('.home-mix-card');if(side&&!q('.ds-companion-scene',side)){const scene=document.createElement('figure');scene.className='ds-companion-scene';scene.innerHTML='<img alt="" width="2172" height="724"><figcaption class="ds-agent-comment"></figcaption>';q('.sh',side).after(scene)}
    const recent=q('.home-activity-card'),lower=q('.home-lower-grid');if(recent&&lower&&!lower.contains(recent))lower.insertBefore(recent,q('.home-team-panel',lower));
    const ledger=q('#investmentIntake .ledger-import');if(ledger&&!q('.ds-agent-comment',ledger)){const comment=document.createElement('div');comment.className='ds-agent-comment ds-jieun';comment.innerHTML=speakerMarkup('jieun','지은','생활 자산관리사','이번 달도 수고했어! 붙여넣고 미리보기에서 같이 확인하자.');q(':scope > .sh',ledger)?.after(comment)}
    const account=q('#assetAccountManager');if(account&&!q('.ds-account-comment')){const comment=document.createElement('div');comment.className='ds-agent-comment ds-account-comment';comment.innerHTML=speakerMarkup('hani','하니','투자 담당','계좌 화면은 하나씩 차근차근. 원본과 숫자를 맞춘 다음 확정하자!');q(':scope > .sh',account.closest('.card'))?.after(comment)}
    const comment=q('.ledger-jieun-comment');if(comment&&!q('.ds-comment-portrait',comment)){const img=document.createElement('img');img.className='ds-comment-portrait';img.src=profile('jieun');img.alt='지은';q('#ledgerJieunComment').before(img)}
    if(comment)comment.classList.toggle('is-editing',!q('#ledgerJieunEditor').hidden);
  }
  function updateCompanion(selected){const data=companions[selected]||companions.hasdaq,slot=q('.ds-companion-scene');if(!slot||slot.dataset.index===selected)return;slot.dataset.index=selected;const image=q('img',slot);image.src=designSceneSrc(data.scene);image.alt=`${data.name}와 동료들의 ${data.role} 웹툰 장면`;q('figcaption',slot).innerHTML=speakerMarkup(data.agent,data.name,data.role,data.line)}
  const heroImages={dev:"./assets/heroes/dev-218.webp",asset:"./assets/heroes/asset-218.webp",monthEnd:"./assets/heroes/investmentIntake-218.webp",ledger:"./assets/heroes/ledger-218.webp",diet:"./assets/heroes/diet-218.webp",exercise:"./assets/heroes/exercise-218.webp",reading:"./assets/heroes/reading-218.webp",movie:"./assets/heroes/movie-218.webp",study:"./assets/heroes/study-218.webp",campus:"./assets/heroes/university-218.webp",travel:"./assets/heroes/travel-218.webp",investment:"./assets/heroes/investment-218.webp",newsroom:"./assets/heroes/newsroom-218.webp",portraitHani:"./assets/profiles/hani-profile-hani.webp",portraitHina:"./assets/profiles/hani-profile-hina.webp",portraitHaru:"./assets/profiles/hani-profile-haru.webp",portraitMinji:"./assets/profiles/hani-profile-minji.webp",portraitSua:"./assets/profiles/hani-profile-sua-id.webp",portraitYuna:"./assets/profiles/hani-profile-yuna.webp",teamOffice:"./assets/team/hani-team-office.webp",teamPicnic:"./assets/team/hani-team-picnic.webp",lifeMarket:"./assets/design-system-v1/srx.webp",learningScene:"./assets/design-system-v1/learning.webp"};
  const genericHeroScenes={intake:'portraitYuna',agentReview:'teamOffice',monthlyReport:'portraitHani',policy:'portraitSua',deployment:'dev',certificate:'learningScene',wishlist:'lifeMarket',diary:'portraitHaru',tasks:'portraitYuna',calendar:'portraitYuna',work:'portraitSua',drive:'portraitYuna',dev:'dev',aiTeam:'teamPicnic',settings:'portraitYuna'};
  const lifeMarketImages=[designSceneSrc("srx")];
  const lifeMarketDateKey=new Date().toLocaleDateString('en-CA');
  const lifeMarketImageSeed=[...lifeMarketDateKey].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
  const lifeMarketImage=lifeMarketImages[lifeMarketImageSeed%lifeMarketImages.length];
  function quizMetrics(){return homeQuizMetrics()}
  function hero(id,{tone,kicker,title,copy,value='기록 없음',change='',scene=tone}){
    const root=q(`#${id}`);if(!root)return null;let el=q(':scope > .index-hero-v02992',root);
    if(!el){el=document.createElement('div');root.prepend(el);el.innerHTML='<div class="hani-master-copy"><span class="hani-master-eyebrow"></span><div class="hani-master-titleline"><h2 class="hani-master-title"></h2><strong class="hani-master-metric"></strong><span class="hani-master-change"></span></div><p class="hani-master-description"></p></div><div class="hani-master-scene"><img alt=""></div>'}
    const className=`index-hero-v02992 hani-master-hero ds-page-hero ds-tone-${tone} spatial-scene-${scene}`;if(el.className!==className)el.className=className;
    const direction=change&&/(^|[\s·:])[-−↓]/.test(change.trim())?'down':change&&/(^|[\s·:])[+↑]/.test(change.trim())?'up':'neutral';
    const updateText=(selector,value)=>{const node=q(selector,el);if(node.textContent!==value)node.textContent=value};
    updateText('.hani-master-eyebrow',kicker);
    updateText('.hani-master-title',titled(id,title));
    const metric=q('.hani-master-metric',el),delta=q('.hani-master-change',el);
    updateText('.hani-master-metric',value);metric.hidden=!value;updateText('.hani-master-change',change);delta.hidden=!change;if(delta.className!==`hani-master-change ${direction}`)delta.className=`hani-master-change ${direction}`;
    updateText('.hani-master-description',copy);
    const sceneRoot=q('.hani-master-scene',el),src=heroImages[scene]||'';let image=q(':scope > img',sceneRoot);if(!image){sceneRoot.innerHTML='<img alt="">';image=q(':scope > img',sceneRoot)}
    sceneRoot.hidden=!src;if(src){if(image.getAttribute('src')!==src)image.setAttribute('src',src)}else image.removeAttribute('src');
    return el;
  }
  // Display only: do not change the selected input or persistent UI state.
  function ledgerHeroRecord(){
    const records=state.ledgerMonths||[],selected=q('#ledgerMonth')?.value;
    return records.find(x=>x.month===selected)||[...records].sort((a,b)=>String(a.month).localeCompare(String(b.month))).at(-1)||null;
  }
  function brokerRows(){return typeof officialBrokerSorted==='function'?officialBrokerSorted():[]}
  function brokerSummary(){const rows=brokerRows(),last=rows.at(-1),prev=rows.at(-2),c=last&&typeof brokerCalc==='function'?brokerCalc(last):null,p=prev&&typeof brokerCalc==='function'?brokerCalc(prev):null,d=c&&p?c.total-p.total:null,r=d!==null&&p.total?d/p.total*100:null;return {rows,last,c,d,r}}
  function mainCharacterStatus(id){
    if(id==='investment'){const s=brokerSummary();return s.r===null?null:{text:`전월 대비 ${s.r>=0?'+':''}${s.r.toFixed(2)}%`,direction:s.r>=0?'up':'down'}}
    if(id==='asset'){const s=brokerSummary();return s.d===null?null:{text:`전월 대비 ${s.d>=0?'+':''}${money(s.d)} · ${s.r>=0?'+':''}${(s.r||0).toFixed(2)}%`,direction:s.d>=0?'up':'down'}}
    if(id==='ledger'){const rec=ledgerHeroRecord(),c=rec&&typeof ledgerCalc==='function'?ledgerCalc(rec):null;if(!rec||!c)return null;const over=c.jispiT-c.targetT,ratio=c.targetT?over/c.targetT*100:null;return {text:`${rec.month} · 목표 대비 ${over>=0?'+':''}${ratio===null?'-':ratio.toFixed(1)+'%'} · ${ledgerJispiStatus(c.jispiT,c.targetT)}`,direction:over<=0?'down':'up'}}
    if(id==='diet'){const rows=[...(state.body||[])].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))),now=rows.at(-1),before=rows.at(-2);if(!now)return null;const delta=before?number(now.weight)-number(before.weight):null;return {text:`현재 ${number(now.weight).toFixed(2)}kg${delta===null?'':` · 직전 ${delta>=0?'+':''}${delta.toFixed(2)}kg`}`,direction:delta===null?'neutral':delta<=0?'down':'up'}}
    if(id==='exercise'){const rows=[...(state.exercise||[])].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))).slice(-30).filter(x=>number(x.steps)>0);if(!rows.length)return null;const avg=Math.round(rows.reduce((sum,x)=>sum+number(x.steps),0)/rows.length);return {text:`최근 ${rows.length}일 평균 · ${avg.toLocaleString()}보`,direction:'neutral'}}
    if(id==='study'){const qm=quizMetrics();return {text:qm.rate===null?`Quiz ${(state.learningQuizzes||[]).length}개 · 제출 대기`:`정답률 ${qm.rate}% · 미완료 ${qm.pending}개`,direction:'neutral'}}
    if(id==='university'){const sem=typeof campusActiveSemester==='function'?campusActiveSemester():null;return sem?{text:`${sem.term||'현재 학기'} · 과목 ${(sem.courses||[]).length}개`,direction:'neutral'}:null}
    return null;
  }
  function mountSkeletons(){
    Object.keys(mainCharacterSidebarMenuConfig).forEach(id=>{
      const root=q(`#${id}`);if(!root?.classList.contains('view'))return;
      q(':scope > .index-hero-v02992',root)?.remove();
      const internal=id==='game'?currentSportsMenu():'home',config=mainCharacterBannerConfig(id,internal),el=mainCharacterBanner(id,config);
      const status=q('.ds-main-character-banner__status',el),data=mainCharacterStatus(id);
      if(status){status.hidden=!data;status.textContent=data?.text||'';status.className=`ds-main-character-banner__status ${data?.direction||'neutral'}`}
      el?.classList.toggle('has-status',Boolean(data));
    });
    q('#investNews > .hani-master-hero')?.remove();
    q('.ledger-import .sh h3')?.replaceChildren(document.createTextNode('가계부 확정본 Import'));
    qa('#asset .asset-dashboard-card .sh h3').forEach(x=>x.textContent='자산 핵심 지표');
  }
  function arrangeNavigation(){
    const sideToggle = q("#sideToggle"), mini = q("#app")?.classList.contains("sidebar-mini");
    if (sideToggle) { sideToggle.title = mini ? "사이드바 펼치기" : "사이드바 접기"; sideToggle.setAttribute("aria-label", sideToggle.title); sideToggle.setAttribute("aria-expanded", String(!mini)); }
    qa('#sidebar .nav-btn, #sidebar .group-head').forEach(button => {
      const label = q('.txt, .name', button)?.textContent.replace(/NEW/g, '').trim();
      if (label) { button.title = label; button.setAttribute('aria-label', label); }
    });
    const ledger=q('#ledger'),tabs=q('#ledger > .tabs')||q('#ledger > .page-nav-context-v02992 .tabs'),picker=q('#ledger .money-month-picker');q('#ledger .money-intro')?.remove();
    if(ledger&&tabs){let nav=q('#ledger > .page-nav-context-v02992');if(!nav){nav=document.createElement('div');nav.className='page-nav-context-v02992';tabs.before(nav);nav.append(tabs);const context=document.createElement('div');context.className='page-context-v02992';nav.append(context);if(picker)context.append(picker)}const banner=q('#ledger > .ds-main-character-banner');if(banner&&nav&&banner.nextElementSibling!==nav)banner.after(nav)}
    const inv=q('#investment'),invTabs=q('.investment-tabs-main',inv);if(inv&&invTabs&&!q(':scope > .page-nav-context-v02992',inv)){const nav=document.createElement('div');nav.className='page-nav-context-v02992';invTabs.before(nav);nav.append(invTabs)}
    const overviewHead=q('#investment .investment-overview-head'),year=q('#overviewYearSelect')?.closest('.field'),select=q('#overviewYearSelect'),invNav=inv?q(':scope > .page-nav-context-v02992',inv):null;
    if(year&&invNav){let context=q('.page-context-v02992',invNav);if(!context){context=document.createElement('div');context.className='page-context-v02992';invNav.append(context)}context.append(year);const values=select?Array.from(select.options).map(x=>x.value).filter(Boolean):[];let fixed=q('.investment-year-static',year);if(values.length<=1){if(!fixed){fixed=document.createElement('strong');fixed.className='investment-year-static';year.append(fixed)}fixed.textContent=`${values[0]||new Date().getFullYear()}년`;if(select)select.hidden=true}else{fixed?.remove();if(select)select.hidden=false}}
    if(overviewHead){q(':scope > div:first-child',overviewHead)?.remove();if(!overviewHead.children.length)overviewHead.remove()}
  }
  function improveLifeMarket(){
    const moodImage=q('#lifeMarketImage'),brandImage=q('#lifeMarketBrandImage');[moodImage,brandImage].forEach(image=>{if(image&&image.src!==new URL(lifeMarketImage,document.baseURI).href)image.src=lifeMarketImage});
    const selected=q('[data-life-index].is-selected')?.dataset.lifeIndex||'hasdaq';
    const grid=q('.home-dashboard-grid');if(grid)grid.dataset.selectedIndex=selected;
    updateCompanion(selected);dataHubRenderDashboard();
  }
  function phase1CollapsibleForm(viewId,selector,label,description){
    const root=q('#'+viewId),card=q(selector,root);if(!root||!card||card.closest('.phase1-collapsible-form'))return;
    const details=document.createElement('details');details.className='phase1-collapsible-form card full';details.dataset.phase1Form=viewId;
    const summary=document.createElement('summary');summary.innerHTML=`<span><b>${safe(label)}</b><small>${safe(description)}</small></span><em>열기</em>`;
    card.before(details);details.append(summary,card);card.classList.remove('card','sidec','wide','full');card.classList.add('phase1-form-body');
    details.addEventListener('toggle',()=>{q('summary em',details).textContent=details.open?'접기':'열기'});
  }
  function organizePhase1Layouts(){
    phase1CollapsibleForm('reading','.reading-input-card','독서 기록 입력','필요할 때 열어 읽을 책과 완독 기록을 등록합니다.');
    phase1CollapsibleForm('movie','.movie-input-card','시청 기록 입력','필요할 때 열어 작품·시즌·회차를 등록합니다.');
    phase1CollapsibleForm('diary','.diary-form','일기 작성','필요할 때 열어 오늘의 기록을 작성합니다.');
    const diaryStats=q('#diary .compact-dashboard');if(diaryStats)diaryStats.hidden=true;
    const series=q('#movieSeriesSection');if(series)series.hidden=true;
  }
  function cleanupNewsroom(){const news=q('#newsroom'),tabs=q('.newsroom-mode-tabs',news),tools=q('.newsroom-content-actions',news);if(tabs&&tools&&!q('.ds-news-navigation',news)){const nav=document.createElement('div');nav.className='ds-news-navigation page-nav-context-v02992';tabs.before(nav);nav.append(tabs,tools)}q('#haniLifeMarketV02979')?.remove();const nav=q('#haniWeeklyArchiveNavV02970'),general=q('#newsroomGeneralPane');if(nav&&general&&nav.parentElement!==general){nav.classList.remove('compact');general.prepend(nav)}const usage=q('#investmentNewsUsage');if(usage)usage.textContent='뉴스 데이터는 Life OS 핵심 원장과 분리되어 안전하게 유지됩니다.'}
  function bindSportsBoard(){
    const root=q('#game');if(!root)return;
    const select=requested=>{
      const key=mainCharacterInternalViewExists('game',requested)?requested:'home';root.dataset.sportsMenu=key;
      qa('[data-sports-tab]',root).forEach(btn=>{const active=btn.dataset.sportsTab===key;btn.classList.toggle('active',active);btn.setAttribute('aria-selected',String(active));btn.tabIndex=active?0:-1});
      qa('[data-sports-panel]',root).forEach(panel=>panel.hidden=panel.dataset.sportsPanel!==key);
      renderSportsBanner(key);
    };
    if(root.dataset.sportsBound){renderSportsBanner(currentSportsMenu());return}
    root.dataset.sportsBound='1';
    qa('[data-sports-tab]',root).forEach(btn=>{const key=btn.dataset.sportsTab;btn.setAttribute('role','tab');btn.id=`sportsTab-${key}`;btn.setAttribute('aria-controls',`sportsPanel-${key}`);btn.addEventListener('click',()=>select(key))});
    qa('[data-sports-panel]',root).forEach(panel=>{const key=panel.dataset.sportsPanel;panel.id=`sportsPanel-${key}`;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',`sportsTab-${key}`)});
    qa('[data-sports-open]',root).forEach(btn=>btn.addEventListener('click',()=>select(btn.dataset.sportsOpen)));
    select(currentSportsMenu());
  }
  let queued=false;function refresh(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mountSkeletons();arrangeNavigation();mountDesignSlots();organizePhase1Layouts();improveLifeMarket();cleanupNewsroom();bindSportsBoard();refreshMotion();if(q('#exercise.active')&&typeof drawExercise==='function')requestAnimationFrame(drawExercise)})}
  // Finish selection is CSS-only; do not rebuild page/card slots for these controls.
  document.addEventListener('click',event=>{if(!event.target.closest('#signatureFinishChoices,#seasonCollectionChoices'))setTimeout(refresh,0)});document.addEventListener('change',event=>{if(!event.target.closest('#signatureFinishChoices,#seasonCollectionChoices'))setTimeout(refresh,0)});
  refresh();setTimeout(refresh,120);
  console.info('[HANI OS] v2.9.119 Library and viewing archive UX ready');
})();
