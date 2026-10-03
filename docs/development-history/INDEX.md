# HANI 개발 히스토리 · 중앙 인덱스

- 기준일: 2026-10-04 KST
- P0 시작 기준선: `f5274cebc24b617ad13df70d354e31504470de70` / v2.9.164
- 최신 확인 main: `b80c620ae817a469ee13d837656899654da25c74` / v2.9.165
- Pages 표시 버전: `v2.9.165` 확인
- 마지막 전체 Production 원장: `v2.9.164`
- 최신 UI layer: `hani-ui-v02992.js?v=2.9.164`
- 마지막 별도 기능 script: `hani-development-history-v1.js?v=2.9.135`

## 현재 읽을 문서

| 분류 | 문서 | 상태 |
|---|---|---|
| 전체 상태 | `2026-10-04/p0-project-status-v2.9.165.md` | 현재 기준 |
| 오래된 후보 | `2026-10-04/pr61-pr68-triage-v2.9.165.md` | PR61·68 분류 완료 |
| main drift | `2026-10-04/v2.9.165-aura-menu-status.md` | Pages live / 기능 read-back 미완료 |
| Boardroom | `2026-10-04/boardroom-participant-routing-v2.9.150.md` | Production |
| Devlog | `2026-10-04/hani-devlog-automation-foundation.md` | Candidate / live test 미완료 |
| HANI AURA | `2026-10-03/v2.9.161-hani-aura-release-record.md` | Production 원장 사본 |
| Portfolio | `2026-10-04/v2.9.162-portfolio-analytics-release-record.md` | Production 원장 사본 |
| Character Voice | `2026-10-04/v2.9.163-tab-character-voice-release-record.md` | Production 원장 사본 |
| Data Hub | `2026-10-04/v2.9.164-data-hub-release-record.md` | Production 원장 사본 |

## 최근 Production 계보

아래 표는 `origin/main`의 실제 first-parent 계보와 별도 배포 기록을 교차 확인한 요약이다.

| 날짜 | 버전 | 핵심 변경 | Production SHA |
|---|---|---|---|
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

## 기록 공백

- 운영 화면의 기존 개발 히스토리는 v2.9.135 이후 릴리스를 아직 표시하지 않는다.
- v2.9.161, v2.9.162, v2.9.163, v2.9.164의 상세 원장은 개별 release worktree에 있고 현재 `origin/main`에는 포함되지 않았다.
- 이번 P0는 중앙 인덱스와 상태 분류를 만들며, 운영 화면이나 release runtime은 변경하지 않는다.
- P0 문서 후보 생성 중 main이 v2.9.165로 이동했다. 변경 파일은 `hani-main.js`, `index.html`이며 이 문서 경로와 겹치지 않는다. 임의 merge/rebase는 하지 않았다.
