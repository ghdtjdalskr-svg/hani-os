# Asset Intake v2 C · 저장 계약 정정 인수인계

## 작업 식별

- 갱신: 2026-10-24 KST / 담당 도연(Codex), 개발 Agent 1명. 독립 리뷰를 수행했다고 주장하지 않음.
- 상태: 로컬 구현·targeted 기능 검증 완료, Git release-chain/실브라우저 검증 대기. 미커밋·미push, 열차 탑승 보류.
- 저장소 ghdtjdalskr-svg/hani-os / branch `hani/asset-intake-v2` / worktree `intake-v2`.
- 시작·유지 HEAD `bd39ea718e6b5ff8f12b261d96caa38c2f656e1c`(A+B), base/main `d19aa0b62b1657660cb3cc6bec6bee1524dbb2bf`. 재개 시 GitHub branches/main 조회 일치. 로컬 표시 `2.9.232`, 마지막 script `hani-launch-greeting.js` 유지. 실제 운영 표시/JS 로딩 미확인.
- 승인: `MISSION-intake-v2-C.tmp.md`의 대표님 “저장 로직 수정(C) 승인. 백업·복구 계획 먼저 보여주고 진행해줘.” 및 이번 재개·마무리 지시. 계획서는 이전 실행에서 선작성됐고 이번 재개 검토를 코드 수정 전에 추가함.
- 경계: 대상 approve/approvePositions/merge 및 꼭 필요한 Preview 매칭·안내, 관련 회귀·문서만. 새 key/schema/migration/Cloud 쓰기 구조/삭제·백업 동작/기존 데이터 일괄 수정 없음. 버전 증가·push·PR·배포 금지 유지.

## 계획서 요약 · 백업과 복구

합성 예로, 이전에 현재가 110원·평가액 330원이 있었어도 새 입력에 없으면 새 기록에는 null입니다. 정확히 같은 종목의 수량·평균단가·매입금액은 이번 입력이 없으면 보존합니다. 부분·unknown 목록에서 빠진 종목은 매도로 보지 않으며 보유 사실은 유지하고 새 기록의 동적 평가 관측만 비웁니다. 과거 snapshot은 일괄 수정하지 않고 기존 동일 월 갱신 규칙은 유지합니다.

배포 전 대표님은 기존 설정·데이터 → ① 백업·복원 → JSON 백업 / 복원 → ‘백업 파일 만들기’로 media 포함 전체 JSON을 보관해야 합니다. 이미 연결한 PC Drive Vault는 ‘Google Drive 백업 보관함’ → ‘지금 백업’을 추가로 이용할 수 있습니다. 보유정보 전용 승인에는 기존 before_positions_update 백업이 선행하지만 일반 승인마다 전체 JSON을 자동 내보내지는 않습니다. 이번에는 실데이터 백업·복원을 실행하지 않았습니다.

코드 복구는 배포 담당의 이전 승인 버전 재배포, 데이터 복구는 대표님 확인 후 기존 ‘백업 파일 불러오기’ 경로입니다. 코드 복구만으로 저장된 null이 과거 값으로 돌아오지는 않습니다. 복원 전 새 기록과 Cloud 상태를 별도 확인해야 합니다. 실제 코드 위치와 제한은 [계획서](2026-10-24-asset-intake-v2-C-plan.md)에 있습니다.

## 변경 내용과 파일

- `hani-asset-update-v1.js`: 동적 필드 currentPrice/evaluationAmount/pnl/returnRate/weight의 missing은 null. 계좌 totalEvaluation/totalPnl/totalReturn도 null. 빈 incoming 목록에서도 기존 보유 목록의 stale 평가를 비움. 명시적 0은 보존.
- 저장 identity 매칭은 유일한 정규화 코드·instrumentId·이름+확정 시장 일치만 허용하고, 알려진 코드/시장/instrumentId 충돌이나 모호성에서는 재사용하지 않음. 기존 Preview 제목과 고급 수정의 매칭도 같은 정책 사용. 동적 missing에 ‘기존값 유지’ 안내 제거.
- 수량·buyPrice·purchaseAmount·계좌 totalPurchase는 보유 사실로 유지. 보유정보 전용 승인도 매입금액을 지우지 않고 incoming/누락 종목 모두 동적 필드만 비움. 전체목록의 기존 확인·누락 차단·명시 수량0 규칙 유지.
- 기존 save/read-back 경로에서 명시적 저장 거절을 우선하고 대상 계좌 전체 JSON을 비교해 stale 평가값만 저장된 불완전한 read-back도 실패로 처리. 새 저장 API나 디스크 롤백 쓰기 추가 없음.
- HEAD 혼합 줄바꿈 복원: CRLF6개(처음5행+IIFE 닫힘) 유지, 나머지 LF. runtime +21/-7이며 비변경 474행 원문 바이트 일치. git CLI가 없어 요청된 `git diff --ignore-cr-at-eol`은 실행 불가였고 HEAD Git object 직접 비교 증거를 남김.
- 테스트: 신규 `scripts/hani-asset-intake-v2-C.test.mjs`; 기존 Hana/Kiwoom 224·asset-update smoke의 이전 carry/fallback 기대를 승인된 계약으로 정정. OCR 224 보존 검사에는 `scripts/fixtures/asset-intake-v2-C/approved-storage-fragments.json`의 함수3개 정확한 전후 원문만 적용하고 원래 hash·나머지 보호 검사·release-chain 검사를 유지함. baseline fixture와 공통 release helper는 수정하지 않음.
- 문서·증거: 이 인수인계, 기존 C 계획서 보완, `artifacts/asset-intake-v2-C/{README.md,targeted-results.json,safety.json,runtime-ignore-eol.diff}`. 다른 작업의 문서는 덮어쓰지 않음.
- 비공개: Hana ground truth에서 재구성한 입력·결과는 git 제외 `.private-intake/hana/replay-C.mjs` 및 `replay-C-results.json`에만 있음. 공개 테스트는 다른 이름·수량·금액의 합성 자료임.

## 검증 결과

대상은 위 HEAD 위의 미커밋 C 파일이며 정확한 runtime SHA-256은 [safety.json](../../../artifacts/asset-intake-v2-C/safety.json)에 기록했습니다.

| 검사 | 결과 |
|---|---|
| 신규 C 승인/merge/실패/보존/Preview/write 표면 | 13 PASS |
| 기존 Hana/Toss/Kiwoom/OCR 224 기능 | 45 PASS |
| 기존 A+B | 9 PASS |
| 기존 asset-update smoke | 별도 PASS |
| JS syntax | vm.Script 컴파일 PASS |
| 기존 Git release-chain oracle | 1 BLOCKED: Git CLI 부재 |
| 실제 브라우저·390/1440·실계정 저장 | 미실행: Playwright import 실패, 서윤 재실행 대기 |

총 67 PASS + smoke PASS이며 전체 suite 완료는 아닙니다. Node CLI 대신 Node REPL VM에서 원래 테스트 콜백을 실행했습니다. 실제 DOM layout·접근성·브라우저 localStorage 동작을 증명하지 않습니다. OCR 합성 22건330필드의 330/330은 실제 OCR 정확도가 아닙니다. 실행 명령과 환경 차이는 [검증 설명](../../../artifacts/asset-intake-v2-C/README.md)에 남겼습니다.

확인한 실행 경로는 새/동일 월 승인, 명시적 0, 동적 carry0, 충돌/모호 identity, 부분/unknown 누락 유지, 다른 계좌·과거 snapshot의 JSON 바이트 불변, 보유정보 백업 실패 write0, save false/throw 시 메모리·디스크 보존, Preview·입력 유지, read-back 오류/불완전값 감지, 성공 뒤 UI 갱신 오류의 경고 구분입니다.

보호 함수11개 중 승인된3개 전후 원문을 고정했고 나머지8개 원문 불변을 확인했습니다. write 호출 목록은 기존224 hash/HEAD와 같습니다. hani-main.js·index.html·시장 owner·CSS·서버 소스는 HEAD Git blob hash와 일치하므로 보호 key·내부 버전·primary 저장·Cloud/schema·표시 버전/cache를 바꾸지 않았습니다.

## 미검증·위험과 blocker

- **read-back 한계**: 기존 owner는 save가 실제 쓰기를 완료한 뒤 read-back만 실패하면 메모리는 원복하지만 디스크는 이미 바뀌어 있을 수 있습니다. 두 승인 경로에서 이를 확인했습니다. 자동 디스크 원복을 추가하지 않았으며 항상 이전 저장값 보존이라고 보장하지 않습니다.
- Hana private replay는 실제 관측을 로컬 재구성한 것이며 OCR/API/운영 저장 시험이 아닙니다. 0 현금·두 수량·기존 지원 산식의 평균원가·실시간 차이·sparse null 처리 확인. 기존 A+B에는 평가−손익→매입 역산이 없으므로 해당 원가 보완은 미지원으로 남습니다. 종목 catalog exact와 실제 MCC·기준일 확인 UX는 미검증이며 추정 코드를 넣지 않았습니다. ‘전체’ 화면도 근거 부족 시 unknown 유지.
- 표시 계산 brokerCalc는 저장 null에서 계산할 수 있습니다. 저장 원시 필드와 표시 값을 따로 읽어 확인해야 합니다. 수량이 바뀌고 원가가 없으면 유지된 원가는 새로 확인한 원가가 아닙니다.
- Git CLI/Node CLI가 PATH·기존 확인 경로에 없어 표준 명령·commit을 실행하지 못했습니다. Git metadata는 수정하지 않았고 파일만 보존합니다. push·PR·merge·Pages·배포·Production read-back 없음. HINA/Build/One-Pass는 최종 후보 전이며 PASS로 보고하지 않음.
- 공통 CURRENT/DECISIONS는 타 작업 기록을 보존하고 이 작업별 인수인계로 전달합니다.
- **Notion 갱신 대기**: 현황판 조회는 성공했지만 재개 착수 append가 자동 승인 검토의 “MCP tool call requires approval, but approval policy is never”로 거절되었습니다. 저장/read-back 완료가 아니며 반복 우회하지 않았습니다. 반영할 요약은 이 인수인계의 상태·branch/SHA·변경·검증67+smoke/차단1·미검증·다음 행동입니다. 민감 원본은 전송하지 않음.

## 다음 담당에게

1. 서윤: 허용 환경에서 검증 설명의 표준 명령과 Git 원본 oracle을 실행하고 합성 데이터로 실제 browser smoke 및 sparse Preview/read-back/실패 후 재시도를 확인합니다. 별도 C UI/UX 독립 리뷰는 미실시입니다.
2. Hana 역산 원가·catalog 검증은 A+B 후속 범위를 명확히 정한 뒤 처리해야 합니다. 이 C가 해당 기능까지 완성했다고 표시하지 않습니다.
3. 대표님 승인 범위를 보존하며, 현재 미션에서는 push/PR/배포하지 않습니다. 후속 탑승 지시가 있으면 배포 담당이 최신 main/후보 identity를 확인하고 A+B 서버 prompt와 client의 통합·Edge 필요 여부/순서를 판단합니다. C 자체에는 Edge/설정 배포가 없습니다.
4. 실제 배포 승인이 날 때 계획서의 수동 전체 백업을 확인하고 canonical Candidate/HINA/Preview/승인 절차 후에만 배포합니다. 배포 후 target missing=null·보유 사실·타 계좌/과거 기록·새로고침 read-back을 확인해야 운영 완료입니다.
