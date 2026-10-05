# PROJECT HANI / HANI OS — Claude Code 안내

이 저장소의 일반 안전규칙 Canonical Source는 `AGENTS.md`이다. Claude Code도 아래 import로 동일한 규칙을 그대로 따른다. 이 문서는 `AGENTS.md`를 대체하거나 완화하지 않으며, 두 문서가 충돌하면 `AGENTS.md`가 우선한다.

@AGENTS.md

## Claude Code 추가 운영 메모

- `AGENTS.md`의 **개발 Agent(Codex)** 규칙은 이 저장소에서 작업하는 Claude Code에도 동일하게 적용된다.
- Codex가 만든 worktree(`.worktrees/`, `.audit/`, `~/.codex/worktrees/` 등)와 그 branch는 성민 대표님의 요청 없이 수정, merge, rebase, 삭제하지 않는다. Claude Code 작업은 `origin/main` 기준의 별도 `hani/...` branch와 별도 worktree에서 수행한다.
- 메인 checkout이 다른 작업 branch에 있으면 그 상태를 바꾸지 않는다(branch 전환, stash, 미추적 파일 정리 금지).
- 이 PC의 PowerShell PATH에는 `git`이 없을 수 있다. 실행 파일 위치를 한 번 확인한 뒤 세션 안에서 재사용한다(§9).
- CI의 docs-only 허용 경로는 `scripts/hani-ci-scope.mjs`가 정한다. `CLAUDE.md`는 허용 경로에 없으므로 CLAUDE.md 변경 PR은 기존 Build + One-Pass 검사를 그대로 거친다.
