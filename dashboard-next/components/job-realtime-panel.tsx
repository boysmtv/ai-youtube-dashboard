"use client";

import { useEffect, useState } from "react";
import { engineBrowserUrl, getJobSummary } from "../lib/engine-api";
import type { JobSummaryPayload } from "../lib/engine-types";
import type { EngineSyncSettings } from "../lib/sync-settings";
import { formatStatus } from "../lib/localization";
import { StatusBadge } from "./status-badge";

function eventTone(level?: string) {
  const normalized = (level || "").toLowerCase();
  if (normalized === "error" || normalized === "failed") {
    return "bg-error-50 text-error-700";
  }
  if (normalized === "warn" || normalized === "warning") {
    return "bg-warning-50 text-warning-700";
  }
  return "bg-success-50 text-success-700";
}

export function JobRealtimePanel({ initial, syncSettings }: Readonly<{ initial: JobSummaryPayload; syncSettings: EngineSyncSettings }>) {
  const [payload, setPayload] = useState(initial);
  const [status, setStatus] = useState(syncSettings.websocketEnabled ? "polling" : "polling");

  useEffect(() => {
    let closed = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    async function poll() {
      try {
        const next = await getJobSummary(initial.job.id, syncSettings.stateView);
        if (!closed) {
          setPayload(next);
          setStatus("polling");
        }
      } catch {
        if (!closed) {
          setStatus("error");
        }
      }
    }

    poll();
    timer = setInterval(poll, syncSettings.pollingIntervalMs);
    return () => {
      closed = true;
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [initial.job.id, syncSettings.pollingIntervalMs, syncSettings.stateView]);

  const recentEvents = payload.recent_events.slice(0, 6);
  const previewLink = payload.preview.preview_url ? `${engineBrowserUrl(payload.preview.preview_url)}` : null;

  return (
    <section className="ta-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="ta-label text-brand-600">Aktivitas produksi</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Status video #{payload.job.id}</h3>
          <p className="mt-2 text-sm text-gray-500">Panel ini memperbarui status ringkas, progress, dan event terbaru secara otomatis.</p>
        </div>
        <span className={`ta-status ${status === "error" ? "bg-warning-50 text-warning-700" : "bg-success-50 text-success-700"}`}>{status === "error" ? "Gangguan" : "Memantau"}</span>
      </div>

      <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="ta-label">Tahap saat ini</p>
            <strong className="mt-2 block text-lg text-gray-900">{formatStatus(payload.current_stage || payload.job.current_stage || payload.job.status)}</strong>
          </div>
          <div className="text-right">
            <p className="ta-label">Progres</p>
            <strong className="mt-2 block text-lg text-gray-900">{Number(payload.progress_percent ?? payload.job.progress_percent ?? 0).toFixed(0)}%</strong>
          </div>
        </div>
        <div className="mt-3 h-3 rounded-full bg-white">
          <div className="h-3 rounded-full bg-brand-500 transition-all" style={{ width: `${Math.max(0, Math.min(100, Number(payload.progress_percent ?? payload.job.progress_percent ?? 0)))}%` }} />
        </div>
        {payload.last_error || payload.job.last_error ? (
          <p className="mt-3 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700">{payload.last_error || payload.job.last_error}</p>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label">Status produksi</p>
          <div className="mt-2">
            <StatusBadge status={payload.job.status} />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label">Percobaan</p>
          <strong className="mt-2 block text-2xl text-gray-900">{payload.attempt_count}</strong>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label">File hasil</p>
          <strong className="mt-2 block text-2xl text-gray-900">{payload.artifact_count}</strong>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label">Upload</p>
          <strong className="mt-2 block text-2xl text-gray-900">{payload.upload_count}</strong>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label">Preview status</p>
          <div className="mt-3 space-y-2 text-sm text-gray-700">
          <p>{payload.preview.message || (payload.preview.available ? "Video siap ditonton" : "Preview belum tersedia")}</p>
            <p className="text-xs text-gray-500">Status sistem: {payload.system_compliance_label || (payload.review_summary?.system_compliance_label ?? "Belum siap")}</p>
            <p className="text-xs text-gray-500">Pembaruan terakhir: {payload.updated_at || payload.generated_at}</p>
            {previewLink ? (
              <a className="inline-flex font-semibold text-brand-600 hover:text-brand-700" href={previewLink} target="_blank" rel="noreferrer">
                Buka preview
              </a>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label">Aktivitas terbaru</p>
          <div className="mt-3 space-y-3">
            {recentEvents.length ? (
              recentEvents.map((item, index) => {
                const event = item as Record<string, unknown>;
                const createdAt = String(event.created_at || event.timestamp || "Belum tersedia");
                return (
                  <div key={`${String(event.timestamp || "event")}-${index}`} className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                      <span>{createdAt}</span>
                      <span>{formatStatus(String(event.level || event.event || "info"))}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-800">{String(event.message || event.event || "Update")}</p>
                    {event.details && typeof event.details === "object" ? (
                      <p className="mt-1 text-xs text-gray-500">Detail teknis tersedia di panel teknis bila diperlukan.</p>
                    ) : null}
                    <span className={`ta-status mt-3 inline-flex ${eventTone(String(event.level || event.event || ""))}`}>{formatStatus(String(event.level || event.event || "info"))}</span>
                  </div>
                );
              })
            ) : (
              <div className="ta-empty">Belum ada event terbaru.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
