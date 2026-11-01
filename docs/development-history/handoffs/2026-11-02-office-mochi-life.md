# 모찌 본사 주민 추가 · qa-b11d

## 작업 식별

- 갱신 날짜(KST): 2026-11-02 / 담당 Codex 단독 / 상태: 구현·targeted 검증 완료, 실화면·서윤 manifest 선행 PR 대기 / 미커밋.
- 저장소 / branch / worktree: hani-os / `hani/mascots-poster` / qa-b11.
- 작업 기준 HEAD: `ab146f86adcea173af1efa955d79af648fa5bc88`, 로컬 origin/main 캐시·GitHub connector 조회 main: `13fe8732113154d81b1d0b1514f64ab17ce98a32` 일치. Git subprocess 없이 ref·connector 읽기. 작업 branch를 main으로 merge/rebase하지 않았다. 로컬 표시 2.9.258·마지막 script `./hani-launch-greeting.js`; 실제 운영 화면·JS 로딩은 미검증.
- 사용자 승인: `../qa-b11d-task.md` 전체 UTF-8 읽기와 모든 지시 실행. 한글 정상. 기존 승인 atlas `artifacts/office-pets-npc/pet-rabbit.webp` 사용.
- 범위: 기존 office residents 블록 및 기존 bubble/tap 경로, literal CSS sheet, rabbit atlas·manifest entry, residents 회귀 및 필요한 인원/closure 기대값, exact-line fixture·pin, 개발 증거.
- 절대 경계: 직원·방문객 plan byte 보존, guard 완화 금지. 저장/Cloud/schema·버전/cache·commit/push/merge/배포 없음. 브라우저·Git subprocess 사용 금지.
- Scoped Discovery: living-office codemap 확인. 주민 세부 anchor CODEMAP_MISS로 residentSnapshot/residentSafe/residentVisit/residentAtlas 및 기존 bubble owner만 좁혀 조사.

## 결과와 증거

- 기존 초안과 수정 전 source/test/manifest 및 baseline 로그가 `artifacts/office-mochi-life/`에 남아 있어 이어서 검증한다. 다른 작업의 포스터·조직도 구현은 보존한다.
- Notion 현황판 읽기 성공. 착수 append는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절하여 저장/read-back 미완료.
- 최종 검증·보존 결과는 아래에 기록한다. 실화면/Production은 미검증.

## 다음 담당에게

- 먼저 읽을 파일: 이 handoff, `2026-11-02-office-pets-life.md`, `artifacts/office-mochi-life/fixture-evidence.json`.
- 다음 행동: 서윤이 manifest 별도 PR을 먼저 반영하고, 같은 승인 atlas 경로와 runtime patch를 통합해 허용 환경 Preview를 확인한다. 이 작업은 push·PR 생성 금지로 로컬 인계한다.
- manifest는 서윤 별도 PR 선행. 기능 작업은 push하지 않고 로컬 인수인계하며, 실제 병합·운영 반영 완료로 보고하지 않는다.
- Full package·One-Pass·HINA는 기능 patch 단계 N/A. 브라우저 Preview/아린 및 열차 최종 검증은 허용 환경에서 진행한다.
- CURRENT에 확인된 최종 요약만 앞에 추가하며 나머지 byte 및 DECISIONS는 보존한다. 기존 office-pets-life handoff에는 이번 후속 링크만 추가한다.

## 구현 결과

- 기존 주민 블록에 `pet-rabbit` / 모찌를 추가했다. 07~12시 3F 조용한 구역, 12~17시 4F 라운지 쪽 안전 통로, 17~22시 1F, 22~02시 치즈·크림 가까운 1F, 02~07시 수면. 07시 일일 seed 및 자정 연속성은 기존 반려동물 규칙을 따른다.
- 승인 atlas를 `assets/sprites-v3/pet-rabbit.webp`로 byte 복사(480×288, 32,442B, SHA256 `dd0e60bde7eb949bac0d491b659d2d93720e042b172c328457a7e9f29975ec2f`). literal CSS `--sheet` 1줄·manifest entry 및 총 spriteBytes만 추가했다. 기존 manifest entry와 나머지 formatting byte는 그대로다. 별도 인계용 entry는 `artifacts/office-mochi-life/manifest-rabbit-entry.json`.
- 기존 manifest 캐시가 모찌를 몰라도 `residentAtlas`가 좌/우 sitting·standing·hop-a·hop-b·sleep 10frame을 제공한다. 새 loader/event/renderer layer는 없다.
- 18 native px/s의 hop, 이동 전 60초 휴식·매 30분 1회 이동으로 느리고 긴 휴식을 표현한다. 일반 동물 속도는 기존 40px/s다. 모든 정차·보행은 기존 `residentSafe`와 full-body 경로 검사를 통과해야 한다.
- 조용하고 섬세한 관찰자 대사 10개(요청 원문 2개+추가 8개), 전부 22자 이하. 치즈의 `쟤는 말이 없어서 괜찮네요.`도 추가했다.
- 쉬는 직원 중 같은 층의 히나를 먼저 선택하며 `모찌, 편히 쉬어. 내가 지킬게.`로 수호자 성격을 표현한다. 업무/방문객/이동/복귀 중 직원은 제외한다. 직원이 두 정차 지점을 모두 막으면 모찌를 안전하게 생략하며 가구·보행 가드를 완화하지 않는다.
- 세 동물이 같은 층에 있을 때 어느 동물을 탭해도 기존 단일 bubble/타이머로 크림 `같이 놀자!!` → 치즈 `싫어요.` → 모찌 `……조용히 놀면요.`를 순차 표시한다. 그 15분 구간 동안 서로 96px 이상·280px 미만의 안전한 지점에 머물며 다음 quarter에 해제된다. 직원 동선이 막으면 안전 양보가 우선한다.
- 직원 19명·층 인원·roster는 변하지 않는다. 직원/방문객 plan·blockPlan·공개 snapshot은 수정 전 및 residents on/off와 byte 동일하다.
- 회귀에서 발견한 기존 동물의 모찌 정차 지점 사용을 수정했다. 치즈·크림의 일반/회장님 동행·수면 fallback과 방문 후보는 기존 지점 집합을 유지한다. 세 동물 장면 외의 기존 주민 snapshot도 포스터 회귀에서 원문과 동일하다.

## 최종 검증

환경 Node `v24.20.0`. 최종 runtime SHA256 `9d163016ff9b5d301f0b9088fbaadc5d7af21c4fa77ae62fe465c6253e42fe43`.

공통 명령: `node --test --test-isolation=none --test-force-exit --test-timeout=60000 scripts/hani-office-<suite>.test.mjs`. 포스터는 `scripts/hani-mascots-poster.test.mjs`.

| suite | 통과 | 실패 |
|---|---:|---:|
| residents | 36 | 0 |
| labels-qa | 17 | 0 |
| top-labels | 7 | 0 |
| icons | 13 | 2 |
| crowded-labels | 19 | 0 |
| obr8 | 2 | 1 |
| obr15 | 13 | 1 |
| obr21 | 4 | 2 |
| hd-224 | 10 | 0 |
| consult | 19 | 1 |
| hani-mascots-poster | 23 | 0 |
| 합계 | **163** | **7** |

- 11명령: 6성공·5실패, skip0. 실패7건은 모두 수정 전과 같은 검사명·`spawnSync git EPERM`이며 신규 실패0이다. 역사적 Git 검사는 PASS로 바꾸지 않았다. 공통 import 검사 중복을 포함한 합산이다.
- 수정 전 동일11묶음은156통과·8실패였다. 주민 closure 기대값129가 실제 기존139와 불일치하던 항목은 기존 closure+모찌 atlas만 허용하는 정확한 값139로 맞췄다. runtime cap160 및 기존 historical hash/변조 거부 guard는 그대로다.
- 주민 신규6개: 승인 atlas decode·fallback, 층/시간 경계·야간 동행, 실제 hop/속도·긴 휴식, 히나 선호·막힌 동선 양보, 실제 어느 동물 탭이든 3화자 순차 표시·quarter 유지, 막힌/다른층/수면 거부·기존 직원/방문객 plan 보존.
- `node --check` **8통과·0실패**: runtime·residents test/helper·hd-224·mascots-poster·patch/freeze/verify 도구. [syntax.json](../../../artifacts/office-mochi-life/syntax.json).
- byte 보존 **10통과·0실패**. 두 이전 fixture를 complete-line LCS(동률 delete 우선)로 그대로 재현한 뒤 labels/residents delta를 같은 방식으로 재생성했다. labels fixture와 obr8/15/21 pin은 결과가 원문 byte와 같고, 주민 helper는 새 fixture SHA pin만 변경했다. 모든 reverse hash/line 검증 및 scheduler 변조 거부 guard를 보존했다.
- resident fixture pin `44cac29199b13f58c54892519d88e20fbf0d6d3f5930cb3bb8190b27b9df363e`; labels pin `358805b81981c722cb1278aab28fe053af0b03f677b14d56ec0fd1d61ea2737d`. 역변환 pre-resident `992a9a89ea355458a395ebca2417f307e5f213cba5c29087ab3b82ca9bfdd0be`, 원래 labels 이전 `406937ae1d69c0379bb735e961734b517ae9440a02c93a0d41771dc0c694d246` 유지.
- 실제 runtime closure **146→147/160, 누락0**, 추가는 rabbit atlas1개뿐이다. 새 runtime JS 파일0, 기존 파일 누락/제거0.
- 기존 index/main/board/조직도 owner·표시버전2.9.258/cache·저장/Cloud/schema·기존 runtime CRLF byte 보존. 새 fetch/setInterval/setTimeout/addEventListener 등록0, 저장/AI 호출0. 서버 Edge Function·설정 변경 없음.
- 증거: [tests.json](../../../artifacts/office-mochi-life/tests.json), [preservation.json](../../../artifacts/office-mochi-life/preservation.json), [fixture-evidence.json](../../../artifacts/office-mochi-life/fixture-evidence.json), [remote-baseline.json](../../../artifacts/office-mochi-life/remote-baseline.json), `before-*`/`round1-*`/`final-*` 로그. 중간 새 실패는 수정 후 최종 전 묶음을 다시 실행했다.

## 변경 파일과 미검증

- runtime/asset: `hani-office-live.js`, `hani-office-live.css`, `assets/sprites-v3/manifest-v3.json`, `assets/sprites-v3/pet-rabbit.webp`.
- 검사: `scripts/hani-office-residents.test.mjs`, `scripts/hani-office-residents-source.mjs`, `scripts/fixtures/office-residents-source-delta.json`, `scripts/hani-office-hd-224.test.mjs`, `scripts/hani-mascots-poster.test.mjs`. hd/포스터는 승인된 주민 수·자산/closure·기존 주민 비교 범위만 갱신했다. 직원·방문객 비교 assertion은 유지했다.
- labels fixture는 같은 방식으로 재생성했으나 byte 변경0이며 obr8/15/21도 byte 변경0이다. 증거 도구는 `artifacts/office-mochi-life/`에만 있다.
- 브라우저·Git subprocess 직접 실행0, screenshot0. 모바일 실제 가림·이름표/말풍선 체감·Production read-back·실제 아린 리뷰는 미검증. VM/DOM 검사 결과를 실화면 PASS로 표시하지 않는다.
- commit/push/PR/main merge/Pages 배포 없음. manifest 선행 PR도 생성하지 않았다. Full package·One-Pass·HINA·표시버전 증가는 배포 담당의 다음 후보 단계다. 추가 데이터/배포 승인을 이번 지시에서 추정하지 않는다.

## Notion 최종 갱신 대기 원문

2026-11-02 KST / Codex / 모찌 본사 주민 qa-b11d / hani/mascots-poster / 작업 HEAD ab146f8 / main·캐시13fe873 일치(GitHub connector). 모찌 atlas·literal CSS·manifest/fallback·3F오전/4F낮/1F저녁·22~02시동행·02~07시수면, 느린hop/긴휴식·대사10개·히나선호·기존단일bubble 세동물 순차대사/quarter유지 구현. 주민36/0·지정11묶음163통과7실패(기존동일Git EPERM7·신규0), syntax8/0·byte보존10/0·closure147/160/누락0. 직원/방문객plans·기존주민동작·저장/Cloud/schema·버전2.9.258/cache보존. JS9d163016. 실화면/운영미검증·미커밋·push/PR/merge/배포없음. 다음 서윤 manifest 별도PR선행·허용환경Preview/열차검증. 원문 docs/development-history/handoffs/2026-11-02-office-mochi-life.md 및 artifacts/office-mochi-life/tests.json·preservation.json. Notion append는 자동 승인 검토의 approval policy is never 거절로 저장/read-back 미완료.
