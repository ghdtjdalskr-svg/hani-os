# HANI OS Canonical Character Voice Registry

The nine-character source of truth is `hani-character-voice.mjs`; `supabase/functions/_shared/character-voice.mjs` re-exports it for existing server imports. It defines identity, personality, domain authority, decision style, relationships, address rules, five voice modes, signature phrases, seriousness rules, and prohibited wording. Character voice never overrides facts, calculations, permissions, approval gates, or safety instructions.

| Surface | Current integration | Mode |
| --- | --- | --- |
| Boardroom agent review and HANI synthesis | `hani-agent-orchestrator` imports the shared registry | `BOARDROOM` |
| Interactive investment newsroom | `hani-agent-orchestrator` imports the shared registry | `NEWSROOM` |
| Scheduled investment newsroom | `hani-newsroom-publisher` reuses its existing weighted tone plan, with character content from the shared registry | `NEWSROOM` |
| Scheduled company/industry follow-up | `hani-company-followup` imports the shared registry | `NEWSROOM` |
| Monthly report | Deterministic, read-only templates in `hani-main.js`; wording follows the same contract, but does not dynamically import this server-side registry | `MONTHLY_REPORT` |
| Home index-card comments and Living Office | Prewritten dialogue, not AI generation; unchanged in this change | `LIVING_OFFICE` concept only |
| Tab banner quotations | `hani-tab-character-lines.mjs` uses canonical character identities and curated, mode-specific lines; 29 menus + 4 sports views | Mode selected per tab |
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

## 탭 한마디 추가 구현

검증: 문구/Registry 테스트와 데스크톱·모바일 실제 렌더링 검사를 통과했습니다. 실제 화면 28곳과 스포츠 세부 화면 4곳에서 재렌더링 유지·재방문 순환·담당자 이미지 매칭을 확인했고, 격리된 테스트 브라우저의 보호 데이터 값이 전후 동일했습니다. `work`는 기존 설정만 있고 화면이 없어 UI N/A입니다. 운영 API 호출은 차단했습니다. 최종 Release package/preflight/HINA 및 Deno 서버 번들 검증은 아직 수행하지 않았습니다. 배포 패키지는 새 `.mjs` 파일 2개와 서버 재배포 시 루트 Registry 의존성까지 반드시 포함해야 합니다.

프런트엔드 후보 표시 버전은 v2.9.161입니다. 탭 상단 한마디는 공통 Registry의 이름·역할과 사전 작성된 문구를 사용합니다. 각 화면에 2개씩 준비해 재방문 시 순환하고 같은 화면의 재렌더링은 문구를 유지합니다. 인포데스크의 별도 덮어쓰기를 제거했고 독서=하루, 대학=히나, 운동=수연으로 맞췄습니다. 기존 장면 이미지와 데이터는 변경하지 않습니다. 실제 기록을 분석한 담당자 총평이나 자동 AI 대화로 해석하면 안 됩니다. 기존 홈 지수 코멘트·오피스 대화·월간보고 본문은 이번 탭 상단 수정 대상이 아닙니다.
