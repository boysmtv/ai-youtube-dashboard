# AI YouTube Control Plane Dashboard Brief

Dokumen ini berisi analisa, rekomendasi arsitektur, struktur fitur, tata letak dashboard, stack teknologi, API tambahan, data model, dan roadmap upgrade untuk project:

- **Engine:** `ai-youtube-langchain`
- **Dashboard:** `ai-youtube-dashboard`

Tujuan utama dokumen ini adalah menjadikan dashboard sebagai **operator control-plane modern** di atas engine AI existing, tanpa mengganti engine utama.

---

## 1. Ringkasan Project Saat Ini

### 1.1 Engine: `ai-youtube-langchain`

#### Teknologi Saat Ini

- Python
- FastAPI untuk API dashboard
- SQLite untuk:
  - job store
  - quota
  - uploads
  - artifacts
  - approval audit
- Docker / Docker Compose
- `yt-dlp`
- `ffmpeg`
- transcription
- AI processing
- voiceover
- render
- YouTube upload
- runtime log file
- WebSocket overview
- `AI_AGENT_CORE` workflow/checkpoint untuk pengembangan

#### Fitur Utama Engine

- Scheduler otomatis membuat job upload berdasarkan registry channel.
- Worker 24/7 memproses pipeline video:
  - source search/download
  - transcription
  - AI planning
  - voiceover
  - render
  - upload YouTube
- Job queue dengan:
  - status
  - retry
  - requeue
  - per-job run
  - retry upload only
- Registry channel dan GCP project bisa dibaca/diubah lewat API.
- Storage/runtime file memakai bind mount host:
  - `data`
  - `output`
  - `downloads`
  - `credentials`
  - `.ai-agent`
- Guard untuk real YouTube upload:
  - approval phrase
  - operator name
  - approval reason
  - session timeout
- Approval audit permanen di SQLite.

#### Endpoint Penting Saat Ini

```txt
/health
/api/overview
/api/registry
/api/jobs
/api/jobs/{job_id}
/api/jobs/{job_id}/logs
/api/jobs/{job_id}/approvals
/api/approvals/recent
/api/scheduler/run
/api/worker/run
/api/jobs/{job_id}/run
/api/jobs/{job_id}/requeue
/api/jobs/{job_id}/retry-upload
/ws/overview
```

---

### 1.2 Dashboard: `ai-youtube-dashboard`

#### Teknologi Saat Ini

- Static HTML/CSS/JavaScript
- Nginx Alpine Docker image
- Docker Compose stack bersama engine
- Fetch API untuk REST
- WebSocket untuk live overview
- LocalStorage untuk Engine API URL

#### Fitur Utama Dashboard Saat Ini

- Monitoring overview:
  - channel aktif
  - queued/active jobs
  - disk/storage
  - quota
  - recent attempts
  - runtime events
- Control plane:
  - create next jobs
  - run worker once
  - run selected job
  - requeue selected job
  - retry upload only
- Job table dengan filter:
  - status
  - channel
- Job detail:
  - summary
  - stage attempts
  - artifacts
  - uploads
  - runtime log
  - manifest viewer
  - transcript/plan file inspector
  - approval audit per job
- Registry editor:
  - load/save registry engine langsung dari dashboard
- Real upload control:
  - enable upload hanya aktif setelah approval phrase benar
  - operator name wajib
  - approval reason wajib
  - unlock session countdown
- Approval audit panel:
  - membaca audit permanen dari engine API
  - menampilkan recent live-upload approvals

---

## 2. Status Saat Ini

- Engine dan dashboard sudah sinkron.
- Semua berjalan di Docker.
- File besar/runtime tidak masuk image, tetapi di-host lewat volume.
- Test engine terakhir: **28 passed**.
- Stack Docker sudah rebuilt.
- Container healthy.

---

## 3. Analisa Singkat

Project sudah memiliki fondasi backend/engine yang cukup kuat. Pipeline utama sudah berjalan, job queue sudah ada, approval upload sudah aman, dan audit sudah disimpan permanen.

Namun, dashboard berbasis static HTML/JavaScript akan semakin sulit dikembangkan ketika fitur bertambah, terutama untuk kebutuhan seperti:

- job detail kompleks
- artifact explorer
- registry editor dengan diff dan versioning
- live log viewer
- approval center
- operator session
- role/permission
- analytics
- health monitoring
- workflow launcher
- version history

Kesimpulan utama:

> Engine tidak perlu diganti. Yang perlu dinaikkan adalah dashboard menjadi web app modern berbasis Next.js, TypeScript, dan Tailwind CSS.

---

## 4. Prinsip Desain Dashboard Baru

Dashboard baru harus mengikuti prinsip berikut:

1. **Engine tetap menjadi otak utama.**
2. **Dashboard hanya menjadi operator UI/control-plane.**
3. **Tidak mengganti pipeline existing.**
4. **Semua action penting harus memiliki audit trail.**
5. **Real YouTube upload wajib melewati approval guard.**
6. **File besar tetap berada di host volume.**
7. **Docker image harus tetap kecil.**
8. **UI harus realtime untuk job, worker, log, dan approval state.**
9. **Sistem harus tetap bisa berjalan 24/7 di Docker Compose.**
10. **Upgrade harus bertahap, bukan rewrite besar-besaran.**

---

## 5. Rekomendasi Stack Teknologi

### 5.1 Frontend

Rekomendasi utama:

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
```

#### Alasan

- Next.js cocok untuk dashboard kompleks.
- React memudahkan pembuatan komponen reusable.
- TypeScript membuat struktur data lebih aman.
- Tailwind CSS cepat untuk membangun UI modern.
- shadcn/ui cocok untuk dashboard production-grade.
- TanStack Table cocok untuk job table kompleks.
- Monaco Editor cocok untuk manifest, transcript, plan, dan JSON viewer.
- Recharts cocok untuk grafik quota, job success rate, dan analytics.

---

### 5.2 Backend Control Plane

Ada dua opsi backend:

#### Opsi A — Tetap FastAPI

Ini adalah opsi terbaik untuk kondisi saat ini.

FastAPI tetap menjadi API utama engine/control-plane.

Cocok karena:

- Engine sudah berbasis Python.
- Pipeline AI juga Python.
- Endpoint sudah tersedia.
- Tidak perlu memindahkan logic.
- Dashboard Next.js cukup consume REST dan WebSocket dari FastAPI.

#### Opsi B — Tambah NestJS

NestJS cocok jika project sudah menjadi sistem enterprise yang sangat besar.

NestJS cocok jika nanti butuh:

- multi-user serius
- RBAC kompleks
- API gateway besar
- integrasi banyak service
- auth/permission terstruktur
- admin backend terpisah

Namun, untuk kondisi sekarang, NestJS belum wajib.

Rekomendasi:

> Gunakan Next.js untuk dashboard, tetap gunakan FastAPI untuk engine/control-plane. Jangan tambah NestJS dulu kecuali dashboard sudah sangat besar.

---

### 5.3 Database

#### Saat Ini

```txt
SQLite
```

SQLite masih cukup untuk fase sekarang karena:

- sederhana
- ringan
- cocok untuk single-host Docker
- sudah terintegrasi dengan engine

#### Upgrade Production

```txt
Postgres
pgvector optional
```

Postgres cocok untuk:

- job metadata
- audit trail
- registry versions
- operator actions
- analytics
- upload history
- multi-user
- reporting

pgvector cocok jika nanti ingin menambahkan:

- memory search
- artifact semantic search
- transcript indexing
- brief indexing
- AI-agent memory browser

---

### 5.4 Redis

Redis belum wajib di awal, tetapi sangat berguna untuk production.

Redis cocok untuk:

- live status
- worker heartbeat
- distributed lock
- queue/cache layer
- temporary approval session
- runtime status
- event pub/sub

---

### 5.5 MinIO

MinIO belum wajib di awal, tetapi cocok untuk artifact mirror.

Gunakan MinIO untuk:

- rendered video preview
- thumbnail storage
- voiceover file
- transcript mirror
- plan file mirror
- upload snapshot
- artifact download URL

Catatan penting:

> Filesystem host tetap menjadi source-of-truth. MinIO hanya sebagai mirror/preview layer.

---

### 5.6 Testing

Rekomendasi testing:

```txt
Pytest untuk engine
Playwright untuk dashboard E2E
Vitest untuk frontend unit test
```

---

## 6. Arsitektur Baru yang Disarankan

### 6.1 Arsitektur MVP

```txt
ai-youtube-dashboard-next
        |
        | REST / WebSocket
        v
ai-youtube-langchain FastAPI Engine
        |
        | job queue / scheduler / worker / approval
        v
SQLite
        |
        | artifact path / metadata
        v
Host filesystem bind mount
```

---

### 6.2 Arsitektur Production

```txt
ai-youtube-dashboard-next
        |
        | REST / WebSocket / SSE
        v
FastAPI Control Plane / Engine
        |
        | metadata / audit / registry / jobs
        v
Postgres
        |
        | status / cache / heartbeat / lock
        v
Redis
        |
        | artifact mirror
        v
MinIO
        |
        | source-of-truth runtime files
        v
Host filesystem bind mount
```

---

### 6.3 Pola AI-Agent-Web yang Relevan

`ai-agent-web` cocok dijadikan contoh/reference karena polanya jelas:

- frontend tidak mengganti engine utama
- frontend menjadi operator UI
- ada monitoring
- ada approval
- ada versioning
- ada workflow launcher
- ada artifact explorer
- ada memory/browser/search

Pola relevan untuk project YouTube:

```txt
ai-youtube-langchain = engine utama
ai-youtube-dashboard-next = operator UI/control-plane
FastAPI = API engine/control-plane
Postgres = metadata/audit/analytics production
Redis = realtime/status/heartbeat/lock
MinIO = artifact mirror
Filesystem = source-of-truth untuk file besar
Docker Compose = runtime 24/7
```

---

## 7. Roadmap Upgrade Bertahap

### Phase 1 — Upgrade UI Tanpa Mengubah Engine

Tetap:

- FastAPI
- SQLite
- Docker Compose
- host bind mount
- endpoint existing

Tambah:

- Next.js dashboard
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Table
- Monaco Editor
- WebSocket overview integration

Target Phase 1:

- dashboard lebih rapi
- job detail lebih jelas
- approval lebih aman secara UI
- artifact viewer lebih nyaman
- registry editor lebih usable

---

### Phase 2 — Production Control Plane

Tambah:

- Postgres
- Redis
- login/operator session
- role sederhana
- registry versioning
- audit action lebih lengkap
- analytics
- worker heartbeat

Target Phase 2:

- dashboard siap untuk operasi jangka panjang
- audit lebih kuat
- job analytics tersedia
- operator action tercatat lengkap

---

### Phase 3 — Advanced AI-Agent-Web Style

Tambah:

- MinIO artifact mirror
- Brief studio
- Workflow launcher
- Version compare
- Version restore
- Memory browser/search
- Artifact comparison
- Multi-project registry
- Multi-engine support

Target Phase 3:

- dashboard menjadi AI operation platform penuh
- bisa mengelola banyak project/engine
- cocok untuk workflow automation skala besar

---

## 8. Layout Dashboard Baru

### 8.1 Struktur Global

```txt
┌────────────────────────────────────────────┐
│ Top Bar: Engine Status, Upload Lock, User  │
├──────────────┬─────────────────────────────┤
│ Sidebar      │ Main Content                │
│ Navigation   │                             │
└──────────────┴─────────────────────────────┘
```

---

### 8.2 Sidebar Navigation

```txt
Dashboard
Jobs
Live Worker
Channels / Registry
Approvals
Artifacts
Scheduler
Quota
Logs
System Health
Settings
```

---

### 8.3 Top Bar

Top bar harus selalu tampil dan berisi:

- Engine online/offline
- Worker status
- Upload approval status
- Unlock countdown
- Current operator
- Active jobs count
- Quota warning
- Storage warning

Contoh:

```txt
Engine: Online | Worker: Active | Upload: Locked | Jobs: 3 Active | Quota: 72% | Operator: Admin
```

---

## 9. Halaman Dashboard

### 9.1 `/dashboard` — Overview Monitoring

Fungsi:

- Melihat kondisi sistem secara cepat.
- Menjadi pusat monitoring utama.

Komponen utama:

- Engine health
- Worker status
- Queue summary
- Active channels
- Upload quota
- Disk/storage usage
- Running jobs
- Failed jobs
- Recent attempts
- Runtime events
- Recent uploads
- Approval lock status

Layout:

```txt
[Engine Health] [Worker] [Queue] [Quota] [Disk]

[Active Jobs Table]

[Recent Attempts] [Runtime Events]

[Recent Uploads] [Approval Audit]
```

CTA utama:

- Create next jobs
- Run worker once
- Open approval center
- View failed jobs
- Open live logs

---

### 9.2 `/jobs` — Job Queue Table

Fungsi:

- Pusat kontrol semua job.

Fitur:

- filter status
- filter channel
- filter tanggal
- search job ID/title/channel
- sort by created time/status
- pagination
- refresh manual
- auto-refresh optional

Kolom table:

```txt
Job ID
Channel
Title / Source
Status
Current Stage
Attempts
Created
Updated
Actions
```

Action per job:

- View detail
- Run
- Requeue
- Retry upload only
- Cancel, jika nanti didukung
- Mark reviewed, jika nanti didukung

Status badge:

```txt
queued
running
downloaded
transcribed
planned
voiced
rendered
uploaded
failed
waiting_approval
```

---

### 9.3 `/jobs/[jobId]` — Job Detail Page

Ini halaman paling penting.

Layout:

```txt
Header:
Job ID, Channel, Status, Stage, Created, Updated

Tabs:
Summary | Attempts | Logs | Artifacts | Transcript | Plan | Uploads | Approval Audit
```

#### Summary Tab

Tampilkan:

- job metadata
- channel
- source URL
- target title
- pipeline stage
- last error
- retry count
- upload status
- artifact count
- approval state

#### Attempts Tab

Tampilkan timeline stage:

```txt
source_search      success
download           success
transcription      success
ai_planning        success
voiceover          failed
render             pending
upload             pending
```

#### Logs Tab

Fitur:

- runtime log tail
- auto-refresh
- search log
- filter level: info/warn/error
- copy log
- download log

#### Artifacts Tab

Tampilkan file:

- downloaded video
- transcript
- plan
- voiceover
- rendered video
- thumbnail
- manifest
- upload response

Action:

- preview
- download
- copy path
- open manifest

#### Transcript Tab

Gunakan Monaco Editor:

- read-only
- text/JSON highlight
- copy button
- file path
- file size
- modified time

#### Plan Tab

Gunakan Monaco Editor:

- read-only
- Markdown/JSON highlight
- copy button
- plan metadata
- modified time

#### Uploads Tab

Tampilkan:

- YouTube video ID
- upload status
- upload attempt time
- error message
- retry upload only button
- approval requirement state

#### Approval Audit Tab

Tampilkan:

- operator
- reason
- approval phrase valid/invalid
- timestamp
- session expiry
- action result

---

### 9.4 `/registry` — Channel Registry Editor

Fungsi:

- Edit channel registry dan GCP project dari dashboard.

Layout:

```txt
[Channel List] [Channel Editor]
```

Channel list:

- channel ID
- channel name
- enabled/disabled
- target quota
- schedule mode
- last job
- last upload

Channel editor:

- channel name
- channel ID
- enabled/disabled
- YouTube credential profile
- GCP project
- source search config
- upload defaults
- schedule config
- AI planning profile
- voiceover profile
- render template

Fitur wajib:

- validate registry
- save registry
- preview diff before save
- backup previous registry
- restore previous version
- show validation errors

---

### 9.5 `/approvals` — Approval Center

Fungsi:

- Mengontrol real YouTube upload.

UI utama:

```txt
Upload Lock: LOCKED / UNLOCKED
Session expires in: 12:30
Operator name
Approval reason
Approval phrase
Enable real upload
```

Rules:

- Approval phrase wajib benar.
- Operator wajib.
- Reason wajib.
- Session timeout jelas.
- Semua action masuk audit.
- Tombol upload real harus disabled saat locked.
- Unlock harus terlihat jelas di top bar.

Approval center sebaiknya tersedia sebagai:

- global page
- modal cepat dari top bar
- panel di job detail

---

### 9.6 `/worker` — Live Worker Page

Fungsi:

- Monitoring worker 24/7.

Komponen:

- worker status
- current job
- current stage
- runtime events
- worker heartbeat
- queue depth
- last run
- last error
- run worker once button
- pause/resume worker jika nanti didukung

Live update:

- WebSocket `/ws/overview`
- optional SSE `/api/events`

---

### 9.7 `/artifacts` — Artifact Explorer

Fungsi:

- Browser file hasil pipeline.

Struktur:

```txt
Artifacts
  /channel
    /job_id
      transcript.json
      plan.md
      voiceover.mp3
      render.mp4
      manifest.json
```

Fitur:

- search by job/channel
- filter file type
- preview text/json
- preview video/audio
- download
- copy path
- show storage size
- open related job

Jika nanti menggunakan MinIO:

- filesystem tetap source-of-truth
- MinIO sebagai mirror untuk preview/download lebih rapi

---

### 9.8 `/scheduler` — Scheduler Control

Fungsi:

- Mengatur dan menjalankan scheduler.

Tampilkan:

- registered channels
- next job plan
- last scheduler run
- jobs created
- failed schedule reason
- manual create next jobs

Action:

- run scheduler now
- dry-run scheduler
- create job for selected channel
- disable/enable channel schedule

---

### 9.9 `/quota` — Quota Monitoring

Fungsi:

- Pantau quota YouTube/API.

Tampilkan:

- quota per GCP project
- quota per channel
- upload attempt
- failed upload
- remaining estimate
- warning threshold
- quota usage history

Tujuan:

- mencegah worker upload terlalu agresif
- memberi warning sebelum quota habis

---

### 9.10 `/logs` — Runtime Log Viewer

Fungsi:

- Melihat runtime logs secara global.

Fitur:

- live tail
- filter by job ID
- filter by channel
- filter by stage
- filter by level
- search keyword
- download log
- copy log excerpt

---

### 9.11 `/health` — System Health Page

Tampilkan:

- engine health
- dashboard health
- DB status
- storage mount status
- credentials mount status
- ffmpeg available
- yt-dlp available
- worker heartbeat
- Docker container info
- version/build commit
- API latency
- WebSocket status

---

### 9.12 `/settings` — Settings

Fungsi:

- Pengaturan dashboard/operator UI.

Tampilkan:

- Engine API URL
- WebSocket URL
- refresh interval
- theme
- local operator name
- notification preference
- advanced debug mode

---

## 10. Endpoint Tambahan yang Disarankan

Endpoint existing sudah bagus. Tambahkan endpoint berikut untuk dashboard production-grade.

### 10.1 System

```txt
GET  /api/system/health-detail
GET  /api/system/storage
GET  /api/system/worker-heartbeat
GET  /api/system/version
GET  /api/system/runtime
```

### 10.2 Jobs

```txt
GET  /api/jobs/{job_id}/artifacts
GET  /api/jobs/{job_id}/manifest
GET  /api/jobs/{job_id}/transcript
GET  /api/jobs/{job_id}/plan
GET  /api/jobs/{job_id}/timeline
POST /api/jobs/{job_id}/cancel
POST /api/jobs/{job_id}/mark-reviewed
```

### 10.3 Registry

```txt
GET  /api/registry/versions
POST /api/registry/validate
POST /api/registry/preview
POST /api/registry/restore/{version_id}
```

### 10.4 Artifacts

```txt
GET  /api/artifacts
GET  /api/artifacts/{artifact_id}
GET  /api/artifacts/{artifact_id}/download
GET  /api/artifacts/{artifact_id}/preview
```

### 10.5 Approval

```txt
POST /api/approval/unlock
POST /api/approval/lock
GET  /api/approval/session
GET  /api/approval/audit
```

### 10.6 Analytics

```txt
GET  /api/analytics/jobs
GET  /api/analytics/uploads
GET  /api/analytics/channels
GET  /api/analytics/quota
GET  /api/analytics/failures
```

### 10.7 Events

```txt
GET /api/events
GET /api/events/runtime
GET /api/events/jobs/{job_id}
```

---

## 11. Data Model yang Disarankan

Untuk sekarang SQLite masih cukup. Namun struktur sebaiknya disiapkan agar mudah migrasi ke Postgres.

### 11.1 Tables Utama

```txt
jobs
job_attempts
stage_attempts
artifacts
uploads
approval_audit
registry_versions
operator_sessions
runtime_events
quota_usage
channel_registry
operator_actions
```

---

### 11.2 `jobs`

Menyimpan metadata utama job.

Field contoh:

```txt
id
channel_id
status
current_stage
source_url
title
created_at
updated_at
last_error
retry_count
upload_status
```

---

### 11.3 `stage_attempts`

Menyimpan attempt per stage pipeline.

Field contoh:

```txt
id
job_id
stage_name
status
started_at
finished_at
error_message
attempt_number
```

---

### 11.4 `artifacts`

Menyimpan index file hasil pipeline.

Field contoh:

```txt
id
job_id
artifact_type
file_path
file_size
mime_type
created_at
checksum
```

---

### 11.5 `uploads`

Menyimpan status upload YouTube.

Field contoh:

```txt
id
job_id
youtube_video_id
status
attempt_number
started_at
finished_at
error_message
approval_id
```

---

### 11.6 `approval_audit`

Menyimpan audit approval permanen.

Field contoh:

```txt
id
job_id
operator_name
approval_reason
approval_phrase_valid
session_started_at
session_expires_at
action
result
created_at
```

---

### 11.7 `registry_versions`

Menyimpan backup registry.

Field contoh:

```txt
id
version_number
content_json
created_by
created_at
change_summary
```

---

### 11.8 `runtime_events`

Menyimpan event runtime penting.

Field contoh:

```txt
id
level
event_type
message
job_id
channel_id
created_at
metadata_json
```

---

### 11.9 `operator_actions`

Menyimpan audit semua tombol/action penting.

Field contoh:

```txt
id
operator_name
action
target_type
target_id
reason
result
created_at
metadata_json
```

---

## 12. UI Style Direction dengan Tailwind

### 12.1 Gaya Visual

Gunakan gaya dashboard modern:

- clean
- compact
- readable
- focus pada status dan action
- dark mode friendly
- responsive untuk laptop/desktop

### 12.2 Warna Status

```txt
Success: green
Warning: amber
Error: red
Info: blue
Locked/Danger Upload: red/orange
Neutral: slate/zinc
```

### 12.3 Komponen Utama

Gunakan komponen:

- summary card
- status badge
- data table
- tabs
- drawer detail
- modal approval
- toast notification
- command palette/search
- split panel logs/artifacts
- Monaco editor
- progress indicator
- timeline
- breadcrumb

---

## 13. Struktur Folder Next.js yang Disarankan

```txt
ai-youtube-dashboard-next/
  app/
    dashboard/
      page.tsx
    jobs/
      page.tsx
      [jobId]/
        page.tsx
    registry/
      page.tsx
    approvals/
      page.tsx
    artifacts/
      page.tsx
    scheduler/
      page.tsx
    quota/
      page.tsx
    logs/
      page.tsx
    health/
      page.tsx
    settings/
      page.tsx

  components/
    layout/
      sidebar.tsx
      topbar.tsx
      app-shell.tsx
    jobs/
      job-table.tsx
      job-status-badge.tsx
      job-actions.tsx
      job-timeline.tsx
      job-summary-card.tsx
    approvals/
      approval-form.tsx
      approval-status-card.tsx
      approval-audit-table.tsx
    artifacts/
      artifact-browser.tsx
      artifact-preview.tsx
      artifact-file-card.tsx
    registry/
      registry-editor.tsx
      registry-diff.tsx
      registry-version-list.tsx
    logs/
      live-log-viewer.tsx
      log-filter-bar.tsx
    health/
      health-card.tsx
      dependency-status.tsx
    ui/
      // shadcn/ui components

  lib/
    api-client.ts
    websocket.ts
    types.ts
    constants.ts
    format.ts
    validators.ts

  stores/
    overview-store.ts
    operator-session-store.ts
    job-filter-store.ts

  docker/
    Dockerfile
```

---

## 14. Docker Compose Service Plan

### 14.1 Phase 1

```txt
engine
dashboard-next
```

### 14.2 Phase 2

```txt
engine
dashboard-next
postgres
redis
```

### 14.3 Phase 3

```txt
engine
dashboard-next
postgres
redis
minio
nginx
```

---

## 15. MVP Dashboard Baru

MVP yang paling masuk akal untuk upgrade pertama:

1. Next.js app shell:
   - sidebar
   - topbar
   - layout dashboard
2. Overview dashboard.
3. Job table dengan filter.
4. Job detail page.
5. Runtime log viewer.
6. Approval center.
7. Registry editor.
8. Artifact viewer.
9. WebSocket live overview.
10. Docker Compose integration.

---

## 16. Prioritas Fitur

### 16.1 Prioritas Tinggi

1. Next.js dashboard.
2. Job detail page lengkap.
3. Approval center lebih rapi.
4. Artifact explorer.
5. Registry editor dengan diff/backup.
6. Live log viewer.
7. Worker status realtime.
8. Error recovery actions.

---

### 16.2 Prioritas Menengah

1. Login/operator session.
2. Role sederhana:
   - viewer
   - operator
   - admin
3. Version history registry.
4. Analytics upload/job success rate.
5. Search job/artifact.
6. Notification untuk failed job.
7. Quota warning.

---

### 16.3 Prioritas Lanjut

1. Postgres migration.
2. Redis heartbeat/status.
3. MinIO artifact mirror.
4. Memory browser.
5. Brief studio.
6. Workflow version compare.
7. Multi-engine support.
8. Multi-project dashboard.

---

## 17. Brief Final untuk Developer

### Nama Project

```txt
AI YouTube Control Plane
```

### Tujuan

Membangun dashboard modern untuk mengontrol, memantau, dan mengaudit engine `ai-youtube-langchain` tanpa mengganti engine utama. Dashboard berperan sebagai operator UI untuk scheduler, job queue, worker, artifact, registry, approval, dan upload control.

### Stack Rekomendasi

```txt
Frontend:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Table
- Monaco Editor
- Recharts

Backend:
- FastAPI existing engine/control-plane

Database:
- SQLite untuk sekarang
- Postgres untuk production upgrade

Realtime:
- WebSocket existing /ws/overview
- Optional SSE untuk logs/events

Queue/cache future:
- Redis

Artifact storage future:
- Host filesystem as source-of-truth
- MinIO as artifact mirror

Testing:
- Pytest untuk engine
- Playwright untuk dashboard E2E
```

### Halaman Utama

```txt
/dashboard       Overview monitoring
/jobs            Job queue table
/jobs/[id]       Job detail, logs, artifacts, approval
/registry        Channel registry editor
/approvals       Upload approval center
/artifacts       Artifact explorer
/scheduler       Scheduler control
/quota           Quota monitoring
/logs            Runtime log viewer
/health          System health
/settings        Engine/dashboard settings
```

### Keputusan Teknis Utama

```txt
Gunakan Next.js + TypeScript + Tailwind untuk dashboard.
FastAPI tetap menjadi backend engine/control-plane.
SQLite tetap digunakan dulu.
Postgres, Redis, dan MinIO ditambahkan bertahap.
NestJS tidak perlu digunakan pada fase awal.
```

---

## 18. Rekomendasi Keputusan Final

Paling bagus untuk kondisi project saat ini:

```txt
Next.js + TypeScript + Tailwind untuk dashboard
FastAPI tetap untuk engine/control-plane
SQLite tetap dulu
Docker Compose tetap
```

Upgrade bertahap:

```txt
SQLite → Postgres
runtime status → Redis
artifact preview → MinIO
static dashboard → full operator control-plane
```

Dengan strategi ini, project tetap stabil, tidak perlu rewrite besar-besaran, tetapi dashboard naik kelas menjadi production-grade.

---

## 19. Catatan Implementasi Penting

- Jangan memindahkan logic pipeline dari engine ke dashboard.
- Dashboard hanya memanggil API dan menampilkan status.
- Semua tombol berbahaya harus punya confirmation.
- Tombol real upload harus selalu terkait approval session.
- Registry save harus memiliki preview diff.
- Registry lama harus otomatis dibackup.
- Artifact viewer harus read-only.
- Log viewer harus aman dari file terlalu besar.
- UI harus tetap usable walaupun WebSocket disconnect.
- Gunakan polling fallback jika WebSocket mati.
- Jangan simpan credential sensitif di frontend.
- Jangan expose credential path secara berlebihan di UI.
- Semua operator action penting harus tercatat.

---

## 20. Definition of Done MVP

MVP dianggap selesai jika:

- Dashboard Next.js bisa jalan di Docker Compose.
- Dashboard bisa membaca `/api/overview`.
- Dashboard bisa menerima update `/ws/overview`.
- Job table bisa filter status dan channel.
- Job detail bisa membuka summary, logs, artifacts, uploads, dan approval audit.
- Registry bisa load dan save.
- Approval center bisa unlock real upload sesuai guard engine.
- Runtime log bisa dilihat dari UI.
- Worker bisa dijalankan manual dari UI.
- Job bisa run/requeue/retry-upload dari UI.
- Docker container dashboard dan engine healthy.

---

## 21. Kesimpulan

`ai-youtube-langchain` sudah cukup matang sebagai engine. Fokus terbaik sekarang adalah menaikkan `ai-youtube-dashboard` dari static dashboard menjadi **Next.js operator control-plane**.

Dashboard baru sebaiknya menjadi pusat operasi untuk:

- monitoring
- job control
- approval upload
- registry management
- artifact explorer
- live logs
- worker control
- quota monitoring
- system health
- audit trail

Strategi paling aman:

1. Upgrade UI ke Next.js.
2. Tetap pakai FastAPI dan SQLite.
3. Tambahkan Postgres, Redis, dan MinIO secara bertahap.
4. Hindari NestJS dulu kecuali kebutuhan backend web sudah sangat kompleks.
5. Jadikan dashboard sebagai control-plane, bukan pengganti engine.

