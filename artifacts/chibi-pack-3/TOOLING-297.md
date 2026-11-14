# tooling-297 · 297 배포 후속 시험 층

2026-11-14 KST · 도연/Codex 단독 · 전달 branch `hani/tooling-297` / 고정 base `bc3b22c8fdaab3bd786980a5e0ca61e28ee3acde` (#512). Git·원격 새 조회·Edge·commit/push·merge·배포 미실행.

- 변경: `scripts/fixtures/release-version-layers.json`에297 행 추가, `hani-release-version-layers.cjs` raw reader/297 경계/pre296 합성. 새 `hani-release-297-source.cjs`, `hani-release-297-preload.cjs`, `hani-release-297.test.mjs`, `hani-release-296-input.cjs`. 기존 치비3 source에는 input preload1줄,296 시험에는 input import만 변경. artifacts의 `tooling297-*` 도우미·증거, 본 보고·시험/Git 목록, docs 인수인계·CURRENT. 기존 REPORT는 이동한 비교 PNG 링크만 수정.
- 층(바깥→안): **297 version/history → frozen 치비3 → 296 → frozen 디자인1 → 295 → 치비2 → 294 → THAW → 293 → 치비1 → 292 → 기존 이하**. index 버전60개·main 버전1개 및297 연혁 추가/296 source metadata를 exact inverse로 복원. 기존 fixture114개·하위 manifest 원문·기존 시험314개 단언/숫자/hash 보존.
- 검증 완료: **비Git81파일 / 868 PASS / 0 FAIL / 1 SKIP**, office46파일610 PASS·치비3 12 PASS·신규297 6/6. [파일별 결과](TOOLING-297-TESTS.md) · [집계](tooling297-summary.json). closure **173→173→172→172→172→172→171→168→164 / 누락0**. Git 필요27파일은 [목록만](TOOLING-297-GIT-TESTS.md), 지정 기존 실패는 미실행·미수정. 외부 inverse preload 없이 각 파일 독립 실행, 추가 입력 수정·단언 완화·재시도 없음.
- [회귀 후 보존 감사](tooling297-audit.json): 운영·데이터·root JSON **511파일 불변**, 기존 시험313개 바이트 동일·296 시험 import만 변경. [JS syntax15/15·PowerShell parser1/1](tooling297-syntax.json)·[browser setup5장면만 PASS](tooling297-browser-setup.json). SKIP1은 office zoom 실제 브라우저 CSS 검사. 실제 Edge/PNG10/화면/Preview·브라우저 전용4파일·Git·Production read-back 미검증. 저장·Cloud·schema·표시/cache297 변경0, 버전 증가 N/A(시험/문서 전용).
- PNG·로그·생성 QA JSON·착수 snapshot은 **`tooling297-local/` 한 폴더**(커밋 제외). 기존 compare.png도 hash 보존 이관. 서윤 브라우저 도우미는 기존 browser 시험 단언을 그대로 실행하며 PNG·프로필·stderr도 이 폴더 아래에 저장. Candidate/Build/One-Pass/HINA 미실행.

서윤 실행 명령(대표님 직접 실행 불필요):

```powershell
& ./artifacts/chibi-pack-3/tooling297-run.ps1
node artifacts/chibi-pack-3/tooling297-summarize.cjs
& ./artifacts/chibi-pack-3/tooling297-run.ps1 -GitOnly -AllowProcesses
node artifacts/chibi-pack-3/tooling297-audit.cjs
node artifacts/chibi-pack-3/tooling297-browser-setup.cjs
node artifacts/chibi-pack-3/tooling297-browser.cjs 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' *> ./artifacts/chibi-pack-3/tooling297-local/browser-launch.log
git diff --check
git status --short
```

위 Git·Edge 명령은 준비만 했으며 Codex가 실행하지 않았습니다. [인수인계](../../docs/development-history/handoffs/2026-11-14-tooling-297.md). Notion 착수 기록 추가는 자동 승인 검토가 `approval policy is never`를 이유로 거절하여 미반영; 최종 요약은 인수인계에 갱신 대기로 보존합니다.
