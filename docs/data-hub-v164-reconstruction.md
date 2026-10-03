# Data Hub v2.9.164 reconstruction

2026-10-04 KST · Candidate preparation, not Production completion.

- Base: `ad3a04103f32e4e5b1a75f8a0b7f01a275634f88` / deployed v2.9.163.
- Prior Data Hub development candidate: `420200811e8cf94b557298021a81d168a2223d9b`, preserved in its original worktree.
- Latest-main worktree: `data-hub-release-v164`, branch `hani/data-hub-release-v164`.
- Only Data Hub A/B/C commits were transplanted. Version/script-reference conflicts resolved narrowly, preserving latest AURA, portfolio runtime/style, and canonical tab quote source. No old whole-index replacement.
- Data Hub remains embedded in existing main entrypoint to preserve the existing 86-file gate. Release tooling and gate contract unchanged.
- Portfolio contrast follow-up is explicitly excluded; it is a separate candidate after Data Hub Production completion.

## New baseline verification

- Pure A/controller C synthetic tests: 34 PASS.
- Full app PC/mobile five scenarios each: 10 PASS against the integrated v163 base.
- Original source/Cloud write functions: ten byte-identical to v163 base; protected key/internal version unchanged.
- Deterministic generated region parity and syntax: PASS.
- Independent frozen candidate HINA, package/CI/server gate, actual candidate account ownership and Production read-back: pending. Old v161 PASS does not substitute for new frozen/package/environment verification.

## Data preservation and rollback

Source data remains authoritative; only verified derived IndexedDB generations may be published. No restore, deletion, schema, source write or Cloud mutation semantics added. Owner mismatch blocks cache activation. Returning to v163 runtime requires no source migration; derived cache can be ignored/regenerated.

After successful deployment, save the actual PR/candidate/main/Pages/JS/function evidence in `docs/release-records/2026-10-04-v2.9.164-data-hub.md`, without credentials or original user records. Do not mark this preparation as deployed.
