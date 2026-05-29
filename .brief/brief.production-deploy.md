# Production Deploy Procedure

1. Fill `.env.production` with real values.
2. Fill `dashboard-next/.env.production` with the same auth and public URL values if you deploy the dashboard stack directly.
3. Verify `docker-compose.production.yml` and `dashboard-next/docker-compose.production.yml` still pass `docker compose config`.
4. Start the stack.
5. Confirm dashboard login, engine health, and one job creation flow.
6. Check that `data/`, `output/`, and `downloads/` are growing only within the low-storage policy.
7. Confirm `.ai-agent/`, `dashboard-next/.next/`, and `dashboard-next/tsconfig.tsbuildinfo` are not being treated as persistent production data.
