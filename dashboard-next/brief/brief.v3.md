# Project Brief v3: Business-First Dashboard

## Goal

- Jadikan dashboard sebagai business cockpit, bukan engine console.
- Fokus utama: lihat, kontrol, dan publish konten dengan alur yang mudah dipahami.
- Detail engine boleh ada, tapi hanya di halaman detail.

## Role

- Dashboard menangani experience bisnis dan kontrol operator.
- Engine tetap menangani pipeline media.
- Dashboard tidak menyimpan media besar.

## Key Flow

- Source video masuk.
- Video diproses.
- Operator melihat stage, size, speed, dan progress.
- Item yang siap bisa dipush manual ke YouTube atau TikTok.
- Item gagal atau blocked harus terlihat jelas.

## Home View

- Tampilkan hanya poin penting:
  - queue hari ini
  - ready to publish
  - published hari ini
  - blocked / failed
  - active speed
  - approval backlog

## Main Pages

- `/dashboard` untuk ringkasan bisnis.
- `/queue` untuk antrian dan progress.
- `/content/[id]` untuk detail end-to-end.
- `/publish` untuk push manual.
- `/channels` untuk setup target platform.
- `/analytics` untuk throughput dan fit score.
- `/health` untuk admin teknis.

## Detail Page Must Have

- source title dan source channel.
- current stage.
- progress per stage.
- original size dan output size.
- download speed.
- preview output.
- manual retry, requeue, retry upload.
- push manual ke YouTube.
- push manual ke TikTok.
- approval state.

## Metrics

- queue count.
- processing count.
- ready count.
- pushed count.
- failed count.
- download speed.
- render speed.
- file size delta.
- viral fit score.

## UI Rules

- Pakai bahasa bisnis.
- Jangan tampilkan teknis di home.
- Satu layar satu keputusan utama.
- Action berisiko harus konfirmasi dan audit.
- Publish real tetap terkunci sampai approval valid.

## Engine Contract Needed

- status job.
- timeline.
- artifacts.
- metrics.
- publish state.
- push youtube.
- push tiktok.
- analytics endpoints.

## Done When

- Operator bisa lihat apa yang sedang diproses.
- Operator bisa lihat seberapa jauh prosesnya.
- Operator bisa lihat ukuran source dan hasil.
- Operator bisa push manual saat ready.
- Dashboard terasa mudah dan bisnis-oriented.
