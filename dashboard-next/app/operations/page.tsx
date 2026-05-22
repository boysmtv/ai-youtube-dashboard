import { AppShell } from "../../components/app-shell";
import { ApprovalList } from "../../components/approval-list";
import { FlowBoard } from "../../components/flow-board";
import { JobTable } from "../../components/job-table";
import { MetricCard } from "../../components/metric-card";
import { hasDashboardRole, requireDashboardSession } from "../../lib/dashboard-auth";
import { getOverview, getRecentApprovals } from "../../lib/engine-api";

export default async function OperationsPage() {
  const session = requireDashboardSession("/operations");
  const [overview, approvals] = await Promise.all([getOverview(), getRecentApprovals(10)]);
  const canOperate = hasDashboardRole(session, "operator");
  const activeCount = ["searching", "downloaded", "transcribed", "planned", "voiceover", "rendered", "uploading"].reduce(
    (total, status) => total + (overview.job_counts[status] || 0),
    0,
  );

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-brand-600">Operations</p>
        <h2 className="mt-3 text-4xl font-bold leading-none text-gray-900">Production throughput and publish readiness.</h2>
        <p className="mt-4 max-w-3xl text-gray-500">Use this page to read the movement of the business: queue pressure, active work, ready items, and publishing output.</p>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Queued" value={overview.job_counts.queued || 0} />
        <MetricCard label="Active" value={activeCount} />
        <MetricCard label="Ready to publish" value={overview.job_counts.rendered || 0} tone={(overview.job_counts.rendered || 0) > 0 ? "warn" : "neutral"} />
        <MetricCard label="Published" value={overview.job_counts.uploaded || overview.job_counts.completed || 0} tone="good" />
      </section>

      <section className="mt-6">
        <FlowBoard overview={overview} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Current queue</h3>
          <JobTable jobs={overview.jobs.slice(0, 12)} canOperate={canOperate} />
        </div>
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Publish approvals and audit</h3>
          <ApprovalList approvals={approvals.items} />
        </div>
      </section>
    </AppShell>
  );
}
