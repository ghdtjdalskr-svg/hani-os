# 단톡방 v2 시험 파일 수정 보고

- 작성: 세린 (Gemini 연구원 · 개발자 역할)
- 대상 파일: `scripts/hani-fun-chat-fortune.test.mjs`
- 기준 구현: `hani-ui-v02992.js` (`// BEGIN HANI FUN CHAT FORTUNE` ~ `// END HANI FUN CHAT FORTUNE`)
- 참고 fixture: `scripts/hani-helper-bot.test.mjs` (`fixture`, 수정하지 않음)

---

## 1. 바꾼 단언 목록

### 1) 풀(Pool) 검증 (`real pools: 30 complete conversations, 60 unique positive cards, public voices only`)
- **대화 수 및 키 유일성**: `CHAT_POOL.length === 30`, `new Set(CHAT_POOL.map(c => c.key)).size === 30`, `lines` JSON 유일성 30건 확인.
- **최대 줄 수 및 대화별 메시지 수**: 기존 `lines.length + 2 >= 6 && lines.length + 2 <= 12` 단언을 v2 규칙에 맞게 `lines.length >= 15 && lines.length <= 20`으로 변경하고, `Math.max(...CHAT_POOL.map(c => c.lines.length)) === 20`(`SLOTS`) 확인 추가.
- **메시지 형식(글·스티커·간격)**: 각 줄 `[id, body, gap]`에서 `id`는 허용 화자(`staff` + 4종 펫), `gap`은 0 이상 정수인지 확인하고, `body`가 문자열이면 `1 <= body.length <= 40`, 객체이면 `{ sticker }`가 8종 허용 스티커 키(`heart`, `laugh`, `cry`, `thumbs`, `clap`, `sleepy`, `coffee`, `surprised`) 중 하나인지 검증.
- **금지 단어 검사 유지 및 v1 잔여 문구 정리**:
  - 금지 단어 정규식(`/돈|금액|투자|...|회장(?!님)|\d[\d,]*\s*원/`)과 storage/fetch/network/Math.random 금지 검사는 그대로 유지.
  - v1에서 카페 바리스타 화자 검증용으로 있던 `/이슬/`, `/은하/` 매치 단언은 v2 `CHAT_POOL`(직원 19명 대화)에 해당 리터럴이 없으므로 제거하고 `/회장님/` 매치는 유지.

### 2) 날짜 경계 및 요일 (`KST midnight, same day stable, all sliding 14-day windows unique across cycle seams`)
- 기존 KST 자정 경계, 동일 날짜 안정성, 전일 대비 변경, 14일 sliding window 유일성, 30일/60일 순환 단언을 모두 유지.
- `dailyChat(start - 1).weekday === '금'`, `dailyChat(start).weekday === '토'`, `dailyChat(start + DAY).weekday === '일'` 요일 단언 추가.

### 3) 시간 경계·메시지 모델·슬롯·묶음·스티커·입력 중 표시 (`only elapsed messages at every timestamp edge; v2 grouping, stickers, slots, typing and no future text in DOM`)
- **30일 전체 대화 규칙 검증**: 30개 대화 모두에 대해 다음을 확인.
  - `end.messages.length === raw.lines.length` (15~20개), `end.next === null`
  - 시작 시각 공식: `end.messages[0].minute === Math.min(720, Math.max(570, 1120 - totalGap)) + raw.lines[0][2]`
  - 각 메시지 `m`의 `time`(`HH:MM`), `photo`(`body === '(사진)'`), `sticker`·이모지 변환(`💖`,`🤣`,`😭`,`👍`,`👏`,`😴`,`☕`,`😲`) 및 스티커일 때 `react === 0`, 일반 텍스트/사진일 때 `0 <= react <= 3`
  - `cont`/`last` 계산 규칙 및 일자 말미 `unread === 0`
- **시간 경계 메시지 증가 검증**: `gap: 0`인 연속 메시지 묶음이 동시에 나타나는 경우를 반영해 각 `message.minute` 경계에서 `boundary - 1`은 `beforeCount`, `boundary`는 `atCount` 및 마지막 텍스트가 일치하는지 확인하고, 단독 간격(`gap > 0`이고 다음 줄도 `gap > 0` 또는 마지막 줄)에서는 `messages.length === i + 1`로 1개씩 증가함을 확인.
- **안 읽음(`unread`) 감소 검증**: 메시지 표시 직후 `4`, 3분 후 `3`, 12분 후 `0`으로 감소함을 확인.
- **슬롯 수·자식 요소 순서·숨은 슬롯 비움**:
  - 기존 고정 `8`을 `SLOTS` (`20`)로 변경.
  - 각 `.hani-fun-message` 슬롯 내부 자식 순서가 `span.hani-fun-face`, `b`, `p`, `span.hani-fun-stamp`(`em`, `time`)인지 확인.
  - 숨은 슬롯(`hidden === true`)은 `b`, `p`, `em`, `time` 모두 빈 문자열(`''`)인지 확인.
- **제목·메타·주제바**: 채팅 모드에서 `h3 === 'HANI 오피스 수다방 🌸'`, `.hani-fun-meta === '2026-11-07 토요일 · 엿보기 전용 👀'`, `.hani-fun-topic === end.title` 및 `hidden === false` 확인.
- **입력 중(`.hani-fun-typing`) 3가지 상태**:
  - 기존 `'지금 입력 중…'` 고정 단언을 v2 규칙으로 변경:
    - 첫 메시지 3분 초과 전(`start`): `dataset.state === 'quiet'`, `'잠깐 조용해요… 곧 또 수다가 올라와요'`
    - 다음 메시지 3분 이내(`minute - 2`): 첫 메시지 직전 및 낮 시간대 간격(`gap > 3`) 직전 모두 `dataset.state === 'typing'`, `'<이름> 님이 입력 중…'`
    - 일일 대화 종료 후(`start + DAY - 1`): `dataset.state === 'done'`, `'오늘의 수다는 여기까지. 내일 또 만나요!'`
- **묶음/스탬프/스티커/반응/프로필 이미지 DOM 반영**:
  - 묶음 진행 중(`nonLast.minute + 1`), 정오(`12:00`), 하루 종료 직전(`start + DAY - 1`) 시점마다 DOM이 `dailyChat(at).messages`와 일치하는지 확인.
  - `row.dataset.cont`, `row.dataset.last`, `row.dataset.kind` (`sticker`/`photo`/`text`), `.hani-fun-face`의 `style.backgroundImage`, `p.dataset.react`, 스티커 이모지 렌더링 확인.
  - `time`과 `em`(안 읽음 수)이 `m.last`가 `true`인 묶음 마지막 줄에만 표시되고(`em`은 `m.unread > 0`일 때만), `m.last`가 `false`인 줄에서는 빈 문자열인지 확인.

### 4) 영속 슬롯·모드 전환·자정 롤오버 (`persistent root/slot/message nodes, ...`)
- 채팅 모드 진입 시 `h3` (`'HANI 오피스 수다방 🌸'`), `.hani-fun-meta` (`'2026-11-07 토요일 · 엿보기 전용 👀'`), `.hani-fun-topic.hidden === false` 확인 추가.
- 운세 모드 진입 시 `h3` (`'오늘의 운세 🔮'`), `.hani-fun-meta` (`'2026-11-07 · KST · 읽기 전용'`), `.hani-fun-topic.hidden === true` 확인 추가.
- 자정 롤오버(`start + DAY`) 후 `.hani-fun-meta`가 `'2026-11-08 일요일 · 엿보기 전용 👀'`인지 확인하고, 기존 20개 슬롯 노드가 그대로 재사용되며 모두 `hidden` 및 내용(`b`, `p`, `em`, `time`)이 비워졌는지 확인.

### 5) 브라우저 시험 (`real browser 390x844 / 1280x900 screenshots, ...`)
- 기존 `visible` 6개 고정 단언(`assert.equal(await content.locator('.hani-fun-message:visible').count(), 6)`)을 `page.evaluate(() => window.HaniFunPreview.dailyChat(Date.now()).messages.length)` 기반 동적 개수 확인(1~20 범위) 및 전체 슬롯 `.hani-fun-message` 20개 확인으로 변경.
- 브라우저 실제 DOM에서 채팅/운세 모드별 `h3` 제목과 `.hani-fun-meta` 문구 확인 추가.

---

## 2. 확인하지 못한 점

1. **실제 Node 테스트 및 브라우저 테스트 미실행**
   - 현재 작업 환경에 셸/Node/Playwright 실행 도구가 없어 `node scripts/hani-fun-chat-fortune.test.mjs` 및 Playwright 브라우저 시험을 직접 실행하지 못했습니다.
   - 문법 오류 여부와 모든 단언의 실제 PASS 여부는 서윤 팀장님의 테스트 실행을 통해 최종 확인이 필요합니다.
2. **기존 `fixture`(`scripts/hani-helper-bot.test.mjs`)의 DOM 모킹 한계**
   - 지시사항에 따라 `scripts/hani-helper-bot.test.mjs`의 `fixture`는 수정하지 않았습니다.
   - 해당 `Element` 클래스의 `this.dataset` Proxy에는 `set` 트랩만 있고 `deleteProperty` 트랩이 없습니다. 따라서 `hani-ui-v02992.js`의 `delete bubble.dataset.react` 실행 시 `bubble.dataset.react`는 `undefined`가 되지만 `bubble.attributes['data-react']` 속성은 남습니다(실제 브라우저 DOM과 다름). 또한 `Element`에 `scrollHeight`, `clientHeight`, `scrollTop`이 없어 `refresh()`의 하단 스크롤 동작은 Node fixture에서 검증되지 않으며 브라우저 시험 영역에서만 검증 가능합니다.
3. **브라우저 시험의 `2026-11-07T15:30:00+09:00` 시각 화면 레이아웃 및 20슬롯 스크롤**
   - 20개 슬롯과 15~20줄 메시지(사진·스티커·리액션·말줄임/묶음) 적용 후 `390x844` / `1280x900` 화면에서 `#haniHelperSpeech`의 뷰포트 경계, 가로 overflow, 스크롤 동작은 실제 Chromium 실행으로 확인해야 합니다.
