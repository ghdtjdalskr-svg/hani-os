# tooling-311 · 2.9.311 출시 후 시험 층

- 도연 / Codex, 2026-11-23 KST. **구현·로컬 검증 완료, 서윤 인계.** 승인 원문: `../tool311-task.md`.
- 기준: `hani/tooling-311` / HEAD `9db2dc3` / 로컬 `origin/main c807bf1`(v2.9.311). 원격 조회는 연결 실패로 최신성 미검증. commit·push·merge/rebase·배포·Notion 미실행.
- 새 파일 5개: `scripts/hani-release-311-{source,preload,reviewed-input}.cjs`, `scripts/hani-release-311.test.mjs`, `scripts/fixtures/release-311-layer.json`.
- 기존 수정 2개: `scripts/hani-light-311-source.cjs` bootstrap 1줄, `scripts/hani-menu-badges-historical-input.cjs` outer 등록 7줄. **기존 시험 import 수정 0개. 기존 시험·fixture·hash·단언 변경 0개.**
- 실행 순서: **311 version/history → light-311 → 310 → attendance → 309 → 이하 기존 층**. 독립 Git blob과 정·역변환, 변조 거부, 파일 읽기 계약, helper/306 디렉터리 대조 확인. CODEMAP_MISS로 기존 owner와 REG를 직접 확인.

- 전체 **314개 파일 단독 실행: 성공 212 / 기존 실패 28 / 미검증 74**. TAP 부분 집계 1849 PASS / 59 FAIL / 9 skip이며 console 방식 시험도 별도 포함. 전체 PASS 아님.
- 명령: 파일마다 `node --test-reporter=tap scripts/<파일>.test.mjs`. 필요한 UI 29개는 Playwright·Edge 경로도 지정해 재실행. JS syntax 6개와 diff whitespace 검사 통과.
- **release-294~311 전부 통과**, 신규311 8/8·310 9/9·light311 8/8·helper 층 7/7·306 8/8. queen-v3 24/24·OCR224 14/14·office219 6/6·reviewed baseline 18/18.
- REG 78개 중 **72개 성공, 6개 Git/브라우저 미검증**. 잔여 실패 28개는 착수 입력 및 독립 출시 전 310 Git 코호트와 대조해 **동일 27개, M9-link 감소 1개(4→3), 새 실패 하위시험 0**. settings 계열 4개에서 드러난 rollback 오류도 310 코호트에서 재현. 수정 금지 context-remote 원문 보존·기존 실패 재현.
- 미검증: **Git EPERM 33개**(기존 queen URL fallback에 가려진 23개 포함), **브라우저·Node 실행 제약 41개**. 의존성 경로 누락은 보정 후 재실행했으며 실제 Edge/PNG는 미검증.
- OBR16/17/19 성능·배치 검사는 첫회 통과. icons·lively-v2의 Git 차단을 2회씩 재시도한 것은 러너의 성능 문구 판별 오인이며 성능 PASS로 집계하지 않음. 후속 러너는 실패 블록만 판별하도록 수정.

- 착수 tracked 2633개와 기존 artifacts 784개 대조: 허용 tooling 2개 외 변경 0. **운영·보호 경로·기존 시험/fixture·`.gitignore` 보존, 지정 JSON 5/5 원문 복원·hash 일치.** 저장·Cloud·schema 변경 0.
- 도구 전용: runtime 버전 증가·Build·Candidate/HINA·Preview·main/Pages·Production read-back N/A. 표시/cache v2.9.311과 마지막 정적 script `hani-attendance-board.js` 유지.
- 근거: [전체 결과](local/summary.json) · [미검증 목록](local/UNVERIFIED.md) · [기존 실패 대조](local/KNOWN-FAILURES.md) · [원문 보존](local/final-audit.json) · [파일 identity](local/final-identity.json). 상세 시도·복원 로그도 `local/`에 보존.

다음: 서윤이 코드 검토 및 Git/브라우저 미검증 실행 후 commit·push·Notion 처리. 동반 서버/Edge Function·설정 배포 없음. 큰 로그·원복 사본·임시 자료는 `artifacts/tooling-311/local/`에만 있으며 **local/ 전체 커밋 제외**.
