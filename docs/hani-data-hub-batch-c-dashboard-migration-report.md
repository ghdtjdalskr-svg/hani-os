# HANI DATA HUB · Batch C Dashboard Migration Report

2026-10-03 · Risk CRITICAL · Development Preview only

## Baseline

- main SHA: `85c8110ee310c1d0cb4aa3cdbf3275a07e5593e6` / v2.9.160.
- Runtime owner: hani-main.js; final UI owner: hani-ui-v02992.js.
- Branch: `hani/data-hub-dashboard-main160`, separate `.worktrees/data-hub-dashboard-main160`.
- Approved standalone A/B commits brought into this new branch without changing previous worktrees. Display version v2.9.161 is a development candidate, not deployed.
- Other chats “테마 작업” and “월간/분기연간보고 (완)” were in development, not active merge/deploy, at the initial check. Do not reuse that observation as a later release lock.
- CODEMAP guided discovery; additional loaded legacy card owners v02978/v02979 were verified by narrow runtime-anchor search.

## Owner Binding

- Source: existing operational state, **only after equality with the current authenticated user's owned Cloud row**. Cloud basis does not mean replacing Local with Cloud or bypassing a mismatch.
- Live evidence: existing Chrome operating v2.9.160 source-owner button returned `VERIFIED`. This used server getUser and user_id-filtered SELECT. No raw source, account ID, credential or financial values were copied to this report. At observation the UI showed sync ON / applied revision 547, unlike the older Codex-browser Local.
- Evidence is specific to that moment, browser and source; it is not permanent proof for this candidate. New runtime independently re-verifies before opening persistent cache.
- Fail closed: absent session, server-owner mismatch, Local/Cloud mismatch, concurrent source/client/session change or failed read yields disabled cache and neutral six-card state. No force-sync, restore or owner-field insertion.
- Session invalidation: existing canonical auth callback invalidates synchronously; client replacement, Cloud stop/check state, source-change full render and context/day change remove the old active consumer. Pending asynchronous work cannot publish/display under a changed binding. No new auth subscription or observer.

## Runtime Integration

- Pure core and isolated store remain separate source modules. A deterministic classic-script bundle loads them through the existing runtime architecture without changing release tooling or adding a second app lifecycle.
- Runtime adapter calls existing `brokerCalc(row).total` and `ledgerCalc(row).jispiT`, never a competing financial calculator.
- Existing sync completion schedules refresh outside paint. Manual “지표 검증·갱신” uses the same bridge.
- Visual paint only consumes a current in-memory view. It does not calculate, authenticate or write a generation. Repeated paint/unchanged completion does not republish.
- Active cache is owner-isolated, source/definition/coverage checked, and atomic. A matching generation's rows are consumed; missing/stale cache rebuilds validated rows. A fresh expected contract is calculated once per actual refresh, not each paint.

## Dashboard Canonical Metrics

| Metric | Current | Comparison |
|---|---|---|
| HASDAQ | Current month last valid confirmed Investment Account Total | Exact previous calendar month; absolute/percent delta, not investment return |
| N&E | Current month latest valid observed weight | Exact previous calendar month, not latest two records |
| READ | Current month completed books only | Exact previous month; watched media excluded |
| STEP | Positive-step observed-day average | Explicit valid registry goal only; observed_days and zero ambiguity visible |
| JISPI | Existing spending owner, labeled settlement month | Explicit budget usage_rate/remaining, not generic achievement |
| HINKEI | Current-month sum(correct)/sum(attempted) | Explicit accuracy target; gap in percentage points |

JISPI retains period_basis=settlement_18_17 and explicit previous-month 18th to labeled-month 17th dates in metric rows/selected detail.

## Exact Previous Month

August present / September absent / October current tested for HASDAQ, N&E and READ in unit and full-app desktop/mobile fixtures. October has no September baseline and never substitutes August. Without verified complete monthly book coverage, an absent book month is NO_DATA rather than a fabricated zero.

## Goals

Production currently exposes no approved durable Goal Registry. The live adapter supplies an empty explicit registry; state.goals, ledger defaults, 10,000 steps and 100% accuracy are not adopted as historical goals. STEP/JISPI/HINKEI render `Target not set` normally. Synthetic explicit annual/quarter semantics, JISPI usage/remaining and HINKEI %p were tested; no Goal History writes or annual-total division.

## Status Handling

CONFIRMED, PARTIAL, NO_DATA and STALE retain contract metadata. Operational coverage has no reliable completeness provenance, so observed values can remain conservatively PARTIAL, even in closed months. Current/open cumulative metrics remain PARTIAL. Confirmed zero is displayed as zero when supported by explicit coverage/observations; missing values remain null/“기록 없음”. Failed canonical recalculation preserves the last good value as STALE but excludes official comparison. As-of, coverage and sample/observed-day metadata are preserved, with selected detail and STEP quality text visible.

## Legacy Logic

- Removed migrated card/detail writes from renderHome, renderBody and main renderLifeMarket. Mini plots now use canonical current/previous results only.
- Loaded v02978/v02979 Dashboard legacy calculation owners are bypassed by the Data Hub slot marker; unrelated UI functions continue.
- v02992 improveLifeMarket retains brand image/companion arrangement, but no longer computes or replaces six metrics/targets. It calls the one canonical consumer.
- Shared Dashboard analysis DOM now uses the selected canonical monthly result. Finance allocation analytics remain in Finance, not recreated as Data Hub dimensional data.
- Life Market ticker and market mood calculations remain legacy and unchanged. They may differ semantically from migrated cards (e.g. media inclusion/older observations); this intentional Batch G boundary is disclosed, not labeled canonical migration PASS.
- Monthly Report calculations/saved reports unchanged.

## IndexedDB

- Separate `hani_data_hub_v1` derived namespace only; no fields added to hani_os_life_v23.
- Cache miss, cache hit, stale-contract rebuild, owner switch, session interruption, atomic rollback and unavailable IndexedDB tested.
- Verified-source memory fallback preserves nonzero and missing-data distinctions if storage cannot open/publish.
- Persisted rows contain derived metric contracts only, not copied raw operational rows, login identifiers/tokens or business payloads.
- Logout invalidates active consumer without deleting source or other owners' generations. Cache is regenerable; Goal History remains outside it.

## UI QA

- Full app: 1440px and 390px, six cards and all selected-detail interactions.
- Porcelain Cream / Midnight Black screenshots inspected; grid has no horizontal overflow.
- Arin independent image review found no new UI blocker. STEP observed days/zero ambiguity and comparison/status wrap readably at 390px. At 1440px PARTIAL can wrap within narrow detail tiles (non-blocking).
- Existing floating toolbar/Remote overlaps are separate baseline behavior; not redesigned in this scope.
- Representative Preview pending: `http://127.0.0.1:7542/`. This is a **synthetic-data development preview**, with external Cloud connections blocked by CSP. No real account login/source transfer is required. Browser read-back confirmed all six numeric cards and the synthetic-data notice.

## Regression / Safety

- Batch A: 27 synthetic tests PASS.
- Batch B: 20 isolated real-IndexedDB browser checks PASS.
- Batch C controller: 7 tests PASS, including exact gaps, goals, zero/NO_DATA, cache hit, STALE preservation, storage fallback, identity/race invalidation and paint dedup.
- Full app: 10 desktop/mobile scenarios PASS; complete scenarios additionally exercise target-present math, confirmed zero and real stale-contract cache republish.
- Existing Monthly Report aggregation: PASS.
- Existing read-only owner diagnostic: 7 fixtures PASS.
- Source safety: 10 existing source/Cloud save/sync/restore functions byte-identical to base; protected key/internal version unchanged. New runtime has no operational-source or Cloud mutation path.
- Browser fixtures verify protected storage sentinel and comparable source before/after Data Hub refresh, with no new runtime errors. These are synthetic safety checks, not raw-byte measurements of the user's Production source.
- Syntax, deterministic bundle check and diff whitespace: PASS.
- No main merge, push, PR creation, Production deploy, Supabase schema/DB mutation, secret changes, or release-tooling edits.

## Protected Data / Rollback

hani_os_life_v23/internal data version/Cloud write contract unchanged. Asset input/Toss/Portfolio/Drive/Goal durable storage untouched. Rollback is returning to the approved base runtime; operational data requires no migration/recovery. The separate derived cache may remain unused and can be regenerated through its approved store architecture; rollback does not automatically delete it.

## Known Limitations

1. Integrated candidate has not run with the real operating source; live evidence above is the existing verification-only deployment. Release must reverify in the actual owning browser/session, and mismatched Codex Local remains blocked.
2. No durable Goal Registry or verified period-coverage registry exists; empty explicit goals and conservative partial/NO_DATA states are intentional.
3. No full Data Hub page, Life Market/ticker or Monthly Report migration, portfolio analytics, Drive vault or new source ownership semantics.
4. Development QA is not a frozen release package. Final package/One-Pass/HINA gate and representative approval remain required at the actual release boundary. No Production PASS is claimed.

## Recommendation

**READY FOR REPRESENTATIVE DEVELOPMENT PREVIEW** — implementation and targeted safety tests complete. Do not merge/deploy until representative Preview approval and final release gates. A changed main requires a new baseline-impact report; do not silently rebase/merge.

Supabase guidance influenced the adapter: validated server identity remains distinct from local login state, and cache authorization uses same-session owned-row evidence, not administrator connector data. Official [getUser documentation](https://supabase.com/docs/reference/javascript/auth-getuser) was checked; the official changelog index was also read before integration.
