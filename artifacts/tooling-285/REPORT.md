# tooling-285 · 2.9.285 시험 기준 갱신

## 작업 식별

2026-11-09 KST · Codex 단독 개발·자동 시험 · `tool285` / `hani/tooling-285` · 지정·로컬 HEAD/origin/main **`b5f54978226bc209ee60ec7f10cd3d92474bfa05`** (v2.9.285). Git 명령·커밋·push·merge·배포 없음. 원격 최신성 새 조회 없음.

`../tooling-285-task.md` 전체 UTF-8 정상 확인 후 scripts/fixture 범위만 수정했습니다. 서윤의 착수 전 미커밋 반입은 보존했습니다. CODEMAP에 이번 시험 층 anchor가 없어 실제 owner를 좁혀 확인했습니다. 과제의 보고서 제한에 따라 HANDOFF-TEMPLATE의 작업 식별·검증·인계 내용을 이 파일과 [SUMMARY.json](SUMMARY.json)에 통합했으며 CURRENT·기존 인수인계는 수정하지 않았습니다.

## 변경과 첫 실제 사용 결과

**공통 CJS 모듈은 수정 없이, manifest 맨 앞에 285 행 하나를 추가하면 기존 호출부가 그대로 동작합니다.** 행의 기능 descriptor가 새 뉴스룸 inverse/fixture를 가리킵니다. 행 외 신규 파일은 기능 inverse·고정 delta·부정·순서 시험 3개입니다. 기존 manifest 행·고정 pin·기존 시험 본문과 assertion은 변경하지 않았습니다.

연결 순서: **285 버전 → 뉴스룸 4컷·레이아웃 → 284 버전 → 치비툰 → 283 → 생활 묶음 → M9/기존 층**. index 60개·main 1개 버전 토큰, history의 정확한 metadata 치환을 입출력 전체 SHA256으로 검사합니다. 뉴스룸 3파일(`issues.json`, CSS, JS)은 검증된 284 commit `5c375d9` 원문에서 고정한 exact inverse입니다. 부분·중복·EOL 변조·반복 inverse를 거절하고 문자열/Buffer 전체 바이트와 forward round-trip을 검사합니다.

pb-chibitoon 5번 closure 비교는 기존 `projectFeatureSource` 호출이 새 층을 자동으로 통과해 통과했습니다. 생활·M9·office의 기존 reader/기준/assertion을 추가로 바꿀 필요가 없었습니다. 공통 층의 미래 릴리스 시험도 다음 버전 286을 자동 구성해 통과했습니다.

## 시험 결과

| 시험 | 결과 |
|---|---|
| 뉴스룸 4컷 / persona | 8/8 · 4/4 PASS |
| pb-chibitoon / procrastination | 5/5 · 6/6 PASS |
| 생활 묶음 4개 | source 5/5 · study 26/26 · board 6/6 · wishlist 7/7 PASS |
| dev-report | 1/1, 내부 10그룹 PASS |
| M9 3개 | seoyun 15/15 · polish 2/2 PASS, link 9/10 (기존 packaging 1 FAIL) |
| nav / navlogin / dashboard 정적 | 3파일 PASS |
| navlogin / navigation-state / dashboard UI | 3파일 PASS, PC1440/390 합성 데이터 |
| design-system 계산 QA | PASS |
| 추가 design-system phase1 브라우저 | 첫 home 클릭에서 입장 fixture 잠금으로 중단, 본문 미검증 |
| 공통 버전 층 부정·미래 릴리스 | 5/5 PASS |
| 뉴스룸 285 exact inverse·순서·변조 | 2/2 PASS |
| 신규 JS syntax | 2/2 PASS |
| office 전체 | 73파일, 771 PASS · Git 36차단 · 별도 1 FAIL · 4 skip |

보드 결과는 두 범위에 해당해 표에서 재참조했으며 합산을 중복하지 않았습니다. 모든 명령·파일별 결과·Git 차단 파일 목록은 SUMMARY.json에만 기록했습니다. Git은 실행 전에 명시적으로 거절했으며 성공 원문으로 대체하지 않았습니다. duplicate-ID 검사는 검증된 b5f5497 object에서 독립 추출한 실제 main 그래프를 사용했습니다.

보리 장기 시뮬레이션은 최초 실행기의 180초 제한으로 중단됐지만, 시험 변경 없이 제한 900초로 재실행해 218.3초에 **13 PASS·Git 1차단**으로 완료했습니다. office 표에는 이 완료 결과를 반영했습니다.

### 400ms 성능 결과 (기준 유지)

- cafe-rest: absent 최선 **274.49ms**, present 최선 **310.74ms**, 기존 cold 400ms assertion PASS.
- lively-v2: cold 3회 **345.02/299.95/284.32ms**, warm **0.6123ms**, 기존 cold400/warm3ms assertion PASS.
- 과제에서 명시한 main의 부하 민감 시험입니다. 이번 측정 결과만 보고하며 기준을 완화하거나 반복 실행으로 성공만 골라내지 않았습니다.

## 남은 실패·미검증

- M9 link packaging: 기존 4개 정적 파일 포함 누락 실패 유지. gate/server·패키징 계약은 변경하지 않았습니다.
- `hani-building-206.test.mjs`: 기존 3F art 기대 `215`와 현행 main의 `218` 불일치 1건. 뉴스룸 inverse 범위 밖이며 원래 assertion 보존.
- `hani-office-219.test.mjs`: Git 조회가 먼저 차단돼 과제에서 말한 원래 실패 assertion까지 재현하지 못했습니다. 다른 Git 차단도 PASS가 아닌 미검증입니다.
- 추가 phase1 UI 시험: 기존 수동 login DOM 숨김이 `body.login-scroll-locked`를 해제하지 못해 첫 home nav 클릭 timeout. 현재 runtime은 origin/main과 같고 입장 owner도 이번 변경 밖입니다. 기존 시험을 유지하며 화면 본문 미완료로 기록했습니다.
- UI PASS는 격리된 합성 데이터 시험입니다. 실제 인증·Android·Production은 미검증입니다.

## 보존과 부산물 복원

**런타임·정적 자산 502파일이 로컬 origin/main의 검증된 commit/tree/blob 원문과 실제 바이트까지 일치**합니다. root JS/CSS/HTML/JSON과 assets·data·js 전체를 비교했고 누락·추가·불일치 0입니다. 표시 `2.9.285`, 내부 `2.9.15-safe-baseline-bootstrap`, 보호 키·저장·Cloud/schema 경로 변경 0입니다. Production 확인으로 주장하지 않습니다.

착수 전 artifacts 297파일의 원문 SHA256 복원 확인, 덮어쓴 부산물 4개 복원·새 부산물 2개 제거 완료. 상세 목록은 SUMMARY.json에 있습니다. scripts/docs는 manifest 외 기존 파일 변화 0이며 반입된 baseline·보고서를 보존했습니다. 새 보고서는 이 파일과 SUMMARY.json만 남겼고 로그·실행기·중간 증거는 저장소 밖 TEMP에만 있습니다.

## 다음 담당에게

서윤이 이 보고서·SUMMARY.json·4개 scripts/fixture 변경을 검토하고 **Git 차단 파일 재검증 → 커밋**을 진행하면 됩니다. 기존 packaging·3F art 기대·phase1 입장 fixture 문제는 별도 후속입니다. 추가 대표님 승인 요청 단계는 없으며 runtime build/version/배포 QA는 도구 전용 작업으로 N/A입니다.

Notion 현황판 읽기는 성공했지만 착수 쓰기는 자동 승인 검토의 **`approval policy is never` 거절**로 미반영·read-back 없음. 갱신 대기: 2026-11-09 KST / Codex / tooling-285 / branch·base 위와 동일 / 285 층·뉴스룸 exact inverse·기존 pin 보존 / 위 검증·미검증·502파일 보존·부산물 복원 / 서윤 Git 재검증·커밋 인계를 저장소 원문 링크와 함께 현황판에 반영해야 합니다.
