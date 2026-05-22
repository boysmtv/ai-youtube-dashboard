import { AppShell } from "../../components/app-shell";
import { ConfirmSubmitButton } from "../../components/confirm-submit-button";
import { JsonCard } from "../../components/json-card";
import { MetricCard } from "../../components/metric-card";
import { ServiceHealthPanel } from "../../components/service-health-panel";
import { hasDashboardRole, requireDashboardSession } from "../../lib/dashboard-auth";
import { getAdminBackups, getHealth, getOverview, getRegistry, getRuntimeHealth } from "../../lib/engine-api";
import { recoverRuntimeHealth } from "./actions";

export default async function SystemPage() {
  const session = requireDashboardSession("/system");
  const [health, overview, backups, runtimeHealth, registry] = await Promise.all([getHealth(), getOverview(), getAdminBackups(), getRuntimeHealth(), getRegistry()]);
  const canOperate = hasDashboardRole(session, "operator");

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-brand-600">System</p>
        <h2 className="mt-3 text-4xl font-bold leading-none text-gray-900">Worker, scheduler, storage, and quota control.</h2>
        <p className="mt-4 max-w-3xl text-gray-500">
          This layer is for runtime capacity and infrastructure policy rather than channel or content decisions.
        </p>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Engine" value={health.status} tone={health.status === "ok" ? "good" : "warn"} />
        <MetricCard label="Worker Max" value={overview.worker.max_active_jobs} />
        <MetricCard label="Lead Time" value={`${overview.worker.publish_lead_time_hours}h`} />
        <MetricCard label="Stuck Jobs" value={runtimeHealth.counts.stuck_jobs} tone={runtimeHealth.counts.stuck_jobs ? "warn" : "good"} />
        <MetricCard label="Retention Keep" value={registry.retention.keep_recent_job_dirs} />
      </section>

      <section className="mt-6 grid gap-6">
        <ServiceHealthPanel health={health} overview={overview} runtimeHealth={runtimeHealth} />
        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <section className="ta-panel p-5">
            <p className="ta-label text-brand-600">Runtime recovery</p>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">Recover stale pipeline jobs</h3>
            <p className="mt-3 text-sm text-gray-500">
              Use this when health reports stuck active jobs and you want the engine to requeue them for retry without shell access.
            </p>
            <form action={recoverRuntimeHealth} className="mt-5 space-y-4">
              <label className="block space-y-2">
                <span className="ta-label">Stuck minutes</span>
                <input defaultValue={runtimeHealth.stuck_threshold_minutes} min={1} name="stuck_minutes" type="number" />
              </label>
              <label className="block space-y-2">
                <span className="ta-label">Max retries</span>
                <input defaultValue={3} min={0} name="max_retries" type="number" />
              </label>
              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input className="ta-check" name="include_failed" type="checkbox" />
                Also requeue failed jobs under retry limit
              </label>
              <div className="flex flex-wrap gap-3">
                {canOperate ? (
                  <ConfirmSubmitButton
                    message="Recover stale jobs and requeue eligible work?"
                    pendingText="Recovering..."
                    tone="warning"
                  >
                    Recover Runtime
                  </ConfirmSubmitButton>
                ) : (
                  <span className="text-sm text-gray-500">Operator role required.</span>
                )}
              </div>
            </form>
          </section>
          <JsonCard title="Quota Summary" value={overview.quota} />
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <JsonCard title="Storage and Backup Live Paths" value={{ storage: overview.storage, backup_live: backups.live }} />
          <JsonCard title="Runtime Health Snapshot" value={runtimeHealth} />
          <JsonCard title="Retention Policy Snapshot" value={registry.retention} />
        </div>
      </section>
    </AppShell>
  );
}
