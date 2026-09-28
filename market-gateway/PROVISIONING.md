# Private market cache provisioning — 2026-09-27

Project: qmgikfdwjzmhkwadycxk. Approved dedicated cache only; no public asset table, protected local storage, existing cloud write path, or production site changed.

Applied remote migration: `hani_market_cache_private_owner_access`.

- Bucket `hani-market-cache`: private, JSON only, max 262144 bytes per object.
- Policies `hani_market_cache_owner_read`, `_insert`, `_update`: authenticated role, exact approved owner UID, anonymous sessions rejected. Paths restricted to `<owner>/latest.json` and `<owner>/charts/<64 lowercase hex>.json`.
- UPDATE has both USING and WITH CHECK. No DELETE policy, public access, service-role client or security-definer function added.
- Pre-change snapshot: no buckets or Storage object policies; storage.objects RLS enabled.
- Post-change read-back confirmed private flag, MIME/size restrictions and all three policy definitions. Object count remains zero.
- Executed 32 tests of actual installed policy expressions (read, insert, update USING/WITH CHECK): owner latest/chart allowed; other user, anonymous, other bucket, traversal, other prefix, arbitrary file denied. This is NOT an authenticated HTTP upload/download test; that awaits user credentials.

Security advisor reported no finding for this cache. Existing unrelated findings: missing policies on calendar/release queue tables (INFO), two mutable function search paths, pg_net in public, leaked-password protection disabled. No unrelated settings were changed. References:
- https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
- https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

Rollback: first stop collector and keep browser cache configuration disabled. Revoke only these three named policies via a reviewed migration; leave bucket/files private and intact. No deletion or asset restore is required. Do not delete Storage metadata directly.

User subsequently confirmed Toss credentials issued and PC outbound IP registered. No values were requested or read in chat.

`setup-toss-credentials.ps1` provides a local masked WinForms input dialog. It encrypts both fields as a versioned JSON payload using Windows DPAPI CurrentUser, saves only ciphertext to LocalAppData/HANI_OS_Market/toss-credentials.dpapi with user/SYSTEM directory ACL, and refuses overwrite/reparse directory paths. It does not make network calls or install auto-start tasks. DPAPI protects data at rest; it does not isolate secrets from other software running as the same Windows user. Managed input strings may temporarily exist in process memory. Do not capture the real credential dialog or dump/decrypt the file through agent tools.

SelfTest uses only synthetic credentials: memory round-trip, masking, input validation, temporary encrypted-file read-back, ACL validation and overwrite rejection. Live credential save is not confirmed until user feedback. The PC collector still needs private in-process credential consumption, HANI sign-in/session refresh and live publish/read-back. Production HTML remains disabled; no deployment performed.

## Live read-only connection verified

User confirmed encrypted credential save. Metadata-only inspection found the encrypted file; the dedicated directory has protected ACL with no principals other than current user and SYSTEM. The sandbox cannot inspect that ACL/decrypt the user key; checks ran explicitly in the user's Windows context.

`test-toss-connection.ps1` ran once successfully: official OAuth token endpoint, GET stocks for 005930 (KOSPI/KRW), GET prices for 005930 (positive price, parseable non-future timestamp). Only sanitized stage/symbol/currency/success results were printed. No secret, token, raw response, holding quantity or account data was logged. No account/order API calls, cloud uploads, saved asset changes or deployment. Token lived only within the verification process; a future collector must obtain its own token and exclusively own refresh to avoid revoking another process's token.

Remaining: collector consumes encrypted credentials without returning them to the agent, HANI owner sign-in/session lifecycle, cache retention, actual upload + phone read-back, candidate preview/release gates. Price freshness during an open market, US prices and charts were not established by this one-symbol check.

## PC HANI sign-in setup

`setup-hani-session.ps1` uses existing HANI email/password authentication, fixed project HTTPS endpoints and public publishable key. It disables redirects, verifies the authenticated user via `/auth/v1/user` against the approved owner and rejects anonymous users. Only access/refresh tokens, owner ID and expiry are persisted in CurrentUser DPAPI ciphertext; password/email are not included. No browser session extraction, admin key or asset table operations. File creation refuses to overwrite existing session and requires the private directory ACL from Toss setup. Same-user software can use this HANI session, so it must be treated as a secret (RLS limits this collector's code path, not the overall session's account rights).

Synthetic SelfTest passed: owner/anonymous guards, DPAPI round-trip, password exclusion and masked password control. Actual HANI login awaits user interaction. Refresh rotation, collector integration and authenticated cache publish remain pending. No deployment.

## Authenticated cache round-trip verified — 2026-09-27

User confirmed PC HANI sign-in. `verify-live-cache.ps1` decrypted both files only in its process and passed credentials to the child collector via redirected stdin (not arguments, environment, files or agent output). The child verifies owner via Auth before using the dedicated Storage path. The diagnostic refuses to shrink an existing cache containing other symbols. It performs one bounded collection, not a background service.

Live result: published Samsung 005930 and Apple AAPL public quotes, 487-byte latest.json, exact SHA-256 read-back match, anonymous request denied. Collected 2026-09-27T13:04:35.236Z. Provider quote timestamps were Samsung 2026-09-23T19:59:59+09:00 and Apple 2026-09-26T08:59:58+09:00; original timestamps retained, not labeled fresh. No holding/account data uploaded, no asset table/localStorage writes or deployment.

Two integration issues fixed: elevated PATH has two Node executables, now select first explicitly; first missing Storage file may use legacy 400/not_found, now recognized while missing bucket, unknown 404, permission and quota failures stop. Script outputs only sanitized status/market timestamp fields; stderr is never forwarded.

Tests: 30 targeted Node tests including the runner, new legacy missing-file versus missing-bucket guard; PowerShell syntax checked. Still pending: session renewal, unattended collector lifecycle/retention, user's actual symbol selection, charts, real phone UI read-back and final release gates. Existing screenshot cache-mode tests remain synthetic, not live mobile verification.

## Portfolio watch mode — 2026-09-27

User explicitly approved reading HANI investment holdings and sending only their symbols to Toss, plus encrypted session renewal. `portfolio-collector.mjs` reads projected accounts/instruments/broker snapshots, not full life-state or attachments, once per hour in memory. It uses latest confirmed holdings only; transaction-only accounts are not covered yet. Conflicting/absent codes are counted, not guessed. No account ID, quantity, cost or valuation is sent to Toss or included in market cache.

Live portfolio run: 18 holding records, 14 distinct resolved symbols, 4 unresolved records; 3093-byte snapshot published and digest read-back passed. First read-back exposed stale Storage caching, so collector validation now uses a digest-specific query and prior-cache reads are cache-busted. Browser display remains disabled pending live UI validation.

`verify-live-cache.ps1 -Portfolio -Watch` runs the existing collector in one child, guarded by an exclusive private lock. Success interval five minutes; failures back off to ten/twenty minutes and third consecutive failure stops. Safe status contains counts/PIDs/time only. `stop-market-collector.ps1` verifies exact command paths, process types and parent-child relation before stopping the dedicated child. Live start and stop both succeeded; keys/cache remained intact. No login-start task or OS boot task installed. Status file is a last report, not guaranteed process liveness after an abrupt PC shutdown.

Session refresh is single-flight, server-verifies owner, then uses a private child pipe to DPAPI-encrypt and atomically replace only the dedicated session file; stale refresh-token comparison prevents replacing a changed session. Disk failure blocks further refresh attempts. Synthetic refresh tests passed; actual expiry-cycle renewal is not yet independently established.

Verification: 36 targeted Node tests; three PowerShell scripts parse; live watch first cycle success (14 symbols) and exact-stop success. Remaining: charts/retention, unresolved holdings and transaction fallback, mobile live preview, deliberate startup installation if requested, upstream integration and release gates. No production site deployment.

## One-month chart seed — 2026-09-27

Added explicit one-shot `-Portfolio -SeedCharts`. It cannot combine with watch mode. Existing 1M references are reused without recollection; new charts reject mismatched currency/future timestamps. A source failure does not advance latest.json. All 14 chart files were live-read and SHA-256 checked against their immutable paths, with symbol/period identity verification.

Live result 2026-09-27T13:27:02.815Z: 14 charts, total 23425 bytes; latest.json 4357 bytes. Price-only watch restarted successfully afterwards, retaining chart references. No recurring chart refresh or cleanup/delete permission added. Seeded charts will age until a separate bounded refresh/retention policy is implemented. Other chart periods are not seeded and the UI now explains missing/unreadable cache data rather than implying all periods work.

Two new chart regression tests passed (reuse without transfer; wrong currency/future data preserve previous latest). Cache-mode browser smoke passed with synthetic fixtures on desktop/mobile width, zero protected-storage writes and no overflow. Mobile image visually inspected: chart/cards render; existing global HANI Remote floating control overlaps the chart area (not changed here). No real phone or live browser-cache PASS claimed. Screenshots are in root workspace artifacts/toss-market-cache-preview*.png and explicitly labeled test data.

## Continuation verification — 2026-09-28

Found watcher stopped at 2026-09-27T14:27:49Z, exit 1. Safe one-shot diagnosis identified session-save-failed. Isolated temporary-file regression reproduced PowerShell converting the File.Replace backup `$null` argument to an invalid empty string. `[NullString]::Value` passed; applied to encrypted atomic replacement. Actual session renewal then succeeded and a subsequent process authenticated using the saved session. No asset writes or schema changes. Stopped status now preserves the final safe stage/reason rather than losing failure evidence.

Four unresolved holdings had valid-looking domestic ETF codes with a letter in position five (0038A0, 0064K0, 0046Y0, 0091C0), rejected by the numeric-only domestic validation. Added this bounded code shape and optional A-prefix normalization; exact master conflict checks and provider metadata validation remain. Live provider retrieval confirmed all 18 symbols and digest read-back passed, unresolved zero. One-month seed at 2026-09-27T22:32:35.800Z verified 18 charts / 29683 bytes and latest 5668 bytes, reusing the previous 14 chart references.

40 targeted Node tests passed; isolated PowerShell replacement reproduction passed; synthetic cache-mode desktop/mobile browser smoke passed. Actual phone and authenticated browser live-cache rendering remain unverified. No production deployment or startup task. Remaining chart periods, scheduled chart refresh/retention and transaction-only account coverage are not implemented. The one-shot `-Portfolio -Diagnose` mode reads holding codes without Toss requests or cache writes; it may renew the approved encrypted login and outputs only exception names/codes/reasons, never account identifiers, quantities or money.

## Live cache rendering preview — 2026-09-28

Read-only `-BrowserCheck` verifies the saved session owner and downloads latest plus 18 referenced 1M chart objects, checking their hashes/identity. Credentials remain in the Node process; the isolated browser gets market data and a fake session adapter, never real tokens. No Toss credential is decrypted in this mode. Fixture holdings use one share per symbol and are explicitly labeled non-real account data. All external browser requests are blocked; screenshot output is market-only. This validates real cache payloads in the component, not the production Supabase browser SDK/login path.

Live run: all 18 price displays and main charts rendered; missing 1Y cache displayed a warning; return to 1M succeeded; protected storage writes zero and state unchanged; desktop and 390px viewport screenshots captured under root artifacts/toss-market-live-cache*.png. Mobile screenshot inspected, with known global HANI Remote overlap of period controls still visible. Real phone login and production deployment remain unverified/unperformed. Dedicated watcher restored and first cycle published 18 symbols, unresolved zero, at 2026-09-27T22:37:12Z. Private cache and real asset state are not copied to disk by the browser checker.
