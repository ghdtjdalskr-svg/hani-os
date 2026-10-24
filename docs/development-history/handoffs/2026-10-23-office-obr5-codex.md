# obr5 출발 준비 인수인계

## 작업 식별
- 2026-10-23 KST / 도연(Codex), 배포·브라우저 서윤.
- 상태: 구현·지정 검증 완료 / 로컬 Git 쓰기 차단 / 서윤 Preview·출발 판단 대기. 사용자 obr5 명세 승인 범위: 승인 oracle 갱신·회귀·seed 최소 기대값·VM 호환성·로컬 커밋만.
- A worktree obr / hani/release-train-20261023 / base fe7ac5e5db07bc5cd06058658cd8b84b07918089.
- B worktree seed233 / hani/seed-233-office-data / base 7a10595f2a0890e63cd04dbc95c057edbbd3d5b0. 데이터3 staged 보존.
- 범위: A scripts/hani-reviewed-release-baseline* 및 frozen fixture·보고서. B 데이터3 byte 불변, 실패 기대값 최소 수정·보고서.
- 기존 A tracked behavior-browser.json 수정과 untracked artifacts는 보존한다.
- origin/main 로컬 7a10595. git ls-remote는 프록시 연결 실패였으나 GitHub 연결 도구 main 조회로 7a10595f2a0890e63cd04dbc95c057edbbd3d5b0 일치 확인. 자동 merge/rebase 없음.
- CODEMAP living-office owner 확인, 승인 baseline/seed 관련 anchor는 CODEMAP_MISS로 owner·테스트 검색 fallback.
- push/PR/Notion/브라우저 금지. 버전/cache/storage/Cloud/schema 변경 금지. Notion은 명시 금지로 미반영.

## 결과와 증거
- A: approved232·trainBase232 등록, join pending 은퇴, runtime3파일 exact pending fixture. oracle8 PASS, 전체120개/117 PASS/0 FAIL/3 browser SKIP(161.90초). 감사54,000 snapshot의 frozen/mismatch/stuckSeconds/near30/near24 전부0.
- B: runtime·데이터3 불변, 테스트9개+엄격한 seed 기대값 helper1개만 보수. 최종99개/96 PASS/0 FAIL/3 browser SKIP(209.01초). 실제232 metadata loader+DOM+mascot VM PASS, 예정행0·신규2명 스케줄0·기존17명·write0. 장애 fallback 2F overflow2는 보고서에 별도 기록.
- native Git export78/78 객체 ID 동일, sandbox Node Git spawn EPERM에는 읽기 전용 preload 공급. 직접 Git/실제 browser 통합 성공과 구분.
- A/B 모두 git add가 worktree index.lock Permission denied. 신규 commit 없음, B 기존 데이터3 staged 유지. 권한 우회 없음.
- 로컬 index/main 2.9.232 및 마지막 script hani-launch-greeting.js 확인. 실제 운영 로딩 미검증.
- main/Pages/Production read-back 미실행. 배포 완료 아님.

## 다음 담당에게
- 최종 결과는 artifacts/office-behavior/report-obr5.md 및 seed233/artifacts/office-behavior/report-seed233.md로 인계.
- CURRENT/DECISIONS 타 담당 기록 보존. A tooling은233 배포 이후, seed는 서윤 판단 후 선행 PR.
