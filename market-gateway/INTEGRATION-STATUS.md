# Market integration candidate — 2026-09-28

Base: `edd73d7ab9fcf12b7bf26fa77a4b91d20395e30b` (2.9.144).
Branch: `hani/toss-market-release`.

Task changes were ported to a fresh worktree, preserving main's monthly-report and Remote changes. The prior collector/preview worktree remains untouched and must not be archived while its processes are active.

## Current scope

- Runtime index enables the existing private `hani-market-cache` read path and catalog search.
- User-selected account holdings remain the quantity/cost source; market prices are a separate read-only view.
- Mutable latest/index downloads use cacheNonce; immutable chart/catalog chunks retain content-addressed paths. Client rate limits are unchanged.
- Existing login client is reused. No asset write path, protected storage key, schema or policy changes in this integration step.
- No provider logos are supplied. Legacy broad logo inference is excluded from the market component.

## Verified on integrated source

- Cache and direct-gateway fixture browser runs: PC/mobile layout, chart colors/axes, Remote controls, instrument lookup form guards, outage behavior and zero protected-storage writes.
- Public SDK contract test: actual CDN SDK with synthetic credentials and intercepted transport verifies GET, private-object path, cacheNonce, no-store, abort signal and Blob response. No private user session is used by this test.
- 47 targeted Node tests passed. Read-only authenticated browser SDK check passed with the existing private session: 18 real quotes/charts and catalog lookup. The browser uses synthetic one-share holdings, no persistent auth session, an outbound GET-only allowlist, and no main asset-state writes. This verifies SDK authentication/Storage rendering, not password-entry UI or physical-phone behavior.
- Candidate display version and changed runtime cache identifiers are 2.9.145. Protected internal version remains unchanged.

## Not yet complete

- Full release package, independent final release gate and final Preview approval remain required before production.
- No main merge or production deployment occurred. Runtime activation here affects only this development candidate.
