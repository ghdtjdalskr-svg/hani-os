import { characterProfile } from "./hani-character-voice.mjs?v=2.9.163";

// Editorial lines, not personalized analysis. No record reads, storage writes or AI calls.
const entry = (agent, lines, mode = "LIVING_OFFICE") => Object.freeze({ agent, mode, lines: Object.freeze(lines) });
export const TAB_CHARACTER_LINES = Object.freeze({
  home: entry("hani", ["오빠, 전부 한 번에 하려 하진 말자. 먼저 볼 것부터 같이 잡자.", "각자 맡은 건 팀이 챙길게. 오빠는 지금 중요한 것부터 보자."]),
  intake: entry("yuna", ["오빠, 자료는 저한테 주세요! 확인되는 값부터 정리하고 빈칸은 추측하지 않을게요 🫡", "제가 먼저 정리해볼게요! 저장하기 전에는 오빠가 확인할 수 있게 보여드릴게요."]),
  agentReview: entry("hani", ["대표님, 사실과 가설부터 나누겠습니다. 이견은 결정 조건까지 남길게요.", "대표님, 담당자들의 근거를 먼저 듣겠습니다. 합의되지 않은 부분은 숨기지 않을게요."], "BOARDROOM"),
  monthlyReport: entry("hani", ["오빠, 보고서는 숫자만 다시 보는 자리가 아니야. 한 달에서 무엇이 남았는지 같이 보자.", "한 달을 마친 다음 돌아보자. 잘한 점과 다음에 살펴볼 점을 구분해서 남기면 돼."], "MONTHLY_REPORT"),
  policy: entry("sua", ["대표님, 확정된 범위와 승인 필요한 범위를 먼저 나누겠습니다.", "권한 경계부터 확인하겠습니다. 애매하면 확인 필요로 남기죠."], "BOARDROOM"),
  deployment: entry("sua", ["대표님, 검증 결과와 승인 기록부터 확인하겠습니다. 배포 완료 판단은 실제 반영 확인 뒤에 하죠.", "가능해 보이는 것과 검증된 건 다릅니다. 운영 반영까지 확인할 순서부터 잡겠습니다."], "BOARDROOM"),
  investment: entry("hani", ["오빠, 분위기랑 근거는 따로 보자. 가격이 움직였다고 이유까지 확인된 건 아니니까.", "결론을 서두르지 말자. 숫자와 확인할 변수를 나눠서 보자."], "DIRECT_CHAT"),
  investmentIntake: entry("hani", ["오빠, 원본 숫자부터 맞추자. 모르는 항목은 억지로 채우지 않아도 돼.", "자료와 미리보기를 먼저 비교하자. 정리는 도와도 확정은 따로 확인해야 해."], "DIRECT_CHAT"),
  asset: entry("jieun", ["오빠, 잔액만 보지 말고 다음에 쓸 돈도 같이 보자. 생활이 편해야 계획도 오래 가.", "금액 자체보다 어디에 필요한 돈인지가 중요해. 먼저 용도를 나눠보자."], "DIRECT_CHAT"),
  ledger: entry("jieun", ["오빠, 잘 쓴 돈까지 혼낼 필요는 없어. 계획한 지출인지, 반복되는 지출인지부터 보자.", "무조건 줄이기보다 이유를 남겨보자. 다음 달 현금흐름을 볼 때 더 도움이 돼."], "DIRECT_CHAT"),
  newsroom: entry("hani", ["오빠, 기사 제목보다 판단을 바꾸는 근거가 있는지부터 보자.", "확인된 사실과 아직 확인할 변수를 나누자. 뉴스가 많다고 답이 생기는 건 아니니까."], "NEWSROOM"),
  diet: entry("naeun", ["오빠~ 하루 숫자에 너무 휘둘리진 말자. 흐름을 보는 게 먼저야.", "기록은 같이 보자. 대신 더 굶어서 만회하려는 건 금지야, 알겠지?"], "DIRECT_CHAT"),
  exercise: entry("sooyeon", ["오빠, 최고 기록보다 이어갈 수 있는 페이스부터 보자. 무리해서 채울 필요는 없어.", "한 번의 기록으로 전술 바꾸진 말자. 기록된 날의 흐름부터 차분히 보자."], "DIRECT_CHAT"),
  reading: entry("haru", ["오빠, 다 읽었는지도 좋지만 어떤 문장이 남았는지도 궁금해. 한 줄만 접어두자.", "많이 읽는 것만 목표로 삼진 말자. 다시 꺼내 보고 싶은 대목도 남겨줘."], "DIRECT_CHAT"),
  study: entry("hina", ["오빠, 틀린 문제는 혼나는 기록 아니야. 다시 볼 유형을 찾는 힌트지!", "정답률만 보고 끝내면 아깝다아. 어디서 헷갈렸는지 한 문제씩 보자."], "DIRECT_CHAT"),
  university: entry("hina", ["오빠, 과목이랑 마감부터 구분하자. 오늘 할 분량은 그다음에 잡으면 돼!", "모르는 일정은 확인 필요로 두자. 날짜가 정확해야 공부 계획도 맞출 수 있어."], "DIRECT_CHAT"),
  certificate: entry("hina", ["오빠, 공부도 중요하지만 접수일은 따로 챙기자. 일정은 귀엽게 넘기면 안 돼!", "시험 날짜부터 확인하고 남은 분량을 나누자. 급하다고 계획까지 대충 잡진 말고."], "DIRECT_CHAT"),
  wishlist: entry("haru", ["오빠, 예쁜 건 인정. 근데 실제로 어디서 쓸지도 같이 적어두자.", "갖고 싶은 이유부터 남겨볼까? 바로 사지 않아도 취향은 충분히 모을 수 있어."], "DIRECT_CHAT"),
  travel: entry("sooyeon", ["오빠, 가고 싶은 곳은 모아두고 이동 동선부터 묶자. 현장에선 유연하게 가면 돼.", "일정을 꽉 채우기보다 쉴 틈도 남기자. 오래 즐길 수 있는 페이스가 먼저야."], "DIRECT_CHAT"),
  movie: entry("minji", ["오빠, 재밌었으면 일단 역할 다 한 거지 ㅋㅋ 왜 좋았는지 한 줄만 더 남겨줘.", "별로였던 것도 다음 추천엔 도움 돼. 유명하다고 억지로 좋아할 필요는 없고!"], "DIRECT_CHAT"),
  diary: entry("haru", ["오빠, 하루를 다 설명하지 않아도 돼. 나중에 기억하고 싶은 것부터 적자.", "거창한 결론 없어도 괜찮아. 오늘 남겨두고 싶은 장면 하나면 충분해."], "DIRECT_CHAT"),
  tasks: entry("sua", ["대표님, 지금 할 일과 확인 필요한 일을 나누겠습니다. 담당과 다음 행동부터 잡죠.", "한 번에 다 끝내기보다 실행 순서부터 정리하겠습니다. 기한이 있는 일이 먼저입니다."], "DIRECT_CHAT"),
  calendar: entry("sua", ["대표님, 확정 일정과 확인 필요한 일정을 먼저 구분하겠습니다.", "겹치는 일정은 담당자와 조건부터 확인하죠. 비어 있는 시간을 임의로 약속하진 않겠습니다."], "DIRECT_CHAT"),
  drive: entry("sua", ["대표님, 자료의 원본과 최신본부터 구분하겠습니다. 고객 전달 전에 확정 여부도 확인하죠.", "문서는 찾기 쉬워야 쓸 수 있습니다. 담당과 다음에 쓸 목적부터 남겨두죠."], "DIRECT_CHAT"),
  dev: entry("sua", ["대표님, 구현된 것과 미검증 항목을 나누겠습니다. 다음 확인 순서부터 잡죠.", "새 기능보다 기존 흐름이 안전한지 먼저 확인하겠습니다. 완료 판단은 검증 뒤에 하죠."], "BOARDROOM"),
  aiTeam: entry("hani", ["오빠, 각자 잘 보는 게 달라. 판단까지 한 사람에게 몰아주진 말자.", "담당자는 맡은 근거를 보고, 나는 연결할게. 마지막 결정은 오빠 몫이고."]),
  settings: entry("yuna", ["오빠, 설정은 확인하면서 정리할게요. 데이터나 권한은 제가 마음대로 바꾸면 안 되죠!", "제가 확인할 항목부터 정리해볼게요 🫡 모르는 값은 추측해서 넣지 않을게요."]),
  work: entry("sua", ["대표님, 고객 요구와 실제 가능한 구성을 나누겠습니다. Vendor 확인 필요한 부분은 따로 남기죠.", "고객에게 확정처럼 말하기 전에 일정과 담당부터 확인하겠습니다. 실행 순서부터 잡죠."], "DIRECT_CHAT"),
  game: entry("sooyeon", ["오빠, 한 경기로 시즌 전술 바꾸진 말자. 결과와 흐름을 나눠서 보자.", "응원은 편하게 하고, 판단은 차분하게. 다음 경기에 뭘 볼지부터 잡자."], "DIRECT_CHAT"),
});
const SPORTS_LINES = Object.freeze({
  yankees: Object.freeze(["오빠, 양키스는 결과부터 보고 타선과 마운드를 따로 보자. 한 경기로 시즌을 단정하진 말고.", "핀스트라이프 응원은 뜨겁게, 판단은 차분하게. 다음 경기에서 확인할 흐름을 잡자."]),
  kia: Object.freeze(["오빠, 타이거즈는 이긴 날도 진 날도 근거부터 보자. 한 경기로 전술 바꾸진 말자.", "응원은 끝까지 가고, 리뷰는 차분하게. 타선과 마운드를 나눠보자."]),
  madrid: Object.freeze(["오빠, 마드리드는 스코어랑 경기 내용이 다를 수 있어. 장면과 결과를 같이 보자.", "베르나베우의 열기는 좋지. 다음 경기에 이어질 흐름은 따로 확인하자."]),
  dplus: Object.freeze(["오빠, 디플러스는 한 세트만 보고 결론내진 말자. 밴픽과 실제 플레이를 같이 보자.", "응원은 하고, 리뷰는 논점부터. 어떤 선택이 다음 세트에 이어지는지 보자."]),
});

// Session-memory only: redraws stay stable; re-entering advances without repeats.
export function createTabQuoteSelector(random = Math.random) {
  const indices = new Map();
  let activeKey = "";
  return (tab, view = "home") => {
    const config = Object.hasOwn(TAB_CHARACTER_LINES, tab) ? TAB_CHARACTER_LINES[tab] : null;
    const profile = config && characterProfile(config.agent);
    if (!profile) { activeKey = ""; return null; }
    const sports = tab === "game" && Object.hasOwn(SPORTS_LINES, view) ? SPORTS_LINES[view] : null;
    const key = sports ? `${tab}:${view}` : tab;
    const lines = sports || config.lines;
    if (key !== activeKey) {
      indices.set(key, indices.has(key) ? (indices.get(key) + 1) % lines.length : Math.min(lines.length - 1, Math.max(0, Math.floor((Number(random()) || 0) * lines.length))));
      activeKey = key;
    }
    return { agent: config.agent, speaker: profile.identity.split(" · ")[0], role: profile.identity.split(" · ")[1], mode: config.mode, quote: lines[indices.get(key)] };
  };
}
