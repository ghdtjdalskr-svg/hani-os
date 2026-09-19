# HANI OS Sports Background Sync — Batch 0–2

Status: implemented on an isolated branch and applied to Supabase after the representative's deployment approval. GitHub Pages and `main` merge remain the final release steps.

## Baseline and collision gate

- Baseline: `origin/main` `654af6b1e9e7473882d30320307db3576b369877`
- Display version candidate: `2.9.121`
- Latest UI bundle loaded by `index.html`: `hani-ui-v02992.js?v=2.9.121`
- GitHub: no open pull requests at the start of this batch.
- Supabase: project healthy, no development branches, no active non-idle database session observed.
- This work uses isolated branch `hani/sports-background-sync-v2` and worktree `C:\Users\홍성민\Documents\HANI_OS_DEV\.audit\sports-background-sync-v2`.

## Batch 0 — verified Newsroom contract

The deployed Newsroom implementation is no longer an unverified repository-only inference. Read-only remote inspection confirmed:

- `pg_cron` 1.6.4, `pg_net` 0.20.4, and Supabase Vault 0.3.1 are installed.
- `hani-newsroom-interest-daily`: `10 23 * * *` UTC, active.
- `hani-newsroom-weekly-monday`: `30 22 * * 0` UTC, active.
- Recent recorded runs succeeded.
- The deployed `hani-newsroom-publisher` Edge Function is active at version 3.
- The function requires `HANI_NEWSROOM_CRON_SECRET` for scheduled publishing and uses server-only Supabase credentials for writes.
- `hani_newsroom_posts` and `hani_newsroom_reads` have RLS enabled; frontend reads are scoped by `auth.uid() = user_id`.
- The frontend keeps a local last-known cache as fallback.

Reusable infrastructure pattern:

`Supabase Cron → pg_net HTTP POST → separately authenticated Edge Function → validate → cache table → frontend read`

Sports must use a separate function, secret name, cache contract, and Cron job. It must not add Sports logic to the Newsroom function or touch Newsroom tables.

## Batch 1 — local source and validation contract

The local module `scripts/sports-sync/core.mjs` contains no database writes. It provides:

- Official-source readers for MLB, KBO, Real Madrid, and LoL Esports.
- One normalized contract for `lastGame` and `nextGame`.
- Team-specific cadence and blackout checks.
- Validation that rejects invalid scores, result/score mismatch, unexpected source hosts, missing opponents, future last-games, and backward cache movement.
- Freshness thresholds: 36 hours for daily teams and 8 days for weekly teams. Freshness tracks the last successful check, not the age of the last played game, so off-season data is not falsely marked stale.
- In-memory candidates only. No `insert`, `update`, `delete`, or `upsert` exists.

### Schedule policy

| Team | Cadence | Active | No regular fetch |
|---|---:|---|---|
| Yankees | daily | March–November | December–February |
| KIA Tigers | daily | March–November | December–February |
| Real Madrid | weekly | January–May, August–December | June–July, except one July 29–31 resume discovery window |
| Dplus KIA | weekly | January–November | December |

`force=true` exists for an explicitly approved diagnostic run. The production scheduler should call without force.

### Candidate cache contract

```json
{
  "teamId": "yankees",
  "league": "MLB",
  "lastGame": {
    "eventId": "123",
    "date": "2026-09-13",
    "opponent": { "id": "121", "name": "New York Mets" },
    "score": { "team": 2, "opponent": 0 },
    "result": "WIN",
    "homeAway": "home",
    "competition": "Regular Season"
  },
  "nextGame": {
    "eventId": "124",
    "dateTime": "2026-09-15T23:05:00.000Z",
    "opponent": { "id": "141", "name": "Toronto Blue Jays" },
    "competition": "Regular Season",
    "homeAway": "home"
  },
  "source": {
    "provider": "MLB Stats API",
    "url": "https://statsapi.mlb.com/api/v1/schedule",
    "kind": "api"
  }
}
```

Operational timestamps such as `last_attempt_at`, `last_success_at`, `data_updated_at`, and stale status belong to the future cache row, not the source candidate.

### Live read-only probe on 2026-09-15

All four official-source adapters returned a valid normalized candidate without writing anywhere:

- Yankees: latest completed game and next game found through MLB Stats API.
- KIA Tigers: latest completed game and next game found through KBO's official schedule endpoint.
- Real Madrid: an exact football first-team squad filter prevents basketball, academy, and women's fixtures from entering the cache candidate.
- Dplus KIA: latest completed LCK series found in LoL Esports Apollo server state; no next match was published in the fetched page state.

The first probe intentionally failed KBO, Real Madrid filtering, and LoL Esports extraction. Those failures were corrected against the observed official response shapes and the full probe was rerun successfully. A further QA pass found that an in-progress KBO `0–0` row has no official review link; such rows are now treated as scheduled, never as completed, so they cannot overwrite a last-known-good result.

## Batch 2 — server cache and scheduled sync

After explicit deployment approval, the following components were applied:

1. `public.hani_sports_cache`: one public read-only row per team, with `last_game`, `next_game`, source, status, freshness timestamps, and last error code.
2. `public.hani_sports_sync_auth`: server-only SHA-256 hash used to authenticate scheduled calls. The plaintext secret is generated inside Supabase Vault and is not stored in the repository, browser, or logs.
3. `hani-sports-sync` Edge Function v1: official-source fetch, normalization, candidate validation, regression protection, atomic REST upsert, and last-known-good preservation on failure.
4. Four Supabase Cron jobs with seasonal expressions: Yankees/KIA daily March–November, Real Madrid weekly January–May and August–December, Dplus KIA weekly January–November, plus a July 29–31 Real Madrid resume-discovery check.
5. Frontend read path in `hani-main.js`: public cache SELECT only, verified row application to existing Sports slots, and static HTML fallback when Cloud data is unavailable.

Supabase's 2026 Data API exposure change was handled by pairing explicit grants and RLS. The frontend has SELECT only; only the server-side function has write privileges. No service-role or secret value appears in repository files, logs, or browser code.

## QA evidence

- Node syntax checks: `hani-main.js` and `supabase/functions/hani-sports-sync/index.ts` PASS.
- Contract tests: PASS, including seasonal blackouts, source validation, freshness, regression rejection, custom cron authentication, and invalid team scope.
- Live official-source probe on 2026-09-15: Yankees, KIA, Real Madrid, and Dplus KIA all returned valid normalized candidates.
- Supabase manual authenticated sync: HTTP 200; all four teams updated and read back.
- Supabase cache verification: 4 fresh rows; anonymous SELECT allowed; anonymous INSERT and auth-table SELECT denied; RLS enabled on both tables.
- Supabase Cron verification: 4 active Sports jobs with the seasonal schedules above.
- Browser smoke QA opened the local v2.9.121 candidate with no browser warnings or errors. The authenticated Sports body remains unavailable without a QA login, so its visual state must be verified after deployment with an authenticated session; static fallback, JS syntax, DOM selector paths, cache contract, and production read-back cover the unauthenticated release checks.
