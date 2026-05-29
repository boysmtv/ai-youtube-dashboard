# Production Status

## Verdict

This stack is **infra-ready**, **content-ready**, and **low-storage ready**. Automatic publishing still stays operator-gated, so full unattended go-live remains disabled by design.

## Status Labels

- `infra_ready`: yes
- `content_ready`: yes
- `go_live_ready`: no

## Why

- `infra_ready` is yes because Docker Compose starts cleanly, the dashboard and engine are healthy, dashboard auth is enabled, and PostgreSQL is the only runtime database.
- `content_ready` is yes because job `30` now passes the rights gate with a local operator-approved source, legal voiceover, no background music, and production-safe asset policy.
- `go_live_ready` is no because publishing still requires operator approval and credentials.

## What Is Production Safe Today

- Local operator workflow
- Job creation and queueing
- Engine processing and review
- Auth-protected dashboard access
- Low-storage retention and cleanup
- Manual approval workflow

## What Is Not Yet Go-Live Safe

- Automatic publish of new content
- Any job that fails rights or asset provenance checks
- Any job that depends on unapproved source audio or unlicensed music

## Required Next Step For Go-Live

Create a job that passes the rights gate with:

- owned or licensed source footage
- approved voice-over source
- approved visual assets
- licensed music or no music
- clear asset provenance

Then re-run the production validation and publish flow. Job `30` is the current reference for a production-safe validation run.
