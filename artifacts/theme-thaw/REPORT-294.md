# THAW · main293 재정비 / 294 인계

2026-11-13 KST · 도연/Codex · `hani/theme-thaw`. 전달·로컬 main `e1f3ac7`, 병합 HEAD `4701b58` 확인(객체/ref 읽기만). 원격 새 조회 없음. **이번 운영 수정 0, 표시/cache 2.9.293 유지, 미커밋·미배포.**

## 변경·층 구조

- 새 시험 파일: `scripts/hani-theme-thaw-source.cjs`, `hani-theme-thaw-preload.cjs`, `hani-theme-thaw-source.test.mjs`, `fixtures/theme-thaw-main293-delta.json`.
- 연결점: `hani-chibi-pack-1-source.cjs`, `hani-release-version-layers.cjs`, `hani-m9-polish-preload.cjs`, `hani-chibi-pack-1-release293.test.mjs`의 입력 reader. `hani-theme-thaw.test.mjs`는 기존 10개 보존 + 11월/12월 렌더 2개 추가. 기존 단언·숫자·hash 교체/완화 없음.
- **THAW → 293 버전/연혁 → 치비 → 292 버전/사무실 → 291 contrast → 290 이음 → 기존 층**. JS 추가 4곳 exact inverse·CSS 끝 suffix exact inverse. 독립 main 원문 바이트·Buffer·변조 거부 검증.
- closure resolver/숫자를 바꾸지 않고 fetch 참조만 정확히 되돌려 새 자산 3개를 제거: **171 → main293 168 → frozen289 164, 누락 0**. 운영 171파일과 기존 fixture 110개 보존([감사](audit-294.json)).
- 홈은 기존 `renderHome`/`showView`에서 `homeActions` 뒤 persistent 슬롯 갱신. Care/Study/UI owner가 이 슬롯을 삭제하지 않음. 291 contrast 뒤 THAW CSS 순서 유지, 컬렉션 내부 selector만 사용. 병합 문제 미발견.
- 이 폴더 `browser.mjs`와 실행/감사/집계 도구·증거, 작업별 인수인계 갱신.

## 시험

**99파일: 956 PASS / Git 차단 단언 31 / skip 4 / 비Git 실패 0.** 별도로 Git 조회로 시작 자체가 차단된 5파일 포함. 사무실은 **73파일 전부 실행: 791 PASS / Git 차단 단언 29 / skip 3**. 완전히 통과한 파일은 전체 71, 사무실 46. Git 미검증 파일 28개의 이름·단언은 [evidence-294.json](evidence-294.json)의 `results[].gitRequired`에 보존.

THAW 기능 **12**, inverse/closure/owner **3**, 중앙 release **11**, M9 **15**, 이음 **17**, save-guard **10**, 치비 **10+6+3**, 생활 **5**, newsroom285 **2**·288 **7**, app216 **7**, cleanup **12**, street **10+1** PASS. history unit·theme-white·디자인 시스템 계산도 통과. cafe cold plan의 기존 **400ms** 제한 유지·PASS. 기존 실패 목록 코드는 미수정. 개수를 출력하지 않는 static 성공 6파일은 956에 합산하지 않음.

일반 `node --test`는 sandbox child spawn EPERM으로 시작 불가. 파일별 직접 실행 및 THAW `--test-isolation=none` 15 PASS로 검증. 새/변경 JS 도구 syntax 12/12. 운영·버전·새 저장 키/값·write·보호 키·Cloud/schema·내부 버전 변경 0. 타 작업 시험 JSON 4개 원문 복원·신규 4개 정리.

## 지금 보이는 것

**11~12월 홈 홍보는 없음. SEASON에는 THAW 그림·팔레트·출시일과 잠긴 “Coming soon · 출시 예정” 행이 이미 보임.** 적용 비활성·다시보기 숨김·발표 열기 차단. 따라서 “티저 전 어디에도 안 보임”은 현재 구현과 다름. 이번에 노출 정책은 변경하지 않음.

1/8 09:00 KST 홈 티저(D-31, 1/10은 D-29) → 2/8 09:00 출시/발표 → 2/15 09:00 홈 홍보 종료. 종료 후 SEASON 적용·다시보기 유지. 적용은 기존 **Alpine Blue × Spring**이며 전용 저장값 미도입.

## fetch·seed 판단

초기 `void loadThemeCollections()` → **`fetch("./hani-theme-collections.json")`** → JSON의 `art`/`mobileArt` → `<picture>`의 `img src="./assets/theme-collections/thaw-2027q1/teaser-wide.webp"` / `source media="(max-width:600px)" srcset="./assets/theme-collections/thaw-2027q1/teaser-mobile.webp"`. 문서 루트 기준, JSON은 날짜와 관계없이 읽고 그림은 lazy. 읽기 실패 시 기존 테마 유지.

**정적 코드상 별도 seed PR이 필수인 근거 없음.** 기존 closure가 literal fetch→JSON→그림2를 수집하고 package는 candidate commit에서 세 파일을 포함함. 현재 One-Pass의 base 읽기는 HTML/JS/CSS 대상이므로 새 JSON/WebP는 해당하지 않음(과거 새 JS 선반영 사례와 구분). 운영 절차상 seed를 택한다면 JSON+그림2만 먼저 넣을 수 있으나 이번에 수행하지 않음. 실제 candidate package 포함·Pages 200 응답은 배포 담당 확인 필요.

## 서윤 실행

```powershell
git diff --check
node --test scripts/hani-theme-thaw.test.mjs
node --test scripts/hani-theme-thaw-source.test.mjs
node scripts/hani-history-226.test.mjs --unit-only
$e = Get-Content -Raw -Encoding UTF8 artifacts/theme-thaw/evidence-294.json | ConvertFrom-Json
$e.results | Where-Object { $_.gitRequired } | ForEach-Object { node --test "scripts/$($_.file)" }
node artifacts/theme-thaw/browser.mjs "<playwright/index.mjs 절대경로>" "<msedge.exe 절대경로>"
```

Git 검사는 외부 preload/가드 없이 실행. 브라우저는 **12/20·1/10·2/9·2/20 각 12:00 KST × 1280/390**. `294-*.png` 20장·`browser-status-294.json` 출력, THAW 수동 적용 전 쓰기 0·기존 navigation 쓰기 분리·수동 적용 기존 2키만·보호 데이터/24조합/ESC·포커스/넘침/반응형 그림 응답 검증. **스크립트 준비·syntax만 완료, 실제 Edge/PNG는 미실행.** 이전 280 화면 증거 재사용 없음.

로컬 재현: `./artifacts/theme-thaw/run-294.ps1`(Git/Edge 차단), `node artifacts/theme-thaw/audit-294.mjs`. Candidate build/One-Pass/HINA·Android·오프라인 캐시·Production은 미검증/후속 단계. commit/push/merge/버전 증가/배포 없음.

Notion 착수 append는 자동 승인 검토가 `approval policy: never`로 거절해 미반영. 완료 요약과 다음 행동은 [인수인계](../../docs/development-history/handoffs/2026-11-13-theme-thaw-294.md)에 보존, 서윤 갱신 대기.

## JSON 위치 이동

2026-11-13 KST · 도연/Codex · `hani/theme-thaw`. 승인 원문 `../thaw-move-task.md` 전체 UTF-8 정상 확인. **이번 이동의 최신 결과는 이 절을 기준으로 하며, 위의 루트 JSON fetch·seed 판단은 이동 전 기록이다.** 전달·로컬 main `bcc588ba634cc28ca9922210153f1cffec6d9e91`(#502 포함), 착수 HEAD `0e8f385df27d9518620e65e8a03150ff1c61b077`를 기존 객체 reader로 확인했다. Git 명령·원격 새 조회·main 재병합 없이 작업했다. 아래 증거는 미커밋 작업 폴더 기준이며 frozen Candidate가 아니다.

### 변경 파일과 동작

- 새 운영 파일 `assets/theme-collections/collections.json`: 루트 JSON을 복사하고 `art`/`mobileArt`만 `thaw-2027q1/teaser-wide.webp`·`thaw-2027q1/teaser-mobile.webp`로 변경했다. **루트 `hani-theme-collections.json`은 삭제·수정하지 않았고 main bcc588b 원문과 동일하다.** 그림 2장도 보존했다.
- `hani-main.js`: 기존 `loadThemeCollections`에서 문자열 리터럴 **`fetch("./assets/theme-collections/collections.json")`**로 읽는다. `response.url`(주입 응답에 URL이 없으면 `document.baseURI`로 만든 요청 JSON URL)을 기준으로 `new URL(art, jsonUrl)`·`new URL(mobileArt, jsonUrl)`을 적용한 메모리 복사본을 기존 renderer에 전달한다. Pages 하위 경로·응답 URL·주입 fallback·오류 시 기존 컬렉션 보존·실제 picture의 두 속성을 시험했다. DOM/event/render layer 추가 없음.
- `assets/data/hani-history-releases-v1.json`: 맨 위 v2.9.294의 title은 **`THAW · 해빙의 정원 예고`**(16자), `source.subject`는 **`release: v2.9.294 THAW · 해빙의 정원 예고`**로 바꿨다. 다른 값·항목·형식·BOM 유무·줄바꿈 보존을 전체 바이트로 검증했다.
- THAW 시험 층: `scripts/hani-theme-thaw-source.cjs`, `scripts/fixtures/theme-thaw-main293-delta.json`, `scripts/hani-theme-thaw.test.mjs`, `scripts/hani-theme-thaw-source.test.mjs`. 새 THAW fixture를 bcc588b에 고정하고 이동 후 JS/JSON 및 294 연혁 metadata의 exact inverse를 연결했다. 기존 다른 시험 281파일과 다른 fixture 110개는 **바이트 동일**하며 기존 단언·숫자·hash를 바꾸지 않았다.
- `artifacts/theme-thaw/browser.mjs`: 기준 identity·새 JSON 경로·응답 확인을 갱신했다. 4시점×1280/390 실행 흐름은 유지했다. **실제 Edge·새 PNG는 미실행**이다.
- 새 검증 도구·증거: `run-move-294.ps1`, `audit-move-294.mjs`, [evidence-move-294.json](evidence-move-294.json), [audit-move-294.json](audit-move-294.json), `logs-move-294/`, `history-unit-move-294.json`, `street-package-check-move-294.json`. 이 보고서·전용 인수인계·CURRENT에 결과를 기록했다. 타 시험이 갱신한 JSON 4개는 원문 복원하고 새 street package 증거는 THAW 폴더로 옮겼다.

### Closure와 보존

**기존 raw 171 → 이동 후 raw 171(증감 0), JSON 1 + WebP 2 모두 포함, 누락 0.** `scripts/hani-runtime-closure.mjs`의 원래 수집기를 그대로 호출했다. THAW inverse 후 main293 **168**, 기존 frozen289 **164**, 모두 누락 0이다.

```text
assets/theme-collections/collections.json
assets/theme-collections/thaw-2027q1/teaser-mobile.webp
assets/theme-collections/thaw-2027q1/teaser-wide.webp
```

루트 JSON은 closure에서 빠졌다. 새 JSON 안 그림 경로 2개를 JSON 폴더 기준으로 수집하며, 위 세 경로가 기존 `allowed_paths`에 모두 맞는다. **게이트 계약과 closure 수집기 수정 0.** 실제 package·One-Pass PASS를 뜻하지는 않으며 이 단계는 미실행이다.

착수 2,275파일 snapshot 대비 허용한 파일 외 변경·신규 파일 없음. 기존 storage write 표현식·보호 키·내부 데이터 버전·Cloud/schema·index.html·표시/cache **2.9.293** 보존. 새 저장 키/값·write·migration 없음. 버전 증가 검증은 기능 담당/이번 명시적 금지에 따라 N/A이며, 연혁의 기존294 번호도 바꾸지 않았다.

### 시험 결과

지정 패턴 **87파일 중 비Git 60파일 전부 성공**, **729 PASS / 0 FAIL / 1 skip**. Git 필요 **27파일은 목록만 남기고 파일 전체를 미실행**했다. 이전 보고서의 부분 Git 차단 실행·추가 시험을 이번 수에 합산하지 않았다. 실제 Git/Edge 실행 및 가드 차단 시도 0.

| 묶음 | 실행 결과 |
| --- | --- |
| THAW 기능 / inverse·closure·owner·metadata | 13 + 4 PASS |
| office 73파일 | 비Git 46파일 610 PASS / 1 skip, Git 27파일 목록만 |
| seoyun-m9 / release-version-layers | 15 / 11 PASS |
| save-guard / join-ieum | 10 / 17 PASS |
| chibi-pack-1 / layers / release293 | 10 / 6 / 3 PASS |
| history-226 --unit-only | PASS, 단언 수 미출력으로 729에 합산 안 함 |
| app-216-audit / qa-easy-cleanup | 7 / 12 PASS |
| street-journal / closure | 10 / 1 PASS |

skip 1은 `hani-office-zoom.test.mjs`의 실제 브라우저 CSS 시험이다. Git 필요 목록 27개와 개별 실행 명령·로그는 [evidence-move-294.json](evidence-move-294.json)의 `gitRequired`·`results`에 보존했다. 다른 시험 단언을 삭제·완화하지 않았다. JS syntax 6/6 및 PowerShell parser PASS. 브라우저·Android·실제 package·One-Pass·HINA·Pages·Production read-back은 미검증이며 commit/push/PR/merge/배포 없음.

### 서윤 명령

```powershell
# 비Git 지정 회귀 재현. Git 필요 파일은 실행하지 않고 목록만 기록한다.
./artifacts/theme-thaw/run-move-294.ps1
node artifacts/theme-thaw/audit-move-294.mjs

# 서윤 환경에서만 실제 Git 검증 및 미실행 27파일 검사.
git diff --check
$e = Get-Content -Raw -Encoding UTF8 artifacts/theme-thaw/evidence-move-294.json | ConvertFrom-Json
$e.gitRequired | ForEach-Object { node --test "scripts/$_" }
node --test scripts/hani-theme-thaw.test.mjs scripts/hani-theme-thaw-source.test.mjs
node scripts/hani-history-226.test.mjs --unit-only
node artifacts/theme-thaw/browser.mjs "<playwright/index.mjs 절대경로>" "<msedge.exe 절대경로>"
```

서윤은 코드·변경 범위·실제 Edge 화면을 확인한 뒤 커밋/열차 절차로 인계한다. 배포 담당은 새 JSON과 그림2가 최종 package에 포함되는지 확인하고 canonical Candidate gate를 진행해야 한다. 서버 Edge Function·설정 변경과 별도 배포 순서는 없다.

Notion의 기존 THAW 작업 페이지는 읽었으나 착수 기록 추가가 자동 승인 검토의 `approval policy: never`로 거절되어 **미반영**이다. 완료 요약·시험·미검증·다음 행동은 [JSON 이동 인수인계](../../docs/development-history/handoffs/2026-11-13-theme-thaw-move.md)에 보존했다. Notion 갱신은 서윤 인계이며 완료로 보고하지 않는다.
