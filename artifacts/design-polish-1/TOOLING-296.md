# tooling-296 · 296 배포 후속 시험 층

2026-11-14 KST · 도연/Codex 단독 · 전달 branch `hani/tooling-296` / 고정 base `56c3105391cec207d9c55a4a3bbf76906749a0a4` (#509). Git·원격 새 조회·Edge·commit/push·merge·배포 미실행.

- 변경 파일: `scripts/fixtures/release-version-layers.json`, `hani-release-version-layers.cjs`, 새 `hani-release-296-source.cjs / .test.mjs`, `hani-release-295-input.cjs` 및 295 시험 import, 디자인1의 source/preload/baseline/browser/main295-input 및 main295 시험 import. 모두 scripts 안의 시험 층이며, artifacts의 tooling296 도우미·증거와 docs 인수인계·CURRENT만 추가/갱신. [정확한 파일 목록·보존 감사](tooling296-audit.json).
- 층(바깥→안): **296 version/history → frozen 디자인1(main295) → 295 version/history → frozen 치비2 → 294 → THAW → 293 → 치비1 → 292 → 기존 이하**. index 버전60개·main 버전1개·연혁296 추가 및295 source metadata를 exact inverse로 복원. 기존 frozen fixture113개(디자인295/294 포함) 및 기존 하위 manifest 원문·단언·숫자·hash 보존. 기존 시험2개는 input import만 바뀜.
- 검증: **비Git 76파일 / 848 PASS / 0 FAIL / 1 skip**, 그중 **office 46파일 / 610 PASS**. 신규296 **5/5**, history unit·quiz-v04 CLI는 각각 wrapper1건으로 집계. [파일별 결과](TOOLING-296-TESTS.md) · [집계](tooling296-summary.json). 원래 실패는 미수정·미실행, Git 필요 **27파일은 [목록만](TOOLING-296-GIT-TESTS.md)**.
- 운영510파일은 고정296 객체 원문과 일치·작업 중 변경0, closure **172→172→172→172→171→168→164 / 누락0**. JS syntax11/11·도우미 syntax9/9·PowerShell parser1/1·[browser setup만 PASS](tooling296-browser-setup.json). 실제 Edge·화면·PNG·픽셀 대비·Git 검사·Production read-back은 서윤 확인 대기. 저장·Cloud·schema·표시/cache 변경0, runtime 버전 증가는 N/A(시험/문서 전용).
- PNG·로그·생성 QA JSON·착수 snapshot은 **`tooling296-local/` 한 폴더**에 모음(커밋 제외). output routing으로 root JSON과 타 작업 QA 원문 보존. 배포 후보/build/One-Pass/HINA 미실행.

서윤 실행 명령(대표님이 직접 실행할 작업 아님):

```powershell
& ./artifacts/design-polish-1/tooling296-run.ps1
& ./artifacts/design-polish-1/tooling296-run.ps1 -GitOnly -AllowProcesses
node artifacts/design-polish-1/tooling296-audit.cjs
node artifacts/design-polish-1/tooling296-browser-setup.cjs
git diff --check
git status --short
node scripts/hani-design-polish-1.browser.mjs '<Playwright index.mjs 절대 경로>' 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
```

실제 브라우저 증거는 `tooling296-local/browser/`에 저장한다. 위 Git·Edge 명령은 목록으로만 남겼으며 Codex가 실행하지 않았다. [상세 인수인계](../../docs/development-history/handoffs/2026-11-14-tooling-296.md) · [Notion 작업 카드](https://app.notion.com/p/418c52757074818982d3ebda8ff571db) (착수 저장·읽기만 성공. 최종 갱신은 자동 승인 never 거절로 미반영·인수인계에 갱신 대기 내용 보존).
