# AI YouTube Dashboard

This repository is the local operator surface for the TikTok/YouTube Shorts MVP.
The MVP is ready as a local system. Upload remains setup-blocked until the required credentials are added later.

## MVP Release Checklist

### 1. Current MVP Status

The MVP is ready for local use.

- The local stack starts cleanly with Docker Compose.
- The dashboard can control the engine and show production state.
- Job creation, queueing, processing, progress, and review all work locally.
- Missing upload credentials do not block video generation or review.
- Upload is intentionally blocked until credentials are configured later.

### 2. What Works Now

- Docker local stack
- dashboard
- engine API
- PostgreSQL
- Redis queue
- scheduler
- worker
- publisher service
- job creation
- queue processing
- realtime logs/progress
- setup-required failure handling
- video preview for completed outputs
- local title variants
- local viral score
- manual upload approval gate
- friendly duplicate job conflict

### 3. What Is Intentionally Not Configured Yet

- GCP JSON
- YouTube API/OAuth credentials
- TikTok credentials
- YouTube cookie file
- paid/cloud AI APIs
- ElevenLabs/cloud TTS

Important behavior:

- Missing upload credentials should not block the system.
- Upload remains blocked until credentials are added.
- Missing YouTube cookie only blocks source download when that cookie path is required.

### 4. How To Start The MVP Locally

Run the stack from the dashboard repo root:

```bash
cd D:\Boys\Ai\ai-youtube-dashboard
docker compose up -d --build
```

Then open:

- Dashboard: `http://localhost:3001`
- Engine health: `http://localhost:8080/health`

### 5. How To Verify Services

Useful checks:

```bash
docker compose ps
curl.exe -s http://localhost:3001
curl.exe -s http://localhost:8080/health
docker exec ai-youtube-langchain-postgres psql -U automation_local -d automation_local -c "select count(*) from jobs;"
docker exec ai-youtube-langchain-redis redis-cli ping
```

What to look for:

- Dashboard returns `200 OK`.
- Engine health returns `{"status":"ok" ... }`.
- PostgreSQL container is healthy.
- Redis returns `PONG`.
- Queue state is visible in the dashboard and engine API.

### 6. Normal Business Flow

1. Open Dashboard.
2. Click `Buat Video`.
3. Create a job.
4. Watch `Antrian`.
5. Open the job detail page.
6. See realtime progress.
7. Review title and viral score.
8. Preview video when ready.
9. Approve upload.
10. Upload only after credentials are configured.

### 7. Expected Setup-Blocked Behavior

If the YouTube cookie file is missing, the job should fail fast with:

```text
Setup belum lengkap: file cookie YouTube belum tersedia di assets/cookies/youtube.txt. Tambahkan file tersebut lalu jalankan ulang job.
```

If upload credentials are missing, the dashboard should show:

```text
Kredensial upload belum lengkap. Video tetap bisa dibuat dan direview, tetapi belum bisa diupload.
```

### 8. Credential Setup Later

Placeholder checklist for later:

- Add YouTube cookie file
- Add GCP JSON
- Configure YouTube OAuth
- Configure TikTok credentials
- Enable upload flags
- Test upload approval
- Test YouTube upload
- Test TikTok upload

Do not fill real credentials in this guide.

### 9. Troubleshooting

- Docker service unhealthy
  - Run `docker compose ps` and `docker compose logs --tail 100 <service-name>`.
  - Restart the stack if a dependency is not healthy.

- Dashboard cannot reach engine
  - Confirm `http://localhost:8080/health` is OK.
  - Confirm the dashboard container is running.
  - Confirm `ENGINE_API_BASE_URL` points to the engine service in Docker.

- Job stuck
  - Check the job detail page and realtime events.
  - Confirm the worker container is healthy.
  - Check whether the job is waiting for setup or external input.

- `setup_required` error
  - This usually means the YouTube cookie file is missing.
  - Add the file and requeue the job.

- Duplicate job conflict
  - Same `channel_id` and `publish_at` already exists.
  - Use a different schedule or check `Antrian`.

- Missing output file
  - The preview page should show a friendly “not ready” message.
  - Confirm the render/output step completed before retrying preview.

- Upload blocked
  - This is expected until upload credentials and approval are in place.
  - Confirm the approval gate is completed before trying to upload.

### 10. Final MVP Acceptance Criteria

The MVP is ready when all of these are true:

- `docker compose up -d --build` succeeds from `D:\Boys\Ai\ai-youtube-dashboard`.
- `http://localhost:3001` opens.
- `http://localhost:8080/health` returns OK.
- PostgreSQL and Redis are healthy.
- Scheduler, worker, and publisher are healthy.
- A job can be created from the dashboard and appears in the queue.
- The worker can process jobs and show realtime progress.
- Missing YouTube cookie setup fails fast with a friendly message.
- Missing upload credentials do not block job generation or review.
- Completed jobs can show preview metadata and stream video.
- Title variants and viral score appear in job detail.
- Upload requires approval.
- Duplicate job creation returns a friendly conflict instead of a generic server error.
- No real secrets are documented here.

## Local Stack Notes

- `youtube-dashboard-next` is the recommended MVP UI.
- `youtube-dashboard` is the legacy static fallback and only starts with `--profile legacy`.
- The stack includes PostgreSQL, Redis, engine API, scheduler, worker, publisher, and the dashboard.
