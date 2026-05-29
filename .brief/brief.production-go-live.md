# Production Go-Live Brief

## Goal
Run the dashboard and engine with minimal local persistence, production auth enabled, and no reliance on browser state for business data.

## Rules
- PostgreSQL is the only runtime database.
- Local browser storage may only hold tiny UI preferences.
- Backups are disabled by default or kept to a single short-retention copy.
- Dashboard auth must be enabled in production.
- Secrets must come from environment variables or mounted files, not source code.
- Local `data/`, `output/`, and `downloads/` folders should be treated as ephemeral working directories.

## Recommended deploy flow
1. Copy `.env.production.example` to `.env.production`.
2. Fill all auth and public URL variables with real values.
3. Start the stack with `docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.production.yml up -d --build`.
4. Verify dashboard login, engine health, and job creation.
5. Confirm old local artifacts are not growing without control.

## Acceptance criteria
- Dashboard auth is on.
- Engine API is reachable from the dashboard.
- No SQLite or other local runtime database is used.
- No production secret is committed in the repo.
- Artifact/output growth is bounded by retention or cleanup.
