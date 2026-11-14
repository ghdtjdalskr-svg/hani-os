# 디자인 다듬기 2차 · 도연 / Codex

## 작업 식별

- 작업 ID / 제목: design-polish-2 / CSS 표시 개선 6항목
- 갱신 시각(KST): 2026-11-14
- 담당 도구 / 검토 담당: Codex 개발, 서윤 Git·Edge 검증
- 상태: 검증 대기 (개발·비Git targeted test 완료, 서윤 Git·Edge 대기)
- 저장소 / branch / worktree: hani-os / hani/design-polish-2 / design2
- base SHA / candidate SHA: 7a91982de08a54452f6b9057f906d651f63a65ca / 미동결
- 기준: HEAD·로컬 origin/main ref 및 고정 객체 읽기로 일치 확인. Git 명령·원격 최신성 조회는 사용자 금지에 따라 미실행. 표시·cache 2.9.296, 최신 UI hani-ui-v02992.js 유지.
- 목표 / 완료 조건: CSS 전용 개선, main296 exact inverse, 지정 비Git 시험, 서윤 실행 가능한 브라우저 검증·보고.
- 수정할 파일·범위: 운영 hani-design-system.css 끝 블록만. scripts 신규 시험/fixture와 필요한 input adapter, artifacts/design-polish-2 및 작업 기록. ch3의 hani-main.js·hani-street-journal.css는 수정하지 않음.
- 사용자 승인 근거: ../design2-task.md 전체 UTF-8 정상 확인. ‘다해도될것같아’ 표시 개선 한정. Git·Edge·버전·저장·Cloud·migration·배포는 범위 밖.

## 결과와 증거

- Scoped Discovery: dev-center/codemap.json의 travel/sports/investment/newsroom/study owner 우선 확인. 공통 배너·helper·aiWork·board·dev 세부 selector는 CODEMAP_MISS(개별 anchor 미등재)로 실제 canonical renderer와 CSS 확인.
- owner: 배너/helper hani-ui-v02992.js, 카드·통계·날짜 버튼 hani-main.js, board hani-board.css, dev hani-development-history-v1.js. 기존 동적 스타일 다음에 적용되는 #app 및 화면 한정 CSS로 보정.
- 사진 근거: ../audit1114-shots, ../design1114/REPORT.md, artifacts/design-polish-1/REPORT.md.
- 데이터·저장소·Cloud·schema 영향: 없음. runtime JS/HTML 원문 보존.
- 실행한 검증: 신규6/6 PASS, 최초 비Git87파일84성공(887 PASS + script5, skip2), office46파일610 PASS/0FAIL. 최종 CSS 관련19파일18성공(102 PASS + script4, skip1), 디자인1·296·version layers 재확인, JS syntax10/10 및 browser setup PASS. 정확한 명령·로그: artifacts/design-polish-2/test-results.json, affected-results.json, REPORT.md.
- 비성공: browser-only 2파일은 Playwright 부재로 시작 전 차단. exam-popup-214 renderChibiNote 미정의는 정확한 main296 CSS 입력으로도 재현. 시험·관련 runtime owner 원문 일치, 임의 단언/fixture 보정 없음. 최초 Node child spawn EPERM은 PowerShell 직접 실행으로 우회하여 실제 시험 수행(권한 상승 없음).
- 보존: runtime 루트71/closure172파일 중 CSS만 변경·누락0, 기존 중첩 fixture114개 및 원본 JSON172개 동일. 최초 생성JSON7개는 generated/에 보존하고 기존4개 원문 복원. CSS는 base prefix 전체 보존 + suffix만. 기존 시험 source4개는 input import/projection 연결만 변경; 단언·숫자·hash·기존 fixture 무변경.
- 미실행: Edge/PNG/CSSOM, 23화면 전후 1440/390·2 Finish, 24조합 픽셀 대비 및 완전 무겹침/가로 넘침0, Git27·commit/push·Preview·Candidate/HINA/아린·실기기·Production. 실제 시험은 서윤 담당.
- PR / Preview / 배포: 미실행. main·Pages·운영 read-back: 미확인.
- Notion: 착수 카드 생성 및 fetch read-back 확인. https://app.notion.com/p/418c5275707481ac8544ee401322e1b4 . 최종 update_properties는 ‘승인 필요 / approval policy never’ 자동 거절로 미반영. artifacts/design-polish-2/notion-update-pending.md에 최종 갱신 대기 원문 보존. 다른 mutation 경로로 재시도하지 않음.

## 다음 담당에게

- 먼저 읽을 파일: ../design2-task.md, artifacts/design-polish-2/REPORT.md
- 다음 한 가지 행동: 서윤이 REPORT.md의 browser 명령 실행, 도우미/가로 넘침/대비 결과 확인 및 CSS 여백 확정.
- blocker: Edge·Git은 서윤 담당. CSS token만으로 임의 스크롤/기존 임의 저장 위치의 모든 겹침을 보장할 수 없으므로 실제 화면 검증 필요.
- 다른 작업 영향: 치비3 변경은 이 worktree에 합치지 않음. 단언·기존 fixture 핀·version/cache 유지.
- CURRENT / DECISIONS: 확인한 개발/시험 결과와 서윤 검증 대기, Notion 최종 미반영을 CURRENT 위에 요약. 새 결정 없음.
- 임시 검증 원본 복사본: artifacts/design-polish-2/input-evidence/의 172개 JSON. 원본 일치 확인 후 정리하려던 recursive removal 명령이 정책상 거절되어 그대로 보존. Git 준비 시 commit에서 제외할 부산물이며 원본 복원·시험에는 영향 없음.
