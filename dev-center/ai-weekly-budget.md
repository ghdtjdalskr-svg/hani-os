# AI 주간 예산 운영 안내

## 현재 지원
- 4개 계정 칸, 제공된 사용률·잔여율·회복 시각(KST), 마지막 조회, 출처, 오래됨/회복 시각 경과 표시.
- Codex CLI 공식 app-server 읽기: 현재 로그인된 계정만 조회. 같은 PC에서 계정 전환 후 도우미 재조회 시 빈 칸에 별도 등록. 이메일은 저장하지 않고 해시만 로컬 요약에 저장한다. 이미 두 칸이 등록되면 제3계정은 덮어쓰지 않는다.
- Claude 공식 statusline `rate_limits` 입력 어댑터. 설정 자동 변경은 하지 않았다. 실제 Claude Code 설치/후크 연결은 미검증.
- Gemini CLI/공식 화면 값은 요약 가져오기·직접 기록 지원. CLI 세션 토큰은 구독 잔여 토큰이 아니다. 자동 수집은 아직 미구현.

## 로컬 도우미
Node 설치 상태에서 프로젝트 폴더 기준 `node scripts/hani-ai-budget-bridge.mjs serve`.
Codex CLI 진입점을 찾지 못하면 `HANI_CODEX_ENTRY`에 설치된 `@openai/codex/bin/codex.js` 절대 경로를 지정한다. 이 PC는 `C:/Users/홍성민/AppData/Local/Programs/nodejs/node_modules/@openai/codex/bin/codex.js`로 실제 조회 확인.
현재 계정을 한 번 수집: `node scripts/hani-ai-budget-bridge.mjs collect`.
Claude statusline JSON stdin 수집: `node scripts/hani-ai-budget-bridge.mjs claude-statusline`.
검증된 요약 입력: `node scripts/hani-ai-budget-bridge.mjs import <summary.json>`.

127.0.0.1:8794만 listen하며 허용 Origin/Host/GET/커스텀 헤더를 검사한다. 수집 간격은 최소 5분이고 실패 시 기존 값과 조회 시각을 보존한다. 모델 호출/로그인/로그아웃/유료 추가 사용/무료 한도 리셋은 실행하지 않는다.
개인 요약은 Git 제외 `.ai-budget-private/summary.json`, 화면 요약은 독립 `hani_ai_budget_summary_v1`. 생활 원본/Cloud schema에 기록하지 않는다. 원본 JSON의 이메일/토큰/쿠키는 allowlist에서 제거한다.

## 미연결 범위
현재 CLI 로그인과 desktop 로그인은 다를 수 있다. 실제 CLI 조회한 계정 기준으로 표시한다. 두 번째 계정의 실제 전환·조회, Claude/Gemini 실측은 미검증.
휴대폰은 로컬 PC 연결에 접근할 수 없다. 요약 내보내기/가져오기 및 직접 기록만 지원. 비공개 기기 간 자동 공유 서버는 미구현이고 schema/인증 설계가 필요하다.
운영 HTTPS→로컬 도우미는 브라우저 로컬 네트워크 권한/혼합 콘텐츠 정책에 따라 차단될 수 있다. Production 검증 미수행.

공식 근거: https://learn.chatgpt.com/docs/app-server · https://code.claude.com/docs/en/statusline · https://geminicli.com/docs/resources/quota-and-pricing/
