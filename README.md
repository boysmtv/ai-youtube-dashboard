# AI YouTube Dashboard

Recommended local MVP stack:

1. Copy `D:\Boys\Ai\ai-youtube-langchain\.env.example` to `D:\Boys\Ai\ai-youtube-langchain\.env` and fill local values.
2. Optionally copy `dashboard-next/.env.example` if you want to override dashboard defaults.
3. Start the full stack from this repo:
   ```bash
   docker compose up -d --build
   ```
4. Open the dashboard at `http://localhost:3001`.
5. Check the engine API at `http://localhost:8080/health`.
6. Create the first job from the dashboard.

Notes:
- `youtube-dashboard-next` is the recommended MVP UI.
- `youtube-dashboard` is the legacy static fallback and only starts with `--profile legacy`.
- The stack includes PostgreSQL, Redis, engine API, scheduler, worker, publisher, and the dashboard.
