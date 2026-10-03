# HANI OS 프로젝트 상태 · v2.9.164 기준

- 확인일: 2026-10-04 KST
- 기준선: `origin/main` / `f5274ce`
- 목적: 완료·부분 완료·후보·미착수를 최신 Production 기준으로 재분류

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

## 부분 완료 또는 후보

| 프로젝트 | 상태 | 남은 경계 |
|---|---|---|
| Goal & Guidance | `PARTIAL` | 분기>연간>없음 resolver는 있으나 영구 Goal Registry와 입력 UI 없음 |
| Asset Input canonical contract | `PARTIAL` | Partial/Complete, 누락 종목, 명시적 0, instrument identity 계약 확정 필요 |
| 9-agent Voice Registry | `PARTIAL` | 탭 문구는 운영 완료, 공통 서버 Registry는 별도 재검토 필요 |
| HANI GROUP 조직 Hub | `PARTIAL` | 브랜드·AI Team은 있으나 전용 조직 운영 Hub는 미완료 |
| HANI DEVLOG Automation | `CANDIDATE` | Gemini CLI 0.62.0, dry-run 34 PASS; live 생성 실패 후 미재시도, main 미병합 |
| 안정화 핫픽스 | `DEFERRED` | 최신 v2.9.164에서 실제 재현 후 최소 패치 여부 결정 |
| 포트폴리오 테마 대비 | `DEFERRED` | 밝은/어두운 Finish와 PC/모바일 가독성 보완 필요 |

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

1. P0 중앙 기록과 오래된 후보 분류를 유지·갱신한다.
2. P1 핫픽스를 v2.9.164에서 재진단하고 포트폴리오 대비를 보완한다.
3. Asset Input canonical contract를 먼저 고정한다.
4. Goal Registry 계약을 고정한 뒤 분기·연간 집계를 연결한다.
5. Portfolio 월간 Snapshot과 Data Hub D/E를 진행한다.
6. Production-only Devlog와 선택적 Drive Vault를 연결한다.

## 데이터·배포 영향

이 기록 작업은 문서 전용이다. `hani_os_life_v23`, `2.9.15-safe-baseline-bootstrap`, Supabase, schema, Cloud write, 운영 runtime과 표시 버전을 변경하지 않는다. main 병합·배포도 수행하지 않는다.

