# design2c · 마지막 브라우저 실패 1건

## 작업 식별

- 작업 ID / 제목: design2c / AI 업무 역할 대비 측정 실패 원인 수정
- 갱신 시각(KST): 2026-11-14
- 담당 도구 / 검토 담당: 도연 / Codex 개발, 서윤 Git·Edge 재검증
- 상태: 검증 대기 (CSS·Node·비Git 회귀 완료, 서윤 실제 Edge 대기)
- 저장소 / branch / worktree: hani-os / 전달 hani/design-polish-2 / design2 (미커밋 보존)
- base SHA / candidate SHA: 전달 7a91982de08a54452f6b9057f906d651f63a65ca / 미동결
- 목표 / 완료 조건: 마지막 1건의 실제 DOM·CSS 원인 확인, 2차 CSS 최소 수정, exact inverse pin 정합, 신규 Node/setup/회귀 재확인, browser-design2c 명령 인계.
- 수정할 파일·범위 / 다른 담당과 겹치는 범위: hani-design-system.css 끝 2차 블록, scripts/fixtures/design-polish-2-delta.json, scripts/hani-design-polish-2-source.cjs, 작업 증거·보고서·인수인계. Git·Edge는 서윤 담당이며 사용하지 않음.
- 사용자 승인 근거 / 승인되지 않은 경계: ../design2c-task.md 전체 UTF-8 정상 확인. Git·Edge 금지, runtime JS·저장·Cloud·버전/cache·main merge·배포 변경 미승인/미실행. 원격 최신성 새 확인 없음.

## 결과와 증거

- Scoped Discovery: CODEMAP에 member-role/teamCard/aiWork 전용 anchor 없음(CODEMAP_MISS). 실제 index.html #aiWork → #developmentTeamList, hani-main.js teamCard/renderTeam/showView, hani-style-01.css .view.active/fadeUp, browser contrastRows를 확인.
- 원인: 시험 locator는 이미 첫 .member-role 하나. textRects는 document.body의 주변 글자를 샘플 제외 목적으로 수집하므로 여러 글자 사각형은 다른 대상 선택의 증거가 아님. #aiWork는 조상 체인의 유일한 SECTION. .view.active는 fadeUp 280ms(opacity 0→1/translateY 7px→0)를 실행하며 reduced-motion 예외가 없음. 시험은 reducedMotion reduce에서 화면 전환 100ms 후 측정하므로 effects SECTION과 움직이는 소수점 좌표가 일치함. 새 CSSOM/Edge로 직접 확인한 결과와 구분.
- 변경한 내용 / 파일: 2차 블록에서 reduced-motion의 #aiWork.view.active에 animation:none 한 규칙 추가. 기존 명시적 밝은/어두운 ink/surface 유지. delta/source pin 갱신. 측정 대상·측정기·clip·4.5·단언·기존 미커밋 변경 보존.
- 실행한 검증: node scripts/hani-design-polish-2.test.mjs 8/8 PASS, JS syntax 4/4 PASS, node scripts/hani-design-polish-2.browser.mjs --setup-only PASS(23화면·480대비 조합·브라우저 실행 없음). exact inverse로 독립 main296 복원 및 기존 fixture114/데이터·이벤트·버전 보존 PASS. node scripts/hani-design-polish-2-regression.mjs --prepare-powershell 후 & artifacts/design-polish-2/run-regression.ps1 실행: 85파일 중84성공·889 PASS+script5·skip2, 포함 office46파일610 PASS/실패0. 이전 design2b와 목록/exit/pass/fail/skip 동일, 새 회귀0. 기존 exam-popup-214 시작 오류 renderChibiNote is not defined 1파일만 비성공이며 수정하지 않음. Git27/browser-only2·지정기존실패13은 실행기 기존 정책 보존.
- 결과와 증거 위치: artifacts/design-polish-2/design2c/의 node-targeted.log, browser-setup.log, regression-console.log, test-results.json, test-summary.json, test-logs/, preservation-audit.json. node artifacts/design-polish-2/design2c/audit.cjs PASS: 소스771개 중 변경은 CSS·delta·source pin 3개뿐, 원본 브라우저 JSON2개·기존 시험/측정기·QA JSON172 보존. 기존 역할 대비48행 중47행 최저9.468062622526778:1/1행 애니메이션으로 미측정이며 새 PASS 근거로 사용하지 않음.
- 실행하지 않은 검증 / 남은 위험: 실제 Edge·새 PNG·24 Finish×계절 픽셀 대비는 서윤 재검증 대기.
- 데이터·저장소·Cloud·schema 영향: CSS-only runtime 변경, 해당 write/schema 변경 N/A.
- PR / Preview / 배포: 미실행.
- main / Pages / 표시 버전 / 실제 JS 로딩 / 기능 read-back: 새 확인 미실행, 기존 표시/cache 2.9.296 유지.
- Notion: 기존 HANI-92 카드·Markdown 규격 fetch 성공. design2c 착수 insert_content 자동 승인 거절: MCP tool call requires approval, but approval policy is never. 우회 재시도 없이 갱신 대기 보존.

## 다음 담당에게

- 먼저 읽을 파일·관련 함수: ../design2c-task.md, REPORT.md 마지막 design2c 절, contrastRows, hani-style-01.css:27.
- 다음 한 가지 행동: 서윤이 node scripts/hani-design-polish-2.browser.mjs '<playwright/index.mjs>' '<msedge.exe>' --output-dir=artifacts/design-polish-2/browser-design2c 실행. 마지막 1건 및 전체 픽셀/화면 결과 확인, Git 기준선·탑승 준비는 서윤 담당. 원래 browser/·browser-design2b/ 증거 덮어쓰기 없음.
- blocker / 필요한 사용자 결정: Edge·Git은 담당 분리, 추가 승인 요청 없음.
- 다른 작업에 영향을 주는 사항: runtime JS/DOM/이벤트 및 기존 미커밋 변경 보존.
- CURRENT / DECISIONS 갱신 내용: design2c 원인·CSS1규칙·8/8·85파일/889PASS·새회귀0·Edge 대기를 CURRENT 맨 위에 추가. 공통 새 결정 없음.
- Notion 갱신 대기: design2c 원인/최종 변경/검증/미검증/명령과 저장소 원문 링크를 이 기록과 REPORT.md 기준으로 반영할 것. 별도 원문 artifacts/design-polish-2/design2c/notion-update-pending.md. 자동 승인 거절 후 우회 재시도 없음.
