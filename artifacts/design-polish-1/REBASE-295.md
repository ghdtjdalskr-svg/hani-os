# design295 · 디자인 다듬기 1차 295 재정비

2026-11-14 KST · 도연/Codex 단독 · `hani/design-polish-1` / base `dfe81946aab6147c829ed0ee0a1c9f239c364d03`(#508 tooling-295). 착수 HEAD `b3bb874412005ed10ac3ce52eae36015b4083c91`. 로컬 origin/main 일치, 원격 새 조회 없음. Git·Edge·commit/push·merge·배포 미실행.

- 충돌 3개: CURRENT는 295 기록을 앞에 두고 양쪽 과거 기록 보존(기존 손상 문구도 추정 복구하지 않음). release-version-layers는 main의 295→치비2→294 경로를 유지하고 디자인 inverse를 먼저 적용. theme-thaw-source는 main의 치비2 preload 경로 유지. 파일 내 충돌 표시 0, Git index 충돌 해소 처리는 서윤 담당.
- 층(바깥→안): **디자인1 → 295 version/history → frozen 치비2 → 294 → THAW → 293 → 치비1 → 292 → 기존 이하**. 새 main295 디자인 fixture만 추가, 기존 294 디자인 fixture와 모든 하위 pin 유지. 새 inverse가 실제 디스크의 디자인 변경을 제거하면 고정 main `dfe8194` 원문과 정확히 일치한다. 모듈/fixture 읽기는 디자인 소유 2파일 필터로 제외해 순환 참조를 방지한다.
- 기존 디자인 294 시험은 exact 경계 입력만 제공하고 시험 본문·단언·숫자·hash를 그대로 보존했다. THAW 시험은 merge 미완료로 공통 조상이 294인 상태를 고려해, 정확한 디자인295 바이트일 때만 고정 main295 객체를 baseline 입력으로 선택한다(단언은 동일). 새 295 시험은 실제 디스크·독립 객체·Buffer·변조/중복/재적용 거절·각 층/closure **172→172→171→168→164, 누락0**을 확인한다. 브라우저 before도 main295 원문으로 맞추고 새 증거는 `browser-rebase295`에 저장하도록 준비했다.
- 검증: **비Git 73파일 / 824 PASS / 0 FAIL / 1 skip**, 그중 **office 46파일 / 610 PASS**. history `--unit-only`와 quiz-v04 CLI를 각각 wrapper 1건으로 포함했다. [파일별 결과](REBASE-295-TESTS.md) · [최종 집계](rebase295-summary.json). 기본 실행에 외부 inverse preload 없이 프로세스 차단 guard만 적용, 각 파일 독립 프로세스. JS syntax **14/14**, PowerShell parser **1/1**, 브라우저 실행기 **setup만 PASS**. 실제 Edge·화면·대비 픽셀·새 PNG는 미실행. Git 필요 **27파일은 [목록만](REBASE-295-GIT-TESTS.md)**, 원래 실패 지정 시험은 미수정·미실행.
- 보존: 이번 작업 중 운영 수정 0. 요청 범위 운영 **510파일**은 main과 기존 CSS 끝 블록·월간 빈 h4 두 곳만 다름. 착수 시 기존 fixture **113개 불변**, 변경한 기존 시험 2개는 입력 import 외 본문·단언 바이트 동일. 시험 JSON **7개 증거 이관, 그중 기존4개 착수 원문 복원**. [보존 감사](rebase295-audit.json) · [복원 증거](rebase295-restoration.json) · [최종 코드 해시](rebase295-input-hashes.json). 표시/cache **2.9.295**, 보호 저장·Cloud·schema 변경 없음. 버전 증가·Candidate/build/One-Pass/HINA·Production read-back 미실행.

서윤 실행 명령(대표님이 직접 수행할 작업 아님):

```powershell
& ./artifacts/design-polish-1/rebase295-run.ps1
& ./artifacts/design-polish-1/rebase295-run.ps1 -GitOnly -AllowProcesses
git diff --check
git status --short
git add -- docs/development-history/CURRENT.md scripts/hani-release-version-layers.cjs scripts/hani-theme-thaw-source.cjs
node scripts/hani-design-polish-1.browser.mjs '<Playwright index.mjs 절대 경로>' 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
```

Git add는 서윤이 충돌 내용 검토 후 실행한다. 브라우저 명령은 서윤 환경의 Playwright 경로를 사용한다. 새 실행 뒤 생성되는 타 작업 JSON도 작업 폴더로 이관·착수 원문 보존이 필요하다. [상세 인수인계](../../docs/development-history/handoffs/2026-11-14-design-polish-1-rebase295.md).

Notion 현황판 읽기는 성공했으나 insert_content가 자동 승인 검토의 `MCP tool call requires approval, but approval policy is never`로 거절돼 미반영이다. 현황판/개발 카드 갱신 및 read-back 대기 내용을 인수인계에 보존했다.
