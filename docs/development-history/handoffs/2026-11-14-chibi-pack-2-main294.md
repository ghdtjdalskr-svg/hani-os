# 치비 2탄 · main cb11935 재정비

## 작업 식별

- 갱신: 2026-11-14 KST / 도연 · Codex / 파일 충돌 해결·targeted 검증 완료, 서윤 Git·Edge 검증 대기.
- 저장소 ch2 / branch hani/chibi-pack-2 (사용자 지정) / 착수 HEAD ab5204afa4f0f0d8ef949f63980fcb559b9a3ea9.
- 기준 main·로컬 origin/main ref cb119351ff7b0a01b77fdc04d6f0b1ba0c2b54dc (#505, 2.9.294 + tooling-294). 기존 read-only 객체 helper로 확인, Git 명령·원격 새 조회 없음. merge 진행 중이라는 사용자 전달 상태이며 index 처리는 하지 않음. Candidate 없음.
- 승인 근거: 성민 대표님이 ../ch2b-task.md 전체 UTF-8 읽기와 모든 지시 수행을 요청. 두 충돌 해결, 치비2 전용 fixture 재고정, 시험 연결·지정 targeted test·브라우저 실행기 점검·보고서 추가 범위.
- 수정 범위: scripts/hani-chibi-pack-1-source.cjs, docs/development-history/CURRENT.md 충돌; scripts/fixtures/chibi-pack-2-delta.json 및 치비2 pin·필요한 test adapter; artifacts/chibi-pack-2 작업 증거. 운영 기능·버전·기존 fixture/단언/숫자/hash 보존.
- Git·Edge·commit/push·merge 완료·배포는 수행하지 않으며 서윤 담당. 저장/write·Cloud·schema·migration 승인 없음, 변경 금지.

## 결과와 증거

- 착수 파일 2,085개 SHA256 및 기존 JSON 원문을 tmp/chibi-pack-2/main294에 보존. 종료 시 런타임·기존fixture111개·기존시험 원문 보존 및 범위 밖 기존 파일 변경/삭제0을 대조 확인.
- 충돌: chibi-pack-1-source에서 치비2 preload와 THAW 연결 모두 유지, CURRENT는 main 쪽 추가분 전체를 먼저 두고 치비2 기존 기록 전체 보존. 전체 검색에서 충돌 표시0. Git index의 unmerged 상태 처리는 하지 않았으므로 merge 완료 보고가 아님.
- 치비2 전용 fixture base·main before/after·전용 source fixture pin만 cb11935 기준 재고정, 편집 내용은 불변. THAW source에 외부 preload1줄 추가. 기존 fixture·숫자·hash·단언은 변경 없음. 기존 main adapter 3개는 치비2 preload1줄을 제거하면 cb11935 원문과 정확히 동일.
- 순서: 치비2 inverse → 294 version/history → THAW → 293 → 치비1 → 292 version/office → 291 → 290/이음 → 289 이하. 신규 층 시험2PASS, raw172→171→168→164/누락0. 새 저장/write·Cloud·스키마·migration·운영 변경0.
- 시험: 최초97파일 목록 중 비Git70파일822PASS·0FAIL·skip1, 추가 층1파일2PASS를 합쳐 **98파일 중 비Git71파일824PASS·0FAIL·skip1 / Git27파일 미실행 목록**. office73 중 비Git46파일610PASS·skip1, 치비2 9PASS·치비1 19PASS·THAW/294/version30PASS·study/quiz84PASS. history unit-only 명령 성공, TAP 개수 없는 자체 검증은 별도. 기존 실패22종 미실행·미수정.
- 증거: artifacts/chibi-pack-2/TEST-RESULTS-main294.md, main294/final-results.json·logs·audit.json·GIT-TESTS.md·restoration.json. 착수2,085파일 대조·기존시험287개 바이트 보존. 시험 생성JSON4개는 새 결과를 이관하고 착수 원문으로 복원, 착수 때 없던 출력JSON3개도 이번 증거 폴더로 이동. syntax9개·runtime JS2개 VM 컴파일·PowerShell 실행기 syntax PASS. runner 로그는 UTF-8로 보존.
- 브라우저: scripts/hani-chibi-pack-2.browser.mjs 원문 유지·syntax 및 실제 setup을 현재 study owner VM에서 검사(정답5/5·오답4/5·문제/해설 유지). 6상태×1440/390 실제 Edge·12PNG는 미실행, UI/이벤트 결과는 미검증. 다른 browser 실행기와 quiz-quality-210-ui도 Edge 금지로 미실행.
- Notion HANI-90 카드 읽기 성공. 착수 insert_content는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절하여 미반영. 갱신 대기 전달문: 2026-11-14 도연/Codex가 cb11935 기준 두 충돌·치비2 바깥층을 정리하고 지정 비Git 시험 수행, 실제 Git/Edge는 서윤에게 인계. 원문은 REPORT.md의 main cb11935 재정비 절과 이 파일.
- main 병합 / Pages / LIVE 표시 버전 / 최신 JS 실제 로딩 / Production 기능 read-back: 이번 범위 밖, 미검증. 소스 표시 2.9.294 유지.

## 다음 담당에게

- 먼저 읽기: artifacts/chibi-pack-2/REPORT.md의 main cb11935 재정비 절.
- 다음 행동: 서윤이 실제 Git 검사·merge index 처리 및 Edge 브라우저 실행기 검증. 명령은 REPORT의 main cb11935 재정비 절. 비Git 실행기 rebase294-run.ps1, Git27파일은 같은 실행기에 -GitOnly -AllowProcesses, Edge는 node scripts/hani-chibi-pack-2.browser.mjs와 실행 파일 경로.
- blocker: Git·Edge는 작업 지시로 미실행, Notion 기록은 자동 승인 never 거절.
- CURRENT는 main 쪽 추가분 먼저·그 뒤 치비2 후속 결과 및 기존 기록을 보존. DECISIONS 변경 없음. 별도 서버 함수/설정·배포 순서 의존성 없음. Candidate/build/One-Pass/HINA/Pages/Production은 이번 범위 밖.
- Notion 갱신 대기 최종 전달문: 2026-11-14 / 도연 Codex / HANI-90·hani/chibi-pack-2·HEAD ab5204a·base cb11935 / 충돌2·치비2→294→THAW 이하 층 정리 완료 / 비Git71파일824PASS·0FAIL·skip1, Git27파일 목록, office610PASS / 기존fixture111·운영·버전294·저장/Cloud 보존 / 실제 Edge·Git index 처리·commit/push·merge·배포 미실행 / 다음 서윤 Git27파일·1440/390 12PNG 실행 / 원문 REPORT의 main cb11935 재정비 절. Notion 실제 카드가 갱신된 것은 아님.
