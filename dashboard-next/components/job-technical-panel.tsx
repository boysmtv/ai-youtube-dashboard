"use client";

import Link from "next/link";
import { useState } from "react";
import type { JobTechnicalPayload } from "../lib/engine-types";

function JsonBlock({ label, value }: Readonly<{ label: string; value: unknown }>) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <p className="ta-label text-brand-600">{label}</p>
      <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-gray-900 p-4 text-xs leading-relaxed text-white">{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}

export function JobTechnicalPanel({
  jobId,
  stateView,
  technicalHref,
}: Readonly<{
  jobId: number;
  stateView: "default" | "redis";
  technicalHref: string;
}>) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [technical, setTechnical] = useState<JobTechnicalPayload | null>(null);

  const loadTechnical = async () => {
    if (technical || loading) {
      setOpen(true);
      return;
    }
    setOpen(true);
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/dashboard/jobs/${jobId}/technical${stateView === "redis" ? "?state_view=redis" : ""}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Technical payload failed: ${response.status}`);
      }
      setTechnical((await response.json()) as JobTechnicalPayload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load technical details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5" id="detail-teknis">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="ta-label text-brand-600">Detail Teknis</p>
          <h4 className="mt-2 text-lg font-semibold text-gray-900">Payload mentah, manifest, file, dan event</h4>
          <p className="mt-2 text-sm text-gray-500">Hanya untuk troubleshooting. Tidak diperlukan untuk workflow harian.</p>
        </div>
        <span className="ta-status bg-gray-100 text-gray-700">{technical ? "Tampil" : loading ? "Memuat..." : "Ditunda"}</span>
      </div>

      <div className="mt-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        <p>Detail teknis belum dimuat. Buka panel ini untuk menyalin payload lengkap saat diperlukan.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="ta-button" type="button" onClick={() => void loadTechnical()}>
            Muat Detail Teknis
          </button>
          <Link className="ta-button-muted" href={technicalHref}>
            Buka mode teknis
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <div className="h-72 rounded-2xl border border-dashed border-gray-200 bg-gray-50" />
          <div className="h-72 rounded-2xl border border-dashed border-gray-200 bg-gray-50" />
        </div>
      ) : null}

      {error ? <div className="mt-5 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">{error}</div> : null}

      {technical ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <JsonBlock label="Manifest" value={technical.manifest || {}} />
          <JsonBlock label="Approval status" value={technical.approval_status || {}} />
          <JsonBlock label="Job events" value={technical.job_events || []} />
          <JsonBlock label="Upload records" value={technical.uploads || []} />
          <JsonBlock label="Rekam jejak manifest" value={technical.parameters || {}} />
          <JsonBlock label="Raw review summary" value={technical.review_summary || {}} />
        </div>
      ) : null}
    </section>
  );
}
