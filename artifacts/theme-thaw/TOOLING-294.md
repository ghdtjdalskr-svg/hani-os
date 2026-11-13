# tooling-294 · 2.9.294 배포 후속 시험 층

2026-11-14 KST · 도연/Codex · `hani/tooling-294` · base/착수 HEAD/로컬 origin/main `846e8d2dbda63be75822f9b56c1d85e6bf5c8b6d`(객체 읽기만, 원격 새 조회 없음). 운영 파일·Git 명령·Edge·commit/push·merge·배포 작업 없음.

- 변경: `scripts/fixtures/release-version-layers.json` 맨 앞에 294 행, `scripts/hani-release-version-layers.cjs` 순서·294 projection, `scripts/hani-theme-thaw-source.cjs` 외부 버전 연결, `scripts/hani-theme-thaw-source.test.mjs` 입력 adapter, 신규 `scripts/hani-release-294.test.mjs` 2시험. 실행기 `tooling294.cjs`/`tooling294-run.ps1`·증거·이 보고서와 전용 인수인계/CURRENT를 추가·갱신했다.
- 바깥→안: **294 version/history → frozen THAW → 293 version → 치비1 → 292 version/office → 291 contrast → 290/이음 → 289 이하**. index 60토큰·main 1토큰을 정확히 되돌린다. 기존 THAW metadata가 이미 294 연혁과 293 commit/subject 보완을 함께 포함하므로, 그 exact edit를 새 294 history 행에서 한 번만 되돌린다. 기존 THAW restore·fixture는 그대로이며 연혁은 곧바로 기존 293 pin으로 연결된다.
- 기존 fixture 110개·293 이하 manifest 바이트·THAW strict restore와 기존 단언 본문·다른 기존 시험 모두 보존. 독립 846e8d2 객체·Buffer parity·잘못된 순서/드리프트/중복 inverse 거부·현재 feature 경계·future release 합성을 검증한다. preload가 Node 모듈을 읽을 때 순환 참조하지 않도록 버전 owner 3경로만 dispatcher에 진입한다.
- 시험 결과: **대상 99파일 중 비Git 72파일 전부 성공, 829 PASS / 0 FAIL / 1 skip**. office 73파일 중 비Git 46파일은 610 PASS / 0 FAIL / 1 skip이며 나머지 27파일은 Git 필요 목록만 남겼다. history `--unit-only`도 성공(단언 수 미출력으로 829에 미합산). skip은 zoom 실제 브라우저 CSS 시험이다. 원래 실패로 지정한 시험은 수정하지 않았으며 study-news-material은 제외했다. Node syntax 5/5·PowerShell parser 1/1 성공, 가드 차단0. 초기 preload 순환 참조 실패4파일은 수정 후 파일별 재실행으로 모두 성공했다.
- Closure **raw171 → main293 168 → frozen289 164 / 누락0**. 운영 루트 JS/CSS/index/JSON 72파일이 846e8d2와 일치하며 착수 스냅샷 대비 운영 파일 변경0. 저장/Cloud/schema/게이트 영향 없음. 버전 증가·실제 UI·Candidate/One-Pass/HINA·운영 확인은 N/A 또는 미실행(시험 도구 전용, Git/Edge는 서윤 담당).
- **후속 정리 후보:** 루트 `hani-theme-collections.json`은 현재 closure에서 읽지 않는다. 이번 작업에서는 삭제·수정하지 않았다. 삭제는 성민 대표님 확인 후 별도 작업.

서윤 실행 명령(비Git 검사는 외부 inverse preload 없이 각 파일별 실행):

```powershell
./artifacts/theme-thaw/tooling294-run.ps1
git diff --check
$e = Get-Content -Raw -Encoding UTF8 artifacts/theme-thaw/tooling294-evidence.json | ConvertFrom-Json
$e.gitRequired | ForEach-Object { node --test "scripts/$_" }
node artifacts/theme-thaw/browser.mjs "<playwright/index.mjs 절대경로>" "<msedge.exe 절대경로>"
```

Git 27파일·전체 명령/결과/개별 로그: [tooling294-evidence.json](tooling294-evidence.json). 보존 감사: [tooling294-audit.json](tooling294-audit.json), [운영 원문 비교](tooling294-runtime.json). 시험 생성 JSON 7개는 `tooling294-generated/`에 보존하고 기존 JSON 4개를 원문 복원, 신규 3개는 원래 경로에서 이관했다. 실제 Edge 화면은 미검증이며 서버 Edge Function·설정 변경/배포 순서 추가 없음. 서윤 검토·Git/Edge 확인·커밋 인계 상태이고 PR/main 병합·운영 반영 완료가 아니다.

Notion 현황판은 읽었지만 기록 추가가 자동 승인 검토의 `approval policy: never`로 거절되어 미반영이다. 갱신 대기는 [전용 인수인계](../../docs/development-history/handoffs/2026-11-14-tooling-294.md)에 보존한다.
