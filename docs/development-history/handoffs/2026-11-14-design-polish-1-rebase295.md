# design295 · 디자인 다듬기 1차 295 재정비

## 작업 식별

- 갱신 시각(KST): 2026-11-14 / 담당: 도연 역할 Codex 단독, 후속 Git·Edge: 서윤.
- 상태: 구현·지정 Node 회귀·보존 감사 완료, 서윤 Git index 처리·실제 Edge 검증 대기. branch `hani/design-polish-1`, worktree `design1`. Candidate/운영 반영 완료 아님.
- base SHA: `dfe81946aab6147c829ed0ee0a1c9f239c364d03`(#508 tooling-295), 착수 HEAD `b3bb874412005ed10ac3ce52eae36015b4083c91`. 로컬 origin/main 일치, 원격 새 조회 없음.
- 목표: 충돌 3개를 295 기준으로 정리하고 디자인 inverse를 가장 바깥에 연결, 기존 단언·숫자·hash 및 운영 디자인 2곳 보존.
- 범위: CURRENT·release-version-layers·theme-thaw-source 충돌, 디자인/치비2 시험 입력 연결, THAW baseline 입력 import, 새 295 디자인 fixture·검증·실행기·보고서.
- 승인 근거: `../design295-task.md` 전체 UTF-8 정상 확인. 이전 design1b/design1c 지시는 종료. Git·Edge·버전/cache 증가·commit/push·merge·배포 금지.
- CODEMAP_MISS: codemap에 디자인 inverse·295 시험 층 앵커 없음. 지정 owner 및 관련 source/preload/test로 fallback.

## 결과와 증거

- 변경: 충돌3파일의 본문 표시 제거(295 기준·양쪽 기록 보존), 디자인1→295 version/history→치비2→294→THAW→293→치비1→292 이하 연결. 기존 design294 fixture/pin 보존·frozen 입력 adapter, 별도 design295 fixture/inverse/실제 원문 시험4건 추가. 새 module 호출은 디자인 owner2개에 한정해 순환 참조 차단. THAW의 baseline은 정확한 디자인295 입력일 때 고정 dfe8194를 사용하고, 그 밖에는 기존 ancestor helper로 위임한다. 기존 시험은 디자인 import 추가/THAW baseline import 교체만이며 단언·숫자·hash 본문 동일.
- 검증: `& ./artifacts/design-polish-1/rebase295-run.ps1` 후 수정 영향 실패만 `-RetryFailed`로 재검증. 최종 비Git73파일 **824 PASS / 0 FAIL / 1 skip**, office46파일610PASS. history --unit-only·quiz-v04 CLI wrapper 각각1건 포함. JS syntax14/14·PS parser1/1·browser setup 독립295원문 대조 PASS, closure172→172→171→168→164/누락0. 초기8파일 실패(순환 참조7·THAW ancestor294 비교1)는 보정 후 모두 PASS. 초기 집계 JSON도 별도 보존했다. PowerShell5 재실행기의 JSON 배열 처리 문제로 통과 항목까지 재선택된 실행은 중지하고 실패8파일만 다시 선택해 최종 집계했다.
- 보존: 착수 원문 해시 `artifacts/design-polish-1/rebase295-start.json`, 최종 source 해시 `rebase295-input-hashes.json`. 이번 운영 수정0, 지정 운영510파일은 main295와 기존 디자인2곳만 다름. 기존fixture113개/하위 manifest·hash·기존 단언 불변, 범위 밖 파일 변경0. JSON7개 증거 이관·기존4개를 착수 해시와 일치하는 원문으로 복원. 감사 `rebase295-audit.json`/`rebase295-restoration.json`.
- 실행하지 않은 검증: Git 필요27파일 목록만, 실제 Edge/새PNG/실화면/픽셀 대비·원격 최신성 재조회·Production 미검증. 기존 실패 지정22종 미실행·미수정. 실제 24조합 화면 대비·helper/Drive read-back은 서윤 재실행 필요. 서버 Edge Function·설정·배포 순서 추가 없음.
- 저장/Cloud/schema·운영 데이터 변경 없음. 버전·캐시2.9.295 유지. Candidate/build/One-Pass/HINA 미실행·이번 시험 층 작업의 버전 증가 N/A.
- PR/Preview 없음. 표시/cache2.9.295, index의 마지막 UI JS `hani-ui-v02992.js`(정적 확인), 실제 운영 로딩 미검증.

## 다음 담당에게

- 먼저 읽을 파일: `artifacts/design-polish-1/REBASE-295.md`, `REBASE-295-TESTS.md`, `REBASE-295-GIT-TESTS.md`.
- 다음 행동: 서윤이 보고서 명령으로 Git27/실제Edge 검증, 충돌3파일 검토 후 git add로 index 처리, 변경 파일·증거 검토 후 커밋. Codex는 Git·index·HEAD·ref·commit/push·merge 작업 미실행.
- Notion: 공통 현황판 읽기 성공. 착수 insert_content는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 갱신 대기 전달문: 「2026-11-14 KST · design295 · 도연/Codex · hani/design-polish-1, 기준 dfe8194(#508). 충돌3파일 본문 해결·디자인1→295→치비2→294→THAW 연결. 비Git73파일824PASS/0FAIL/skip1·office46파일610PASS, JS14/14·운영 추가수정0·기존fixture113/단언 보존. Git27/실제Edge/merge index 처리 서윤 대기, commit/push·버전/cache 증가·main merge·Pages·Production 미실행. 원문 artifacts/design-polish-1/REBASE-295.md 및 본 인수인계.」 현황판/개발 카드에 추가하고 read-back 필요. 이번 권한으로 갱신 완료를 선언하지 않는다.
- CURRENT: 양쪽 과거 기록을 보존하고 이번 검증 결과·서윤 인계만 추가. 기존 손상 문구는 추정 복원하지 않음. DECISIONS 변경 없음.
