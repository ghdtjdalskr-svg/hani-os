# 라운지 문구 자연화 211

## 작업 식별

- 2026-10-13 KST / 도연(Codex), 단일 Agent + 자동 검사. **구현·targeted 검증 완료 / 미커밋·미배포**.
- branch/worktree: `hani/lounge-natural-211` / `ln211`. 시작 HEAD/base: `bb40d84076226ea9e4ceaea1b994bd91d29a55b0` = `hani/train-210`.
- 승인: 대표님의 문구·결정적 다양화·기존 답글 mechanics·테스트 요청. 커밋/버전/cache 증가/새 저장 키/데이터 구조/Cloud schema 변경 금지.
- 파일: `hani-board.js`, `scripts/hani-lounge-natural-211.test.mjs`, 이 문서, CURRENT 요약. 타 담당 파일 덮어쓰기 없음.
- CODEMAP_MISS: board 항목 없음. 실제 owner `realEvents → eventDraft → generateDaily`, `generateThreadAdapter/ownerReactions → localQueueReplies/postPreview`, `commentMarkup/stripLeadingVocative` 확인.
- CLI 원격 조회는 연결 실패. GitHub connector로 최신 main `8833943c62eedf251cb9266477a96cb7d7a29a74` / PR265 확인: 210 후보가 main으로 진행됐으나 **main의 board 원문은 시작 원문과 바이트 동일**. merge/rebase 없음. 로컬 origin/main은 `be9bd10`으로 오래된 참조.
- 작업 표시 버전·마지막 script: **v2.9.209 / hani-ai-budget.js?v=2.9.209 유지**. 원격 index는 v210 cache 참조. 실제 운영 표시·JS 로딩·read-back은 이번에 확인하지 않음.

## 결과와 증거

- 기록 소식 11종(완독/영화/걸음/체중/할 일/달성/진행/정산/화면 버전/새 분기/개발)에 제목·본문 4변형. 기존 sourceEventId hash로 선택, 본문 2–3문장과 담당자 한마디. 책 제목·저자, 걸음 수, 영화·할 일·목표 이름은 원본만 사용하고 미확인 저자·감상·성취를 만들지 않음. 목표 진행의 일부 기록/미확정 결산 안내와 개발 원문의 상태 보존.
- 기존 회장님 반응 pool은 유지하면서 같은 첫 문장을 먼저 피함. LIFE/LOUNGE의 일반 대화는 짧은 한 줄과 두 문장을 섞고, 3명이 생성되면 마지막 직원이 첫 직원에게 기존 parentIndex/parentId로 답글. pinned/WORK 등 공식 글, 명시적으로 직원을 부른 글, 회장님이 남긴 개별 댓글에 대한 직접 답변은 기존 경로 유지. 감정·질문 답글도 동료 대화에서는 그 맥락을 유지.
- 새 댓글 트리거 없음: 기록 글에 자동 댓글 생성 기능을 추가하지 않음. 기존 직원 Library 글/댓글 원문과 이미 저장된 글·댓글은 재작성하지 않음. 댓글 수 1–3, 예약 3/12/60분, 일일 기록 글 1개·Library 2–4개, event dedupe·기존 저장과 rollback 유지.
- 기존 save/persist·data structure·Cloud write/schema·storage key·public API·DOM/event owner 그대로. 새 id literal/Math.random/clear 호출 없음. QA-210의 intent × topic 및 mention chip 때만 vocative strip 유지.
- 서버 `supabase/functions/hani-agent-orchestrator/index.ts`에는 게시판 댓글 drafting prompt/route가 없음(기존 adapter 설명과 실제 코드 확인). 서버 파일 수정 없음. **서버 prompt 변경분은 별도의 Edge deploy가 필요하지만, 이번 작업에는 해당 배포 대상이 없음**. 뉴스룸/Boardroom prompt는 수정하지 않음.

| 실행한 검사 (Node v24.20.0 / Windows, base + 현재 diff) | 결과 |
|---|---|
| `node scripts/hani-lounge-natural-211.test.mjs` | 6/6 PASS: 11종 × 64 seed 제목 다양성/결정성/문장 수/emoji; 원본 facts; 400개 스레드 첫 문장/길이/동료 답글; 실제 preview→single save/rollback/parentId/mention; 720개 QA topic/intent 조합; 일일 제한/원본 보존 |
| `node scripts/hani-qa-210-followup.test.mjs`; `node scripts/hani-qa-210.test.mjs .ai-budget-private/qa210/base` | 14/14 + 9/9 PASS, 준비된 baseline 사용 |
| `node scripts/hani-board*.test.mjs` (board/203a/community/guard/library/living/relationship/vocative 각 직접 실행) | 8개 파일 모두 PASS: 기존 save·backup·Cloud fixture·실제 handler/markup 회귀 포함 |
| 같은 패턴의 Boardroom recovery/live-meeting/routing/voice-contract/cross-review | 5개 파일 assertion 모두 PASS; 아래 환경 제한·fixture 준비 참고 |
| syntax / `git -c core.whitespace=cr-at-eol diff --check` / canonical owner 원문·줄별 EOL | PASS: 원문 유지한 1,044줄의 terminator 비교, 저장·renderer·generateDaily/materialize/refreshLiving/API 원문 동일 |

- **기존 테스트 기대값 수정 없음**. routing은 원래 요구하는 rebuilt Edge fixture 경로를 제공해 PASS. voice/cross-review의 최초 일반 실행은 Node child-process spawn EPERM으로 차단됨. shell에서 실제 `cd90dada` 원본과 기존 Git 패치 6단계를 재구성한 후, private fixture bridge로 그 파일 I/O만 제공하여 **기존 assertion을 수정하지 않고** 실행함. native subprocess 동작 자체의 PASS는 주장하지 않음.
- Boardroom 재실행 근거: `node --import ./.ai-budget-private/lounge211/boardroom-fixture-bridge.mjs scripts/hani-boardroom-voice-contract.test.mjs` 및 cross-review 동일; routing은 `.ai-budget-private/lounge211/boardroom-rebuilt/supabase/functions/hani-agent-orchestrator/index.ts` 인자. 로컬 상세 로그/재구성 원문/예시는 `.ai-budget-private/lounge211/` (미추적).
- 실제 브라우저 화면·Android·실제 서버 AI·Cloud·Candidate build/One-Pass/HINA/Production read-back 미실행. 기능 탭 Development 작업이며 배포 담당의 최종 열차 검증이 남음. main 병합/Pages/운영 반영 완료가 아님.

## 말투 전후 예시 6개

아래 기록 값은 검사용 합성 자료입니다. 글은 실제 eventDraft 결과이고, 댓글은 같은 제목의 별도 회장님 라운지 글(본문 “소식을 같이 나눠요.”)에서 생성한 결과입니다. 기록 글에 새 자동 댓글 트리거가 생겼다는 뜻은 아닙니다. 변경 전 댓글은 기존 반복 말투의 대표 예시이며, 동일 seed의 전후 snapshot 비교는 아닙니다.

1. **하루** — 전: 「완독 기록이 등록됐어요.」 → 후: **회장님 『인간 vs 기계』 완독하셨대요 📚**
   - 본문: 『인간 vs 기계』 (김대식) 끝까지 읽으셨대요. 마음에 남은 대목이 궁금해요. 커피 한 잔 곁들여 이야기 듣고 싶어요.
   - 댓글 전: 「회장님, 읽고 있어요. 조금 더 들려주세요.」
   - 댓글 후: 유나: 「어떤 대목이 남으셨는지 궁금해요.」

2. **민지** — 전: 「시청 완료 기록이 등록됐어요.」 → 후: **『인터스텔라』, 감상이 궁금해요**
   - 본문: 회장님이 『인터스텔라』 시청을 마치셨어요. 가볍게 이야기 나눠요. 나중에 다시 읽어보고 싶은 소식이에요.
   - 댓글 전: 「회장님, 읽고 있어요. 조금 더 들려주세요.」
   - 댓글 후: 하니: 「제 취향일지도 궁금하네요.」 / 나은: 「스포 없이 감상 듣고 싶어요! 무리 없이 이어가셨으면 좋겠어요.」 / 히나 → 하니 (mention chip): 「저도요 ㅎㅎ. 스포는 아껴두고 얘기해요.」

3. **수연** — 전: 「걸음 기록이 하나 더 쌓였어요」 → 후: **12,345보, 같이 박수 보내요**
   - 본문: 걸음 기록에 12,345보가 남았어요. 회장님께 수고하셨다고 전하고 싶어요. 이런 얘기 나오면 저도 신나요!
   - 댓글 전: 「회장님, 읽고 있어요. 조금 더 들려주세요.」
   - 댓글 후: 하니: 「잠깐 스트레칭하고 싶어지네요.」 / 나은: 「수고하셨어요! 쉬는 시간도 챙겨주세요. 무리 없이 이어가셨으면 좋겠어요.」 / 히나 → 하니 (mention chip): 「이런 응원은 같이 보태고 싶어요.」

4. **수아** — 전: 「완료 표시된 할 일이 있어요.」 → 후: **할 일 마무리 소식: 『발표 준비』**
   - 본문: 회장님이 『발표 준비』 마무리하셨어요. 이런 소식 들으면 저도 힘나요. 저도 응원 한 표 보태요!
   - 댓글 전: 「회장님, 읽고 있어요. 조금 더 들려주세요.」
   - 댓글 후: 나은: 「마무리 소식에 박수요!」

5. **하니** — 전: 「달성으로 기록된 목표가 있어요.」 → 후: **회장님 『분기 생활 목표』 달성하셨대요**
   - 본문: 회장님이 『분기 생활 목표』 달성하셨어요. 같이 축하하고 싶어요! 이런 소식은 같이 나누고 싶어요.
   - 댓글 전: 「회장님, 읽고 있어요. 조금 더 들려주세요.」
   - 댓글 후: 유나: 「수고하셨어요. 잠깐 쉬셔도 좋겠어요.」

6. **서윤** — 전: 「개발 기록을 같이 읽어봐요.」 → 후: **개발팀 소식: 라운지 문구 검토 · 검증 대기**
   - 본문: 라운지 문구 검토 · 검증 대기 소식이 있어요. 상태는 원문에 적힌 그대로 같이 봐요. 한 줄 남겨두니 함께 이야기하기 좋네요.
   - 댓글 전: 「회장님, 읽고 있어요. 조금 더 들려주세요.」
   - 댓글 후: 유리: 「대표님, 오늘은 어떤 느낌이셨어요? 확인할 건 차분히 볼게요.」 / 서윤: 「회장님, 편하게 이야기해요. 저도 같이 듣고 있어요. 빠뜨린 건 없는지 같이 챙겨요.」

## 다음 담당에게

- 배포 담당 Claude: 최신 main 위에 이 board diff와 새 테스트를 통합한 뒤 targeted test·열차 QA·대표님 Preview/승인 진행. 별도 Edge 변경/배포 대상 없음. 기존 version/cache는 열차에서 한 번만 증가.
- 이번 결과는 로컬 미커밋 작업. push/PR/merge/배포 없음. 대표님 커밋 금지 지시가 우선이므로 자동 탑승 push를 하지 않음.
- Notion 현황판 읽기 성공. 착수 append는 **자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절**하여 미반영. 갱신 대기: 2026-10-13 도연 / lounge-natural-211 / base bb40d840 / main8833943, 자연화·위 검증 완료, 실화면·열차 gate 대기, 미커밋·v209 유지. 허용 환경에서 이 요약을 저장하고 read-back 필요.
- CURRENT는 이 작업의 확인된 결과 한 문단만 추가, 이전/다른 담당 기록 보존. 새로운 승인·배포 완료로 기록하지 않음.
- 최종 status에서 `hani-ui-v02992.js`, `hani-style-08.css`의 별도 완료 축하 효과 변경과 `artifacts/sidebar-mini/`가 새로 관측됨. 도연 라운지 작업의 수정/검증/인수 범위에 포함하지 않고 그대로 보존함. 인계 시 파일 전체 묶음이 아니라 위 라운지 소유 파일과 diff만 사용.

## 조회·추천 표시 개선 211 · 착수

- 2026-10-13 KST / 도연(Codex) / NORMAL / 진행 중. branch `hani/lounge-natural-211`, 시작 HEAD `a283a1a8ad93635f7db62e033437295b1f543ac6`; 기존 자연화 작업은 이 HEAD에 이미 포함되어 그대로 보존.
- 대표님 승인 범위: 직원 독자·공감 DISPLAY projection, 목록/상세/인기/weeklyBest 및 targeted tests, 합성 전후 예시. `hani-board.js`, 신규 views211 테스트, 관련 QA210 기대값, 이 인수인계만 수정. 커밋·버전/cache·저장값/persist·Cloud/schema 변경 금지.
- CODEMAP_MISS(board 없음). 실제 owner: displayViews/listPosts/render/weeklyBest/paintLiving. persist/openPost/viewChange/toggleLike/toggleReaction 저장 경로 보존.
- CLI origin/main 조회 연결 실패; GitHub connector 최신 main `8833943c62eedf251cb9266477a96cb7d7a29a74` 확인(이전 자연화 인수인계와 동일). merge/rebase 없음. 작업 index v2.9.209, 마지막 JS `hani-ai-budget.js?v=2.9.209`. 실제 운영 표시/JS 로딩 미검증.
- Notion 읽기 성공, 착수 append는 자동 승인 검토 `MCP tool call requires approval, but approval policy is never` 거절. 결과 요약 갱신 대기를 아래에 보존.

### 조회·추천 표시 개선 결과 · 2026-10-14 KST

- 도연 / 시작 HEAD a283a1a8 / 같은 branch / **구현·targeted 검증 완료, 미커밋·미push·미배포**. 기존 말투 작업 보존. 기존 숫자 해시 baseline을 제거하고, 명단의 고유 직원 참여 + post.id/staff.id 해시를 사용. KST 게시일 기준 독자 확률 40% → 2일 70% → 7일 90%, 공감 subset 25%/35%/45%와 긍정 댓글 작성자 포함. 자동 선택은 표시 추정임을 tooltip에 명시.
- displayViews 유지, displayLikes/boardReaders export. 목록·상세·추천 버튼·인기/weeklyBest에 동일한 날짜·계산을 사용하고, 모바일 조회/추천 문구와 공지 우선은 유지. 추천→조회 순으로 정렬. 익명 reaction count는 직원 ID를 알려주지 않아 특정 직원으로 해석하지 않음.
- 조회는 저장 views + 고유 직원 수. 저장 views가 0/1이면 총수 ≤ roster+1이며, 과거 여러 세션의 views가 1보다 크면 **저장값+roster**가 상한임(저장값 보존과 합산 요구 준수). likes도 저장값을 그대로 더함. 저장 댓글·예약/초안/archived 제외·reactions 원문·persist·Cloud/schema·보호 키·버전/cache 변경 없음.
- 새 테스트 `node scripts/hani-board-views-211.test.mjs` **7/7 PASS**: 반복 결정성/명단 상한/날짜별 단조 증가/확률/참여자 중복 제거/긍정 공감/실제 renderer 목록·상세·버튼·tooltip/인기·weeklyBest. recovery와 정상 write 허용 상태의 render 모두 deep-equal 원문 보존 및 persist 0회 확인.
- 기존 보드 **8개 파일 PASS**: `node scripts/hani-board{,-203a,-community,-guard,-library,-living,-relationship,-vocative}.test.mjs` (각 직접 실행). QA210 **9/9+14/14**, 자연화211 **6/6 PASS**: `node scripts/hani-qa-210.test.mjs`, `node scripts/hani-qa-210-followup.test.mjs`, `node scripts/hani-lounge-natural-211.test.mjs`.
- **기대값 수정은 scripts/hani-qa-210.test.mjs만**: 12–180 baseline/75개 이상 숫자 다양성 대신 저장값+직원 명단 상한과 실제 독자 수 다양성으로 변경. QA210 Edge에는 옛 baseline 하드코딩이 없고 이미 displayViews를 읽으므로 수정 없음.
- Boardroom recovery/live-meeting PASS. routing은 `node scripts/hani-boardroom-routing.test.mjs .ai-budget-private/lounge211/boardroom-rebuilt/supabase/functions/hani-agent-orchestrator/index.ts` PASS. voice-contract/cross-review는 직접 실행 spawn EPERM; 기존 `node --import ./.ai-budget-private/lounge211/boardroom-fixture-bridge.mjs scripts/hani-boardroom-<voice-contract|cross-review>.test.mjs`로 **원래 assertion PASS**, native subprocess는 미검증. 테스트 자체 수정 없음.
- syntax·diff check·canonical 16개 함수 바이트 동일·보존된 1160줄 EOL·기존 id literals/clear 호출/버전/cache/저장 호출 비교 PASS. 재현용 합성 예시·비교 결과: `.ai-budget-private/views211-evidence.json`. QA210 자동 산출 `artifacts/qa-210/node-evidence.json` 신규(테스트 결과), 기존 `artifacts/sidebar-mini/` 보존.

| 합성 글 (2026-10-13 12:00 KST 계산) | 저장 조회/추천 (불변) | 변경 전 표시 조회/추천 | 변경 후 표시 조회/추천 |
|---|---|---|---|
| 오늘 같이 이야기해요 (views211-lounge) | 1/0 | 52/0 | 8/3 |
| 완독 축하 소식 (views211-record) | 1/1 | 101/1 | 15/8 |
| 개발팀 이야기 (views211-work) | 3/2 | 110/2 | 19/9 |

- **미검증/다음 행동**: 실브라우저 화면·Android·실운영 Cloud·Candidate/열차 gate·Production read-back 미실행. 배포 담당 Claude가 이 기능 diff를 최신 main 열차에 통합한 뒤 Preview와 승인 진행. Edge Function/서버 설정 변경·별도 배포 대상 없음. 대표님 커밋 금지 지시로 자동 push/PR 없음.
- Notion 자동 승인 검토의 policy never 거절로 갱신 대기. 허용 환경에서 날짜(2026-10-14), 담당 도연, 위 목적·변경·PASS/미검증·branch/base/main 및 이 원문 링크를 저장 후 read-back할 것. CURRENT/다른 담당 기록 추가 수정 없음. 이 결과는 main/Pages/운영 완료가 아님.

## 재미 추가

- 2026-10-14 KST / 도연(Codex), 단일 개발 Agent + 자동 검사 / NORMAL. 대표님의 211 Preview 피드백과 현재 요청 승인으로 진행.
- branch/worktree: `hani/lounge-natural-211` / `ln211`, 시작 HEAD `3d5446ccefcd8216a1a70334d49d09cc903e1dfe` (기존 자연화·조회 작업 포함, 보존). 수정 범위 `hani-board.js`, 신규 `scripts/hani-lounge-fun-211.test.mjs`, 이 문서. 커밋·push·PR·버전/cache 변경·새 저장 키·데이터 구조·Cloud/schema 변경 금지.
- CODEMAP_MISS(board owner 없음), 실제 `libraryThreads → generateDaily → publicationReplies → refreshLiving/persist` 경로와 `personaMap/ownerReactions/loungeReactions` 확인. 기존 DOM/event/renderer·저장 owner 유지.
- 원격 main은 GitHub connector로 `8833943c62eedf251cb9266477a96cb7d7a29a74` 확인, 앞선 인수인계와 동일. CLI ls-remote 연결 실패, merge/rebase 없음. 작업 index v2.9.209 / 마지막 UI JS `hani-ai-budget.js?v=2.9.209` 유지. 실제 운영 화면 표시·JS 로딩/read-back 미실행.
- Notion 현황판 읽기 성공. 착수 요약 append는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 코드 작업과 별개로 요약 저장/read-back은 갱신 대기.

### 결과와 검증 · 2026-10-14 KST

- **구현·targeted 검증 완료 / 미커밋·미push·미배포**. 기존 자연화·조회 구현 보존. 직원 잡담 **60개 / 17개 주제**(점심, 러닝, OTT·웹툰·드라마, 카페·맛집, 야식, 월요병, 커피, MBTI, 여행, 연봉·절약 짤, 공연·티켓팅, 반려동물, 자취 요리, 게임, 직관, 책상 취향, 월별 계절).
- 기존 Library에서 새 일일 슬롯을 고를 때 sourceEventId의 기존 hash로 약 삼분의 일을 잡담으로 표시한다. 잡담 슬롯은 기존 eligible 비공식 글을 carrier로 사용하고 **원래 Library ID·일일 한도 2–4·dedupe·90일 재사용 제한·예약 시간·저장 row 구조**를 유지한다. WORK/pinned/민감 원문은 잡담으로 바꾸지 않는다. 원본 Library 파일과 이미 저장된 게시글·댓글을 수정하지 않는다. 빈 Library에 fallback 게시글을 만들지 않는다.
- 일상 48개 + 월별 계절 12개. 잡담 중 약 육분의 일에 해당 KST 월 소재를 선택(시월 단풍·할로윈 등); 실제 날씨·뉴스·가격·점수·작품 줄거리를 단정하지 않는다. 회사 동료의 사생활, 정치, 과음, 외모 평가가 없는 내용. 새 저장 키·id literal·clear 호출 없음.
- existing personaMap/roster를 확인해 히나 선생님 장난, 하루 컵·커피, 지은 공감 예산, 유나 신입, 민지 콘텐츠 드립, 아린 취향, 수아 준비·후속, 나은 편한 페이스 말투를 사용한다. 댓글은 한 줄 반응과 두 문장을 섞고, 세 번째 직원이 첫 댓글에 기존 replyTo/parentId로 가볍게 답한다. 새 댓글 트리거·event/renderer layer 없음. 기존 publicationReplies 예약(3/12/60분), refreshLiving/persist 단일 저장·review·rollback 사용.
- 일반 회장님 글도 가벼운 반응을 섞고 완독·달성에는 독서왕/박수 표현을 허용한다. 직접 질문·호칭·댓글 답변의 QA-210 주제 처리를 보존. fear가 ㅋㅋ/ㅎㅎ보다 우선하고, 글/답변 문맥의 병원·질병·상실·부고·우울·불안 등을 함께 확인해 농담을 차단한다. WORK/pinned의 실제 생성 adapter도 농담을 차분한 문장으로 바꾼다. QA-210 책/AI 걱정 답변은 확인된 사실과 가정을 나누는 안심 내용 유지, 웃음 표현 제거.

| 검사 (Windows / Node v24.19.0 / HEAD 3d5446c + 현재 미커밋 diff) | 결과 |
|---|---|
| node scripts/hani-lounge-fun-211.test.mjs | 7/7 PASS: 풀 크기/주제/직원/문장 길이·금지어·가격/점수, 결정성, 200일 비율, KST 12개월·경계, 기존 save/rollback/review·reply 링크, 기존 원문 보존, 민감/공식 농담 차단·기록 축하 |
| 200일 합성 Library(900개, 누적) 및 실제 shipped Library(매일 fresh 합성 상태) | 각각 총 595개 중 잡담 200개 = **33.6%**, 잡담 댓글 600개 중 한 줄 289개 = **48.2%**. 생성은 저장하지 않는 VM 실행; 실제 원본 사용 없음 |
| node scripts/hani-board{,-203a,-community,-guard,-library,-living,-relationship,-vocative}.test.mjs (각 직접 실행) | 기존 8개 파일 모두 PASS, 기존 기대값 수정 없음 |
| node scripts/hani-board-views-211.test.mjs / hani-lounge-natural-211.test.mjs | 조회 7/7 + 자연화 6/6 PASS; 실제 renderer/handler·표시 projection·기존 저장·회귀 포함 |
| node scripts/hani-qa-210.test.mjs / hani-qa-210-followup.test.mjs | 9/9 + 14/14 PASS, 안심 intent/topic·첨삭·제목·호칭 유지 |
| Boardroom recovery/live-meeting/routing/voice-contract/cross-review | 5개 원래 assertion PASS. routing은 기존 rebuilt Edge 인자 사용. voice/cross-review 직접 실행은 spawnSync git EPERM, 기존 fixture bridge로 실행(아래 제한) |
| JS/test syntax / git -c core.whitespace=cr-at-eol diff --check / 보호 비교 | PASS. canonical save/view/render 18함수·public API·index 버전/cache·storage/id/clear 패턴 원문 동일, 1190개 보존 줄의 mixed EOL 동일. seed 선택에서 실제 17주제 도달도 확인 |

- Boardroom 환경 제한: node --import ./.ai-budget-private/lounge211/boardroom-fixture-bridge.mjs scripts/hani-boardroom-voice-contract.test.mjs 및 cross-review 동일로 **기존 assertion 변경 없이** 확인. native subprocess는 미검증이며 PASS로 주장하지 않는다. routing 인자: .ai-budget-private/lounge211/boardroom-rebuilt/supabase/functions/hani-agent-orchestrator/index.ts. 상세 새 로그·보호 비교·예시는 .ai-budget-private/fun211/에 로컬 보존.
- 실제 브라우저 화면·Android·실운영 Cloud/AI·열차 Candidate build/One-Pass/HINA·Production read-back 미검증. 스킨/DOM/event/조회 renderer는 수정하지 않았고 기존 views 테스트의 렌더 실행 회귀는 PASS. 독립 아린/HINA 검토를 수행했다고 주장하지 않음.

### 재미 추가 예시 6개

아래는 실제 dailyThread builder로 만든 **합성 source seed의 결정적 게시글·댓글**이다. 기존 Library carrier ID를 사용하며, 예시를 운영 데이터에 저장하지 않았다. 날짜는 선택 재현용 KST seed, 댓글 도착은 3/12/60분이다. 세 번째 직원은 첫 직원 댓글에 답한다.

1. **유나 — 오늘 점심 국밥 vs 마라탕 투표 받습니다 🍜** (seed: daily:2026-01-02:2)
   - 본문: 제가 메뉴 담당인가요?! 국밥이랑 마라탕 사이에서 아직 결정을 못 했어요. 댓글로 한 표만 주세요 ㅎㅎ.
   - 히나: 「오늘은 빨간 펜 쉬는 시간이에요. 저도 메뉴판 앞에서 투표가 필요해요.」
   - 하루: 「커피 식기 전에 공감 한 표요 ☕」
   - 지은 → 히나 답글: 「공감 예산 넉넉하게 잡으셨는데요 ㅋㅋ」

2. **유나 — 운동복 꺼내기까지가 제일 긴 준비운동** (seed: daily:2026-01-04:0)
   - 본문: 퇴근 후 운동을 상상하다 운동복부터 고르고 있어요. 일단 가볍게 걷는 쪽으로 시작해볼까요 ㅎㅎ.
   - 하루: 「편하게 즐길 수 있는 쪽이 좋아요. 걷기 반에도 이름 올려주세요.」
   - 지은: 「계산기는 잠깐 닫고 취향만 나눠요. 걷기 반에도 이름 올려주세요.」
   - 민지 → 하루 답글: 「선배님 댓글에 제목 붙이고 싶어졌어요 ㅋㅋ」

3. **민지 — 넷플릭스 고르다가 쉬는 시간 끝날 듯 📺** (seed: daily:2026-02-01:2)
   - 본문: 볼거리 고르는 것도 취미로 쳐주나요 ㅋㅋ. 작품 내용 말고 오늘 보고 싶은 분위기만 나눠봐요.
   - 지은: 「공감은 무료니까 아낌없이요 ㅋㅋ」
   - 유나: 「저도 조심스럽게 한 표 보태봅니다. 스포 없이 취향만 얘기하면 저도 참여할게요.」
   - 아린 → 지은 답글: 「작은 디테일 얘기라면 저도 신나요. 그 한 표에 저도 살짝 올라탑니다.」

4. **수아 — 구독 정리 짤에 뜨끔한 사람 손** (seed: daily:2026-01-13:3)
   - 본문: 재테크 조언 말고 웃긴 생활 짤 얘기만 해요. 저는 안 쓰는 구독이 있는지 살펴보는 장면에 공감했어요 ㅎㅎ.
   - 아린: 「취향 합격 도장 꾹 ㅎㅎ」
   - 나은: 「힘 빼고 즐기는 쪽에 한 표요 ㅎㅎ」
   - 히나 → 아린 답글: 「이 정도면 취향 반장 만점 드릴게요 ㅋㅋ」

5. **민지 — 게임 캐릭터 꾸미다가 시작 버튼을 잊음** (seed: daily:2026-01-01:2)
   - 본문: 캐릭터 취향 얘기도 게임의 재미로 쳐주세요 ㅋㅋ. 요즘 순위 말고 편하게 즐기고 싶은 장르만 공유해요.
   - 아린: 「취향 합격 도장 꾹 ㅎㅎ」
   - 수아: 「참여 완료, 준비물은 가볍게요 ㅋㅋ」
   - 나은 → 아린 답글: 「편한 페이스로 같이 즐겨요. 그 한 표에 저도 살짝 올라탑니다.」

6. **아린 — 단풍 색 팔레트 vs 할로윈 소품 🍁** (seed: daily:2026-10-01:1)
   - 본문: 시월에는 단풍색이랑 작은 할로윈 소품을 상상해봐요. 주말 사진에 담고 싶은 색 한 표씩 주세요 ㅎㅎ.
   - 하루: 「편하게 즐길 수 있는 쪽이 좋아요. 계절 취향 한 표씩 나누는 거 좋아요.」
   - 지은: 「계산기는 잠깐 닫고 취향만 나눠요. 계절 취향 한 표씩 나누는 거 좋아요.」
   - 유나 → 하루 답글: 「선배님 투표 속도에 저도 따라갈게요 ㅎㅎ」

### 다음 담당 / 미반영 기록

- 배포 담당 Claude: 기존 자연화·조회와 이번 재미 추가 diff(런타임 hani-board.js + 신규 fun211 테스트 + 이 인수인계)를 함께 통합하고, 최신 main 기준 targeted tests·열차 Preview/승인·정식 gate를 진행한다. **Edge Function/서버 설정 변경·별도 배포 대상 없음**. 버전/cache는 배포 열차에서 한 번 증가.
- 이번 요청의 커밋 금지 지시를 지켜 자동 commit/push/PR/merge/배포 없음. 작업 종료 HEAD는 시작과 같은 3d5446ccefcd8216a1a70334d49d09cc903e1dfe. artifacts/sidebar-mini와 기존 qa-210 산출물은 보존, 타 담당 파일·CURRENT/DECISIONS 추가 수정 없음.
- Notion 요약 저장/read-back 갱신 대기: 2026-10-14 KST / 도연 / 라운지 재미 추가 211 / branch hani/lounge-natural-211 / base 3d5446c / main 8833943 / 잡담60·주제17·비율33.6%·한 줄48.2%, 위 targeted 검사 PASS와 native subprocess·실화면·최종 열차 gate 미검증, 미커밋·미배포·v209/cache 유지. 원문 링크는 이 branch의 docs/development-history/handoffs/2026-10-13-lounge-natural-211.md. **자동 승인 검토가 Notion update_page를 approval policy never로 거절**했으므로 허용 환경에서 저장 후 읽어 확인해야 한다. 저장/연결/운영 반영 완료로 기록하지 않는다.
