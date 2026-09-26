# HANI One-Pass Release

The releasable runtime package is built first from one frozen candidate commit. Every automated decision after that is bound to `candidate_sha`, `package_sha256`, and the version/hash of `one-pass-gate-contract.json`.

This document defines ownership and flow. Phase A does not change GitHub workflows, release scripts, the Deploy Bridge, or Production behavior.

## Modes

### Development Mode

`Scoped Discovery → Patch → Risk-tier Targeted Test`

- Use `dev-center/codemap.json` before searching broadly.
- LIGHT changes use scoped syntax and component QA.
- NORMAL changes use owner/dependency regression tests.
- CRITICAL changes retain the full safety audit.
- Do not repeatedly build a full package, run One-Pass, run HINA, or perform Production read-back for intermediate patches.

### Candidate Mode

`Candidate Freeze → Build once → One-Pass Preflight once → HINA Independent Verification once → Preview / Arin → representative approval → identity recheck → Merge → Production read-back`

Candidate Mode begins only when the representative requests a Preview Candidate or a patch set is ready to freeze. Any candidate content change creates a new candidate and invalidates earlier evidence.

## Audit: old overlap and One-Pass ownership

| Old owner/stage | Duplicate responsibility | One-Pass owner |
| --- | --- | --- |
| Yuri Pre-QA | storage/cloud mutation, syntax and secret checks duplicated from release QA | Yuri owns changed scope, UI classification, owner path, event layering and special checks not yet owned by One-Pass |
| Arin handoff | machine safety checks repeated during UI review | Arin owns Preview UX review only |
| HINA local + server + merge rerun | package reconstruction and full checks repeated for an unchanged identity | HINA independently verifies the frozen candidate once; later stages recheck identity and baseline drift |
| package picker/stager | rebuilt or reinterpreted release contents | fallback only; normal Queue accepts an immutable package identity |
| Queue discovery | reconstructed package paths and repeated full QA on refresh | READY only for One-Pass PASS + HINA PASS + unchanged frozen identities |

## Canonical One-Pass ownership

One-Pass owns the following checks for the frozen runtime package:

- runtime closure and changed package integrity
- JavaScript syntax
- protected storage/cloud mutation surface
- required storage key and internal-version invariants
- new duplicate DOM IDs and required UI anchors
- secret patterns
- main baseline and version progression
- package SHA and gate contract version/hash

Other stages do not independently repeat this complete set. Targeted development tests may check the changed behavior, and HINA keeps its independent release-boundary verification.

## Canonical Candidate flow

`Candidate Freeze → Build → One-Pass Preflight → HINA → Preview / Arin → representative approval → identity recheck → Merge → Production read-back`

- Build walks local references recursively from `index.html`; external URLs are excluded.
- Any missing reference, invalid/duplicate path, size violation, syntax failure, invariant drift, new duplicate DOM ID, secret pattern, baseline drift, version mismatch, or package hash mismatch blocks before READY.
- Package PASS is immutable. A changed file produces a new candidate and Package SHA.
- HINA independently verifies the same frozen candidate/package/contract identity. When those identities are unchanged, later discovery and approval stages should consume the evidence instead of rebuilding the package.
- PC/mobile interaction remains a manual Preview check until a real browser smoke runner exists; it is never reported as an automatic PASS.
- JSON upload remains a recovery path for Queue failure, not the normal release path.
- Edge Function source is versioned here for review, but this PR does not deploy it or alter database schema/data.
