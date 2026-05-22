import type { HealthPayload, OverviewPayload, RuntimeHealthPayload } from "../lib/engine-types";

export function ServiceHealthPanel({
  health,
  overview,
  runtimeHealth,
}: Readonly<{
  health: HealthPayload;
  overview: OverviewPayload;
  runtimeHealth?: RuntimeHealthPayload | null;
}>) {
  const diskOk = (overview.storage.free_gb ?? 0) >= overview.worker.min_free_disk_gb;
  const dbOk = Object.keys(overview.job_counts || {}).length >= 0;
  const runtime = runtimeHealth || null;

  const items = [
    { label: "API", value: health.status, ok: health.status === "ok" },
    { label: "Database", value: dbOk ? "reachable" : "unknown", ok: dbOk },
    { label: "Disk", value: `${overview.storage.free_gb ?? 0} GB free`, ok: diskOk },
    { label: "Scheduler plan", value: `${overview.worker.publish_lead_time_hours}h lead`, ok: true },
    { label: "Worker capacity", value: `${overview.worker.max_active_jobs} active max`, ok: true },
    { label: "Upload guard", value: overview.upload_guard.enabled ? "enabled" : "disabled", ok: overview.upload_guard.enabled },
    { label: "Stuck jobs", value: runtime ? String(runtime.counts.stuck_jobs) : "n/a", ok: runtime ? runtime.counts.stuck_jobs === 0 : true },
    {
      label: "Recovery",
      value: runtime ? `${runtime.recovery.recovered_stuck_jobs} recovered` : "n/a",
      ok: runtime ? runtime.status === "ok" : true,
    },
  ];

  return (
    <div className="ta-panel p-5">
      <p className="ta-label text-brand-600">Service health</p>
      <h3 className="mt-2 text-lg font-semibold text-gray-900">24/7 readiness snapshot</h3>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="ta-label">{item.label}</p>
              <span className={`h-3 w-3 rounded-full ${item.ok ? "bg-success-500" : "bg-warning-500"}`} />
            </div>
            <strong className="mt-2 block text-gray-900">{item.value}</strong>
          </div>
        ))}
      </div>
      {runtime ? (
        <div className="mt-5 grid gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="ta-label">Runtime checks</p>
            <div className="mt-3 space-y-3">
              {runtime.checks.map((item) => (
                <div key={item.code} className="flex items-center justify-between gap-4 border-b border-gray-200 pb-3 last:border-b-0 last:pb-0">
                  <span className="text-sm text-gray-700">{item.code}</span>
                  <span className={`text-sm font-semibold ${item.ok ? "text-success-700" : "text-warning-700"}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="ta-label">Blocking jobs</p>
            <div className="mt-3 space-y-3">
              {runtime.blocking_jobs.length ? (
                runtime.blocking_jobs.map((item, index) => (
                  <div key={`${String(item.id || "job")}-${index}`} className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700">
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-gray-900">Job #{String(item.id || "?")}</strong>
                      <span className="ta-label">{String(item.status || "unknown")}</span>
                    </div>
                    <p className="mt-2">Channel: {String(item.channel_id || "n/a")}</p>
                    <p className="mt-1">Updated: {String(item.updated_at || "n/a")}</p>
                    {item.last_error ? <p className="mt-1 text-warning-700">{String(item.last_error)}</p> : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No stale active jobs are blocking the pipeline.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
      <p className="mt-4 text-sm text-gray-500">
        Docker container state is outside the browser-visible engine contract. Use this as app-level health until a host agent exposes container status.
      </p>
    </div>
  );
}
