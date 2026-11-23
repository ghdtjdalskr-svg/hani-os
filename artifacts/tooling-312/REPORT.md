# tooling-312 · 2.9.312 출시 후 시험 층

- 도연 / Codex · 2026-11-23 KST. **시험 층 구현·요청 검증 완료, 서윤 인계.** 지시: `../tool312-task.md` UTF-8 전문(한글 정상).
- 기준: `hani/tooling-312` / HEAD `a2ecbbf` / 로컬 `origin/main b1acf02`(v2.9.312). 원격 연결 실패로 최신성 미확인. commit·push·merge/rebase·배포·Notion 실행 없음.
- 신규 5개: `scripts/hani-release-312-{source,preload,reviewed-input}.cjs`, `scripts/hani-release-312.test.mjs`, `scripts/fixtures/release-312-layer.json`.
- 기존 수정 2개: `hani-procrast-312-source.cjs` bootstrap 1줄, `hani-menu-badges-historical-input.cjs` outer 등록 7줄. **기존 시험 import 추가 목록: 없음(0개). 기존 시험 317개·fixture 147개·hash·단언 원문 보존.**
- 연결: **312 version/history → procrast-312 → 311 → light-311 → 310 → attendance → 309 → 기존 층**. CODEMAP_MISS 후 기존 시험 owner를 직접 확인. 실제 Git 객체·refs를 보존하고, 독립 HEAD owner 1,106개·정확한 입력/출력 해시·첫 부모 계보로 제한.
- **318개 파일 전부 단독 실행: 성공216 / 기존 실패28 / 미검증74. 전체 PASS 아님.** 명령: 파일별 `node --test-reporter=tap scripts/<파일>.test.mjs`. 브라우저29개는 설치된 Playwright·Edge 경로로 추가 실행. 부분 TAP 집계1878 PASS /59 FAIL /9 skip.
- **release294~312 전부 통과.** 신규312 9/9·311 8/8·310 9/9·procrast312 8/8·light311 8/8·helper7/7·306 8/8·queen24/24·OCR14/14·office219 6/6·reviewed baseline18/18. brand/login/ieum-seat/dark 층도 통과. syntax6/6·diff whitespace 통과.
- 착수174개 실행과 잔여 실패의 읽기 전용 원본 재현·독립 출시 전311 Git 트리(`1868d10`) 대조: **남은28개 오류/단언 일치, 새 회귀0.** 단순 착수 입력의 버전 오류가 가린 settings rollback·helper closure·M9 package 실패도 독립311 입력에서 재현. [대조 근거](local/comparison.json)·[기존 실패 목록](local/FAILURES.md).
- 미검증 **Git EPERM33개**(기존 fallback의 URL 오류로 가려진23개 포함)·브라우저 EPERM39개·Node 자식 실행 EPERM2개. [74개 목록](local/UNVERIFIED.md). 실제 Edge/PNG·화면 검증 미실행.
- 병렬 카페 cold400ms 초과1건은 **독립2회 재시도 모두 성능 기준 통과**(각 회 최소값272.4~305.3ms). 전체 파일의 Git 읽기는 미검증 유지. lively-v2 cold/warm 및 OBR16/17/19 배치는 첫회 통과. [성능 근거](local/performance-review.json).
- runtime closure **183/누락0**. 운영·보호 경로·`.gitignore`·context-remote·저장·Cloud·schema 변경0. 표시/cache v2.9.312 유지. runtime Build·버전 증가·Candidate/HINA·Preview·Production read-back N/A.
- 기존2658개 파일 감사(본 작업 handoff 제외): 허용 tooling2개 외 변경0·누락0. **지정 JSON5/5 원문 복원·SHA 일치**, 생성 출력은 `local/` 이관. [전체 결과](local/summary.json)·[원문 감사](local/final-audit.json)·[JSON 복원](local/final-restoration.json)·[identity](local/final-identity.json).

다음: 서윤이 코드 검토·Git/브라우저/Node 미검증 실행 및 commit·push·Notion 처리. 동반 서버/Edge Function·설정 배포 없음. **`local/` 전체 commit 제외.**
