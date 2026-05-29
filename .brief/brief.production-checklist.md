# Production Checklist

1. Copy `.env.production.example` to `.env.production`.
2. Fill all auth, engine, and public URL variables.
3. Confirm dashboard auth is enabled.
4. Confirm PostgreSQL is the only runtime database.
5. Confirm backup retention is set to low-storage defaults.
6. Confirm `data/`, `output/`, and `downloads/` are mounted on disk with cleanup enabled.
7. Start with `docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.production.yml up -d --build`.
8. Verify dashboard login, engine health, and job creation.
9. Confirm `.ai-agent`, `.next`, and `node_modules` are not part of production persistence.
