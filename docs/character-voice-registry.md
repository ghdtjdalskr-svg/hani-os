# HANI OS Canonical Character Voice Registry

The nine-character source of truth is `supabase/functions/_shared/character-voice.mjs`. It defines identity, personality, domain authority, decision style, relationships, address rules, five voice modes, signature phrases, seriousness rules, and prohibited wording. Character voice never overrides facts, calculations, permissions, approval gates, or safety instructions.

| Surface | Current integration | Mode |
| --- | --- | --- |
| Boardroom agent review and HANI synthesis | `hani-agent-orchestrator` imports the shared registry | `BOARDROOM` |
| Interactive investment newsroom | `hani-agent-orchestrator` imports the shared registry | `NEWSROOM` |
| Scheduled investment newsroom | `hani-newsroom-publisher` reuses its existing weighted tone plan, with character content from the shared registry | `NEWSROOM` |
| Scheduled company/industry follow-up | `hani-company-followup` imports the shared registry | `NEWSROOM` |
| Monthly report | Deterministic, read-only templates in `hani-main.js`; wording follows the same contract, but does not dynamically import this server-side registry | `MONTHLY_REPORT` |
| Home/page quotations and Living Office | Prewritten dialogue, not AI generation; unchanged in this change | `LIVING_OFFICE` concept only |
| Study quiz questions and safety/system notices | Not character dialogue; unchanged | N/A |

`DIRECT_CHAT` is defined for future conversational endpoints but no general-purpose direct-chat endpoint is present in this checkout. Do not claim it is runtime-integrated until such a route is wired and tested. A new AI conversation surface should import the shared registry and select its mode at the prompt boundary, rather than duplicating persona prose.

The orchestrator source was refreshed from live v50 on 2026-10-03 before applying the voice changes; its newer conversation and cross-review paths are preserved. Newsroom publisher v4 and company follow-up v1 were copied from live sources on 2026-10-01. The registry is recursively frozen, and unknown character keys return no persona. Meeting prompts select the shared BOARDROOM mode while preserving the existing evidence-only conversation rules; HIGH/CRITICAL risk disables humor.

This is source-control preparation, **not a deployment**. Before any release, independently confirm source parity and function bundle imports, run the existing safety/rollback checks, and obtain the representative's release approval. These files must never contain API keys or service-role values.

## 2026-10-03 검토 결과

- 기준선: main `85c8110` / 표시 버전 v2.9.160. 화면 코드와 표시 버전은 수정하지 않았습니다.
- 로컬 테스트: 9명 × 5개 모드, 별칭·알 수 없는 키, 중첩 읽기 전용, HIGH/CRITICAL 유머 제한, 회의의 실제 발언 근거 규칙을 확인했습니다.
- Edge Function 3개 문법 검사와 로컬 import 파일 존재 검사를 통과했습니다. Deno 번들 검증과 운영 AI 응답 검증은 미실시입니다.
- 운영 orchestrator v50과 비교해 말투 변경을 되돌렸을 때 원본과 정확히 일치했습니다. Publisher v4·follow-up v1의 차이도 말투 import와 프롬프트에 한정됩니다. 데이터 처리 호출과 환경변수 참조는 변경하지 않았습니다.
- LocalStorage·Cloud schema·권한·승인 로직 변경 및 서버 배포는 없습니다. 월간보고·일상 오피스·직접 대화의 동적 Registry 연결까지 완료됐다고 해석하면 안 됩니다.
