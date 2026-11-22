# 미룸 보드 2차 개편 (`procrastination-2`) 작업 보고서

## 1. 추가·변경한 항목과 담당 (총 12개)

| 구분 | ID | 항목명 | 담당 | 이동 경로 (`route`) | 주기 / 기준 (`bounds`) |
|---|---|---|---|---|---|
| 유지 | `steps` | 걸음 수 입력 | 나은 (건강 · 루틴) | `exercise` | 매일 (`[1, 7, 14, 30]`) |
| 유지 | `weight` | 체중 입력 | 나은 (건강 · 루틴) | `diet` | 매일 (`[1, 7, 14, 30]`) |
| **신규(확정)** | `workout` | 운동 세션 기록 | 수연 (여행 · 스포츠) | `exercise` | 3일마다 (`[3, 7, 14, 30]`) |
| **개선** | `quiz` | 미완료 퀴즈 풀기 | 히나 (학습 · 최종 리뷰) | `study` | 문제 예정일 기준 (`[1, 7, 14, 30]`) |
| **신규(제안)** | `wrongReview` | 오답노트 복습 | 윤슬 (러닝 리서처) | `study` | 주 1회 (`[7, 14, 30, 60]`) |
| 유지 | `assets` | 자산 업데이트 | 지은 (재무 · 자산) | `investmentIntake` | 월 1회 (`[31, 45, 60, 90]`) |
| 유지 | `ledger` | 가계부 입력 | 지은 (재무 · 자산) | `ledger` | 월 1회 (`[31, 45, 60, 90]`) |
| 유지 | `wishlist` | 위시리스트 정리 | 하루 (소비 · 구매 검토) | `wishlist` | 주 1회 (`[7, 14, 30, 60]`) |
| **신규(제안)** | `spendReview` | 소비 후속 리뷰 | 하루 (소비 · 구매 검토) | `ledger` | 구매 2주 후 (`[14, 30, 45, 60]`) |
| **신규(필수)** | `culture` | 책·영화 기록 | 민지 (콘텐츠 · 문화) | `movie` | 주 1회 (`[7, 14, 30, 60]`) |
| **신규(확정)** | `tasks` | 밀린 할 일 | 가은 (회장 비서) | `tasks` | 마감일 기준 (`[1, 7, 14, 30]`) |
| **담당 변경** | `diary` | 하루 한 줄 기록 | 민지 → **하니 (전략 · 총괄)** | `diary` | 매일 (`[1, 7, 14, 30]`) |

- **2열 / 3열 그리드 균형**: 총 12장으로 2열(`6x2`), 3열(`4x3`) 모두 빈 칸 없이 정렬됨.
- **하니 전무 중재 한 줄 (`mediation`)**: 3단계 이상이면서 `owner !== 'hani'`일 때 카드 하단에 중재 슬롯(`.pb-mediation`) 표시. 하니 본인(`diary`)은 스스로 중재하지 않음.
- **퀴즈 계산 보완 (`quiz`)**: `learningQuizzes`에서 `projectId`가 없거나 `learningProjects`에 존재하지 않거나 `status`가 `'paused'` / `'archived'`인 프로젝트의 대기 퀴즈는 제외하도록 수정.

## 2. 데이터 근거 (`state` 키·필드 확인 결과)

- `diary` (`hani`): `state.diaries` (`date`, `content`)
- `culture` (`minji`): `state.books` (`title`, `completedDate || readDate || updatedAt || importedAt || createdAt`) 및 `state.movies` (`title`, `watchedDate || updatedAt || importedAt || createdAt`) 중 최신 날짜 사용
- `tasks` (`gaeun`): `state.tasks` (`done`, `due || dueAt`, `dueKnown`, `text`). `!done && dueKnown !== false`이면서 마감일이 지난 항목 중 가장 오래된 `due || dueAt` 기준 (`validTasks`가 있고 지연 항목이 없으면 `level: 0`, `days: 0`)
- `workout` (`sooyeon`): `state.exercise` 중 `strength === true`인 항목의 `date` 및 레거시 `state.strength[].date` 중 최신 날짜 (`steps`만 있고 `strength: false`인 행은 `steps`만 반영)
- `wrongReview` (`yoonseul`): `state.learningWrongAnswers` (`projectId`, `reviewStatus`, `lastWrongDate || firstWrongDate`, `lastRetryAt || reviewedAt || masteredAt`). 활성 `learningProjects`에 속한 미복습 항목(`reviewStatus`가 `'reviewed' | 'retry_completed' | 'mastered'`가 아닌 행)의 가장 오래된 날짜 추적, 오늘 복습 완료 시 `level: 0`
- `spendReview` (`haru`): `state.spendReviews` (`date`, `reviews[]`). `reviews`가 비어 있는 구매 기록의 가장 오래된 `date` 추적(14일 경과부터 1단계), 리뷰 완료 시 `level: 0`
- `quiz` (`hina`): `state.learningProjects` (`id`, `status`)와 `state.learningQuizzes` (`projectId`, `status`, `scheduledDate || date`, `completedAt`, `questions`)

## 3. 못 넣은 후보와 이유

- **윤슬 — 읽는 중인 책**: `hani-main.js` 기준 `state.books`의 `status`는 `'wish' | 'read'` 두 가지뿐이며, 보유 날짜 필드도 `completedDate`, `readDate`, `updatedAt`, `createdAt`만 존재함. `'reading'` 상태나 현재 읽는 중 진행률·진행 날짜가 별도로 저장되지 않아 추측이나 새 저장 필드를 만들지 않고 미추가 결정.
- 대신 윤슬은 실제 학습 상태 키인 `state.learningWrongAnswers` 기반 **오답노트 복습(`wrongReview`)**을 맡도록 구성함.

## 4. 말풍선·카드 배경 꾸미기 및 안전 규칙

- **에셋 정책**: 새 이미지를 추가하지 않고 기존 치비 시트(`./assets/procrastination/pb-chibi-sheet-v1.webp`: 나은·히나·지은·하루·민지)와 기존 프로필 썸네일(`./assets/profiles/thumb/hani-profile-{hani,gaeun,sooyeon,yoonseul-v2}-256.webp`)만 CSS `url(...)`로 참조.
- **말풍선 & 답장 버튼**: 말풍선 위 담당자 컬러 이름표(`.pb-nametag`), 0~4단계 말풍선 테두리·장식(`✦`/`✧`, `💢`, `💧`), `15.5px` 본문 가독성 개선, `"미안해, 지금 할게! 🐸"` 답장 버튼 클릭 시 `staff.reply`로 임시 전환 후 단일 짧은 `setTimeout(480ms)`으로 해당 화면 이동(영구 저장 없음).
- **카드 배경 & 접근성**: 9명 담당자별 CSS 패턴(운동장·칠판·줄노트·쇼핑백·필름 스트립·플래너 그리드·트랙·책장·보라 사무실) + 0~4단계 날씨 톤 오버레이, `[data-theme="dark"]` 및 `midnight-black`/`titanium-graphite` 피니시 고대비 대응, `600px` 이하 모바일 1열·overflow 방지, `prefers-reduced-motion: reduce` 대응.
- **읽기 전용 원칙**: `localStorage`, `sessionStorage`, `hani_os_life_v23`, Cloud write, observer, 상시 타이머 없음.

## 5. 바꾼·추가한 파일

- 수정: `hani-procrastination-board.js`
- 수정: `hani-procrastination-board.css`
- 추가: `scripts/hani-procrastination-2.test.mjs`
- 추가: `artifacts/procrastination-2/REPORT.md`

## 6. 기존 테스트 중 깨지는 항목 (원본 파일 미수정)

기존 테스트 파일은 요구사항대로 수정하지 않았으며, 2차 개편 스펙 변경으로 아래 기존 테스트는 실패할 수 있음:

1. `scripts/hani-procrastination-board.test.mjs`
   - `scripts/hani-pb-chibitoon-legacy-preload.mjs` → `scripts/hani-pb-chibitoon-source.mjs`가 `scripts/fixtures/pb-chibitoon-delta.json`의 기존 `afterSha256` 해시와 `hani-procrastination-board.js` / `.css`가 완전히 일치할 것을 요구하므로, 두 파일 수정 즉시 preload 단계에서 실패.
   - 답장 버튼 내 1회성 `setTimeout(..., 480)` 추가 때문에 `setTimeout` 금지 정규식 검사에서 실패.
2. `scripts/hani-procrastination-cases.mjs`
   - 카드 개수 7개 고정(`model.length === 7`, `root.children.length === 7`) 및 `diary.owner === 'minji'` 전제로 작성되어 12장·`hani` 담당 변경 후 실패.
   - `makeBoardFixture()`의 `learningQuizzes`에 `projectId` 및 `learningProjects`가 없어 퀴즈 필터 강화 이후 `quiz`가 미완료로 잡히지 않음.
   - `runRenderCases`의 mock 카드가 `.pb-mediation` 등 새 DOM 슬롯을 포함하지 않으며 `setTimeout`을 전면 금지함.
3. `scripts/hani-procrastination-board.browser.mjs`
   - `makeBoardFixture()`에 의존하여 `stages.slice(0, 5)` 검사 시 `quiz` 프로젝트 부재 및 카드 순서 변화로 기존 기대치와 어긋날 수 있음.

## 7. 서윤이 실행할 검증 명령

본 세션은 파일 읽기/쓰기 도구만 사용 가능해 shell 테스트를 직접 실행하지 못했습니다. 서윤이 아래 명령으로 신규 테스트 및 문법·레이아웃 검증을 실행해 주세요:

```bash
node --check hani-procrastination-board.js
node --test scripts/hani-procrastination-2.test.mjs
```
