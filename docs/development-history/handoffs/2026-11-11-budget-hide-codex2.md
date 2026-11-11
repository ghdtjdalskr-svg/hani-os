# 2026-11-11 AI 예산 화면 "Codex 보조" 칸 숨김 (QA-15)

- 담당: 서윤(Claude Code) · branch `hani/budget-hide-codex2` · base main `89db739`
- 요청: 성민 회장님 QA-15 "11/11 이후 예산 화면의 Codex 보조 칸 제거", 11/11 "진행해줘".
- 상태: v2.9.289로 운영 반영 완료(2026-11-12 KST). PR #487 머지 91d4943, Pages 성공, 파일 4개 해시 일치, 표시 v2.9.289, 실제 사이트 예산 카드 4칸 확인.

## 변경
- `hani-ai-budget.js`: 보이는 칸에서 `codex-2` 제외(5칸 → 4칸), 직접 기록 계정 선택에서도 제외.
- `hani-ai-budget-core.js`는 그대로 둔다. `codex-2` 칸 정의를 남겨 이미 저장된 `hani_ai_budget_summary_v1` 요약이 읽기 실패로 바뀌지 않게 했다. 저장 키·형식·삭제 경로 변경 없음. `hani_os_life_v23` 무관.
- 시험: `scripts/hani-ai-budget.test.mjs`, `scripts/hani-ai-budget-browser.test.mjs`를 4칸 기준으로 수정.

## 검증
- `node --check hani-ai-budget.js` PASS
- `node scripts/hani-ai-budget.test.mjs` PASS
- `node scripts/hani-ai-budget-browser.test.mjs <playwright> <chrome.exe>` PASS (390/1440, 4칸, codex-2 카드·선택지 0, 생활 키 불변, 넘침·JS 오류 없음)

## 미검증·위험
- 운영 화면 read-back은 배포 뒤 확인.
- 수집 도구(`scripts/hani-ai-budget-bridge.mjs`)는 다른 Codex 계정이 잡히면 여전히 `codex-2`로 저장할 수 있다. 화면에는 보이지 않는다.

## 배포
- 런타임 파일: `hani-ai-budget.js` 1개. 함께 배포할 서버 기능 없음.
