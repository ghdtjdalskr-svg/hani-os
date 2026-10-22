# 본사 직원 행동·이동 재설계 — 2차 구현 결과

- 도연(Codex), 2026-10-23 KST. 단일 Agent 개발.
- 상태: **구현·모델/회귀 검증 완료 / 브라우저·아린 검토 대기**. 배포 완료 아님.
- branch `hani/office-behavior-redesign`, base `ad3c2f3ed7716f97b81e1b0b66f3f4238a7aa04d`, HEAD `e58c2358e4b782ec5b5c4b353640ab85621ac443`.
- 원격 GitHub API main read-back은 base와 일치. Git HTTPS는 로컬 프록시 연결 실패. 자동 merge/rebase 없음.
- 사용자 2차 명세에 따라 Notion 호출 및 브라우저 실행 없음. 서윤이 담당.

## 커밋과 보존 경계

새 로컬 커밋 **0개**. 작은 데이터 커밋을 위해 `git add -- <공간/장소/overlay 명시 파일>`을 시도했으나 `.git/worktrees/obr/index.lock: Permission denied`로 실패했다. 사용자 지시대로 변경을 작업 트리에 남기고 구현·검증을 계속했다. 권한 변경/우회, push, PR, main 수정, 배포, 다른 branch/worktree 수정 없음.

기존 커밋 `e58c235 docs: 본사 직원 행동·이동 재설계 초안`은 이번 구현 커밋이 아니다. 기준 `ad3c2f3`도 기존 main이다.

`index.html`, `hani-desk-mascots.js`, 표시 버전·?v=·HANI_DISPLAY_VERSION, 기존 개인 home art 좌표, canon.people의 id/homeAnchor/status, 기존 export 이름, 보호 저장소·Cloud/Supabase 코드는 보존했다. 본사 runtime에 localStorage/sessionStorage/Supabase API를 추가하지 않았다. 기존 데이터 기준 버전·schema·migration 변경 없음.

전체 변경 파일 33개(운영/테스트/overlay/인수인계)는 `changed-files.txt`, 최종 파일 해시와 집계는 `summary.json`/`verified-files.json`에 기록했다. 테스트가 만든 로그·재현 baseline은 별도 artifacts이며 baseline 사본은 로컬 .gitignore로 제외한다.

## 변경 내용과 파일

### 공간과 데이터

- `data/hani-building/office-places.json`: 22개 장소 카드. 커피 4, 소파 2, 화이트보드 1, 서버 1, 회의/테라스 5, 로비 3, 정원 1, 창가 5. 개인 좌석·MIR·비활성 슬롯 제외.
- `data/hani-building/art-map-v1.json`: hall_*를 층별 실제 복도 쪽으로 분리. door_life/door_platform 및 접속 경로, client booth와 개발실 접근 경로 수정. home art 좌표 보존.
- `data/hani-building/spatial-contract.json`: 기존 326개 node/기존 edge/people/floor 계약을 보존하고 창가 5개와 clear logical edge 5개 추가(331 anchors). contractVersion은 spatial-216-v1 유지.
- `scripts/hani-office-behavior-data.mjs`: 장소·공간 seed 재현. 새 창가 logical edge는 walkable/noWalk를 101점 검사해 연결. idempotent, 기존 EOL 보존.
- `assets/data/office-actions-216.json`, `scripts/hani-office-actions-216-data.mjs`: sig-seongmin-4 제목을 책상에서도 가능한 “회장님 모드 · 커피 한 모금”으로 정정. 확률/시간/슬롯/identity 보존.
- `assets/data/office-actions-221.json`, `scripts/hani-office-actions-221-data.mjs`: night-window-view를 explicit 창가 슬롯으로 전환. night-lobby-note/story/lights의 장소 의존 제목/대사와 night-sofa-nap 제목을 실제 presence_home에서 가능한 내용으로 수정. 120행, identity/등록 인원/기존 shared budget 보존.

### 모델과 렌더러

- `hani-office-live.js`: 216 fallback에서도 유나·민지의 야간 근무 자리는 homeAt()에서 결정한다. 심야 책상 커피 문구는 장소 중립 문구로 교체했다. 예약 함수 reserve와 위치/상태 함수 stateAt을 정식 이벤트·외출·방문객이 함께 사용한다. 기존 plan()은 하루 단위, 외출은 10분 블록 단위이며 블록 경계를 넘지 않는다. 예약 실패 시 출발하지 않는다.
- home은 빈자리여도 타인이 쓸 수 없으며, 야간 라운지 home도 보존한다. 타인 home에 대한 보행 간격은 전체 segment를 연속 검사한다. 정지 target은 20px, 이동 중은 24px 이상. 확정 이벤트/외출/방문객은 0.5초·모든 궤적 경계와 경계 사이 상대 직선 이동까지 검사한다.
- 문/통로 resource는 기존 보수적 FIFO/시간 구간 독점. 같은 층 한 명의 직원 외출, 방문객은 별도 임시 인물 1명·1층 공개 구역·기존 시간대만 허용.
- 문구는 AT_HOME/GOING/AT_PLACE/RETURNING에서 파생. 그룹 복귀를 먼저 마친 직원은 즉시 AT_HOME. 정식 이동 문구는 목적 층·방 이름으로 표시한다.
- 이동 속도는 art 1672×941 기준 180px/s. 0px edge는 시간 0으로 생략. 엘리베이터 층 전환만 기존 1.6초, 이때 walking=false/waiting=true다.
- reduced-motion은 GOING/RETURNING을 home에서 보여주고 AT_PLACE 구간만 target에 표시. 방문객 이동은 생략한다. 동일한 예약 장부를 사용한다.
- 평상시 위치는 기존 updateBuilding scheduler 분기에서만 갱신한다. 회의 소집 walk/seatActor/officeTravel은 변경하지 않았다. DOM actor는 재생성하지 않는다. 기존 API 전부 보존, places 및 scheduler의 진단용 함수 추가.
- 기존 lively의 평일 저녁 4F 평균 변화 간격 5.1초 문제는 MIN_CYCLE 12→11로 개선했다. 기준 ≤5초/35초/대사 다양성/바쁜 비율/비트 간격은 변경하지 않았다.

### 실제 삭제한 경로

`idlePools.stroll`, `strollTargets`, `strollStart`, `strollPlan()`, `idleStroll()`, `visitPlans`, `visitPlan()`, `visitorAt()`, snapshot 끝의 “A stroll never takes a spot…” 되돌리기, 방문객 사후 겹침 필터, 라운지 사후 위치 덮어쓰기를 삭제했다. 추가 renderer/event layer 없음.

## 새 장소 수와 창가 슬롯

| id | 층 | 실제 방 | art x/y (%) | 화면 발 위치(px) |
|---|---|---|---|---|
| window_1f_1 | 1f | cafe | 92 / 40 | 1538.24 / 376.4 |
| window_2f_1 | 2f | pantry | 90 / 24 | 1504.8 / 225.84 |
| window_3f_1 | 3f | platform | 9 / 29 | 150.48 / 272.89 |
| window_4f_1 | 4f | ceo | 7 / 41.5 | 117.04 / 390.515 |
| window_5f_1 | 5f | quiet_roof | 88 / 83 | 1471.36 / 781.03 |

4층은 외측 유리벽이 있는 회장실의 바닥, 5층은 전면 난간 전망 쪽이다. 그림 합성으로 점을 확인했으며 실제 배우 크기·가구 가림·문 통과는 브라우저/아린 검토 대기다.

## 검증 명령과 결과

최종 전체 회귀 결과: **103개 중 100 PASS / 0 FAIL / 3 SKIP**, exit 0, 약 443.8초 (`all-tests-release-handoff.txt`). SKIP 3개는 명시적인 브라우저 검사다. 새 모델 4개 검사(100,800시각 + 고정 재현/동작 줄이기 + 공간/복귀)는 전부 PASS. 216은 120일에 그룹 98회·94행 노출, 208일에 97개 예약 행동 전부 도달 PASS.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/hani-office-behavior-run-tests.ps1
```

이 도구는 필요한 legacy raw Git baseline을 로컬 artifacts에 읽기 전용으로 export하고 HANI_BUILDING_SAFETY_BASELINE/HANI_OFFICE_TEST_BASELINE/OFFICE_SOFT=1을 설정한 뒤 아래 전체 파일 집합을 실행한다.

```text
node --test --test-isolation=none scripts/hani-office-*.test.mjs scripts/hani-building-*.test.mjs
```

표준 `node --test`는 이 환경에서 child process spawn EPERM으로 실행되지 않아, 동일 테스트를 Node의 공식 비격리 모드로 실행했다. 브라우저 테스트는 명시적으로 SKIP/미실행이다.

- 새 `scripts/hani-office-behavior.test.mjs`: 평일 26시간 93,600시각 + 주말 저녁 7,200시각(매초), 모든 쌍의 20/24px 간격, AT_PLACE 위치/문구, 이동 문구·제자리 이동, home/슬롯 소유, 복귀 끝점, 결정성, 5개 고정 재현, reduced-motion 검사.
- 새 `scripts/hani-office-behavior.browser.mjs`: 작성·node --check 통과. 390/884/1440 × 1F–5F × 두 동작 모드. 기존 가상 Date 관례·저장소 쓰기 감시·persistent actor와 DOM left/top% 발 위치를 실제 map 크기/1672×941에 대응. 실제 실행 0회.
- 기존 lively의 평균 ≤5초·최장 정지 ≤35초·대사 다양성·바쁜 비율·비트 간격·방문객 수/종류 기준 모두 PASS. 221의 야간/주말·재실·MIR·일별/자정 budget·실제 loader/renderer 검사 모두 PASS. 전체 파일 집합에서 100 PASS/0 FAIL이며 중간 검사 결과를 재사용해 대신하지 않았다.
- 보호 safety는 원본 owner·저장소 write 표면·버전/cache·mixed EOL·DOM ID 검사 통과. 최종 전체 로그에 다시 포함한다.
- syntax: runtime/새 model/browser/overlay/data/기존 UI guard 검사. index와 마스코트 git diff 0. `git -c core.whitespace=cr-at-eol diff --check` 사용(기존 파일 CRLF 보존).
- Full Package/One-Pass/HINA/운영 검증은 N/A: 기능 개발 단계이며 배포 열차 담당의 Candidate 작업이 아니다.

## 변경한 테스트 기대값과 이유

1. `hani-office-actions-216.test.mjs`, `hani-office-v2-215.test.mjs`: 승인 범위인 창가 node 5개 추가로 spatial SHA256을 `37a2e8babd192c783f76f4089dbd9ad81f77bf8b58de7397a46a866b02585274`로 변경. v2 canon/art anchor 개수 326→331. 기존 homes/rendererSeat/furniture 검사는 유지.
2. `hani-office-hd-224.test.mjs`: 실제 bootstrap canon 개수 326→331. HD 원본·100 frames·pivot·runtime file cap 검사는 유지.
3. `hani-office-219.test.mjs`: 전체 art 좌표 불변 검사를 모든 개인 home pivot 불변 검사로 바꾸고, 원래 canon anchor/people/floor/edge와 action budget·disabled·identity 보존을 별도 엄격 비교. 화면 거리와 안전 예약으로 정식 시간표가 바뀌므로 과거 시각과 byte 비교 대신 실제 plan과 AT_PLACE 슬롯·층 일치를 확인. index/sprite/CSS/pivot 보존 검사는 유지. 216 제목 1개 변경만 정확히 허용.
4. `hani-building-206-safety.test.mjs`: baseline을 환경변수로도 공급. 기존 비교 내용은 그대로다.
5. `hani-building-206-ui.test.mjs`: Node wildcard 실행에서 다른 .test.mjs를 Playwright 인자로 해석해 자동 실행하던 문제를 방지. 실제 UI CLI를 명시한 경우에만 기존 검사를 그대로 실행한다. 미실행은 SKIP.
6. `hani-office-v2-fixture.mjs`: 실제 장소 JSON을 VM assets에 포함. 실제 runtime fetch와 동일 데이터다.
7. hani-office-actions-216.test.mjs: reduced-motion의 이동 구간은 home/GOING 문구, 도착 구간은 예약 target이라는 정확한 기대값으로 변경(사용자 명세). 기존 즉시 목적지 표시 기대값을 교체했다. 97행 도달성 기준은 보존하고 실제 8개 그룹 경로를 수정해 통과시켰다.
8. hani-office-fix-218.test.mjs: 새 장소 JSON 요청 1개를 반영해 metadata fetch 6→7회, office-places.json 정확히 1회 요청을 추가 검증. 기존 presence/야간 라운지/경계 검사는 그대로다.
9. 감사 스크립트: 영문 anchor 이름 추측 대신 상태·placeId·targetAnchor·좌표/카드 문구로 검사. lobby-nw는 실제 카페 라운지 좌석으로 판정한다. 이동 검사는 같은 층/같은 상태/연속 walking일 때 요청 기준 0.5px 적용, 엘리베이터 WAITING 제외.

기존 lively 및 216의 확률·빈도·cooldown·모든 97행 도달성 기준을 낮추지 않았다. UI 실제 결과를 모델 검사로 PASS 처리하지 않는다.

## 감사 전후

기준 감사는 1차 실행의 동일 base/설계 HEAD 기록 `audit-before.txt`를 보존했다. 새 명령:

```text
node docs/drafts/office-behavior-redesign/audit.mjs .
```

| 항목 | 전 | 후(최종 수정본) |
|---|---:|---:|
| [1] 제자리 보행 구간 | 26 | 0 |
| [2] 문구·위치 불일치 조합 | 268 | 0 |
| [4] 24px 미만 근접 쌍 | 11 | 0 |
| [4] 30px 미만 근접 쌍 | 12 | 0 |
| [3] 요청 기준 제자리 walking 초 | 구형 감사 별도 기준 | 0 |

후 감사 범위는 2026-10-22 08:00–23:00 KST, 54,000시각. [3] 기준을 바꿨으므로 과거 수치와 단순 증감 비교하지 않는다. 정지 두 사람 기준은 20px, 이동 포함은 24px이다.

## overlay PNG와 실행 위임

`docs/drafts/office-behavior-redesign/overlay-1f.png`, `overlay-2f.png`, `overlay-3f.png`, `overlay-4f.png`, `overlay-5f.png` (동일 위치에 SVG 원문도 있음).

생성 명령 `node scripts/hani-office-behavior-overlay.mjs`. 브라우저 없이 기존 sharp로 실제 배경 위에 gray 경로/edge, blue hall, orange 창가 id, green home/이름을 합성했다. sharp가 없는 환경은 SVG를 생성한다. 추가 의존성 설치 없음.

서윤 환경 실행:

```text
node scripts/hani-office-behavior.browser.mjs <playwright/index.mjs> <msedge.exe>
node scripts/hani-office-actions-216.browser.mjs <playwright/index.mjs>
node scripts/hani-office-actions-221.browser.mjs <playwright/index.mjs>
```

기존 216/221 browser는 HANI_CHROME_PATH 환경변수로 Edge 경로 지정. 나머지 office browser 스크립트도 각 파일의 기존 CLI로 실행해야 한다. 새 browser screenshot 경로는 `artifacts/office-behavior/behavior-*.png`이며 아직 생성하지 않았다.

## 미검증·위험·다음 행동

- 실제 DOM pivot/모바일·884/1440 화면, 가구/벽 가림과 실제 문·통로의 모든 이동 장면, 216/221 등 기존 office browser 전부 미실행. 모델 수치·합성 그림을 실제 브라우저 PASS로 해석하면 안 된다.
- 공간 수정은 모든 개인 home/기존 rendererSeat 및 logical room/edge를 보존했다. 특히 새 창가(4F 회장실 포함)의 시각 적합성·출입 맥락은 아린 검토 필요.
- 같은 resource를 외출 전체 구간에 보수적으로 잡으므로 사용 가능한 행동도 안전 예약 때문에 skip될 수 있다. 실패 후 순간이동 복구는 없다. 장기 216 reachability는 기존 기준 그대로 208일에 97행 모두 도달했다.
- Git index.lock 권한 차단으로 서윤이 commit해야 한다. push/PR/main/배포는 이번 승인 범위 밖이다.
- 버전 증가·Candidate Freeze/build/One-Pass/독립 HINA/Preview 승인/Production read-back은 배포 담당 범위이며 수행하지 않았다.
- Notion은 이번 실행에서 호출하지 않았다. 서윤이 이 결과와 작업별 인수인계를 갱신해야 한다. 첫 실행의 보고/인수인계는 별도 *-first-attempt.md에 보존했다.

최종 확인: `git diff --exit-code -- index.html hani-desk-mascots.js` 및 CRLF를 고려한 diff check PASS. `verified-files.json`의 운영/scene 6개 파일 SHA256이 검사 후에도 동일함을 재확인했다. 장소·공간 seed 재실행의 파일 해시 동일성도 PASS. 현재 작업 트리는 미커밋이며, 전체 로그에 브라우저 PASS는 없다.
