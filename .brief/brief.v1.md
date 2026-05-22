# Project Brief v1: Dashboard and Control Plane for YouTube Automation

## Goal

Build the Dockerized dashboard that controls and monitors `ai-youtube-langchain`.

## Product Role

- This repo is the control plane, not the media engine.
- It owns configuration, monitoring, scheduling controls, job visibility, and operator actions.
- It must stay lightweight and Docker-friendly.

## Core Responsibilities

- Manage channel settings.
- Manage upload schedules.
- Manage source preferences.
- Manage quota and retention settings.
- Manage credential mapping references.
- Show live job progress and history.
- Expose operator controls for pause, resume, retry, and cancel.

## System Shape

- Use Docker for the dashboard service and any supporting services.
- Use a database as the source of truth for jobs, settings, and status.
- Use websocket or server-sent events for live progress updates.
- Keep large media files outside the dashboard image.
- Keep dashboard state focused on metadata, not raw video payloads.

## Data Model

- Channel profile
- Schedule slot
- Job definition
- Job status timeline
- Retry metadata
- Upload result metadata
- Operational logs

## UI Requirements

- Show active job progress.
- Show current pipeline step.
- Show last error.
- Show queue depth.
- Show recent uploads.
- Show channel health and quota usage.
- Allow parameter edits without changing code.

## Storage Rules

- Do not store large media in the repo or image.
- Use host-mounted volumes for any file artifacts that must persist.
- Keep secrets outside the UI and outside git.
- Keep the dashboard image small.

## Immediate Next Work

- Define the shared API contract with the engine repo.
- Define the shared job/state schema.
- Define websocket message format for progress updates.
- Define the minimum screens for control, monitoring, and history.
- Define how the dashboard pushes parameters into persistent storage for the worker to consume.

