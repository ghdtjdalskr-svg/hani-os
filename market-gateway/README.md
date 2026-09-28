# HANI Market Data Phase 1 — development preview

## Current direction: PC collection + private cache (2026-09-27)

Provisioning update: the approved private bucket and owner-only SELECT/INSERT/UPDATE policies are now created and read back; 32 installed policy-expression checks passed. No objects uploaded. See `PROVISIONING.md` for scope, rollback and remaining HTTP/auth verification. References below to pending bucket creation describe the earlier checkpoint and are superseded by this update.

The paid fixed-egress service described below is the earlier alternative, **not the selected deployment plan**.
`pc-collector.mjs` reuses the authenticated market-only provider in-process, without a listener. `cache-publisher.mjs` publishes a small allowlisted `latest.json` to the dedicated private `hani-market-cache` bucket under the authenticated owner's UID. Content-addressed chart objects are separate and lazy-loaded. No account balances, quantities, holdings or credentials are published.

`createCacheClient` reads through the existing signed-in Supabase client. Minimum latest-file interval is five minutes, including manual refresh; chart files are reused in memory. A cold phone can read the previous PC upload; displayed timestamps retain collection/quote time, not phone read time. Missing/failed/older source results never replace the previous latest object. Price-only collections retain chart references. This is a read-only valuation overlay, not a replacement of saved records.

Validation: 27 targeted automated tests plus both gateway/cache mocked browser modes and the existing asset-update smoke. No real Toss credentials or production data used. Cache mode remains disabled in the shipped HTML until provisioning and live checks finish.

**Remaining before live use:** private bucket and owner-only SELECT/INSERT/UPDATE policies, secure Windows credential/session entry and refresh, registered PC egress IP and Toss terms verification, bounded chart retention/cleanup, and one live authenticated publish/read-back. The collector is currently an injectable module, not an installed background service. No scheduled task, paid service, bucket, policy or production release was created by this patch. Avoid unattended chart collection until retention is implemented; immutable chart objects otherwise accumulate. Do not put secrets in environment files committed to this repository, chat, browser state or localStorage. User session credentials must not be replaced by a service-role key.

Cache tests: `node --test scripts/hani-market-cache-test.mjs scripts/hani-market-pc-test.mjs`.
Cache browser test: set `HANI_MARKET_CACHE_TEST=1` then run `node scripts/hani-market-browser-smoke.cjs`.

Base: `27791a19ec4823d2c643141bc4d427ec644e3cff` / display `2.9.137`.
Branch: `hani/toss-market-data-phase1`. Not a frozen release candidate.

## Scope / preservation

The browser reads existing confirmed account snapshots (latest per account), with transaction holdings as fallback only for accounts without a snapshot. Market values remain in memory. Account identifiers, raw holdings, instruments, brokerCalc, storage writes and cloud semantics are unchanged. Unknown positions stay visible; there is no automatic cash/residual reclassification. Foreign valuation is currency-separated; missing cost currency suppresses PnL. A search choice is session-only and never changes the canonical instrument or account.

The production Gateway URL is intentionally empty in index.html. No credentials have been created, entered, retrieved or used. All automated tests use synthetic fixtures and mocked upstream responses, never a real Toss account. Existing Holding Resolution work is not included.

## Runtime contract

- Browser: `/v1/stocks?symbols=…`, `/v1/prices?symbols=…`, `/v1/chart?symbol=…&period=…`, `/v1/search?market=…&q=…`.
- `GET` only, except CORS preflight. No account, order, arbitrary URL, holdings-sync or write routes.
- Gateway validates the HANI bearer via Supabase Auth `/auth/v1/user`, then checks exact server-configured user ID and rejects anonymous users. CORS is supplementary, not authorization.
- One Node process owns the Toss token. Do not deploy multiple replicas sharing the same client credentials without coordinated token ownership: Toss reissue invalidates the previous token.
- Each request is authenticated before cache access. Server cache is memory-only and bounded. Token, credentials and upstream error bodies are never returned.
- Chart prices are **unadjusted**, explicitly labeled. The horizontal line is today's holding cost basis, not historical portfolio PnL. Corporate actions can create discontinuities. Missing pages produce a partial-data notice.
- One-minute chart endpoint exists, but first live use still requires KR/US session, retention and extended-hours validation. Timestamp and provided range must be inspected; synthetic tests do not establish live coverage.
- Client deduplicates batches and requests, caps mini-chart network loading to six positions, stops periodic work outside Asset/hidden tabs, and isolates responses across chart selection changes.

## Deployment prerequisites — separate approval required

1. Select a fixed-egress host; do not assume hosted Supabase Edge has a stable outbound IP.
2. HTTPS reverse proxy to this service's loopback port. Preserve the allowed browser Origin. Set body/connection/time limits at the proxy, limit access, and disable authorization/query-body logging.
3. Server-side environment only: `HANI_SUPABASE_URL`, `HANI_SUPABASE_PUBLISHABLE_KEY` (not service_role), `HANI_MARKET_USER_ID`, `HANI_MARKET_ORIGIN`, `TOSS_CLIENT_ID`, `TOSS_CLIENT_SECRET`, optional `PORT` (8788).
4. Register the server's actual outbound IPv4 in Toss. Confirm personal-use, data display and caching terms. Never request secrets in chat or put them in a GitHub Pages file/localStorage.
5. After separate authorization, configure the public HTTPS Gateway origin in the empty `hani-market-gateway` meta tag; secrets remain server-only.
6. Live read-only verification: authentication denial, approved owner, KR/US symbol/currency, stale/closed-market timestamp, unsupported symbols/partial batch, chart pagination/session/splits, rate limits and outages.
7. Freeze a candidate, assign runtime/cache versions and complete existing release gates before any production merge/deploy. No current live connectivity or release PASS is claimed.

Operational safeguards: one small process, fixed outbound IP, in-memory cache, no new database. Service failures leave saved HANI records available. To roll back the market overlay, remove its three client includes and one navigation hook (or revert this patch); no stored asset data needs migration or repair. Stop/revoke the service separately if necessary.

## Verification commands

`node --test scripts/hani-market-data-test.cjs scripts/hani-market-gateway-test.mjs`

`node scripts/hani-market-browser-smoke.cjs` (Playwright + local Chrome; mock network only)

`node scripts/hani-asset-update-smoke.js`

Optional browser screenshot path: `HANI_MARKET_SCREENSHOT`. Screenshots contain synthetic data, not live prices.

Remaining product limitations: name-only candidates require explicit session-only selection; persistent provider mapping is deferred. The existing OCR field-confirmation requirements are unchanged. No WebSocket, FX conversion, logos from Toss, automatic holdings sync or daily portfolio snapshot writes are included.
