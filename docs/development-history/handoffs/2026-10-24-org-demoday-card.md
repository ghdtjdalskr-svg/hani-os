# 개요 DEMO DAY 히어로 복원 — 후속 작업

## 작업 식별

- 갱신 시각(KST): 2026-10-24 / 담당: 도연(Codex), 배정·다음 담당: 서윤(Claude Code).
- 상태: 진행 중. LIGHT UI 패치, 아래 사진 카드 기록을 대체하는 후속 요청.
- branch / worktree: `hani/seoyun-org-demoday-card` / `org-demoday`.
- 시작 HEAD: `86930825d1ab17cebed1ac73f9dec9d72b2b19a8`(사진 카드 포함), 공통 base `d19aa0b62b1657660cb3cc6bec6bee1524dbb2bf`.
- origin/main 캐시: `2cbbe6ed0c14954008208f0db2316b5f09228c2a`. 원격 조회 연결 실패로 최신성 미확인. 캐시 main은 base보다 진행됨. 지정 branch에서 범위 내 패치만 하며 merge/rebase하지 않음. 로컬 main index cache v2.9.232, 마지막 script `hani-launch-greeting.js`; Production 실제 표시·로딩 미확인.
- 목표·범위: 기존 overview persistent 슬롯의 연혁 위에 `60db7b5` 원본 hero 제목·설명·CTA·signature·그림·캡션·도장 복원. 기존 canonical 조직도 탭 클릭 후 chart scroll. JS/CSS·browser 검사·이 인수인계·CURRENT만 수정 예정.
- 승인 근거: 성민 대표님 2026-10-24 “overview is the first page … bring back the title like before”, 서윤 dispatch. commit/push/PR·버전/cache·Storage/Cloud·main/배포 금지.
- CODEMAP_MISS: organization owner 항목 없음. 실제 `renderOverview()`·root click handler·`selectHubTab()` 및 `hani-main.js`의 organizationTabs → showView → selectOrganizationTab 경로 확인.

## 결과와 증거

- 검사·최종 결과는 완료 시 갱신. 페이지 공통 banner는 수정하지 않음.
- Notion 현황판 및 Markdown 명세 읽기 성공. 착수 현황 append는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 갱신 미반영, 재시도·우회 없음. 완료 요약은 이 인수인계에 보존 후 서윤에게 전달.

## 다음 담당에게

- 최종 검증 결과 및 다음 행동은 아래 완료 시 갱신 예정. 과거 사진 카드 검증 PASS를 이번 hero PASS로 재사용하지 않음.

---

# 이전 작업: 개요 DEMO DAY 사진 카드 복원

## 작업 식별

- 갱신 시각(KST): 2026-10-24 / 담당: 도연(Codex), 배정·다음 담당: 서윤(Claude Code).
- 상태: 구현·targeted Node PASS / 실제 Edge 실행 차단으로 실화면 검증 대기. LIGHT 표시 전용 패치.
- 저장소 / branch / worktree: hani-os / `hani/seoyun-org-demoday-card` / `org-demoday`.
- base / HEAD: `d19aa0b62b1657660cb3cc6bec6bee1524dbb2bf`, 시작 시 clean. candidate 없음.
- 목표: 개요의 연혁 위에 Demo Day 사진·기존 한국어 alt·캡션·ONE TEAM 도장 복원. 큰 제목·CTA 복원 없음.
- 수정 범위: `hani-organization-hub.js`, `hani-organization-hub.css`, `scripts/hani-org-demoday-card.browser.mjs`, 필요한 기존 organization 검사, 이 인수인계·증거.
- 승인: 성민 대표님 option B 승인(2026-10-24), 서윤 dispatch. commit/push/PR/버전/cache/main/배포 및 Storage/Cloud 변경 금지.
- CODEMAP_MISS: `dev-center/codemap.json`에 organization owner 항목 없음. 실제 `renderOverview()`·`selectHubTab()` 및 기존 226 인계 확인.
- 기준선: `git ls-remote origin refs/heads/main` GitHub 연결 실패. 로컬 origin/main과 HEAD d19aa0b 기준 유지, merge/rebase 없음. 로컬 표시·cache v2.9.232 / 마지막 script `hani-launch-greeting.js`; Production 표시·실제 JS 로딩 미확인.

## 결과와 증거

- 변경: 기존 `!slot.querySelector('.ogh-history')` 1회 생성 경로에서 사진 figure를 연혁 앞에 배치. 기존 이미지·한국어 alt·1439×810 속성·캡션·도장 복원, lazy/async 지정. 새 id·headline·CTA·JS/event layer 없음.
- CSS: 기존 `.ogh-hero-art`·`.ogh-seal` 및 light/dark palette 재사용. 카드 최대 너비664px, 원본 전체를 보이는 contain/360px 최대 높이·둥근 모서리, 도장을 카드 안쪽에 배치. 모바일은 슬롯 전체 너비. 실측은 미검증.
- `node --check hani-organization-hub.js`: PASS.
- `node --check scripts/hani-org-demoday-card.browser.mjs`: PASS.
- `node scripts/hani-history-226.test.mjs --unit-only`: PASS. 실제 카탈로그/월·주요 순간·집계·persistent 슬롯·canonical click·접기 경계·승인·escape·실패 fallback·write0 기존 회귀. 근거: `artifacts/history-226/unit.json`.
- 실제 `createHistoryHarness()`의 `renderOverview()` 6회 실행: PASS. 단일 카드가 연혁 바로 앞에 생성, mount1회·새 id/headline/CTA0·write0. 정규식은 실제 렌더 결과에만 적용했고, browser PASS로 간주하지 않음. 근거: `artifacts/org-demoday/node-results.json`(현재 JS/CSS SHA-256 포함).
- `git diff --check`: PASS.
- 필수 `node scripts/check-organization-hub.mjs <playwright index.mjs> <msedge.exe>`: 실행 시도, `browserType.launch: spawn EPERM`으로 차단. overview 구조 assertion 없음. 기존 마지막 no-fetch 기대는 현재 main의 읽기 전용 history fetch와 맞지 않아, 해당 1개 catalog GET만 허용하도록 검사 기대값 보정(스토리지/auth 금지 유지). 보정 assertion 단독 실행·syntax PASS, 전체 browser 경로는 차단으로 미검증.
- 신규 `node scripts/hani-org-demoday-card.browser.mjs <playwright index.mjs> <msedge.exe>`: 로컬 worktree 서버 시작 후 Edge launch `spawn EPERM`으로 차단. 임의 우회·권한 변경 없음. 근거: `artifacts/org-demoday/results.json`의 NOT_VERIFIED.
- 준비된 browser 검사: `index.html#organization/overview`에서 테스트 페이지의 login DOM만 제거, 1440/390 × pure-white/midnight-black/titanium-graphite에서 실제 decode·100px<높이≤361px·연혁 위·모바일 full width·가로 넘침0·도장 카드 내부·people/aiTeam/archive 숨김·반복 탭 및 ready 갱신 시 figure/image 동일 객체·중복 DOM id0·보호키 동일을 검사. 외부 요청 차단·격리 context 사용.
- 미검증: 실제 화면·theme·탭 숨김·이미지 decode/실측·가로 overflow·browser console. 요청 PNG `artifacts/org-demoday/1440.png`, `390.png` 미생성(실행 차단). dark 추가 PNG도 미생성. 실제 인증·Android·운영은 검사하지 않음.
- 데이터·Storage·Cloud·schema·서버 변경 없음. Edge Function 동반 배포 없음.
- Notion: 현황판·Markdown 명세 읽기 성공. 착수 insert_content는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 저장·read-back 갱신 완료 아님. 갱신 대기 요약: option B·branch/base·위 변경/Node PASS·Edge EPERM/PNG0·미커밋/미push/미배포·다음 서윤 browser 재실행. 거절된 작업 반복·승인 우회 없음.
- main/Pages/Production/Candidate/One-Pass/HINA: 기능 패치 단계로 미실행.

## 다음 담당에게

- 먼저 읽기: `renderOverview()`, `selectHubTab()` 및 신규 browser 검사.
- 다음 행동: 서윤의 허용 환경에서 아래 두 browser 명령 재실행 후 PNG 확인. 기존 checker는 별도 서버를 `HANI_PREVIEW_URL`(기본 http://127.0.0.1:8791)로 제공해야 함. 신규 스크립트는 서버 자체 생성/종료. commit/push/PR는 이번 요청대로 하지 않음.
- 실행 인자: Playwright `C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`, Edge `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`.
- blocker: Edge spawn EPERM, Notion write 자동 승인 never 거절, 원격 최신성 미확인. 성민 대표님 추가 결정 없이 허용 환경에서 검증 재개 가능.
- CURRENT: 구현/Node PASS·browser 미검증·Notion 미반영을 요약. DECISIONS: 새 결정 없음(option B 승인 범위만 이 문서에 기록).
- 다른 작업: 연혁·shared banner/event·저장 경로·버전/cache 변경 없음. 서버 설정/Edge Function 동반 배포·순서 없음. 배포 담당 열차 통합 및 Candidate 절차는 이후 별도 진행.
