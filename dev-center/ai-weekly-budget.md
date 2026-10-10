# AI 주간 예산 운영 안내

## 현재 지원
- 6개 계정 칸: Codex 주력·보조, Claude, Gemini Google AI Pro, Antigravity Claude/GPT, 보조 Gemini CLI 무료. 제공된 사용률·잔여율·회복 시각(KST), 마지막 조회, 출처, 오래됨/회복 시각 경과 표시.
- Codex CLI 공식 app-server 읽기: 현재 로그인된 계정만 조회. 같은 PC에서 계정 전환 후 도우미 재조회 시 빈 칸에 별도 등록. 이메일은 저장하지 않고 해시만 로컬 요약에 저장한다. 이미 두 칸이 등록되면 제3계정은 덮어쓰지 않는다.
- Claude 공식 statusline `rate_limits` 입력 어댑터. 설정 자동 변경은 하지 않았다. 실제 Claude Code 설치/후크 연결은 미검증.
- Claude 로컬 transcript 토큰·응답 수와 Gemini CLI 로컬 프롬프트 수 집계 지원. Gemini CLI 무료 20회 기준 추정은 Google AI Pro 한도와 별도로 보조 카드에 표시.
- Antigravity: `%LOCALAPPDATA%\agy\bin\agy.exe` 우선, PATH의 `agy.exe` fallback. `agy -p /usage` TSV에서 Gemini Models → `gemini-pro`, Claude and GPT models → `antigravity-cg`. 주간/5시간 remaining을 `100 - remaining` 사용률로 정규화하며 초기화 시각은 KST 표시. 이 카드는 Antigravity에서 제공한 한도이며 Gemini 웹앱·Claude 직접 구독·Codex 구독 한도와 별개.
- Antigravity 실행은 최대 60초, stdout 최대 64KiB. 실패도 포함해 시간당 최대 1회이며 `.ai-budget-private/antigravity-cache.json`에 시도 시각·정규화 요약·오류 코드만 보관. 캐시 재사용 시 조회 시각은 바꾸지 않으며 60분 이후 오래됨 표시. 불완전한 서비스 행은 기존 완전한 관측을 교체하지 않음. CLI 누락/로그인 미완료/timeout은 카드 안내와 기존 요약 보존으로 처리. 로그인·토큰/원문 수집·설정 자동 변경 없음.

## 로컬 도우미
Node 설치 상태에서 프로젝트 폴더 기준 `node scripts/hani-ai-budget-bridge.mjs serve`.
Codex CLI 진입점을 찾지 못하면 `HANI_CODEX_ENTRY`에 설치된 `@openai/codex/bin/codex.js` 절대 경로를 지정한다. 이 PC는 `C:/Users/홍성민/AppData/Local/Programs/nodejs/node_modules/@openai/codex/bin/codex.js`로 실제 조회 확인.
현재 계정을 한 번 수집: `node scripts/hani-ai-budget-bridge.mjs collect`.
Claude statusline JSON stdin 수집: `node scripts/hani-ai-budget-bridge.mjs claude-statusline`.
검증된 요약 입력: `node scripts/hani-ai-budget-bridge.mjs import <summary.json>`.

127.0.0.1:8794만 listen하며 허용 Origin/Host/GET/커스텀 헤더를 검사한다. 도우미 갱신 간격은 최소 5분, Antigravity CLI는 독립된 시간당 제한을 적용한다. 실패 시 기존 값과 조회 시각을 보존한다. 브라우저 조회 대기는 CLI 60초와 기존 수집 경로를 감안해 80초다. 모델 호출/로그인/로그아웃/유료 추가 사용/무료 한도 리셋은 실행하지 않는다.
개인 요약은 Git 제외 `.ai-budget-private/summary.json`, 화면 요약은 독립 `hani_ai_budget_summary_v1`. 생활 원본/Cloud schema에 기록하지 않는다. 원본 JSON의 이메일/토큰/쿠키는 allowlist에서 제거한다.

## 미연결 범위
현재 CLI 로그인과 desktop 로그인은 다를 수 있다. 실제 CLI 조회한 계정 기준으로 표시한다. 두 번째 계정의 실제 전환·조회 및 Antigravity live 한도 read-back은 미검증. 2026-10-11 이 환경에서 CLI 실행 파일 존재를 확인했으나 collector는 usage_unavailable을 반환했고 Edge launch는 EPERM으로 차단됐다. fixture와 실제 renderer를 통한 검증은 화면 QA와 구분한다.
휴대폰은 로컬 PC 연결에 접근할 수 없다. 요약 내보내기/가져오기 및 직접 기록만 지원. 비공개 기기 간 자동 공유 서버는 미구현이고 schema/인증 설계가 필요하다.
운영 HTTPS→로컬 도우미는 브라우저 로컬 네트워크 권한/혼합 콘텐츠 정책에 따라 차단될 수 있다. Production 검증 미수행.

공식 근거: https://learn.chatgpt.com/docs/app-server · https://code.claude.com/docs/en/statusline · https://geminicli.com/docs/resources/quota-and-pricing/
