# Local Storage Audit

## Safe to keep local
- `dashboard-next` browser `localStorage` for tiny UI preferences only.
- Engine `config/` for registry and channel policy.
- Engine `credentials/` for mounted secrets.

## Should stay ephemeral
- `data/`
- `output/`
- `downloads/`
- `.ai-agent/`

## Build/runtime caches
- `dashboard-next/.next/`
- `dashboard-next/node_modules/`
- `dashboard-next/tsconfig.tsbuildinfo`

## Notes
- PostgreSQL is the production metadata store.
- Redis is queue/runtime sync, not long-term business storage.
- Production backups are disabled by default or kept to a very small retention window.
