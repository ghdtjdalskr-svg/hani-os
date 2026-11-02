# 1F 이달의 퀸 포스터 설치 · qa-b11c

## 작업 식별

- 작업 ID / 제목: qa-b11c / 승인 퀸 포스터의 1F 설치.
- 갱신 시각(KST): 2026-11-02. 담당: Codex 단독 개발·자동 검사. 독립 리뷰 주장 없음.
- 상태: 구현·targeted 검증 완료, 로컬 검토 대기, 미커밋. 공식 탑승 전.
- 저장소 / branch / worktree: ghdtjdalskr-svg/hani-os / hani/mascots-poster / qa-b11.
- HEAD: 3f9a7ede9a99e0e30093ae2acefa4658a429f75b. 사용자 제공 통합 main 및 로컬 origin/main 캐시: 13fe8732113154d81b1d0b1514f64ab17ce98a32. Git subprocess 없이 ref 파일만 읽음. 원격 최신성 미검증.
- 기준 표시 버전: 2.9.258 유지. index 마지막 script는 ./hani-launch-greeting.js. 실제 Production 로딩 미검증.
- 목표 / 완료 조건: 승인 아트 축소본, 수상 다음 달 1F 전용 persistent 표시, 같은 전광판 당선자·이름 읽기, 기존 bubble, 데이터·모든 plan 보존, 지정 회귀 검사.
- 승인 근거: ../qa-b11c-task.md 전체 UTF-8 정상 판독. 포스터 설치·축소·전용 검사와 labels/residents exact-line fixture·pin 갱신 승인. commit/push/merge·브라우저·Git subprocess·버전/cache 변경 금지. 배포 승인은 없음.
- Scoped Discovery: codemap living-office owner 확인. poster/queen 세부 anchor는 CODEMAP_MISS로 실제 queenSlides, setBackground, updateBuilding, character bubble을 좁게 확인.

## 결과와 증거

- hani-board.js: 기존 queenSlides의 월·당선자 계산을 queenWinner(now) 읽기 API로 추출. 전광판도 같은 API를 사용. 당선자 이름은 기존 roster/displayName에서 읽음. 새 데이터 경로·별도 fetch 없음. 수상 2026-10 결과를 2026-11에 표시, 연도 경계 포함 KST 검증.
- hani-office-live.js/.css: persistent native button 하나와 소형 award-month 표. CSS token의 literal URL을 기존 closure가 추적. 1F 정상 지도에서만 표시하며 미등록 월·당선자 없음·board 미준비·fallback 지도는 숨김. CSS 배경 이미지이므로 broken img 아이콘 없음. floor 왕복에도 같은 요소 유지.
- 위치: left **41%**, top **19%**, width **3.5885167464%**, height **9.5642933050%**. 1672×941 원본에서는 left685.52/top178.79, 60×90px. 간판 전체 보수적 box x40..58%, y10..17.5%, 엘리베이터 x17..29%, y2..29%, 액자 x69..82%, y5..21%와 비겹침 검증. 간판 아래 왼쪽 빈 벽. z-index2로 actor sprite4 뒤에 표시. phone360/390/416·desktop1440의 지도 비율 계산 검증. 실제 browser 픽셀 검증과 구분.
- 탭: 기존 단일 말풍선에 「👑 10월의 퀸 · 데이터의 당선자 이름」. 현재 이름 변경도 반영. 기존 닫기 timer·floor 전환·Escape 사용. 포스터 bubble에는 profile 링크·sprite 확대 없음. native button의 기본 키보드 활성화 사용. 기존 배우 event path와 renderer를 추가하지 않음.
- 자산: assets/queen/poster-2026-10.webp, **360×540 / 52,018B**, 승인 원본의 1:1.5 비율 유지. 원본 artifacts/queen-poster/2026-10-poster.webp 보존. runtime closure **145→146/160, 누락0, 제거0**, 추가는 이 WebP 하나.
- scripts/hani-mascots-poster.test.mjs: 신규 poster8/8, 전체23/23 PASS. 월 경계·unknown month·1F·정상 art·persistent floor 전환·간판/엘리베이터/액자·크기비·tap 이름·기존 bubble·write0·frame layout read0·실제 staff/visitor/resident plan 및 snapshot 비교·WebP decode·closure.
- labels/residents fixture: 이전 **두 fixture 모두 complete-line LCS로 먼저 동일 재현**한 뒤 새 exact-line delta를 작성. resident 전 원문에도 포스터 UI를 적용하여 resident delta는 resident 변경만 유지. 원래 역사적 source hash **406937ae1d69c0379bb735e961734b517ae9440a02c93a0d41771dc0c694d246** 유지. obr8/15/21은 fixture SHA pin만 수정. 주민 helper도 fixture hash와 pre-resident UI hash만 수정. guard 범위 확대·plan oracle 갱신 없음. 외부 무단 변경 tamper 거절 검증.
- 변경 파일: runtime hani-board.js·hani-office-live.js/.css, 위 WebP, scripts/hani-mascots-poster.test.mjs, scripts/fixtures/office-labels-qa-source-delta.json·office-residents-source-delta.json, scripts/hani-office-residents-source.mjs, scripts/hani-office-obr8.test.mjs·obr15·obr21의 pin, 본 인수인계·CURRENT·기존 포스터 인수인계의 후속 링크·artifacts/queen-poster-install/ 근거.
- 보호: 원래 office source에 명시된 포스터 표시 patch만 적용했을 때 현재와 byte 동일. 전광판도 추출·API export 외 byte 동일. CSS 기존 줄 삭제/변경0. index/main·버전/cache·저장/Cloud/schema·모든 staff/visitor/resident scheduler/plan source 보존. 원래 LF/CRLF 보존. 새 fetch/setInterval/setTimeout/addEventListener 호출0. 기존 queueBubbleTimer 재사용. 서버/Edge Function 설정 및 배포 없음.

### 실행 검증

환경 Node v24.20.0. 최종 runtime JS SHA256: b6e31c96b8173a27468257068f20d22d9a9e69d1c101eada26f6562679790fcc.

- 구문 검사: **10통과·0실패**. node --check runtime2개·수정된 검사/helper4개·신규 검사·작성/보존 도구3개. syntax.json.
- 별도 보존 검사: **10통과·0실패**. node artifacts/queen-poster-install/verify-preservation.mjs. preservation.json.
- 테스트18명령: **10명령 성공·8명령 실패**, assertion 합계 **264통과·10실패·1skip**, 신규 실패0. 공통 fixture의 기존 검사가 여러 suite에서 중복 실행된 수를 포함.
- 아래 office16명령 수정 전 합계: **214통과·10실패·1skip**, 수정 후 동일. 기존 실패10건을 PASS로 바꾸지 않음.

| suite | 통과 | 실패 | skip |
|---|---:|---:|---:|
| residents | 29 | 1 | 0 |
| labels-qa | 17 | 0 | 0 |
| icons | 13 | 2 | 0 |
| crowded-labels | 19 | 0 | 0 |
| obr8 | 2 | 1 | 0 |
| obr15 | 13 | 1 | 0 |
| obr21 | 4 | 2 | 0 |
| hd-224 | 10 | 0 | 0 |
| consult | 19 | 1 | 0 |
| zoom | 11 | 1 | 1 |
| visitors-cafe | 5 | 0 | 0 |
| motion-2 | 24 | 0 | 0 |
| floor-bubble | 18 | 0 | 0 |
| drama | 20 | 0 | 0 |
| cafe-rest | 3 | 1 | 0 |
| top-labels | 7 | 0 | 0 |
| poster | 23 | 0 | 0 |
| billboard | 27 | 0 | 0 |

- 공통 office 명령: node --test --test-reporter=tap --test-isolation=none --test-force-exit --test-timeout=60000 scripts/hani-office-<suite>.test.mjs.
- 전용 실제 실행: node scripts/hani-mascots-poster.test.mjs / node scripts/hani-lounge-billboard.test.mjs. 전광판27/27 PASS. run-final.ps1은 billboard의 직접 실행 가드를 존중하도록 위 직접 명령 사용.
- 기존 실패8건은 Git historical source 조회 spawnSync git EPERM: icons2·obr8 1·obr15 1·obr21 2·consult1·cafe-rest1. 지시대로 Git 차단을 우회하거나 guard를 완화하지 않음.
- 기존 residents 실패1: hard-coded baseline closure129, 수정 전 실제138, 포스터 추가 후139. 기존 자산 증가로 이미 실패했으며 해당 기대값을 넓히지 않음.
- 기존 zoom 실패1: artifacts/office-zoom/source-before.txt 누락 ENOENT. 수정 전후 동일. 역사 원문을 현재 파일로 위조하지 않음.
- skip1: zoom의 실제 browser CSS 검증. 사용자 지시대로 브라우저 실행 안 함.
- 상세: artifacts/queen-poster-install/tests.json 및 before-*/final-*.log, baseline.json, fixture-evidence.json, preservation.json, syntax.json. 비교 대상은 동일 사전 snapshot. 재현 도구 freeze-fixtures.mjs는 명시적 authoring 도구이며 테스트가 fixture를 자동 재생성하지 않음.
- 미검증: 실제 모바일/desktop 앱 픽셀·터치 체감·browser screenshot·로그인/Production read-back·원격 최신성. Candidate/Full build/One-Pass/HINA/Arin/배포 단계는 요청 범위 밖, 미실행. 표시 버전 증가는 기능 탭·이번 작업의 명시적 금지로 N/A.
- 데이터·저장소·Cloud·schema 영향: 없음. 실제 운영 데이터에 접근·쓰기 안 함.
- PR / Preview / 배포: 로컬 미커밋 변경만. commit/push/merge·PR·main/Pages/Production read-back 모두 미수행.
- Notion: 현황판 읽기 성공. 착수 append 자동 승인 검토 거절: MCP tool call requires approval, but approval policy is never. 저장·read-back 미완료. 승인 거절을 우회하지 않음. 최종 상태 요약도 갱신 대기이며 이 인수인계와 CURRENT가 원문이다.

## 다음 담당에게

- 먼저 읽을 파일·함수: 본 인수인계, queenWinner/queenSlides, queenPosters/updateQueenPoster, setBackground/updateBuilding, scripts/hani-mascots-poster.test.mjs, fixtures/helper와 fixture-evidence.json.
- 다음 한 가지 행동: 허용된 환경에서 2026-11 KST의 1F를 모바일·desktop Preview로 확인. 2026-10/12 및 다른 층은 숨김 확인. 현재 사용자 지시가 유지되는 동안 commit/push/merge 없음.
- blocker / 결정: browser·Git 차단, 기존10실패와 Notion 갱신 거절. 새 데이터/배포 승인 요청 없음.
- 다른 작업 영향: 두 exact-line fixture와 세 pin/helper를 함께 전달해야 함. 다른 담당 worktree·branch는 수정하지 않음. 배포 담당은 다음 열차에서 기존 회귀 결함·누락 기준 파일을 별도 해결하고 같은 candidate로 gate 실행.
- CURRENT / DECISIONS: CURRENT에 검증된 구현/좌표/closure/기존실패/미검증/Notion 대기 요약만 prepend. DECISIONS 변경 없음. 기존 포스터 인수인계에 이번 후속 링크만 prepend, 과거 근거 보존.
