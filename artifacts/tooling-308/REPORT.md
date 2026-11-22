# tooling-308 · 서윤 인계

- 2026-11-22 KST · 도연(Codex) 단독 · **구현·요청 검증 실행 완료 / 미검증 인계**.
- branch `hani/tooling-308`, 착수 HEAD `967ee0a8fc75c45a9025b4306ae356827511b124`, 로컬 origin/main·308 출시 `ee6e617c1b3fb88ba85ee8f19df776613c559d6f`. 원격 조회는 네트워크 연결 실패로 최신성 미확인.
- 승인: UTF-8로 전체 읽은 `../tooling308-task.md`. 308 시험 입력 층·tooling307/공사 시험 층·기존 시험 import 1줄만 허용. 운영·보호 경로·기존 fixture/hash/단언 변경 금지, 저장·Cloud 0. commit·push·배포·Notion은 서윤 담당으로 실행 금지.
- CODEMAP_MISS: release308 시험 입력 층 항목 없음. 기존307·공사 source/preload와 reviewed-input owner를 직접 확인.
- 구현: **308 version/history → building-v2data → Phase2 → Phase1/office-motion →307 →menu-badges →306 이하**. 신규308 source/preload/reviewed-input/test/fixture 5파일. 353개 현재 owner와 하위 fixture가 일치할 때만 과거 merge-base를 제공하며 실제 refs·Git 객체는 보존.
- 연결: 307 source 앞 Phase1 require, v2data source 앞308 require, Phase2 source 앞 v2data require. 과거 helper/306 시험의 디렉터리는 hash가 일치하는 새308·공사 파일만 제외하며 변경·미지 파일은 숨기지 않음.
- Phase1 보정: 306 역변환은 canonical306 층에 맡김. 새 공사 fixture의305 bootstrap 행만 helper 연결이 포함된 실제 병합 경계로 수정(전후 SHA/byte 4필드); 대응 fixture pin·Phase1 시험의 입력 capture/Git ref 갱신. 나머지 공사 단언·fixture 행 보존.
- 203b: 동결된 renderer header의 LF→CRLF exact inverse와 전체 메뉴 inverse를 기준 입력 양쪽에 적용. 운영 파일·저장 코드 수정 없이 정적 시험 PASS.
- 기존 시험에 **이번 추가 import 0줄**. 전달본의 menu preload 1줄씩인 `hani-helper-bubble-layer`, `hani-release-306`, `hani-ui-polish-1`, `hani-proactive-204` 및 Phase2 preload 1줄인 `hani-ieum-seat`는 원문 유지. 새 공사 시험 `hani-building-phase1`만 위 경계 보정.
- 핵심 검증: **294~308 릴리스 전부, 신규308 8/8, Phase1 10/10·Phase2·motion polish2, queen24/24, 메뉴층8/8·호환5/5, helper층7/7·ieum 이력2/2·reviewed baseline·OCR·office219 PASS**. 변경 JS syntax10/10·diff check PASS. raw static closure174/누락0 및 각 capture를 독립 Git 원문과 대조.
- 전체 명령: `& artifacts/tooling-308/local/run.ps1 -Label final` → `scripts/*.test.mjs` **302개 전부 단독 실행, 성공201 / 실패·미검증101**. Git EPERM33·그 밖의 프로세스/브라우저 미검증39·남은 단언/fixture 실패29. [파일별 실패·미검증 목록](UNVERIFIED.md), [전체 집계](local/summary.json). `hani-context-remote.test.mjs`도 실행하되 원문 보존.
- 초기149개 직접 대조: 실패31개 해소, 파일/개별 단언 새 실패0. 나머지153개는 변경 전 전체 대조를 하지 않아 전 범위 새 회귀0으로 단정하지 않음. 환경이 다른 서윤의158/301 결과와 직접 증감 비교하지 않음.
- 성능: 카페 계획 **최초+재시도2회 모두 기존 `Math.min(...samples)<400` 단언 PASS**. 400ms를 넘는 개별 표본은 그대로 기록했고 단언/한도 수정0. 파일 전체의 Git 대조 실패는 유지. `node scripts/hani-ui-203b-ui.test.mjs --static` exit0(실제 브라우저 미실행). [추가 검증](local/extra-checks.json).
- 보존: 착수2569파일 hash 대조에서 허용된 기존 시험 층7파일 외 변경0·누락0. 기존 시험300/301 본문과 fixture138/139 원문 보존(예외는 승인된 새 Phase1 경계 보정뿐). 운영·보호 경로·버전/cache308·저장·Cloud·schema 변경0. [보존 근거](local/preservation.json).
- 지정 JSON5(OBR16/17/19 layout, drama reachability, m9 closure)는 모두 착수 원문 hash로 복원. 생성 결과는 `local/generated/` 보존. 큰 로그/원본/집계는 `local/` 한 곳에 두고 `.gitignore` 제외 확인.
- 다음: 서윤이 실패·미검증 목록의 Git/브라우저 검사를 가능한 환경에서 재실행하고 후속 Git/Notion 처리. commit·push·main 병합·배포·Notion 실행0. CURRENT/DECISIONS 갱신 없음(작업 지시 범위).
- 운영 코드/배포 파일 변경이 없어 버전 증가·Runtime Build·Candidate/One-Pass/HINA·Preview/Pages/Production read-back은 N/A(미실행). 구현 완료와 운영 배포 완료를 구분함.
