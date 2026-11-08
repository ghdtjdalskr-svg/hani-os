# 미룬 일 — 구현 완료 · 검증 일부 차단

- **담당** Codex / 2026-11-08 KST / `hani/procrastination-board` / base·착수 원격 main `2bc93683182728877a6b8e543badb330a3312756`.
- 업무 그룹에 **미룬 일 메뉴 1개**, 카드 7개. KST 경과일·삐짐 0~4·직원별 대사·기존 입력 화면 이동. 오늘 입력/퀴즈 완료 시 0단계와 “드디어! 고마워요♡”. 기록 없음은 기간·단계 미확인. 퀴즈는 남은 문제지와 오늘 완료를 함께 표시.
- 기존 `state`를 `showView`/`renderAll`에서 전달하고 persistent card를 갱신. 새 저장 키·저장/Cloud 호출·timer/listener **0**. 보호 키·내부 기준 버전·기존 write owner 보존. 기존 치비 2종·썸네일 3종만 CSS로 기울기/회색/반전/웅크림 표현, 새 그림 0. 표시·기존 cache **2.9.280 유지**, push/merge/PR/배포 없음.

## 항목과 담당 근거

`hani-organization-hub.js:24–28`의 역할, `docs/drafts/character-bible-v1.md` §10·11·13·14·15의 말투를 따름. 마지막 입력일은 실제 필드만 사용하며 수치·원문을 로그에 남기지 않음.

|항목 → 기존 경로|읽는 기록·날짜|담당 / 근거|
|---|---|---|
|걸음 → exercise|exercise의 양수 steps / date|나은 · 건강·루틴|
|체중 → diet|body의 양수 weight / date|나은 · 건강·루틴|
|퀴즈 → study|learningQuizzes의 pending/in_progress / scheduledDate·date, completedAt|히나 · 학습·최종 리뷰|
|자산 → investmentIntake|확정 actual/positions broker snapshot / updatedAt·createdAt·snapshotDate|지은 · 재무·자산|
|가계부 → ledger|items가 있는 ledgerMonths / updatedAt·importedAt·createdAt|지은 · 예산·현금흐름|
|위시 정리 → wishlist|이름 있는 wishlistItems / updatedAt·createdAt|하루 · 소비·구매 검토|
|한 줄 일기 → diary|내용 있는 diaries / date|민지 · 문화·기록|

수면은 독립 입력 배열이 없고 목표/마일스톤은 “점검 완료일” 근거가 없어 제외. 자산·가계부·위시는 최근 수정일을 대리 지표로 사용하며 별도 완료 상태를 저장하지 않음. 걸음 0은 기존 정본의 미입력 구분 불가 정책에 따라 제외. 일별 경계 1/7/14/30일, 위시 7/14/30/60일, 월별 31/45/60/90일. 기간은 마지막 기록 이후 경과일이며 실제 마감일 판정이 아님.

## 검증 / 남은 일

- **PASS — 격리 V8**: 공유 케이스 **191 assertion**(항목별 단계 경계·KST·빈/깨진/미래 데이터·입력 후 복귀·합성 DOM의 카드 보존/클릭·부작용 0). 기존 홈 퀴즈 시험의 원래 assertion **11개**를 함수 harness에서 통과. 실제 브라우저 DOM/Node 실행 결과와 구별함.
- **PASS — syntax/보존**: 전체 main 1,150,531자와 새 JS V8 파싱. 추가분 exact inverse 후 index/main은 착수 원문과 일치, 기존 UI owner 불변. 기존 시험 assertion 수정·삭제·완화 없음. preload `scripts/hani-procrastination-inverse.mjs`는 시험 입력의 정확한 추가분만 메모리에서 제거함.
- **PASS — 정적 closure mirror**: **161→168(+7), 한도 200, 누락 0**. 새 JS/CSS 2개 + 기존 그림 5개 포함. 공식 Node closure 시험·release build 결과는 아님. [근거](runtime-closure.json), [실행 결과](validation.json).
- **BLOCKED — Node 회귀**: 전용·nav-groups·navlogin·design-system·dashboard-period·qa-1st·sidebar 시험 실행 모두 `node.exe Access is denied`. [시도 로그](native-attempts.txt). 권한이 회복되면 전용 시험 후 기존 시험을 exact inverse preload로 재실행.
- **BLOCKED — Edge PC/폰**: 브라우저 host unavailable; headless Edge GPU 프로세스 fatal(-1073741790), **PNG 없음·UI/UX 미검증**. 단계 0~4 합성 [컴포넌트 미리보기](preview.html), `scripts/hani-procrastination-board.browser.mjs` 준비. 전체 앱 로그인/실제 이동 read-back도 미검증. 다음 담당은 Edge **1280×900·390** PNG를 이 폴더에 생성하고 화면 확인. 임시 profile 삭제는 자동 실행 정책 거절로 잔존하며 `.gitignore`로 제외.
- **BLOCKED — 로컬 commit**: Git 실행 접근 거부로 **미커밋**([근거](git-attempt.txt)). `.git` 직접 변경/권한 우회 안 함. 착수 원문 baseline 폴더와 Edge profile은 stage 금지. Notion 읽기는 성공, 갱신은 자동 승인 `never` 거절로 대기. [인수인계](../../docs/development-history/handoffs/2026-11-08-procrastination.md).
- 다음: 실행환경 복구 → 위 Node/Edge 검증 → UI 확인 → 보고서 포함 로컬 커밋. push·merge·버전 변경은 계속 금지. runtime Candidate/운영 QA/배포 완료 선언 없음.
