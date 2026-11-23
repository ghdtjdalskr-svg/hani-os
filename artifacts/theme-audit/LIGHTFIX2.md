# 밝은 마감 정리(L1~L4 × main 2.9.305 UI Polish 1 정합)

## 1. 뺀 규칙 목록 (사유 포함)
- **`.btn.finance` 주 버튼 덮어쓰기 삭제** (`#app .view .btn.finance`, `.modal .btn.finance`): `UI Polish 1 Req 4`가 `.btn.primary`·`.btn.finance`·`.btn.health`를 마감 강조색(`--structure-accent`/`--structure-on-accent`)으로 통일했으므로 회장님 승인 미리보기 기준을 유지.
- **배포센터(`#deployment`) 규칙 전부 삭제**: `/* L1 - Deployment Center */` 6개 규칙, L3의 `#app #deployment` 5개 규칙, L3 표면 목록의 `.deploy-inbox-summary` 참조 모두 제거(배포센터 보호 화면 무변경).
- **보호 화면 제외 범위 보강**: 공통 `.btn:focus-visible`, `.tabs`, `.pill:not(...)`, `.ds-jieun`/`.ds-agent-comment` 규칙에 `:not(#investmentIntake):not(#deployment)` 및 백업·Cloud 패널(`#group-backup`, `#group-cloud`, `#cloudBridgeCard`, `#loadRecoveryPanel`, `#cloudChoicePanel`) 제외 적용. (`#loginGate`는 `#app` 밖이라 미적용)
- **대시보드 `#home` 충돌 규칙 삭제** (`#app .home-dialogue-shell` 배경/테두리 덮어쓰기): `UI Polish 1 Req 1`(대시보드 2안: 담당 색 옅은 바탕·제목 색·세로 막대)이 `.home-dialogue-shell` 표면/테두리를 소유하므로 L3 덮어쓰기 제거(안쪽 말풍선 `#homeDialogueText`·`.home-dialogue-line`·`.home-dialogue-avatar`만 유지).

## 2. 남긴 L1~L4 요약
- **L1 (컨트롤·탭·강조)**: 비보호 화면의 `.tabs .tab`, 포커스 링, 빠른 이동 강조, `#study`·`#agentReview`·`#organization`·`#investmentCommittee`·`#travel`·`#intake`·`#dev`·`#movie`·`#board`·`#aura`·`#dietStats/#exerciseStats .stat:nth-child(5)`의 탭/작은 컨트롤/강조 글자를 `--control-accent`·`--control-soft`로 통일.
- **L2 (배지)**: 보호 화면 및 상태 색(`.danger`, `.cloud-*`, `.health`)을 제외한 `.pill`과 `#university .campus-semester-status`.
- **L3 (표면·글자 대비)**: `#home` 배너·말풍선 내부, `#milestones` 배너, `#asset`·`#investment`·`#travel`·`#aiWork`·`#study`·`#diary`·`#newsroom`·`#ledger` 지은 코멘트, `#game`·`#reading`·`#movie`·`#procrastination`·`.sidebar-corporate-lockup`·`.date-mode-toggle`을 밝은 마감 토큰(`--surface-panel`, `--surface-raised`, `--text-primary`, `--text-secondary`)에 연결.
- **L4 (마무리)**: `.footer`, `#monthlyReport` 셸·탭·카드, `#diet` 5번째 KPI 줄바꿈, `#geminiReports` 표 가로 스크롤 유지.

## 3. 중요 확인 필요 (PC 1440 촬영 전 Blocker)
- `hani-design-system.css`의 `UI Polish 1 Req 6` 끝부분(라인 2973 `@media(max-width:700px){` ~ 라인 2991 `color:var(--text-secondary)!important`)에 닫는 `}` 2개(`  }\n}`)가 누락된 채 `/* light finish fix 1 */`가 이어져 있음(병합 시 누락 추정).
- 지시대로 `UI Polish 1` 블록과 블록 밖 줄은 한 글자도 수정하지 않았으므로, **서윤이 커밋·PC 1440 촬영 전에 라인 2991 다음 줄에 `  }\n}`을 복구해야** `light finish fix 1` 전체가 모바일 `@media(max-width:700px)` 안에 갇히지 않고 PC 1440px에서 적용됨.

## 4. 회장님용 3줄 요약
1. 회장님이 승인하신 최신 운영 UI(`UI Polish 1`)의 주 버튼 색과 대시보드 2안(담당 색 옅은 바탕·제목 색·세로 막대)을 기준으로 삼아 L1~L4와 겹치는 규칙을 걷어냈습니다.
2. 배포센터, 자산 업데이트, 로그인, 백업·복원, Cloud 동기화 등 보호 화면을 건드리던 CSS 규칙을 모두 제거하거나 선택자에서 제외했습니다.
3. 탭·작은 버튼·카드 표면·월간보고·표 넘침 보정 등 UI Polish 1이 다루지 않은 밝은 테마 4종 마무리만 남기고 검사 파일(`scripts/hani-theme-light-fix.test.mjs`)도 함께 맞췄습니다.

## 5. 서윤이 찍을 화면 & 검증 목록
- **PC 1440px 촬영 (총 20장면)**: 밝은 마감 4종(`porcelain-cream`, `pure-white`, `sakura-pink`, `alpine-blue`) × 5개 화면(대시보드 `#home`, 투자 `#investment`, 가계부 `#ledger`, 공부 `#study`, AI 예산 `#aiBudget`).
- **무변경 확인**: 배포센터(`#deployment`), 자산 업데이트(`#investmentIntake`), 로그인(`#loginGate`), 설정 백업/Cloud(`#group-backup`, `#group-cloud`), 어두운 마감 2종(`midnight-black`, `titanium-graphite`).
- **실행 필요 검사** (본 작업은 셸 미사용 환경): 라인 2991 `}` 2개 복구 후 `node --test scripts/hani-theme-light-fix.test.mjs` 및 브라우저 촬영 진행.
