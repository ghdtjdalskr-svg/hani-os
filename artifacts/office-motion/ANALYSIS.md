# HANI GROUP 사무실 캐릭터 움직임 부자연스러움 원인 분석 및 개선 제안

- **작성**: 세린 연구원 (Gemini) · 분석 전용 (운영 코드·데이터 무수정)
- **대상 브랜치 / 기준**: `hani/office-motion` (v2.9.306)
- **회장님 11/21 피드백**: *"하니그룹 회사 움직임 보고 있는데 뭔가 움직임이 부자연스러운 게 아쉽다. 맘에는 드는데."*

---

## 1. 핵심 진단 요약: 왜 "분위기는 좋은데 움직임만 어색하게" 보일까?

코드와 에셋 매니페스트를 전수 분석한 결과, 부자연스러움은 하나의 버그가 아니라 **4가지 구조적 요인이 겹친 결과**로 확인되었습니다.

1. **10fps 계단식 이동 + 무가감속 직선 주행**: 캐릭터 위치를 CSS transition이나 `requestAnimationFrame`(60fps)이 아니라 **`setInterval(..., 100)`(초당 10프레임)**으로 직접 `left`/`top`을 바꿔 1틱당 최대 `18px`(art px)씩 툭툭 끊어 옮깁니다. 출발·도착·90도 코너에서 가감속이 전혀 없습니다.
2. **앞면 전용 2프레임 스프라이트 + 미미한 동작 진폭**: 모든 직원은 **정면(front) 포즈 4칸(`standing`, `sitting`, `walk-a`, `walk-b`)만 존재**하고 좌우 반전(`scaleX(-1)`)도 쓰지 않아, 좌우·위아래로 걸을 때 **정면을 쳐다본 채 게걸음/문워크**를 합니다. 게다가 걷기 상하 반동(`--step-bounce`)이 최대 **`-0.65px`**, 대기 숨쉬기가 **`scaleY(1.012)`(1px 미만)**라 사실상 종이인형이 미끄러지는 것처럼 보입니다.
3. **보행 발걸음 주기와 이동 속도의 불일치**: 직원(`step = 60px`, 3Hz), 아이들(시간 고정 4Hz + 구간별 `petEase`로 매 웨이포인트마다 급정거·재출발), 보리(`pace = 0.2`로 1걸음에 8.3초 소요) 등 캐릭터마다 발놀림과 이동 속도가 따로 돕니다.
4. **충돌 회피·층 이동·동행 추종에서의 잦은 순간이동(Teleport)**: 직원이 반려동물 옆을 지나가거나(`free()` 실패), 회장님이 방향을 바꾸거나, 층간 이동(`1.6s` 대기 후 즉시 소멸/출현)이 발생할 때 부드러운 전환 없이 좌표가 1프레임 만에 점프합니다.

---

## 2. 원인 후보 종합 표

| 분류 | 증상 | 근거 코드 (파일 · 줄 · 심볼) | 회장님 눈에 어떻게 보이나 | 고치는 방법 | 위험도 (데이터·성능) |
|---|---|---|---|---|---|
| **① 갱신 주기** | `100ms`(10fps) 타이머로 `left`/`top` 직접 덮어쓰기, CSS position transition 없음 | `hani-office-live.js:4679-4711` (`setInterval(..., 100)`), `:3808-3811` (`moveActor`), `hani-office-live.css:20` (`transition:opacity .3s`만 존재) | 걸어갈 때 부드럽게 흐르지 않고 **1초에 10번씩 뚝뚝 끊겨(버벅여)** 보임 | `requestAnimationFrame` 보간 루프 분리 또는 `left`/`top` 선형 CSS transition 적용, 라벨 재계산(`fitStatusLabels`)은 저빈도 분리 | **데이터**: 없음<br>**성능**: 중 (rAF 시 가시 상태·dirty 체크 필수) |
| **② 이동 곡선 / 코너링** | 직원 이동이 순수 등속 직선(`ratio`)이며 90° 모퉁이에서 즉시 꺾임 | `hani-office-live.js:881` (`SCREEN_SPEED=180`), `:907-909` (`stateAt`), `:326-343` (`route`), `:4695-4700` (`officeTravel`) | 시작할 때 툭 튀어나가고, 모퉁이에서 로봇처럼 각지게 꺾이며, 도착하자마자 급정거함 | 직선 구간에 ease-in-out / 코너 감속 적용, 또는 `petRoute`처럼 경유지 베지어 곡선 스무딩 도입 | **데이터**: 없음<br>**성능**: 하 (경로 캐시 재사용) |
| **③ 아이들 다구간 버벅임** | `companionActivity`가 여러 구간 경로의 **세그먼트마다** `petEase`를 반복 적용 | `hani-office-live.js:3320-3323` (`companionActivity` 내 `petEase(t)`), `:3134-3140` (`route` 32px 격자 경로) | 수연·수현이 걸을 때 한 칸(32px) 갈 때마다 **섰다 가다를 반복(지렁이 걸음)** | `petEase`를 세그먼트 `t`가 아니라 **전체 누적 거리 진행률**에 1회만 적용 | **데이터**: 없음<br>**성능**: 하 |
| **④ 정면 스프라이트 문워크** | 인간 직원·NPC 아틀라스가 정면(`front`) 4포즈뿐이고, 보행 시 좌우 반전·회전도 꺼짐 | `assets/sprites-v3/manifest-v3.json:6`, `assets/sprites-v2/manifest.json:6`, `hani-office-live.css:182-188` (`rotate:none`), `hani-office-live.js:1962-1965` (`patrol` 외 `facing` 미지정) | 옆이나 뒤로 갈 때도 **앞만 보고 옆걸음/뒷걸음질 치는 종이인형**처럼 보임 | (단기) 이동 방향 좌우 반전 또는 몸 기울기 복원<br>(장기) 예약된 빈 셀에 4방향 아틀라스 추가 | **데이터**: 없음<br>**성능**: 하 (단, 단기 좌우반전 시 비대칭 소품·이름표 제외 필요) |
| **⑤ 보행 반동·발주기 불일치** | 인간 `--step-bounce` 최대 `-0.65px`, `--step-lean` 고정 `0.9deg`, 고양이 `0.35px`, 보리 `pace=0.2`(1걸음 8.3초), 동행 마스코트 bob 없음 | `hani-office-live.js:3680-3683` (`distanceGait`), `:2004`, `:3457, 3481` (`petMotion`), `:3640` (`pet-bori` `0.2`), `:3232, 3241` (`companionSnapshot`), `hani-office-live.css:228` (`kid-suyeon`만 적용) | 발은 느리게 또는 헛돌고, **몸이 위아래·좌우 리듬 없이 바닥을 미끄러지듯** 움직임 | `bounce` `2~3px`, `lean`을 `cos(phase*π)` 좌우 흔들림으로 변경, `step` `40px` 조정, 보리 `pace` 상향, 수현·마스코트 bob 적용 | **데이터**: 없음<br>**성능**: 하 |
| **⑥ 대기(Idle) 정지감** | 앉기/서기 호흡(`breathe`, `sway`, `pet-idle`, `pet-sleep`) 변위가 `1~1.2%` / `0.35°`로 `1px` 미만 | `hani-office-live.css:175-178`, `:254-256`, `:270` | 앉아 있거나 서 있는 직원들이 **완전히 정지한 스티커(사진)**처럼 보임 | CSS 키프레임 `scaleY`/`rotate` 진폭을 시각적 최소 임계치(`2~3%`, `1~1.5deg`)로 상향 | **데이터**: 없음<br>**성능**: 하 (GPU transform 전용) |
| **⑦ 잦은 순간이동 (Teleport)** | 1) 직원이 펫 근처 지나갈 때 `free()` 실패로 원위치 스냅<br>2) 회장님 `facing`/보행 전환 시 동행자 앞↔뒤 점프<br>3) `kidsVisit`/트리오 종료 시 복귀 점프<br>4) 층 전환·`selectFloor` 시 즉시 스냅<br>5) 층간 엘리베이터 1.6s 대기 후 소멸/출현 | `hani-office-live.js:3649`, `:3458, 3479` (`petMotion`), `:3221-3231` (`companionSnapshot`), `:3315, 3323` (`companionActivity`), `:3180` (`kidsVisits`), `:3611, 3622, 3636` (`trio`), `:4611` (`selectFloor`), `:900, 907-916` (`stateAt`) | 잘 가던 동물·아이·직원이 **갑자기 뿅 하고 다른 자리로 순간이동**함 | 펫 `free()` 일시 충돌 시 스냅 대신 제자리 대기/회피, 동행자 목표 좌표 보간(슬루 레이트), 엘리베이터 페이드 전환 | **데이터**: 없음<br>**성능**: 하 |
| **⑧ 방향 전환(Flip) 오류** | 펫 수직 이동(`dx=0`) 시 `fallback` 고정, `kidsVisits`는 전체 경로 끝점 기준, `companionActivity` 수직 이동 시 무조건 `right` | `hani-office-live.js:3439` (`petFacing`), `:3500-3517` (`residentStops`), `:3191` (`kidsVisits`), `:3325` (`companionActivity`) | 위아래로 걷는데 옆을 보거나, 꺾어 도는데 진행 방향 반대를 보고 걸음 | 수직 이동 시 직전 `facing` 유지, `kidsVisits`·`companionActivity` 모두 현재 구간 `(to[0] - from[0])`이 임계치 이상일 때만 전환 | **데이터**: 없음<br>**성능**: 하 |
| **⑨ 동시성 / 레이아웃 스래싱** | `200ms`/`2.4s`/`40s`/`180s` 격자 동기화, 아이·동물 발박자 `seconds*4` 고정 동기화, `updateResidents` 중 빈번한 `fitStatusLabels()` 호출 | `hani-office-live.js:635-636`, `:801, 854`, `:1790`, `:3191, 3232, 3325`, `:3424-3425`, `:4524-4609`, `:4680, 4712` | 여러 캐릭터가 **한 박자에 맞춰 동시에 출발·정지·발구름**을 해 기계적으로 보임, 간헐적 프레임 드랍 | 위상(phase) 지터 분산, 발박자 개별 위상/거리 기반 전환, `fitStatusLabels` 실행 조건 축소 | **데이터**: 없음<br>**성능**: 개선 (리플로우 감소) |
| **⑩ 회의 소집 속도 불일치** | `seatActor` 이동 시간 계산에서 `1000×640` 설계 좌표를 `180`(1672×941 기준)으로 나눔 | `hani-office-live.js:4696-4698` (`travel.path` vs `visualPoint`), `spatial-contract.json:8, 8849` | 회의실 소집/복귀 걸음 속도가 평상시와 다르고 가로·세로 체감 속도가 어긋남 | `4696`의 `duration` 계산을 `4697`의 `visualPoint` 기반 `length`와 동일 좌표계로 통일 | **데이터**: 없음<br>**성능**: 하 |
| **⑪ Reduced Motion 분기** | `prefers-reduced-motion: reduce` 시 모든 보행·애니메이션이 꺼져 **순간이동만 발생** | `hani-office-live.js:3764-3765`, `:907`, `:2095`, `:3422`, `:3637`, `:3710`, `hani-office-live.css:41, 179, 207-210, 271, 276` | (OS 모션 축소 켜진 기기일 경우) 아예 걷지 않고 순간이동만 함 | 회장님 피드백("움직임이 부자연스럽다")상 일반 모드일 가능성이 높으나, 저모션 기기 여부 확인 권장 | **데이터**: 없음<br>**성능**: - |

---

## 3. 항목별 상세 코드 근거 분석

### (1) 이동 방식: `setInterval(100ms)` + 무가감속 선형 보간 + 직각 코너
- **위치 반영 방식**: `hani-office-live.css:20`에서 `.hani-office-actor`에는 `transition: opacity .3s`만 선언되어 있고, 좌표(`left`, `top`) 트랜지션은 없습니다. `hani-office-live.js:4679`의 `setInterval(..., 100)`이 100ms마다 `moveActor(actor, position)`(`:3808-3811`)를 호출해 `actor.style.left`와 `actor.style.top`을 직접 덮어씁니다.
  - 참고: `hani-office-live.css:18-19` 주석대로 `.hani-office-actor`는 자식 라벨의 스택 컨텍스트 분리 방지와 `stableActorBox()` 좌표 일관성을 위해 `transform: translate` 대신 `left`/`top`을 의도적으로 사용합니다.
- **등속 직선 이동 & 코너 꺾임**:
  - `SCREEN_SPEED = 180` (`:881`, `spatial-contract.json:8849`) 고정 속도로, `stateAt()`(`:907-909`)은 `ratio = (seconds - leg.start) / (leg.end - leg.start)` 선형 보간만 수행합니다.
  - `route()`(`:326-343`)는 문·복도 교차점 기반 최단 경로를 꺾은선으로 반환하며, 각 구간 끝에서 감속이나 곡선 회전(spline/Bezier) 없이 다음 구간 방향으로 즉시 90° 꺾입니다.
- **대조적인 반려동물과 아이들의 차이**:
  - 반려동물 `petRoute()`(`:3440-3455`)는 `offset = 4*t*(1-t)*bend` 완만한 곡선과 `petEase(t) = t*t*(3-2*t)`(`:3438`) 가감속을 적용합니다.
  - 반면 아이들 `companionActivity()`(`:3320-3323`)는 `lengths` 배열을 순회하며 **세그먼트마다** `e = petEase(t)`를 적용하므로, 격자 경로(`:3134-3140` 32px 단위 BFS)나 원형 16분할(`:3294`)을 걸을 때 매 마디마다 가속→감속→정지→재가속을 반복해 뚝뚝 끊깁니다.
- **회의 소집 좌표계 불일치 버그**: `:4696`에서 `duration`은 `b.x - a.x, b.y - a.y`(1000×640 설계 좌표계)로 구하고, `:4697`의 `length`는 `visualPoint`(1672×941 픽셀 좌표계)로 구합니다. 회의 소집 시 실제 이동 속도가 `180px/s`와 어긋납니다.

### (2) 걷기 애니메이션과 이동 속도 불일치 & 미미한 동작
- **앞면(front) 전용 2프레임 걷기**: `assets/sprites-v3/manifest-v3.json:6` 및 `manifest.json:6`에 명시된 대로 모든 직원·NPC는 row 0의 `standing`, `sitting`, `walk-a`, `walk-b` 4칸(정면 전용)만 채워져 있습니다.
- **발걸음 주기 vs 속도**:
  - `distanceGait()`(`:3680-3683`)는 `step = 60` art-px마다 `walk-a`/`walk-b`를 교대합니다(`180 / 60 = 초당 3걸음`). 2프레임만 교대하므로 중간 자세 없이 좌우 발만 333ms마다 휙휙 바뀝니다.
  - `snapshot()`(`:2004`)은 이와 별개로 시간 기반 `Math.floor(seconds * 5) % 2`(5Hz)를 반환합니다.
  - `pet-bori`는 `residentSnapshot()`(`:3640`)에서 `pace = 0.2`를 넘겨 `18 * 0.2 = 3.6 px/s`로 움직이는데 `stride = 30`(`:3481`)이므로 **한 걸음 전환에 무려 8.3초**가 걸려 발이 멈춘 채 미끄러집니다.
  - `companionSnapshot()`(`:3232`)과 `companionActivity()`(`:3325`)는 이동 거리가 아니라 `Math.floor(seconds * 4) % 2` 시간 고정(4Hz)을 씁니다.
- **미미한 Bob/Lean**:
  - 인간 직원 `distanceGait()`(`:3682`): `bounce` 최대 `-0.65px`, `lean`은 진행 방향 부호(`Math.sign(dx) * .9`)로 **고정 0.9°**입니다. 보행 리듬에 따른 좌우 기우뚱거림(`cos`)이 없고 `0.65px` 바운스는 화면에서 사실상 보이지 않습니다.
  - 고양이 `pet-cat`(`:3481`): `bob` 최대 `0.35px`로 거의 0에 가깝습니다.
  - 동행자: `companionSnapshot()`(`:3243, 3248`)에서 `kid-suyeon` 순찰 시에만 `motion`이 들어가고, `companion-frog`(개구리) 등 동물 마스코트는 회장님 추종 시 `motion.bob`이 아예 없습니다. 또한 `hani-office-live.css:228`은 `[data-person="kid-suyeon"]`만 `--pet-bob`/`--pet-lean`을 연결해 `kid-suhyeon`은 누락되어 있습니다.

### (3) 순간이동(Teleport) 발생 조건 전수
1. **층간 이동(엘리베이터/계단 구간)**: `travelSeconds()`(`:900`)는 층이 다를 때 `1.6초`를 배정하고, `stateAt()`(`:907-916`)은 이 1.6초 동안 출발 층 엘리베이터 앞에 `walking: false, waiting: true`로 정지시켰다가 시간이 되면 다음 층 엘리베이터에 **즉시 출현**시킵니다(`:4484` `hidden=true` 전환).
2. **반려동물 충돌 회피 스냅**: `residentSnapshot()`(`:3618, 3649`)과 `petMotion()`(`:3458, 3479`)에서 `free()`(반경 96~100px 내 직원·다른 펫 존재 여부)가 `false`가 되면 즉시 `null`을 반환해 **기본 스팟(`anchor.visual`) 또는 `fallback` 스팟으로 1프레임 만에 점프**합니다. 직원이 복도를 걸어가다 동물 옆을 스치기만 해도 동물이 순간이동합니다.
3. **회장님 동행자(아이들·마스코트) 급변 스냅**:
   - `companionSnapshot()`(`:3221-3231`)은 매 100ms마다 `chair` 주변 후보 중 첫 번째 `free` 좌표를 즉시 선택합니다. `chair.facing`이 바뀌거나, `chair.walking`이 켜지거나(`kid-suyeon`은 `behind` 부호가 `-1`로 반전되어 뒤↔앞으로 196px 즉시 점프!), 좁은 통로에서 주 후보가 막히면 반대편이나 원거리 `residentStops`(`:3230`)로 순간이동합니다.
   - `companionActivity()`(`:3315, 3323`)에서 수연의 `kind === 0`(`cling`)처럼 왕복이 아닌 단방향 경로가 끝난 직후 `rhythm.beat`가 바뀌면 다시 `companionSnapshot`의 `home` 위치로 순간이동합니다.
4. **특별 장면 시작·종료 스냅**: `residentTrioHold` 12초 만료(`:3611, 3636`), `residentVisit` 대상 직원이 걷기 시작해 `visit`이 `null`이 될 때(`:3549, 3627`), `kidsVisits` 중 회장님이 걷기 시작해 `active = null`이 될 때(`:3180`) 모두 걸어 돌아가지 않고 원위치로 점프합니다.
5. **층 탭 전환 및 화면 복귀**: `selectFloor()`(`:4611`) 호출 시 `finishTravel(actor)`(`:3806`)가 `officeTravel` 중인 배우를 목적지 좌석으로 즉시 점프시킵니다. 탭 비활성/백그라운드 후 복귀(`:4614`) 시에도 `Date.now()` 기준 위치로 일괄 재투영됩니다.

### (4) 방향 전환(Facing / Flip)
- **인간 직원/방문객**: `snapshot()`(`:1962-1965`)은 `event?.patrol`(성민 회장 순찰)에만 `state.facing`을 계산하고, 나머지 20명의 직원과 방문객은 이동 중 `facing`이 갱신되지 않습니다. 더구나 CSS(`hani-office-live.css:182-188`)에서 `data-facing`은 `scaleX(-1)` 좌우 반전이 아니라 **정지 시 ±4° 기울기**일 뿐이고, 걷기(`data-walking="true"`) 때는 `rotate: none`으로 이마저 해제됩니다.
- **반려동물**: `petFacing()`(`:3439`)은 `Math.abs(dx) < 12`이면 `fallback`(`seed % 2`)을 사용합니다. 그런데 2F~5F의 `residentStops`(`:3500-3517`) 상당수가 **동일한 X좌표(`51` 또는 `52`)에서 Y축으로만 이동**하므로 `dx = 0`이 되어 항상 고정 시드 방향으로 옆을 보며 세로 이동합니다. 또한 `residentLife()`(`:3426, 3430`)의 `'turn'` 모션은 `0.35s` 시점에 `facing`만 1프레임 스냅하고 CSS `scaleX(0.8)`(`:268`)은 `0.6s` 동안 돌아와 타이밍이 엇갈립니다.
- **아이들**: `kidsVisits`(`:3191`)는 현재 이동 구간이 아니라 경로 전체의 시작점과 끝점(`path.at(-1)[0] - path[0][0]`)으로 `facing`을 정해 우회 시 뒤로 걷는 것처럼 보입니다. `companionActivity()`(`:3325`)는 `to[0] < from[0] ? 'left' : 'right'`를 써서 수직 구간(`to[0] === from[0]`)마다 무조건 `'right'`로 튐이 발생합니다.

### (5) 동시성 및 대기(Idle) 정지감
- **기계적 박자 동기화**:
  - 스케줄러(`:1790` 45s/180s, `:635-636` 40s/55s + `0~3s` 창, `:801, 854` `2.4s` 비트)가 고정 격자에 맞춰져 있고,
  - 아이들과 동행 마스코트의 걷기 프레임(`:3191, 3232, 3325`)이 모두 동일한 `Math.floor(seconds * 4) % 2` 전역 시계를 공유해 두 아이/회장+마스코트가 완벽한 군무처럼 동시에 발을 내딛습니다.
  - `residentLife()`(`:3425`)는 4마리 펫을 `period=6s`, `slot*2`초 간격에 배치해 매 2초마다 정확히 1마리씩 교대로 짧은 동작(`1.2s`)을 반복합니다.
- **대기 포즈의 정지감**:
  - `hani-office-breathe`(`:177`): `scaleY(1.012) rotate(.35deg)` — 68px 기준 약 **0.8px** 변화.
  - `hani-office-sway`(`:178`): `rotate(.65deg) scaleY(1.01)` — **1px 미만**.
  - `hani-pet-sleep`(`:270`), `hani-pet-idle`(`:256`): `1.2~3%` 축소·확대로 역시 육안으로 변화를 인지하기 어렵습니다.
  - 소품 애니메이션(`hani-office-live.css:298-311`)도 `4.8s` 동안 `steps(4)`(1.2초당 1프레임)로 느리게 뚝뚝 넘어갑니다.

### (6) 갱신 주기 및 메인 스레드 부하
- `setInterval(..., 100)`(`:4679`) 자체가 **최대 10fps** 상한이므로 `180 px/s` 속도에서 매 프레임 **18 art-px**씩 건너뜁니다.
- 여기에 100ms마다 `updateResidents(now)`(`:4681`)가 실행되어 펫/아이 상태 변화 시 `changed=true` → `fitStatusLabels()`(`:4609`)를 호출하고, 200ms마다 `updateBuilding(false, false)`(`:4680`)가 `building.snapshot()`을 재계산합니다. `fitStatusLabels()`(`:3847-3898`)는 다수의 `getBoundingClientRect()` DOM 레이아웃 읽기와 9패스+빔서치 라벨 패킹(`:2311-2341`)을 수행하므로, 100ms 간격이 불규칙해져 끊김이 더 두드러집니다.

### (7) `prefers-reduced-motion` 및 성능 제한 분기
- `hani-office-live.js:3764`에서 `matchMedia('(prefers-reduced-motion: reduce)')`가 참이면 `reduced = true`가 되어 **직원 보행(`:907`), 방문객 이동(`:2095`), 반려동물 보행(`:3637`), 동행자 이동(`:3232, 3328`), 반응 큐(`:3710`), CSS 애니메이션(`hani-office-live.css:41, 179, 207-210, 271, 276`)이 모두 정지**합니다.
- 만약 회장님 PC(Windows "애니메이션 효과" 끔)나 iPhone("동작 줄이기" 켬)에서 해당 설정이 켜져 있다면 캐릭터는 걷지 않고 순간이동만 합니다. 다만 회장님 피드백이 *"움직임이 부자연스럽다"*인 점을 보면 기본 모션(`reduced = false`)에서 위의 ①~⑥ 현상을 보셨을 가능성이 높습니다.

---

## 4. 추천 개선안 3단계 (작은 변경부터 단계별 로드맵)

> **저장소/데이터 안전 확인**: 아래 1~3단계 모두 **화면 표시·애니메이션 전용(UI/Renderer Layer)**이며, `localStorage`(`hani_os_life_v23`, `hani_office_affinity_v1`), 내부 기준 버전(`2.9.15-safe-baseline-bootstrap`), Cloud(Supabase) 스키마 변경이 **전혀 필요 없습니다**. (`AGENTS.md` §2·§5 준수, **회장님 별도 데이터 승인 불필요**, 일반적인 코드 수정/Preview 확인·배포 승인 절차만 적용)

### 1단계: CSS 수치 및 소규모 파라미터 조정 (Risk: **LIGHT**)
코드 구조를 건드리지 않고 CSS 키프레임 진폭·걷기 리듬 수치·속도 파라미터만 보정해 즉각 "살아 숨 쉬는 느낌"을 키우는 단계입니다.

- **대상 파일 · 심볼**:
  - `hani-office-live.css`: `@keyframes hani-office-breathe`, `hani-office-sway`, `hani-pet-idle`, `hani-pet-sleep`, `hani-office-actor[data-person="kid-suyeon"]` 규칙(`:175-178, 228, 256, 270`)
  - `hani-office-live.js`: `distanceGait` (`:3680-3683`), `residentSnapshot` (`:3640` `pet-bori` `pace`), `petMotion` (`:3481` `pet-cat` `bob`), `companionSnapshot` (`:3241, 3248`), `companionActivity` (`:3327`)
- **구체적 조정안**:
  1. **대기 숨쉬기 가시화**: `breathe`를 `scaleY(1.028) rotate(.8deg)` 수준으로, `sway`를 `rotate(1.4deg) scaleY(1.02)` 수준으로 확대(라벨·책상 마스크와 충돌하지 않는 1~2px 내외). `pet-sleep`·`pet-idle`도 `2.5~4%`로 보정.
  2. **걷기 바운스·흔들림 복원**: `distanceGait`의 `step`을 `60 → 40`으로 줄이고, `bounce`를 `-0.65px → -2.4px`로 확대하며, `lean`을 고정 `±0.9deg` 대신 걸음 위상에 맞춘 `Math.cos(phase * Math.PI) * 2.2` 좌우 리듬 흔들림으로 변경.
  3. **동물·아이 리듬 보정**: `pet-bori`의 `pace`를 `0.2 → 0.6`으로 높여 8.3초 슬로우 문워크 해소; `pet-cat` 보행 `bob`을 `0.35 → 1.1px`로 상향; `companion-frog` 등 마스코트 추종 시에도 2px 내외 가벼운 통통 튐 부여; CSS `:228`에 `kid-suhyeon`도 포함.
  4. **걸음 박자 흩뜨리기**: 동행자/아이들의 `Math.floor(seconds * 4)`에 캐릭터별 시드 오프셋을 더해 동시 군무 현상 완화.
- **예상 효과**: 캐릭터들이 정지 스티커처럼 굳어 있거나 밋밋하게 미끄러지던 느낌이 크게 줄고, 걸을 때 발·몸의 통통 튀는 생동감이 즉시 살아납니다. (단, 10fps 계단 현상과 정면 게걸음은 2단계에서 해결)

### 2단계: `rAF` 60fps 보간 분리 + 가감속/코너링 + 순간이동/방향 버그 수정 (Risk: **NORMAL**)
현재의 100ms `setInterval`이 "스케줄 계산"과 "프레임 렌더링"을 동시에 묶고 있는 구조를 분리하고, 순간이동과 방향 오류를 잡는 단계입니다.

- **대상 파일 · 심볼**:
  - `hani-office-live.js`: 메인 루프(`:4679-4712`), `stateAt` (`:902-917`), `sampleMotion` (`:3684-3696`), `petMotion` (`:3456-3484`), `petFacing` (`:3439`), `companionActivity` (`:3275-3351`), `companionSnapshot` (`:3204-3274`), `residentSnapshot` (`:3607-3655`), `kidsVisits.update` (`:3177-3195`), `seatActor` (`:4403-4413`), `selectFloor` (`:4611`)
  - `hani-office-live.css`: `.hani-office-sprite` 보행 방향 반전/모션 규칙
- **구체적 개선안**:
  1. **렌더 보간 `requestAnimationFrame` 분리**:
     - `scheduler.snapshot()`과 `fitStatusLabels()`는 기존처럼 200~500ms(또는 상태/텍스트 변경 시만) 수행.
     - 화면에 보이는 동안(`sceneVisible()`) 보행 중인 액터가 1명이라도 있으면 `rAF`(최대 60fps, 또는 30fps 제한)로 위치(`left`/`top`)와 `--step-bounce`/`--step-lean`만 보간. (`left`/`top`을 유지하므로 기존 stacking context 불변식 보존!)
  2. **가감속(Easing) & 코너 라운딩**:
     - `stateAt` 및 `officeTravel`의 `ratio`에 구간 시작·끝 **ease-in-out(또는 전체 경로 양 끝단 0.4s 가감속)**을 적용하고, 직각 교차점 통과 시 짧은 쿼드라틱 베지어 코너 블렌딩 적용(기존 `furniture`/충돌 안전 마진 `24px` 내에서 8~12px 코너만 부드럽게).
     - `companionActivity`의 `petEase`를 세그먼트 `t`가 아닌 **전체 경로 누적 거리 `cursor / length`** 기준으로 계산해 다구간 버벅임 제거.
     - `4696` 회의 이동 `duration` 계산을 `visualPoint` 기준 거리로 통일.
  3. **순간이동(Teleport) 제거**:
     - `residentSnapshot`·`petMotion`에서 직원이 잠시 지나가 `free()`가 false가 될 때 즉시 원위치/fallback으로 텔레포트하는 대신 **최대 2~3초간 제자리 대기(`walking=false`, 기존 좌표 유지)** 후 우회하거나 지나간 뒤 재개.
     - `companionSnapshot`에서 회장님 방향 전환/정지 시 아이/마스코트 목표 좌표가 바뀌면 즉시 텔레포트하지 않고 `180px/s` 속도로 목표점까지 걸어 이동(또는 짧은 스무딩 추종).
     - 층간 엘리베이터 구간(`1.6s`)에 `opacity` 페이드 아웃/인(`0.25s`) 추가해 갑작스러운 소멸/출현 완화.
  4. **방향 전환 보정 + 스프라이트 좌우 구분**:
     - `kidsVisits`·`companionActivity`·`petFacing`에서 수직 이동(`|dx| < 12px`) 시 직전 `facing`을 유지하고, 항상 현재 구간의 `to[0] - from[0]` 기준으로 `facing` 갱신.
     - (아틀라스 확장 전 과도기 조치) 인간 직원 보행 시 `scaleX(-1)` 반전은 **비대칭 디자인(가르마/뱃지/들고 있는 소품) 왜곡 여부**를 아린/대표님 Preview 확인 후 선택 적용하거나, 최소한 보행 시 진행 방향 쪽으로 `±3°` 미세 진행 기울기(`data-walk-facing`) 부여.
- **예상 효과**: **10fps 끊김이 60fps 부드러운 움직임으로 바뀌고**, 급출발·급정거·지렁이 걸음·갑작스러운 순간이동이 체감상 대부분 사라집니다. 가장 가성비가 높은 핵심 단계입니다.

### 3단계: 4방향·다프레임 아틀라스 완성 & 자연스러운 군중 회피 (Risk: **NORMAL ~ 에셋 작업 포함**)
원래 `spatial-contract.json:9429-9443`에 설계되어 있던 풀 애니메이션 사양을 구현하는 중장기 완성 단계입니다.

- **대상 파일**:
  - `assets/sprites-v3/*.webp` & `manifest-v3.json`, `assets/sprites-v2/*.webp` & `manifest.json` (현재 row 0의 4칸만 채워진 예약 슬롯에 `back`, `left`, `right` 및 걷기 4프레임/대기 2프레임 채움)
  - `hani-office-live.js` (`applyPose`, `distanceGait`, `clearSweep` / `residentVisit`)
- **구체적 개선안**:
  1. **4방향 × 4프레임 걷기(8fps)**: 정면·후면·좌·우 4방향 스프라이트와 중간 통과(contact/passing) 프레임을 추가해 게걸음/문워크를 근본적으로 해결.
  2. **대기 2프레임(눈 깜빡임 / 타이핑 / 고개 끄덕임)**: `standing`/`sitting` 2프레임 교대로 자리에 앉아 일하는 생동감 완성.
  3. **동적 회피 & 엘리베이터 문 연출**: 충돌 직전 텔레포트 대신 살짝 비켜 서는 회피 오프셋 및 승강기 문 열림/닫힘 전경 마스크(`spatial-contract.json:9457`) 연결.
- **예상 효과**: 상용 2D 라이프 시뮬레이션 게임 수준의 자연스러운 보행과 공간감을 완성할 수 있습니다.

---

## 5. 회장님용 쉬운 설명 (3줄)

1. **지금 캐릭터들이 딱딱해 보이는 이유**는 1초에 10번씩 위치만 뚝뚝 끊어 옮기는 데다, 직원 그림이 앞모습 2장뿐이라 옆으로 갈 때도 앞을 본 채 미끄러지고, 걸음 반동·숨쉬기 움직임이 1픽셀도 안 돼 거의 정지해 보이기 때문입니다.
2. **가끔 갑자기 순간이동하는 이유**는 직원이 동물 옆을 지나가거나 회장님이 방향을 바꿀 때, 충돌을 피하려고 부드럽게 비켜 가는 대신 원래 자리로 즉시 점프시켜 버리는 안전장치가 작동하기 때문입니다.
3. **고치는 순서**는 ① CSS 숨쉬기·걸음 반동 크기부터 키워 생동감을 살리고(1단계), ② 60프레임 부드러운 이동·가감속·순간이동 방지를 코드로 다듬은 뒤(2단계), ③ 나중에 좌우·뒷모습 걷기 그림을 채워 넣는(3단계) 것이 가장 안전하고 효과적입니다.

---

## 6. 세줄 요약

1. HANI GROUP 사무실 움직임이 부자연스러운 주원인은 ① `100ms`(10fps) 무가감속 직선 이동, ② 정면 전용 2프레임 스프라이트와 `1px` 미만 보행·대기 진폭, ③ 충돌/동행 전환 시의 즉시 좌표 스냅(순간이동), ④ 전역 시계 기반 박자 동기화와 레이아웃 재계산 지터입니다.
2. 저장소(`localStorage`/Cloud) 변경 없이 **1단계(CSS/수치 조정으로 숨쉬기·바운스·보리 속도 개선) → 2단계(`rAF` 60fps 보간, 가감속·코너링, 텔레포트·방향 버그 수정) → 3단계(4방향 아틀라스 확장)** 순으로 개선하는 것을 권장합니다.
3. 특히 **1·2단계만 적용해도** 데이터 위험 없이 끊김·미끄러짐·순간이동 체감을 크게 줄여 회장님이 원하시는 자연스러운 움직임을 빠르게 구현할 수 있습니다.
