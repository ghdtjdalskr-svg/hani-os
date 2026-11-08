# 저장 안전장치 01 + 07 — 브랜치 개발 보고서

2026-11-08 KST · Codex · `hani/audit-safety-284` · `audit-safe`

## 승인 범위와 기준

- `../save-guard-task.md`를 UTF-8로 전체 읽었고 한글은 정상이다. 승인 범위는 기존 owner 안의 개발과 지정 검증까지다. Git 명령·커밋·push·merge·배포는 하지 않는다. 커밋은 서윤 담당이다.
- 착수 HEAD: `3ab1177b2b1cd37da1e2580f2c6fa78653a13810`. 로컬 origin/main 참조: `5c375d970065b1ee44946aa82dcd9c9d27d02d7d`. `.git` 참조 파일을 읽어 확인했으며 Git 실행 금지로 원격 최신성을 새로 확인하지 않았다.
- 표시 버전·캐시 태그 `2.9.284`, 내부 버전 `2.9.15-safe-baseline-bootstrap` 유지. `index.html` 바이트 동일. HTML 마지막 script는 `hani-launch-greeting.js`이고, 앞의 budget core/UI 태그는 `?v=2.9.284`다. 실제 Edge 로딩은 아래 차단 사유로 미검증이다.
- CODEMAP의 `cloud-sync` owner·dependency와 실제 `cloudReadRow`/`cloudApplyRemoteRow`/`save`/안전 사본 경로를 확인했다. 신규 탭 보호 항목은 CODEMAP에 없어 실제 load/write/save/init 경로로 탐색 범위를 확장했다.

## 변경 내용

운영 파일은 **`hani-main.js` 하나**다. 새 runtime layer 파일은 없다. 정확한 전후 차이는 [runtime.diff](runtime.diff), 줄 위치·해시·보존 증거는 [static-evidence.json](static-evidence.json)에 있다.

| 변경 위치(수정 후 줄) | 내용 |
|---|---|
| 1166 / 1254 | 읽은 원본 바이트의 메모리 기준 |
| 1293 / 1323 / 1329 | 기존 write·Cloud source·rollback remove의 충돌 보호 |
| 1415 / 1426 / 1430 / 1439 | 안내창·바이트 확인·단일 listener·save 차단 |
| 5934 / 5940 / 5975 / 6874 | 기존 validator 재사용·Cloud 읽기/적용/수동 복원 검사 |
| 8805 | 기존 init에서 listener 한 번 등록 |

`hani-main.js` SHA-256: 수정 전 `7014d45924c6a287502ed478447cfa3fc7930e31102ac534164209b945ea8af8` → 수정 후 `a954d7a8da265592c313c053d2ea622eafc03d6a0af26775c1f74894ed77f1f9`.

1. `loadState`가 읽은 원본 바이트를 메모리에 기억한다. 기존 보호 write/remove가 성공하면 같은 탭의 메모리 기준만 갱신한다.
2. 기존 init에서 한 번만 `storage` listener를 등록한다. 다른 탭이 보호 키를 변경하면 잠금과 persistent 안내창을 표시한다. 저장 직전 바이트 비교로 아직 이벤트가 도착하지 않은 변경도 감지한다.
3. 충돌 시 다음 `save()`는 실패를 반환하고 입력 state·저장 시각·기존 폼을 건드리지 않는다. 기존 설정 패널 재렌더링도 호출하지 않는다. 안내 문구는 지시문과 같고, 버튼을 누른 경우에만 새로고침한다. 자동 병합·자동 새로고침은 없다.
4. `writeProtectedState`, 기존 rollback remove, Cloud source 확인에도 같은 잠금을 적용해 백업 대기 중 다른 탭 변경을 Cloud 적용이나 rollback으로 덮지 않도록 한다. 새 write/remove 경로는 없다.
5. `validateCloudRecords`가 기존 `validateStoredRecords`를 재사용한다. Cloud 원본 읽기, canonical 적용, 수동 복원에서 정규화·적용 전에 검사한다. 실패하면 STOP과 **“Cloud 기록 형식을 확인하지 못해 이 기기 기록을 유지했어요”**를 표시하고 원본·메모리·저장 바이트를 유지한다.

시험 코드는 신규 단위·Edge 스크립트와 고정 hash exact-inverse 외층을 추가했다. 기존 VM 시험에는 실제 새 의존성을 연결했다. 기존 assertion을 삭제하거나 완화하지 않았다. 역사적 보존 시험은 v284·기존 작은 수정·이번 패치를 정확히 역변환한 v283 바이트로 비교하며, 실제 raw runtime의 신규 동작은 전용 단위 시험으로 검사한다. 원본 읽기 기반 closure 검사는 raw 상태로 유지한다.

## write 호출 수

| 정적 범위 | setItem 전→후 | removeItem 전→후 | clear 전→후 |
|---|---:|---:|---:|
| 전체 method 호출 | 20→20 | 6→6 | 1→1 |
| localStorage 호출 | 18→18 | 5→5 | 0→0 |
| 보호 키 직접 호출 | 2→2 | 1→1 | 0→0 |

전체 method 수에는 Map 등도 포함한다. 보호 키 이름·내부 버전 변경, 새 저장 키, schema/migration, Supabase insert/update/upsert 구조 변경은 없다.

## 검증

- **신규 단위 10/10 통과.** 다른 탭 이벤트·단일 listener·바이트 비교·write/remove/Cloud 차단·안내·수동 새로고침·입력 및 폼 보존, 자기 저장 오탐 없음, 깨진 Cloud 7종, Cloud 읽기/수동 복원, 백업 대기 경합, 정상 Cloud의 수정 전후 동일 결과, Local 격리·복구, 호출 수, exact-inverse의 drift/중복/재역변환 거부를 실행했다.
- 기존 Cloud-first **40 cases**, egress **25 scenarios**, 충돌 선택·egress-save·게시판·투자 검토 실제 save/rollback·사진 백업 Node 시험을 실행했다. 상세 명령과 전체 파일별 결과는 최종 집계 파일에 기록한다.
- runtime closure **164→164**, 누락 0. 새 runtime 의존 파일 없음.
- JS syntax **14/14**, 보존 영역·상수·호출 수 비교 통과. 최종 집계는 아래 표와 연결한 JSON에 있다.
- Edge 실제 앱 시험은 준비하고 실행을 시도했으나 `spawn EPERM` 및 합성 프로필 CDP 연결 종료로 앱 검사에 도달하지 못했다. **PC1280/폰390 스크린샷 0, 실제 두 탭·레이아웃 미검증.** [차단 근거와 재실행 방법](BROWSER-BLOCKED.md).
- 기존 실패 재현: 미룬 일 DOM 대역의 `setAttribute` 누락, tasks 대역의 `parentNode` 오류, app216 audit의 과거 CSS 목록 차이는 수정 전 기준에서도 재현했다. [prepatch-results.json](prepatch-results.json). 별도 Node 자식 실행도 EPERM을 확인했다.

## 기존 안전장치 보존 근거

- 안전 사본 함수, 정규화·기존 레코드 검사, revision 조건부 업로드, revision/빈 로컬 결정, sync-cycle 본문은 전후 **전체 바이트 동일**이다.
- 깨진 Local 격리 경로는 읽은 바이트를 메모리에 기억하는 한 줄 외에 동일하다. 단위 시험에서 격리 사본 원문·검증 상태, 잠금, 승인된 복구 후 read-back을 확인했다.
- 정상 Cloud는 수정 전 실제 적용 함수와 비교해 결과 바이트·메모리·write 수·사본 수가 동일했다. 깨진 Cloud는 사본 단계 전 거부되고 Local write 0이다.
- 기존 안전 사본 저장 키 `hani_safety_backups_v1`, read-back 검사 및 rollback 본문을 유지했다. 다른 탭 충돌 시에는 잠금으로 기존 원본을 더 이상 변경하지 않는다.
- 앞선 가계부 rollback·뉴스 tone·서버 소유자 수정은 raw runtime에 보존했다. 외층 inverse는 시험 메모리 안에서만 사용한다.

## 남은 위험과 다음 행동

- `localStorage`는 원자적 compare-and-set을 제공하지 않으므로 두 탭이 검사와 write 사이에 정확히 겹치는 극소 구간까지 원자적으로 잠그는 구현은 아니다. 이번 범위는 다른 탭 저장 이벤트와 저장 직전 바이트 비교다.
- 메모리 초안은 페이지가 열린 동안 유지된다. 별도 초안 write는 추가하지 않았다. 사용자가 새로고침 버튼을 누르면 저장하지 못한 초안은 사라진다.
- Cloud 검사는 기존 검사와 같은 범위다. 중첩 필드의 의미·실제 계정/서버 데이터·실기기 검증을 새로 완료한 것은 아니다.
- Git이 필요한 원문 비교, 과거 raw baseline/fixture가 없는 legacy safety 검사, 실제 Edge 검사에는 미검증이 남는다. office219의 알려진 기존 실패도 Git 차단보다 뒤의 실제 실패 지점까지 확인한 것으로 보고하지 않는다.
- Preview Candidate Freeze, build, One-Pass, HINA, main 병합, Pages, 운영 read-back은 이번 승인 범위 밖이다. 버전 증가는 배포 담당의 열차에서 한다.
- 서윤이 변경·보고서를 검토하고 커밋한다. 실행이 허용된 환경에서 Edge 두 탭·1280/390 화면과 차단된 검사를 완료한 뒤 성민 대표님 Preview 및 별도 배포 승인을 받는다.
- Notion 착수 기록을 시도했지만 **자동 승인 정책 `never`가 `insert_content`를 거절**했다. Notion에는 반영되지 않았고, 이 보고서와 인수인계의 요약을 갱신 대기로 남긴다.

## 최종 집계

| 실행 묶음 | 파일 명령 수 | 통과 | Git 차단 | 기타 |
|---|---:|---:|---:|---|
| 저장·Cloud·오프라인·백업·안전 | 27 | 11 | 3 | Edge 4, 과거 baseline/fixture 없음 9 |
| 생활 묶음·nav/dashboard | 10 | 7 | 1 | 수정 전 재현 실패 2 |
| 실제 save·복구·가계부 관련 추가 | 16 | 8 | 6 | 수정 전 CSS 목록 실패 1, 자식 Node EPERM 1 |
| office 전체 | 69 | 41 | 28 | Git 외 실패 0 |
| 합계 | 122 | 67 | 38 | 기타 차단 14, 수정 전 재현 실패 3 |

- office의 실제 TAP 항목은 **744 통과 / 36 Git assertion 차단 / 3 skip**이다. 28은 Git이 필요한 파일 수이고, 36은 그 안의 차단된 assertion 수다. 실행 가능한 검사와 Git 비교를 합쳐 PASS라고 하지 않는다.
- 보리 장시간 시험의 첫 180초 제한은 완주 재실행으로 대체했다(13 통과·Git 1차단). kids-visit의 raw v283 비교 실패는 고정 외층 연결 후 전체 재실행 통과했다. staff-chat의 같은 비교도 기존 assertion을 유지해 통과했다.
- 첫 office 실행의 PowerShell Process.ExitCode가 null로 반환되어 완료된 TAP의 fail/pass를 기준으로 집계했다. 원래 결과·재실행·판정 근거를 `office-results.json`, `retry-*-results.json`, `office-final-results.json`에 보존했다.
- [파일별 결과](RESULTS.md), [Git 차단 목록](GIT-BLOCKED.md), [그 외 미검증·기존 실패](UNVERIFIED.md), 각 `*-final-results.json`에 명령과 결과가 있다. Node만 실행한 photo-backup의 선택 브라우저 분기는 미검증이다.
- 시험 부산물 JSON 4개를 실행 전 원문으로 복원하고 신규 qa210 evidence JSON을 제거했다. 운영 파일 추가 변경·범위 밖 변경은 0이다. [보존 확인](workspace-preservation.json).
- Git·커밋·push·merge·표시/캐시 버전 증가·배포는 **0회**. 상태는 **서윤 검토·커밋 및 차단 검증 대기**이며, Production 완료가 아니다.
