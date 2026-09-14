# HANI OS Sports Background Sync — Batch 0–1

Status: local design and read-only fetch candidate only. Nothing in this document or branch has been applied to Production, Supabase, Cron, the frontend, or `main`.

## Baseline and collision gate

- Baseline: `origin/main` `ccb0243e4e880c48444cf41b997244b7caf4314e`
- Display version: `2.9.118`
- Latest UI bundle loaded by `index.html`: `hani-ui-v02992.js?v=2.9.118`
- GitHub: no open pull requests at the start of this batch.
- Supabase: project healthy, no development branches, no active non-idle database session observed.
- Other HANI Codex UI tasks were active, so this work uses isolated branch `hani/sports-background-sync-v1` and an isolated worktree.

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
- Real Madrid: first-team male squad filter prevented academy and women's fixtures from entering the cache candidate.
- Dplus KIA: latest completed LCK series found in LoL Esports Apollo server state; no next match was published in the fetched page state.

The first probe intentionally failed KBO, Real Madrid filtering, and LoL Esports extraction. Those failures were corrected against the observed official response shapes and the full probe was rerun successfully. This confirms why candidate validation must run before any future cache write.

## Mandatory approval boundary before Batch 2

Do not proceed without the representative's explicit approval. Batch 2 would introduce all of the following Supabase write/schema work:

1. A minimal cache table and RLS/grants migration candidate.
2. A server-only atomic upsert path.
3. A `hani-sports-sync` Edge Function wrapper with custom Cron-secret authentication.
4. Cron registration.

Supabase's 2026 Data API exposure change means the future migration must explicitly pair grants with RLS. The frontend should receive SELECT only; only the server-side function may write. No service-role or secret value may appear in repository files, logs, or browser code.
