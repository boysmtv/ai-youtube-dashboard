import { AppShell } from "../../components/app-shell";
import { JobCreateForm } from "../../components/job-create-form";
import { JobTable } from "../../components/job-table";
import { hasDashboardRole, requireDashboardSession } from "../../lib/dashboard-auth";
import { getJobs, getOverview, getRegistry } from "../../lib/engine-api";

export default async function JobsPage() {
  const session = requireDashboardSession("/jobs");
  const [payload, registry, overview] = await Promise.all([getJobs(100), getRegistry(), getOverview()]);
  const canOperate = hasDashboardRole(session, "operator");

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-brand-600">Production Queue</p>
        <h2 className="mt-3 text-4xl font-bold leading-none text-gray-900">Queue and production control.</h2>
        <p className="mt-4 text-gray-500">Use this page to add work, inspect queue state, and control what the engine processes next.</p>
      </header>
      <section className="mt-6">
        <JobCreateForm registry={registry} uploadGuard={overview.upload_guard} canOperate={canOperate} />
      </section>
      <section className="mt-6">
        <JobTable jobs={payload.items} canOperate={canOperate} />
      </section>
    </AppShell>
  );
}
