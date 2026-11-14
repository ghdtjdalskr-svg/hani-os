# tooling-295 · 295 배포 후속 시험 층

2026-11-14 KST · 도연/Codex · 전달 branch `hani/tooling-295`, base `396511a28ca227e1f77c9bcba96965af7d077478`. Git·원격 새 조회·Edge·운영 파일 수정·commit/push·배포 없음.

- 변경: `scripts/fixtures/release-version-layers.json`, `hani-release-version-layers.cjs`에 295 바깥 행/원본 reader/경계 reader 추가. `hani-chibi-pack-2-preload.cjs` 연결, chibi2 시험 2개와 release-294 시험의 입력만 연결, office-219의 동기 기준선 조회만 원본 reader로 연결. 신규 `scripts/hani-release-295.test.mjs` 4시험. 나머지는 실행기·증거와 작업 인수인계/CURRENT 기록이다.
- 층(바깥→안): **295 version/history → frozen 치비2 → 294 → THAW → 293 → 치비1 → 292 → 기존 이하**. index 60토큰·main 1토큰·연혁 exact edit 1개. study에는 295 버전 문자열이 없어 버전 행에서 제외하고 기존 치비2 inverse로 처리한다. 기존 fixture 111개·하위 manifest 바이트·기존 단언 본문/숫자/hash 보존.
- 검증: **대상 99파일 중 비Git 72파일 성공 / 828 PASS / 0 FAIL / 1 skip**, office 46파일 610PASS. history unit 명령 성공(위 숫자 미합산), quiz-v04 자체 acceptance 1건 포함. Git 필요 27파일은 [목록만](tooling295/GIT-TESTS.md). 외부 inverse preload 없이 파일별 기본 실행(프로세스 차단 guard만 적용). 최초 office-219 충돌은 보완 후 6PASS, 원래 실패 지정 시험은 미실행·미수정.
- 295 고정 객체 독립 대조·Buffer/역순/중복 inverse/변조 거절·공통 future-release 시험 PASS. closure **raw295 172 → 치비2 경계172 → main294 171 → main293 168 → frozen289 164, 누락0**. 운영 514파일이 고정396511a 원문과 일치. [파일별 결과](tooling295/TEST-RESULTS.md) · [보존 감사](tooling295/audit.json) · [JSON 원문 복원](tooling295/restoration.json).
- JS syntax 12/12·PowerShell parser 1/1 PASS. 실제 Edge/UI/PNG·Git은 미실행, 저장/Cloud/schema 변경 없음. 버전 증가·Candidate/build/One-Pass/HINA·main/Pages/Production 검증은 이번 도구 작업에서 N/A/미실행. 서버 함수·설정·배포 순서 추가 없음.

서윤 실행 명령:

```powershell
& ./artifacts/chibi-pack-2/tooling295-run.ps1
& ./artifacts/chibi-pack-2/tooling295-run.ps1 -GitOnly -AllowProcesses
git diff --check
node scripts/hani-chibi-pack-2.browser.mjs 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
```

Notion HANI-90 읽기는 성공했지만 착수 기록 추가가 자동 승인 검토의 `MCP tool call requires approval, but approval policy is never`로 거절되어 미반영이다. 갱신 대기 전달문과 상세 경계는 [인수인계](../../docs/development-history/handoffs/2026-11-14-tooling-295.md)에 보존했다. 서윤 Git/Edge 검증·검토/커밋 인계 상태이며 운영 반영 완료를 뜻하지 않는다.
