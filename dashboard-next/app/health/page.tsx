import { AppShell } from "../../components/app-shell";
import { JsonCard } from "../../components/json-card";
import { MetricCard } from "../../components/metric-card";
import { ServiceHealthPanel } from "../../components/service-health-panel";
import { requireDashboardSession } from "../../lib/dashboard-auth";
import { getHealth, getOverview, getRuntimeHealth } from "../../lib/engine-api";

export default async function HealthPage() {
  requireDashboardSession("/health");
  const [health, overview, runtimeHealth] = await Promise.all([getHealth(), getOverview(), getRuntimeHealth()]);
  const freeGb = overview.storage.free_gb ?? 0;
  const diskTone = freeGb < overview.worker.min_free_disk_gb ? "warn" : "neutral";

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-brand-600">Health</p>
        <h2 className="mt-3 text-4xl font-bold leading-none text-gray-900">Engine and runtime health.</h2>
        <p className="mt-4 max-w-2xl text-gray-500">
          Health checks combine the FastAPI `/health` response with overview metrics from the same engine database.
        </p>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Engine" value={health.status} tone={health.status === "ok" ? "good" : "warn"} />
        <MetricCard label="Free Disk" value={`${freeGb} GB`} tone={diskTone} />
        <MetricCard label="Min Disk" value={`${overview.worker.min_free_disk_gb} GB`} />
        <MetricCard label="Stuck Jobs" value={runtimeHealth.counts.stuck_jobs} tone={runtimeHealth.counts.stuck_jobs ? "warn" : "good"} />
      </section>

      <section className="mt-6 grid gap-6">
        <ServiceHealthPanel health={health} overview={overview} runtimeHealth={runtimeHealth} />
        <JsonCard title="Recent Events" value={overview.recent_events} />
      </section>
    </AppShell>
  );
}
