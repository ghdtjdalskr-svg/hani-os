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

## helperoff3 (main297 재층)

- 2026-11-14 KST / 도연·Codex. 로컬 main297+#513 `22fedb33cbd67923cc499ba99f55e8902a66ecb2`, 착수 HEAD `92e2fae663732a38bb8c8a10182900b2615407cf`(merge commit). Git 명령·원격 새 조회 없음.
- **도우미 inverse → 297 version/history → 치비3 → 296 → 디자인1 → 295 이하**로 연결. 296/design source 두 파일의 충돌 본문은 main 치비3 연결로 복원, 297 source 앞에 도우미 preload 한 줄, helper/fun 시험은 297 preload 입구로 이동. 운영 delta 추가 수정·기존 단언 삭제/완화·숫자/hash 교체 없음.
- 두 helper owner의 main297 원문이 frozen main296과 바이트 동일해 `helper-toggle-delta.json`과 source의 기존 base provenance·모든 pin을 유지. 별도 고정 #513 객체와 exact inverse/Buffer 결과 일치 확인. 기존 시험315개·fixture115개 원문/단언 보존, 신규 helper 시험·브라우저 원문도 보존. 운영511파일 착수 이후 추가 변경0, raw closure **173→173·누락0**. [297 보존 감사](helperoff3-audit.json).
- **비Git85파일 / 908PASS·기존동일6FAIL·skip3·새 회귀0**. 독립 main297 원본 helper/fun을 실행해 모든 하위 시험 상태·집계를 대조. `run.ps1`은 기존6실패로 exit1, `summarize.cjs`와 `helperoff3-audit.mjs`는 exit0. #513 전체 비Git81파일 **868PASS·0FAIL·skip1**, office46파일 **610PASS·0FAIL·skip1**, `office-kids-weekday` **19/19**, 297 **6/6**, 치비3 **12/12**, helper toggle **8/8**. [집계](summary.json).
- JS11파일 syntax·PowerShell2파일 parser PASS. Git27파일·브라우저 전용4파일은 실행하지 않음. Edge·새 PNG·Preview·Candidate·commit/push·배포·Production read-back 미실행, 표시/cache297 유지(버전 증가는 시험/도구 전용으로 N/A). 새 로그·독립 baseline 사본은 `local/`에만 저장, 기존 서윤의 390/1440 PASS·PNG는 보존하며 이번 297 재층의 실제 브라우저 PASS로 재사용하지 않음.
- **서윤 후속:** 두 source의 본문은 해결했으나 Git index는 미조회·미처리. `docs/development-history/CURRENT.md`의 기존 양쪽 기록 충돌 마커는 별도로 남아 있고 원문을 수정하지 않음. 공통 현황 최종 병합과 Git 처리는 서윤 담당. 이전 `audit.mjs`·`baseline.json`은 main296 최초 기록이므로 이번 검증에는 아래 새297 감사를 사용.

서윤 실행 명령(저장소 루트, Git·Edge 실행과 별도):

```powershell
node scripts/hani-helper-toggle.test.mjs
& ./artifacts/helper-toggle/main297-baseline.ps1
& ./artifacts/helper-toggle/run.ps1 # 기존 helper/fun 6실패 때문에 exit1 예상
node artifacts/helper-toggle/summarize.cjs # 새 회귀0이면 exit0
node artifacts/helper-toggle/helperoff3-audit.mjs
```

Notion 현황판·기존 helperoff 카드 읽기는 성공했으나 착수 추가가 자동 승인 검토의 `MCP tool call requires approval, but approval policy is never`로 거절되어 이번 결과는 미반영. [helperoff3 인수인계](../../docs/development-history/handoffs/2026-11-14-helper-toggle-main297.md)에 갱신 대기 내용 보존. 서버 Edge Function·설정 배포 의존성 없음.
