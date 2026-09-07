# HANI One-Pass Release

The releasable runtime package is built first from one frozen candidate commit. Every automated decision after that is bound to `candidate_sha`, `package_sha256`, and the version/hash of `one-pass-gate-contract.json`.

## Audit: old overlap and One-Pass ownership

| Old owner/stage | Duplicate responsibility | One-Pass owner |
| --- | --- | --- |
| Yuri Pre-QA | changed-file scope, storage/cloud mutation, syntax hints | One-Pass Preflight on the full frozen runtime package |
| Arin handoff | UI-change classification and separate review state | representative Preview only; no duplicate machine gate |
| HINA local + server + merge rerun | version, invariants, DOM IDs, secrets, baseline and package checks at different times | shared contract; HINA independently verifies the same candidate/package/contract evidence |
| package picker/stager | rebuilt or reinterpreted release contents | fallback only; normal Queue accepts an immutable package identity |
| Queue discovery | reconstructed package paths and reran HINA on refresh | READY only for Preflight PASS + HINA PASS + frozen identities |

## Canonical flow

`development → Build → One-Pass Preflight → HINA → Preview → representative approval → Production read-back`

- Build walks local references recursively from `index.html`; external URLs are excluded.
- Any missing reference, invalid/duplicate path, size violation, syntax failure, invariant drift, new duplicate DOM ID, secret pattern, baseline drift, version mismatch, or package hash mismatch blocks before READY.
- Package PASS is immutable. A changed file produces a new candidate and Package SHA.
- PC/mobile interaction remains a manual Preview check until a real browser smoke runner exists; it is never reported as an automatic PASS.
- JSON upload remains a recovery path for Queue failure, not the normal release path.
- Edge Function source is versioned here for review, but this PR does not deploy it or alter database schema/data.
