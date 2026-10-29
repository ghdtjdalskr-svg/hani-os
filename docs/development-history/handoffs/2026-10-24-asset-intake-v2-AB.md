# HANI ASSET INTAKE V2 · A+B 인수인계

## 작업 식별
- 작업 ID: Asset Intake v2 A+B / 2026-10-24 KST / 도연(Codex), 개발 Agent 1명.
- 상태: 읽기 전용 구현·로컬 targeted 검증 완료, 필수 실제 브라우저 QA 차단. 열차 탑승·Candidate·운영 완료 아님.
- 저장소 / branch / worktree: ghdtjdalskr-svg/hani-os / hani/asset-intake-v2 / intake-v2.
- base·HEAD·원격 main: d19aa0b62b1657660cb3cc6bec6bee1524dbb2bf. GitHub branches/main 조회 일치. Git 실행 파일 부재로 commit 없음.
- 사용자 승인: MISSION-intake-v2-AB.tmp.md 실행 지시. A+B 구현·합성/비공개 로컬 검증만. push·PR·main merge·배포·Toss 연결·보호 저장 owner 변경 금지.
- 변경 범위: hani-asset-update-v1.js, hani-asset-market-view.js, hani-style-07.css, orchestrator index.ts의 Asset Vision prompt 1문단. tests 224 Hana 및 smoke/browser-smoke 기대·접힘 조작 갱신, 신규 AB test/browser runner, artifacts/asset-intake-v2와 이 인수인계.
- 타 담당 worktree·공통 CURRENT/DECISIONS는 수정하지 않음.

## 결과와 증거

1. **설계**: 기존 PHASE1~2 설계를 따라 A+B만 구현. PR C/D는 별도.
2. **정규화**: 괄호/단위/%/줄바꿈·공식 라벨 alias. 내 투자→투자평가로 scope 분리, 융자0→현금 매핑 거절. 복합 총수익 raw에서 금액 분리.
3. **계산**: evidence가 있어도 missing만 6개 식 보완. 원본 덮어쓰기 없음. 0/null·통화·net 평가 차단, 비용 기준 불명 손익 계산 차단. 곱셈/뺄셈 정수 decimal scale, 나눗셈은 기존 Number 정밀도 유지·중간 표시 반올림 없음.
4. **출처**: API/VISIBLE_SOURCE/DERIVED/INSTRUMENT_MASTER/USER_EDIT/MISSING를 WeakMap에 기록. 영속 schema 없음. 기존 승인 owner가 원래 보관하는 sourceCapture/extractedText 형식은 유지.
5. **병합**: 정적 identity/수량/원가 충돌은 엄격. 같은 시점·통화·정적값이 호환되는 동적 소차이는 INFO. USD에 1,000원 허용치 미적용. 동적 관측의 빈칸을 다른 화면 값으로 임의 혼합하지 않음.
6. **Broker**: TOSS OCR fallback/KIWOOM 기존 2행 parser/HANA 라벨 근접·다중 화면/Generic을 기존 경로 안에서 선택. 새 renderer/event layer·API 연결 없음.
7. **Master**: catalog exact 이름·ticker·curated alias가 유일할 때만 draft 보충. fuzzy 단독 자동 확정 금지. 우선주/ETF 시리즈/시장 구분. catalog adapter는 기존 인증된 read-only search만 사용. 장애·다중 후보는 예외와 후보 맞아요/직접 수정.
8. **Preview**: 기존 render/renderPositions 안에서 요약 카드·3상태·이대로 반영, 예외 블록, 접힌 전체 인식값 보기/고급 수정. optional missing은 필수 확인에서 제외. 새 수량을 기존 snapshot에서 자동 확정하지 않음. 토스 투자합계만 읽었으면 현금 포함 총액 확인을 남겨 STOP3 의미 변경 방지.
9. **로컬 검증**: 기존 224 네 묶음45 PASS, Git 원본 oracle1 BLOCKED. 신규9 PASS. 기존 smoke 원문 VM PASS. Node/Git CLI가 PATH와 확인 경로에 없어 Node REPL의 VM에서 원래 콜백을 실행했으며 표준 CLI 실행과 구별한다. OCR 합성22개330필드 기존 결과 유지. artifacts/asset-intake-v2/targeted-results.json.
10. **보호 원문**: 저장/삭제/롤백11함수 frozen hash 및 시작 원문 일치, write 호출 목록 동일, hani-main.js 동일, Edge Vision 밖 동일. v2.9.232/cache 유지. 보호 키·내부 버전·schema·Cloud/secret/실계정 write 변경 없음. safety.json 참조. Git 전체 release-chain oracle은 미완료.
11. **실제 자료 replay**: 원본5장 육안 재대조, 비공개 script 실행7건. 원본값 재구성211/211, 실패 raw 재구성33/37. catalog는 테스트용 정답 fixture이며 운영 catalog 연결 검증이 아님. 원 JSON이 없어 label/구조를 캡처에서 재구성. 애초 raw에 빠진 계좌 필드4개는 남아 있고 추출 문제 해결로 주장하지 않음. 원본 미대응09~11은 실제 정확도 분모 제외. private 보고서의 Broker/Field 표·MCC 참조. 외부 OCR 호출0, Preview write0.
12. **MCC**: 정상 합성0. 원본값 재구성은 토스 계좌2건(기준일+현금 포함 총액), 키움1건(기준일). 실패 raw 재구성은 각각2건. 기존 모든 optional 노란필드 수와 새 필수 예외 수는 정의가 달라 개선률로 포장하지 않음. 하나 원본0장이므로 실제 검증 N/A.
13. **실제 Screenshot**: 미완료, 새 PNG0장. Playwright 모듈 없음 / CUA browser inventory 없음 / IAB unavailable. 정적 서버127.0.0.1:4173 시작 성공. 합성 preview-fixture.html 및 390/1440 browser runner는 준비했지만 실제 화면·overflow·접근성 PASS 아님.
14. **Edge**: Asset Vision prompt 보완만, schema/model/auth/write 불변. 미배포. 서윤이 client와 prompt를 열차에서 통합하고 필요 시 배포 순서를 정함.
15. **Git·배포**: 파일만 로컬 보존, commit·push·PR·main merge·Pages·Production read-back 없음. 버전 증가·Build/One-Pass/HINA는 이번 개발 patch에서 수행하지 않음. 최종 runtime 후보가 아님.
16. **Notion**: 현황판 읽기 성공. 착수 append는 자동 승인 검토가 'MCP tool call requires approval, but approval policy is never'로 거절. 저장/read-back 성공 아님. 위 branch/base·변경·45+9 PASS/차단·private replay 제한·Screenshot 대기·PR C 경계·다음 행동을 갱신 대기로 보존. 민감값은 공유하지 않음.
17. **다음 행동**: 허용 브라우저 환경에서 기존 browser-smoke 및 AB browser runner 실행→390/1440 PNG·실제 UI 검증→대표님 Preview. 그 후 요청 범위에서만 배포 담당에게 인계. 현재 push/PR 금지 유지. PR C 저장 정정은 별도 명시 승인 필요.

## 다음 담당에게
- 먼저 읽을 파일: 이 인수인계, 설계 handoff, artifacts/asset-intake-v2/README.md, 해당 owner 함수.
- 즉시 할 일: 위 browser QA 재실행. 임의 main merge/rebase·열차 탑승 선언 금지.
- blocker: 실제 브라우저/Playwright 환경, Git release-chain oracle, Notion write 정책.
- 남은 위험: 실제 LLM OCR·사용자 catalog coverage·Hana 실제 원본·로그인 통합·Android 미검증. 저장 PR C의 과거 동적값 carry 문제를 A+B 완료로 혼동하지 말 것.
- CURRENT/DECISIONS: 타 담당 기록 보존, 공통 최신현황 미갱신.
