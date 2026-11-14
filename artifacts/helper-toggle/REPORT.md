# 도우미 끄기/켜기 · 서윤 인계

도연 / Codex, `hani/helper-toggle`, base `7a91982de08a54452f6b9057f906d651f63a65ca` (로컬 HEAD/origin/main 파일·객체 읽기 확인, 원격 새 조회 없음). Git·Edge·버전/cache 증가·merge·배포 없음.

- 운영: `hani-ui-v02992.js`, `hani-style-08.css` 두 파일만 변경. 도우미 home 맨 아래 ‘도우미 숨기기’와 설정 → ⑤ 화면·연결 설정 → ‘도우미 표시’ 스위치. 기존 click 위임·place 경로 사용, 로그인/모달 gate 유지. 기존 토스트 재사용.
- 저장: JS **1636줄** 키 선언, **1639줄 읽기**, **1656줄 쓰기**, **1819줄 시작 시 읽기**. `hani_helper_hidden_v1`만 새 읽기/쓰기, `"1"` 숨김 / `"0"` 표시. 없음·손상·읽기 실패는 켜짐. 위치 키·보호 데이터·Cloud 쓰기 경로 보존.
- 시험 층: `hani-helper-toggle-source.cjs` + `fixtures/helper-toggle-delta.json` + `hani-helper-toggle-preload.cjs`: **토글 포함 원문 → 독립 main296 원문** exact inverse, 변조/중복/재역변환 거절. 기존 release296·design source 입구 및 helper/fun 시험 input import만 연결. 기존 시험312개의 단언·숫자·hash·기존 fixture114개 원문 보존.
- 지원 변경: `scripts/hani-release-296-source.cjs`, `scripts/hani-design-polish-1-source.cjs` 각 require 한 줄, `hani-helper-bot.test.mjs`·`hani-fun-chat-fortune.test.mjs` 각 input import 한 줄. 신규 toggle fixture·source·preload·fixture harness·unit/browser, 이 폴더의 검사·증거·문서 및 작업별 인수인계/CURRENT.
- 신규: `hani-helper-toggle.test.mjs` **8/8 PASS**. 다른 키 쓰기0·Cloud 호출0. 잡담 mount 뒤 버튼 순서·위치/당번/노드 보존 포함. 기존 helper4·fun2 실패는 고정 main296 객체 직접 실행과 subtest별 동일하게 재현했으며 수정하지 않음.
- 회귀: 지정95파일 중 **비Git66파일 / 769PASS·기준선 동일6FAIL·skip3·새 회귀0**. 64파일 성공, helper/fun 두 파일의 기존6실패는 독립 main296과 subtest·집계 동일. office46파일은 **610PASS·0FAIL·skip1**, 신규8/8. Git27파일은 목록만, 지정 기존 실패 settings2파일 제외. [summary.json](summary.json) · [baseline-failures.json](baseline-failures.json).
- 보존 감사: 운영510파일 중 owner2개 외 불변, `hani-main.js`·`hani-street-journal.css`·`hani-design-system.css` 불변, 위치 read/write 원문 동일, raw closure172→172/누락0. [audit.json](audit.json).
- 문법: 최종 JS10/10, PowerShell parser1/1 PASS. raw serving/setup PASS([증거](browser-setup.json)). 미검증: 실제 Edge390/1440·PNG·44px 실측·기기 줌, Git27파일, 원격 최신성, push/Preview, Candidate/HINA·운영 반영. 실제 UI PASS로 표시하지 않음.

서윤 실행 명령(저장소 루트):

```powershell
node scripts/hani-helper-toggle.test.mjs
& ./artifacts/helper-toggle/run.ps1
node artifacts/helper-toggle/summarize.cjs
node artifacts/helper-toggle/audit.mjs
$helperTogglePw = 'C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
$helperToggleEdge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
node scripts/hani-helper-toggle.browser.mjs $helperTogglePw $helperToggleEdge
```

브라우저 명령에는 inverse preload를 넣지 않는다. 격리된 빈 Local 환경에서 390/1440 각각 숨기기 → 새로고침 숨김 → 설정 켜기 → 새로고침 표시를 실행하고 `browser/`에 PNG10장·`browser-results.json`(단계별 쓰기 키 목록/동작 시 새 키만 쓰기)을 저장한다. 위치는 context fixture로 주입하며 운영 계정·Cloud 요청은 차단한다. Git 시험 명령은 [GIT-TESTS.md](GIT-TESTS.md); Git/commit/push는 서윤이 수행. 서버·Edge Function·설정 배포 의존성 없음.

`run.ps1`은 기존 실패6건 때문에 exit1을 반환한다. `summarize.cjs`는 고정 main296과 그 실패·집계가 같고 새 회귀가 없는지 검사한다. 지정된 settings-225 두 파일은 기존 실패 목록에 따라 실행·수정하지 않음.

Notion 착수 기록 생성/read-back 완료. 진행 insert_content는 자동 승인 검토가 `approval policy is never`로 거절하여 미반영. [작업 인수인계](../../docs/development-history/handoffs/2026-11-14-helper-toggle.md)에 최종 요약 갱신 대기 보존.

## 브라우저 실패 정리

- helperoff2 / 2026-11-14 KST, 도연 / Codex. 서윤의 로그인 gate 대기 수정과 모든 시험 단언은 그대로 보존.
- 설정 스위치는 `#app #haniHelperSettings .btn[data-helper-visibility]`의 최소 높이 44px·폭 64px에 `!important`를 적용해 모바일 공통 40px 규칙을 이김. 말풍선 숨기기 버튼은 `#app` 밖이라 해당 공통 규칙 대상이 아니며, `.btn[data-helper-hide]`로 한정해 최소 높이·폭 44px를 지정. 다른 `.btn` 변경 없음.
- 새 CSS에 맞춰 delta의 after 해시와 source의 바깥 fixture pin만 갱신. 독립 main296 원문 exact inverse 및 신규 시험 **8/8 PASS**, 기존 시험312개·fixture114개와 브라우저 시험 바이트 보존. JS/source·PowerShell 문법 및 raw serving/setup PASS.
- `run.ps1` 첫 실행의 빈 결과 목록 dictionary 중복 키 오류를 배열 초기화 한 줄로 보완. 전체 재실행은 **비Git66파일 / 769PASS·기준선 동일6FAIL·skip3**, office46파일 **610PASS·0FAIL·skip1**. 기존6실패로 `run.ps1` exit1, `summarize.cjs`는 독립 main296 실패 목록·집계 일치를 확인해 **exit0 / 새 회귀0**. [요약](summary.json) · [보존·변경 근거](local/helperoff2-checks.json).
- Git·Edge·PNG·버전/cache 증가·배포 없음. 실제 두 버튼 크기 및 390/1440 동작 재검증은 서윤 담당. Notion 후속 기록 추가도 자동 승인 검토의 `approval policy is never` 거절로 미반영이며 [helperoff2 인수인계](../../docs/development-history/handoffs/2026-11-14-helper-toggle-browser-fix.md)에 갱신 대기 보존.
