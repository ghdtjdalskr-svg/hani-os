# 도우미 2차 · PC 배치 수정

성민 대표님, PC 배치를 수정했습니다. **실제 브라우저는 `spawn EPERM`으로 실행되지 않아 수정 후 실화면은 미검증입니다.**

- PC 레일 펼침: 본문 열 오른쪽 끝, 레일 왼쪽 16px에 얼굴 배치. 레일 접힘·숨김·없음: viewport 오른쪽 16px. 기본 하단 간격 16px.
- 일반 카드·본문 버튼·포커스 없는 입력칸 위에는 떠 있도록 허용합니다. 레일 조작부, 유나 입력바, 사무실 이벤트 버튼/패널, toast, 오프라인 표시, 포커스 입력칸은 피합니다.
- 패널은 위·왼쪽으로 열고 본문 너비·위쪽 가용 높이에 맞춥니다. 기존 클릭·resize·열기 경로로 재측정하며 리스너는 기존 9개 그대로입니다. 폰 배치와 CSS는 보존했습니다.

| 검사 | 결과 |
|---|---|
| `node scripts/hani-helper-bot.test.mjs` | **16 통과 / 0 실패 / 브라우저 1 생략** |
| PC 1280×900 / 1440×900 / 1920×1080 | DOM·좌표 대역에서 레일 펼침/접힘/숨김, 전체 메뉴, 카드 겹침, 고정 조작부·입력 회피, 패널 경계 통과 |
| 폰 390×844 / resize / 열기 재측정 | 기존 회피·자리 없을 때 숨김, PC↔폰 너비 복원 통과 |
| `node scripts/hani-nav-groups.test.mjs` | 통과. 기본 실행은 Git 하위 프로세스 EPERM; 아래 기준 원문 제공 후 통과 |
| `node scripts/hani-design-system-qa.mjs` | 통과 |
| JS syntax 2파일 / `git diff --check` | 통과 |
| 1차 변경 보존 / 런타임 목록 | `place()` 밖 UI·CSS 바이트 보존, 나머지 런타임 66파일 동일, 156/160·누락 0 |
| Playwright 실제 앱 실행 | 16 통과 / 브라우저 실행 1 실패(`spawn EPERM`); 새 화면 캡처 없음 |

내비게이션 재실행은 `$env:HANI_MAIN_BASELINE = Join-Path ([System.IO.Path]::GetTempPath()) 'hani-helper-bot-regression-base'` 설정 후 수행했습니다. 기준 원문 68파일의 Git blob이 `origin/main` 트리와 일치합니다.

2차 변경 파일:

- `hani-ui-v02992.js`: 기존 helper `place()`만 수정.
- `scripts/hani-helper-bot.test.mjs`: PC 3해상도·레일 상태·회피·재측정 회귀와 실제 브라우저 검사 갱신.
- `docs/development-history/handoffs/2026-11-06-helper-bot-round2.md`, 이 보고서.
- 근거: `round2-unit-tests.txt`, `round2-nav-tests.txt`, `round2-design-qa.txt`, `round2-browser-attempt.txt`, `round2-verification.json`.

`hani-style-08.css`의 1차 미커밋 변경과 기존 보고서·서윤 스크린샷은 그대로 유지했습니다. GitHub connector로 원격 main `1bb98046973098959b7feaf906578710cdf3fe73` 확인, 로컬 HEAD·캐시와 일치합니다(CLI 원격 조회는 proxy 연결 실패).

branch `hani/helper-bot`, 버전 2.9.269 유지. 저장소·Cloud·schema·data 변경, commit/push/merge/배포 없음. Candidate·Production 검증은 수행하지 않았습니다. Notion은 1차 작업의 수정 금지 지시를 유지해 미반영했습니다.

다음: 브라우저 실행 가능한 환경에서 PC 3해상도 레일 펼침·접힘과 폰 실화면 확인. 전용 테스트에 Playwright module·browser 경로를 주면 `round2-shots/`에 새 캡처를 저장합니다. 서버 설정 변경은 없습니다.
