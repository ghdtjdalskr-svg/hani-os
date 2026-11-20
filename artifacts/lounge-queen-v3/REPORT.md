# 이달의 퀸 1차 · 서윤 인계

회장님 화면에서 달라지는 세 가지입니다.

1. 투표가 성공하면 해당 후보의 짧은 반응이 즉시 뜹니다. 20명×3종, 기존 프로필을 씁니다.
2. 투표 글에는 매일 달라지는 귀여운 신경전이, 글 상단·광고판에는 현재 순위와 표 차이의 주간 속보가 나옵니다.
3. 회장님이 고른 후보에는 황금 배지가 붙습니다. 선두 동률이면 진행 중 안내와 마감 후 결정 안내를 구분합니다.

- 기준: `hani/lounge-queen-v3` / `507312505b5b8b3c3f203199ef8d77e9c0c7074b`, 표시·캐시 **2.9.302 유지**. 원격 조회는 네트워크 실패.
- **런타임:** `hani-board.js`, `hani-board.css`만. 초안 JSON을 JS 내부 대사 은행으로 사용하고 긴 반응만 줄였으며 영어 표현을 쉬운 우리말로 바꿨습니다. 기존 투표/저장/마감 함수·계산식은 원문 그대로입니다.
- **데이터:** 앱이 읽는 새 JSON **0개**, 새 그림 **0장**. `data/`, `assets/data/`, library/builder 불변. 데이터 별도 선행 PR은 N/A입니다.
- **시험 도구:** `scripts/hani-lounge-queen-v3.test.mjs`, queen-v3 source/preload/fixture 신설. 기존 시험 21개에는 입력 import 1줄씩만, 302 source에는 최외곽 연결 1줄, 302 시험에는 VM 의존성 stub만 추가했습니다. 모두 새 exact inverse 안에 포함되어 기존 단언·숫자·hash·하위 fixture는 그대로입니다.
- 층 순서: **queen-v3 → 302 → dark-bundle → 301 → ieum-seat → 300 → …**. 역변환은 독립 Git 원문·hunk·입출력 hash·왕복·오염 거절로 검사했습니다.
- **검증:** 전용 **14/14 PASS**, raw closure **174→174 / 누락 0**, 투표 성공/실패·중복·20명·기존 1표만 저장·일별 전환·주간 경계·동률·월말·일반 투표·지속 말풍선 slot을 실제 함수로 확인했습니다. JS syntax 4/4 PASS. 전체 비교 결과는 아래와 같습니다.
- 실제 Edge/390·PC·밝은/어두운 화면·실계정 Cloud·Production·Candidate gate는 미검증입니다. commit/push/Edge/Notion은 지시대로 실행하지 않았습니다. Notion 기록도 서윤 인계입니다.
- `hani-board-library-build.mjs --check`는 기준 입력과 변경본 모두 기존 `stale hani-board-library.js`로 실패합니다. 이 작업에서는 관련 데이터·생성물·보호 builder를 수정하지 않았습니다.

서윤이 실행할 명령(cwd=`queen1`):

```powershell
node scripts/hani-lounge-queen-v3.test.mjs
node --check hani-board.js
node scripts/hani-board-library-build.mjs --check
# 실제 Git/browser 사용 가능 환경에서 기존 실패·차단 목록을 확인한 후 필요 항목만 재실행
```

합성 미리보기는 `local/preview.html`입니다. 실제 board DOM/CSS/이벤트를 쓰고 저장은 메모리 fixture만 갱신합니다. 날짜·밝은/어두운 화면·12월 20명 합성 투표를 바꿀 수 있으나 실제 브라우저 실행은 미검증입니다.

미리보기 확인 위치: **라운지 → 이달의 퀸 투표 글**에서 후보 선택/다른 후보로 변경·황금 배지·댓글 아래 신경전·상단 속보를 확인합니다. 광고판의 **「세린·민지의 주간 중계」** 점을 눌러 같은 순위와 투표 글 이동을 확인합니다. 390px에서는 점 목록을 가로로 움직일 수 있습니다. 날짜 전환은 KST 자정·월요일·11/30→12/1, 12월 20명 후보는 별도 시즌 글이 있는 합성 Preview에서 확인합니다.

대용량 로그·기준 입력·자동 출력은 `local/`에만 보관하며 새 `local/.gitignore`로 제외합니다. 루트 `.gitignore`는 원문 그대로입니다. 작업 인수인계: `docs/development-history/handoffs/2026-11-20-lounge-queen-v3.md`.

## 최종 검증 결과

| 독립 실행 | 명령 수 | 성공 | 기존 실패·실행 제한 |
|---|---:|---:|---:|
| main5073125 기준 입력 | 284 | 173 | 111 |
| queen-v3 변경본 | 285 | 174 | 111 |

**기준선 대비 새 회귀 0건**, 새 기능 **14/14 PASS**. 개수를 출력한 시험만 합산한 TAP 집계는 변경본 1613 PASS / 71 기존 FAIL / skip 10이며, 개수 없는 script형 명령은 위 명령 수로 구분합니다. 전체가 녹색인 상태는 아닙니다. 기존 실패·제약에는 context-remote 단독 예외, Git/browser/서버 실행 제한, syncThemeCollections 미정의, 과거 main SHA 고정 등이 포함됩니다.

사무실 cafe 400ms 항목은 최초 기준 실행에서 흔들려 **단독 2회 재시도·성능 2/2 PASS**입니다. 최초 FAIL 로그도 보존했습니다. baseline-retry-1: 성능 PASS / Git 비교 EPERM; baseline-retry-2: 성능 PASS / Git 비교 EPERM.

QA JSON **4개 원문 복원**, 생성 출력 **14개 local/generated/ 이관**, 보호 owner 11개·기존 fixture126·기존 시험21개 단언·LF 보존을 확인했습니다. 원문 비교/전체 명령별 결과: local/safety.json, comparison.json, artifact-cleanup.json. local/은 커밋 제외입니다.

이후 작업은 서윤의 실제 Edge Preview·기존 실패/차단 재확인·commit/push/Notion 인계입니다. Candidate·main·Pages·Production 완료로 보지 않습니다.

## 2차 보정(git 위치)

- 2026-11-20 / 도연(Codex) / `hani/lounge-queen-v3`, HEAD·로컬 origin/main `5073125`. commit·push·배포·Notion 없음.
- 새 queen-v3 시험 층에서 **40 owner 바이트가 정확할 때만 5073125→d748920** 보정. 실제 Git은 raw 함수로 보존. Node Git EPERM은 실제 객체 조회와 독립 검증된 빈 diff만 대체하고, 변경·미지원 명령은 실패 유지. PowerShell 실제 Git도 SHA5073125·대상 diff0 확인.
- **지정 Git11개 전부 단독 성공 / queen-v3 18/18 / syntax3/3 PASS.** 원문·보정값·40 owner 오염 거절을 실행 검증. 기존 시험284개·fixture127개(1차 queen 포함)·보호32개·board JS/CSS는 2차 추가 변경0.
- **1차 import21개는 10성공/11실패로 전부 통과 조건 미달.** board 의존9개는 VM 함수 누락, newstaff는 인원수, billboard는 과거 기대/VM 충돌. 독립 Git 원문25개와 일치하는 main5073125 입력의 대표3개에서도 동일 재현. 금지된 기존 시험·fixture·런타임은 수정하지 않음.
- 전체 **285개 단독 실행: 184성공/101실패·제약**(context-remote 단독 예외 포함). 전체 PASS·전체 새 회귀0으로 보고하지 않음.
- 지정 QA JSON4 원문 복원, 새 artifacts 3개 local 이관. ignored 브라우저 QA 상태1개 갱신은 인수인계에 명시. 2차는 시험 도구 변경으로 버전·Candidate·운영 검증 N/A.
- [상세 결과](local/git-location/summary.json) · [보존 검사](local/git-location/safety.json) · [실제 Git](local/git-location/native-git-evidence.json). 다음: 잔여 기존 시험11개 별도 정리.

## 3차 디자인 업

- 2026-11-20 / 도연(Codex) / `hani/lounge-queen-v3`, base `5073125`. 가운데 높은 금·은·동 TOP3 시상대, 기존 프로필 20명 카드(PC 2~3열·폰 2열), 고정 직원색/선두 금색 그래프, 빨간 LIVE 속보, 프로필 옆 팝업 말풍선을 반영했습니다. 같은 live slot 노드를 canonical 렌더러에서 재사용하고 모션 감소 시 점멸·팝업·전환을 끕니다.
- 런타임은 board JS/CSS만. 기존 투표 계산·저장·마감 원문, 보호 경로·기존 시험/하위 hash 보존. 새 저장·그림·런타임 JSON 0, 표시/cache 2.9.302 유지. 갱신한 fixture/pin은 새 queen-v3 층만입니다.
- **전용 24/24·지정 Git 11/11·JS syntax 4/4 PASS.** 동률(회장님 표→명단 순), 실제 투표/실패/중복/20명/월말, 카드·시상대, 이전 표시값에서 그래프 전환, 말풍선 노드 재사용 경로 검증. CSS 구조·Preview 원문 일치/inline syntax 확인, 지정 QA JSON4 원문 유지. 기존 알려진 실패 전체285 재실행은 범위 밖이며 context-remote 단독 예외는 재검사하지 않았습니다.
- [합성 미리보기](local/preview.html)에 실제 코드와 5종 마감 선택을 반영했습니다. 테마 토큰 본문 대비 10.29:1 이상·LIVE 6.63:1·배지 10.72:1 계산 확인. **Edge 실행이 Windows 접근 거부(0x5)로 실패하여 실제 390px/PC 화면·렌더링 픽셀 대비·모션은 미검증**입니다. 근거는 `local/design-up/queen.tap`, `git11/results.json`, `contrast-tokens.json`, `safety.json`, `edge-stderr.txt`입니다.
- commit·push·Notion·main merge·배포 없음. 다음은 서윤의 실제 브라우저 Preview 확인이며 Candidate/Production 완료가 아닙니다.
