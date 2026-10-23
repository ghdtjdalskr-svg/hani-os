# obr3 — 살아 있는 사무실 보완

도연(Codex) · 2026-10-23 KST · 기능 개발 단계 · 기준 `aa7cd35ac964ff339657bf313778f7755f177518` / `hani/office-behavior-redesign`.

정식 216/221 외출의 짧은 체류를 런타임에서 보정했다. 자기 home 행동은 원래 duration을 유지한다. 생활 동행의 시간·목적지·층 가중치도 보완했다. **선택 요건인 평일 하루 3인 동행은 달성하지 못했다(0건).** 원자적 예약·근접 기준·정식 예산을 유지한 결과와 탐색 수치를 아래에 공개한다.

## 기준과 범위

- 원격 `git ls-remote origin refs/heads/main`은 127.0.0.1 프록시 연결 실패. 로컬 origin/main `af2fd6d75aa30947987e45f1e6fd976d49464fe5`, 캐시 main 표시 `2.9.231`, 마지막 UI JS `hani-launch-greeting.js`. 원격 최신성·운영 실제 로딩은 미확인. 지정 작업 기준은 aa7cd35로 유지했고 merge/rebase하지 않았다.
- 작업 트리 표시 버전 `2.9.230` 유지. index·캐시 태그·HANI_DISPLAY_VERSION·mascot·spatial-contract·art-map·카탈로그 JSON·CSS·장소 JSON은 변경하지 않았다. spatial SHA256 `d02426b44c49db169efebd782e110226fd1d719d016bc5912516753f3df8841d` 유지.
- CODEMAP living-office owner를 확인했다. scheduler anchor 누락은 CODEMAP_MISS로 처리하고 실제 createScheduler → plan / blockPlan → reserve → stateAt / snapshot 경로를 추적했다. DOM/renderer/event/timer layer 추가 없음.
- 실제 기능 변경: `hani-office-live.js` 한 파일. 검사: `scripts/hani-office-actions-216.test.mjs`, 신규 `scripts/hani-office-formal-stay-assertions.mjs`, `scripts/hani-office-obr3.test.mjs`. 증거 생성: 신규 `scripts/hani-office-obr3-report.mjs`.
- 별도로 나타난 `scripts/hani-office-lively-record.browser.mjs` 수정은 다른 담당 작업으로 보존했다. 이 작업에서는 해당 파일을 편집하거나 실행하지 않았다.
- storage·Cloud·Supabase·migration 경로 변경 없음. push/PR/Notion/브라우저 실행 없음. 미커밋이며 Preview·배포 완료가 아니다.

## 정식 행동 체류

대상 슬롯을 해당 시각의 presence home과 비교한다. home을 떠날 때만 카탈로그에서 뽑은 시간과 목적지 카드 kind 최소값 중 큰 값을 사용하고 kind 최대값으로 제한한다. 카드에 없는 슬롯은 방별 kind를 추정하며 추정할 수 없으면 45–120초를 사용한다. scene-* 외출은 1.2배다. 자기 home만 사용하는 행동은 seed로 뽑은 기존 시간과 정확히 같다.

FIFO 입장·복귀에서 기다린 시간도 실제 AT_PLACE에 포함한다. 각 참가자의 `back[0].start - out.at(-1).end`가 상한을 넘지 않도록 공통 체류를 제한하고, 최소 공통 체류를 확보할 수 없으면 전체 예약을 거절한다. 가족의 런타임 ceiling·부모 자격 검사·이전 날짜 쿨다운 envelope에도 늘어난 체류를 반영했다. 카탈로그 durationSeconds, family limits, 확률·일일 예산·쿨다운, 원래 time window는 수정하지 않았다. 전체 이동·체류·복귀는 원래 시간 창 안에 들어가야 한다.

장소 범위(초): coffee 60–180 / window 40–120 / sofa 120–300 / board 60–180 / server 45–120 / garden·terrace 90–240 / lobby 30–90 / meeting 90–240. 예를 들어 카드에 없는 `base-roof-view` 목적지는 fallback 45초가 적용된다.

아래 전후 표는 aa7cd35와 현재 코드를 같은 fixture로 실행한 실제 AT_PLACE 최소–최대다. 216은 2026-10-19부터 **208일**, 221은 같은 날부터 **7일**을 재생했다. home 대상은 제외하고 참가자별 체류를 집계했다. 선택된 행동·참가자는 예약 충돌에 따라 달라질 수 있다. 미관측은 0초나 행동 소실을 뜻하지 않는다. 전체 기계 판독 근거는 [obr3-metrics.json](obr3-metrics.json), 표 원본은 [obr3-formal-stays.md](obr3-formal-stays.md).

|카탈로그 / 행동 id|전 AT_PLACE(초)|후 AT_PLACE(초)|후 표본|
|---|---:|---:|---:|
|216/base-arrive-leave|5.00–15.00|30.00–30.00|3413|
|216/base-break|30.00–90.00|45.00–120.00|1267|
|216/base-coffee|30.00–90.00|60.00–90.00|1412|
|216/base-garden-leaf|13.00–19.00|90.00–90.00|7|
|216/base-garden-water|12.00–18.00|90.00–90.00|7|
|216/base-lobby-paper|13.00–20.00|30.00–30.00|12|
|216/base-lobby-parcel|12.00–20.00|30.00–30.00|24|
|216/base-lobby-umbrella|12.00–20.00|30.00–30.00|20|
|216/base-lounge-cushion|12.00–20.00|60.00–60.00|18|
|216/base-lounge-window|12.00–20.00|120.00–120.00|64|
|216/base-lunch|120.00–300.00|120.00–240.00|1057|
|216/base-meeting-erase|14.00–14.00|60.00–60.00|1|
|216/base-meeting-marker|13.00–19.00|90.00–90.00|17|
|216/base-pantry-cup|12.00–20.00|60.00–60.00|10|
|216/base-pantry-tray|12.00–19.00|60.00–60.00|26|
|216/base-roof-view|12.00–18.00|45.00–45.00|6|
|216/base-server-label|12.00–20.00|45.00–45.00|18|
|216/base-server-light|12.00–20.00|45.00–45.00|58|
|216/base-stretch|10.00–20.00|45.00–120.00|1856|
|216/base-walk|20.00–40.00|45.00–45.00|1814|
|216/base-water|10.00–25.00|60.00–60.00|1467|
|216/scene-camera-route|29.32–37.51|125.32–125.51|12|
|216/scene-client-questions|22.95–28.16|114.95–117.16|10|
|216/scene-coffee-menu|25.00–68.71|72.00–107.71|6|
|216/scene-compare-care|20.63–28.99|80.63–81.99|28|
|216/scene-design-handoff|17.61–25.01|149.61–152.01|14|
|216/scene-hani-delegate|25.77–34.73|116.77–125.73|2|
|216/scene-haru-minji-cover|24.24–27.00|79.24–82.00|2|
|216/scene-intake-check|36.16–52.99|117.16–122.99|6|
|216/scene-map-rest|30.89–34.67|124.89–127.67|2|
|216/scene-meme|31.14–52.80|82.14–88.80|28|
|216/scene-mir-context|12.00–20.00|144.00–144.00|11|
|216/scene-owner-label|28.26–36.57|122.26–124.57|8|
|216/scene-priority|32.77–56.73|116.77–125.73|6|
|216/scene-readable-evidence|20.59–28.01|150.59–153.01|6|
|216/scene-rest-bookmark|22.35–29.20|82.35–83.20|6|
|216/scene-review-pair|18.20–28.42|150.20–152.42|6|
|216/scene-roof-selfie|38.92–48.55|124.92–127.55|6|
|216/scene-routing-brief|29.65–49.83|116.65–117.83|28|
|216/scene-scope-banter|32.74–57.53|120.74–125.53|10|
|216/scene-snack-budget|31.63–43.99|80.63–81.99|22|
|216/scene-source-layout|23.00–25.59|149.00–150.59|4|
|216/scene-study-scope|24.18–35.77|120.18–123.77|20|
|216/scene-travel-talk|39.89–49.94|124.89–125.94|4|
|216/scene-update-board|32.90–54.25|120.90–122.25|10|
|216/scene-watch-pick|27.24–49.00|79.24–82.00|6|
|216/sig-seongmin-5|12.00–20.00|45.00–45.00|26|
|221/base-arrive-leave|5.00–15.00|30.00–30.00|69|
|221/base-break|31.00–88.00|45.00–120.00|61|
|221/base-coffee|30.00–90.00|60.00–90.00|62|
|221/base-garden-leaf|16.00–16.00|90.00–90.00|1|
|221/base-lobby-parcel|13.00–13.00|30.00–30.00|1|
|221/base-lounge-cushion|17.00–17.00|60.00–60.00|1|
|221/base-lounge-window|14.00–17.00|120.00–120.00|2|
|221/base-lunch|122.00–299.00|122.00–240.00|48|
|221/base-meeting-marker|19.00–19.00|90.00–90.00|1|
|221/base-pantry-cup|미관측|60.00–60.00|1|
|221/base-server-label|12.00–12.00|45.00–45.00|1|
|221/base-server-light|15.00–18.00|45.00–45.00|3|
|221/base-stretch|10.00–20.00|45.00–120.00|65|
|221/base-walk|20.00–40.00|45.00–45.00|70|
|221/base-water|10.00–25.00|60.00–60.00|58|
|221/night-coffee-chat|12.00–22.00|60.00–60.00|27|
|221/night-ramen|12.00–22.00|60.00–60.00|10|
|221/night-window-view|12.00–22.00|40.00–40.00|46|
|221/scene-meme|34.14–40.80|82.14–88.80|2|
|221/sig-seongmin-5|13.00–13.00|45.00–45.00|1|
|221/weekend-plant-water|15.00–17.00|90.00–90.00|2|

## 동행 시간·장소·층

이 항목은 장소 카드 기반 생활 동행에 적용한다. 승인된 카탈로그의 업무 scene(고객 상담·요구사항 확인 등)과 야간 업무 행동은 기존 자격·시간대를 보존했다.

- 직원 생활 동행은 09:00 이후 출발하고 19:30까지 복귀한다. 따라서 19:30 이후 신규 동행은 0건이다. 저녁 생활 외출은 개인 외출도 카페·팬트리·소파 라운지만 선택한다.
- 07:00–09:00 생활 외출은 카페·팬트리 coffee 카드만 선택한다. 방문객은 별도 업무 경로를 보존한다.
- 상담실 consult와 reception 슬롯이 있는 카드는 모든 직원 생활 외출에서 제외했다. 초기 감사에서 상담실로 가는 개인 외출과 home 직원 간 29.9px 접근이 1건 발견되어 이 업무 장소 제외를 보완했다. 정지 20px / 이동 24px의 기존 예약 기준은 변경하지 않았다.
- 개인 외출의 기존 같은 층 가중치 5배는 보존했다. 동행은 같은 층 12배 / 다른 층 0.35배(약 34:1)로 차등하고, 다른 층 동행은 사람별 하루 최대 2회로 제한한다. 이미 예약된 정식 그룹 층 이동도 그 예산에 포함한다. 개인 외출 빈도·장소 다양성 기준은 유지한다.
- 모든 참가자 고유 슬롯·0–3초 출발·door FIFO·소집 시 전체 취소·floor capacity·600초 개인 쿨다운은 기존 reserve 경로로 검증한다.
- 회장님은 human_user이므로 직원 생활 외출 초대 대상에서 제외한다. MIR도 기존대로 제외한다. 정식 카탈로그의 회장님 행동·명시 재실·예약 좌석·마스코트는 보존한다. 상담실 제외 후 달라진 생활 외출 일정이 218의 23:00 회장님 좌석 검사를 깨뜨려 이 대상 경계를 바로잡았고, 해당 원래 기대값을 유지한 재검사에서 통과했다.

2026-10-19~25 7일의 생활 동행 분포:

|시간대|동행 예약 수|다른 층 동행|장소별 예약 수|
|---|---:|---:|---|
|00:00–07:00|0|0|없음|
|07:00–09:00|0|0|없음|
|09:00–11:30|18|3|팬트리 라운지 6, 협업 회의실 6, 개발실 소파 3, 옥상 테라스 2, 카페 좌석 1|
|11:30–13:00|20|6|팬트리 라운지 7, 협업 회의실 4, 개발실 소파 4, 카페 좌석 4, 옥상 테라스 1|
|13:00–19:30|40|8|팬트리 라운지 16, 협업 회의실 7, 카페 좌석 6, 개발실 소파 6, 릴리스 회의실 4, 임원 회의실 1|
|19:30–24:00|0|0|없음|

전체 78건 중 다른 층 동행 17건. 개인별 다른 층 동행 관측 최대는 하루 2회다. 상담실·안내대 생활 외출 0, 07시 coffee 이외 생활 외출 0, 19:30 이후 coffee/sofa 이외 생활 외출 0. 출발·종료·참가자·장소 원장은 metrics의 groups에 보존한다.

## 3인 채택: 미달과 원인

|날짜|생활 동행|3인 동행|
|---|---:|---:|
|10/19 월|9|0|
|10/20 화|11|0|
|10/21 수|15|0|
|10/22 목|9|0|
|10/23 금|8|0|
|10/24 토|15|0|
|10/25 일|11|0|

점심에는 seed 관계가 모두 있는 친한 3인 조합의 순위를 20배 보정하고 상위 세 조합까지 시도한다. 그럼에도 실제 예약은 0건이다. 별도 진단에서는 개인 외출을 배치하기 **전**에 5개 친한 3인 조합을 11:30–13:00에 15초 간격으로 우선 시도했다. 평일 5일, 총 **9,000회**에서 역시 0건이다.

- 8,258회는 다음 정식 일정까지의 빈틈이 사전 최소 72초보다 짧아 바로 거절됐다.
- 나머지 후보에서 슬롯 배치별 거절 사유는 이동 후 최소 체류 불가 4,997건, FIFO 전체 복귀/층 상한 1,117건, canonical reserve 거절 22건이다. 이 수치는 한 제안의 여러 장소·슬롯 시도를 포함하므로 9,000과 합산하지 않는다.
- 5일 동안 조합별 가장 긴 점심 공통 빈틈의 범위: 하니·유나·가은 104.39–113.68초, 하루·민지·수연 111.08–113.46초, 서윤·도연·유리 111.72–146.36초, 서윤·유리·아린 152.05–195.99초, 도연·세린·유리 151.95–191.36초.
- 같은 층 팬트리/개발실 소파는 2슬롯이라 3인 예약이 불가능하다. 3슬롯 이상인 카페 좌석·옥상 테라스·회의실·임원 라운지는 3인의 이동·FIFO·1.2배 체류·복귀까지 공통 시간 창에 넣어야 한다. 좁은 빈틈을 통과한 후보도 기존 자원·근접·층 예약 검사에서 거절됐다.

정식 cadence나 약속을 지우거나 체류/근접/원자성 기준을 완화하지 않았다. 평일 3인 ≥1을 PASS로 기록하지 않으며, 선택 요건 미달로 인계한다. 상세 진단은 metrics의 trioProbe/trioCommonGaps에 있다.

## 성능과 검사

독립 Node 측정(2026-10-22, 221 전체 하루): **첫 정식+생활 계획 369.42ms / 웜 snapshot 평균 0.418ms(1,000회)**. 최종 전체 suite의 같은 기준 측정은 **280.48ms / 0.399ms**였다. 기존 <400ms / <3ms 기준을 유지한다. 개발 중 첫 계획 402.0ms로 실패한 실행이 있어, 카탈로그 시간 창 파싱과 home 대상 체류 계산을 메모리에서 재사용하고 성공한 cadence의 불필요한 retry 탐색을 생략했다. 날짜·재실·예약 의미를 바꾸지 않는 계산 재사용이다. 이전 개발 단계의 결과를 최종 PASS로 재사용하지 않았다.

- 최종 전체 명령: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/hani-office-behavior-run-tests.ps1` — **116 tests / 113 PASS / 0 FAIL / 3 browser SKIP**, 103.50초. [obr3-all-tests-final.txt](obr3-all-tests-final.txt).
- 회장님 경계 보완 후 targeted: `$env:OFFICE_SOFT='1'; node --test --test-isolation=none scripts/hani-office-fix-218.test.mjs scripts/hani-office-obr3.test.mjs` — **11 PASS / 0 FAIL**. 기존 lively-v2 8개 기대값도 변경하지 않고 전체 회귀에 포함한다.
- 새 검사 5개: places JSON 중첩 키·값 파일 확장자 문자열 0(오염 예시 검사 포함), 216/221 정식 외출 하한·상한/FIFO 및 home seed duration 정확 보존, 카드 없는 방 추정/미상 45초 fallback, 일주일 동행 시간·금지 장소·층 예산, human 회장님·가상 MIR의 생활 초대 제외와 기존 예약 좌석 보존.
- 216 장기 검사에는 독립 체류 검증 helper를 추가했다. 기존 `duration <= catalog family ceiling`은 실제 체류 증가 요청에 따라 `duration <= 검증된 runtime ceiling`으로 변경했다. home은 원래 ceiling도 계속 검사한다. 실제 목적지별 최소·최대와 seed 원래 시간을 별도로 계산해 검사하므로 ceiling metadata만 믿지 않는다.
- 216의 **97행 208일 도달 PASS**, 120일 가족 예산·쿨다운·경로·확률·배치 PASS(94행 노출, 정식 그룹 97건), 221의 기존 예산·연속 7일 자정 쿨다운·야간 재실·시간 창 PASS. 기존 검증 한도·횟수·거리·다양성·템포·성능 기준 완화 없음.
- 감사: `node docs/drafts/office-behavior-redesign/audit.mjs .` — **54,000 snapshot, frozen 0 / mismatch 0 / stuckSeconds 0 / near30 0**, near24도 0. [obr3-audit.txt](obr3-audit.txt).
- `node --check`(runtime·신규 도구), `git diff --check`, 보호 파일 aa7cd35 대비 diff 0. 장소 JSON 파일 확장자 문자열 0이며 파일 내용도 동일하다. 전체 suite의 closure 검사 **runtime 122 / 상한 128 PASS**, 별도 seed 45개. 실제 Release Package 재구성은 Candidate 담당 단계로 남긴다.
- 검증한 최종 `hani-office-live.js` SHA256: `b1b8b09748f45eee957cb0031d2f7f479882d3d5c762e78d2896b3f95d467e43`. 전체 변경 파일·보호 파일 identity는 [obr3-verified-files.json](obr3-verified-files.json).

## 수용 사항·미검증·다음 담당

obr2의 날짜별 미노출 5건은 서윤 결정대로 수용하고 그대로 보존한다. 당시 3일 합산 소실은 0이었다. 지은 base-coffee(10/22,216), 히나 base-coffee(10/23,216), 가은 base-coffee(10/23,216/221 각 1), 서윤 base-think(10/23,221). 이번 체류 변경에 대해 이전 날짜별 동일 횟수나 행렬을 새로 PASS라고 주장하지 않는다.

실제 브라우저·녹화·모바일·문구 가림·체감·Preview는 서윤 담당으로 미실행이다. 3개 browser SKIP은 화면 PASS가 아니다. main 병합/Pages/운영 버전/최신 JS 로딩/기능 read-back은 미수행. 버전 증가·package build·One-Pass·HINA는 기능 개발 단계에서 N/A(배포 열차 담당의 Candidate 단계에서 필요). Edge Function·서버 설정·배포 순서 추가 사항은 없다.

인수인계: [2026-10-23-office-obr3-codex.md](../../docs/development-history/handoffs/2026-10-23-office-obr3-codex.md). 다음 행동은 서윤의 실제 브라우저 확인과 3인 선택 요건 미달 검토다. Notion은 이번 요청의 명시적 금지로 갱신하지 않았다.
