# 이음 사원 입사 · 구현 및 인수인계

## 작업 식별

- 날짜(KST): 2026-11-12 · 담당: 도연(Codex) · 검토·Git·배포 담당: 서윤.
- worktree `ie290` / branch `hani/join-ieum` / base·HEAD `7769fbe0fedd760f39493af3a97fe7b377977acb` / 표시·캐시 `2.9.289` 유지. Git 명령 없이 HEAD·branch ref 파일을 읽어 확인했으며, 로컬 origin/main ref도 같은 SHA다. 원격 main 최신성·Git diff는 미확인. main 병합·버전 증가·배포 없음.
- 승인 원문: “응 만들어줘”(2026-11-12). 브랜치 작업과 미리보기까지이며 데이터 변경·배포 승인은 포함하지 않는다.
- 상태: **구현·신규 targeted 검증 완료 / 전체 회귀 실행 완료·일부 실패와 차단 인계 / 실제 Preview 미검증**. Edge는 `spawn EPERM`으로 **BLOCKED**, 새 화면 PNG 0개. Release Gate 전체 PASS나 배포 준비 완료를 주장하지 않는다.
- 재개: 이전 실행의 승인된 그림·구현·fixture를 보존하고 남은 검사와 인수인계만 수행했다. 이번 실행에서 그림 재생성 없음.
- Discovery: START-HERE / CURRENT / 다온·윤슬 인수인계·fixture를 읽음. CODEMAP living-office owner 확인; 조직·도감·입사 anchor는 CODEMAP_MISS로 지정 owner 검색 fallback. Risk NORMAL.

## 변경한 내용 / 파일

이음(`ieum`) 사원, 전략기획실(4F), Records & Knowledge Ops, 생일 06-03, INFJ. 하니 전무님 옆 기존 오른쪽 의자 사용. 서윤 팀장은 개발기록·시스템 문맥 멘토이자 비공식 첫 선배. 성격·두 말버릇·회장님 호칭·개구리 캐릭터 캐논을 유지한다.

| 변경 파일 | 내용 |
| --- | --- |
| `hani-main.js` | 기존 team / imageKey / TEAM_PROFILE_META에 추가 |
| `hani-ui-v02992.js` | 기존 프로필·시간대 대사 선택에 추가 |
| `hani-organization-hub.js` | 전략기획실 직원·4F 등록, 기존 조직도·카드·상세 경로 사용 |
| `hani-character-archive-data.js` | 정식 직원 도감·캐논·성격·선후배 관계·외형 연결 |
| `hani-office-live.js` | 기존 HD sprite registry에 신규 직원 연결, 업무·간식·이벤트·생일·대화 3장면 추가 |
| `data/hani-building/spatial-contract.json` | 기존 anchors 326개 보존, 이음 person 등록 |
| `data/hani-building/office-places.json` | desk_ieum / 측면·접근 연결 3점, 기존 장소·행동 참여 |
| `data/hani-building/art-map-v1.json` | 기존 4F 그림 오른쪽 의자 좌석 설명·영역 연결 |
| `assets/data/office-actions-216.json`, `office-actions-221.json` | 기존 두 카탈로그의 사람·참여자·자리 등록 |
| `assets/data/office-tap-lines-v1.json` | 두 말버릇·서윤 선배·하니 전무님 대사 |
| `assets/sprites-v3/manifest-v3.json` | 새 HD atlas 1개 등록, 기존 직원 entry 보존 |
| `index.html` | 기존 haniDesignAssets template에 새 그림 4개 연결; 표시·캐시 태그 보존 |
| `scripts/hani-board-library-build.mjs` | 기존 월간 투표 댓글 builder의 이음 말투 추가; 저장 로직 변경 없음 |

신규 그림 4개:

| 파일 | 크기 | bytes |
| --- | --- | ---: |
| `assets/sprites-v3/ieum.webp` | 1152×1536, 투명 WebP, 기존 144×192 cell / pivot 72,183 / scale 3 | 32,302 |
| `assets/profiles/hani-profile-ieum.webp` | 720×720 WebP | 68,890 |
| `assets/profiles/thumb/hani-profile-ieum-128.webp` | 128×128 WebP | 3,256 |
| `assets/profiles/thumb/hani-profile-ieum-256.webp` | 256×256 WebP | 9,780 |

- 기존 하니·서윤·다온·윤슬과 나란히 놓은 `compare-profiles.png`, `compare-sprites.png` 육안 확인. 이전 실행 생성·회장님 승인 자산을 그대로 사용한다. 추가 desk-mascot·props 그림은 필요하지 않아 만들지 않았다.
- 신규 검증 파일: `scripts/hani-join-ieum.test.mjs`, `.browser.mjs`, `-source.cjs`, `-preload.cjs`, `-release289.cjs`; `scripts/fixtures/join-ieum-delta.json`, `join-ieum-release289-outer.json`.
- frozen exact inverse는 이음 변경 및 이미 존재한 289→288 버전·이력 차이를 기존 oracle 바깥에서만 벗긴다. SHA·exact-once·중복·drift·재적용 거부 검사 포함. 기존 시험 assertion·pin 변경 없음. preview와 신규 raw 시험에는 투영을 사용하지 않는다.
- 재개 후 코드는 신규 raw 시험의 조직도 실제 renderer·기존 직원 보존 검사 보강과, 서윤의 별도 허용 환경에서만 Git oracle를 재실행할 수 있는 preload opt-in을 추가했다. 기본값은 Git 호출 차단이며 이 세션에서는 opt-in을 사용하지 않았다.

## 실행한 검증

| 검사 | 결과 |
| --- | --- |
| 신규 raw 이음 시험 | 16/16 PASS (`unit-test.log`); 명단·main 카드·도감·조직도/팀/직원 상세·경로·실제 걷기·기존 tap cursor·persistent actor·6/3 생일 버튼/대사·6/4 비노출·저장 0 |
| 기존 직원 보존 | roster·sprite entry·tap pool 보존; timer/event/storage/서버 write 호출 수 보존; 기존 anchors 326개·기존 people 객체 보존 |
| 실제 CSS 크기와 decoded alpha | 지도 폭 300/342/390/1000/1280에서 하니·이음 착석 인물 픽셀 겹침 0. 실제 브라우저 화면 PASS 근거는 아님 |
| M9 지정 경로 | 15/15 PASS; join preload 바깥에 원래 polish/link preload를 그대로 적용 |
| save-guard + release-version-layers | 18/18 PASS (10+8), `safety-test.log` |
| 문법 / JSON | 변경 JS·CJS·MJS 11/11 `node --check`; owner JSON 7/7 parse |
| office 전체 | 77/77 명령 실행: 47 PASS / 26 Git 차단 / 1 baseline 차단 / 1 일반 실패 / 2 혼합(Git+성능). runner 보고 814 통과·39 실패·4 skip. 성능 2건 단독 후속 검사는 아래 별도 기록 |
| 관련 회귀 | 158/158 명령 실행: 78 PASS / 14 Git 차단 / 40 환경 차단 / 3 baseline 차단 / 20 일반 실패 / 3 혼합. runner 보고 531 통과·73 실패·6 skip |
| 실제 Edge 1440/390 | BLOCKED, `browserType.launch: spawn EPERM`; 실행 시도 `browser-results.json` |

전체 **235개 고유 명령: 125 PASS / 40 Git 차단 / 40 환경 차단 / 4 baseline 차단 / 21 일반 실패 / 5 혼합**. Node runner가 출력한 합계는 1,345 통과·112 실패·10 skip이며 독립 assertion 개수는 아니다. CLI 시험에는 runner가 파일 로딩을 PASS로 출력해도 최종 exitCode가 실패인 경우가 있어 **명령 판정은 최종 exitCode·실제 오류를 우선**했다. 직접 실행 CLI는 별도 case count가 없을 수도 있다. 미통과를 PASS로 합산하지 않았다.

실패 상세 **151건**의 분류는 일반 실패 40 / Git 차단 67 / 환경 차단 40 / baseline 차단 4다(직접 CLI 실패는 runner 숫자와 별개). 아래 성능 2건은 후속 단독 실행에서 PASS. 기준 표·각 명령 인자·최초/재시도 기록은 `test-results.json`, 실패별 분류는 `regression-summary.json`, 원문 오류 발췌는 UTF-8 `regression-details.log`에 보존했다.

전체 회귀는 Git 명령을 실행하기 전에 차단하는 task preload와 `--test-isolation=none`으로 실행했다. 기본 `node --test`의 child process도 EPERM이므로 격리 없이 실행했다. 필수 인자가 있는 UI 27개는 스크립트의 원래 직접 실행 형식으로 인자를 보정해 재시도했으며 브라우저 EPERM을 확인했다. 앞선 인자 누락/runner 인자 오인 실패를 실제 기능 실패로 유지하지 않고 원래 시도 기록과 함께 보존했다. 브라우저 실행 실패 후 서버를 닫지 않는 옛 모바일 시험 1개는 시작 시각·PID·EPERM 로그가 일치하는 해당 프로세스만 종료했다. 재시도에는 worktree 밖 임시 cleanup preload가 실패한 launch 뒤의 임시 HTTP 서버만 닫고 원래 오류를 다시 던지게 했다. assertion·성공 경로·런타임 소스 변경 없음.

기존 19명 계약 시험은 strict inverse로 이음 추가 전 원문을 검증하고, 신규 20명 실제 실행은 위 raw 시험으로 별도 검증한다. 모든 로그는 테스트용 합성 입력이며 실제 생활 데이터·계정은 사용하지 않았다.

### 일반 실패 / 후속 검사

- office 일반 실패 3건: building206의 3F 그림 `218` vs 옛 기대 `215`; cafe-rest와 lively-v2의 기존 400ms 기준 초과. 후자의 두 시험만 단독 재실행하여 **2/2 PASS**: cafe best 289.87ms(회장님 부재)/339.29ms(재실), lively first best 320.02ms·warm 0.872ms. 원래 실패와 400ms assertion은 보존했다. `performance-cafe-followup.log`, `performance-lively-followup.log` 참조. 최초 office 숫자를 후속 부분 검사로 전체 PASS로 바꾸지 않았다.
- 다온·윤슬: `newstaff-215 --unit` PASS(3그룹), archive 단위 PASS, board 명단·관계·생활 시험 PASS. `newface-217`은 다온 homeSeat가 존재하는데 옛 시험은 undefined를 기대해 실패. staff-floors는 이전 명부/closure/그림 기대값 3건 실패와 실제 브라우저 차단. assertion·고정 pin을 수정하지 않았다.
- 관련 일반 실패는 이음 제거 투영 이후의 기존 기준/fixture/번들 불일치도 포함한다. 예: app216의 procrastination CSS, nav의 procrastination 항목, board-november의 기존 내장 번들 stale, dash의 보고서 19 vs 6, 옛 128/159/160 closure 기대, hero/pin inverse drift, desk mascot 좌표, qa-report-fixes의 fixture/함수 연결, 기존 tasks fixture 등. 범위 밖 런타임·과거 콘텐츠·oracle를 고쳐 통과시키지 않았다.
- 일반 실패가 포함된 관련 파일 전체(성능 office 2개 제외): `hani-app-216-audit`, `hani-board-november`, `hani-brand-heroes-218`, `hani-dash-218`, `hani-desk-mascots`, `hani-fun-chat-fortune`, `hani-fun-top3`, `hani-helper-275-pins`, `hani-helper-bot`, `hani-hero-restore`, `hani-ic-polish-205`, `hani-m9-link`, `hani-mascots-poster`, `hani-nav-groups`, `hani-newface-217`, `hani-ocr-accuracy-224`, `hani-qa-design-b4`, `hani-qa-report-fixes`, `hani-reviewed-release-baseline`, `hani-settings-225-qa-guard`, `hani-staff-floors-214`, `hani-tasks-qa-212`, `hani-ui-203b` (파일 확장자·실패 문장은 summary 참조). 별도 `hani-m9-link` 4건 실패를 과제 지정 `hani-seoyun-m9` 15/15 PASS와 혼동하지 않는다.
- baseline export 미제공 4개: building206-safety, invest-split-safety, investment-research-safety, polish205-safety. 가짜 current snapshot을 과거 oracle로 공급하지 않았다. 서윤이 각 시험의 실제 승인 직전 고정 원문을 준비해야 한다.

### 배포 한도 / 이미지 용량

`package-summary.json`: raw runtime closure **164→168/200 파일**, 기존 dependency 삭제 **0**, 추가는 이음 그림 4개뿐, 누락 **0**, 전체 **19,090,135/25,000,000 bytes**. 이미지 89개 13,185,864 bytes. 이음 그림 4개 합계 **114,228 bytes**. 최대 파일 2,517,599/5,000,000 bytes. package build 없이 실제 closure 계산으로 확인했다.

### 스크린샷·미검증·차단

- 비교 이미지: `compare-profiles.png`, `compare-sprites.png` (화면 캡처와 구분).
- 실제 화면 캡처: **없음**. 재실행 예정은 `office-4f-{1440,390}.png`, `office-tap-{1440,390}.png`, `organization-{1440,390}.png`, `organization-detail-{1440,390}.png` 총 8장. 현 시점 존재하는 PNG로 보고하지 않는다.
- Edge 차단 뒤 다른 경로로 실행 우회하지 않았다. 로그인 gate 숨김·4F PC/폰 겹침·조직도/상세·클릭·오류/404·저장 read-back은 browser helper에 준비돼 있으나 실행 미검증이다.
- office219는 과제에서 기존 실패로 전달되었고, 이번 실행은 Git 차단으로 선행 단계에서 멈췄다. 원래 실패 재현 또는 PASS를 주장하지 않는다.
- building206의 기존 3F 그림 218 vs 215 기대값 불일치가 이음 inverse 이후에도 나타남. assertion·기준 그림을 바꾸지 않았다. building safety는 고정 과거 baseline export 미제공으로 검사 준비가 차단됐다.
- 원격 main 최신성 / Git diff·commit·push / Android / 실제 운영 데이터 / Production read-back 미확인. Candidate Freeze·Build·One-Pass·독립 HINA·main 병합·Pages·버전 증가는 기능 담당 범위 밖으로 N/A.

## 데이터·공유·다음 담당

- `hani_os_life_v23`, 내부 `2.9.15-safe-baseline-bootstrap`, 기존 storage/Cloud write·schema·auth·복구 경로 유지. 새 저장 키·write·migration·서버 Edge Function·설정 배포 없음.
- 시험 부산물 **기존 JSON 7개 원문 복원·신규 시험 JSON 7개 제거** 완료(`restoration.json`). 시작 파일 **1,993개 바이트 보존**, 범위 밖 잔여 변경 **0**, 이음 owner **14개 frozen after SHA 일치**, 기존 시험 **276개 바이트 보존** 확인. 실행 임시 폴더·backup·전체 로그는 worktree 밖 `%TEMP%/hani-ieum-qa-*`에 둔다. 이번 재개에서 코드 변경은 신규 이음 시험과 task preload 2개뿐이며 이전 런타임·이미지 구현을 그대로 보존했다.
- Notion [HANI-86](https://app.notion.com/p/415c5275707481b99d00f36a55cf9f87) 기존 착수 기록은 읽기 확인. 재개 기록 append는 자동 승인 검토에서 `MCP tool call requires approval, but approval policy is never`로 거절되어 미반영. 저장/read-back 또는 카드 상태 갱신 완료가 아니다. 서윤이 본 보고서 링크·검증 결과·Edge/Git 차단과 탑승 상태를 갱신해야 한다.
- CURRENT·DECISIONS 및 다른 담당 인수인계는 변경하지 않는다. 본 보고서가 이번 작업의 단일 인수인계다. branch push 전이므로 배포 열차 탑승 완료로 표시하지 않는다.
- 다음 행동: 서윤이 차단된 Git/Edge 검증, 실제 화면 검토와 부산물 복원·변경 범위 검토를 수행한 뒤 commit/push 및 열차 인계. 대표님 Preview 확인·배포 승인은 별도. 서버 배포 순서 의존 없음.

## 서윤이 돌려야 할 명령

실행 위치는 이 worktree. 처음 두 명령은 preload 없는 raw 상태에서 실행한다. Edge 기본 경로와 Playwright 모듈 경로는 helper에 있으므로 별도 설치가 필요하지 않다. 성공 시 위 8장과 `browser-results.json`을 확인한다.

```powershell
node --test --test-isolation=none scripts/hani-join-ieum.test.mjs
node scripts/hani-join-ieum.browser.mjs
```

다음은 **서윤의 Git 호출이 별도 허용된 환경에서만** 실행한다. `HANI_IEUM_ALLOW_GIT=1`은 이번 Codex 세션에서 사용하지 않았다. 기존 frozen 계약에 이음 추가와 기존 289 버전 차이를 exact inverse로 투영하며, assertion은 그대로 실행한다. 이 환경은 raw Preview 서버에 사용하지 않는다.

```powershell
$savedNodeOptions = $env:NODE_OPTIONS
$savedIeumGit = $env:HANI_IEUM_ALLOW_GIT
$savedOfficeSoft = $env:OFFICE_SOFT
try {
  $env:HANI_IEUM_ALLOW_GIT = '1'
  $env:NODE_OPTIONS = '--require=./scripts/hani-join-ieum-preload.cjs'
  $env:OFFICE_SOFT = '1'

  # 고정 과거 baseline export 후 office 전체. 이 스크립트는 Git을 호출함.
  powershell -NoProfile -File scripts/hani-office-behavior-run-tests.ps1

  # 과제 지정 M9 명령 그대로, NODE_OPTIONS에서 이음 외층만 추가.
  node --require ./scripts/hani-m9-polish-preload.cjs --require ./scripts/hani-m9-link-preload.cjs --test --test-isolation=none scripts/hani-seoyun-m9.test.mjs
  node --test --test-isolation=none scripts/hani-save-guard.test.mjs scripts/hani-release-version-layers.test.mjs
  node scripts/hani-newstaff-215.test.mjs --unit
  node scripts/hani-newface-217.test.mjs

  # 기록된 인자 그대로, 아직 통과하지 못한 관련 명령 전부 재실행.
  $cases = Get-Content -Raw -Encoding UTF8 artifacts/join-ieum/test-results.json | ConvertFrom-Json
  foreach ($case in $cases) {
    if ($case.group -eq 'related' -and $case.status -ne 'PASS' -and $case.status -ne 'BASELINE_BLOCKED') {
      $retryArgs = @($case.args)
      & node @retryArgs
    }
  }
} finally {
  $env:NODE_OPTIONS = $savedNodeOptions
  $env:HANI_IEUM_ALLOW_GIT = $savedIeumGit
  $env:OFFICE_SOFT = $savedOfficeSoft
}
```

baseline 차단 4개 중 building206-safety는 위 office 스크립트가 고정 원문을 export한다. 나머지 3개는 임의 현재 파일로 대체하지 말고 해당 기능의 승인 직전 원문을 먼저 준비한 뒤, 위와 같은 legacy projection 환경에서 다음 인자를 전달한다: `node scripts/hani-invest-split-safety.test.mjs <raw-baseline-directory>`, `node scripts/hani-investment-research-safety.test.cjs <baseline-hani-main.js> <baseline-index.html>`, `node scripts/hani-polish-205-safety.test.mjs <raw-baseline-directory>`. 이 원문은 Git 금지 환경에서 새로 추출할 수 없어 준비·실행 차단 상태로 인계한다.

재실행 후 시험 부산물만 복원하고 변경 대상을 확인한 뒤 commit/push한다. 새 Candidate·버전 증가·main 병합·배포는 별도 승인 범위다.
