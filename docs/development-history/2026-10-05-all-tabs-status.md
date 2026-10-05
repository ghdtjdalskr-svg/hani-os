# 전체 HANI 개발 탭 현황 · 2026-10-05

## 범위

접근 가능한 HANI 개발 탭 16개(현재 포함, 보관9개)의 최근 기록·관련 과거 구간과 기존 원장을 대조했습니다. 일반 생활 상담/뉴스 대화는 개발 원장에 복사하지 않았습니다. 모든 과거 대화·실기기의 전수 검사라는 뜻은 아닙니다. active 또는 제목의 ‘완’만으로 배포를 판단하지 않습니다.

다른 탭에 메시지를 보내거나 작업을 재실행하지 않았습니다. 개인 목표값·생활 기록·인증정보는 제외했습니다. 진행 중 상태는 조회 시점 snapshot입니다.

## 탭별 원장

| 탭 이름 (원문) | 상태·담당 | 근거 / 남은 작업 |
|---|---|---|
| 분야별 목표 기능 진행 현황 정리 | 허브·전체 현황 | PR181·182 병합, 전체 기록 갱신 후보 |
| 누락된 QA 수행하기 | Conference Room/PPT/연간 뷰어 개발 | 격리 회귀/PPT 검사, 실제 Q&A 응답 보고. 가독성 수정·실응답 PPT·연간 인증·최종 배포 남음 |
| 자산 업데이트실 v1 개발 | v178 운영, 목표 기기 검증 | PR180 화면/JS 확인. PC/Cloud 전달 확인 진행, 모바일 남음 |
| Gemini 프로젝트 | 보고서/개발팀 운영, 품질·게이트 개발 | v174 운영. 원본 보호/백업/권한/강화 게이트 후보, 미배포 |
| 테마 작업 | AURA/모바일 운영, 뉴스 출제 후보 | PR183 OPEN. 독립 검토/PC·390 보고, 실제 생성 품질/최종 게이트 남음 |
| ㅇ | 새 구현 없음 | 기록 지침 수신, 미배포 코드 변경 없음 |
| HANI 안정화 핫픽스 수행 | 원래 핫픽스 보류 | Fact Check만. 후속 P1 해결 범위와 구분 |
| 프로젝트 작업 알림 방법 확인 | 알림 중지 요청 | 발송/Windows 시작 중지, 앱 반복 자동화 중지 거절 / 상태 미확인 |
| 계절테마 작업 예정(완) | Gemini 프로젝트로 통합 | 실제 읽기·노트 생성 보고, 중복 실행 중단·파일 보존 |
| DataHub | v164 운영·후속 인계 | 과거 미완료 목록은 P0/P1/v168/v178 근거로 정정 |
| 경영회의실 작업 (완) | v150 routing 운영 | 함수v50/Pages 기록, 문서 PR157 OPEN |
| 여행탭 업데이트 (완) | v130 운영 | Production 완료 보고, 남은 작업 없음 |
| 토큰 절감 방안 (완) | PR114 병합 | 공통 효율화/CI, runtime N/A |
| 투자 자산 업데이트 | v162 운영 | 대비 문제는 v166 후속 해결. 공식 월별 History 별도 |
| 월간/분기연간보고 (완) | 월간·v163 문구 운영 | PR128 보류. 신규 Conference Room 후보는 QA 탭 |
| 진행 없음 | 새 개발 없음 | 야구 자동화 실패/보관 안내, 완료 기능 추가 없음 |

## 담당 작업 공간·충돌 주의

| 담당 | 공간 | 상태 |
|---|---|---|
| 누락된 QA 수행하기 | .worktrees/earnings-annual-viewer-20261005 | main/CSS/보고서 도구 Preview, 최신 통합/게이트 필요 |
| Gemini 프로젝트 | .worktrees/quality-current-preview | 원본 보호·서버 권한·게이트 후보. 정책 승인/배포 미완료 |
| 테마 작업 | .worktrees/study-news-release-final | PR183 head 조회 f12ff03, 이후 수정 보고 있어 identity 재확인 필요 |
| 자산 업데이트실 v1 개발 | .worktrees/p2-runtime-release-v178 및 승인된 실제 앱 | 운영 후 실제 목표 검증, 다른 담당은 데이터 접근/쓰기 금지 |
| 현재 취합 | .worktrees/hub-all-tabs-status | docs 전용, base c544592, 타 작업 수정 없음 |

세 runtime 후보는 핵심 파일·기준선을 공유하므로 담당 조정 없이 동시에 통합하지 않습니다. 이 문서는 작업권한/배포승인을 추가하지 않습니다.

## 교차 확인

- list_threads·list_archived_threads·read_thread로 탭 기록을 조회했습니다.
- PR180 MERGED/90b7440, PR181 MERGED/4cd5613, PR182 MERGED/c544592.
- PR183 OPEN, PR128 OPEN, PR157 OPEN. 열린 PR은 기능 전체 미구현의 근거가 아닙니다.
- [P0](2026-10-04-p0-project-status.md), [P1](2026-10-04-p1-safety-portfolio.md), [Asset v168](2026-10-04-v2.9.168-asset-input-canonical-contract.md), [PR 정리](2026-10-04-pr-triage.md) 확인.
- 로컬 DEVLOG 현황은 실제 생성/저장/원장 대조 성공, 모의44개 PASS. 과거 dry-run34/실호출 실패를 최신 실패 상태로 반복하지 않습니다.
- main 계보 v169 보고서 메뉴, v170 AURA, v171 지도/캔들, v172 캐시, v173 원가, v174 개발팀, v175 모바일/기간, v177 뉴스룸, v178 Goals/Data Hub 확인.
- 배포 보고가 있으면 ‘기존 운영 확인 기록’, main만 확인하면 ‘main 반영’으로 구분합니다. 이번 취합은 별도 운영 재검증이 아닙니다.

## 원래 Phase 2 재분류

| 항목 | 최신 판정 |
|---|---|
| UI/UX·Design System | 다수 운영 개선, 접근성 전체 미확인 |
| Micro-interaction | 부분, 독립 완료 근거 없음 |
| Mobile State Persistence | 전체 복원 완료 근거 없음 |
| Realtime/Cloud Sync | 기존 구현/PC 정상 비교 보고, 기기별 충돌/목표 모바일 확인 남음 |
| Cloud Restore 2A·Cloud-first | 새기기 UX/Cloud authoritative 완료 근거 없음 |
| Data Foundation | Hub A/B/C·Dashboard·v178 운영 보고 |
| Toss / Investment Live | 운영 기록 있음 |
| Investment Automation | holdings-only·Asset v168 완료, 전체 자동화 별도 |
| Portfolio Intelligence | Live 운영, 공식 Snapshot/History 남음 |
| Goal Registry | v178 입력/이력 운영, 보고서 통합·전체 분야 범위 남음 |
| Monthly Report | 기본 운영, Hub/Conference Room 후속 |
| Quarterly / Annual Results | 분기/PPT·연간 뷰어 Preview, 전체 Guidance 운영 미완료 |
| Recalibration | 목표 초안과 공식 제안→검토→승인 체계 구분 |
| Conference Call | Boardroom 운영, 보고서 Conference Room 후보 |
| IR PPTX / PDF | PPT검사/PDF뷰어 후보, 실사용/운영 남음 |
| HANI GROUP | 생활팀/개발팀 화면 운영, Organization Hub 부분 |
| Messenger | 별도 완료 근거 없음 |
| Investment Committee | 개념 부분, 정식 월간 심의 근거 없음 |
| Backup/Recovery | 백업3개·복원 보호 검증 후보, 운영 미배포 |
| Google Drive | Vault 완료 근거 없음 |
| 외부 API 확대 | Toss 외 전체 완료 근거 없음 |
| 외부 LLM Orchestration | Gemini 단발 성공/Claude 지침 준비, 공통 실행계층 없음 |
| DEVLOG | 생성/저장·메뉴 운영, 자동 트리거/동기화 남음 |

## 다음 단계

취합 문서와 Notion을 공유하고 이 후보의 main 병합 승인을 확인합니다. 대표님이 정리 완료를 확인한 후 Claude에 연결을 요청합니다. 최신 기록 commit과 담당 후보를 먼저 읽는 것이 연결의 시작 조건입니다.
