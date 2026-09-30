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

The three Edge Function files in this branch were copied from the live deployed sources (orchestrator v48, newsroom publisher v4, company follow-up v1) on 2026-10-01 before their prompt edits. This is source-control preparation, **not a deployment**. Before any release, independently confirm source parity and function bundle imports, run the existing safety/rollback checks, and obtain the representative's release approval. These files must never contain API keys or service-role values.
