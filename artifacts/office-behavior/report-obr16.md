# obr16 — 휴대폰 상태 문구 표시 보완

2026-10-29 KST · 도연/Codex 단독 · branch `hani/office-235-lively-labels` · base `d4b3659403c8d9732fddd151c27740dffa0f4684`.

기능 구현·최종 Node 회귀/승인 baseline/감사/성능 검증 완료. **실제 Edge 화면과 레이아웃 1회 전체 비용은 실행 차단으로 미검증이며, 로컬 커밋도 Git 권한 거부로 미완료**다. 390의 실제 노출률 ≥70%, 1440의 100% 유지, 실제 화면 겹침 0을 달성했다고 선언하지 않는다. push·PR·Notion·main 병합·배포 없음.

## 구현과 원인

- CODEMAP living-office owner JS/CSS 확인. 최신 status anchor는 CODEMAP_MISS로 실제 `fitStatusLabels → updateBuilding/loadSprite/ResizeObserver/fonts` 경로를 확인했다. 기존 persistent actor/name/status 슬롯과 canonical floor event를 사용하며 새 renderer·event·timer·runtime 파일은 없다.
- 이름표와 상태 문구를 인접한 한 묶음으로 놓는다. 발 좌표·sprite pivot은 유지한다. 상하·좌우·가로/세로 lane과 기존 라벨/마스코트 상자 가장자리에서 빈 공간을 찾는다. 가까운 배치에서 한 줄이라도 숨으면 네 모서리에서 재배치하며, 대화→이동/외출→평소 근무 노출 수를 순서대로 최대화한다. 공간 부족 시 숨기는 단위도 두 라벨 한 묶음이다.
- 회장님 보고 쌍·deskPartner 짝 대화·도착 인사와 그 회장님·현재 말하는 사람을 최우선으로 둔다. 다음은 이동·외출·호출·회의, 마지막은 평소 근무다. 공간이 두 묶음뿐인 검사는 보고하는 직원과 회장님 두 줄이 모두 남는지 직접 확인한다.
- 지도 600px 이하에서는 이름표/상태 글자 10px, 상태 안쪽 여백 1px 3px, 의미 있는 최대8자 문구를 쓴다. 예: ‘커피 사러 이동’, ‘택배 찾기 이동’, ‘용무 보러 이동’, ‘배포 보고 중’, ‘회장님께 인사’. 말줄임으로 자르지 않는다. 원문/title/접근성/하단 목록과 탭 말풍선은 기존 전체 문구를 보존한다. snapshot 기본 최대10자 결과는 변경하지 않았다.
- 두 browser 검사의 가짜 시계 대기를 Node `performance.now + timers/promises` 폴링으로 변경했다. floor/art/background 완료·fonts·visible sprite·마스코트 준비를 확인하고 기존 floor click으로 재배치한 뒤, 배치 완료 floor/시각을 확인한다. ‘라벨이 보일 때까지 기다리기’로 실패를 숨기지 않는다.
- **추가 fixture 오류:** 두 검사가 마스코트 JS만 읽고 CSS를 빠뜨렸다. 원본은 최소16px인데 CSS 없는 원본72px 상자를 장애물로 측정할 수 있었다. fixture에 원본 CSS 링크만 추가했다. 마스코트 owner·CSS·catalog·이미지는 변경하지 않았다. 이것이 기존 ratio0의 유일한 원인이라고 단정하지 않는다.
- 기존 70%/85%·겹침0·지도 밖0·마스코트 겹침0·보고 두 줄 기준은 유지했다. 1440은 100%, 휴대폰은 최대8자·최소10px까지 추가로 검증한다. 보고 화면에서는 모든 이름표/상태의 경계·상호 겹침·마스코트 겹침도 검사한다.

## Node 검증

- 전체 27파일 파일별 실행의 최종 합산 **241 PASS / 0 FAIL / 3 SKIP / 244 executions**. 공통 engine import 중복을 포함하며 SKIP은 browser 미실행이다. [첫 sweep](obr16-regression.log), [최종 파일별 근거](obr16-results.json).
- sweep 도중 DOM helper API 호출을 정리한 뒤 시작한 최초8파일은 최종 runtime에서 [다시 실행](obr16-regression-refinal.log)했다. 최종 합산은 이 결과와 나머지 sweep 결과를 결합한 것이다. 한 번에 전부 PASS한 로그라고 주장하지 않는다.
- 첫 sweep의 탭 말풍선 1건 실패는 fixture가 모든 actor rectangle을 제공하지 않아 발생했다. 기존 390/1440 말풍선 bounds assertion은 유지하고 모든 actor rectangle을 공급했다. [최종15 PASS](obr16-tap-lines-final.log). 초기 실패 로그 보존.
- obr16 전용6 + import engine6 = **12 PASS**. 우선순위/좁은 공간 보고 두 줄/동일 열8명 좌우 배치/문구 의미와 최대8자/Node deadline/실제 DOM owner 배치 적용을 실행했다. 실제 renderer의 노드 identity·발 좌표·기존 timer2개도 확인했다. DOM 사각형은 synthetic fixture다.
- 실제 snapshot 좌표, 원본 마스코트 offset·표시 크기, synthetic 글꼴/라벨 치수를 사용했다. 09–19시 10분 간격61개와 보고6회의 시작/끝12개, 각5층×3지도 너비 = **1,095회**. 도착 인사와 보고 쌍도 포함하며 노출100%·라벨 겹침0·지도 밖0·마스코트 겹침0이었다. 실제 화면 픽셀 결과로 대체하지 않는다.
- 승인 baseline **14 PASS**. 235 pending의 정확한 JS/CSS after와 설명만 갱신했다. fixed234 before·기존 chain·누락/변형/중복/이동/EOL 부정검사 및 immutable obr14 ledger/snapshot oracle은 보존했다. [로그](obr16-approved-final.log).
- 감사 원본과 기준 변경 없이 있음/없음 각각 **54,000 snapshot**, frozen/mismatch/stuckSeconds/near30/near24 모두 **0**. [없음](obr16-audit-absent-final.log), [있음](obr16-audit-present-final.log).
- 초기 기하 구현은 300px 일부2F가66.7%로 실패했다. obstacle/라벨 가장자리 후보와 모서리 재배치를 추가했다. 초기 단위 실패/기하 실패/부동소수점 비교 실패 로그(obr16-targeted*.log)는 보존했다. 간격 assertion의 1e-9 허용은 부동소수점 연산 오차 전용이며 실제 겹침·노출률 기준 변경은 없다.
- syntax·git diff --check PASS. 보호 파일과 data/ 전체의 base 대비 diff0. runtime localStorage/sessionStorage/Supabase 경로0, fixture write/network trap0. 서버·Cloud schema·migration·seed 동반 배포 없음. 기존20/24/32px·capacity·체류·예약·결정성 기준 유지.

## 비용과 성능

아래 비용은 **Node 순수 배치 계산 1회**이며 DOM reset/치수 읽기/스타일 commit 비용은 제외한다. 실제 browser 전체 `fitStatusLabels` 비용은 미측정이다. 보완한 obr14 browser 검사가 각 층/시간의 전체 갱신 비용과 기존30회 반복/23sprite frame 표본을 기록한다.

|지도 너비(뷰포트 아님)|배치 표본|최소 노출률(synthetic)|평균 ms/회|최대 ms/회|
|---|---|---|---|---|
|300px|365|100%|0.292|3.055|
|342px|365|100%|0.113|0.860|
|1348px|365|100%|0.132|0.815|

Node v24.20.0, 다른 회귀/감사 프로세스 종료 후 presence별 독립 새 프로세스3회. cold는 첫 formal+outing 전체 계획, warm은 프로세스별1,000 snapshot 평균 중 최댓값이다. present는 실제 since/arrival 옵션을 포함한다.

|회장님|cold 3회(ms)|best(ms)|max warm(ms)|판정|
|---|---|---|---|---|
|없음|340.310 / 329.693 / 329.936|329.693|0.965|PASS|
|있음|351.110 / 363.274 / 362.743|351.110|1.691|PASS|

[원표](obr16-metrics.json). 기준 best-of-3 <400ms 및 warm <3ms 유지. Node 결과이며 실제 휴대폰 frame/전체 UI 레이아웃 비용과는 다르다.

## 서윤 실행 명령

저장소 루트 PowerShell에서 아래 명령을 실행한다. 기본 Playwright/Edge 위치가 다르면 각 browser 명령 뒤에 `<playwright/index.mjs> <msedge.exe>`를 붙인다.

```powershell
$env:HANI_OFFICE_BROWSER_TAG='obr16-labels'
node scripts/hani-office-obr14.browser.mjs
$env:HANI_OFFICE_BROWSER_TAG='obr16-dialogue'
node scripts/hani-office-obr15.browser.mjs
```

- 첫 검사: 390/884/1440×light/dark×09:15/12:10/15:40×5층, ratio·겹침·경계·마스코트·전체 갱신 비용. 결과 `obr16-labels-browser.json`, PNG `obr14-shots/`30장 예정.
- 두 번째: 390/1440×light/dark, 실제 presence 전환·도착 인사·보고 왕복·보고 두 줄·facing·persistent node·무쓰기. 결과 `obr16-dialogue-browser.json`, PNG `obr15-shots/`8장 예정.
- 여기서는 두 최종 스크립트 모두 launch `spawn EPERM`, 검사0·PNG0이다. 수정 후 실화면 PASS·390 ≥70%·1440 100%·DOM 포함 비용 수치는 **서윤 실행 대기**다. 두 검사는 기존 isolated office fixture이며 로그인만 가린 전체 index의 실제 시계 재측정도 별도로 남는다.

```powershell
$env:NODE_OPTIONS='--require ./scripts/hani-office-234-git-preload.cjs'
# historical export가 없는 환경에서만 먼저 실행
powershell -NoProfile -File scripts/hani-office-234-export-git.ps1
node --test --test-isolation=none scripts/hani-office-obr16.test.mjs
powershell -NoProfile -File scripts/hani-office-behavior-run-tests.ps1
node --test --test-isolation=none scripts/hani-reviewed-release-baseline.test.mjs
node docs/drafts/office-behavior-redesign/audit.mjs .
node docs/drafts/office-behavior-redesign/audit.mjs . --chairman
powershell -NoProfile -File scripts/hani-office-obr16-metrics.ps1
```

## 경계와 인계

- 시작 원격 main 조회는 프록시 연결 실패로 최신성 미확인. 로컬 origin/main 캐시 `d6a88bc`와 base `d4b3659` 확인. 자동 merge/rebase 없음. 현재 표시 상수/캐시 `2.9.234`, 마지막 index JS `hani-launch-greeting.js`는 변경하지 않았다. 실제 운영 로딩 확인으로 간주하지 않는다.
- Risk NORMAL 기능 개발이다. 버전 증가는 배포 담당 범위여서 미변경. Candidate Freeze/package/One-Pass/HINA/Preview 승인·main/Pages/Production read-back은 요청 범위 밖으로 N/A·미실행. 실제 Android/Cloud도 미검증.
- **로컬 커밋 미완료:** 명시한 한 작업 파일만 `git add -- hani-office-live.js` 시도했으나 `C:/Users/홍성민/Documents/HANI_OS_DEV/.git/worktrees/o235/index.lock: Permission denied`. staged0·commit 미실행·HEAD `d4b3659` 유지. 권한 변경/대체 index/우회/push 없음. [실제 오류](obr16-git-add.log).
- push·PR·Notion은 이번 명세의 명시적 금지로 미실행. 타 작업 untracked는 보존했다. 다음 담당은 보고서/결과의 명시한 범위만 쓰기 가능한 Git 환경에서 로컬 커밋하고 browser 결과를 확인한다.
- Runtime SHA256: `93de8a35d876293575def125067951c05dc0a9948748d4b7b62c1aa886986514`. [전체 identity/최종 파일별 검증](obr16-results.json), [한국어 -o](obr16-o.txt), [인수인계](../../docs/development-history/handoffs/2026-10-29-office-obr16.md).
