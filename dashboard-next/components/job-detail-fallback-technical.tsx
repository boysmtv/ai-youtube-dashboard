"use client";

import { useState } from "react";

export function JobDetailFallbackTechnical({
  jobId,
  storageBackend,
  postgresRequired,
  sqliteSupported,
}: Readonly<{
  jobId: number;
  storageBackend: string;
  postgresRequired: boolean;
  sqliteSupported: boolean;
}>) {
  const [open, setOpen] = useState(false);

  return (
    <section className="ta-panel mt-5 p-5" id="detail-teknis">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="ta-label text-brand-600">Detail Teknis</p>
          <h4 className="mt-2 text-lg font-semibold text-gray-900">Payload mentah, manifest, file, dan event</h4>
          <p className="mt-2 text-sm text-gray-500">Fallback aman saat job detail belum tersedia dari engine.</p>
        </div>
        <span className="ta-status bg-gray-100 text-gray-700">{open ? "Tampil" : "Ditunda"}</span>
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        <p>Detail teknis belum dimuat. Buka panel ini untuk melihat manifest ringkas saat diperlukan.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="ta-button" type="button" onClick={() => setOpen((current) => !current)}>
            Muat Detail Teknis
          </button>
        </div>
      </div>

      {open ? (
        <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label text-brand-600">Manifest</p>
          <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-gray-900 p-4 text-xs leading-relaxed text-white">
            {JSON.stringify(
              {
                job_id: jobId,
                storage_backend: storageBackend,
                postgres_required: postgresRequired,
                sqlite_supported: sqliteSupported,
                note: "Job detail endpoint returned unavailable data.",
              },
              null,
              2,
            )}
          </pre>
        </div>
      ) : null}
    </section>
  );
}
