# 공통 개발 허브 준비

- 날짜: 2026-10-05 KST
- 담당: Codex
- 상태: GitHub 공유·Notion 생성 완료 / 보호 지침 대표 승인 확보 / main 미병합
- branch: `hani/shared-development-hub`
- base SHA: `90b7440bf3bb285cfbe1713ac6c7a870e502f5bc`
- 위치: `.worktrees/shared-development-hub`
- 승인 근거: Notion + GitHub 공유 허브 제안에 성민 대표님이 “응 좋아”로 동의

## 작업 범위

기존 `docs/development-history`를 확장했습니다. 시작 안내, 최신 현황, 결정 기록, 인수인계 양식을 추가하고 AGENTS의 공통 진입점을 연결했습니다. 기존 작업 공간과 사용자용 외부 중앙 사본은 수정하지 않았습니다.

기존 작업 공간 HEAD는 `7c08540`, 원격 최신 main은 `90b7440`이었습니다. merge/rebase 대신 최신 main에서 별도 문서 브랜치를 생성했습니다. 기존 codemap은 탐색 참고로만 확인했습니다.

## 발견한 상태 차이

- 초기 대화 표에서는 Goal Registry 미구현이었지만 PR180에서 입력 UI와 이력 코드가 main에 병합됐습니다.
- 이전 개발 기록에는 Asset Input 계약 운영 완료와 DEVLOG 자동화 후보가 있습니다. 기존 요약을 그대로 사실로 옮기지 않았습니다.
- 이번 작업에서는 운영 화면·Cloud·목표 저장을 실행하지 않았습니다. CURRENT에 정적 확인과 과거 기록을 구분했습니다.

## 검증 / 영향

- 문서 변경 검사: `0be3eb266acfabe7a2443f9765449c387b2e6cd4` 기준 pre-QA PASS, UI review N/A. 로컬 Node v24.20.0. GitHub CI는 별도 확인 필요.
- CI 변경 범위 분류: 같은 SHA 기준 `docs_only=true`, `tooling=false`. 분류 도구 self-test 13/13 PASS.
- 시작 안내의 로컬 문서 링크 4개 확인, `git diff --check` 통과. 연결 문서의 정적 검사이며 AI의 실제 읽기 성공 증거가 아님.
- 문서 전용: runtime 표시 버전·DOM·UI·Production QA N/A.
- 운영 코드, 보호 저장소, 내부 데이터 버전, Cloud write/schema 변경 없음.
- [PR182](https://github.com/ghdtjdalskr-svg/hani-os/pull/182) 초안 생성·공유 완료. 992d1a0의 GitHub One-Pass 문서 CI 성공, Gate Self-Protection은 AGENTS 변경 승인 라벨이 없어 차단. 보호 검사 변경·우회 없음.
- [Notion 현황판](https://app.notion.com/p/3f0c5275707481ba8d9bfa582d2c3fcf) 생성 및 fetch로 본문 재확인 완료. Claude/Gemini 실제 읽기와 자동 동기화는 미확인.
- main 병합·배포 없음. 문서 현황 갱신 이후 candidate 검사는 새 SHA로 확인할 것.

## 다음 행동

1. AGENTS.md 허브 읽기·인수인계 규칙 및 `hani-gate-change-approved` 라벨은 대표님이 승인했습니다(D-20261005-05). 승인 라벨 적용 이후 최신 SHA 검사 결과를 확인합니다. main 병합은 별도 승인 경계입니다.
2. PR 최신 SHA와 검증 결과를 Notion 현황판에 반영합니다.
3. Claude가 Claude Code인지 일반 채팅인지 확인하고 공통 기록을 읽고 인수인계를 작성하는 실제 경로를 검증합니다. Gemini는 필요 시 연결합니다.

담당 AI가 서로 다른 작업 공간에 있으면 최신 문서 commit을 먼저 확인해야 합니다. 현재 문서 파일 자체는 자동 동기화나 작업 잠금 시스템이 아닙니다.
