import { AppShell } from "../../components/app-shell";
import { JsonCard } from "../../components/json-card";
import { MetricCard } from "../../components/metric-card";
import { requireDashboardSession } from "../../lib/dashboard-auth";
import { getOverview } from "../../lib/engine-api";

export default async function QuotaPage() {
  requireDashboardSession("/quota");
  const overview = await getOverview();
  const quotaRows = overview.quota || [];

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-brand-600">Quota</p>
        <h2 className="mt-3 text-4xl font-bold leading-none text-gray-900">GCP quota and workload pressure.</h2>
        <p className="mt-4 max-w-2xl text-gray-500">
          Quota data comes from the engine overview so dashboard decisions use the same registry state as automation.
        </p>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Projects" value={quotaRows.length} />
        <MetricCard label="Queued" value={overview.job_counts.queued || 0} />
        <MetricCard label="Channels" value={`${overview.channels.enabled}/${overview.channels.configured}`} tone="good" />
        <MetricCard label="Upload Guard" value={overview.upload_guard.enabled ? "on" : "off"} tone={overview.upload_guard.enabled ? "warn" : "neutral"} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <JsonCard title="Quota Summary" value={quotaRows} />
        <JsonCard title="Jobs By Channel" value={overview.jobs_by_channel} />
      </section>
    </AppShell>
  );
}
