# 하니 스트리트 저널 V1 · 구현 및 검증 인수인계

## 작업 식별

- 날짜: 2026-10-21 KST / 담당: 도연(Codex), 단일 개발자 + 자동 검사. 독립 아린/HINA 검토 아님.
- 상태: 구현·targeted 검증 완료 / 서윤 검수 대기 / 미커밋.
- 저장소: ghdtjdalskr-svg/hani-os, branch hani/street-journal-v1, worktree street-journal-v1.
- base: 331291eb29ec73b2cd5ca3f07eb2d02436e9d1ea + 승인 치비 HEAD f9d1c73add7b91ddf574e9de0ef169c195edbb39. Candidate Freeze 없음.
- 로컬 origin/main 331291e 일치. git ls-remote origin refs/heads/main은 github.com:443 연결 실패로 원격 최신성 미검증. 자동 merge/rebase 없음.
- 로컬 표시 버전/상수 2.9.223 유지. 마지막 외부 script 태그 ./hani-launch-greeting.js, 신규 JS/CSS는 현재 ?v=2.9.223 사용. 브라우저에서 로컬 앱 v2.9.223 표시 확인.
- 목표: 승인 DESIGN-street-journal-v3.tmp.html 시각 디자인과 미션의 입력·무데이터·자동 포즈·보관·PNG·기존 Research 연결 구현.
- 승인 근거: 대표님 직접 요청 + MISSION-street-journal-v1.tmp.md + 2026-10-21 보관 ok. 유일한 새 저장 키 hani_street_journal_v1만 허용.
- 승인되지 않은 경계: 보호 키·기존 save/commit/Cloud·schema/migration·버전 증가·push·PR·main·배포. 모두 수행하지 않음. 미션에 따라 서윤이 검수 후 commit/push하며 .tmp 파일은 커밋하지 않음.

## 결과와 증거

### 변경한 내용 / 파일

- hani-investment-committee.js: 기존 nav owner에 세 번째 persistent panel #icStreetJournal, /journal hash 및 기존 키보드 탭 이동 재사용. researchMatches와 openResearch(key) 추가. ticker 또는 이름으로 정확히 한 카드일 때만 종목 탭을 선택하고 기존 openEditor 호출. 없거나 중복이면 안내와 false 반환. 새 카드/history/monthly 확정본 생성 없음. 새 observer/후행 renderer 없음.
- hani-street-journal.js: HSJ v1 블록 파서(본문 앞뒤 무시, 코드펜스·스마트 따옴표·쉬운 오류 위치), escape 및 http/https source URL, null/빈값과 0 구분, 부호·색·bp, mood/temperature 포즈, 승인된 날짜별 독립 보관, PNG 다운로드. 파싱 실패 시 이전 미리보기/저장 가능 상태를 제거해 이전 판 오보관 방지.
- hani-street-journal.css: 승인 v3 스타일을 .hsj-sheet와 hsj- 클래스에 격리해 앱 전역 .close/.sheet 등과 충돌 방지. max-width 430px, 기존 투자 상승 빨강/하락 파랑 토큰, 실제 사용하는 치비 포즈 10개 정적 URL로 closure 포함.
- index.html: JS를 committee owner보다 먼저, CSS를 기존 committee CSS 다음에 로드. 기존 cache/version 문자열 유지.
- scripts/hani-street-journal.test.cjs: 파서·빈값·포즈·XSS/URL·저장 키 및 쓰기 시점·덮어쓰기/삭제 취소·400상한·손상/권한/용량·실제 openResearch 함수 무변경 검사.
- scripts/hani-street-journal-closure.test.mjs: working-tree closure, 10포즈 포함, 누락0, tmp/docs/tests 배포 제외, 바이너리/텍스트 package 직렬화 byte roundtrip, 기존 파일/총용량/단일파일 한도 검사. Frozen candidate package가 아님.
- scripts/hani-street-journal.browser.mjs: 실제 앱/Edge, 합성 브리핑·합성 state·외부 서비스 차단 환경의 390/1440 화면·PNG·보관·XSS·실제 Research 상세 연결·무쓰기/보호키 감시.
- dev-center/codemap.json: 새 owner, DOM/event, targeted 명령 및 저장 경계 추가.
- docs/development-history/CURRENT.md와 본 인수인계: 결과/미검증/서윤 다음 단계 기록. artifacts/street-journal-v1/: 스크린샷·다운로드PNG·검증 로그/JSON.

### 이미지 저장 방식과 이유

기존 루트 런타임에서 html2canvas/toPng/html-to-image 캡처 유틸을 검색했으나 재사용할 구현이 확인되지 않았다. 외부 CDN과 새 라이브러리 없이 브라우저 기본 SVG foreignObject → Canvas → PNG를 사용한다. computed style과 같은 저장소의 치비 그림을 data URL로 내장하고, 번호·체크·표지 장식도 복제해 2배 해상도 PNG로 다운로드한다. 라이브러리를 vendoring하지 않아 추가 제3자 라이선스 없음. 파일명은 hani-street-journal-YYYY-MM-DD.png. Edge에서 실제 다운로드·PNG signature·dimensions·비투명 픽셀 및 이미지 시각 확인 완료. Safari/Android 실기기는 별도 미검증.

### 실행한 검증

환경: Codex bundled Node v24.19.0, dependencies/node/node_modules/playwright/index.mjs, headless Edge C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe. Node 및 Git은 C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies 아래 실행파일 사용.

1. node --test scripts/hani-street-journal.test.cjs scripts/hani-street-journal-closure.test.mjs scripts/hani-investment-research.test.cjs scripts/hani-investment-committee.test.cjs → 최종 34/34 PASS, 실패0. targeted-tests.log.
2. node scripts/hani-street-journal.browser.mjs <playwright/index.mjs> <msedge.exe> → 390×900 / 1440×900 PASS. browser.log / browser-results.json. console error 각각0, page error0, resource error0. 실제 card 폭358/430px, 내부 및 페이지 가로 넘침0. 실제 PNG 다운로드 후 390:716px, 1440:860px 출력 폭 확인. 앱 Remote는 fixture CSS로 숨겨 저널 검사 간섭만 제외하며 운영 파일 변경 없음.
3. node --check hani-street-journal.js, node --check hani-investment-committee.js → PASS. git diff --check → PASS.
4. package-check.json / closure.json → 128파일, 15,387,186 bytes, 누락0. JS/CSS + 필요한 치비10개 포함, 기존 max_files128 / max_total_bytes25,000,000 / max_single_file_bytes5,000,000 준수. 패키지 한도·gate 코드 변경 없음.
5. git hash-object hani-main.js와 git rev-parse HEAD:hani-main.js 모두 d5135e7785d2349f9c03b0b16c4aa5ebb5777464 → 보호 저장·내부 버전·기존 save/commit/Cloud owner 파일 바이트 불변. committee diff에서도 기존 applyBatch/confirmCommittee/openEditor 저장 본문 변경 없음.

초기 실패 및 수정 이력: 파서의 짧은 JSON 오류에서 V8 위치를 주지 않는 경우 끝 줄/글자 안내 보완. 실제 390에서 전역 클래스 충돌로 넘침이 생겨 hsj- namespace로 해결. 숨김 Research 부모 안의 dialog가 보이지 않아 기존 selectSection 후 openEditor 경로로 해결. 패키지134파일은 미사용 치비6개 참조를 제거해128파일로 해결. 테스트 서버의 trailing path 및 fixture 선택자 오류도 수정 후 위 명령 전체 재실행. 원격 ls-remote 연결 실패는 여전히 미검증으로 유지.

### 스크린샷

- artifacts/street-journal-v1/street-journal-390.png / street-journal-1440.png: 실제 앱 전체 화면.
- artifacts/street-journal-v1/card-390.png / card-1440.png: 실제 카드 캡처 보조 증거.
- artifacts/street-journal-v1/export-390.png / export-1440.png: 실제 이미지로 저장 버튼으로 다운로드한 PNG. 모든 데이터는 합성 예시이며 실제 시황/개인 보유 원본이 아님.

### 저장 안전 증명

- 새 모듈 소스에는 hani_os_life_v23, save(), commit(), writeProtectedState(), Supabase/Cloud 호출, removeItem/clear, MutationObserver가 없음(정적 보조 검사).
- 주입 Storage spy는 모든 getItem/setItem 키가 hani_street_journal_v1인지 assertion. read/render/실패parse 쓰기0, 명시 보관/확인 삭제만 setItem. 400개 초과 시 저장 거부/기존 bytes 불변, 자동 삭제0. 덮어쓰기/삭제 취소도 원문 bytes 불변.
- 실제 브라우저는 정상 앱 초기 진입 후 Storage.prototype getItem/setItem/removeItem/clear를 가로채 protected 키에 접근하는 순간 예외 발생. 저널 탭 진입·파싱·PNG·Research 클릭·보관/덮어쓰기/삭제/손상·탭 재진입 전 범위를 감시했고 실제 접근 키는 양쪽 폭 모두 hani_street_journal_v1 하나뿐. 정상 앱 초기 로드 자체의 기존 보호키 읽기는 저널 무접근 주장 범위 밖.
- Research 클릭 전후 cards/history/snapshots JSON을 동일 비교. 정확히 한 카드에서만 기존 실제 dialog 표시, 중복/없음 시 생성0.
- 손상된 보관값 {damaged는 저장 시도 후에도 그대로이며 붙여넣기·미리보기 정상. 읽기 실패·용량/권한 오류를 사용자에게 안내하고 기존 저장값 초기화 없음.

### 미검증 / 남은 위험

- 원격 main 최신성(네트워크 실패), 실제 사용자 로그인/Cloud/운영 원본, Android/Safari 및 다른 브라우저 PNG, 장시간/다중 탭 동시 보관은 미검증.
- 이미지는 아주 긴 브리핑에서 브라우저 Canvas 최대 크기/메모리 한도 영향을 받을 수 있음. 변환 실패 시 안내하며 저장 원본에는 영향 없음.
- 현재 package 파일128/128: 열차의 추가 runtime 파일·자산 포함 시 한도를 다시 확인해야 함. 한도 확대/우회 승인으로 간주하지 않음.
- Candidate Freeze·full build·One-Pass·독립 HINA/아린·Preview 최종 승인·운영 PR/main/Pages/read-back은 이 기능 패치의 완료 범위가 아니며 미수행. runtime 배포 완료 아님.

## 다음 담당에게

- 서윤: 본 인수인계와 browser-results/package-check 및 두 폭 화면/PNG를 검수. 승인 범위 내 변경만 commit/push해 열차에 통합하고 .tmp 3개는 제외.
- 함께 배포할 Edge Function/설정 없음. journal CSS/JS를 현재 index 참조와 함께 포함. 최신 main 기능 충돌은 담당에게 반환하고 파일128한도 재확인.
- 대표님에게 필요한 새 데이터 승인 없음. 열차 Preview·최종 배포 승인은 별도 유지.
- CURRENT 요약 추가. Notion https://app.notion.com/p/400c527570748138b8dbed3c36fa259e 에 시작 기록 저장 후 read-back 확인, 완료 기록 갱신 결과는 아래 후속 기록.

### Notion 완료 기록 갱신 대기

- 시작 페이지 생성 및 fetch read-back은 성공. 완료 요약 insert_content 호출은 자동 승인 검토에서 `MCP tool call requires approval, but approval policy is never`로 거절되어 미반영. 추가 승인 요청이나 우회 호출은 하지 않음.
- 갱신 대기 내용: 위 구현·Node34/Edge2폭·저장안전·128파일 package 결과, 원격main/실기기/열차 미검증, 서윤 검수 후 commit/push/열차 및 .tmp 제외 조건 전체.
- 로컬 CURRENT/인수인계는 최종 결과를 보존. Notion 완료 요약은 권한 가능한 담당이 본문 근거로 갱신 후 읽어 확인해야 함.
