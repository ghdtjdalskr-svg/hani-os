# HANI 공통 개발 허브

성민 대표님과 Codex·Claude·필요 시 Gemini가 방향과 진행 상황을 공유하는 시작점입니다.

## 대표님이 확인할 내용

- [최신 현황과 우선순위](CURRENT.md)
- [결정 기록](DECISIONS.md)
- [공통 허브 준비 인수인계](handoffs/2026-10-05-shared-hub.md)
- [기존 개발·배포 히스토리](INDEX.md)

허브와 Claude 지침은 PR181·182로 main에 반영됐습니다(c544592). [전체 HANI 탭 원장](2026-10-05-all-tabs-status.md)과 CURRENT는 2026-10-05 취합 후보입니다. [Notion 현황판](https://app.notion.com/p/3f0c5275707481ba8d9bfa582d2c3fcf)에 같은 상태와 근거를 표시합니다. 대표님은 전체 현황 정리 후 Claude 연결을 요청할 예정입니다. Claude의 실제 허브 읽기·자동 동기화는 아직 미검증입니다.

## AI가 시작할 때

1. 루트 `AGENTS.md`의 데이터·Git·검사·승인 규칙을 따릅니다.
2. `CURRENT.md`의 기준 SHA·근거 날짜와 실제 작업 기준선을 비교합니다. 원격 최신성이 불명확하면 그 사실을 기록합니다.
3. 담당 작업과 관련된 결정 및 `handoffs/`의 인수인계만 읽습니다. 과거 전체 기록을 반복해서 읽지 않습니다.
4. 작업별 인수인계 파일에 담당 도구·branch·base SHA·수정 범위·진행 상태를 남깁니다. 인수인계 파일은 잠금 장치가 아니므로 충돌 시 담당 조정이 필요합니다.
5. 종료하거나 중단할 때 실제 검증과 다음 행동을 갱신합니다. 대표님께 이전 대화를 다시 설명해 달라고 하기 전에 기록을 확인합니다.

## 기록을 어디에 두나

| 기록 | 위치 | 갱신 방식 |
|---|---|---|
| 최신 요약·다음 작업 | `CURRENT.md` | 작업별 근거를 확인한 뒤 갱신 |
| 승인·방향·결정 | `DECISIONS.md` | 날짜와 원문 근거를 붙여 누적 |
| 상세 작업·검증·인수인계 | `handoffs/<날짜>-<작업>.md` | 작업 담당이 작성 |
| 역사적 배포 기록 | 기존 `INDEX.md`와 날짜별 문서 | 과거 근거 보존, 최신 상태와 구분 |
| 대표님용 화면 | Notion 연결 후 요약 페이지 | 저장소 원문·SHA·동기화 시각 표시 |

코드·상태의 원본은 GitHub에 보관합니다. Notion에는 요약과 링크를 두어 상세 내용의 이중 관리를 줄입니다. Slack은 추후 대화·알림용, Google Drive는 보고서·첨부·백업용입니다. HANI 사용자 데이터의 Drive Vault는 이 개발 허브와 별도 기능입니다.

## 도구 연결 상태

| 도구 | 준비된 것 | 아직 확인할 것 |
|---|---|---|
| Codex | `AGENTS.md`에서 이 허브로 연결 | 다음 세션에서 실제 읽기 확인 |
| Claude Code | 설치·실행 확인, PR181의 CLAUDE.md가 AGENTS.md import | 대표님 연결 요청 후 최신 기록 읽기/인수인계 작성 |
| Claude 일반 채팅 / ChatGPT 일반 채팅 | Notion 요약 공유 방안 | 각 앱의 연결·로그인·페이지 접근 권한 |
| Gemini | CLI 0.62.0, 단발 개발노트 생성·저장 성공 기록 | 최신 공통 허브 읽기 및 지속 갱신 검증 |
| Notion | 계정 접근·현황판 생성·Codex 읽기 확인 완료 | Claude/Gemini의 같은 페이지 접근, 작업 종료 갱신 검증 |

main의 `CLAUDE.md`는 `@AGENTS.md`를 import합니다. AGENTS는 공통 허브 읽기와 인수인계를 요구합니다. 이 파일 연결이 실제 Claude 세션의 읽기 성공 증거는 아닙니다. Gemini의 단발 노트 생성 성공도 허브 자동 동기화와 구분합니다.

서로 다른 기기·worktree는 GitHub의 공유 문서 commit을 확인해야 최신 상태를 봅니다. 오래된 작업 공간을 임의 merge/rebase하지 않고 새 작업은 최신 기준선에서 시작합니다.

## Notion 첫 화면 구성안

- 현재 최우선: 분야별 목표 설정 완성 → 분기·연간 보고서 연계
- 진행 중 / 검증 대기 / 승인 대기 / 운영 확인 완료
- 대표님 결정이 필요한 항목
- 최근 변경과 테스트 요약
- 공통 지침·최신 현황·인수인계·배포 원문 링크

자동 갱신은 연결 후 별도 검증합니다. 처음에는 작업 종료 시 담당 AI가 갱신하는 방식으로 시작합니다.

## 공식 연결 참고

- [Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Claude Code 공통 지침](https://code.claude.com/docs/en/memory)
- [Notion AI 연결](https://www.notion.com/help/notion-mcp)
