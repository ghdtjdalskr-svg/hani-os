# PROJECT HANI / HANI OS — Gemini CLI 안내

이 저장소의 일반 안전규칙 Canonical Source는 `AGENTS.md`이다. Gemini CLI도 아래 import로 동일한 규칙을 그대로 따른다. 이 문서는 `AGENTS.md`를 대체하거나 완화하지 않으며, 두 문서가 충돌하면 `AGENTS.md`가 우선한다.

@./AGENTS.md

## Gemini CLI 추가 운영 메모

- `AGENTS.md`의 **개발 Agent** 규칙은 이 저장소에서 작업하는 Gemini CLI에도 동일하게 적용된다.
- 작업 시작 시 `docs/development-history/START-HERE.md`와 `CURRENT.md`를 읽고, 다른 AI가 담당 중인 branch·worktree·파일은 수정하지 않는다.
- Gemini CLI 작업은 `origin/main` 기준의 별도 `hani/...` branch와 별도 worktree에서 수행한다. main 병합은 성민 대표님 승인 후에만 한다.
- 작업 종료·중단 시 `docs/development-history/HANDOFF-TEMPLATE.md` 형식으로 인수인계를 남긴다.
- CI의 docs-only 허용 경로는 `scripts/hani-ci-scope.mjs`가 정한다. `GEMINI.md`는 허용 경로에 없으므로 GEMINI.md 변경 PR은 기존 Build + One-Pass 검사를 그대로 거친다.
