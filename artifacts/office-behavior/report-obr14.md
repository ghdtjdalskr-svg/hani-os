# obr14 — 1층 활기·상시 행동 라벨·미세 동작

2026-10-29 KST · 도연/Codex 단독 · `hani/office-235-lively-labels` · base `33d39892c2a5c0a1779650e440a2dd5068b44495`.

**로컬 기능 개발 결과이며 배포 완료가 아니다. 실제 Edge 실행·스크린샷·시각 승인·브라우저 성능은 명세대로 서윤 실행 대기다.** push·PR·Notion 작업 없음.

## 기준과 범위

- CODEMAP의 office JS/CSS owner는 유효하나 최신 scheduler/라벨/검사 anchor는 없어 `CODEMAP_MISS` 후 실제 symbol을 확인했다. 기존 `plan → blockPlan → attempt/reserve → snapshot → updateBuilding → fitStatusLabels` 경로를 수정했다. 새 renderer/event layer/runtime 파일 없음.
- 시작 `origin/main` 캐시 `ead7eff653bcbf3055003088bd5764149ee484e3`. GitHub HTTPS 조회는 프록시 연결 실패로 원격 최신성을 확인하지 못했다. 세션 중 공유 ref는 `2833814e61ae9e00911fcdc3c6aa0b8fe0a0f107`(234 tooling #346)로 진행했다. 이 ref의 office JS/CSS는 지정 base와 같았다. 자동 merge/rebase하지 않았다.
- 로컬 표시·cache는 **2.9.233 그대로**다. 갱신된 main 캐시의 표시 상수는 2.9.234, 마지막 script는 `hani-launch-greeting.js`로 읽었다. 이는 Git 객체 확인이며 실제 Production 화면/JS 로딩 확인이 아니다.
- 수정 운영 파일은 `hani-office-live.js`, `hani-office-live.css` 두 개다. index·마스코트 owner·spatial-contract·art-map·office-places·버전/cache·보호 저장소/Cloud 경로 변경 0. **data seed PR 불필요**, 서버 Edge Function/설정 동반 배포 없음.

## 1층 지표

동일 KST 평일 `2026-10-22` **09:00:00–18:59:59, 36,000개 1초 snapshot**. 활성은 “1층에서 걷는 직원 또는 상태와 무관한 방문객이 1명 이상”, 평균 인원은 snapshot상 1층 직원+방문객이다. 회장님 없음 기본 옵션이며, 각 버전의 실제 catalog/art를 고정 Git ref에서 읽었다. 230과 234는 이 세션에서 측정한 고정 원본 결과를 재사용하고 235는 최종 source에서 다시 측정했다. 화면 라벨 표시율과는 별개의 모델 지표다.

| 버전 | 1층 활성 시간 비율 | 평균 동시 인원 | 방문객 평균 | 방문객 동시 최대 |
|---|---:|---:|---:|---:|
|230 · `04fb2b3`|41.43%|2.562|0.355|1|
|234 · `33d3989`|42.40%|2.671|0.368|1|
|235 · 최종 수정본|90.18%|3.599|1.295|2|
|목표|≥70%|≥3|—|≤2|

평일 3일(10/21·22·23) 전수 초 단위 목표 검사: 2026-10-21: 89.95% / 3.605; 2026-10-22: 90.18% / 3.599; 2026-10-23: 88.98% / 3.588 (PASS). 각 날짜에 손님 5종·서로 다른 목적지·공개 구역·gate 왕복·shared resource 예약을 확인했다.

|층|234 걷는 직원이 있는 시간 비율|235|234 평균 인원|235|
|---|---:|---:|---:|---:|
|2F|21.967%|21.967%|7.772|7.772|
|3F|14.814%|14.814%|4.957|4.957|
|4F|9.953%|9.953%|3.842|3.842|
|5F|0.914%|0.914%|0.126|0.126|

- 방문객 persistent 슬롯은 1→2개. 20초마다 빈 슬롯의 방문을 제안하고, 예약이 거절되면 그대로 포기한다. 같은 직원 수에 합산하지 않는다. 동시에 보이는 손님의 sprite/name만 기존 슬롯에서 갱신한다.
- 손님 선정은 날짜·시각 seed에 결정적이다. 출근 직후 택배 가중치 4, 점심 배달 5, 오후 상담/면접 3을 적용하되 각 종류의 기존 영업시간·평일 제한·목적지·체류 범위를 유지했다. 기존 floor capacity/연속 궤적/20·24px/동료 32px/대기 상태를 그대로 통과해야 한다.
- 다른 층 직원의 기존 1층 방문 **44→44건**. 1층 업무 용무 **100→103건**, 실제 손님 마중 **6→9건**. 용무 간격을 줄이던 초안은 기존 최소 6분 회귀와 충돌해 **원래 간격으로 복원**했다. 방문객 확대와 기존 마중 기회로 목표를 충족하며, 다른 층을 더 비우는 새 외출은 추가하지 않았다.
- 전체 회귀에서 14:44:36 두 방문객의 **20.70px** 접근을 실제로 발견했다. 예약 중 상대의 `end`에서 `positionAt()`이 null이 되면서 마지막 부분 구간을 놓친 원인이었다. canonical reserve의 경계에 `end-0.000001`을 포함하고 방문객 간 교차에도 기존 30px 여유를 적용했다. 위반을 허용하지 않고 해당 예약을 거절한다. 모든 방문객의 퇴장 직전 0.001/0.1/0.5/1초를 추가 회귀로 검사한다.
- [최종 수치/성능 원표본](obr14-metrics.json), [방문·시간대 리듬·녹화 시각](obr14-detail.json).

## 행동 문구·배치·동작

- 일반 근무에도 실제 직원 ID별 개인 업무 문구를 부여했다. 예: 수아 `접수 확인 중`, 채원(`taeo`) `안내 준비 중`, 서윤 `설계 검토 중`, 도연 `코드 수정 중`, 지은 `일정 조율 중`. 기존 deskVoice/개인 행동/야간·휴식·동행 문구는 유지한다. 책상 문구에는 장소 행동을 새로 암시하지 않는다.
- 같은 층의 예약 행동 문구를 먼저 claim하고 일반/idle 문구가 겹치면 기존 합법적 개인 문구 풀에서 다른 문구를 고른다. 실제 행동/이동/장소 문구 경로는 바꾸지 않는다.
- 휴대폰/지도 compact 폭 ≤600에서는 Unicode 기준 **최대 10자**인 규칙 기반 짧은 문구를 사용한다. 예: `커피 사러 가는 중`, `용무 보러 이동 중`, `차례 기다리는 중`, `메모 정리 중`, `퀴즈 푸는 중`, `비용 살피는 중`. 문장을 임의 길이로 자르거나 말줄임표를 붙이지 않는다. 이동은 도착 문구로 줄이지 않는다.
- 전체 문구는 status의 `data-full`/title/접근성 이름/명부에 보존한다. 기존 단일 탭/Enter 말풍선에도 전체 행동 문구를 포함하고, 기존 tap 대사는 함께 표시한다. 예약 행동 중 기존 tap 지연·3초 수명·이벤트 소유 경로를 유지한다.
- 이름표 먼저, 그 다음 **말하는 중 > 회의/호출 > 이동/특별 행동 > 평소 업무** 순으로 배치한다. map 밖은 거절하고 공간이 없을 때 낮은 우선순위 문구부터 숨긴다. 기존 수직 이동 방식과 persistent 슬롯을 유지한다. 라벨 reset 쓰기 → 모든 rect 읽기 → 메모리 내 충돌 계산 → offset 쓰기로 묶었다. `.hani-desk-mascots`의 실제 표시된 이미지 rect도 예약하며 owner 파일은 수정하지 않았다.
- sitting은 작은 배율/고개 기울임, standing은 작은 좌우 기울임으로 구분한다. **스프라이트 내부 transform만** 사용하고 atlas의 실제 pivot을 transform-origin으로 사용한다. actor의 좌표/`pose()` translate는 그대로다. 각 ID seed로 주기 3.6–6.4초와 음수 시작 지연을 다르게 한다. walking에는 미세 동작을 적용하지 않는다.
- `prefers-reduced-motion: reduce`에서는 animation/transform을 완전히 끄고, `root.dataset.paused=true`에서는 기존 pause 규칙으로 멈춘다. 애니메이션 keyframe은 transform만 변경한다.

## 검증과 의도된 기대값 변경

- 최종 파일별 전체 회귀: 25 files / 218 executions: 215 PASS / 0 FAIL / 3 SKIP. [로그](obr14-regression-verified.log). 공통 engine import 중복 실행 포함이며 고유 검사 수와 다르다.
- 승인 baseline: 14 PASS / 0 FAIL. [로그](obr14-approved-final.log). 235 exact JS/CSS → fixed234 → fixed233 순으로 되돌리는 pending 연결이며 기존 chain/234 fixture는 변경하지 않았다. 누락·변형·중복·이동·EOL 부정 검사 유지.
- 234의 역사적 byte 동등성은 `33d3989` 원본으로 유지하고, 현재 코드에 대한 회장님/재실/동료32px/긴 체류 회귀는 계속 실행한다. 235는 별도로 명시 작성한 6개 전체 formal/outing 장부와 84 snapshot, source/CSS hash·역순 조회를 비교한다. oracle은 테스트 실행에서 자동 재생성하지 않는다.
- Node Git subprocess 제한에 대한 기존 read-only blob export/preload를 재사용했다. 234 고정 원본·230 고정 원본·CSS 객체 요청만 추가했다. 매 read에 Git blob SHA-1을 검증한다. 현재 worktree를 역사 oracle로 사용하지 않는다.
- 의도된 기대값: 219의 “폰 이름만/평소 점만” → 모든 status slot 활성·폰 의미 있는 짧은 문구·공간 부족 시 우선순위로 숨김. 모바일에도 문구↔이름·문구↔문구 겹침 0 검사를 적용한다. 216 actor **21→22**는 두 번째 방문객 슬롯 때문이다(직원 roster 확대가 아님). lively/obr8의 방문객 동시 상한 **1→2**, 동일 actor/목적지·공개 공간·resource·체류 검사 유지/추가. 개인 업무 문구로 바뀐 평소 `퇴근 준비 중` 대신 기존 저녁 풀의 정확한 `가방 챙기는 중` 노출을 확인한다.
- 기존 **최소 6분 용무 간격, 정지20/이동24px, 동료32px, 휴식 체류 하한, 0px 보행, 결정성, 첫 계획 best-of-3<400ms, warm<3ms, 저장소0** 기준은 완화하지 않았다. 초기 혼합 EOL 편집은 복원했고 기존 mixed-EOL/보호 owner 검사를 유지했다. 초기 실패 로그와 최종 결과를 구분한다.
- 최종 감사: 회장님 없음 0 (frozen/mismatch/stuckSeconds/near30/near24), 있음 0 (frozen/mismatch/stuckSeconds/near30/near24). 각각 54,000 snapshot. [없음](obr14-audit-absent-final.log), [있음](obr14-audit-present-final.log). 감사 원본과 기준 변경 0.
- syntax·`git diff --check`·금지 파일 base 대비 byte 차이 0: PASS.

## 성능·화면 결과의 경계

|환경|첫 계획 fresh 3회(ms)|best(ms)|1000 warm 평균 3회(ms)|판정|
|---|---|---:|---|---|
|Node v24.20.0 · 회장님 없음|399.702 / 405.394 / 394.173|394.173|1.405 / 1.315 / 1.330|PASS|
|Node v24.20.0 · 회장님 있음|388.746 / 406.195 / 422.696|388.746|1.151 / 1.152 / 1.233|PASS|

실제 Edge 390/884/1440 × 1–5F × 밝음/어두움의 표시율/겹침/지도 밖/마스코트 충돌/30장 PNG는 **미실행**이다. 따라서 ≥85%(데스크톱)·≥70%(390) 달성 및 실제 겹침 0을 아직 PASS로 표시하지 않는다. 219 synthetic geometry는 실제 owner의 우선순위·숨김 복원 경로 증거이며 실제 글꼴 측정과 구분한다.

`scripts/hani-office-obr14.browser.mjs` 작성·syntax 확인. 서윤 실행 시 3개 시각까지 총 90 화면 조합을 검사하고 30장 PNG를 남긴다. 실제 라벨 갱신 비용은 1440/390에서 30회 원표본·평균·최대를, 미세 동작은 **21명 스프라이트+방문객 2명=23개 stress fixture**의 animation OFF/ON 각각120 frame 평균·p95·25ms 초과 수로 기록한다. 현재 실제 roster는 회장님 포함20인, persistent actor는22개이며 stress 인원과 구분한다. reduced-motion 완전 off·paused·전체 문구 tap도 검사한다. 아직 Edge 비용·프레임 영향 수치는 없다.

## 서윤 재실행·녹화·남은 단계

1. 제한 환경은 `powershell -NoProfile -File scripts/hani-office-234-export-git.ps1` 후 `$env:NODE_OPTIONS='--require ./scripts/hani-office-234-git-preload.cjs'`. 일반 Git spawn 허용 환경은 preload 없이도 고정 ref를 직접 읽을 수 있다.
2. `powershell -NoProfile -File scripts/hani-office-behavior-run-tests.ps1`와 승인 baseline 검사는 파일별 실행이다. 성능 재현은 `node scripts/hani-office-obr14-metrics.mjs`(최초 전체 측정) 또는 동일 고정 baseline JSON이 있을 때 `--reuse-fixed-baselines`.
3. `node scripts/hani-office-obr14.browser.mjs <playwright/index.mjs> <msedge.exe>` 실행. 결과 `obr14-browser.json`, PNG `obr14-shots/`. UI 실행 담당 서윤, 현재 실행/녹화 0.
4. 결정적 녹화 시계 **2026-10-22 KST**: 오전 **09:12:01**, 점심 **11:31:11**, 오후 **13:00:00**. 해당 시각 전후 30–60초 재생, 1F 손님2명과 직원·390/1440 비교, 3F/2F 상시 문구/미세 동작·폰 tap 전체 문구를 함께 권장한다. 실제 오늘 시각과 혼동하지 않는다. 시각별 실제 인원·문구는 detail JSON에 남겼다.
5. Git 로컬 commit: **미커밋 보존**. 명시한 28개 파일의 `git add -- ...`가 `HANI_OS_DEV/.git/worktrees/o235/index.lock: Permission denied`로 거절됐다. commit 미실행, 권한 변경/우회/재시도 없음. HEAD는 `33d3989`, staged0이다. 사용자 “막히면 미커밋” 범위로 인계한다. push·PR·Notion·main 병합·배포 미실행. 서버 변경/seed 없음. 실제 Edge 결과와 성민 대표님 Preview 확인 후 배포 담당에게 전달한다. 버전은 배포 열차가 한 번 올린다.

Candidate/package/One-Pass/HINA·Pages·Production read-back은 이번 기능 개발 범위에서 N/A/미실행이다. 원격 최신성·실제 Edge/실기기·실제 로그인/Cloud 통합·최종 배포 승인이 남아 있다. [인수인계](../../docs/development-history/handoffs/2026-10-29-office-obr14.md), [검증 identity](obr14-identity.json).
