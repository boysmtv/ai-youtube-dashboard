# AI YouTube Dashboard Next

Next.js operator control-plane scaffold for `ai-youtube-langchain`.

This is the canonical dashboard for the MVP. The root `docker-compose.yml` starts this service by default as `youtube-dashboard-next`.

The static Nginx dashboard is legacy fallback only and is started separately with the `legacy` profile. This app is the upgrade path toward the technology direction described in `.brief/brief.tech.md` and `.brief/brief.v2.md`.

## Runtime

```bash
npm install
npm run dev
```

Set `ENGINE_API_BASE_URL` for server-side API calls. In Docker Compose stack mode it points to `http://automation-api:8080`.
