# Production Low-Storage Brief

## Goal

Run `ai-youtube-dashboard` and `ai-youtube-langchain` as a production-oriented operator stack with the smallest practical local footprint.

## Operating Rules

1. PostgreSQL is the only runtime database.
2. Long-lived job metadata stays in Postgres.
3. Downloads, render outputs, and transient runtime files must be aggressively cleaned.
4. Local backups are disabled by default in the stack; when enabled, keep only the newest backup.
5. The dashboard must not store media files or pipeline state beyond tiny UI preferences.
6. `localStorage` is allowed only for operator UI preferences.
7. Real upload actions remain behind the approval guard.
8. Production deployment must enable dashboard auth.
9. Secrets must come from environment variables or mounted credential files, never from committed config.

## Default Storage Posture

- Keep the worker at one active heavy job.
- Clean downloaded source files immediately after terminal job states.
- Keep only a small number of recent output job directories.
- Treat output artifacts as disposable unless explicitly archived outside the stack.
- Prefer external object storage or a separate archive target if long-term artifact retention is required.

## Production Readiness Criteria

- `docker compose config` succeeds.
- Dashboard build and typecheck succeed.
- Engine tests pass in a Docker-capable environment.
- Health endpoints report healthy for dashboard, API, scheduler, worker, and publisher.
- Retention policy keeps disk usage bounded under steady-state load.
- Manual upload approval is required and auditable.
- No committed secret material exists in repo config or memory files.

## Non-Goals

- No rewrite of the media pipeline.
- No new database layer inside the dashboard.
- No large media storage inside the dashboard image.
- No unbounded local cache growth.
