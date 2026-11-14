# 도우미 숨김 기억 · helperoff

## 작업 식별

- 갱신 시각(KST): 2026-11-14, 담당 도연 / Codex 단독 개발.
- 상태: 구현·지정 비Git 검증 완료 / 서윤 Git·Edge 검증 대기. push 전으로 탑승 완료 아님.
- branch / worktree: `hani/helper-toggle` / `helperoff` (HEAD 파일 읽기 확인, Git 실행 없음).
- base/착수 HEAD/로컬 origin/main: `7a91982de08a54452f6b9057f906d651f63a65ca` / 2.9.296. refs·고정 객체 읽기만 수행, 원격 새 조회는 Git 금지로 하지 않음. 로컬 index 표시 버전과 마지막 UI script `./hani-ui-v02992.js?v=2.9.296` 유지. 현재 LIVE 실제 화면/JS는 미확인.
- 목표: 도우미 숨기기, 설정에서 다시 켜기, 기기별 숨김 상태 기억.
- 범위: `hani-ui-v02992.js`, `hani-style-08.css`, 신규 시험·exact inverse·보고서. `hani-main.js`, `hani-street-journal.css`, `hani-design-system.css` 다른 담당 범위 보존.
- 승인 근거: `../helperoff-task.md`의 11/14 대표님 승인. `hani_helper_hidden_v1` 하나의 읽기/쓰기만 추가. 보호 데이터·위치 키·Cloud 쓰기 변경 금지.
- CODEMAP_MISS: codemap에는 도우미 owner/anchor 없음. 실제 `// BEGIN HANI HELPER BOT` 내 init/update/place/기존 click 위임과 settings `#group-display` 확인.

## 결과와 증거

- 착수 원문: `artifacts/helper-toggle/baseline.json`. 지정 6개 owner가 고정 base 객체 원문과 같은지 읽기 전용 검증.
- 구현: 기존 place의 user-hidden 조건, 기존 click 위임, 화면·연결 설정의 persistent card와 44px 스위치. 잡담 mount 이후 home 맨 아래에 숨기기 버튼 생성.
- 신규 시험: 8/8 PASS. 기본 켜짐, 숨김/복원·새로고침, 손상/없는 값·읽기/쓰기 실패, 위치/당번/노드 보존, 기존 gate·이벤트 경로·저장/Cloud 경계 확인.
- 감사: 운영510파일 중 owner JS/CSS 두 파일만 변경, raw closure172→172/누락0. 전체 기존 시험312개 중 두 파일은 input import 한 줄만 변경. 기존 단언·숫자·hash·전체 fixture114개·위치 read/write 함수 원문을 고정 main296 객체와 대조하여 보존 확인. 루트JSON2개 보존, 시험 부산물은 artifacts/helper-toggle/local/generated에만 저장.
- 기존 실패: helper25PASS/4FAIL/skip1, fun3PASS/2FAIL/skip1. 고정 main296 객체 직접 읽기 실행과 토글 exact inverse의 모든 subtest 상태·집계가 같음. 기존 기능과 단언 미수정. 근거: artifacts/helper-toggle/baseline-failures.json.
- 지정 회귀95파일 중 비Git66파일: 769PASS / 기준선 동일6FAIL / skip3 / 새 회귀0. 64파일 성공·helper/fun 두 파일 기존 실패 유지. office46파일 610PASS/0FAIL/skip1, 신규8/8. Git 필요27파일은 artifacts/helper-toggle/GIT-TESTS.md 목록만, 지정 기존 실패 settings2파일 실행·수정 없음. 전체 스크립트는 기존6FAIL로 exit1이며 summarize.cjs의 독립 기준선 대조는 exit0.
- JS 문법10/10·PowerShell parser1/1·browser raw serving/setup PASS. 최종 숨기기 위치 수정 후 신규8 및 helper/fun 입력 경로만 재실행; 다른 legacy 입력은 exact inverse 결과가 같은 main296 원문임을 확인하여 불필요한 전체 재실행 없음. 최초 실패 로그는 local/initial-failures에 보존.
- 증거: artifacts/helper-toggle/REPORT.md, summary.json, audit.json, baseline-failures.json, syntax.json, browser-setup.json, local/test-logs. owner 해시는 audit.json에 기록.
- 미검증: 실제 Edge/PNG, Git 필요 시험, 원격 최신성, commit/push, Preview, 배포/운영 read-back. 서윤 담당.
- 버전/cache: 2.9.296 유지. main 병합·배포 없음.
- Notion: 착수 페이지 생성 및 fetch read-back 완료. `https://app.notion.com/p/418c52757074818bb28ad26939c9cb84`.
- Notion 후속 갱신 대기: insert_content 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 구현·신규8PASS·기존6실패 대조·회귀 최종 집계·서윤 다음 행동을 해당 페이지에 반영해야 함. 거절 후 재시도하지 않음.

## 다음 담당에게

- 우선 파일: `artifacts/helper-toggle/REPORT.md`, 신규 단위·브라우저 실행기.
- 다음 행동: 서윤이 REPORT.md의 실제 Edge 명령(역변환 preload 없이)을 실행하고 PNG10장·browser-results.json의 쓰기 키/크기·화면을 확인. GIT-TESTS.md의 27파일 검증·Git diff/commit/push 후 기능 탑승 준비.
- blocker/미검증: 실제 Edge·기기 줌·키보드 조작·Preview, 원격 최신성, Git27파일, commit/push, Candidate/HINA·main/Pages/운영 read-back 미실행. 기존 helper4·fun2 실패는 고정 main 원문과 동일하며 임의 수정 금지.
- 서버 Edge Function/설정 동반 배포·배포 순서 의존성: 없음. 표시/cache2.9.296·내부 버전·보호 키·Cloud schema/쓰기 유지, migration 없음.
- CURRENT / DECISIONS: CURRENT에 확인된 구현/검증/미검증 요약만 추가. 신규 의사결정 없음, 승인 근거는 작업 파일 원문 유지.

## helperoff2 ?? ? 2026-11-14 KST

- ??: ?? / Codex. hani/helper-toggle / base 7a91982de08a54452f6b9057f906d651f63a65ca(?? ?? ??, ? Git ?? ??).
- ?? ??: ../helperoff2-task.md ?? UTF-8 ?? ??. CSS touch target ?? + ?? delta/source exact inverse ?? + ?? ?? ???????. Git?Edge ??, ??? ???? ?? ??? ?? ??/2? ?? ??.
- ??: hani-style-08.css? ? ???, scripts/fixtures/helper-toggle-delta.json, scripts/hani-helper-toggle-source.cjs, ? ?? ???????????. LIGHT CSS ??, ??/Cloud/???cache ?? ??. CODEMAP_MISS? ?? ??? ??.
- ??: ?? min-height cascade ?? ? main296 exact inverse ??? ?? ? ?? ?? ?? + run.ps1 + summarize(? ??0) ? ?? Edge ??? ??.
- Notion ?? insert_content? ?? ?? ??? approval policy is never? ???? ???. ????? ?? ? ?? ?? ?? ??.
