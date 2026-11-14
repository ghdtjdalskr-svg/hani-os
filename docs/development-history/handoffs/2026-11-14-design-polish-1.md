# 디자인 다듬기 1차 인수인계

## 작업 식별

- 작업 ID / 제목: design-polish-1 / 검토서의 쉬운 개선 10개
- 갱신 시각(KST): 2026-11-14
- 담당 도구 / 검토 담당: 도연 역할 Codex 단독 개발 / 서윤 Git·Edge 검증
- 상태: 구현·targeted test 완료, 서윤 검증·커밋 대기. Candidate Freeze/배포 완료 아님.
- 저장소 / branch / worktree: HANI OS / hani/design-polish-1 / design1
- base SHA: cb119351ff7b0a01b77fdc04d6f0b1ba0c2b54dc. HEAD·로컬 origin/main ref 파일 읽기로 일치 확인. Git 금지로 원격 최신성 새 조회 없음.
- 목표 / 완료 조건: CSS 중심 10개 표시 개선, exact inverse 바깥 시험 층, 지정 회귀 검사, 서윤용 before/after 화면 실행기.
- 수정 범위: hani-design-system.css 끝 블록, hani-main.js 월간 빈 제목 마크업 최소 변경, scripts 신규 시험·역변환 및 기존 preload 연결, 작업 증거·문서.
- 다른 담당과 겹치는 범위: 치비2의 main.js 독서·여행·퀴즈 및 study/street-journal 파일은 수정하지 않음. 월간보고 제목 1개 표시 줄만 수정.
- 사용자 승인 근거: ../design1-task.md의 성민 대표님 ‘진행해줘’. Git·Edge·버전 변경·merge·배포 승인 없음. 해당 작업은 서윤 담당.

## 결과와 증거

- Scoped Discovery: CODEMAP investment-research·yuna-intake·investment·monthly-report 확인. tasks·aura·board·drive·procrastination·helper 상세 앵커는 CODEMAP_MISS로 실제 DOM/CSS/기존 renderer로 fallback.
- canonical 경로: intake deskMarkup/bindStatic + adjustViewport; 투자 ensureResearch .ic-header/.ic-filter; renderMonthlyReport pending; renderAssets #assetStats; tasks 정적 grid; aura 기존 showroom; helper 기존 viewportBox/place(--helper-safe-bottom), body 자식 #haniHelperBot. 이벤트·renderer 추가 없음.
- Notion: 현황판 읽기 성공. 착수 insert_content는 자동 승인 검토에서 ‘MCP tool call requires approval, but approval policy is never’로 거절. 미반영 요약은 이 문서에 보존.
- 변경 파일·선택자: REPORT.md 항목별 표. runtime은 hani-design-system.css 끝1블록 + hani-main.js 월간 제목1곳. 신규 scripts source/preload/test/browser/fixture, 기존 THAW·release dispatcher 입구, 작업 문서/증거. 새 이벤트·renderer·timer·listener 없음.
- 시험 환경/결과: Node24.20.0·PowerShell. 79파일76성공/지정 기존실패3(nav-groups/qa-210/qa-report-fixes), Node test848 PASS/9 FAIL/2skip·별도 출력 스크립트5개 성공(history --unit-only 포함). office 비Git46파일610PASS/0FAIL/skip1, Git27파일 목록만. 신규6/6, JS syntax10/10·PS parser 성공. 기존 실패·단언·핀 미수정.
- 층/보존: design inverse→294 version/history→frozen THAW→293→치비1→292 이하. 정확한 입출력 전체SHA·유일한 조각·suffix·Buffer parity·드리프트 거부·sync/callback/promise/ESM 확인. raw closure171→168→164/누락0. 기존 fixture111개 불변, 기존 시험 JSON4개 원문 복원·신규4개 generated/로 이관.
- 데이터·저장/Cloud/schema 영향: 없음. Local/Session 저장·이벤트·타이머·insert/update/delete/upsert 호출 패턴 전후 동일. 보호 키/내부 버전 유지. 실제 운영 저장 시험은 미실행.
- 실행하지 않은 검사: Edge80PNG·1440/390 실제 UI·겹침0·넘침0·6 Finish×4계절 계산 대비·실기기 키보드/IME·Git27시험·Candidate/One-Pass/HINA·운영 read-back. browser 문법 확인만으로 실제 PASS를 선언하지 않음. 기존 navigation/scroll 설정 쓰기는 실행기가 별도 기록.
- 실행 예외: 최초 node --test worker spawn EPERM 후 직접 node 파일 실행. 기존 뉴스룸 시험 기본 Edge 시도1회도 spawn EPERM으로 차단; --node 재실행8/8 성공. 실제 Edge 프로세스/촬영 없음.
- 원문 증거: artifacts/design-polish-1/test-summary.json, test-plan.json(CSS grep 포함), test-logs/, preservation-audit.json, raw-safety.json, syntax.json.
- PR / Preview / candidate SHA: 없음(미커밋). Git·commit/push·merge·배포 미실행.
- main / Pages / 표시 버전 / JS / read-back: main/Pages/read-back 미실행. 로컬 HANI_DISPLAY_VERSION2.9.294·최신 UI 태그 hani-ui-v02992.js?v=2.9.294 유지, 마지막 script 태그 hani-launch-greeting.js. 실제 화면/Network 로딩은 미검증.

## 다음 담당에게

- 먼저 읽을 파일: artifacts/design-polish-1/REPORT.md 및 신규 browser 실행기.
- 다음 한 가지 행동: 서윤이 REPORT.md 명령으로 실제 Edge80장과 비겹침·넘침·대비·수동 입력 없는 렌더링 쓰기0를 확인. Git27시험·diff·커밋/push도 서윤 담당. 실제 UI 확인 전 Preview/운영 완료 선언 금지.
- 통합 주의: 치비2 배포 뒤 최신 main 결합 시 이 작업 전용 delta를 새 기준에 재고정하고 모든 층·관련 시험 재실행. 기존294/THAW/치비1 이하 fixture를 바꾸지 않음. 자동 merge/rebase 없음. 함께 배포할 서버 Edge Function·설정/순서: 없음.
- 남은 위험: CSS order는 시각 순서만 바꾸며 키보드 DOM 순서는 그대로. helper190px는 최대48px 안전 여백을 가정한 기하 검사이며 실제 단말 확인 필요. certificate·ledger 목표 수정·game의 공통 확대는 일반 스크롤 버튼 전체 비겹침을 작은 CSS로 보장할 수 없어 보류.
- blocker / 승인: 구현 blocker 없음. 서윤 실제 화면 검증과 성민 대표님 Preview/별도 배포 승인 대기. Notion은 환경 승인 정책으로 미반영.
- CURRENT / DECISIONS: 확인된 개발 결과만 CURRENT 위에 추가, 과거·타 담당 기록 보존. 새 승인 결정 없음.
- Notion 갱신 대기 요약: 2026-11-14 KST/도연 Codex/design-polish-1/cb11935, CSS+월간 제목10개 구현, 79파일76성공·기존실패3/office610 PASS, Git27·Edge80 PNG/24테마 대비 미검증, 서윤 커밋·통합 대기, 버전/저장/Cloud/배포 변경 없음. 원문은 이 인수인계와 REPORT.md. 실제 저장 후 읽기 확인 전 갱신 완료로 보고하지 않음.
