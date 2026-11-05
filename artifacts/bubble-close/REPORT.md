# 오피스 말풍선 닫기 수정 보고

2026-11-06 KST · Codex · `hani/cafe-barista` · HEAD/base `7c2acfd4` · 미커밋.

## 원인과 변경

- **주원인 재현:** 실제 390×844 터치 Edge에서 바깥 탭은 기존 문서 passive `pointerdown → officePresence.interact → activateActor(event,true) → closeBubble`까지 정상 실행됐다. 그러나 `hidden=true` 뒤에도 뒤쪽 확대 CSS `[data-zoom="true"]{display:grid}`가 숨김 규칙을 덮어 화면에 남았다. [수정 전 증거](before-browser-result.json)의 실제 계산값은 `hidden:true / display:grid`다. 터치 이벤트 누락이나 별도 읽기 pin은 아니었다.
- 기존 부모 `[hidden]{display:none}` 규칙을 PC/폰 표시 변형 뒤로 옮겼다. 수정 후 같은 탭은 `hidden:true / display:none`. 내부 탭은 원래 명시적으로 무시됐으므로, 같은 말풍선의 로컬 click 위임에서 프로필 링크를 제외하고 닫는다. 터치 시작에 내부를 숨기지 않아 호환 click의 대상도 유지한다.
- 말풍선 생성 시 **✕ 버튼 한 개**를 함께 생성한다. `aria-label="말풍선 닫기"`, 실제 터치 영역 **32×32px**. 기존 문서 keydown에서 Escape를 처리하며 전역 listener를 추가하지 않았다. 다른 직원·이슬은 같은 말풍선을 교체한다.
- 활동 중 대사를 보관하는 `pendingTap`은 기존 자동 닫기 후 일정 종료 시 다시 열릴 수 있었다([일정 기반 재현](baseline-probe.json)). 폰 자동 닫기는 이를 함께 해제한다. PC의 기존 지연 대사 동작은 유지한다.
- **자동 닫기:** 폰 ≤480px **대사당 5초**. PC 직접 탭·이슬·퀸 **3초**, 기존 자동 등장·회장님 이벤트 **4초** 유지. 기존 반려동물 3명 순차 대사는 각 대사에 같은 시간을 적용한다(폰 최대 15초). **새 타이머 0개**, 기존 bubbleTimer 한 슬롯 재사용.
- 폰만 padding·11px 글꼴·본문 최대 2줄·확대 sprite 숨김 적용. 실제 예시는 **344×106 → 280×40px**. PC 글꼴·sprite·본문 배치는 유지하고 ✕ 공간만 확보했다. 새 모션 없음, reduced-motion 회귀 통과.

## 검증

| 검사 | 결과 |
|---|---|
| 신규 `hani-office-bubble-close.test.mjs` | **17 통과 / 0 실패** |
| 실제 Edge 390×844 touch / 1440×844 PC | **두 환경 통과**, page error 0 |
| JS·신규 테스트 syntax | **2/2 통과** |
| office 전체 44파일 시도 | 요약 완료 37파일: **459 통과 / 27 실패**; 별도 시작 차단 6파일·미종료 1파일 |
| `hani-office-icons` | 14 통과 / source pin 1 실패 |
| `hani-office-zoom` | 11 통과 / source pin 1 실패 |
| `hani-office-residents` | 42 통과 / source pin 7 실패 |
| 모델·보호 owner 원문 | 전체 scene prefix·baseline 두 구간 **byte 동일** |

실제 브라우저는 index의 오피스 DOM·실제 자산·기존 owner를 로컬 harness로 실행했다. 직원 실제 탭 열기, 실제 배경 탭 닫기, 본문·✕ 닫기, 프로필 라우팅, 다른 직원 전환, Escape, 이슬, 자동 닫기, 2줄·32px 측정을 확인했다. [폰 화면](phone.png) · [PC 화면](desktop.png) · [폰 결과](browser-result.json) · [PC 결과](desktop-browser-result.json).

전체 실행: `./artifacts/bubble-close/run-tests.ps1`(각 파일 `node --test-reporter=tap scripts/<파일>`). CSS 최종 수정의 영향받는 검사는 재실행했다. obr14는 45초 제한 후 240초 한도로 재실행해 완료(약 95초). [최종 파일별 표·실패 분류](final-results.json) · [실패 이름](failures.json) · 각 `*.test.log`.

- TAP 실패 27건: **`spawnSync git EPERM` 12건 = 차단**, source pin 14건, snack의 기존 주민 hash 불일치 1건. snack 주민 model/renderer는 수정 전후 hash가 동일하다([근거](baseline-pins.json)).
- Git 시작 차단 6파일: 219, chairman-234, obr12, obr6, obr7, obr9. **PASS 아님**.
- behavior: 45초에 완료되지 않아 중지. 공통 fixture의 앞 5개만 출력됐으며 전체 결과는 **미검증**이다.
- 서윤 담당 source pin/delta 및 icons·zoom·residents의 명시적 생성/listener 기대값은 **미수정**. 현재 pin 단계가 먼저 실패해 뒤쪽 count assertion은 검증되지 않았다. 인계할 실제 정적 수: createElement **61→62(+✕ 1)**, addEventListener **15→15**, document 등록 지점 **2→2**, setInterval **2→2**, setTimeout **4→4**. 기존 assertion 삭제·완화 없음.

## 보존·변경 파일·남은 확인

- `plan`, `blockPlan`, `snapshot`, `placeStatusLabels`, `screenHomeClear`를 포함한 전체 모델 prefix와 `fitStatusLabels` 원문 보존. [바이트·수량 근거](preservation.json). 신규 테스트에서 저장 호출 0 확인. localStorage·Cloud·schema·AI 경로 변경, 새 runtime 파일 없음.
- 운영 변경: `hani-office-live.js`, `hani-office-live.css`. 신규 테스트: `scripts/hani-office-bubble-close.test.mjs`. 기록: 본 폴더의 비교 원문·검사 스크립트·로그·JSON·PNG 및 `docs/development-history/handoffs/2026-11-06-bubble-close.md`.
- assets/·data/·Notion·버전/cache **미수정**(2.9.263 유지). commit·push·merge·배포 없음. branch/HEAD 종료 재확인.
- origin/main 캐시 `813cedc5`는 base와 다르며 원격 최신성 미검증. merge/rebase 없음. 실제 폰 기기·전체 로그인/Cloud 통합·운영 검증 미수행. Candidate/package/One-Pass/HINA 미실행(기능 패치 범위).
- 다음: 서윤의 pin/명시적 count 정합화 후 차단 검사 재실행. 이 작업의 커밋·배포는 승인 범위 밖이다. Notion은 요청에 따라 기록하지 않았다.
