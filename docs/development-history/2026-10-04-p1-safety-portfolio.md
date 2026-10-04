# P1 안정성 재진단 · 포트폴리오 대비 · Asset Input 계약

- 확인일: 2026-10-04 KST
- 기준선: `183be6c9cab0c4e2a3ac062a3f37838491be92f9` / v2.9.165
- 배포 브랜치: `hani/p1-safety-portfolio` / v2.9.166
- PR: `#161`
- Production main: `3a7979d1782eefab539fc0ba441eec0b961ab8e3`
- 상태: `PRODUCTION`

## 안정화 핫픽스 재진단

오래된 핫픽스 브랜치는 최신 main에 직접 병합하거나 cherry-pick하지 않는다.

| 후보 | 판정 | 최신 근거 |
|---|---|---|
| v2.9.96 Dashboard QA | `SUPERSEDED` | v2.9.97 운영 병합 이후 Dashboard·Design System·AURA 후속 릴리스가 누적됨 |
| v2.9.87 Ledger period completeness | `SUPERSEDED` | 후속 월간 Report와 Data Hub 월별 엔진이 현재 집계 경로를 소유함 |
| v2.9.118 Market overflow | `SUPERSEDED` | 후속 market comment clipping 수정과 v2.9.153 LIFE MARKET UI가 대체함 |
| runtime closure packaging | `SUPERSEDED` | v2.9.149 One-Pass와 이후 Release Gate 계약이 현재 배포 경로를 소유함 |
| deploy One-Pass contract hotfix | `SUPERSEDED` | 최신 Gate 계약과 반복 운영 릴리스로 대체됨 |

재현되지 않은 과거 패치를 다시 얹지 않는다. 현재 기준선의 Asset Input 브라우저 회귀는 데이터 손실 0, 계좌 격리, 누락값 보존, 저장 실패 복구를 통과했다.

## 포트폴리오 대비 보완

- 포트폴리오 내부를 명시적인 light color scheme으로 고정한다.
- 전역 Finish 글자색이 밝은 카드 안의 제목·표·상세·막대 레이블에 스며들지 않도록 local ink를 명시한다.
- 계산, 시세, 계좌, 저장 경로는 변경하지 않는다.
- Porcelain Cream, Titanium Graphite, Midnight Black, Sakura Pink, Alpine Blue에서 WCAG AA 4.5:1 이상을 자동 확인한다.
- 390px 모바일 가로 넘침과 저장·네트워크 접근 없음도 확인한다.

## Asset Input canonical contract 진단

현재 충족:

- Partial Update에서 이번 입력에 없는 종목은 기존 보유정보를 유지한다.
- 명시적 `quantity=0`은 청산 후보로 구분할 수 있다.
- 확인되지 않은 현재가·평가액을 0원이나 현금으로 바꾸지 않는다.
- Portfolio의 canonical read path는 최신 confirmed account snapshot을 계좌별로 하나만 선택한다.
- KRW/USD는 환율 검증 없이 합산하지 않는다.

v2.9.166 당시 별도 승인 후 구현할 항목 (후속 v2.9.168에서 완료):

- 평균매입가를 optional로 전환하고 원가 미확인 시 손익·수익률을 계산하지 않는 저장 계약
- `Partial Update`와 `Complete Holding List`의 명시적 입력 모드
- Complete 모드에서도 누락 종목을 자동 매도 처리하지 않는 대표 확인 절차
- ticker·instrumentId·정규화 이름의 안정적인 identity 우선순위와 충돌 처리

위 항목은 `hani_os_life_v23` 쓰기 검증과 저장 의미를 바꾸므로 이 후보에서는 코드 변경하지 않았다. Supabase, schema, Cloud write도 변경하지 않았다.

2026-10-04 후속 승인으로 위 계약을 구현했고 v2.9.168 / PR165 / Production `9099d89`에서 Pages 및 실제 운영 응답을 실행한 기능 read-back을 완료했다. 상세 근거는 `2026-10-04-v2.9.168-asset-input-canonical-contract.md`에 기록한다. P1과 Asset Input 선행 작업은 모두 완료 상태다.

## 검증 결과

- Portfolio 5 Finish 대비: `PASS`
- Portfolio 모바일 390px overflow: `PASS`
- Market Data 단위 테스트 12개: `PASS`
- Asset Update static smoke: `PASS`
- Asset Update browser smoke: `PASS` · data loss 0 · page error 0
- 보호 storage key 이름과 내부 데이터 버전: 변경 없음
- Production: `PASS` · main 병합, Pages v2.9.166, 최신 JS·CSS, 포트폴리오 탭과 개발센터 read-back 확인
