# Asset Intake v2 입력 편의 후속

## 작업 식별

- 2026-10-24 KST · 도연/Codex, 개발 Agent 1명. 상태: 로컬 구현·targeted 검증 완료, Git 원본 oracle/커밋 차단. 미push·배포 미실행.
- 저장소 ghdtjdalskr-svg/hani-os / branch `hani/asset-intake-v2` / worktree `intake-v2`.
- 시작·유지 HEAD `24f03239d0a49999d32e50c8f7c401daa47d2add`, base/origin/main `d19aa0b62b1657660cb3cc6bec6bee1524dbb2bf`. GitHub branches/main 직접 조회와 일치. 로컬 index·HANI_DISPLAY_VERSION `2.9.232`, 마지막 UI script `hani-launch-greeting.js` 유지. 실제 운영 표시/JS 로딩은 미확인.
- 승인 근거: `MISSION-intake-v2-ease.tmp.md` 및 이번 실행 지시. 입력일·optional 확인 생략·하나 동일 화면 역산만. 저장 계약 C 유지, 새 영속 필드/schema/migration 없음.
- 수정 범위: `hani-asset-update-v1.js`의 normalize/derive/Preview 경로, 관련 합성 테스트, 이 인수인계. 비공개 replay/보고서는 `.private-intake/`에만 보관.
- 버전/cache 증가·push·PR·main merge·배포 금지. 다른 담당 파일은 수정하지 않음.

## 결과와 증거

- `hani-asset-update-v1.js`: 화면 날짜가 없으면 확인하지 않음. 분석 후 저장 owner에 전달하는 `draft.date`는 입력일, 확실히 읽은 원본 날짜는 transient `sourceAsOf`로만 사용. Preview에 `입력일 기준 YYYY-MM-DD` 표시. 새 영속 필드 없음.
- 토스 `내 투자`는 투자평가이며 현금 포함 총액을 묻지 않음. 명시적 총액이 없으면 `currentAsset/assets=null`, 기존 저장 owner에서 `estimatedAssets=null`로 보존. 투자평가를 총액으로 승격하지 않음.
- 하나는 병합 전에 캡처한 같은 화면의 평가·손익 쌍으로 매입금액을 DERIVED 계산하고, 수량이 있으면 평균단가도 계산. 다른 화면의 평가·손익을 섞지 않음. 통화 불명/불일치·낮은 신뢰도·불가능한 음수 원가는 계산하지 않음. 명시적 원가·0은 유지.
- 추가 생략: 계좌 평가 근거가 있는 경우 개별 종목의 현재가/평가 누락은 optional로 생략. 다른 화면에 없다는 이유로 이미 확실히 읽은 계좌 필드를 다시 묻지 않음. 수량 누락·금액 통화 불명·종목 후보 모호성·계좌 평가 근거 부재·큰 충돌 및 원본 자체 불확실성 확인은 유지.
- 공개 합성 테스트: 신규 `scripts/hani-asset-intake-v2-ease.test.mjs` 6건. 하나224 테스트에 날짜 없음/과거 원본 날짜→입력일 저장과 토스 투자평가→estimatedAssets null의 실제 승인 콜백 검증 2건 추가. 기존 A+B/C/smoke의 바뀐 확인·역산 기대만 갱신. 실제 개인 숫자/종목을 신규 공개 fixture로 복사하지 않음.
- 하나224의 기존 optional 브라우저 분기는 A+B의 접힌 고급 수정 UI를 열고 수정/되돌리기/행 제외를 실행하도록 정정. 정상 브라우저 fixture에 두 번째 종목의 보이는 합성 수량을 명시하고, 수량 누락 차단은 기존 Node 회귀에서 별도 유지. 런타임을 테스트의 옛 UI에 맞춰 변경하지 않음.
- 비공개 `.private-intake/report-ease.md`: 증권사별·필드별 표와 MCC. 정상 6케이스(토스3·키움2·하나 A+B1) 모두 MCC 0, 정상 필드 223/223. 기존 실패 raw는 미보충: 토스 MCC0/누락1필드, 키움 MCC1/누락3필드. 키움은 계좌 평가 근거 부재 확인을 유지함. 하나 ground truth 기반 `hana/replay-ease-fixture.json` 추가, 공개 primary 자료로 이름/코드를 확인한 fixture catalog를 exact resolver에 전달. 실제 HANI catalog 인증 세션/실OCR 검증은 아님.
- 줄바꿈: 기존 파일 사본이 HEAD blob과 일치함을 확인하고 정확한 문자열 치환. runtime CRLF6개 유지, LF489→488, +13/-14행. 비변경481행은 EOL 포함 원문 바이트 동일. 수정한 기존 테스트4개도 모든 비변경 행의 EOL 동일. `.private-intake/ease-safety.json`·`ease-runtime.diff` 참조. Git CLI 출력이라고 주장하지 않음.
- 저장 계약 C 보호 함수11개·write 호출 목록 원문 불변. hani-main/index/시장 owner/CSS/서버는 HEAD Git blob identity와 일치. 보호 key·내부 버전·Cloud/schema·migration·삭제/백업 경로·버전/cache 변경 없음. `approve/approvePositions/mergeWithExistingHoldings` 원문 그대로.
- Notion 현황판 조회 성공. 착수 append는 자동 승인 검토의 `MCP tool call requires approval, but approval policy is never`로 거절. 갱신 대기이며 저장/read-back 완료 아님.

## 실행한 검증과 미검증

- Node 24.19.0, `--test --test-isolation=none`: ease6 + A+B9 + C13 + Hana224 15 + Toss224 10 + Kiwoom224 10 + OCR224 13 = 76건 시도, **75 PASS / 1 환경 차단**. `.private-intake/tests-ease-final.log`.
- 차단1은 기존 OCR224 보호 검사에서 `spawnSync git EPERM` 발생. 원래 Git release-chain oracle을 수정/우회하지 않았고 PASS로 표시하지 않음. 별도로 HEAD object 기반 보호 함수11개·write 호출 및 비변경5파일 identity 검사 PASS.
- `node scripts/hani-asset-update-smoke.js` PASS. 날짜와 optional 개별 평가 확인의 이전 기대2개만 정정.
- 실제 Edge: A+B 390/1440 × 정상/모호 4화면. 후보 선택·수정·되돌리기·취소·가로 넘침0·pageerror0·승인 전 write0 PASS. `.private-intake/ease-ui/` PNG4장, `ease-browser.log`. 390px 정상 화면 직접 시각 확인. 실행한 브라우저는 신규 격리 합성 상태이며 실계정/실데이터와 무관.
- 기존 `hani-asset-update-browser-smoke.js`도 실제 Edge PASS. clipboard·선택 계좌 우선·승인 저장/새로고침·하나 다중 화면·명시 삭제 보호·타 계좌 보존·저장 실패 안내·390px overflow0·pageerror0·합성 데이터 유실0 확인. 로컬 복사본에서 외부 요청 차단, 기존 mock orchestrator 응답과 스크린샷 출력 위치만 격리. `.private-intake/ease-browser-smoke.log` 및 `ease-ui/smoke/`. 운영 데이터 삭제/실저장은 수행하지 않음.
- Hana224 실제 Edge 1440/390도 최종 PASS. 고급 수정·오류 복구·수량 파생 계산·행 추가/제외/되돌리기·키보드 focus·가로 넘침0·승인 전 상태/저장 불변·승인 후 read-back·키움/토스 편집 확인. `ease-hana-browser.log`, `ease-ui/hana224-{1440,390}.png`. 1440px 결과 직접 시각 확인. 초기 실행의 접힌 details 관련 테스트 실패는 위 테스트 보정 후 두 너비에서 재실행했으며 최종 PASS 로그를 별도로 확인함.
- JS syntax PASS. `.private-intake/ease-audit.cjs`에서 실제 owner를 vm.Script 컴파일.
- 실OCR/API·실계정 저장·실폰·독립 아린/HINA·runtime Candidate/Build/One-Pass·Production read-back은 미실시. 최종 릴리스 완료 아님.
- 기존 C의 read-back 한계 유지: 디스크 쓰기 성공 후 read-back만 실패하면 자동 디스크 복구를 보장하지 않음. 이번에 새 롤백 쓰기를 추가하지 않음.
- Git CLI가 PATH/기존 설치 위치에 없고 테스트의 git 자식 실행은 EPERM. commit 불가로 요청대로 파일만 보존. push·PR·merge·배포하지 않음.

## 다음 담당에게

- 허용 환경에서 Git 원본 oracle 1건 재실행 후 변경5파일+신규 합성 테스트+이 인수인계만 검토/커밋. `.private-intake/`는 공통 Git info/exclude에 제외됨을 확인했으며 절대 stage하지 말 것. 기존 파일4개 테스트는 A+B/C/Hana224/smoke.
- 현재 미션은 push/PR/배포 금지. 후속 지시가 있으면 배포 담당 Claude가 열차에 통합하며 원래 서버 A+B prompt와 client의 배포 순서를 확인. 이번 후속 자체의 Edge/설정 변경은 없음.
- Notion 미반영 요약: 이 문서의 상태·branch/base/HEAD·입력 편의 변경·75 PASS/차단1·UI4화면·정상 MCC0·미검증·다음 행동. 민감 원본은 전송하지 말 것. 공통 CURRENT/DECISIONS는 타 작업 기록을 보존하고 이 작업별 문서로 전달.
- main/Pages/표시 버전 실제 로딩/기능 read-back은 이번 작업에서 수행하지 않음. 미커밋 로컬 구현과 운영 반영을 구분.
