# 사무실 생활 소품 적용 보고

2026-11-06 KST · Codex · `hani/office-props-live` · base `813124e8087accbcce59f12a64b091f144e0b2c3` · 미커밋.

기존 map owner에 고정 레이어 1개·소품 7개를 한 번 생성하고 CSS `steps(4)`로만 재생합니다. 배경 확정 시 층·실제 야간 아트에 맞춰 표시합니다. actor·말풍선 아래, 배경 위이며 클릭을 통과합니다. 감소 모션은 2번 프레임 고정, 도장은 12초 중 약 0.8초만 반짝입니다.

| 소품 | 층 | 최종 px / % | 앵커 | 주기 |
|---|---|---|---|---|
| 커피/책상 | 1F | 238,570 / 14.234%,60.574% | 하단 중앙 | 2.4초 |
| 커피/카운터 | 1F | 1530,720 / 91.507%,76.514% | 하단 중앙 | 2.4초 |
| 화분 | 2F | 1197,314 / 71.591%,33.369% | 하단 중앙 | 4.8초 |
| 모니터 | 3F | 466,480 / 27.871%,51.010% | 중심 | 4.8초·불투명도0.32 |
| 랜턴 | 5F 야간 | 1380,738 / 82.536%,78.427% | 하단 중앙 | 3.2초 |
| 도장 | 3F | 213,676 / 12.739%,71.838% | 중심 | 12초 |
| 종이 | 1F | 1605,520 / 95.993%,55.260% | 중심 | 4.8초 |

1672×941 기준. 책상 커피는 (225,542)에서 (+13,+28), 모니터는 (429,458)에서 (+37,+22), 도장은 (213,650)에서 (0,+26) 이동했습니다. 실제 직원 몸·이름/상태 라벨이 효과를 덮는 위치여서 인접 상판·화면 오른쪽 가장자리로 조정했습니다. 휴대폰의 기존 최소 크기 캐릭터와 이동 방문객 라벨은 순간 소품 위를 덮을 수 있습니다. 종이는 지정 판넬 좌표를 유지했습니다.


**검증:** 전용 `node scripts/hani-office-props.test.mjs` **11/11 통과**(새 소품 5 + 기존 engine 6), JS syntax 통과. 보호된 scheduler(plan/blockPlan 포함)·snapshot·라벨 배치·home-clear·주민 7구간 및 자산6개 SHA-256 동일. 변경 범위 외 JS와 기존 CSS 바이트 동일. 기존 timer 6개·listener16개 불변, 신규 rAF·저장 경로0. [원문 검사](source-checks.json) / [기준 해시](baseline.json).

실제 격리 Edge: 소품4프레임·도장 긴 idle·감소 모션2번 프레임·낮 랜턴 숨김·직원/바리스타/퀸 클릭 통과·storage write0·pageerror0 확인. 밤 아트가 실패하면 랜턴 숨김은 owner 실행 fixture로 검증했습니다. 런타임 closure **152/160·누락0**, 신규 런타임 JS/CSS0·기존 WebP6개 참조. [브라우저 결과](browser-results.json) / [closure](closure.json).

| 야간 화면 | 390×844 | 1280×900 |
|---|---|---|
| 1F | [PNG](1f-night-390x844.png) | [PNG](1f-night-1280x900.png) |
| 2F | [PNG](2f-night-390x844.png) | [PNG](2f-night-1280x900.png) |
| 3F | [PNG](3f-night-390x844.png) | [PNG](3f-night-1280x900.png) |
| 5F | [PNG](5f-night-390x844.png) | [PNG](5f-night-1280x900.png) |

전체 **45명령: 24성공·21미통과**, 테스트 합계 **481통과·26실패·3skip**(공통 fixture import 중복 포함). 모든 명령은 내장 Node v24.22.1에서 `node scripts/<파일>`로 실행했습니다. [전체 집계](final-test-results.json). 변경 전에 끝난 영향 검사17개를 최종 소스로 재실행했습니다. `obr14` 최초120초 중단 후600초 한도로 재실행하여 4통과·Git 차단1개로 완료했습니다. 병렬 실행 중 성능2개 실패는 동일 최종 소스의 단독 재실행에서 통과했습니다.

| 테스트 (`hani-office-*.test.mjs`) | 통과/실패/skip | 결과 |
|---|---:|---|
| [219](hani-office-219.test.mjs.log) | 0/0/0 | Git 차단 |
| [actions-216](hani-office-actions-216.test.mjs.log) | 14/1/0 | Git 차단 |
| [actions-221](hani-office-actions-221.test.mjs.log) | 20/0/0 | 통과 |
| [barista](hani-office-barista.test.mjs.log) | 10/0/0 | 통과 |
| [behavior](hani-office-behavior.test.mjs.log) | 10/0/0 | 통과 |
| [bubble-close](hani-office-bubble-close.test.mjs.log) | 17/0/0 | 통과 |
| [cafe-rest](hani-office-cafe-rest.test.mjs.log) | 3/1/0 | Git 차단 |
| [chairman-234](hani-office-chairman-234.test.mjs.log) | 0/0/0 | Git 차단 |
| [consult](hani-office-consult.test.mjs.log) | 18/2/0 | Git 차단 + 소스 pin |
| [crowded-labels](hani-office-crowded-labels.test.mjs.log) | 19/0/0 | 통과 |
| [drama](hani-office-drama.test.mjs.log) | 20/0/0 | 통과 |
| [fix-218](hani-office-fix-218.test.mjs.log) | 6/0/0 | 통과 |
| [floor-bubble](hani-office-floor-bubble.test.mjs.log) | 18/0/0 | 통과 |
| [hd-224](hani-office-hd-224.test.mjs.log) | 10/0/0 | 통과 |
| [icons](hani-office-icons.test.mjs.log) | 14/1/0 | 소스 pin |
| [labels-qa](hani-office-labels-qa.test.mjs.log) | 17/0/0 | 통과 |
| [lively-v2](hani-office-lively-v2.test.mjs.log) | 7/1/0 | Git 차단 |
| [lively](hani-office-lively.test.mjs.log) | 13/0/0 | 통과 |
| [motion-1](hani-office-motion-1.test.mjs.log) | 15/1/0 | 소스 pin |
| [motion-2](hani-office-motion-2.test.mjs.log) | 24/0/0 | 통과 |
| [obr10](hani-office-obr10.test.mjs.log) | 4/0/0 | 통과 |
| [obr12](hani-office-obr12.test.mjs.log) | 0/0/0 | Git 차단 |
| [obr14](hani-office-obr14.test.mjs.log) | 4/1/0 | Git 차단 |
| [obr15](hani-office-obr15.test.mjs.log) | 13/1/0 | Git 차단 |
| [obr16](hani-office-obr16.test.mjs.log) | 12/0/0 | 통과 |
| [obr17](hani-office-obr17.test.mjs.log) | 3/0/0 | 통과 |
| [obr18](hani-office-obr18.test.mjs.log) | 12/0/0 | 통과 |
| [obr19](hani-office-obr19.test.mjs.log) | 3/0/0 | 통과 |
| [obr21](hani-office-obr21.test.mjs.log) | 3/3/0 | Git 차단 + 소스 pin |
| [obr3](hani-office-obr3.test.mjs.log) | 5/0/0 | 통과 |
| [obr4](hani-office-obr4.test.mjs.log) | 8/2/0 | Git 차단 |
| [obr6](hani-office-obr6.test.mjs.log) | 0/0/0 | Git 차단 |
| [obr7](hani-office-obr7.test.mjs.log) | 0/0/0 | Git 차단 |
| [obr8](hani-office-obr8.test.mjs.log) | 2/1/0 | Git 차단 |
| [obr9](hani-office-obr9.test.mjs.log) | 0/0/0 | Git 차단 |
| [props](hani-office-props.test.mjs.log) | 11/0/0 | 통과 |
| [residents](hani-office-residents.test.mjs.log) | 42/7/0 | 소스 pin |
| [seats-215](hani-office-seats-215.test.mjs.log) | 12/0/0 | 통과 |
| [snack](hani-office-snack.test.mjs.log) | 26/0/0 | 통과 |
| [tap-lines](hani-office-tap-lines.test.mjs.log) | 15/0/0 | 통과 |
| [tlayout](hani-office-tlayout.test.mjs.log) | 11/2/0 | 소스 pin |
| [top-labels](hani-office-top-labels.test.mjs.log) | 7/0/0 | 통과 |
| [v2-215](hani-office-v2-215.test.mjs.log) | 17/1/2 | Git 차단 |
| [visitors-cafe](hani-office-visitors-cafe.test.mjs.log) | 5/0/0 | 통과 |
| [zoom](hani-office-zoom.test.mjs.log) | 11/1/1 | 소스 pin |

**차단/서윤 인계:** `spawnSync git EPERM`은 BLOCKED이며 PASS가 아닙니다(기준 소스 취득 실패 6명령·개별 검사12건). 소스 pin 실패14건은 consult·icons·motion-1·obr21·residents·tlayout·zoom의 보존 경로에서 발생했습니다. icons:111의 pin1개, zoom:147의 pin1개, residents:110/261/284/347/446/460/488의 pin7개가 실패했습니다(정확한 위치는 JSON·로그 우선). `restoreTlayoutSource`의 승인된 G 해시 guard와 tlayout exact-input pin을 서윤 담당자가 조정해야 합니다. icons:117의 명시적 createElement 증가 기대값(+10)은 선행 pin 실패로 미도달; 새 레이어·span 생성 호출 지점 +2(실제 고정 DOM +8)를 반영할 필요가 있습니다. 기존 assertion을 삭제·완화하거나 pin/기대값을 수정하지 않았습니다.

**변경 파일:** `hani-office-live.js`, `hani-office-live.css`, 신규 `scripts/hani-office-props.test.mjs`, 이 폴더의 REPORT/HANDOFF·좌표/검증JSON·로그·화면8장 및 보조 상세PNG. 기존 테스트가 이 폴더 밖의 검증 JSON도 재생성했습니다([경로 목록](test-generated-artifacts.json)). `assets/`·`data/`·Notion·Cloud/schema/AI·버전/cache는 수정하지 않았습니다.

**미검증/다음:** 실제 휴대폰·인증 계정·Production·독립 Arin/HINA·release gate는 미검증입니다. 로컬 화면 표시2.9.266·마지막 script `hani-launch-greeting.js` 확인, 운영 로딩은 미확인. 원격 main `b3da884c05e1c17637356681a158a9e8fa193d9b`와 base는 다르며 merge/rebase하지 않았습니다. CODEMAP의 소품 앵커 누락은 owner 파일 내 좁은 검색으로 보완했습니다. 다음은 서윤의 pin/생성 개수 보존 계층 정합화와 통합 검증입니다. 지시대로 commit·push·PR·merge·배포·버전 증가·Notion 갱신은 수행하지 않았습니다.
