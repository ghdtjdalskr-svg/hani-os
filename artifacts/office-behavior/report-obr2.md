# obr2 — 살아 있는 사무실 구현·검증 보고서

도연(Codex) · 2026-10-23 KST · 기능 개발 단계. push/PR/main/배포/Notion/실제 브라우저 실행은 하지 않았다.

전체 회귀: **111개 중 108 PASS / 0 FAIL / 3 SKIP**. 브라우저 SKIP은 미실행이며 화면 PASS로 해석하지 않는다.

## 기준·커밋·범위

- branch `hani/office-behavior-redesign`, 작업 기준 HEAD `dae2a419166c0ca9cfee9c57aa128f451f972601`. 비교 운영 기준 `ad3c2f3`(2.9.230).
- 로컬 커밋 **0개**. `git add`와 `git commit`은 `HANI_OS_DEV/.git/worktrees/obr/index.lock: Permission denied`로 실패했다. 사용자 지시대로 미커밋 상태로 보존했으며 우회·권한 변경은 하지 않았다.
- 원격 main 조회는 127.0.0.1 프록시 연결 실패. 로컬 origin/main은 ad3c2f3이며 최신 원격·운영 runtime은 미확인. 로컬 main index 표시 2.9.230, 마지막 JS `hani-launch-greeting.js`(그 앞 `hani-ai-budget.js?v=2.9.230`). merge/rebase 없음.
- CODEMAP living-office owner 확인 후 scheduler anchor 부재를 CODEMAP_MISS로 처리해 실제 `createScheduler/reserve/blockPlan/stateAt/render`만 추적했다.
- `spatial-contract.json`은 326 anchor, SHA256 `d02426b44c49db169efebd782e110226fd1d719d016bc5912516753f3df8841d` 그대로다. 기존 창가 5개는 장소 파일에서 복사본으로 합친다. 이번 작업에서 art-map·homeAnchor·DOM·CSS·index·mascot·표시 버전·cache tag는 수정하지 않았다.
- `HaniBuildingScene` 기존 export 유지. 데이터 저장 경로·Cloud·Supabase 접촉 0. 신규 renderer/event/timer layer 0. 정확한 파일 identity는 `obr2-verified-files.json`.

변경 파일:

- `hani-office-live.js`
- `data/hani-building/office-places.json`
- `scripts/hani-office-behavior-data.mjs`
- `scripts/hani-office-lively-data.mjs`
- `scripts/hani-office-actions-216.test.mjs`
- `scripts/hani-office-actions-221.test.mjs`
- `scripts/hani-office-behavior.test.mjs`
- `scripts/hani-office-behavior.browser.mjs`
- `scripts/hani-office-fix-218.test.mjs`
- `scripts/hani-office-lively.test.mjs`
- `docs/drafts/office-behavior-redesign/audit.mjs`
- `scripts/hani-office-lively-v2.test.mjs`
- `scripts/hani-office-lively-fixture.mjs`
- `scripts/hani-office-place-assertions.mjs`
- `scripts/hani-office-lively-metrics.mjs`
- `scripts/hani-office-character-actions.mjs`
- `scripts/hani-office-lively-record.browser.mjs`
- `scripts/hani-office-lively-report.mjs`

## 상태기계·예약 수정

- blockPlan의 이름과 호출 계약은 보존하고 예약 지평을 하루로 바꿨다. 인덱스 0과 143은 같은 예약 배열을 반환한다. 총 30초 제한 및 10분 경계 잘림 제거.
- 장소 affinity·atByPerson·시간대 가중치·관계 score는 정적 장소 JSON에서 읽는다. 런타임에 사람별 취향을 하드코딩하지 않는다. 관계 점수가 높은 조합을 더 자주 제안한다.
- 두 사람 이상은 각자의 고유 슬롯·출발·체류·FIFO 복귀를 하나의 candidate로 만든 뒤 reserve 한 번으로 전부 수락 또는 전부 거절한다. 출발 0–3초 차이, shared door/path의 실제 점유 구간 독점. 한 사람 소집/취소 시 그룹 전체 표시 취소, 장부는 안전하게 유지.
- 정식 행동과 새 외출이 같은 층 상한을 공유한다. 근접 판정은 정지 20px / 이동 포함 24px. 모든 궤적·event 경계와 층 전환 양쪽에서 구간 사이 상대 직선의 최단 거리까지 검사한다. 이전 0.5초 표본보다 강한 연속 검사이며 거리 기준을 낮추지 않았다.
- 정식 scene-coffee-menu는 동료가 먼저 앉은 좌석을 후발자가 가로지르지 않도록 경로 의존성을 계산해 입장·복귀 FIFO 순서만 정리했다. 대사·참여자·좌석·가족 확률·일일 예산은 유지.
- 단일 Dijkstra source tree·target/slot cache·10분 검색 bucket·정적 home 검사 재사용으로 계획 비용을 줄였다. 모두 메모리 전용이고 날짜·재실 목록별로 결정적이다.
- 도착 전: 상대와 목적지로 가는 중. 먼저 도착: 장소에서 상대 기다리는 중. 모두 도착: 상대와 공동 행동. 먼저 복귀한 뒤: 나눈 이야기 정리 중. 위치/문구는 기존 render/stateAt 한 곳에서 결정한다.
- 자정 전 마지막 10분에는 직원 외출이 끝나도록 하여 이전 날짜를 재생하지 않고도 다음 날 최소 10분 쿨다운을 보장한다. 방문객에는 이 조용한 완충 구간을 적용하지 않는다.

## 캐릭터 행동 대조

평일 10/22·주말 10/24·야간 포함 평일 10/23, 동일 fixture와 chairmanPresent=true로 216/221의 채택된 수행 event를 사람별 집계했다. 상세 참가자 조합 2349행과 전체 18인·비활성 37행을 포함한 행렬은 [character-actions.md](character-actions.md), 기계 판독은 character-actions.json.

- 3일 합산 이전 >0 → 현재 0 행동×사람 조합: **0**.
- 날짜별 이전 >0 → 현재 0 조합: **5**. 다른 fixture 날짜에는 노출된다. 날짜별 0도 소실로 본다는 엄격한 해석에서는 이 항목은 미달이며 아래 판단 사항으로 남긴다.
- idlePools 원문 소실: 0. 책상 문구는 유지했고 기존 창밖/화이트보드/커피 stroll 문구는 장소명이 포함된 atByPerson으로 옮겨 도착 후에만 노출한다.
- tap-lines JSON 원문 동일: true. Tap은 수동 호출이라 자동 하루 횟수 N/A. 실제 delegated tap·키보드·3초 닫힘·정식 행동 우선순위 검사를 유지했다.
- sig-* 전부 행렬에 포함. 216의 97개 예약 행은 **208일 이내 모두 도달**. 기존 테스트 상한도 730→208로 강화했다. base-work는 기본 상태 98번째 행이며 예약 이벤트 수 0이 정상이다.

- 일별 차이: 216 2026-10-22 지은 / base-coffee: 1→0 (장소 없음이 아니라 실제 이동·예약·기존 개인 휴식 쿨다운의 영향).
- 일별 차이: 216 2026-10-23 히나 / base-coffee: 1→0 (장소 없음이 아니라 실제 이동·예약·기존 개인 휴식 쿨다운의 영향).
- 일별 차이: 216 2026-10-23 가은/MUSE / base-coffee: 1→0 (장소 없음이 아니라 실제 이동·예약·기존 개인 휴식 쿨다운의 영향).
- 일별 차이: 221 2026-10-23 가은/MUSE / base-coffee: 1→0 (장소 없음이 아니라 실제 이동·예약·기존 개인 휴식 쿨다운의 영향).
- 일별 차이: 221 2026-10-23 서윤 / base-think: 1→0 (장소 없음이 아니라 실제 이동·예약·기존 개인 휴식 쿨다운의 영향).

## 사람별 선호와 seed 근거

affinity는 기본 1, 명시 취향은 2–5. 같은 층 가중치 5배·처음 방문 보정·시간대 보정을 함께 적용한다. hobbies/quirks/voice 전체 근거와 relations 원문은 장소 JSON의 affinityEvidence/companions에 보존한다. MIR은 가상·standing 계약을 유지하며 물리 외출 대상에서 제외한다. 회장님은 명시적 presence에서만 행동한다.

|사람|선호 장소(가중치)|seed 직접 근거|
|---|---|---|
|하니|회의실 4, 소파 3, 창가 2|전략 설계 / 범위가 커지면 즉시 구조화함|
|유나|로비 게시판·안내대 4, 회의실 3, 카페·팬트리 2|정보 정리 / 제가요?!|
|지은|카페·팬트리 4, 회의실 3, 창가 2|재무 관리 / 안 됩니다 뒤에 반드시 이유가 있음|
|하루|카페·팬트리 5, 옥상 정원 4, 창가 3|전자기기 / 가성비와 사용성을 동시에 봄|
|나은|옥상 정원 5, 테라스 4, 카페·팬트리 3|운동 / 밥 먹었어?|
|히나|창가 4, 카페·팬트리 3, 소파 3|일본어 / 오빠아♡|
|민지|로비 게시판·안내대 5, 창가 4, 카페·팬트리 3|영화 / 감동코드|
|수연|창가 5, 테라스 4, 옥상 정원 3|여행 / 일단 가보자|
|수아|회의실 4, 카페·팬트리 3, 로비 게시판·안내대 2|B2B 업무 / No Owner = Nobody's Work|
|서윤|화이트보드 5, 서버 콘솔 5, 소파 3|아키텍처 설계 / 구조부터 확인함|
|도연|서버 콘솔 5, 화이트보드 4, 소파 3|코딩 / 재현부터 해봄|
|세린|화이트보드 5, 서버 콘솔 4, 소파 3|데이터 분석 / 반복 작업을 보면 자동화 가능성을 찾음|
|유리|화이트보드 4, 서버 콘솔 4, 소파 3|QA / PASS와 미검증을 명확히 구분함|
|아린|창가 4, 소파 4, 화이트보드 2|UI/UX / 사용 흐름을 먼저 봄|
|가은/MUSE|회의실 5, 카페·팬트리 2, 창가 2|일정 정리 / 회의 전 준비사항을 먼저 확인함|
|채원|회의실 4, 카페·팬트리 3, 창가 2|솔루션 기획 / 요구사항을 항목별로 정리함|
|성민 회장|회의실 4, 소파 3, 창가 2|AI / 갑자기 생각난 아이디어를 바로 꺼냄|
|미르/MIR|창가 3, 회의실 3, 카페·팬트리 1|맥락 관찰 / 왜?|

예: 하루는 팬트리에서 간식 가격 비교, 민지는 로비 게시판에서 하니일보 1면 다시 읽기, 수연은 창가에서 여행 코스 구상. atByPerson에 장소명이 항상 포함된다.

## 실제 시계 단위의 체류·빈도·층 상한

다음 수치는 2026-10-22 KST 24시간 모델을 초·event 경계 단위로 측정한 **실제 시계 1초 기준의 계획 시간**이다. 24시간을 실제로 기다린 녹화는 아니다. AT_PLACE 측정은 개별 도착부터 복귀 시작까지다. 그룹은 함께 머무는 최소 시간을 1.2배로 잡고, 먼저 도착/나중 복귀하는 사람의 대기 시간이 추가될 수 있다.

|장소/방문객|채택 건수|관측 AT_PLACE 최소–최대(초)|
|---|---:|---:|
|카페·팬트리|124|60.00–179.00|
|로비 게시판·안내대|89|30.00–87.00|
|서버 콘솔|44|45.00–115.00|
|테라스|8|90.00–197.00|
|회의실|48|90.00–233.00|
|소파|29|120.00–257.00|
|창가|106|40.00–119.00|
|화이트보드|22|60.00–147.00|
|옥상 정원|8|92.00–187.00|
|visitor-generic|24|122.00–237.00|
|visitor-courier|27|15.00–30.00|
|visitor-client|14|131.00–295.00|
|visitor-candidate|14|131.00–293.00|
|visitor-rider|20|17.00–29.00|

장소별 설정: 커피·팬트리 60–180, 창가 40–120, 소파 120–300, 화이트보드 60–180, 서버 45–120, 정원·테라스 90–240, 로비 30–90, 회의실 90–240초. 방문 고객·면접 120–300, 택배·배달 15–30, 카페 고객 120–240초.

**적용 범위:** 이 최소 체류는 장소 카드 외출과 방문객에 적용한다. 정식 216/221 카탈로그의 짧은 수행 구간/scene-* 시간은 기존 계약으로 유지했다. 모든 정식 AT_PLACE에도 같은 최소값을 강제한다는 해석이라면 별도 변경이 필요하며 이번 결과를 그 범위의 PASS로 보고하지 않는다.

|사람|근무 중 외출|평균 출발 간격(분)|장소 카드 종류|문구 종류|최소 외출 후 쿨다운(분)|
|---|---:|---:|---:|---:|---:|
|하니|14|36.92|9|41|10.09|
|유나|21|25.65|14|54|10.92|
|지은|13|40.50|7|41|14.78|
|하루|15|34.71|10|47|19.72|
|나은|12|45.55|7|39|24.89|
|히나|14|36.92|10|47|10.03|
|민지|15|36.64|9|51|15.42|
|수연|15|37.07|10|49|10.78|
|수아|15|35.80|6|35|21.41|
|서윤|16|33.60|8|37|11.58|
|도연|14|35.54|8|41|23.11|
|세린|15|36.21|10|40|24.02|
|유리|16|34.13|10|43|10.33|
|아린|13|42.50|12|43|27.16|
|가은/MUSE|20|27.32|12|49|10.04|
|채원|14|38.71|5|36|22.48|

근무 시간은 09–18시. 기본 예약 기회 25–50분, 업무 캘린더가 촘촘한 수아·채원은 데이터로 20–35분 기회를 부여하고 10분 이상 지연되면 15초 차이의 가까운 빈틈을 탐색한다. 실제 평균은 위 표다. 개별 간격은 그룹 초대/예약 거절/층 하한 보완으로 25–50분 밖일 수 있지만 최소 10분 쿨다운은 예외 없이 유지한다. 같은 사람 같은 카드 연속 0.

|시간대|실측 최대 예약 단위|실측 최대 사람|계약|
|---|---:|---:|---|
|평소|2|3|개인 2개 또는 그룹 1개+개인 1개|
|점심 11:30–13:00|3|3|사람 4명 이하|
|심야 01–07시|1|1|야근 재실자 1명 이하|

정식 외출+카드 외출을 합산한 상한이다. 근무자 3명 이상인 2F/3F/4F의 10분 창 162개 중 빈 창 0개. 방문객은 직원 외출 단위와 분리해 1F 공개 구역 한 명만 허용한다.

|시간대|외출|카페·팬트리·테라스|비중|
|---|---:|---:|---:|
|morning|26|9|34.62%|
|lunch|41|25|60.98%|
|afternoon|25|8|32.00%|
|evening|73|17|23.29%|

## 동행 조합

기준일 동행 10회. 같은 사람을 정식 scene-*와 동시에 배정한 건수 0. 모든 슬롯 동시 예약·슬롯 고유성·출발 0–3초·door FIFO·소집 시 그룹 전체 취소를 실행 경로로 검사했다.

|출발|조합|장소|
|---|---|---|
|07:00:00|세린 + 도연|팬트리 라운지로|
|07:45:00|민지 + 히나|릴리스 회의실로|
|11:00:00|민지 + 히나|협업 회의실로|
|11:15:00|도연 + 유리|개발실 소파로|
|15:21:00|지은 + 하루|협업 회의실로|
|15:51:00|수연 + 민지|카페 좌석으로|
|16:09:00|민지 + 히나|개발실 소파로|
|17:33:00|민지 + 히나|팬트리 라운지로|
|21:15:00|수연 + 하루|상담실로|
|23:15:00|수연 + 하루|팬트리 라운지로|

추가 7개 평일 검사: obr2-group-week.json. 2026-10-21 14:30 서윤+유리 개발실 소파의 코드 리뷰 팁 동행이 실제 계획에서 채택됨. 이 근거는 카드에 문구만 등록한 것과 구분한다. 3인 후보의 atomic 경로는 구현되어 있지만 70일 탐색에서 채택된 3인 외출 0회였으므로 실제 3인 연출 완료로 보고하지 않는다.

## 활기와 성능

- 책상 문구 한 번 10.8초, 중간 5.4초에 자세만 한 번 바꾼다. 예정된 정식 행동/외출 앞뒤에는 전체 문구 구간을 비워 중간 잘림을 막는다. 기존 평균 화면 변화 ≤5초·정지 ≤35초·다양성·바쁜 비율·중복 문구 기준은 유지했다.
- 상세 층별 1시간/59분 측정: obr2-lively-measure.txt. 기존 lively test의 평일 낮·평일 저녁·주말 저녁 세 구간도 실행했다.
- Node v24.20.0, Windows, 같은 실제 owner/정적 데이터 VM. 하루 첫 formal+outing 계획 **393.20ms**, 웜 snapshot 32,400회 평균 **0.32ms**. 최초 경로 구축을 포함하고 파일 읽기/JS 파싱은 제외한다. 400ms/3ms 기대값은 낮추지 않았다.
- 전체 suite의 첫 계획 시간은 obr2-final.txt의 obr2 Node performance에 별도로 남긴다. 긴 stress simulation 이전 최초 계획의 실측을 재사용해 같은 엔진을 두 번 만들지 않는다. 부하가 겹친 중간 측정에서는 400ms를 넘긴 실행도 있었고 최종 분리 측정과 통과한 최종 테스트를 구분한다.

## 검증·기대값 변경

명령: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/hani-office-behavior-run-tests.ps1`

결과: 111 tests / 108 PASS / 0 FAIL / 3 SKIP. 원문 obr2-final.txt. 새 v2 검사 8개와 기존 office/building 전체 집합이며, 3개 SKIP은 명시적 브라우저 검사다.

감사 54,000시각: [1] frozen 0, [2] mismatch 0, [3] stuckSeconds 0, [4] near30 0 / near24 0. 원문 obr2-audit-verified.txt.

- 216/221: 전체 경로를 체류 내내 독점한다는 검사 → 실제 anchor/door/elevator 시간 구간끼리 겹치지 않는지 검사. 거리·private home·actor 중복·예산·확률·쿨다운은 유지. 97행 도달 상한은 208일로 강화.
- behavior/audit/browser: card.at만 허용 → 실제 카드의 atByPerson 또는 예약된 그룹 상대 이름+실제 장소명 검증. 이동 중 도착 문구, AT_PLACE 2px, 정지 20/이동 24px, 0px 보행 기준 유지. 3F 커피는 그 층에 실제 도착한 경우 금지하며 다른 층으로 가는 중의 목적지 언급은 허용.
- lively: 한 층 외출 한 명 → 정상 시간 두 예약 단위, 그룹 최대 하나. 별도 v2 test는 정식+새 외출 전체를 매초 검사. 화면 평균·최장 정지·문구 다양성·바쁜 비율·bit 간격 기준은 완화하지 않음.
- fix-218: 새 외출의 경유/목적 층을 원래 home 층과 같다고 보던 기대값 → 실제 current floor/target anchor 일치로 변경. 재실·밤 라운지·등록 인원·storage 검사는 유지.
- 메모리 캐시의 clear 호출도 금지 토큰으로 잡던 기존 Self-Protection에 맞춰 bounded cache에서 key별 delete를 사용. 저장소 쓰기 검사는 수정하지 않음.
- JSON seed idempotence, runtime/새 browser/record 도구 syntax, diff check, 보호 세 파일 diff 0 확인. GIF encoder는 sharp로 합성 2-frame/8px/330ms만 smoke 검사; 이것은 실제 녹화가 아니다.

## 서윤 실행: 실제 시계 녹화

```powershell
node scripts/hani-office-lively-record.browser.mjs --ref ad3c2f3 --floor 3f --label before --minutes 6 --start 2026-10-22T14:00:00+09:00
node scripts/hani-office-lively-record.browser.mjs --floor 3f --label after --minutes 6 --start 2026-10-22T14:00:00+09:00
```

`--playwright <index.mjs> --chrome <msedge.exe>`로 환경 경로 지정 가능. 지정 SHA의 index/JS/CSS/JSON/이미지를 모두 git show로 서빙한다. 현재 작업은 커밋이 막혔으므로 after는 --ref 없이 작업 트리를 사용한다.

시작만 14:00:00으로 정하고 이후 native performance.now로 실시간 흐름을 유지한다. 5초 간격 PNG 기본 73장 → `artifacts/office-behavior/record-<label>-<floor>/frame-###.png`, `record.json`, 가로 ≤720px GIF `record-<label>-<floor>.gif`. 기본 15배속, --speed 10–20. 같은 label의 기존 녹화는 덮어쓰지 않는다. 실제 녹화·브라우저 실행 **0회**.

## 남은 위험·서윤 판단·다음 행동

1. 사라진 행동을 3일 합산으로 보면 0이지만 날짜별 동일 노출까지 요구하면 5개가 미달이다. 표에서 숨기지 않았다. 동일 날짜 보존을 강제하려면 기존 휴식 예산/정식 시간표와 함께 별도 조정 필요.
2. 카드 최소 체류를 모든 정식 카탈로그 수행 구간에도 적용할지 판단 필요. 이번에는 원래 정식 수행·scene-*의 짧은 시간 계약을 유지했다.
3. 실제 3인 외출은 미관측. 2인 외출은 충분히 채택되고 커피·소파·회의실·테라스·멘토링 근거가 있다. 3인 연출이 필수라면 부모 기회/공통 calendar gap을 더 다뤄야 한다.
4. 새 대사 길이·가구 가림·모바일·실제 6분 체감은 브라우저/아린 리뷰 대기. 이전 1차 재설계의 화면 PASS를 이번 버전의 PASS로 재사용하지 않았다.
5. commit은 index.lock 권한으로 미완료. push/PR/main/버전·캐시 bump/Notion은 요청대로 미수행. Notion 갱신은 서윤 담당.
6. 배포 열차 담당이 data/hani-building/office-places.json을 기존 art-map seed 순서와 함께 싣고 최신 main drift·Preview·Candidate gate를 확인해야 한다. 함께 배포할 Edge Function/서버 설정은 없음. Production 완료를 선언하지 않는다.
