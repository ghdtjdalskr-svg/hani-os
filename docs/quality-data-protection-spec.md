# D01 / D04 implementation contract

Authorized by 성민 대표님's 2026-10-05 request to implement the integrated final report.
Base: 69ea05d (v2.9.175). Development candidate only; no production deployment approval inferred.

- Keep `hani_os_life_v23` and `2.9.15-safe-baseline-bootstrap` unchanged.
- A read/parse/normalization failure is a recovery state, never a new user.
- Preserve the exact failed string in the original key. Attempt a separate immutable, read-back verified quarantine copy. Copy failure must not release the write lock.
- All protected writes, removals, automatic Cloud pull/push and explicit upload paths must respect this lock.
- Export the original string, never the empty fallback. Do not filter damaged rows automatically or silently normalize them into defaults.
- Only explicit validated backup import, with verified original quarantine and unchanged original source, may replace the locked Local state. Failure retains the lock and rolls back the original string.
- Imported backups stay Local-only with a persistent sync hold, including after reload. Explicit Cloud confirmation is required to release that hold after existing revision checks.
- Use synthetic browser contexts and mocked Cloud only. Check malformed JSON/root, null lists, nested nulls, quota/read errors, normal saves, direct write paths, reload and import cancellation.
- Revert code independently of data. Never clear original/quarantine to make quota checks pass.

Not included: schema/migration, automatic item repair, production data correction, account deletion or deployment.
