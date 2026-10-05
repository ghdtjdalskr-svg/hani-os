# HANI 최신 개발 현황

- 갱신일: 2026-10-05 KST / 전체 HANI 개발 탭 취합
- 기준 main: c544592e427b44fd7c7c530213a790f50e92bce8 (PR181·182)
- 최신 제품: v2.9.178 / PR180 / 90b7440
- 근거: [전체 탭 원장](2026-10-05-all-tabs-status.md), 담당 완료 보고·기존 원장·GitHub PR/main 대조
- 아래는 담당 검증 보고를 취합한 결과입니다. 이번 작업에서 운영 기능을 재실행하지 않았습니다.
- 진행 중 작업은 조회 시점 snapshot이며, 이후 담당의 최신 인수인계로 갱신합니다.

## 대표님 방향

분야별 목표 설정 완성 → 분기·연간 보고서 연결 → 공통 데이터 정의 → 백업·내보내기·복구 → Google Drive Vault 순서입니다. 데이터 보존 결함 보완은 제품 작업보다 앞설 수 있습니다.

전체 탭 현황판 정리가 끝난 뒤 대표님이 Claude에 연결을 요청합니다. 이번 취합에서는 Claude 실행·연결을 시작하지 않습니다. 기능 개발·보호 게이트·Cloud·main·배포는 실제 승인 범위를 확인합니다.

## 완료 또는 운영 기록이 있는 항목

| 항목 | 확인 상태와 근거 | 남은 경계 |
|---|---|---|
| Goal Registry·목표 이력 | PR180/v178 운영 화면·최신 JS 확인 보고. 6개 지표·분기/연간 입력·Preview/승인/이력 | 전체 분야 범위·보고서 통합·기기별 실제 검증 |
| Data Hub | A/B/C·Dashboard v164 및 별도 읽기 화면 v178 운영 보고 | 목표·보고서의 완전한 통합 |
| Live Portfolio | v162 운영, v171~173 지도/캔들/캐시/원가 개선 main 반영 | 공식 월별 Snapshot/History |
| Asset canonical contract·Toss | v168 Production, 평균매입가 선택·Partial/Complete·identity. 시세/검색·holdings-only 운영 기록 | 전체 입력 자동화 |
| Portfolio 대비·P1 재진단 | v166 Production 원장 | 오래된 탭의 미완료 문구를 후속 원장으로 정정 |
| GALAXY/AURA·Design System | v155~161·167·170 기록/main, 5 Finish·계절·포스터 | 접근성 전체 완료는 미확인 |
| 모바일 조작·기간 안내 | PR176/v175 main | 경로·draft·scroll 복원 전체 완료는 아님 |
| 뉴스룸 | PR178/v177 가독성·주차 main | 실제 뉴스 출제 PR183과 별개 |
| 월간 Life Report | 기본 운영 기록 | Conference Room/PPT/연간 뷰어는 후보 |
| Boardroom routing | v150/함수 v50 운영 보고 | 배포 기록 PR157은 미병합 문서 |
| 캐릭터 한마디 | v163, 28개 탭·스포츠4화면 운영 보고 | 서버 Voice Registry 실제 대화 |
| AI 개발·보고팀 | PR175/v174 운영 read-back 보고 | 생활팀9명 유지, Gemini 별도 프로필·보고서 이동 |
| Gemini 보고서 메뉴·생성 | PR168/v169 main, 로컬 실제 생성·저장·원장 대조 성공 | 상시 자동 트리거/동기화 |
| 여행 맛집·명소 | v130 Production 완료 보고 | 해당 탭 남은 작업 없음 |
| 효율화·중앙 기록·PR 정리 | PR114, P0 완료 / PR61·68 종료 | 과거 중앙 폴더 미생성 요약은 대체 |
| AI 공통 허브 | PR181·182 main/파일 확인 | CLAUDE→AGENTS→허브. 실제 Claude 읽기 미검증 |

## 개발 중·검증 대기·보류

| 항목 | 현재 상태 | 다음 경계 |
|---|---|---|
| 분기 Conference Room/PPT | Preview 구현·격리 PC/모바일·PPT 검사 보고. 실제 Q&A 화면 응답 확인 보고, 가독성 수정 중 | 실제 답변 포함 PPT·최신 후보·최종 배포 검사 |
| 연간 보고 뷰어 | 예시 무대·PDF 원본 뷰어·등록/복구 모의 검사 | 실제 인증 등록/read-back/복구·배포. 전체 연간 결산 완료 아님 |
| 보고서 기반 목표 초안 | 수정 가능한 미확정 제안 Preview | 최신 v178 Registry 계약·승인·통합 검증 |
| 목표 저장/기기 동기화·삭제 | 승인 목표 보존 보고. 현재 한 건 삭제 Preview/승인 구현·검증 중, 실제 삭제 전 | 중복 클릭/실패/다른 기록 보존·배포 검증, 모바일 read-back. 개인 목표값 제외 |
| 원본 보호/백업/복구/거래/로그인/서버 권한 | 가상 검증 완료 보고, 미배포. 원본27·백업11·화면6 검사 | 소유 계정 설정·실제 Android·최종 릴리스 |
| 강화 보호 게이트 | 부정19·연결12·필수7묶음 통과 보고. 접수 화면 한도를 서버 기준에 맞춰 경계 검사 후 최신 후보 재검증 중 | 정책 승인/최종 게이트·서버 설정·운영 미완료 |
| 실제 뉴스 출제 | PR183 OPEN. 중복·출처 보강, 별도 실제 AI 검증 화면 준비 | 해당 탭의 로그인 검증 대기·실제5/20문제 정답 품질·새 후보/서버 게이트 |
| 공통 서버 Voice Registry | PR128 OPEN/보류. 후속 서버 정의 확인 보고 | 9명 실제 대화 미검증. PR 미병합=전체 미구현으로 단정 금지 |
| 원래 안정화 핫픽스 | 원래 탭은 Fact Check 후 중단 | P1/Asset 해결 범위 완료. 신규 유실 재현은 위 품질 후보 |
| 텔레그램 알림 | 발송/Windows 자동 실행 중지 보고 | 앱 반복 자동화 중지 거절 기록, 실제 중지 상태 미확인 |
| DEVLOG 상시 자동화 | 단발 생성·저장 성공/메뉴 운영 | 배포 후 자동 생성·지속 허브 갱신은 미완료 |

## 완료 근거 없는 장기 항목

Mobile State Persistence 전체, 새기기 Cloud Restore UX, Cloud-first 전환, 완전한 분기/연간 집계·목표 비교·Next Guidance, 공식 Recalibration, Portfolio 공식 월별 이력, Google Drive Vault, 전체 Export/Backfill, Organization Hub, Messenger, 정식 Monthly Committee, Toss 외 API 확대, 외부 모델 공통 실행계층.

분기 PPT·백업 Preview를 IR 출력·복구 운영 완료로 표시하지 않습니다. Data Hub 내보내기 코드 존재도 Drive 연동 완료 근거가 아닙니다.

## 다음 담당

[전체 탭 원장](2026-10-05-all-tabs-status.md)에서 담당과 후보를 확인합니다. 타 작업의 파일·branch를 임의 수정/merge/rebase하지 않습니다. Claude 연결은 대표님의 후속 요청을 기다립니다. 오래된 INDEX/배포 기록은 역사적 근거로 보존합니다.
