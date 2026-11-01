**포스터 설치 후속(qa-b11c, 2026-11-02):** 대표님 승인 원본을360×540·52,018B로 축소해 1F persistent 표시 완료. 같은 전광판 winner 읽기, 좌측41%·상단19%, 포스터8/8·전체23/23 PASS, 지정/추가264통과·기존10실패·1skip, 신규실패0, closure146/160·누락0. 미커밋·브라우저/운영 미검증·Notion 갱신 거절/대기. [설치 인수인계](2026-11-02-queen-poster-install.md). 아래 이전 작업 근거 보존.

# 치즈·크림 조직도 / 2026년 10월 퀸 포스터

**모찌 후속(qa-b11b, 2026-11-02):** 세 번째 사내 마스코트 카드·흰 토끼 atlas·초상화3개·로비 비교판 완료. 직원19명 유지. 지정21/21·syntax6/6·보존15/15 PASS, 실패0, closure145/160·누락0. 스프라이트는 artifacts에만 저장, manifest·office-live·버전 불변. 현재 로컬 HEAD `39cb3c7`, 미커밋·브라우저 미검증·Notion 갱신 거절/대기. [최신 후속 인수인계](2026-11-02-mochi-mascot.md). 아래 이전 작업의 증거는 당시 결과로 보존합니다.

## 작업 식별

- 작업 ID / 제목: qa-b11 / mascots-poster
- 갱신 시각(KST): 2026-11-02
- 담당 도구 / 검토 담당: Codex 단독 개발·자동 검사. 실화면 검토 미실행.
- 상태: 구현 완료·로컬 검토 대기. commit/push 금지 지시에 따라 공식 열차 탑승 전.
- 저장소 / branch / worktree: ghdtjdalskr-svg/hani-os / hani/mascots-poster / qa-b11
- base SHA / candidate SHA: 1f03c98ff8207ccdfcc676b18739dee1ba0ada9e / 미커밋
- 기준선: 로컬 HEAD와 origin/main 캐시 동일. Git subprocess·브라우저 차단으로 원격 최신성·운영 화면은 미검증. index 마지막 runtime hani-ai-budget.js?v=2.9.257 확인.
- 목표 / 완료 조건: 마스코트 별도 표시, 직원19명·명단·투표·집계 보존, 프로필·썸네일·비교 아트와 퀸 포스터 제작, 지정 targeted test.
- 수정할 파일·범위: hani-organization-hub.js/.css, assets/profiles의 신규 치즈·크림 이미지 6개, artifacts/mascots-poster 및 artifacts/queen-poster, 신규 Node 검사, 본 인수인계.
- 사용자 승인 근거 / 승인되지 않은 경계: ../qa-b11-task.md 전체 UTF-8 정상 판독. commit/push/merge/버전/cache/office-live 변경 금지. 저장·Cloud 변경 없음. 배포 승인 없음.
- CODEMAP_MISS: dev-center/codemap.json에 조직도 owner 항목 없음. 실제 owner·roster·클릭·탭 경로를 좁게 확인.

## 결과와 증거

- 변경한 내용 / 파일:
  - `hani-organization-hub.js`: 기존 `#ogh-chart` 안에 「사내 마스코트」 작은 섹션과 치즈·크림 비대화형 카드 추가. 이름·종류·성격 한 줄·접근성 이미지 설명. person 링크/버튼 없음.
  - `hani-organization-hub.css`: 범위 한정 반응형 2열→1열 카드, 128px portrait. CSS `image-set()`으로 128/256/720 이미지를 선택하며 여섯 URL 모두 기존 closure가 추적.
  - rows/people/roster/직원19명/팀·직급·검색·탭·클릭·fetch owner와 저장·Cloud 코드는 원문 바이트 보존. 마스코트는 직원·게시판·투표·순위의 입력에 추가하지 않음.
  - 내장 image_gen으로 초상화2개와 기존 퀸 이미지 기반 서윤 포스터 생성. 사용 프롬프트·참고 이미지·생성 방식: `artifacts/mascots-poster/image-prompts.md`. 생성된 한글 「10월의 퀸」「서윤」「HANI GROUP」 정상 판독, 문자 합성 불필요.
  - WebP 변환·썸네일·직원3명 비교판·로비 원본/60×90 배치 비교판. 퀸 아트는 `artifacts/queen-poster/`에만 저장, runtime에 연결하지 않음.
  - `scripts/hani-mascots-poster.test.mjs`: 실제 허브 전체 실행, 비대화형 카드·탭 전환·직원 집계·실제 게시판 후보/투표/활동 순위·WebP decode·closure·로비 픽셀 비교 검사.
- 실행한 검증: **10개 테스트 명령 중 8성공·2실패**. 집계형69통과·2실패·1skip + 비집계형3명령 성공·1명령 실패. 실패 assertion은 총3건이며 모두 변경 전 원문에서도 동일 재현. 신규 변경 회귀로 확인된 실패0.
  - `node --check` 6/6 PASS: 허브·신규 테스트·아트 준비·패치 스크립트·baseline loader·보존 검사.
  - 신규 `node scripts/hani-mascots-poster.test.mjs`: **7/7 PASS**, 최종 수정 후 재실행도 7/7.
  - `node scripts/hani-lounge-billboard.test.mjs`: **27/27 PASS**.
  - `node scripts/hani-qa-easy-cleanup.test.mjs`: **12/12 PASS**.
  - `node --test-name-pattern="QA-5: actual overview headcount" scripts/hani-qa-design-b4.test.mjs`: **1/1 PASS**, 실제 개요의 직원19명 경로.
  - `node scripts/hani-history-226.test.mjs --unit-only`: PASS, 기존 연혁 renderer·persistent slot·집계·경계·canonical click·읽기 전용 검사.
  - `node scripts/hani-history-unify.test.mjs`: **14/14 PASS**.
  - `node scripts/hani-character-archive.test.cjs`: PASS.
  - `node scripts/hani-newstaff-215.test.mjs --unit`: PASS, 3그룹.
  - `node scripts/hani-newface-217.test.mjs`: FAIL. 기존 테스트가 다온의 desk anchor를 undefined로 기대하지만 실제 `desk_daon` 존재(46행). 조직도와 무관한 기존 office fixture 기대값 차이. 원문 baseline 재실행 동일 실패.
  - `node scripts/hani-staff-floors-214.test.mjs --static`: **8통과·2실패·1skip**. 기존 fixture가 `portraitSource`를 추출하지 않아 ReferenceError(59/69행), 기존 테스트가 gate contract `2.0.9`를 기대하지만 현재 `2.0.10`(94행). 원문 baseline 재실행도 동일 8/2/1. 기존 테스트·gate·office 코드 미수정.
  - 원문 baseline은 `baseline-loader.cjs`로 fs read만 기존 `.before`에 치환. 작업 파일을 바꿔 끼우거나 복구하지 않음. `newface-baseline.log`, `staff-floors-baseline.log` 참조.
  - `node artifacts/mascots-poster/verify-preservation.mjs`: **11/11 PASS**. 허브의 새 markup 제거 시 원문과 byte 동일, 기존 CSS prefix 동일, index/main/board/library/office-live2개/퀸 원본 SHA256 동일. `baseline.json`, `preservation.json`.
  - 최종 closure **136→142 / 160**, 누락0·제거0·추가6개 전부 마스코트 WebP. 총16,242,927B. 정적 closure만 확인한 것이며 release package build 증거는 아님.
  - 비교 이미지 육안 확인: 기존 직원3명과 스타일·색·초상화 비교, 포스터 한글과 60×90 견본·로비 배치 확인. 실제 앱 화면 검증과 구분.
  - 로비 원본과 합성 PNG의 모든 픽셀 비교: `(900,100)`의 60×90 영역만 변경. 원본 아트 수정 없음.
  - 명령·로그: `artifacts/mascots-poster/run-checks.ps1`, `test-results.json`, 명령별 `.log`. 최초 Node 자식 프로세스 묶음 실행기는 spawn EPERM으로 시작 실패하여 삭제하고 PowerShell 직접 실행으로 완료.
- 실행하지 않은 검증 / 남은 위험: 사용자 금지에 따라 `check-organization-hub.mjs`, org-demoday/character-archive UI·integration/profile-thumbs browser 검사 및 실화면·모바일 overflow/로그인/운영 QA 미실행. staff-floors browser도 `--static`으로 명시 skip. 역할을 바꿔 독립 리뷰라고 주장하지 않음. 최종 Candidate/Arin/HINA/package/배포 검사 미실행.
- 데이터·저장소·Cloud·schema 영향: 없음. 새 write/save/Cloud/fetch 경로 없음. 보호 키·내부 baseline·main.js·board.js·library·office-live·index·버전/cache 보존.
- PR / Preview / 배포 원문 링크: 없음. 커밋하지 않는 로컬 작업.
- main / Pages / 표시 버전 / 실제 JS 로딩 / 기능 read-back: 병합·배포·운영 미실행. 2.9.257 및 cache 유지.
- Notion: 착수 페이지 저장·읽기 확인 완료. https://app.notion.com/p/40bc5275707481f0afe1cd50a9a449f6 。 최종 상태 갱신은 자동 승인 검토 거절: `MCP tool call requires approval, but approval policy is never`. 최종 결과·기존3실패·142/160·검토 대기·이미지 경로 갱신 **미반영/대기**. 승인 거절을 우회해 재시도하지 않음.

### 이미지 경로·크기

| 경로 | 픽셀 | 바이트 |
|---|---:|---:|
| `assets/profiles/hani-profile-cheese.webp` | 720×720 | 108,042 |
| `assets/profiles/thumb/hani-profile-cheese-256.webp` | 256×256 | 18,754 |
| `assets/profiles/thumb/hani-profile-cheese-128.webp` | 128×128 | 5,772 |
| `assets/profiles/hani-profile-cream.webp` | 720×720 | 110,178 |
| `assets/profiles/thumb/hani-profile-cream-256.webp` | 256×256 | 19,890 |
| `assets/profiles/thumb/hani-profile-cream-128.webp` | 128×128 | 5,916 |
| `artifacts/mascots-poster/staff-mascots-compare.png` | 1440×384 | 605,265 |
| `artifacts/queen-poster/2026-10-poster.webp` | 720×1080 | 291,046 |
| `artifacts/queen-poster/2026-10-poster-60x90.png` | 60×90 | 15,339 |
| `artifacts/queen-poster/2026-10-on-1f-60x90.png` | 1672×941 | 2,684,771 |
| `artifacts/queen-poster/2026-10-lobby-compare.png` | 3368×1420 | 2,934,192 |

위 파생 이미지 크기는 `image-sizes.json`과 일치. 내장 image_gen 원본은 기본 생성 디렉터리에 보존하며 앱에서 참조하지 않음. 크기 변환·비교만 script로 수행.

## 다음 담당에게

- 먼저 읽을 파일·관련 함수: hani-organization-hub.js의 rows/people, root.innerHTML, selectHubTab. scripts/hani-runtime-closure.mjs.
- 다음 한 가지 행동: 검토 가능한 환경에서 조직도 모바일/PC 화면과 비교 아트를 확인. 대표님 후속 지시 전 commit/push/PR/열차 통합 없음. 포스터 office 적용은 별도 승인 범위.
- blocker / 필요한 사용자 결정: 브라우저·Git subprocess 금지. 기존 테스트3결함과 Notion 최종 기록 거절은 위 근거 참조. 데이터/배포 승인 요청 없음.
- 다른 작업에 영향을 주는 사항: 다른 탭이 수정하는 hani-office-live.* 미수정.
- CURRENT / DECISIONS 갱신 내용: CURRENT에 구현·142/160·검사 결과·기존3실패·미검증·Notion 최종 갱신 대기 요약. 새 결정/승인 없음, DECISIONS 미수정.
