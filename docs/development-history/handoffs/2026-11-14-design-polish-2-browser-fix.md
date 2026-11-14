# 디자인 다듬기 2차 · 브라우저 실패 정리 (design2b)

## 작업 식별

- 작업 ID / 제목: design2b / 브라우저 194건 실패 정리
- 갱신 시각(KST): 2026-11-14
- 담당 도구 / 검토 담당: 도연 / Codex 개발, 서윤 Git·Edge 검증
- 상태: 검증 대기 (CSS·Node 완료, 서윤 실제 Edge 재검증 대기)
- 저장소 / branch / worktree: hani-os / 전달 hani/design-polish-2 / design2 (미커밋 상태 보존)
- base SHA / candidate SHA: 전달 7a91982de08a54452f6b9057f906d651f63a65ca / 미동결
- 목표 / 완료 조건: CSS 끝 2차 블록 보정, 시험 fixture/source 정합, 신규 Node·비Git 회귀 검증, 실제 Edge 재검증 명령 인계.
- 수정할 파일·범위: hani-design-system.css 끝 2차 블록, scripts/hani-design-polish-2 시험·fixture/source, artifacts/design-polish-2 및 이 인수인계. 다른 담당 파일 변경 없음.
- 사용자 승인 근거 / 승인되지 않은 경계: ../design2b-task.md 전체 UTF-8 정상 확인. Git·원격 조회·Edge·버전·저장·Cloud·main merge·배포 사용 금지/미승인. 원격 최신성·표시·runtime JS 새 조회는 담당 서윤에게 위임.

## 결과와 증거

- 착수: 실패 JSON 194건, PNG 원문 보존. 작업 폴더에 일부 CSS 보정과 첫 화면/report-only 시험 정책이 이미 존재하며 fixture/source는 불일치. 선행 변경을 유지하고 정합 작업을 진행.
- 착수 원문: artifacts/design-polish-2/design2b/start/ 및 start-hashes.json.
- Scoped Discovery: CODEMAP의 investment/sports owner 확인. dev·board·AI 상세·날짜/JISPI 세부 anchor는 CODEMAP_MISS로 기존 hani-main.js·hani-development-history-v1.js·hani-ui-v02992.js 및 CSS 실제 DOM/소유 경로를 좁혀 확인.
- 변경한 내용 / 파일: hani-design-system.css 끝 2차 블록의 불투명 표면·여백·조작부·game 줄바꿈·helper580/game620px 보정. 선행 dev summary44px !important 등 보존. scripts/hani-design-polish-2-source.cjs·fixtures/design-polish-2-delta.json pin 정합, 신규 시험2개 추가, browser에 첫 화면 저장 위치 없음 및 실제 token 기록 보강. 측정기·4.5·다른 기존 단언은 보존.
- 실행한 검증: 신규8/8 PASS, syntax4/4, browser --setup-only PASS(23화면·480대비 조합·브라우저 실행 없음). 비Git 회귀85파일 중84성공·889 PASS+script5·skip2. 포함 office46파일610 PASS/실패0. 실행 명령: node scripts/hani-design-polish-2.test.mjs; node scripts/hani-design-polish-2-regression.mjs --prepare-powershell; & artifacts/design-polish-2/run-regression.ps1; node scripts/hani-design-polish-2.browser.mjs --setup-only. 근거: artifacts/design-polish-2/design2b/test-results.json·test-summary.json·node-targeted.log·preservation-audit.json 및 test-logs/.
- 비성공: exam-popup-214 한 파일의 renderChibiNote 미정의. 이전 main296 재현과 동일하며 시험·runtime owner 원문도 main296과 동일. 기존 fixture를 임의 보정하지 않음. Git27/browser-only2는 서윤 위임, 지정 기존 실패13은 실행기 정책대로 제외.
- 보존: 독립 main296 exact inverse·변조 거부, 운영71파일 중 CSS만 변경, 2차 prefix 동일·기존 중첩 fixture114 동일, 기존 QA JSON172 원문 복원·최초 browser JSON(FAIL194) hash 동일. JSON 생성7개는 generated/ 보존/기존4복원. 새 저장·listener·timer·버전/cache 변경0.
- 실행하지 않은 검증 / 남은 위험: 실제 Edge·CSSOM·PNG·픽셀 대비·첫 화면 겹침은 서윤 재검증 대기.
- 데이터·저장소·Cloud·schema 영향: 운영 CSS만 수정, 기존 runtime JS·HTML·데이터 기준 버전·보호 key/write 경로 보존. write/schema 승인 대상 변경 N/A.
- PR / Preview / 배포: 미실행.
- main / Pages / 표시 버전 / 실제 JS 로딩 / 기능 read-back: 새 확인 미실행. 기존 표시/cache 2.9.296 유지.
- Notion: 기존 HANI-92 카드 fetch 확인. design2b 착수 insert_content 자동 승인 검토 거절: "MCP tool call requires approval, but approval policy is never". 다른 mutation 경로로 우회하지 않으며 최종 갱신 대기를 이 파일에 보존.

## 다음 담당에게

- 먼저 읽을 파일·관련 함수: ../design2b-task.md, artifacts/design-polish-2/REPORT.md, scripts/hani-design-polish-2.browser.mjs.
- 다음 한 가지 행동: 서윤이 node scripts/hani-design-polish-2.browser.mjs '<playwright/index.mjs>' '<msedge.exe>' --output-dir=artifacts/design-polish-2/browser-design2b 실행. 실제 픽셀 대비·첫 화면 scroll0/저장 위치 없음/입력·버튼 겹침0·dev44px·game 폭 확인. 원본 browser/는 덮어쓰지 않음.
- blocker / 필요한 사용자 결정: Edge·Git은 서윤 담당. 새 승인 요청 없음.
- 다른 작업에 영향을 주는 사항: helperoff 숨기기 스위치 작업은 이 범위 밖, 저장 위치·owner 동작 보존.
- CURRENT / DECISIONS 갱신 내용: 새 design2b 항목에 실제 검증 수와 Edge 대기를 기록. 공통 새 결정 없음. task의 첫 화면/report-only 변경 승인은 ../design2b-task.md 범위로 기록.
- Notion 갱신 대기 최종 내용: CSS/시험 정합·신규8/8·회귀84/85파일(889 PASS+script5/skip2, 기존 fixture 오류1)·office46/610 PASS·syntax4/4/setup PASS·보존 감사 PASS. 실제 Edge 미검증/서윤 대기, Git·merge·배포 없음. artifacts/design-polish-2/design2b/notion-update-pending.md 보존. 착수 mutation 자동 승인 거절 후 우회 재시도 없음.
