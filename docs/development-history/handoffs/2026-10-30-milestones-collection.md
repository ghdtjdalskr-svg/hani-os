# 마일스톤 수집 카드 컬렉션

## 작업 식별

- 갱신: 2026-10-30 KST / 담당: Codex. 독립 리뷰·배포 QA 수행 없음.
- 상태: 구현 완료, 실행 검증 대기. 기능 PASS 또는 운영 완료로 간주하지 않음.
- 저장소/worktree: ghdtjdalskr-svg/hani-os / ms-grade
- branch: hani/milestones-grade-ui
- 시작·유지 HEAD/base: 1eb90ae17a503d06cc692f62e2ef1910c0636172
- 로컬 origin/main 및 GitHub connector 최신 main: d6a88bc52406d93b92fd16641c4750ba3b35141c. 자동 merge/rebase 없음.
- 표시/cache 기준 2.9.233 유지. 기존 마지막 script hani-launch-greeting.js, milestone owner hani-milestones.js. 운영 화면·실제 로딩 미검증.
- 승인: MISSION-ms-collection.tmp.md 구현. NORMAL 표시·이벤트 변경. push·PR·main merge·배포·버전/cache 변경 금지.
- CODEMAP_MISS: milestones 항목 없음. 실제 owner hani-milestones.js의 list/detail/start 단일 delegated 경로를 좁게 확인.
- 다른 담당: assets/milestone-cards/set 쓰기·삭제·정리 없음. 이미지 생성/시트 병합은 다른 작업 담당.

## 결과와 증거

### 변경한 내용 / 파일

- hani-milestones.js: 전체 클릭 가능한 button 수집 카드, B2 글라스 이름판, LEGENDARY/EPIC/RARE/등급 없음 별 5/4/3/2개. null 등급은 MOMENT · 소중한 순간 표시. 데이터·내부 RECORD 필터 키 유지.
- 연도별 그리드, 분야 AND 등급 필터 및 정렬 유지. 정렬 결과를 연도별로 모으고 연도 내부 순서를 보존. 중요도/분야 정렬도 연도별 컬렉션 유지.
- NEW: createdAt부터 14×24시간 미만, 미래·잘못된 시각 제외. 메모리 계산만 수행.
- 단일 ART 상수(specialId/cells/sheet)로 건강혁명 전용 및 10분야·기타 fallback 매핑. CSS 400%×300% atlas background-size/position. 시트 누락 시 등급별 그라디언트 표시. 시트 추가 후 페이지 로드 시 코드 수정 없이 표시.
- 기존 detail() 재사용: 지표 표·설명·배경·의미·다음 목표·이미지·관련 메뉴·담당·직원/회장 코멘트·태그·편집/삭제 보존. 대표 지표와 아트가 있는 밝은 editorial sheet로 감쌈.
- index.html: 기존 article 상세 슬롯을 native dialog로 변경, 목록 접근성 이름만 컬렉션으로 변경. 추가 id 없음.
- 기존 단일 이벤트 owner에서 열기/ESC·취소/닫기/배경 클릭/원래 카드 포커스 복귀. 닫을 때 카드 node 재생성 없음. 편집·삭제·관련 메뉴도 기존 경로 유지. dialog는 열 때 상단으로 복귀.
- hani-design-system.css: 기존 v3 긴 카드 표현을 B2 카드·그리드·밝은 상세 시트로 교체. 기존 a3 hero(hani-ui-v02992.js)와 소개 문장 유지. hover 180ms·dialog 220ms, reduced-motion 예외. AA를 위해 글자/배지 배경과 글라스 불투명도 강화. 모바일 긴 제목은 2줄 표시, button aria-label에 전체 제목 보존.
- scripts/hani-milestones-grade-ui.test.mjs: 별·MOMENT·필터/정렬·연도·아트·NEW 경계·전체 상세/escape·불변성/쓰기·중복 id·실제 delegated owner DOM fixture 9그룹.
- scripts/hani-milestones-grade-ui.browser.mjs: 390/1440 × porcelain-cream/midnight-black, 각 목록+상세 PNG 총 8장 준비. click·Enter·Space·ESC·배경·포커스·필터·전체 상세·AA·넘침·reduced-motion·write0 검사.
- scripts/hani-milestones-v1.test.mjs: 기존 카드 표현 기대만 compact 카드로 변경. 데이터 검증·저장 보호 회귀 유지.

### 실제 실행한 검증

- 정적 바이트 비교 PASS: Persistence owner 전체(merged/writeBlockReason/persist 포함) 원본과 동일.
- index.html 전체는 승인된 두 문자열 치환 이외 byte-identical: 버전/cache·hero·나머지 EOL 포함 보존.
- 정적 index id 리터럴 중복0. 실제 실행 DOM 중복은 미검증.
- milestone JS direct localStorage/sessionStorage write 호출0. UI 실행 write0은 검사 대기.
- CSS 기존 v3 이전 바이트 전체 동일. 수정 6파일의 원래 CRLF 수와 변경하지 않은 고유 행의 종결자 동일. JS/테스트 LF, CSS·HTML 혼합 EOL 유지. artifacts/ms-collection/static-checks.txt 참조.
- 원격 main은 GitHub connector fetch_commit(main) 응답으로 확인(위 SHA).

### 실행하지 못한 검증 / 남은 위험

다음 세 명령은 node.exe 실행 Access is denied로 시작하지 못함. 테스트 PASS 아님. artifacts/ms-collection/runtime-attempts.txt 참조.

- node --check hani-milestones.js
- node scripts/hani-milestones-grade-ui.test.mjs
- node scripts/hani-milestones-v1.test.mjs

실제 Chrome headless 시작 probe는 GPU process exit -1073741790 / GPU process isn't usable 오류로 종료. Playwright 브라우저 스크립트 미실행, PNG0장. 실제 키보드/모달·AA·390/1440 겹침/넘침·아트 표시 미검증.

단일 시트 milestone-card-sheet-v1.webp는 이 작업 시점 아직 없음. 실제 atlas decode/셀 정렬은 시트 도착 후 확인 필요.

final Candidate가 아니므로 full build/package/One-Pass/HINA/Production read-back 미수행. runtime version 증가는 기능 작업 금지 범위이므로 N/A.

Git 실행 파일 접근 제한으로 status/diff/commit 불가. branch/HEAD는 worktree gitdir HEAD/ref로 확인. 파일만 보존, push·PR·배포 없음.

### 데이터 / 권한 / 공유

- 데이터 구조·보호 키·내부 baseline·Storage/Cloud/schema·저장 owner 변경 없음.
- 기존 저장·편집·삭제 경로 보존. 새 저장 경로 없음. 화면 갱신에만 변경.
- Notion 착수·결과 append 모두 자동 승인 정책 never 거절. 저장 성공/read-back 없음, 갱신 완료 아님.
- Notion 반영 대기: 2026-10-30 Codex, 위 branch/base, B2 collection/native detail 구현, 정적 보존 검사 통과, Node 접근 거부/Chrome GPU 오류로 실행 검증 및 시트 대기, push/PR/배포 없음. 다른 담당·과거 기록을 보존하여 요약만 추가해야 함.
- CURRENT에는 실행 검증 대기 상태만 추가. DECISIONS 변경 없음.

## 다음 담당에게

- 먼저 읽기: 이 인수인계 → hani-milestones.js card/detailSheet/openDetail/start → 전용 tests.
- 다음 한 가지 행동: 서윤이 허용된 환경에서 위 Node 3명령과 아래 browser 실행, Preview 확인.
- browser: node scripts/hani-milestones-grade-ui.browser.mjs <playwright/index.mjs> <browser.exe>
- 출력: browser script의 out 경로 아래 390/1440 × finish 목록 PNG 및 같은 이름-detail.png.
- 시트 도착 후 4×3(각512×734) 크기·11셀 매핑·fallback 실제 표시 확인.
- 실패 수정 후 영향 검사만 재실행. 성공 후 배포 담당에게 기능 파일·증거 인계. 이번 요청은 push/PR·배포 승인 아님.
