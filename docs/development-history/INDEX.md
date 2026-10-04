# HANI 개발 히스토리 · 중앙 인덱스

- 기준일: 2026-10-04 KST
- P0 시작 기준선: `f5274cebc24b617ad13df70d354e31504470de70` / v2.9.164
- 최신 확인 main: `3a7979d1782eefab539fc0ba441eec0b961ab8e3` / v2.9.166
- Pages 표시 버전: `v2.9.166` 확인
- 마지막 전체 Production 원장: `v2.9.166`
- P0 중앙 기록 정리: `COMPLETED` (2026-10-04)
- 오래된 PR 정리: PR61·68 `CLOSED / SUPERSEDED` (branch 삭제 없음)
- 최신 UI layer: `hani-ui-v02992.js?v=2.9.164`
- 마지막 별도 기능 script: `hani-development-history-v1.js?v=2.9.166`

## 현재 읽을 문서

| 분류 | 문서 | 상태 |
|---|---|---|
| 전체 상태 | `2026-10-04/p0-project-status-v2.9.165.md` | 현재 기준 |
| 오래된 후보 | `2026-10-04/pr61-pr68-triage-v2.9.165.md` | PR61·68 분류·종료 완료 |
| main drift | `2026-10-04/v2.9.165-aura-menu-status.md` | Pages live / 기능 read-back 미완료 |
| Boardroom | `2026-10-04/boardroom-participant-routing-v2.9.150.md` | Production |
| Devlog | `2026-10-04/hani-devlog-automation-foundation.md` | Candidate / live test 미완료 |
| HANI AURA | `2026-10-03/v2.9.161-hani-aura-release-record.md` | Production 원장 사본 |
| Portfolio | `2026-10-04/v2.9.162-portfolio-analytics-release-record.md` | Production 원장 사본 |
| Character Voice | `2026-10-04/v2.9.163-tab-character-voice-release-record.md` | Production 원장 사본 |
| Data Hub | `2026-10-04/v2.9.164-data-hub-release-record.md` | Production 원장 사본 |
| P1 안정성·Portfolio | `2026-10-04-p1-safety-portfolio.md` | Production · Asset Input 보호 변경 제외 |
| Asset Input canonical contract | `2026-10-04-v2.9.168-asset-input-canonical-contract.md` | Production · PR165 · Pages/read-back PASS |

## 최근 Production 계보

아래 표는 `origin/main`의 실제 first-parent 계보와 별도 배포 기록을 교차 확인한 요약이다.

| 날짜 | 버전 | 핵심 변경 | Production SHA |
|---|---|---|---|
| 2026-10-04 | v2.9.168 | Asset Input canonical contract · Partial/Complete · optional cost | `9099d89` |
| 2026-10-04 | v2.9.167 | HANI AURA Campaign Posters · 5 Finish 반응형 Hero | `d67f3be` |
| 2026-10-04 | v2.9.166 | P1 안정화 재진단·포트폴리오 대비·개발센터 최신화 | `3a7979d` |
| 2026-10-04 | v2.9.165 | AURA·배포센터 사이드바 메뉴 그룹 조정 | `b80c620` · Pages live, 전체 read-back 미완료 |
| 2026-10-04 | v2.9.164 | Data Hub Batch A/B/C, Dashboard 6대 지표 | `f5274ce` |
| 2026-10-04 | v2.9.163 | 탭별 canonical 캐릭터 한마디 | `ad3a041` |
| 2026-10-04 | v2.9.162 | 읽기 전용 Live Portfolio | `022b296` |
| 2026-10-03 | v2.9.161 | HANI AURA showroom·계절 컬렉션 | `6d46ec9` |
| 2026-10-03 | v2.9.160 | Seasonal ambient·collection cards | `85c8110` |
| 2026-10-03 | v2.9.159 | read-only source owner verification | `d9109aa` |
| 2026-10-03 | v2.9.158 | 캐릭터 Finish showroom·responsive Hero | `d6cfd62` |
| 2026-10-03 | v2.9.157 | Signature Finishes·Remote artwork fit | `fe07619` |
| 2026-10-03 | v2.9.156 | Seasonal architecture·Galaxy compatibility | `cb6f6d1` |
| 2026-10-03 | v2.9.155 | HANI GALAXY Batch B | `321acc0` |
| 2026-10-02 | v2.9.154 | Dashboard·Diet neutral surfaces | `ff8c9ea` |
| 2026-10-02 | v2.9.153 | Dashboard Topbar·LIFE MARKET ticker | `03b4c99` |
| 2026-10-02 | v2.9.151 | Life Report presenter·월별 보관 | `09bdd1a` |
| 2026-10-02 | v2.9.150 | Boardroom 실제 Agent 교차 검토·복구 | `2c9e989` |
| 2026-10-01 | v2.9.149 | 배포센터 One-Pass·기존 PR 검증 | `90b8508` |
| 2026-10-01 | v2.9.148 | 시장 차트·holdings-only update | `e4be987` |
| 2026-09-29 | v2.9.146 | HANI Remote rotating banners | `6fd9757` |
| 2026-09-29 | v2.9.145 | Toss 시장 데이터·종목 검색 | `eeccbef` |

## 현재 Preview 후보

| 날짜 | 버전 | 핵심 변경 | 브랜치 |
|---|---|---|---|
| — | — | 이 작업의 Preview 후보 없음 · v2.9.168 Production 완료 | — |

## 기록 공백

- 운영 개발센터는 v2.9.166에서 v2.9.161~166, P0 중앙 기록을 최신순으로 표시한다.
- v2.9.161~164의 상세 원장은 중앙 사본으로 보존한다.
- Asset Input canonical contract는 v2.9.168 / PR165로 Production 배포와 운영 응답 기능 read-back을 완료했다. 운영 개발센터의 기존 Preview 문구는 이 배포 후 문서 기록과 구분하며, 다음 runtime 릴리스에서 Production 문구로 반영할 항목이다.
