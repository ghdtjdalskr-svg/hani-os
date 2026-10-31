# Office movement pass 1

## 작업 식별

- 날짜/담당: 2026-10-31 KST / Codex. 검토 담당: 사용자 지정 리뷰어(이름 원문 `??`).
- 상태: 구현·targeted 검증 완료 / 미커밋 리뷰·브라우저 확인 대기 / NORMAL / read-only UI.
- branch/worktree: `hani/office-motion-1` / `office-motion1`.
- base/HEAD: `b80b8d5406b3c1c5520d579618a71462d6164d2a`; 로컬 origin/main `b6656b43ecd9595367c177c569ea34a810f7a71d`. 캐시 main과 대상 세 런타임 파일 차이 없음. 원격 조회 연결 실패, 최신성 미확인. merge/rebase 없음.
- 시작 status 깨끗함. index 표시 태그 `2.9.241`, 마지막 script `hani-launch-greeting.js`. 실제 운영 로딩은 이번 범위 밖.
- 승인: 사용자 Task의 5종 미세 동작과 Node 테스트. commit/push/merge/version 변경 금지. Notion 수정 금지. 브라우저 차단 우회 금지.
- 수정 범위: `hani-office-live.js`, `hani-office-live.css`, `hani-desk-mascots.js`, `scripts/hani-office-motion-1.test.mjs`, 작업별 인수인계.
- CODEMAP_MISS: living-office owner는 맞지만 기존 homeAll/walk 외 최신 scheduler/label/mascot anchor·검사 누락. 실제 canonical 경로로 fallback.

## 결과와 증거

- 분석: 기존 단일 100ms 이동 루프 → scheduler snapshot/updateBuilding → persistent actor/pose/place → fitStatusLabels. CSS breathe/sway는 sprite transform 소유. mascot은 기존 persistent image + renderer projection observer 소유.
- 방향: 같은 clock을 최대30Hz로 변경, scheduler leg의 현재시각 좌표를 그대로 투영. 효과는 sprite dataset/CSS, 라벨은 안정 박스 측정. mascot clock도 같은 tick 재사용. 저장·Cloud·AI 경로 변경 없음.
- 검증: 신규14/14 PASS. 전체30파일 시도: 7 PASS / 22 FAIL / 1 종료되지 않아 중단. 전체 PASS 아님. 실제 브라우저/Android 미검증(사용자 지정 리뷰어 수행).
- Notion: 사용자 명시 지시에 따라 수정하지 않음.
- PR/main/Pages/운영 read-back: 수행하지 않음.

## 다음 담당에게

- 먼저 읽을 함수: scheduler.stateAt, updateBuilding, pose/place, fitStatusLabels, 단일 이동 loop, mascot update.
- CURRENT/DECISIONS: 타 담당 기록 보존. 이번 작업은 작업별 인수인계만 기록.

## 최종 변경 (2026-10-31 23:15 KST)

1. 걷기: 기존 clock을 34ms(최대 약29.4Hz)로 변경. scheduler의 기존 leg를 현재 시각으로 샘플링하고 누적 이동 거리 60 art-px마다 walk-a/b 교체. sprite bounce 최대0.65px, 진행 방향 lean0.9도. 좌표는 같은 actor 안 기존 sprite/label/tap 영역의 transform으로 투영하며 actor 자체에 stacking context를 만들지 않음. layout key의 매 프레임 시간 부분 제거, outing id 추가. scheduler 코드와 placeStatusLabels 규칙은 원문 SHA256으로 보존 검사.
2. 앉기/서기: 200ms anticipation, 발 pivot 기준 scaleY dip/settle. 예정 leg 출발 200ms 전 준비하고 실제 출발 시각에 projection을 갱신하여 보행 지연 없음. posture atlas 교체도 기존 pose owner에서 수행. 첫 mount/층 전환은 과거 자세 전환을 재생하지 않음.
3. 몸짓: 기존 greeting/partner/speaking dataset edge로 nod1회, 대화 상대끼리 320ms 늦춘 lean1회. 걷는 동안 bounded memory queue에서 대기. CSS에서도 walking일 때 one-shot 적용 차단. 지속 상태는 반복 재생하지 않음.
4. 탭: 기존 openBubble에 hop 요청 한 줄 추가. 기존 delegated click/keyboard/roster, bubble 내용·3초 timer·profile·pending tap 경로 유지. 중복 hop 요청은 하나로 합침. 걷는 동안 보류.
5. 마스코트: 기존 image/observer owner와 map의 공유 tick callback 사용. 보이는 층에서 약18초마다 하나만 wiggle/hop. 관찰된 owner away→home 때 1회 반응, floor/mount/숨김 복귀 때 가짜 도착 반응 없음. 동시1개, 이미지 밑변 anchor 보존.

- sprite와 prop/name/status/tap 영역의 경로 이동만 CSS 변수로 공통 투영. bounce/dip/hop은 sprite transform만 사용. label fitting은 actor의 안정 박스와 기존 고정 facing4도에서 계산한 안정 sprite envelope를 측정하고 mascot은 offset 기반 바닥 박스 측정. 효과 중 animated getBoundingClientRect를 읽지 않음. 기존 placeStatusLabels 함수 바이트와 라벨 z-index/packing 규칙 보존. sprite load callback도 중복 연결하지 않아 매 상태 갱신 때 재-fitting하지 않음.
- 기존 map IntersectionObserver + visibility cycle로 offscreen/tab hidden 모두 정지. 기존 paused CSS 재사용. 복귀 시 현재 시각 snapshot으로 재개. reduced-motion은 효과·queue를 reset하고 기존 reduced scheduler 위치/자세 투영 유지. 보이는 floor의 actor/image만 갱신.
- 회장님 frog도 같은 sprite/clock/effect 경로. 이름·nickname·아트 변경 없음.
- 보호 저장소/Cloud/schema/migration/AI 호출 경로 변경 없음. display version/cache/main/배포 변경 없음.

## 검증과 남은 위험

- 명령: `node scripts/hani-office-motion-1.test.mjs` → **14/14 PASS**, 최종 JS 두 파일 `node --check`, `git diff --check` PASS.
- 신규 테스트: 거리 frame, scheduler/placement 원문 SHA 고정, route leg/wait/floor/arrival projection 동등성, reduced 효과 제거, 걷는 중 reaction 보류, 단발 만료/정리, 효과 유무에 동일 label packing, 실제 owner의 pause/resume/slot/tap/이동/출발 전 dip, mascot 공용 clock·동시1개·복귀 반응 검증. DOM doubles이며 browser pixels 검증 아님.
- `HANI_GIT_PATH=(Get-Command git).Source` 지정 후 모든 `scripts/hani-office-*.test.mjs`를 browser 옵션 없이 실행. 전체 순회 뒤 변경 영향이 있는 motion/crowded-labels/hd-224/seats-215/tap-lines/actions-221 재실행. 마지막 출발 준비 보완 후 motion14 및 syntax 재실행. Candidate Freeze/One-Pass/HINA/버전 검사는 이 기능 탭 범위 밖.
- [전체 결과표·실행 근거](../../../artifacts/office-motion-1/REPORT.md), [로그별 통계·최종 파일 SHA256](../../../artifacts/office-motion-1/summary.json).
- **실패22**: Git 하위 프로세스 EPERM(여러 기존 helper가 HANI_GIT_PATH를 사용하지 않고 git 직접 spawn), 기존100ms timer 조회, 기존 즉시 서기(이번200ms anticipation과 충돌), 모든 non-placement 소스를 freeze한 obr21 계약. 기존 테스트 파일은 수정하지 않음. 알려진 **219 main 실패 유지**. 새 동작 테스트 PASS를 기존 검사 전체 PASS로 표현하지 않음.
- **v2-215 중단1**: 예전100ms timer 조회로 walking test 실패 후 pending meeting loop가 남아 프로세스가 끝나지 않아 해당 테스트 프로세스 중단. `node --test-skip-pattern=walking scripts/hani-office-v2-215.test.mjs`로 나머지 확인: PASS15 / FAIL2(Git EPERM·공통100ms) / browser SKIP2. 제외한 walking은 첫 전체 실행에서 실패한 항목.
- 변경 전 HEAD를 read-only FS adapter로 비교: crowded-labels19/19, actions-22120/20 PASS. 현재 crowded의 geometry/tap/name 검사는18개 모두 PASS이며 나머지1개는 import된 공통100ms 검사. 최신 원격 main 검증으로 간주하지 않음.
- CSS parser 미설치, 실제 CSS cascade/painting/hit-test/overlap·모바일 성능은 미검증. 브라우저 실행 시도0, 우회0. Android/360·390·416px 전 층·reduced·스크롤 offscreen·tab hidden·frog·desk labels·bubble·mascot 시각 검사는 지정 리뷰어가 수행.
- 테스트가 생성한 `artifacts/fix-218`, `l216-2`, `night-actions-221`, `office-behavior`의 JSON과 이 작업 artifact는 검증 산출물. 다른 담당 runtime·공통 문서 미수정.
- commit/push/merge/PR/버전 변경 없음. Notion은 사용자 명시 지시로 수정하지 않음. 서버 Edge Function/설정 동반 배포 없음.

다음 행동: 지정 리뷰어가 미커밋 diff 및 위 실패 계약을 검토하고 허용된 브라우저 환경에서 실화면 확인. 기능 탭이 main/배포로 진행하지 않음.

## 2차 수정 인수인계 (2026-10-31 KST)

### 작업 식별

- 담당: Codex / 지정 리뷰어 원문 `??`. 상태: 요청한 5개 회귀 수정 및 targeted Node 검사 완료, 실제 Edge 재검증 대기.
- 사용자 승인: “office movement pass 1, second round of fixes”. 기존 worktree와 `hani/office-motion-1`의 미커밋 변경 위에서 계속 수정. commit/push/merge/version 변경·Notion 수정·Git/browser subprocess 및 우회 금지.
- base SHA는 기존 인수인계의 `b80b8d5406b3c1c5520d579618a71462d6164d2a`를 참조한다. 이번에는 Git을 실행하지 않아 branch/HEAD/원격 최신성을 재확인하지 않았다. 새 candidate 없음.
- 범위: runtime `hani-office-live.js`, `hani-office-live.css`(이번 회차 `hani-desk-mascots.js` 추가 수정 없음); 테스트 `hani-office-motion-1.test.mjs`, `hani-office-v2-215.test.mjs`, `hani-office-obr18-browser-geometry.mjs`, `hani-office-obr21.test.mjs`, 정확한 frozen 변경 줄 fixture. 작업별 기록/artifact 외 공통 CURRENT·다른 담당 파일 미수정.

### 결과와 증거

- 이전 34ms clock/지연된 logical pose/travel 변수 좌표를 각각 기존100ms/즉시 pose/실제 left·top으로 수정했다. 단일 이동 clock과 persistent slot 유지. dip은 visual one-shot만 수행한다.
- 217 35행을 직접 확인했다. 기다리는 조건은 아트·이미지 로딩이다. 탭만 보이고 map이 offscreen일 때 background 요청/commit을 막던 조건을 motion 가시성에서 분리했다. Node로 전 층 source commit·prop 개수·offscreen 정지 확인, 실제 decode/naturalWidth는 미검증.
- 라벨 placement와 독립 checker가 동일한 안정 box를 사용한다. reduced-motion의 고정회전도 제외한다. moment-dependent sprite rectangle을 소유 판정에서 제거했다. 기존 placeStatusLabels 및 scheduler 원문은 그대로다.
- obr21은 정확한 변경 줄 27개 hunk만 manifest로 승인하고 역적용 후 기존 non-placement SHA를 검사한다. manifest SHA도 고정, 허용 줄/범위 밖 tamper 거부 확인. 기존 계획·snapshot golden 불변.
- Node 대상 총54 PASS/0 FAIL(공통 import 검사 중복 포함). motion16, actions-216 3, actions-221 2, obr15 4, obr21 1, crowded19, top-labels7, v2-215 2. runtime/변경 검사 JS syntax PASS, 보호 토큰·write-call pattern 불변.
- 기존 obr15 검사 수정 없음. v2-215의 수동 tick은 가상시각100ms를 함께 진행하고 한 tick의 좌표 전진·거리 기반 양 frame·숨김 정지·기존 slot/회의 완료를 증명하도록 수정했다.
- [2차 상세 보고서](../../../artifacts/office-motion-1/second-round-REPORT.md), [실행 명령과 파일 SHA](../../../artifacts/office-motion-1/second-round-summary.json). 이 회차 결과가 위 1차의 34ms/pose delay/실패 계약 기록을 대체한다. 과거 기록은 당시 근거로 보존한다.
- 데이터/저장소/Cloud/schema/migration 변경 없음. Git/browser 실행 시도 없음. Notion은 명시적 금지로 미수정. PR/main/Pages/표시 버전/운영 JS read-back 수행 없음.

### 다음 담당에게

- 지정 리뷰어가 이 미커밋 상태로 실제 Edge의 217·obr14·obr15·top-labels를 다시 실행한다. browser·Android painting/decoding·드문 baseline ambiguous 해소는 아직 미검증이다.
- 전체30파일/역사 Git 참조 검사/Candidate·운영 검사는 수행하지 않았다. 사용자 제공 baseline 실패(219 및 지정 browser scripts)는 별도 해결하지 않았다.
- 먼저 볼 곳: pose/applyPose, moveActor, viewVisible/sceneVisible/setBackground, stableSpriteBox/fitStatusLabels, 공용 readPhoneLabels, obr21 exact delta manifest.
- CURRENT/DECISIONS/Notion 변경 없음. merge·배포 승인으로 해석하지 않는다.

## Production read-back (2026-11-01 KST)

- PR #365 merged as 39ce4a1. Pages run succeeded. Displayed version and `hani-main.js`, `hani-office-live.js`, `hani-office-live.css` tags are 2.9.242. `hani-desk-mascots.js` has no version tag; its deployed content has `officeMascotMotion`.
- Checked without login at 416px, with only the browser clock moved to a weekday noon: 1F walkers moved and step bounce changed, a 2F tap ran `hani-office-hop` and opened the bubble, `hani-mascot-hop` ran, and console errors were 0.
- In a separate rendering Edge: `data-paused` went false, true off screen, false on return, with 24 mascots kept. The hidden app browser pane draws no frames, so it cannot measure this.
- Not verified: real phone feel, Android performance, and the full 390/416px label comparison. The rooftop had no staff at the sampled time.
