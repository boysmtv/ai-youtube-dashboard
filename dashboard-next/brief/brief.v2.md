# Project Brief v2: Next.js Operator Control Plane Direction

## Goal

Update `ai-youtube-dashboard` from a lightweight static dashboard into the planned operator control plane for `ai-youtube-langchain`, using the technology direction from `brief.tech.md` and the recovered `ai-agent-web` project as the reference pattern.

## Current Baseline

The current dashboard is a working MVP:

- static HTML/CSS/JavaScript
- Nginx Alpine Docker image
- Docker Compose stack with the engine
- REST calls to the engine FastAPI API
- WebSocket overview updates
- job table and filters
- job detail view
- runtime logs
- transcript and plan file inspector
- registry editor
- worker and scheduler controls
- upload approval guard UI
- approval audit panel

This baseline should remain usable until the Next.js replacement is ready.

## Target Role

- This repo is the operator UI and dashboard.
- It does not own media pipeline logic.
- It controls the engine through API calls.
- It renders monitoring, job state, artifacts, registry, approvals, logs, quota, and system health.
- It must keep all large media files out of the image.

## Reference Pattern

Use `D:\Boys\Ai\ai-agent-web` as the technology reference:

- Next.js application shell
- FastAPI control-plane integration
- operator login/session pattern
- project/workflow launcher pattern
- run status and live log surface
- artifact explorer
- approval queue
- audit trail
- version/restore surfaces
- Postgres, Redis, MinIO production stack pattern

Do not copy its domain blindly. Reuse the pattern for the YouTube automation domain.

## Recommended Frontend Stack

```txt
Next.js 14
React 18
TypeScript
Tailwind CSS
shadcn/ui
TanStack Table
Zustand
React Hook Form
Zod
Monaco Editor
Recharts
Playwright
```

## Backend Strategy

Keep FastAPI in `ai-youtube-langchain` as the engine/control-plane backend.

Do not add NestJS in the first upgrade. NestJS is only justified later if the dashboard grows into a separate enterprise API gateway with complex multi-user RBAC and many external integrations.

## Data Strategy

### Current MVP

```txt
dashboard -> FastAPI engine -> SQLite -> host volumes
```

### Production Direction

```txt
dashboard-next -> FastAPI engine/control plane
FastAPI -> Postgres for metadata, audit, registry versions, analytics
FastAPI -> Redis for heartbeat, locks, pub/sub, temporary sessions
FastAPI -> MinIO for artifact mirror and preview
FastAPI -> host filesystem for source-of-truth media files
```

The dashboard should not store large media files. It should request metadata, previews, and download links from the engine/control-plane.

## Target Pages

```txt
/dashboard       overview monitoring
/jobs            job queue table
/jobs/[jobId]    job detail, attempts, logs, artifacts, transcript, plan, uploads, approval audit
/registry        channel registry editor with validation, diff, backup, restore
/approvals       upload approval center
/worker          live worker status and controls
/artifacts       artifact explorer and preview
/scheduler       scheduler control and dry-run
/quota           quota monitoring
/logs            runtime log viewer
/health          system health
/settings        engine URL, refresh interval, operator preferences
```

## Target UI Behavior

- Top bar always shows engine health, worker status, upload lock, active jobs, quota warning, storage warning, and current operator.
- Sidebar groups monitoring, jobs, registry, approvals, artifacts, scheduler, quota, logs, health, and settings.
- WebSocket is primary for overview updates.
- Polling fallback is required when WebSocket disconnects.
- Dangerous actions require confirmation and audit.
- Real upload controls stay disabled until approval is valid.
- Registry save must show validation and diff before committing.
- Artifact preview is read-only.
- Logs must support safe truncation for large files.

## Engine API Dependencies

The current dashboard depends on:

```txt
GET  /health
GET  /api/overview
GET  /api/registry
PUT  /api/registry
GET  /api/jobs
GET  /api/jobs/{job_id}
GET  /api/jobs/{job_id}/logs
GET  /api/jobs/{job_id}/files/transcript
GET  /api/jobs/{job_id}/files/plan
GET  /api/jobs/{job_id}/approvals
GET  /api/approvals/recent
POST /api/scheduler/run
POST /api/worker/run
POST /api/jobs/{job_id}/run
POST /api/jobs/{job_id}/requeue
POST /api/jobs/{job_id}/retry-upload
WS   /ws/overview
```

Future dashboard-next work should request new engine endpoints through a shared API-contract brief before implementation.

## MVP Upgrade Scope

The first Next.js pass should deliver:

- app shell with sidebar and top bar
- overview dashboard
- jobs table with filter and selected row state
- job detail page with tabs
- approval center
- approval audit table
- runtime logs page
- registry editor using Monaco or structured form
- artifact browser
- WebSocket overview integration
- Docker Compose integration with the engine
- Playwright smoke test for key pages

## Production Upgrade Scope

Later production passes may add:

- operator login/session
- simple roles: viewer, operator, admin
- registry versioning and restore
- analytics for jobs, uploads, quota, failures
- Redis worker heartbeat/status
- MinIO artifact mirror and preview URLs
- notification center
- multi-engine support
- memory/brief studio if the dashboard evolves into a broader AI operation platform

## Engineering Rules

- Keep the static dashboard working until replacement is deployable.
- Do not move engine pipeline logic into dashboard.
- Do not put secrets in frontend code.
- Do not store media in the dashboard image.
- Keep Docker images small.
- Prefer typed API client and shared TypeScript types for engine payloads.
- Use Playwright for dashboard E2E.
- Use `AI_AGENT_CORE` workflow/checkpoint before and after substantive implementation.

## Definition of Done for This Brief

- Dashboard brief is aligned with `brief.tech.md`.
- Static dashboard remains the MVP baseline.
- Next.js/TypeScript/Tailwind is the accepted target.
- `ai-agent-web` is documented as the technology reference.
- FastAPI engine remains the backend API provider.
- Postgres, Redis, and MinIO are documented as production upgrades, not immediate blockers.
