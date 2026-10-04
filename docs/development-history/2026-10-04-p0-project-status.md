# HANI OS 프로젝트 상태 · v2.9.168 기준

- 확인일: 2026-10-04 KST
- P0 시작 기준선: `f5274ce` / v2.9.164
- 최신 확인 runtime main: `9099d89` / v2.9.168
- 목적: 완료·부분 완료·후보·미착수를 최신 Production 기준으로 재분류

## P0 완료

- 중앙 `README`와 `INDEX` 생성
- 기존 Boardroom·Devlog 기록 보존
- v2.9.161~164 Production 원장 사본 취합 및 해시 대조
- 프로젝트 상태와 통합 우선순위 정리
- PR61·68을 후속 릴리스로 대체된 후보로 분류하고 근거 댓글 후 종료
- Gemini CLI 0.62.0과 Devlog 후보 상태 확인. 실제 모델 재호출 없음

## Production 완료

| 프로젝트 | 상태 | 근거 |
|---|---|---|
| Data Hub Foundation / Batch A / B / C | `PRODUCTION` | v2.9.164, Dashboard 6대 지표와 파생 IndexedDB 캐시 |
| 탭별 캐릭터 한마디 | `PRODUCTION` | v2.9.163, 28개 화면과 스포츠 세부 화면 read-back |
| Live Portfolio | `PRODUCTION` | v2.9.162, 읽기 전용 평가·구성·계좌/통화 필터 |
| HANI GALAXY / AURA | `PRODUCTION` | v2.9.155~161, 5 Finish와 계절 컬렉션 |
| Seasonal Dashboard / Remote | `PRODUCTION` | 계절 이미지 4종, Dashboard 별도 배너와 Remote 연결 |
| Boardroom 명시 참가자 Routing | `PRODUCTION` | PR136, 함수 v50 / routing 1.7.1 read-back |
| Dashboard Topbar / LIFE MARKET ticker | `PRODUCTION` | v2.9.153 |
| Toss 시장가격·종목 검색 | `PRODUCTION` | v2.9.145 |
| holdings-only 계좌 업데이트 | `PRODUCTION` | v2.9.148 |
| P1 안정화 재진단·포트폴리오 대비 | `PRODUCTION` | v2.9.166, PR161, 5 Finish·PC/Mobile·운영 read-back |
| Asset Input canonical contract | `PRODUCTION` | 2026-10-04 · v2.9.168 · PR165 · 평균매입가 선택·Partial/Complete·identity·Pages/기능 read-back PASS |
| HANI AURA Campaign Posters | `PRODUCTION` | v2.9.167 · PR164 · 후속 v2.9.168에서 이미지·스타일 보존 확인 |

## 최신 main 진행 상태

| 프로젝트 | 상태 | 근거 |
|---|---|---|
| AURA·배포센터 메뉴 그룹 조정 v2.9.165 | `PAGES_LIVE` | PR159 main 병합, Pages v2.9.165와 `hani-main.js?v=2.9.165` 응답 확인. 운영 메뉴 클릭 전체 read-back은 P0에서 재실행하지 않음 |

## 부분 완료 또는 후보

| 프로젝트 | 상태 | 남은 경계 |
|---|---|---|
| Goal & Guidance | `PARTIAL` | 분기>연간>없음 resolver는 있으나 영구 Goal Registry와 입력 UI 없음 |
| 9-agent Voice Registry | `PARTIAL` | 탭 문구는 운영 완료, 공통 서버 Registry는 별도 재검토 필요 |
| HANI GROUP 조직 Hub | `PARTIAL` | 브랜드·AI Team은 있으나 전용 조직 운영 Hub는 미완료 |
| HANI DEVLOG Automation | `CANDIDATE` | Gemini CLI 0.62.0, dry-run 34 PASS; live 생성 실패 후 미재시도, main 미병합 |

## Backlog

- Goal Registry와 목표 변경 이력
- 분기·연간 Report 실제 집계 및 목표 비교
- Portfolio Monthly Official Snapshot과 종목별 History
- Data Hub 별도 탭: Overview / Monthly / Metrics / Goals / Export
- CSV·JSON Export, Google Drive Vault, 승인된 범위의 Backfill
- Data Hub 기준 Monthly Report·LIFE MARKET 통합
- 외부 GPT·Claude·Gemini 공통 orchestration
- Living Office 계절화

## 다음 실행 순서

1. P0 기록 정리, P1 안정화·Portfolio 대비, Asset Input canonical contract는 Production 완료로 유지한다.
2. 다음 핵심 기능은 분기·연간 Report 실제 집계와 공통 서버 Voice Registry 재검토다. 목표 비교는 Goal Registry 계약·이력 설계를 선행한다.
3. Portfolio 월간 Snapshot·종목별 History와 Data Hub D/E를 진행한다. Asset 입력 계약은 선행 완료됐다.
4. 로컬 CSV·JSON Export 후 선택적 Drive Vault를 연결한다. Production-only Devlog는 병행 후보이며 live 생성 성공이 남아 있다.
5. 운영 개발센터의 v2.9.168 Preview 상태 문구를 다음 runtime 릴리스에서 Production으로 갱신한다. 이번 배포 후 기록은 문서 전용이다.

## 진행상황 갱신 규칙

앞으로 위 우선순위의 특정 작업이 Production read-back까지 완료되면 이 상태표에서 해당 작업을 `PRODUCTION`으로 이동하고 완료일·버전·근거를 기록한다. 동시에 다음 미완료 작업의 선행 관계와 우선순위를 갱신해 성민 대표님께 완료 결과와 함께 보고한다.

## 데이터·배포 영향

이 기록 작업은 문서 전용이다. `hani_os_life_v23`, `2.9.15-safe-baseline-bootstrap`, Supabase, schema, Cloud write, 운영 runtime과 표시 버전을 변경하지 않는다. main 병합·배포도 수행하지 않는다.
