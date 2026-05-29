# Production Status

## Verdict

This stack is **infra-ready** and **low-storage ready**, but it is **not fully go-live ready for automatic publishing**.

## Status Labels

- `infra_ready`: yes
- `content_ready`: no
- `go_live_ready`: no

## Why

- `infra_ready` is yes because Docker Compose starts cleanly, the dashboard and engine are healthy, dashboard auth is enabled, and PostgreSQL is the only runtime database.
- `content_ready` is no because a real job still stops at rights and asset safety gates before publish.
- `go_live_ready` is no because the publish path must remain blocked until the source, voice-over, visual rights, and music rights checks pass.

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

Then re-run the production validation and publish flow.
