# tooling-309 · 서윤 인계

- 2026-11-22 KST · 도연(Codex) 단독 · **구현·지정 검사 완료 / 실패·미검증 인계**.
- branch `hani/tooling-309` · 착수 HEAD `9da69df17548b8f4bb432272fd597fc42ef32aeb` · 로컬 origin/main `c367660a969163ea05c1176ffb8b1d4b96242543`. 원격 최신성 조회는 네트워크 연결 실패로 미확인.
- 승인: `../tooling309-task.md` UTF-8 전체 정상 확인. 시험 층만 수정하며 Git commit·push·배포·Notion은 서윤 담당. CODEMAP_MISS로 기존308·budget-view owner를 직접 확인.
- 신규5개: `scripts/hani-release-309-{source,preload,reviewed-input}.cjs`, `scripts/hani-release-309.test.mjs`, `scripts/fixtures/release-309-layer.json`. 기존 수정3개: `hani-ai-budget-view-source.cjs`, `hani-ai-budget-view-reviewed-input.cjs`, `hani-menu-badges-historical-input.cjs`(모두 scripts/). 기존 시험 import 추가 **0줄**.
- 연결: **309 version/history → ai-budget-view →308 →building-v2data →Phase2 →Phase1 →307 이하**. 정확한 원격 ref·395개 owner·309 변경4개를 검사. 308 HEAD 비교는 해당 시험에서만 authored308 기준을 사용하고, 203b는 기준 입력 양쪽에 exact inverse 적용. 실제 Git refs·객체 변경0.
- 핵심 PASS: **294~309 전부, 309 7/7·308 8/8·budget-view 7/7·helper층7/7·queen24/24**, reviewed-release-baseline·brand-heroes·login-a·OCR·office219·ieum-seat-history·dark-bundle. 최종 보완 후 budget-view/helper 재검사도 PASS.
- 전체: `& artifacts/tooling-309/local/run.ps1 -Label final -TimeoutSeconds 180` → **306개 전부 단독 실행, exit0 205개 / 실패·미검증101개 / skip10**. 후속은 `local/after-all.ps1`. Git EPERM 포함10파일·브라우저/프로세스/입력56파일·나머지 단언/fixture35파일이며 혼합 원인은 원문 확인 필요. [집계](local/summary.json) · [미검증 목록](UNVERIFIED.md). 실제 브라우저는 미검증.
- 대조: 착수26파일의 실패24개 해소·성공→실패0. 나머지35개 실패 파일도 착수 원본에서 모두 실패. 잔여101개 파일 목록은 기존308과 동일. 단, settings QA guard는 착수 원본보다 실패 항목1개 증가(`train version cannot roll back`; 기존308에도 기록된 원인). 변경 전 전체 시험 실행 대조는 미수행이며 전 범위 새 회귀0을 주장하지 않음. [항목별 차이](local/other-comparison.json).
- 성능: 카페 최초 재실 best **416.1ms FAIL**, 재시도2회 **316.3/309.4ms PASS**. 일일 계획은 최초+2회 모두 기존400ms·warm3ms 기준 PASS. 두 파일의 Git 원문 대조는 기존 URL cwd fallback 오류로 미검증. [전체 표본](local/performance.json).
- 보리 산책: 최초180초 제한 후600초 제한으로 재실행, **214.19초 완료·13PASS/1 Git EPERM 미검증**. 시간 초과 해소, Git 실패는 PASS 처리하지 않음.
- 추가: syntax7/7·203b `--static`·`git diff --check` PASS. raw runtime closure174/누락0 및 각 capture를 독립 Git 원문과 대조. [추가 검사](local/extra-checks.json).
- 보존: 착수 **2587파일**에서 허용된 tooling3개 외 변경0·누락0. 기존 시험305개·fixture141개·단언/hash·보호 경로·`.gitignore` 보존. 지정 JSON5개 모두 착수 hash 복원, 생성 출력21개는 `local/generated/` 보존. [보존 증거](local/preservation.json).
- 운영 코드·저장·Cloud·schema 변경0, 소스 표시/cache309 유지. 개발도구 전용으로 버전 증가·Runtime Build·Candidate/One-Pass/HINA·Preview/Pages/Production read-back N/A(미실행).
- 다음: 서윤이 미검증 목록·settings 차이를 검토하고 Git/브라우저 가능한 환경에서 재검사 후 Git·Notion 처리. **commit·push·main 병합·배포·Notion 실행0**. 큰 자료·원본·로그는 `local/`만 사용하며 서윤이 commit 대상에서 제외. CURRENT/DECISIONS는 유지.
