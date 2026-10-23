# obr8 — 휴식은 길게, 업무 용무는 짧게

2026-10-23 KST · 도연(Codex). **짧은 업무 용무·낮 방문객 리듬 구현. 지정 검사는 아래 실제 결과로 보고하며, 첫 계획 성능 기준 미달은 완료로 처리하지 않는다. 모든 지표230 이상 또는 운영 배포 완료라는 판정은 하지 않는다.**

## 기준과 변경

- worktree obr / hani/release-train-20261023 / base 84cadbdf4d39ce10d37254eb3ea26a548073c164(obr7). 조회 main d19aa0b62b1657660cb3cc6bec6bee1524dbb2bf, origin/main 일치. main index 원문에서 표시232 태그·마지막 UI script 참조 hani-ui-v02992.js?v=2.9.232 확인. 운영 화면의 실제 로딩 확인은 미수행. 자동 merge/rebase 없음.
- CODEMAP living-office owner 확인. scheduler anchor CODEMAP_MISS 후 createScheduler→plan/blockPlan→reserve→stateAt/snapshot→기존 persistent renderer 실행 경로 확인. runtime 변경은 hani-office-live.js 하나. 새 DOM/event/timer/renderer 없음.
- 표시 버전·cache·index·마스코트·data/·행동 catalog 원문 불변. 기존 behavior-browser.json 수정과 untracked 작업은 보존. push·PR·Notion 없음. 로컬 커밋은 git add 단계의 worktree index.lock Permission denied로 차단되어 미커밋이다. 권한 우회 없이 변경 파일을 보존했다.
- 최종 runtime SHA256: `54fbf9a6f0301acf8c6e52d7ed3dc0ab8d05d684b763e84d2563f677981c6885`. 저장소·Cloud·schema·migration·write 경로 변경0. Edge Function/서버 설정 동반 변경 없음.

## 업무 용무 설계와 실측

- 동료 자리 방문(관계 seed companion score·같은 방 가중치), 같은 층 다른 업무 방 문 앞 서류 전달, 1F 실제 하니일보 게시판 공지 확인. 프린터·서류함은 실제 자산 근거가 없어 추가하지 않았다.
- 기존 side/approach junction 및 door/게시판만 사용. **새 anchor/좌표0, data/ 수정0.** 가은은 기존 side_secretary_desk / approach_secretary_desk 사용. 사용 지점 좌표(화면 백분율)·방·문구 전체는 obr8-errands.json. 윤슬 approach 9.41px 지점은 제외했고, 도착 최소20px·이동24px를 공통 예약에서 그대로 검사한다.
- 근무 용무 시간09–21시. 사람별 seed 간격6–15분, 서윤·유리·가은 등 협업형은6–10분. 실패는 다음90초 위상에서 재시도하며 휴식이나 정식 행동을 잘라 넣지 않는다. 같은 대상 연속 금지, 대상이 방문 전체 동안 원래 자리에 있어야 하며 소집 시 관련 방문도 숨긴다.
- 층별 errand 상한2(2F3)를 검사하고, 기존 정식·휴식과 공유하는 상한2/점심4도 유지한다. 따라서2F 일반 시간 실제 상한은 더 엄격한2가 적용된다. 다른 층을 통과하는 외출도 errand 예약에 반영한다.
- 모든 errand 체류8–25초, 왕복60초 이하. 이동은 ~가는 중, 도착 문구는 그 지점에서만. errand 이동/도착 문구의 커피·쉬는·휴식·창밖·간식·소파·산책·테라스·라운지 금지 및 잘못된 동료/anchor 거절 테스트 추가.
- 1F는 기존 손님5종을 보존하며90초 기회·주로 택배/배달/테이크아웃. 한 명·공개 구역·왕복 동선·연속 근접 예약을 유지한다. 테이크아웃은 coffee_counter에서 HANI Coffee 가는 중→커피 받아 가는 중, 체류20–40초.

|날짜|업무 용무(동료/전달/게시판)|체류 최소–최대 / 평균 초|왕복 최대 초|방문객(택배/배달/테이크아웃)|
|---|---:|---:|---:|---:|
|2026-10-22|1098 (992/48/58)|8.00–25.00 / 16.17|53.57|296 (124/52/109)|
|2026-10-23|1095 (972/64/59)|8.00–25.00 / 15.81|53.57|290 (74/42/169)|
|2026-10-24|1108 (974/71/63)|8.00–25.00 / 16.08|52.40|286 (131/55/93)|

각 사람·날짜의 건수, 간격 최소/최대/평균/중앙값은 -o 결과와 obr8-errands.json에 보존한다. 실제 평균은 예약 가능한 업무 틈 기준이며 긴 정식 행동·휴식 중에는 간격이 길어진다.

## 230 / obr7 / obr8 비교

[전체 4열 비교표](monotony-compare.md)는 5층×7시간대×2일, 일별 개인 다양성과15지표 열세를 모두 보존한다. 230/obr7은 동일 source SHA와 sampler 조건의 실측을 재사용했고, 새 obr8은172,800 snapshot 재실행. 총518,400 snapshot 근거. 2F 심야·5F 희소 재실 별도 표기.
대상1F/3F/4F의 화면 변화간격·보행·무보행1분 열세 항목은 **90→53**. 전체15지표 중 하나라도 열세인 구간은 **58→61**. 지표별 잔여 차이와 새 반복은 비교표에 명시한다.

셀: 화면 변화 평균간격 초 / 보행% / 직원 무보행1분 횟수.

|구간|230|obr7|obr8|
|---|---:|---:|---:|
|평일 1F 오전|2.88/3.78/79|3.92/2.05/79|2.91/3.69/62|
|평일 1F 오후|2.77/4.13/68|4.11/1.46/95|2.96/2.88/76|
|평일 3F 오후|2.68/1.73/63|2.31/1.06/79|2.10/2.80/37|
|평일 3F 저녁|2.58/2.10/82|2.30/1.07/116|2.10/2.70/55|
|평일 4F 오전|3.60/2.70/46|3.19/0.68/84|2.80/2.23/41|
|평일 4F 저녁|3.75/2.88/70|4.32/0.53/146|3.70/1.85/93|
|주말 3F 오후|2.52/2.31/54|2.28/1.07/82|2.10/2.77/36|
|주말 4F 저녁|3.65/3.24/69|4.50/0.51/151|3.90/1.73/103|

나아진 곳: 3F 주간·저녁의 보행/무보행분은 대부분230 수준에 도달하거나 넘어섰고, 1F 낮 손님 전환과4F 움직임도 늘었다. 남은 곳: 1F 낮 일부 보행·화면 변화와4F(특히 주말 저녁) 보행·무보행분, 변하지 않은 심야, 일부 개인 장소/정식 행동 다양성이다. 전체15지표 열세 구간58→61은 악화이며, 잦은 재도착·동료 문구 반복까지 포함한 전체 목표는 미완료다.

장소/행동 다양성은 실제 도착과 발생으로만 집계했다. 새 errand 종류는 일별 행동에 추가되지만 원래 정식 행동 종류는 그대로이며, 같은 동료나 문으로 자주 돌아오는 장소·문구 반복은 증가할 수 있다. 남은 열세를 종합점수로 상쇄하거나 모든 조건 개선으로 보고하지 않는다.

## 검증

|검사|결과|근거|
|---|---|---|
|전체 office/building|129개, 125 PASS/1 FAIL/기존 browser3 SKIP|obr8-all-tests-final.txt|
|233 pending 승인기록|8 PASS/0 FAIL, 기존 누락/중복/변조/이동/타파일 거절 유지|obr8-baseline-final.txt|
|감사|54,000 snapshot, frozen/mismatch/stuckSeconds/near30/near24 전부0|obr8-audit-final.txt|
|휴식·정식 체류|obr2/obr3 및120일216 회귀의 기존 하한·상한 통과. errand는 별도8–25초 검사|전체 회귀|
|고정 비교|원본 obr6 gzip/hash·109,561 route/tie oracle·obr7 단어 delta 불변. 원본 formal bytes 유지, 의도된 outing/snapshot 변경은 별도 전체 obr8 gzip/hash로 고정|obr6/obr8 및 obr7 historical tests|
|동료·문구·예약|3일 formal 동일성, 실제 도착/이동, 대상 전체 체류 재실, 잘못된 동료/지점 거절, 소집/취소/reduced/query order, storage0|obr8 tests|
|Git 원본 공급|native Git85개 blob (기존78 + 230원본6 + obr7 runtime1) 재검증|obr8-git-exports-verified.json|
|문법·보호범위|node --check / git diff --check / 금지 파일 HEAD 대비 변경0|로컬 검증|

성능은 최종 source로 다른 검사와 동시 실행 없이3회. 첫 계획400ms·웜3ms 임계와 원래 assertion은 그대로 유지한다. 최종 성능 실패도 그대로 보고한다. 이전 축소 구현의 통과 표본은 현재 PASS로 재사용하지 않는다. 정적 홈·층 기하 cache를 적용했지만 현재 작업의 성능 완료 근거로 삼지 않는다.

|회차|첫 계획 ms|웜 ms|판정|
|---|---:|---:|---|
|1|464.66|0.720|FAIL|
|2|538.60|0.701|FAIL|
|3|475.93|0.707|FAIL|

**미완료: 첫 계획400ms 기준 미달. 기능 결과를 보존했으나 로컬 커밋도 Git 권한 오류로 차단됐으며, 탑승 준비 PASS나 전체 회귀 PASS로 보고하지 않는다. 다음 작업은 동일 동작을 보존하는 계획 계산 최적화다.**

233 fixture는 고정7a10595 기준3 owner exact hunk로 재생성, fragment별 before/after 각1회 및 완전 역변환 byte 검증. baseline 검증기·기존8개 assertion은 불변. 테스트 실행 중 기대값 생성 없음.

obr6/obr7 비교 변경 이유: obr8은 새 물리 용무와 방문객을 의도적으로 바꾸므로 obr7의 “이동 불변” 주장을 현재에 적용하지 않는다. 역사적 obr7 source에서 기존 검사 전체를 보존하고, 현재는 별도 고정 전체 outing/snapshot bytes·formal 동일성·모든 route·새 동작 계약을 검사한다. formal 체류 helper는 errand 카드를 제외하고 기존 휴식 카드/방 기준을 그대로 적용한다.

## 녹화·미검증·다음 행동

서윤 녹화 추천: **2026-10-22 1F10:00–10:10, 3F15:00–15:10, 4F18:00–18:10**, 주말2026-10-24 3F13:40–13:50. recorder의 정확 명령과 전/후/230 ref는 비교표 끝에 있다.

실제 Edge/폰·녹화·픽셀·아린/서윤 시각 UX는 미검증. 기존 browser3 SKIP은 PASS가 아니다. package/One-Pass/독립HINA/Candidate/main/Pages/Production read-back 미수행. 기능 담당 버전 증가 N/A(사용자 금지). 운영 배포 완료 아님. Notion은 사용자 명시 금지로 미반영.

재현: `node scripts/hani-office-obr8-report.mjs -o artifacts/office-behavior/obr8-results.json`. 전체 회귀는 기존 `powershell -NoProfile -File scripts/hani-office-behavior-run-tests.ps1`; Git subprocess 제한 환경은 기존 read-only obr5 export 공급기 사용. native Git blob 입력은 기존 검증 manifest 재사용이며 현재 source로 대체하지 않는다.

다음 담당은 미커밋 변경의 비교표와 녹화 시각을 바탕으로 실제 UI 체감을 검토한다. push/PR/열차 탑승 및 승인·배포 단계는 이번 명세 범위 밖이다.

