# Chart detail development preview

Branch: hani/market-chart-detail. Base: 6fd975743c3ce407929ae2a45d190f773f1df105.

User approved adding OHLCV fields to private market cache on 2026-09-30.
Gateway and cache publisher now allowlist openPrice/highPrice/lowPrice/volume alongside existing candle fields. No account fields, credentials, asset writes, schema, policies, paths, bucket limits or polling intervals changed.

Safety: chart objects remain content-addressed; latest pointer commits last. Old objects are not deleted. Existing close-only objects remain readable. Invalid/missing OHLC is not fabricated by the renderer; missing volume is not replaced with zero. Existing size guards remain 262144 bytes per chart and 65536 bytes for latest.

Validation: 24 gateway/cache/PC/runner tests passed, including OHLCV round-trip, zero volume, field filtering, old-object retention, oversize failure preserving latest, owner checks and failure safety. Previous UI smoke exercised both new OHLCV fixtures and legacy close-only cache, desktop/mobile, no extra fetch on mode switching, no protected storage writes. Core market-data suite: 12 passed. Arin screenshot review: layout acceptable, mobile summary word-wrap is a minor follow-up. All are synthetic/local tests; no live publication performed.

Activation remaining: release candidate gates and user deployment approval; then use the updated collector code, not the older running worktree. Recollect the already-supported chart period once with onlyMissingCharts=false; true deliberately skips existing close-only refs. Preserve last good latest pointer and old objects for rollback. No automatic expansion of periods/history or recurring chart fetch is included. Do not run concurrent publishers. Verify live object OHLCV and rendered chart after activation.

Rollback: restore previous latest chart references using the established publisher only if needed and authorized; immutable old chart objects remain. UI can revert independently because added optional fields are backward-compatible.
