# HANI · Owner Verification Diagnostic Candidate

## Scope / baseline

- Base: d6cfd623ad686374a73ccdaf08b26a588b299c90, main v2.9.158; candidate v2.9.159, branch hani/data-hub-owner-verification.
- Latest-main delta inspected: character/style changes plus release intake/closure fixes; canonical Cloud read/auth paths remained unchanged. This separate worktree starts from latest main; older Batch C was not merged/rebased.
- Cloud advanced panel adds one manual read-only action and a persistent result slot. No Dashboard/core/store/cache integration.
- Existing canonical Cloud control binding owns the button; existing auth callback invalidates memory-only attempts. No new auth subscription, renderer or observer.

## Verification and preservation

- Reuses current cloudClient, verifies server user with getUser, reads user_id/state/revision filtered to that user under existing RLS, compares operational state using existing cloudSyncFingerprintState.
- Checks source reference/content, context epoch/identity and client across asynchronous reads. Source/client/session changes fail closed. Auth callbacks only invalidate; no awaited auth calls inside callback.
- Result explicitly describes verification-time evidence. Diagnostic binding is discarded immediately, and cannot activate cache or authorize later runtime use. Subsequent Batch C integration must independently reverify its current source/session.
- No verifier save/commit/export/sync/restore, protected Local writes, schema changes, Cloud mutation or durable diagnostic state. Existing app auto-sync is not disabled or changed and remains separate from this button; total app behavior must not be described as wholly read-only.
- No credentials, raw states or user IDs in the diagnostic result/logs. Failures use safe messages rather than raw network errors.

## Targeted checks

- Actual diagnostic-function synthetic fixtures: 7 PASS (match/mismatch/auth/read error/logout/source change/client change); original source unchanged, result contains no private fixture ID/data, no binding retained.
- Desktop 1440/mobile 390 UI fixture PASS: original button/result markup, disabled before login, aria-live, no overflow, no storage. This is NOT a full-app UI review or representative preview.
- Monthly Report aggregation regression PASS; hani-main.js syntax PASS.
- Actual complete-runtime synthetic browser test PASS after packaging correction at 1440/390 with Porcelain Cream/Midnight Black covers canonical button binding, owned source equality, protected storage key unchanged, no Data Hub DB, no retained binding and new JS errors=0. External services are blocked; this is not a real user session/Production read-back. Auth failure/change cases remain function-level fixtures rather than complete-browser auth-provider tests. The storage assertion reads the app's existing STORAGE_KEY rather than defining a second hardcoded key; package gate separately checks the protected constant against baseline.
- Protection: existing storage/Cloud write bodies and internal version intentionally unchanged. Final package/preflight evidence must be produced against the frozen candidate, not inferred from these tests.

## Remaining gates / limitations

- Real representative same-origin Local equality remains unverified. Real auth-provider logout/token-change transitions require final auth review; current session-change coverage is synthetic.
- Frozen package/One-Pass and independent final HINA are release requirements. Script-generated HINA-equivalent evidence is not independent review. Do not call this Production-ready without remaining evidence and representative preview.
- First frozen candidate f3175aa was BLOCKED: 84 files exceeded max_files=82, and the classic-JS parser rejected ESM exports. Corrective candidate embeds the prepared pure gate/bridge in the existing hani-main.js owner section; no extra runtime file, import or tool/limit changes. Re-freeze and repeat affected checks; do not reuse the failed candidate's gate evidence.
- No push/PR/main merge/Production deploy authorized or performed in this preparation. Representative Production authorization is required to run this new action on their operating origin.
- Rollback: return to previous approved runtime/remove diagnostic action/module references. No source/cache cleanup because this diagnostic creates neither.

## Representative workflow after approval

After an independently checked verification-only release is explicitly approved and reflected on the existing operating site, the representative opens Cloud advanced settings and presses '원본 소유권 확인 · 읽기 전용'. They must not paste code, export a new backup, restore, or force-sync to make the check pass. A mismatch is a stop condition, not permission to overwrite data.

## Status

IMPLEMENTED / TARGETED TESTS PASS; FINAL CANDIDATE GATES AND LIVE OWNER VERIFICATION PENDING. Batch C Dashboard migration remains blocked. Runtime version was incremented only in this isolated candidate.
