# Dashboard UX Audit

## Pages reviewed
- `/` dashboard home
- `/queue` and `/jobs`
- `/jobs/[id]`
- `/publish`
- `/channels`
- `/settings`
- `/analytics`
- `/artifacts`
- `/operations`
- `/quota`
- `/worker`
- `/scheduler`
- `/system`
- `/logs`
- `/diagnostics`
- `/registry`
- `/governance`
- `/health`

## Main issues found
- Main navigation exposed developer-oriented routes too early.
- The home page mixed business metrics with TikTok and low-level system signals.
- Queue and job detail pages used terms like `job`, `manifest`, `artifact`, `rights_assessment`, and `publish-state` without business translation.
- Review/upload flow showed upload approval and upload-control details too prominently for a business operator UI.
- Settings exposed token paths, client secret paths, and registry JSON before the safe forms.
- Channel pages exposed OAuth paths and readiness checks in the main view.

## Confusing labels
- `job` -> should read as `Video`
- `manifest` -> should read as `Detail Teknis`
- `artifact` -> should read as `File Video`
- `rights_assessment` -> should read as `Cek Keamanan Copyright`
- `production_allowed` -> should read as `Siap Production`
- `production_blockers` -> should read as `Alasan Belum Siap`
- `reused_content_risk` -> should read as `Risiko Konten Ulang`
- `source_mode` / `curated_only` -> should stay advanced
- `upload record` -> should read as `Riwayat Upload`
- `job_events` -> should read as `Riwayat Proses`
- `diagnostics` -> should read as `Diagnostik Teknis`
- `raw JSON` -> should read as `Detail Teknis`

## Business wording suggested
- `Job ID` -> `ID Video`
- `Render` -> `Proses Buat Video`
- `Preview artifact` -> `Preview Video`
- `Source acquisition` -> `Ambil Bahan Video`
- `Upload Private` -> `Upload Private Test`
- `AI disclosure` -> `Label Konten AI`
- `Operator review notes` -> `Catatan Review Operator`
- `Publish state` -> `Status Upload`
- `Logs` -> `Logs` only in advanced

## Notes
- TikTok is intentionally deferred and should remain outside the main business flow.
- Upload/private approval creation should stay out of the main operator view.
- Copyright and production rights gates must remain active.
