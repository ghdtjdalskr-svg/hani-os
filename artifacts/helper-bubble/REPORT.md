# Helper Bubble 작업 보고서

> 작업일: 2026-11-17
> 주의: 셸/노드/브라우저 실행이 불가능한 환경에서 파일 읽기·수정 도구만 사용해 구현 및 테스트 작성을 완료했습니다. 실제 Node/브라우저 런타임 실행 검증은 수행하지 않았습니다.

---

## 1. 도우미 얼굴 크기 전 / 후

| 구분 | 변경 전 | 변경 후 | 감소율 / 비고 |
| --- | --- | --- | --- |
| PC (`> 850px`) | `72px` (`--helper-art-scale: 1.307692308`) | `58px` (`--helper-art-scale: 1.038461538`) | 약 `19.4%` 축소 (`54 / 52` 아틀라스 비율) |
| 모바일 (`<= 850px`) | `62px` (`--helper-art-scale: 1.115384615`) | `50px` (`--helper-art-scale: 0.884615385`) | 약 `19.4%` 축소 (`46 / 52` 아틀라스 비율, 최소 `44px` 터치 영역 유지) |

- 말풍선 `×` 닫기 버튼은 시각적 지름 `28px` + `::after { inset: -8px }`로 `44px × 44px` 터치 영역을 확보했습니다.

---

## 2. 말풍선 표시 및 동작 시점

- **표시 시점**:
  1. 앱 시작 후 로그인 게이트가 해제되고 도우미(`#haniHelperBot`)가 실제 표시 상태(`hidden === false`)가 될 때 1회 표시합니다.
  2. `showView(id)` (`hani-main.js`)에서 화면/메뉴를 전환할 때 `window.HaniHelperBot?.bubble?.(id)` 호출로 새 화면 대사를 1회 표시합니다.
- **자동 숨김 및 타이머**:
  - 단일 `setTimeout(..., 6000)` (`BUBBLE_MS = 6000`)으로 6초 뒤 자동 숨김 처리합니다.
  - 6초 이내에 다른 화면으로 전환되면 기존 `bubbleTimer`를 `clearTimeout`으로 취소한 뒤 새 타이머를 1개만 유지합니다. (`setInterval` 미사용, 신규 `MutationObserver` 미추가)
- **상호작용 및 비영속 닫기**:
  - 말풍선 본문(`[data-helper-bubble-open]`) 클릭 시 기존 도우미 패널(`#haniHelperSpeech`)이 열리고 말풍선은 숨겨집니다.
  - 말풍선 `×`(`[data-helper-bubble-close]`) 클릭 시 메모리 변수 `bubbleDismissed = true`로 현재 보기(세션) 동안만 말풍선을 닫으며, `localStorage`/`sessionStorage` 쓰기는 전혀 수행하지 않습니다. (새로고침 시 다시 초기화)
- **표시 억제 조건**:
  - `hani_helper_hidden_v1 === '1'`, 로그인 화면/게이트(`login`), 열린 모달/다이얼로그, 당번 없음(`no-duty`), 도우미 패널이 이미 열린 상태에서는 표시하지 않습니다.
- **위치 / 충돌 회피 / 접근성**:
  - 도우미를 드래그한 위치에서도 말풍선이 따라 이동하며, 화면 중앙 기준 왼쪽/오른쪽 여부에 따라 `data-side="left" | "right"`(필요 시 `"top" | "bottom"` + `data-align="start" | "end"`)로 자동 전환됩니다.
  - 고정/스티키 컨트롤과 포커스된 입력창(`input`/`textarea`/`select`/`contenteditable`)을 피하고 `390px` 모바일에서 가로 오버플로(`0px`) 없이 안전 영역(`12px` 여백, `max-width: min(248px, calc(100vw - 24px))`) 내에 고정됩니다.
  - `[data-theme="dark"]`, `[data-finish="midnight-black"]`, `[data-finish="titanium-graphite"]` 다크 마감 대비를 지원하며, `prefers-reduced-motion: reduce`에서는 애니메이션/전환을 끕니다.

---

## 3. 대사 목록 (모두 30자 이하 · 호칭 `회장님` 통일)

### 화면별 대사 (`BUBBLE_LINES`, 40개 뷰)

- `home`: `오늘 도장 찍으셨어요?` / `회장님, 오늘 한 칸 채워볼까요?` / `오늘의 흐름을 한눈에 볼 수 있어요.`
- `milestones`: `소중한 변화가 여기 모여 있어요.` / `빛나는 순간을 하나씩 꺼내봐요.`
- `intake`: `떠오른 생각, 유나에게 맡겨봐요!` / `짧은 메모도 깔끔하게 정리돼요.`
- `agentReview`: `사무실 식구들이 인사 기다려요!` / `층마다 누가 있는지 둘러볼까요?`
- `monthlyReport`: `컨퍼런스 룸 브리핑 시간이에요.` / `이번 기간 흐름을 함께 짚어봐요.`
- `organization`: `우리 팀 식구들을 소개해 드릴게요.` / `각 팀이 맡은 역할을 둘러보세요.`
- `ilbo`: `이번 주 HANI 일보가 왔어요!` / `따끈한 사내 소식을 읽어볼까요?`
- `board`: `라운지에 새 이야기가 올라왔어요.` / `가볍게 한 줄 남겨봐도 좋아요.`
- `investment`: `포트폴리오 흐름을 차분히 봐요.` / `기준 날짜부터 먼저 확인해 봐요.`
- `investmentCommittee`: `종목별 투자 근거를 살펴볼까요?` / `리포트와 월간 자료가 모여 있어요.`
- `investmentIntake`: `최신 자산 숫자를 맞춰볼까요?` / `반영 전 미리보기 꼭 확인해요.`
- `asset`: `전체 자산 구성을 한눈에 봐요.` / `계좌별 흐름을 차분히 살펴보세요.`
- `ledger`: `이번 달 지출 한 줄 정리해 볼까요?` / `계획한 소비인지 함께 확인해요.`
- `newsroom`: `오늘 주요 소식만 쏙 모아왔어요.` / `관심 종목 뉴스 흐름을 살펴봐요.`
- `diet`: `하루 숫자보다 흐름이 중요해요!` / `오늘도 무리하지 말고 기록해요.`
- `exercise`: `오늘 페이스도 아주 좋아요!` / `꾸준한 한 걸음이 모여 큰 힘 돼요.`
- `reading`: `마음에 남은 문장 하나 적어볼까요?` / `다음에 읽을 책도 골라보세요.`
- `study`: `오늘 퀴즈 한 문제 풀어볼까요?` / `틀린 문제도 좋은 힌트가 돼요.`
- `university`: `이번 주 강의와 마감 챙겨볼까요?` / `주차별 계획을 차근차근 확인해요.`
- `certificate`: `시험 일정까지 차분히 준비해요.` / `오늘 공부 분량부터 체크해 봐요.`
- `wishlist`: `눈여겨본 아이템, 여기 모아둬요.` / `링크만 붙여넣어도 금방 정리돼요.`
- `travel`: `다음 여행 동선을 그려볼까요?` / `다녀온 좋은 장소도 남겨보세요.`
- `movie`: `재밌게 본 작품 한 줄 남겨봐요.` / `보고 싶은 목록도 슬쩍 꺼내봐요.`
- `game`: `오늘 응원할 팀 경기 확인해 봐요!` / `승패보다 시즌 흐름을 함께 봐요.`
- `diary`: `오늘 기억할 한 줄 남겨볼까요?` / `회장님의 하루를 조용히 적어봐요.`
- `tasks`: `오늘 할 일부터 하나씩 지워봐요!` / `지금 바로 할 한 가지를 골라봐요.`
- `procrastination`: `삐진 직원이 있어요…` / `미뤄둔 일, 지금 한 번 볼까요?`
- `calendar`: `오늘 일정이 겹치지 않게 봐요.` / `쉬는 시간도 일정에 넣어두세요.`
- `work`: `중요한 업무 순서부터 잡아봐요.` / `남은 후속 조치도 놓치지 마세요.`
- `drive`: `필요한 파일을 빠르게 찾아볼까요?` / `연결된 폴더 상태를 확인해 봐요.`
- `aiWork`: `AI 팀원들이 한 일을 확인해 봐요.` / `담당자별 작업 결과를 모아뒀어요.`
- `dev`: `개발 진행 상황을 한눈에 봐요.` / `바뀐 부분과 기록을 살펴보세요.`
- `geminiReports`: `차분히 정리된 보고서를 읽어봐요.` / `새로운 분석 노트가 준비됐어요.`
- `deployment`: `배포 후보와 검사 상태를 확인해요.` / `안전하게 검증된 것만 올려요.`
- `aiBudget`: `이번 주 남은 한도를 살펴볼까요?` / `여유 있게 작업 일정을 맞춰봐요.`
- `aura`: `오늘 기분에 맞는 색을 골라봐요!` / `계절 테마로 분위기를 바꿔보세요.`
- `settings`: `백업과 연결 상태를 점검해 봐요.` / `도우미 표시도 여기서 바꿀 수 있어요.`
- `policy`: `사내 규칙과 기준을 확인해 봐요.` / `정해진 원칙을 한눈에 볼 수 있어요.`
- `aiTeam`: `함께 일하는 팀원들을 불러볼까요?` / `담당자별 역할을 살펴볼 수 있어요.`
- `characterArchive`: `동료들의 이야기를 펼쳐볼까요?` / `한 명씩 프로필을 구경해 보세요.`

### 기본 폴백 대사 (`BUBBLE_FALLBACK`)

- `회장님, 무엇이든 편하게 눌러보세요.`
- `오늘도 천천히 한 걸음씩 가요!`
- `궁금한 화면이면 저를 눌러주세요.`

---

## 4. 변경 및 추가된 파일

- **수정**:
  - `hani-style-08.css` — 도우미 얼굴 `58px`/`50px` 축소, `[data-theme="dark"]` 및 `top`/`bottom` 왼쪽 정렬 꼬리 규칙(`[data-align="start"]`), 닫기 버튼 히트 영역(`inset:-8px`) 보강
  - `hani-ui-v02992.js` — `faceSize()` 폴백(`58`/`50`) 갱신, 말풍선 DOM(`#haniHelperBubble`) 및 생명주기(`onViewChange`, `startBubble`, `hideBubble`, `placeBubble`), 본문/닫기/`Escape` 이벤트 연결, `HaniHelperBot.bubble` / `bubbleText` 노출
  - `hani-main.js` — `showView(id)` 내 `window.HaniHelperBot?.bubble?.(id);` 1줄 연결
- **신규**:
  - `scripts/hani-helper-bubble.test.mjs` — 크기·CSS, 저장소 무기록, 숨김/모달/로그인 억제, 6초 타이머 취소/만료, 본문/닫기 클릭, 드래그·좌우 반전·390px 경계·고정 컨트롤/포커스 입력 회피, 대사 길이/호칭 검증 테스트
  - `artifacts/helper-bubble/REPORT.md` — 본 보고서

---

## 5. 수정으로 인해 깨지는 기존 테스트 목록 (원본 미수정)

기존 테스트·픽스처·해시는 규칙에 따라 수정하지 않았습니다. 이번 변경으로 인해 실패할 기존 테스트는 다음과 같습니다.

1. **`scripts/hani-helper-bot.test.mjs`**
   - `setTimeout`/`clearTimeout` 금지 정규식 검사(`assert.doesNotMatch(remaining, .../setTimeout/...)`) 실패
   - 얼굴 크기(`62px -> 50px`) 변경으로 인한 모바일 좌표 단언(`296px`/`750px`/`312px`/`766px`) 불일치
2. **`scripts/hani-helper-toggle.test.mjs`**
   - `scripts/fixtures/helper-toggle-delta.json`의 `hani-ui-v02992.js`, `hani-style-08.css` `afterSha256` 해시 불일치 및 `setTimeout(` 카운트 검사 실패
3. **`scripts/hani-release-299.test.mjs`**
   - `hani-main.js` 바이트/해시 및 `hani-helper-toggle-preload.cjs` 경유 파일 해시 불일치
4. **`scripts/hani-release-298.test.mjs`**
   - `hani-ui-v02992.js`, `hani-style-08.css`, `hani-main.js` 해시·delta 불일치
5. **`scripts/hani-release-297.test.mjs`**
   - `hani-ui-v02992.js`, `hani-style-08.css`, `hani-main.js` 누적 레이어 해시 불일치
6. **`scripts/hani-release-296.test.mjs`**
   - 선행 레이어 복원 실패(`afterSha256` 불일치)로 인한 296 베이스라인 검증 연쇄 실패
7. **`scripts/hani-release-version-layers.test.mjs`**
   - `scripts/fixtures/release-version-layers.json` 기준 대상 파일 해시 불일치
8. **`scripts/hani-design-polish-2.test.mjs`**
   - `hani-ui-v02992.js`, `hani-main.js` 고정 베이스 바이트 동등성 검사 실패
9. **`scripts/hani-design-polish-2-main297.test.mjs`**
   - `hani-main.js` 고정 베이스 바이트 동등성 검사 실패
10. **`scripts/hani-chibi-pack-3.test.mjs`**
    - `hani-release-297-preload.cjs` 및 `chibi-pack-3-delta.json`의 `afterSha256` 불일치로 연쇄 실패
