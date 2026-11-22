# HANI GROUP 사무실 움직임 2단계 구현 보고

- **작성**: 세린 연구원 (Gemini) · 브랜치 `hani/office-motion` (로컬 수정, 미커밋)
- **범위**: `ANALYSIS.md` ②·③·⑤·⑥·⑦·⑧·⑨·⑩ 구현 (④ 좌우반전·층간/selectFloor 스냅 제외, 1단계 `Motion polish 1` CSS 보존)

## 회장님용 3줄 요약
1. 직원과 아이들이 걸을 때 갑자기 출발·정지하거나 각지게 꺾이고(②), 아이들이 한 칸씩 멈칫거리던 지렁이 걸음(③)을 부드러운 곡선 가감속으로 고쳤습니다.
2. 걷기 위아래 반동·좌우 기우뚱거림(⑤)과 대기 숨쉬기(⑥)를 눈에 띄는 크기로 키우고, 보리가 제 보폭에 맞춰 걷도록 보폭·속도를 맞추었으며, 동시 박자(⑨)를 흩뜨렸습니다.
3. 직원이 지나갈 때 반려동물이 순간이동하던 문제(⑦)와 방향 튐(⑧), 회의 소집 시 걷기 속도가 어긋나던 좌표계 버그(⑩)를 기존 100ms 시계 안에서 수정했습니다(저장·일정 불변).

---

## 항목별 수정 함수·위치

| 항목 | 대상 파일 · 심볼 · 줄 | 변경 내용 |
|---|---|---|
| **② 가감속·모퉁이** | `hani-office-live.js` `easeRun`, `compileCurve`, `sampleCurve`, `buildWalkRuns` (`:311-383`), `stateAt` (`:975-990`), `sampleMotion` (`:3799-3812`), `seatActor` (`:4527`), 100ms 루프 `officeTravel` (`:4828-4836`) | 연속 동일 층 구간(`phaseRuns`/`officeTravel.curve`) 전체에 양 끝 완만한 가감속(`easeRun`) 및 90° 모퉁이 쿼드라틱 베지어 필렛(최대 14px) 적용, 경로 캐시 재사용 |
| **③ 아이 지렁이 걸음** | `hani-office-live.js` `companionActivity` (`:3408-3411`) | `petEase(progress)`를 세그먼트 `t`가 아니라 전체 누적 거리 `easedProgress * length`에 1회만 적용 |
| **⑤ 걷기 리듬** | `hani-office-live.js` `distanceGait` (`:3795-3798`), `petMotion` (`:3572`), `residentSnapshot` (`:3747`), `companionSnapshot` (`:3319-3321`), `kidsVisits.update` (`:3279`), `companionActivity` (`:3415-3418`); `hani-office-live.css` (`:228`) | 인간 `step=45`, `bounce=-2.4px`, `lean=±1.35°` 위상 진동; 보리 `pace=.55`, `stride=12`; 치즈 `bob=1.2px`, 크림 `1.8px`, 모찌 `2.4px`; `kid-suhyeon` CSS·JS `bob/lean` 및 동행 마스코트 `bob` 연결 |
| **⑥ 대기 숨쉬기** | `hani-office-live.css` (`:177-178, :256, :261, :270`); `hani-office-live.js` (`:3992`) | `breathe` `scaleY(1.026) rotate(1.1deg)`, `sway` `rotate(1.3deg) scaleY(1.026)`, `pet-idle` `2.4%`, `pet-sleep` `scaleY(1.03)` + `--idle-delay` 적용; 전 액터 FNV 시드 기반 `--idle-duration`/`--idle-delay` 흩뜨리기 |
| **⑦ 순간이동 줄이기** | `hani-office-live.js` `residentSnapshot` (`:3724-3765`), `slewCompanion` (`:3699-3711`), `updateResidents` (`:4648-4665`) | 비거주자(직원) 통과로 `free()` 실패 시 즉시 스냅 대신 최대 2.5초 제자리 대기(`petPrev`); 동행자 목표 급변 시 `slewCompanion`(최대 `240px/s`)으로 짧게 걸어 보간(층간/`selectFloor` 스냅 유지) |
| **⑧ 방향 전환** | `hani-office-live.js` `createKidsVisits` (`:3255-3277`), `companionActivity` (`:3412-3413`), `petMotion` (`:3547-3548`), `residentSnapshot` (`:3736, :3751`), `companionSnapshot` (`:3330`) | 수직 이동(`dx≈0`) 시 직전 `facing` 유지; `kidsVisits`·`companionActivity` 모두 현재 구간 `seg.to[0] - seg.from[0]` 기준으로 전환 |
| **⑨ 동시성** | `hani-office-live.js` `snapshot` (`:2083`), `kidsVisits` (`:3275`), `companionSnapshot` (`:3319, :3330`), `companionActivity` (`:3412`), `residentLife` (`:3516`) | `residentSeed('walk-phase|'+id)` / `seed(day+'|walk|'+id)` 기반 결정적 발걸음 위상 지터 및 `residentLife` `(seed%11)/10` 지터 추가(저장 0) |
| **⑩ 회의 소집 속도** | `hani-office-live.js` `seatActor` (`:4527`), `officeTravel` (`:4828-4836`) | `officeTravel.duration`을 `1000×640` 논리 좌표가 아닌 `visualPoint`(`1672×941` px) 거리 기준으로 통일 |

---

## 일정 불변·안전 근거
- `createScheduler`의 `travelSeconds`, `plan()`, `blockPlan()`, `sweepPoint`는 전혀 변경하지 않았습니다.
- `stateAt`은 기존 `start`, `end`, `performStart`, `performEnd`, `seat`, `floor`, `walking`, `waiting`을 그대로 유지하고, 이동 중(`walking===true`)의 위치 진행 곡선만 `easeRun` + `sampleCurve`로 보간합니다.
- 새 `setInterval`·`requestAnimationFrame`·`MutationObserver`·`addEventListener` 및 `localStorage`/`Cloud` 쓰기를 추가하지 않았습니다. `prefers-reduced-motion: reduce` 및 일시정지 분기는 그대로 유지됩니다.

---

## 서윤 Preview 확인 화면 및 KST 시간대
1. **1F 로비·복도 걷기** (`평일 10:00~17:00`, 1F/2F/3F): 직원 출발·모퉁이·도착 감속(②), 발걸음 반동·좌우 흔들림(⑤), 대기 숨쉬기(⑥), 직원 통과 시 치즈/크림 제자리 대기(⑦).
2. **보리 산책·어슬렁거림** (`평일 10:00~12:00` 1F / `13:00~15:00` 2F 수직 이동): 발 헛돌지 않는 보폭·속도(⑤)와 수직 이동 시 방향 유지(⑧).
3. **주말 아이 방문·동행** (`토/일 10:00` 4F, `chairmanPresent: true`): 수연·수현이 부드러운 연속 걸음(③), 수현·마스코트 bob/lean(⑤·⑨), 회장님 방향 전환 시 동행자 보간 이동(⑦), `kidsVisits` 구간 방향(⑧).
4. **회의 소집·복귀** (안건 선택 후 `회의 소집` 클릭): 소집·복귀 이동 속도가 평상시 `180px/s`와 일치하며 모퉁이·정지가 부드러움(⑩·②).

---

## 검증 상태 및 기존 시험 예상 실패 목록 (셸 미사용 환경: 미실행)
- 새 시험 작성 완료: [`scripts/hani-office-motion-2.test.mjs`](../../scripts/hani-office-motion-2.test.mjs) (실행 필요: `node --test scripts/hani-office-motion-2.test.mjs`).
- 셸 명령 제한으로 직접 실행하지 못해, 아래는 코드 대조 기반 **기존 시험 깨질 예상 목록**입니다(기존 시험 파일 무수정):
  1. `scripts/hani-office-motion-1.test.mjs`: `distanceGait` 기존 수치(`step=60`, `bounce=-.65`, `lean=±.9`) 단언 및 `createScheduler` 고정 SHA-256 단언 실패 예상.
  2. 과거 바이트/SHA 역변환(exact-inverse) 기반 시험들 (`hani-office-bori-stroll.test.mjs`, `hani-office-companions.test.mjs`, `hani-office-kids-pose-b.test.mjs`, `hani-office-residents.test.mjs` 등): `hani-office-live.js`/`css` 변경으로 인해 inverse 해시 검증 실패 예상. (`bori-stroll.test.mjs`의 낮 걷기 비율 `>=10%`는 보리 `pace=.55` 상향으로 걷기 비율이 감소해 확인 필요).

---

## 마지막 3줄 요약
1. `hani-office-live.js`와 `hani-office-live.css`에서 분석표 2단계 항목(②·③·⑤·⑥·⑦·⑧·⑨·⑩)을 기존 100ms 시계와 결정적 일정 범위 안에서 구현했습니다.
2. 새 타이머·리스너·저장 경로 없이 가감속·모퉁이 곡선·아이 지렁이 걸음·보행 반동·숨쉬기·펫 대기/동행 보간·방향·회의 소집 좌표계 버그를 모두 반영했습니다.
3. 셸 미지원 환경으로 테스트 직접 실행은 하지 못했으며, [`scripts/hani-office-motion-2.test.mjs`](../../scripts/hani-office-motion-2.test.mjs) 작성 및 보고서 정리를 완료해 서윤 검증을 대기합니다.

---

## 2차 수정
1. **② 모퉁이 곡선 (`scripts/hani-office-motion-polish-2.test.mjs`)**: `compileCurve`/`sampleCurve`는 정상 동작하며, 1672×941 캔버스에서 `[10,10]→[50,10]`(668.8px)이 `[50,10]→[50,50]`(376.4px)보다 길어 `totalLen/2`가 코너 전 첫 직선에 위치하던 시험 가정을 수정해 `quad` 세그먼트 중앙과 등길이 코너를 직접 검증하도록 보완했습니다.
2. **⑥ 숨쉬기 (`scripts/hani-office-motion-polish-2.test.mjs`)**: `hani-office-live.css`에는 이미 진폭 2~3%·1~1.5°(`hani-office-breathe`·`hani-office-sway`·`hani-pet-idle`·`hani-pet-sleep`), `--idle-delay` 흩뜨리기, `Motion polish 1`이 모두 반영돼 있었으나, 시험 정규식의 `[^}]*`가 첫 키프레임 `0%,100%{...}`의 `}`를 넘지 못하던 문제를 `@keyframes` 블록 단위 매칭으로 바로잡았습니다.
3. **⑦ 펫 잠깐 막힘 시 제자리 대기 (`hani-office-live.js`)**: `residentSnapshot`에서 직원이 `prev.position`을 일시 점유(`!free(prev.position) && residentFree(prev.position)`)하면 `companions` 경로(`residentVisitPath`)가 `group` 지점을 미리 탈락시켜 다른 스팟으로 즉시 이동하던 우회 경로를 막고, `holdPrev()`로 최대 2.5초(`canHold`) 제자리 대기 후 안전 우회하도록 수정했습니다(저장 0, 메모리 `petPrev`만 사용).

### 2차 수정 3줄 요약
1. ② 모퉁이 곡선과 ⑥ 숨쉬기는 실제 런타임 코드(`compileCurve`·`hani-office-live.css`)가 정상 동작 중이었고, 비율 비대칭과 정규식 `[^}]*` 경계 가정만 틀렸던 시험 파일(`scripts/hani-office-motion-polish-2.test.mjs`)을 근거와 함께 바로잡았습니다.
2. ⑦ 펫 일시 막힘 대기는 직원이 `prev.position`을 가릴 때 `companions` 경로가 즉시 다른 자리로 갈아타 `free()` 대기 분기를 우회하던 원인을 `residentSnapshot`에서 차단해 최대 2.5초 제자리 유지 후 우회하도록 고쳤습니다.
3. `hani-office-motion-2.test.mjs`는 건드리지 않았고, 새 타이머·리스너·파일·저장 없이 `hani-office-live.js`와 `scripts/hani-office-motion-polish-2.test.mjs` 및 본 보고서만 최소 범위로 수정했습니다.
