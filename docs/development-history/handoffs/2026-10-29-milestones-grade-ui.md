# 마일스톤 등급 카드·히어로 v3

## 작업 식별

- 갱신 날짜(KST): 2026-10-29 / 담당: 도연(Codex), 단일 개발 Agent.
- 상태: 구현·targeted 검증 완료, Preview 확인 대기. 미커밋·미push·PR 없음.
- 저장소 / branch / worktree: ghdtjdalskr-svg/hani-os / hani/milestones-grade-ui / ms-grade.
- base·시작/종료 HEAD·로컬 origin/main: d31a0a2d512512529c5c41d359cacc4c100b506c (2.9.233).
- 원격 최신성: git ls-remote origin refs/heads/main 실행은 github.com:443 연결 실패. 로컬 추적 SHA만 확인했으며 merge/rebase 없음.
- 승인: MISSION-ms-grade-ui.tmp.md 전체 및 최종 v3 추가 요청. 구현·테스트·인수인계까지. 버전/cache 증가·push·PR·main 병합·배포는 금지.
- 수정 범위: hani-milestones.js, hani-design-system.css, hani-ui-v02992.js, index.html, 기존 milestones-v1 테스트, 신규 grade-ui Node/browser 테스트.
- 동시 작업 경계: assets/heroes 전체 읽기만 수행. 다른 작업에서 a2가 생성된 뒤 기존 메타의 상수 경로만 a2로 연결. 기존 untracked 미션·시안·qa-1st 등 타 작업 파일 보존.

## 결과와 증거

- 최종 v3: Legendary/ Epic/ Rare/ Record 색상 배너, 흰 세리프 등급·설명·importance·날짜, 작게 보조하는 승인 SVG 문양. 카드 세로 띠 제거. Legendary radial 광택·hairline 안쪽 테두리·그림자.
- 4칸 등급 범례/필터: 등급색 왼쪽 띠·은은한 배경·설명·분야별 개수·선택 밑줄. 분야와 등급 AND, 정렬 유지. 같은 등급을 다시 누르면 전체. aria-pressed 및 키보드 기본 button 동작. 기존 delegated click path 하나를 확장하고 필터는 메모리에만 유지.
- 지표: featuredMetrics[0]만 대표 강조, 나머지 featured만 hairline 표. before 또는 change가 없으면 대표 지표는 after만 표시하며 접근성 이름도 동일. 단위·변화량 생성/저장 없음. 인용·기존 직원 avatar·상세 이동 유지.
- 히어로: 기존 mainCharacterSidebarMenuConfig의 milestones 메타에서 MILESTONES_HERO_IMAGE 상수 사용. 최종 ./assets/heroes/milestones-226w-a2.webp. 크림 fade·블랙 대비를 기존 canonical 배너 CSS에 한정 적용. 새 히어로 renderer/layer 없음.
- CODEMAP_MISS: milestone 항목 없음. 실제 card/renderList/위임 이벤트, 기존 CSS 및 canonical 메타 확인 후 국소 수정.

### 실행한 검증

Node 실행 파일: C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe (v24.22.1).

- node scripts/hani-milestones-v1.test.mjs: 기존 Node 14개 PASS. 승인된 카드 구조(대표1+나머지3) 및 전용 히어로 상수에 맞춰 기대값만 갱신. 이 명령의 선택적 기존 browser suite는 인자 없이 실행하지 않았음.
- node scripts/hani-milestones-grade-ui.test.mjs: 신규 8개 PASS. 등급 클래스/정확한 seal, 4등급×분야 AND 및 정렬/개수, 등급 없음 Record, 첫 featured 소유, before/change 누락, 렌더 불변/쓰기0, 반복 카드 id0, 흰 배너 문자 AA 대비 계산.
- node scripts/hani-milestones-grade-ui.browser.mjs <playwright index.mjs> <msedge.exe>: 실제 Edge에서 최종 a2 기준 390/1440 × porcelain-cream/midnight-black 4조건 PASS.
- 브라우저: 합성 8기록을 메모리에만 설치. 실제 클릭으로 모든 등급×전체/건강/생활/여행 조합, 선택 해제, 정렬, 분야별 개수, 상세 열기/Escape 복귀 확인. 가로 overflow0·clipped0·중복 DOM id0·pageerror0·Storage/save 쓰기0·레코드 변경0·canonical 히어로1개 확인.
- JS syntax: hani-milestones.js, hani-ui-v02992.js, 신규 browser script PASS. Node 테스트 스크립트는 실제 실행 통과.
- 원본 바이트 비교: persistence owner와 CATEGORIES/IMPORTANCE/GRADES 및 seed 영역 동일. 보호 저장키·내부 baseline·Cloud/schema 변경 없음.
- 줄바꿈: 원본 snapshot과 LCS 행 비교. 변경하지 않은 5파일 총 5,960행의 CRLF/LF 차이0. 혼합 줄바꿈 원문 보존, index의 새 슬롯1행만 주변 CRLF 사용. 상세 artifacts/milestones-grade-ui/verification.json.
- git -c core.whitespace=cr-at-eol diff --check PASS. 기본 diff --check는 원래 CRLF 행의 CR을 whitespace로 표시하므로 줄바꿈을 정규화하지 않았음.
- 화면 캡처 직접 확인: 1440 크림 및 390 블랙 레이아웃. 독립 아린/HINA 검증으로 표기하지 않음.

### Preview 근거 및 재실행

- artifacts/milestones-grade-ui/390-porcelain-cream.png
- artifacts/milestones-grade-ui/390-midnight-black.png
- artifacts/milestones-grade-ui/1440-porcelain-cream.png
- artifacts/milestones-grade-ui/1440-midnight-black.png
- artifacts/milestones-grade-ui/verification.json

PowerShell 재실행 예시:

~~~powershell
& 'C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' scripts/hani-milestones-grade-ui.browser.mjs 'C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs' 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
~~~

### 미검증·경계

- 기존 v1의 선택적 browser 저장 시나리오 전체는 이번 UI patch에서 미실행. 신규 4조건 UI browser 회귀와 기존 Node 저장 rollback 검사는 통과.
- 실제 인증/Cloud 왕복, Android 실기기, 독립 아린 Preview, release package/One-Pass/HINA, Production read-back은 이번 기능 패치 범위 밖이며 미실행.
- 표시 버전 2.9.233 및 cache 태그 유지. 서버 Edge Function/설정/배포 순서 추가 없음.
- 신규 런타임 JS/CSS 파일 없음. 최종 runtime 신규 asset은 다른 담당 소유 a2 1장. a/b 및 비교 PNG 등 작업용 자산을 패키지에 추가하지 않았음. 패키지 closure 최종 검증은 배포 담당 경계.

## 다음 담당에게

- 먼저 읽기: 이 문서, hani-milestones.js의 card/gradeFilters/renderList, canonical milestones 메타.
- 다음 행동: 성민 대표님 Preview 확인 후 배포 담당이 승인된 변경만 열차에 통합. 요청대로 이 작업은 push·PR·배포하지 않음.
- blocker: 코드 구현/4조건 UI 검증 blocker 없음. 원격 main 최신성은 네트워크 실패로 미확인. 통합 시 재확인 필요.
- Notion: 현황판 읽기 성공. 착수 기록 insert_content_after는 자동 승인 검토가 거절(approval policy never)하여 저장되지 않았으며 read-back 완료로 보고하지 않음. 아래 내용을 갱신 대기로 보존: “2026-10-29 도연 / 마일스톤 v3 등급 배너·AND 필터·a2 canonical hero 구현 완료, Node14+8·Edge4 PASS, 저장/Cloud/버전/push/배포 변경 없음, Preview 대기 / branch hani/milestones-grade-ui / base d31a0a2 / 이 인수인계 원문 참조.”
- CURRENT/DECISIONS: 공통·타 담당 기록 변경 없음. 작업별 인수인계만 작성.
