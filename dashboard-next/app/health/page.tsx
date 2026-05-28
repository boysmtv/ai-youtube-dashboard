import { AppShell } from "../../components/app-shell";
import { JsonCard } from "../../components/json-card";
import { MetricCard } from "../../components/metric-card";
import { ServiceHealthPanel } from "../../components/service-health-panel";
import { requireDashboardSession } from "../../lib/dashboard-auth";
import { getHealth, getOverview } from "../../lib/engine-api";

export default async function HealthPage() {
  requireDashboardSession("/health");
  const [health, overview] = await Promise.all([getHealth(), getOverview()]);
  const freeGb = overview.storage.free_gb ?? 0;
  const diskTone = freeGb < overview.worker.min_free_disk_gb ? "warn" : "neutral";

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-brand-600">Advanced / Admin</p>
        <h2 data-testid="page-title" className="mt-3 text-4xl font-bold leading-none text-gray-900">
          Status sistem.
        </h2>
        <p className="mt-4 max-w-2xl text-gray-500">
          Halaman ini dipakai admin untuk melihat status sistem, bukan alur kerja harian operator.
        </p>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Sistem" value={health.status} tone={health.status === "ok" ? "good" : "warn"} />
        <MetricCard label="Ruang Bebas" value={`${freeGb} GB`} tone={diskTone} />
        <MetricCard label="Batas Aman" value={`${overview.worker.min_free_disk_gb} GB`} />
        <MetricCard label="Antrian Aktif" value={overview.job_counts.queued || 0} tone={(overview.job_counts.queued || 0) ? "warn" : "good"} />
      </section>

      <section className="mt-6 grid gap-6">
        <ServiceHealthPanel health={health} overview={overview} runtimeHealth={null} />
        <JsonCard title="Recent Events" value={overview.recent_events} />
      </section>
    </AppShell>
  );
}
