# obr15 — 회장님과 직원 상호작용

2026-10-29 KST · 도연/Codex 단독 · `hani/office-235-lively-labels` · obr14 base `bebcf2c16b163df1f311fbcdc36caa42a4af7940`.

로컬 기능 구현·Node 검증 완료. 실제 브라우저 화면·스크린샷은 명세대로 서윤 실행 대기이며 배포 완료가 아니다. push·PR·Notion·main 병합·배포 없음. **로컬 커밋은 Git index.lock 권한 거부로 미완료**다.

## 구현

- 기존 `createPresence.read → updateBuilding → snapshot → plan/blockPlan → excursion/reserve`와 persistent actor/status slot을 사용했다. 새 runtime·renderer·event·timer 없음. CODEMAP living-office owner는 유효하지만 최신 anchor가 없어 CODEMAP_MISS 후 실제 symbol을 확인했다.
- presence 첫 absent→present(초기 active도 그날 첫 도착으로 취급) 또는 10분 이상 absent 후 전환 시 메모리 도착 시각을 넘긴다. 같은 날 짧은 lock/override 깜빡임은 재인사하지 않는다. 외부 override 우선순위와 기존 10분 재실 판정은 유지한다. 새로고침 간 횟수 저장은 하지 않는다.
- 시작 순간 회장님이 실제 4F에 있을 때, 650px 이내의 가은·유나·하니 중 전체 인사 구간에 예약이 없는 AT_HOME 직원 1–2명을 가까운 순서로 고른다. 그 시각 근처에 가능한 직원이 없으면 생략한다. 이동 없이 자기 자리에서 서서 개인 문구를 말하고 5–10초 뒤 현재의 원래 행동으로 복귀한다. 시작한 인사는 회장님의 기존 이동이 이어져도 정해진 시간 동안 마무리하며, absence/호출은 우선한다. 캐시는 transient 호출/취소 조회 순서에 영향을 받지 않는다.
- 인사 예: 가은 ‘회장님, 다음 일정 챙겨 뒀어요’, 유나 ‘회장님 오셨어요! 메모 모아 뒀어요!’, 하니 ‘회장님, 오늘 안건 정리해 뒀어요’. 근거는 기존 `office-tap-lines-v1.json`의 개인 morning/toChairman 말투와 221 person 직무다. seed/voice 원본은 변경하지 않았다.
- 보고는 현재 221 catalog에서만 활성화한다. 하루 고정 6개 기회, 같은 직원 최대 1회이며 안전 예약이 거절되면 포기한다. 정상 전체 roster의 평일·주말 4일 검사는 각 4–8건(상한 6)을 충족했다. 부분 roster/바쁜 날은 실제 수가 줄 수 있다. 216 fallback의 기존 회장님 외출 금지는 그대로다.
- 회장실 기존 junction/approach 중 회장님과 32–160px인 비어 있는 지점만 사용한다. 직원은 ceo-reserved를 쓰지 않는다. 보고 20–60초와 전체 왕복 동안 회장님도 자기 좌석에서 동일 장부에 예약하므로 보고 중 다른 외출이 끼어들 수 없다. 기존 formal 일정은 먼저 확정되며 덮어쓰지 않는다. 다른 층은 기존 엘리베이터 경로·정지 대기·왕복을 사용한다.
- 실제 presence 시작 전에 출발한 보고는 표시하지 않는다. 정적 일일 기회이므로 presence가 반복되어도 새 보고를 재추첨하지 않는다. absent에서는 새 보고가 0이며 기존 계획으로 돌아간다.
- 보고 AT_PLACE에서 기존 deskPartner를 재사용해 직원의 ‘회장님께 ○○ 보고 중’과 회장님의 ‘좋아요, 이대로 갑시다’를 동시에 표시한다. 후반부에는 개인 답변으로 바뀐다. 왕복 중에는 대화하지 않는다. 서로 반대 facing과 sprite의 정적 ±4도 기울임만 사용하며 좌표·발 pivot은 유지한다. reduced-motion에서는 rotate도 끈다. 출발/복귀/회장님 호출/취소 때 partner·facing은 기존 update에서 해제된다.
- 모든 새 문구는 obr14 전체 문구/짧은 문구 경로와 연결했다. 예: ‘배포 보고 중’, ‘예산 보고 중’, ‘회장님께 인사 중’, ‘보고 답변 중’, ‘좋아요, 갑시다’. 10자 이내이며 말줄임으로 자르지 않는다. 새로운 인사/보고 문구의 같은 층 동시 중복을 검사했다.

## 2026-10-22 KST 보고 재현

|직원 ID|직무 보고|왕복 층|보고 시작|체류|
|---|---|---|---|---|
|seoyun|배포 일정|3f → 4f|09:21:30|42초|
|hani|오늘 안건|4f → 4f|10:40:19|50초|
|yuna|접수 메모|4f → 4f|12:01:23|50초|
|dohyun|구현 진행|3f → 4f|13:20:29|49초|
|gaeun|다음 일정|4f → 4f|14:41:41|25초|
|jieun|예산|2f → 4f|16:00:34|51초|

실제 임의 시각이 아니라 고정 재현 시계다. 첫 서윤 보고의 4F screenshot 시각은 09:21:31, 도착 인사는 09:00:00을 권장한다. 전체 출발/도착/복귀 소수점 시각은 [성능·보고 원표본](obr15-metrics.json)에 있다.

## 검증

- 부재 byte 비교: 고정 obr14 Git ref의 JS/CSS SHA를 원본 gzip oracle과 검증한 뒤, 5개 날짜/부분 roster의 formal·outing 전체 JSON과 역순 137초 간격 snapshot을 byte 단위 비교했다. 빈/false presence와 도착 시각 옵션을 섞어도 일치한다. 실제 데이터는 fixture뿐이다.
- obr14의 immutable 6개 full ledger·84 snapshot oracle은 재생성하지 않았다. 역사 원본 `bebcf2c`에서 계속 실행하고, 현재 부재 계획은 새 obr15 검사에서 직접 대조한다. 현재 present 경로는 인사·보고·예약·두 줄·위치·무쓰기·실제 renderer 검사가 담당한다.
- 전체 26개 파일을 각각 실행했다. 첫 sweep에서 4개 assertion 실패(3개 파일)를 기록한 뒤 해당 3개 파일을 수정/재실행했다. 최종 파일별 합산 **229 PASS / 0 FAIL / 3 SKIP / 232 executions**. 공통 engine import 중복 포함이다. [첫 전체 sweep](obr15-regression.log), [최종 파일별 명세](obr15-results.json), [obr15 전용 14 PASS](obr15-targeted-final.log), [234 재검증](obr15-chairman-final.log), [216 재검증](obr15-obr3-final.log).
- 실패 원인과 대응: 장기 체류 검사의 모든 인원이 이동한다는 가정은 회장님 정지 청취 예약을 명시 검증하도록 보완했다. 실제로 216 fallback에서 생성되던 보고는 221에만 제한했다. 인사가 회장님 층 이동 때문에 5초 전에 끝나는 문제는 시작 위치를 고정해 정해진 인사 길이를 유지하도록 고쳤다. 보고 첫 문장이 무작위 답변으로 시작하던 초기 구현도 보고→답변 순서로 고쳤다. 이전 실패 로그를 최종 PASS와 구분해 보존했다.
- 승인 baseline **14 PASS / 0 FAIL**. 235 pending의 정확한 JS/CSS after만 갱신했으며 fixed234 before·이전 chain·누락/변형/중복/이동/EOL 부정 검사는 유지했다. [승인 로그](obr15-approved-final.log).
- 감사 원본과 기준 변경 없이 각각 54,000 snapshot: 회장님 [없음](obr15-audit-absent.log), [있음](obr15-audit-present.log) 모두 frozen/mismatch/stuckSeconds/near30/near24 **0**.
- 기존 정지20/이동24/동료 방문32px, 예약/층 capacity, 휴식 체류 하한, 0px 보행, 결정성, 성능 기준을 완화하지 않았다. 현재 실제 동료 방문 최솟값 34.986px, 928건; 장기 단독 전환 173건·동행 장소 문구 전환 33건도 통과했다.
- syntax와 git diff --check PASS. index·표시/cache·마스코트·spatial-contract·art-map·office-places·action/tap seed의 base 대비 차이 0. runtime의 localStorage/sessionStorage/Supabase 경로 0, fixture write/network trap 0. Cloud schema·서버 Edge Function·migration·새 seed 배포 없음.

## 성능

Node v24.20.0. 각 표본을 독립 새 프로세스에서 측정하며 총 6개 프로세스, presence별 첫 전체 formal+outing 3회와 프로세스별 1,000 warm snapshot 평균을 기록했다. present는 실제 since/arrival 옵션도 포함한다. browser/frame 성능과 구분한다.

|회장님|첫 계획 3회(ms)|best(ms)|warm 평균 3회(ms)|판정|
|---|---|---|---|---|
|없음|335.008 / 355.528 / 346.976|335.008|0.979 / 0.968 / 0.937|PASS|
|있음|374.222 / 363.150 / 368.831|363.150|1.548 / 1.552 / 1.583|PASS|

**초기 같은 프로세스 연속 VM 측정에서는 present best 406.771ms로 실패했다.** [초기 원표본](obr15-metrics-initial.json)과 [초기 로그](obr15-metrics.log)를 보존한다. 같은 코드의 baseline 교차 측정에서 더 낮은 값이 나와 실행 순서를 분리했다. 최종 PASS는 위의 독립 프로세스 방식에 한정하며, 코드를 최적화했다고 주장하거나 초기 실패를 삭제하지 않는다. CPU/GC·실제 브라우저 환경에 따른 여유는 별도 위험이다. 재현은 `powershell -NoProfile -File scripts/hani-office-obr15-metrics.ps1`.

## 화면·안전 경계와 인계

- `scripts/hani-office-obr15.browser.mjs` 작성·syntax PASS, **실행 0 / PNG 0 / 실제 화면 미검증**. 390/1440 × 밝음/어두움에서 실제 presence 전환·서기/종료·짧은 부재 중복 방지·왕복 보고·양쪽 문구/facing/겹침·persistent node·무쓰기를 검사하고 도착/보고 PNG 8장을 남긴다. 실제 폰의 문구 가독성·기울임 체감·공간 부족 시 양쪽 문구 노출은 서윤 확인 대기다.
- 서윤 실행: `node scripts/hani-office-obr15.browser.mjs <playwright/index.mjs> <msedge.exe>`. 결과는 `obr15-browser.json`, PNG는 `obr15-shots/`. Runtime source 변환 없이 실제 owner/CSS/seed를 로드하며 시계와 presence만 fixture로 제공한다.
- Node 재현: 제한 환경은 `powershell -NoProfile -File scripts/hani-office-234-export-git.ps1` 후 `$env:NODE_OPTIONS='--require ./scripts/hani-office-234-git-preload.cjs'`. 전체는 `powershell -NoProfile -File scripts/hani-office-behavior-run-tests.ps1`, 전용은 `node --test --test-isolation=none scripts/hani-office-obr15.test.mjs`. 감사는 기존 `docs/drafts/office-behavior-redesign/audit.mjs <repo>`와 `--chairman`을 각각 실행한다. 검사는 파일별 실행이다.
- 시작/종료 origin/main 캐시 `d6a88bc52406d93b92fd16641c4750ba3b35141c`, 표시 상수 2.9.234·마지막 script hani-launch-greeting.js 확인. 원격 HTTPS는 프록시 연결 실패로 최신성 미확인. 이 캐시의 office runtime/CSS/places/spatial/art는 fixed234와 동일했다. 자동 merge/rebase 없음. 현재 worktree 표시는 **2.9.233 유지**이며 2.9.235 표시는 배포 담당 범위다. 운영 화면·실제 최신 JS 로딩 확인으로 간주하지 않는다.
- Risk NORMAL 기능 개발이다. Candidate Freeze/package/One-Pass/HINA/Preview 승인·main/Pages/Production read-back은 이번 요청 범위에서 N/A/미실행. 최종 Preview 판단과 배포는 서윤/배포 담당에게 인계한다. Notion은 이번 명세의 명시적 금지로 미반영이며 갱신을 시도하지 않았다.
- 요청한 로컬 커밋을 위해 작업별 명시 경로만 git add했으나 `C:/Users/홍성민/Documents/HANI_OS_DEV/.git/worktrees/o235/index.lock: Permission denied`로 실패했다. staged 0, commit 미실행, HEAD는 obr14 `bebcf2c` 유지다. 권한 변경·대체 index·우회·push를 하지 않았다. 서윤의 쓰기 가능한 Git 환경에서 이 보고서 범위의 파일만 로컬 커밋하는 단계가 남았다. 기존 타 작업 untracked는 보존했다.
- Runtime SHA-256: `915850dd93efd2cc2678bf4e5af17efe4e82264964010f118786adf9dd164d7c`. [전체 identity/검증 원표](obr15-results.json), [인수인계](../../docs/development-history/handoffs/2026-10-29-office-obr15.md).
